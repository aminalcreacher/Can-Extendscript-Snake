// @target illustrator
// @targetengine main

var FRAME_WIDTH = 32;
var FRAME_HEIGHT = 32;
var CELL_WIDTH = 16;
var CELL_HEIGHT = 16;
var BG_COLOR = [0.0, 0.0, 0.0, 1.0];
var SNAKE_COLOR = [1.0, 0.0, 0.0, 1.0];

var headPositionX = Math.floor(FRAME_WIDTH / 2);
var headPositionY = Math.floor(FRAME_HEIGHT / 2);

(function () {
  var palette = new Window("palette");

  var frame = palette.add("group");

  populateFrame(palette);

  // var button = palette.add("button", undefined, "click me");
  // button.onClick = function () {
  //   alert("INCREDIBLE!!! the button was clicked.");
  // };

  palette.addEventListener("keydown", function (event) {
    processKeyEvent(event);
  });

  palette.show();
})();

function processKeyEvent(event) {
  var keyName = event.keyName;
  if (!snakeHeading) return (snakeHeading = keyName);
  switch (keyName) {
    case "Up":
      if (snakeHeading !== "Down") snakeHeading = "Up";
      break;
    case "Down":
      if (snakeHeading !== "Up") snakeHeading = "Down";
      break;
    case "Left":
      if (snakeHeading !== "Right") snakeHeading = "Left";
      break;
    case "Right":
      if (snakeHeading !== "Left") snakeHeading = "Right";
      break;
    case "Space":
      advance();
  }
}

function advance() {
  alert("advancing the snek " + snakeHeading);
}

function populateFrame(frame) {
  frame.orientation = "row";
  frame.margin = 16;
  frame.spacing = 0;
  var grid = [];
  for (var x = 0; x < FRAME_WIDTH; x++) {
    var columnGroup = frame.add("group", undefined);
    columnGroup.orientation = "column";
    columnGroup.spacing = 0;
    var column = [];
    for (var y = 0; y < FRAME_HEIGHT; y++) {
      var cell = columnGroup.add("group");
      cell.preferredSize = [CELL_WIDTH, CELL_HEIGHT];
      cell.onDraw = colorCell;
      cell.parity = (x + y) % 2 === 0;
      column.push(cell);
    }
    grid.push(column);
  }
}

function colorCell(color) {
  var graphics = this.graphics;
  var color = this.parity ? BG_COLOR : SNAKE_COLOR;

  var fillBrush = graphics.newBrush(graphics.BrushType.SOLID_COLOR, color, 1);

  var squareSize = this.size.width;
  var x = (this.size.width - squareSize) / 2;
  var y = (this.size.height - squareSize) / 2;

  graphics.newPath();
  graphics.rectPath(x, y, squareSize, squareSize);

  graphics.fillPath(fillBrush);
}

var snakeHeading;
