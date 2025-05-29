let enemiesToRemove = new Set();
let projectilesToRemove = new Set();
let gameState = 'title';
let selectedCharacter = null;
let previewCharacter = null;
let player = null;
let playerStats = {};
let enemies = [];
let projectiles = [];
let expItems = [];
let damagePopups = [];
let effectCircles = [];
let poisonSwamps = [];
let meleeAttacks = [];
let bits = [];
let shootingBits = [];
let currentStage = 1;
let gameTime = 0;
let pacingTimer = 0;
let stageClearTime = 0;
let score = 0;
let lastScoreUpdate = 0;
let enemiesKilled = 0;
let rushEnemiesKilled = 0;
let rushThreshold = 25;
let lastRushKills = 0;
let rushCount = 0;
let lastRushSpawnCount = 0;
let rushEffectTime = 0;
let frameCounter = 0;
let spriteSheets = {};
let frameCounts = {
    'enemy_A': 1,
    'enemy_B': 1,
    'enemy_C': 1,
    'enemy_D': 1,
    'enemy_Z': 1,
    'enemy_Y': 1,
    'enemy_X': 1
};
let autoFire = false;
let hoverIndex = -1;
let levelUpHoverIndex = -1;
let debugLog = true;

function setup() {
    createCanvas(1280, 720);
    setupPortrait(); // Initialize portrait buffer
    player = { pos: createVector(2500, 1750), vel: createVector(0, 0), lastShot: 0 };
    if (selectedCharacter) {
        loadCharacter(selectedCharacter);
        playerStats.currentFrame = 0;
        playerStats.lastFrameChange = 0;
        playerStats.animationDirection = true;
    }
    console.log('ゲームを初期化しました');
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.display = gameState === 'title' ? 'none' : 'block';
        canvas.addEventListener('click', () => {
            canvas.focus();
            if (gameState === 'title') {
                setGameState('characterSelect');
                console.log('タイトルからキャラ選択へ移行');
            }
        });
    }
}

function draw() {
    if (['title', 'options'].includes(gameState)) {
        if (debugLog && debugMode) console.log(`ゲーム状態: ${gameState} の描画をスキップ`);
        return;
    }

    background(0);
    frameCounter++;

    if (gameState === 'playing' || gameState === 'boss') {
        enemiesToRemove.clear();
        projectilesToRemove.clear();

        gameTime += deltaTime / 1000;
        pacingTimer += deltaTime / 1000;
        let stageConfig = getStageConfig(currentStage);
        if (gameTime >= stageConfig.duration && stageClearTime === 0) {
            stageClearTime = millis();
        }
        if (stageClearTime > 0 && millis() - stageClearTime >= 3000) {
            setGameState('result');
        }
        if (millis() - lastScoreUpdate >= 1000) {
            score += 100;
            lastScoreUpdate = millis();
        }

        updateStageLogic(currentStage);
        updateEnemies();
        updatePlayer();
        updateEffects();

        // Draw in order: map > player > enemies > effects > bullets > enemy bullets
        drawMap();
        drawPlayer();
        drawEnemies();
        drawOtherEffects();
        drawBullets();
        drawEnemyBullets();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
        drawUI();

        removeEnemies();
        for (let i of [...projectilesToRemove].sort((a, b) => b - a)) {
            projectiles.splice(i, 1);
        }
    } else if (gameState === 'characterSelect') {
        drawCharacterSelect();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
    } else if (gameState === 'paused') {
        drawMap();
        drawPlayer();
        drawEnemies();
        drawOtherEffects();
        drawBullets();
        drawEnemyBullets();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
        drawPaused();
    } else if (gameState === 'levelUp') {
        drawMap();
        drawPlayer();
        drawEnemies();
        drawOtherEffects();
        drawBullets();
        drawEnemyBullets();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
        drawLevelUp();
    } else if (gameState === 'gameOver') {
        drawMap();
        drawPlayer();
        drawEnemies();
        drawOtherEffects();
        drawBullets();
        drawEnemyBullets();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
        drawGameOver();
    } else if (gameState === 'result') {
        drawResult();
    }

    if (debugLog) {
        fill(255);
        textSize(12);
        textAlign(LEFT, TOP);
        text(`状態: ${gameState}, レベル: ${playerStats.level || 'N/A'}, HP: ${playerStats.hp || 'N/A'}, 敵: ${enemies.length}`, 4, 10);
    }
}

function removeEnemies() {
    if (debugLog && debugMode) {
        console.log(`Before removal: enemies.length=${enemies.length}, enemiesToRemove=${[...enemiesToRemove]}`);
    }

    const validIndices = [...enemiesToRemove]
        .filter(i => i >= 0 && i < enemies.length && enemies[i])
        .sort((a, b) => b - a);

    for (let i of validIndices) {
        enemies.splice(i, 1);
    }

    enemiesToRemove.clear();

    if (debugLog && debugMode) {
        console.log(`After removal: enemies.length=${enemies.length}, enemiesToRemove=${[...enemiesToRemove]}`);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i]) {
            enemies.splice(i, 1);
            if (debugLog && debugMode) {
                console.log(`Removed null enemy at index ${i}`);
            }
        }
    }
}

function updateResultScreen() {
    setGameState('result');
    document.getElementById('scoreText').innerText = `スコア: ${score}`;
    document.getElementById('killsText').innerText = `撃破数: ${enemiesKilled}`;
    document.getElementById('timeText').innerText = `経過時間: ${floor(gameTime)}秒`;
}

function keyPressed() {
    if (gameState === 'characterSelect') {
        if (key === 'w' || key === 'W') {
            previewCharacter = previewCharacter === 'ANNA' ? 'TRACY' : 'ANNA';
            console.log(`プレビューキャラクター: ${previewCharacter}`);
        } else if (key === 's' || key === 'S') {
            previewCharacter = previewCharacter === 'TRACY' ? 'ANNA' : 'TRACY';
            console.log(`プレビューキャラクター: ${previewCharacter}`);
        } else if (key === ' ') {
            if (previewCharacter && previewCharacter !== 'URANUS') {
                selectedCharacter = previewCharacter;
                loadCharacter(selectedCharacter);
                gameState = 'playing';
                setGameState('playing');
                const canvas = document.querySelector('canvas');
                if (canvas) canvas.style.display = 'block';
                console.log(`選択したキャラクター: ${selectedCharacter}, 状態: playing`);
            }
        }
    } else if (gameState === 'playing' && (key === 'q' || key === 'Q')) {
        autoFire = !autoFire;
        console.log(`自動射撃: ${autoFire}`);
    } else if (gameState === 'paused' && (key === 'p' || key === 'P')) {
        setGameState('playing');
    } else if (gameState === 'playing' && (key === 'p' || key === 'P')) {
        setGameState('paused');
    } else if (gameState === 'levelUp') {
        if (key === 'e' || key === 'E') {
            levelUpHoverIndex = (levelUpHoverIndex + 1) % levelUpChoices.length;
            console.log(`レベルアップ選択: ${levelUpChoices[levelUpHoverIndex].name}`);
        } else if (key === ' ') {
            if (levelUpHoverIndex >= 0) {
                let upgrade = levelUpChoices[levelUpHoverIndex];
                upgrade.level++;
                if (typeof upgrade.effect === 'function') {
                    if (upgrade.effect.length === 0) {
                        upgrade.effect();
                    } else {
                        upgrade.effect(upgrade.level - 1);
                    }
                }
                gameState = 'playing';
                levelUpChoices = [];
                levelUpHoverIndex = -1;
                console.log(`選択した強化: ${upgrade.name}`);
            }
        }
    } else if (gameState === 'result' && key === ' ') {
        backToTitle();
    }
}

function mousePressed() {
    handleMousePressed();
}

function updateGrid() {
    if (debugLog && debugMode) console.log('グリッドを更新しました');
}

function updateShield() {
    if (debugLog && debugMode) console.log('シールドを更新しています');
}