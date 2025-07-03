
let lastGridLog = 0;
let lastShieldLog = 0;
let lastWaterZoneTime = 0;// 水流地帯のクールダウンタイマー
let bitSystemAngle = 0;
let shootingBitSystemAngle = 0;
let aimAngle = 0; // ★★★ 照準角度を保持するグローバル変数を宣言 ★★★
// ★★★ 1. ファイルの先頭に、騎士の召喚ルールに関する変数を追加 ★★★
let lastKnightSpawnTime = 0; // 最後に騎士を召喚した時間
const KNIGHT_SPAWN_COOLDOWN = 4000; // 召喚クールダウン（4秒）
const KNIGHT_SPAWN_DISTANCE = 100; // プレイヤーからの出現距離


function executeMeleeSlash(angle) {
    if (playerStats.attackSe) {
        playSE(playerStats.attackSe);
    }
    meleeAttacks.push({
        pos: player.pos.copy(),
        angle: angle,
        arc: playerStats.meleeArc,
        radius: playerStats.attackRange,
        damage: playerStats.attack,
        time: millis(),
        duration: 250,
        hitUnits: new Set(),
         sourceAffiliation: 'ally',
        // ★ 攻撃の発生源の種族情報を追加
        sourceSpecies: characterParams[selectedCharacter]?.species || 'player' 
    });
}

// ★ executeKnightAttack関数を、より汎用的な executeAllyMeleeAttack にリネーム＆修正
/**
 * 味方ユニット（騎士やガード）が近接攻撃を実行する
 * @param {object} sourceUnit - 攻撃する味方ユニット
 * @param {object} targetUnit - 攻撃対象の敵ユニット
 */
function executeAllyMeleeAttack(sourceUnit, targetUnit) {
    const sourceConfig = unitTypes[sourceUnit.type];
    if (!sourceConfig) return;

    // ★★★ ユニット自身のステータスと設定値を正しく参照するように修正 ★★★
    const damage = (sourceUnit.contactDamage || 0) * (sourceUnit.attackMultiplier || 1);
    const attackRange = sourceConfig.attackRange || 50;
    const attackArc = sourceConfig.meleeArc ? sourceConfig.meleeArc : radians(90);

    // 攻撃SEを再生
    if (sourceConfig.attackSe) {
        playSE(sourceConfig.attackSe);
    }
    
    meleeAttacks.push({
        pos: sourceUnit.pos.copy(),
        angle: p5.Vector.sub(targetUnit.pos, sourceUnit.pos).heading(),
        arc: attackArc,
        radius: attackRange,
        damage: damage,
        time: millis(),
        duration: 250,
        hitUnits: new Set(),
        sourceAffiliation: 'ally',
        // ★ 攻撃の発生源の種族情報を追加
        sourceSpecies: sourceConfig.species 
    });
}

function executeKnightAttack(knight, target) {
    // 騎士の攻撃力倍率を一時的に設定して汎用関数を呼び出す
    knight.attackMultiplier = playerStats.floatingKnight_attackMultiplier;
    executeAllyMeleeAttack(knight, target);
    delete knight.attackMultiplier; // 一時的なプロパティを削除
}

function updateFloatingKnights() {
    // アップグレード未取得なら何もしない
    if (!playerStats.floatingKnight_maxCount || playerStats.floatingKnight_maxCount <= 0) {
        return;
    }

    // 召喚クールダウン中なら何もしない
    if (millis() - lastKnightSpawnTime < KNIGHT_SPAWN_COOLDOWN) {
        return;
    }

    // 現在の騎士の数をカウント
    const activeKnights = units.filter(u => u.type === 'KNIGHT' && !u.isDying).length;

    // 最大数より少なければ、足りない分を召喚
    if (activeKnights < playerStats.floatingKnight_maxCount) {
        const knightsToSpawn = playerStats.floatingKnight_maxCount - activeKnights;
        
        // 新しいヘルパー関数を呼び出して、出現位置のリストを取得
        const spawnPositions = getKnightSpawnPositions(player.pos, knightsToSpawn);

        // 各出現位置に騎士を一体ずつ召喚
        for (const spawnPos of spawnPositions) {
            const knightConfig = unitTypes.KNIGHT;

            const newKnight = {
                pos: spawnPos,
                vel: createVector(0, 0),
                type: 'KNIGHT',
                hp: floor(playerStats.maxHp / 4),
                speed: playerStats.moveSpeed * 1.5,
                size: knightConfig.size, // ★★★ この一行を追加して、当たり判定の大きさを設定 ★★★
                contactDamage: playerStats.attack * playerStats.floatingKnight_attackMultiplier,
                lastAttackTime: 0,
                vectorUnder: knightConfig.vectorUnder,
                currentFrame: 0,
                lastFrameChange: 0,
                frameIndex: 0,
                animationDirection: 1,
                species: knightConfig.species,
                affiliation: 'ally',
                isAppearing: true,
                appearanceStartTime: millis(),
                isDying: false,
                orbitAngle: random(TWO_PI)
            };
            units.push(newKnight);
            addUnitToGrid(newKnight);
        }
        
        console.log(`Spawned ${knightsToSpawn} Floating Knight(s) in formation.`);
        
        // 召喚が完了したら、クールダウンタイマーをリセット
        lastKnightSpawnTime = millis();
    }
}

/**
 * 召喚数に応じた浮遊騎士の出現位置（複数）を計算して返す
 * @param {p5.Vector} centerPos - 中心の位置（プレイヤーの位置）
 * @param {number} count - 召喚する数
 * @returns {p5.Vector[]} - 出現位置のベクトル配列
**/
function getKnightSpawnPositions(centerPos, count) {
    const positions = [];
    if (count <= 0) return positions;

    switch (count) {
        case 1:
            // 1体の場合：プレイヤーの下方に出現
            positions.push(centerPos.copy().add(0, KNIGHT_SPAWN_DISTANCE));
            break;
        case 2:
            // 2体の場合：プレイヤーの両端（左右）に出現
            positions.push(centerPos.copy().add(-KNIGHT_SPAWN_DISTANCE, 0));
            positions.push(centerPos.copy().add(KNIGHT_SPAWN_DISTANCE, 0));
            break;
        case 3:
            // 3体の場合：プレイヤーを囲む正三角形の頂点に出現
            const startAngle = -PI / 2; // 最初の1体を真上に出現させるための開始角度
            for (let i = 0; i < 3; i++) {
                const angle = startAngle + i * (TWO_PI / 3); // 120度ずつずらす
                const offset = p5.Vector.fromAngle(angle).mult(KNIGHT_SPAWN_DISTANCE);
                positions.push(p5.Vector.add(centerPos, offset));
            }
            break;
        default:
            // 4体以上の場合（将来的な拡張のため）：プレイヤーの周囲に円形に配置
            const angleStep = TWO_PI / count;
            for (let i = 0; i < count; i++) {
                const angle = i * angleStep;
                const offset = p5.Vector.fromAngle(angle).mult(KNIGHT_SPAWN_DISTANCE);
                positions.push(p5.Vector.add(centerPos, offset));
            }
            break;
    }
    return positions;
}


function updatePlayer() {
    // ★ エディタモード中はこの関数の大部分をスキップ
    if (gameState === 'mapEditor') return; 
    if (gameState !== 'playing' && gameState !== 'boss') return;
        updateWaterZone(); // 水流地帯の関数を呼び出す
            updateBounceEnergy(); // バウンスエナジーの関数
updateFloatingKnights(); // ★★★ 騎士の管理関数を呼び出す ★★★
    if (!player || isNaN(player.pos.x) || isNaN(player.pos.y)) {
        const mapSize = getStageConfig(currentStage).mapSize;
        player = { pos: createVector(mapSize.width / 2, mapSize.height / 2), vel: createVector(0, 0), lastShot: 0 };
    }

    // ★★★ 自爆シーケンス処理を追加 ★★★
    if (playerStats.isSuiciding) {
        const SUICIDE_INTERVAL = 100; // 0.1秒ごとにダメージ
        if (millis() - playerStats.lastSuicideTick > SUICIDE_INTERVAL) {
            if (playerStats.suicideTicks > 0) {
                // 無敵状態を無視してHPを直接減らす
                playerStats.hp -= 999;
                
                // ダメージを受けた際の視覚効果を追加
                damagePopups.push({
                    pos: player.pos.copy(),
                    text: '999',
                    time: millis(),
                });
                playerStats.isFlashing = true; // 点滅させる
                playerStats.flashStart = millis();

                playerStats.suicideTicks--;
                playerStats.lastSuicideTick = millis();
            } else {
                playerStats.isSuiciding = false; // シーケンス終了
            }
        }
    }

    // 移動 (変更なし)
    let moveDir = createVector(0, 0);
    if (keyIsDown(87)) moveDir.y -= 1;
    if (keyIsDown(83)) moveDir.y += 1;
    if (keyIsDown(65)) moveDir.x -= 1;
    if (keyIsDown(68)) moveDir.x += 1;
    
    if (moveDir.magSq() > 0) {
        moveDir.normalize().mult(playerStats.moveSpeed);
    }
    player.vel = moveDir;

    // --- 衝突と滑りのロジック ---
    const playerRadius = 24; // プレイヤーの当たり判定の半径
    const newPos = p5.Vector.add(player.pos, player.vel);
    
    // 1. まず、移動先の座標で衝突をチェック
    const collision = getTerrainCollision(newPos, playerRadius);

    if (collision) {
        // 衝突した場合、滑るベクトルを計算して移動
        const normal = getCollisionNormal(newPos, collision);
        const dot = player.vel.dot(normal);
        const perpendicularVel = normal.mult(dot);
        const slideVel = p5.Vector.sub(player.vel, perpendicularVel);
        player.pos.add(slideVel);
    } else {
        // 衝突しない場合は、通常通り移動
        player.pos.add(player.vel);
    }

    // ★★★ ここからが新しい「押し出し」処理です ★★★
    // 2. 移動後の現在地で、再度衝突をチェック（めり込みが発生しているか確認）
    const finalCollision = getTerrainCollision(player.pos, playerRadius);
    if (finalCollision) {
        // 3. もしめり込んでいたら、壁の法線方向に少しだけ押し出して補正する
        const finalNormal = getCollisionNormal(player.pos, finalCollision);
        // 押し出す強さは、キャラクターが1フレームで壁を抜け出せる程度に調整
        player.pos.add(finalNormal.mult(1.0)); 
    }
    // --- 向きの状態を更新 ---
    // 左右への明確な移動があった場合にのみ、向きを記憶する
    if (abs(player.vel.x) > 0.1) {
        player.facingDirection = (player.vel.x > 0) ? 1 : -1;
    }
    // 停止している（vel.xが0に近い）場合は、facingDirectionは更新されない
    const mapSize = getStageConfig(currentStage).mapSize; //
    player.pos.x = constrain(player.pos.x, 0, mapSize.width); //
    player.pos.y = constrain(player.pos.y, 0, mapSize.height); //

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
    updateAimingSystem();
    let finalAttackSpeed = playerStats.attackSpeed;

    // 2. 自動照準がONの場合、ペナルティとして攻撃速度を1.25倍（レートを0.8倍）にする
    if (autoFire) {
        finalAttackSpeed *= 1.25;
    }
    
    // 攻撃 
    if (playerStats.isMelee) {
        if (playerStats.isSlashing) {
            const totalSlashes = 1 + playerStats.consecutiveSlashes;
            if (playerStats.slashCount < totalSlashes) {
                const nextSlashTime = player.comboStartTime + (playerStats.slashCount * playerStats.consecutiveSlashInterval);
                if (millis() >= nextSlashTime) {
                    executeMeleeSlash(aimAngle);
                    playerStats.slashCount++;
                }
            } else {
                playerStats.isSlashing = false;
                player.lastShot = millis();
            }
        } else {
            // 3. 計算した finalAttackSpeed を使用する
            if (millis() - player.lastShot > finalAttackSpeed) {
                playerStats.isSlashing = true;
                player.comboStartTime = millis();
                playerStats.slashCount = 1;
                executeMeleeSlash(aimAngle);
            }
        }
    } else { 
        // 遠距離攻撃
        // 3. 計算した finalAttackSpeed を使用する
        if (millis() - player.lastShot > finalAttackSpeed) {
            if (playerStats.attackSe) {
                playSE(playerStats.attackSe);
            }
            
            let ways = playerStats.attackWays;
            for (let i = -(ways - 1) / 2; i <= (ways - 1) / 2; i++) {
                let offset = i * PI / 12;
                projectiles.push({
                    pos: player.pos.copy(),
                    vel: p5.Vector.fromAngle(aimAngle + offset).mult(playerStats.bulletSpeed),
                    damage: playerStats.attack,
                    pierce: playerStats.pierceCount,
                    sourceAffiliation: 'ally',
                    origin: player.pos.copy(),
                    range: playerStats.attackRange,
                    createdTime: millis()
                });
            }
            player.lastShot = millis();
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
// 水流地帯
function updateWaterZone() {
    if (!playerStats.waterZone_enabled || playerStats.waterZone_count <= 0) {
        return; // アップグレード未取得なら何もしない
    }

    // クールダウン中かチェック
    if (millis() - lastWaterZoneTime < playerStats.waterZone_cooldown) {
        return;
    }

    lastWaterZoneTime = millis(); // タイマーをリセット

    // 設定された個数だけ投擲物を生成
    for (let i = 0; i < playerStats.waterZone_count; i++) {
        // プレイヤーの周囲100～150の範囲にランダムな着弾点を設定
        const angle = random(TWO_PI);
        const distance = random(100, 150);
        const targetPos = p5.Vector.add(player.pos, p5.Vector.fromAngle(angle).mult(distance));

        // 放物線運動の計算
        const gravity = 0.2;
        const travelTime = 60;
        const startPos = player.pos.copy();
        const initialVel = p5.Vector.sub(targetPos, startPos).div(travelTime);
        initialVel.y -= 0.5 * gravity * travelTime;

        // ★★★ データを追加する配列名を変更 ★★★
        waterZoneProjectiles.push({ // parabolicProjectiles から変更
            pos: startPos,
            vel: initialVel,
            gravity: gravity,
            color: color(100, 150, 255),
            createdAt: millis()
        });
    }
}
function updateBounceEnergy() {
    if (!playerStats.bounceEnergy_enabled) return;

    const desiredCount = playerStats.bounceEnergy_count;
    
    // 現在のオーブ数が、アップグレードで指定された数より少ない場合は追加する
    while (bounceOrbs.length < desiredCount) {
        bounceOrbs.push({
            pos: player.pos.copy().add(random(-20, 20), random(-20, 20)), // プレイヤーの近くに生成
            vel: p5.Vector.random2D().mult(playerStats.bounceEnergy_speed), // ランダムな方向に発射
            hitUnits: new Map(), // 1ヒットあたりのクールダウンを管理
        });
    }

    // 数が多すぎる場合は削除（アップグレードがダウングレードすることは通常ないが、念のため）
    while (bounceOrbs.length > desiredCount) {
        bounceOrbs.pop();
    }

    // 既存のオーブのステータスを更新する（ダメージや半径がアップグレードされた場合に対応）
    for (const orb of bounceOrbs) {
        orb.radius = playerStats.bounceEnergy_radius;
        orb.damage = playerStats.attack * playerStats.bounceEnergy_damageMultiplier;
        // 速度は一度設定したら変更しない、またはここで再設定も可能
        // orb.vel.setMag(playerStats.bounceEnergy_speed); 
    }
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
            if (!u || u.isDying || unitsToRemove.has(i)) continue;
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
               if (!u || u.isDying || !['enemy', 'enemy2', 'none'].includes(u.affiliation)) continue;
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
            if (!u || u.isDying || p5.Vector.sub(player.pos, u.pos).mag() >= playerStats.waveRadius || !['enemy', 'enemy2', 'none'].includes(u.affiliation)) continue;
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
    // ★★★ プレイヤーのHP状態を更新 ★★★
    if (playerStats && playerStats.maxHp > 0) {
        // ★★★ 状態変化を検知するために、現在の状態レベルを一時的に保持 ★★★
        const oldStatusLevel = playerStats.portraitStatusLevel;

        const hpPercentage = playerStats.hp / playerStats.maxHp;
        let currentCalculatedLevel = 3;

        if (playerStats.hp <= 0) {
            currentCalculatedLevel = 0;
        } else if (hpPercentage < 0.3) {
            currentCalculatedLevel = 1;
        } else if (hpPercentage < 0.6) {
            currentCalculatedLevel = 2;
        }

        // 状態が悪化した場合のみ、記録されているレベルを更新
        if (currentCalculatedLevel < playerStats.portraitStatusLevel) {
            playerStats.portraitStatusLevel = currentCalculatedLevel;
        }

        // ★★★ 状態レベルが「下がった」瞬間にフラッシュを開始 ★★★
        if (playerStats.portraitStatusLevel < oldStatusLevel) {
            portraitFlashActive = true;
            portraitFlashStart = millis();
        }
    }

    // ★★★ 全てのHP変動処理の後に、汎用的な死亡判定を追加 ★★★
    if (playerStats.hp <= 0 && gameState !== 'gameOver') {
        setGameState('gameOver');
    }

    updateGrid();
    updateShield();
}


function handleBitAttack(x, y) {
    const maxIterations = 10000; //
    let loopCounter = 0; //
    for (let j = units.length - 1; j >= 0; j--) { //
       if (!units[j] || units[j].isDying) continue;
        loopCounter++; //
        if (loopCounter > maxIterations) break; //
        let u = units[j];
        if (!['enemy', 'enemy2', 'none'].includes(u.affiliation)) continue;
        let bitHitRadius = u.type == 'Z' ? 35 : 15;
        if (p5.Vector.sub(u.pos, createVector(x, y)).mag() < bitHitRadius) {
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

/**
 * 照準システムを更新する（ポインターロック＋最終版・画面端補正方式）
 */
async function updateAimingSystem() {
    // 自動照準が有効な場合は、そちらを優先
    if (autoFire) {
        aimAngle = getAutoAimAngle();
        return;
    }

    try {
        // --- 1. 補正計算の前に、マウスの移動量で仮想カーソルを更新 ---
        // このステップは game.js の mousemove イベントリスナーが担当しているため、
        // ここでは何もしなくても virtualCursorPos は常に最新の状態になっています。

        // --- 2. 画面端でのカメラ停止によるズレを補正 ---
        const { cameraX, cameraY, idealX, idealY } = getCameraPosition();
        
        // a. カメラがX軸（左右）で動けなかった差分を計算
        const cameraStuckX = idealX - cameraX;
        // b. カメラがY軸（上下）で動けなかった差分を計算
        const cameraStuckY = idealY - cameraY;

        // c. プレイヤーが画面端で動いた分だけ、仮想カーソルも移動させる
        //    (ただし、これはオプションが有効な場合のみ)
        if (enableMouseCorrection) {
            // player.vel は updatePlayer で計算された、プレイヤーの現在のフレームでの移動量
            if (cameraStuckX !== 0) {
                virtualCursorPos.x += player.vel.x;
            }
            if (cameraStuckY !== 0) {
                virtualCursorPos.y += player.vel.y;
            }

            // d. 補正後の仮想カーソルがゲーム画面(960x720)からはみ出ないように制限
            const gameWidth = 960;
            const gameHeight = 720;
            virtualCursorPos.x = constrain(virtualCursorPos.x, 0, gameWidth);
            virtualCursorPos.y = constrain(virtualCursorPos.y, 0, gameHeight);
        }

        // --- 3. 最終的な照準角度を計算 ---
        //    プレイヤーの「画面上の座標」を計算
        const playerScreenX = player.pos.x - cameraX;
        const playerScreenY = player.pos.y - cameraY;

        //    補正後の仮想カーソル位置とプレイヤーの画面位置から角度を算出
        aimAngle = atan2(virtualCursorPos.y - playerScreenY, virtualCursorPos.x - playerScreenX);

    } catch (err) {
        // Electron APIが使えない場合のフォールバック（変更なし）
        console.error("Failed to update aim from Electron API:", err);
        const { cameraX, cameraY } = getCameraPosition();
        const virtualMouseX = mouseX / globalScale;
        const virtualMouseY = mouseY / globalScale;
        let mouseWorldX = virtualMouseX + cameraX;
        let mouseWorldY = virtualMouseY + cameraY;
        aimAngle = atan2(mouseWorldY - player.pos.y, mouseWorldX - player.pos.x);
    }
}

/**
 * 自動照準のターゲット角度を計算する
 * @returns {number} - ターゲットへの角度（ラジアン）
 */
function getAutoAimAngle() {
    let closest = units.reduce((c, u) => {
        // ★★★ 攻撃可能な敵（'enemy'）のみをターゲットにするように修正 ★★★
        if (!u || u.isDying || u.isAppearing || u.affiliation !== 'enemy') {
            return c;
        }
        let d = p5.Vector.sub(u.pos, player.pos).mag();
        return d < c.dist ? { u, dist: d } : c;
    }, { dist: Infinity });

    if (debugLog && debugMode && closest.u) {
        console.log(`AutoAim: unit type=${closest.u.type}, affiliation=${closest.u.affiliation}, index=${units.indexOf(closest.u)}, dist=${closest.dist.toFixed(1)}`);
    }

    // ターゲットがいればその方向、いなければランダムな方向を返す
    return closest.u ? atan2(closest.u.pos.y - player.pos.y, closest.u.pos.x - player.pos.x) : random(TWO_PI);
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

// プレイヤーの移動だけを更新する新しい関数
function updatePlayerMovement() {
    if (gameState !== 'mapEditor') return;

    let moveDir = createVector(0, 0);
    if (keyIsDown(87)) moveDir.y -= 1;
    if (keyIsDown(83)) moveDir.y += 1;
    if (keyIsDown(65)) moveDir.x -= 1;
    if (keyIsDown(68)) moveDir.x += 1;
    
    if (moveDir.magSq() > 0) {
        moveDir.normalize().mult(playerStats.moveSpeed);
    }
    player.vel = moveDir;

    const playerRadius = 24;
    const newPos = p5.Vector.add(player.pos, player.vel);
    const collision = getTerrainCollision(newPos, playerRadius);

    if (collision) {
        const normal = getCollisionNormal(newPos, collision);
        const dot = player.vel.dot(normal);
        const perpendicularVel = normal.mult(dot);
        const slideVel = p5.Vector.sub(player.vel, perpendicularVel);
        player.pos.add(slideVel);
    } else {
        player.pos.add(player.vel);
    }

    // ★★★ こちらにも「押し出し」処理を追加 ★★★
    const finalCollision = getTerrainCollision(player.pos, playerRadius);
    if (finalCollision) {
        const finalNormal = getCollisionNormal(player.pos, finalCollision);
        player.pos.add(finalNormal.mult(1.0));
    }

    if (abs(player.vel.x) > 0.1) {
        player.facingDirection = (player.vel.x > 0) ? 1 : -1;
    }

    const mapSize = getStageConfig(currentStage).mapSize;
    player.pos.x = constrain(player.pos.x, 0, mapSize.width);
    player.pos.y = constrain(player.pos.y, 0, mapSize.height);
}