var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');

const sleep = require("http");
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require('constants');

app.get("/robots.txt", (req, res) => {
	res.type("text/plain");
	res.send(
	  "User-agent: *\nAallow: /\nSitemap: https://yachoo.herokuapp.com/sitemap.xml\n"
	);
});

/* Prevent Sleep in Heroku Server */
setInterval(function () {
	sleep.get("http://yachoo.herokuapp.com");
}, 600000); // every 10 minutes

app.get('/',function(req, res){
 	res.sendFile(__dirname + '/client.html');
});

var count = 100;
var rooms = 30;

var djj = 0;

// [Ctrl + f] delete cheat
var isCheat = 0;

var visitors = new Array(rooms);
for (var i = 0; i <= rooms; i++) {
	visitors[i] = 0;
}

var fakechk = new Array(rooms);
for (var i = 0; i < rooms; i++) {
	fakechk[i] = 0;
}
var fakecount = 0;
var fakenum = 0;
var fakeusers = 4;
setInterval(function () {
	if ((rooms * 2) - 20 > djj) {
		if (fakeusers <= 2) {
			fakeusers = 3;
		} else if (fakeusers >= 7) {
			fakeusers = 6;
		} else {
			fakeusers += Math.floor(Math.random() * 3) - 1;
		}
		while (fakecount > fakeusers) {
			for (var i = 0; i < rooms; i++) {
				if (fakechk[i] && Math.floor(Math.random() * fakecount) == 0) {
					fakechk[i] = 0;
					fakecount--;
					visitors[i] = 0;
				}
			}
		}
		while (fakecount < fakeusers) {
			fakenum = Math.floor(Math.random() * rooms);
			if (fakechk[fakenum] == 0 && visitors[fakenum] == 0) {
				fakechk[fakenum] = 1;
				fakecount++;
				visitors[fakenum] = 2;
			}
		}
		io.emit('room list', rooms, visitors);
	}
}, 180000); // every 3 minutes

io.on('connection', function(socket) {
	var isJoin = 0;
	var leaveRoll = 3;
	var dices = [0, 0, 0, 0, 0];
	var score = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var turnchk = 0;
	var sunhoo;
	
	socket.join(isJoin);
	var name = "user" + count++;
	djj++;
	console.log(`(${djj})` + 'user connected:    ', name);
	io.to(socket.id).emit('change name',name);
	io.to(socket.id).emit('room list', rooms, visitors);
	io.to(isJoin).emit('receive message', `[server] join ${name}`);

	socket.on('disconnect', function(){
		djj--;
		console.log(`(${djj})` + 'user disconnected: ', name);
		if (isJoin) {
			visitors[isJoin - 1]--;
			io.emit('room list', rooms, visitors);
			io.to(isJoin).emit('receive message', `[room ${isJoin}] ${name}이(가) 게임을 떠났습니다. 게임이 종료됩니다.`);
			io.to(isJoin).emit('disconnected room user client');
			io.to(isJoin).emit('draw table', 0);
			io.to(isJoin).emit('receive message', `!@#$exit show!@#$`);
		}
	});

	socket.on('disconnected room user server', function(){
		score = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		turnchk = 1;
		sunhoo = 1;
	});

// delete cheat
	function chkVaildNum(num) {
		for(var i = 0; i < 5; i++) {
			if (1 > parseInt(num[i]) || 6 < parseInt(num[i])) {
				return false;
			}
		}
		return true;
	}

	socket.on('send message', function(name, text, ip){
		if (text.substring(0, 8) == "!diceset" || text.substring(0, 7) == "diceset"){
			if (text.length == 13 && text.substring(0, 8) == "!diceset" && chkVaildNum(text.substring(8, 13))) {
				console.log(name + " use cheat " + text + `  [${ip}]`);
				isCheat = 1;
				for(var i = 0; i < 5; i++) {
					dices[i] = parseInt(text[i + 8]);
				}
			}
		} else if (text == "!show connect users") {
			io.to(socket.id).emit('receive message', djj);
		}
		else {
			var msg = name + ' : ' + text;
			console.log(msg + `  [${ip}]`);
			io.to(isJoin).emit('receive message', msg);
		}
	});
/* delete cheat
	socket.on('send message', function(name,text){
		var msg = name + ' : ' + text;
		util.log(msg);
		io.to(isJoin).emit('receive message', msg);
	});
*/
	socket.on('join room', function(roomNumber) {
		if (isJoin) {
			socket.emit('receive message', `[system] You already joined room ${isJoin}`);
		}
		else if (visitors[roomNumber - 1] < 2) {
			visitors[roomNumber - 1]++;
			isJoin = roomNumber;
			console.log(name + " join room" + roomNumber);
			socket.leave(0);
			socket.join(isJoin);
			socket.emit('receive message', `[system] room ${isJoin}에 접속했습니다.`);
			io.to(isJoin).emit('receive message', `[room ${isJoin}] ${name}이(가) 참가했습니다.`);
			socket.emit('joined room', isJoin);
			if (visitors[roomNumber - 1] == 1) {
				socket.emit('receive message', `[room ${isJoin}] 다른 플레이어를 기다리는 중..`);
				socket.emit('receive message', `[room ${isJoin}] 플레이어가 2명이 되면 자동으로 게임이 시작됩니다.`);
				turnchk++;
				sunhoo = 1;
			}
			else if (visitors[roomNumber - 1] == 2) {
				io.to(isJoin).emit('draw table', 1);
				io.to(isJoin).emit('test cli', socket.id, 0, name);
				io.to(isJoin).emit('receive message', `[room ${isJoin}] 게임을 시작합니다.`);
				io.to(isJoin).emit('receive message', "!@#$exit hidden!@#$");
				sunhoo = 2;
			}
		}
		else {
			socket.emit('receive message', `[system] room ${roomNumber} is full`);
		}
		io.emit('room list', rooms, visitors);
	});

	socket.on('test serv', function(turn) {
		leaveRoll = 3;
		io.to(isJoin).emit('rolled dice', leaveRoll, score);
		if (parseInt(turn / 2) < 13)
			io.to(isJoin).emit('test cli', socket.id, turn, name);
		else {
			io.to(isJoin).emit('receive message', `[room ${isJoin}] !!!!!! game over !!!!!`);
			io.to(isJoin).emit('receive message', "!@#$exit show!@#$");
			io.to(isJoin).emit('game over');
		}
	});

	socket.on('check score', function() {
		io.to(isJoin).emit('receive message', `[room ${isJoin}] ${name}'s Total score : ${score[13]}`);
		console.log(`[room ${isJoin}] ${name}'s Total score : ${score[13]}`);
	});

	socket.on('append in room', function(target, content, option, target2, content2) {
		io.to(isJoin).emit('append me', target, content, option, target2, content2);
	});

	socket.on('highlight in room', function(target, basic) {
		io.to(isJoin).emit('highlight me', target, basic);
	});

	socket.on('css in room', function(elem, attr, value) {
		io.to(isJoin).emit('css me', elem, attr, value);
	});

	function calcScore() {
		// Aces ~ Sixes
		for (var i = 0; i < 6; i++) {
			tmp[i] = 0;
			for (var j = 0; j < 5; j++) {
				if (dices[j] == i + 1)
					tmp[i] += i + 1;
			}
		}
		//tmp[6]

		// Choice
		tmp[7] = 0;
		for (var i = 0; i < 5; i++) {
			tmp[7] += dices[i];
		}

		// 4 of a kind
		tmp[8] = 0;
		var fourcardchk = [0, 0, 0, 0, 0, 0];
		for (var i = 0; i < 5; i++) {
			fourcardchk[dices[i] - 1]++;
		}
		for (var i = 0; i < 6; i++) {
			if (fourcardchk[i] >= 4) {
				for (var j = 0; j < 5; j++) {
					tmp[8] += dices[j];
				}
			}
		}

		// Full House
		tmp[9] = 0;
		var fullhousechk = [0, 0, 0, 0, 0, 0, 0, 0];
		for (var i = 0; i < 5; i++) {
			fullhousechk[dices[i] - 1]++;
		}
		for (var i = 0; i < 6; i++) {
			if (fullhousechk[i] == 2)
				fullhousechk[6] = 1;
			if (fullhousechk[i] == 3)
				fullhousechk[7] = 1;
		}
		if (fullhousechk[6] == 1 && fullhousechk[7] == 1) {
			for (var i = 0; i < 5; i++)
				tmp[9] += dices[i];
		}

		// S. Straight
		tmp[10] = 0;
		var SSchk = [0, 0, 0, 0, 0, 0];
		for (var i = 0; i < 5; i++) {
			SSchk[dices[i] - 1]++;
		}
		if ((SSchk[0] > 0 && SSchk[1] > 0 && SSchk[2] > 0 && SSchk[3] > 0) ||
			(SSchk[1] > 0 && SSchk[2] > 0 && SSchk[3] > 0 && SSchk[4] > 0) ||
			(SSchk[2] > 0 && SSchk[3] > 0 && SSchk[4] > 0 && SSchk[5] > 0))
			tmp[10] = 15;

		// L. Straight
		tmp[11] = 0;
		var LSchk = [0, 0, 0, 0, 0, 0];
		for (var i = 0; i < 5; i++) {
			LSchk[dices[i] - 1]++;
		}
		if ((SSchk[0] > 0 && SSchk[1] > 0 && SSchk[2] > 0 && SSchk[3] > 0 && SSchk[4] > 0) ||
			(SSchk[1] > 0 && SSchk[2] > 0 && SSchk[3] > 0 && SSchk[4] > 0 && SSchk[5] > 0))
			tmp[11] = 30;

		// Yachoo
		tmp[12] = 0;
		if (dices[0] == dices[1] && dices[1] == dices[2] && dices[2] == dices[3] && dices[3] == dices[4])
			tmp[12] = 50;
	}
	socket.on('roll dice', function(keepDice) {
		// console.log(leaveRoll, turnchk, keepDice);
		if (turnchk % 2) {
			leaveRoll--;
			if (leaveRoll >= 0) {
				if (!isCheat) {
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
				}
				isCheat = 0;
				calcScore();
				io.to(isJoin).emit('rolled dice', leaveRoll);
				// console.log(tmp);
				io.to(isJoin).emit('score update', tmp, sunhoo);
				io.to(isJoin).emit('dice update', dices);
			}
		}
	});
/* delete cheat
	socket.on('roll dice', function(keepDice) {
		// console.log(leaveRoll, turnchk, keepDice);
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
				calcScore();
				io.to(isJoin).emit('rolled dice', leaveRoll);
				// console.log(tmp);
				io.to(isJoin).emit('score update', tmp, sunhoo);
				io.to(isJoin).emit('dice update', dices);
			}
		}
	});
*/
	socket.on('pick score', function(index, id) {
		score[index - 1] = tmp[index - 1];
		io.to(isJoin).emit('append me', `#${id}`, `<b>${score[index - 1]}</b>`);
		score[6] = 0;
		for (var i = 0; i < 6; i++) {
			score[6] += score[i];
		}
		score[13] = score[6];
		for(var i = 7; i < 13; i++) {
			score[13] += score[i];
		}
		if (score[6] >= 63) {
			score[13] += 35;
		}
		io.to(isJoin).emit('append me', `#bonus-${sunhoo}`, `<b>${score[6]}/63</b>`);
		io.to(isJoin).emit('append me', `#total-${sunhoo}`, `<b>${score[13]}</b>`);
		tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	});
	socket.on('client to room client', function() {
		io.to(isJoin).emit('server to room client');
	});
	socket.on('turn over', function() {
		turnchk++;
	});
});

const { PORT=3000, LOCAL_ADDRESS='0.0.0.0' } = process.env
http.listen(PORT, LOCAL_ADDRESS, () => {
  const address = http.address();
});
