var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = require('./game.js')

app.get('/',function(req, res){
 	res.sendFile(__dirname + '/client.html');
});

var count = 1;
var rooms = 5;
var visitors = new Array(rooms);
for (var i = 0; i <= rooms; i++) {
	visitors[i] = 0;
}

io.on('connection', function(socket) {
	var isJoin = 0;
	socket.join(isJoin);
	console.log('user connected: ', socket.id);
	var name = "user" + count++;
	io.to(socket.id).emit('change name',name);
	io.to(socket.id).emit('room list', rooms, visitors);

	socket.on('disconnect', function(){
		console.log('user disconnected: ', socket.id);
		if (isJoin) {
			visitors[isJoin - 1]--;
			io.emit('room list', rooms, visitors);
			io.to(isJoin).emit('receive message', `[room ${isJoin}] leave ${name} finish game`);
			io.to(isJoin).emit('draw table', 0);
		}
	});

	socket.on('send message', function(name,text){
		var msg = name + ' : ' + text;
		console.log(msg);
		io.to(isJoin).emit('receive message', msg);
	});

	socket.on('join room', function(roomNumber) {
		console.log(name + " ===== approach room " + roomNumber + " =====");
		if (isJoin) {
			socket.emit('receive message', `[system] You already joined room ${isJoin}`);
			console.log(name + " =====already joined room " + isJoin + " =====");
		}
		else if (visitors[roomNumber - 1] < 2) {
			visitors[roomNumber - 1]++;
			isJoin = roomNumber;
			console.log(name + " ===== accept join =====");
			socket.leave(0);
			socket.join(isJoin);
			socket.emit('receive message', `[system] You joined room ${isJoin}`);
			io.to(isJoin).emit('receive message', `[room ${isJoin}] join ${name}`);
			socket.emit('joined room', isJoin);
			if (visitors[roomNumber - 1] == 1) {
				socket.emit('receive message', `[room ${isJoin}] wait another player`);
			}
			else if (visitors[roomNumber - 1] == 2) {
				io.to(isJoin).emit('draw table', 1);
				io.to(isJoin).emit('receive message', `[room ${isJoin}] start game`);
			}
		}
		else {
			socket.emit('receive message', `[system] room ${roomNumber} is full`);
			console.log(name + " =====room " + roomNumber + " is full");
		}
		io.emit('room list', rooms, visitors);
	});
});

http.listen(3000, function(){
  	console.log('server on!');
});
