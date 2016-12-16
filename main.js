/*
	TODO:
		* optimize varibale  dez
*/

var mobsKilled = 0;

function init() {
	console.log("initialized");
	
	var mapId = 0,
	map = loadMap(mapId),
	mapWidth = map[0].length,
	mapHeight = map.length;
	
	canvas = document.getElementById("game");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var numRays = canvas.width/2;
	var ctx = canvas.getContext('2d');
	
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
	ctx.msImageSmoothingEnabled = false;
	ctx.imageSmoothingEnabled = false;

	var stripWidth = 2;
	var viewDist = (canvas.width / 2) / Math.tan((Math.PI/4*1.005));
	var miniMapScale = 16;
	var screenStrips = [];
	
	var c = 0;
	var fps = 0;
	var lastGameCycleTime = new Date().getTime();
	var drawLastTime = true;
	
	var wallImg = new Image();
	var weaponImg = new Image();
	var mobsImg = new Image();

	var weaponId = 0;
	var weaponPow = [2, 4, 6];
	var weaponScale = 1;
	
	var visibleSprites = [];
	
	var imgToDraw = [];
	
	//--------- GENERATING CHARACTERS ----------
	var mobs = [];
	var i = 0;
	while(i < 20) {
		var cx = Math.round(Math.random() * (mapWidth - 1));
		var cy = Math.round(Math.random() * (mapHeight - 1));
		var ct = Math.round(Math.random() * 3);
		if (map[cy][cx] == 0) {
			mobs.push(loadMob(cx, cy, ct));
			i++;
		}
	}
	var mobsMap = createArray(mapHeight, mapWidth);
	
	for (var y = 0; y < mapHeight; y++) {
		for (var x = 0; x < mapWidth; x++) {
			if (map[y][x] < 0) {
				var player = {
					x : x,
					y : y,
					rot : (map[y][x] + 1) * Math.PI / 2,
					dir : 0,
					rotSpeed : Math.PI / 40,
					speed : 0,
					moveSpeed : 0.05,
					isMoving : false,
					isFighting : false,
					count: 0,
					maxHp: 50,
					hp: 0
				}
			}
		}
	}
	
	player.hp = player.maxHp;
			
	for (var i = 0; i < mobs.length; i++) {
		mobsMap[mobs[i].y][mobs[i].x] = mobs[i];
	}
	
	refreshMobMap();
	
	function refreshMobMap() {
		for (var y = 0; y < mapHeight; y++) {
			for (var x = 0; x < mapWidth; x++) {
				mobsMap[y][x] = null;
			}
		}
		for (var i = 0; i < mobs.length; i++) {
			mobsMap[mobs[i].y][mobs[i].x] = mobs[i];
		}
	}
	
	function createArray(m, n) {
	    var a = [];
		for (var i = 0; i < m; i++)
		    a.push([]);
		return a;
	}
	
	//--------- KEYBOARD HANDLER ----------
	
	window.onkeydown = function(e) {
		e = e || window.event;
		
		switch (e.keyCode) {
			case 38:
				if (!player.isMoving && !player.isFighting) {
					player.isMoving = true;
					player.speed = 1;
					player.count = 20;
				} break;
			case 40:
				if (!player.isMoving && !player.isFighting) {
					player.isMoving = true;
					player.speed = -1;
					player.count = 20;
				} break;
			case 37:
				if (!player.isMoving && !player.isFighting) {
					player.isMoving = true;
					player.dir = -1;
					player.count = 20;
				} break;
			case 39:
				if (!player.isMoving && !player.isFighting) {
					player.isMoving = true;
					player.dir = 1;
					player.count = 20;
				}  break;
			case 13:
			case 90:
			case 32:
				if (!player.isMoving && !player.isFighting) {
					player.isFighting = true;
					player.count = 10;
				}  break;
		}
	}
	
	//--------- GAME CYCLE ----------
	
	function gameCycle() {
		weaponScale = canvas.height/64;
		var now = new Date().getTime();
		var timeDelta = now - lastGameCycleTime;
		if (timeDelta > 1000/3)
			timeDelta = 1000/3;
		move(timeDelta);

		var cycleDelay = 1000 / 60;
		
		if (timeDelta > cycleDelay) {
			cycleDelay = Math.max(1, cycleDelay - (timeDelta - cycleDelay))
		}

		lastGameCycleTime = now;
		
		if (player.isMoving || player.isFighting) {
			draw();
			//drawFps();
			drawLastTime = true;
		} else {
			if (drawLastTime) {
				draw();
				//drawFps();
				drawLastTime = false;
			}
		}
		c++;
		window.requestAnimationFrame(gameCycle);
	}

	//--------- COUNT FPS -----------
	
	function count() {
		fps = c;
		c = 0;
		setTimeout(count, 1000);
	}
	
	//-------- DRAW FPS ------------
	
	function drawFps() {
		ctx.fillStyle = "rbg(0,0,0)";
		ctx.font = "20px 'Press Start 2P'";
		ctx.fillText(fps, canvas.width/2, 50);
	}
	
	//---------- DRAW SCENE ----------
	
	function draw() {
		imgToDraw = [];
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#603000';
		ctx.fillRect(0, 0, canvas.width, canvas.height/2);
		ctx.fillStyle = '#804000';
		ctx.fillRect(0, canvas.height/2, canvas.width, canvas.height);
		//clearSprites();
		castRays();
		renderSprites();
		var weaponSize = 32 * weaponScale;
		imgToDraw.sort(function(a, b){return b[0] - a[0]});
		for (i = 0; i < imgToDraw.length; i++) {
			ctx.drawImage(imgToDraw[i][1], imgToDraw[i][2], imgToDraw[i][3], imgToDraw[i][4], imgToDraw[i][5], imgToDraw[i][6], imgToDraw[i][7], imgToDraw[i][8], imgToDraw[i][9]);
			if (imgToDraw[i][1] == mobsImg) {
				sprite = imgToDraw[i][10];
				size = imgToDraw[i][11]; 
				ctx.lineWidth = size/128;
				x = imgToDraw[i][12];
				ctx.strokeStyle = "#000000";
				ctx.fillStyle = "#FF0000";
				ctx.fillRect(canvas.width / 2 + x - size / 2, canvas.height / 2 - size/4 - size/16, size / sprite.maxHp * sprite.hp, size / 16);
				ctx.strokeRect(canvas.width / 2 + x - size / 2, canvas.height / 2 - size/4 - size/16, size, size / 16);
				ctx.fillStyle = "#FFFFFF";
				ctx.font = Math.floor(size/8) + "px 'Press Start 2P'";
				ctx.textAlign = "center";
				ctx.fillText(sprite.name, canvas.width / 2 + x, canvas.height / 2 - size/4 - size/16);
				ctx.strokeText(sprite.name, canvas.width / 2 + x, canvas.height / 2 - size/4 - size/16);
			}
		}
		ctx.drawImage(weaponImg, player.isFighting * 32, weaponId * 32, 32, 32, canvas.width/2 - weaponSize/2, canvas.height - weaponSize, weaponSize, weaponSize);
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "#FF0000";
		ctx.lineWidth = 2;
		ctx.fillRect(canvas.width / 4, 16, (canvas.width / 2 / player.maxHp * player.hp) , 32);
		ctx.strokeRect(canvas.width / 4, 16, canvas.width / 2, 32);
	}
	
	//---------- MOVE CHARACTERS ---------
	
	function move(timeDelta) {
		if (player.isMoving) {
			var mul = timeDelta / (1000 / 60);
			
			var moveStep = mul * player.speed * player.moveSpeed;
			
			if (player.speed != 0) {
				newX = player.x + Math.cos(player.rot) * moveStep;
				newY = player.y + Math.sin(player.rot) * moveStep;
				
				if (isBlocking(newX, newY)) {
					for (var i = 0; i < mobs.length; i++) {
						mobs[i].x = Math.round(mobs[i].x);
						mobs[i].y = Math.round(mobs[i].y);
						mobs[i].angle = -1;
					}
					refreshMobMap();
					player.speed = 0;
					player.isMoving = false;
					player.x = Math.round(player.x);
					player.y = Math.round(player.y);
					return;
				}
				
				player.x = newX;
				player.y = newY;
				
				//move enemies
				
				for (var i = 0; i < mobs.length; i++) {
					var mob = mobs[i];
					if (mob.type == "enemy") {
						var dx = mob.x - player.x;
						var dy = mob.y - player.y;
						if (mob.angle == -1) {
							if (Math.abs(dx) >= Math.abs(dy)) {
								if (dx < 0)
									mob.angle = 0;
								else
									mob.angle = -Math.PI;
														
								var newMX = mob.x + Math.cos(mob.angle) * player.moveSpeed * mul;
								var newMY = mob.y + Math.sin(mob.angle) * player.moveSpeed * mul;
								
								if (isMobBlocking(newMX, newMY, mob))
									if (dy < 0)
										mob.angle = -Math.PI/2*3;
									else
										mob.angle = -Math.PI/2;
							} else {
								if (dy < 0)
									mob.angle = -Math.PI/2*3;
								else
									mob.angle = -Math.PI/2;
														
								var newMX = mob.x + Math.cos(mob.angle) * player.moveSpeed * mul;
								var newMY = mob.y + Math.sin(mob.angle) * player.moveSpeed * mul;
								
								if (isMobBlocking(newMX, newMY, mob))
									if (dx < 0)
										mob.angle = 0;
									else
										mob.angle = -Math.PI;
							}
						}
						var newMX = mob.x + Math.cos(mob.angle) * player.moveSpeed * mul;
						var newMY = mob.y + Math.sin(mob.angle) * player.moveSpeed * mul;
						var distance = Math.sqrt((mob.y - player.y)*(mob.y - player.y) + (mob.x - player.x)*(mob.x - player.x));
						if (Math.abs(distance - 2) > 0.1 && distance > Math.sqrt(2)) {
							if (!isMobBlocking(newMX, newMY, mob)) {
								mob.x = newMX;
								mob.y = newMY;
							}
						}
					}
				}
				
				player.count -= timeDelta * 60 / 1000;
				if (player.count <= 0) {
					for (var i = 0; i < mobs.length; i++) {
						mobs[i].x = Math.round(mobs[i].x);
						mobs[i].y = Math.round(mobs[i].y);
						mobs[i].angle = -1;
					}
					refreshMobMap();
					player.x = Math.round(player.x);
					player.y = Math.round(player.y);
					player.isMoving = false;
					player.speed = 0;
				}
			}
			if (player.dir != 0) {
				player.rot += mul * player.dir * player.rotSpeed;
				player.count -= timeDelta * 60 / 1000;
				if (player.count <= 0) {
					player.rot = (Math.round(player.rot / (Math.PI / 2)) * (Math.PI / 2)) % (Math.PI * 2);
					if (player.rot < 0)
						player.rot += Math.PI * 2;
					player.isMoving = false;
					player.dir = 0;
				}
			}
		}
		if (player.isFighting) {
			var mul = timeDelta / (1000 / 60);
			player.count -= timeDelta * 60 / 1000;
			if (player.count <= 0) {
				newX = player.x + Math.cos(player.rot) * 0.1;
				newY = player.y + Math.sin(player.rot) * 0.1;
				player.isFighting = false;
				attackEnemy(newX, newY);
			}
		}
	}
	
	function isBlocking(x, y) {
		if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth) {
			return true;
		}
		return (map[Math.floor(y)][Math.floor(x)] > 0) || (map[Math.ceil(y)][Math.ceil(x)] > 0) ||
			   (mobsMap[Math.floor(y)][Math.floor(x)] != null) || (mobsMap[Math.ceil(y)][Math.ceil(x)] != null);
	}
	
	function isMobBlocking(x, y, mob) {
		if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth) {
			return true;
		}
		return (map[Math.floor(y)][Math.floor(x)] > 0) || (map[Math.ceil(y)][Math.ceil(x)] > 0) ||
			   ((Math.floor(y) == Math.floor(player.y)) && (Math.floor(x) == Math.floor(player.x))) ||
			   ((Math.ceil(y) == Math.ceil(player.y)) && (Math.ceil(x) == Math.ceil(player.x))) ||
			   (mobsMap[Math.floor(y)][Math.floor(x)] != null && mobsMap[Math.floor(y)][Math.floor(x)] != mob) ||
			   (mobsMap[Math.ceil(y)][Math.ceil(x)] != null && mobsMap[Math.ceil(y)][Math.ceil(x)] != mob);
	}
	
	//----------- ATTACK ENEMY --------------
	function attackEnemy(x, y) {
		if (mobsMap[Math.floor(y)][Math.floor(x)] != null) {
			mob = mobsMap[Math.floor(y)][Math.floor(x)];
			mob.hp -= weaponPow[weaponId];
			if (mob.hp <= 0) {
				destroyMob(mob.x, mob.y);
				mobsMap[Math.floor(y)][Math.floor(x)] = null;
				mobsKilled++;
			}
			//enemies attack
			for (var i = 0; i < mobs.length; i++) {
				var moba = mobs[i];
				var distance = Math.sqrt((moba.y - player.y)*(moba.y - player.y) + (moba.x - player.x)*(moba.x - player.x));
				if (distance < 1.01) {
					player.hp--;
					if (player.hp <= 0)
						gameOver();
				}
			}
		} else {
			if (mobsMap[Math.ceil(y)][Math.ceil(x)] != null) {
				mob = mobsMap[Math.ceil(y)][Math.ceil(x)];
				mob.hp -= weaponPow[weaponId];
				if (mob.hp <= 0) {
					destroyMob(mob.x, mob.y);
					mobsMap[Math.ceil(y)][Math.ceil(x)] = null;		
					mobsKilled++;
				}
				//enemies attack
				for (var i = 0; i < mobs.length; i++) {
					var moba = mobs[i];
					var distance = Math.sqrt((moba.y - player.y)*(moba.y - player.y) + (moba.x - player.x)*(moba.x - player.x));
					if (distance < 1.01) {
						player.hp--;
						if (player.hp <= 0)
							gameOver();
					}
				}
			}
		}
	}
	
	function destroyMob(x, y) {
		for (var i = 0; i < mobs.length; i++) {
			if (Math.floor(mobs[i].x) == x && Math.floor(mobs[i].y) == y) {
				mobs.splice(i, 1);
				i--;
			}
		}
	}
	
	var stripIdx = 0;
	
	//----------- CASTING ALL RAYS ----------
	
	function castRays() {
		numRays = canvas.width / 2;
		viewDist = (canvas.width / 2) / Math.tan((Math.PI/4*1.005));
		stripIdx = 0;
		for (var i=0; i < numRays; i++) {
			var rayScreenPos = (-numRays/2 + i) * stripWidth;
			
			var rayViewDist = Math.sqrt(rayScreenPos*rayScreenPos + viewDist*viewDist);
			
			var rayAngle = Math.asin(rayScreenPos / rayViewDist);
			castSingleRay(player.rot + rayAngle, stripIdx++);
		}
	}
	
	//-------- CASTING SINGLE RAY ---------
	
	function castSingleRay(rayAngle, wallType) {
		var playerX = player.x + 0.5;
		var playerY = player.y + 0.5
		
		rayAngle %= Math.PI * 2;
		if (rayAngle < 0) rayAngle += Math.PI * 2;

		var right = (rayAngle > Math.PI * 2 * 0.75 || rayAngle < Math.PI * 2 * 0.25);
		var up = (rayAngle < 0 || rayAngle > Math.PI);
		
		var angleSin = Math.sin(rayAngle);
		var angleCos = Math.cos(rayAngle);


		var dist = 0;
		var xHit = 0;
		var yHit = 0;

		var textureX;
		var wallX;
		var wallY;
		
		// -------- VERTICAL CHECK ---------
		
		var slope = angleSin / angleCos;
		var dX = right ? 1 : -1;
		var dY = dX * slope;

		var x = right ? Math.ceil(playerX) : Math.floor(playerX);
		var y = playerY + (x - playerX) * slope;

		while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
			var wallX = Math.floor(x + (right ? 0 : -1));
			var wallY = Math.floor(y);

			if (map[wallY][wallX] > 0) {

				var distX = x - playerX;
				var distY = y - playerY;
				dist = distX*distX + distY*distY;

				wallType = map[wallY][wallX];
				
				textureX = y % 1;
				if (!right) textureX = 1 - textureX;

				xHit = x;
				yHit = y;
				xWallHit = wallX;
				yWallHit = wallY;

				break;
			}
			x += dX;
			y += dY;
		}
		
		// ------- HORIZONTAL CHECK --------

		var slope = angleCos / angleSin;
		var dY = up ? -1 : 1;
		var dX = dY * slope;
		var y = up ? Math.floor(playerY) : Math.ceil(playerY);
		var x = playerX + (y - playerY) * slope;

		while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
			var wallY = Math.floor(y + (up ? -1 : 0));
			var wallX = Math.floor(x);
			
			if (map[wallY][wallX] > 0) {
				var distX = x - playerX;
				var distY = y - playerY;
				var blockDist = distX*distX + distY*distY;
				
				wallType = map[wallY][wallX];
				if (!dist || blockDist < dist) {
					dist = blockDist;
					xHit = x;
					yHit = y;
					xWallHit = wallX;
					yWallHit = wallY;
					textureX = x % 1;
					if (up) textureX = 1 - textureX;
				}
				break;
			}
			x += dX;
			y += dY;
		}

		wallType = map[Math.floor(yHit+0.0001)][Math.floor(xHit+0.0001)];
		if (Math.round(wallType) <= 0) {
			wallType = map[Math.floor(yHit-0.0001)][Math.floor(xHit-0.0001)];
		}
		
		//----------- DRAWING RAY ------------
		
		if (dist) {
			dist = Math.sqrt(dist);

			dist = dist * Math.cos(player.rot - rayAngle);

			var height = 1 * Math.round(viewDist / dist);

			var width = height * stripWidth;

			var top = Math.round((canvas.height - height) / 2);
			
			var stripHeight = height;
			var stripTop = top;
			var stripLeft = Math.floor(stripIdx * stripWidth);

			var stripImgHeight = Math.floor(height);
			var stripImgWidth = Math.floor(width*2);
			var stripImgTop = 32*(wallType-1);

			stripImgHeight = 32;
			stripImgWidth = stripWidth * 32 / stripHeight;
			var stripImgLeft = Math.floor(textureX*32);
			if (stripImgLeft < 0)
				stripImgLeft = 0;
			if (stripImgLeft > 32 - stripImgWidth)
				stripImgLeft = 32 - stripImgWidth;
				
			var dwx = xWallHit - player.x;
			var dwy = yWallHit - player.y;
				
			var wallDist = dwx*dwx + dwy*dwy;
				
			imgToDraw.push([Math.floor(wallDist), wallImg, stripImgLeft, stripImgTop, stripImgWidth, stripImgHeight, stripLeft, stripTop, stripWidth, stripHeight])
		}
	}
	
	// ----------- CLEARING SPRITES ------------

	function clearSprites() {
		for (var i = 0; i < visibleSprites.length; i++) {
			var sprite = visibleSprites[i];
			sprite.visible = false;
		}
		visibleSprites = [];
	}

	// ----------- RENDERING SPRITES ----------

	function renderSprites() {
		for (var i = 0; i < mobs.length; i++) {
			var sprite = mobs[i];
			var id = sprite.id;
			var dx = sprite.x - player.x;
			var dy = sprite.y - player.y;
			// Angle relative to player direction
			var angle = Math.atan2(dy, dx) - player.rot;
			// Make angle from +/- PI
			if (angle < -Math.PI) angle += 2*Math.PI;
			if (angle >= Math.PI) angle -= 2*Math.PI;
			// Is enemy in front of player?
			if (angle > -Math.PI*0.5 && angle < Math.PI*0.5) {
				var distSquared = dx*dx + dy*dy;
				var dist = Math.sqrt(distSquared);
				var size = viewDist / (Math.cos(angle) * dist);
				var x = Math.tan(angle) * viewDist;
				
				
				var sx = (id % 4) * 32;
				var sy = Math.floor(id / 4) * 32;
				
				imgToDraw.push([distSquared, mobsImg, sx, sy, 32, 32, canvas.width / 2 + x - size / 2, canvas.height / 2 - size / 4 - size / 16 - size/32, size, size, sprite, size, x]);
			}
		}
	}
	
	count();
	var imgs = [wallImg, weaponImg, mobsImg],
    len = imgs.length,
    counter = 0;

	[].forEach.call(imgs, function(img) {
		img.addEventListener('load', incrementCounter, false);
	} );

	function incrementCounter() {
		counter++;
	}
	
	document.fonts.ready.then(loading);
	
	function loading() {
		if (counter === len) {
			requestAnimationFrame(gameCycle);
		} else {
			console.log(document.fonts.check("10px 'Press Start 2P'"))
			requestAnimationFrame(loading);
		}
	}
	
	wallImg.src = "walls" + mapId + ".png";
	weaponImg.src = "weapons.png";
	mobsImg.src = "mobs.png";
	
	window.onresize = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;
		draw();
	}
}

function loadMap(n)	{
	switch (n) {
		case 0:
			return [
				[4,4,3,2,2,5,1,4,5,3,4,4,2,5,2,5,3,1,2,3,3,4,2,1,4,3,4,1,5,3,2,1],
				[2,-4,4,0,1,0,3,0,2,0,7,0,6,5,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
				[3,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,2,0,1,4,2,1,2,3,4,4,2,0,1,2,6,1],
				[3,0,4,0,1,3,2,7,2,1,5,0,0,0,4,0,3,0,1,0,0,0,0,0,0,0,0,0,1,0,0,6],
				[3,0,4,0,0,0,0,0,0,0,6,0,0,0,7,0,2,0,1,0,2,3,4,1,1,3,1,2,6,0,0,4],
				[1,0,2,3,5,7,2,1,2,0,4,0,0,0,1,0,3,0,1,0,6,0,0,0,0,0,0,0,2,0,0,4],
				[3,0,0,0,0,0,0,0,1,0,7,0,0,0,4,0,1,0,0,0,2,0,4,0,1,0,0,0,1,0,0,1],
				[2,0,4,0,0,2,7,3,6,0,1,4,0,0,2,0,4,0,5,3,2,0,1,0,2,0,0,0,0,0,0,4],
				[2,0,2,0,0,0,0,0,3,0,0,0,0,0,2,0,1,0,0,0,4,0,4,0,4,0,0,3,0,2,0,1],
				[2,0,1,0,1,3,4,0,1,5,6,1,0,0,3,0,2,1,4,0,3,0,2,0,1,0,0,7,0,1,0,2],
				[1,0,3,0,0,2,0,0,0,0,0,0,0,0,4,0,6,0,0,0,1,0,3,1,4,0,1,3,7,1,2,4],
				[3,0,1,0,0,6,0,0,3,0,0,0,0,0,0,0,1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,3],
				[1,0,3,0,4,1,0,0,1,0,0,2,3,1,3,5,4,1,3,3,2,0,6,0,1,0,0,0,0,0,0,1],
				[3,0,2,0,0,0,0,0,3,0,0,3,0,0,0,1,0,0,0,0,0,0,2,0,6,1,2,3,3,3,0,3],
				[3,0,5,0,0,0,0,0,3,0,0,3,0,1,0,3,0,2,0,1,0,0,3,0,3,0,0,0,3,0,0,6],
				[2,0,1,7,1,2,4,3,6,0,0,0,0,2,0,0,0,7,0,1,0,0,1,0,6,0,2,0,0,0,3,1],
				[1,2,1,4,3,7,2,1,1,4,2,3,1,1,1,4,2,1,3,7,4,1,1,3,1,2,4,7,2,1,2,1]
				];
		break;
	}
}

function loadMobs(n) {
	switch (n) {
			case 0:
				return [loadMob(1, 5, 0),
						loadMob(1, 10, 3),
						loadMob(3, 7, 2),
						loadMob(7, 6, 1),];
			break;
		}
}

function loadMob(tx, ty, id) {
	switch (id) {
		case 0:
			return {
				x : tx,
				y : ty,
				type : "enemy",
				name : "КРЫСА",
				id : 0,
				pow : 1,
				maxHp : 10,
				hp : 10,
				angle : -1,
				visible : false
			}
		break;
		case 1:
			return {
				x : tx,
				y : ty,
				type : "enemy",
				name : "ПАУК",
				id : 1,
				pow : 1,
				maxHp : 15,
				hp : 15,
				angle : -1,
				visible : false
			}
		break;
		case 2:
			return {
				x : tx,
				y : ty,
				type : "enemy",
				name : "ЛЕТУЧАЯ МЫШЬ",
				id : 2,
				pow : 1,
				maxHp : 10,
				hp : 10,
				angle : -1,
				visible : false
			}
		break;
		case 3:
			return {
				x : tx,
				y : ty,
				type : "enemy",
				name : "КОБРА",
				id : 3,
				pow : 1,
				maxHp : 20,
				hp : 20,
				angle : -1,
				visible : false
			}
		break;
	}
}

function gameOver() {
	document.body.style.backgroundColor = "#000";
	document.body.innerHTML = '<div id="gameover" style="margin-top: 320px; text-align: center; color: #FFF; font-family: \'Press Start 2P\'">GAME OVER<br />ENEMIES KILLED:' + mobsKilled + '</div>';
}