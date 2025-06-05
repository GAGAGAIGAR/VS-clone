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

function loadScenarioData() {
    loadJSON('scenario.json', (data) => {
        scenarioData = data;
        scenarioDataLoaded = true;
        console.log('Scenario data loaded successfully:', scenarioData); //
        if (scenarioData?.events?.gameOver) { //
            recallScenarios = []; //
            const characters = Object.keys(scenarioData.events.gameOver); //
            for (let character of characters) { //
                const speciesList = Object.keys(scenarioData.events.gameOver[character]); //
                for (let species of speciesList) { //
                    if (scenarioData.events.gameOver[character][species].thumbnail) { //
                        recallScenarios.push({ character, species }); //
                        const thumbnailPath = scenarioData.events.gameOver[character][species].thumbnail; //
                        if (thumbnailPath && !loadedImages[thumbnailPath]) { //
                            loadImage(thumbnailPath, //
                                img => {
                                    loadedImages[thumbnailPath] = img; //
                                    console.log(`Preloaded recall thumbnail: ${thumbnailPath}`); //
                                },
                                err => {
                                    console.error(`Failed to preload recall thumbnail: ${thumbnailPath}`, err); //
                                    loadedImages[thumbnailPath] = null; //
                                }
                            );
                        }
                    }
                }
            }
            console.log('Initialized recallScenarios:', recallScenarios); //
        } else {
             console.warn("scenario.json に events.gameOver が見つかりません。"); //
        }
    }, (err) => {
        console.error('Failed to load scenario.json. Check file path and JSON format.', err); //
        scenarioDataLoaded = true; //
        scenarioData = null; //
    });
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

function updatePortraitState(step) {
    const newActivePortraits = [];
    let currentSpeakerPath = null;

    // 現在のステップで発言（または指示のある）キャラクターの画像パスを取得
    if (step.type === 'text' && step.characterImage) {
        currentSpeakerPath = step.characterImage;
    }

    // 既存の立ち絵をベースに新しい状態を構築
    // まず、現在のステップで指示のあるキャラクターを処理
    if (step.type === 'text' && step.characterImage) {
        preloadPortraitImage(step.characterImage); //
        let portrait = activePortraits.find(p => p.path === step.characterImage);
        const positionX = PORTRAIT_POSITIONS_X[step.characterPosition || 3];
        const flip = step.characterFlip === 1;
        const appearType = step.characterAppear || 0;
        const dimOthers = (step.dimOthers !== undefined) ? step.dimOthers === 1 : true; // デフォルトはオン

        if (portrait) { // 既に表示されているキャラクター
            portrait.targetX = positionX;
            portrait.flip = flip;
            portrait.isSpeaking = true;
            portrait.dimOthersSetting = dimOthers;
            // 登場方法が指定されていれば再登場アニメーション（通常は不要、位置変更のみ）
            if (appearType !== 0 && portrait.currentX !== positionX) { // 位置が変わり、再登場アニメーションする場合
                portrait.appearStartTime = millis();
                portrait.appearType = appearType;
                portrait.startX = portrait.currentX; // スライド開始位置
                portrait.startY = portrait.currentY;
            } else {
                 portrait.appearType = 0; // 即時表示/位置変更
            }
            newActivePortraits.push(portrait);
        } else { // 新しいキャラクター
            portrait = {
                path: step.characterImage,
                targetX: positionX,
                currentX: positionX, // 初期位置（アニメーションで変わる）
                currentY: PORTRAIT_BASE_Y,
                flip: flip,
                alpha: 255, // 初期アルファ（登場アニメーションで変わる）
                isSpeaking: true,
                appearType: appearType,
                appearStartTime: millis(),
                startX: 0, // スライドインの開始X (画面外)
                startY: 0, // スライドインの開始Y (画面外)
                dimOthersSetting: dimOthers,
                visible: appearType !== 0 // 即時登場以外は最初は非表示としてアニメーションで表示
            };
            // スライドインの開始位置設定
            if (appearType === 2) {
                if (step.characterPosition <= 2) portrait.startX = -PORTRAIT_DEFAULT_WIDTH / 2; // 左から
                else if (step.characterPosition === 3) portrait.startY = height + PORTRAIT_DEFAULT_HEIGHT / 2; // 下から
                else portrait.startX = width + PORTRAIT_DEFAULT_WIDTH / 2; // 右から
                portrait.currentX = portrait.startX;
                portrait.currentY = portrait.startY;
            }
             if (appearType === 0) portrait.visible = true;
            newActivePortraits.push(portrait);
        }
    }

    // 前のステップで表示されていたが、現在のステップで指示のないキャラクターの処理
    for (const oldPortrait of activePortraits) {
        if (!newActivePortraits.find(p => p.path === oldPortrait.path)) {
            if (step.type === 'text' && !step.characterImage) { // ナレーション等の場合、全員暗めにするかそのまま
                 oldPortrait.isSpeaking = false; // 発言者なし
            } else if (currentSpeakerPath && oldPortrait.path !== currentSpeakerPath) {
                oldPortrait.isSpeaking = false; // 他のキャラが発言
            }
            // dimOthers は発言者の設定に依存
            newActivePortraits.push(oldPortrait);
        }
    }
    activePortraits = newActivePortraits;

    // 発言者の dimOthersSetting を全体に適用
    const speakerPortrait = activePortraits.find(p => p.isSpeaking);
    const shouldDimOthers = speakerPortrait ? speakerPortrait.dimOthersSetting : (step.type === 'text' && !step.characterImage); // 発言者なしのテキストなら全員暗くするオプションも考慮

    for (const portrait of activePortraits) {
        if (speakerPortrait && portrait.path === speakerPortrait.path) {
            portrait.targetAlpha = 255;
        } else {
            portrait.targetAlpha = shouldDimOthers ? DIM_ALPHA : 255;
        }
    }
}


function advanceScenario() {
    if (!isScenarioPlaying || !currentScenario || isFadingIn) return; //

    if (waitForInput) { //
        waitForInput = false; //
        // scenarioStartTime = millis(); // 入力があったのでタイマーリセットは不要、次のステップで設定
    }

    scenarioStepIndex++; //
    scenarioStartTime = millis(); // 新しいステップの開始時間

    if (scenarioStepIndex < currentScenario.length) { //
        const nextStep = currentScenario[scenarioStepIndex]; //
        loadNextImage(); // ★シナリオ背景画像のプリロード (これはOK)
        // preloadPortraitImage(nextStep.characterImage); // ★立ち絵のプリロードはこちらが適切 (nextStep.characterImage が存在する場合)
        if (nextStep.characterImage) {
            preloadPortraitImage(nextStep.characterImage); //
        }
        updatePortraitState(nextStep); // 立ち絵の状態を更新

        if (nextStep.type === 'text') { //
            addToBacklog(nextStep.content); //
            waitForInput = true; //
        } else if (nextStep.type === 'image') { //
            waitForInput = false; //
        } else {
            waitForInput = false; //
        }
        console.log(`Moved to scenario step ${scenarioStepIndex + 1}/${currentScenario.length}. Type: ${nextStep.type}. Waiting for input: ${waitForInput}`); //
    } else {
        endScenario(); //
    }
}

function updateScenario() {
    if (!isScenarioPlaying || !currentScenario) return; //

    // フェードイン処理
    if (isFadingIn) {
       const elapsed = millis() - scenarioFadeStartTime;
        if (elapsed < FADE_DURATION) {
            scenarioFadeAlpha = map(elapsed, 0, FADE_DURATION, 0, 180); //
        } else { // フェード完了
            scenarioFadeAlpha = 180; //
            isFadingIn = false; // ★★★ isFadingIn を false に設定 ★★★
            console.log("Scenario fade in complete."); //

            // ★★★ フェード完了後に最初のステップの準備と開始 ★★★
            scenarioStartTime = millis(); // 最初のステップの開始時間
            loadNextImage(); // シナリオ背景画像のプリロード
            const firstStep = currentScenario[scenarioStepIndex]; //
            if (firstStep) {
                updatePortraitState(firstStep); // ★最初のステップの立ち絵状態を設定
                if (firstStep.type === 'text') { //
                    addToBacklog(firstStep.content); //
                    waitForInput = true; //
                } else if (firstStep.type === 'image') { //
                    waitForInput = false; //
                } else {
                    waitForInput = false; //
                }
                 console.log(`First scenario step ${scenarioStepIndex + 1}/${currentScenario.length}. Type: ${firstStep.type}. Waiting for input: ${waitForInput}`); //
            } else {
                endScenario(); //
            }
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
    if (!isScenarioPlaying || !currentScenario) return; //

    // ... (既存のフェードオーバーレイ描画) ...
    fill(0, 0, 0, scenarioFadeAlpha); //
    rect(0, 0, 1280, 720); //


    if (isFadingIn || scenarioStepIndex >= currentScenario.length) { //
        if (isFadingIn && showKeyInstructions) { // フェードイン中でも操作ガイドは薄く表示しても良いかも
            fill(200, 200, 200, scenarioFadeAlpha > 0 ? min(scenarioFadeAlpha, 100) : 0); // 薄めに
            textSize(16); //
            textAlign(RIGHT, BOTTOM); //
            text("[ESC] スキップ", 1280 - 20, 720 - 20); //
        }
        return; //
    }

    const step = currentScenario[scenarioStepIndex]; //
    if (!step) return; //

    // 立ち絵の描画 (テキストやシナリオ背景画像より手前)
    for (const portrait of activePortraits) {
        if (!portrait.path || !loadedImages[portrait.path] || !portrait.visible) continue; // 画像がないか非表示ならスキップ

        const img = loadedImages[portrait.path]; //
        if (!img || !img.width) continue; //

        push();
        translate(portrait.currentX, portrait.currentY); // アニメーション中の位置
        if (portrait.flip) {
            scale(-1, 1); // 左右反転
        }

        // 画像のアスペクト比を保って描画
        let pWidth = PORTRAIT_DEFAULT_WIDTH;
        let pHeight = PORTRAIT_DEFAULT_HEIGHT;
        const imgAspect = img.width / img.height;
        const targetAspect = pWidth / pHeight;

        if (imgAspect > targetAspect) { // 画像がターゲットより横長
            pHeight = pWidth / imgAspect;
        } else { // 画像がターゲットより縦長
            pWidth = pHeight * imgAspect;
        }
        
        tint(255, portrait.alpha); // 発言中かどうかなどでアルファ値を調整

        // シルエット描画 (appearType === 1 の場合)
        if (portrait.appearType === 1 && millis() - portrait.appearStartTime < APPEAR_DURATION) {
            const progress = (millis() - portrait.appearStartTime) / APPEAR_DURATION;
            // 簡単なシルエット: 黒で描画し、徐々に透明にする
            // またはキャラクター画像自体を tint(0, lerp(255, portrait.alpha, progress)) のようにする
            tint(lerp(0,255,progress), lerp(0, portrait.alpha, progress)); // 徐々に色が見えてくる感じ
        }


        image(img, -pWidth / 2, -pHeight, pWidth, pHeight); // Y座標は画像の底辺を基準に
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

        // テキスト本文
        fill(255); //
        textSize(28); //
        textAlign(LEFT, TOP); // ★★★文章は左上揃えに変更★★★
        text(step.content,
             textBoxX + padding,         // X座標 (テキストボックス左端 + パディング)
             textBoxY + padding,         // Y座標 (テキストボックス上端 + パディング)
             textBoxW - padding * 2,     // 描画幅 (テキストボックス幅 - 左右パディング)
             textBoxH - padding * 2);    // 描画高さ (テキストボックス高さ - 上下パディング、自動改行用)
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

const originalPreviousGameState = previousGameState; //
    const endedEventType = scenarioEventTypeBeingPlayed; //
    isScenarioPlaying = false; //
    isFadingIn = false; // フェード状態もリセット
    scenarioFadeAlpha = 0; // フェードアルファもリセット

    console.log(`Scenario ended. Original previous state: ${originalPreviousGameState}, Ended event type: ${endedEventType}`); //

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

    previousGameState = null; //
    scenarioEventTypeBeingPlayed = null; //
    currentScenario = null; //
    scenarioStepIndex = 0; //
    showText = true; //
    showKeyInstructions = true; //
    waitForInput = false; //
    lastImage = null; //

    if (window.transitionToResultAfterScenario && (endedEventType === 'stageClear') && //
        (originalPreviousGameState === 'playing' || originalPreviousGameState === 'boss')) { //
        window.transitionToResultAfterScenario = false; //
        setGameState('result'); //
    } else if (originalPreviousGameState === 'recall') { //
        setGameState('recall'); //
    } else if (originalPreviousGameState === 'characterSelect' && endedEventType === 'stageStart') { //
        setGameState('playing'); //
    } else if (originalPreviousGameState === 'playing' || originalPreviousGameState === 'boss') { //
        setGameState(originalPreviousGameState); //
    } else {
        backToTitle(); //
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