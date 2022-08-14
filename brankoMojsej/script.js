
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const image = document.getElementById('source');

document.addEventListener('mousedown', keyPush);
document.addEventListener('mousedown', newGame);

function keyPush(event){
    isJump = true;           
}

function putImageGround(){
    var img = new Image();
    img.src = "ground.png";  
    ctx.drawImage(img, groundPosX, groundPosY, 1080, 50);            
}

function putImageTatraTea(x){
    var img = new Image();
    img.src = "tatraTea.png";  
    ctx.drawImage(img, x, tatraTeaPosY, tatraTeaSizeX, tatraTeaSizeY);            
}

function putImageVodka(x){
    var img = new Image();
    img.src = "vodka.png";  
    ctx.drawImage(img, x, vodkaPosY, vodkaSizeX, vodkaSizeY);            
}

function putImageFernet(x){
    var img = new Image();
    img.src = "fernet.png";  
    ctx.drawImage(img, x, fernetPosY, fernetSizeX, fernetSizeY);            
}

function putImageBorovicka(x){
    var img = new Image();
    img.src = "borovicka.png";  
    ctx.drawImage(img, x, borovickaPosY, borovickaSizeX, borovickaSizeY);            
}

function putImageNapoje(x){
    var img = new Image();
    img.src = "napoje.png";  
    ctx.drawImage(img, x, napojePosY, napojeSizeX, napojeSizeY);            
}

function putImageBranko(){
    var img = new Image();
    img.src = "branko.jpg"; 
    ctx.drawImage(img, playerPosX, playerPosY, playerSizeX, playerSizeY);            
}

function putImageNorka(){
    var img = new Image();
    img.src = "norka.png";  
    ctx.drawImage(img, norkaPosX, norkaPosY, norkaSizeX, norkaSizeY);            
}

function jump(){
    if (isJump==true){
        if (jumpCount >= -11){
        let neg = 1;
        if(jumpCount<0){
            neg = -1;
        }
        playerPosY -= (jumpCount ** 2) * 0.5 * neg;
        jumpCount -= 1; 
    }
        else{
            isJump = false;
            jumpCount = 11;
        }
    }
    
}

function drawStuff(){
    hitbox1X = playerPosX+playerSizeX;
    hitbox1Y = playerPosY+playerSizeY/2;
    hitbox2X = playerPosX+playerSizeX;
    hitbox2Y = playerPosY+playerSizeY;
    hitbox3X = playerPosX;
    hitbox3Y = playerPosY+playerSizeY;

    ctx.fillStyle = '#738678';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = "15px Arial";
    ctx.fillText("Braňko už nepil", 0, 20);
    ctx.fillText(time, 0, 35);
    ctx.fillText("sekúnd", String(time).length*9+5, 35);  
    putImageGround();
    
    if(alcohol1==1){
        putImageTatraTea(alcohol1PosX);
    }
    else if(alcohol1==2){
        putImageVodka(alcohol1PosX);
    }
    else if(alcohol1==3){
        putImageFernet(alcohol1PosX);
    }
    else if(alcohol1==4){
        putImageBorovicka(alcohol1PosX);
    }
    else if(alcohol1==5){
        putImageNapoje(alcohol1PosX);
    }


    if(alcohol2==1){
        putImageTatraTea(alcohol2PosX);
    }
    else if(alcohol2==2){
        putImageVodka(alcohol2PosX);
    }
    else if(alcohol2==3){
        putImageFernet(alcohol2PosX);
    }
    else if(alcohol2==4){
        putImageBorovicka(alcohol2PosX);
    }
    else if(alcohol2==5){
        putImageNapoje(alcohol2PosX);
        // console.log(alcohol2PosX);
    }

    putImageBranko();
    putImageNorka();


    // ctx.fillStyle = 'red';
    // ctx.fillRect(hitbox1X, hitbox1Y, 3, 3);

    // ctx.fillStyle = 'red';
    // ctx.fillRect(hitbox2X, hitbox2Y, 3, 3);

    // ctx.fillStyle = 'red';
    // ctx.fillRect(hitbox3X, hitbox3Y, 3, 3);
}
function moveStuff(){
    alcoholTime = alcoholTime-1;
    if(alcohol1PosX>alcohol2PosX){ 
        if(alcohol2PosX<0 && alcoholTime<0){
            alcohol2PosX=360;
            alcoholTime=((390/6)*0.5) + (Math.ceil(Math.random() * ((390/6*1.2)-(390/6*0.7))));
            alcohol2 = Math.ceil(Math.random() * 5);
            // console.log("1");
        } 
    }
    else if(alcohol1PosX<alcohol2PosX){
        if(alcohol1PosX<0 && alcoholTime<0){
            alcohol1PosX=360;
            alcoholTime=((390/6)*0.5) + (Math.ceil(Math.random() * ((390/6*1.2)-(390/6*0.7))));
            alcohol1 = Math.ceil(Math.random() * 5);
            // console.log("2");
        }
    }

    if(hitbox1X>alcohol1PosX && hitbox1X<alcohol1PosX+tatraTeaSizeX && hitbox1Y>tatraTeaPosY){
        running = false;
    }
    else if(hitbox1X>alcohol2PosX && hitbox1X<alcohol2PosX+tatraTeaSizeX && hitbox1Y>tatraTeaPosY){
        running = false;
    }
    else if(hitbox2X>alcohol1PosX && hitbox2X<alcohol1PosX+tatraTeaSizeX && hitbox2Y>tatraTeaPosY){
        running = false;
    }
    else if(hitbox2X>alcohol2PosX && hitbox2X<alcohol2PosX+tatraTeaSizeX && hitbox2Y>tatraTeaPosY){
        running = false;
    }
    else if(hitbox3X>alcohol1PosX && hitbox3X<alcohol1PosX+tatraTeaSizeX && hitbox3Y>tatraTeaPosY){
        running = false;
    }
    else if(hitbox3X>alcohol2PosX && hitbox3X<alcohol2PosX+tatraTeaSizeX && hitbox3Y>tatraTeaPosY){
        running = false;
    }
    
    
    groundPosX = groundPosX-velocity;
    alcohol1PosX = alcohol1PosX-velocity;
    alcohol2PosX = alcohol2PosX-velocity;
    velTimer = velTimer-1;

    if(groundPosX < -720){
        groundPosX = 0;
    }

    if(velTimer<=0 && velocity<=10){
        velocity=velocity+1
        velTimer=200;
    }
}

function timer(){
    ticks=ticks+1;
    if(ticks>=60){
        ticks=0;
        time=time+1;
        // console.log(time);
    }
}
let highScore = 0;
let ticks = 0;
let time = 0;
let velTimer = 1000;
let running = false;
let alcohol1 = Math.ceil(Math.random() * 5);
let alcohol2 = Math.ceil(Math.random() * 5);
let velocity = 5;
let alcoholTime = 150;

let alcohol1PosX = 720;
let alcohol2PosX = -200;

let tatraTeaSizeX = 25;
let tatraTeaSizeY = 53;
let tatraTeaPosY = 304;

let vodkaSizeX = 23;
let vodkaSizeY = 46;
let vodkaPosY = 313;

let fernetSizeX = 28;
let fernetSizeY = 50;
let fernetPosY = 307;

let borovickaSizeX = 20;
let borovickaSizeY = 46;
let borovickaPosY = 313;

let napojeSizeX = 43;
let napojeSizeY = 40;
let napojePosY = 319;

let groundPosX = 0;
let groundPosY = 345; 
let jumpCount = 11;
let isJump = false;
let playerPosX = 20;
let playerPosY = 316;
let playerSizeX = 43;
let playerSizeY = 40;
let hitbox1X = playerPosX+playerSizeX;
let hitbox1Y = playerPosY+playerSizeY/2;
let hitbox2X = playerPosX+playerSizeX;
let hitbox2Y = playerPosY+playerSizeY;
let hitbox3X = playerPosX;
let hitbox3Y = playerPosY+playerSizeY;

let norkaPosX = 280
let norkaPosY = 20
let norkaSizeX = 60
let norkaSizeY = 60

function newGame(event){
    if(running==false){
        highScore = 0;
        ticks = 0;
        time = 0;
        velTimer = 1000;
        alcohol1 = Math.ceil(Math.random() * 5);
        alcohol2 = Math.ceil(Math.random() * 5);
        running = true;
        velocity = 5;
        alcoholTime = 150;

        alcohol1PosX = 720;
        alcohol2PosX = -200;

        tatraTeaSizeX = 25;
        tatraTeaSizeY = 53;
        tatraTeaPosY = 304;

        vodkaSizeX = 23;
        vodkaSizeY = 46;
        vodkaPosY = 313;

        fernetSizeX = 28;
        fernetSizeY = 50;
        fernetPosY = 307;

        borovickaSizeX = 20;
        borovickaSizeY = 46;
        borovickaPosY = 313;

        napojeSizeX = 43;
        napojeSizeY = 40;
        napojePosY = 319;

        groundPosX = 0;
        groundPosY = 345; 
        jumpCount = 11;
        isJump = false;
        playerPosX = 20;
        playerPosY = 316;
        playerSizeX = 43;
        playerSizeY = 40;
        hitbox1X = playerPosX+playerSizeX;
        hitbox1Y = playerPosY+playerSizeY/2;
        hitbox2X = playerPosX+playerSizeX;
        hitbox2Y = playerPosY+playerSizeY;
        hitbox3X = playerPosX;
        hitbox3Y = playerPosY+playerSizeY;

        norkaPosX = 280
        norkaPosY = 20
        norkaSizeX = 60
        norkaSizeY = 60
        gameLoop();
    }
}
function gameLoop(){
    timer();
    drawStuff();
    jump();
    moveStuff(); 
    
    if(running){
        requestAnimationFrame(gameLoop);
    
    }
}
