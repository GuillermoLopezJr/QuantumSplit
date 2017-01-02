var QuantumSplit = QuantumSplit || {};
 
var w = window.innerWidth;
var h = window.innerHeight;

//make it a 16-9 aspect ratio game
var gw = w;
var gh = w*(9/16);

QuantumSplit.game = new Phaser.Game(gw, gh, Phaser.CANVAS, '');
 
QuantumSplit.game.state.add('Boot', QuantumSplit.Boot);
QuantumSplit.game.state.add('Preload', QuantumSplit.Preload);
QuantumSplit.game.state.add('MainMenu', QuantumSplit.MainMenu);

//QuantumSplit.game.state.add('Game', QuantumSplit.Game);
QuantumSplit.game.state.add('Instructions', QuantumSplit.Game);

QuantumSplit.game.state.add('LoseState', QuantumSplit.LoseState);
QuantumSplit.game.state.add('WinState', QuantumSplit.WinState);
QuantumSplit.game.state.add('Game', QuantumSplit.Game);
 
QuantumSplit.game.state.start('Boot');
