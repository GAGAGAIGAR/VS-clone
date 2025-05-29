function updateEffects() {
    // 近接攻撃
    for (let i = meleeAttacks.length - 1; i >= 0; i--) {
        let attack = meleeAttacks[i];
        let t = (millis() - attack.time) / 500;
        if (t > 1) {
            meleeAttacks.splice(i, 1);
            continue;
        }
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (!e || enemiesToRemove.has(j)) {
                continue;
            }
            let dist = p5.Vector.sub(e.pos, attack.pos).mag();
            if (dist < attack.radius) {
                let enemyAngle = atan2(e.pos.y - attack.pos.y, e.pos.x - attack.pos.x);
                let angleDiff = abs((attack.angle - enemyAngle + TWO_PI) % TWO_PI);
                if (angleDiff < PI / 2 || angleDiff > 3 * PI / 2) {
                    e.hp -= attack.damage;
                    damagePopups.push({
                        pos: e.pos.copy(),
                        text: attack.damage.toFixed(0),
                        time: millis()
                    });
                    if (debugLog && debugMode) {
                        console.log(`Melee hit: enemy index=${j}, damage=${attack.damage}, hp=${e.hp}`);
                    }
                    if (e.hp <= 0) {
                        if (debugLog && debugMode) {
                            console.log(`Calling handleEnemyDeath: index=${j}, source=melee`);
                        }
                        handleEnemyDeath(e, j);
                    }
                }
            }
        }
    }

    // 弾
    const maxIterations = 10000;
    let loopCounter = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.pos.add(p.vel);
        if (p.pos.x < 0 || p.pos.x > 5000 || p.pos.y < 0 || p.pos.y > 3500 ||
            (!p.enemy && p.pos.dist(player.pos) > playerStats.attackRange)) {
            projectilesToRemove.add(i);
            continue;
        }
        if (p.enemy && p.origin && p.range) {
            let distanceTraveled = p.pos.dist(p.origin);
            if (distanceTraveled > p.range) {
                projectilesToRemove.add(i);
                continue;
            }
        }
        if (p.enemy && p.pos.dist(player.pos) < 25 && !playerStats.isInvincible) {
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
        }
        if (!p.enemy) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (!e || enemiesToRemove.has(j)) {
                    if (debugLog && debugMode) {
                        console.log(`Skipping projectile hit: enemy index=${j}, inRemoveSet=${enemiesToRemove.has(j)}`);
                    }
                    continue;
                }
                loopCounter++;
                if (loopCounter > maxIterations) break;
                let hitRadius = e.type == 'Z' ? 60 : 20;
                if (p5.Vector.sub(e.pos, p.pos).mag() < hitRadius) {
                    e.hp -= p.damage;
                    damagePopups.push({
                        pos: e.pos.copy(),
                        text: p.damage.toFixed(0),
                        time: millis()
                    });
                    if (debugLog && debugMode) {
                        console.log(`Projectile hit: enemy index=${j}, damage=${p.damage}, hp=${e.hp}`);
                    }
                    if (playerStats.areaDamageRadius > 0) {
                        effectCircles.push({
                            pos: e.pos.copy(),
                            radius: playerStats.areaDamageRadius,
                            time: millis(),
                            maxRadius: playerStats.areaDamageRadius
                        });
                        for (let k = enemies.length - 1; k >= 0; k--) {
                            if (!enemies[k] || k == j || enemiesToRemove.has(k)) continue;
                            loopCounter++;
                            if (loopCounter > maxIterations) break;
                            if (p5.Vector.sub(e.pos, enemies[k].pos).mag() < playerStats.areaDamageRadius) {
                                enemies[k].hp -= playerStats.attack * 2;
                                damagePopups.push({
                                    pos: enemies[k].pos.copy(),
                                    text: (playerStats.attack * 2).toFixed(0),
                                    time: millis()
                                });
                                if (debugLog && debugMode) {
                                    console.log(`Area damage hit: enemy index=${k}, damage=${playerStats.attack * 2}, hp=${enemies[k].hp}`);
                                }
                                if (enemies[k].hp <= 0) {
                                    if (debugLog && debugMode) {
                                        console.log(`Calling handleEnemyDeath: index=${k}, source=areaDamage`);
                                    }
                                    handleEnemyDeath(enemies[k], k);
                                }
                            }
                        }
                    }
                    if (e.hp <= 0) {
                        if (debugLog && debugMode) {
                            console.log(`Calling handleEnemyDeath: index=${j}, source=projectile`);
                        }
                        handleEnemyDeath(e, j);
                    }
                    if (isFinite(p.pierce)) {
                        p.pierce--;
                        if (p.pierce <= 0) {
                            projectilesToRemove.add(i);
                            break;
                        }
                    }
                }
            }
        }
    }

    // 敵との接触
    loopCounter = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (!e || enemiesToRemove.has(i)) {
            if (debugLog && debugMode) {
                console.log(`Skipping contact: enemy index=${i}, inRemoveSet=${enemiesToRemove.has(i)}`);
            }
            continue;
        }
        if (p5.Vector.sub(player.pos, e.pos).mag() < 25 && !playerStats.isInvincible) {
            let damage = e.contactDamage;
            if (playerStats.shieldActive > 0) {
                playerStats.shieldActive--;
                playerStats.lastShield = millis();
                e.hp -= playerStats.attack;
                damagePopups.push({
                    pos: e.pos.copy(),
                    text: playerStats.attack.toFixed(0),
                    time: millis()
                });
                triggerAssaultArmor();
                if (debugLog && debugMode) {
                    console.log(`Contact hit (shield): enemy index=${i}, damage=${playerStats.attack}, hp=${e.hp}`);
                }
                if (e.hp <= 0) {
                    if (debugLog && debugMode) {
                        console.log(`Calling handleEnemyDeath: index=${i}, source=contact_shield`);
                    }
                    handleEnemyDeath(e, i);
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
    for (let swamp of poisonSwamps) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (!e || enemiesToRemove.has(j)) {
                if (debugLog && debugMode) {
                    console.log(`Skipping poison: enemy index=${j}, inRemoveSet=${enemiesToRemove.has(j)}`);
                }
                continue;
            }
            loopCounter++;
            if (loopCounter > maxIterations) break;
            if (p5.Vector.sub(swamp.pos, e.pos).mag() < swamp.radius) e.poisoned = true;
            if (e.poisoned && millis() - e.lastPoisonDamage > 2000) {
                let damage = playerStats.attack * playerStats.poisonSwampDamageMultiplier;
                e.hp -= damage;
                damagePopups.push({
                    pos: e.pos.copy(),
                    text: damage.toFixed(0),
                    time: millis()
                });
                e.lastPoisonDamage = millis();
                if (debugLog && debugMode) {
                    console.log(`Poison hit: enemy index=${j}, damage=${damage}, hp=${e.hp}`);
                }
                if (e.hp <= 0) {
                    if (debugLog && debugMode) {
                        console.log(`Calling handleEnemyDeath: index=${j}, source=poison`);
                    }
                    handleEnemyDeath(e, j);
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
                if (debugLog && debugMode) {
                    console.log(`Exp item ${i} collected, exp=${playerStats.exp}, score=${score}`);
                }
                if (playerStats.exp >= playerStats.expToNext) levelUp();
                continue;
            }
        }
    }

    // 削除処理
    ([...projectilesToRemove].sort((a, b) => b - a)).forEach(i => projectiles.splice(i, 1));
}

function drawMap() {
    push();
    translate(800 - player.pos.x, 360 - player.pos.y);
    fill(0);
    let mapWidth = 5000, mapHeight = 3500;
    let viewportLeft = player.pos.x - 960 / 2;
    let viewportRight = player.pos.x + 960 / 2;
    let viewportTop = player.pos.y - 720 / 2;
    let viewportBottom = player.pos.y + 720 / 2;
    // マップ外の黒塗り
    if (viewportLeft < 0) rect(viewportLeft, viewportTop, -viewportLeft, 720);
    if (viewportRight > mapWidth) rect(mapWidth, viewportTop, viewportRight - mapWidth, 720);
    if (viewportTop < 0) rect(viewportLeft, viewportTop, 960, -viewportTop);
    if (viewportBottom > mapHeight) rect(viewportLeft, mapHeight, 960, viewportBottom - mapHeight);
    stroke(255);
    noFill();
    rect(0, 0, mapWidth, mapHeight);
    pop();
}

function drawPlayer() {
    push();
    translate(800 - player.pos.x, 360 - player.pos.y);
    let canvasX = player.pos.x - (player.pos.x - 960 / 2) + 320;
    if (canvasX >= 320) {
        if (spriteSheets[selectedCharacter] && frameCounts[selectedCharacter] > 0) {
            updateAnimation(playerStats, frameCounts[selectedCharacter]);
            push();
            translate(player.pos.x, player.pos.y);
            let scaleX = player.vel.x < 0 ? -1 : 1;
            scale(scaleX, 1);
            if (playerStats.isFlashing && floor((millis() - playerStats.flashStart) / 100) % 2 === 0) {
                // Skip drawing during flash
            } else {
                image(spriteSheets[selectedCharacter], -24, -24, 48, 48, playerStats.currentFrame * 48, 0, 48, 48);
            }
            pop();
        } else {
            // Fallback to ellipse
            fill(255);
            if (playerStats.isFlashing && floor((millis() - playerStats.flashStart) / 100) % 2 === 0) {
                ellipse(player.pos.x, player.pos.y, 20, 20);
            } else if (!playerStats.isFlashing) {
                ellipse(player.pos.x, player.pos.y, 20, 20);
            }
        }
    }
    pop();
}

function drawOtherEffects() {
    push();
    translate(800 - player.pos.x, 360 - player.pos.y);

    // スローフィールド
    if (playerStats.slowField > 0) {
        fill(0, 0, 255, 50);
        ellipse(player.pos.x, player.pos.y, playerStats.slowField * 2);
    }

    // シールド
    if (playerStats.shieldActive > 0) {
        let canvasX = player.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            fill(128, 0, 128, 100);
            stroke(255);
            strokeWeight(1);
            ellipse(player.pos.x, player.pos.y, 50, 50);
            noStroke();
        }
    }

    // ビット
    if (playerStats.bits > 0) {
        bits.forEach((bit, i) => {
            let angle = bit.angle + (playerStats.bits == 2 ? i * PI : playerStats.bits == 3 ? i * TWO_PI / 3 : 0);
            let x = player.pos.x + cos(angle) * 50;
            let y = player.pos.y + sin(angle) * 50;
            let bitCanvasX = x - (player.pos.x - 960 / 2) + 320;
            if (bitCanvasX >= 320) {
                fill(255, 255, 0);
                ellipse(x, y, 10, 10);
            }
        });
    }

    // 射撃ビット
    if (playerStats.shootingBits > 0) {
        shootingBits.forEach((bit, i) => {
            let angle = bit.angle + (playerStats.shootingBits == 2 ? i * PI : playerStats.shootingBits == 3 ? i * TWO_PI / 3 : 0);
            let x = player.pos.x + cos(angle) * 50;
            let y = player.pos.y + sin(angle) * 50;
            let bitCanvasX = x - (player.pos.x - 960 / 2) + 320;
            if (bitCanvasX >= 320) {
                fill(255, 0, 255);
                ellipse(x, y, 10, 10);
            }
        });
    }

    // 近接攻撃
    for (let attack of meleeAttacks) {
        let t = (millis() - attack.time) / 500;
        let canvasX = attack.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            let alpha = 100 * (1 - t);
            fill(255, 0, 0, alpha);
            arc(attack.pos.x, attack.pos.y, attack.radius * 2, attack.radius * 2, attack.angle - PI / 2, attack.angle + PI / 2);
        }
    }

    // 経験値アイテム
    for (let item of expItems) {
        let canvasX = item.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            fill(0, 0, 255);
            ellipse(item.pos.x, item.pos.y, 10, 10);
        }
    }

    // ダメージポップアップ
    for (let popup of damagePopups) {
        let canvasX = popup.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            fill(255, 255, 0);
            textSize(16);
            text(popup.text, popup.pos.x, popup.pos.y);
            popup.pos.y -= 1;
        }
        if (millis() - popup.time > 1000) damagePopups.splice(damagePopups.indexOf(popup), 1);
    }

    // エフェクトサークル
    for (let circle of effectCircles) {
        let canvasX = circle.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            let t = (millis() - circle.time) / 300;
            let scale = t < 0.5 ? t * 2 : 1;
            fill(255, 165, 0, 100 * (1 - t));
            ellipse(circle.pos.x, circle.pos.y, circle.maxRadius * 2 * scale);
        }
        if (millis() - circle.time > 300) effectCircles.splice(effectCircles.indexOf(circle), 1);
    }

    // 毒沼
    for (let swamp of poisonSwamps) {
        let canvasX = swamp.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            fill(0, 128, 0, 100);
            ellipse(swamp.pos.x, swamp.pos.y, swamp.radius * 2);
        }
        if (millis() - swamp.time > 4000) poisonSwamps.splice(poisonSwamps.indexOf(swamp), 1);
    }

    // ラッシュエフェクト
    if (millis() - rushEffectTime < 1000) {
        fill(255, 0, 0, 150);
        rect(330, 10, 100, 40);
        fill(255);
        stroke(255);
        strokeWeight(2);
        textSize(32);
        text("RUSH", 350, 30);
        noStroke();
    }

    pop();
}

function drawBullets() {
    push();
    translate(800 - player.pos.x, 360 - player.pos.y);
    for (let p of projectiles) {
        if (p.enemy) continue; // Skip enemy bullets
        let canvasX = p.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            fill(255, 255, 0);
            let bulletSize = 6 * (playerStats.attackRange / 200) * playerStats.bulletSizeScale;
            ellipse(p.pos.x, p.pos.y, bulletSize, bulletSize);
        }
    }
    pop();
}

function drawEnemyBullets() {
    push();
    translate(800 - player.pos.x, 360 - player.pos.y);
    for (let p of projectiles) {
        if (!p.enemy) continue; // Only enemy bullets
        let canvasX = p.pos.x - (player.pos.x - 960 / 2) + 320;
        if (canvasX >= 320) {
            fill(255, 0, 0);
            push();
            translate(p.pos.x, p.pos.y);
            let angle = atan2(p.vel.y, p.vel.x);
            rotate(angle);
            let bulletWidth = 5;
            let bulletHeight = 15;
            rect(-bulletWidth / 2, -bulletHeight / 2, bulletWidth, bulletHeight);
            pop();
        }
    }
    pop();
}