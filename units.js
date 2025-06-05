const unitTypes = {
    A: {
        hp: 90,
        speed: 2,
        size: 20,
        contactDamage: 10,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: true,
        behaviorPattern: 'pattern1',
        bulletPattern: null,
        species: 'tentacle',
        appearancePattern: '1',
        affiliation: 'enemy' // 追加
    },
    B: {
        hp: 90,
        speed: 1.5,
        size: 30,
        contactDamage: 5,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 5,
        bulletDamage: 10,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: '1',
        species: 'slime',
        appearancePattern: '1',
        affiliation: 'enemy' // 追加
    },
    C: {
        hp: 40,
        speed: 3,
        size: 25,
        contactDamage: 15,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: true,
        behaviorPattern: 'pattern1',
        bulletPattern: null,
        species: 'facehugger',
        appearancePattern: '1',
        affiliation: 'enemy' // 追加
    },
    D: {
        hp: 100,
        speed: 1,
        size: 40,
        contactDamage: 5,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 3,
        bulletDamage: 15,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: '2',
        species: 'plant',
        appearancePattern: '1',
        affiliation: 'enemy' // 追加
    },
    Z: {
        hp: 5000,
        speed: 2,
        size: 100,
        contactDamage: 20,
        shootInterval: 0,
        range: 400,
        bulletSpeed: 5,
        bulletDamage: 25,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern3',
        bulletPattern: '3',
        isBoss: true,
        species: 'Renate',
        appearancePattern: 'pattern2',
        affiliation: 'enemy' // 追加
    },
    Y: {
        hp: 15000,
        speed: 1.8,
        size: 80,
        contactDamage: 25,
        shootInterval: 0,
        range: 500,
        bulletSpeed: 6,
        bulletDamage: 30,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern3',
        bulletPattern: '3',
        isBoss: true,
        species: 'Renate',
        appearancePattern: 'pattern2',
        affiliation: 'enemy' // 追加
    },
    X: {
        hp: 20000,
        speed: 1.5,
        size: 90,
        contactDamage: 30,
        shootInterval: 0,
        range: 600,
        bulletSpeed: 7,
        bulletDamage: 35,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern3',
        bulletPattern: '3',
        isBoss: true,
        species: 'Renate',
        appearancePattern: 'pattern2',
        affiliation: 'enemy' // 追加
    }
};

// Bullet pattern functions
const bulletPatterns = {
    1: singleShot,
    2: threeWayShot,
    3: burstShot
};

function singleShot(unit, baseAngle) {
    projectiles.push({
        pos: unit.pos.copy(),
        vel: p5.Vector.fromAngle(baseAngle).mult(unit.bulletSpeed),
        damage: unit.bulletDamage,
        sourceAffiliation: unit.affiliation, // 追加
        origin: unit.pos.copy(),
        range: unit.range,
        initialPos: unit.pos.copy(),
        slowDistance: null,
        slowSpeedMultiplier: 1,
        size: null,
        shape: null,
        sourceUnitType: unit.type,
        createdTime: millis()
    });
}

function threeWayShot(unit, baseAngle) {
    const angles = [baseAngle - radians(20), baseAngle, baseAngle + radians(20)];
    for (const angle of angles) {
        projectiles.push({
            pos: unit.pos.copy(),
            vel: p5.Vector.fromAngle(angle).mult(unit.bulletSpeed),
            damage: unit.bulletDamage,
            sourceAffiliation: unit.affiliation, // 追加
            origin: unit.pos.copy(),
            range: unit.range,
            initialPos: unit.pos.copy(),
            slowDistance: null,
            slowSpeedMultiplier: 1,
            size: null,
            shape: unit.type === 'D' ? 'spindle' : null,
            sourceUnitType: unit.type,
            createdTime: millis()
        });
    }
}

function burstShot(unit, baseAngle) {
    const burstCount = 6;
    const interval = 100;
    const spreadAngle = radians(30);
    const currentTime = millis();

    if (!unit.isBursting) {
        unit.isBursting = true;
        unit.burstCount = 0;
        unit.burstLastShotTime = currentTime - interval;
    }

    if (unit.burstCount < burstCount && currentTime - unit.burstLastShotTime >= interval) {
        const angle = baseAngle + random(-spreadAngle / 2, spreadAngle / 2);
        projectiles.push({
            pos: unit.pos.copy(),
            vel: p5.Vector.fromAngle(angle).mult(unit.bulletSpeed),
            damage: unit.bulletDamage,
            sourceAffiliation: unit.affiliation, // 追加
            origin: unit.pos.copy(),
            range: unit.range,
            initialPos: unit.pos.copy(),
            slowDistance: 250,
            slowSpeedMultiplier: 0.2,
            size: null,
            shape: null,
            sourceUnitType: unit.type,
            createdTime: millis()
        });
        unit.burstCount++;
        unit.burstLastShotTime = currentTime;
    }

    if (unit.burstCount >= burstCount) {
        unit.isBursting = false;
        unit.burstCount = 0;
        unit.burstLastShotTime = null;
    }
}

function shootBullet(unit, baseAngle) {
    const pattern = unitTypes[unit.type]?.bulletPattern || '1';
    const shootFunction = bulletPatterns[pattern] || bulletPatterns[1];
    shootFunction(unit, baseAngle);
    if (pattern !== '3') {
        unit.lastShot = millis();
    }
}

// Appearance pattern functions
const appearancePatterns = {
    1: emergeFromBelow,
    pattern2: descendFromAbove
};

function emergeFromBelow(unit) {
    const duration = 1000; // 1 second
    const t = min((millis() - unit.appearanceStartTime) / duration, 1);
    const mapSize = getStageConfig(currentStage).mapSize;
    
    const offsetY = lerp(24, -24, t); // 下から上へ
    unit.appearancePos = unit.pos.copy().add(createVector(0, offsetY));
    unit.appearancePos.y = constrain(unit.appearancePos.y, 0, mapSize.height);
    
    // 回転設定の修正
    if (unitTypes[unit.type]?.vectorUnder === false) {
        unit.appearanceRotation = 0; // vectorUnder: false なら常に正立 (スプライトが元々上向きの場合)
                                    // もしスプライトが右向きなら -PI/2 とするなど調整が必要
    } else {
        // vectorUnder: true の場合は、以前のロジックか、常に上向き (-PI/2) など
    unit.appearanceRotation = t < 1 ? -PI : PI/2; // 常時上向き（p5.jsのデフォルトの上）
    }
    
    unit.appearanceProgress = t; // クリッピング用
    const shakeInterval = 1000 / 60 * 2; 
    unit.appearanceShakeOffset = floor((millis() - unit.appearanceStartTime) / shakeInterval) % 2 === 0 ? 1 : -1;
    
    if (t >= 1) {
        unit.isAppearing = false;
        unit.appearancePos = null;
        unit.appearanceRotation = null; // アニメーション終了後は通常の向き制御に戻る
        unit.appearanceProgress = null;
        unit.appearanceShakeOffset = null;
    }
}

function descendFromAbove(unit) {
    const duration = 1000; // 1 second
    const t = min((millis() - unit.appearanceStartTime) / duration, 1);
    const mapSize = getStageConfig(currentStage).mapSize;
    
    // Interpolate y-coordinate from above (-25) to spawn position (0)
    const offsetY = lerp(-25, 0, t);
    unit.appearancePos = unit.pos.copy().add(createVector(0, offsetY));
    unit.appearancePos.y = constrain(unit.appearancePos.y, 0, mapSize.height);
    
    // Interpolate scale from 2 to 1
    unit.appearanceScale = lerp(2, 1, t);
    
    // End appearance
    if (t >= 1) {
        unit.isAppearing = false;
        unit.appearancePos = null;
        unit.appearanceScale = null;
    }
}

// Behavior pattern functions
const behaviorPatterns = {
    pattern1: moveDirectlyToPlayer,
    pattern2: prepareAndShoot,
    pattern3: shakeAndCharge
};

function moveDirectlyToPlayer(unit) {
    if (unit.isAppearing) return; // Skip movement during appearance
    const dir = p5.Vector.sub(player.pos, unit.pos);
    const distance = dir.mag();
    let speed = unit.speed;

    if (playerStats.slowField > 0 && distance < playerStats.slowField) {
        speed *= 0.5;
    }

    unit.vel = dir.normalize().mult(speed);
    unit.pos.add(unit.vel);
}

function prepareAndShoot(unit) {
    if (unit.isAppearing) return; // Skip movement or shooting during appearance
    const dir = p5.Vector.sub(player.pos, unit.pos);
    const distance = dir.mag();
    let speed = unit.speed;

    if (playerStats.slowField > 0 && distance < playerStats.slowField) {
        speed *= 0.5;
    }

    if (!unit.isPreparingAttack && distance < 400 && millis() > unit.cooldownEndTime) {
        unit.isPreparingAttack = true;
        unit.prepareStartTime = millis();
        unit.prepareAttackDelay = random(500, 1000);
    }

    if (unit.isPreparingAttack) {
        speed *= 0.1;
        if (millis() - unit.prepareStartTime >= unit.prepareAttackDelay) {
            const baseAngle = atan2(player.pos.y - unit.pos.y, player.pos.x - unit.pos.x);
            shootBullet(unit, baseAngle);
            unit.isPreparingAttack = false;
            unit.cooldownEndTime = millis() + random(4500, 5500);
        }
    }

    if (unit.isBursting) {
        const baseAngle = atan2(player.pos.y - unit.pos.y, player.pos.x - unit.pos.x);
        shootBullet(unit, baseAngle);
    }

    unit.vel = dir.normalize().mult(speed);
    unit.pos.add(unit.vel);
}

function shakeAndCharge(unit) {
    if (unit.isAppearing) return; // Skip movement or attacks during appearance
    const dir = p5.Vector.sub(player.pos, unit.pos);
    const distance = dir.mag();
    let speed = unit.speed;

    if (playerStats.slowField > 0 && distance < playerStats.slowField) {
        speed *= 0.5;
    }

    if (unit.attackState === 'shaking') {
        speed = 0;
        unit.shakeOffset = sin(millis() * 0.02) * 10;
        if (millis() - unit.shakeStartTime >= 500 && !unit.chargeAngle) {
            unit.chargeAngle = atan2(player.pos.y - unit.pos.y, player.pos.x - unit.pos.x);
        }
        if (millis() - unit.shakeStartTime >= 1000) {
            unit.attackState = 'charging';
            unit.isPreparingAttack = false;
        }
    } else if (unit.attackState === 'charging') {
        speed *= 3;
        unit.vel = p5.Vector.fromAngle(unit.chargeAngle).mult(speed);
        unit.pos.add(unit.vel);

        if (distance > unit.lastDistance && !unit.decelTriggerTime) {
            unit.decelTriggerTime = millis() + 300;
        }
        if (unit.decelTriggerTime && millis() >= unit.decelTriggerTime) {
            unit.attackState = 'decelerating';
            unit.decelStartTime = millis();
        }
    } else if (unit.attackState === 'decelerating') {
        const t = min((millis() - unit.decelStartTime) / 100, 1);
        speed = unit.speed * 3 * (1 - t);
        unit.vel = p5.Vector.fromAngle(unit.chargeAngle).mult(speed);
        unit.pos.add(unit.vel);
        if (t >= 1) {
            unit.attackState = 'shooting';
            const baseAngle = atan2(player.pos.y - unit.pos.y, player.pos.x - unit.pos.x);
            shootBullet(unit, baseAngle);
            unit.shootStartTime = millis();
        }
    } else if (unit.attackState === 'shooting') {
        if (unit.isBursting) {
            const baseAngle = atan2(player.pos.y - unit.pos.y, player.pos.x - unit.pos.x);
            shootBullet(unit, baseAngle);
        }
        speed = 0;
        unit.vel = createVector(0, 0);
        if (!unit.isBursting && millis() - unit.shootStartTime >= 500) {
            unit.attackState = 'none';
            unit.cooldownEndTime = millis() + 4000;
            unit.chargeAngle = null;
            unit.decelTriggerTime = null;
            unit.decelStartTime = null;
            unit.shootStartTime = null;
            unit.shakeOffset = 0;
        }
    } else {
        if (distance < 300 && millis() > unit.cooldownEndTime) {
            unit.attackState = 'shaking';
            unit.isPreparingAttack = true;
            unit.shakeStartTime = millis();
            unit.lastDistance = distance;
        } else {
            unit.vel = dir.normalize().mult(speed);
            unit.pos.add(unit.vel);
        }
    }

    unit.lastDistance = distance;
}

function updateUnits() {
    for (let i = units.length - 1; i >= 0; i--) {
        if (!units[i]) {
            if (debugLog && debugMode) {
                console.log(`Null unit at index ${i}, removing`);
            }
            units.splice(i, 1);
            continue;
        }
        const unit = units[i];
        
        // Update appearance animation
        if (unit.isAppearing) {
            const pattern = unitTypes[unit.type]?.appearancePattern || '1';
            const appearance = appearancePatterns[pattern] || appearancePatterns[1];
            appearance(unit);
            continue; // Skip behavior during appearance
        }
        
        // Update normal behavior pattern
        const pattern = unitTypes[unit.type]?.behaviorPattern || 'pattern1';
        const behavior = behaviorPatterns[pattern] || behaviorPatterns.pattern1;
        behavior(unit);
        updateAnimation(unit, frameCounts[`unit_${unit.type}`] || 1);
    }
    const mapSize = getStageConfig(currentStage).mapSize; // マップサイズを取得
    const collisionIterations = 2; // 衝突解決の反復回数 (1-3程度で調整)

    for (let iter = 0; iter < collisionIterations; iter++) {
        for (let i = 0; i < units.length; i++) {
            const unitA = units[i];
            if (!unitA || unitA.isAppearing) continue; // 無効なユニットや出現中のユニットはスキップ

            for (let j = i + 1; j < units.length; j++) {
                const unitB = units[j];
                if (!unitB || unitB.isAppearing) continue; // 無効なユニットや出現中のユニットはスキップ

                const radiusA = unitA.size / 2;
                const radiusB = unitB.size / 2;
                const sumRadii = radiusA + radiusB;

                // ユニット間のベクトルと距離を計算
                const vectorBetweenUnits = p5.Vector.sub(unitB.pos, unitA.pos);
                const distance = vectorBetweenUnits.mag();

                // 衝突しているか確認 (距離が0より大きいことも確認)
                if (distance < sumRadii && distance > 0) {
                    const overlapAmount = sumRadii - distance; // 重なっている量
                    const pushDirection = vectorBetweenUnits.normalize(); // unitB を unitA から押し出す方向

                    // 各ユニットを重なりの半分ずつ押し出す
                    unitA.pos.sub(pushDirection.copy().mult(overlapAmount / 2));
                    unitB.pos.add(pushDirection.copy().mult(overlapAmount / 2));

                    // マップ境界内に位置を制約
                    unitA.pos.x = constrain(unitA.pos.x, radiusA, mapSize.width - radiusA);
                    unitA.pos.y = constrain(unitA.pos.y, radiusA, mapSize.height - radiusA);
                    unitB.pos.x = constrain(unitB.pos.x, radiusB, mapSize.width - radiusB);
                    unitB.pos.y = constrain(unitB.pos.y, radiusB, mapSize.height - radiusB);
                }
            }
        }
    }
    

    for (let proj of projectiles) {
        if (proj.slowDistance && proj.initialPos) {
            const distance = proj.pos.dist(proj.initialPos);
            if (distance >= proj.slowDistance && proj.slowSpeedMultiplier < 1) {
                proj.vel.mult(proj.slowSpeedMultiplier);
                proj.slowSpeedMultiplier = 1;
            }
        }
    }
}

function drawUnits() {
    push();
    const { cameraX, cameraY } = getCameraPosition();
    translate(-cameraX, -cameraY);

    for (let unit of units) {
        if (!unit) continue;

        const spriteKey = `unit_${unit.type}`;
        const spriteSheet = spriteSheets[spriteKey];
        const frameCount = frameCounts[spriteKey] || 1;

        if (!spriteSheet || !spriteSheet.width) {
            fill(255, 0, 0);
            noStroke();
            ellipse(unit.pos.x, unit.pos.y, unit.size);
            console.warn(`Sprite missing for ${spriteKey}`);
            continue;
        }

        push();
        const drawPos = unit.appearancePos || unit.pos;
        const shakeX = (unit.isAppearing && unit.appearanceShakeOffset !== null && unitTypes[unit.type]?.appearancePattern === '1') 
            ? unit.appearanceShakeOffset : 0;
        translate(drawPos.x + shakeX, drawPos.y);

        let rotation = 0;
        let scaleX = 1;
        let scaleY = 1;

        if (unit.isAppearing) {
            if (unit.appearanceRotation !== null) rotation = unit.appearanceRotation;
            if (unit.appearanceScale !== null) {
                scaleX = unit.appearanceScale;
                scaleY = unit.appearanceScale;
            }
        } else {
            if (unit.vectorUnder) {
                rotation = atan2(unit.vel.y, unit.vel.x) - PI / 2;
            } else if (unit.isBoss) {
                rotation = atan2(player.pos.y - unit.pos.y, player.pos.x - unit.pos.x) - PI / 2;
            } else if (unit.vel.x < 0) {
                scaleX = -1;
            }
        }

        scale(scaleX, scaleY);
        rotate(rotation);

        const frame = unit.currentFrame % frameCount;
        if (unit.isAppearing && unit.appearanceProgress !== null && unitTypes[unit.type]?.appearancePattern === '1') {
            const spriteHeight = 48;
            const visibleHeight = spriteHeight * unit.appearanceProgress;
            image(spriteSheet, -24, -24 + spriteHeight - visibleHeight, 48, visibleHeight, 
                  frame * 48, spriteHeight - visibleHeight, 48, visibleHeight);
        } else {
            image(spriteSheet, -24, -24, 48, 48, frame * 48, 0, 48, 48);
        }

        pop();
    }

    pop();
}

function handleUnitDeath(unit, index) {
    // 条件チェックと早期リターン (ユニットが無効な場合など)
    if (!unit || index < 0 || index >= units.length || units[index] !== unit || unitsToRemove.has(index)) {
        if (debugLog && debugMode) console.log(`Invalid unit death: index=${index}, units.length=${units.length}, inRemoveSet=${unitsToRemove.has(index)}`);
        return; // 条件に合致すれば、ここで関数の実行を終了します。
    }

    // ユニット死亡時の基本処理
    unitsToRemove.add(index); //
    rushEnemiesKilled++;
    enemiesKilled++;
    expItems.push({ pos: unit.pos.copy(), vel: createVector(0, 0), speed: 5 }); //
    if (debugLog && debugMode) console.log(`Exp item added at index ${index}, type=${unit.type}`); //

    // ボス撃破時の追加処理
    if (unitTypes[unit.type]?.isBoss) { //
        defeatedBossesThisStage.add(unit.type);
        console.log(`[UNITDEATH LOG] Boss ${unit.type} defeated and tracked.`); //

        const stageConfig = getStageConfig(currentStage);
        const trigger = stageConfig.scenarioTriggers?.find(t =>
            t.conditionType === 'bossDefeated' &&
            t.bossType === unit.type
        );
        if (trigger && trigger.scenarioTriggerId) {
            justTriggeredEventId = trigger.scenarioTriggerId;
            console.log(`[UNITDEATH LOG] Event ID set for bossDefeated: ${justTriggeredEventId}`); //
        }
    } // ボス撃破処理の終了

    // --- これ以降の撃破後効果処理は、敵がボスであるかどうかに関わらず評価されます ---

    // 毒沼化の処理
    if (playerStats.poisonSwampRadius > 0 && random() < 0.5) { //
        // 既に同じ位置（または非常に近い位置）に毒沼がないか確認するなどの追加ロジックも検討可能
        let isInPoisonSwamp = poisonSwamps.some(swamp => p5.Vector.sub(swamp.pos, unit.pos).mag() < swamp.radius); //
        if (!isInPoisonSwamp) { //
            poisonSwamps.push({ //
                pos: unit.pos.copy(), //
                radius: playerStats.poisonSwampRadius, //
                time: millis() //
            });
             if (debugLog && debugMode) {
                console.log(`毒沼発生: 位置=(${unit.pos.x.toFixed(0)}, ${unit.pos.y.toFixed(0)}), 半径=${playerStats.poisonSwampRadius}`);
            }
        }
    }

    // 連鎖爆裂の処理
       if (playerStats.chainExplosionEnabled && playerStats.chainExplosionRadius > 0 && unit.affiliation !== 'ally') {
        const explosionCenter = unit.pos.copy(); //
        const explosionRadius = playerStats.chainExplosionRadius; //
        const explosionDamage = playerStats.attack * playerStats.chainExplosionDamageMultiplier; //

        // ★★★ ディレイ開始時に範囲内の潜在的ターゲットを特定 ★★★
        const potentialTargets = [];
        for (let k = 0; k < units.length; k++) {
            if (k === index) continue; // 起点のユニットは除く
            const targetUnit = units[k];
            if (!targetUnit || unitsToRemove.has(k)) continue; // 無効または削除予定のユニットは除く
            if (targetUnit.affiliation && targetUnit.affiliation !== 'ally') { // 敵対ユニットのみ対象
                if (p5.Vector.dist(explosionCenter, targetUnit.pos) < explosionRadius) {
                    potentialTargets.push(targetUnit); // ユニットの参照を保持
                }
            }
        }

        if (debugLog && debugMode) { //
            console.log(`連鎖爆裂準備: 起点ユニットタイプ=${unit.type}, 位置=(${explosionCenter.x.toFixed(0)}, ${explosionCenter.y.toFixed(0)}), 範囲=${explosionRadius}, ダメージ=${explosionDamage.toFixed(1)}, 対象候補数=${potentialTargets.length}, 100ms後に実行`); //
        }

        // 100msのディレイ後に範囲ダメージ処理を実行
        setTimeout(() => {
            if (debugLog && debugMode) { //
                console.log(`連鎖爆裂実行 (100ms後): 位置=(${explosionCenter.x.toFixed(0)}, ${explosionCenter.y.toFixed(0)}), ダメージ=${explosionDamage.toFixed(1)}`); //
            }

            // 連鎖爆裂の視覚エフェクト
            effectCircles.push({ //
                pos: explosionCenter, //
                radius: explosionRadius, //
                time: millis(), //
                maxRadius: explosionRadius, //
            });

            // 特定しておいた潜在的ターゲットに対して処理
            for (const targetUnit of potentialTargets) {
                // ディレイ後にターゲットがまだ生存しているか（units配列に存在し、unitsToRemoveに含まれていないか）を確認
                const currentTargetIndex = units.indexOf(targetUnit); // ★現在のインデックスを取得
                if (currentTargetIndex === -1 || unitsToRemove.has(currentTargetIndex)) {
                    // ユニットが存在しないか、既に削除予定なのでスキップ
                    if (debugLog && debugMode) {
                        console.log(`連鎖爆裂ターゲットスキップ (ディレイ後): ユニット (タイプ ${targetUnit.type}) は既に存在しないか削除予定`);
                    }
                    continue;
                }

                // 念のため、ディレイ後の距離も再チェック（ユニットが大きく移動した場合を考慮）
                // ただし、ディレイが短いため、必須ではないかもしれない。ゲームバランスによる。
                if (p5.Vector.dist(explosionCenter, targetUnit.pos) < explosionRadius) {
                    targetUnit.hp -= explosionDamage; //
                    damagePopups.push({ //
                        pos: targetUnit.pos.copy(), //
                        text: explosionDamage.toFixed(0), //
                        time: millis() //
                    });

                    if (debugLog && debugMode) { //
                        console.log(`連鎖爆裂ヒット (ディレイ後): ユニット (タイプ ${targetUnit.type}), インデックス=${currentTargetIndex}, ダメージ=${explosionDamage.toFixed(1)}, 残HP=${targetUnit.hp.toFixed(1)}`); //
                    }

                    if (targetUnit.hp <= 0 && !unitsToRemove.has(currentTargetIndex)) {
                        // units配列に存在し、削除予定でないことをindexOfの結果と合わせて再確認済み
                        handleUnitDeath(targetUnit, currentTargetIndex); //
                    }
                } else {
                     if (debugLog && debugMode) {
                        console.log(`連鎖爆裂ターゲット範囲外 (ディレイ後): ユニット (タイプ ${targetUnit.type}) は爆発範囲外に移動`);
                    }
                }
            }
        }, 100); // 100ミリ秒のディレイ
    }

    // 通常の爆発処理 (誘爆ダメージ)
    if (playerStats.explosionRadius > 0) { //
        effectCircles.push({ //
            pos: unit.pos.copy(), //
            radius: playerStats.explosionRadius, //
            time: millis(), //
            maxRadius: playerStats.explosionRadius //
        });

        const maxIterations = 10000; //
        let loopCounter = 0; //

        for (let k = units.length - 1; k >= 0; k--) { //
            if (!units[k] || k === index || unitsToRemove.has(k)) continue; //
            loopCounter++; //
            if (loopCounter > maxIterations) { //
                if (debugLog && debugMode) { //
                    console.log('Max iterations reached in explosion loop'); //
                }
                break; //
            }
            if (p5.Vector.sub(unit.pos, units[k].pos).mag() < playerStats.explosionRadius) { //
                units[k].hp -= playerStats.attack * 0.5; //
                damagePopups.push({ //
                    pos: units[k].pos.copy(), //
                    text: (playerStats.attack * 0.5).toFixed(0), //
                    time: millis() //
                });
                if (units[k].hp <= 0 && !unitsToRemove.has(k)) { // 念のため unitsToRemove.has(k) を追加
                    handleUnitDeath(units[k], k); //
                }
            }
        }

        if (debugLog && debugMode) { //
            console.log(`Explosion triggered, radius=${playerStats.explosionRadius}`); //
        }
    }

    // 関数の最後でデバッグログ
    if (debugLog && debugMode) { //
        console.log(`Post-death units.length=${units.length}, unitsToRemove=${[...unitsToRemove]}`); //
    }
} // handleUnitDeath 関数の終了

function removeUnits() {
    const validIndices = [...unitsToRemove]
        .filter(i => i >= 0 && i < units.length && units[i])
        .sort((a, b) => b - a);

    for (let i of validIndices) {
        units.splice(i, 1);
    }

    unitsToRemove.clear();

    for (let i = units.length - 1; i >= 0; i--) {
        if (!units[i]) {
            units.splice(i, 1);
        }
    }
}

function updateAnimation(entity, frameCount) {
    if (!entity || frameCount <= 1) return;
    const frameInterval = 333; // 500 ms per frame
    if (millis() - entity.lastFrameChange >= frameInterval) {
        entity.currentFrame += entity.animationDirection;
        if (entity.currentFrame >= frameCount - 1) {
            entity.currentFrame = frameCount - 1; // 最後のフレームを保持
            entity.animationDirection = -1;
        } else if (entity.currentFrame <= 0) {
            entity.currentFrame = 0;
            entity.animationDirection = 1;
        }
        entity.lastFrameChange = millis();
    }
    entity.frameIndex = entity.currentFrame;
}