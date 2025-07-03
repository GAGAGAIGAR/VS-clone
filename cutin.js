
/**
 * カットイン演出を開始する
 * @param {string} command - "frameType:faceKey:endEffect" 形式のコマンド
 * @param {object} subtitle - 科白とスタイル情報を含むオブジェクト
 */
function startCutin(command, subtitle) {
    if (!command) return;

    const parts = command.split(':');
    if (parts.length < 2) return;

    let frameType = parts[0];
    const faceKey = parts[1];
    const endEffect = parts[2] || 'fade';

    if (frameType === 'random') {
        frameType = random(['ru', 'rd', 'lu', 'ld']);
    }

    // 新しいカットインオブジェクトを作成して管理配列に追加
    activeCutins.push({
        id: millis(),
        frameKey: frameType,
        faceKey: faceKey,
        endEffect: endEffect,
        startTime: millis(),
        duration: 3000,
        state: 'appearing',
        progress: 0,
        // ★ 科白情報をオブジェクトに格納
        speech: subtitle?.text || null,
        speechColor: subtitle?.color || '#FFFFFF',
        speechFontSize: subtitle?.fontSize || 24,
        speechFont: subtitle?.fontType || 'sans-serif'
    });
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
/**
 * 全てのカットインの状態を更新し、描画する
 */
function updateAndDrawCutins() {
    if (activeCutins.length === 0) return;

    // カットインはゲーム画面の上に描画するため、独自の座標系を持つ
    resetMatrix();
    scale(globalScale);

    // 複数のカットインを逆順で処理（安全な削除のため）
    for (let i = activeCutins.length - 1; i >= 0; i--) {
        const cutin = activeCutins[i];
        const elapsed = millis() - cutin.startTime;

        // --- 状態管理 ---
        const FADE_IN_DURATION = 300;
        const FADE_OUT_DURATION = 400;
        const HOLD_DURATION = cutin.duration - FADE_IN_DURATION - FADE_OUT_DURATION;

        if (elapsed < FADE_IN_DURATION) {
            cutin.state = 'appearing';
            cutin.progress = elapsed / FADE_IN_DURATION;
        } else if (elapsed < FADE_IN_DURATION + HOLD_DURATION) {
            cutin.state = 'holding';
            cutin.progress = 1;
        } else if (elapsed < cutin.duration) {
            cutin.state = 'ending';
            cutin.progress = (elapsed - (FADE_IN_DURATION + HOLD_DURATION)) / FADE_OUT_DURATION;
        } else {
            // 表示時間が終わったら配列から削除
            activeCutins.splice(i, 1);
            continue;
        }

        // --- 描画処理 ---
        drawSingleCutin(cutin);
    }
}
/**
 * 1つのカットインを描画するヘルパー関数（画像サイズ計算を修正）
 * @param {object} cutin - 描画対象のカットインオブジェクト
 */
function drawSingleCutin(cutin) {
    const frameImg = cutinFrames[cutin.frameKey];
    const faceImg = cutinFaces[cutin.faceKey];
    
    if (!frameImg || !faceImg || frameImg.width === 0 || faceImg.height === 0) {
        return; 
    }

    // ★★★ ここからが修正箇所 ★★★
    // --- 1. フレーム画像と顔画像を、それぞれ独立してリサイズ計算 ---
    const MAX_SIZE = 256;

    // a. フレーム画像のリサイズ計算
    let frameW = frameImg.width;
    let frameH = frameImg.height;
    if (frameW > MAX_SIZE || frameH > MAX_SIZE) {
        const frameScaleRatio = min(MAX_SIZE / frameW, MAX_SIZE / frameH);
        frameW *= frameScaleRatio;
        frameH *= frameScaleRatio;
    }

    // b. 顔画像のリサイズ計算
    let faceW = faceImg.width;
    let faceH = faceImg.height;
    if (faceW > MAX_SIZE || faceH > MAX_SIZE) {
        const faceScaleRatio = min(MAX_SIZE / faceW, MAX_SIZE / faceH);
        faceW *= faceScaleRatio;
        faceH *= faceScaleRatio;
    }
    // ★★★ 修正ここまで ★★★

    // --- 2. 座標計算（リサイズ後のフレームサイズを基準にする） ---
    const GAME_WIDTH = 960;
    const GAME_HEIGHT = 720;
    let x = 0, y = 0;
    
    switch (cutin.frameKey) {
        case 'ru': x = GAME_WIDTH - frameW; y = 0; break;
        case 'rd': x = GAME_WIDTH - frameW; y = GAME_HEIGHT - frameH; break;
        case 'lu': x = 0; y = 0; break;
        case 'ld': x = 0; y = GAME_HEIGHT - frameH; break;
    }

    // --- 3. アニメーションのアルファ値計算（変更なし） ---
    let alpha = 0;
    const easedProgress = typeof easeInOutCubic === 'function' ? easeInOutCubic(cutin.progress) : cutin.progress;

    if (cutin.state === 'appearing') {
        alpha = easedProgress * 255;
    } else if (cutin.state === 'holding') {
        alpha = 255;
    } else if (cutin.state === 'ending') {
        if (cutin.endEffect !== 'flashend') {
            alpha = (1 - easedProgress) * 255;
        } else {
            alpha = 255;
        }
    }
    
    // --- 4. 顔画像をフレームの中央に配置するための座標を計算 ---
    const faceX = x + (frameW / 2) - (faceW / 2);
    const faceY = y + (frameH / 2) - (faceH / 2);


    // --- 5. 描画処理 ---
    push();
    
    tint(255, alpha);

    image(frameImg, x, y, frameW, frameH);
    image(faceImg, faceX, faceY, faceW, faceH);
    
    if (cutin.state === 'ending' && cutin.endEffect === 'flashend') {
        const flashAlpha = easedProgress * 255;
        blendMode(ADD);
        tint(255, flashAlpha);
        image(frameImg, x, y, frameW, frameH);
        image(faceImg, faceX, faceY, faceW, faceH);
        blendMode(BLEND);
    }
    if (cutin.speech && cutin.state === 'holding') { // 表示中（holding）の状態でのみ字幕を表示
        noTint(); // tintの影響を解除
        const subtitleBoxY = 600;
        const subtitleBoxH = 100;
        
        // 字幕の背景
        fill(0, 0, 0, 180);
        noStroke();
        rect(0, subtitleBoxY, 1280, subtitleBoxH);
        
        // 字幕テキスト
        fill(cutin.speechColor);
        textSize(cutin.speechFontSize);
        textFont(cutin.speechFont);
        textAlign(CENTER, CENTER);
        text(cutin.speech, 1280 / 2, subtitleBoxY + subtitleBoxH / 2);
    }
    // ★★★ 修正ここまで ★★★

    pop();
}