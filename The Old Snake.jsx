// @target illustrator
// @targetengine main

var FRAME_WIDTH = 12;
var FRAME_HEIGHT = 12;
var CELL_WIDTH = 16;
var CELL_HEIGHT = 16;
var BG_COLOR = [0.0, 0.0, 0.0, 1.0];
var SNAKE_COLOR = [1.0, 1.0, 1.0, 1.0];
var FRUIT_COLOR = [1.0, 0.0, 0.0, 1.0];

var headPositionX = Math.floor(FRAME_WIDTH / 2);
var headPositionY = Math.floor(FRAME_HEIGHT / 2);

var snakeLength = 1;

var snakeHeading;

var steps = 0;

(function () {
  var palette = new Window("palette");

  var frame = palette.add("group");
  var gridData = new Array(FRAME_WIDTH);
  for (var i = 0; i < gridData.length; i++) {
    var column = new Array(FRAME_HEIGHT);
    for (var j = 0; j < column.length; j++)
      column[j] = { state: "Empty", distanceFromHead: Infinity };
    gridData[i] = column;
  }

  createFruit();
  updateGridData(false);
  populateFrame();

  palette.addEventListener("keydown", function (event) {
    processKeyPress(event.keyName);
  });

  palette.show();

  function processKeyPress(keyName) {
    if (keyName === undefined) return;
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
    }
    step();
  }

  function step() {
    advanceHead();
    updateGridData(true);
    populateFrame();
    palette.layout.layout(true);
    palette.update();
  }

  function advanceHead() {
    switch (snakeHeading) {
      case "Up":
        headPositionY--;
        break;
      case "Down":
        headPositionY++;
        break;
      case "Left":
        headPositionX--;
        break;
      case "Right":
        headPositionX++;
        break;
    }
  }

  function updateGridData(advanceSnake) {
    for (var i = 0; i < gridData.length; i++)
      for (var j = 0; j < gridData[i].length; j++) {
        var frameDatum = gridData[i][j];
        if (headPositionX === i && headPositionY === j) {
          if (frameDatum.state === "Fruit") {
            snakeLength++;
            frameDatum.state = "Snake";
            frameDatum.distanceFromHead = 0;
            createFruit();
          } else if (frameDatum.state === "Snake") gameOver();
          frameDatum.state = "Snake";
          frameDatum.distanceFromHead = 0;
        } else if (fruitPositionX === i && fruitPositionY === j) {
          frameDatum.state = "Fruit";
        } else if (frameDatum.state === "Snake") {
          frameDatum.distanceFromHead++;
          if (frameDatum.distanceFromHead >= snakeLength)
            frameDatum.state = "Empty";
        }
      }
    if (headPositionX < 0 || headPositionY < 0) gameOver();
    if (headPositionX > FRAME_WIDTH || headPositionY > FRAME_HEIGHT) gameOver();
  }

  function createFruit() {
    do {
      fruitPositionX = Math.floor(Math.random() * FRAME_WIDTH);
      fruitPositionY = Math.floor(Math.random() * FRAME_WIDTH);
    } while (gridData[fruitPositionX][fruitPositionY].state === "Snake");
    gridData[fruitPositionX][fruitPositionY].state = "Fruit";
  }

  function populateFrame() {
    while (frame.children.length > 0) frame.remove(0);

    frame.orientation = "row";
    frame.margin = 16;
    frame.spacing = 0;
    for (var x = 0; x < FRAME_WIDTH; x++) {
      var columnGroup = frame.add("group");
      columnGroup.orientation = "column";
      columnGroup.spacing = 0;
      for (var y = 0; y < FRAME_HEIGHT; y++) {
        var cell = columnGroup.add("group");
        cell.preferredSize = [CELL_WIDTH, CELL_HEIGHT];
        cell.onDraw = colorCell;
        var gridDatum = gridData[x][y];
        switch (gridDatum.state) {
          case "Empty":
            cell.color = BG_COLOR;
            break;
          case "Snake":
            cell.color = SNAKE_COLOR;
            break;
          case "Fruit":
            cell.color = FRUIT_COLOR;
            break;
        }
      }
    }
  }

  function colorCell() {
    var graphics = this.graphics;

    var fillBrush = graphics.newBrush(
      graphics.BrushType.SOLID_COLOR,
      this.color,
      1
    );

    var squareSize = this.size.width;
    var x = (this.size.width - squareSize) / 2;
    var y = (this.size.height - squareSize) / 2;

    graphics.newPath();
    graphics.rectPath(x, y, squareSize, squareSize);

    graphics.fillPath(fillBrush);
  }

  function gameOver() {
    alert("Game Over!");
    palette.close();
  }
})();
