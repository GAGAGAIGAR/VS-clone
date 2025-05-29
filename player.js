let lastGridLog = 0;
let lastShieldLog = 0;

function updatePlayer() {
    if (gameState !== 'playing' && gameState !== 'boss') return; // Skip in non-gameplay states

    if (!player || isNaN(player.pos.x) || isNaN(player.pos.y)) {
        player = { pos: createVector(2500, 1750), vel: createVector(0, 0), lastShot: 0 };
    }

    // 移動
    let moveDir = createVector(0, 0);
    if (keyIsDown(87)) moveDir.y -= playerStats.moveSpeed; // W
    if (keyIsDown(83)) moveDir.y += playerStats.moveSpeed; // S
    if (keyIsDown(65)) moveDir.x -= playerStats.moveSpeed; // A
    if (keyIsDown(68)) moveDir.x += playerStats.moveSpeed; // D
    player.vel = moveDir;
    player.pos.add(player.vel);
    player.pos.x = constrain(player.pos.x, 0, 5000);
    player.pos.y = constrain(player.pos.y, 0, 3500);

    // 再生
    if (playerStats.regenerationInterval > 0 && millis() - playerStats.lastRegeneration >= playerStats.regenerationInterval) {
        if (playerStats.hp < playerStats.maxHp) {
            playerStats.hp = min(playerStats.hp + 1, playerStats.maxHp);
            playerStats.lastRegeneration = millis();
        }
    }

    // 点滅
    if (playerStats.isFlashing && millis() - playerStats.flashStart > 2000) {
        playerStats.isFlashing = false;
        playerStats.isInvincible = false;
    }

    // 攻撃
    if (millis() - player.lastShot > playerStats.attackSpeed) {
        let angle = autoFire ? getAutoAimAngle() : atan2(mouseY + player.pos.y - 720 / 2 - player.pos.y, mouseX - 320 + player.pos.x - 960 / 2 - player.pos.x);
        let ways = playerStats.attackWays;
        if (playerStats.isMelee) {
            for (let i = -(ways - 1) / 2; i <= (ways - 1) / 2; i++) {
                let offset = i * PI / 12;
                let attackAngle = angle + offset;
                let radius = playerStats.attackRange * playerStats.bulletSizeScale;
                meleeAttacks.push({
                    pos: player.pos.copy(),
                    angle: attackAngle,
                    radius: radius,
                    time: millis(),
                    damage: playerStats.attack
                });
            }
        } else {
            for (let i = -(ways - 1) / 2; i <= (ways - 1) / 2; i++) {
                let offset = i * PI / 12;
                projectiles.push({
                    pos: player.pos.copy(),
                    vel: p5.Vector.fromAngle(angle + offset).mult(playerStats.bulletSpeed),
                    damage: playerStats.attack,
                    pierce: playerStats.pierceCount,
                    enemy: false,
                    origin: player.pos.copy(),
                    range: playerStats.attackRange
                });
            }
        }
        player.lastShot = millis();
    }

    // ビット
    if (playerStats.bits > 0) {
        while (bits.length < playerStats.bits) bits.push({ angle: random(TWO_PI) });
        if (bits.length > playerStats.bits) bits.splice(playerStats.bits);
        bits.forEach((bit, i) => {
            bit.angle += 0.075;
            let angle = bit.angle + (playerStats.bits == 2 ? i * PI : playerStats.bits == 3 ? i * TWO_PI / 3 : 0);
            let x = player.pos.x + cos(angle) * 50;
            let y = player.pos.y + sin(angle) * 50;
            handleBitAttack(x, y);
        });
    }

    // 射撃ビット
    if (playerStats.shootingBits > 0) {
        while (shootingBits.length < playerStats.shootingBits) shootingBits.push({ angle: random(TWO_PI), lastShot: 0 });
        if (shootingBits.length > playerStats.shootingBits) shootingBits.splice(playerStats.shootingBits);
        shootingBits.forEach((bit, i) => {
            bit.angle += 0.075;
            let angle = bit.angle + (playerStats.shootingBits == 2 ? i * PI : playerStats.shootingBits == 3 ? i * TWO_PI / 3 : 0);
            let x = player.pos.x + cos(angle) * 50;
            let y = player.pos.y + sin(angle) * 50;
            if (millis() - bit.lastShot > 1000) {
                let closestEnemy = enemies.reduce((closest, e) => {
                    if (!e) return closest;
                    let dist = p5.Vector.sub(e.pos, createVector(x, y)).mag();
                    return dist < closest.dist ? { e, dist } : closest;
                }, { dist: Infinity }).e;
                if (closestEnemy) {
                    let angle = atan2(closestEnemy.pos.y - y, closestEnemy.pos.x - x);
                    projectiles.push({
                        pos: createVector(x, y),
                        vel: p5.Vector.fromAngle(angle).mult(playerStats.bulletSpeed || 10),
                        damage: playerStats.attack,
                        pierce: playerStats.pierceCount,
                        enemy: false,
                        origin: createVector(x, y),
                        range: playerStats.attackRange
                    });
                    bit.lastShot = millis();
                }
            }
        });
    }
// アサルトアーマー
window.triggerAssaultArmor = function() {
    if (playerStats.assaultArmorRadius <= 0) return;
    effectCircles.push({
        pos: player.pos.copy(),
        radius: playerStats.assaultArmorRadius,
        time: millis(),
        maxRadius: playerStats.assaultArmorRadius
    });
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (!e || enemiesToRemove.has(i)) continue;
        let dist = p5.Vector.sub(player.pos, e.pos).mag();
        if (dist < playerStats.assaultArmorRadius) {
            let damage = playerStats.attack * playerStats.assaultArmorDamageMultiplier;
            e.hp -= damage;
            damagePopups.push({
                pos: e.pos.copy(),
                text: damage.toFixed(0),
                time: millis()
            });
            if (debugLog && debugMode) {
                console.log(`Assault Armor hit: enemy index=${i}, damage=${damage}, hp=${e.hp}`);
            }
            if (e.hp <= 0) {
                handleEnemyDeath(e, i);
            }
        }
    }
    if (debugLog && debugMode) {
        console.log(`Assault Armor triggered, radius=${playerStats.assaultArmorRadius}, multiplier=${playerStats.assaultArmorDamageMultiplier}`);
    }
};
    // ショックフィールド
    if (playerStats.shockFieldRadius > 0 && millis() - playerStats.lastShockField > playerStats.shockFieldCooldown) {
        effectCircles.push({
            pos: player.pos.copy(),
            radius: playerStats.shockFieldRadius,
            time: millis(),
            maxRadius: playerStats.shockFieldRadius
        });
        for (let e of enemies) {
            if (!e) continue;
            let dist = p5.Vector.sub(player.pos, e.pos).mag();
            if (dist < playerStats.shockFieldRadius) {
                let dir = p5.Vector.sub(e.pos, player.pos).normalize();
                e.pos.add(dir.mult(random(75, 125)));
                if (playerStats.shockFieldDamageMultiplier > 0) {
                    let damage = playerStats.attack * playerStats.shockFieldDamageMultiplier;
                    e.hp -= damage;
                    damagePopups.push({
                        pos: e.pos.copy(),
                        text: damage.toFixed(0),
                        time: millis()
                    });
                    if (e.hp <= 0) {
                        handleEnemyDeath(e, enemies.indexOf(e));
                    }
                }
            }
        }
        playerStats.lastShockField = millis();
    }

    // エナジーウェーブ
    if (playerStats.waveRadius > 0 && millis() - playerStats.lastWave > 5000) {
        effectCircles.push({
            pos: player.pos.copy(),
            radius: playerStats.waveRadius,
            time: millis(),
            maxRadius: playerStats.waveRadius
        });
        for (let e of enemies) {
            if (!e || p5.Vector.sub(player.pos, e.pos).mag() >= playerStats.waveRadius) continue;
            let damage = playerStats.attack * playerStats.waveDamageMultiplier;
            e.hp -= damage;
            damagePopups.push({
                pos: e.pos.copy(),
                text: damage.toFixed(0),
                time: millis()
            });
            if (e.hp <= 0) {
                handleEnemyDeath(e, enemies.indexOf(e));
            }
        }
        playerStats.lastWave = millis();
    }

    updateGrid();
    updateShield();
}

function handleBitAttack(x, y) {
    const maxIterations = 10000;
    let loopCounter = 0;
    for (let j = enemies.length - 1; j >= 0; j--) {
        if (!enemies[j]) continue;
        loopCounter++;
        if (loopCounter > maxIterations) break;
        let e = enemies[j];
        let bitHitRadius = e.type == 'Z' ? 35 : 15;
        if (p5.Vector.sub(e.pos, createVector(x, y)).mag() < bitHitRadius) {
            e.hp -= playerStats.attack;
            damagePopups.push({
                pos: e.pos.copy(),
                text: playerStats.attack.toFixed(0),
                time: millis()
            });
            if (e.hp <= 0) {
                handleEnemyDeath(e, j);
            }
            if (playerStats.explosionRadius > 0) {
                effectCircles.push({
                    pos: e.pos.copy(),
                    radius: playerStats.explosionRadius,
                    time: millis(),
                    maxRadius: playerStats.explosionRadius
                });
                for (let k = enemies.length - 1; k >= 0; k--) {
                    if (!enemies[k] || k == j) continue;
                    loopCounter++;
                    if (loopCounter > maxIterations) break;
                    if (p5.Vector.sub(e.pos, enemies[k].pos).mag() < playerStats.explosionRadius) {
                        enemies[k].hp -= playerStats.attack * 0.5;
                        damagePopups.push({
                            pos: enemies[k].pos.copy(),
                            text: (playerStats.attack * 0.5).toFixed(0),
                            time: millis()
                        });
                        if (enemies[k].hp <= 0) {
                            handleEnemyDeath(enemies[k], k);
                        }
                    }
                }
            }
        }
    }
}

function getAutoAimAngle() {
    let closest = enemies.reduce((c, e) => {
        if (!e || e.isDying) return c;
        let d = p5.Vector.sub(e.pos, player.pos).mag();
        return d < c.dist ? { e, dist: d } : c;
    }, { dist: Infinity });
    if (debugLog && debugMode && closest.e) {
        console.log(`AutoAim: enemy type=${closest.e.type}, index=${enemies.indexOf(closest.e)}, dist=${closest.dist.toFixed(1)}`);
    }
    return closest.e ? atan2(closest.e.pos.y - player.pos.y, closest.e.pos.x - player.pos.x) : random(TWO_PI);
}

function updateGrid() {
    if (millis() - lastGridLog > 1000 && debugLog && debugMode) {
        console.log('グリッドを更新しました');
        lastGridLog = millis();
    }
}

function updateShield() {
    if (millis() - lastShieldLog > 1000 && debugLog && debugMode) {
        console.log('シールドを更新しました');
        lastShieldLog = millis();
    }
}