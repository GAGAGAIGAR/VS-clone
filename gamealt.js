// game.js

// --- グローバル変数 ---
let gameState = 'logo'; // ★★★ 初期gameStateを 'logo' に変更 ★★★
let logoDisplayStartTime = 0; // ★★★ ロゴ表示開始時間を保持する変数を追加 ★★★
const LOGO_DISPLAY_DURATION = 2000; // ロゴ表示時間 (ミリ秒)
let activeTimeouts = []; // ★★★ 実行中のsetTimeoutのIDを管理する配列を追加 ★★★
let characterProfiles = {}; // ★★★ プロフィールを保持する変数を追加 ★★★
let enableMouseCorrection = true; // ★★★ マウス補正機能の有効/無効を管理する変数を追加（デフォルトは有効）

let stageCompleteSequenceStarted = false;
let unitsToRemove = new Set();
let projectilesToRemove = new Set();
// gameState = 'title'; // 上で 'logo' に変更済み
let selectedCharacter = null;
let previewCharacter = null;
let player = null;
let playerStats = {};
let units = [];
let projectiles = [];
let expItems = [];
let damagePopups = [];
let effectCircles = [];
let poisonSwamps = [];
let meleeAttacks = [];
    waterZoneProjectiles = []; // ★★★ 放物線投擲物を管理する配列を追加
let waterZones = [];           // ★★★ 水流地帯を管理する配列を追加
let bounceOrbs = []; // ★★★ バウンスオーブを管理する配列を追加
let bits = [];
let shootingBits = [];
let currentStage = 1;
let gameTime = 0;
let pacingTimer = 0;
let score = 0;
let lastScoreUpdate = 0;
let enemiesKilled = 0;
let rushEnemiesKilled = 0;
let lastRushKills = 0;
let rushCount = 0;
let lastRushSpawnCount = 0;
let rushEffectTime = 0;
let frameCounter = 0;
let spriteSheets = {};
let frameCounts = { /* ... (既存のフレームカウント) ... */ };
let autoFire = false;
let levelUpHoverIndex = -1;
let nextStageAvailable = false; // ★★★ このフラグをグローバル変数として明確に定義

//デバッグ用変数
let debugLog = true;
let debugMode = false;
let showHitboxes = false; // ★★★ この行を追加。trueにすると当たり判定が表示される


let whiteFlashActive = false; // 白いフラッシュがアクティブかどうか
let whiteFlashStartTime = 0; // フラッシュ開始時間
const whiteFlashDuration = 150; // フラッシュの表示時間 (ミリ秒)
let saveData = { characters: {} };
const baseWidth = 1280;
const baseHeight = 720;
let globalScale = 1;
let activeCutins = []; // ★★★ カットイン管理用の配列を追加
let upgradeDescriptions = {}; // ★★★ 説明文を保持する変数を追加 ★★★
// --- ステージ進行・シナリオ関連フラグ ---
let stageClearConditionMet = false; // 初期化をletに修正
let defeatedBossesThisStage = new Set();
// defeatedBossesThisStage.clear(); // resetGameStateで行う
let justSpawnedBossType = null;
let justTriggeredEventId = null;
let gameOverScenarioPlayed = false; // ★★★ ゲームオーバーシナリオが再生されたかどうかのフラグを追加 ★★★
// window.transitionToResultAfterScenario = false; // resetGameStateで行う
// stageCompleteSequenceStarted = false; // resetGameStateで行う
// if (typeof resetActiveStageScenarioTriggers === 'function') { // resetGameStateで行う
//     resetActiveStageScenarioTriggers();
// }
let virtualCursorPos = { x: 0, y: 0 };
let stageSelectMode = 'campaign'; // 'campaign' または 'frontline'
let queuedCutin = null;     // ★★★ シナリオ後に実行するカットインを予約
let queuedBGMChange = null; // ★★★ シナリオ後に実行するBGM変更を予約

// --- p5.js Functions ---
function setup() {
    console.log("--- game.js: setup() START ---");
    const canvas = createCanvas(1280, 720); 

    canvas.drawingContext.willReadFrequently = true;
    windowResized();
    setupPortrait(); 

    virtualCursorPos = { x: 960 / 2, y: 720 / 2 };

    document.addEventListener('mousemove', e => {
        const canvasEl = canvas.canvas;
        if (document.pointerLockElement === canvasEl) {
            virtualCursorPos.x += e.movementX;
            virtualCursorPos.y += e.movementY;
        } else {
            if (canvasEl) {
                const rect = canvasEl.getBoundingClientRect();
                virtualCursorPos.x = (e.clientX - rect.left) / globalScale;
                virtualCursorPos.y = (e.clientY - rect.top) / globalScale;
            }
        }
        const gameWidth = 960;
        const gameHeight = 720;
        virtualCursorPos.x = constrain(virtualCursorPos.x, 0, gameWidth);
        virtualCursorPos.y = constrain(virtualCursorPos.y, 0, gameHeight);
    }, false);

    // ★★★ ここからが修正箇所 ★★★
    // ポインターロック状態の変更を監視するイベントリスナーを追加
    document.addEventListener('pointerlockchange', () => {
        const canvasEl = canvas.canvas;
        // ポインターロックが解除され、かつゲームプレイ中だった場合
        if (document.pointerLockElement !== canvasEl && (gameState === 'playing' || gameState === 'boss')) {
            // ESCキーが押されたと判断し、強制的にポーズ状態に移行
            console.log("Pointer lock exited unexpectedly, forcing pause state.");
            setGameState('paused');
        }
    }, false);
    // ★★★ 修正ここまで ★★★

    const mapSize = getStageConfig(currentStage).mapSize;
    player = { pos: createVector(mapSize.width / 2, mapSize.height / 2), vel: createVector(0, 0), lastShot: 0, facingDirection: 1 };

    loadScenarioData();
    loadSaveData();
    loadDescriptions(); 
    if (selectedCharacter) {
        loadCharacter(selectedCharacter);
    }
    initializeGrid();
    resetGameState();
    logoDisplayStartTime = 0;

    window.electronAPI.onWindowBlur(() => {
        console.log('Renderer: Window blurred, exiting pointer lock.');
        document.exitPointerLock();
        // ウィンドウが非アクティブになったら、ゲームをポーズする
        if (gameState === 'playing' || gameState === 'boss') {
            setGameState('paused');
        }
    });

    console.log(`Game initialized. Initial stage: ${currentStage}. Starting with logo screen.`);
    if (canvas.canvas) { 
        canvas.canvas.style.display = 'block';
        canvas.canvas.tabIndex = 0;
        canvas.canvas.focus();
    }
    console.log("--- game.js: setup() END ---");
}

// ... (loadSaveData, saveGameData, reiddleScenarioTriggers, backToTitle, draw の主要部分は変更なし)
// ただし、resetGameState内のフラグクリアは適切に行われていることを確認setGameState, checkStageClearConditions, checkM

async function loadSaveData() {
    try {
        const loadedData = await window.electronAPI.loadSaveData();
        if (loadedData) {
            saveData = loadedData;
            isFrontlineLocked = !saveData.stagesUnlocked?.includes(3);
            
            // ★ ロードしたオプション設定をゲームに適用 ★
            if (saveData.options) {
                gameOptions = saveData.options;
                // 各グローバル変数にも反映
                sfxVolume = gameOptions.sfxVolume;
                bgmVolume = gameOptions.bgmVolume;
                enableMouseCorrection = gameOptions.enableMouseCorrection;
                // BGM音量を即時反映
                if (currentBGM && currentBGM.isPlaying()) {
                    currentBGM.setVolume(bgmVolume);
                }
            }

            console.log("Save data loaded and applied successfully.");
        }
    } catch (error) {
        console.error("Failed to load save data in renderer:", error);
    }
}

// ★★★ 2. saveGameData関数を修正 ★★★
function saveGameData() {
    // ★ セーブする前に、現在のオプション値をsaveDataオブジェクトに反映 ★
    saveData.options = {
        sfxVolume: sfxVolume,
        bgmVolume: bgmVolume,
        enableMouseCorrection: enableMouseCorrection
    };
    
    // オブジェクト全体をセーブする
    if (window.electronAPI) {
        window.electronAPI.saveData(saveData);
    }
}
function resetGameState() {
    // --- 1. ゲーム進行に関わるフラグやタイマーをリセット ---
    gameOverScenarioPlayed = false;
        portraitFlashActive = false; // ★★★ フラッシュの状態をリセット
    for (const timeoutId of activeTimeouts) {
        clearTimeout(timeoutId);
    }
    activeTimeouts = [];
    console.log(`Cleared ${activeTimeouts.length} pending timeouts.`);

    gameTime = 0;
    pacingTimer = 0;
    score = 0; 
    lastScoreUpdate = millis(); 
    enemiesKilled = 0;
    rushEnemiesKilled = 0;
    rushCount = 0;
    lastRushKills = 0;
    lastRushSpawnCount = 0;
    rushEffectTime = 0;
    rushThreshold = 25; 
    parabolicProjectiles = [];
    waterZones = [];
    bounceOrbs = []; 
    activeCutins = []; 
     queuedCutin = null;     // ★ 追加
    queuedBGMChange = null; // ★ 追加      
    activeExplosions = []; // ★★★ ゲームリセット時に配列を初期化
     // ★ resetGameStateでもフラグをリセット（安全策）
    nextStageAvailable = false; 
    
    units = [];
    projectiles = [];
    expItems = [];
    damagePopups = [];
    effectCircles = [];
    poisonSwamps = [];
    meleeAttacks = [];
    bits = [];
    shootingBits = [];
    
    initializeGrid();
    
    stageClearConditionMet = false;
    defeatedBossesThisStage.clear();
    justSpawnedBossType = null;
    justTriggeredEventId = null;
    window.transitionToResultAfterScenario = false;
    stageCompleteSequenceStarted = false;

    if (typeof resetActiveStageScenarioTriggers === 'function') {
        resetActiveStageScenarioTriggers(); 
    }
    if (typeof resetStageState === 'function') { 
        resetStageState();
    }

    const stageConfig = getStageConfig(currentStage);
    if (stageConfig) {
        currentStageBgmId = stageConfig.bgmId;
        // ★★★ ステージ設定からラッシュの初期しきい値を読み込む ★★★
        rushThreshold = stageConfig.initialRushThreshold || 25;
    } else {
        currentStageBgmId = null;
        rushThreshold = 25; // フォールバック
    }

    // ★★★ 2. キャラクターのステータスを完全に初期化 ★★★
    if (selectedCharacter) { 
        // まずキャラクターの基本パラメータをロードして playerStats を準備
        loadCharacter(selectedCharacter); 
        
        // ★★★ 修正点: loadCharacterの後に、ゲーム進行で変動する値を確実にリセット ★★★
        playerStats.exp = 0;
        playerStats.level = 1;
        playerStats.expToNext = expRequirements[0];
        playerStats.lastDamageUnitType = null; // ← この行が重要！前回の敗因情報を確実に消去します。
        playerStats.isFlashing = false;
        playerStats.isInvincible = false;
        playerStats.portraitStatusLevel = 3; // ポートレイトのステータスレベルを初期化

    } else { 
        // キャラクターが選択されていない場合は、playerStatsを空にする
        playerStats = {};
    }
    
    // --- 3. プレイヤーエンティティの位置などをリセット ---
    const mapSize = getStageConfig(currentStage).mapSize;
    player = { 
        pos: createVector(mapSize.width / 2, mapSize.height / 2), 
        vel: createVector(0, 0), 
        lastShot: 0,
        facingDirection: 1 // 1:右, -1:左
    };


    // --- 4. アップグレード状態をリセット ---
    if (window.upgrades) {
        window.upgrades.forEach(upgrade => {
            upgrade.level = 0;
        });
    }
    levelUpChoices = []; 
    levelUpHoverIndex = -1; 

    console.log("Game state has been reset completely.");
}


// ★★★ 1. checkStageClearConditions 関数の修正 ★★★
function checkStageClearConditions() {
    if (stageClearConditionMet) return;

    const config = getStageConfig(currentStage);
    if (!config.clearConditions || !config.clearConditions.conditions || config.clearConditions.conditions.length === 0) {
        return;
    }

    const conditions = config.clearConditions.conditions;
    const mode = config.clearConditions.mode;
    let conditionsSatisfiedCount = 0;

    for (const condition of conditions) {
        let currentConditionMet = false;
        switch (condition.type) {
            case 'killBoss':
                if (defeatedBossesThisStage.has(condition.value)) {
                    currentConditionMet = true;
                }
                break;
            case 'surviveTime':
                if (gameTime >= condition.value) {
                    currentConditionMet = true;
                }
                break;
            default:
                console.warn(`Unknown clear condition type: ${condition.type}`);
                break;
        }
        if (currentConditionMet) {
            conditionsSatisfiedCount++;
        }
    }

    if ((mode === 'ALL' && conditionsSatisfiedCount === conditions.length) ||
        (mode === 'ANY' && conditionsSatisfiedCount > 0)) {
        
        if (!stageClearConditionMet) {
            stageClearConditionMet = true;
            console.log("ステージクリア条件達成！");
            
            // ★★★ ここからが修正箇所 ★★★
            // 次のステージが存在するか確認し、存在すればnextStageAvailableフラグをtrueに設定
            const currentStageIndex = stageConfigs.findIndex(s => s.stage === currentStage);
            if (currentStageIndex !== -1 && currentStageIndex + 1 < stageConfigs.length) {
                const nextStageConfig = stageConfigs[currentStageIndex + 1];
                if (typeof nextStageConfig.stage === 'number') {
                    nextStageAvailable = true;
                    console.log("nextStageAvailableフラグをtrueに設定しました。");
                }
            }
            // ★★★ 修正ここまで ★★★

            startScenario('stageObjectivesMet', selectedCharacter, currentStage);
        }
    }
}

// ★★★ 2. checkMiddleScenarioTriggers 関数の修正 ★★★
/**
 * ステージ進行中のイベント発生をチェックし、シナリオやカットインを開始する
 */
function checkMiddleScenarioTriggers() {
    if (isScenarioPlaying) return;

    const stageConfig = getStageConfig(currentStage);
    if (!stageConfig.scenarioTriggers) return;

    for (const trigger of stageConfig.scenarioTriggers) {
        
        let triggerKey;
        switch (trigger.conditionType) {
            case 'timeReached': triggerKey = `time-${trigger.timeValue}`; break;
            case 'bossAppeared': triggerKey = `bossAppeared-${trigger.bossType}`; break;
            case 'bossDefeated': triggerKey = `bossDefeated-${trigger.bossType}`; break;
            default: triggerKey = trigger.scenarioTriggerId || trigger.cutin || trigger.changeBGM?.id; break;
        }
        const fullTriggerKey = `${currentStage}-${triggerKey}`;

        if (trigger.once && activeStageScenarioTriggers.has(fullTriggerKey)) {
            continue;
        }

        let conditionMet = false;
        let consumeEventId = true;

        switch (trigger.conditionType) {
            case 'bossAppeared':
                if (justSpawnedBossType === trigger.bossType) { conditionMet = true; }
                break;
            case 'bossDefeated':
                 if (justTriggeredEventId === trigger.scenarioTriggerId && defeatedBossesThisStage.has(trigger.bossType)) { conditionMet = true; }
                break;
            case 'reinforcementSpawned':
                if (justTriggeredEventId === trigger.scenarioTriggerId) { conditionMet = true; }
                break;
            case 'eventOccurred':
                 if (justTriggeredEventId === trigger.eventId) { conditionMet = true; }
                break;
            case 'rushOccurred':
                if (justTriggeredEventId === trigger.scenarioTriggerId) { conditionMet = true; }
                break;
            case 'timeReached':
                if (gameTime >= trigger.timeValue) {
                    conditionMet = true;
                    consumeEventId = false; 
                }
                break;
            case 'clearConditionsMet':
                if (stageClearConditionMet) { conditionMet = true; }
                break;
            default:
                 console.warn(`[MiddleTrigger] Unknown conditionType: ${trigger.conditionType}`);
                 break;
        }

        if (conditionMet) {
            let scenarioStarted = false;
            // 1. シナリオIDの指定があれば、シナリオを開始する
            if (trigger.scenarioTriggerId && typeof startScenario === 'function') {
                if (startScenario('stageMiddle', selectedCharacter, currentStage, trigger.scenarioTriggerId)) {
                    scenarioStarted = true;
                }
            }
            
            // 2. シナリオが開始された場合、他の演出を「予約」する
            if (scenarioStarted) {
                if (trigger.cutin) {
                    queuedCutin = trigger.cutin;
                }
                if (trigger.changeBGM) {
                    queuedBGMChange = trigger.changeBGM;
                }
            } 
            // 3. シナリオがない場合、演出を即座に実行する
            else {
                if (trigger.cutin && typeof startCutin === 'function') {
                    startCutin(trigger.cutin);
                }
                if (trigger.changeBGM && typeof playBGM === 'function') {
                    currentStageBgmId = trigger.changeBGM.id;
                    playBGM(trigger.changeBGM.id, trigger.changeBGM.loop);
                }
            }

            if (consumeEventId) {
                if (trigger.conditionType === 'bossAppeared') justSpawnedBossType = null;
                else if (['bossDefeated', 'reinforcementSpawned', 'eventOccurred', 'rushOccurred'].includes(trigger.conditionType)) {
                    justTriggeredEventId = null;
                }
            }

            if (trigger.once) {
                activeStageScenarioTriggers.add(fullTriggerKey);
            }
            
            // シナリオが始まった場合は、他のトリガーをチェックせずに終了
            if (scenarioStarted) return;
        }
    }
}

function backToTitle() {
    console.log("Returning to title screen.");
    setGameState('title');
    nextStageAvailable = false; // ★ タイトルに戻る際にフラグをリセット
    // resetGameState(); // setGameState('title')の後で呼ばれるのが一般的
}

function windowResized() {
    // ウィンドウサイズに合わせて、アスペクト比を維持した最大のスケールを計算
    let scale = min(windowWidth / baseWidth, windowHeight / baseHeight);
    
    // 新しいキャンバスサイズを計算
    let newWidth = baseWidth * scale;
    let newHeight = baseHeight * scale;

    // キャンバスサイズを変更
    resizeCanvas(newWidth, newHeight);

    // グローバルなスケール値を更新
    globalScale = newWidth / baseWidth;

    console.log(`Window resized. New canvas: ${newWidth}x${newHeight}, Scale: ${globalScale}`);
}

function draw() {
    push();
    scale(globalScale);
    background(0);
    frameCounter++;

    // --- 各ゲーム状態に応じたメインの描画処理 ---
    if (gameState === 'logo') {
        drawLogoScreen();
    } else if (gameState === 'title') {
        drawTitle();
    } 
    // ★ 新しいゲーム状態 'stageSelect' を追加
    else if (gameState === 'stageSelect') {
        drawStageSelect(); // ui.js に新しく作る描画関数
    }
    else if (gameState === 'characterSelect') {
        drawCharacterSelect();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
    } 
    else if (gameState === 'characterSelect_fr') {
        drawCharacterSelect_fr();
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
    }
    else if (gameState === 'options') {
        // HTMLで描画
    }  else if (gameState === 'recall') {
        if (isScenarioPlaying) { 
            updateScenario(); 
            drawScenario();   
            if (showBacklog) drawBacklog(); 
        } else {
            drawRecall();
        }
    } else if (gameState === 'scenario') { 
        if (previousGameState === 'playing' || previousGameState === 'boss' || previousGameState === 'characterSelect' || previousGameState === 'characterSelect_fr') {
            drawGameScene(); 
        }
        if (isScenarioPlaying || isFadingIn) { 
            updateScenario(); 
            drawScenario();   
            if (showBacklog) drawBacklog(); 
        } else {
            if (previousGameState) endScenario();
            else backToTitle(); 
        }
    } else if (gameState === 'playing' || gameState === 'boss') {
        if (!isScenarioPlaying) {
            gameTime += deltaTime / 1000;
            pacingTimer += deltaTime / 1000;
            updateStageLogic(currentStage);
            updateUnits();
            updatePlayer();
            updateEffects();
            if (!stageClearConditionMet) checkStageClearConditions();
            checkMiddleScenarioTriggers();
            const stageConfig = getStageConfig(currentStage);
            if (stageClearConditionMet && !stageCompleteSequenceStarted) {
                if (stageConfig.manualExitRequiredForClear === false) {
                    proceedToStageClearSequence();
                }
            }
            if (gameTime >= stageConfig.duration) {
                if (!stageClearConditionMet) {
                    playerStats.hp = 0;
                    playerStats.lastDamageUnitType = stageConfig.timeLimitFailure?.lastDamageUnitType || 'TIME_LIMIT_FAILURE';
                    saveGameData();
                    setGameState('gameOver');
                }
            }
            removeUnits();
        }
        drawGameScene();
    } else if (gameState === 'paused') {
        drawGameScene(); 
        drawPaused();    
    } else if (gameState === 'levelUp') {
        drawGameScene(); 
        drawLevelUp();   
    } else if (gameState === 'gameOver') {
        drawGameScene(); 
        if (isScenarioActive()) {
            updateScenario();
            drawScenario();
            if (showBacklog) drawBacklog();
        } else if (!gameOverScenarioPlayed) {
            gameOverScenarioPlayed = true; 
            const species = playerStats?.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]
                ? unitTypes[playerStats.lastDamageUnitType].species || 'default'
                : 'default';
            if (!startScenario('gameOver', selectedCharacter, species)) {
                fallbackGameOver();
            }
        } else {
            const defeatResultBgmId = 6;
            if (currentBgmId !== defeatResultBgmId || (currentBGM && !currentBGM.isPlaying())) {
                playBGM(defeatResultBgmId);
            }
            fallbackGameOver();
        }
    } else if (gameState === 'result') {
        drawGameScene();
        drawResultScreen();
    }
    
    // --- 2. 全ての描画処理の最後に、UI要素をまとめて描画 ---
    if (typeof updateAndDrawCutins === 'function') {
        updateAndDrawCutins();
    }
    
    if (gameState !== 'logo' && !isScenarioPlaying) {
        drawVirtualCursor();
    }
    
//    if ((gameState === 'playing' || gameState === 'boss') && !autoFire) {
 //       drawAimingLine();
 //   }
    
    pop();
}
/**
 * ステージクリア後のシーケンスを開始する
 */
function proceedToStageClearSequence() {
    stageCompleteSequenceStarted = true;
    
    // 次のステージが存在するか確認
    const currentStageIndex = stageConfigs.findIndex(s => s.stage === currentStage);
    if (currentStageIndex !== -1 && currentStageIndex + 1 < stageConfigs.length) {
        const nextStageConfig = stageConfigs[currentStageIndex + 1];
        if (typeof nextStageConfig.stage === 'number') {
            if (!saveData.stagesUnlocked.includes(nextStageConfig.stage)) {
                saveData.stagesUnlocked.push(nextStageConfig.stage);
                console.log(`Stage ${nextStageConfig.stage} unlocked!`);
            }
            // ★ 次のステージへ進むことが可能である、というフラグを立てる
            nextStageAvailable = true; 
        }
    }
    
    saveGameData(); // アンロック情報を先にセーブ

    const stageConfig = getStageConfig(currentStage);
    const clearScenarioId = stageConfig.clearScenarioId || 'stageClear';
    window.transitionToResultAfterScenario = true; 
    
    if (!startScenario(clearScenarioId, selectedCharacter, currentStage)) {
        window.transitionToResultAfterScenario = false;
        setGameState('result');
    }
}

function proceedToNextStage() {
    // フラグが立っていない場合は何もしない（安全策）
    if (!nextStageAvailable) return;

    const currentStageIndex = stageConfigs.findIndex(s => s.stage === currentStage);
    if (currentStageIndex !== -1 && currentStageIndex + 1 < stageConfigs.length) {
        const nextStageConfig = stageConfigs[currentStageIndex + 1];
        
        // 次のステージ番号を設定
        currentStage = nextStageConfig.stage;
        
        // ★ 次のステージ用にゲーム盤面をリセット（プレイヤーの能力値は維持）
        resetForNextStage();

        // ステージ開始シナリオを開始
        if (!startScenario('stageStart', selectedCharacter, currentStage)) {
            // シナリオがない場合は、直接ゲームプレイを開始
            setGameState('playing');
        }
    } else {
        // 次のステージがない場合はタイトルへ
        backToTitle();
    }
}

function goToNextStage() {
    if (typeof currentStage === 'number') {
        currentStage++; // ステージ番号を1つ進める
        resetGameState(); // ゲームの状態をリセット
        
        // ステージ開始シナリオがあれば再生、なければ即ゲーム開始
        if (startScenario('stageStart', selectedCharacter, currentStage)) {
            setGameState('scenario');
        } else {
            setGameState('playing');
        }
    } else {
        // 番号付きでないステージ（'fr'など）からはタイトルに戻る
        backToTitle();
    }
}

function removeUnits() {
    if (debugLog && debugMode) {
        // console.log(`Before removal: units.length=${units.length}, unitsToRemove=${[...unitsToRemove]}`);
    }

    const validIndices = [...unitsToRemove]
        .filter(i => i >= 0 && i < units.length && units[i])
    .sort((a, b) => b - a);

    for (let i of validIndices) {
        units.splice(i, 1);
    }

    unitsToRemove.clear();

    if (debugLog && debugMode) {
        // console.log(`After removal: units.length=${units.length}, unitsToRemove=${[...unitsToRemove]}`);
    }

    for (let i = units.length - 1; i >= 0; i--) {
        if (!units[i]) {
            units.splice(i, 1);
            if (debugLog && debugMode) {
                // console.log(`Removed null unit at index ${i}`);
            }
        }
    }
}

function updateResultScreen() {
    // この関数はDOM操作なので、setGameState('result')時に直接DOMを更新する形に変更
    // setGameState('result'); // ここで呼ぶと無限ループの可能性
    const scoreText = document.getElementById('scoreText');
    const killsText = document.getElementById('killsText');
    const timeText = document.getElementById('timeText');
    if (scoreText) scoreText.innerText = `score: ${score}`;
    if (killsText) killsText.innerText = `Enemies Killed: ${enemiesKilled}`;
    if (timeText) timeText.innerText = `Elapsed Time: ${floor(gameTime)} seconds`;
}

function setGameState(newState) {
    const previousState = gameState;
    console.log(`Changing game state from ${previousState} to: ${newState}`);
    if (newState === 'playing' && (previousState === 'characterSelect' || previousState === 'characterSelect_fr')) {
        nextStageAvailable = false;
        console.log("新しいステージが開始されたため、nextStageAvailableフラグをfalseにリセットしました。");
    }
        // ★ オプション画面から戻る時に設定をセーブする ★
    if (previousState === 'options' && newState !== 'options') {
        saveGameData();
        console.log("Options saved.");
    }

    const canvasEl = document.querySelector('canvas');

    // ★★★ ポインターロックの制御を修正 ★★★
    if (newState === 'playing' || newState === 'boss') {
        // ゲームプレイ状態になったら、ロックを要求
        if (canvasEl && document.pointerLockElement !== canvasEl) {
            canvasEl.requestPointerLock();
        }
    } else {
        // ゲームプレイ以外の状態では、ロックを解除
        if (document.pointerLockElement === canvasEl) {
            document.exitPointerLock();
        }
    }
    
    // OSカーソルの表示/非表示制御（変更なし）
    if (newState === 'playing' || newState === 'boss' || newState === 'paused' || newState === 'levelUp') {
        noCursor();
    } else {
        cursor(ARROW);
    }
    gameState = newState;
    
    if (newState === 'gameOver' && previousState !== 'gameOver') {
        saveGameData();
    }

    // ★ DOM要素の表示/非表示リストに 'stageSelect' を追加
    const elements = ['title', 'options', 'paused', 'result', 'gameOver', 'recall', 'characterSelect', 'characterSelect_fr', 'stageSelect'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });

    const targetElement = document.getElementById(newState);
    if (targetElement && newState !== 'title' && newState !== 'logo') {
        targetElement.style.display = 'block';
        if (newState === 'options') {
            updateOptionsScreen();
        }
        if (newState === 'result') {
            updateResultScreen();
        }
    }

    // BGM再生ロジック (前回の修正をベースに、ロゴ画面からの遷移を考慮)
    if (previousState !== newState || newState === 'logo') { // ロゴ表示開始時もBGM制御を試みる場合 (ただし、通常ロゴではBGMなし)
        if (newState === 'logo') {
            // ロゴ画面ではBGMを再生しない、または専用の短いジングルを再生
            if (currentBgmId !== null) stopBGM(); // 他のBGMが流れていれば止める
        } else if (newState === 'title') {
            // ロゴ画面からタイトルへの遷移時にタイトルBGMを再生
            if (currentBgmId !== 1 || (currentBGM && !currentBGM.isPlaying())) {
                playBGM(1); 
            } else if (currentBgmId === 1 && currentBGM && currentBGM.isPlaying()) {
                restoreCurrentBgmVolume(); 
            }
        } else if (newState === 'characterSelect') {
                playBGM(5);       
        } 
                else if (newState === 'recall') {
            const recallBgmId = 8; // 回想モード用のBGM ID
            // 現在再生中のBGMが8番でない場合、またはBGMが停止している場合に再生
            if (currentBgmId !== recallBgmId || (currentBGM && !currentBGM.isPlaying())) {
                playBGM(recallBgmId);
            }
        }        else if (newState === 'playing' || newState === 'boss') {
            if (!isScenarioPlaying) {
                // ★★★ 参照先を stageConfig.bgmId から currentStageBgmId に変更 ★★★
                const targetBgmId = currentStageBgmId;

                if (targetBgmId !== undefined) {
                    if (previousState === 'paused' || previousState === 'levelUp') {
                        if (currentBgmId === targetBgmId) {
                            restoreCurrentBgmVolume();
                            if (currentBGM && !currentBGM.isPlaying()) {
                               const bgmInfo = bgmData[currentBgmId];
                               if (bgmInfo && bgmInfo.loop) currentBGM.loop(); else if (currentBGM) currentBGM.play();
                            }
                        } else {
                            playBGM(targetBgmId);
                        }
                    } else {
                        if (currentBgmId !== targetBgmId || (currentBGM && !currentBGM.isPlaying())) {
                             playBGM(targetBgmId);
                        } else {
                            restoreCurrentBgmVolume();
                        }
                    }
                } else {
                    console.warn(`No BGM defined for stage ${currentStage}.`);
                    if (currentBgmId !== null) stopBGM();
                }
            }
        }         else if (newState === 'result') {
            // --- ここからが修正箇所 ---
            resultHoverIndex = 0; // ホバー選択を先頭にリセット
            resultChoices = [];   // 選択肢を初期化

            // 次のステージが利用可能かチェック
            let nextStageAvailable = false;
            if (selectedCharacter && typeof currentStage === 'number') {
                const maxStage = saveData.characters[selectedCharacter]?.maxStageUnlocked || 1;
                if (currentStage < maxStage) {
                    nextStageAvailable = true;
                }
            }

            // 利用可能な選択肢を配列に追加
            if (nextStageAvailable) {
                resultChoices.push({ name: '次のステージへ', action: goToNextStage });
            }
            resultChoices.push({ name: 'タイトルへ戻る', action: backToTitle });

            // リザルトBGMを再生
             if (currentBgmId !== 4 || (currentBGM && !currentBGM.isPlaying())) {
                playBGM(4); // リザルト画面BGM
            }
        }    else if (gameState === 'gameOver') {
        // 背景として、ゲームが停止した瞬間のシーンを描画
        drawGameScene(); 
        
        // isScenarioActive() は scenario.js で定義されている isScenarioPlaying の状態を返す
        if (isScenarioActive()) {
            // シナリオが再生中なら、シナリオの更新と描画を行う
            updateScenario();
            drawScenario();
            if (showBacklog) drawBacklog();
        } else if (!gameOverScenarioPlayed) {
            // シナリオがまだ再生されておらず、フラグが false の場合のみ実行
            // ... (このブロックは変更なし) ...
            gameOverScenarioPlayed = true; 
            const species = playerStats?.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]
                ? unitTypes[playerStats.lastDamageUnitType].species || 'default'
                : 'default';
            if (!startScenario('gameOver', selectedCharacter, species)) {
                fallbackGameOver();
            }
        } else {
            // ★★★ ここからが修正箇所 ★★★
            // シナリオが既に再生終了した場合（＝敗北リザルト表示時）
            
            // 1. 敗北リザルト専用のBGMを再生する
            const defeatResultBgmId = 6; // 例: 敗北リザルト用のBGM ID
            if (currentBgmId !== defeatResultBgmId || (currentBGM && !currentBGM.isPlaying())) {
                playBGM(defeatResultBgmId);
            }

            // 2. 敗北リザルト画面を描画する
            fallbackGameOver(); // この関数は ui.js にあります
            // ★★★ 修正ここまで ★★★
        }
    }   else if (newState === 'paused' || newState === 'levelUp') {
            adjustCurrentBgmVolume(0.5); // 音量を半分に
        }
    }
    // ★★★ BGM再生ロジックここまで ★★★
}

// ★★★ 1. スポーン優先度に基づいてユニットタイプを抽選するヘルパー関数を新規作成 ★★★
/**
 * スポーン優先度に基づいた重み付き抽選で、ユニットタイプを1つ選択する
 * @param {string[]} availableTypes - 抽選対象となるユニットタイプのキー配列 (例: ['A', 'B'])
 * @returns {string} - 選択されたユニットタイプのキー (例: 'A')
 */
function selectUnitTypeByWeight(availableTypes) {
    // 優先度が0以下のタイプを除外
    const validTypes = availableTypes.filter(type => (unitTypes[type]?.spawnPriority || 0) > 0);
    if (validTypes.length === 0) {
        // 抽選対象がいない場合はデフォルトの'A'を返すか、エラー処理
        return 'A'; 
    }

    let totalWeight = 0;
    const weightedTypes = validTypes.map(type => {
        const priority = unitTypes[type].spawnPriority;
        totalWeight += priority;
        return { type, priority };
    });

    let rand = random(totalWeight);

    for (const weightedType of weightedTypes) {
        rand -= weightedType.priority;
        if (rand <= 0) {
            return weightedType.type;
        }
    }
    // フォールバック（通常は到達しない）
    return validTypes[validTypes.length - 1];
}

function safeSpawn(pos, playerPos, mapSize) {
    const isOutOfBounds = (p) => p.x < 0 || p.x > mapSize.width || p.y < 0 || p.y > mapSize.height;

    if (!isOutOfBounds(pos)) {
        return pos.copy(); 
    }

    let flippedXPos = pos.copy();
    flippedXPos.x = playerPos.x - (pos.x - playerPos.x); 

    if (!isOutOfBounds(flippedXPos)) {
        if (debugLog && debugMode) { 
            console.log(`safeSpawn: Original pos (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}) was out. Flipped X to (${flippedXPos.x.toFixed(0)}, ${flippedXPos.y.toFixed(0)})`); 
        }
        return flippedXPos;
    }

    let flippedYPos = pos.copy();
    flippedYPos.y = playerPos.y - (pos.y - playerPos.y); 

    if (!isOutOfBounds(flippedYPos)) {
        if (debugLog && debugMode) { 
            console.log(`safeSpawn: Flipped X pos (${flippedXPos.x.toFixed(0)}, ${flippedXPos.y.toFixed(0)}) was out. Flipped Y (from original) to (${flippedYPos.x.toFixed(0)}, ${flippedYPos.y.toFixed(0)})`); 
        }
        return flippedYPos;
    }

    let flippedXYPos = pos.copy();
    flippedXYPos.x = playerPos.x - (pos.x - playerPos.x); 
    flippedXYPos.y = playerPos.y - (pos.y - playerPos.y); 

    if (!isOutOfBounds(flippedXYPos)) {
        if (debugLog && debugMode) { 
            console.log(`safeSpawn: Flipped Y pos (${flippedYPos.x.toFixed(0)}, ${flippedYPos.y.toFixed(0)}) was out. Flipped XY (from original) to (${flippedXYPos.x.toFixed(0)}, ${flippedXYPos.y.toFixed(0)})`); 
        }
        return flippedXYPos;
    }

    // ★★★ ここからが修正箇所 ★★★
    if (debugLog && debugMode) { 
        console.warn(`safeSpawn: All spawn attempts failed for original pos (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}). Spawning at map center.`); 
    }
    // プレイヤー位置ではなく、マップの中央を返す
    return createVector(mapSize.width / 2, mapSize.height / 2); 
    // ★★★ 修正ここまで ★★★
}

/**
 * 指定された座標に、指定された種類のユニットを1体生成する（能力値の上書き機能付き）
 * @param {string} unitTypeKey - 生成するユニットのタイプキー ('ALLY_GUARD'など)
 * @param {p5.Vector} position - 生成する座標
 * @param {object} [overrideStats={}] - ユニットの基本性能を上書きするオプションのオブジェクト
 */
function spawnUnitAt(unitTypeKey, position, overrideStats = {}) {
    const unitConfig = unitTypes[unitTypeKey];
    if (!unitConfig) {
        console.warn(`spawnUnitAt: 指定されたユニットタイプ'${unitTypeKey}'の設定が見つかりません。`);
        return;
    }
    
    // レベル補正は固定ユニットには適用しない想定
    const scalingFactor = 1; 
    const forceScalingFactor = 1;

    // 基本となるユニットオブジェクトを生成
    const newUnit = {
        pos: position.copy(),
        homePosition: position.copy(), 
        vel: createVector(0, 0),
        spawnTime: millis(), // ★★★ 出現時刻を記録
        facingDirection: 1, // ★★★ 向きの初期値を設定 (1:右, -1:左)
        type: unitTypeKey,
        hp: unitConfig.hp * scalingFactor,
        speed: unitConfig.speed * scalingFactor,
        maxForce: (unitConfig.maxForce || 0.1) * forceScalingFactor,
        weight: unitConfig.weight || 1,
        size: unitConfig.size,
        contactDamage: unitConfig.contactDamage,
        attackRange: unitConfig.attackRange,
        attackCooldown: unitConfig.attackCooldown,
        shootInterval: unitConfig.shootInterval,
        range: unitConfig.range,
        bulletSpeed: unitConfig.bulletSpeed,
        bulletDamage: unitConfig.bulletDamage,
                        stateEffect:unitConfig.stateEffect,
        lastShot: 0,
        lastAttackTime: 0,
        lastPoisonDamage: 0,
        poisoned: false,
        vectorUnder: unitConfig.vectorUnder,
        currentFrame: 0,
        lastFrameChange: 0,
        frameIndex: 0,
        animationDirection: 1,
        isPreparingAttack: false,
        prepareStartTime: 0,
        prepareAttackDelay: 0,
        cooldownEndTime: 0,
        attackState: 'approaching',
        shakeOffset: 0,
        isBursting: false,
        burstLastShotTime: null,
        burstCount: 0,
        species: unitConfig.species,
        affiliation: unitConfig.affiliation,
        isAppearing: true,
        appearanceStartTime: millis(),
        deathEffect: null,
        isDying: false,
    };
        newUnit.pos = position.copy();
    newUnit.homePosition = position.copy();
    newUnit.vel = createVector(0, 0);
    newUnit.spawnTime = millis();
    newUnit.facingDirection = 1;
    newUnit.isAppearing = true;
    newUnit.appearanceStartTime = millis();
    newUnit.isDying = false;
    newUnit.deathEffect = null;
    newUnit.lastAttacker = null;

    // ★★★ overrideStatsオブジェクトで指定されたプロパティで、基本値を上書き ★★★
    Object.assign(newUnit, overrideStats);
    
    // ユニットをゲームに追加
    units.push(newUnit);
    addUnitToGrid(newUnit);
        // ★ ユニット出現後に共通トリガーをチェック
    checkCommonCutinTriggers(unitTypeKey);
    console.log(`Spawned unit ${unitTypeKey} at fixed position with overrides.`);
}

const spawnPatterns = {
    round01: (playerPos, mapSize, index) => {
        const angle = random(TWO_PI);
        const radius = random(500, 600);
        const pos = playerPos.copy().add(p5.Vector.fromAngle(angle).mult(radius));
        const safePos = safeSpawn(pos, playerPos, mapSize);
        return { pos: safePos, vel: p5.Vector.sub(playerPos, safePos).normalize() };
    },
    edgeRush: (playerPos, mapSize, index, count) => {
        const { cameraX, cameraY } = getCameraPosition();
        const viewportWidth = 960;
        const viewportHeight = 720;
        const side = 1; 
        let pos;
        const spacing = 20;
        switch (side) {
            case 0: 
            pos = createVector(cameraX, cameraY + viewportHeight / 2 + index * spacing - (count - 1) * spacing / 2);
            break;
            case 1: 
                pos = createVector(cameraX + viewportWidth, cameraY + viewportHeight / 2 + index * spacing - (count - 1) * spacing / 2);
                break;
            case 2: 
                pos = createVector(cameraX + viewportWidth / 2 + index * spacing - (count - 1) * spacing / 2, cameraY);
                break;
            case 3: 
                pos = createVector(cameraX + viewportWidth / 2 + index * spacing - (count - 1) * spacing / 2, cameraY + viewportHeight);
                break;
        }
                const safePos = safeSpawn(pos, playerPos, mapSize);
        const vel = p5.Vector.sub(playerPos, safePos).normalize().mult(2);
        return { pos: safePos, vel };
    },
    cornerCluster: (playerPos, mapSize, index, count) => {
        const { cameraX, cameraY } = getCameraPosition();
        const viewportWidth = 960;
        const viewportHeight = 720;
        const waveSize = Math.ceil(count / 3);
        const wave = floor(index / waveSize);
        const waveIndex = index % waveSize;
        const offset = 50;
        const spacing = 20;
        const corner = index % 4; 
        let basePos;
        switch (corner) {
            case 0: basePos = createVector(cameraX + offset, cameraY + offset); break;
            case 1: basePos = createVector(cameraX + viewportWidth - offset, cameraY + offset); break;
            case 2: basePos = createVector(cameraX + offset, cameraY + viewportHeight - offset); break;
            case 3: basePos = createVector(cameraX + viewportWidth - offset, cameraY + viewportHeight - offset); break;
        }
        const pos = basePos.copy().add(createVector(
            wave * 30 + waveIndex * spacing - (waveSize - 1) * spacing / 2,
            wave * 30
        ));
        const safePos = safeSpawn(pos, playerPos, mapSize);
        const vel = p5.Vector.sub(playerPos, safePos).normalize().mult(0.5);
        return { pos: safePos, vel };
    },
    fixedPoint: (playerPos, mapSize) => {
        const pos = createVector(mapSize.width / 2, 50);
        const vel = createVector(0, 0);
        return { pos, vel };
    },
    spiralWave: (playerPos, mapSize, index) => {
        const initialRadius = 350;
        const radiusDecrement = 3;
        const angleIncrement = radians(15);
        const radius = initialRadius - index * radiusDecrement;
        const angle = index * angleIncrement;
        const pos = playerPos.copy().add(p5.Vector.fromAngle(angle - PI / 2).mult(radius));
        const safePos = safeSpawn(pos, playerPos, mapSize);
        const vel = p5.Vector.sub(playerPos, safePos).normalize();
        return { pos: safePos, vel, delay: index * 50 };
    }
};
/**
 * 指定された複数の地点に、ユニットを密集させつつ距離を保って生成する
 * @param {number} count - 生成する総数
 * @param {string[]} types - 生成候補となるユニットタイプの配列
 * @param {p5.Vector[]} clusterPoints - 密集させる中心地点の配列
 */
function spawnClusteredUnits(count, types, clusterPoints) {
    const scalingFactor = 1 + (playerStats.level - 1) * 0.05;
    
    // ★★★ ここからが修正箇所 ★★★
    const spawnedPositions = []; // このラッシュで配置済みのユニットの座標リスト
    const MIN_DISTANCE = 30;     // ユニット間の最低距離
    const CLUSTER_RADIUS = 90;   // クラスター中心点からの最大出現半径
    const MAX_ATTEMPTS = 10;     // 1体あたりの配置試行回数

    for (let i = 0; i < count; i++) {
        const center = clusterPoints[i % clusterPoints.length];
        let spawnPos = null;

        // 1. 他のユニットと重ならない、適切な配置場所を探す
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            let potentialPos = createVector(
                center.x + random(-CLUSTER_RADIUS, CLUSTER_RADIUS),
                center.y + random(-CLUSTER_RADIUS, CLUSTER_RADIUS)
            );

            let isTooClose = false;
            for (const pos of spawnedPositions) {
                if (p5.Vector.dist(potentialPos, pos) < MIN_DISTANCE) {
                    isTooClose = true;
                    break;
                }
            }

            if (!isTooClose) {
                spawnPos = potentialPos; // 適切な場所が見つかった
                break;
            }
        }

        // 2. もし試行回数内で見つからなければ、最後の試行位置を強制的に使用
        if (spawnPos === null) {
            spawnPos = createVector(
                center.x + random(-CLUSTER_RADIUS, CLUSTER_RADIUS),
                center.y + random(-CLUSTER_RADIUS, CLUSTER_RADIUS)
            );
        }
        
        spawnedPositions.push(spawnPos); // 次のユニットのために、今回の配置場所を記録

        // 3. 決定した位置にユニットを生成する
        const unitTypeKey = selectUnitTypeByWeight(types);
        const unitConfig = unitTypes[unitTypeKey];
        if (!unitConfig) continue;

        const scaledHp = Math.round(unitConfig.hp * scalingFactor);
        const scaledSpeed = unitConfig.speed * scalingFactor;
        const vel = p5.Vector.sub(player.pos, spawnPos).normalize().mult(scaledSpeed);
        
        units.push({
            pos: spawnPos, // ★ 計算した出現位置を使用
            vel: vel,
            type: unitTypeKey,
            hp: scaledHp,
            speed: scaledSpeed,
            size: unitConfig.size,
            contactDamage: unitConfig.contactDamage,
            shootInterval: unitConfig.shootInterval,
            range: unitConfig.range,
            bulletSpeed: unitConfig.bulletSpeed,
            bulletDamage: unitConfig.bulletDamage,
                stateEffect:unitConfig.stateEffect,
            lastShot: millis(),
            lastPoisonDamage: 0,
            poisoned: false,
            vectorUnder: unitConfig.vectorUnder,
            currentFrame: 0,
            lastFrameChange: 0,
            frameIndex: 0,
            animationDirection: 1,
            isPreparingAttack: false,
            prepareStartTime: 0,
            prepareAttackDelay: 0,
            cooldownEndTime: 0,
            attackState: 'none',
            shakeStartTime: 0,
            chargeAngle: null,
            lastDistance: 0,
            decelTriggerTime: 0,
            decelStartTime: 0,
            shootStartTime: 0,
            time: millis(),
            shakeOffset: 0,
            isBursting: false,
            burstLastShotTime: null,
            burstCount: 0,
            species: unitConfig.species,
            affiliation: unitConfig.affiliation, 
            isAppearing: true,
            appearanceStartTime: millis(),
            deathEffect: null,
            isDying: false,
        });
    }
}
// ★★★ 2. spawnUnits関数を、混成部隊を生成するように修正 ★★★
/**
 * ユニットを生成する
 * @param {number} count - 生成する総数
 * @param {string[]} types - 生成候補となるユニットタイプの配列
 * @param {string} pattern - 出現パターン
 */
function spawnUnits(count, types, pattern = 'round01') {
    const mapSize = getStageConfig(currentStage).mapSize;
    // HPと速度用のレベル補正
    const scalingFactor = 1 + (playerStats.level - 1) * 0.05;
    // ★★★ maxForce用の、より緩やかなレベル補正を追加 ★★★
    const forceScalingFactor = 1 + (playerStats.level - 1) * 0.015;

    for (let i = 0; i < count; i++) {
        
        let unitTypeKey;

        if (types.length > 1) {
            unitTypeKey = selectUnitTypeByWeight(types);
        } 
        else {
            unitTypeKey = types[0];
        }

        const unitConfig = unitTypes[unitTypeKey];
        if (!unitConfig) {
            console.warn(`spawnUnits: 指定されたユニットタイプ'${unitTypeKey}'の設定が見つかりません。スキップします。`);
            continue; 
        }

        const scaledHp = Math.round(unitConfig.hp * scalingFactor);
        const scaledSpeed = unitConfig.speed * scalingFactor;
        // ★★★ レベル補正を適用したmaxForceを計算 ★★★
        const scaledMaxForce = (unitConfig.maxForce || 0.1) * forceScalingFactor;

        const { pos, vel, delay } = spawnPatterns[pattern](player.pos, mapSize, i, count);
        
        const spawn = () => {
            const newUnit = {
                pos: pos,
                vel: vel.mult(scaledSpeed),
               spawnTime: millis(), // ★★★ 出現時刻を記録
                facingDirection: 1, // ★★★ 向きの初期値を設定 (1:右, -1:左)
                type: unitTypeKey,
                hp: scaledHp,
                speed: scaledSpeed,
                maxForce: scaledMaxForce, // ★★★ ユニット個別に補正後のmaxForceを保持させる ★★★
                size: unitConfig.size,
                contactDamage: unitConfig.contactDamage,
                shootInterval: unitConfig.shootInterval,
                range: unitConfig.range,
                bulletSpeed: unitConfig.bulletSpeed,
                bulletDamage: unitConfig.bulletDamage,
                stateEffect:unitConfig.stateEffect,
                lastShot: millis(),
                lastPoisonDamage: 0,
                poisoned: false,
                vectorUnder: unitConfig.vectorUnder,
                currentFrame: 0,
                lastFrameChange: 0,
                frameIndex: 0,
                animationDirection: 1,
                isPreparingAttack: false,
                prepareStartTime: 0,
                prepareAttackDelay: 0,
                cooldownEndTime: 0,
                attackState: 'approaching',
                shakeOffset: 0,
                isBursting: false,
                burstLastShotTime: null,
                burstCount: 0,
                species: unitConfig.species,
                affiliation: unitConfig.affiliation,
                isAppearing: true,
                appearanceStartTime: millis(),
                deathEffect: null,
                isDying: false,
            };

            newUnit.pos = pos;
            newUnit.vel = vel.mult(unitConfig.speed * scalingFactor);
            newUnit.hp = Math.round(unitConfig.hp * scalingFactor);
            newUnit.speed = unitConfig.speed * scalingFactor;
            newUnit.maxForce = (unitConfig.maxForce || 0.1) * forceScalingFactor;
            newUnit.spawnTime = millis();
            newUnit.facingDirection = 1;
            newUnit.isAppearing = true;
            newUnit.appearanceStartTime = millis();
            newUnit.isDying = false;
            newUnit.deathEffect = null;
            newUnit.lastAttacker = null;

            if (unitConfig.isBoss) {
                newUnit.cooldownEndTime = millis() + 2000;
            }

            units.push(newUnit);
            addUnitToGrid(newUnit);
                        // ★ ユニット出現後に共通トリガーをチェック
            checkCommonCutinTriggers(unitTypeKey);
        };

        if (unitConfig.isBoss) {
            justSpawnedBossType = unitTypeKey;
        }
        
        if (delay) {
            const timeoutId = setTimeout(() => {
                spawn();
                const indexToRemove = activeTimeouts.indexOf(timeoutId);
                if (indexToRemove > -1) activeTimeouts.splice(indexToRemove, 1);
            }, delay);
            activeTimeouts.push(timeoutId);
        } else {
            spawn();
        }
    }
}

function drawResult() {
    drawGameScene();
}

function mousePressed() {
    // ★★★ 最初のマウスクリックでAudioContextを開始 ★★★
    if (getAudioContext().state !== 'running') {
        userStartAudio();
        console.log("AudioContext started on mouse press.");
    }
    handleMousePressed(); // ui.js の関数を呼び出し
}

function updateGrid() {
    // if (debugLog && debugMode) console.log('Grid updated'); // 頻度が高いのでコメントアウト推奨
}

function updateShield() {
    // if (debugLog && debugMode) console.log('Shield updating'); // 頻度が高いのでコメントアウト推奨
}

async function loadDescriptions() { // 関数名を変更
    try {
        // electronAPIの関数名も変更した場合は合わせる
        const data = await window.electronAPI.loadUpgradeDescriptions(); 
        if (data) {
            // 読み込んだデータをそれぞれの変数に格納
            upgradeDescriptions = data.upgrades || {};
            characterProfiles = data.character_profiles || {};
            console.log('Descriptions (Upgrades & Profiles) loaded successfully.');
        } else {
            throw new Error("Received null data from descriptions file.");
        }
    } catch (err) {
        console.error('Failed to load descriptions.', err);
        upgradeDescriptions = {};
        characterProfiles = {};
    }
}
/**
 * ユニット出現時に、共通カットインのトリガーをチェックする
 * @param {string} unitType - 出現したユニットのタイプ
 */
function checkCommonCutinTriggers(unitType) {
    if (!commonScenarioTriggers || commonScenarioTriggers.length === 0) {
        return;
    }

    for (const trigger of commonScenarioTriggers) {
        // 条件が一致するかチェック
        if (trigger.conditionType === 'unitAppeared' && trigger.unitType === unitType) {
            
            // 1ステージ1回限りのトリガーかチェック
            const triggerKey = `common-${trigger.conditionType}-${trigger.unitType}`;
            if (trigger.oncePerStage && activeStageScenarioTriggers.has(triggerKey)) {
                continue; // 既に実行済みならスキップ
            }

            // カットインを実行
            if (trigger.cutin && typeof startCutin === 'function') {
                startCutin(trigger.cutin);
            }

            // 実行済みとして記録
            if (trigger.oncePerStage) {
                activeStageScenarioTriggers.add(triggerKey);
            }
        }
    }
}