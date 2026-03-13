// @target illustrator
// @targetengine snake

/*
 * - Global script constants -
 */

Folder.current = new File($.fileName).parent;
var PHOTOSHOP_CLOCK_PATH = new File("Photoshop Clock.jsx").fullName;

var CELL_WIDTH = 25;
var CELL_HEIGHT = 25;
var BOARD_WIDTH = 10;
var BOARD_HEIGHT = 10;

var WINDOW_COLOR = [0.32, 0.32, 0.32, 1];
var BG_COLOR = [0, 0, 0, 1];
var SNAKE_COLOR = [1, 0, 0, 1];
var FRUIT_COLOR = [0, 1, 0, 1];
var NONE_COLOR = [0, 0, 0, 0];

/*
 * - Build game window -
 */

var gameWindow = new Window("palette", "Extendsnake");
// A palette window remains in Illustrator's memory even after closing. We have to change
// its name upon close so it is not picked up by Window.find() during later executions of the script.
gameWindow.onClose = function () {
  gameWindow.text = "";
};

var headerGroup = gameWindow.add("group");
headerGroup.alignment = "fill";
headerGroup.orientation = "row";

var pauseButton = headerGroup.add("button", undefined, "⏸");
pauseButton.onClick = pauseGame;
pauseButton.size = [25, 25];

var scoreText = headerGroup.add("statictext", undefined, "Score: 0");
scoreText.alignment = ["fill", "fill"];
scoreText.justify = "right";

var gameBoard = gameWindow.add("group");
gameBoard.size = [CELL_WIDTH * BOARD_WIDTH, CELL_HEIGHT * BOARD_HEIGHT];
gameBoard.orientation = "stack";

var cellGrid = gameBoard.add("group");
cellGrid.bounds = [0, 0, gameBoard.size[0], gameBoard.size[1]];
cellGrid.orientation = "row";
cellGrid.spacing = 0;
colorElement(cellGrid, BG_COLOR);

var popup = gameBoard.add("group");
popup.orientation = "column";
popup.margins = [10, 10, 10, 10];
colorElement(popup, WINDOW_COLOR);
var popupMessage = popup.add("statictext");
var popupButton = popup.add("button");

/*
 * - Registering event listeners -
 */

// Key presses (game controls)
gameWindow.addEventListener("keydown", function (event) {
  try {
    processKeyPress(event.keyName);
  } catch (e) {
    alert(e);
  }
});

// Ticks (sent by clock subprocess running in PS)
gameWindow.addEventListener("tick", function () {
  try {
    onTick();
  } catch (e) {
    alert(e);
  }
});

/*
 * - Game State Logic -
 */

function updateGameState(newState) {
  gameState = newState;
}

function showPopup(messageText, buttonText, onClick) {
  popup.remove(popupMessage);
  popup.remove(popupButton);
  popupMessage = popup.add("statictext", undefined, messageText, {
    multiline: messageText.indexOf("\n") !== -1,
  });
  popupMessage.justify = "center";
  popupButton = popup.add("button", undefined, buttonText);
  popupButton.onClick = onClick;

  popup.visible = true;

  gameWindow.layout.layout(true);
}

function hidePopup() {
  popup.visible = false;
}

function titleScreen() {
  updateGameState("Title Screen");
  showPopup("It's SNAKE TIME babey!!!", "Start Game", waitForInput);
}

function waitForInput() {
  updateGameState("Waiting For Input");
  hidePopup();
}

function startGame() {
  updateGameState("Running");
  startGameLoop();
}

function pauseGame() {
  if (gameState === "Game Over" || gameState === "Victory") return;
  if (gameState === "Paused") return resumeGame();
  updateGameState("Paused");
  showPopup("Paused\n(The snake is sleemping)", "Resume", resumeGame);
  haltGameLoop();
}

function resumeGame() {
  updateGameState("Running");
  hidePopup();
  startGameLoop();
}

function gameOver() {
  updateGameState("Game Over");
  showPopup(
    "The snake is dead. GAME OVER\nScore: " + snakeLength,
    "Play again",
    resetGame,
  );
  haltGameLoop();
}

function victory() {
  updateGameState("Victory");
  showPopup(
    "GREAT SUCCESS!!!\nThe snake has eaten all the food and become the largest snake in the world, and therefore the President of Snakes.",
    "Play again",
    resetGame,
  );
  haltGameLoop();
}

/*
 * - Gameplay Logic -
 */

// Variables for game logic
var ticks = 0;
var heading = undefined;
var nextHeading = undefined;
var snakeLength = 1;
var headX = undefined;
var headY = undefined;
var cells = [];
var snakeCells = [];

function resetGame() {
  heading = undefined;
  nextHeading = undefined;
  snakeLength = 1;
  clearSnake();
  placeSnakeHead();
  placeNewFruit();
  titleScreen();
}

function clearSnake() {
  while (snakeCells.length > 0) {
    var snakeCell = snakeCells.pop();
    snakeCell.hasSnake = false;
    snakeCell.heading = undefined;
    snakeCell.tailing = undefined;
    snakeCell.draw();
  }
}

function placeSnakeHead() {
  headX = Math.floor(Math.random() * BOARD_WIDTH);
  headY = Math.floor(Math.random() * BOARD_HEIGHT);
  var snakeHeadCell = cells[headX][headY];
  snakeHeadCell.hasSnake = true;
  snakeCells.push(snakeHeadCell);
  snakeHeadCell.draw();
}

function placeNewFruit() {
  var snakelessCells = [];
  for (var x = 0; x < BOARD_WIDTH; x++)
    for (var y = 0; y < BOARD_HEIGHT; y++) {
      var cell = cells[x][y];
      if (cell.hasFruit) {
        cell.hasFruit = false;
        cell.draw();
      }
      if (!cell.hasSnake) snakelessCells.push(cell);
    }
  var newFruitCell =
    snakelessCells[Math.floor(Math.random() * snakelessCells.length)];
  newFruitCell.hasFruit = true;
  newFruitCell.draw();
}

function onTick() {
  if (gameState === "Paused") return haltGameLoop();
  if (gameState === "Game Over") return haltGameLoop();
  if (gameState === "Victory") return haltGameLoop();
  if (nextHeading) heading = nextHeading;
  nextHeading = undefined;
  var needsNewFruit = false;
  var nextHeadLocation = getNextHeadLocation();
  advanceSnakeTail();
  if (checkForCollision(nextHeadLocation[0], nextHeadLocation[1]))
    return gameOver();
  if (checkForFruit(nextHeadLocation[0], nextHeadLocation[1])) {
    snakeLength++;
    needsNewFruit = true;
  }
  advanceSnakeHead(nextHeadLocation[0], nextHeadLocation[1]);
  if (snakeLength === BOARD_WIDTH * BOARD_HEIGHT) return victory();
  if (needsNewFruit) placeNewFruit();
  updateScoreboard();
  gameWindow.layout.layout(true);
}

function getNextHeadLocation() {
  var nextX = headX;
  var nextY = headY;

  if (heading === "Left") nextX--;
  if (heading === "Up") nextY--;
  if (heading === "Right") nextX++;
  if (heading === "Down") nextY++;

  return [nextX, nextY];
}

function checkForCollision(x, y) {
  return (
    x < 0 ||
    y < 0 ||
    x >= BOARD_WIDTH ||
    y >= BOARD_HEIGHT ||
    cells[x][y].hasSnake
  );
}

function checkForFruit(x, y) {
  return cells[x][y].hasFruit;
}

function advanceSnakeTail() {
  if (snakeCells.length < snakeLength) return;

  var oldTailCell = snakeCells.shift();
  oldTailCell.hasSnake = false;
  oldTailCell.heading = undefined;

  var newTailCell = snakeCells[0];
  newTailCell.tailing = undefined;

  if (oldTailCell) oldTailCell.draw();
  if (newTailCell) newTailCell.draw();
}

function advanceSnakeHead(nextHeadX, nextHeadY) {
  headX = nextHeadX;
  headY = nextHeadY;

  var oldHeadCell = snakeCells[snakeCells.length - 1];
  if (oldHeadCell) oldHeadCell.heading = heading;

  var newHeadCell = cells[nextHeadX][nextHeadY];
  newHeadCell.tailing = heading;
  newHeadCell.hasFruit = false;
  newHeadCell.hasSnake = true;
  snakeCells.push(newHeadCell);

  oldHeadCell.draw();
  newHeadCell.draw();
}

function Cell(element) {
  element.layout = null;

  this.element = element;
  this.hasSnake = false;
  this.hasFruit = false;
  this.heading = undefined;
  this.tailing = undefined;

  this.draw = function () {
    clearCell(this);
    if (this.hasSnake) drawSnakeCell(this);
    if (this.hasFruit) drawFruitCell(this);
  };
}

function drawSnakeCell(cell) {
  undrawSnakeCell(cell);

  var element = cell.element;

  var subcellInsetX = CELL_WIDTH / 8;
  var subcellInsetY = CELL_HEIGHT / 8;
  var subcellWidth = CELL_WIDTH - subcellInsetX * 2;
  var subcellHeight = CELL_HEIGHT - subcellInsetY * 2;
  var rightEdge = CELL_WIDTH;
  var bottomEdge = CELL_HEIGHT;

  var subcellX = element.add("group");
  var subcellY = element.add("group");

  subcellX.bounds = [
    subcellInsetX,
    subcellInsetY,
    subcellInsetX + subcellWidth,
    subcellInsetY + subcellHeight,
  ];

  if (cell.heading === "Left" || cell.tailing === "Right")
    subcellX.bounds[0] = 0;
  if (cell.heading === "Right" || cell.tailing === "Left")
    subcellX.bounds[2] = rightEdge;

  subcellY.bounds = [
    subcellInsetX,
    subcellInsetY,
    subcellInsetX + subcellWidth,
    subcellInsetY + subcellHeight,
  ];

  if (cell.heading === "Up" || cell.tailing === "Down") subcellY.bounds[1] = 0;
  if (cell.heading === "Down" || cell.tailing === "Up")
    subcellY.bounds[3] = bottomEdge;

  colorElement(subcellX, SNAKE_COLOR);
  colorElement(subcellY, SNAKE_COLOR);
}

function drawFruitCell(cell) {
  var element = cell.element;

  var subcellInsetX = CELL_WIDTH / 8;
  var subcellInsetY = CELL_HEIGHT / 8;
  var subcellWidth = CELL_WIDTH - subcellInsetX * 2;
  var subcellHeight = CELL_HEIGHT - subcellInsetY * 2;

  var subcell = element.add("group");
  subcell.bounds = [
    subcellInsetX,
    subcellInsetY,
    subcellInsetX + subcellWidth,
    subcellInsetY + subcellHeight,
  ];

  colorElement(subcell, FRUIT_COLOR);
}

function clearCell(cell) {
  var element = cell.element;
  for (var i = 0; i < element.children.length; i++) {
    element.remove(element.children[i]);
  }
  colorElement(element, NONE_COLOR);
}

function updateScoreboard() {
  scoreText.text = "Score: " + snakeLength;
}

/*
 * - Visual Stuff -
 */

function drawGameBoard() {
  for (var x = 0; x < BOARD_WIDTH; x++) {
    var column = cellGrid.add("group");
    column.preferredSize = [CELL_HEIGHT * BOARD_HEIGHT, CELL_WIDTH];
    column.orientation = "column";
    column.spacing = 0;
    cells.push([]);
    for (var y = 0; y < BOARD_WIDTH; y++) {
      var cellElement = column.add("group");
      cellElement.minimumSize = [CELL_WIDTH, CELL_HEIGHT];
      cells[x].push(new Cell(cellElement));
    }
  }
}

function colorElement(element, color) {
  element.graphics.backgroundColor = element.graphics.newBrush(
    element.graphics.BrushType.SOLID_COLOR,
    color,
  );
}

/*
 * - Input handling -
 */

function processKeyPress(keyName) {
  if (keyName === "Escape") pauseGame();

  if (nextHeading) return;

  if (keyName === "Left" && heading !== "Right") nextHeading = "Left";
  if (keyName === "Up" && heading !== "Down") nextHeading = "Up";
  if (keyName === "Right" && heading !== "Left") nextHeading = "Right";
  if (keyName === "Down" && heading !== "Up") nextHeading = "Down";

  if (gameState === "Waiting For Input" && nextHeading) startGame();
}

/*
 * - Helper Functions -
 */

function startGameLoop() {
  btSendText("#include '" + PHOTOSHOP_CLOCK_PATH + "'");
}

function haltGameLoop() {
  btSendText(
    "$.setenv('snake_loop_index', Number($.getenv('snake_loop_index')) + 1);",
  );
}

function btSendText(payload) {
  var bt = new BridgeTalk();
  bt.target = "photoshop";
  bt.body = payload;
  bt.send();
}

/*
 * - Debug stuff -
 */

// var lastCheckpoint = "none";

// Error.prototype.toString = function () {
//   return this.message + "\nLast checkpoint reached: " + lastCheckpoint;
// };

// function checkpoint(name) {
//   lastCheckpoint = name;
// }

// var debugTicks = gameWindow.add("statictext");
// debugTicks.alignment = "fill";
// var debugHeading = gameWindow.add("statictext");
// debugHeading.alignment = "fill";
// var debugNextHeading = gameWindow.add("statictext");
// debugNextHeading.alignment = "fill";
// var debugHeadX = gameWindow.add("statictext");
// debugHeadX.alignment = "fill";
// var debugHeadY = gameWindow.add("statictext");
// debugHeadY.alignment = "fill";

// function refreshDebug() {
//   debugTicks.text = "Ticks: " + ticks;
//   debugHeading.text = "Heading: " + heading;
//   debugNextHeading.text = "Next Heading: " + nextHeading;
//   debugHeadX.text = "Head X: " + headX;
//   debugHeadY.text = "Head Y: " + headY;
// }

/*
 * - Initialize and show game window -
 */

gameWindow.show();
drawGameBoard();
resetGame();
