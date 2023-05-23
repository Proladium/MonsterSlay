// Get a reference to the canvas
var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

// Game state variables
var gameOver = false;
// Reference to health display element
var healthDisplay = document.getElementById('health');
// Variable to store font-size for the health text
var healthFontSize = 20;
// Define arrows
var arrows = [];
// Define powerups
var powerUps = [];
// Player controls
var keys = {
    left: false,
    right: false,
    up: false,
    space: false, // Attack key
    w: false // Switch weapon key
};
// Define the waves
let waves = [
    { numMonsters: 1, speed: 1 },
    // Level 1
    { numMonsters: 1, speed: 1 },
    // Level 2
    { numMonsters: 2, speed: 1.5 },
    // Level 3
    { numMonsters: 3, speed: 2 },
    // Level 4
    { numMonsters: 4, speed: 2.5 },
    // Level 5
    { numMonsters: 1, speed: 6 },
    // Level 6
    { numMonsters: 6, speed: 1 },
    // level 7
    { numMonsters: 7, speed: 3.7 },
    // level 8
    { numMonsters: 8, speed: 3.9 },
    // level 9
    { numMonsters: 9, speed: 4.1 },
    // level 10
    { numMonsters: 20, speed: 1 },
    // level 11
    { numMonsters: 3, speed: 10 },
    // level 12
    { numMonsters: 1, speed: 6.5 },
    // level 13
    { numMonsters: 13, speed: 7 },
    // level 14
    { numMonsters: 14, speed: 7.5 },
    // level 15
    { numMonsters: 15, speed: 8 },
    // level 16
    { numMonsters: 40, speed: 1 },
    // level 17
    { numMonsters: 17, speed: 9 },
    // Level 18
    { numMonsters: 18, speed: 9.5 },
    // Level 19
    { numMonsters: 19, speed: 10 },
    // level 20
    { numMonsters: 20, speed: 13 },
    // ...add more waves as needed...
  ];
  let currentWave = 0;
  let monstersDefeated = 0;

// Define the weapons
var weapons = [
    { name: 'Sword', type: 'melee', damage: 10, range: 50 },
    { name: 'Bow', type: 'ranged', damage: 5, range: 100 }
];

// Define our player
var player = {
    x: 0,
    y: 0,
    vy: 0, // Vertical velocity
    health: 100,
    weapon: weapons[0], // Start with the first weapon
    jump: 0,
    swordCooldown: false, // Flag to track whether player is in sword cooldown period
    swordCooldownDuration: 50, // Duration of the sword attack cooldown in milliseconds
    bowCooldown: false, // Flag to track whether player is in bow cooldown period
    bowCooldownDuration: 100, // Duration of the bow attack cooldown in milliseconds
    lastSwordAttackTime: 0, // Timestamp of the last sword attack
    lastBowAttackTime: 0, // Timestamp of the last bow attack

    lasHitTime: 0, // Timestamp of the last time the player was hit
    hitCooldownDuration: 100, // Duration of the invulnerability period after being hit, in milliseconds

    attack: function() {
        // Check if the player is in cooldown period based on the weapon type
        if (this.weapon.name === 'Sword' && this.swordCooldown) {
            return; // Abort attack if in sword cooldown
        } else if (this.weapon.name === 'Bow' && this.bowCooldown) {
            return; // Abort attack if in bow cooldown
        }

        if (this.weapon.name === 'Sword') {
            // Check for collision with monsters
            for (var i = 0; i < monsters.length; i++) {
                var monster = monsters[i];
                var dx = monster.x - this.x;
                var dy = monster.y - this.y;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.weapon.range) { // If the player and monster are within sword range
                    monster.health -= this.weapon.damage;
                    if (monster.health <= 0) {
                        monsters.splice(i, 1); // Remove the monster from the array
                        console.log('Monster ' + i + ' died!');
                        monstersDefeated++;
                    }
                }
            }

            // Update the sword attack cooldown variables
            this.swordCooldown = true;
            this.lastSwordAttackTime = Date.now();

            // Start a timer to reset the sword attack cooldown
            setTimeout(() => {
                this.swordCooldown = false;
            }, this.swordCooldownDuration);
        } else if (this.weapon.name === 'Bow') {
            // Create a new arrow object and add it to the arrows array
            // Find the closest monster
            var closestMonster = null;
            var closestDistance = Infinity;
            for (var i = 0; i < monsters.length; i++) {
                var monster = monsters[i];
                var dx = monster.x - this.x;
                var dy = monster.y - this.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closestDistance) {
                    closestMonster = monster;
                    closestDistance = distance;
                }
            }
            // If there is a closest monster, aim the arrow towards it
            if (closestMonster !== null) {
                var dx = closestMonster.x - this.x;
                var dy = closestMonster.y - this.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                var vx = (dx / distance) * 5; // 5 is the speed of the arrow
                var vy = (dy / distance) * 5;
                arrows.push({ x: this.x, y: this.y, vx: vx, vy: vy, damage: this.weapon.damage });
            }

            // Update the bow attack cooldown variables
            this.bowCooldown = true;
            this.lastBowAttackTime = Date.now();

            // Start a timer to reset the bow attack cooldown
            setTimeout(() => {
                this.bowCooldown = false;
            }, this.bowCooldownDuration);
        }
    },

    switchWeapon: function() {
        var currentWeaponIndex = weapons.indexOf(this.weapon);
        var nextWeaponIndex = (currentWeaponIndex + 1) % weapons.length;
        this.weapon = weapons[nextWeaponIndex];
        document.getElementById('weapon').textContent = "Current Weapon: " + this.weapon.name;
    }
};



// Define our platform
var platform = {
    x: 0,
    y: 400,
    width: canvas.width,
    height: 10
};

// Define our monsters
var monsters = [];

// Gravity constant
var gravity = 1;


// Power-up types and functions
// Define the types of power-ups
var powerUpTypes = [
    { name: 'Health Pack', effect: function(player) { player.health = Math.min(player.health + 50, 100); } },
    { name: 'Damage Booster', effect: function(player) { player.weapon.damage *= 2; setTimeout(function() { player.weapon.damage /= 2; }, 10000); } },
    { name: 'Speed Booster', effect: function(player) { player.speed *= 2; setTimeout(function() {player.speed /= 2; }, 10000); } }
];

// Function to create a new power-up
function createPowerUp() {
    var type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

    // Define the range within which power-ups can spawn vertically
    var verticalSpawnRange = 10; // Adjust this value as needed

    // Calculate the minimum and maximum y coordinates for power-up spawn
    var minY = Math.max(player.y - verticalSpawnRange, 0);
    var maxY = Math.min(player.y + verticalSpawnRange, canvas.height);

    // Generate random x and y coordinates within the defined range
    var x = Math.random() * canvas.width; // Power-ups can spawn anywhere horizontally
    var y = Math.random() * (maxY - minY) + minY; // Power-ups spawn within the defined vertical range

    powerUps.push({ type: type, x: x, y: y });
}

// Update power-ups
function updatePowerUps() {
    for (var i = 0; i < powerUps.length; i++) {
        var powerUp = powerUps[i];
        var dx = powerUp.x - player.x;
        var dy = powerUp.y - player.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) { // If the player and power-up are touching
            powerUp.type.effect(player); // Apply the power-up's effect
            powerUps.splice(i, 1); // Remove the power-up from the array
            console.log('Power-up ' + powerUp.type.name + ' collected!');
        }        
    }
}

// Render power-ups
function renderPowerUps() {
    for (var i = 0; i < powerUps.length; i++) {
        var powerUp = powerUps[i];
        // Set color based on power-up type
        switch (powerUp.type.name) {
            case 'Health Pack':
                ctx.fillStyle = '#0f0'; // Green
                break;
            case 'Damage Booster':
                ctx.fillStyle = '#f00'; // Red
                break;
            case 'Speed Booster':
                ctx.fillStyle = '#00f'; // Blue
                break;
        }
        ctx.fillRect(powerUp.x, powerUp.y, 50, 50);
    }
}


// Player functions
// Define our player
function updatePlayer() {
    if (keys.left && player.x > 0) {
      player.x -= 10; // Adjust this value to alter the player speed
    }
    if (keys.right && player.x < canvas.width - 50) { // assuming the player's width is 50
      player.x += 10;
    }
    if (keys.up && player.y === platform.y - 50) { // Only allow the player to jump if they're standing on the platform
        player.vy = -10;
    }

    // Apply gravity
    player.vy += gravity;

    // Move player vertically
    player.y += player.vy;

    // Collision detection with platform
    if (player.y > platform.y - 50) {
        player.y = platform.y - 50;
        player.vy = 0;
        player.jumps = 0; // Reset jumps
    }

    // Attack
    if (keys.space) {
        player.attack();
    }

    // Switch weapon
    if (keys.w) {
        player.switchWeapon();
    }

    // Check for collision with monsters
    for (var i = 0; i < monsters.length; i++) {
        var monster = monsters[i];
        var dx = monster.x - player.x;
        var dy = monster.y - player.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50) { // If the player and monster are touching
            var currentTime = Date.now();
            if (currentTime - player.lastHitTime > player.hitCooldownDuration) { // If the player is not in the invulnerability period
                player.health -= monster.damage; // Reduce the player's health by the monster's damage
                player.lastHitTime = currentTime; // Update the last hit time
                healthDisplay.textContent = "Health: " + player.health; // Update health display
                if (player.health <= 0) {
                    player.health = 0; // Ensure doesn't go below 0
                    gameOver = true;
                    // Game over
                    console.log("Game Over");
                    return;
                }
            }
        }                
    }
}

// Render player
function renderPlayer() {
    ctx.fillStyle = '#00f'; // Blue
    ctx.fillRect(player.x, player.y, 50, 50);

    // Draw the player's health bar above the player
    drawHealthBar(player, 100, player.health, player.x, player.y - 10, 50, 5);
}


// Platform functions
function renderPlatform() {
    ctx.fillStyle = 'white'; // Green
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
}


// Monster functions
// Function to create a new monster
function createMonster(type, x, y, health, speed, vy) {
    var damage = 10; // Set the damage each monster can inflict
    return { x: x, y: y, health: health, damage: damage, speed: speed, type: type, vy: vy };
}

// Function to create monster
function createMonsters() {
    monsters = [];
  
    var wave = waves[Math.min(currentWave, waves.length - 1)];
  
    for (var i = 0; i < wave.numMonsters; i++) {
      var monsterHealth = 50 + currentWave * 10;
      var monsterSpeed = wave.speed;
      var monsterType = i % 2 === 0 ? 'walking' : 'flying'; // Alternate between walking and flying
      monsters.push(createMonster(monsterType, canvas.width + i * 50, platform.y - 50, monsterHealth, 1, monsterSpeed, 0));
    }
}

// Update monsters
function updateMonsters() {
    for (var i = 0; i < monsters.length; i++) {
      var monster = monsters[i];
  
      // Move monster towards player
      if (monster.x < player.x && monster.x < canvas.width - 50) { // assuming the monster's width is 50
        monster.x += monster.speed;
      } else if (monster.x > player.x && monster.x > 0) {
        monster.x -= monster.speed;
      }

        // If the monster is flying, make it move up and down
        if (monster.type === 'flying') {
            // If the player is below the monster, make it dive down
            if (player.y > monster.y) {
                monster.vy = 2;
            } else {
                monster.vy = -2;
            }
            monster.y += monster.vy;
        }

        // If the monster is walking and the player is above it, make it jump
        if (monster.type === 'walking' && player.y < monster.y) {
            monster.vy = -10; // This value may need to be adjusted
        }

        // Apply gravity to the monster
        monster.vy += gravity;

        // Move monster vertically
        monster.y += monster.vy;

        // Collision detection with platform
        if (monster.y > platform.y - 50) {
            monster.y = platform.y - 50;
            monster.vy = 0;
        }
    }
}

// Render monsters
function renderMonsters() {
    ctx.fillStyle = '#f00'; // Red
    for (var i = 0; i < monsters.length; i++) {
        var monster = monsters[i];
        ctx.fillRect(monster.x, monster.y, 50, 50);

        // Draw the monster's health bar above the monster
        var monsterMaxHealth = 50 + currentWave * 10; // This is how you've defined monster health in your createMonsters function
        drawHealthBar(monster, monsterMaxHealth, monster.health, monster.x, monster.y - 10, 50, 5);
    }
}


// Arrow functions
// Update arrows
function updateArrows() {
    for (var i = 0; i < arrows.length; i++) {
        var arrow = arrows[i];
        arrow.x += arrow.vx;
        // Check for collision with monsters
        for (var j = 0; j < monsters.length; j++) { // Use 'j' instead of 'i' here
            var monster = monsters[j];
            var dx = monster.x - arrow.x;
            var dy = monster.y - arrow.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 50) { // If the arrow and monster are touching
                monster.health -= arrow.damage; // Reduce the monster's health by the arrow's damage
                if (monster.health <= 0) {
                    monsters.splice(j, 1); // Remove the monster from the array
                    console.log('Monster ' + j + ' died!');
                    monstersDefeated++;
                }
                arrows.splice(i, 1); // Remove the arrow from the array
                break; // Exit the loop early since the arrow has been removed
            }                
        }
    }
}



// Render arrows
function renderArrows() {
    ctx.fillStyle = '#ff0'; // Yellow
    for (var i = 0; i < arrows.length; i++) {
        var arrow = arrows[i];
        ctx.fillRect(arrow.x, arrow.y, 10, 2);
        // Check if the arrow goes off-screen
        if (arrow.x > canvas.width) {
          // Remove the arrow from the array
          arrows.splice(i, 1);
        }
    }
}


// Health bar function
function drawHealthBar(entity, maxHealth, currentHealth, x, y, width, height) {
    // Calculate the percentage of health remaining
    var healthPercent = currentHealth / maxHealth;

    // Draw the background of the health bar (the part that represents the maximum health)
    ctx.fillStyle = '#000'; // Black
    ctx.fillRect(x, y, width, height);

    // Draw the filled part of the health bar (the part that represents the current health)
    ctx.fillStyle = '#f00'; // Red
    ctx.fillRect(x, y, width * healthPercent, height);

    // Draw the outline of the health bar
    ctx.strokeStyle = '#fff'; // White
    ctx.strokeRect(x, y, width, height);
}


// Key event listeners
// Listen for keydown events
window.addEventListener('keydown', function(event) {
    switch (event.key) {
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'ArrowUp':
            if (player.y === platform.y - 50 || player.jumps < 2) {
                player.vy = -10;
                player.jumps++;
            }
            break;
        case ' ':
            keys.space = true;
            break;
        case 'w':
            keys.w = true;
            break;
    }
});

// Listen for keyup events
window.addEventListener('keyup', function(event) {
    switch (event.key) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowUp':
            keys.up = false;
            break;
        case ' ':
            keys.space = false;
            break;
        case 'w':
            keys.w = false;
            break;
    }
});



// Game loop
var powerUpSpawnInterval = 5000; // Spawn a power-up every 5000 milliseconds (5 seconds)
var lastPowerUpSpawnTime = Date.now();

function gameLoop() {
    // Check if game is over
    if (gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.font = '50px Arial'; // Set the font for the game over text
        ctx.fillStyle = '#f00'; // Set the color for the game over text
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2); // Display the game over text

        // Reset game state after a short delay
        setTimeout(function() {
            // Reset player state
            player.x = 0;
            player.y = 0;
            player.vy = 0;
            player.health = 100;
            player.weapon = weapons[0]; // Start with the first weapon
            healthDisplay.textContent = "Health: " + player.health; // Update health display

            // Reset wave
            currentWave = 0;
            monstersDefeated = 0;

            // Create a new set of monsters
            createMonsters();

            // Reset game over flag
            gameOver = false;

            // Request next frame
            requestAnimationFrame(gameLoop);
        }, 2000); // 2 second delay

        return; // Stop the game loop temporarily
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    updatePlayer();
    updateMonsters();
    updateArrows();
    updatePowerUps();

    // Check if it's time to spawn a power-up
    if (Date.now() - lastPowerUpSpawnTime > powerUpSpawnInterval) {
        createPowerUp();
        lastPowerUpSpawnTime = Date.now();
    }

    // Check if all monsters have been defeated
    if (monsters.length === 0) {
        currentWave++; // Increase the wave
        console.log('Wave: ' + currentWave); // Log the current wave
        createMonsters(); // Spawn a new set of monsters
        console.log('Monsters: ' + monsters.length); // Log the number of monsters
    }

    // Render game state
    renderPlayer();
    renderPlatform();
    renderMonsters();
    renderArrows();
    renderPowerUps();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
