function updateEffects() {
    // --- 近接攻撃の当たり判定 ---
    for (let i = meleeAttacks.length - 1; i >= 0; i--) {
        let attack = meleeAttacks[i];
        if (millis() - attack.time > attack.duration) { /* ... */ continue; }

        const nearbyUnits = getUnitsInNeighborCells(attack.pos, u => !u.isDying && !attack.hitUnits.has(u));
        for (const u of nearbyUnits) {
            const j = units.indexOf(u);
            if (j === -1 || unitsToRemove.has(j)) continue;
            
            
            const unitConfig = unitTypes[u.type];
            if (!unitConfig) continue;
            // ユニットが無敵時間中ならスキップ
            if (u.isInvincible && millis() < (u.invincibilityEndTime || 0)) {
                continue;
            }
            const canHit = canDamage(attack.sourceAffiliation || 'ally', u.affiliation);
            if (!canHit) continue;

            let dist = p5.Vector.dist(u.pos, attack.pos);
            if (dist < u.size / 2 + attack.radius) {
                let unitAngle = atan2(u.pos.y - attack.pos.y, u.pos.x - attack.pos.x);
                let attackAngle = attack.angle;
                let attackArc = attack.arc;
                let angleDiff = atan2(sin(unitAngle - attackAngle), cos(unitAngle - attackAngle));

                if (abs(angleDiff) <= attackArc / 2) {
                    u.hp -= attack.damage;
                    if (playerStats.hitSe) playSE(playerStats.hitSe);
                    damagePopups.push({ pos: u.pos.copy(), text: attack.damage.toFixed(0), time: millis() });
                    attack.hitUnits.add(u);

                    if (u.hp <= 0) {
                        // ★ 近接攻撃で倒した場合、攻撃の発生源の種族を渡す
                        handleUnitDeath(u, j, attack.sourceSpecies);
                    }
                }
            }
        }
    }

    const unitsToRemoveSnapshot = new Set(unitsToRemove);

/**
 * ある攻撃が、特定のターゲットにダメージを与えられるかを判定する
 * @param {string} sourceAffiliation - 攻撃元の所属
 * @param {string} targetAffiliation - 攻撃対象の所属
 * @returns {boolean} - ダメージを与えられる場合はtrue
 */
function canDamage(sourceAffiliation, targetAffiliation) {
    // ★★★ ここからが修正箇所 ★★★
    // ターゲットが無所属('none')の場合、いかなる攻撃も当たらない
    if (targetAffiliation === 'none') {
        return false;
    }

    // 味方('ally')は、敵('enemy' または 'enemy2')にのみダメージを与えられる
    if (sourceAffiliation === 'ally') {
        return targetAffiliation === 'enemy' || targetAffiliation === 'enemy2';
    }

    // 敵('enemy')は、味方('ally')にのみダメージを与えられる
    if (sourceAffiliation === 'enemy') {
        return targetAffiliation === 'ally';
    }
    
    // それ以外のケース（敵同士など）は、ダメージを与えられない
    return false;
    // ★★★ 修正ここまで ★★★
}
// --- プロジェクタイルの更新と当たり判定 ---
    const maxIterations = 10000;
    let loopCounter = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];

        // ★有効な弾でなければスキップする処理を追加
        if (!p || !p.active) {
            continue;
        }

        p.pos.add(p.vel);

        const collision = getTerrainCollision(p.pos);
        if (collision && collision.shape.type !== 2) {
            p.active = false; // ★フラグを立てる
            continue; // このフレームの残りの処理は不要
        }

        if (p.decelerates) {
            p.vel.mult(0.96);
            const minSpeed = p.initialSpeed * 0.20;
            if (p.vel.magSq() < minSpeed * minSpeed) {
                p.vel.setMag(minSpeed);
            }
        }
        
        const mapSize = getStageConfig(currentStage).mapSize;
        if (p.pos.x < 0 || p.pos.x > mapSize.width || p.pos.y < 0 || p.pos.y > mapSize.height) {
            p.active = false; //             continue;
        }
        if (p.sourceAffiliation === 'ally' && p.pos.dist(player.pos) > playerStats.attackRange) {
            p.active = false; //             continue;
        }
        if (p.origin && p.range && (!p.createdTime || millis() - p.createdTime > 16)) {
            let distanceTraveled = p.pos.dist(p.origin);
            if (distanceTraveled > p.range) {
            p.active = false; //                 continue;
            }
        }

        if (p.sourceAffiliation === 'enemy') {
            if (!playerStats.isInvincible && p.pos.dist(player.pos) < 25) {
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
                }
                    p.active = false;
                continue;
            }

            const nearbyAllies = getUnitsInNeighborCells(p.pos, u => u.affiliation === 'ally' && !u.isDying && !u.isAppearing);
            for (const allyUnit of nearbyAllies) {
                
                // ★★★ ここからが修正箇所 (敵の弾 → 味方ユニット) ★★★
                const unitConfig = unitTypes[allyUnit.type];
                if (!unitConfig) continue;

                // ユニットが無敵時間中ならスキップ
                if (allyUnit.isInvincible && millis() < (allyUnit.invincibilityEndTime || 0)) {
                    continue;
                }
                // ★★★ 修正ここまで ★★★

                if (p.pos.dist(allyUnit.pos) < allyUnit.size / 2) {
                    allyUnit.hp -= p.damage;
                    
                    // ★★★ ここからが修正箇所 (敵の弾 → 味方ユニット) ★★★
                    const invincibilityDuration = unitConfig.invincibilityOnHit || 0;
                    if (invincibilityDuration > 0) {
                        allyUnit.isInvincible = true;
                        allyUnit.invincibilityEndTime = millis() + invincibilityDuration;
                    }
                    // ★★★ 修正ここまで ★★★
                    
                    damagePopups.push({ pos: allyUnit.pos.copy(), text: p.damage.toFixed(0), time: millis(), color: color(255, 100, 100) });
                    
                    if (allyUnit.hp <= 0) {
                        // ★ 弾で倒した場合、弾の発生源の種族を渡す
                        const attackerSpecies = unitTypes[p.sourceUnitType]?.species || null;
                        handleUnitDeath(allyUnit, units.indexOf(allyUnit), attackerSpecies);
                    }
                    p.active = false;
                    break; 
                }
            }
        }
        
        // 味方の弾が敵に当たる判定
        if (p.sourceAffiliation === 'ally') {
            const nearbyEnemies = getUnitsInNeighborCells(p.pos, u => !u.isDying && canDamage(p.sourceAffiliation, u.affiliation));
            for (const u of nearbyEnemies) {
                const j = units.indexOf(u);
                if (j === -1 || unitsToRemove.has(j)) continue;
                
                // ★★★ ここからが修正箇所 (味方の弾 → 敵ユニット) ★★★
                const unitConfig = unitTypes[u.type];
                if (!unitConfig) continue;

                // ユニットが無敵時間中ならスキップ
                if (u.isInvincible && millis() < (u.invincibilityEndTime || 0)) {
                    continue;
                }
                // ★★★ 修正ここまで ★★★

                let hitRadius = u.type === 'Z' ? 60 : 20;
                if (p5.Vector.sub(u.pos, p.pos).mag() < hitRadius) {
                    u.hp -= p.damage;

                    // ★★★ ここからが修正箇所 (味方の弾 → 敵ユニット) ★★★
                    const invincibilityDuration = unitConfig.invincibilityOnHit || 0;
                    if (invincibilityDuration > 0) {
                        u.isInvincible = true;
                        u.invincibilityEndTime = millis() + invincibilityDuration;
                    }
                    // ★★★ 修正ここまで ★★★

                    if (playerStats.hitSe && playerStats.hitSe.length > 0) {
                        playSE(playerStats.hitSe);
                    }
                    damagePopups.push({ pos: u.pos.copy(), text: p.damage.toFixed(0), time: millis() });
                    
                    if (u.hp <= 0) {
                        // ★ プレイヤー(または味方)の弾で倒した場合、種族は 'player' または null とする
                        handleUnitDeath(u, j, 'player'); // ここでは簡易的に'player'
                    }
                    // 範囲ダメージ化が有効かチェック
                    if (playerStats.areaDamageRadius > 0 && playerStats.areaDamageMultiplier > 0) {
                        // 視覚エフェクトを生成
                        effectCircles.push({
                            pos: u.pos.copy(), // 着弾点を中心に
                            radius: playerStats.areaDamageRadius,
                            time: millis(),
                            maxRadius: playerStats.areaDamageRadius
                        });
                        
                        // 爆風ダメージを計算
                        const areaDamage = playerStats.attack * playerStats.areaDamageMultiplier;
                        
                        // 爆風範囲内の他の敵を探してダメージを与える
                        const splashTargets = getUnitsInNeighborCells(u.pos, t => !t.isDying && t !== u);
                        for (const targetUnit of splashTargets) {
                            const k = units.indexOf(targetUnit);
                            if (k === -1 || k === j || unitsToRemove.has(k)) continue;

                            // ★★★ ここからが修正箇所 (範囲ダメージ) ★★★
                            const targetUnitConfig = unitTypes[targetUnit.type];
                            if (!targetUnitConfig) continue;

                            if (targetUnit.isInvincible && millis() < (targetUnit.invincibilityEndTime || 0)) {
                                continue;
                            }
                            // ★★★ 修正ここまで ★★★

                            if (canDamage(p.sourceAffiliation, targetUnit.affiliation) &&
                                p5.Vector.dist(u.pos, targetUnit.pos) < playerStats.areaDamageRadius) {
                                
                                targetUnit.hp -= areaDamage;

                                // ★★★ ここからが修正箇所 (範囲ダメージ) ★★★
                                const invincibilityDuration = targetUnitConfig.invincibilityOnHit || 0;
                                if (invincibilityDuration > 0) {
                                    targetUnit.isInvincible = true;
                                    targetUnit.invincibilityEndTime = millis() + invincibilityDuration;
                                }
                                // ★★★ 修正ここまで ★★★
                                
                                damagePopups.push({
                                    pos: targetUnit.pos.copy(),
                                    text: areaDamage.toFixed(0),
                                    time: millis()
                                });
                                if (targetUnit.hp <= 0) {
                                    handleUnitDeath(targetUnit, k);
                                }
                            }
                        }
                    }

                    if (u.hp <= 0) {
                        handleUnitDeath(u, j);
                        if (p.pierce <= 0) {
                           p.active = false;
                           break;
                        } else {
                           p.pierce--;
                           continue;
                        }
                    }

                    if (isFinite(p.pierce)) {
                        p.pierce--;
                        if (p.pierce <= 0) {
                            p.active = false;
                            break;
                        }
                    }
                }
            }
        }
    }
    // --- 敵との接触ダメージ判定 ---
    loopCounter = 0;
    for (let i = units.length - 1; i >= 0; i--) {
        let enemyUnit = units[i];
        if (!enemyUnit || enemyUnit.isDying || enemyUnit.affiliation !== 'enemy') continue;
        
        loopCounter++;
        if (loopCounter > maxIterations) break;

        if (!playerStats.isInvincible && p5.Vector.sub(player.pos, enemyUnit.pos).mag() < 25) {
            playerStats.lastDamageUnitType = enemyUnit.type;
            let damage = enemyUnit.contactDamage;
            if (playerStats.shieldActive > 0) {
                playerStats.shieldActive--;
                playerStats.lastShield = millis();
                enemyUnit.hp -= playerStats.attack;
                damagePopups.push({ pos: enemyUnit.pos.copy(), text: playerStats.attack.toFixed(0), time: millis() });
                triggerAssaultArmor();
                if (enemyUnit.hp <= 0) handleUnitDeath(enemyUnit, i);
            } else {
                playerStats.hp -= damage;
                playerStats.isFlashing = true;
                playerStats.isInvincible = true;
                playerStats.flashStart = millis();
                triggerAssaultArmor();
                if (playerStats.hp <= 0) setGameState('gameOver');
            }
        }

        // 味方ユニットとの接触判定
         for (const allyUnit of units) {
            if (allyUnit.affiliation !== 'ally' || allyUnit.isDying || allyUnit.isAppearing) continue;

            if (p5.Vector.sub(allyUnit.pos, enemyUnit.pos).mag() < (allyUnit.size / 2 + enemyUnit.size / 2)) {
                
                // ★★★ ここからが修正箇所 (接触ダメージ) ★★★
                const allyConfig = unitTypes[allyUnit.type];
                const enemyConfig = unitTypes[enemyUnit.type];
                if (!allyConfig || !enemyConfig) continue;

                // 敵から味方へのダメージ
                if (!allyUnit.isInvincible || millis() >= (allyUnit.invincibilityEndTime || 0)) {
                    const damageToAlly = enemyUnit.contactDamage || 0;
                    if (damageToAlly > 0) {
                        allyUnit.hp -= damageToAlly;
                        const invincibilityDuration = allyConfig.invincibilityOnHit || 0;
                        if (invincibilityDuration > 0) {
                            allyUnit.isInvincible = true;
                            allyUnit.invincibilityEndTime = millis() + invincibilityDuration;
                        }
                        damagePopups.push({ pos: allyUnit.pos.copy(), text: damageToAlly.toFixed(0), time: millis(), color: color(255, 100, 100) });
                        if (allyUnit.hp <= 0) {
                            const attackerSpecies = enemyConfig.species || null;
                            handleUnitDeath(allyUnit, units.indexOf(allyUnit), attackerSpecies);
                        }
                    }
                }

                // 味方から敵へのダメージ
                if (!enemyUnit.isInvincible || millis() >= (enemyUnit.invincibilityEndTime || 0)) {
                    const damageToEnemy = allyUnit.contactDamage || 0;
                    if (damageToEnemy > 0 && enemyUnit.hp > 0) {
                        enemyUnit.hp -= damageToEnemy;
                        const invincibilityDuration = enemyConfig.invincibilityOnHit || 0;
                        if (invincibilityDuration > 0) {
                            enemyUnit.isInvincible = true;
                            enemyUnit.invincibilityEndTime = millis() + invincibilityDuration;
                        }
                        damagePopups.push({ pos: enemyUnit.pos.copy(), text: damageToEnemy.toFixed(0), time: millis() });
                        if (enemyUnit.hp <= 0) {
                            const attackerSpecies = allyConfig.species || null;
                            handleUnitDeath(enemyUnit, i, attackerSpecies);
                        }
                    }
                }
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
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
        const explosion = activeExplosions[i];
        
        // 遅延時間が経過し、まだ起爆していない爆発を処理
        if (!explosion.hasExploded && millis() - explosion.startTime >= explosion.delay) {
            explosion.hasExploded = true; // 二重起爆を防止

            // a. 視覚エフェクトを生成
            effectCircles.push({
                pos: explosion.center,
                radius: explosion.radius,
                time: millis(),
                maxRadius: explosion.radius,
            });

            // b. 爆発範囲内の敵にダメージを与える
            for (let j = units.length - 1; j >= 0; j--) {
                const targetUnit = units[j];
                // 無効なターゲットはスキップ
                if (!targetUnit || unitsToRemove.has(j) || targetUnit.isDying || targetUnit.affiliation === 'ally') continue;

                if (p5.Vector.dist(explosion.center, targetUnit.pos) < explosion.radius) {
                    targetUnit.hp -= explosion.damage;
                    targetUnit.lastAttacker = { species: 'chain_explosion' };
                    damagePopups.push({ pos: targetUnit.pos.copy(), text: explosion.damage.toFixed(0), time: millis() });
                }
            }
        }

        // 起爆済み、または表示時間が過ぎた爆発オブジェクトをリストから削除
        // (視覚エフェクトの表示時間などを考慮して、少し長めに保持)
        if (explosion.hasExploded && millis() - explosion.startTime > explosion.delay + 500) {
            activeExplosions.splice(i, 1);
        }
    }

    // --- 3. 死亡判定と処理 ---
    // (このループは、上記でHPが0になったユニットを次のフレームで処理するために重要)
    for (let i = units.length - 1; i >= 0; i--) {
        const unit = units[i];
        if (!unit || unitsToRemove.has(i) || unit.isDying) continue;

        if (unit.hp <= 0) {
            const attackerSpecies = unit.lastAttacker?.species || null;
            handleUnitDeath(unit, i, attackerSpecies);
        }
    }
    // 経験値アイテム
    for (let i = expItems.length - 1; i >= 0; i--) {
        let item = expItems[i];
        const ITEM_LIFETIME = 60000;//アイテムの生存時間
        if (millis() - item.createdAt > ITEM_LIFETIME) {
            expItems.splice(i, 1);
            continue;
        }

        // 1. 回収可能なユニット（プレイヤーと浮遊騎士）のリストを作成
        const collectors = [{ entity: player, range: playerStats.collectRange }];
        for (const unit of units) {
            if (unit.type === 'KNIGHT' && !unit.isDying && !unit.isAppearing) {
                collectors.push({ entity: unit, range: 100 }); // 騎士の回収範囲は100で固定
            }
        }

        // 2. アイテムに最も近い回収者を探す
        let closestCollector = null;
        let minDistance = Infinity;
        for (const collector of collectors) {
            const d = p5.Vector.dist(collector.entity.pos, item.pos);
            if (d < minDistance) {
                minDistance = d;
                closestCollector = collector;
            }
        }

        // 3. 最も近い回収者が回収範囲内にいれば、アイテムを引き寄せる
        if (closestCollector && minDistance < closestCollector.range) {
            item.speed *= 1.05;
            item.vel = p5.Vector.sub(closestCollector.entity.pos, item.pos).normalize().mult(item.speed);
            item.pos.add(item.vel);
            
            // 回収者に到達したら、プレイヤーが経験値を得る
            if (minDistance < 10) {
                playerStats.exp++;
                score += 10;
                expItems.splice(i, 1);
                if (playerStats.exp >= playerStats.expToNext) {
                    const config = getStageConfig(currentStage);
                    const maxPlayerLevel = config.maxPlayerLevel || 60;
                    if (playerStats.level < maxPlayerLevel) {
                        levelUp();
                    } else {
                        playerStats.exp = playerStats.expToNext;
                    }
                }
                continue; // 次のアイテムへ
            }
        }
    }

    // 削除処理
    //([...projectilesToRemove].sort((a, b) => b - a)).forEach(i => {
    //    if (i >= 0 && i < projectiles.length) {
    //        projectiles.splice(i, 1);
    //    } else {
    //    }
    //});
    //projectilesToRemove.clear();
}

function getCameraPosition() {
    const mapSize = getStageConfig(currentStage).mapSize;
    const viewportWidth = 960;
    const viewportHeight = 720;

    // 1. カメラの「理想の座標」（画面端の制限がない場合の位置）
    const idealX = player.pos.x - viewportWidth / 2;
    const idealY = player.pos.y - viewportHeight / 2;

    // 2. 実際に画面に表示される、画面端で制限された「現実の座標」
    const clampedX = constrain(idealX, 0, mapSize.width - viewportWidth);
    const clampedY = constrain(idealY, 0, mapSize.height - viewportHeight);

    // 3. 両方の座標を返す
    return { 
        cameraX: clampedX, 
        cameraY: clampedY,
        idealX: idealX,
        idealY: idealY
    };
}
// マップ背景の描画関数
function drawMap() {
    // ★ 削除: この関数内でのpush/pop及びtranslateは不要になります

    // --- 背景画像の描画 ---
    const config = getStageConfig(currentStage);
    const bgKey = config.backgroundKey;

    if (bgKey && mapBackgrounds[bgKey] && mapBackgrounds[bgKey].p5Image) {
        const bgInfo = mapBackgrounds[bgKey];
        if (bgInfo.p5Image.width) {
            // ★ 変更なし: ワールド座標(0,0)を基準にマップ全体に描画します
            image(bgInfo.p5Image, 0, 0, config.mapSize.width, config.mapSize.height);
        }
    }

    // --- マップ枠線の描画 ---
    const mapSize = config.mapSize;
    stroke(255);
    noFill();
    // ★ 変更なし: ワールド座標(0,0)を基準に枠線を描画します
    rect(0, 0, mapSize.width, mapSize.height);

    // ★ 削除: マップ外の黒塗り処理は、背景描画で代替されるため削除推奨
}

function drawPlayer() {
    //push();
    //const { cameraX, cameraY } = getCameraPosition();
    //translate(player.pos.x - cameraX, player.pos.y - cameraY);

    push();
    translate(player.pos.x, player.pos.y);

    if (playerStats.isFlashing && floor(millis() / 100) % 2 === 0) {
        pop();
        return;
    }
    
    const scaleX = player.facingDirection || 1;
    scale(scaleX, 1);

    const spriteSheet = spriteSheets[selectedCharacter];
    const frameCount = frameCounts[selectedCharacter] || 1;

    if (spriteSheet && spriteSheet.width > 0 && frameCount > 0) {
        if (!player.hasOwnProperty('currentFrame')) player.currentFrame = 0;
        if (!player.hasOwnProperty('lastFrameChange')) player.lastFrameChange = 0;
        
        const frameInterval = 200;
        if (millis() - player.lastFrameChange > frameInterval) {
            player.currentFrame = (player.currentFrame + 1) % frameCount;
            player.lastFrameChange = millis();
        }
        
        image(spriteSheet, -24, -24, 48, 48, player.currentFrame * 48, 0, 48, 48);
    } else {
        fill(0, 255, 0);
        ellipse(0, 0, 48, 48);
    }
    
    // ★ プレイヤーの当たり判定を描画（半径25の円） ★
    if (showHitboxes) {
        noFill();
        stroke(0, 255, 0, 150); // プレイヤーは緑色
        strokeWeight(1);
        scale(scaleX, 1); // 反転を元に戻して円を描画
        ellipse(0, 0, 50, 50);
    }

    pop();
}

function drawOtherEffects() {
    //push();
    //const { cameraX, cameraY } = getCameraPosition();
    //translate(-cameraX, -cameraY);
    updateAndDrawWaterZones(); // ★ 水流地帯の更新と描画
     updateAndDrawWaterZoneProjectiles();  // ★ 投擲物の更新と描画
         updateAndDrawBounceOrbs(); // ★★★ この行を追加 ★★★
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
    }
    // ▲▲▲ ビット描画処理ここまで ▲▲▲

    // 照準ラインの描画
    if (!autoFire) {
        drawAimingLine();
    }

    for (let attack of meleeAttacks) {
        let t = (millis() - attack.time) / attack.duration;
        if (t > 1) continue;
        let alpha = 150 * (1 - t);
        
        push();
        translate(attack.pos.x, attack.pos.y);
        
        // ★ 近接攻撃の当たり判定範囲を枠線で描画
        if (showHitboxes) {
            noFill();
            stroke(255, 255, 100, 200); // 明るい黄色
            strokeWeight(2);
            arc(0, 0, attack.radius * 2, attack.radius * 2, 
                attack.angle - attack.arc / 2, 
                attack.angle + attack.arc / 2, 
                PIE);
        }
        
        // 既存の攻撃エフェクト
        fill(255, 255, 100, alpha);
        noStroke();
        arc(0, 0, attack.radius * 2, attack.radius * 2, 
            attack.angle - attack.arc / 2, 
            attack.angle + attack.arc / 2, 
            PIE);
        pop();
    }

    for (let item of expItems) {
        fill(0, 0, 255);
        ellipse(item.pos.x, item.pos.y, 10, 10);
    }
 // ★★★ ダメージ数値の更新と描画ループを修正 ★★★
    for (let i = damagePopups.length - 1; i >= 0; i--) {
        let popup = damagePopups[i];
        fill(255, 255, 0);
        textSize(16);
        text(popup.text, popup.pos.x, popup.pos.y);
        popup.pos.y -= 1; // 上に移動
        
        // 時間が経過したら配列から削除
        if (millis() - popup.time > 1000) {
            damagePopups.splice(i, 1);
        }
    }

    // ★★★ 範囲エフェクト円の更新と描画ループを修正 ★★★
    for (let i = effectCircles.length - 1; i >= 0; i--) {
        let circle = effectCircles[i];
        let t = (millis() - circle.time) / 300;
        if (t > 1) {
            effectCircles.splice(i, 1);
            continue;
        }
        let scale = t < 0.5 ? t * 2 : 1;
        fill(255, 165, 0, 100 * (1 - t));
        ellipse(circle.pos.x, circle.pos.y, circle.maxRadius * 2 * scale);
    }

    // ★★★ 毒沼の更新と描画ループを修正 ★★★
    for (let i = poisonSwamps.length - 1; i >= 0; i--) {
        let swamp = poisonSwamps[i];
        fill(0, 128, 0, 100);
        ellipse(swamp.pos.x, swamp.pos.y, swamp.radius * 2);

        // 時間が経過したら配列から削除
        if (millis() - swamp.time > 4000) {
            poisonSwamps.splice(i, 1);
        }
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

}

function drawAimingLine() {
    // 照準ラインの見た目を定義する定数
    const AIM_LENGTH = 500; // ラインの長さ
    const AIM_ARC_DEGREES = 5; // 補助範囲の片側の角度（5度）

    push(); // 描画設定を一時的に保存

    // プレイヤーの位置を原点に移動
    translate(player.pos.x, player.pos.y);
    // グローバル変数 aimAngle の値だけ描画全体を回転させる
    rotate(aimAngle);

    // --- 補助範囲の描画 (半透明の扇形) ---
    noStroke(); // 扇形の枠線はなし
    fill(173, 216, 230, 80); // 半透明の薄い青色 (R, G, B, Alpha)
    // arc()を使って扇形を描画します。描画全体を回転させているため、0度を中心に左右5度ずつ描画すればOKです。
    arc(0, 0, AIM_LENGTH * 2, AIM_LENGTH * 2, -radians(AIM_ARC_DEGREES), radians(AIM_ARC_DEGREES), PIE);

    // --- 中央の軸線の描画 ---
    stroke(0, 150, 255, 200); // やや透明度のある青色
    strokeWeight(2); // 線の太さ
    // 描画全体を回転させているため、原点(0,0)からX軸の正方向へ直線を引くだけでOKです。
    line(0, 0, AIM_LENGTH, 0);

    pop(); // 保存した描画設定に戻す
}
function drawBullets() {
    //push();
    //const { cameraX, cameraY } = getCameraPosition();
    //translate(-cameraX, -cameraY);
    for (let p of projectiles) {
        if (p.sourceAffiliation !== 'ally') continue;
        
        let bulletSize = 10 * (p.sizeScale || playerStats.bulletSizeScale);
        
        // ★ 弾の当たり判定を描画
        if (showHitboxes) {
            noFill();
            stroke(255, 255, 0, 150); // 味方の弾は黄色
            strokeWeight(1);
            ellipse(p.pos.x, p.pos.y, bulletSize, bulletSize);
        }
        
        fill(255, 255, 0);
        noStroke();
        ellipse(p.pos.x, p.pos.y, bulletSize, bulletSize);
    }
    //pop();
}

function drawUnitBullets() {
    //push();
    //const { cameraX, cameraY } = getCameraPosition();
    //translate(-cameraX, -cameraY);
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
   // pop();
}

function updateAndDrawWaterZoneProjectiles() {
    for (let i = waterZoneProjectiles.length - 1; i >= 0; i--) {
        const p = waterZoneProjectiles[i];

        // 物理演算
        p.vel.y += p.gravity;
        p.pos.add(p.vel);

        // 描画
        push();
        translate(p.pos.x, p.pos.y);
        fill(p.color);
        noStroke();
        ellipse(0, 0, 10, 10);
        pop();

        // 着弾判定
        if (millis() - p.createdAt > 1000) {
            // 水流地帯を生成
            waterZones.push({
                pos: p.pos.copy(),
                radius: playerStats.waterZone_radius,
                duration: playerStats.waterZone_duration,
                slowFactor: playerStats.waterZone_slowFactor,
                createdAt: millis()
            });
            // 投擲物を削除
            waterZoneProjectiles.splice(i, 1);
        }
    }
}

/**
 * 水流地帯の状態更新と描画を行う
 */
function updateAndDrawWaterZones() {
    for (let i = waterZones.length - 1; i >= 0; i--) {
        const zone = waterZones[i];

        // 効果時間が過ぎたら削除
        if (millis() - zone.createdAt > zone.duration) {
            waterZones.splice(i, 1);
            continue;
        }

        // 描画
        const life = 1 - (millis() - zone.createdAt) / zone.duration; // 残り寿命(0-1)
        push();
        translate(zone.pos.x, zone.pos.y);
        noStroke();
        fill(0, 120, 255, 80 * life); // 時間経過で薄くなる
        ellipse(0, 0, zone.radius * 2, zone.radius * 2);
        pop();
    }
}
function updateAndDrawBounceOrbs() {
    //const { cameraX, cameraY } = getCameraPosition();
    //const viewportWidth = 960;
    //const viewportHeight = 720;
    //const screenCenter = createVector(cameraX + viewportWidth / 2, cameraY + viewportHeight / 2);

    for (const orb of bounceOrbs) {
        const isPlaying = gameState === 'playing' || gameState === 'boss';
        if (isPlaying) {
            orb.pos.add(orb.vel);
                        const { cameraX, cameraY } = getCameraPosition();
            const viewportWidth = 960;
            const viewportHeight = 720;

            const bounceCorrectionFactor = 0.2;
            let bounced = false;

            if ((orb.pos.x - orb.radius < cameraX && orb.vel.x < 0) || (orb.pos.x + orb.radius > cameraX + viewportWidth && orb.vel.x > 0)) {
                orb.vel.x *= -1;
                bounced = true;
            }
            if ((orb.pos.y - orb.radius < cameraY && orb.vel.y < 0) || (orb.pos.y + orb.radius > cameraY + viewportHeight && orb.vel.y > 0)) {
                orb.vel.y *= -1;
                bounced = true;
            }
            
            if (bounced) {
                const correctionVector = p5.Vector.sub(screenCenter, orb.pos).normalize();
                orb.vel.lerp(correctionVector, bounceCorrectionFactor);
                orb.vel.setMag(playerStats.bounceEnergy_speed);
            }

            orb.pos.x = constrain(orb.pos.x, cameraX + orb.radius, cameraX + viewportWidth - orb.radius);
            orb.pos.y = constrain(orb.pos.y, cameraY + orb.radius, cameraY + viewportHeight - orb.radius);
            
            const { col, row } = getGridCoords(orb.pos);
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                for (let rOffset = -1; rOffset <= 1; rOffset++) {
                    const checkCol = col + cOffset;
                    const checkRow = row + rOffset;
                    if (checkCol < 0 || checkCol >= gridCols || checkRow < 0 || checkRow >= gridRows) continue;

                    for (const unit of grid[checkCol][checkRow]) {
                        // ★★★ ここからが修正箇所 ★★★
                        const unitIndex = units.indexOf(unit);
                        // 敵であり、かつ死亡演出中でもなく、削除リストにも入っていないことを確認
                        if (unit.affiliation === 'enemy' && !unit.isDying && !unitsToRemove.has(unitIndex)) {
                        // ★★★ 修正ここまで ★★★
                            const distance = p5.Vector.dist(orb.pos, unit.pos);
                            if (distance < orb.radius + unit.size / 2) {
                                const lastHitTime = orb.hitUnits.get(unit) || 0;
                                if (millis() - lastHitTime > 500) {
                                    unit.hp -= orb.damage;
                                    damagePopups.push({ pos: unit.pos.copy(), text: orb.damage.toFixed(0), time: millis() });
                                    if (unit.hp <= 0) {
                                        handleUnitDeath(unit, unitIndex); // indexOfをやめて、事前に取得したインデックスを使用
                                    }
                                    orb.hitUnits.set(unit, millis());
                                }
                            }
                        }
                    }
                }
            }
        }

        push();
        translate(orb.pos.x, orb.pos.y);
        noStroke();
        const pulse = sin(millis() * 0.005) * 0.2 + 0.8;
        fill(100, 255, 200, 150 * pulse);
        ellipse(0, 0, orb.radius * 2 * pulse, orb.radius * 2 * pulse);
        fill(200, 255, 230, 200 * pulse);
        ellipse(0, 0, orb.radius * 1.2, orb.radius * 1.2);
        pop();
    }
}
function drawVirtualCursor() {
    // ★★★ 1. ゲーム状態に応じて、描画するカーソル画像を選択 ★★★
    let cursorToShow;
    const isGameplay = (gameState === 'playing' || gameState === 'boss');

    if (isGameplay) {
        cursorToShow = aimingCursorImage; // ゲームプレイ中は「照準」
    } else {
        cursorToShow = uiCursorImage;      // それ以外の画面では「メニュー用ポインター」
    }

    // 描画すべき画像が読み込めていなければ、処理を中断
    if (!cursorToShow || cursorToShow.width === 0) return;

    // --- 2. 描画処理（変更なし） ---
    const drawX = virtualCursorPos.x;
    const drawY = virtualCursorPos.y;
    
    // カーソル画像のサイズを定義（両方の画像で共通のサイズを使用）
    const imgSize = 48; 

    push();
    resetMatrix();
    scale(globalScale);
    
    // 画像の中心がカーソル位置になるように描画
    image(cursorToShow, drawX - imgSize / 2, drawY - imgSize / 2, imgSize, imgSize);
    pop();
}
/**
 * ユニットの特殊ステートエフェクトを描画する
 * @param {object} unit - 対象のユニット
 */
function drawStateEffect(unit) {
    // この関数は、既にカメラ座標でtranslateされたコンテキストで呼び出される
    push();
    // ユニットの絶対座標に移動
    translate(unit.pos.x, unit.pos.y);

    switch (unit.stateEffect) {
        
        // --- 例1: ハートの吹き出し ---
        case 'heart':
            // 吹き出し本体
            fill(255, 255, 255, 220); // 白い半透明
            noStroke();
            // ユニットの少し上に描画
            rect(-25, -70, 50, 40, 10); // 吹き出しの四角形
            beginShape();
            vertex(-10, -30);
            vertex(10, -30);
            vertex(0, -20);
            endShape(CLOSE);
            
            // ハートマーク
            fill(255, 105, 180); // ピンク色
            textSize(24);
            textAlign(CENTER, CENTER);
            text('♡', 0, -52);
            break;

        // --- 例2: 紫色のオーラ ---
        case 'evil':
            noStroke();
            // パルス状に明滅するエフェクト
            const pulse1 = sin(millis() * 0.005) * 5 + (unit.size / 2);
            const pulse2 = sin(millis() * 0.005 + PI / 2) * 5 + (unit.size / 2);
            
            // 外側の濃いオーラ
            fill(128, 0, 128, 50);
            ellipse(0, 0, pulse1 * 2, pulse1 * 1.5);
            
            // 内側の薄いオーラ
            fill(238, 130, 238, 60);
            ellipse(0, 0, pulse2 * 1.5, pulse2 * 2);
            break;
            
        // 将来的に他のエフェクトを追加する場合は、ここに case を追加
        // case 'poison':
        //     // ...毒のエフェクト...
        //     break;
    }

    pop();
}

//地形当たり判定
function getTerrainCollision(pos, radius = 1) {
    const config = getStageConfig(currentStage);
    if (!config.terrain || config.terrain.length === 0) return null;

    for (const shape of config.terrain) {
        if (shape.type !== 1) continue;

        let collisionPoint = null;
        switch (shape.shape) {
            case 'rect':
                // 最も近い点を計算
                const closestX = constrain(pos.x, shape.x, shape.x + shape.w);
                const closestY = constrain(pos.y, shape.y, shape.y + shape.h);
                if (dist(pos.x, pos.y, closestX, closestY) < radius) {
                    return { shape: shape, point: createVector(closestX, closestY) };
                }
                break;
            case 'circle':
                if (dist(pos.x, pos.y, shape.x, shape.y) < shape.r + radius) {
                    // 円の中心からposへのベクトルを計算し、円周上の衝突点を求める
                    const dir = p5.Vector.sub(pos, createVector(shape.x, shape.y)).normalize();
                    const pointOnEdge = createVector(shape.x, shape.y).add(dir.mult(shape.r));
                    return { shape: shape, point: pointOnEdge };
                }
                break;
            case 'ellipse': // ★ 楕円の当たり判定を追加
                // 楕円の公式 (x/rx)^2 + (y/ry)^2 < 1 を利用
                const dx = pos.x - shape.x;
                const dy = pos.y - shape.y;
                if ((dx * dx) / (shape.rx * shape.rx) + (dy * dy) / (shape.ry * shape.ry) < 1) {
                     // 簡易的な衝突点として、中心からposへの方向にある楕円周上の点を返す
                    const angle = atan2(dy, dx);
                    const pointOnEdge = createVector(
                        shape.x + shape.rx * cos(angle),
                        shape.y + shape.ry * sin(angle)
                    );
                    return { shape: shape, point: pointOnEdge };
                }
                break;

            case 'triangle': // ★ 三角形の当たり判定を実装
                const v1 = { x: shape.x1, y: shape.y1 };
                const v2 = { x: shape.x2, y: shape.y2 };
                const v3 = { x: shape.x3, y: shape.y3 };

                const d1 = sign(pos, v1, v2);
                const d2 = sign(pos, v2, v3);
                const d3 = sign(pos, v3, v1);

                const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
                const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

                // 全ての辺に対して同じ側にあれば、点は三角形の内部
                if (!(has_neg && has_pos)) {
                    // 衝突点は別途計算が必要だが、ここでは簡易的に重心を返す
                    // getCollisionNormalで正確な辺を特定するため、ここではnullでも良い
                    return { shape: shape, point: null };
                }
                break;
        }
    }
    return null;
}

// 点と線分上の最も近い点を計算するヘルパー関数
function getClosestPointOnSegment(p, a, b) {
    const ab = p5.Vector.sub(b, a);
    const ap = p5.Vector.sub(p, a);
    const t = constrain(ap.dot(ab) / ab.magSq(), 0, 1);
    return p5.Vector.add(a, ab.mult(t));
}


// 衝突情報から法線ベクトルを計算する新しい関数
function getCollisionNormal(pos, collisionInfo) {
    if (!collisionInfo) {
        return null;
    }
    
    const shape = collisionInfo.shape;

    // 1. 三角形の場合の法線計算
    if (shape.shape === 'triangle') {
        const v1 = createVector(shape.x1, shape.y1);
        const v2 = createVector(shape.x2, shape.y2);
        const v3 = createVector(shape.x3, shape.y3);
        
        const edges = [[v1, v2], [v2, v3], [v3, v1]];
        let minDistSq = Infinity;
        let closestPoint = null;

        // 3つの辺それぞれに対して最も近い点を探し、最短距離のものを選択する
        for (const edge of edges) {
            const pt = getClosestPointOnSegment(pos, edge[0], edge[1]);
            const dSq = p5.Vector.dist(pos, pt);
            if (dSq < minDistSq) {
                minDistSq = dSq;
                closestPoint = pt;
            }
        }
        
        // 衝突点（最も近い点）からキャラクターの位置へのベクトルが法線となる
        const normal = p5.Vector.sub(pos, closestPoint);
        if (normal.magSq() > 0) {
            return normal.normalize();
        }
    }

    // 2. 矩形、円、楕円の場合の法線計算
    // getTerrainCollisionで計算済みの衝突点(collisionInfo.point)を利用する
    if (collisionInfo.point) {
        const normal = p5.Vector.sub(pos, collisionInfo.point);
        if (normal.magSq() > 0) {
            return normal.normalize();
        }
    }
    
    // 3. フォールバック処理（キャラクターが図形の中心に完全に重なった場合など）
    let fallbackCenter;
    if (shape.shape === 'rect') {
        fallbackCenter = createVector(shape.x + shape.w / 2, shape.y + shape.h / 2);
    } else { // circle, ellipse
        fallbackCenter = createVector(shape.x, shape.y);
    }
    
    const fallbackNormal = p5.Vector.sub(pos, fallbackCenter);
    
    // 最終的にゼロベクトルになった場合は、真上を法線として返す
    return fallbackNormal.magSq() > 0 ? fallbackNormal.normalize() : createVector(0, -1);
}