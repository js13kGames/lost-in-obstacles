(function () {
    "use strict";

    var configs, canvas,

    // text constants
    VERTICAL = "vertical",
    HORIZONTAL = "horizontal",
    BACKWARD = "backward",
    FORWARD = "forward",
    GAME_NAME = "Lost";


    function fillRect(offsetX, offsetY, width, height, color) {
        canvas.fillStyle = color;
        canvas.fillRect(offsetX, offsetY, width, height);
    }

    function fillText(offsetX, offsetY, text, fontSize, color) {
        canvas.fillStyle = color;
        canvas.font =  fontSize + "px serif";
        canvas.fillText(text, offsetX, offsetY);
    }

    function clearScreen() {
        fillRect(0, 0, configs.screenWidth, configs.screenHeight, configs.screenColor);
    }


    // game
    function drawWalls() {
        var offsetX = 0,
        offsetY = 0,
        sizeX = configs.canvasWidth,
        sizeY = configs.canvasHeight,
        i = -1;

        if (configs.blockDirection === VERTICAL) {
            sizeX /= configs.blockCount;

            while (++i < configs.blockCount) {
                fillRect(offsetX, offsetY, sizeX, sizeY, (i % 2) ? configs.blockColorOdd : configs.blockColorEven);
                offsetX += sizeX;
            }
        } else {
            sizeY /= configs.blockCount;

            while (++i < configs.blockCount) {
                fillRect(offsetX, offsetY, sizeX, sizeY, (i % 2) ? configs.blockColorOdd : configs.blockColorEven);
                offsetY += sizeY;
            }
        }
    }

    function isValidDoorPosition(index) {
        // avoid current position first and previous position last
        if (!configs.doorPaths[index] && configs.doorPaths[index - 2] === (configs.blockCount - 1)) {
            return false;
        }

        // avoid previous position first and current position last
        if (!configs.doorPaths[index - 2] && configs.doorPaths[index] === (configs.blockCount - 1)) {
            return false;
        }

        // avoid same position
        if (configs.doorPaths[index] === configs.doorPaths[index - 2]) {
            return false;
        }

        return true;
    }

    function drawDoors() {
        var offsetX,
        offsetY,
        index,
        i = -1;

        while (++i < configs.currentLevel) {
            index = (i * 2) + 1;

            while (true) {
                configs.doorPaths[index] = Math.floor(Math.random() * configs.blockCount);

                if (isValidDoorPosition(index)) {
                    break;
                }
            }

            if (configs.blockDirection === VERTICAL) {
                offsetX = index * configs.playerWidth;
                offsetY = configs.doorPaths[index] * configs.playerHeight;
            } else {
                offsetX = configs.doorPaths[index] * configs.playerWidth;
                offsetY = index * configs.playerHeight;
            }

            fillRect(offsetX, offsetY, configs.playerWidth, configs.playerHeight, configs.blockColorEven);
        }
    }

    function drawHome() {
        fillRect(configs.homeOffsetX + configs.homeBorderX, configs.homeOffsetY + configs.homeBorderY, configs.homeWidth - (configs.homeBorderX * 2), configs.homeHeight - (configs.homeBorderY * 2), configs.homeColor);
    }

    function stopPlay() {
        configs.isPlay = false;
        configs.isLose = true;

        removeEnemeyListener();
        drawLose();
    }


    // menu
    function menuListener(e) {
        if (e.keyCode !== 13) {
            return;
        }

        e.preventDefault();
        removeEventListener("keyup", menuListener, false);

        if (!configs.isLose) {
            loadLevel(1);
        } else {
            drawMenu();
        }
    }

    function drawMenu() {
        var offsetX = Math.floor(configs.screenWidth / 4),
        offsetY = Math.floor(configs.screenHeight / 8),
        fontSize = Math.floor((configs.screenWidth * 10) / 100),
        fontHeight = fontSize;

        configs.isLose = false;
        offsetY += fontHeight;

        fillRect(0, 0, configs.screenWidth, configs.screenHeight, configs.menuColor);
        fillText(offsetX + Math.floor(offsetX / 2), offsetY, GAME_NAME, fontSize, configs.menuTextColor);

        fontSize /= 2;
        offsetY += fontSize;

        [
            ["↑", "move UP"],
            ["↓", "move DOWN"],
            ["←", "move RIGHT"],
            ["→", "move LEFT"],
            ["↵", "to PLAY"]
        ].forEach(function (text) {
            offsetY += fontHeight;
            fillText(offsetX, offsetY, text[0] + "  -  " + text[1], fontSize, configs.menuTextColor);
        });

        offsetY += fontHeight + fontSize;
        fillText(offsetX, offsetY, "Score: " + configs.currentScore + " - Best: " + configs.bestScore, fontSize, configs.menuTextColor);

        addEventListener("keyup", menuListener, false);
    }

    function drawLose() {
        var offsetX = Math.floor(configs.screenWidth / 4),
        offsetY = Math.floor(configs.screenHeight / 2),
        fontSize = Math.floor((configs.screenWidth * 10) / 100);

        if (configs.currentScore > configs.bestScore) {
            configs.bestScore = configs.currentScore;
        }

        fillRect(0, 0, configs.screenWidth, configs.screenHeight, configs.menuColor);
        fillText(offsetX, offsetY, "You lose", fontSize, configs.menuTextColor);
        fillText(offsetX, offsetY + (fontSize * 2), "↵  -  to CONTINUE", Math.floor(fontSize / 2), configs.menuTextColor);

        addEventListener("keyup", menuListener, false);
    }


    // enemey
    function drawEnemey(offsetX, offsetY) {
        fillRect(offsetX + configs.enemeyBorderX, offsetY + configs.enemeyBorderY, configs.enemeyWidth - (configs.enemeyBorderX * 2), configs.enemeyHeight - (configs.enemeyBorderY * 2), configs.enemeyColor);
    }

    function addEnemeyListener(i) {
        var moveDirection = (i % 2) ? BACKWARD : FORWARD,
        index = i * 2,
        offsetX,
        offsetY,
        previousOffsetX,
        previousOffsetY;

        if (configs.blockDirection === VERTICAL) {
            offsetX = index * configs.enemeyWidth;
            offsetY = Math.floor(Math.random() * configs.blockCount) * configs.enemeyHeight;
        } else {
            offsetX = Math.floor(Math.random() * configs.blockCount) * configs.enemeyWidth;
            offsetY = index * configs.enemeyHeight;
        }

        configs.enemies[index] = {
            offsetX: offsetX,
            offsetY: offsetY
        };

        drawEnemey(offsetX, offsetY);

        configs.enemeyListners.push(setInterval(function () {
            if (!configs.isPlay) {
                return;
            }

            previousOffsetX = offsetX;
            previousOffsetY = offsetY;

            if (configs.blockDirection === VERTICAL) {
                if (moveDirection === FORWARD) {
                    if (offsetY + configs.enemeyHeight < configs.canvasHeight) {
                        offsetY += configs.enemeyHeight;
                    } else {
                        offsetY -= configs.enemeyHeight;
                        moveDirection = BACKWARD;
                    }
                } else {
                    if (offsetY) {
                        offsetY -= configs.enemeyHeight;
                    } else {
                        offsetY += configs.enemeyHeight;
                        moveDirection = FORWARD;
                    }
                }
            } else {
                if (moveDirection === FORWARD) {
                    if (offsetX + configs.enemeyWidth < configs.canvasWidth) {
                        offsetX += configs.enemeyWidth;
                    } else {
                        offsetX -= configs.enemeyWidth;
                        moveDirection = BACKWARD;
                    }
                } else {
                    if (offsetX) {
                        offsetX -= configs.enemeyWidth;
                    } else {
                        offsetX += configs.enemeyWidth;
                        moveDirection = FORWARD;
                    }
                }
            }

            configs.enemies[index].offsetX = offsetX;
            configs.enemies[index].offsetY = offsetY;

            if (isPlayerHit(index)) {
                stopPlay();
                return;
            }

            // clear previous path
            fillRect(previousOffsetX, previousOffsetY, configs.enemeyWidth, configs.enemeyHeight, configs.blockColorEven);
            drawEnemey(offsetX, offsetY);
        }, configs.enemeySpeed));
    }

    function removeEnemeyListener() {
        var i = configs.enemeyListners.length;

        while (i--) {
            clearInterval(configs.enemeyListners.pop());
        }
    }

    function drawEnemies() {
        var i = 0;

        while (++i < configs.currentLevel) {
            addEnemeyListener(i);
        }
    }


    // player
    function drawPlayer() {
        fillRect(configs.playerOffsetX + configs.playerBorderX, configs.playerOffsetY + configs.playerBorderY, configs.playerWidth - (configs.playerBorderX * 2), configs.playerHeight - (configs.playerBorderY * 2), configs.playerColor);
    }

    function isPlayerHit(enemeyIndex) {
        if (configs.playerPosition !== enemeyIndex || !configs.enemies[enemeyIndex]) {
            return;
        }

        if (configs.blockDirection === VERTICAL) {
            return configs.enemies[enemeyIndex].offsetY === configs.playerOffsetY;
        } else {
            return configs.enemies[enemeyIndex].offsetX === configs.playerOffsetX;
        }
    }

    function movePlayerVertically(keyCode) {
        switch (keyCode) {
            case 37: {
                if (configs.isInsideDoor || configs.playerOffsetY === (configs.doorPaths[configs.playerPosition - 1] * configs.playerHeight)) {
                    configs.playerOffsetX -= configs.playerWidth;
                    configs.playerPosition -= 1;
                    return true;
                }
                break;
            }

            case 38: {
                if (!configs.isInsideDoor && configs.playerOffsetY) {
                    configs.playerOffsetY -= configs.playerHeight;
                    return true;
                }
                break;
            }

            case 39: {
                if (configs.isInsideDoor || configs.playerOffsetY === (configs.doorPaths[configs.playerPosition + 1] * configs.playerHeight)) {
                    configs.playerOffsetX += configs.playerWidth;
                    configs.playerPosition += 1;
                    return true;
                }
                break;
            }

            case 40: {
                if (!configs.isInsideDoor && configs.playerOffsetY + configs.playerHeight < configs.canvasHeight) {
                    configs.playerOffsetY += configs.playerHeight;
                    return true;
                }
                break;
            }
        }

        return false;
    }

    function movePlayerHorizontally(keyCode) {
        switch (keyCode) {
            case 37: {
                if (!configs.isInsideDoor && configs.playerOffsetX) {
                    configs.playerOffsetX -= configs.playerWidth;
                    return true;
                }
                break;
            }

            case 38: {
                if (configs.isInsideDoor || configs.playerOffsetX === (configs.doorPaths[configs.playerPosition - 1] * configs.playerWidth)) {
                    configs.playerOffsetY -= configs.playerHeight;
                    configs.playerPosition -= 1;
                    return true;
                }
                break;
            }

            case 39: {
                if (!configs.isInsideDoor && configs.playerOffsetX + configs.playerWidth < configs.canvasWidth) {
                    configs.playerOffsetX += configs.playerWidth;
                    return true;
                }
                break;
            }

            case 40: {
                if (configs.isInsideDoor || configs.playerOffsetX === (configs.doorPaths[configs.playerPosition + 1] * configs.playerWidth)) {
                    configs.playerOffsetY += configs.playerHeight;
                    configs.playerPosition += 1;
                    return true;
                }
                break;
            }
        }

        return false;
    }

    function playerListener() {
        var previousOffsetX,
        previousOffsetY;

        // 37 - left
        // 38 - top
        // 39 - right
        // 40 - bottom

        addEventListener("keyup", function (e) {
            if (!configs.isPlay || !(/^3[789]$|^40$/).test(e.keyCode)) {
                return;
            }

            configs.isInsideDoor = configs.playerPosition % 2;
            previousOffsetX = configs.playerOffsetX;
            previousOffsetY = configs.playerOffsetY;

            if (configs.blockDirection === VERTICAL ? !movePlayerVertically(e.keyCode) : !movePlayerHorizontally(e.keyCode)) {
                return;
            }

            // check enemey position
            if (isPlayerHit(configs.playerPosition)) {
                stopPlay();
                return;
            }

            // clear previous path
            fillRect(previousOffsetX, previousOffsetY, configs.playerWidth, configs.playerHeight, configs.blockColorEven);
            drawPlayer();

            if (configs.playerOffsetX === configs.homeOffsetX && configs.playerOffsetY === configs.homeOffsetY) {
                loadLevel(++configs.currentLevel);
            }
        }, false);
    }


    // level
    function initLevelConfigs(level) {
        var blockCount = (level * 2) + 1,
        blockWidth = Math.floor(configs.screenWidth / blockCount),
        blockHeight = Math.floor(configs.screenHeight / blockCount);

        // canvas
        configs.canvasWidth = blockWidth * blockCount;
        configs.canvasHeight = blockHeight * blockCount;

        // block
        configs.blockCount = blockCount;
        configs.blockDirection = Math.floor(Math.random() * 2) ? VERTICAL : HORIZONTAL;

        // game
        configs.currentLevel = level;
        configs.doorPaths = [];
        configs.currentScore = level - 1;

        // home
        configs.homeWidth = blockWidth;
        configs.homeHeight = blockHeight;
        configs.homeBorderX = Math.floor(configs.homeWidth / 5);
        configs.homeBorderY = Math.floor(configs.homeHeight / 5);

        if (configs.blockDirection === VERTICAL) {
            configs.homeOffsetX = configs.canvasWidth - blockWidth;
            configs.homeOffsetY = Math.floor(Math.random() * blockCount) * configs.homeHeight;
        } else {
            configs.homeOffsetX = Math.floor(Math.random() * blockCount) * configs.homeWidth;
            configs.homeOffsetY = configs.canvasHeight - blockHeight;
        }

        // player
        configs.playerOffsetX = 0;
        configs.playerOffsetY = 0;
        configs.playerWidth = blockWidth;
        configs.playerHeight = blockHeight;
        configs.playerBorderX = Math.floor(configs.playerWidth / 10);
        configs.playerBorderY = Math.floor(configs.playerHeight / 10);
        configs.playerPosition = 0;
        configs.isInsideDoor = false;

        // ememey
        configs.enemies = [];
        configs.enemeyWidth = blockWidth;
        configs.enemeyHeight = blockHeight;
        configs.enemeyBorderX = Math.floor(configs.enemeyWidth / 10);
        configs.enemeyBorderY = Math.floor(configs.enemeyHeight / 10);
        configs.enemeySpeed = 1000 - (level * 50);

        if (configs.enemeySpeed < 100) {
            configs.enemeySpeed = 100;
        }
    }

    function loadLevel(level) {
        removeEnemeyListener();
        clearScreen();
        initLevelConfigs(level);
        drawWalls();
        drawDoors();
        drawHome();
        drawPlayer();
        drawEnemies();

        configs.isPlay = true;
    }


    // init
    function initConfigs() {
        var canvasContainer = document.querySelector("canvas");

        configs = {
            // canvas
            screenWidth: 500,
            screenHeight: 500,
            screenColor: "#fff",

            // block
            blockColorOdd: "blue",
            blockColorEven: "yellow",

            // game
            isPlay: false,
            isLose: false,
            bestScore: 0,
            currentScore: 0,

            // home
            homeColor: "green",

            // menu
            menuColor: "#000",
            menuTextColor: "#fff",

            // player
            playerColor: "red",

            // enemey
            enemeyColor: "orange",
            enemeyListners: []
        };

        canvasContainer.width = configs.screenWidth;
        canvasContainer.height = configs.screenHeight;
        canvas = canvasContainer.getContext("2d");
    }

    function init() {
        initConfigs();
        playerListener();
        drawMenu();
    }

    init();
}());