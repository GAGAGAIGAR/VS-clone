let pauseHoverIndex = 0;
let showBacklog = false;
let scenarioStarted = false; // この変数は isScenarioPlaying() や scenario.js での管理が望ましい
let recallHoverIndex = -1;  // 初期値 -1 (未選択)
let recallScenarios = [];   // scenario.js でデータがロードされる
let titleHoverIndex = 0;    // 初期値 0
let characterSelectHoverIndex = 0;
// ★★★ 1. フロントラインモードのロック状態を管理する変数を追加 ★★★
let isFrontlineLocked = false; // trueでロック、falseで解除
let stageSelectHoverIndex = 0; // ★ ステージ選択画面用のホバーインデックスを追加


const titleButtons = [
    { text: 'スタート', action: () => { stageSelectMode = 'campaign'; setGameState('stageSelect'); }, y: 300, locked: false },
    { text: 'フロントライン', action: () => { stageSelectMode = 'frontline'; setGameState('stageSelect'); }, y: 380, isLocked: () => isFrontlineLocked },
    { text: '回想', action: () => setGameState('recall'), y: 460, locked: false },
    { text: 'オプション', action: () => setGameState('options'), y: 540, locked: false },
    { text: '地形編集', action: () => { setGameState('editorMapSelect'); }, y: 460, locked: false }, // ★ 追加
    { text: 'ゲーム終了', action: () => { if(window.electronAPI) window.electronAPI.quitGame(); }, y: 620, locked: false }
];

const pauseChoices = [
    { name: 'ゲームに戻る', action: () => setGameState('playing') },
    { name: 'タイトルに戻る', action: () => backToTitle() },
    { name: '自爆', 
        action: () => {
            if (selectedCharacter && playerStats) {
                playerStats.isSuiciding = true;
                playerStats.suicideTicks = 1;
                playerStats.lastSuicideTick = millis();
                setGameState('playing');
            }
        }
    },
    { name: 'ゲーム終了', action: () => { if(window.electronAPI) window.electronAPI.quitGame(); } } 
];

// ★★★ ロゴ画面描画関数を追加 ★★★
function drawLogoScreen() {
    // --- 演出のタイミングを定義 (ミリ秒) ---
    const FADE_IN_DURATION = 1000;  // 1.0秒
    const HOLD_DURATION = 500;      // 0.5秒
    const FADE_OUT_DURATION = 500;  // 0.5秒
    
    const FADE_IN_END = FADE_IN_DURATION;
    const HOLD_END = FADE_IN_END + HOLD_DURATION;
    const FADE_OUT_END = HOLD_END + FADE_OUT_DURATION;

    // --- 描画処理 ---
    background(0);
    if (logoDisplayStartTime === 0) {
        logoDisplayStartTime = millis();
    }

    const elapsed = millis() - logoDisplayStartTime;
    let alpha = 0;

    // 経過時間に応じてアルファ値を計算
    if (elapsed < FADE_IN_END) {
        // フェードイン
        alpha = map(elapsed, 0, FADE_IN_END, 0, 255);
    } else if (elapsed < HOLD_END) {
        // 表示
        alpha = 255;
    } else if (elapsed < FADE_OUT_END){
        // フェードアウト
        alpha = map(elapsed, HOLD_END, FADE_OUT_END, 255, 0);
    }

    // ロゴ画像を描画
    if (logoImage && logoImage.width > 0) {
        push();
        tint(255, alpha); // 計算したアルファ値を適用
        imageMode(CENTER);
        image(logoImage, width / 2, height / 2);
        pop(); // tint設定を元に戻す
    } else {
        // 画像がない場合のフォールバック
        fill(255, alpha);
        textSize(32);
        textAlign(CENTER, CENTER);
        text("Developer Logo", width / 2, height / 2);
    }

    // 全ての演出時間が経過したらタイトル画面へ
    if (elapsed >= FADE_OUT_END) {
        logoDisplayStartTime = 0;
        setGameState('title');
    }
}

// ... (drawUI, drawTitle などの既存関数は変更なし) ...
function drawUI() {
    resetMatrix();

    scale(globalScale);

    noStroke();
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);

    let yPos = 20;
    text(`Stage: ${currentStage === 'fr' ? 'Frontline' : currentStage || 'N/A'}`, 10, yPos); yPos += 20;
    text(`Score: ${score || 0}`, 10, yPos); yPos += 20;
    text(`LevelUp: ${playerStats?.level || 'N/A'} Exp: ${playerStats?.exp || 0}/${playerStats?.expToNext || 'N/A'}`, 10, yPos); yPos += 20;
    text(`HP: ${playerStats?.hp || 'N/A'}`, 10, yPos); yPos += 20;

    // Map Size と Last Damage Unit をHPの下に表示
    let stageConfigForUI = getStageConfig(currentStage) || { mapSize: { width: 'N/A', height: 'N/A' } };
    if (debugLog && debugMode) {
        text(`Map Size: ${stageConfigForUI.mapSize.width}x${stageConfigForUI.mapSize.height}`, 10, yPos); yPos += 20;
    }
    text(`Last Damage Unit: ${playerStats?.lastDamageUnitType || 'None'}`, 10, yPos); yPos += 20;


    if (playerStats?.shieldActive) {
        text(`Shield: ${playerStats.shieldActive}`, 10, yPos); yPos += 20;
    }

    // クリアフラグ達成時の離脱ボタン表示
    if (stageClearConditionMet && (gameState === 'playing' || gameState === 'boss')) {
        fill(50, 200, 50, 200); // 半透明の緑背景
        rect(10, yPos, 100, 30, 5); // ボタン背景
        fill(255);
        textSize(16);
        textAlign(LEFT, TOP); // textAlignを戻すか、CENTER,CENTERでボタン内テキストを調整
        text("G: 離脱", 15, yPos + 7); // ボタン内テキスト
        yPos += 40; // ボタンの高さ + マージン
    }
    // --- デバッグ用に nextStageAvailable フラグの状態を表示 ---
    fill(0, 255, 255); // 目立つようにシアンで表示
    textSize(16);
    textAlign(LEFT, TOP);
    // 既存のUIと重ならないように、少し下の位置に描画
    text(`nextStageAvailable: ${nextStageAvailable}`, 10, yPos);
    yPos += 20;

    // 右上の情報表示
    textAlign(RIGHT, TOP);
    let topRightYPos = 20;

    // 制限時間の描画処理を追加
    if (stageConfigForUI.duration) {
      text(`Time: ${floor(gameTime) || 0}/${stageConfigForUI.duration}`, 1280 - 330, topRightYPos); topRightYPos += 20;
    }

    // 取得済みアップグレードの表示
    if (window.upgrades) {
        window.upgrades.forEach(ur => {
            if (ur.level > 0) {
                text(`${ur.name}: Lv${ur.level}`, 1280 - 330, topRightYPos);
                topRightYPos += 20;
            }
        });
    }
    
    if (isFpsTrackingEnabled()) {
        text(`FPS: ${currentFps.toFixed(1)}`, 1280 - 330, topRightYPos);
        topRightYPos += 20;
    }

    // AutoAim表示 (変更なし)
    textAlign(CENTER, CENTER); // AutoAimテキストのために再度設定
    fill(autoFire ? 100 : 50);
    rect(800, 660, 140, 40, 10);
    fill(255);
    textSize(16);
    text("Q: 自動照準", 870, 680);

    // 画面下部中央のRush情報 (変更なし)
    textAlign(CENTER, TOP); // Rush情報のために再度設定
    fill(255); // Rush情報の文字色
    text(`次のラッシュまで: ${rushThreshold - rushEnemiesKilled} 撃破`, 480, 710 - 40);
    text(`照準:WASD　マウス:照準　ポーズ:T`, 480, 730 - 40);
        if (isFpsTrackingEnabled() && lowFpsWarningStart !== null && millis() - lowFpsWarningStart < 5000) {
        noStroke();
        fill(255, 0, 0, 150);
        rect(0, 700, 960, 20);
    }
}

function drawTitle() {
    if (titleBackgroundImage && titleBackgroundImage.width > 0) {
        image(titleBackgroundImage, 0, 0, 1280, 720);
    } else {
        background(0, 0, 50);
    }

    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("STS (仮)", 640, 100);
    textSize(20);
    text("WASD/矢印キー: 選択, Space/Enter: 決定, T: 戻る", 640, 680);

    let hovered = false; // マウスホバーがあったかどうかのフラグ

    // 集約された`titleButtons`を使って描画とホバー判定を行う
    titleButtons.forEach((button, index) => {
        const isLocked = typeof button.isLocked === 'function' ? button.isLocked() : button.locked;
        const x = 490;
        const y = button.y - 30;
        const w = 300;
        const h = 60;

        const isHoveredByMouse = !isLocked && (mx >= x && mx <= x + w && my >= y && my <= y + h);

        if (isHoveredByMouse) {
            titleHoverIndex = index;
            hovered = true;
        }

        const isSelected = (index === titleHoverIndex);
        
        if (isSelected) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }
        
        fill(isSelected && !isLocked ? color(120, 120, 120, 200) : color(80, 80, 80, 200));
        rect(x, y, w, h, 20);

        fill(isLocked ? 100 : 255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(button.text, x + w / 2, y + h / 2);
    });

    if (!hovered && (mx !== pmouseX || my !== pmouseY)) {
        // マウスが動いたがどのボタンにも乗っていない場合、キー選択を解除しないようにする
        // (何もしない)
    }
}

function drawStageSelect() {
    background(0, 0, 50);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text(stageSelectMode === 'campaign' ? "ステージ選択" : "フロントラインミッション選択", 640, 60);
    textSize(20);
    text("W/S: 選択, Space/Enter: 決定, T: 戻る", 640, 680);

    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;

    // --- 表示するステージのリストを動的に作成 ---
    let availableStages = [];
    if (stageSelectMode === 'campaign') {
        // ★ 'stagesUnlocked' 配列に含まれるステージのみをフィルタリング
        availableStages = stageConfigs.filter(s => 
            typeof s.stage === 'number' && saveData.stagesUnlocked.includes(s.stage)
        );
    } else {
        // フロントラインモードは、今のところ全て表示（将来的にはこちらもフラグ管理可能）
        availableStages = stageConfigs.filter(s => typeof s.stage === 'string');
    }

    if (availableStages.length === 0) {
        fill(255);
        text("プレイ可能なステージがありません", 640, 360);
        return;
    }
    
    // ホバーインデックスがリストの範囲外なら補正
    if (stageSelectHoverIndex >= availableStages.length) {
        stageSelectHoverIndex = availableStages.length - 1;
    }

    // ボタンの描画とホバー判定
    availableStages.forEach((stageConf, index) => {
        const y = 200 + index * 100;
        const x = (1280 - 400) / 2;
        const w = 400;
        const h = 80;

        const isHoveredByMouse = (mx >= x && mx <= x + w && my >= y - h / 2 && my <= y + h / 2);
        if (isHoveredByMouse) {
            stageSelectHoverIndex = index;
        }
        
        const isSelected = (index === stageSelectHoverIndex);

        if (isSelected) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }

        fill(isSelected ? color(120, 120, 120, 200) : color(80, 80, 80, 200));
        rect(x, y - h / 2, w, h, 10);

        fill(255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(`Stage: ${stageConf.stage}`, x + w / 2, y);
    });
}


function drawCharacterSelect() {
    // --- 背景と基本テキスト ---
    background(0);
    fill(0, 0, 100, 200);
    noStroke();
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("SELECT SUCCUBUS", 640, 60);

    // --- 1. 選択肢リストを左側に描画 ---
    const characters = ['ANNA', 'TRACY', 'URANUS'];
    const listStartX = 80;
    const listStartY = 200;
    const mx = virtualCursorPos.x; // ★ 参照先を変更
    const my = virtualCursorPos.y; // ★ 参照先を変更

    for (let i = 0; i < characters.length; i++) {
        let y = listStartY + i * 100;
        let x = listStartX;
        let w = 280;
        let h = 80;

        if (mx >= x && mx <= x + w && my >= y - h / 2 && my <= y + h / 2) {
            characterSelectHoverIndex = i;
        }

        if (i === characterSelectHoverIndex) {
            stroke(255, 255, 0);
            strokeWeight(3);
            fill(120, 120, 120);
        } else {
            noStroke();
            fill(80, 80, 80);
        }
        rect(x, y - h / 2, w, h, 10);

        fill(255);
        noStroke();
        textSize(24);
        // ★ 項目名のテキスト揃えをここで指定
        textAlign(LEFT, CENTER); 
        text(characters[i], x + 20, y);
    }

    // --- 2. プロフィールを中央に表示 ---
    const profileBoxX = 400;
    const profileBoxY = 160;
    const profileBoxW = 520;
    const profileBoxH = 400;

    fill(0, 0, 0, 150);
    stroke(255, 255, 255, 100);
    strokeWeight(1);
    rect(profileBoxX, profileBoxY, profileBoxW, profileBoxH, 10);

    const hoveredCharName = characters[characterSelectHoverIndex];
    previewCharacter = hoveredCharName;
    const profileText = characterProfiles[hoveredCharName] || "プロフィール情報がありません。";

    // ★★★ プロフィール文章描画の直前に、描画設定を再指定 ★★★
    fill(255);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP); // ← この行が重要！
    
    const formattedProfile = profileText.replace(/<br>/g, '\n');
    text(formattedProfile, profileBoxX + 20, profileBoxY + 20, profileBoxW - 40, profileBoxH - 40);


    // --- 3. 操作ガイド ---
    textSize(20);
    textAlign(CENTER, CENTER); // 他の描画に影響しないよう、再度中央揃えに戻す
    text("W/S: 選択, Space/Enter: 決定, T: 戻る", 640, 680);
}

function drawCharacterSelect_fr() {
    background(0);
    fill(0, 0, 100, 200);
    noStroke();
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    // タイトルをフロントライン専用に変更
    text("フロントライン - キャラクターを選択", 640, 60);

    const characters = ['ANNA', 'TRACY', 'URANUS'];
    const listStartX = 80;
    const listStartY = 200;
    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;

    for (let i = 0; i < characters.length; i++) {
        let y = listStartY + i * 100;
        let x = listStartX;
        let w = 280;
        let h = 80;

        if (mx >= x && mx <= x + w && my >= y - h / 2 && my <= y + h / 2) {
            characterSelectHoverIndex = i;
        }

        if (i === characterSelectHoverIndex) {
            stroke(255, 255, 0);
            strokeWeight(3);
            fill(120, 120, 120);
        } else {
            noStroke();
            fill(80, 80, 80);
        }
        rect(x, y - h / 2, w, h, 10);

        fill(255);
        noStroke();
        textSize(24);
        textAlign(LEFT, CENTER); 
        text(characters[i], x + 20, y);
    }

    const profileBoxX = 400;
    const profileBoxY = 160;
    const profileBoxW = 520;
    const profileBoxH = 400;

    fill(0, 0, 0, 150);
    stroke(255, 255, 255, 100);
    strokeWeight(1);
    rect(profileBoxX, profileBoxY, profileBoxW, profileBoxH, 10);

    const hoveredCharName = characters[characterSelectHoverIndex];
    if (hoveredCharName) { // ホバーされたキャラがいる場合のみプレビューを更新
        previewCharacter = hoveredCharName;
    }
    const profileText = characterProfiles[previewCharacter] || "プロフィール情報がありません。";
    
    fill(255);
    noStroke();
    textSize(20);
    textAlign(LEFT, TOP);
    const formattedProfile = profileText.replace(/<br>/g, '\n');
    text(formattedProfile, profileBoxX + 20, profileBoxY + 20, profileBoxW - 40, profileBoxH - 40);

    textSize(20);
    textAlign(CENTER, CENTER);
    text("W/S: 選択, Space/Enter: 決定, T: 戻る", 640, 680);
}

function drawGameScene() {
    drawMap();
    drawPlayer();
    drawUnits();
    drawOtherEffects();
    drawBullets();
    drawUnitBullets();
    drawCharacterPortrait(gameState, selectedCharacter, previewCharacter, playerStats);
    drawUI();
}

function drawPaused() {
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, 960, 720);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("一時停止", 480, 200);
    textSize(20);
    // 操作案内を「ESC/P」から「T」に変更
    text("T: 再開, W/S: 選択, Space/Enter: 実行", 480, 600);

    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;

    for (let i = 0; i < pauseChoices.length; i++) {
        let x = 480;
        let y = 300 + i * 70;
        let w = 240;
        let h = 60;

        if (mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2) {
            pauseHoverIndex = i;
        }

        if (i === pauseHoverIndex) {
            fill(120, 120, 120, 220);
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            fill(80, 80, 80, 200);
            stroke(255);
            strokeWeight(2);
        }
        
        rect(x - w / 2, y - h / 2, w, h, 10);
        fill(255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(pauseChoices[i].name, x, y);
    }
}


function drawLevelUp() {
    // 背景とタイトルの描画
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, 960, 720);
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    text("レベルアップ！ 強化を選択:", 480, 100);

    // 1. 補正済みマウス座標を計算
    const mx = virtualCursorPos.x; // ★ 参照先を変更
    const my = virtualCursorPos.y; // ★ 参照先を変更

    // 説明文表示ボックスの描画
    const descriptionBoxX = 180;
    const descriptionBoxY = 160;
    const descriptionBoxW = 600;
    const descriptionBoxH = 120;
    fill(0, 0, 0, 150);
    stroke(255, 255, 255, 100);
    strokeWeight(1);
    rect(descriptionBoxX, descriptionBoxY, descriptionBoxW, descriptionBoxH, 10);

    // ホバー中のアップグレードの説明文を取得して描画
    if (levelUpHoverIndex !== -1 && levelUpChoices[levelUpHoverIndex]) {
        const hoveredUpgradeName = levelUpChoices[levelUpHoverIndex].name;
        const description = upgradeDescriptions[hoveredUpgradeName] || "";
        fill(255);
        noStroke();
        textSize(18);
        textAlign(LEFT, TOP);
        text(description, descriptionBoxX + 20, descriptionBoxY + 20, descriptionBoxW - 40, descriptionBoxH - 40);
    }
    
    // --- 選択肢ボタンの描画 ---
    if (!levelUpChoices || levelUpChoices.length === 0) return;
    const choices = levelUpChoices;
    const numChoices = choices.length;
    const boxWidth = 280;
    const boxHeight = 80;
    const spacing = 40;
    const totalWidth = (numChoices * boxWidth) + ((numChoices - 1) * spacing);
    let startX = (960 - totalWidth) / 2;
    const y = 420;

    for (let i = 0; i < numChoices; i++) {
        let x = startX + i * (boxWidth + spacing);
        
        // 2. マウスがボタンの範囲内にあるか判定し、ホバーインデックスを更新
        if (mx >= x && mx <= x + boxWidth && my >= y - boxHeight / 2 && my <= y + boxHeight / 2) {
            levelUpHoverIndex = i;
        }

        // 3. 既存の描画ロジックがマウスとキーボード両方のホバー状態を反映
        stroke(255);
        strokeWeight(2);
        if (i === levelUpHoverIndex) {
            fill(120, 120, 120, 220);
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            fill(80, 80, 80, 200);
        }
        rect(x, y - boxHeight / 2, boxWidth, boxHeight, 10);
        fill(255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(choices[i].name, x + boxWidth / 2, y);
    }

    // 操作ガイド
    textSize(18);
    textAlign(CENTER, BOTTOM);
    fill(255);
    noStroke();
    text("E: 選択, Space/Enter: 実行", 480, 700);
}


function drawGameOver() {
    const gameOverDiv = document.getElementById('gameOver');
    if (!gameOverDiv) {
        // DOM要素がない場合は常にCanvas描画のフォールバック
        fallbackGameOver();
        return;
    }

    // シナリオデータがロードされていない場合もフォールバック
    if (!scenarioData) {
        console.warn('Scenario data not loaded, showing fallback.');
        gameOverDiv.style.display = 'block';
        fallbackGameOver();
        return;
    }

    // isScenarioActive() は scenario.js で定義されている isScenarioPlaying の状態を返す
    if (isScenarioActive()) {
        // シナリオが再生中なら、DOM要素を隠してシナリオを描画
        gameOverDiv.style.display = 'none';
        updateScenario();
        drawScenario();
        if (showBacklog) drawBacklog();
    } else {
        // シナリオが再生中でない場合（＝シナリオ開始前、または終了後）
        
        // ★★★ 修正点 ★★★
        // 以前は scenarioStarted フラグに依存していましたが、これを廃止し、
        // isScenarioPlaying だけで判断する前の段階、つまりシナリオがまだ開始されていない場合に
        // 開始を試みるように変更します。
        // シナリオが終了して gameState が 'gameOver' に戻ってきた場合は、
        // この条件には入らず、下の fallbackGameOver が呼ばれます。
        
        // 最後にダメージを受けた敵の種類（species）を取得
        const species = playerStats?.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]
            ? unitTypes[playerStats.lastDamageUnitType].species || 'default'
            : 'default';
            
        // 対応するゲームオーバーシナリオの開始を試みる
        if (startScenario('gameOver', selectedCharacter, species)) {
            // シナリオ開始に成功した場合、このフレームでは何もしない（次のフレームからシナリオが描画される）
            gameOverDiv.style.display = 'none';
        } else {
            // 対応するシナリオが見つからなかった、または開始に失敗した場合は、フォールバックのゲームオーバー画面を表示
            console.error(`Failed to start any 'gameOver' scenario for ${selectedCharacter}.`);
            gameOverDiv.style.display = 'block'; // DOMのゲームオーバー画面を表示
            fallbackGameOver(); // Canvasにも描画
        }
    }
}


// ゲームオーバーシナリオがない、または失敗した場合に表示される画面
function fallbackGameOver() {
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, 960, 720);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("ゲームオーバー", 480, 200);
    textSize(24);
    text(`最終スコア: ${score || 0}`, 480, 260);
    
    textSize(20);
    // 最後にダメージを受けた敵の情報を表示
    if (playerStats?.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]) {
        const species = unitTypes[playerStats.lastDamageUnitType].species || 'Unknown';
        text(`敗因: ${species}`, 480, 320);
        const spriteKey = `unit_${playerStats.lastDamageUnitType}`;
        const spriteSheet = spriteSheets[spriteKey];
        if (spriteSheet && spriteSheet.width) {
            image(spriteSheet, 480 - 24, 320 + 40, 48, 48, 0, 0, 48, 48);
        }
    } else {
        text("敗因: 不明", 480, 320);
    }
    
    // ハイスコア等の情報を表示
    if (selectedCharacter && saveData?.characters?.[selectedCharacter]) {
        let highScore = saveData.characters[selectedCharacter].stages?.[currentStage]?.highScore || 0;
        text(`ハイスコア: ${highScore}`, 480, 420);
    }
    
    text("スペースキーでタイトルへ", 480, 500);
}
function drawResultScreen() {
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, 960, 720);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("ステージクリア！", 480, 150);
    
    textSize(24);
    text(`スコア: ${score || 0}`, 480, 240);
    text(`撃破数: ${enemiesKilled || 0}`, 480, 280);
    text(`経過時間: ${floor(gameTime)}秒`, 480, 320);
    
    // ★★ 平均FPSの表示を追加
    if (typeof averageFps === 'number') {
        text(`平均FPS: ${averageFps.toFixed(2)}`, 480, 360);
    }
    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;

    // --- ボタンの選択肢を、現在の状態に応じて動的に生成 ---
    resultChoices = []; // 描画のたびに選択肢をクリアして再構築

    // グローバル変数 nextStageAvailable を見て、ボタンを追加するか判断
    if (nextStageAvailable) {
        // ★ game.jsにある goToNextStage を呼び出すように設定
        resultChoices.push({ name: '次のステージへ', action: goToNextStage });
    }
    resultChoices.push({ name: 'タイトルへ戻る', action: backToTitle });

    // ホバーインデックスが新しい選択肢の範囲外に出ないように補正
    if (resultHoverIndex >= resultChoices.length) {
        resultHoverIndex = resultChoices.length - 1;
    }

    // --- ボタンの描画とホバー判定（このループは変更なし） ---
    for (let i = 0; i < resultChoices.length; i++) {
        const choice = resultChoices[i];
        const y = 420 + i * 80;
        const x = 480;
        const w = 300;
        const h = 60;

        if (mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2) {
            resultHoverIndex = i;
        }

        if (i === resultHoverIndex) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }

        fill(i === resultHoverIndex ? color(120, 120, 120, 200) : color(80, 80, 80, 200));
        rect(x - w / 2, y - h / 2, w, h, 10);

        fill(255);
        noStroke();
        textSize(24);
        text(choice.name, x, y);
    }
}

function drawRecall() {
    background(0);
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("回想モード", 640, 80);
    textSize(20);
    // 操作案内を「ESC」から「T」に変更
    text("WASD/矢印キー: 選択, Space/Enter: 実行, T: 戻る", 640, 680);

    if (!scenarioDataLoaded) {
        fill(255);
        textSize(24);
        text("シナリオデータ読み込み中...", 640, 360);
        return;
    }

    if (!recallScenarios || recallScenarios.length === 0) {
        fill(255);
        textSize(24);
        text("閲覧可能なシナリオがありません", 640, 360);
        return;
    }

    // --- 描画とマウスホバーの共通設定 ---
    const cols = 4;
    const thumbWidth = 128;
    const thumbHeight = 72;
    const spacingX = 40;
    const spacingY = 60; // 縦の間隔を広げてテキスト表示領域を確保
    const startX = (1280 - (cols * thumbWidth + (cols - 1) * spacingX)) / 2;
    const startY = 150;
    const mx = virtualCursorPos.x; // ★ 参照先を変更
    const my = virtualCursorPos.y; // ★ 参照先を変更

    for (let i = 0; i < recallScenarios.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (thumbWidth + spacingX);
        const y = startY + row * (thumbHeight + spacingY);

        // --- マウスホバー判定 ---
        if (mx >= x && mx <= x + thumbWidth && my >= y && my <= y + thumbHeight) {
            recallHoverIndex = i; // マウスが乗っている項目のインデックスを更新
        }

        // --- ハイライト描画 ---
        if (i === recallHoverIndex) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }

        // --- サムネイル描画 ---
        const isViewed = saveData?.characters?.[recallScenarios[i].character]?.scenarios?.gameOver?.[recallScenarios[i].species] || false;
        const thumbnail = scenarioData?.events?.gameOver?.[recallScenarios[i].character]?.[recallScenarios[i].species]?.thumbnail;
        
        if (thumbnail && loadedImages[thumbnail] && loadedImages[thumbnail].width) {
            if (!isViewed) {
                push();
                drawingContext.filter = 'grayscale(100%) brightness(0.5)'; // 未開放は暗くグレースケールに
                image(loadedImages[thumbnail], x, y, thumbWidth, thumbHeight);
                pop();
            } else {
                image(loadedImages[thumbnail], x, y, thumbWidth, thumbHeight);
            }
        } else {
            fill(isViewed ? 60: 40);
            rect(x, y, thumbWidth, thumbHeight);
            fill(255);
            textSize(12);
            textAlign(CENTER, CENTER);
            text(isViewed ? "閲覧可能" : "未開放", x + thumbWidth / 2, y + thumbHeight / 2);
        }

        // --- テキスト描画 ---
        fill(isViewed ? 255 : 128);
        textSize(14);
        textAlign(CENTER, TOP);
        text(`${recallScenarios[i].character}\n- ${recallScenarios[i].species} -`, x + thumbWidth / 2, y + thumbHeight + 5);

        noStroke();
    }
}

function handleMousePressed() {
    if (getAudioContext().state !== 'running') {
        userStartAudio();
    }
    
    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;

    if (gameState === 'title') {
        // 集約された`titleButtons`の、ホバーされているインデックスのアクションを実行
        if (titleHoverIndex !== -1) {
            const button = titleButtons[titleHoverIndex];
            const isLocked = typeof button.isLocked === 'function' ? button.isLocked() : button.locked;
            if (!isLocked) {
                button.action();
            }
        }
    } 
    else if (gameState === 'stageSelect') {
        let availableStages = [];
        if (stageSelectMode === 'campaign') {
            // ★ 'stagesUnlocked' を参照するように修正
            availableStages = stageConfigs.filter(s => 
                typeof s.stage === 'number' && saveData.stagesUnlocked.includes(s.stage)
            );
        } else {
            availableStages = stageConfigs.filter(s => typeof s.stage === 'string');
        }

        if (stageSelectHoverIndex !== -1 && availableStages[stageSelectHoverIndex]) {
            currentStage = availableStages[stageSelectHoverIndex].stage;
            const nextGameState = (stageSelectMode === 'campaign') ? 'characterSelect' : 'characterSelect_fr';
            setGameState(nextGameState);
        }
    }
    else if (gameState === 'characterSelect') {
        const characters = ['ANNA', 'TRACY', 'URANUS'];
        for (let i = 0; i < characters.length; i++) {
            let y = 200 + i * 100;
            let x = 80;
            let w = 280;
            let h = 80;
            if (mx >= x && mx <= x + w && my >= y - h / 2 && my <= y + h / 2) {
              //  if (characters[i] === 'URANUS') { return; }
                selectedCharacter = characters[i];
                previewCharacter = characters[i];
                loadCharacter(selectedCharacter);
                resetGameState();
                if (startScenario('stageStart', selectedCharacter, currentStage)) {
                    setGameState('scenario');
                } else {
                    setGameState('playing');
                }
                return;
            }
        }
    } 
        else if (gameState === 'characterSelect_fr') {
        const characters = ['ANNA', 'TRACY', 'URANUS'];
        for (let i = 0; i < characters.length; i++) {
            let y = 200 + i * 100;
            let x = 80;
            let w = 280;
            let h = 80;
            if (mx >= x && mx <= x + w && my >= y - h / 2 && my <= y + h / 2) {
                selectedCharacter = characters[i];
                previewCharacter = characters[i];
                loadCharacter(selectedCharacter);
                resetGameState();
                if (startScenario('stageStart', selectedCharacter, currentStage)) {
                    setGameState('scenario');
                } else {
                    setGameState('playing');
                }
                return;
            }
        }
    }
    else if (gameState === 'paused') {
        // pauseChoicesグローバル変数を直接参照してクリック処理を行う
        for (let i = 0; i < pauseChoices.length; i++) {
            let x = 480;
            let y = 300 + i * 70;
            let w = 240;
            let h = 60;
            if (mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2) {
                pauseChoices[i].action();
                return;
            }
        }
    }
    else if (gameState === 'levelUp') {
        // ★★★ クリック判定を、仮想カーソルの座標で行うように修正 ★★★
        const mx = virtualCursorPos.x;
        const my = virtualCursorPos.y;

        if (!levelUpChoices || levelUpChoices.length === 0) return;
        const numChoices = levelUpChoices.length;
        const boxWidth = 280;
        const boxHeight = 80;
        const spacing = 40;
        const totalWidth = (numChoices * boxWidth) + ((numChoices - 1) * spacing);
        let startX = (960 - totalWidth) / 2;
        const choicesY = 420;
        for (let i = 0; i < numChoices; i++) {
            let x = startX + i * (boxWidth + spacing);
            if (mx >= x && mx <= x + boxWidth && my >= choicesY - boxHeight / 2 && my <= choicesY + boxHeight / 2) {
                applyUpgrade(levelUpChoices[i]);
                return;
            }
        }
    } 
    else if ((gameState === 'gameOver' || gameState === 'recall' || gameState === 'scenario') && isScenarioActive()) {
        // シナリオ進行のクリック
        if (mx >= 1280 - 110 && mx <= 1280 - 10 && my >= 720 - 70 && my <= 720 - 40) {
            showBacklog = !showBacklog;
        } else if (mx >= 1280 - 110 && mx <= 1280 - 10 && my >= 720 - 40 && my <= 720 - 10) {
            toggleText();
        } else if (!showBacklog) {
            advanceScenario();
        }
    } 
    else if (gameState === 'recall' && !isScenarioPlaying) {
        // --- 回想画面のサムネイルクリック処理 ---
        // drawRecallと完全に同じ計算方法で当たり判定を行う
        const cols = 4;
        const thumbWidth = 128;
        const thumbHeight = 72;
        const spacingX = 40;
        const spacingY = 60;
        const startX = (1280 - (cols * thumbWidth + (cols - 1) * spacingX)) / 2;
        const startY = 150;

        for (let i = 0; i < recallScenarios.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (thumbWidth + spacingX);
            const y = startY + row * (thumbHeight + spacingY);

            // マウスクリックがサムネイルの範囲内にあるか判定
            if (mx >= x && mx <= x + thumbWidth && my >= y && my <= y + thumbHeight) {
                const { character, species } = recallScenarios[i];
                // 閲覧済みのシナリオのみ再生可能
                if (saveData?.characters?.[character]?.scenarios?.gameOver?.[species]) {
                    selectedCharacter = character; // シナリオ再生用にキャラを設定
                    if (startScenario('gameOver', character, species)) {
                        // gameStateは'recall'のまま。startScenario内で'scenario'に一時的に変更される
                    }
                }
                return; // 一度クリックしたらループを抜ける
            }
        }
    }
    else if (gameState === 'gameOver' && !isScenarioActive()) {
        backToTitle();
    } 
    else if (gameState === 'playing' || gameState === 'boss') {
         if (mx >= 800 && mx <= 940 && my >= 660 && my <= 700) {
            autoFire = !autoFire;
         }
    }
        else if (gameState === 'result') {
        // ホバーされている選択肢のアクションを実行
        if (resultChoices[resultHoverIndex]) {
            resultChoices[resultHoverIndex].action();
        }
    }
}
/**
 * 全てのキー入力を処理する、統合された関数
 */
function keyPressed() {
    if (debugLog && debugMode) {
        console.log(`Key pressed: '${key}' (keyCode: ${keyCode}), GameState: ${gameState}`);
    }

    const lowerKey = key.toLowerCase();

    // F11キーでのフルスクリーン切り替え
    if (keyCode === 122) {
        if (window.electronAPI && typeof window.electronAPI.toggleFullscreen === 'function') {
            window.electronAPI.toggleFullscreen();
        }
        return;
    }

    // Tキーは、多くの画面で「戻る」または「ポーズ」として機能する
    if (lowerKey === 't') {
        if (gameState === 'playing' || gameState === 'boss') {
            setGameState('paused');
        } else if (gameState === 'paused') {
            setGameState('playing');
        } else if (gameState ==='characterSelect_fr' ||'characterSelect' || gameState === 'options' || gameState === 'recall') {
            setGameState('title');
        } 
        else if (gameState === 'result') {
            backToTitle();
        } else if (isScenarioPlaying) {
            endScenario();
        }
        return;
    }

    // --- 各ゲーム状態に応じた、Tキー以外のキー処理 ---
    if (gameState === 'title') {
        let direction = 0;
        if (lowerKey === 'w' || keyCode === UP_ARROW) { direction = -1; } 
        else if (lowerKey === 's' || keyCode === DOWN_ARROW) { direction = 1; }
        
        if (direction !== 0) {
            // ロックされている項目をスキップしながらカーソルを移動
            let current_index = titleHoverIndex;
            for (let i = 0; i < titleButtons.length; i++) {
                current_index = (current_index + direction + titleButtons.length) % titleButtons.length;
                const button = titleButtons[current_index];
                const isLocked = typeof button.isLocked === 'function' ? button.isLocked() : button.locked;
                if (!isLocked) {
                    titleHoverIndex = current_index;
                    break;
                }
            }
        } else if (key === ' ' || keyCode === ENTER) {
            // 集約された`titleButtons`の、選択されているインデックスのアクションを実行
            if (titleHoverIndex !== -1) {
                const button = titleButtons[titleHoverIndex];
                const isLocked = typeof button.isLocked === 'function' ? button.isLocked() : button.locked;
                if (!isLocked) {
                    button.action();
                }
            }
        }
    }
    else if (gameState === 'stageSelect') {
        let availableStages = [];
        if (stageSelectMode === 'campaign') {
            // ★ 'stagesUnlocked' を参照するように修正
            availableStages = stageConfigs.filter(s => 
                typeof s.stage === 'number' && saveData.stagesUnlocked.includes(s.stage)
            );
        } else {
            availableStages = stageConfigs.filter(s => typeof s.stage === 'string');
        }

        if (availableStages.length === 0) return;

        let direction = 0;
        if (key.toLowerCase() === 'w' || keyCode === UP_ARROW) { direction = -1; }
        else if (key.toLowerCase() === 's' || keyCode === DOWN_ARROW) { direction = 1; }

        if (direction !== 0) {
            stageSelectHoverIndex = (stageSelectHoverIndex + direction + availableStages.length) % availableStages.length;
        } else if (key === ' ' || keyCode === ENTER) {
            if (stageSelectHoverIndex !== -1 && availableStages[stageSelectHoverIndex]) {
                currentStage = availableStages[stageSelectHoverIndex].stage;
                const nextGameState = (stageSelectMode === 'campaign') ? 'characterSelect' : 'characterSelect_fr';
                setGameState(nextGameState);
            }
        }
    }
    else if (gameState === 'characterSelect') {
        const characters = ['ANNA', 'TRACY', 'URANUS'];
        let direction = 0;
        if (lowerKey === 'w' || keyCode === UP_ARROW) { direction = -1; }
        else if (lowerKey === 's' || keyCode === DOWN_ARROW) { direction = 1; }
        if (direction !== 0) {
            characterSelectHoverIndex = (characterSelectHoverIndex + direction + characters.length) % characters.length;
            previewCharacter = characters[characterSelectHoverIndex];
        } else if (key === ' ' || keyCode === ENTER) {
            if (characterSelectHoverIndex !== -1 && previewCharacter) {
                selectedCharacter = previewCharacter;
                loadCharacter(selectedCharacter);
                resetGameState();
                if (startScenario('stageStart', selectedCharacter, currentStage)) {
                    setGameState('scenario');
                } else {
                    setGameState('playing');
                }
            }
        }
    }
        else if (gameState === 'characterSelect_fr') {
        const characters = ['ANNA', 'TRACY', 'URANUS'];
        const lowerKey = key.toLowerCase();
        let direction = 0;
        if (lowerKey === 'w' || keyCode === UP_ARROW) { direction = -1; }
        else if (lowerKey === 's' || keyCode === DOWN_ARROW) { direction = 1; }

        if (direction !== 0) {
            characterSelectHoverIndex = (characterSelectHoverIndex + direction + characters.length) % characters.length;
            previewCharacter = characters[characterSelectHoverIndex];
        } else if (key === ' ' || keyCode === ENTER) {
            if (characterSelectHoverIndex !== -1 && previewCharacter) {
                selectedCharacter = previewCharacter;
                loadCharacter(selectedCharacter);
                resetGameState();
                if (startScenario('stageStart', selectedCharacter, currentStage)) {
                    setGameState('scenario');
                } else {
                    setGameState('playing');
                }
            }
        }
    }
    else if (gameState === 'levelUp') {
        if (!levelUpChoices || levelUpChoices.length === 0) return;
        if (lowerKey === 'e' || keyCode === RIGHT_ARROW) {
            levelUpHoverIndex = (levelUpHoverIndex + 1) % levelUpChoices.length;
        } else if (keyCode === LEFT_ARROW) {
            levelUpHoverIndex = (levelUpHoverIndex - 1 + levelUpChoices.length) % levelUpChoices.length;
        } else if (key === ' ' || keyCode === ENTER) {
            if (levelUpHoverIndex >= 0 && levelUpChoices[levelUpHoverIndex]) {
                applyUpgrade(levelUpChoices[levelUpHoverIndex]);
            }
        }
    }
    else if (gameState === 'paused') {
        if (lowerKey === 's' || keyCode === DOWN_ARROW) {
            pauseHoverIndex = (pauseHoverIndex + 1) % pauseChoices.length;
        } else if (lowerKey === 'w' || keyCode === UP_ARROW) {
            pauseHoverIndex = (pauseHoverIndex - 1 + pauseChoices.length) % pauseChoices.length;
        } else if (key === ' ' || keyCode === ENTER) {
            if (pauseHoverIndex >= 0 && pauseChoices[pauseHoverIndex]) {
                 pauseChoices[pauseHoverIndex].action();
            }
        }
    }
    else if (gameState === 'playing' || gameState === 'boss') {
        if (lowerKey === 'q' && !isScenarioActive()) {
            autoFire = !autoFire;
        } else if (lowerKey === 'g' && stageClearConditionMet) {
            proceedToStageClearSequence();
        }
    }
    else if (gameState === 'scenario' || (gameState === 'recall' && isScenarioPlaying)) {
        if (isScenarioActive()) {
            if ((key === ' ' || keyCode === ENTER) && !showBacklog) { advanceScenario(); }
            else if (key.toLowerCase() === 'c') { showBacklog = !showBacklog; }
            else if (key.toLowerCase() === 'v' && !showBacklog) { toggleText(); }
        }
    }
    else if (gameState === 'gameOver') {
        if (!isScenarioActive() && (key === ' ' || keyCode === ENTER)) {
            backToTitle();
        }
    }
    else  if (gameState === 'editorMapSelect') {
        // ... (stageSelectと同様のキー操作) ...
        if (key === ' ' || keyCode === ENTER) {
            const selectedStage = stageConfigs[stageSelectHoverIndex];
            if (selectedStage) {
                currentStage = selectedStage.stage;
                initializeEditor(currentStage); // エディタを初期化
            }
        }
    }     else if (gameState === 'mapEditor') {
        // 図形選択キー（押すと配置モードに戻る）
        if (key === '1') { editorCurrentShapeType = 'rect'; editorEditMode = 'place'; }
        if (key === '2') { editorCurrentShapeType = 'circle'; editorEditMode = 'place'; }
        if (key === '3') { editorCurrentShapeType = 'triangle'; editorEditMode = 'place'; }
        if (key === '4') { editorCurrentShapeType = 'ellipse'; editorEditMode = 'place'; }
        if (key === '5') { editorCurrentShapeType = 'rightTriangle'; editorEditMode = 'place'; } // ★ この行を追加

        // 編集モード切替キー
        if (key.toLowerCase() === 'z') editorEditMode = 'delete';
        if (key.toLowerCase() === 'c') editorEditMode = 'move';
        if (key.toLowerCase() === 'v') editorEditMode = 'changeType';
        
        // その他
        if (key.toLowerCase() === 'p') exportTerrainData();
        if (key.toLowerCase() === 't') backToTitle();
    }
    else if (gameState === 'recall' && !isScenarioPlaying) {
        if (!recallScenarios || recallScenarios.length === 0) return;
        const cols = 4;
        let newIndex = recallHoverIndex;
        if (lowerKey === 'a' || keyCode === LEFT_ARROW) { newIndex--; }
        else if (lowerKey === 'd' || keyCode === RIGHT_ARROW) { newIndex++; }
        else if (lowerKey === 'w' || keyCode === UP_ARROW) { newIndex -= cols; }
        else if (lowerKey === 's' || keyCode === DOWN_ARROW) { newIndex += cols; }
        else if (key === ' ' || keyCode === ENTER) {
            if (recallHoverIndex !== -1) {
                const { character, species } = recallScenarios[recallHoverIndex];
                if (saveData?.characters?.[character]?.scenarios?.gameOver?.[species]) {
                    selectedCharacter = character;
                    startScenario('gameOver', character, species);
                }
            }
        }
        if (newIndex >= 0 && newIndex < recallScenarios.length) {
            recallHoverIndex = newIndex;
        }
    }
    else if (gameState === 'options') {
        // オプション画面のキー操作はTキーのみ
    }
    else if (gameState === 'result') {
        let direction = 0;
        if (lowerKey === 'w' || keyCode === UP_ARROW) { direction = -1; }
        else if (lowerKey === 's' || keyCode === DOWN_ARROW) { direction = 1; }
        if (direction !== 0) {
            resultHoverIndex = (resultHoverIndex + direction + resultChoices.length) % resultChoices.length;
        }
        if (key === ' ' || keyCode === ENTER) {
            if (resultChoices[resultHoverIndex]) {
                resultChoices[resultHoverIndex].action();
            }
        } 
    }
}

// ★★★ 1. ボタンがクリックされた時に呼び出される新しい関数を追加 ★★★
/**
 * マウス補正の有効/無効を切り替える
 */
function toggleMouseCorrection() {
    enableMouseCorrection = !enableMouseCorrection;
    updateOptionsScreen(); // ボタンの表示を更新
    console.log(`Mouse Correction set to: ${enableMouseCorrection}`);
}

// ★★★ 2. オプション画面の表示内容を更新する関数を追加 ★★★
/**
 * オプション画面の表示を現在の設定値に合わせて更新する
 */
function updateOptionsScreen() {
    const sfxSlider = document.getElementById('sfxVolume');
    const bgmSlider = document.getElementById('bgmVolume');
    const mouseButton = document.getElementById('mouseCorrectionButton');
    const terrainButton = document.getElementById('terrainEffectsButton'); // ★ 追加

    if (sfxSlider) sfxSlider.value = sfxVolume * 100;
    if (bgmSlider) bgmSlider.value = bgmVolume * 100;
    if (mouseButton) {
        mouseButton.innerText = `画面端のマウス補正: ${enableMouseCorrection ? 'ON' : 'OFF'}`;
    }
    if (terrainButton) { // ★ 追加
        terrainButton.innerText = `地形効果の表示: ${showTerrainEffects ? 'ON' : 'OFF'}`;
    }
}

// ★★★ 2. setup関数またはDOM読み込み完了後のイベントリスナーを修正 ★★★
// (このコードがui.jsのどこにあるかによりますが、通常はファイルの最後か、
// DOMContentLoadedイベントリスナーの中にあります)

document.addEventListener('DOMContentLoaded', () => {
    const sfxSlider = document.getElementById('sfxVolume');
    const bgmSlider = document.getElementById('bgmVolume');

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (event) => {
            // ★ sfxVolumeグローバル変数を直接更新
            sfxVolume = parseFloat(event.target.value) / 100;
        });
    }

    if (bgmSlider) {
        bgmSlider.addEventListener('input', (event) => {
            // ★ bgmVolumeグローバル変数を直接更新
            bgmVolume = parseFloat(event.target.value) / 100;
            if (currentBGM && currentBGM.isPlaying()) {
                currentBGM.setVolume(bgmVolume);
            }
        });
    }
    
    // マウス補正ボタンのクリック処理は既にグローバル変数を更新しているので変更なし
});

function drawEditorMapSelect() {
    background(0, 0, 50);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("編集するマップを選択", 640, 60);
    textSize(20);
    text("W/S: 選択, Space/Enter: 決定, T: 戻る", 640, 680);

    const mx = virtualCursorPos.x;
    const my = virtualCursorPos.y;

    // 全てのステージをリストアップ（ロック状態を無視）
    const allStages = stageConfigs;

    if (stageSelectHoverIndex >= allStages.length) {
        stageSelectHoverIndex = allStages.length - 1;
    }

    allStages.forEach((stageConf, index) => {
        const y = 150 + index * 80;
        const x = (1280 - 400) / 2;
        const w = 400;
        const h = 60;

        const isHoveredByMouse = (mx >= x && mx <= x + w && my >= y - h / 2 && my <= y + h / 2);
        if (isHoveredByMouse) {
            stageSelectHoverIndex = index;
        }
        
        const isSelected = (index === stageSelectHoverIndex);
        // ... (通常のステージ選択と同様の描画ロジック) ...
        if (isSelected) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }
        fill(isSelected ? color(120, 120, 120, 200) : color(80, 80, 80, 200));
        rect(x, y - h / 2, w, h, 10);
        fill(255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(`Stage: ${stageConf.stage}`, x + w / 2, y);
    });
}

function mousePressed() {
    if (gameState === 'mapEditor') {
        handleEditorMousePressed();
    } else {
        handleMousePressed(); // ui.jsの関数
    }
}

function mouseReleased() {
    if (gameState === 'mapEditor') {
        handleEditorMouseReleased();
    }
}

function mouseDragged() {
    if (gameState === 'mapEditor') {
        handleEditorMouseDragged();
    }
}

/**
 * 地形効果表示の有効/無効を切り替える
 */
function toggleTerrainEffects() {
    showTerrainEffects = !showTerrainEffects; // game.jsのグローバル変数を切り替え
    updateOptionsScreen(); // ボタンの表示を更新
}
