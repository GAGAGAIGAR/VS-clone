let pauseChoices = [
    { name: '再開', action: () => setGameState('playing') },
    { name: 'タイトルへ', action: () => backToTitle() },
    { 
        name: '自爆', 
        action: () => {
            if (selectedCharacter && playerStats) {
                playerStats.hp = 0;
                setGameState('gameOver');
                console.log('自爆を実行しました');
            } else {
                console.warn('自爆失敗: キャラクターが選択されていません');
            }
        }
    }
];
let pauseHoverIndex = 0;
let showBacklog = false;
let scenarioStarted = false; // この変数は isScenarioPlaying() や scenario.js での管理が望ましい
let recallHoverIndex = -1;  // 初期値 -1 (未選択)
let recallScenarios = [];   // scenario.js でデータがロードされる
let titleHoverIndex = 0;    // 初期値 0
let characterSelectHoverIndex = 0;

function drawUI() {
    resetMatrix();
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


    // 右上の情報表示
    textAlign(RIGHT, TOP);
    let topRightYPos = 20;
    text(`Time: ${floor(gameTime) || 0}/${stageConfigForUI.duration}`, 960 - 10, topRightYPos); topRightYPos += 20;

    if (window.upgrades) {
        window.upgrades.forEach(ur => {
            if (ur.level > 0) {
                text(`${ur.name}: Lv${ur.level}`, 960 - 10, topRightYPos);
                topRightYPos += 20;
            }
        });
    }
    // Last Damage Unit は左下に移動したので、ここからは削除

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
    text(`次のラッシュまで: ${rushThreshold - rushEnemiesKilled} 撃破`, 480, 720 - 40);
}

function drawTitle() {
    background(0);
    fill(0, 0, 100, 200);
    noStroke();
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("STS (仮)", 640, 100);
    textSize(20);
    text("WASD: 選択, Space: 実行", 640, 680);

    const options = ['スタート', 'フロントライン', '回想', 'オプション'];
    for (let i = 0; i < options.length; i++) {
        let y = 300 + i * 80;
        if (mouseX >= 490 && mouseX <= 790 && mouseY >= y - 30 && mouseY <= y + 30) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }
        fill(i === titleHoverIndex ? 120 : 80);
        rect(490, y - 30, 300, 60, 20);
        fill(255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(options[i], 640, y);
    }
}

function drawCharacterSelect() {
    background(0);
    fill(0, 0, 100, 200);
    noStroke();
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(36);
    textAlign(CENTER, CENTER);
    text("キャラクターを選択", 640, 80);
    textSize(20);
    text("WASD/矢印キー: 選択, Space/Enter: 実行, ESC: 戻る", 640, 680); // 操作説明に矢印キーとESC追加
    textAlign(LEFT, CENTER);

    let characters = ['ANNA', 'TRACY', 'URANUS'];
    for (let i = 0; i < characters.length; i++) {
        let y = 200 + i * 120;
        // マウスホバーのロジックは handleMousePressed または mouseMoved で characterSelectHoverIndex を更新するようにし、
        // ここでは characterSelectHoverIndex に基づいて描画するのみとするのが理想的。
        // 今回はキー操作優先のため、マウスホバーによる直接の index 変更はコメントアウト推奨。
        // if (mouseX >= 340 && mouseX <= 640 && mouseY >= y - 40 && mouseY <= y + 40) {
        //     stroke(255, 255, 0);
        //     strokeWeight(3);
        //     // characterSelectHoverIndex = i; // マウスホバーで直接変更するとキー操作と競合しやすい
        // } else {
        //     noStroke();
        // }

        if (i === characterSelectHoverIndex) { // キーボードまたはマウスイベントで更新されたhoverIndexに基づいて描画
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }
        fill(i === characterSelectHoverIndex ? 120 : 80);
        rect(340, y - 40, 300, 80, 20);
        fill(255);
        noStroke(); // fillの後にnoStrokeを再度呼ぶ
        textSize(24);
        text(characters[i], 360, y);
        if (characters[i] === 'URANUS') {
            fill(100);
            textSize(16);
            text("(Locked)", 510, y);
        } else {
            // currentStage が未定義または数値でない場合のフォールバックを追加
            let stageKey = String(currentStage || 1);
            let highScore = saveData?.characters?.[characters[i]]?.stages?.[stageKey]?.highScore || 0;
            fill(180);
            textSize(16);
            text(`High Score: ${highScore}`, 360, y + 30);
        }
    }
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
    text("ESC/P: 再開, E: 選択, Space: 実行", 480, 600);

    for (let i = 0; i < pauseChoices.length; i++) {
        let x = 480;
        let y = 300 + i * 70;
        fill(i === pauseHoverIndex ? 120 : 80);
        stroke(255);
        strokeWeight(2);
        rect(x - 120, y - 30, 240, 60, 10);
        fill(255);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(pauseChoices[i].name, x, y);
    }
}

function drawLevelUp() {
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, 960, 720);
    fill(255);
    textSize(28);
    textAlign(CENTER, CENTER);
    text("レベルアップ！ 強化を選択:", 480, 150);
    stroke(255);
    strokeWeight(2);
    const maxPerCol = 5;
    const numCols = Math.ceil(levelUpChoices.length / maxPerCol);
    for (let i = 0; i < levelUpChoices.length; i++) {
        let col = Math.floor(i / maxPerCol);
        let row = i % maxPerCol;
        let x = 480 + (col - Math.floor(numCols / 2)) * 320;
        let y = 220 + row * 70;
        fill(i === levelUpHoverIndex ? 120 : 80);
        rect(x - 140, y - 30, 280, 60, 10);
        fill(255);
        noStroke();
        textSize(20);
        textAlign(CENTER, CENTER);
        text(levelUpChoices[i].name, x, y);
        stroke(255);
        strokeWeight(2);
    }
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);
    text("E: 選択, Space: 実行", 10, 10);
}

function drawGameOver() {
    const gameOverDiv = document.getElementById('gameOver');
    if (!gameOverDiv) {
        console.warn('gameOver div not found in DOM');
        fallbackGameOver();
        return;
    }

    console.log(`drawGameOver: scenarioStarted=${scenarioStarted}, isScenarioActive=${isScenarioActive()}, gameState=${gameState}`);

    if (!scenarioData) {
        console.warn('Scenario data not loaded');
        gameOverDiv.style.display = 'block';
        fallbackGameOver();
        return;
    }

    if (isScenarioActive()) {
        gameOverDiv.style.display = 'none';
        updateScenario();
        drawScenario();
        if (showBacklog) drawBacklog();
    } else if (selectedCharacter && !scenarioStarted) {
        let species = playerStats?.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]
            ? unitTypes[playerStats.lastDamageUnitType].species || 'default'
            : 'default';
        console.log(`Attempting scenario: character=${selectedCharacter}, species=${species}, lastDamageUnitType=${playerStats?.lastDamageUnitType}`);
        if (startScenario('gameOver', selectedCharacter, species)) {
            scenarioStarted = true;
            gameOverDiv.style.display = 'none';
        } else {
            gameOverDiv.style.display = 'block';
            scenarioStarted = false;
            fallbackGameOver();
        }
    } else {
        gameOverDiv.style.display = 'block';
        fallbackGameOver();
    }
}

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
    if (playerStats?.lastDamageUnitType && unitTypes[playerStats.lastDamageUnitType]) {
        const species = unitTypes[playerStats.lastDamageUnitType].species || 'Unknown';
        text(`倒したユニット: ${species}`, 480, 320);
        const spriteKey = `unit_${playerStats.lastDamageUnitType}`;
        const spriteSheet = spriteSheets[spriteKey];
        if (spriteSheet && spriteSheet.width) {
            image(spriteSheet, 480 - 24, 320 + 40, 48, 48, 0, 0, 48, 48);
        }
    } else {
        text("倒したユニット: 不明", 480, 320);
    }
    
    if (selectedCharacter && saveData?.characters?.[selectedCharacter]) {
        let highScore = saveData.characters[selectedCharacter].stages?.[currentStage]?.highScore || 0;
        text(`ハイスコア: ${highScore}`, 480, 360);
        let scenarioStatus = saveData.characters[selectedCharacter].scenarios?.gameOver || {};
        let completedScenarios = Object.keys(scenarioStatus).filter(s => scenarioStatus[s]).join(', ');
        if (completedScenarios) {
            text(`閲覧済シナリオ: ${completedScenarios}`, 480, 380);
        }
    }
    
    text("スペース: タイトルへ", 480, 400);
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
    // 操作説明を更新
    text("WASD/矢印キー: 選択, Space/Enter: 実行, C: バックログ, V: テキスト表示切替, ESC: 戻る", 640, 680);


    if (debugLog && debugMode) {
        console.log(`drawRecall: recallScenarios.length=${recallScenarios.length}, scenarioDataLoaded=${scenarioDataLoaded}, recallHoverIndex=${recallHoverIndex}`);
    }

    if (!scenarioDataLoaded) {
        fill(255);
        textSize(24);
        text("シナリオデータ読み込み中...", 640, 360);
        return;
    }

    if (!recallScenarios || recallScenarios.length === 0) { // recallScenariosのnullチェックも追加
        fill(255);
        textSize(24);
        text("閲覧可能なシナリオがありません", 640, 360);
        return;
    }

    const cols = 4;
    const thumbWidth = 128;
    const thumbHeight = 72;
    const spacingX = 40;
    const spacingY = 30;
    const startX = (1280 - (cols * thumbWidth + (cols - 1) * spacingX)) / 2;
    const startY = 120;

    for (let i = 0; i < recallScenarios.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (thumbWidth + spacingX);
        const y = startY + row * (thumbHeight + spacingY);

        const isViewed = saveData?.characters?.[recallScenarios[i].character]?.scenarios?.gameOver?.[recallScenarios[i].species] || false;
        
        // マウスホバーによる recallHoverIndex の更新は handleMousePressed/mouseMoved で行うべき
        // ここでは描画に徹する
        // if (mouseX >= x && mouseX <= x + thumbWidth && mouseY >= y && mouseY <= y + thumbHeight) {
        //     stroke(255, 255, 0);
        //     strokeWeight(3);
        //     // recallHoverIndex = i; // 描画関数内でホバーインデックスを直接変更しない
        // }

        if (i === recallHoverIndex) {
            stroke(255, 255, 0);
            strokeWeight(3);
        } else {
            noStroke();
        }

        const thumbnail = scenarioData?.events?.gameOver?.[recallScenarios[i].character]?.[recallScenarios[i].species]?.thumbnail;
        if (thumbnail && loadedImages[thumbnail] && loadedImages[thumbnail].width) {
            if (!isViewed) {
                push();
                drawingContext.filter = 'grayscale(100%)';
                image(loadedImages[thumbnail], x, y, thumbWidth, thumbHeight);
                pop();
            } else {
                image(loadedImages[thumbnail], x, y, thumbWidth, thumbHeight);
            }
        } else {
            fill(isViewed ? 60: 40); //閲覧済みと未閲覧で背景色を少し変える（任意）
            rect(x, y, thumbWidth, thumbHeight);
            fill(255); //
            textSize(12); //
            textAlign(CENTER, CENTER); //
            text(isViewed ? (thumbnail ? "画像エラー" : "データなし") : "未開放", x + thumbWidth / 2, y + thumbHeight / 2);
            if (debugMode && thumbnail) console.log(`Thumbnail missing or not loaded: ${thumbnail}, character=${recallScenarios[i].character}, species=${recallScenarios[i].species}`);
        }

        fill(isViewed ? 255 : 128); // 未開放は少し暗く
        textSize(14);
        textAlign(CENTER, TOP);
        text(`${recallScenarios[i].character} - ${recallScenarios[i].species}`, x + thumbWidth / 2, y + thumbHeight + 5);

        noStroke();
    }
}

function handleMousePressed() {
    console.log(`Mouse pressed at (${mouseX}, ${mouseY}), gameState: ${gameState}, titleHoverIndex: ${titleHoverIndex}`);
    if (gameState === 'title') {
        const options = ['スタート', 'フロントライン', '回想', 'オプション'];
        for (let i = 0; i < options.length; i++) {
            let y = 300 + i * 80;
            if (mouseX >= 490 && mouseX <= 790 && mouseY >= y - 30 && mouseY <= y + 30) {
                if (i === 0) {
                    setGameState('characterSelect');
                    currentStage = 1; // スタートを選択
                    console.log('タイトルからキャラ選択へ（スタート）、currentStage: 1');
                } else if (i === 1) {
                    setGameState('characterSelect');
                    currentStage = 'fr'; // フロントラインを選択
                    console.log('タイトルからキャラ選択へ（フロントライン）、currentStage: fr');
                } else if (i === 2) {
                    setGameState('recall');
                    console.log('回想モードへ');
                } else {
                    setGameState('options');
                    console.log('オプション画面へ');
                }
                return;
            }
        }
        console.log('タイトル画面で無効なクリック');
    } else if (gameState === 'characterSelect') {
        let characters = ['ANNA', 'TRACY', 'URANUS'];
        for (let i = 0; i < characters.length; i++) {
            let y = 200 + i * 120;
            if (mouseX >= 340 && mouseX <= 640 && mouseY >= y - 40 && mouseY <= y + 40) {
                if (characters[i] === 'URANUS') {
                    console.log('URANUS is locked');
                    return;
                }
                previewCharacter = characters[i];
                selectedCharacter = characters[i];
                try {
                    loadCharacter(selectedCharacter);
                    resetGameState();
                    if (startScenario('stageStart', selectedCharacter, currentStage)) {
                        setGameState('scenario');
                        console.log(`ステージ ${currentStage} の開始シナリオを再生します。`);
                    } else {
                    setGameState('playing');
                    console.log(`選択したキャラクター: ${selectedCharacter}, ステージ: ${currentStage}, 状態: playing`);
                    }
                } catch (err) {
                    console.error(`キャラクター選択エラー: ${err}`);
                }
                return;
            }
        }
        console.log('キャラ選択で無効なクリック');
    } else if (gameState === 'paused') {
        for (let i = 0; i < pauseChoices.length; i++) {
            let x = 480;
            let y = 300 + i * 70;
            if (mouseX >= x - 120 && mouseX <= x + 120 && mouseY >= y - 30 && mouseY <= y + 30) {
                pauseChoices[i].action();
                console.log(`選択したポーズオプション: ${pauseChoices[i].name}`);
                return;
            }
        }
    } else if (gameState === 'levelUp') {
        const maxPerCol = 5;
        const numCols = Math.ceil(levelUpChoices.length / maxPerCol);
        for (let i = 0; i < levelUpChoices.length; i++) {
            let col = Math.floor(i / maxPerCol);
            let row = i % maxPerCol;
            let x = 480 + (col - Math.floor(numCols / 2)) * 320;
            let y = 220 + row * 70;
            if (mouseX >= x - 140 && mouseX <= x + 140 && mouseY >= y - 30 && mouseY <= y + 30) {
                let upgrade = levelUpChoices[i];
                upgrade.level++;
                if (typeof upgrade.effect === 'function') {
                    if (upgrade.effect.length === 0) {
                        upgrade.effect();
                    } else {
                        upgrade.effect(upgrade.level - 1);
                    }
                }
                setGameState('playing');
                levelUpChoices = [];
                levelUpHoverIndex = -1;
                console.log(`選択した強化: ${upgrade.name}`);
                return;
            }
        }
    } else if ((gameState === 'gameOver' || gameState === 'recall' || gameState === 'scenario') && isScenarioActive()) {
        // Handle scenario controls
        // Backlog button
        if (mouseX >= 1280 - 110 && mouseX <= 1280 - 10 && mouseY >= 720 - 70 && mouseY <= 720 - 40) {
            showBacklog = !showBacklog;
            console.log(`Backlog display: ${showBacklog}`);
            return;
        }
        // Text hide button
        if (mouseX >= 1280 - 110 && mouseX <= 1280 - 10 && mouseY >= 720 - 40 && mouseY <= 720 - 10) {
            toggleText();
            return;
        }
        // Advance scenario only if backlog is not open
        if (!showBacklog) {
            advanceScenario();
        }
        return;
    } else if (gameState === 'gameOver' && !isScenarioActive()) {
        backToTitle();
        return;
    } else if (gameState === 'playing' && mouseX >= 800 && mouseX <= 940 && mouseY >= 660 && mouseY <= 700) {
        autoFire = !autoFire;
        console.log(`自動射撃: ${autoFire}`);
        return;
    } else if (gameState === 'recall' && !isScenarioPlaying) {
        const cols = 4;
        const thumbWidth = 128;
        const thumbHeight = 72;
        const spacingX = 40;
        const spacingY = 30;
        const startX = (1280 - (cols * thumbWidth + (cols - 1) * spacingX)) / 2;
        const startY = 120;
        for (let i = 0; i < recallScenarios.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (thumbWidth + spacingX);
            const y = startY + row * (thumbHeight + spacingY);
            if (mouseX >= x && mouseX <= x + thumbWidth && mouseY >= y && mouseY <= y + thumbHeight) {
                const { character, species } = recallScenarios[i];
                const isViewed = saveData?.characters?.[character]?.scenarios?.gameOver?.[species] || false;
                if (isViewed) {
                    selectedCharacter = character;
                    if (startScenario('gameOver', character, species)) {
                        scenarioStarted = true;
                        setGameState('recall');
                        console.log(`再生開始: ${character} - ${species}`);
                    }
                }
                return;
            }
        }
    }
}

function keyPressed() {
    console.log(`Key pressed: '${key}' (keyCode: ${keyCode}), GameState: ${gameState}, titleHoverIndex: ${titleHoverIndex}, charSelectHover: ${characterSelectHoverIndex}, recallHover: ${recallHoverIndex}`);

    // --------------------
    // Title Screen Controls
    // --------------------
    if (gameState === 'title') {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'w' || lowerKey === 'a' || keyCode === UP_ARROW || keyCode === LEFT_ARROW) {
            titleHoverIndex = (titleHoverIndex - 1 + 4) % 4;
        } else if (lowerKey === 's' || lowerKey === 'd' || keyCode === DOWN_ARROW || keyCode === RIGHT_ARROW) {
            titleHoverIndex = (titleHoverIndex + 1) % 4;
        } else if (key === ' ' || keyCode === ENTER) {
            if (titleHoverIndex === 0) { // スタート
                setGameState('characterSelect');
                currentStage = 1;
                characterSelectHoverIndex = 0; // ★★★ 初期ホバー設定 ★★★
                previewCharacter = ['ANNA', 'TRACY', 'URANUS'][characterSelectHoverIndex];
                console.log('タイトルからキャラ選択へ（スタート）');
            } else if (titleHoverIndex === 1) { // フロントライン
                setGameState('characterSelect');
                currentStage = 'fr';
                characterSelectHoverIndex = 0; // ★★★ 初期ホバー設定 ★★★
                previewCharacter = ['ANNA', 'TRACY', 'URANUS'][characterSelectHoverIndex];
                console.log('タイトルからキャラ選択へ（フロントライン）');
            } else if (titleHoverIndex === 2) { // 回想
                setGameState('recall');
                recallHoverIndex = (recallScenarios && recallScenarios.length > 0) ? 0 : -1; // ★★★ 初期ホバー設定 ★★★
                console.log('回想モードへ');
            } else if (titleHoverIndex === 3) { // オプション
                setGameState('options');
                console.log('オプション画面へ');
            }
        }
        console.log(`タイトル選択: インデックス ${titleHoverIndex}`);
    }
    // --------------------
    // Character Select Controls (再修正)
    // --------------------
   else if (gameState === 'characterSelect') {
        const characters = ['ANNA', 'TRACY', 'URANUS'];
        const lowerKey = key.toLowerCase();
        let direction = 0;

        // WASD/矢印キーによるナビゲーション処理 (前回修正済みと仮定)
        if (lowerKey === 'w' || lowerKey === 'a' || keyCode === UP_ARROW || keyCode === LEFT_ARROW) {
            direction = -1;
        } else if (lowerKey === 's' || lowerKey === 'd' || keyCode === DOWN_ARROW || keyCode === RIGHT_ARROW) {
            direction = 1;
        }

        if (direction !== 0) {
            if (characterSelectHoverIndex === -1) {
                characterSelectHoverIndex = (direction === 1) ? 0 : characters.length - 1;
            } else {
                characterSelectHoverIndex = (characterSelectHoverIndex + direction + characters.length) % characters.length;
            }
            previewCharacter = characters[characterSelectHoverIndex];
            console.log(`キャラクター選択 ホバー: ${previewCharacter} (インデックス: ${characterSelectHoverIndex})`);
        } else if (key === ' ' || keyCode === ENTER) { // Space or Enter to confirm
            if (characterSelectHoverIndex !== -1 && previewCharacter && previewCharacter !== 'URANUS') {
                selectedCharacter = previewCharacter;
                try {
                    loadCharacter(selectedCharacter);
                    resetGameState(); // resetGameState内でdefeatedBossesThisStageなどもクリアされる

                    // ▼▼▼ ステージ開始シナリオ呼び出しログ ▼▼▼
                    console.log(`[UI LOG] Attempting to start 'stageStart' scenario for char: ${selectedCharacter}, stage: ${currentStage}`);
                    if (startScenario('stageStart', selectedCharacter, currentStage)) {
                        // startScenario内でsetGameState('scenario')が呼ばれるので、ここでは不要
                        console.log("[UI LOG] 'stageStart' scenario started successfully (returned true).");
                    } else {
                        console.warn("[UI LOG] 'stageStart' scenario failed to start (returned false). Starting game directly.");
                        setGameState('playing'); // シナリオがなければゲーム開始
                    }
                    // ▲▲▲ ログ追加ここまで ▲▲▲
                    // console.log(`選択したキャラクター: ${selectedCharacter}, ステージ: ${currentStage}, 開始`); // このログはstartScenarioの結果で変わる
                } catch (err) {
                    console.error(`キャラクター選択エラー: ${err}`);
                    setGameState('playing'); // エラー時もとりあえずゲーム開始試行
                }
            }
        } else if (keyCode === ESCAPE) {
            setGameState('title');
            characterSelectHoverIndex = 0; 
            previewCharacter = null;
            console.log('キャラクター選択からタイトルへ');
        }
    }
    // --------------------
    // Playing / Boss Controls
    // --------------------
    else if (gameState === 'playing' || gameState === 'boss') {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'q' && !isScenarioActive()) {
            autoFire = !autoFire;
            console.log(`自動射撃: ${autoFire}`);
        } else if (lowerKey === 'g' && stageClearConditionMet) { // Gキーは小文字・大文字を許容
            console.log("離脱キー 'G' が押されました。ステージクリア条件達成済み。リザルト画面へ。");
            saveGameData();
            setGameState('result');
        } else if (keyCode === ESCAPE) {
            setGameState('paused');
            console.log('ゲームを一時停止しました');
        }
    }
    // --------------------
    // Paused Controls
    // --------------------
    else if (gameState === 'paused') {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'p' || keyCode === ESCAPE) {
            setGameState('playing');
            console.log('ゲームを再開しました');
        } else if (lowerKey === 'e' || lowerKey === 's' || lowerKey === 'd' || keyCode === DOWN_ARROW || keyCode === RIGHT_ARROW) {
            pauseHoverIndex = (pauseHoverIndex + 1) % pauseChoices.length;
            console.log(`ポーズ選択: ${pauseChoices[pauseHoverIndex].name}`);
        } else if (lowerKey === 'w' || lowerKey === 'a' || keyCode === UP_ARROW || keyCode === LEFT_ARROW) {
             pauseHoverIndex = (pauseHoverIndex - 1 + pauseChoices.length) % pauseChoices.length;
             console.log(`ポーズ選択: ${pauseChoices[pauseHoverIndex].name}`);
        } else if (key === ' ' || keyCode === ENTER) {
            if (pauseHoverIndex >= 0 && pauseChoices[pauseHoverIndex]) { // pauseChoices[pauseHoverIndex] の存在確認
                pauseChoices[pauseHoverIndex].action();
            }
        }
    }
    // --------------------
    // Level Up Controls
    // --------------------
    else if (gameState === 'levelUp') {
        const lowerKey = key.toLowerCase();
        if (levelUpChoices && levelUpChoices.length > 0) { // levelUpChoices の存在と長さを確認
            if (lowerKey === 'e' || lowerKey === 's' || lowerKey === 'd' || keyCode === DOWN_ARROW || keyCode === RIGHT_ARROW) {
                levelUpHoverIndex = (levelUpHoverIndex + 1) % levelUpChoices.length;
            } else if (lowerKey === 'w' || lowerKey === 'a' || keyCode === UP_ARROW || keyCode === LEFT_ARROW) {
                levelUpHoverIndex = (levelUpHoverIndex - 1 + levelUpChoices.length) % levelUpChoices.length;
                console.log(`レベルアップ選択: ${levelUpChoices[levelUpHoverIndex]?.name || 'N/A'}`);
            } else if (key === ' ' || keyCode === ENTER) {
                if (levelUpHoverIndex >= 0 && levelUpChoices[levelUpHoverIndex]) {
                    let upgrade = levelUpChoices[levelUpHoverIndex];
                    upgrade.level++;
                    if (typeof upgrade.effect === 'function') {
                        if (upgrade.effect.length === 0) {
                            upgrade.effect();
                        } else {
                            upgrade.effect(upgrade.level - 1);
                        }
                    }
                    setGameState('playing');
                    levelUpChoices = [];
                    levelUpHoverIndex = -1;
                    console.log(`選択した強化: ${upgrade.name}`);
                }
            }
            if (levelUpChoices[levelUpHoverIndex]) { // ホバーインデックス更新後のログ
                 console.log(`レベルアップ選択: ${levelUpChoices[levelUpHoverIndex].name}`);
            }
        }
        if (keyCode === ESCAPE) { // 常にキャンセルは可能
            setGameState('playing');
            levelUpChoices = [];
            levelUpHoverIndex = -1;
            console.log('レベルアップ選択をキャンセル');
        }
    }
    // --------------------
    // Scenario Controls (gameOver, recall, scenario)
    // --------------------
    else if (gameState === 'gameOver' || gameState === 'recall' || gameState === 'scenario') {
        if (isScenarioActive()) { // シナリオ再生中の共通操作
            if ((key === ' ' || keyCode === ENTER) && !showBacklog) {
                advanceScenario();
            } else if (key.toLowerCase() === 'c') {
                showBacklog = !showBacklog;
                console.log(`Backlog display: ${showBacklog}`);
            } else if (key.toLowerCase() === 'v' && !showBacklog) {
                toggleText();
            } else if (keyCode === ESCAPE) {
                endScenario();
            }
        } else { // シナリオがアクティブでない場合
            if (gameState === 'gameOver' && (key === ' ' || keyCode === ENTER)) {
                backToTitle();
            } else if (gameState === 'recall') { // Recall menu navigation
                if (recallScenarios && recallScenarios.length > 0) {
                    const lowerKey = key.toLowerCase();
                    const cols = 4; // 1行あたりのアイテム数

                    if (recallHoverIndex === -1) { // まだ何も選択されていない場合
                        if (lowerKey === 'w' || lowerKey === 's' || lowerKey === 'a' || lowerKey === 'd' ||
                            keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
                            recallHoverIndex = 0; // 最初のアイテムを選択
                        }
                    } else {
                    if (lowerKey === 'w' || keyCode === UP_ARROW) {
                            recallHoverIndex = max(0, recallHoverIndex - cols);
                    } else if (lowerKey === 's' || keyCode === DOWN_ARROW) {
                            recallHoverIndex = min(recallScenarios.length - 1, recallHoverIndex + cols);
                    } else if (lowerKey === 'a' || keyCode === LEFT_ARROW) {
                            recallHoverIndex = max(0, recallHoverIndex - 1);
                    } else if (lowerKey === 'd' || keyCode === RIGHT_ARROW) {
                            recallHoverIndex = min(recallScenarios.length - 1, recallHoverIndex + 1);
                        }
                    }

                    if ((key === ' ' || keyCode === ENTER) && recallHoverIndex >= 0 && recallHoverIndex < recallScenarios.length) {
                        const scenarioInfo = recallScenarios[recallHoverIndex];
                        if (scenarioInfo) {
                            const { character, species } = scenarioInfo;
                            const isViewed = saveData?.characters?.[character]?.scenarios?.gameOver?.[species] || false;
                            if (isViewed) {
                                selectedCharacter = character;
                                if (startScenario('gameOver', character, species)) {
                                    console.log(`回想再生開始: ${character} - ${species}`);
                                }
                            }
                        }
                    }
                    console.log(`回想選択: インデックス ${recallHoverIndex}`);
                }
                if (keyCode === ESCAPE) {
                    setGameState('title');
                    recallHoverIndex = -1;
                    console.log('回想モードからタイトルへ');
                }
            }
        }
    }
    // --------------------
    // Options Screen Controls
    // --------------------
    else if (gameState === 'options') {
        if (keyCode === ESCAPE) {
            setGameState('title');
            console.log('オプションからタイトルへ');
        }
    }
    // --------------------
    // Result Screen Controls
    // --------------------
    else if (gameState === 'result') {
        if (key === ' ' || keyCode === ENTER || keyCode === ESCAPE) {
            backToTitle();
        }
    }
}