// ------------------------------------------------------------
// Jelly class 
//   Represent a jelly object with its basic behavior
// ------------------------------------------------------------
var Jelly = function(el, x, y, dx, dy){

   var el = el;
   el.style.left = x + "px";
   el.style.top = y + "px";
   el.pos = {x: x, y: y};
   el.dx = dx;
   el.dy = dy;
   el.xdir = parseInt(Math.random() * 2) % 2 == 0 ? 1 : -1;
   el.isInPlay = true;

   var vy = 0;
   var gravity = 0.5;
   var MAX_VY = 15;
   var isFree = false;

   function jump(){
      vy = 0 - (parseInt(Math.random() * 5) + 25);
   }

   function move(){
      el.pos.x = el.pos.x + el.dx * el.xdir;
      el.pos.y = el.pos.y + el.dy + vy * gravity;

      el.style.left = el.pos.x + "px";
      el.style.top = el.pos.y + "px";
      vy += gravity * 0.5;

      if (vy > MAX_VY)
         vy = MAX_VY;
   }

   function getY(){
      return el.pos.y;
   }

   function getX(){
      return el.pos.x;
   }

   function getHeight(){
      return el.offsetHeight;
   }

   function getWidth(){
      return el.offsetWidth;
   }

   function setY(y){
      el.pos.y = y;
      el.style.top = y + "px";
   }

   function changeXDir(){
      el.xdir *= -1;
   }

   function remove(){
      el.remove();
   }

   function isInPlay(){
      return el.isInPlay;
   }

   function setInPlay(inPlay){
      el.isInPlay = inPlay;
   }

   function swapClass(oldClass, newClass) {
      el.classList.remove(oldClass);
      el.classList.add(newClass);
   }

   return {
      jump: jump,
      move: move,
      getY: getY,
      getX: getX,
      getHeight: getHeight,
      getWidth: getWidth,
      setY: setY,
      changeXDir: changeXDir,
      remove: remove,
      isInPlay: isInPlay,
      setInPlay: setInPlay,
      swapClass: swapClass
   };
};


// ------------------------------------------------------------
// Sound Effects class
//    Register multiple sound entities and control the playback of each.
// ------------------------------------------------------------
var SoundFx = function() {
   // Every sound entity will be stored here for future use
   var sounds = {};

   // ------------------------------------------------------------
   // Register a new sound entity with some basic configurations
   // ------------------------------------------------------------
   function addSound(name, file, loop, autoplay) {

      // Don't create two entities with the same name
      if (sounds[name] instanceof Audio)
         return false;

      sounds[name] = new Audio();
      sounds[name].src = file;
      sounds[name].controls = false;
      sounds[name].loop = loop;
      sounds[name].autoplay = autoplay;
   }

   // ------------------------------------------------------------
   // Play a file from the beginning, even if it's already playing
   // ------------------------------------------------------------
   function play(name) {
      sounds[name].currentTime = 0;
      sounds[name].play();
   }

   // ------------------------------------------------------------
   // Gradually adjust the volume, either up or down
   // ------------------------------------------------------------
   function fade(name, fadeTo, speed, inOut) {
      if (fadeTo > 1.0)
         return fadeOut(name, 1.0, speed, inOut);

      if (fadeTo < 0.000)
          return fadeOut(name, 0.0, speed, inOut);

      var newVolume = parseFloat(sounds[name].volume + 0.01 * inOut);

      if (newVolume < parseFloat(0.0))
         newVolume = parseFloat(0.0);

      sounds[name].volume = newVolume;

      if (sounds[name].volume > fadeTo)
        setTimeout(function(){ fadeOut(name, fadeTo, speed, inOut); }, speed);
      else
         sounds[name].volume = parseFloat(fadeTo);

      return sounds[name].volume;
   }

   // ------------------------------------------------------------
   // A wrapper function for fade()
   // ------------------------------------------------------------
   function fadeOut(name, fadeTo, speed) {
      fade(name, fadeTo, speed, -1);
   }

   // ------------------------------------------------------------
   // A wrapper function for fade()
   // ------------------------------------------------------------
   function fadeIn(name, fadeTo, speed) {
      fade(name, fadeTo, speed, 1);
   }


   // ------------------------------------------------------------
   // The public interface through which the client can use the class
   // ------------------------------------------------------------
   return {
      add: addSound,
      play: play,
      fadeOut: fadeOut,
      fadeIn: fadeIn
   };
};


// Hold every sound effect in the same object for easy access
var sounds = new SoundFx();
sounds.add("background", "sound/techno-loop-2.mp3", true, true);
sounds.add("game-over", "sound/game-over.mp3", false, false);
sounds.add("splash", "sound/slurp.mp3", false, false);
sounds.add("boing", "sound/boing.mp3", false, false);
sounds.add("hit", "sound/swallow.mp3", false, false);
sounds.add("bounce", "sound/bounce.mp3", false, false);

// Adjust some of the sound entity
sounds.fadeOut("boing", 0.3, 10);
sounds.fadeOut("bounce", 0.3, 10);

// Other global objects to control game flow
var isPlaying = false;
var gameTimer = null;

var bowl = document.querySelector("#bowl");
var bowlTop = new Image();//document.createElement("img");
bowlTop.isReady = false;

bowlTop.onload = function(){
   bowlTop.width = "168";
   bowlTop.isReady = true;
}

bowlTop.src = "img/bowl-top.png";


var jellyModel = document.querySelector(".jelly-model");
var jellies = [];
var MAX_JELLIES = 50;
var jellyHP = 5.75;
var hitFloor = false;

var health = document.querySelector(".health-bar span");
health.sickLevel = 100;

var dude = document.querySelector(".dude-svg").cloneNode(true);
dude.isDead = false;
dude.isMoving = {left: false, right: false};
dude.pos = {x : 0, moveBy : 11.75};
document.body.appendChild(dude);

// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function startGame() {

   if (!isPlaying) {

      document.body.addEventListener("keyup", doOnKeyUp);
      document.body.addEventListener("keydown", doOnKeyDown);
      dude.pos.x = dude.offsetLeft;

      var bowlTop = document.querySelector("#bowl-top");
      bowlTop.classList.remove("bowl-closed");
      bowlTop.style.left = (event.screenX - bowlTop.offsetWidth + 65) + "px";
      bowlTop.style.top = (event.screenY - bowlTop.offsetHeight + 65 * 0) + "px";

      bowlTop.removeAttribute("draggable");
      bowlTop.classList.remove("dragging-icon");

      newJelly();

      isPlaying = true;

      // Start out the main game loop
      gameTimer = setInterval(tick, 15);
   }
};


// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function stopGame() {
   var message = document.querySelector("#message");
   message.innerText = "Game Over!";
   message.style.opacity = 1.0;
   message.classList.add("messageShadow");
}


// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function newJelly() {

   var colors = ["red", "green", "blue", "yellow"];
   var randColor = parseInt(Math.random() * 100) % colors.length;

   var jellyEntity = jellyModel.cloneNode(true);
   jellyEntity.classList.add("jelly-svg");
   jellyEntity.classList.add("jelly-svg-on");
   jellyEntity.classList.add("jelly-svg-" + colors[randColor]);

   var jelly = new Jelly(jellyEntity, bowl.offsetLeft + 10, bowl.offsetTop - 40, 
                         parseInt(Math.random() * 6) * 2.75, 
                         parseInt(Math.random() * 7) * 1.5);


   // If there's already too many jelly entities in the game,
   // remove the first one from the current list of jellies
   if (jellies.length > MAX_JELLIES) {
      jellies[0].remove();
      jellies.splice(0, 1);
   }

   jellies.push(jelly);
   jelly.jump();

   document.body.appendChild(jellyEntity);
   sounds.play("boing");
}

// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function tick() {

   // Only try to move the hero if game is still running
   if (!dude.isDead) {

      // Move dude to the right
      if (dude.isMoving.right) {
         if (dude.pos.x + dude.offsetWidth + 10 > document.body.offsetWidth) {
            dude.pos.x = document.body.offsetWidth - dude.offsetWidth;
         } else {
            dude.pos.x += dude.pos.moveBy;
            dude.style.left = dude.pos.x + "px";
         }
      }

      // Move dude to the left
      if (dude.isMoving.left) {
         if (dude.pos.x < 425) {
            dude.pos.x = 425;
         } else {
            dude.pos.x -= dude.pos.moveBy;
            dude.style.left = dude.pos.x + "px";
         }
      }
   }

   // Iterate through each jelly and check its state
   for (var i in jellies) {

      // Don't do anything to this jelly entity if it's outside the screen,
      // was eaten, or smashed on the floor
      if (!jellies[i].isInPlay())
         continue;

      // If the hero is still alive, check if this jelly is by his head
      if (!dude.isDead) {
         if (jellies[i].getY() + jellies[i].getHeight() - 20 >= dude.offsetTop &&
             jellies[i].getY() < dude.offsetTop + 100 &&
             jellies[i].getX() + 40 < dude.offsetLeft + dude.offsetWidth &&
             jellies[i].getX() - 40 + jellies[i].getWidth() > dude.offsetLeft) {

            sounds.play("hit");
            getSick();
            jellies[i].setInPlay(false);
            jellies[i].remove();
            jellies.splice(i, 1);
            continue;
         }
      }


      // If a jelly hits the wall on either side, play a sound and change its direction
      if (jellies[i].getX() + jellies[i].getWidth() > document.body.offsetWidth || jellies[i].getX() < 0) {
         jellies[i].changeXDir();
         sounds.play("bounce");
      }

      // Determine if a jelly has already hit the floor
      stillFalling = jellies[i].getY() + jellies[i].getHeight() * 2.5 < document.body.offsetHeight;

      // If it hasn't hit the floor, let gravity move it down
      if (stillFalling) {
         jellies[i].move();

      // If it has hit the floor, update the sprite, play a sound effect, and take the jelly out of play
      } else {
         if (jellies[i].getX() > 400) {
            jellies[i].setY(document.body.offsetHeight - jellies[i].getHeight() - 75);
            jellies[i].swapClass("jelly-svg-on", "jelly-svg-off");
            jellies[i].setInPlay(false);
            sounds.play("splash");

         // If the jelly is close to the table, let it move out of the screen
         } else {
            jellies[i].move();
         }
      }

      // If a jelly has fallen off the screen, remove it from the game
      if (jellies[i].getY() > document.body.offsetHeight) {
         jellies[i].setInPlay(false);
         jellies[i].remove();
         jellies.splice(i, 1);
      }
   }

   // Auto generate more jellies
   if (dude.isDead) {
      if (parseInt(Math.random() * 100) == 7) {
         newJelly();
      }
   } else {
      if (parseInt(Math.random() * 100) % 45 == 0) {
         newJelly();
      }
   }
}


// ------------------------------------------------------------
// The hero has eaten more jellies, so his health needs to go down
// ------------------------------------------------------------
function getSick() {
   // Lower the hero's health
   health.sickLevel -= jellyHP;
   health.style.width = health.sickLevel + "%";

   // If the player still has no more health, end the game
   if (health.sickLevel <= 0) {

      health.style.width = "0%";

      sounds.fadeOut("background", 0.1, 10);
      sounds.fadeOut("splash", 0.1, 10);
      sounds.fadeOut("boing", 0.1, 10);
      sounds.fadeOut("bounce", 0.1, 10);

      sounds.play("game-over");
      

      document.body.removeEventListener("keyup", doOnKeyUp);
      document.body.removeEventListener("keydown", doOnKeyDown);
      dude.isMoving.left = false;
      dude.isMoving.right = false;
      dude.classList.add("die");
      dude.style.left = "5%";
      dude.isDead = true;

      setTimeout(function() {
         stopGame();
      }, 2000);
   }
}


// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function doOnKeyDown(event){
   switch (event.which) {

   case 39: /* Right */
     dude.isMoving.right = true;
   break;

   case 37: /* Left */
     dude.isMoving.left = true;
   break;
   }
}


// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function doOnKeyUp(event){
   switch (event.which) {

   case 39: /* Right */
     dude.isMoving.right = false;
   break;

   case 37: /* Left */
     dude.isMoving.left = false;
   break;
   }
}


// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function doOnDragOver(event) {
   event.preventDefault();
   document.querySelector("#bowl-top-faux-target").style.opacity = 1.0;
}

// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function doOnDragStart(event) {
   if (bowlTop.isReady) {
      event.target.style.opacity = 0.0;
      event.dataTransfer.setDragImage(bowlTop, 100, 60);
   }
}

// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function doOnDragEnd(event) {
   event.target.style.opacity = 1.0;
   document.querySelector("#bowl-top-faux-target").style.opacity = 0.0;
}

// ------------------------------------------------------------
// 
// ------------------------------------------------------------
function doOnDragLeave(event) {
   document.querySelector("#bowl-top-faux-target").style.opacity = 0.0;
}
