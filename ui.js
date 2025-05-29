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

    // Display active upgrades
    let y = 50;
    if (window.upgrades) { // Check if upgrades is defined
        window.upgrades.forEach(u => {
            if (u.level > 0) {
                textAlign(RIGHT, TOP);
                text(`${u.name}: Lv${u.level}`, 1280 - 100, y);
                y += 20;
            }
        });
    }

    // AutoFire button
    fill(autoFire ? 100 : 50);
    rect(1180, 670, 100, 50);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("Q: AutoFire", 1230, 695);
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
        }
    }
}

function drawPaused() {
    fill(0, 0, 0, 150);
    rect(320, 0, 960, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("一時停止", 1280 / 2, 720 / 2);
    textSize(20);
    text("P: 再開", 1280 / 2, 720 / 2 + 50);
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
    fill(0, 0, 0, 150);
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("ゲームオーバー", 1280 / 2, 720 / 2 - 50);
    textSize(24);
    text(`最終スコア: ${score}`, 1280 / 2, 720 / 2);
    textSize(20);
    text("スペース: タイトルへ", 1280 / 2, 720 / 2 + 50);
}

function drawResult() {
    fill(0, 0, 0, 150);
    rect(0, 0, 1280, 720);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("ステージクリア!", 1280 / 2, 720 / 2 - 100);
    textSize(24);
    text(`スコア: ${score}`, 1280 / 2, 720 / 2 - 50);
    text(`撃破数: ${enemiesKilled}`, 1280 / 2, 720 / 2);
    text(`経過時間: ${floor(gameTime)}秒`, 1280 / 2, 720 / 2 + 50);
    textSize(20);
    text("スペース/クリック: タイトルへ", 1280 / 2, 720 / 2 + 100); // Fixed typo
}

function handleMousePressed() {
    if (gameState === 'characterSelect') {
        let characters = ['ANNA', 'TRACY', 'URANUS'];
        for (let i = 0; i < characters.length; i++) {
            let y = 200 + i * 100;
            if (mouseX >= 500 && mouseX <= 800 && mouseY >= y - 25 && mouseY <= y + 25) {
                if (characters[i] !== 'URANUS') {
                    previewCharacter = characters[i];
                    selectedCharacter = characters[i];
                    loadCharacter(selectedCharacter); // Ensure playerStats is initialized
                    setGameState('playing');
                    console.log(`選択したキャラクター: ${selectedCharacter}, 状態: playing`);
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
                break;
            }
        }
    } else if (gameState === 'gameOver' || gameState === 'result') {
        backToTitle();
    } else if (gameState === 'playing' && mouseX >= 1180 && mouseX <= 1280 && mouseY >= 670 && mouseY <= 720) {
        autoFire = !autoFire;
        console.log(`自動射撃: ${autoFire}`);
    }
}