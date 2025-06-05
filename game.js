// game.js

// --- グローバル変数 ---
let stageCompleteSequenceStarted = false;
let unitsToRemove = new Set();
let projectilesToRemove = new Set();
let gameState = 'title';
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
let bits = [];
let shootingBits = [];
let currentStage = 1;
let gameTime = 0;
let pacingTimer = 0;
// let stageClearTime = 0; // Gキー離脱方式では直接使わない可能性あり
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
let frameCounts = { /* ... (既存のフレームカウント) ... */ };
let autoFire = false;
// let hoverIndex = -1; // ui.js に移動
let levelUpHoverIndex = -1; // ui.js で管理、または levelUp() 内で局所的に
let debugLog = true; // trueにするとコンソールログが増える
let debugMode = true; // デバッグ用表示などに使う
let saveData = { characters: {} };

// --- ステージ進行・シナリオ関連フラグ ---
    stageClearConditionMet = false;
    let defeatedBossesThisStage = new Set(); 
    defeatedBossesThisStage.clear();
    justSpawnedBossType = null;
    justTriggeredEventId = null;
    window.transitionToResultAfterScenario = false;
    stageCompleteSequenceStarted = false; // リセット
    if (typeof resetActiveStageScenarioTriggers === 'function') {
        resetActiveStageScenarioTriggers();
    }
// --- p5.js Functions ---
function setup() {
        console.log("--- game.js: setup() START ---"); // ★追加
    createCanvas(1280, 720);

    setupPortrait(); // portrait.js の portraitBuffer 初期化

    const mapSize = getStageConfig(currentStage).mapSize;
    player = { pos: createVector(mapSize.width / 2, mapSize.height / 2), vel: createVector(0, 0), lastShot: 0 };

    loadScenarioData(); // scenario.js (非同期の可能性あり)
    loadSaveData();     // main.js (非同期)

    // 初期キャラクター選択やステータスロード (必要に応じて調整)
    if (selectedCharacter) {
        loadCharacter(selectedCharacter); // character&upgrades.js
        // playerStats の初期化は loadCharacter に任せる
    }
    resetGameState(); // ゲーム開始前に一度状態をリセット
    setGameState('title'); // 初期状態はタイトル

    console.log(`Game initialized. Initial stage: ${currentStage}`);
    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.display = 'block';
        canvas.tabIndex = 0; // キー入力フォーカス用
        canvas.focus();
           console.log("--- game.js: setup() END ---"); // ★追加
    }
}

async function loadSaveData() {
    console.log(`electronAPI available: ${!!window.electronAPI}`);
    try {
        const loaded = await window.electronAPI.loadSaveData();
        if (loaded && typeof loaded === 'object') {
            saveData = loaded;
            console.log('Save data loaded successfully:', saveData);
        } else {
            console.warn('Loaded save data is invalid. Using default.');
            saveData = { characters: {} };
        }
    } catch (err) {
        console.error('Failed to load save data via electronAPI:', err);
        saveData = { characters: {} }; // フォールバック
    }
}

async function saveGameData() {
    if (!selectedCharacter && gameState !== 'gameOver') { // ゲームオーバー時はselectedCharacterがなくてもスコアを保存する場合がある
        // console.warn("Cannot save game data: No character selected.");
        // return;
    }
    if (!saveData || typeof saveData !== 'object') {
        console.error("Cannot save game data: saveData object is invalid.");
        saveData = { characters: {} }; // 強制的に初期化
    }
    if (!saveData.characters) {
        saveData.characters = {};
    }

    if (selectedCharacter) { // プレイヤー選択中のみキャラ固有データを保存
        if (!saveData.characters[selectedCharacter]) {
            saveData.characters[selectedCharacter] = { stages: {}, scenarios: { gameOver: {} } };
        }
        if (!saveData.characters[selectedCharacter].stages) {
            saveData.characters[selectedCharacter].stages = {};
        }
        const stageKey = String(currentStage); // ステージIDを文字列キーとして扱う
        if (!saveData.characters[selectedCharacter].stages[stageKey]) {
            saveData.characters[selectedCharacter].stages[stageKey] = { highScore: 0 };
        }
        saveData.characters[selectedCharacter].stages[stageKey].highScore = Math.max(
            saveData.characters[selectedCharacter].stages[stageKey].highScore || 0,
            score
        );
    }
    // グローバルなハイスコアや設定などもここに保存可能

    try {
        const success = await window.electronAPI.saveData(saveData);
        if (success) {
            console.log(`Game data saved. Character: ${selectedCharacter || 'N/A'}, Stage: ${currentStage}, Score: ${score}`);
        } else {
            console.error('Save data via electronAPI failed.');
        }
    } catch (err) {
        console.error('Error during saving data via electronAPI:', err);
    }
}

function resetGameState() {
    gameTime = 0;
    pacingTimer = 0;
    // stageClearTime = 0; // 不要になった可能性
    score = 0; // スコアは0から開始
    lastScoreUpdate = millis(); // スコア加算タイミング用
    enemiesKilled = 0;
    rushEnemiesKilled = 0;
    rushCount = 0;
    lastRushKills = 0;
    lastRushSpawnCount = 0;
    rushEffectTime = 0;
    rushThreshold = 25; // 初期値に戻す
    stageCompleteSequenceStarted = false;
    units = [];
    projectiles = [];
    expItems = [];
    damagePopups = [];
    effectCircles = [];
    poisonSwamps = [];
    meleeAttacks = [];
    bits = [];
    shootingBits = [];

    stageClearConditionMet = false;
    defeatedBossesThisStage.clear();
    justSpawnedBossType = null;
    justTriggeredEventId = null;
    window.transitionToResultAfterScenario = false;


    if (typeof resetActiveStageScenarioTriggers === 'function') {
        resetActiveStageScenarioTriggers(); // scenario.js の関数
    }

    // playerStats は loadCharacter で初期化されるが、一部共通項目はここでリセット
    if (playerStats) {
        playerStats.lastDamageUnitType = null;
        playerStats.hp = playerStats.maxHp; // 最大HPに
        playerStats.exp = 0;
        playerStats.level = 1;
        playerStats.expToNext = expRequirements[0]; // character&upgrades.js にある想定
        playerStats.isFlashing = false;
        playerStats.isInvincible = false;
    }

    if (selectedCharacter) { // キャラクターが選択されていれば再ロード
        loadCharacter(selectedCharacter); // これで playerStats が再設定される
    } else { // 未選択なら空にする
        playerStats = {};
    }
    
    const mapSize = getStageConfig(currentStage).mapSize;
    player = { pos: createVector(mapSize.width / 2, mapSize.height / 2), vel: createVector(0, 0), lastShot: 0 };


    if (window.upgrades) {
        window.upgrades.forEach(upgrade => {
            upgrade.level = 0;
        });
    }
    levelUpChoices = []; // character&upgrades.js にある想定
    levelUpHoverIndex = -1; // ui.js で管理されている想定

    if (typeof resetStageState === 'function') { // stages.js の関数
        resetStageState();
    }
    console.log("Game state reset.");
}

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
        if (!stageClearConditionMet) { // 初めて条件を満たした時のみ
            stageClearConditionMet = true;
            console.log("ステージクリア条件達成！");
            justTriggeredEventId = 'STAGE_CLEAR_CONDITIONS_MET'; // 中間シナリオ用トリガー
        }
    }
}

function checkMiddleScenarioTriggers() {
    if (isScenarioPlaying) return;

    const stageConfig = getStageConfig(currentStage);
    if (!stageConfig.scenarioTriggers) return;

    if (debugLog && debugMode && frameCounter % 60 === 0) {
        console.log(`[DEBUG Flags @ checkMiddle] justSpawnedBossType: ${justSpawnedBossType}, justTriggeredEventId: ${justTriggeredEventId}, stageClearMet: ${stageClearConditionMet}`);
    }

    for (const trigger of stageConfig.scenarioTriggers) {
        const triggerKeyForOnce = `${currentStage}-${trigger.scenarioTriggerId}`;
        if (trigger.once && activeStageScenarioTriggers.has(triggerKeyForOnce)) {
            continue;
        }

        let conditionMet = false;
        let consumeEventId = true; 

        switch (trigger.conditionType) {
            case 'bossAppeared':
                if (justSpawnedBossType === trigger.bossType) {
                    conditionMet = true;
                    console.log(`[MiddleTrigger LOG] Condition Met: Boss ${trigger.bossType} appeared.`);
                    // justSpawnedBossType = null; // フラグ消費はシナリオ開始成功時に移動
                }
                break;
            case 'bossDefeated':
                // ボス撃破イベントは justTriggeredEventId で発生を検知する
                if (justTriggeredEventId === trigger.scenarioTriggerId && defeatedBossesThisStage.has(trigger.bossType)) {
                    conditionMet = true;
                    console.log(`[MiddleTrigger LOG] Condition Met for 'bossDefeated': Trigger ID = ${trigger.scenarioTriggerId}, Boss Type = ${trigger.bossType}`);
                }
                break;
            case 'reinforcementSpawned': // ★★★ 追加/修正 ★★★
                // stages.js の updateStageLogic で、該当増援出現時に
                // justTriggeredEventId = trigger.scenarioTriggerId; と設定されている想定
                if (justTriggeredEventId === trigger.scenarioTriggerId) {
                    conditionMet = true;
                    console.log(`[MiddleTrigger LOG] Condition Met for 'reinforcementSpawned': Trigger ID = ${trigger.scenarioTriggerId}`);
                }
                break;
            case 'eventOccurred':
                 if (justTriggeredEventId === trigger.eventId) { 
                    conditionMet = true;
                    console.log(`[MiddleTrigger LOG] Condition Met for 'eventOccurred': Event ID = ${trigger.eventId}`);
                }
                break;
            case 'rushOccurred':
                if (justTriggeredEventId === trigger.scenarioTriggerId) {
                     conditionMet = true;
                     console.log(`[MiddleTrigger LOG] Condition Met for 'rushOccurred': Rush Trigger ID = ${trigger.scenarioTriggerId}`);
                }
                break;
            case 'timeReached':
                if (gameTime >= trigger.timeValue && !activeStageScenarioTriggers.has(triggerKeyForOnce)) {
                    conditionMet = true;
                    consumeEventId = false; 
                }
                break;
            case 'clearConditionsMet':
                if (stageClearConditionMet && justTriggeredEventId === 'STAGE_CLEAR_CONDITIONS_MET') {
                    conditionMet = true;
                    console.log(`[MiddleTrigger LOG] Condition Met for 'clearConditionsMet' via event ID 'STAGE_CLEAR_CONDITIONS_MET'. Trigger ID: ${trigger.scenarioTriggerId}`);
                } else if (stageClearConditionMet && trigger.scenarioTriggerId === 'STAGE_OBJECTIVES_COMPLETE_MESSAGE' && !activeStageScenarioTriggers.has(triggerKeyForOnce) ) {
                     conditionMet = true;
                     consumeEventId = false;
                     console.log(`[MiddleTrigger LOG] Condition Met for 'clearConditionsMet' (fallback, triggerId: ${trigger.scenarioTriggerId}).`);
                }
                break;
            default:
                 console.warn(`[MiddleTrigger] Unknown conditionType: ${trigger.conditionType} for ${trigger.scenarioTriggerId}`);
                 break;
        }

        if (conditionMet) {
            console.log(`[MiddleTrigger LOG] Condition met for ${trigger.scenarioTriggerId}. Attempting to start 'stageMiddle'.`);
            if (startScenario('stageMiddle', selectedCharacter, currentStage, trigger.scenarioTriggerId)) {
                if (consumeEventId) { // イベントIDを消費するタイプのトリガーの場合
                    if (trigger.conditionType === 'bossAppeared') justSpawnedBossType = null;
                    else if (trigger.conditionType === 'reinforcementSpawned' || 
                             trigger.conditionType === 'eventOccurred' ||
                             trigger.conditionType === 'rushOccurred' ||
                             (trigger.conditionType === 'clearConditionsMet' && justTriggeredEventId === 'STAGE_CLEAR_CONDITIONS_MET') ) {
                        justTriggeredEventId = null;
                    }
                }
                return; 
            } else {
                if (debugMode) console.log(`[MiddleTrigger LOG] Scenario ${trigger.scenarioTriggerId} did not start (returned false).`);
            }
        }
    }
}


function backToTitle() {
    // saveGameData(); // 状況によるが、通常はgameState変更時や特定アクション時に保存
    setGameState('title'); // タイトルへ
    
    console.log("Returned to title screen.");
}

function draw() {
    background(0);
    frameCounter++;

    // gameState に応じた描画と更新の振り分け
    if (gameState === 'title') {
        drawTitle(); // ui.js
        return;
    } else if (gameState === 'characterSelect') {
        drawCharacterSelect(); // ui.js
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats); // portrait.js
        return;
    } else if (gameState === 'options') {
        // drawOptions(); // 未実装なら何もしないか、ui.js で仮実装
        return;
    } else if (gameState === 'recall') {
        if (isScenarioPlaying) { // scenario.js のフラグ
            updateScenario(); // scenario.js
            drawScenario();   // scenario.js
            if (showBacklog) drawBacklog(); // ui.js (or scenario.js)
        } else {
            drawRecall(); // ui.js
            drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats); // portrait.js
        }
        return;
    }  else if (gameState === 'scenario') { // ステージ開始/中間/クリアのシナリオ再生
        // ★★★ シナリオ再生中も背景としてゲーム画面を描画 ★★★
        if (previousGameState === 'playing' || previousGameState === 'boss' || previousGameState === 'characterSelect') {
            // プレイ画面やキャラ選択画面が前の状態だった場合にゲームシーンを描画
            // (previousGameState は scenario.js で設定される)
            // UIの更新は行わないようにする（drawGameSceneがそのような機能を持つ場合）か、
            // そのまま描画してシナリオUIを上に重ねる。
            // ここでは、drawGameSceneをそのまま呼び、シナリオUIが上に重なる形とする。
            drawGameScene(); // 通常のゲームシーン描画 (UIも含む)
        } else {
            // タイトルやリコール画面などが前の場合は、黒背景のままにするか、特定の背景を描画
            // ここでは何もしなければ、scenario.js側の背景フィルターのみがかかる
        }

        if (isScenarioPlaying || isFadingIn) { // isFadingIn も考慮
            updateScenario(); //
            drawScenario();   //
            if (showBacklog) drawBacklog(); //
        } else {
            // シナリオが終了したのにこの状態に留まっている場合 (通常はendScenarioで処理される)
            console.warn("In 'scenario' state but no scenario is playing. Review logic in endScenario or where gameState is set to 'scenario'."); //
            if (previousGameState) { //
                 // endScenarioが適切なgameStateに遷移させるため、ここでのsetGameStateは通常不要
            } else {
                 backToTitle(); //
            }
        }
        return;
    }

    // ゲームプレイ中のロジック (playing または boss)
    if (gameState === 'playing' || gameState === 'boss') {
        if (!isScenarioPlaying) { // 通常のゲーム進行 (シナリオ再生中でない場合)
        gameTime += deltaTime / 1000;
        pacingTimer += deltaTime / 1000;

        updateStageLogic(currentStage);
        updateUnits();                // ユニットの更新 (HP減少、死亡判定 -> handleUnitDeath呼び出し)
        updatePlayer();               // プレイヤーの更新
        updateEffects();              // エフェクトの更新 (弾の処理、衝突判定 -> handleUnitDeath呼び出し)

        checkMiddleScenarioTriggers(); // 中間シナリオトリガーの確認

        if (!stageClearConditionMet) {
            checkStageClearConditions(); // ステージクリア条件の確認
        }

        const stageConfig = getStageConfig(currentStage);
        // 自動クリアシーケンス開始判定
        if (stageClearConditionMet && !stageCompleteSequenceStarted) {
            if (stageConfig.manualExitRequiredForClear === false) {
                proceedToStageClearSequence();
                // proceedToStageClearSequenceがgameStateを'scenario'に変更するため、
                // このフレームの以降の描画や削除は行われないことが期待される。
            }
        }

        // タイムオーバー処理
        if (gameTime >= stageConfig.duration) {
            if (!stageClearConditionMet) {
                playerStats.hp = 0;
                playerStats.lastDamageUnitType = stageConfig.timeLimitFailure?.lastDamageUnitType || 'TIME_LIMIT_FAILURE';
                saveGameData();
                setGameState('gameOver');
                return; // gameOverになったら、このフレームの残りの描画・削除は行わない
            }
        
                // クリア条件達成済みでタイムオーバーの場合は、Gキー待ち (UIで表示)
            }
                    drawGameScene();

        if (!isScenarioPlaying) {
            // unitsToRemove.clear(); // ★★★ この行を削除またはコメントアウト ★★★
            projectilesToRemove.clear(); // こちらは弾丸用なので、影響範囲を確認しつつ維持または削除
            removeUnits(); // units.js の関数を呼び出し、この中で unitsToRemove がクリアされる
        }
        }

        // 描画処理
        drawGameScene(); // ui.js (内部で各種描画関数を呼ぶ)

        // 削除処理

        unitsToRemove.clear(); // updateEffects などで unitsToRemove に追加される
        projectilesToRemove.clear(); // updateEffects などで projectilesToRemove に追加される
        removeUnits(); 
        // projectiles の削除は updateEffects 内で行われている

    } else if (gameState === 'paused') {
        drawGameScene(); // 背景としてゲーム画面
        drawPaused();    // ui.js
    } else if (gameState === 'levelUp') {
        drawGameScene(); // 背景としてゲーム画面
        drawLevelUp();   // ui.js (or character&upgrades.js)
    } else if (gameState === 'gameOver') {
        // ゲームオーバー時のシナリオは drawGameOver 内で処理される
        drawGameScene(); // 背景としてゲーム画面
        drawGameOver();  // ui.js
    } else if (gameState === 'result') {
        // リザルト画面はDOM要素かもしれないが、背景はゲーム画面が良い場合もある
        drawResult();    // game.js (または ui.js)
    }
    function proceedToStageClearSequence() {
    if (stageCompleteSequenceStarted || isScenarioPlaying) return;

    console.log("[GAME LOG] Proceeding to stage clear sequence.");
    stageCompleteSequenceStarted = true;
    saveGameData();

    console.log(`[GAME LOG] Attempting to start 'stageClear' scenario for char: ${selectedCharacter}, stage: ${currentStage}`);
    if (startScenario('stageClear', selectedCharacter, currentStage)) {
        console.log("[GAME LOG] 'stageClear' scenario started. Waiting for it to end before showing results.");
        window.transitionToResultAfterScenario = true; // scenario.js の endScenario で参照
    } else {
        console.warn("[GAME LOG] No 'stageClear' scenario found or failed to start. Proceeding directly to results.");
        setGameState('result'); // クリアシナリオがなければ直接リザルトへ
    }
}
}

// ... (removeUnits, updateResultScreen, setGameState, safeSpawn, spawnPatterns, spawnUnits, drawResult は変更なしまたは微調整)
// mousePressed, updateGrid, updateShield は変更なし

function removeUnits() {
    if (debugLog && debugMode) {
        console.log(`Before removal: units.length=${units.length}, unitsToRemove=${[...unitsToRemove]}`);
    }

    const validIndices = [...unitsToRemove]
        .filter(i => i >= 0 && i < units.length && units[i])
    .sort((a, b) => b - a);

    for (let i of validIndices) {
        units.splice(i, 1);
    }

    unitsToRemove.clear();

    if (debugLog && debugMode) {
        console.log(`After removal: units.length=${units.length}, unitsToRemove=${[...unitsToRemove]}`);
    }

    for (let i = units.length - 1; i >= 0; i--) {
        if (!units[i]) {
            units.splice(i, 1);
            if (debugLog && debugMode) {
                console.log(`Removed null unit at index ${i}`);
            }
        }
    }
}

function updateResultScreen() {
    setGameState('result');
    const scoreText = document.getElementById('scoreText');
    const killsText = document.getElementById('killsText');
    const timeText = document.getElementById('timeText');
    if (scoreText) scoreText.innerText = `score: ${score}`;
    if (killsText) killsText.innerText = `Enemies Killed: ${enemiesKilled}`;
    if (timeText) timeText.innerText = `Elapsed Time: ${floor(gameTime)} seconds`;
}

function setGameState(newState) {
    console.log(`Changing game state to: ${newState}`);
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
            console.warn(`DOM element not found: ${id}`);
        }
    });

    const targetElement = document.getElementById(newState);
    if (targetElement && newState !== 'title') {
        targetElement.style.display = 'block';
    } else if (['options', 'paused', 'result', 'gameOver', 'recall'].includes(newState)) {
        console.warn(`Target DOM element not found: ${newState}`);
    }

    const canvas = document.querySelector('canvas');
    if (canvas) {
        canvas.style.display = 'block';
        canvas.tabIndex = 0;
        canvas.focus();
    } else {
        console.warn('Game canvas not found');
    }

    if (typeof drawCharacterPortrait === 'function' && newState !== 'title' && newState !== 'options' && newState !== 'characterSelect') {
        drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
    }
        if (newState === 'title') {
            playBGM(1); // sounds.js で定義されたID '1' のBGMを再生 (例: タイトルテーマ)
    } else if (newState === 'playing' || newState === 'boss') {
        // ゲームプレイ開始時にBGMを再生する場合 (例: ID '2' のステージBGM)
        // playBGM(2); // もしステージごとにBGMを変えるなら、currentStageに応じてIDを変更
        // stopBGM(); // または、タイトルBGMを停止するだけなど
    } else if (newState === 'gameOver' || newState === 'result') {
        // ゲームオーバーやリザルト画面で特定のBGMを再生、または停止
        // playBGM('gameOverTheme'); // 例
        // stopBGM();
    }
}

function safeSpawn(pos, playerPos, mapSize) {
    const isOutOfBounds = (p) => p.x < 0 || p.x > mapSize.width || p.y < 0 || p.y > mapSize.height;

    // 1. 元のスポーン位置が範囲内か確認
    if (!isOutOfBounds(pos)) {
        return pos.copy(); // 範囲内ならそのまま返す
    }

    // 2. X座標のみをプレイヤー中心に反転させた位置を試す
    let flippedXPos = pos.copy();
    flippedXPos.x = playerPos.x - (pos.x - playerPos.x); // X座標をプレイヤー中心に対称移動
    // flippedXPos.y は元のまま

    if (!isOutOfBounds(flippedXPos)) {
        if (debugLog && debugMode) { //
            console.log(`safeSpawn: Original pos (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}) was out. Flipped X to (${flippedXPos.x.toFixed(0)}, ${flippedXPos.y.toFixed(0)})`); //
        }
        return flippedXPos;
    }

    // 3. Y座標のみをプレイヤー中心に反転させた位置を試す (元のposを基準に)
    let flippedYPos = pos.copy();
    // flippedYPos.x は元のまま
    flippedYPos.y = playerPos.y - (pos.y - playerPos.y); // Y座標をプレイヤー中心に対称移動

    if (!isOutOfBounds(flippedYPos)) {
        if (debugLog && debugMode) { //
            console.log(`safeSpawn: Flipped X pos (${flippedXPos.x.toFixed(0)}, ${flippedXPos.y.toFixed(0)}) was out. Flipped Y (from original) to (${flippedYPos.x.toFixed(0)}, ${flippedYPos.y.toFixed(0)})`); //
        }
        return flippedYPos;
    }

    // 4. X座標とY座標の両方をプレイヤー中心に反転させた位置を試す (元のposを基準に)
    let flippedXYPos = pos.copy();
    flippedXYPos.x = playerPos.x - (pos.x - playerPos.x); // X座標をプレイヤー中心に対称移動
    flippedXYPos.y = playerPos.y - (pos.y - playerPos.y); // Y座標をプレイヤー中心に対称移動

    if (!isOutOfBounds(flippedXYPos)) {
        if (debugLog && debugMode) { //
            console.log(`safeSpawn: Flipped Y pos (${flippedYPos.x.toFixed(0)}, ${flippedYPos.y.toFixed(0)}) was out. Flipped XY (from original) to (${flippedXYPos.x.toFixed(0)}, ${flippedXYPos.y.toFixed(0)})`); //
        }
        return flippedXYPos;
    }

    // 5. 全ての試行が範囲外だった場合、プレイヤーの位置にスポーンさせる (フォールバック)
    if (debugLog && debugMode) { //
        console.warn(`safeSpawn: All spawn attempts failed for original pos (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}). Spawning at player pos (${playerPos.x.toFixed(0)}, ${playerPos.y.toFixed(0)})`); //
    }
    return playerPos.copy(); //
}

const spawnPatterns = {
    round01: (playerPos, mapSize, index) => {
        const angle = random(TWO_PI);
        const radius = random(350, 600);
        const pos = playerPos.copy().add(p5.Vector.fromAngle(angle).mult(radius));
        const safePos = safeSpawn(pos, playerPos, mapSize);
        return { pos: safePos, vel: p5.Vector.sub(playerPos, safePos).normalize() };
    },
    edgeRush: (playerPos, mapSize, index, count) => {
        const { cameraX, cameraY } = getCameraPosition();
        const viewportWidth = 960;
        const viewportHeight = 720;
        const side = 1; // 右端固定（フロントライン用）
        let pos;
        const spacing = 20;
        switch (side) {
            case 0: // 左端
            pos = createVector(cameraX, cameraY + viewportHeight / 2 + index * spacing - (count - 1) * spacing / 2);
            break;
            case 1: // 右端
                pos = createVector(cameraX + viewportWidth, cameraY + viewportHeight / 2 + index * spacing - (count - 1) * spacing / 2);
                break;
            case 2: // 上端
                pos = createVector(cameraX + viewportWidth / 2 + index * spacing - (count - 1) * spacing / 2, cameraY);
                break;
            case 3: // 下端
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
        const corner = index % 4; // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
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

function spawnUnits(count, type, pattern = 'round01') {
    const unitConfig = unitTypes[type] || unitTypes['A'];
    const mapSize = getStageConfig(currentStage).mapSize;
    for (let i = 0; i < count; i++) {
        const { pos, vel, delay } = spawnPatterns[pattern](player.pos, mapSize, i, count);
        const spawn = () => {
            units.push({
                pos: pos,
                vel: vel.mult(unitConfig.speed),
                type: type,
                hp: unitConfig.hp,
                speed: unitConfig.speed,
                size: unitConfig.size,
                contactDamage: unitConfig.contactDamage,
                shootInterval: unitConfig.shootInterval,
                range: unitConfig.range,
                bulletSpeed: unitConfig.bulletSpeed,
                bulletDamage: unitConfig.bulletDamage,
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
                affiliation: unitConfig.affiliation, // 追加
                isAppearing: true,
                appearanceStartTime: millis(),
                appearancePos: null,
                appearanceRotation: null,
                appearanceScale: null,
                appearanceProgress: null,
                appearanceShakeOffset: null
            });
        };
                if (unitTypes[type]?.isBoss) { // unitTypesはunits.jsで定義されている想定
            justSpawnedBossType = type; // game.js のグローバル変数を設定
            console.log(`[SPAWN LOG] Boss ${type} spawned, flag set: ${justSpawnedBossType}`);
        }
        if (delay) {
            setTimeout(spawn, delay);
        } else {
            spawn();
        }
    }
}
function drawResult() {
    // リザルト画面はDOM要素によって処理されるため、
    // ここでは描画ループが停止しないように背景を描画します。
    drawGameScene();
}

function mousePressed() {
    handleMousePressed();
}

function updateGrid() {
    if (debugLog && debugMode) console.log('Grid updated');
}

function updateShield() {
    if (debugLog && debugMode) console.log('Shield updating');
}