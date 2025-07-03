let sfxVolume = 0.5;
let bgmVolume = 0.5;
let currentBGM = null;
let currentBgmId = null; // ★ 現在再生中のBGM IDを保持する変数を追加
let currentUiPortrait = null; // 現在表示されているポートレイトを記録
let portraitChangeEffect = {
    active: false,        // エフェクトが作動中か
    startTime: 0,         // エフェクトの開始時間
    newPortrait: null     // 新しく表示するポートレイト
    
};
let cutinFrames = {}; // ★★★ カットインフレーム用オブジェクトを追加
let cutinFaces = {};  // ★★★ カットイン顔画像用オブジェクトを追加

const mapBackgrounds = {
    // キーはステージ設定ファイル(stages.js)で使う識別子です。
    // p5Imageプロパティは、preloadで読み込んだ画像オブジェクトを保持するために使用します。
        'st1': { path: 'assets/images/st1.png', p5Image: null },
        'st2': { path: 'assets/images/st2.png', p5Image: null },
    //'meadow': { path: 'assets/images/bg_meadow.jpg', p5Image: null },
    //'factory': { path: 'assets/images/bg_factory.png', p5Image: null },
    // 新しい背景を追加する場合は、ここに追記します。
    // 'desert': { path: 'assets/images/bg_desert.png', p5Image: null },
};

// --- 音声ファイルデータの定義 ---
const bgmData = {
    1: { path: 'assets/bgm/tkt_srpg_no02_title.ogg', volume: 0.8, loop: true, p5Sound: null }, //
    2: { path: 'assets/bgm/maou_game_battle36.ogg', volume: 0.8, loop: true, p5Sound: null }, //
    3: { path: 'assets/bgm/DeamonsFest.ogg', volume: 0.8, loop: true, p5Sound: null      ,loopStart: 5.893,loopEnd: 98.201 }, // ステージ1BGM　ループポイントを追加
    4: { path: 'assets/bgm/tkt_srpg_no36_win1.ogg', volume: 0.8, loop: true, p5Sound: null }, //
    5: { path: 'assets/bgm/tkt_srpg_no04_playerfield-1.ogg', volume: 0.8, loop: true, p5Sound: null } ,//
    6: { path: 'assets/bgm/tkt_srpg_no38_sad.ogg', volume: 0.8, loop: true, p5Sound: null } ,//ゲームオーバー用
    7: { path: 'assets/bgm/darkmetal.ogg', volume: 0.8, loop: true, p5Sound: null } ,//Hシーン用
    8: { path: 'assets/bgm/youenayashii.ogg', volume: 0.8, loop: true, p5Sound: null } ,//回想用
    9: { path: 'assets/bgm/EvilWeapon.ogg', volume: 0.8, loop: true, p5Sound: null,loopStart: 6.912,loopEnd: 160.104 } ,//ボス戦
};

const seData = {
    'confirm': { path: 'assets/se/maou_se_onepoint12.ogg', volume: 1.0, p5Sound: null },
        'shoot': { path: 'assets/se/fire.mp3', volume: 1.0, p5Sound: null ,maxInstances: 2,throttleInterval: 100, playTimestamps: [], },
    //'cancel':  { path: 'assets/se/cancel_sound.ogg', volume: 0.9, p5Sound: null }, // 例: 新しいSEを追加
    'slash':   { path: 'assets/se/slash1.mp3', volume: 0.8, p5Sound: null ,maxInstances: 2,throttleInterval: 100, playTimestamps: [], },   // 例: 攻撃用のSE
        'slash2':   { path: 'assets/se/slash2.mp3', volume: 0.8, p5Sound: null ,maxInstances: 3,throttleInterval: 100, playTimestamps: [], },
                'enemy_explode':   { path: 'assets/se/maou_se_8bit18.ogg', volume: 0.8, p5Sound: null ,
        maxInstances: 2,           // 同時再生は3つまで
        throttleInterval: 100,     // 制限時は0.1秒待つ
        playTimestamps: [],        // 再生履歴（空のまま定義）
    },
                    'hit_slash':   { path: 'assets/se/maou_se_battle03.ogg', volume: 0.8, p5Sound: null ,
        maxInstances: 2,           // 同時再生は3つまで
        throttleInterval: 100,     // 制限時は0.1秒待つ
        playTimestamps: [],        // 再生履歴（空のまま定義）
    },
    'hit_bullet':  { path: 'assets/se/maou_se_8bit12.ogg', volume: 0.7, p5Sound: null ,maxInstances: 3,throttleInterval: 100, playTimestamps: [], },

    //'explosion': { path: 'assets/se/explosion_sound.ogg', volume: 1.0, p5Sound: null }  // 例: 爆発用のSE
};

/**
 * 指定されたIDのBGMを再生する。ループポイントの仕様をp5.sound v1.0.1に合わせて修正。
 * @param {number} id - bgmData内のBGMのID
 * @param {boolean|null} loopOverride - ループ設定を上書きする場合に指定
 */
function playBGM(id, loopOverride = null) {
    // 現在のBGMを停止し、キューをクリア
    if (currentBGM && currentBGM.isPlaying()) {
        currentBGM.stop();
    }
    if (currentBGM) {
        currentBGM.clearCues();
    }

    const bgmInfo = bgmData[id];
    if (!bgmInfo || !bgmInfo.p5Sound || !bgmInfo.p5Sound.isLoaded()) {
        console.warn(`BGM with id ${id} is not ready.`);
        return;
    }

    currentBGM = bgmInfo.p5Sound;
    currentBGM.setVolume(bgmInfo.volume * bgmVolume);
    currentBgmId = id;

    // ★★★ ここからがループ再生ロジックの修正箇所です ★★★
    if (bgmInfo.loopStart !== undefined && bgmInfo.loopEnd !== undefined) {
        
        // ループ終点で一度だけ実行されるコールバック関数
        const startNativeLoop = () => {
            // stop()はloop()メソッド内部で自動的に呼ばれるため、ここでは不要
            
            const loopDuration = bgmInfo.loopEnd - bgmInfo.loopStart;
            
            // p5.soundのloopメソッドを使い、ネイティブなループ再生を開始する
            // loop(delay, rate, amp, loopStart, duration)
            currentBGM.loop(
                0, // 即時再生
                1, // 通常の再生速度
                currentBGM.getVolume(), // 現在の音量
                bgmInfo.loopStart,   // ループの開始時間
                loopDuration         // ループ区間の長さ
            );
        };

        // ループ終点に、上記のコールバックを一度だけ設定する
        currentBGM.addCue(bgmInfo.loopEnd, startNativeLoop);
        
        // まずは曲の最初からループ終点までを一度だけ再生
        currentBGM.play();

    } else {
        // ループポイントが未定義の場合の、通常の全体ループ
        const shouldLoop = loopOverride !== null ? loopOverride : bgmInfo.loop;
        if (shouldLoop) {
            currentBGM.loop();
        } else {
            currentBGM.play();
        }
    }
    // ★★★ 修正ここまで ★★★
}

function stopBGM() {
    if (currentBGM && currentBGM.isPlaying()) {
        currentBGM.stop();
        currentBGM = null;
        console.log("BGM stopped.");
    }
    // currentBGM = null; // currentBGM自体はnullにしない方が情報を参照しやすい
    currentBgmId = null; // ★ 停止時にもIDをクリア
}

function playSE(id) {
    const seInfo = seData[id];
    const p5Sound = seInfo?.p5Sound;

    if (!p5Sound || !p5Sound.isLoaded()) {
        if (!seInfo) console.warn(`SE with id "${id}" not found.`);
        else if (!p5Sound) console.warn(`SE p5Sound object for "${id}" is null.`);
        else console.warn(`SE with id "${id}" is still loading.`);
        return;
    }

    const now = millis();
    const audioContext = getAudioContext(); // p5.jsのオーディオコンテキストを取得

    // --- 再生数と間隔の制限ロジック (少し変更) ---
    if (seInfo.maxInstances) {
        const duration = p5Sound.duration() * 1000;
        seInfo.playTimestamps = seInfo.playTimestamps.filter(ts => now - ts < duration);

        if (seInfo.playTimestamps.length >= seInfo.maxInstances) {
            const lastPlay = seInfo.playTimestamps[seInfo.playTimestamps.length - 1];
            if (now - lastPlay < seInfo.throttleInterval) {
                return;
            }
        }
    }

    // --- ★★★ Web Audio APIを直接使った再生処理 ★★★ ---
    try {
        // 1. プリロード済みの音声データ本体(AudioBuffer)を取得
        const audioBuffer = p5Sound.buffer;

        // 2. 新しい再生ソース(AudioBufferSourceNode)を作成
        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;

        // 3. 音量を制御するためのGainNodeを作成
        const gainNode = audioContext.createGain();
        gainNode.gain.value = (seInfo.volume || 1.0) * sfxVolume;

        // 4. 回路を接続: source -> gain -> p5のマスター出力
        sourceNode.connect(gainNode);
        gainNode.connect(p5.soundOut.input); // p5.soundのマスター出力に接続

        // 5. 再生を開始
        sourceNode.start();

        // 6. 再生履歴を記録
        if (seInfo.playTimestamps) {
            seInfo.playTimestamps.push(now);
        }

    } catch (err) {
        console.error(`Error playing SE "${id}" with Web Audio API:`, err);
        // エラー発生時は従来のp5.sound.play()にフォールバックする
        p5Sound.setVolume(seInfo.volume * sfxVolume);
        p5Sound.play();
    }
}

function setSfxVolume(volume) {
    sfxVolume = constrain(volume / 100, 0, 1);
    console.log(`SFX master volume set to: ${sfxVolume.toFixed(2)}`);
}

function setBgmVolume(volume) {
    bgmVolume = constrain(volume / 100, 0, 1);
    if (currentBGM && currentBgmId !== null) { // currentBgmIdもチェック
        const bgmInfo = bgmData[currentBgmId];
        if (bgmInfo && currentBGM.isPlaying()) { // isPlayingもチェック
            currentBGM.setVolume(bgmInfo.volume * bgmVolume);
        }
    }
    console.log(`BGM master volume set to: ${bgmVolume.toFixed(2)}`);
}

// ★★★ 音量調整用のヘルパー関数を追加 ★★★
function adjustCurrentBgmVolume(volumeFactor) {
    if (currentBGM && currentBgmId !== null) {
        const bgmInfo = bgmData[currentBgmId];
        if (bgmInfo && currentBGM.isPlaying()) { // isPlayingもチェック
            currentBGM.setVolume(bgmInfo.volume * bgmVolume * volumeFactor);
            console.log(`Adjusted BGM ${currentBgmId} volume with factor ${volumeFactor}`);
        } else if (bgmInfo && !currentBGM.isPlaying() && volumeFactor > 0) {
            // 音量が0にされていたが、再度音量を与える場合は再生状態も確認する必要がある
            // ここでは音量調整のみに留める。再生状態の管理はsetGameState側で行う。
             console.log(`BGM ${currentBgmId} is not playing, volume factor ${volumeFactor} applied to base.`);
        }
    }
}

function restoreCurrentBgmVolume() {
     if (currentBGM && currentBgmId !== null) {
        const bgmInfo = bgmData[currentBgmId];
        if (bgmInfo) { // isPlayingチェックはここでは不要、単純に元の音量に戻す
            currentBGM.setVolume(bgmInfo.volume * bgmVolume);
            console.log(`Restored BGM ${currentBgmId} volume`);
        }
    }
}
// ★★★ 音量調整ヘルパー関数ここまで ★★★

// --- ◆◆◆ 音声関連ここまで ◆◆◆ ---


// --- 既存のportrait.jsの画像関連グローバル変数 ---
let characterImages = {}; 
let titleBackgroundImage;
let portraitBuffer;
let logoImage;

function setupPortrait() { //
    portraitBuffer = createGraphics(320, 720); //
    console.log('Portrait buffer initialized: 320x720'); //

    const sfxSlider = document.getElementById('sfxVolume'); //
    const bgmSlider = document.getElementById('bgmVolume'); //

    if (sfxSlider) { //
        sfxSlider.value = sfxVolume * 100; //
        sfxSlider.addEventListener('input', (event) => { //
            setSfxVolume(parseFloat(event.target.value)); //
        });
    }
    if (bgmSlider) { //
        bgmSlider.value = bgmVolume * 100; //
        bgmSlider.addEventListener('input', (event) => { //
            setBgmVolume(parseFloat(event.target.value)); //
        });
    }
}

function preload() { //
    console.log("--- portrait.js: preload() START ---");
    try {
        // --- 基本画像のプリロード ---
        logoImage = loadImage('assets/images/logo.png', () => {}, () => {});
        titleBackgroundImage = loadImage('assets/images/title.png', () => {}, () => {});

        // --- 照準画像のプリロード ---
        // ★★★ カーソル画像のプリロード処理を修正 ★★★
        aimingCursorImage = loadImage('assets/images/aiming.png', 
            () => console.log('Loaded aiming cursor image.'),
            () => console.error('Failed to load aiming cursor image.')
        );
        uiCursorImage = loadImage('assets/images/ui_cursor.png', 
            () => console.log('Loaded UI cursor image.'),
            () => console.error('Failed to load UI cursor image.')
        );
        // --- プレイアブルキャラクターのポートレイト画像（複数状態）を読み込み ---
        const portraitTypes = ['high', 'mid', 'low', 'dead', 'background'];
        PLAYABLE_CHARACTERS.forEach(charName => {
            characterImages[charName] = {};
            portraitTypes.forEach(type => {
                const path = `assets/images/portraits/${charName.toLowerCase()}_${type}.png`;
                characterImages[charName][type] = loadImage(path,
                    () => console.log(`Loaded portrait: ${path}`),
                    () => console.warn(`Portrait not found: ${path}`) // 失敗してもエラーにしない
                );
            });
        });

        // ★★★ カットイン用アセットのプリロード処理を追加 ★★★
        const frameTypes = ['ru', 'rd', 'lu', 'ld'];
        frameTypes.forEach(type => {
            // ファイル名を 'cutin-ru.png' など正しいものに修正
            const path = `assets/images/cutin-${type}.png`;
            cutinFrames[type] = loadImage(path,
                () => console.log(`Loaded cut-in frame: ${path}`),
                () => console.error(`Failed to load cut-in frame: ${path}`)
            );
        });

        const faceTypes = ['renate01','snowgirl01','snowgirl02'];
        faceTypes.forEach(type => {
            // ファイル名を 'cutinface-renate01.png' に合わせる
            const path = `assets/images/cutinface-${type}.png`;
            cutinFaces[type] = loadImage(path,
                () => console.log(`Loaded cut-in face: ${path}`),
                () => console.error(`Failed to load cut-in face: ${path}`)
            );
        });

        // ★★★ シナリオ専用キャラクターのポートレイト画像（単一）を読み込み ★★★
        SCENARIO_CHARACTERS.forEach(charName => {
            characterImages[charName] = {}; // キャラクター用のオブジェクトを作成
            const path = `assets/images/portraits/${charName.toLowerCase()}.png`;
            // 'portrait'というキーで単一の画像を保存する
            characterImages[charName]['portrait'] = loadImage(path,
                () => console.log(`Loaded scenario character portrait: ${path}`),
                () => console.error(`Failed to load scenario character portrait: ${path}`)
            );
        });

        // --- プレイアブルキャラクターのスプライトシートのみを読み込み ---
        PLAYABLE_CHARACTERS.forEach(charName => {
            const spritePath = `assets/images/${charName.toLowerCase()}.png`;
            spriteSheets[charName] = loadImage(spritePath,
                (img) => {
                    frameCounts[charName] = floor(img.width / 48) || 1;
                    // ★★★ 同様にピクセル情報を読み込んでおく ★★★
                    img.loadPixels();
                    console.log(`Loaded and cached pixels for PLAYABLE character sprite: ${spritePath}`);
                },
                () => console.error(`Failed to load PLAYABLE character sprite: ${spritePath}`)
            );
        });

        // --- ビット用スプライトシートのプリロード ---
        spriteSheets['roundBit'] = loadImage('assets/images/roundbit.png',
            img => { frameCounts['roundBit'] = floor(img.width / 48) || 1; },
            () => { console.error('Failed to load roundBitSprite.'); }
        );
        spriteSheets['shootBit'] = loadImage('assets/images/shootbit.png',
            img => { frameCounts['shootBit'] = floor(img.width / 48) || 1; },
            () => { console.error('Failed to load shootBitSprite.'); }
        );

        // --- ユニットスプライトシートのプリロード ---
        ['A', 'B', 'C', 'D','E','F','G','H', 'Z', 'Y','Y_defeat','Y_succubus', 'X', 'KNIGHT','ALLY_GUARD'].forEach(type => {
                        const path = `assets/images/unit_${type}.png`;
            spriteSheets[`unit_${type}`] = loadImage(path,
                (img) => {
                    frameCounts[`unit_${type}`] = floor(img.width / 48) || 1;
                    // ★★★ 画像ロード完了時に、一度だけピクセル情報を読み込む ★★★
                    img.loadPixels();
                    console.log(`Loaded and cached pixels for ${path}`);
                },
                () => { console.error(`Failed to load unit_${type} sprite.`); }
            );
        });
        // --- マップ背景画像のプリロード ---
        for (const key in mapBackgrounds) {
            if (mapBackgrounds.hasOwnProperty(key)) {
                const bgInfo = mapBackgrounds[key];
                bgInfo.p5Image = loadImage(
                    bgInfo.path,
                    () => console.log(`Loaded map background: ${bgInfo.path}`),
                    (err) => console.error(`Failed to load map background: ${bgInfo.path}`, err)
                );
            }
        }
        // --- 音声ファイルのプリロード ---
        for (const id in bgmData) {
            if (bgmData.hasOwnProperty(id)) {
                bgmData[id].p5Sound = loadSound(bgmData[id].path, () => {}, err => console.error(`Error loading BGM: ${bgmData[id].path}`, err));
            }
        }
        for (const id in seData) {
            if (seData.hasOwnProperty(id)) {
                seData[id].p5Sound = loadSound(seData[id].path, () => {}, err => console.error(`Error loading SE: ${seData[id].path}`, err));
            }
        }

    } catch (e) {
        console.error('アセットの読み込み中にエラーが発生しました:', e);
    }
    console.log("--- portrait.js: preload() END ---");
}
function drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats) {
    if (gameState === 'recall' && !isScenarioPlaying) { return; }
    
    // 立ち絵の背景バッファをクリア
    portraitBuffer.background(0);

    let char = gameState === 'characterSelect'||'characterSelect_fr' ? previewCharacter : selectedCharacter;
    if (!char || !characterImages[char]) return;

    // --- 1. 表示すべきポートレイトを決定 ---
    let targetPortrait;
    if (gameState !== 'characterSelect' ||'characterSelect_fr'&& playerStats) {
        switch (playerStats.portraitStatusLevel) {
            case 0: targetPortrait = characterImages[char].dead; break;
            case 1: targetPortrait = characterImages[char].low; break;
            case 2: targetPortrait = characterImages[char].mid; break;
            default: targetPortrait = characterImages[char].high; break;
        }
    } else {
        targetPortrait = characterImages[char].high;
    }

    // --- 2. ポートレイトの変更を検知し、演出を管理 ---
    if (targetPortrait && targetPortrait !== currentUiPortrait) {
        if (currentUiPortrait !== null) {
            portraitChangeEffect.active = true;
            portraitChangeEffect.startTime = millis();
            portraitChangeEffect.newPortrait = targetPortrait;
        }
        currentUiPortrait = targetPortrait;
    }

    // --- 3. 描画処理 ---
    // a. 背景を描画
    if (characterImages[char].background) {
        drawImageClipped(portraitBuffer, characterImages[char].background);
    }
    
    // b. 現在の（または変更前の）ポートレイトを描画
    if (currentUiPortrait) {
        drawImageClipped(portraitBuffer, currentUiPortrait);
    }

    // c. 変更演出がアクティブな場合の処理
    if (portraitChangeEffect.active) {
        const DURATION = 600;
        const FADE_START_RATIO = 0.5;
        const elapsed = millis() - portraitChangeEffect.startTime;
        const progress = constrain(elapsed / DURATION, 0, 1);
        
        push();
        tint(255, 255, 255, 255); 
        drawImageClipped(portraitBuffer, portraitChangeEffect.newPortrait);
        pop();

        if (progress > FADE_START_RATIO) {
            const fadeInProgress = map(progress, FADE_START_RATIO, 1, 0, 255);
            push();
            tint(255, fadeInProgress);
            drawImageClipped(portraitBuffer, portraitChangeEffect.newPortrait);
            pop();
        }

        if (progress >= 1) {
            portraitChangeEffect.active = false;
        }
    }

    // ★★★ ここからが修正箇所 ★★★
    // d. HP減少時の白フラッシュ演出
    if (portraitFlashActive) {
        const flashDuration = 250; // フラッシュの時間（0.25秒）
        const elapsedFlash = millis() - portraitFlashStart;
        
        if (elapsedFlash < flashDuration) {
            // 時間経過で透明になっていくアルファ値
            const flashAlpha = map(elapsedFlash, 0, flashDuration, 200, 0);
            portraitBuffer.noStroke();
            portraitBuffer.fill(255, 255, 255, flashAlpha);
            // portraitBuffer全体を覆う
            portraitBuffer.rect(0, 0, portraitBuffer.width, portraitBuffer.height);
        } else {
            portraitFlashActive = false; // 演出終了
        }
    }
    // ★★★ 修正ここまで ★★★
    
    // 最終的な立ち絵バッファをメインキャンバスに描画
    image(portraitBuffer, 960, 0);
}
function drawImageClipped(ctx, img) { //
    if (!img || !img.width || !img.height) return; //
    let imgWidth = img.width; let imgHeight = img.height; //
    let scale = Math.max(320 / imgWidth, 720 / imgHeight); //
    let scaledWidth = imgWidth * scale; let scaledHeight = imgHeight * scale; //
    let srcX = (imgWidth - 320 / scale) / 2; let srcWidth = 320 / scale; //
    let srcY = 0; let srcHeight = imgHeight; //
    let destX = 0; let destY = (720 - scaledHeight) / 2; //
    let destWidth = 320; let destHeight = scaledHeight; //
    if (scaledWidth < 320) { srcX = 0; srcWidth = imgWidth; destX = (320 - scaledWidth) / 2; destWidth = scaledWidth; } //
    ctx.image(img, destX, destY, destWidth, destHeight, srcX, srcY, srcWidth, srcHeight); //
}