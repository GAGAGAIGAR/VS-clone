// portrait.js

// --- ◆◆◆ここから元sounds.jsの内容を統合 ◆◆◆ ---

// --- 音声関連 グローバル変数 ---
let sfxVolume = 0.5; // 効果音のマスターボリューム (0.0 to 1.0)
let bgmVolume = 0.5; // BGMのマスターボリューム (0.0 to 1.0)
let currentBGM = null; // 現在再生中のBGMオブジェクトを保持

// --- 音声ファイルデータの定義 ---
const bgmData = { //
    1: { path: 'assets/BGM/tkt_srpg_no02_title.ogg', volume: 0.8, loop: true, p5Sound: null }, //
    2: { path: 'assets/BGM/maou_game_battle36.ogg', volume: 0.8, loop: true, p5Sound: null }, //
    3: { path: 'assets/BGM/maou_game_boss06.ogg', volume: 0.8, loop: true, p5Sound: null }, //
    4: { path: 'assets/BGM/tkt_srpg_no36_win1.ogg', volume: 0.8, loop: true, p5Sound: null } //
};

const seData = { //
    1: { path: 'assets/se/maou_se_onepoint12.ogg', volume: 1.0, p5Sound: null } //
};

// --- p5.sound を使った音声ファイルのプリロードと制御関数 ---
function preloadSounds() { //
    // BGMのプリロード
    for (const id in bgmData) { //
        if (bgmData.hasOwnProperty(id)) { //
            const bgm = bgmData[id]; //
            if (bgm.path) { //
                bgm.p5Sound = loadSound(bgm.path, //
                    () => { console.log(`BGM loaded: ${bgm.path}`); }, //
                    (err) => { console.error(`Error loading BGM: ${bgm.path}`, err); } //
                );
            }
        }
    }

    // SEのプリロード
    for (const id in seData) { //
        if (seData.hasOwnProperty(id)) { //
            const se = seData[id]; //
            if (se.path) { //
                se.p5Sound = loadSound(se.path, //
                    () => { console.log(`SE loaded: ${se.path}`); }, //
                    (err) => { console.error(`Error loading SE: ${se.path}`, err); } //
                );
            }
        }
    }
}

function playBGM(id) { //
    if (currentBGM && currentBGM.isPlaying()) { //
        currentBGM.stop(); //
    }

    const bgmInfo = bgmData[id]; //
    if (bgmInfo && bgmInfo.p5Sound) { //
        currentBGM = bgmInfo.p5Sound; //
        currentBGM.setVolume(bgmInfo.volume * bgmVolume); //
        if (bgmInfo.loop) { //
            currentBGM.loop(); //
        } else {
            currentBGM.play(); //
        }
        console.log(`Playing BGM: ${id} (${bgmInfo.path})`); //
    } else {
        console.warn(`BGM with id "${id}" not found or not loaded.`); //
    }
}

function stopBGM() { //
    if (currentBGM && currentBGM.isPlaying()) { //
        currentBGM.stop(); //
        currentBGM = null; //
        console.log("BGM stopped."); //
    }
}

function playSE(id) { //
    const seInfo = seData[id]; //
    if (seInfo && seInfo.p5Sound) { //
        seInfo.p5Sound.setVolume(seInfo.volume * sfxVolume); //
        seInfo.p5Sound.play(); //
    } else {
        console.warn(`SE with id "${id}" not found or not loaded.`); //
    }
}

function setSfxVolume(volume) { //
    sfxVolume = constrain(volume / 100, 0, 1); //
    console.log(`SFX master volume set to: ${sfxVolume.toFixed(2)}`); //
}

function setBgmVolume(volume) { //
    bgmVolume = constrain(volume / 100, 0, 1); //
    if (currentBGM && currentBGM.isPlaying()) { //
        const bgmInfo = Object.values(bgmData).find(b => b.p5Sound === currentBGM); //
        if (bgmInfo) { //
            currentBGM.setVolume(bgmInfo.volume * bgmVolume); //
        }
    }
    console.log(`BGM master volume set to: ${bgmVolume.toFixed(2)}`); //
}

// --- ◆◆◆ ここまで元sounds.jsの内容を統合 ◆◆◆ ---


// --- 既存のportrait.jsの画像関連グローバル変数 ---
let characterImages = { //
    'ANNA': { high: null, mid: null, low: null, dead: null, background: null }, //
    'TRACY': { high: null, mid: null, low: null, dead: null, background: null }, //
    'URANUS': { high: null, mid: null, low: null, dead: null, background: null } //
};

let portraitBuffer; //

function setupPortrait() { //
    portraitBuffer = createGraphics(320, 720); //
    console.log('Portrait buffer initialized: 320x720'); //

    // --- HTML側からのボリューム変更を受け取る処理を setupPortrait に移動 ---
    // DOMContentLoaded は p5.js の setup よりも早く発火する可能性があるため、
    // p5.js の要素や準備が整っている setup 関数内でリスナーを登録する方が安全な場合がある。
    // ただし、スライダー要素自体はDOMなので、DOMContentLoadedでも基本は問題ない。
    // ここでは、他の初期化とまとめて setupPortrait に含める。
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
    try {
        // --- キャラクター画像のプリロード ---
        characterImages['ANNA'].high = loadImage('assets/images/anna_high.png', () => console.log('ANNA high loaded'), () => console.error('Failed to load ANNA high')); //
        characterImages['ANNA'].mid = loadImage('assets/images/anna_mid.png', () => console.log('ANNA mid loaded'), () => console.error('Failed to load ANNA mid')); //
        characterImages['ANNA'].low = loadImage('assets/images/anna_low.png', () => console.log('ANNA low loaded'), () => console.error('Failed to load ANNA low')); //
        characterImages['ANNA'].dead = loadImage('assets/images/anna_dead.png', () => console.log('ANNA dead loaded'), () => console.error('Failed to load ANNA dead')); //
        characterImages['ANNA'].background = loadImage('assets/images/anna_background.png', () => console.log('ANNA background loaded'), () => console.error('Failed to load ANNA background')); //
        // ... (TRACY, URANUS の画像ロードも同様) ...
        characterImages['TRACY'].high = loadImage('assets/images/tracy_high.png', () => console.log('TRACY high loaded'), () => console.error('Failed to load TRACY high')); //
        characterImages['TRACY'].mid = loadImage('assets/images/tracy_mid.png', () => console.log('TRACY mid loaded'), () => console.error('Failed to load TRACY mid')); //
        characterImages['TRACY'].low = loadImage('assets/images/tracy_low.png', () => console.log('TRACY low loaded'), () => console.error('Failed to load TRACY low')); //
        characterImages['TRACY'].dead = loadImage('assets/images/tracy_dead.png', () => console.log('TRACY dead loaded'), () => console.error('Failed to load TRACY dead')); //
        characterImages['TRACY'].background = loadImage('assets/images/tracy_background.png', () => console.log('TRACY background loaded'), () => console.error('Failed to load TRACY background')); //
        characterImages['URANUS'].high = loadImage('assets/images/uranus_high.png', () => console.log('URANUS high loaded'), () => console.error('Failed to load URANUS high')); //
        characterImages['URANUS'].mid = loadImage('assets/images/uranus_mid.png', () => console.log('URANUS mid loaded'), () => console.error('Failed to load URANUS mid')); //
        characterImages['URANUS'].low = loadImage('assets/images/uranus_low.png', () => console.log('URANUS low loaded'), () => console.error('Failed to load URANUS low')); //
        characterImages['URANUS'].dead = loadImage('assets/images/uranus_dead.png', () => console.log('URANUS dead loaded'), () => console.error('Failed to load URANUS dead')); //
        characterImages['URANUS'].background = loadImage('assets/images/uranus_background.png', () => console.log('URANUS background loaded'), () => console.error('Failed to load URANUS background')); //


        // --- ビット用スプライトシートのプリロード ---
        spriteSheets['roundBit'] = loadImage('assets/images/roundbit.png', //
            (img) => {
                console.log('roundBitSprite (spriteSheets["roundBit"]) loaded successfully.'); //
                frameCounts['roundBit'] = floor(img.width / 48) || 1; //
            },
            () => { console.error('Failed to load roundBitSprite.'); spriteSheets['roundBit'] = null; frameCounts['roundBit'] = 1;} //
        );
        spriteSheets['shootBit'] = loadImage('assets/images/shootbit.png', //
            (img) => {
                console.log('shootBitSprite (spriteSheets["shootBit"]) loaded successfully.'); //
                frameCounts['shootBit'] = floor(img.width / 48) || 1; //
            },
            () => { console.error('Failed to load shootBitSprite.'); spriteSheets['shootBit'] = null; frameCounts['shootBit'] = 1; } //
        );

        // --- ユニットスプライトシートのプリロード ---
        ['A', 'B', 'C', 'D', 'Z', 'Y', 'X'].forEach(type => { //
            spriteSheets[`unit_${type}`] = loadImage(`assets/images/unit_${type}.png`, //
                img => { frameCounts[`unit_${type}`] = floor(img.width / 48) || 1; console.log(`Unit ${type} sprite loaded.`); }, //
                () => { console.error(`Failed to load unit_${type} sprite.`); spriteSheets[`unit_${type}`] = null; frameCounts[`unit_${type}`] = 1; } //
            );
        });

        // --- プレイヤースプライトシートのプリロード ---
        ['ANNA', 'TRACY'].forEach(char => { //
            spriteSheets[char] = loadImage(`assets/images/${char.toLowerCase()}.png`, //
                img => { frameCounts[char] = floor(img.width / 48) || 1; console.log(`${char} sprite loaded.`); }, //
                () => console.error(`Failed to load ${char} sprite sheet`) //
            );
        });

        // --- 音声ファイルのプリロード処理 ---
        console.log("Calling preloadSounds() from portrait.js preload()."); //
        preloadSounds(); // ここで統合された preloadSounds を呼び出す
        console.log("Calling preloadSounds() from portrait.js preload().");
        if (typeof preloadSounds === 'function') {
            preloadSounds();
        } else {
            console.error("preloadSounds function is not defined in portrait.js!");
        }
    } catch (e) {
        console.error('アセットの読み込み中にエラーが発生しました:', e); //
    }
}

// --- 既存のportrait.jsの描画関数 ---
function drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats) { //
    if (gameState === 'recall' && !isScenarioPlaying) { return; } //
    portraitBuffer.background(0); //
    let char = gameState === 'characterSelect' ? previewCharacter : selectedCharacter; //
    if (!char || !characterImages[char]) return; //

    let bg = characterImages[char].background; //
    let portrait; //
    let maxHp = playerStats.maxHp || playerStats.hp || 100; //
    if (gameState !== 'characterSelect') { //
        if (playerStats.hp <= 0) { portrait = characterImages[char].dead; } //
        else if (playerStats.hp < maxHp * 0.3) { portrait = characterImages[char].low; } //
        else if (playerStats.hp < maxHp * 0.6) { portrait = characterImages[char].mid; } //
        else { portrait = characterImages[char].high; } //
    } else {
        portrait = characterImages[char].high; //
    }

    if (bg) { drawImageClipped(portraitBuffer, bg); } //
    if (portrait) { drawImageClipped(portraitBuffer, portrait); } //

    portraitBuffer.fill(255); //
    portraitBuffer.textSize(24); //
    portraitBuffer.textAlign(LEFT, TOP); //
    portraitBuffer.text(char, 10, 10); //
    if (gameState !== 'characterSelect') { //
        portraitBuffer.text(`HP: ${Math.floor(playerStats.hp)}/${maxHp}`, 10, 40); //
    }
    image(portraitBuffer, 960, 0); //
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