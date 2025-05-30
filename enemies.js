// Enemy configuration
const enemyTypes = {
    A: {
        hp: 50,
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
        bulletPattern: null
    },
    B: {
        hp: 30,
        speed: 1.5,
        size: 50,
        contactDamage: 5,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 5,
        bulletDamage: 10,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: 'pattern1'
    },
    C: {
        hp: 20,
        speed: 3,
        size: 50,
        contactDamage: 15,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: true,
        behaviorPattern: 'pattern1',
        bulletPattern: null
    },
    D: {
        hp: 40,
        speed: 1,
        size: 50,
        contactDamage: 5,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 4,
        bulletDamage: 15,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: 'pattern2'
    },
    Z: {
        hp: 10000,
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
        bulletPattern: 'pattern3',
        isBoss: true
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
        bulletPattern: 'pattern3',
        isBoss: true
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
        bulletPattern: 'pattern3',
        isBoss: true
    }
};

// Bullet pattern functions
const bulletPatterns = {
    pattern1: singleShot,
    pattern2: threeWayShot,
    pattern3: burstShot
};

function singleShot(enemy, baseAngle) {
    projectiles.push({
        pos: enemy.pos.copy(),
        vel: p5.Vector.fromAngle(baseAngle).mult(enemy.bulletSpeed),
        damage: enemy.bulletDamage,
        enemy: true,
        origin: enemy.pos.copy(),
        range: enemy.range,
        initialPos: enemy.pos.copy(),
        slowDistance: null,
        slowSpeedMultiplier: 1,
        size: null,
        shape: null
    });
}

function threeWayShot(enemy, baseAngle) {
    const angles = [baseAngle - radians(20), baseAngle, baseAngle + radians(20)];
    for (const angle of angles) {
        projectiles.push({
            pos: enemy.pos.copy(),
            vel: p5.Vector.fromAngle(angle).mult(enemy.bulletSpeed),
            damage: enemy.bulletDamage,
            enemy: true,
            origin: enemy.pos.copy(),
            range: enemy.range,
            initialPos: enemy.pos.copy(),
            slowDistance: null,
            slowSpeedMultiplier: 1,
            size: null,
            shape: null
        });
    }
}

function burstShot(enemy, baseAngle) {
    const burstCount = 6;
    const interval = 100;
    const spreadAngle = radians(30);
    const currentTime = millis();

    if (!enemy.isBursting) {
        enemy.isBursting = true;
        enemy.burstCount = 0;
        enemy.burstLastShotTime = currentTime - interval;
    }

    if (enemy.burstCount < burstCount && currentTime - enemy.burstLastShotTime >= interval) {
        const angle = baseAngle + random(-spreadAngle / 2, spreadAngle / 2);
        projectiles.push({
            pos: enemy.pos.copy(),
            vel: p5.Vector.fromAngle(angle).mult(enemy.bulletSpeed),
            damage: enemy.bulletDamage,
            enemy: true,
            origin: enemy.pos.copy(),
            range: enemy.range,
            initialPos: enemy.pos.copy(),
            slowDistance: 250,
            slowSpeedMultiplier: 0.2,
            size: null,
            shape: null
        });
        enemy.burstCount++;
        enemy.burstLastShotTime = currentTime;
    }

    if (enemy.burstCount >= burstCount) {
        enemy.isBursting = false;
        enemy.burstCount = 0;
        enemy.burstLastShotTime = null;
    }
}

function shootBullet(enemy, baseAngle) {
    const pattern = enemyTypes[enemy.type]?.bulletPattern || 'pattern1';
    const shootFunction = bulletPatterns[pattern] || bulletPatterns.pattern1;
    shootFunction(enemy, baseAngle);
    if (pattern !== 'pattern3') {
        enemy.lastShot = millis();
    }
}

// Behavior pattern functions
const behaviorPatterns = {
    pattern1: moveDirectlyToPlayer,
    pattern2: prepareAndShoot,
    pattern3: shakeAndCharge
};

function moveDirectlyToPlayer(enemy) {
    const dir = p5.Vector.sub(player.pos, enemy.pos);
    const distance = dir.mag();
    let speed = enemy.speed;

    if (playerStats.slowField > 0 && distance < playerStats.slowField) {
        speed *= 0.5;
    }

    enemy.vel = dir.normalize().mult(speed);
    enemy.pos.add(enemy.vel);
}

function prepareAndShoot(enemy) {
    const dir = p5.Vector.sub(player.pos, enemy.pos);
    const distance = dir.mag();
    let speed = enemy.speed;

    if (playerStats.slowField > 0 && distance < playerStats.slowField) {
        speed *= 0.5;
    }

    if (!enemy.isPreparingAttack && distance < 400 && millis() > enemy.cooldownEndTime) {
        enemy.isPreparingAttack = true;
        enemy.prepareStartTime = millis();
        enemy.prepareAttackDelay = random(500, 1000);
    }

    if (enemy.isPreparingAttack) {
        speed *= 0.1;
        if (millis() - enemy.prepareStartTime >= enemy.prepareAttackDelay) {
            const baseAngle = atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
            shootBullet(enemy, baseAngle);
            enemy.isPreparingAttack = false;
            enemy.cooldownEndTime = millis() + random(4500, 5500);
        }
    }

    if (enemy.isBursting) {
        const baseAngle = atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
        shootBullet(enemy, baseAngle);
    }

    enemy.vel = dir.normalize().mult(speed);
    enemy.pos.add(enemy.vel);
}

function shakeAndCharge(enemy) {
    const dir = p5.Vector.sub(player.pos, enemy.pos);
    const distance = dir.mag();
    let speed = enemy.speed;

    if (playerStats.slowField > 0 && distance < playerStats.slowField) {
        speed *= 0.5;
    }

    if (enemy.attackState === 'shaking') {
        speed = 0;
        enemy.shakeOffset = sin(millis() * 0.02) * 10;
        if (millis() - enemy.shakeStartTime >= 500 && !enemy.chargeAngle) {
            enemy.chargeAngle = atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
        }
        if (millis() - enemy.shakeStartTime >= 1000) {
            enemy.attackState = 'charging';
            enemy.isPreparingAttack = false;
        }
    } else if (enemy.attackState === 'charging') {
        speed *= 3;
        enemy.vel = p5.Vector.fromAngle(enemy.chargeAngle).mult(speed);
        enemy.pos.add(enemy.vel);

        if (distance > enemy.lastDistance && !enemy.decelTriggerTime) {
            enemy.decelTriggerTime = millis() + 300;
        }
        if (enemy.decelTriggerTime && millis() >= enemy.decelTriggerTime) {
            enemy.attackState = 'decelerating';
            enemy.decelStartTime = millis();
        }
    } else if (enemy.attackState === 'decelerating') {
        const t = min((millis() - enemy.decelStartTime) / 100, 1);
        speed = enemy.speed * 3 * (1 - t);
        enemy.vel = p5.Vector.fromAngle(enemy.chargeAngle).mult(speed);
        enemy.pos.add(enemy.vel);
        if (t >= 1) {
            enemy.attackState = 'shooting';
            const baseAngle = atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
            shootBullet(enemy, baseAngle);
            enemy.shootStartTime = millis();
        }
    } else if (enemy.attackState === 'shooting') {
        if (enemy.isBursting) {
            const baseAngle = atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
            shootBullet(enemy, baseAngle);
        }
        speed = 0;
        enemy.vel = createVector(0, 0);
        if (!enemy.isBursting && millis() - enemy.shootStartTime >= 500) {
            enemy.attackState = 'none';
            enemy.cooldownEndTime = millis() + 4000;
            enemy.chargeAngle = null;
            enemy.decelTriggerTime = null;
            enemy.decelStartTime = null;
            enemy.shootStartTime = null;
            enemy.shakeOffset = 0;
        }
    } else {
        if (distance < 300 && millis() > enemy.cooldownEndTime) {
            enemy.attackState = 'shaking';
            enemy.isPreparingAttack = true;
            enemy.shakeStartTime = millis();
            enemy.lastDistance = distance;
        } else {
            enemy.vel = dir.normalize().mult(speed);
            enemy.pos.add(enemy.vel);
        }
    }

    enemy.lastDistance = distance;
}

// Core enemy functions
function spawnEnemies(count, type) {
    const enemyConfig = enemyTypes[type] || enemyTypes['A'];
    for (let i = 0; i < count; i++) {
        const angle = random(TWO_PI);
        const radius = random(300, 500);
        const pos = player.pos.copy().add(p5.Vector.fromAngle(angle).mult(radius));
        pos.x = constrain(pos.x, 0, 5000);
        pos.y = constrain(pos.y, 0, 3500);
        const dir = p5.Vector.sub(player.pos, pos).normalize();
        enemies.push({
            pos: pos,
            vel: dir.mult(enemyConfig.speed),
            type: type,
            hp: enemyConfig.hp,
            speed: enemyConfig.speed,
            size: enemyConfig.size,
            contactDamage: enemyConfig.contactDamage,
            shootInterval: enemyConfig.shootInterval,
            range: enemyConfig.range,
            bulletSpeed: enemyConfig.bulletSpeed,
            bulletDamage: enemyConfig.bulletDamage,
            lastShot: millis(),
            lastPoisonDamage: 0,
            poisoned: false,
            vectorUnder: enemyConfig.vectorUnder,
            currentFrame: 0,
            lastFrameChange: 0,
            frameIndex: 0,
            animationDirection: 1,
            isPreparingAttack: false,
            prepareStartTime: 0,
            prepareAttackDelay: 0,
            cooldownEndTime: 0,
            attackState: 'none',
            shakeStartTime: 0,
            chargeAngle: null,
            lastDistance: 0,
            decelTriggerTime: 0,
            decelStartTime: 0,
            shootStartTime: 0,
            time: millis(),
            shakeOffset: 0,
            isBursting: false,
            burstLastShotTime: null,
            burstCount: 0
        });
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i]) {
            if (debugLog && debugMode) {
                console.log(`Null enemy at index ${i}, removing`);
            }
            enemies.splice(i, 1);
            continue;
        }
        const enemy = enemies[i];
        const pattern = enemyTypes[enemy.type]?.behaviorPattern || 'pattern1';
        const behavior = behaviorPatterns[pattern] || behaviorPatterns.pattern1;
        behavior(enemy);
        updateAnimation(enemy, frameCounts[`enemy_${enemy.type}`] || 1);
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

function drawEnemies() {
    push();
    translate(640 - player.pos.x, 360 - player.pos.y);

    for (let enemy of enemies) {
        if (!enemy) continue;

        const spriteKey = `enemy_${enemy.type}`;
        const spriteSheet = spriteSheets[spriteKey];
        const frameCount = frameCounts[spriteKey] || 1;

        // デバッグ表示：敵の位置確認用
        if (!spriteSheet || !spriteSheet.width) {
            fill(255, 0, 0);
            noStroke();
            ellipse(enemy.pos.x, enemy.pos.y, enemy.size);
            console.warn(`Sprite missing for ${spriteKey}`);
            continue;
        }

        push();
        translate(enemy.pos.x+160, enemy.pos.y);

        let rotation = 0;
        let scaleX = 1;
        if (enemy.vectorUnder) {
            rotation = atan2(enemy.vel.y, enemy.vel.x) - PI / 2;
        } else if (enemy.isBoss) {
            rotation = atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x) - PI / 2;
        } else if (enemy.vel.x > 0) {
            scaleX = -1;
        }

        scale(scaleX, 1);
        rotate(rotation);

        // プレイヤー同様に48x48スプライトで表示
        const frame = enemy.currentFrame % frameCount;
        image(spriteSheet, -24, -24, 48, 48, frame * 48, 0, 48, 48);

        pop();
    }

    pop();
}

function handleEnemyDeath(enemy, index) {
    if (!enemy || index < 0 || index >= enemies.length || enemies[index] !== enemy || enemiesToRemove.has(index)) {
        if (debugLog && debugMode) {
            console.log(`Invalid enemy death: index=${index}, enemies.length=${enemies.length}, inRemoveSet=${enemiesToRemove.has(index)}`);
        }
        return;
    }

    enemiesToRemove.add(index);
    rushEnemiesKilled++;
    enemiesKilled++;
    expItems.push({
        pos: enemy.pos.copy(),
        vel: createVector(0, 0),
        speed: 5
    });
    if (debugLog && debugMode) {
        console.log(`Exp item added at index ${index}, expItems.length=${expItems.length}, rushEnemiesKilled=${rushEnemiesKilled}, enemiesKilled=${enemiesKilled}`);
    }

    if (playerStats.poisonSwampRadius > 0 && random() < 0.5) {
        let isInPoisonSwamp = poisonSwamps.some(swamp => p5.Vector.sub(swamp.pos, enemy.pos).mag() < swamp.radius);
        if (!isInPoisonSwamp) {
            poisonSwamps.push({
                pos: enemy.pos.copy(),
                radius: playerStats.poisonSwampRadius,
                time: millis()
            });
        }
    }

    if (playerStats.explosionRadius > 0) {
        effectCircles.push({
            pos: enemy.pos.copy(),
            radius: playerStats.explosionRadius,
            time: millis(),
            maxRadius: playerStats.explosionRadius
        });

        const maxIterations = 10000;
        let loopCounter = 0;

        for (let k = enemies.length - 1; k >= 0; k--) {
            if (!enemies[k] || k === index || enemiesToRemove.has(k)) continue;
            loopCounter++;
            if (loopCounter > maxIterations) {
                if (debugLog && debugMode) {
                    console.log('Max iterations reached in explosion loop');
                }
                break;
            }
            if (p5.Vector.sub(enemy.pos, enemies[k].pos).mag() < playerStats.explosionRadius) {
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

        if (debugLog && debugMode) {
            console.log(`Explosion triggered, radius=${playerStats.explosionRadius}`);
        }
    }

    if (debugLog && debugMode) {
        console.log(`Post-death enemies.length=${enemies.length}, enemiesToRemove=${[...enemiesToRemove]}`);
    }
}

function removeEnemies() {
    const validIndices = [...enemiesToRemove]
        .filter(i => i >= 0 && i < enemies.length && enemies[i])
        .sort((a, b) => b - a);

    for (let i of validIndices) {
        enemies.splice(i, 1);
    }

    enemiesToRemove.clear();

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i]) {
            enemies.splice(i, 1);
        }
    }
}

function updateAnimation(entity, frameCount) {
    if (!entity || frameCount <= 1) return;
    const frameInterval = 500; // 500 ms per frame
    if (millis() - entity.lastFrameChange >= frameInterval) {
        entity.currentFrame += entity.animationDirection;
        if (entity.currentFrame >= frameCount - 1) {
            entity.currentFrame = frameCount - 2;
            entity.animationDirection = -1;
        } else if (entity.currentFrame <= 0) {
            entity.currentFrame = 0;
            entity.animationDirection = 1;
        }
        entity.lastFrameChange = millis();
    }
    entity.frameIndex = entity.currentFrame;
}