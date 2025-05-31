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
let scenarioStarted = false;
let recallHoverIndex = -1;
let recallScenarios = [];

function drawUI() {
    resetMatrix();
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);
    text(`Stage: ${currentStage}`, 100, 30);
    text(`Score: ${score}`, 100, 50);
    text(`Level: ${playerStats.level || 'N/A'} Exp: ${playerStats.exp || 0}/${playerStats.expToNext || 'N/A'}`, 100, 70);
    text(`HP: ${playerStats.hp || 'N/A'}`, 100, 90);
    if (playerStats.shieldActive) text(`Shield: ${playerStats.shieldActive}`, 100, 110);
    let stageConfig = getStageConfig(currentStage);
    text(`Time: ${floor(gameTime)}/${stageConfig.duration}`, 1280 - 100, 30);
    textAlign(CENTER, TOP);
    text(`Next Rush: ${rushThreshold - rushEnemiesKilled} kills`, 1280 / 2, 720 - 50);
    text(`Last Rush: ${lastRushSpawnCount} enemies`, 1280 / 2, 720 - 30);

    let y = 50;
    if (window.upgrades) {
        window.upgrades.forEach(u => {
            if (u.level > 0) {
                textAlign(RIGHT, TOP);
                text(`${u.name}: Lv${u.level}`, 1280 - 100, y);
                y += 20;
            }
        });
    }

    textAlign(RIGHT, TOP);
    text(`Last Damage Enemy: ${playerStats.lastDamageEnemyType || 'None'}`, 1280 - 100, y);
    y += 20;

    fill(autoFire ? 100 : 50);
    rect(1180, 670, 100, 50);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("Q: AutoAim", 1230, 695);
}

function drawCharacterSelect() {
    background(0);
    fill(0, 0, 0, 240);
    rect(320, 0, 960, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("キャラクターを選択", 1280 / 2, 100);
    textSize(24);
    text("W/S: 選択, Space/Click: 決定", 1280 / 2, 625);
    textAlign(LEFT, CENTER);

    let characters = ['ANNA', 'TRACY', 'URANUS'];
    for (let i = 0; i < characters.length; i++) {
        let y = 200 + i * 100;
        if (mouseX >= 500 && mouseX <= 800 && mouseY >= y - 25 && mouseY <= y + 25) {
            stroke(255, 255, 0);
            strokeWeight(2);
        } else {
            noStroke();
        }
        fill(previewCharacter === characters[i] ? 100 : 50);
        rect(500, y - 25, 300, 50);
        fill(255);
        text(characters[i], 550, y);
        if (characters[i] === 'URANUS') {
            fill(150);
            text("(ロック済み)", 650, y);
        } else {
            let highScore = saveData.characters[characters[i]]?.stages?.[1]?.highScore || 0;
            fill(200);
            text(`High Score: ${highScore}`, 650, y + 20);
        }
    }
}

function drawPaused() {
    fill(0, 0, 0, 150);
    rect(320, 0, 960, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("一時停止", 1280 / 2, 720 / 2 - 100);
    textSize(20);
    text("ESC/P: 再開, E: 選択, Space: 決定", 1280 / 2, 720 / 2 + 150);

    for (let i = 0; i < pauseChoices.length; i++) {
        let x = 1280 / 2;
        let y = 720 / 2 - 20 + i * 60;
        fill(i === pauseHoverIndex ? 100 : 50);
        stroke(255);
        strokeWeight(2);
        rect(x - 100, y - 25, 200, 50);
        fill(255);
        noStroke();
        textSize(20);
        textAlign(CENTER, CENTER);
        text(pauseChoices[i].name, x, y);
    }
}

function drawLevelUp() {
    fill(0, 0, 0, 150);
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("レベルアップ！ 強化を選択:", 640, 720 / 2 - 200);
    stroke(255);
    strokeWeight(2);
    const maxPerCol = 5;
    const numCols = Math.ceil(levelUpChoices.length / maxPerCol);
    for (let i = 0; i < levelUpChoices.length; i++) {
        let col = Math.floor(i / maxPerCol);
        let row = i % maxPerCol;
        let x = 1280 / 2 + (col - Math.floor(numCols / 2)) * 350;
        let y = 720 / 2 - 100 + row * 60;
        fill(i === levelUpHoverIndex ? 100 : 50);
        rect(x - 150, y - 25, 300, 50);
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
    text("E: 選択, Space: 決定", 330, 20);
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
        console.warn('Scenario data not loaded yet');
        gameOverDiv.style.display = 'block';
        fallbackGameOver();
        return;
    }

    if (isScenarioActive()) {
        // シナリオが再生中の場合
        gameOverDiv.style.display = 'none';
        updateScenario();
        drawScenario();
        if (showBacklog) drawBacklog();
    } else if (selectedCharacter && !scenarioStarted) {
        // シナリオが未開始でキャラクターが選択されている場合
        let species = playerStats.lastDamageEnemyType && enemyTypes[playerStats.lastDamageEnemyType]
            ? enemyTypes[playerStats.lastDamageEnemyType].species || 'default'
            : 'default';
        console.log(`Attempting scenario: character=${selectedCharacter}, species=${species}, lastDamageEnemyType=${playerStats.lastDamageEnemyType}`);
        if (startScenario('gameOver', selectedCharacter, species)) {
            scenarioStarted = true;
            gameOverDiv.style.display = 'none';
        } else {
            gameOverDiv.style.display = 'block';
            scenarioStarted = false; // シナリオ開始失敗時にリセット
            fallbackGameOver();
        }
    } else {
        // シナリオが終了または開始できない場合
        gameOverDiv.style.display = 'block';
        fallbackGameOver();
    }
}

function fallbackGameOver() {
    fill(0, 0, 0, 150);
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("ゲームオーバー", 1280 / 2, 720 / 2 - 100);
    textSize(24);
    text(`最終スコア: ${score}`, 1280 / 2, 720 / 2 - 50);
    
    textSize(20);
    if (playerStats.lastDamageEnemyType && enemyTypes[playerStats.lastDamageEnemyType]) {
        const species = enemyTypes[playerStats.lastDamageEnemyType].species || 'Unknown';
        text(`倒した敵: ${species}`, 1280 / 2, 720 / 2);
        const spriteKey = `enemy_${playerStats.lastDamageEnemyType}`;
        const spriteSheet = spriteSheets[spriteKey];
        if (spriteSheet && spriteSheet.width) {
            image(spriteSheet, 1280 / 2 - 24, 720 / 2 + 30, 48, 48, 0, 0, 48, 48);
        }
    } else {
        text("倒した敵: 不明", 1280 / 2, 720 / 2);
    }
    
    if (selectedCharacter && saveData.characters[selectedCharacter]) {
        let highScore = saveData.characters[selectedCharacter].stages[currentStage]?.highScore || 0;
        text(`ハイスコア: ${highScore}`, 1280 / 2, 720 / 2 + 60);
        let scenarioStatus = saveData.characters[selectedCharacter].scenarios?.gameOver || {};
        let completedScenarios = Object.keys(scenarioStatus).filter(s => scenarioStatus[s]).join(', ');
        if (completedScenarios) {
            text(`閲覧済シナリオ: ${completedScenarios}`, 1280 / 2, 720 / 2 + 80);
        }
    }
    
    text("スペース: タイトルへ", 1280 / 2, 720 / 2 + 100);
}

function drawRecall() {
    background(0);
    fill(0, 0, 0, 240);
    rect(100, 0, 1080, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("回想モード", 1280 / 2, 60);
    textSize(20);
    text("W/S: 選択, Space/Click: 再生, ESC: タイトルへ", 1280 / 2, 650);

    if (debugLog && debugMode) {
        console.log(`drawRecall: recallScenarios.length=${recallScenarios.length}, scenarioDataLoaded=${scenarioDataLoaded}`);
    }

    if (!scenarioDataLoaded) {
        fill(255);
        textSize(24);
        text("シナリオデータ読み込み中...", 1280 / 2, 720 / 2);
        return;
    }

    if (!recallScenarios.length) {
        fill(255);
        textSize(24);
        text("シナリオがありません", 1280 / 2, 720 / 2);
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

        const isViewed = saveData.characters[recallScenarios[i].character]?.scenarios?.gameOver?.[recallScenarios[i].species] || false;

        if (mouseX >= x && mouseX <= x + thumbWidth && mouseY >= y && mouseY <= y + thumbHeight) {
            stroke(255, 255, 0);
            strokeWeight(2);
            recallHoverIndex = i;
        } else if (i === recallHoverIndex && !(mouseX >= x && mouseX <= x + thumbWidth && mouseY >= y && mouseY <= y + thumbHeight)) {
            recallHoverIndex = -1;
        }

        const thumbnail = scenarioData.events.gameOver[recallScenarios[i].character][recallScenarios[i].species].thumbnail;
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
            fill(50);
            rect(x, y, thumbWidth, thumbHeight);
            fill(255);
            textSize(12);
            textAlign(CENTER, CENTER);
            text(thumbnail ? "画像読み込み中..." : "No Image", x + thumbWidth / 2, y + thumbHeight / 2);
            console.log(`Thumbnail missing or not loaded: ${thumbnail}, character=${recallScenarios[i].character}, species=${recallScenarios[i].species}`);
        }

        fill(255);
        textSize(14);
        textAlign(CENTER, TOP);
        text(`${recallScenarios[i].character} - ${recallScenarios[i].species}`, x + thumbWidth / 2, y + thumbHeight + 5);

        noStroke();
    }
}

function handleMousePressed() {
    if (gameState === 'characterSelect') {
        let characters = ['ANNA', 'TRACY', 'URANUS'];
        for (let i = 0; i < characters.length; i++) {
            let y = 200 + i * (100);
            if (mouseX >= 500 && mouseX <= 800 && mouseY >= y - 25 && mouseY <= y + 25) {
                if (characters[i] !== 'URANUS') {
                    previewCharacter = characters[i];
                    selectedCharacter = characters[i];
                    loadCharacter(selectedCharacter);
                    setGameState('playing');
                    console.log(`選択したキャラクター: ${selectedCharacter}, 状態: playing`);
                    return;
                }
                break;
            }
        }
    } else if (gameState === 'levelUp') {
        const maxPerCol = 5;
        const numCols = Math.ceil(levelUpChoices.length / maxPerCol);
        for (let i = 0; i < levelUpChoices.length; i++) {
            let col = Math.floor(i / maxPerCol);
            let row = i % maxPerCol;
            let x = 1280 / 2 + (col - Math.floor(numCols / 2)) * 350;
            let y = 720 / 2 - 100 + row * 60;
            if (mouseX >= x - 150 && mouseX <= x + 150 && mouseY >= y - 25 && mouseY <= y + 25) {
                let upgrade = levelUpChoices[i];
                upgrade.level++;
                if (typeof upgrade.effect === 'function') {
                    if (upgrade.effect.length === 0) {
                        upgrade.effect();
                    } else {
                        upgrade.effect(upgrade.level - 1);
                    }
                }
                gameState = 'playing';
                levelUpChoices = [];
                levelUpHoverIndex = -1;
                console.log(`選択した強化: ${upgrade.name}`);
                return;
            }
        }
    } else if (gameState === 'paused') {
        for (let i = 0; i < pauseChoices.length; i++) {
            let x = 1280 / 2;
            let y = 720 / 2 - 20 + i * 60;
            if (mouseX >= x - 100 && mouseX <= x + 100 && mouseY >= y - 25 && mouseY <= y + 25) {
                pauseChoices[i].action();
                console.log(`選択したポーズオプション: ${pauseChoices[i].name}`);
                return;
            }
        }
    } else if (gameState === 'gameOver' && isScenarioActive()) {
        advanceScenario();
        return;
    } else if (gameState === 'gameOver' && !isScenarioActive()) {
        backToTitle();
        return;
    } else if (gameState === 'result') {
        return;
    } else if (gameState === 'playing' && mouseX >= 1180 && mouseX <= 1280 && mouseY >= 670 && mouseY <= 720) {
        autoFire = !autoFire;
        console.log(`自動射撃: ${autoFire}`);
        return;
    } else if (gameState === 'recall') {
        if (isScenarioPlaying) {
            advanceScenario();
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

            if (mouseX >= x && mouseX <= x + thumbWidth && mouseY >= y && mouseY <= y + thumbHeight) {
                const { character, species } = recallScenarios[i];
                const isViewed = saveData.characters[character]?.scenarios?.gameOver?.[species] || false;
                if (isViewed) {
                    selectedCharacter = character;
                    if (startScenario('gameOver', character, species)) {
                        scenarioStarted = true;
                        console.log(`再生開始: ${character} - ${species}`);
                    }
                }
                return;
            }
        }
    }
}

function keyPressed() {
    if (gameState === 'paused') {
        if (key === 'p' || key === 'P' || keyCode === ESCAPE) {
            setGameState('playing');
            console.log('ゲームを再開しました');
            return;
        } else if (key === 'e' || key === 'E') {
            pauseHoverIndex = (pauseHoverIndex + 1) % pauseChoices.length;
            console.log(`ポーズ選択: ${pauseChoices[pauseHoverIndex].name}`);
            return;
        } else if (key === ' ') {
            if (pauseHoverIndex >= 0) {
                pauseChoices[pauseHoverIndex].action();
                console.log(`選択したポーズオプション: ${pauseChoices[pauseHoverIndex].name}`);
            }
            return;
        }
    }
    if (keyCode === ESCAPE) {
        if (gameState === 'playing' || gameState === 'boss') {
            setGameState('paused');
            console.log('ゲームを一時停止しました');
            return;
        } else if (gameState === 'recall') {
            setGameState('title');
            console.log('回想モードからタイトルへ');
            return;
        }
    }

    if (gameState === 'characterSelect') {
        if (key === 'w' || key === 'W') {
            previewCharacter = previewCharacter === 'ANNA' ? 'TRACY' : 'ANNA';
            console.log(`プレビューキャラクター: ${previewCharacter}`);
        } else if (key === 's' || key === 'S') {
            previewCharacter = previewCharacter === 'TRACY' ? 'ANNA' : 'TRACY';
            console.log(`プレビューキャラクター: ${previewCharacter}`);
        } else if (key === ' ') {
            if (previewCharacter && previewCharacter !== 'URANUS') {
                selectedCharacter = previewCharacter;
                loadCharacter(selectedCharacter);
                setGameState('playing');
                const canvas = document.querySelector('canvas');
                if (canvas) canvas.style.display = 'block';
                console.log(`選択したキャラクター: ${selectedCharacter}, 状態: playing`);
            }
        }
    } else if (gameState === 'playing' && (key === 'q' || key === 'Q') && !isScenarioActive()) {
        autoFire = !autoFire;
        console.log(`自動射撃: ${autoFire}`);
    } else if (gameState === 'levelUp') {
        if (key === 'e' || key === 'E') {
            levelUpHoverIndex = (levelUpHoverIndex + 1) % levelUpChoices.length;
            console.log(`レベルアップ選択: ${levelUpChoices[levelUpHoverIndex].name}`);
        } else if (key === ' ') {
            if (levelUpHoverIndex >= 0) {
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
    } else if (gameState === 'result' && key === ' ') {
        backToTitle();
    } else if (gameState === 'gameOver') {
        if (key === ' ' && isScenarioActive() && !showBacklog) {
            advanceScenario();
        } else if (key === 'c' || key === 'C') {
            showBacklog = !showBacklog;
            console.log(`Backlog display: ${showBacklog}`);
        } else if (key === 'v' || key === 'V' && !showBacklog) {
            toggleText();
        } else if (key === ' ' && !isScenarioActive()) {
            if (previousGameState === 'recall') {
                setGameState('recall');
                scenarioStarted = false;
                console.log('シナリオ終了後、回想モードに戻る');
            } else {
                backToTitle();
                scenarioStarted = false;
            }
        }
    } else if (gameState === 'recall') {
        if (isScenarioPlaying) {
            if (key === ' ' && !showBacklog) {
                advanceScenario();
            } else if (key === 'c' || key === 'C') {
                showBacklog = !showBacklog;
                console.log(`Backlog display: ${showBacklog}`);
            } else if (key === 'v' || key === 'V' && !showBacklog) {
                toggleText();
            }
            return;
        }
        if (key === 'w' || key === 'W') {
            recallHoverIndex = recallHoverIndex <= 0 ? recallScenarios.length - 1 : recallHoverIndex - 1;
            console.log(`回想選択: ${recallScenarios[recallHoverIndex].character} - ${recallScenarios[recallHoverIndex].species}`);
        } else if (key === 's' || key === 'S') {
            recallHoverIndex = recallHoverIndex >= recallScenarios.length - 1 ? 0 : recallHoverIndex + 1;
            console.log(`回想選択: ${recallScenarios[recallHoverIndex].character} - ${recallScenarios[recallHoverIndex].species}`);
        } else if (key === ' ') {
            if (recallHoverIndex >= 0) {
                const { character, species } = recallScenarios[recallHoverIndex];
                const isViewed = saveData.characters[character]?.scenarios?.gameOver?.[species] || false;
                if (isViewed) {
                    selectedCharacter = character;
                    if (startScenario('gameOver', character, species)) {
                        scenarioStarted = true;
                        console.log(`再生開始: ${character} - ${species}`);
                    }
                }
            }
        }
    }
}