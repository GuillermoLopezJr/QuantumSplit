QuantumSplit.MainMenu = function(){};
 
QuantumSplit.MainMenu.prototype = {
  create: function() 
  {
	//show the space tile, repeated
	this.background = this.game.add.sprite(0, 0, 'titlescreen');
	var scaleX = this.game.height/this.background.height;
	var scaleY = this.game.width/this.background.width;
	console.log('this.game.height='+this.game.height+'\tthis.game.width='+this.game.width);
	console.log('this.background.height='+this.background.height+'\tthis.background.width='+this.background.width);
	this.background.scale.setTo(scaleX,scaleY);
	// this.background.height = this.game.height;
	// this.background.width = this.game.width;
	//create buttons
	this.instructionButton = this.game.add.button(this.game.world.centerX-388, 550, 'instruct', instructionPage, this, 2, 1, 0);
	this.startButton1 = this.game.add.button(this.game.world.centerX-388, 350, 'startimg', namePage, this, 2, 1, 0);
	this.instructionButton.scale.setTo(scaleX,scaleY);
	this.startButton1.scale.setTo(scaleX,scaleY);

    //this button is the one that shows up when start is pressed.
    //it is for the "enter name screen"
    this.startButton2 = this.game.add.button(this.game.world.centerX-213, 550, 'startimg', startGame, this, 2, 1, 0);
    this.startButton2.scale.setTo(scaleX,scaleY);
    this.startButton2.visible = false;

    //plugin for the text box
    this.game.add.plugin(Fabrique.Plugins.InputField);


	//button 1 is 560 pixels down of 1080 pixels = y pos = 0.51851851851851851851851851851852 of height
	var yButton1Scale = 560/1080;
	this.instructionButton.x = this.game.world.centerX-(this.instructionButton.width/2);
	this.instructionButton.y = (this.game.height*yButton1Scale)+(this.instructionButton.height/2);

	//320 pixels down on 1920/1080, 320/1080 = y position = 0.2962962962962962962962962962963 of height
	var yButton2Scale = 320/1080;
	this.startButton1.x = this.game.world.centerX-(this.startButton1.width/2);
	this.startButton1.y = (this.game.height*yButton2Scale)+(this.startButton1.height/2);

	var scaleStartButton2 = 560/1080;
	this.startButton2.x = this.game.world.centerX-(this.startButton2.width/2);
	this.startButton2.y = (this.game.height*scaleStartButton2)+(this.startButton2.height/2);

	function back () 
	{
		this.instructionButton.visible = true;
		this.startButton1.visible = true;
		this.returnButton.visible = false;
		this.inst.visible = false;
	}

	function instructionPage () 
	{
		this.instructionButton.visible = false;
		this.startButton1.visible = false;
		this.inst = this.game.add.sprite(0, 0, 'instrpage');
		this.inst.height = this.game.height;
		this.inst.width = this.game.width;
		this.returnButton = this.game.add.button(0, 0, 'return', back, this, 2, 1, 0);
		this.returnButton.scale.setTo(scaleX,scaleY);

	}


    function namePage() {
        this.instructionButton.visible = false;
        this.startButton1.visible = false;
        this.startButton2.visible = true;

        //used for the name input box
        var yBoxScale = 320/1080;
        var yStartScale = 560/1080;
        var boxXPos = 220;
        var boxYPos = this.game.height/2 - 100;

        this.nameBox = this.game.add.inputField(boxXPos, boxYPos,{
            font: '40px Arial',
            fill: '#212121',
            fontWeight: 'bold',
            width: 800,
            height: 20,
            max:12,
            padding: 8,
            borderWidth: 1,
            borderColor: '#000',
            borderRadius: 6,
            placeHolder: 'Enter your Name',
            //textAlign: 'center',
            //makes the cursor blink
            update: function() {this._inputField.update(); },
        });

        this.nameBox.width = scaleX*this.nameBox.width;
        this.nameBox.height = scaleX*this.nameBox.height;
        this.nameBox.x = this.game.world.centerX-(this.nameBox.width/2);
        this.nameBox.y = (this.game.height*yBoxScale)+(this.nameBox.height/2);
    }

    function startGame () 
    {
        var name = this.nameBox.value;

        //check for empty name
        if (name.trim() != '') {
            this.game.state.start('Game',true, false, name);
        
        }
        else {
            //make the place holder text appear again.
            //ideally want to make it red or something
            this.nameBox.resetText();
        }
    }
  },

  update: function() {}
};
