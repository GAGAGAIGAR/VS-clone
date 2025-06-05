function updateEffects() {
    // 近接攻撃
    for (let i = meleeAttacks.length - 1; i >= 0; i--) {
        let attack = meleeAttacks[i];
        let t = (millis() - attack.time) / 500;
        if (t > 1) {
            meleeAttacks.splice(i, 1);
            continue;
        }
        for (let j = units.length - 1; j >= 0; j--) {
            let u = units[j];
            if (!u || unitsToRemove.has(j)) continue;
            let dist = p5.Vector.sub(u.pos, attack.pos).mag();
            if (dist < attack.radius) {
                let unitAngle = atan2(u.pos.y - attack.pos.y, u.pos.x - attack.pos.x);
                let angleDiff = abs((attack.angle - unitAngle + TWO_PI) % TWO_PI);
                if (angleDiff < PI / 2 || angleDiff > 3 * PI / 2) {
                    u.hp -= attack.damage;
                    damagePopups.push({
                        pos: u.pos.copy(),
                        text: attack.damage.toFixed(0),
                        time: millis()
                    });
                    if (u.hp <= 0) {
                        handleUnitDeath(u, j);
                    }
                }
            }
        }
    }

    // 弾処理用の unitsToRemove スナップショット
    const unitsToRemoveSnapshot = new Set(unitsToRemove);

    // ダメージ判定ヘルパー関数
    function canDamage(sourceAffiliation, targetAffiliation, isPlayer = false) {
        if (sourceAffiliation === 'none') return true; // noneは全てにダメージ
        if (isPlayer && targetAffiliation !== 'ally') return true; // プレイヤーへのダメージはally以外
        if (sourceAffiliation === 'enemy') {
            return ['enemy2', 'ally', 'none'].includes(targetAffiliation);
        } else if (sourceAffiliation === 'enemy2') {
            return ['enemy', 'ally', 'none'].includes(targetAffiliation);
        } else if (sourceAffiliation === 'ally') {
            return ['enemy', 'enemy2', 'none'].includes(targetAffiliation);
        }
        return false;
    }

    // 弾
    const maxIterations = 10000;
    let loopCounter = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (!p || !p.pos || !p.vel) {
            projectilesToRemove.add(i);
            if (debugLog && debugMode) {
                console.log(`Bullet ${i} removed: Invalid projectile`);
            }
            continue;
        }
        p.pos.add(p.vel);
        const mapSize = getStageConfig(currentStage).mapSize;
        if (p.pos.x < 0 || p.pos.x > mapSize.width || p.pos.y < 0 || p.pos.y > mapSize.height) {
            projectilesToRemove.add(i);
            if (debugLog && debugMode) {
                console.log(`Bullet ${i} removed: Out of bounds (x=${p.pos.x}, y=${p.pos.y})`);
            }
            continue;
        }
        if (p.sourceAffiliation === 'ally' && p.pos.dist(player.pos) > playerStats.attackRange) {
            projectilesToRemove.add(i);
            if (debugLog && debugMode) {
                console.log(`Bullet ${i} removed: Exceeded player attack range`);
            }
            continue;
        }
        if (p.origin && p.range && (!p.createdTime || millis() - p.createdTime > 16)) {
            let distanceTraveled = p.pos.dist(p.origin);
            if (distanceTraveled > p.range) {
                projectilesToRemove.add(i);
                if (debugLog && debugMode) {
                    console.log(`Bullet ${i} removed: Exceeded unit range`);
                }
                continue;
            }
        }
        // プレイヤーへのダメージ
        if (canDamage(p.sourceAffiliation, 'ally', true) && p.pos.dist(player.pos) < 25 && !playerStats.isInvincible) {
            if (p.sourceUnitType) {
                playerStats.lastDamageUnitType = p.sourceUnitType;
            }
            if (playerStats.shieldActive > 0) {
                playerStats.shieldActive--;
                playerStats.lastShield = millis();
                triggerAssaultArmor();
            } else {
                playerStats.hp -= p.damage;
                playerStats.isFlashing = true;
                playerStats.isInvincible = true;
                playerStats.flashStart = millis();
                triggerAssaultArmor();
                if (playerStats.hp <= 0) gameState = 'gameOver';
            }
            projectilesToRemove.add(i);
            if (debugLog && debugMode) {
                console.log(`Bullet ${i} removed: Hit player, sourceAffiliation=${p.sourceAffiliation}`);
            }
            continue;
        }
        // ユニットへのダメージ
        if (p.sourceAffiliation !== 'none') {
            for (let j = units.length - 1; j >= 0; j--) {
                if (unitsToRemoveSnapshot.has(j) || !units[j]) continue;
                let u = units[j];
                loopCounter++;
                if (loopCounter > maxIterations) {
                    if (debugLog && debugMode) {
                        console.log('Max iterations reached in bullet collision loop');
                    }
                    break;
                }
                if (!canDamage(p.sourceAffiliation, u.affiliation)) continue;
                let hitRadius = u.type === 'Z' ? 60 : 20;
                if (p5.Vector.sub(u.pos, p.pos).mag() < hitRadius) {
                    u.hp -= p.damage;
                    damagePopups.push({
                        pos: u.pos.copy(),
                        text: p.damage.toFixed(0),
                        time: millis()
                    });
                    if (playerStats.areaDamageRadius > 0) {
                        effectCircles.push({
                            pos: u.pos.copy(),
                            radius: playerStats.areaDamageRadius,
                            time: millis(),
                            maxRadius: playerStats.areaDamageRadius
                        });
                        const areaDamageSnapshot = new Set(unitsToRemoveSnapshot);
                        for (let k = units.length - 1; k >= 0; k--) {
                            if (areaDamageSnapshot.has(k) || !units[k] || k === j) continue;
                            loopCounter++;
                            if (loopCounter > maxIterations) {
                                if (debugLog && debugMode) {
                                    console.log('Max iterations reached in area damage loop');
                                }
                                break;
                            }
                            if (canDamage(p.sourceAffiliation, units[k].affiliation) &&
                                p5.Vector.sub(u.pos, units[k].pos).mag() < playerStats.areaDamageRadius) {
                                units[k].hp -= playerStats.attack * 2;
                                damagePopups.push({
                                    pos: units[k].pos.copy(),
                                    text: (playerStats.attack * 2).toFixed(0),
                                    time: millis()
                                });
                                if (units[k].hp <= 0) {
                                    handleUnitDeath(units[k], k);
                                }
                            }
                        }
                    }
                    if (u.hp <= 0) {
                        handleUnitDeath(u, j);
                    }
                    if (isFinite(p.pierce)) {
                        p.pierce--;
                        if (p.pierce <= 0) {
                            projectilesToRemove.add(i);
                            if (debugLog && debugMode) {
                                console.log(`Bullet ${i} removed: Pierce count exhausted`);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    // 敵との接触
    loopCounter = 0;
    const contactSnapshot = new Set(unitsToRemove);
    for (let i = units.length - 1; i >= 0; i--) {
        if (contactSnapshot.has(i) || !units[i]) continue;
        let u = units[i];
        loopCounter++;
        if (loopCounter > maxIterations) {
            if (debugLog && debugMode) {
                console.log('Max iterations reached in contact loop');
            }
            break;
        }
        if (canDamage(u.affiliation, 'ally', true) && p5.Vector.sub(player.pos, u.pos).mag() < 25 && !playerStats.isInvincible) {
            playerStats.lastDamageUnitType = u.type;
            let damage = u.contactDamage;
            if (playerStats.shieldActive > 0) {
                playerStats.shieldActive--;
                playerStats.lastShield = millis();
                u.hp -= playerStats.attack;
                damagePopups.push({
                    pos: u.pos.copy(),
                    text: playerStats.attack.toFixed(0),
                    time: millis()
                });
                triggerAssaultArmor();
                if (u.hp <= 0) {
                    handleUnitDeath(u, i);
                }
            } else {
                playerStats.hp -= damage;
                playerStats.isFlashing = true;
                playerStats.isInvincible = true;
                playerStats.flashStart = millis();
                triggerAssaultArmor();
                if (playerStats.hp <= 0) gameState = 'gameOver';
            }
        }
    }

    // 毒沼
    loopCounter = 0;
    const poisonSnapshot = new Set(unitsToRemove);
    for (let swamp of poisonSwamps) {
        for (let j = units.length - 1; j >= 0; j--) {
            if (poisonSnapshot.has(j) || !units[j]) continue;
            let u = units[j];
            loopCounter++;
            if (loopCounter > maxIterations) {
                if (debugLog && debugMode) {
                    console.log('Max iterations reached in poison swamp loop');
                }
                break;
            }
            if (canDamage('ally', u.affiliation) && p5.Vector.sub(swamp.pos, u.pos).mag() < swamp.radius) u.poisoned = true;
            if (u.poisoned && millis() - u.lastPoisonDamage > 2000) {
                let damage = playerStats.attack * playerStats.poisonSwampDamageMultiplier;
                u.hp -= damage;
                damagePopups.push({
                    pos: u.pos.copy(),
                    text: damage.toFixed(0),
                    time: millis()
                });
                u.lastPoisonDamage = millis();
                if (u.hp <= 0) {
                    handleUnitDeath(u, j);
                }
            }
        }
    }

    // 経験値アイテム
    for (let i = expItems.length - 1; i >= 0; i--) {
        let item = expItems[i];
        let dist = p5.Vector.sub(player.pos, item.pos).mag();
        if (dist < playerStats.collectRange) {
            item.speed *= 1.05;
            item.vel = p5.Vector.sub(player.pos, item.pos).normalize().mult(item.speed);
            item.pos.add(item.vel);
            if (dist < 10) {
                playerStats.exp++;
                score += 10;
                expItems.splice(i, 1);
                if (playerStats.exp >= playerStats.expToNext) levelUp();
                continue;
            }
        }
    }

    // 削除処理
    ([...projectilesToRemove].sort((a, b) => b - a)).forEach(i => {
        if (i >= 0 && i < projectiles.length) {
            projectiles.splice(i, 1);
        } else {
            if (debugLog && debugMode) {
                console.log(`Invalid projectile index ${i} skipped`);
            }
        }
    });
    projectilesToRemove.clear();
}

function getCameraPosition() {
    const mapSize = getStageConfig(currentStage).mapSize;
    const viewportWidth = 960;
    const viewportHeight = 720;

    let cameraX = player.pos.x - viewportWidth / 2;
    let cameraY = player.pos.y - viewportHeight / 2;

    cameraX = constrain(cameraX, 0, mapSize.width - viewportWidth);
    cameraY = constrain(cameraY, 0, mapSize.height - viewportHeight);

    return { cameraX, cameraY };
}

function drawMap() {
    push();
    const mapSize = getStageConfig(currentStage).mapSize;
    const { cameraX, cameraY } = getCameraPosition();

    translate(-cameraX, -cameraY);

    fill(0);
    if (cameraX > 0) rect(-1000, -1000, 1000 + cameraX, 1000 + mapSize.height + 1000);
    if (cameraX < mapSize.width - 960) rect(cameraX + 960, -1000, 1000, 1000 + mapSize.height + 1000);
    if (cameraY > 0) rect(-1000, -1000, 1000 + mapSize.width + 1000, 1000 + cameraY);
    if (cameraY < mapSize.height - 720) rect(-1000, cameraY + 720, 1000 + mapSize.width + 1000, 1000);

    stroke(255);
    noFill();
    rect(0, 0, mapSize.width, mapSize.height);

    if (debugLog && debugMode) {
        fill(255);
        textSize(12);
        textAlign('left', 'top');
        text(`Map: ${mapSize.width}x${mapSize.height}`, player.pos.x - cameraX + 10, player.pos.y - cameraY + 10);
        text(`Camera: (${floor(cameraX)},${floor(cameraY)})`, player.pos.x - cameraX + 10, player.pos.y - cameraY + 30);
    }

    pop();
}

function drawPlayer() {
    push();
    const { cameraX, cameraY } = getCameraPosition();
    translate(-cameraX, -cameraY);

    if (spriteSheets[selectedCharacter] && frameCounts[selectedCharacter] > 0) {
        updateAnimation(playerStats, frameCounts[selectedCharacter]);
        push();
        translate(player.pos.x, player.pos.y);
        let scaleX = player.vel.x < 0 ? -1 : 1;
        scale(scaleX, 1);
        if (playerStats.isFlashing && floor((millis() - playerStats.flashStart) / 100) % 2 === 0) {
        } else {
            image(spriteSheets[selectedCharacter], -24, -24, 48, 48, playerStats.currentFrame * 48, 0, 48, 48);
        }
        pop();
    } else {
        fill(255);
        if (playerStats.isFlashing && floor((millis() - playerStats.flashStart) / 100) % 2 === 0) {
            ellipse(player.pos.x, player.pos.y, 20, 20);
        } else if (!playerStats.isFlashing) {
            ellipse(player.pos.x, player.pos.y, 20, 20);
        }
    }

    pop();
}

function drawOtherEffects() {
    push();
    const { cameraX, cameraY } = getCameraPosition();
    translate(-cameraX, -cameraY);

    if (playerStats.slowField > 0) {
        fill(0, 0, 255, 50);
        ellipse(player.pos.x, player.pos.y, playerStats.slowField * 2);
    }

    if (playerStats.shieldActive > 0) {
        fill(128, 0, 128, 100);
        stroke(255);
        strokeWeight(1);
        ellipse(player.pos.x, player.pos.y, 50, 50);
        noStroke();
    }

    // ▼▼▼ ビット描画処理をここに追加 ▼▼▼
    const spriteSize = 48; //

    // 攻撃ビットの描画
    if (playerStats.bits > 0 && spriteSheets['roundBit'] && spriteSheets['roundBit'].width) { //
        const numFrames = frameCounts['roundBit'] || 1; //
        bits.forEach((bit, i) => { //
            let angle = bitSystemAngle + (i * (TWO_PI / playerStats.bits)); //
            let x = player.pos.x + cos(angle) * 50; //
            let y = player.pos.y + sin(angle) * 50; //
            // bit.frame は updatePlayer で更新済み
            const frameX = floor(bit.frame) * spriteSize; //

            push(); //
            translate(x, y); //
            rotate(angle + PI / 2); //
            image(spriteSheets['roundBit'], -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize, frameX, 0, spriteSize, spriteSize); //
            pop(); //
        });
    } else if (playerStats.bits > 0 && debugLog && debugMode && (gameState === 'playing' || gameState === 'boss')) { //
        console.warn("drawOtherEffects: spriteSheets['roundBit'] is not ready or not found for drawing."); //
    }

    // 射撃ビットの描画
    if (playerStats.shootingBits > 0 && spriteSheets['shootBit'] && spriteSheets['shootBit'].width) { //
        const numFrames = frameCounts['shootBit'] || 1; //
        shootingBits.forEach((bit, i) => { //
            let orbitalAngle = shootingBitSystemAngle + (i * (TWO_PI / playerStats.shootingBits)); //
            let x = player.pos.x + cos(orbitalAngle) * 50; //
            let y = player.pos.y + sin(orbitalAngle) * 50; //
            const frameX = floor(bit.frame) * spriteSize; //

            push(); //
            translate(x, y); //
            // rotate(orbitalAngle + PI / 2); // この行をコメントアウトまたは削除して、ビットが軌道に合わせて回転しないようにする
            // 必要であれば、スプライト自体が正立するための固定の回転をここに追加します。例: rotate(0); や rotate(-PI/2); など
            // ここでは、スプライト画像が元々正立していると仮定し、追加の回転は行いません。
            image(spriteSheets['shootBit'], -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize, frameX, 0, spriteSize, spriteSize); //
            pop(); //
        });
    } else if (playerStats.shootingBits > 0 && debugLog && debugMode && (gameState === 'playing' || gameState === 'boss')) { //
        console.warn("drawOtherEffects: spriteSheets['shootBit'] is not ready or not found for drawing."); //
    }
    // ▲▲▲ ビット描画処理ここまで ▲▲▲

    for (let attack of meleeAttacks) {
        let t = (millis() - attack.time) / 500;
        let alpha = 100 * (1 - t);
        fill(255, 0, 0, alpha);
        arc(attack.pos.x, attack.pos.y, attack.radius * 2, attack.radius * 2, attack.angle - PI / 2, attack.angle + PI / 2);
    }

    for (let item of expItems) {
        fill(0, 0, 255);
        ellipse(item.pos.x, item.pos.y, 10, 10);
    }

    for (let popup of damagePopups) {
        fill(255, 255, 0);
        textSize(16);
        text(popup.text, popup.pos.x, popup.pos.y);
        popup.pos.y -= 1;
        if (millis() - popup.time > 1000) damagePopups.splice(damagePopups.indexOf(popup), 1);
    }

    for (let circle of effectCircles) {
        let t = (millis() - circle.time) / 300;
        let scale = t < 0.5 ? t * 2 : 1;
        fill(255, 165, 0, 100 * (1 - t));
        ellipse(circle.pos.x, circle.pos.y, circle.maxRadius * 2 * scale);
        if (millis() - circle.time > 300) effectCircles.splice(effectCircles.indexOf(circle), 1);
    }

    for (let swamp of poisonSwamps) {
        fill(0, 128, 0, 100);
        ellipse(swamp.pos.x, swamp.pos.y, swamp.radius * 2);
        if (millis() - swamp.time > 4000) poisonSwamps.splice(poisonSwamps.indexOf(swamp), 1);
    }

    if (millis() - rushEffectTime < 1000) {
        fill(255, 0, 0, 150);
        rect(player.pos.x, player.pos.y +40, 100, 40);
        fill(255);
        stroke(255);
        strokeWeight(2);
        textSize(32);
        text("RUSH", player.pos.x + 10, player.pos.y + 40);
        noStroke();
    }

    pop();
}

function drawBullets() {
    push();
    const { cameraX, cameraY } = getCameraPosition();
    translate(-cameraX, -cameraY);
    for (let p of projectiles) {
        if (p.sourceAffiliation !== 'ally') continue;
        fill(255, 255, 0);
        let bulletSize = 10 * playerStats.bulletSizeScale;
        ellipse(p.pos.x, p.pos.y, bulletSize, bulletSize);
    }
    pop();
}

function drawUnitBullets() {
    push();
    const { cameraX, cameraY } = getCameraPosition();
    translate(-cameraX, -cameraY);
    for (let p of projectiles) {
        if (p.sourceAffiliation === 'ally') continue;
        push();
        translate(p.pos.x, p.pos.y);
        let angle = atan2(p.vel.y, p.vel.x) - PI / 2;
        rotate(angle);
        
        if (p.sourceUnitType === 'D' && p.shape === 'spindle') {
            fill(0, 255, 255);
            noStroke();
            beginShape();
            vertex(0, -12);
            vertex(3, -6);
            vertex(3, 6);
            vertex(0, 12);
            vertex(-3, 6);
            vertex(-3, -6);
            endShape(CLOSE);
        } else {
            fill(255, 0, 0);
            const bulletWidth = 5;
            const bulletHeight = 15;
            rect(-bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight);
        }
        pop();
    }
    pop();
}