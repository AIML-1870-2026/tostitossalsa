// ============================================
// GAME CONFIGURATION
// ============================================
const CONFIG = {
    gridSize: 20,
    cellSize: 24,
    maxLevel: 25
};

// Speed per level range (cells/sec) - using array (index 0 unused)
const LEVEL_SPEEDS = [0, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8];

// Level requirements - using array (index 0 unused)
const LEVEL_TARGETS = [0, 10, 15, 20, 25, 30, 35, 40, 45, 48, 50, 50, 50, 50, 50, 50];

// Get speed for a level
function getLevelSpeed(level) {
    const lvl = Number(level);
    if (lvl >= 1 && lvl <= 5) return 5;
    if (lvl >= 6 && lvl <= 10) return 6;
    if (lvl >= 11 && lvl <= 15) return 8;
    if (lvl >= 16 && lvl <= 20) return 10;
    if (lvl >= 21 && lvl <= 25) return 12;
    return 12;
}

// Get target length for a level
function getLevelTarget(level) {
    const lvl = Number(level);
    if (lvl <= 0) return 10;
    if (lvl > 15) return 50;
    return LEVEL_TARGETS[lvl];
}

// Obstacles per level (cycles within biome)
function getObstacleCount(level) {
    const lvl = Number(level);
    const posInCycle = ((lvl - 1) % 5);
    if (posInCycle === 4) return 0; // Boss level
    return posInCycle;
}

// Biome definitions
const BIOMES = {
    forest: {
        name: 'Enchanted Forest',
        bodyBg: '#0a1f0a',
        border: '#2d5a27',
        shadow: 'rgba(50, 205, 50, 0.3)',
        hudColor: '#7cfc00',
        background: '#0d2818',
        tile1: '#1a4d2e',
        tile2: '#163d26',
        snakeHead: '#7cfc00',
        snakeBody: '#32cd32',
        snakeTail: '#228b22',
        food: '#ff69b4',
        foodGlow: 'rgba(255, 105, 180, 0.6)',
        obstacle: '#4a3728',
        obstacleAccent: '#3d6b4f',
        warning: '#ff4444',
        particleColor: [144, 238, 144]
    },
    volcanic: {
        name: 'Volcanic Cavern',
        bodyBg: '#1a0a0a',
        border: '#8b2500',
        shadow: 'rgba(255, 69, 0, 0.3)',
        hudColor: '#ff6600',
        background: '#1a0505',
        tile1: '#2d1a1a',
        tile2: '#251212',
        snakeHead: '#ff6600',
        snakeBody: '#ff4500',
        snakeTail: '#cc3300',
        food: '#ffcc00',
        foodGlow: 'rgba(255, 200, 0, 0.6)',
        obstacle: '#333333',
        obstacleAccent: '#ff4400',
        warning: '#ffff00',
        particleColor: [255, 100, 50]
    },
    frozen: {
        name: 'Frozen Tundra',
        bodyBg: '#0a0a1f',
        border: '#4a6fa5',
        shadow: 'rgba(100, 149, 237, 0.3)',
        hudColor: '#87ceeb',
        background: '#0a1020',
        tile1: '#1a2540',
        tile2: '#152035',
        snakeHead: '#00ffff',
        snakeBody: '#40e0d0',
        snakeTail: '#20b2aa',
        food: '#ff69b4',
        foodGlow: 'rgba(255, 105, 180, 0.6)',
        obstacle: '#6a8caf',
        obstacleAccent: '#a0d8ef',
        warning: '#ff4444',
        particleColor: [255, 255, 255]
    },
    desert: {
        name: 'Desert Ruins',
        bodyBg: '#1a1508',
        border: '#c9a227',
        shadow: 'rgba(201, 162, 39, 0.3)',
        hudColor: '#ffd700',
        background: '#2d2410',
        tile1: '#3d3118',
        tile2: '#352a14',
        snakeHead: '#ffd700',
        snakeBody: '#daa520',
        snakeTail: '#b8860b',
        food: '#00ff88',
        foodGlow: 'rgba(0, 255, 136, 0.6)',
        obstacle: '#8b7355',
        obstacleAccent: '#d4af37',
        warning: '#ff4444',
        particleColor: [210, 180, 140]
    },
    celestial: {
        name: 'Celestial Sky',
        bodyBg: '#0a0a20',
        border: '#9370db',
        shadow: 'rgba(147, 112, 219, 0.4)',
        hudColor: '#e0b0ff',
        background: '#0d0d25',
        tile1: '#1a1a3a',
        tile2: '#151530',
        snakeHead: '#ffffff',
        snakeBody: '#e0b0ff',
        snakeTail: '#9370db',
        food: '#00ffff',
        foodGlow: 'rgba(0, 255, 255, 0.6)',
        obstacle: '#4a4a7a',
        obstacleAccent: '#8080ff',
        warning: '#ffff00',
        particleColor: [255, 255, 255]
    }
};

function getBiome(level) {
    const lvl = Number(level);
    if (lvl <= 5) return BIOMES.forest;
    if (lvl <= 10) return BIOMES.volcanic;
    if (lvl <= 15) return BIOMES.frozen;
    if (lvl <= 20) return BIOMES.desert;
    return BIOMES.celestial;
}

function getBiomeKey(level) {
    const lvl = Number(level);
    if (lvl <= 5) return 'forest';
    if (lvl <= 10) return 'volcanic';
    if (lvl <= 15) return 'frozen';
    if (lvl <= 20) return 'desert';
    return 'celestial';
}

function getBossLevel(level) {
    const lvl = Number(level);
    return lvl % 5 === 0;
}

function getBossType(level) {
    const lvl = Number(level);
    if (lvl === 5) return 'forestSpirit';
    if (lvl === 10) return 'volcanoDragon';
    if (lvl === 15) return 'iceGiant';
    if (lvl === 20) return 'desertSphinx';
    if (lvl === 25) return 'thunderBird';
    return null;
}

// ============================================
// GAME STATE
// ============================================
let gameState = {
    level: 1,
    snake: [],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: null,
    obstacles: [],
    gameStatus: 'menu',
    lastMoveTime: 0,
    moveInterval: 1000 / 5,
    currentSpeed: 5,
    isBossLevel: false,
    bossType: null,
    bossStage: 1,
    // Forest Spirit
    bossAcorns: [],
    bossWarnings: [],
    bossDropTimer: 0,
    // Volcano Dragon
    lavaPools: [],
    lavaWarnings: [],
    // Ice Giant
    icePatches: [],
    icicles: [],
    icicleWarnings: [],
    snowballTimer: 0,
    icicleTimer: 0,
    isSpeedBoosted: false,
    speedBoostTimer: 0,
    // Desert Sphinx
    windDirection: { x: 1, y: 0 },
    windChangeTimer: 0,
    windWarning: false,
    windWarningTimer: 0,
    sandstoneObstacles: [],
    sandstoneWarnings: [],
    // Thunder Bird
    isBlinded: false,
    blindTimer: 0,
    blindCooldown: 0,
    lightningObstacles: [],
    lightningWarnings: [],
    lightningTimer: 0,
    // Particles
    particles: []
};

// ============================================
// CANVAS SETUP
// ============================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const particleCanvas = document.getElementById('particles');
const particleCtx = particleCanvas.getContext('2d');

canvas.width = CONFIG.gridSize * CONFIG.cellSize;
canvas.height = CONFIG.gridSize * CONFIG.cellSize;
particleCanvas.width = canvas.width;
particleCanvas.height = canvas.height + 150;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const levelCompleteScreen = document.getElementById('level-complete-screen');
const bossWarning = document.getElementById('boss-warning');
const bossHud = document.getElementById('boss-hud');
const bossSprite = document.getElementById('boss-sprite');
const speedBoostIndicator = document.getElementById('speed-boost-indicator');

// ============================================
// THEME APPLICATION
// ============================================
function applyBiomeTheme(biome) {
    document.body.style.background = biome.bodyBg;
    canvas.style.borderColor = biome.border;
    canvas.style.boxShadow = `0 0 20px ${biome.shadow}, inset 0 0 60px rgba(0, 0, 0, 0.5)`;
    document.getElementById('hud').style.color = biome.hudColor;
    document.getElementById('biome-display').textContent = biome.name;

    // Update screens
    startScreen.style.background = `rgba(${hexToRgb(biome.bodyBg)}, 0.95)`;
    gameOverScreen.style.background = `rgba(${hexToRgb(biome.bodyBg)}, 0.95)`;
    levelCompleteScreen.style.background = `rgba(${hexToRgb(biome.bodyBg)}, 0.95)`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '0, 0, 0';
}

// ============================================
// PARTICLES
// ============================================
function initParticles(biomeKey) {
    gameState.particles = [];
    const count = biomeKey === 'frozen' ? 50 : biomeKey === 'celestial' ? 60 : 30;

    for (let i = 0; i < count; i++) {
        const p = {
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            size: Math.random() * 3 + 1,
            brightness: Math.random(),
            brightnessDir: Math.random() > 0.5 ? 1 : -1
        };

        if (biomeKey === 'forest') {
            p.speedX = (Math.random() - 0.5) * 0.5;
            p.speedY = (Math.random() - 0.5) * 0.5;
        } else if (biomeKey === 'volcanic') {
            p.speedX = (Math.random() - 0.5) * 0.3;
            p.speedY = -Math.random() * 1.5 - 0.5; // Rising embers
        } else if (biomeKey === 'frozen') {
            p.speedX = (Math.random() - 0.5) * 0.5;
            p.speedY = Math.random() * 1 + 0.3; // Falling snow
        } else if (biomeKey === 'desert') {
            p.speedX = Math.random() * 2 + 1; // Blowing sand
            p.speedY = (Math.random() - 0.5) * 0.3;
            p.size = Math.random() * 2 + 0.5;
        } else if (biomeKey === 'celestial') {
            p.speedX = (Math.random() - 0.5) * 0.1; // Slow drift
            p.speedY = (Math.random() - 0.5) * 0.1;
            p.twinkleSpeed = Math.random() * 3 + 1;
        }

        gameState.particles.push(p);
    }
}

function updateParticles(biome, biomeKey) {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    const [r, g, b] = biome.particleColor;

    gameState.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < 0) p.x = particleCanvas.width;
        if (p.x > particleCanvas.width) p.x = 0;
        if (biomeKey === 'volcanic') {
            if (p.y < 0) p.y = particleCanvas.height;
        } else {
            if (p.y < 0) p.y = particleCanvas.height;
            if (p.y > particleCanvas.height) p.y = 0;
        }

        // Update brightness based on biome
        if (biomeKey === 'frozen') {
            p.brightness = 0.8;
        } else if (biomeKey === 'celestial') {
            // Twinkling stars
            p.brightness = Math.sin(Date.now() / 200 * p.twinkleSpeed) * 0.4 + 0.6;
        } else if (biomeKey === 'desert') {
            p.brightness = 0.5;
        } else {
            p.brightness += p.brightnessDir * 0.02;
            if (p.brightness > 1) { p.brightness = 1; p.brightnessDir = -1; }
            if (p.brightness < 0.2) { p.brightness = 0.2; p.brightnessDir = 1; }
        }

        const alpha = p.brightness * 0.8;

        // Draw particle
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        particleCtx.fill();

        // Glow effect (not for snow or sand)
        if (biomeKey !== 'frozen' && biomeKey !== 'desert') {
            particleCtx.beginPath();
            particleCtx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            const gradient = particleCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            particleCtx.fillStyle = gradient;
            particleCtx.fill();
        }
    });

    // Aurora effect for frozen biome
    if (biomeKey === 'frozen') {
        drawAurora();
    }
    // Nebula effect for celestial biome
    if (biomeKey === 'celestial') {
        drawNebula();
    }
    // Heat shimmer for desert biome
    if (biomeKey === 'desert') {
        drawHeatShimmer();
    }
}

function drawAurora() {
    const time = Date.now() / 2000;
    particleCtx.globalAlpha = 0.15;

    for (let i = 0; i < 3; i++) {
        const gradient = particleCtx.createLinearGradient(0, 0, particleCanvas.width, 100);
        gradient.addColorStop(0, `hsl(${(time * 30 + i * 40) % 360}, 70%, 50%)`);
        gradient.addColorStop(0.5, `hsl(${(time * 30 + 120 + i * 40) % 360}, 70%, 50%)`);
        gradient.addColorStop(1, `hsl(${(time * 30 + 240 + i * 40) % 360}, 70%, 50%)`);

        particleCtx.fillStyle = gradient;
        particleCtx.beginPath();
        for (let x = 0; x < particleCanvas.width; x += 10) {
            const y = 30 + Math.sin(x / 50 + time + i) * 20 + i * 15;
            if (x === 0) particleCtx.moveTo(x, y);
            else particleCtx.lineTo(x, y);
        }
        particleCtx.lineTo(particleCanvas.width, 100);
        particleCtx.lineTo(0, 100);
        particleCtx.fill();
    }

    particleCtx.globalAlpha = 1;
}

function drawNebula() {
    const time = Date.now() / 3000;
    particleCtx.globalAlpha = 0.1;

    // Draw swirling nebula clouds
    for (let i = 0; i < 2; i++) {
        const gradient = particleCtx.createRadialGradient(
            particleCanvas.width / 2 + Math.sin(time + i) * 100,
            50 + Math.cos(time * 0.5 + i) * 30,
            0,
            particleCanvas.width / 2,
            80,
            200
        );
        gradient.addColorStop(0, `hsla(${280 + i * 40}, 70%, 50%, 0.3)`);
        gradient.addColorStop(0.5, `hsla(${240 + i * 30}, 60%, 40%, 0.1)`);
        gradient.addColorStop(1, 'transparent');

        particleCtx.fillStyle = gradient;
        particleCtx.fillRect(0, 0, particleCanvas.width, 150);
    }

    particleCtx.globalAlpha = 1;
}

function drawHeatShimmer() {
    const time = Date.now() / 1000;
    particleCtx.globalAlpha = 0.05;

    // Draw wavy heat lines
    for (let i = 0; i < 3; i++) {
        particleCtx.strokeStyle = `rgba(255, 200, 100, ${0.3 - i * 0.08})`;
        particleCtx.lineWidth = 2;
        particleCtx.beginPath();
        for (let x = 0; x < particleCanvas.width; x += 5) {
            const y = particleCanvas.height - 50 + Math.sin(x / 20 + time * 2 + i) * 5 - i * 20;
            if (x === 0) particleCtx.moveTo(x, y);
            else particleCtx.lineTo(x, y);
        }
        particleCtx.stroke();
    }

    particleCtx.globalAlpha = 1;
}

// ============================================
// SNAKE FUNCTIONS
// ============================================
function initSnake() {
    const startX = Math.floor(CONFIG.gridSize / 4);
    const startY = Math.floor(CONFIG.gridSize / 2);
    gameState.snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
}

function drawSnake(biome) {
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * CONFIG.cellSize;
        const y = segment.y * CONFIG.cellSize;
        const size = CONFIG.cellSize - 2;

        if (index === 0) {
            ctx.fillStyle = biome.snakeHead;
            ctx.fillRect(x + 1, y + 1, size, size);

            // Eyes
            ctx.fillStyle = '#000';
            const eyeSize = 4;
            const eyeOffset = 5;
            if (gameState.direction.x === 1) {
                ctx.fillRect(x + size - eyeOffset, y + 5, eyeSize, eyeSize);
                ctx.fillRect(x + size - eyeOffset, y + size - 7, eyeSize, eyeSize);
            } else if (gameState.direction.x === -1) {
                ctx.fillRect(x + eyeOffset - 2, y + 5, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset - 2, y + size - 7, eyeSize, eyeSize);
            } else if (gameState.direction.y === 1) {
                ctx.fillRect(x + 5, y + size - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + size - 7, y + size - eyeOffset, eyeSize, eyeSize);
            } else {
                ctx.fillRect(x + 5, y + eyeOffset - 2, eyeSize, eyeSize);
                ctx.fillRect(x + size - 7, y + eyeOffset - 2, eyeSize, eyeSize);
            }
        } else if (index === gameState.snake.length - 1) {
            ctx.fillStyle = biome.snakeTail;
            ctx.fillRect(x + 3, y + 3, size - 4, size - 4);
        } else {
            ctx.fillStyle = biome.snakeBody;
            ctx.fillRect(x + 1, y + 1, size, size);
        }
    });
}

function moveSnake() {
    gameState.direction = { ...gameState.nextDirection };

    const head = gameState.snake[0];
    const newHead = {
        x: head.x + gameState.direction.x,
        y: head.y + gameState.direction.y
    };

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= CONFIG.gridSize ||
        newHead.y < 0 || newHead.y >= CONFIG.gridSize) {
        gameOver();
        return;
    }

    // Check self collision
    if (gameState.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        gameOver();
        return;
    }

    // Check obstacle collision
    if (gameState.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
        gameOver();
        return;
    }

    // Check boss-specific collisions
    if (gameState.bossAcorns.some(a => a.x === newHead.x && a.y === newHead.y)) {
        gameOver();
        return;
    }
    if (gameState.lavaPools.some(p => p.cells.some(c => c.x === newHead.x && c.y === newHead.y))) {
        gameOver();
        return;
    }
    if (gameState.icicles.some(i => i.x === newHead.x && i.y === newHead.y)) {
        gameOver();
        return;
    }
    if (gameState.sandstoneObstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
        gameOver();
        return;
    }
    if (gameState.lightningObstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
        gameOver();
        return;
    }

    // Check ice patch for speed boost
    if (gameState.bossType === 'iceGiant') {
        const onIcePatch = gameState.icePatches.some(patch =>
            newHead.x >= patch.x && newHead.x < patch.x + 4 &&
            newHead.y >= patch.y && newHead.y < patch.y + 4
        );
        if (onIcePatch && !gameState.isSpeedBoosted) {
            gameState.isSpeedBoosted = true;
            gameState.speedBoostTimer = 800;
            gameState.moveInterval = 1000 / (gameState.currentSpeed * 3); // 3x speed boost!
            speedBoostIndicator.classList.remove('hidden');
        }
    }

    gameState.snake.unshift(newHead);

    // Check food collision
    if (gameState.food && newHead.x === gameState.food.x && newHead.y === gameState.food.y) {
        spawnFood();
        updateHUD();

        if (gameState.snake.length >= getLevelTarget(gameState.level)) {
            levelComplete();
            return;
        }
    } else {
        gameState.snake.pop();
    }
}

// ============================================
// DRAWING FUNCTIONS
// ============================================
function drawBackground(biome) {
    ctx.fillStyle = biome.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < CONFIG.gridSize; x++) {
        for (let y = 0; y < CONFIG.gridSize; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? biome.tile1 : biome.tile2;
            ctx.fillRect(x * CONFIG.cellSize, y * CONFIG.cellSize, CONFIG.cellSize, CONFIG.cellSize);
        }
    }
}

function drawFood(biome) {
    if (!gameState.food) return;

    const x = gameState.food.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const y = gameState.food.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const time = Date.now() / 500;
    const pulseSize = Math.sin(time) * 2 + 8;

    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize * 2);
    gradient.addColorStop(0, biome.foodGlow);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.beginPath();
    ctx.arc(x, y, pulseSize * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Food
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = biome.food;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
}

function drawObstacles(biome, biomeKey) {
    gameState.obstacles.forEach(obs => {
        const x = obs.x * CONFIG.cellSize;
        const y = obs.y * CONFIG.cellSize;
        const size = CONFIG.cellSize - 2;

        ctx.fillStyle = biome.obstacle;
        ctx.fillRect(x + 1, y + 1, size, size);

        ctx.fillStyle = biome.obstacleAccent;
        if (biomeKey === 'forest') {
            ctx.fillRect(x + 2, y + 2, 8, 6);
            ctx.fillRect(x + size - 10, y + size - 8, 8, 6);
        } else if (biomeKey === 'volcanic') {
            // Glowing cracks
            ctx.fillRect(x + 4, y + 4, 3, 14);
            ctx.fillRect(x + 10, y + 8, 8, 3);
        } else if (biomeKey === 'frozen') {
            // Ice highlights
            ctx.fillRect(x + 2, y + 2, 6, 3);
            ctx.fillRect(x + 4, y + 6, 4, 10);
        } else if (biomeKey === 'desert') {
            // Hieroglyph-like patterns
            ctx.fillRect(x + 3, y + 3, 4, 4);
            ctx.fillRect(x + size - 7, y + 3, 4, 4);
            ctx.fillRect(x + 8, y + 10, 6, 3);
        } else if (biomeKey === 'celestial') {
            // Star patterns
            const cx = x + size / 2;
            const cy = y + size / 2;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2);
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
            }
            ctx.strokeStyle = biome.obstacleAccent;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

// ============================================
// BOSS SPRITES
// ============================================
function drawBossSprite() {
    if (!gameState.isBossLevel) {
        bossSprite.innerHTML = '';
        return;
    }

    const time = Date.now() / 1000;
    const bob = Math.sin(time * 2) * 5;

    if (gameState.bossType === 'forestSpirit') {
        bossSprite.innerHTML = `
            <svg width="200" height="120" style="transform: translateY(${bob}px)">
                <rect x="80" y="40" width="40" height="80" fill="#4a3728" rx="5"/>
                <rect x="70" y="60" width="60" height="50" fill="#3d2b1f" rx="8"/>
                <path d="M70 70 Q40 50 30 70" stroke="#4a3728" stroke-width="12" fill="none" stroke-linecap="round"/>
                <path d="M130 70 Q160 50 170 70" stroke="#4a3728" stroke-width="12" fill="none" stroke-linecap="round"/>
                <ellipse cx="100" cy="30" rx="45" ry="30" fill="#2d5a27"/>
                <ellipse cx="80" cy="25" rx="25" ry="20" fill="#3d8b37"/>
                <ellipse cx="120" cy="25" rx="25" ry="20" fill="#3d8b37"/>
                <ellipse cx="100" cy="15" rx="20" ry="15" fill="#4da347"/>
                <ellipse cx="85" cy="75" rx="8" ry="10" fill="#7cfc00" opacity="${0.5 + Math.sin(time * 3) * 0.3}"/>
                <ellipse cx="115" cy="75" rx="8" ry="10" fill="#7cfc00" opacity="${0.5 + Math.sin(time * 3) * 0.3}"/>
                <ellipse cx="85" cy="78" rx="3" ry="5" fill="#0a1f0a"/>
                <ellipse cx="115" cy="78" rx="3" ry="5" fill="#0a1f0a"/>
                <path d="M90 95 Q100 105 110 95" stroke="#0a1f0a" stroke-width="3" fill="none"/>
            </svg>
        `;
    } else if (gameState.bossType === 'volcanoDragon') {
        const fireFlicker = Math.sin(time * 10) * 0.3 + 0.7;
        bossSprite.innerHTML = `
            <svg width="240" height="140" style="transform: translateY(${bob}px)">
                <!-- Dragon head -->
                <ellipse cx="120" cy="60" rx="60" ry="45" fill="#8b0000"/>
                <ellipse cx="120" cy="55" rx="50" ry="35" fill="#a52a2a"/>
                <!-- Horns -->
                <path d="M70 30 Q60 10 75 25" stroke="#333" stroke-width="8" fill="none"/>
                <path d="M170 30 Q180 10 165 25" stroke="#333" stroke-width="8" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="95" cy="50" rx="12" ry="8" fill="#ff4500" opacity="${fireFlicker}"/>
                <ellipse cx="145" cy="50" rx="12" ry="8" fill="#ff4500" opacity="${fireFlicker}"/>
                <ellipse cx="95" cy="50" rx="5" ry="5" fill="#000"/>
                <ellipse cx="145" cy="50" rx="5" ry="5" fill="#000"/>
                <!-- Nostrils with smoke -->
                <ellipse cx="105" cy="75" rx="6" ry="4" fill="#333"/>
                <ellipse cx="135" cy="75" rx="6" ry="4" fill="#333"/>
                <!-- Mouth -->
                <path d="M80 90 Q120 110 160 90" stroke="#333" stroke-width="4" fill="none"/>
                <!-- Fire breath hint -->
                <ellipse cx="120" cy="115" rx="25" ry="15" fill="#ff6600" opacity="${fireFlicker * 0.5}"/>
                <ellipse cx="120" cy="120" rx="15" ry="10" fill="#ffcc00" opacity="${fireFlicker * 0.3}"/>
            </svg>
        `;
    } else if (gameState.bossType === 'iceGiant') {
        const iceGlow = Math.sin(time * 2) * 0.2 + 0.8;
        bossSprite.innerHTML = `
            <svg width="200" height="140" style="transform: translateY(${bob}px)">
                <!-- Body -->
                <rect x="60" y="40" width="80" height="100" fill="#6a8caf" rx="10"/>
                <rect x="70" y="50" width="60" height="80" fill="#87ceeb" rx="5"/>
                <!-- Head -->
                <ellipse cx="100" cy="30" rx="35" ry="30" fill="#a0d8ef"/>
                <ellipse cx="100" cy="25" rx="30" ry="22" fill="#b8e2f2"/>
                <!-- Ice crown -->
                <path d="M70 10 L80 0 L90 15 L100 -5 L110 15 L120 0 L130 10" stroke="#fff" stroke-width="4" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="85" cy="30" rx="8" ry="6" fill="#00ffff" opacity="${iceGlow}"/>
                <ellipse cx="115" cy="30" rx="8" ry="6" fill="#00ffff" opacity="${iceGlow}"/>
                <ellipse cx="85" cy="30" rx="3" ry="4" fill="#004466"/>
                <ellipse cx="115" cy="30" rx="3" ry="4" fill="#004466"/>
                <!-- Arms -->
                <rect x="30" y="60" width="30" height="15" fill="#6a8caf" rx="5"/>
                <rect x="140" y="60" width="30" height="15" fill="#6a8caf" rx="5"/>
                <!-- Ice details -->
                <path d="M75 70 L85 90 L95 70" stroke="#fff" stroke-width="2" fill="none" opacity="0.5"/>
                <path d="M105 70 L115 90 L125 70" stroke="#fff" stroke-width="2" fill="none" opacity="0.5"/>
            </svg>
        `;
    } else if (gameState.bossType === 'desertSphinx') {
        const eyeGlow = Math.sin(time * 2) * 0.3 + 0.7;
        bossSprite.innerHTML = `
            <svg width="220" height="140" style="transform: translateY(${bob}px)">
                <!-- Body/Base -->
                <rect x="40" y="80" width="140" height="60" fill="#c9a227" rx="5"/>
                <rect x="50" y="90" width="120" height="40" fill="#daa520"/>
                <!-- Head -->
                <ellipse cx="110" cy="50" rx="40" ry="35" fill="#d4af37"/>
                <ellipse cx="110" cy="45" rx="35" ry="28" fill="#e6c547"/>
                <!-- Headdress -->
                <path d="M60 30 L70 60 L70 80 L50 80" fill="#1a4d80" stroke="#c9a227" stroke-width="2"/>
                <path d="M160 30 L150 60 L150 80 L170 80" fill="#1a4d80" stroke="#c9a227" stroke-width="2"/>
                <rect x="70" y="20" width="80" height="15" fill="#1a4d80"/>
                <rect x="75" y="25" width="70" height="8" fill="#c9a227"/>
                <!-- Eyes - glowing -->
                <ellipse cx="95" cy="45" rx="10" ry="8" fill="#ffd700" opacity="${eyeGlow}"/>
                <ellipse cx="125" cy="45" rx="10" ry="8" fill="#ffd700" opacity="${eyeGlow}"/>
                <ellipse cx="95" cy="45" rx="4" ry="5" fill="#000"/>
                <ellipse cx="125" cy="45" rx="4" ry="5" fill="#000"/>
                <!-- Nose -->
                <path d="M105 55 L110 65 L115 55" fill="#b8860b"/>
                <!-- Mouth -->
                <path d="M95 75 Q110 82 125 75" stroke="#8b7355" stroke-width="2" fill="none"/>
                <!-- Front paws -->
                <rect x="55" y="120" width="25" height="20" fill="#c9a227" rx="3"/>
                <rect x="140" y="120" width="25" height="20" fill="#c9a227" rx="3"/>
            </svg>
        `;
    } else if (gameState.bossType === 'thunderBird') {
        const wingFlap = Math.sin(time * 4) * 15;
        const lightningGlow = Math.sin(time * 8) * 0.4 + 0.6;
        bossSprite.innerHTML = `
            <svg width="260" height="140" style="transform: translateY(${bob}px)">
                <!-- Left wing -->
                <path d="M30 60 Q0 40 10 80 Q30 70 50 90 Q70 70 90 80"
                      fill="#4a0080" stroke="#9370db" stroke-width="2"
                      transform="rotate(${-wingFlap}, 90, 80)"/>
                <path d="M40 65 Q20 50 25 75" stroke="#e0b0ff" stroke-width="3" fill="none" opacity="${lightningGlow}"
                      transform="rotate(${-wingFlap}, 90, 80)"/>
                <!-- Right wing -->
                <path d="M230 60 Q260 40 250 80 Q230 70 210 90 Q190 70 170 80"
                      fill="#4a0080" stroke="#9370db" stroke-width="2"
                      transform="rotate(${wingFlap}, 170, 80)"/>
                <path d="M220 65 Q240 50 235 75" stroke="#e0b0ff" stroke-width="3" fill="none" opacity="${lightningGlow}"
                      transform="rotate(${wingFlap}, 170, 80)"/>
                <!-- Body -->
                <ellipse cx="130" cy="70" rx="45" ry="35" fill="#5a1a8a"/>
                <ellipse cx="130" cy="65" rx="38" ry="28" fill="#7030a0"/>
                <!-- Head -->
                <ellipse cx="130" cy="35" rx="25" ry="22" fill="#7030a0"/>
                <ellipse cx="130" cy="32" rx="20" ry="17" fill="#8040b0"/>
                <!-- Beak -->
                <path d="M125 40 L130 55 L135 40" fill="#ffd700"/>
                <!-- Eyes - electric -->
                <ellipse cx="118" cy="30" rx="8" ry="6" fill="#00ffff" opacity="${lightningGlow}"/>
                <ellipse cx="142" cy="30" rx="8" ry="6" fill="#00ffff" opacity="${lightningGlow}"/>
                <ellipse cx="118" cy="30" rx="3" ry="4" fill="#fff"/>
                <ellipse cx="142" cy="30" rx="3" ry="4" fill="#fff"/>
                <!-- Crown feathers -->
                <path d="M115 15 L118 5 L125 18" fill="#e0b0ff"/>
                <path d="M128 12 L130 0 L132 12" fill="#e0b0ff"/>
                <path d="M145 15 L142 5 L135 18" fill="#e0b0ff"/>
                <!-- Lightning bolts from body -->
                <path d="M100 90 L95 105 L105 100 L100 120" stroke="#ffff00" stroke-width="2" fill="none" opacity="${lightningGlow}"/>
                <path d="M160 90 L165 105 L155 100 L160 120" stroke="#ffff00" stroke-width="2" fill="none" opacity="${lightningGlow}"/>
                <!-- Tail feathers -->
                <path d="M110 100 L100 130 L120 115" fill="#4a0080"/>
                <path d="M130 105 L130 135 L140 115" fill="#5a1a8a"/>
                <path d="M150 100 L160 130 L140 115" fill="#4a0080"/>
            </svg>
        `;
    }
}

// ============================================
// BOSS MECHANICS
// ============================================
function updateBoss(deltaTime) {
    if (!gameState.isBossLevel) return;

    const progress = gameState.snake.length / getLevelTarget(gameState.level);
    gameState.bossStage = progress < 0.33 ? 1 : progress < 0.66 ? 2 : 3;
    document.getElementById('boss-stage').textContent = gameState.bossStage;

    if (gameState.bossType === 'forestSpirit') {
        updateForestSpirit(deltaTime);
    } else if (gameState.bossType === 'volcanoDragon') {
        updateVolcanoDragon(deltaTime);
    } else if (gameState.bossType === 'iceGiant') {
        updateIceGiant(deltaTime);
    } else if (gameState.bossType === 'desertSphinx') {
        updateDesertSphinx(deltaTime);
    } else if (gameState.bossType === 'thunderBird') {
        updateThunderBird(deltaTime);
    }

    // Update speed boost timer
    if (gameState.isSpeedBoosted) {
        gameState.speedBoostTimer -= deltaTime;
        if (gameState.speedBoostTimer <= 0) {
            gameState.isSpeedBoosted = false;
            gameState.moveInterval = 1000 / gameState.currentSpeed;
            speedBoostIndicator.classList.add('hidden');
        }
    }
}

// Forest Spirit - Acorn drops (multiple at once)
function updateForestSpirit(deltaTime) {
    const dropRates = { 1: 2500, 2: 1800, 3: 1200 };
    const dropCounts = { 1: 2, 2: 3, 3: 4 }; // Drop multiple acorns at once
    gameState.bossDropTimer += deltaTime;

    if (gameState.bossDropTimer >= dropRates[gameState.bossStage]) {
        gameState.bossDropTimer = 0;
        // Drop multiple acorns based on stage
        for (let i = 0; i < dropCounts[gameState.bossStage]; i++) {
            createWarning(gameState.bossWarnings);
        }
    }

    // Update warnings -> acorns
    gameState.bossWarnings = gameState.bossWarnings.filter(w => {
        w.timer -= deltaTime;
        if (w.timer <= 0) {
            gameState.bossAcorns.push({ x: w.x, y: w.y, timer: 3000 });
            return false;
        }
        return true;
    });

    // Update acorns
    gameState.bossAcorns = gameState.bossAcorns.filter(a => {
        a.timer -= deltaTime;
        return a.timer > 0;
    });
}

// Volcano Dragon - Expanding lava pools (very slow expansion, limited pools)
function updateVolcanoDragon(deltaTime) {
    gameState.bossDropTimer += deltaTime;

    // Very slow drop rate, max 6 pools on screen
    const maxPools = 6;
    if (gameState.bossDropTimer >= 10000 && gameState.lavaPools.length < maxPools) {
        gameState.bossDropTimer = 0;
        createWarning(gameState.lavaWarnings);
    }

    // Update warnings -> lava pools
    gameState.lavaWarnings = gameState.lavaWarnings.filter(w => {
        w.timer -= deltaTime;
        if (w.timer <= 0) {
            gameState.lavaPools.push({
                x: w.x,
                y: w.y,
                cells: [{ x: w.x, y: w.y }],
                expandTimer: 0,
                maxSize: 2  // Smaller max size
            });
            return false;
        }
        return true;
    });

    // Expand lava pools very slowly
    gameState.lavaPools.forEach(pool => {
        pool.expandTimer += deltaTime;
        if (pool.expandTimer >= 8000 && pool.cells.length < pool.maxSize * pool.maxSize) {
            pool.expandTimer = 0;
            expandLavaPool(pool);
        }
    });
}

function expandLavaPool(pool) {
    const newCells = [];
    pool.cells.forEach(cell => {
        const neighbors = [
            { x: cell.x + 1, y: cell.y },
            { x: cell.x - 1, y: cell.y },
            { x: cell.x, y: cell.y + 1 },
            { x: cell.x, y: cell.y - 1 }
        ];
        neighbors.forEach(n => {
            if (n.x >= 0 && n.x < CONFIG.gridSize && n.y >= 0 && n.y < CONFIG.gridSize) {
                if (!pool.cells.some(c => c.x === n.x && c.y === n.y) &&
                    !newCells.some(c => c.x === n.x && c.y === n.y)) {
                    if (Math.random() < 0.25) {
                        newCells.push(n);
                    }
                }
            }
        });
    });
    pool.cells.push(...newCells.slice(0, 1)); // Only add 1 cell at a time
}

// Ice Giant - Snowballs and icicles
function updateIceGiant(deltaTime) {
    gameState.snowballTimer += deltaTime;
    gameState.icicleTimer += deltaTime;

    // Snowballs (create ice patches)
    const snowballRate = gameState.bossStage === 3 ? 2500 : 3500;
    if (gameState.snowballTimer >= snowballRate) {
        gameState.snowballTimer = 0;
        createIcePatch();
    }

    // Icicles (stage 2+)
    if (gameState.bossStage >= 2) {
        const icicleRate = gameState.bossStage === 3 ? 2000 : 3000;
        if (gameState.icicleTimer >= icicleRate) {
            gameState.icicleTimer = 0;
            createWarning(gameState.icicleWarnings);
        }
    }

    // Update ice patches
    gameState.icePatches = gameState.icePatches.filter(p => {
        p.timer -= deltaTime;
        return p.timer > 0;
    });

    // Update icicle warnings -> icicles
    gameState.icicleWarnings = gameState.icicleWarnings.filter(w => {
        w.timer -= deltaTime;
        if (w.timer <= 0) {
            gameState.icicles.push({ x: w.x, y: w.y, timer: 3000 });
            return false;
        }
        return true;
    });

    // Update icicles
    gameState.icicles = gameState.icicles.filter(i => {
        i.timer -= deltaTime;
        return i.timer > 0;
    });
}

function createIcePatch() {
    let x, y, attempts = 0;
    do {
        x = Math.floor(Math.random() * (CONFIG.gridSize - 4));
        y = Math.floor(Math.random() * (CONFIG.gridSize - 4));
        attempts++;
    } while (attempts < 50 && gameState.snake.some(s =>
        s.x >= x && s.x < x + 4 && s.y >= y && s.y < y + 4
    ));

    if (attempts < 50) {
        gameState.icePatches.push({ x, y, timer: 5000 });
    }
}

// Desert Sphinx - Wind manipulation
function updateDesertSphinx(deltaTime) {
    // Handle wind warning countdown
    if (gameState.windWarning) {
        gameState.windWarningTimer -= deltaTime;
        if (gameState.windWarningTimer <= 0) {
            gameState.windWarning = false;
            // Change wind direction
            const directions = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ];
            // Pick a new direction different from current
            let newDir;
            do {
                newDir = directions[Math.floor(Math.random() * directions.length)];
            } while (newDir.x === gameState.windDirection.x && newDir.y === gameState.windDirection.y);
            gameState.windDirection = newDir;
        }
    }

    // Stage 2+: Wind changes direction
    if (gameState.bossStage >= 2 && !gameState.windWarning) {
        gameState.windChangeTimer += deltaTime;
        const changeInterval = 8000 + Math.random() * 2000; // 8-10 seconds
        if (gameState.windChangeTimer >= changeInterval) {
            gameState.windChangeTimer = 0;
            gameState.windWarning = true;
            gameState.windWarningTimer = 2000; // 2 second warning
        }
    }

    // Stage 3: Sandstone obstacles
    if (gameState.bossStage >= 3) {
        gameState.bossDropTimer += deltaTime;
        if (gameState.bossDropTimer >= 5000) { // Every 5 seconds
            gameState.bossDropTimer = 0;
            createWarning(gameState.sandstoneWarnings);
        }
    }

    // Update sandstone warnings -> obstacles
    gameState.sandstoneWarnings = gameState.sandstoneWarnings.filter(w => {
        w.timer -= deltaTime;
        if (w.timer <= 0) {
            gameState.sandstoneObstacles.push({ x: w.x, y: w.y, timer: 4000 });
            return false;
        }
        return true;
    });

    // Update sandstone obstacles
    gameState.sandstoneObstacles = gameState.sandstoneObstacles.filter(o => {
        o.timer -= deltaTime;
        return o.timer > 0;
    });
}

// Apply wind effect to movement speed
function getWindModifiedInterval() {
    if (gameState.bossType !== 'desertSphinx') return gameState.moveInterval;

    const movingWith = (gameState.direction.x === gameState.windDirection.x &&
                        gameState.direction.y === gameState.windDirection.y);
    const movingAgainst = (gameState.direction.x === -gameState.windDirection.x &&
                          gameState.direction.y === -gameState.windDirection.y);

    if (movingWith) {
        return gameState.moveInterval / 1.5; // Faster
    } else if (movingAgainst) {
        return gameState.moveInterval * 2; // Slower
    }
    return gameState.moveInterval; // Normal
}

// Thunder Bird - Lightning attacks
function updateThunderBird(deltaTime) {
    // Update blind effect
    if (gameState.isBlinded) {
        gameState.blindTimer -= deltaTime;
        if (gameState.blindTimer <= 0) {
            gameState.isBlinded = false;
        }
    }

    // Stage 1+: Blinding flashes
    gameState.blindCooldown += deltaTime;
    const flashInterval = gameState.bossStage === 3 ? 3000 : 4500; // 3-4.5 sec based on stage
    if (gameState.blindCooldown >= flashInterval + Math.random() * 1500) {
        gameState.blindCooldown = 0;
        gameState.isBlinded = true;
        gameState.blindTimer = 250; // 0.25 second flash
    }

    // Stage 2+: Lightning obstacles
    if (gameState.bossStage >= 2) {
        gameState.lightningTimer += deltaTime;
        const obstacleInterval = gameState.bossStage === 3 ? 2500 : 4000;
        if (gameState.lightningTimer >= obstacleInterval) {
            gameState.lightningTimer = 0;
            createWarning(gameState.lightningWarnings);
        }
    }

    // Update lightning warnings -> obstacles (1 second warning)
    gameState.lightningWarnings = gameState.lightningWarnings.filter(w => {
        w.timer -= deltaTime;
        if (w.timer <= 0) {
            gameState.lightningObstacles.push({ x: w.x, y: w.y, timer: 2000 });
            return false;
        }
        return true;
    });

    // Update lightning obstacles
    gameState.lightningObstacles = gameState.lightningObstacles.filter(o => {
        o.timer -= deltaTime;
        return o.timer > 0;
    });
}

function createWarning(warningArray) {
    let pos, attempts = 0;
    do {
        pos = {
            x: Math.floor(Math.random() * (CONFIG.gridSize - 2)) + 1,
            y: Math.floor(Math.random() * (CONFIG.gridSize - 2)) + 1
        };
        attempts++;
    } while (attempts < 50 && (
        gameState.snake.some(s => s.x === pos.x && s.y === pos.y) ||
        (gameState.food && gameState.food.x === pos.x && gameState.food.y === pos.y)
    ));

    if (attempts < 50) {
        warningArray.push({ x: pos.x, y: pos.y, timer: 2000 });
    }
}

// ============================================
// BOSS DRAWING
// ============================================
function drawBossElements(biome) {
    // Forest Spirit acorns
    drawWarnings(gameState.bossWarnings);
    gameState.bossAcorns.forEach(acorn => {
        const x = acorn.x * CONFIG.cellSize + CONFIG.cellSize / 2;
        const y = acorn.y * CONFIG.cellSize + CONFIG.cellSize / 2;
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(x, y - 6, 10, 5, 0, 0, Math.PI);
        ctx.fill();
    });

    // Volcano Dragon lava
    drawWarnings(gameState.lavaWarnings);
    gameState.lavaPools.forEach(pool => {
        pool.cells.forEach(cell => {
            const x = cell.x * CONFIG.cellSize;
            const y = cell.y * CONFIG.cellSize;
            const time = Date.now() / 200;
            const flicker = Math.sin(time + cell.x + cell.y) * 0.2 + 0.8;

            ctx.fillStyle = `rgba(255, 69, 0, ${flicker})`;
            ctx.fillRect(x + 1, y + 1, CONFIG.cellSize - 2, CONFIG.cellSize - 2);
            ctx.fillStyle = `rgba(255, 200, 0, ${flicker * 0.5})`;
            ctx.fillRect(x + 4, y + 4, CONFIG.cellSize - 8, CONFIG.cellSize - 8);
        });
    });

    // Ice Giant elements
    // Ice patches
    gameState.icePatches.forEach(patch => {
        const x = patch.x * CONFIG.cellSize;
        const y = patch.y * CONFIG.cellSize;
        const size = 4 * CONFIG.cellSize;

        ctx.fillStyle = 'rgba(135, 206, 235, 0.4)';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);

        // Sparkle effect
        const time = Date.now() / 300;
        for (let i = 0; i < 3; i++) {
            const sx = x + Math.sin(time + i) * 30 + size / 2;
            const sy = y + Math.cos(time + i * 2) * 30 + size / 2;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Icicle warnings and icicles
    drawWarnings(gameState.icicleWarnings);
    gameState.icicles.forEach(icicle => {
        const x = icicle.x * CONFIG.cellSize + CONFIG.cellSize / 2;
        const y = icicle.y * CONFIG.cellSize + CONFIG.cellSize / 2;

        ctx.fillStyle = '#a0d8ef';
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x - 8, y + 10);
        ctx.lineTo(x + 8, y + 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - 2, y - 5);
        ctx.lineTo(x - 4, y + 5);
        ctx.lineTo(x, y + 3);
        ctx.closePath();
        ctx.fill();
    });

    // Desert Sphinx - Sandstone obstacles
    drawWarnings(gameState.sandstoneWarnings);
    gameState.sandstoneObstacles.forEach(obs => {
        const x = obs.x * CONFIG.cellSize;
        const y = obs.y * CONFIG.cellSize;
        const size = CONFIG.cellSize - 2;

        // Sandstone block
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x + 1, y + 1, size, size);

        // Cracks/detail
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x + 3, y + 3, 4, 4);
        ctx.fillRect(x + size - 7, y + size - 7, 4, 4);
        ctx.fillRect(x + 8, y + 8, 6, 3);
    });

    // Thunder Bird - Lightning obstacles
    drawWarnings(gameState.lightningWarnings, '#ffff00');
    gameState.lightningObstacles.forEach(obs => {
        const x = obs.x * CONFIG.cellSize + CONFIG.cellSize / 2;
        const y = obs.y * CONFIG.cellSize + CONFIG.cellSize / 2;
        const time = Date.now() / 50;
        const flicker = Math.sin(time) * 0.3 + 0.7;

        // Electric field
        ctx.fillStyle = `rgba(255, 255, 0, ${flicker * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, CONFIG.cellSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Lightning bolt shape
        ctx.strokeStyle = `rgba(255, 255, 255, ${flicker})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 8);
        ctx.lineTo(x + 2, y - 2);
        ctx.lineTo(x - 2, y);
        ctx.lineTo(x + 4, y + 8);
        ctx.stroke();

        // Crackle effect
        ctx.strokeStyle = `rgba(0, 255, 255, ${flicker * 0.5})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = (time * 2 + i * 2) % (Math.PI * 2);
            const length = 6 + Math.sin(time + i) * 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
    });
}

function drawWarnings(warnings, color = '#ff4444') {
    warnings.forEach(w => {
        const x = w.x * CONFIG.cellSize;
        const y = w.y * CONFIG.cellSize;
        const alpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;

        const rgb = color === '#ffff00' ? '255, 255, 0' : '255, 68, 68';
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x + CONFIG.cellSize / 2, y + CONFIG.cellSize / 2, CONFIG.cellSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function drawWindIndicator() {
    const arrowSize = 40;
    const centerX = canvas.width - 60;
    const centerY = 60;

    // Draw background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    ctx.fill();

    // Flash warning when wind is about to change
    if (gameState.windWarning) {
        const flashAlpha = Math.sin(Date.now() / 100) * 0.3 + 0.5;
        ctx.strokeStyle = `rgba(255, 200, 0, ${flashAlpha})`;
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Draw arrow pointing in wind direction
    ctx.save();
    ctx.translate(centerX, centerY);

    // Rotate based on wind direction
    let angle = 0;
    if (gameState.windDirection.x === 1) angle = 0;
    else if (gameState.windDirection.x === -1) angle = Math.PI;
    else if (gameState.windDirection.y === 1) angle = Math.PI / 2;
    else if (gameState.windDirection.y === -1) angle = -Math.PI / 2;

    ctx.rotate(angle);

    // Draw arrow
    ctx.fillStyle = gameState.windWarning ? '#ffcc00' : '#ffd700';
    ctx.beginPath();
    ctx.moveTo(arrowSize / 2, 0);
    ctx.lineTo(-arrowSize / 4, -arrowSize / 3);
    ctx.lineTo(-arrowSize / 4, -arrowSize / 6);
    ctx.lineTo(-arrowSize / 2, -arrowSize / 6);
    ctx.lineTo(-arrowSize / 2, arrowSize / 6);
    ctx.lineTo(-arrowSize / 4, arrowSize / 6);
    ctx.lineTo(-arrowSize / 4, arrowSize / 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw "WIND" label
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WIND', centerX, centerY + 50);
}

// ============================================
// OBSTACLE & FOOD SPAWNING
// ============================================
function generateObstacles() {
    gameState.obstacles = [];
    const count = getObstacleCount(gameState.level);

    for (let i = 0; i < count; i++) {
        let pos, attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * (CONFIG.gridSize - 4)) + 2,
                y: Math.floor(Math.random() * (CONFIG.gridSize - 4)) + 2
            };
            attempts++;
        } while (attempts < 100 && (
            isPositionOccupied(pos) ||
            isNearSnakeStart(pos) ||
            isNearOtherObstacle(pos)
        ));

        if (attempts < 100) {
            gameState.obstacles.push(pos);
        }
    }
}

function isPositionOccupied(pos) {
    if (gameState.snake.some(s => s.x === pos.x && s.y === pos.y)) return true;
    if (gameState.food && gameState.food.x === pos.x && gameState.food.y === pos.y) return true;
    if (gameState.obstacles.some(o => o.x === pos.x && o.y === pos.y)) return true;
    return false;
}

function isNearSnakeStart(pos) {
    const startX = Math.floor(CONFIG.gridSize / 4);
    const startY = Math.floor(CONFIG.gridSize / 2);
    return Math.abs(pos.x - startX) < 5 && Math.abs(pos.y - startY) < 3;
}

function isNearOtherObstacle(pos) {
    return gameState.obstacles.some(o =>
        Math.abs(o.x - pos.x) < 2 && Math.abs(o.y - pos.y) < 2
    );
}

function spawnFood() {
    let pos, attempts = 0;
    do {
        pos = {
            x: Math.floor(Math.random() * (CONFIG.gridSize - 2)) + 1,
            y: Math.floor(Math.random() * (CONFIG.gridSize - 2)) + 1
        };
        attempts++;
    } while (attempts < 100 && (
        gameState.snake.some(s => s.x === pos.x && s.y === pos.y) ||
        gameState.obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
        gameState.bossAcorns.some(a => a.x === pos.x && a.y === pos.y) ||
        gameState.bossWarnings.some(w => w.x === pos.x && w.y === pos.y) ||
        gameState.lavaPools.some(p => p.cells.some(c => c.x === pos.x && c.y === pos.y)) ||
        gameState.lavaWarnings.some(w => w.x === pos.x && w.y === pos.y) ||
        gameState.icicles.some(i => i.x === pos.x && i.y === pos.y) ||
        gameState.icicleWarnings.some(w => w.x === pos.x && w.y === pos.y) ||
        gameState.sandstoneObstacles.some(o => o.x === pos.x && o.y === pos.y) ||
        gameState.sandstoneWarnings.some(w => w.x === pos.x && w.y === pos.y) ||
        gameState.lightningObstacles.some(o => o.x === pos.x && o.y === pos.y) ||
        gameState.lightningWarnings.some(w => w.x === pos.x && w.y === pos.y)
    ));

    gameState.food = pos;
}

// ============================================
// GAME STATE MANAGEMENT
// ============================================
function updateHUD() {
    document.getElementById('level-display').textContent = gameState.level;
    document.getElementById('length-display').textContent = gameState.snake.length;
    document.getElementById('target-display').textContent = getLevelTarget(gameState.level);
    document.getElementById('speed-display').textContent = gameState.currentSpeed;
}

function gameOver() {
    gameState.gameStatus = 'gameover';
    document.getElementById('final-level').textContent = gameState.level;
    document.getElementById('final-length').textContent = gameState.snake.length;
    gameOverScreen.classList.remove('hidden');
    bossHud.classList.add('hidden');
    bossSprite.innerHTML = '';
    speedBoostIndicator.classList.add('hidden');
}

function levelComplete() {
    gameState.gameStatus = 'levelcomplete';
    document.getElementById('completed-level').textContent = gameState.level;

    const titleEl = document.getElementById('level-complete-title');
    const nextBtn = document.getElementById('next-level-btn');

    if (gameState.isBossLevel) {
        titleEl.textContent = 'BOSS DEFEATED!';
        titleEl.classList.add('victory-text');
        nextBtn.textContent = gameState.level >= CONFIG.maxLevel ? 'VICTORY!' : 'NEXT BIOME';
    } else {
        titleEl.textContent = 'LEVEL COMPLETE!';
        titleEl.classList.remove('victory-text');
        nextBtn.textContent = 'NEXT LEVEL';
    }

    levelCompleteScreen.classList.remove('hidden');
    bossHud.classList.add('hidden');
    bossSprite.innerHTML = '';
    speedBoostIndicator.classList.add('hidden');
}

function startLevel(level) {
    const lvl = Number(level) || 1;
    gameState.level = Math.min(Math.max(1, lvl), CONFIG.maxLevel);
    gameState.gameStatus = 'playing';

    // Set speed based on level
    gameState.currentSpeed = getLevelSpeed(gameState.level);
    gameState.moveInterval = 1000 / gameState.currentSpeed;

    // Boss setup
    gameState.isBossLevel = getBossLevel(gameState.level);
    gameState.bossType = getBossType(gameState.level);
    gameState.bossStage = 1;

    // Reset boss-specific state
    gameState.bossAcorns = [];
    gameState.bossWarnings = [];
    gameState.bossDropTimer = 0;
    gameState.lavaPools = [];
    gameState.lavaWarnings = [];
    gameState.icePatches = [];
    gameState.icicles = [];
    gameState.icicleWarnings = [];
    gameState.snowballTimer = 0;
    gameState.icicleTimer = 0;
    gameState.isSpeedBoosted = false;
    gameState.speedBoostTimer = 0;
    // Desert Sphinx
    gameState.windDirection = { x: 1, y: 0 };
    gameState.windChangeTimer = 0;
    gameState.windWarning = false;
    gameState.windWarningTimer = 0;
    gameState.sandstoneObstacles = [];
    gameState.sandstoneWarnings = [];
    // Thunder Bird
    gameState.isBlinded = false;
    gameState.blindTimer = 0;
    gameState.blindCooldown = 0;
    gameState.lightningObstacles = [];
    gameState.lightningWarnings = [];
    gameState.lightningTimer = 0;
    gameState.lastMoveTime = 0;

    // Apply biome theme
    const biome = getBiome(gameState.level);
    const biomeKey = getBiomeKey(gameState.level);
    applyBiomeTheme(biome);
    initParticles(biomeKey);

    initSnake();
    generateObstacles();
    spawnFood();
    updateHUD();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    speedBoostIndicator.classList.add('hidden');

    if (gameState.isBossLevel) {
        bossHud.classList.remove('hidden');
        const bossNames = {
            'forestSpirit': 'FOREST SPIRIT',
            'volcanoDragon': 'VOLCANO DRAGON',
            'iceGiant': 'ICE GIANT',
            'desertSphinx': 'DESERT SPHINX',
            'thunderBird': 'THUNDER BIRD'
        };
        document.getElementById('boss-name').textContent = bossNames[gameState.bossType];
        showBossWarning();
    } else {
        bossHud.classList.add('hidden');
    }
}

function showBossWarning() {
    bossWarning.classList.remove('hidden');
    setTimeout(() => {
        bossWarning.classList.add('hidden');
    }, 2000);
}

// ============================================
// INPUT HANDLING
// ============================================
document.addEventListener('keydown', (e) => {
    if (gameState.gameStatus !== 'playing') return;

    const keyMap = {
        'ArrowUp': { x: 0, y: -1 }, 'w': { x: 0, y: -1 }, 'W': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 }, 's': { x: 0, y: 1 }, 'S': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 }, 'a': { x: -1, y: 0 }, 'A': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 }, 'd': { x: 1, y: 0 }, 'D': { x: 1, y: 0 }
    };

    const newDir = keyMap[e.key];
    if (newDir) {
        if (newDir.x !== -gameState.direction.x || newDir.y !== -gameState.direction.y) {
            gameState.nextDirection = newDir;
        }
        e.preventDefault();
    }
});

// ============================================
// BUTTON HANDLERS
// ============================================
document.getElementById('start-btn').addEventListener('click', () => startLevel(1));
document.getElementById('go-btn').addEventListener('click', () => {
    const level = parseInt(document.getElementById('level-input').value, 10) || 1;
    startLevel(level);
});
document.getElementById('restart-btn').addEventListener('click', () => startLevel(1));
document.getElementById('menu-btn').addEventListener('click', () => {
    gameState.gameStatus = 'menu';
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    bossSprite.innerHTML = '';
    applyBiomeTheme(BIOMES.forest);
    initParticles('forest');
});
document.getElementById('next-level-btn').addEventListener('click', () => {
    if (gameState.level < CONFIG.maxLevel) {
        startLevel(gameState.level + 1);
    } else {
        gameState.gameStatus = 'menu';
        levelCompleteScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        applyBiomeTheme(BIOMES.forest);
        initParticles('forest');
    }
});

// ============================================
// GAME LOOP
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const biome = getBiome(gameState.level);
    const biomeKey = getBiomeKey(gameState.level);

    updateParticles(biome, biomeKey);

    if (gameState.gameStatus === 'playing') {
        updateBoss(deltaTime);
        drawBossSprite();

        // Use wind-modified interval for Desert Sphinx
        const effectiveInterval = gameState.bossType === 'desertSphinx'
            ? getWindModifiedInterval()
            : gameState.moveInterval;

        gameState.lastMoveTime += deltaTime;
        if (gameState.lastMoveTime >= effectiveInterval) {
            gameState.lastMoveTime = 0;
            moveSnake();
        }

        drawBackground(biome);
        drawObstacles(biome, biomeKey);
        drawBossElements(biome);
        drawFood(biome);
        drawSnake(biome);

        // Draw Thunder Bird blind effect
        if (gameState.bossType === 'thunderBird' && gameState.isBlinded) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw wind indicator for Desert Sphinx
        if (gameState.bossType === 'desertSphinx') {
            drawWindIndicator();
        }
    }

    requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZATION
// ============================================
applyBiomeTheme(BIOMES.forest);
initParticles('forest');
requestAnimationFrame(gameLoop);
