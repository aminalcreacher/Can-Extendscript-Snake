// @target photoshop
// @targetengine snake

var SLEEP_INTERVAL = 250;

if (!$.getenv("snake_loop_index")) $.setenv("snake_loop_index", "0");
else $.setenv("snake_loop_index", Number($.getenv("snake_loop_index")) + 1);

var loopID = $.getenv("snake_loop_index");

function tick() {
  var currentTime = Date.now();

  var bt = new BridgeTalk();
  bt.target = "illustrator";
  bt.body = [
    "(function() {",
    "var snakeWindow = Window.find('palette', 'Extendsnake')",
    "if (!snakeWindow) return 'no_target';",
    "var event = ScriptUI.events.createEvent('UIEvent');",
    "event.initUIEvent('tick', true, true);",
    "snakeWindow.dispatchEvent(event);",
    "})();",
  ].join("\n");
  bt.timeout = 5;

  bt.onResult = function (response) {
    try {
      if (response.body === "no_target") return;

      if ($.getenv("snake_loop_index") !== loopID) return;

      var delta = Date.now() - currentTime;
      var adjustedInterval = Math.max(SLEEP_INTERVAL - delta, 0);
      $.sleep(adjustedInterval);

      tick();
    } catch (e) {
      alert(e);
    }
  };

  bt.send();
}

tick();
