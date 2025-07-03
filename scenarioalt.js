let activePortraits = []; // 表示中の立ち絵情報を保持する配列
const PORTRAIT_POSITIONS_X = [0, 210, 420, 640, 860, 1070]; // 1-indexed
const PORTRAIT_BASE_Y = 720; // 立ち絵の下端のY座標（画面下端）
const PORTRAIT_DEFAULT_WIDTH = 400; // 立ち絵のデフォルト描画幅（適宜調整）
const PORTRAIT_DEFAULT_HEIGHT = 600; // 立ち絵のデフォルト描画高さ（適宜調整）
const DIM_ALPHA = 150; // 他のキャラクターを暗くする際のアルファ値
const APPEAR_DURATION = 300; // 登場アニメーションの時間 (ms)
let scenarioData = null;
let currentScenario = null;
let scenarioStepIndex = 0;
let scenarioStartTime = 0; // 現在のステップの開始時間
let loadedImages = {};
let isScenarioPlaying = false;
let textHistory = [];
let showText = true;
let showKeyInstructions = true;
let waitForInput = false;
let scenarioDataLoaded = false;
let lastImage = null;
let previousGameState = null;
let scenarioEventTypeBeingPlayed = null;
let commonScenarioTriggers = [];

let activeStageScenarioTriggers = new Set();

// --- フェード処理用変数 ---
let scenarioFadeAlpha = 0; // 現在のフェードのアルファ値
let scenarioFadeStartTime = 0;
let isFadingIn = false;
const FADE_DURATION = 500; // 0.5秒

function resetActiveStageScenarioTriggers() {
    activeStageScenarioTriggers.clear();
    console.log("リセット: activeStageScenarioTriggers");
}

async function loadScenarioData() {
    console.log("Requesting to load scenario.json5...");
    try {
        // electronAPIを通じてメインプロセスにファイル読み込みを要求
        const data = await window.electronAPI.loadJson5File('scenario.json5');
        if (data) {
            scenarioData = data;
            scenarioDataLoaded = true;
            console.log('Scenario data loaded successfully via JSON5 parser:', scenarioData);
            if (scenarioData.commonTriggers) {
                commonScenarioTriggers = scenarioData.commonTriggers;
                console.log('Common triggers loaded:', commonScenarioTriggers);
            }
            // --- 以下の処理は既存のものを流用 ---
            if (scenarioData?.events?.gameOver) {
                recallScenarios = [];
                const characters = Object.keys(scenarioData.events.gameOver);
                for (let character of characters) {
                    const speciesList = Object.keys(scenarioData.events.gameOver[character]);
                    for (let species of speciesList) {
                        if (scenarioData.events.gameOver[character][species].thumbnail) {
                            recallScenarios.push({ character, species });
                            const thumbnailPath = scenarioData.events.gameOver[character][species].thumbnail;
                            if (thumbnailPath && !loadedImages[thumbnailPath]) {
                                loadImage(thumbnailPath,
                                    img => {
                                        loadedImages[thumbnailPath] = img;
                                        console.log(`Preloaded recall thumbnail: ${thumbnailPath}`);
                                    },
                                    err => {
                                        console.error(`Failed to preload recall thumbnail: ${thumbnailPath}`, err);
                                        loadedImages[thumbnailPath] = null;
                                    }
                                );
                            }
                        }
                    }
                }
                console.log('Initialized recallScenarios:', recallScenarios);
            } else {
                 console.warn("scenario.json5 に events.gameOver が見つかりません。");
            }
        } else {
            throw new Error("Received null data from main process.");
        }
    } catch (err) {
        console.error('Failed to load scenario.json5. Check main process logs.', err);
        scenarioDataLoaded = true;
        scenarioData = null;
    }
}
function startScenario(eventType, key1, key2, key3) {
    console.log(`[SCENARIO LOG] startScenario called with: eventType=${eventType}, key1=${key1}, key2=${key2}, key3=${key3 || ''}`); //

    if (!scenarioDataLoaded) { }
    if (!scenarioData) { }
    if (isScenarioPlaying && !isFadingIn) { // フェードイン中は何もしない、またはフェードインが完了していれば中断して新しいシナリオへ（要件次第）
        console.warn(`[SCENARIO LOG] Scenario already playing. Cannot start new one: ${eventType}`); //
        return false;
    }

    let scenarioToPlay;
    let scenarioCollection;
    scenarioEventTypeBeingPlayed = eventType; //

    switch (eventType) {
        case 'stageStart':
            if (!scenarioData.events.stageProgress) { //
                console.warn(`[SCENARIO LOG] 'stageProgress' not found in scenarioData.events for eventType=${eventType}`); //
                scenarioEventTypeBeingPlayed = null; return false; //
            }
            console.log(`[SCENARIO LOG] Looking for 'stageStart': char=${key1}, stage=${String(key2)} in events.stageProgress`); //
            scenarioCollection = scenarioData.events.stageProgress?.[key1]?.[String(key2)]; //
            scenarioToPlay = scenarioCollection?.['start']; //
            if (!scenarioToPlay) console.warn(`[SCENARIO LOG] No 'start' scenario object found. Path: events.stageProgress.${key1}.${String(key2)}.start`); //
            else console.log(`[SCENARIO LOG] Found 'start' scenario object:`, JSON.parse(JSON.stringify(scenarioToPlay))); //
            break;
        case 'stageMiddle':
            if (!scenarioData.events.stageProgress) { //
                console.warn(`[SCENARIO LOG] 'stageProgress' not found in scenarioData.events for eventType=${eventType}`); //
                scenarioEventTypeBeingPlayed = null; return false; //
            }
            const stageIdForMiddle = String(key2); //
            const triggerId = key3; //
            const triggerKey = `${stageIdForMiddle}-${triggerId}`; //
            console.log(`[SCENARIO LOG] Looking for 'stageMiddle': char=${key1}, stage=${stageIdForMiddle}, trigger=${triggerId}`); //

            if (activeStageScenarioTriggers.has(triggerKey)) { //
                console.log(`[SCENARIO LOG] Middle scenario for trigger ${triggerId} (key: ${triggerKey}) already played (once).`); //
                scenarioEventTypeBeingPlayed = null; //
                return false; //
            }
            scenarioCollection = scenarioData.events.stageProgress?.[key1]?.[stageIdForMiddle]; //
            if (scenarioCollection) { //
                for (const scKey in scenarioCollection) { //
                    if (typeof scenarioCollection[scKey] === 'object' && scenarioCollection[scKey] !== null && //
                        scenarioCollection[scKey].hasOwnProperty('trigger') && //
                        scenarioCollection[scKey].trigger === triggerId) { //
                        scenarioToPlay = scenarioCollection[scKey]; //
                        console.log(`[SCENARIO LOG] Found 'middle' scenario object with key '${scKey}' for trigger ${triggerId}.`); //
                        break; //
                    }
                }
            }
            if (!scenarioToPlay) console.warn(`[SCENARIO LOG] No 'middle' scenario object found for char ${key1}, stage ${stageIdForMiddle}, trigger ${triggerId}.`); //
            else console.log(`[SCENARIO LOG] Selected 'middle' scenario object:`, JSON.parse(JSON.stringify(scenarioToPlay))); //
            break;
        case 'stageClear':
            if (!scenarioData.events.stageProgress) { //
                console.warn(`[SCENARIO LOG] 'stageProgress' not found in scenarioData.events for eventType=${eventType}`); //
                scenarioEventTypeBeingPlayed = null; return false; //
            }
            console.log(`[SCENARIO LOG] Looking for 'stageClear': char=${key1}, stage=${String(key2)}`); //
            scenarioCollection = scenarioData.events.stageProgress?.[key1]?.[String(key2)]; //
            scenarioToPlay = scenarioCollection?.['clear']; //
            if (!scenarioToPlay) console.warn(`[SCENARIO LOG] No 'clear' scenario object found.`); //
            else console.log(`[SCENARIO LOG] Found 'clear' scenario object:`, JSON.parse(JSON.stringify(scenarioToPlay))); //
            break;
        case 'stageObjectivesMet':
            if (!scenarioData.events.stageProgress) {
                console.warn(`[SCENARIO LOG] 'stageProgress' not found in scenarioData.events for eventType=${eventType}`);
                scenarioEventTypeBeingPlayed = null; return false;
            }
            console.log(`[SCENARIO LOG] Looking for 'stageObjectivesMet': char=${key1}, stage=${String(key2)}`);
            scenarioCollection = scenarioData.events.stageProgress?.[key1]?.[String(key2)];
            scenarioToPlay = scenarioCollection?.['objectivesMet'];
            if (!scenarioToPlay) console.warn(`[SCENARIO LOG] No 'objectivesMet' scenario object found.`);
            else console.log(`[SCENARIO LOG] Found 'objectivesMet' scenario object:`, JSON.parse(JSON.stringify(scenarioToPlay)));
            break;
        case 'gameOver':
            if (!scenarioData.events.gameOver) { //
                 console.warn(`[SCENARIO LOG] 'gameOver' not found in scenarioData.events for eventType=${eventType}`); //
                 scenarioEventTypeBeingPlayed = null; return false; //
            }
            console.log(`[SCENARIO LOG] Looking for 'gameOver': char=${key1}, species=${key2}`); //
            scenarioCollection = scenarioData.events.gameOver?.[key1]; //
            if (scenarioCollection) { //
                scenarioToPlay = scenarioCollection[key2] || scenarioCollection['default']; //
            }
            if (!scenarioToPlay) console.warn(`[SCENARIO LOG] No 'gameOver' scenario object found (or default).`); //
            else console.log(`[SCENARIO LOG] Found 'gameOver' scenario object:`, JSON.parse(JSON.stringify(scenarioToPlay))); //
            break;
        default:
            console.warn(`[SCENARIO LOG] Unsupported eventType: ${eventType}`); //
            scenarioEventTypeBeingPlayed = null; //
            return false; //
    }

    if (!scenarioToPlay) {
        console.warn(`[SCENARIO LOG] Scenario object (scenarioToPlay) is undefined for eventType=${eventType}. Path keys: ${key1}, ${key2 || ''}, ${key3 || ''}.`); //
        scenarioEventTypeBeingPlayed = null; //
        return false; //
    }
    if (!scenarioToPlay.steps || !Array.isArray(scenarioToPlay.steps) || scenarioToPlay.steps.length === 0) { //
        console.warn(`[SCENARIO LOG] 'steps' array is missing, not an array, or empty for eventType=${eventType}. Scenario:`, JSON.parse(JSON.stringify(scenarioToPlay))); //
        scenarioEventTypeBeingPlayed = null; //
        return false; //
    }
    console.log(`[SCENARIO LOG] Scenario object and steps found for ${eventType}. Proceeding to play.`); //


    previousGameState = gameState; //
    currentScenario = scenarioToPlay.steps; //
    activePortraits = []; // 新しいシナリオ開始時に立ち絵情報をリセット
    scenarioStepIndex = 0; //
    // scenarioStartTime は最初のステップに進む advanceScenario または updateScenario 内で設定
    isScenarioPlaying = true; //
    textHistory = []; //
    showText = true; //
    showKeyInstructions = true; //
    // waitForInput は最初のステップの種類に応じて設定
    lastImage = null; //

    // --- フェードイン開始 ---
    isFadingIn = true;
    scenarioFadeStartTime = millis();
    scenarioFadeAlpha = 0; // 最初は完全に透明

    console.log(`Starting scenario (fade in): type=${eventType}, char/id1=${key1}, stage/id2=${key2}, trigger/id3=${key3 || ''}`); //

    // 最初のステップの準備 (画像ロードなど) はフェード完了後か、advanceScenario で行う
    // loadNextImage(); // フェード完了後に移動
    // if (currentScenario[0]?.type === 'text') {
    //     addToBacklog(currentScenario[0].content);
    // }

    // waitForInput は最初のステップに応じて設定するが、フェード完了後に実質的に開始
    // waitForInput = (currentScenario[0]?.type === 'text');

    if (eventType === 'stageMiddle') {
        const stageIdForRecord = String(key2); //
        const triggerIdForRecord = key3; //
        const stageConfig = getStageConfig(stageIdForRecord); //
        const triggerConfig = stageConfig?.scenarioTriggers?.find(t => t.scenarioTriggerId === triggerIdForRecord); //
        if (triggerConfig?.once) { //
            activeStageScenarioTriggers.add(`${stageIdForRecord}-${triggerIdForRecord}`); //
            console.log(`[SCENARIO LOG] Marked trigger ${stageIdForRecord}-${triggerIdForRecord} as played (once).`); //
        }
    }
    setGameState('scenario'); 
    return true; 
}
function loadNextImage() {
    if (scenarioStepIndex >= currentScenario.length) return;
    const step = currentScenario[scenarioStepIndex];
    if (step.type === 'image' && !loadedImages[step.path]) {
        loadImage(step.path, 
            img => {
                loadedImages[step.path] = img;
                console.log(`Loaded image: ${step.path}`);
            },
            err => {
                console.error(`Failed to load image: ${step.path}`);
                loadedImages[step.path] = null;
            }
        );
    }
}
function preloadPortraitImage(path) {
    if (path && !loadedImages[path]) { //
        loadImage(path, //
            img => {
                loadedImages[path] = img; //
                console.log(`Loaded portrait image: ${path}`); //
            },
            err => {
                console.error(`Failed to load portrait image: ${path}`, err); //
                loadedImages[path] = null; //
            }
        );
    }
}
function resolveCharacterImagePath(identifier) {
    if (!identifier) return null;

    // ケース1: 'player' キーワード
    if (identifier === 'player') {
        if (selectedCharacter && playerStats) {
            const char = selectedCharacter.toLowerCase();
            const maxHp = playerStats.maxHp || 100;
            let statusKey = 'high';
            if (playerStats.hp <= 0) statusKey = 'dead';
            else if (playerStats.hp < maxHp * 0.3) statusKey = 'low';
            else if (playerStats.hp < maxHp * 0.6) statusKey = 'mid';
            
            return `assets/images/portraits/${char}_${statusKey}.png`;
        }
        return null;
    }

    // ケース2: 完全なファイルパス（変更なし）
    if (identifier.includes('/') && identifier.endsWith('.png')) {
        return identifier;
    }

    // ケース3: キャラクター名のキーワード（変更なし）
    if (SCENARIO_CHARACTERS.includes(identifier)) {
        return `assets/images/portraits/${identifier.toLowerCase()}.png`;
    }
    if (PLAYABLE_CHARACTERS.includes(identifier)) {
        return `assets/images/portraits/${identifier.toLowerCase()}_high.png`;
    }

    // どのケースにも当てはまらない場合
    console.warn(`Could not resolve characterImage identifier: ${identifier}`);
    return null;
}


function updatePortraitState(step) {
    // 1. 表示する画像のパスを解決する
    const resolvedCharacterImage = resolveCharacterImagePath(step.characterImage);
    
    let resolvedSpeaker = step.speaker;
    if (!resolvedSpeaker && step.characterImage && !step.characterImage.includes('/')) {
        resolvedSpeaker = (step.characterImage === 'player') ? selectedCharacter : step.characterImage;
    }

    // ★★★ 2. 新しい立ち絵の位置に既存の立ち絵があれば、それを事前に削除する ★★★
    if (step.type === 'text' && resolvedCharacterImage) {
        const newCharacterPositionIndex = step.characterPosition || 3;
        const newCharacterTargetX = PORTRAIT_POSITIONS_X[newCharacterPositionIndex];

        // これから表示する立ち絵と同じ位置にいる古い立ち絵を activePortraits から除外する
        activePortraits = activePortraits.filter(p => {
            if (p.targetX === newCharacterTargetX) {
                console.log(`[SCENARIO LOG] Portrait at position ${newCharacterPositionIndex} (${p.path}) is being replaced.`);
                return false; // この古い立ち絵を廃棄する
            }
            return true; // 位置が違うので残す
        });
    }
    // ★★★ ここまでが修正箇所 ★★★

    // 3. 新しい状態の立ち絵リストを構築する
    const newActivePortraits = [];
    if (step.type === 'text' && resolvedCharacterImage) {
        // findは常に失敗するようになるが、新規追加のロジックはそのまま使える
        let portrait = activePortraits.find(p => p.path === resolvedCharacterImage); 
        
        const positionX = PORTRAIT_POSITIONS_X[step.characterPosition || 3];
        const flip = step.characterFlip === 1;
        const appearType = step.characterAppear || 0;
        const dimOthers = (step.dimOthers !== undefined) ? step.dimOthers === 1 : true;

        if (portrait) { // 既に表示されているキャラクター（位置替えなどの場合）
            portrait.targetX = positionX;
            portrait.flip = flip;
            portrait.isSpeaking = true;
            portrait.dimOthersSetting = dimOthers;
            if (appearType !== 0 && portrait.currentX !== positionX) {
                portrait.appearStartTime = millis();
                portrait.appearType = appearType;
                portrait.startX = portrait.currentX;
                portrait.startY = portrait.currentY;
            } else {
                 portrait.appearType = 0;
            }
            newActivePortraits.push(portrait);
        } else { // 新しいキャラクター
            portrait = {
                path: resolvedCharacterImage,
                targetX: positionX,
                currentX: positionX,
                currentY: PORTRAIT_BASE_Y,
                flip: flip,
                alpha: 255,
                isSpeaking: true,
                appearType: appearType,
                appearStartTime: millis(),
                startX: 0,
                startY: 0,
                dimOthersSetting: dimOthers,
                visible: appearType === 0
            };
            if (appearType === 2) {
                if (step.characterPosition <= 2) portrait.startX = -PORTRAIT_DEFAULT_WIDTH / 2;
                else if (step.characterPosition === 3) portrait.startY = height + PORTRAIT_DEFAULT_HEIGHT / 2;
                else portrait.startX = width + PORTRAIT_DEFAULT_WIDTH / 2;
                portrait.currentX = portrait.startX;
                portrait.currentY = portrait.startY;
            }
            newActivePortraits.push(portrait);
        }
    }

    // 前のステップで表示されていたキャラクターの処理
    for (const oldPortrait of activePortraits) {
        if (!newActivePortraits.find(p => p.path === oldPortrait.path)) {
            oldPortrait.isSpeaking = false;
            newActivePortraits.push(oldPortrait);
        }
    }
    activePortraits = newActivePortraits;

    // 発言者の設定に基づいて他のキャラクターを暗くする
    const speakerPortrait = activePortraits.find(p => p.isSpeaking);
    const shouldDimOthers = speakerPortrait ? speakerPortrait.dimOthersSetting : (step.type === 'text' && !resolvedCharacterImage);

    for (const portrait of activePortraits) {
        if (speakerPortrait && portrait.path === speakerPortrait.path) {
            portrait.targetAlpha = 255;
        } else {
            portrait.targetAlpha = shouldDimOthers ? DIM_ALPHA : 255;
        }
    }
}

function advanceScenario() {
    if (!isScenarioPlaying || !currentScenario || isFadingIn) return;

    if (waitForInput) {
        waitForInput = false;
    }

    scenarioStepIndex++;

    while (scenarioStepIndex < currentScenario.length) {
        const nextStep = currentScenario[scenarioStepIndex];
        if (nextStep.condition && !evaluateCondition(nextStep.condition)) {
            scenarioStepIndex++;
            continue;
        }
        break;
    }
    
    scenarioStartTime = millis();

    if (scenarioStepIndex < currentScenario.length) {
        const stepToPlay = currentScenario[scenarioStepIndex];
        
        // ★ヘルパー関数で解決した後のパスを使ってプリロードする
        if (stepToPlay.characterImage) {
            const resolvedPath = resolveCharacterImagePath(stepToPlay.characterImage);
            preloadPortraitImage(resolvedPath);
        }
        if (stepToPlay.type === 'image' && stepToPlay.path) {
            loadNextImage(); // これは元々パスを扱うのでOK
        }
        
        updatePortraitState(stepToPlay);

        if (stepToPlay.type === 'changeBGM') {
            console.log(`Scenario: Persistently changing stage BGM to ID ${stepToPlay.id}`);
            currentStageBgmId = stepToPlay.id; // game.jsのグローバル変数を更新
            playBGM(stepToPlay.id, stepToPlay.loop);
            // このコマンドは待機しないので、すぐに次のステップへ進む
            advanceScenario(); 
            return; // このステップの処理を終了
        }

        // 2. 既存の音声コマンド処理を 'changeBGM' の後に行う
        if (stepToPlay.type === 'playBGM' || stepToPlay.type === 'stopBGM' || stepToPlay.type === 'playSE') {
            handleAudioCommands(stepToPlay);
            return; // 処理の重複を避けるためにreturnを追加
        }

        if (stepToPlay.type === 'text') {
            addToBacklog(stepToPlay.content);
            waitForInput = true;
        } else {
            waitForInput = false;
        }
    } else {
        endScenario();
    }
}
function handleAudioCommands(step) {
    if (step.type === 'playBGM') {
        playBGM(step.id, step.loop);
        console.log(`Scenario: Playing BGM ${step.id}`);
    } else if (step.type === 'stopBGM') {
        stopBGM();
        console.log(`Scenario: Stopping BGM`);
    } else if (step.type === 'playSE') {
        playSE(step.id);
        console.log(`Scenario: Playing SE ${step.id}`);
    }
    waitForInput = false;
    advanceScenario(); // 音声コマンドは即座に次のステップへ
}
function updateScenario() {
    if (!isScenarioPlaying || !currentScenario) return;

    // フェードイン処理
    if (isFadingIn) {
        const elapsed = millis() - scenarioFadeStartTime;
        if (elapsed < FADE_DURATION) {
            scenarioFadeAlpha = map(elapsed, 0, FADE_DURATION, 0, 180);
        } else { // フェード完了
            scenarioFadeAlpha = 180;
            isFadingIn = false;
            console.log("Scenario fade in complete.");

            // --- フェード完了後に最初のステップの準備と開始 ---
            scenarioStepIndex = -1; // advanceScenarioで0から始まるように調整
            advanceScenario(); // ★最初のステップも条件評価を通すためにadvanceScenarioを呼ぶ
        }
        return;
    }

    // 立ち絵アニメーションの更新
    const currentTime = millis();
    for (const portrait of activePortraits) {
        if (!portrait.visible && portrait.appearType !== 0) { // 登場アニメーション開始判定
             if (currentTime >= portrait.appearStartTime) { // 登場開始時間になったら表示
                 portrait.visible = true;
             }
        }
        if (!portrait.visible) continue;


        const elapsedAppearTime = currentTime - portrait.appearStartTime;
        let progress = 1;
        if (portrait.appearType !== 0 && elapsedAppearTime < APPEAR_DURATION) {
            progress = elapsedAppearTime / APPEAR_DURATION;
        }

        // アルファ更新 (フェードイン/アウトやdimming)
        if (portrait.alpha !== portrait.targetAlpha) {
            portrait.alpha = lerp(portrait.alpha, portrait.targetAlpha, 0.1); // スムーズに変化
        }


        switch (portrait.appearType) {
            case 0: // 即時
                portrait.currentX = portrait.targetX;
                portrait.currentY = PORTRAIT_BASE_Y;
                // alpha は targetAlpha に向かって変化
                break;
            case 1: // シルエットから (簡易版: アルファで表現)
                portrait.currentX = portrait.targetX;
                portrait.currentY = PORTRAIT_BASE_Y;
                // 最初はシルエット（targetAlphaを低く設定し、徐々に上げるなども可）
                // ここでは、単に targetAlpha に向かうアルファ値のみ
                // (drawScenario側でシルエット描画が必要なら別途処理)
                if (progress < 1) {
                    // シルエット表現のためのアルファ操作など（drawScenario側と連携）
                }
                break;
            case 2: // スライドイン
                 if (progress < 1) {
                    if (portrait.startX !== portrait.targetX) { // 横スライド
                        portrait.currentX = lerp(portrait.startX, portrait.targetX, easeInOutCubic(progress));
                    }
                    if (portrait.startY !== PORTRAIT_BASE_Y) { // 下からスライド
                        portrait.currentY = lerp(portrait.startY, PORTRAIT_BASE_Y, easeInOutCubic(progress));
                    }
                } else {
                    portrait.currentX = portrait.targetX;
                    portrait.currentY = PORTRAIT_BASE_Y;
                    portrait.appearType = 0; // アニメーション完了
                }
                break;
        }
    }


    if (waitForInput || scenarioStepIndex >= currentScenario.length) return; //
  const step = currentScenario[scenarioStepIndex]; //
    if (!step) { //
        endScenario(); //
        return; //
    }

    // duration が設定されているステップの自動進行
    // type 'image' の場合は delay (または duration) があればその時間表示
    // type 'text' は waitForInput が true なのでこのロジックには入らない
    if (step.duration && step.type !== 'text') { // step.duration は scenario.json のステップで定義 (例: { "type": "image", "path": "...", "duration": 2000 })
        const elapsed = millis() - scenarioStartTime; //
        if (elapsed >= step.duration) { //
            advanceScenario(); //
        }
    } else if (step.type === 'image' && !step.duration) {
        // 画像タイプで duration がない場合は、表示後すぐに次のステップへ
        // (ただし、1フレームは表示されるように、advanceScenarioをこのフレームの最後で呼ぶか、次のフレームで呼ぶ形にする)
        // ここでは、advanceScenario が次のステップに進めるので、実質的に一瞬表示されて次に進む。
        // 確実に1フレーム表示させたい場合は、少し工夫が必要。
        // 今回は、duration がなければ即次のステップへ、という挙動とするため、この後すぐに advanceScenario が呼ばれることを期待する。
        // （実際には advanceScenario は入力があったときか、duration が終わったときに呼ばれるので、
        //  duration なし画像は advanceScenario のロジックで waitForInput=false になり、
        //  この updateScenario で再度ここに入り、結局何もせず次の入力待ちのようになる。
        //  これを解決するには、image typeでdurationなしの場合、即advanceが必要）
        console.log(`Image step without duration, advancing scenario. Step: ${scenarioStepIndex +1}`);
        advanceScenario(); // 画像でdurationがなければ即座に次のステップへ
    }

}


// イージング関数（例）
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawScenario() {
    if (!isScenarioPlaying || !currentScenario) return;

    // フェードオーバーレイ描画
    fill(0, 0, 0, scenarioFadeAlpha);
    rect(0, 0, 1280, 720);

    if (isFadingIn || scenarioStepIndex >= currentScenario.length) {
        if (isFadingIn && showKeyInstructions) {
            fill(200, 200, 200, scenarioFadeAlpha > 0 ? min(scenarioFadeAlpha, 100) : 0);
            textSize(16);
            textAlign(RIGHT, BOTTOM);
            text("[ESC] スキップ", 1280 - 20, 720 - 20);
        }
        return;
    }

    const step = currentScenario[scenarioStepIndex];
    if (!step) return;

    // 立ち絵の描画
    for (const portrait of activePortraits) {
        if (!portrait.path || !loadedImages[portrait.path] || !portrait.visible) continue;

        const img = loadedImages[portrait.path];
        if (!img || !img.width) continue;

        push();
        translate(portrait.currentX, portrait.currentY);
        if (portrait.flip) {
            scale(-1, 1);
        }

        // ★★★ 立ち絵の拡縮ロジックを修正 ★★★
        // --- 従来のロジック (削除またはコメントアウト) ---
        // let pWidth = PORTRAIT_DEFAULT_WIDTH;
        // let pHeight = PORTRAIT_DEFAULT_HEIGHT;
        // const imgAspect = img.width / img.height;
        // const targetAspect = pWidth / pHeight;
        // if (imgAspect > targetAspect) { // 画像がターゲットより横長
        //     pHeight = pWidth / imgAspect;
        // } else { // 画像がターゲットより縦長
        //     pWidth = pHeight * imgAspect;
        // }

        // --- 新しいロジック (縦幅を基準にする) ---
        const pHeight = PORTRAIT_DEFAULT_HEIGHT;    // 1. 描画の高さを基準値に設定
        const imgAspect = img.width / img.height;      // 2. 元画像の縦横比を計算
        const pWidth = pHeight * imgAspect;            // 3. 縦横比を維持して描画幅を計算

        tint(255, portrait.alpha);

        if (portrait.appearType === 1 && millis() - portrait.appearStartTime < APPEAR_DURATION) {
            const progress = (millis() - portrait.appearStartTime) / APPEAR_DURATION;
            tint(lerp(0,255,progress), lerp(0, portrait.alpha, progress));
        }

        image(img, -pWidth / 2, -pHeight, pWidth, pHeight);
        noTint();
        pop();
    }


    // シナリオ背景画像 (lastImage) の描画
    if (step.type === 'image' && step.path) { //
        const img = loadedImages[step.path]; //
        if (img && img.width) { //
            lastImage = { //
                img: img, //
                effect: step.effect, //
                effectParams: step.effectParams, //
                startTime: scenarioStartTime //
            };
        } else if (!img && !loadedImages.hasOwnProperty(step.path)) { //
            loadNextImage(); //
        }
    }
    if (lastImage && lastImage.img && lastImage.img.width) { //
        const imgToDraw = lastImage.img; //
        const effect = lastImage.effect; //
        const effectStartTime = lastImage.startTime; //

        if (effect === 'flash') {  //
            const elapsed = millis() - effectStartTime; //
            let alpha = 0; //
            if (elapsed < 300) alpha = map(elapsed, 0, 300, 0, 255); //
            else if (elapsed < 500) alpha = 255; //
            else if (elapsed < 900) alpha = map(elapsed, 500, 900, 255, 0); //
            
            if (alpha > 0) { //
                tint(255, alpha); //
            }
                }

        const aspectRatio = imgToDraw.width / imgToDraw.height; //
        let drawWidth = 1280; //
        let drawHeight = 1280 / aspectRatio; //
        if (drawHeight > 720) { //
            drawHeight = 720; //
            drawWidth = 720 * aspectRatio; //
        }
        image(imgToDraw, (1280 - drawWidth) / 2, (720 - drawHeight) / 2, drawWidth, drawHeight); //
        noTint(); //
    }


    // テキスト表示ロジック
    if (step.type === 'text' && showText) { //
        const textBoxX = 100; //
        const textBoxY = 720 - 200; //
        const textBoxW = 1280 - 200; //
        const textBoxH = 150; //
        const padding = 20; // テキストボックス内の余白

        // 発言者名を表示する場合
        if (step.speaker) { //
            fill(50); // 名前の背景色 (少し暗め)
            textSize(22); //
            textAlign(LEFT, TOP); // 名前は左上基準
            const speakerTextWidth = textWidth(step.speaker); //
            rect(textBoxX + padding - 10, textBoxY - 30 - 5, speakerTextWidth + 20, 30, 5); // 名前表示用の背景
            fill(255); // 名前の文字色
            text(step.speaker, textBoxX + padding, textBoxY - 30); //
        }

        fill(0, 0, 0, 180); //
        rect(textBoxX, textBoxY, textBoxW, textBoxH, 10); //


        // --- ★★★ ここからが修正点 ★★★ ---
        // テキスト本文
        fill(255);
        textSize(28);
        textAlign(LEFT, TOP);

        // 1. content内の<br>タグを改行文字(\n)に置き換える
        const formattedContent = String(step.content).replace(/<br>/g, '\n');

        // 2. 置き換えた後のテキストを描画する
        text(formattedContent, // ★ 変更後の変数を指定
             textBoxX + padding,
             textBoxY + padding,
             textBoxW - padding * 2,
             textBoxH - padding * 2);
        // --- ★★★ 修正ここまで ★★★ ---
    }

    // ... (既存のキー操作ガイド表示) ...
    if (showKeyInstructions) { //
        fill(200); //
        textSize(16); //
        textAlign(RIGHT, BOTTOM); //
        let instructionText = ""; //
        if (waitForInput) instructionText += "[SPACE/ENTER] 次へ  "; //
        instructionText += "[C] バックログ  [V] テキスト表示/非表示  [ESC] スキップ"; //
        text(instructionText, 1280 - 20, 720 - 20); //
    }
}

function drawBacklog() {
    if (!isScenarioPlaying || !textHistory.length) return;

    fill(0, 0, 0, 230); // より濃い背景
    rect(100, 50, 1280 - 200, 720 - 100, 10); // 少し大きめのバックログウィンドウ
    fill(220);
    textSize(18);
    textAlign(LEFT, TOP);
    let y = 70;
    const x = 120;
    const logWidth = 1280 - 240;
    
    text("バックログ (Cキーで閉じる)", x, y);
    y += 30;

    for (let i = textHistory.length -1; i >=0; i--) { // 新しいものが上に来るように逆順で描画（任意）
        let entry = textHistory[i];
        let lines = 0;
        // 簡単な行数計算（より正確には textWidth との組み合わせが必要）
        let currentY = y;
        textWrap(WORD); // p5.js の textWrap(WORD) を利用
        let textHeight = textAscent() + textDescent();
        let wrappedText = textHistory[i]; // text() は直接描画するので、ここでは行数見積もりのみ
        
        // 簡易的な行数計算（textBoundsを使う方が正確だが、ここでは概算）
        let estimatedLines = Math.ceil(textWidth(wrappedText) / logWidth) ; // 単純な幅での割り算
        if (textWidth(wrappedText) > logWidth) { // 複数行になりそうな場合
             // textToPoints や graphics buffer を使わない簡易的な行数予測は難しい
             // text() 関数が自動で改行するのを前提とする場合、正確な行数取得は描画後になる
             // ここでは概算として、一行の高さを加算
             lines = wrappedText.split('\n').length; // 明示的な改行はカウント
             // TODO: 自動改行の行数見積もりは複雑なので、固定行数やスクロール実装を検討
        } else {
            lines = 1;
        }

        text(entry, x, currentY, logWidth); // 描画幅を指定して自動改行
        y += textHeight * lines + 5; // 行間を少し空ける
        if (y > 720 - 70) break; // 画面外に出るなら停止
    }
}

function endScenario() {
    const originalPreviousGameState = previousGameState;
    const endedEventType = scenarioEventTypeBeingPlayed;
    isScenarioPlaying = false;
    isFadingIn = false;
    scenarioFadeAlpha = 0;

    console.log(`Scenario ended. Original previous state: ${originalPreviousGameState}, Ended event type: ${endedEventType}`);

    // ★★★ ここからが修正箇所：予約された演出を実行 ★★★
    if (queuedCutin && typeof startCutin === 'function') {
        console.log(`Executing queued cutin: ${queuedCutin}`);
        startCutin(queuedCutin);
        queuedCutin = null; // 実行後に予約をクリア
    }
    if (queuedBGMChange && typeof playBGM === 'function') {
        console.log(`Executing queued BGM change: id=${queuedBGMChange.id}`);
        currentStageBgmId = queuedBGMChange.id; // ステージBGMを永続的に変更
        playBGM(queuedBGMChange.id, queuedBGMChange.loop);
        queuedBGMChange = null; // 実行後に予約をクリア
    }

    // ゲームオーバーシナリオを閲覧済みとしてセーブデータに記録
    if (endedEventType === 'gameOver' && selectedCharacter) { 
        if (originalPreviousGameState !== 'recall') {
            const species = playerStats.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]
                ? unitTypes[playerStats.lastDamageUnitType].species || 'default'
                : 'default';
            if (!saveData.characters[selectedCharacter]) {
                saveData.characters[selectedCharacter] = { stages: {}, scenarios: { gameOver: {} } };
            }
            if (!saveData.characters[selectedCharacter].scenarios.gameOver) {
                saveData.characters[selectedCharacter].scenarios.gameOver = {};
            }
            saveData.characters[selectedCharacter].scenarios.gameOver[species] = true;
            console.log(`Marked scenario as viewed: char=${selectedCharacter}, event=gameOver, species=${species}`);
            saveGameData();
        }
    }

    // 各種フラグをリセット
    previousGameState = null;
    scenarioEventTypeBeingPlayed = null;
    currentScenario = null;
    scenarioStepIndex = 0;
    showText = true;
    showKeyInstructions = true;
    waitForInput = false;
    lastImage = null;
    activePortraits = []; // 立ち絵情報をクリア

    // 1. 最優先で「回想モードからの再生だったか」を確認します。
    //    そうであれば、必ず回想モードの画面に戻します。

    if (originalPreviousGameState === 'recall') {
        setGameState('recall');
    } 
    // 2. 回想モードからでなければ、次に「ゲーム本編でのゲームオーバーか」を確認します。
    else if (endedEventType === 'gameOver') {
        setGameState('gameOver'); 
    } 


    // 3. 以降は、既存の条件分岐をそのまま続けます。
    else if (nextStageAvailable) {
        // 最優先：次のステージへ進むフラグが立っている場合
        nextStageAvailable = false; // フラグを消費
        setGameState('playing');
    }
    else if (window.transitionToResultAfterScenario) {
        // 次に優先：通常クリア後にリザルト画面へ遷移する場合
        window.transitionToResultAfterScenario = false;
        setGameState('result');
    }
    else if (window.transitionToResultAfterScenario && (endedEventType === 'stageClear') && 
               (originalPreviousGameState === 'playing' || originalPreviousGameState === 'boss')) {
        window.transitionToResultAfterScenario = false;
        setGameState('result');
    } else if (originalPreviousGameState === 'characterSelect' && endedEventType === 'stageStart') {
        setGameState('playing');
    } else if (originalPreviousGameState === 'playing' || originalPreviousGameState === 'boss') {
        setGameState(originalPreviousGameState);
    } else {
        backToTitle();
    }
}
    activePortraits = []; // シナリオ終了時に立ち絵情報をクリア
function isScenarioActive() {
    return isScenarioPlaying;
}

function toggleText() {
    if (isScenarioPlaying) { // シナリオ再生中のみ有効
        showText = !showText;
        // showKeyInstructions = true; // テキスト表示状態に関わらずキーガイドは表示し続けることが多い
        console.log(`Text visibility toggled: ${showText}`);
    }
}

function addToBacklog(content) {
    if (content) {
        textHistory.push(String(content)); //念のため文字列に変換
        if (textHistory.length > 50) { // バックログの最大保持数
            textHistory.shift();
        }
    }
}
function evaluateCondition(condition) {
    if (!condition) {
        return true; // 条件がなければ常にtrue
    }

    switch (condition.type) {
        case 'playerStat':
            if (!playerStats) return false;

            let statValue;
            switch (condition.stat) {
                case 'hp':
                    statValue = playerStats.hp;
                    break;
                case 'maxHp':
                    statValue = playerStats.maxHp;
                    break;
                case 'hpPercentage':
                    statValue = (playerStats.hp / playerStats.maxHp) * 100;
                    break;
                case 'level':
                    statValue = playerStats.level;
                    break;
                default:
                    console.warn(`Unknown playerStat condition stat: ${condition.stat}`);
                    return true; // 不明なステータスは無視
            }

            const valueToCompare = condition.value;
            switch (condition.operator) {
                case '>=': return statValue >= valueToCompare;
                case '>':  return statValue > valueToCompare;
                case '<=': return statValue <= valueToCompare;
                case '<':  return statValue < valueToCompare;
                case '==': return statValue == valueToCompare;
                case '!=': return statValue != valueToCompare;
                default:
                    console.warn(`Unknown playerStat condition operator: ${condition.operator}`);
                    return true; // 不明な演算子は無視
            }

        // --- 将来的な拡張例 ---
        // case 'hasUpgrade':
        //     const upgrade = window.upgrades.find(u => u.name === condition.upgradeName);
        //     if (!upgrade) return false;
        //     return upgrade.level >= (condition.level || 1);

        default:
            console.warn(`Unknown condition type: ${condition.type}`);
            return true; // 不明なタイプは無視
    }
}
