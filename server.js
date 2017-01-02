var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get(  '/',function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(27272);
console.log("Server Started. " + 27272);

var io = require('socket.io')(serv,{});

var PLAYERS_PER_ROOM = 2;
var currentRoom;
var playersInRoom = [];

//a variable to keep track of which games have started
//it corresponds to a particular room
var gameStartedInRoom = [];


//spawn locations depend on map size (currently).
var WIDTH = 1920;
var HEIGHT = 1080;
var playerW = 90;
var playerH = 90;
//for spawn locations.
var topLeft        = [0+playerW, 0+playerH];
var topRight       = [WIDTH+playerW, 0+playerH];
var bottomLeft     = [0+playerW, HEIGHT+playerH];
var bottomRight    = [WIDTH+playerW, HEIGHT+playerH];
var spawnLocations = [topLeft, bottomRight, topRight, bottomLeft];

io.sockets.on('connection', function(socket)
{
	//if this is the very first room or the first player in a room
	if(!playersInRoom[currentRoom] || playersInRoom[currentRoom].size%PLAYERS_PER_ROOM==0
         || gameStartedInRoom[currentRoom] == true)
	{
		console.log('\n\nplayersInRoom.length='+playersInRoom.length);
		if(playersInRoom[currentRoom])
		console.log('playersInRoom[currentRoom].size='+playersInRoom[currentRoom].size);

		//create a new room
		currentRoom = Math.random();

		//create a new Player map
		playersInRoom[currentRoom] = new Map();
	}
	
	//join the current room
	socket.room = currentRoom;
	console.log('\nsocket.room='+socket.room);

	//make this player join the correct room
	socket.join(currentRoom.toString());


	socket.id = Math.random();
	console.log('user ' + socket.id + ' connected');

    //the player spawn point is determined by the order that he joins the room.
    //e.g p1 = TL, p2 = BR, p3=TR, p4=BL
    var numOfPlayersInRoom = playersInRoom[currentRoom].size;
    var xPos = spawnLocations[numOfPlayersInRoom][0];
    var yPos = spawnLocations[numOfPlayersInRoom][1];

	socket.emit('start', {id:socket.id, roomSize:PLAYERS_PER_ROOM, x:xPos, y:yPos});

	var playersArray = [];

	for (var data of playersInRoom[socket.room].values()){
        console.log('all players list ' +data.id);
        //we should not add players that are dead
        if (data.died == false) {
            playersArray.push(data);
        }
	}

	socket.emit('allPlayers', {allPlayers :playersArray});

	socket.on('addPlayer', function (data) { //data holds id , x pos, and y pos
		console.log('adding player ' + data.id + ' to server');
		playersInRoom[socket.room].set(data.id, data);
        if (playersInRoom[socket.room].size == PLAYERS_PER_ROOM) {
            gameStartedInRoom[socket.room] = true;
        }

		socket.broadcast.to(socket.room).emit('addPlayer', data);
		socket.emit('playerChanged', data);
	});

	socket.on('disconnect', function(){
		console.log('player ' + socket.id + ' disconnected');
		socket.broadcast.to(socket.room).emit('playerDied', {id:socket.id});
		playersInRoom[socket.room].delete(socket.id);
		console.log('player disconnect playersInRoom[currentRoom].size='+playersInRoom[currentRoom].size);
		
	});

	socket.on('playerChanged',function(data){
            
        //first update the server. data is the new data recieved
		var oldData = playersInRoom[socket.room].get(socket.id);

        //cant just do oldData = data
        oldData.x      = data.x;
        oldData.y      = data.y;
        oldData.tx     = data.tx;
        oldData.ty     = data.ty;
        oldData.rot    = data.rot;
        oldData.health = data.health;
        oldData.fire   = data.fire;
        oldData.split  = data.split;
        oldData.died   = data.died;
        oldData.name   = data.name;

        //send this update to all clients
		socket.broadcast.to(socket.room).emit('playerChanged', data);
	});

    //if a player dies we cannot disconnect him from 
    //the server. if we do he will no longer recive updates.
    //ie camera will not be able to follow the camera that killed him.

	socket.on('playerDied',function(data){
		socket.broadcast.to(socket.room).emit('playerDied', data);
	});	

    //game is over if you win. must get disconnected
    socket.on('endGame', function(){
        socket.disconnect();
    });

    socket.on('gameOver', function() {
		socket.broadcast.to(socket.room).emit('gameOver');
    });


	socket.on('hitPlayer',function(data){
		socket.broadcast.to(socket.room).emit('hitPlayer', data);
	});
});

