// @target illustrator
// @targetengine snake

Folder.current = new File($.fileName).parent;

var PHOTOSHOP_LAYER_PATH = new File("Photoshop Layer.jsx").fullName;

var snakeWindow = new Window("palette", "Extendsnake");
snakeWindow.onClose = function () {
  snakeWindow.text = "";
};

var ticks = 0;

var updateTicker = snakeWindow.add("statictext", undefined, "Ticks: " + ticks);
updateTicker.alignment = "fill";
var HeadingText = snakeWindow.add(
  "statictext",
  undefined,
  "Heading: undefined",
);
HeadingText.alignment = "fill";

snakeWindow.addEventListener("tick", function () {
  updateTicker.text = "Ticks: " + ++ticks;
  snakeWindow.update();
  snakeWindow.layout.layout(true);
});

snakeWindow.addEventListener("keydown", function (event) {
  HeadingText.text = "Heading: " + event.keyName;
});

var testButton = snakeWindow.add("button", undefined, "Start Game Loop");

testButton.onClick = function () {
  startGameLoop();
};

snakeWindow.show();

function btRunScript(scriptText) {
  var bt = new BridgeTalk();
  bt.target = "illustrator";
  bt.body = scriptText;
  bt.send();
}

function startGameLoop() {
  var bt = new BridgeTalk();
  bt.target = "photoshop";
  bt.body = "#include '" + PHOTOSHOP_LAYER_PATH + "'";
  bt.send();
}
