let canvas;
let cts;
let playerDirection = 0;
let playerUp = 0;
let pressedKeys = new Set();
let playerPosition = [128, 128, 128];
let lastMouse = [0, 0];
let allColorCodes = {};
let scale = 1;
let start;

let nameToCode = {};
let tutorialImage;
let locked = false;

function main() {
    prepareColors();

    canvas = document.querySelector("canvas");
    ctx = canvas.getContext("2d");
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    document.addEventListener("mousemove", mouseMove);
    window.addEventListener("resize", windowResize);
    canvas.addEventListener("click", lockCursor);
    start = Date.now();
    tutorialImage = new Image();
    tutorialImage.src = "tutorial.png"

    windowResize();
    update();
}

function lockCursor() {
    canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;
    locked = true;
    canvas.requestPointerLock()
}

function prepareColors() {
    for (let colorCode in allColors) {
        let colorName = allColors[colorCode];
        let subStrings = {
            r: colorCode.substring(1, 3), 
            g: colorCode.substring(3, 5), 
            b: colorCode.substring(5, 7)
        };
        let colors = {};
        for (let color in subStrings) {
            colors[color] = parseInt("0x" + subStrings[color], 16);
        }
        allColorCodes[colorName] = colors;

        nameToCode[colorName] = colorCode;
    }
}

function keyDown(evt) {
    console.log("pressed", evt);
    pressedKeys.add(evt.key);
   
}

function windowResize(evt) {
    console.log(evt);
    let canvasSize = Math.min(window.innerWidth, window.innerHeight - 300);
    canvas.setAttribute("width", canvasSize);
    canvas.setAttribute("height", canvasSize);
    scale = canvasSize / 800;
}

function mouseMove(evt) {
    console.log(evt);
    if (!locked) {
        return;
    }
    /*let dx = lastMouse[0] - evt.pageX;
    let dy = lastMouse[1] - evt.pageY;*/
    let dx = 0;
    let dy = 0;
    if (evt.movementX) {
        dx = -evt.movementX;
        dy = -evt.movementY;
    }
    lastMouse = [evt.pageX, evt.pageY];

    let speed = 0.01;
    playerUp += speed * dy;
    playerDirection += speed * dx;

    playerUp = Math.max(-Math.PI * 0.5, Math.min(Math.PI * 0.5, playerUp));
}

function moveForward(d) {
    let dx = Math.sin(playerDirection);
    let dy = Math.cos(playerDirection);
    let dz = Math.tan(playerUp);
    //dz = 0;

    let r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2)) / d;

    dx /= r;
    dy /= r;
    dz /= r;


    playerPosition[0] += dx;
    playerPosition[1] += dy;
    playerPosition[2] += dz;
}

function boundPlayer() {
    for (let i = 0; i < 3; ++i) {
        playerPosition[i] = Math.max(0, Math.min(256, playerPosition[i]));
    }
}

function moveRight(d) {
    let dx = Math.sin(playerDirection + Math.PI * 0.5);
    let dy = Math.cos(playerDirection + Math.PI * 0.5);
    let dz = 0;

    let r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2)) / d;

    dx /= r;
    dy /= r;
    dz /= r;

    playerPosition[0] += dx;
    playerPosition[1] += dy;
    playerPosition[2] += dz;
}

function moveUp(d) {
    playerPosition[2] += d;
}

function keyUp(evt) {
    console.log("released", evt);
    pressedKeys.delete(evt.key);
}

function update(evt) {
    let speed = 0.2;
    if (pressedKeys.has("Shift")) {
        speed *= 5;
    }
    requestAnimationFrame(update);
    if (pressedKeys.has("w")) {
        moveForward(speed);
    }
    if (pressedKeys.has("d")) {
        moveRight(-speed);
    }
    if (pressedKeys.has("a")) {
        moveRight(speed);
    }
    if (pressedKeys.has("s")) {
        moveForward(-speed);
    }
    if (pressedKeys.has("e")) {
        moveUp(speed);
    }
    if (pressedKeys.has("q")) {
        moveUp(-speed);
    }

    boundPlayer();

    draw();
}

function textColor() {

}

function draw() {
    ctx.fillStyle = "rgb(" + playerPosition.join(", ") + ")";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    if (playerPosition.reduce((a, b) => a + b) < 256 * 3/2) {
        ctx.fillStyle = "#444444";
    }

    renderColorText();

    ctx.globalAlpha = Math.min(1, Math.max(0, 6 - (Date.now() - start) / 1000 ));
    ctx.drawImage(tutorialImage, canvas.width / 2 - 200, canvas.height / 2 - 200, 400, 400);
    ctx.globalAlpha = 1;
}

function renderColorText() {
    let shortestDistance = Infinity;
    let shortestColor = "transparent";
    let drawingColors = [];
    ctx.textAlign = "center";
    for (let colorName in allColorCodes) {
        let code = allColorCodes[colorName];
        let d = Math.sqrt(
            Math.pow(code.r - playerPosition[0], 2) + 
            Math.pow(code.g - playerPosition[1], 2) + 
            Math.pow(code.b - playerPosition[2], 2)
        )
        if (d < shortestDistance) {
            shortestColor = colorName;
            shortestDistance = d;
        }

        let dz = code.b - playerPosition[2];
        let zNeg = false;
        if (dz < 0) {
            zNeg = true;
            dz = -dz;
        }

        let colorUp = (zNeg ? -1 : 1) * Math.asin(dz / d);
        
        let colorDirection = Math.atan2(
            code.r - playerPosition[0], code.g - playerPosition[1]
        );
        let screenDirection = (colorDirection - playerDirection).mod(Math.PI * 2);

        let screenUp = (colorUp - playerUp).mod(Math.PI * 2);

        
        let wide = Math.PI / 4;
        if (screenDirection > wide) {
            screenDirection -= Math.PI * 2;
        }

        if (screenUp > wide) {
            screenUp -= Math.PI * 2;
        }
        
        if (
            screenUp < wide && screenUp > -wide && 
            screenDirection < wide && screenDirection > -wide &&
            d < 160 && d > 3) {
            drawingColors.push(colorName);
            let x = canvas.width / 2 - screenDirection * 500 * scale;
            let y = canvas.height / 2 - screenUp * 500 * scale;
            let fontText = Math.floor(500 / d) * scale + "px arial"
            ctx.font = fontText;
            ctx.fillStyle = nameToCode[colorName];
            let text = colorName + " " + nameToCode[colorName];
            ctx.fillText(text, x, y);
            if (d < 20) {
                ctx.lineWidth = 3/d;
                ctx.strokeText(text, x, y);
            }
        }
    }
    ctx.textAlign = "left";
    ctx.font = "12px arial";
    ctx.fillStyle = "black";
    if (playerPosition.reduce((a, b) => a + b) < 256 * 3/2) {
        ctx.fillStyle = "#444444";
    }
    ctx.fillText("Closest color: " + shortestColor, 20, 20);
    for (let i = 0; i < 3; ++i) {
        ctx.fillText(["R", "G", "B"][i] + ": " + Math.round(playerPosition[i]), 20, 40 + 20 * i);
    }
    
}

Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
};

onload = main;