var QuantumSplit = QuantumSplit || {};
 
//loading the game assets
QuantumSplit.Preload = function(){};
 
QuantumSplit.Preload.prototype = {
  preload: function() {
   //show titlescreen in loading screen
   this.background = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'titlescreen1');
    this.background.anchor.setTo(0.5);
 
    this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preloadbar');
    this.preloadBar.anchor.setTo(0.5);
 
    this.load.setPreloadSprite(this.preloadBar);
 
	enemies = new Map();
	remnants = new Map();
	myRemnants = new Map();
	enemyRemnants = new Map();
   //load game assets
   this.load.image('titlescreen', './client/img/titlescreen2.png');
   this.load.image('bullet', './client/img/bullet.png');
   this.load.image('instruct', './client/img/instructions2.png');
   this.load.image('startimg', './client/img/start2.png');
   this.load.image('loseImg', './client/img/loseState.png');
   this.load.image('instrpage', './client/img/instrpage2.png');
   this.load.image('return', './client/img/return2.png');
   this.load.image('waitingBackground', './client/img/waitingBackground.png');
   this.load.image('mainPlayer', './client/img/player2.png');
   this.load.image('enemyPlayer1', './client/img/enemyPlayer1.png'); 
   this.load.image('bullet', './client/img/bullet.png'); 
   this.load.image('remnant', './client/img/playersplit2.png'); 
   this.load.image('enemyRemnant1', './client/img/enemyRemnant1.png'); 
   this.load.image('enemyRemnant2', './client/img/enemyRemnant2.png'); 
   this.load.image('enemyRemnant3', './client/img/enemyRemnant3.png'); 
   this.load.image('enemyPlayer2', './client/img/enemyPlayer2.png'); 
   this.load.image('enemyPlayer3', './client/img/enemyPlayer3.png'); 
   this.load.image('grid' , "./client/img/grid4.png");

  },
  create: function() {
   this.state.start('MainMenu');
  }
};
