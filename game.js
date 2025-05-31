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
let lastKillerEnemyType = null;
let saveData = { characters: {} };

function setup() {
    createCanvas(1280, 720);
    setupPortrait();
    player = { pos: createVector(2500, 1750), vel: createVector(0, 0), lastShot: 0 };
    loadScenarioData();
    loadSaveData();
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
    // Preload thumbnails for recall mode
    if (scenarioData?.events?.gameOver) {
        Object.keys(scenarioData.events.gameOver).forEach(character => {
            Object.keys(scenarioData.events.gameOver[character]).forEach(species => {
                const thumbnail = scenarioData.events.gameOver[character][species].thumbnail;
                if (thumbnail && !loadedImages[thumbnail]) {
                    loadImage(thumbnail, 
                        img => {
                            loadedImages[thumbnail] = img;
                            console.log(`Preloaded thumbnail: ${thumbnail}`);
                        },
                        err => {
                            console.error(`Failed to preload thumbnail: ${thumbnail}`);
                        }
                    );
                }
            });
        });
    }
}

async function loadSaveData() {
    try {
        saveData = await window.electronAPI.loadSaveData();
        console.log('Save data loaded:', saveData);
    } catch (err) {
        console.error('Failed to load save data:', err);
        saveData = { characters: {} };
    }
}

async function saveGameData() {
    if (!selectedCharacter) return;
    
    if (!saveData.characters[selectedCharacter]) {
        saveData.characters[selectedCharacter] = {
            stages: {},
            scenarios: { gameOver: {} }
        };
    }

    if (!saveData.characters[selectedCharacter].stages[currentStage]) {
        saveData.characters[selectedCharacter].stages[currentStage] = { highScore: 0 };
    }
    saveData.characters[selectedCharacter].stages[currentStage].highScore = Math.max(
        saveData.characters[selectedCharacter].stages[currentStage].highScore,
        score
    );

    try {
        const success = await window.electronAPI.saveData(saveData);
        if (success) {
            console.log(`Autosaved data for ${selectedCharacter}, stage ${currentStage}, score ${score}`);
        } else {
            console.error('Autosave failed');
        }
    } catch (err) {
        console.error('Error during autosave:', err);
    }
}

function resetGameState() {
    gameTime = 0;
    pacingTimer = 0;
    stageClearTime = 0;
    lastScoreUpdate = 0;
    frameCounter = 0;
    score = 0;
    enemiesKilled = 0;
    rushEnemiesKilled = 0;
    rushCount = 0;
    lastRushKills = 0;
    lastRushSpawnCount = 0;
    rushEffectTime = 0;
    rushThreshold = 25;
    currentStage = 1;
    enemies = [];
    projectiles = [];
    expItems = [];
    damagePopups = [];
    effectCircles = [];
    poisonSwamps = [];
    meleeAttacks = [];
    bits = [];
    shootingBits = [];
    lastKillerEnemyType = null;
    if (playerStats) {
        playerStats.lastDamageEnemyType = null;
    }
    
    if (selectedCharacter) {
        loadCharacter(selectedCharacter);
        player.pos = createVector(2500, 1750);
        player.vel = createVector(0, 0);
        player.lastShot = 0;
        playerStats.hp = playerStats.maxHp || 100;
        playerStats.exp = 0;
        playerStats.level = 1;
    } else {
        playerStats = {};
        player = { pos: createVector(2500, 1750), vel: createVector(0, 0), lastShot: 0 };
    }

    if (window.upgrades) {
        window.upgrades.forEach(upgrade => {
            upgrade.level = 0;
        });
        if (debugLog && debugMode) {
            console.log('アップグレードをリセットしました');
        }
    }

    if (typeof levelUpChoices !== 'undefined') {
        levelUpChoices = [];
    }
    levelUpHoverIndex = -1;

    if (typeof resetStageState === 'function') {
        resetStageState();
    } else {
        console.warn('resetStageState 関数が見つかりません');
    }
}

function backToTitle() {
    setGameState('title');
    saveGameData();
    resetGameState();
    enemies = [];
    projectiles = [];
    expItems = [];
    damagePopups = [];
    effectCircles = [];
    poisonSwamps = [];
    meleeAttacks = [];
    bits = [];
    shootingBits = [];
    gameTime = 0;
    score = 0;
    enemiesKilled = 0;
    rushEnemiesKilled = 0;
    selectedCharacter = null;
    previewCharacter = null;
    if (typeof scenarioStarted !== 'undefined') {
        scenarioStarted = false;
        console.log('scenarioStarted reset to false');
    }
}

function draw() {
    if (['title', 'options'].includes(gameState)) {
        if (debugLog && debugMode) console.log(`ゲーム状態: ${gameState} の描画をスキップ`);
        return;
    }

    background(0);
    frameCounter++;

    if (gameState === 'recall') {
        if (isScenarioPlaying) {
            updateScenario();
            drawScenario();
            if (showBacklog) drawBacklog();
            if (debugLog && debugMode) console.log('シナリオを描画');
        } else {
            drawRecall();
            if (debugLog && debugMode) console.log('回想モードを描画');
        }
        return;
    }

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
            saveGameData();
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
    const scoreText = document.getElementById('scoreText');
    const killsText = document.getElementById('killsText');
    const timeText = document.getElementById('timeText');
    if (scoreText) scoreText.innerText = `スコア: ${score}`;
    if (killsText) killsText.innerText = `撃破数: ${enemiesKilled}`;
    if (timeText) timeText.innerText = `経過時間: ${floor(gameTime)}秒`;
}

function setGameState(newState) {
    console.log(`ゲーム状態を変更: ${newState}`);
    if (newState === 'gameOver') {
        saveGameData();
    }
    gameState = newState;

    const elements = ['title', 'options', 'paused', 'result', 'gameOver', 'recall'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        } else {
            console.warn(`DOM 要素が見つかりません: ${id}`);
        }
    });

    const targetElement = document.getElementById(newState);
    if (targetElement) {
        targetElement.style.display = 'block';
    } else if (['title', 'options', 'paused', 'result', 'gameOver', 'recall'].includes(newState)) {
        console.warn(`ターゲットDOM要素が見つかりません: ${newState}`);
    }

    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.display = ['title', 'options'].includes(newState) ? 'none' : 'block';
        canvas.tabIndex = 0;
        canvas.focus();
    } else {
        console.warn('ゲームキャンバスが見つかりません');
    }

    if (typeof drawCharacterPortrait === 'function' && newState !== 'recall') {
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
    } else if (newState !== 'recall') {
        console.warn('drawCharacterPortrait 関数が見つかりません');
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