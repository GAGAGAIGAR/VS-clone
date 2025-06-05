let lastGridLog = 0;
let lastShieldLog = 0;
let bitSystemAngle = 0;
let shootingBitSystemAngle = 0;



function updatePlayer() {
    if (gameState !== 'playing' && gameState !== 'boss') return; //

    if (!player || isNaN(player.pos.x) || isNaN(player.pos.y)) { //
        const mapSize = getStageConfig(currentStage).mapSize; //
        player = { pos: createVector(mapSize.width / 2, mapSize.height / 2), vel: createVector(0, 0), lastShot: 0 }; //
    }

    // 移動 (変更なし)
    let moveDir = createVector(0, 0); //
    if (keyIsDown(87)) moveDir.y -= playerStats.moveSpeed; // W //
    if (keyIsDown(83)) moveDir.y += playerStats.moveSpeed; // S //
    if (keyIsDown(65)) moveDir.x -= playerStats.moveSpeed; // A //
    if (keyIsDown(68)) moveDir.x += playerStats.moveSpeed; // D //
    player.vel = moveDir; //
    player.pos.add(player.vel); //
    const mapSize = getStageConfig(currentStage).mapSize; //
    player.pos.x = constrain(player.pos.x, 0, mapSize.width); //
    player.pos.y = constrain(player.pos.y, 0, mapSize.height); //

    // 再生 (変更なし)
    if (playerStats.regenerationInterval > 0 && millis() - playerStats.lastRegeneration >= playerStats.regenerationInterval) { //
        if (playerStats.hp < playerStats.maxHp) { //
            playerStats.hp = min(playerStats.hp + 1, playerStats.maxHp); //
            playerStats.lastRegeneration = millis(); //
        }
    }

    // 点滅 (変更なし)
    if (playerStats.isFlashing && millis() - playerStats.flashStart > 2000) { //
        playerStats.isFlashing = false; //
        playerStats.isInvincible = false; //
    }

    // 攻撃 (変更なし)
    if (millis() - player.lastShot > playerStats.attackSpeed) { //
        const { cameraX, cameraY } = getCameraPosition(); //
        let mouseWorldX = mouseX + cameraX; //
        let mouseWorldY = mouseY + cameraY; //
        let angle = autoFire ? getAutoAimAngle() : atan2(mouseWorldY - player.pos.y, mouseWorldX - player.pos.x); //
        let ways = playerStats.attackWays; //
        if (playerStats.isMelee) { //
            for (let i = -(ways - 1) / 2; i <= (ways - 1) / 2; i++) { //
                let offset = i * PI / 12; //
                let attackAngle = angle + offset; //
                let radius = playerStats.attackRange * playerStats.bulletSizeScale; //
                meleeAttacks.push({ //
                    pos: player.pos.copy(), //
                    angle: attackAngle, //
                    radius: radius, //
                    time: millis(), //
                    damage: playerStats.attack, //
                    sourceAffiliation: 'ally' //
                });
            }
        } else {
            for (let i = -(ways - 1) / 2; i <= (ways - 1) / 2; i++) { //
                let offset = i * PI / 12; //
                projectiles.push({ //
                    pos: player.pos.copy(), //
                    vel: p5.Vector.fromAngle(angle + offset).mult(playerStats.bulletSpeed), //
                    damage: playerStats.attack, //
                    pierce: playerStats.pierceCount, //
                    sourceAffiliation: 'ally', //
                    origin: player.pos.copy(), //
                    range: playerStats.attackRange, //
                    createdTime: millis() //
                });
            }
        }
        player.lastShot = millis(); //
        if (debugLog && debugMode) { //
            console.log(`Player attack fired: type=${playerStats.isMelee ? 'melee' : 'bullet'}, ways=${ways}, sourceAffiliation=ally`); //
        }
    }

    // ビット (状態更新のみ)
    if (playerStats.bits > 0) { //
        while (bits.length < playerStats.bits) bits.push({ frame: 0, animationSpeed: 0.15 }); //
        if (bits.length > playerStats.bits) bits.splice(playerStats.bits); //

        bitSystemAngle += 0.075; //
        const numFrames = frameCounts['roundBit'] || 1; // アニメーションループのためにフレーム数はここで参照

        bits.forEach((bit, i) => { //
            // アニメーションフレーム更新
            bit.frame += bit.animationSpeed; //
            bit.frame %= numFrames; //

            // 位置計算と攻撃処理呼び出し
            let angle = bitSystemAngle + (i * (TWO_PI / playerStats.bits)); //
            let x = player.pos.x + cos(angle) * 50; //
            let y = player.pos.y + sin(angle) * 50; //
            handleBitAttack(x, y); //
            // ★★★ 描画コード (push, translate, rotate, image, pop) はここから削除 ★★★
        });
    }

    // 射撃ビット (状態更新のみ)
    if (playerStats.shootingBits > 0) { //
        while (shootingBits.length < playerStats.shootingBits) shootingBits.push({ lastShot: 0, frame: 0, animationSpeed: 0.2 }); //
        if (shootingBits.length > playerStats.shootingBits) shootingBits.splice(playerStats.shootingBits); //

        shootingBitSystemAngle += 0.075; //
        const numFrames = frameCounts['shootBit'] || 1; // アニメーションループのためにフレーム数はここで参照

        shootingBits.forEach((bit, i) => { //
            // アニメーションフレーム更新
            bit.frame += bit.animationSpeed; //
            bit.frame %= numFrames; //

            // 位置計算と射撃ロジック
            let angle = shootingBitSystemAngle + (i * (TWO_PI / playerStats.shootingBits)); //
            let x = player.pos.x + cos(angle) * 50; //
            let y = player.pos.y + sin(angle) * 50; //

            if (millis() - bit.lastShot > 1000) { //
                let closestUnit = units.reduce((closest, u) => { //
                    if (!u) return closest; //
                    let dist = p5.Vector.sub(u.pos, createVector(x, y)).mag(); //
                    return dist < closest.dist ? { u, dist } : closest; //
                }, { dist: Infinity }).u; //
                if (closestUnit) { //
                    let shootAngle = atan2(closestUnit.pos.y - y, closestUnit.pos.x - x); //
                    projectiles.push({ //
                        pos: createVector(x, y), //
                        vel: p5.Vector.fromAngle(shootAngle).mult(playerStats.bulletSpeed || 10), //
                        damage: playerStats.attack, //
                        pierce: playerStats.pierceCount, //
                        sourceAffiliation: 'ally', //
                        origin: createVector(x, y), //
                        range: playerStats.attackRange, //
                        createdTime: millis() //
                    });
                    bit.lastShot = millis(); //
                    if (debugLog && debugMode) { //
                        console.log(`Shooting bit fired: index=${i}, targetType=${closestUnit.type}, sourceAffiliation=ally`); //
                    }
                }
            }
            // ★★★ 描画コード (push, translate, rotate, image, pop) はここから削除 ★★★
        });
    }



    // アサルトアーマー
    window.triggerAssaultArmor = function() {
        if (playerStats.assaultArmorRadius <= 0) return;
        effectCircles.push({
            pos: player.pos.copy(),
            radius: playerStats.assaultArmorRadius,
            time: millis(),
            maxRadius: playerStats.assaultArmorRadius,
            sourceAffiliation: 'ally' // 追加
        });
        for (let i = units.length - 1; i >= 0; i--) {
            let u = units[i];
            if (!u || unitsToRemove.has(i)) continue;
            let dist = p5.Vector.sub(player.pos, u.pos).mag();
            if (dist < playerStats.assaultArmorRadius && ['enemy', 'enemy2', 'none'].includes(u.affiliation)) {
                let damage = playerStats.attack * playerStats.assaultArmorDamageMultiplier;
                u.hp -= damage;
                damagePopups.push({
                    pos: u.pos.copy(),
                    text: damage.toFixed(0),
                    time: millis()
                });
                if (debugLog && debugMode) {
                    console.log(`Assault Armor hit: unit index=${i}, type=${u.type}, affiliation=${u.affiliation}, damage=${damage}, hp=${u.hp}`);
                }
                if (u.hp <= 0) {
                    handleUnitDeath(u, i);
                }
            }
        }
        if (debugLog && debugMode) {
            console.log(`Assault Armor triggered, radius=${playerStats.assaultArmorRadius}, multiplier=${playerStats.assaultArmorDamageMultiplier}, sourceAffiliation=ally`);
        }
    };

    // ショックフィールド
    if (playerStats.shockFieldRadius > 0 && millis() - playerStats.lastShockField > playerStats.shockFieldCooldown) {
        effectCircles.push({
            pos: player.pos.copy(),
            radius: playerStats.shockFieldRadius,
            time: millis(),
            maxRadius: playerStats.shockFieldRadius,
            sourceAffiliation: 'ally' // 追加
        });
        for (let u of units) {
            if (!u || !['enemy', 'enemy2', 'none'].includes(u.affiliation)) continue;
            let dist = p5.Vector.sub(player.pos, u.pos).mag();
            if (dist < playerStats.shockFieldRadius) {
                let dir = p5.Vector.sub(u.pos, player.pos).normalize();
                u.pos.add(dir.mult(random(75, 125)));
                if (playerStats.shockFieldDamageMultiplier > 0) {
                    let damage = playerStats.attack * playerStats.shockFieldDamageMultiplier;
                    u.hp -= damage;
                    damagePopups.push({
                        pos: u.pos.copy(),
                        text: damage.toFixed(0),
                        time: millis()
                    });
                    if (debugLog && debugMode) {
                        console.log(`Shock Field hit: unit type=${u.type}, affiliation=${u.affiliation}, damage=${damage}, hp=${u.hp}`);
                    }
                    if (u.hp <= 0) {
                        handleUnitDeath(u, units.indexOf(u));
                    }
                }
            }
        }
        playerStats.lastShockField = millis();
        if (debugLog && debugMode) {
            console.log(`Shock Field triggered, radius=${playerStats.shockFieldRadius}, sourceAffiliation=ally`);
        }
    }

    // エナジーウェーブ
    if (playerStats.waveRadius > 0 && millis() - playerStats.lastWave > 5000) {
        effectCircles.push({
            pos: player.pos.copy(),
            radius: playerStats.waveRadius,
            time: millis(),
            maxRadius: playerStats.waveRadius,
            sourceAffiliation: 'ally' // 追加
        });
        for (let u of units) {
            if (!u || p5.Vector.sub(player.pos, u.pos).mag() >= playerStats.waveRadius || !['enemy', 'enemy2', 'none'].includes(u.affiliation)) continue;
            let damage = playerStats.attack * playerStats.waveDamageMultiplier;
            u.hp -= damage;
            damagePopups.push({
                pos: u.pos.copy(),
                text: damage.toFixed(0),
                time: millis()
            });
            if (debugLog && debugMode) {
                console.log(`Energy Wave hit: unit type=${u.type}, affiliation=${u.affiliation}, damage=${damage}, hp=${u.hp}`);
            }
            if (u.hp <= 0) {
                handleUnitDeath(u, units.indexOf(u));
            }
        }
        playerStats.lastWave = millis();
        if (debugLog && debugMode) {
            console.log(`Energy Wave triggered, radius=${playerStats.waveRadius}, sourceAffiliation=ally`);
        }
    }

    updateGrid();
    updateShield();
}

function handleBitAttack(x, y) {
    const maxIterations = 10000; //
    let loopCounter = 0; //
    for (let j = units.length - 1; j >= 0; j--) { //
        if (!units[j]) continue; //
        loopCounter++; //
        if (loopCounter > maxIterations) break; //
        let u = units[j]; //
        if (!['enemy', 'enemy2', 'none'].includes(u.affiliation)) continue; //
        let bitHitRadius = u.type == 'Z' ? 35 : 15; //
        if (p5.Vector.sub(u.pos, createVector(x, y)).mag() < bitHitRadius) { //
            u.hp -= playerStats.attack; //
            damagePopups.push({ //
                pos: u.pos.copy(), //
                text: playerStats.attack.toFixed(0), //
                time: millis() //
            });
            if (debugLog && debugMode) { //
                console.log(`Bit attack hit: unit index=${j}, type=${u.type}, affiliation=${u.affiliation}, damage=${playerStats.attack}, hp=${u.hp}`); //
            }
            if (u.hp <= 0) { //
                handleUnitDeath(u, j); //
            }
            if (playerStats.explosionRadius > 0) { //
                effectCircles.push({ //
                    pos: u.pos.copy(), //
                    radius: playerStats.explosionRadius, //
                    time: millis(), //
                    maxRadius: playerStats.explosionRadius, //
                    sourceAffiliation: 'ally' //
                });
                for (let k = units.length - 1; k >= 0; k--) { //
                    if (!units[k] || k == j) continue; //
                    loopCounter++; //
                    if (loopCounter > maxIterations) break; //
                    if (!['enemy', 'enemy2', 'none'].includes(units[k].affiliation)) continue; //
                    if (p5.Vector.sub(u.pos, units[k].pos).mag() < playerStats.explosionRadius) { //
                        units[k].hp -= playerStats.attack * 0.5; //
                        damagePopups.push({ //
                            pos: units[k].pos.copy(), //
                            text: (playerStats.attack * 0.5).toFixed(0), //
                            time: millis() //
                        });
                        if (debugLog && debugMode) { //
                            console.log(`Explosion hit: unit index=${k}, type=${units[k].type}, affiliation=${units[k].affiliation}, damage=${playerStats.attack * 0.5}, hp=${units[k].hp}`); //
                        }
                        if (units[k].hp <= 0) { //
                            handleUnitDeath(units[k], k); //
                        }
                    }
                }
            }
        }
    }
}

function getAutoAimAngle() {
    let closest = units.reduce((c, u) => { //
        if (!u || u.isDying || !['enemy', 'enemy2', 'none'].includes(u.affiliation)) return c; //
        let d = p5.Vector.sub(u.pos, player.pos).mag(); //
        return d < c.dist ? { u, dist: d } : c; //
    }, { dist: Infinity }); //
    if (debugLog && debugMode && closest.u) { //
        console.log(`AutoAim: unit type=${closest.u.type}, affiliation=${closest.u.affiliation}, index=${units.indexOf(closest.u)}, dist=${closest.dist.toFixed(1)}`); //
    }
    return closest.u ? atan2(closest.u.pos.y - player.pos.y, closest.u.pos.x - player.pos.x) : random(TWO_PI); //
}

function updateGrid() {
    if (millis() - lastGridLog > 1000 && debugLog && debugMode) { //
        console.log('グリッドを更新しました'); //
        lastGridLog = millis(); //
    }
}

function updateShield() {
    if (millis() - lastShieldLog > 1000 && debugLog && debugMode) { //
        console.log('シールドを更新しました'); //
        lastShieldLog = millis(); //
    }
}