QuantumSplit.Game = function(){};

var socket;
var myID;
var ready = false;
var bullets;
var cursors;
var playerObject;
var mainPlayer;
var playerList;
var count = 0;
var myName;

//nobody can win until game starts. ie all players in the game
var gameStarted = false;
var gameOver = false;

//number of players currently in the game
var numPlayers = 0;

var ROOM_SIZE;

//player who killed the main player
var killer = -1;

//so that we can display the 'game over text' in the correct spot
var deadXPos;
var deadYPos;

//text stuff to tell player he died
var topText;
var bottomText;
//when the game is over everyone will be prompted to press enter to play again.
var newGameText;

var waitScreen;

var X_BOUND = 1280;
var Y_BOUND = 720;


document.addEventListener("contextmenu", function(e){
	e.preventDefault();
	
}, false);

//what each player will spawn as, including the current one
PlayerObject = function(identifier,game)
{
	this.input = {
		id:identifier,
		x:0,
		y:0,
		tx:0,
		ty:0,
		rot:0,
		health:10,
		fire:false,
		split:false,
		died:false,
        name:"DEFAULT_NAME"
	}
	this.prev = {
		id:identifier,
		x:0,
		y:0,
		tx:0,
		ty:0,
		rot:0,
		health:10,
		fire:false,
		split:false,
		died:false,
        name:"pDEFAULT_NAME"
	}

	//set game and player
	this.game = game;

	//set up bullet physics
	this.bullets = this.game.add.group();
	this.bullets.enableBody = true;
	this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
	this.bullets.createMultiple(50, 'bullet');
	this.bullets.setAll('checkWorldBounds', true);
	this.bullets.setAll('outOfBoundsKill', true);
	this.bullets.setAll('anchor.x', .5);
	this.bullets.setAll('anchor.y', .5);
	this.fireRate = 200;
	this.bulletSpeed = 400;
	this.nextFire = 0;

	//set up remnant physics
	this.remnants = game.add.group();
	this.remnants.enableBody = true;
	this.remnants.physicsBodyType = Phaser.Physics.ARCADE;
	this.remnants.createMultiple(50, 'remnant');
	this.remnants.setAll('checkWorldBounds', true);
	this.remnants.setAll('body.collideWorldBounds', true);
	this.remnants.setAll('anchor.x', .5);
	this.remnants.setAll('anchor.y', .5);
	this.splitRate = 1000;
	this.splitSpeed = 400;
	this.nextSplit = 0;
	
	this.alive = true;
	this.playerHealth = 10;
	this.maxHealth = 10;

	//spawn their playerObject at the default positions
	var x = 0;
	var y = 0;
	this.playerObject = game.add.sprite(x,y,'mainPlayer');
	this.playerObject.scale.setTo(0.1,0.1);
	this.playerObject.anchor.set(0.5);

	//set correct id
	this.playerObject.id = identifier;

	//health bar setup (for remote [enemy] players as well)
    var barConfig = {x: 200, y: 100, width:100, height:15, bar: { color:'#18a518'}};
    this.myHealthBar = new HealthBar(game, barConfig);

    //player name
	var nameStyle = {font:'Helvetica',fontSize:'20px', fill:'white', stroke:'black', strokeThickness:4};
	this.nameText = QuantumSplit.game.add.text(100,0,"",nameStyle);
    
	//set up player's playerObject physics
	game.physics.enable(this.playerObject, Phaser.Physics.ARCADE);
	this.playerObject.immovable = false;
	this.playerObject.body.collideWorldBounds = true;
	this.playerObject.body.bounce.setTo(1,1);
	this.playerObject.rotation = 0;
	this.speed = 5;

	//set up the rotation and movement physics
	game.physics.arcade.velocityFromRotation(this.playerObject.rotation, 0, this.playerObject.body.velocity);
}

PlayerObject.prototype.fire = function(target)
{
	if(!this.alive) return;
	if(this.game.time.now > this.nextFire && this.bullets.countDead() > 0)
	{
		this.nextFire = this.game.time.now + this.fireRate;
		var bullet = this.bullets.getFirstDead();
		bullet.reset(this.playerObject.x, this.playerObject.y);
		bullet.rotation = this.game.physics.arcade.moveToObject(bullet, target, 1000);
	}
}

PlayerObject.prototype.splitRemnant = function(data)
{
	if(!this.alive) return;
	if(this.game.time.now > this.nextSplit && this.remnants.countDead() > 0)
	{
		//this.nextFire = this.game.time.now + this.fireRate;
		this.nextSplit = this.game.time.now + this.splitRate;
		var remnant = this.remnants.getFirstDead();
		
		//I want my enemies remnants to appear transparent
		if (this.input.id != myID) {
			remnant.alpha = 0.3;
		}
		
		console.log('angle='+this.playerObject.angle);
		var x_component = -150*Math.cos(this.playerObject.angle*(Math.PI/180)+(Math.PI/2));
		var y_component = -150*Math.sin(this.playerObject.angle*(Math.PI/180)+(Math.PI/2));


		console.log('rotation='+data.rot);

		remnant.reset(this.playerObject.x+x_component, this.playerObject.y+y_component);
		remnant.rotation = this.game.physics.arcade.moveToObject(remnant, data.target, -350);
		console.log('remnant rotation='+remnant.rotation);
		console.log('remnant x='+data.target.x);
		console.log('remnant y='+data.target.y);
		
		remnant.body.bounce.set(1);
	}
}

PlayerObject.prototype.kill = function()
{
	this.alive = false;
	this.myHealthBar.kill();
	this.nameText.kill();

	this.playerObject.kill();
	this.remnants.forEach(function(c){c.kill();});
	delete playerList[this.input.id];
}

QuantumSplit.Game.prototype = 
{
    //the name from the last screen is passed here
    init: function(name)
    {
        console.log('my name is ' + name);
        myName = name;
    },

	preload:function() 
	{
		console.log('preload called');
		enemies = new Map();
		remnants = new Map();
		myRemnants = new Map();
		enemyRemnants = new Map();

		console.log('preload done');
	},

	create:function() 
	{
		//create grid
        //X_BOUND = QuantumSplit.game.width;
        //Y_BOUND = QuantumSplit.game.height;
        X_BOUND = 1920;
        Y_BOUND = 1080;

        console.log('x ' + X_BOUND + ' y ' + Y_BOUND);
        QuantumSplit.game.world.setBounds(0, 0, X_BOUND, Y_BOUND);
	    grid = QuantumSplit.game.add.sprite(0,0,'grid');
		var gridScaleX = X_BOUND/grid.width;
	    var gridScaleY = Y_BOUND/grid.height;
	    grid.scale.setTo(gridScaleX,gridScaleY);

	    waitScreen = QuantumSplit.game.add.sprite(QuantumSplit.game.camera.x, QuantumSplit.game.camera.y, 'waitingBackground');
	    var scaleX = QuantumSplit.game.camera.height/waitScreen.height;
		var scaleY = QuantumSplit.game.camera.width/waitScreen.width;
		waitScreen.scale.setTo(scaleX,scaleY);
		waitScreen.fixedToCamera = true;

		//clear out the player list
		playerList = {};

		//set up input keys
		cursors = QuantumSplit.game.input.keyboard.createCursorKeys();
		QuantumSplit.game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR]);
		QuantumSplit.game.stage.disableVisibilityChange = true;

		//set up socket.io
		socket = io();


        //stuff for the text that will tell the player he lost
        //it will follow him as he follows the player that killed him.

        var style = {font:'Ubuntu',fontSize:'30px', fontWeight:'bold', fill:'white', stroke:'black', strokeThickness:8};
        topText = QuantumSplit.game.add.text(100,0,"",style);
        bottomText = QuantumSplit.game.add.text(100,0,"",style);
        var style2 = {font:'Ubuntu',fontSize:'30px', fontWeight:'bold', fill:'red', stroke:'black', strokeThickness:8};
        newGameText = QuantumSplit.game.add.text(100,0,"",style2);



		//once we get the start command, from the server, instantiate the player
		socket.on('start', function(data)
		{
			//set up various player stuff
			myID   = data.id;
			console.log('my ID is ::: ' + myID);
            console.log('spawning in x :: ' +data.x + ' y : ' + data.y);
            ROOM_SIZE = data.roomSize;
            console.log('room size is :: ' + data.roomSize);

			mainPlayer = new PlayerObject(myID, QuantumSplit.game);

			mainPlayer.playerObject.x = data.x;
			mainPlayer.playerObject.y = data.y;

            //this is the input we are about to send to the server
            mainPlayer.input.x = data.x;
            mainPlayer.input.y = data.y;

            //give the mainPlayer their name
            console.log('giving the player ' + myName);
            mainPlayer.input.name = myName;

            //give the player bullets
			bullets = mainPlayer.bullets;
			mainPlayer.remnants.createMultiple(50, 'remnant');
			mainPlayer.remnants.setAll('checkWorldBounds', true);
			mainPlayer.remnants.setAll('body.collideWorldBounds', true);
			mainPlayer.remnants.setAll('anchor.x', .5);
			mainPlayer.remnants.setAll('anchor.y', .5);

			remnants = mainPlayer.remnants;

			mainPlayer.playerObject.bringToTop();

            //start the camera on the main player
            QuantumSplit.game.camera.follow(mainPlayer.playerObject);

			mainPlayer.myHealthBar.setPosition(mainPlayer.playerObject.x,mainPlayer.playerObject.y);

			//update this player's name and position
			mainPlayer.nameText.setText(mainPlayer.input.name);
			mainPlayer.nameText.x = mainPlayer.playerObject.x - (mainPlayer.nameText.width/2);
			mainPlayer.nameText.y = mainPlayer.playerObject.y-100 - (mainPlayer.nameText.height/2);
            
			playerList[myID] = mainPlayer;
			socket.emit('addPlayer',mainPlayer.input);
            numPlayers++;
		});

		//if a new player has joined, add them to our local game
		socket.on('addPlayer', function(data)
		{
			if(data.id != myID && data.health > 0) 
			{
				var enmy = new PlayerObject(data.id, QuantumSplit.game);
				console.log('adding player ::: ' + data.id + ' xps ' + data.x + ' yps '+ data.y);

                //add the new player to our player list
				playerList[data.id] = enmy;

                //position the enemy in the correct spot
				enmy.playerObject.x = data.x;
				enmy.playerObject.y = data.y;

                //give the enemy their name
                enmy.input.name = data.name;

                //fix their rotation
				enmy.playerObject.rotation = data.rot;

                //give them the correct icon
				if (count == 0) { 
					enmy.playerObject.loadTexture('enemyPlayer1'); 
					// enmy.remnants.createMultiple(50, 'enemyRemnant1'); 
					enmy.remnants.forEach(function(r){r.loadTexture('enemyRemnant1');});
				} 
				else if (count == 1) { 
					enmy.playerObject.loadTexture('enemyPlayer2'); 
					// enmy.remnants.createMultiple(50, 'enemyRemnant2');
					enmy.remnants.forEach(function(r){r.loadTexture('enemyRemnant2');});
				} 
				else if (count == 2) { 
					enmy.playerObject.loadTexture('enemyPlayer3'); 
					// enmy.remnants.createMultiple(50, 'enemyRemnant3');
					enmy.remnants.forEach(function(r){r.loadTexture('enemyRemnant3');});
				}

                //place them above the grid
				enmy.playerObject.bringToTop();

                //make their remnants different from the main players

    //             //the enemy cannot leave the grid
				// enmy.remnants.setAll('checkWorldBounds', true);
				// enmy.remnants.setAll('body.collideWorldBounds', true);

    //             //everything is relative to the center of the player
				// enmy.remnants.setAll('anchor.x', .5);
				// enmy.remnants.setAll('anchor.y', .5);

                //place their health in the correct spot
                enmy.myHealthBar.setPosition(enmy.playerObject.x,enmy.playerObject.y-75);

	            //update this player's name and position
				enmy.nameText.setText(enmy.input.name);
				enmy.nameText.x = enmy.playerObject.x - (enmy.nameText.width/2);
				enmy.nameText.y = enmy.playerObject.y-100-(enmy.nameText.height/2);

                numPlayers++;
                if (numPlayers == ROOM_SIZE) {
                    gameStarted = true;
                }
				count++;
			}
		});

		//if I was hit by another player
		socket.on('hitPlayer', function(data){
            //data.id //is the player who got hit.
            //data.shooterID is the player who is doing the shooting
			if(data.id == myID)
			{
                console.log('player ' + data.shooterID + 'hit ' + data.id);
                //the last player who shot me will be my killer
                console.log('my killer is' + data.shooterID);
                killer = playerList[data.shooterID];
				mainPlayer.playerHealth--;
			}
		});


		socket.on('playerChanged', function(s){
			if(playerList[s.id] && playerList[s.id].alive)
			{
				var po = playerList[s.id].playerObject;
				var p = playerList[s.id];
				
				po.x = s.x;
				po.y = s.y;
				po.rotation = s.rot;
				p.playerHealth = s.health;
				
				if(s.fire)
				{
					p.fire({x:s.tx, y:s.ty});
				}
				if(s.split)
				{
					console.log('socket split');
					p.splitRemnant({target:{x:s.x, y:s.y},rot:s.rot});
				}
				if(s.died)
				{
					p.kill();
				}
			}
		});

		socket.on('playerDied', function(data){
			if(data.id != myID && playerList[data.id])
			{
				playerList[data.id].kill();
                numPlayers--;
                if (gameStarted && numPlayers == 1) {
                    socket.emit('gameOver');
                    gameOver = true;
                }
			}
		});

        socket.on('gameOver', function() {
            gameOver = true;
        });


		socket.on('allPlayers', function(data)
		{
			console.log('adding all previous players');
			for (var i in data.allPlayers)
			{

				var e = data.allPlayers[i]; //e holds the data object
				console.log('enemy is ::: ' + e.id + ' xps ' + e.x + ' yps '+ e.y);
				console.log('rot :: ' + e.rot + ' health ' + e.health);
				
                //make a playerObject
				var enemyPlayer = new PlayerObject(e.id, QuantumSplit.game);

                //give the enemy the proper image
				if (count == 0) { 
					enemyPlayer.playerObject.loadTexture('enemyPlayer1'); 
					// enemyPlayer.remnants.createMultiple(50, 'enemyRemnant1');
					enemyPlayer.remnants.forEach(function(r){r.loadTexture('enemyRemnant1');});
				} 
				else if (count == 1) { 
					enemyPlayer.playerObject.loadTexture('enemyPlayer2'); 
					// enemyPlayer.remnants.createMultiple(50, 'enemyRemnant2');
					enemyPlayer.remnants.forEach(function(r){r.loadTexture('enemyRemnant2');});
				} 
				else if (count == 2) { 
					enemyPlayer.playerObject.loadTexture('enemyPlayer3'); 
					// enemyPlayer.remnants.createMultiple(50, 'enemyRemnant3');
					enemyPlayer.remnants.forEach(function(r){r.loadTexture('enemyRemnant3');});
				}

                //set the enemies position
				enemyPlayer.playerObject.x = e.x;
				enemyPlayer.playerObject.y = e.y;

                //set the enemies name
                enemyPlayer.input.name = e.name;

                //set enemies health
                console.log('enemies health is ' + e.health);
                enemyPlayer.playerHealth = e.health;
                enemyPlayer.myHealthBar.setPercent(e.Health*10);

                //set enemies rotation
                enemyPlayer.playerObject.rotation = e.rot;

                //place enemy on top of the grid
				enemyPlayer.playerObject.bringToTop();
                
                //enemies have differnt color remnants

    //             //enmies cant leave the grid space
				// enemyPlayer.remnants.setAll('checkWorldBounds', true);
				// enemyPlayer.remnants.setAll('body.collideWorldBounds', true);
                
    //             //enemies positions is updated from their center
				// enemyPlayer.remnants.setAll('anchor.x', .5);
				// enemyPlayer.remnants.setAll('anchor.y', .5);


                //fix enemies health bar
                enemyPlayer.myHealthBar.setPosition(enemyPlayer.playerObject.x,enemyPlayer.playerObject.y-75);


                //update this player's name and position
				enemyPlayer.nameText.setText(enemyPlayer.input.name);
				enemyPlayer.nameText.x = enemyPlayer.playerObject.x-(enemyPlayer.nameText.width/2);
				enemyPlayer.nameText.y = enemyPlayer.playerObject.y-100-(enemyPlayer.nameText.height/2);


				playerList[e.id] = enemyPlayer;
                numPlayers++;
                if (numPlayers == ROOM_SIZE) {
                    gameStarted = true;
                }

				count++;
			}
		});

	},


	update:function()
	{
		//don't start program until server has prepared
		if(!gameStarted) {waitScreen.bringToTop(); return;}

		waitScreen.visible = false;
		//****************************
		//UPDATE THIS PLAYER'S CHANGES

		//update pointer target location
		mainPlayer.input.tx = QuantumSplit.game.input.x + QuantumSplit.game.camera.x;
		mainPlayer.input.ty = QuantumSplit.game.input.y + QuantumSplit.game.camera.y;

		//check if firing, and fire
		if(QuantumSplit.game.input.activePointer.isDown) {
			mainPlayer.input.fire = true;
			changed = true;
			mainPlayer.fire({x:mainPlayer.input.tx, y:mainPlayer.input.ty});
		}
		else {
			mainPlayer.input.fire = false;
		}


		//rotate the player towards the pointer
		mainPlayer.playerObject.rotation = QuantumSplit.game.physics.arcade.angleToPointer(mainPlayer.playerObject)-1.5;

		//have the camera follow the player
        //or the player that killed him
        if (mainPlayer.alive == true) {
            QuantumSplit.game.camera.follow(mainPlayer.playerObject);
        }
        else {
            //you must have been killed by a remnant
            if (killer == -1) {
                topText.setText("You were killed by:");
                topText.position.x = deadXPos - 110;
                topText.position.y = deadYPos - 130;
                bottomText.setText("Remnant");
                bottomText.position.x = deadXPos -50;
                bottomText.position.y = deadYPos - 20;
            }
            else {
                QuantumSplit.game.camera.follow(killer.playerObject);
                //magic numbers to make text centered above player
                topText.position.x = killer.playerObject.x - 110;
                topText.position.y = killer.playerObject.y - 130;
                topText.setText("You were killed by:");

                //more magic numbers
                bottomText.setText("Player: " + killer.input.name);
                bottomText.position.x = killer.playerObject.x - 110;
                bottomText.position.y = killer.playerObject.y + 60;
            }
        }

		//check for key presses, and move accordingly

		//if the left is being pressed
		if (QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.A) && (mainPlayer.playerObject.x-mainPlayer.playerObject.width/2)>0)
		{
			mainPlayer.playerObject.x -= mainPlayer.speed;
		}
		//if right is being pressed
		else if (QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.D) && (mainPlayer.playerObject.x+mainPlayer.playerObject.width/2)<X_BOUND)
		{
			mainPlayer.playerObject.x += mainPlayer.speed;
		}

		//if up pressed
		if (QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.W) && (mainPlayer.playerObject.y-mainPlayer.playerObject.height/2)>0)
		{
			mainPlayer.playerObject.y -= mainPlayer.speed;
		}
		//if down pressed
		else if (QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.S) && (mainPlayer.playerObject.y+mainPlayer.playerObject.height/2)<Y_BOUND)
		{
			mainPlayer.playerObject.y += mainPlayer.speed;
		}
        
        //once the game ends press enter to player again
        if (gameOver) {
            if (killer == -1 && mainPlayer.alive == false) { //you were killed by remnant
                //promt the player to press enter to play again
                newGameText.setText('Press Enter to play again');
                newGameText.position.x = deadXPos - 120;
                newGameText.position.y = deadYPos + 100;
                
            }
            else if (mainPlayer.alive) { //you were not killed. You are the winner !!
                newGameText.setText('Press Enter to play again');
                newGameText.position.x = mainPlayer.playerObject.x - 130;
                newGameText.position.y = mainPlayer.playerObject.y + 60;
            }
            else {
                //promt the player to press enter to play again
                newGameText.setText('Press Enter to play again');
                newGameText.position.x = killer.playerObject.x - 120;
                newGameText.position.y = killer.playerObject.y + 100;
            }

            if (QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.ENTER)) {
                QuantumSplit.game.state.start('MainMenu');
            }
        }
		
		//check for changes in x, y, and rotation
		if(mainPlayer.playerObject.x != mainPlayer.prev.x)
		{
			mainPlayer.input.x = mainPlayer.playerObject.x;
			changed = true;
			mainPlayer.prev.x = mainPlayer.playerObject.x;
		}
		if(mainPlayer.playerObject.y != mainPlayer.prev.y)
		{
			mainPlayer.input.y = mainPlayer.playerObject.y;
			changed = true;
			mainPlayer.prev.y = mainPlayer.playerObject.y;
		}
		if(mainPlayer.playerObject.rotation != mainPlayer.prev.rot)
		{
			mainPlayer.input.rot = mainPlayer.playerObject.rotation;
			changed = true;
			mainPlayer.prev.rot = mainPlayer.playerObject.rotation;
		}

		//check if splitting timelines, and split
		if(QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && mainPlayer.playerHealth < mainPlayer.maxHealth)
		{
			mainPlayer.input.split = QuantumSplit.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
			changed = true;
			mainPlayer.splitRemnant({target:{x:mainPlayer.input.x, y:mainPlayer.input.y}, rot:mainPlayer.input.rot});
			mainPlayer.playerHealth=mainPlayer.maxHealth;
		}
		else
		{
			mainPlayer.input.split = false;
		}

		if(mainPlayer.playerHealth != mainPlayer.prev.health)
		{
			mainPlayer.input.health = mainPlayer.playerHealth;
			changed = true;
			mainPlayer.prev.health = mainPlayer.playerHealth;
		}


		//send any changes to other players
		if(changed)
		{
			socket.emit('playerChanged', mainPlayer.input);
			changed = false;
		}


		//*****************************
		//UPDATE OTHER PLAYERS' CHANGES IN SOCKET FUNCTION

		//my bullets colliding with other player objects
		for(var i in playerList)
		{
			if(!playerList[i]) continue;
			if (playerList[i].alive == false) continue;

			var buls = playerList[i].bullets;

			//remove any bullets that collide from other players
	        
	        for(var j in playerList)
	        {
	        	if(!playerList[j]) continue;
				if (playerList[j].alive == false) continue;
				if(i != j)
				{
					var targetPlayer = playerList[j];

					//check for bullet collisions
					QuantumSplit.game.physics.arcade.overlap(buls, playerList[j].playerObject, function(obj1,obj2){
						obj2.kill();
						if(myID == i && myID != j) //if I am the one who hit someone
						{
							//tell the server that player 'i' was hit by me
                            //id is the player who got hit
                            //shooterID is the player who is shooting
							socket.emit('hitPlayer',{id:j, shooterID:myID});
						}
					}, null, this);
				}
				
	        }
			
			//update all health bar positions (including my own)
			playerList[i].myHealthBar.setPosition(playerList[i].playerObject.x,playerList[i].playerObject.y-75);
            playerList[i].myHealthBar.setPercent(playerList[i].playerHealth*10);

			playerList[i].nameText.x = playerList[i].playerObject.x-(playerList[i].nameText.width/2);
			playerList[i].nameText.y = playerList[i].playerObject.y-100-(playerList[i].nameText.height/2);
		}

		//my remnant collisions
		var myRemnants = mainPlayer.remnants;
		QuantumSplit.game.physics.arcade.overlap(myRemnants, mainPlayer.playerObject, function(obj1,obj2){
			// mainPlayer.remnants.forEach(function(c){c.kill();});
			mainPlayer.playerHealth = -mainPlayer.maxHealth;
            killer = -1;
		}, null, this);



		//if(mainPlayer.playerHealth <= 0 && mainPlayer.alive)
		if(mainPlayer.playerHealth <= 0 && mainPlayer.alive)
		{
			//tell server to tell others that this player died
            mainPlayer.input.died = true;
			socket.emit('playerDied', mainPlayer.input);

			//kill this player locally
            //save the death postions to add the 'lose' text in the correct spot
            deadXPos = mainPlayer.playerObject.x;
            deadYPos = mainPlayer.playerObject.y;
			mainPlayer.kill();

            //if we want to make the grid/killer transparent to make it more
            //obvious that we died
            grid.alpha = 0.5;
            //killer.playerObject.alpha = .8;


            //if we want to use states to end the game
            //already implemented.
            //although currently, just following our killer
			//INSERT GAME OVER SCREEN HERE
            //this calls shutdown.
            //QuantumSplit.game.state.start('LoseState');
		}
	},

    shutdown : function() {
        console.log('shutdown called');
        //do some game clean up
        playerList = {};
        myId = -1;
        deadXPos = 0;
        deadYPos = 0;
        gaveOver = false;
        killer = -1;
        ready = false;
        count = 0;
        numPlayers = 0;
        gameStarted = false;
        gameOver = false;
        socket.emit('endGame');
        socket = null;
        //no client are ever disconnects
        //because they must keep getting updates to follow their killer
        //when the game is over each client must disconnect
    }

};
//asdfdsf
