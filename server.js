var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');
var game = require('./game.js');

app.get('/',function(req, res){
 	res.sendFile(__dirname + '/client.html');
});

var count = 1;
var rooms = 25;
var visitors = new Array(rooms);
for (var i = 0; i <= rooms; i++) {
	visitors[i] = 0;
}

io.on('connection', function(socket) {
	var isJoin = 0;
	var leaveRoll = 3;
	var dices = [0, 0, 0, 0, 0];
	var score = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var turnchk = 0;

	socket.join(isJoin);
	util.log('user connected:    ', socket.id);
	var name = "user" + count++;
	io.to(socket.id).emit('change name',name);
	io.to(socket.id).emit('room list', rooms, visitors);

	socket.on('disconnect', function(){
		util.log('user disconnected: ', socket.id);
		if (isJoin) {
			visitors[isJoin - 1]--;
			io.emit('room list', rooms, visitors);
			io.to(isJoin).emit('receive message', `[room ${isJoin}] leave ${name} finish game`);
			io.to(isJoin).emit('draw table', 0);
		}
	});

	socket.on('send message', function(name,text){
		var msg = name + ' : ' + text;
		util.log(msg);
		io.to(isJoin).emit('receive message', msg);
	});

	socket.on('join room', function(roomNumber) {
		util.log(name + " ===== approach room " + roomNumber + " =====");
		if (isJoin) {
			socket.emit('receive message', `[system] You already joined room ${isJoin}`);
			util.log(name + " =====already joined room " + isJoin + " =====");
		}
		else if (visitors[roomNumber - 1] < 2) {
			visitors[roomNumber - 1]++;
			isJoin = roomNumber;
			util.log(name + " =====   accept join   =====");
			socket.leave(0);
			socket.join(isJoin);
			socket.emit('receive message', `[system] You joined room ${isJoin}`);
			io.to(isJoin).emit('receive message', `[room ${isJoin}] join ${name}`);
			socket.emit('joined room', isJoin);
			if (visitors[roomNumber - 1] == 1) {
				socket.emit('receive message', `[room ${isJoin}] wait another player`);
				turnchk = 1;
			}
			else if (visitors[roomNumber - 1] == 2) {
				io.to(isJoin).emit('draw table', 1);
				io.to(isJoin).emit('test cli', socket.id, 0, name);
				io.to(isJoin).emit('receive message', `[room ${isJoin}] start game`);
			}
		}
		else {
			socket.emit('receive message', `[system] room ${roomNumber} is full`);
			util.log(name + " ===== room " + roomNumber + " is full =====");
		}
		io.emit('room list', rooms, visitors);
	});

	socket.on('test serv', function(turn) {
		leaveRoll = 3;
		io.to(isJoin).emit('rolled dice', leaveRoll, score);
		io.to(isJoin).emit('test cli', socket.id, turn, name);
	});

	socket.on('append in room', function(target, content) {
		io.to(isJoin).emit('append me', target, content);
	});

	socket.on('highlight in room', function(target, basic) {
		io.to(isJoin).emit('highlight me', target, basic);
	});

	socket.on('css in room', function(elem, attr, value) {
		io.to(isJoin).emit('css me', elem, attr, value);
	});


	socket.on('roll dice', function(keepDice) {
		if (turnchk % 2) {
			leaveRoll--;
			if (leaveRoll >= 0) {
				if (leaveRoll == 2) {
					for (var i = 0; i < 5; i++) {
						dices[i] = Math.floor(Math.random() * 6) + 1;
					}
				}
				else {
					for (var i = 0; i < 5; i++) {
						if (keepDice[i] == 0)
							dices[i] = Math.floor(Math.random() * 6) + 1;
					}
				}
				io.to(isJoin).emit('rolled dice', leaveRoll, tmp);
				io.to(isJoin).emit('dice update', dices);
				// calc score ()
			}
		}
	});
	socket.on('client to room client', function() {
		io.to(isJoin).emit('server to room client');
	});
	socket.on('turn over', function() {
		turnchk++;
	});
});

http.listen(3000, function(){
  	util.log('server on!');
});
