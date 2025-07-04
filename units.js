const unitTypes = {
    A: {
        hp: 90,
        speed: 1,
        maxForce: 0.1, 
        weight: 2.0, // ★★★ 重さを追加
        size: 30,
        contactDamage: 15,
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
        deathEffectId: 1,
        spawnPriority: 5,
        affiliation: 'enemy'
    },
    B: {
        hp: 100,
        speed: 0.5,
        maxForce: 0.08, 
        weight: 2.5, // ★★★ 重さを追加
        size: 40,
        contactDamage: 15,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 4,
        bulletDamage: 15,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: '1',
        species: 'slime',
        appearancePattern: '1',
        deathEffectId: 1, 
        spawnPriority: 3,
        affiliation: 'enemy'
    },
    C: {
        hp: 30,
        speed: 2,
        maxForce: 0.2, 
        weight: 1.0, // ★★★ 軽いユニット
        size: 30,
        contactDamage: 20,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: true,
        behaviorPattern: 'pattern1',
        bulletPattern: null,
        species: 'Myriapod',
        appearancePattern: '1',
        deathEffectId: 1, 
        spawnPriority: 4,
        affiliation: 'enemy'
    },    D: {
        hp: 120,
        speed: 0.5,
        maxForce: 0.05, 
        weight: 4.0, // ★★★ 重いユニット
        size: 50,
        contactDamage: 10,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 4,
        bulletDamage: 15,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: '2',
        species: 'plant',
        appearancePattern: '1',
        deathEffectId: 1,
        spawnPriority: 2,
        affiliation: 'enemy'
    },    E: {
        hp: 120,
        speed: 0.7,
        maxForce: 0.08, 
        weight: 2.5, // ★★★ 重さを追加
        size: 30,
        contactDamage: 15,
        shootInterval: 120,
        range: 1000,
        bulletSpeed: 3,
        bulletDamage: 15,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern2',
        bulletPattern: '1',
        species: 'none',
        appearancePattern: '1',
        deathEffectId: 1, 
        spawnPriority: 3,
    //    stateEffect: 'heart', 
        affiliation: 'enemy'
    },
        F: {
        hp: 150,
        speed: 1,
        maxForce: 0.1, 
        weight: 3.0, // ★★★ 重さを追加
        size: 30,
        contactDamage: 15,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern1',
        bulletPattern: null,
        species: 'none',
        appearancePattern: '1',
        deathEffectId: 1,
        spawnPriority: 5,
        affiliation: 'enemy'
    },

    G: {
        hp: 40,
        speed: 2.5,
        maxForce: 0.2, 
        weight: 1.0, // ★★★ 軽いユニット
        size: 30,
        contactDamage: 20,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern1', // ★ 新しい行動パターンを指定
        bulletPattern: null,
        species: 'none',
        appearancePattern: '1',
        deathEffectId: 1, 
        spawnPriority: 4,
        affiliation: 'enemy'
    },
        H: {
        hp: 40,
        speed: 3,
        maxForce: 0.05, 
        weight: 1.0, // ★★★ 重いユニット
        size: 50,
        contactDamage: 10,
        shootInterval: 120,
        range: 300,
        bulletSpeed: 2,
        bulletDamage: 15,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'flyby',
        bulletPattern: '1',
        species: 'none',
        appearancePattern: '1',
        deathEffectId: 1,
        spawnPriority: 2,
        affiliation: 'enemy',
        fly: true // ★ この行を追加

    },
        I: {
        hp: 1000,
        speed: 0,
        maxForce: 0,
        weight: 5.0,
        size: 40,
        contactDamage: 0,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'pattern1',
        bulletPattern: null,
        species: 'wall',
        appearancePattern: '1',
        deathEffectId: 1,
        spawnPriority: 0,
        affiliation: 'enemy',
        despawnTime: 5000
    },
    Z: {
        hp: 500,
        speed: 2,
        maxForce: 0.2, 
        weight: 10.0, // ★★★ ボスは非常に重い
        size: 50,
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
        affiliation: 'enemy'
    },
    Y: {
        hp: 1000,
        speed: 2,
        maxForce: 0.2, 
        weight: 10.0, // ★★★ ボスは非常に重い
        size: 50,
        contactDamage: 20,
        shootInterval: 0,
        range: 400,
        bulletSpeed: 5,

        bulletDamage: 25,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'patternY',
        bulletPattern: '1',
        isBoss: true,
        species: 'Renate',
        appearancePattern: 'pattern2',
        affiliation: 'enemy',
        // ★ 新しい特殊敗北変化の設定を追加 ★
        specialDefeat: {
            default: 'Y_defeat', // デフォルトの変化先
            bySpecies: {
                'tentacle': 'Y_tentacle' // 'tentacle'種族に倒された時の変化先
            }
        }
    },
    // ★ 演出用の新しいユニット定義を2つ追加
    Y_defeat: {
        hp: 10000,speed: 0,size: 0, // 当たり判定なし
        vectorUnder: false,
        range: 0,
        behaviorPattern: 'patternGuard', // その場に留まるAIを流用
        affiliation: 'none', // 敵でも味方でもない
        despawnTime: 10000,//  // 10秒で消滅
        stateEffect: 'heart', // ★ 特殊ステートの初期値
               webm: {
            path: 'assets/webm/snowgirl-tentacle.webm'//,
        //    background: 'assets/images/bg_characterA.png',
        //    sound: 'assets/se/voiceA.ogg'
        },
        specialDefeat: {
            default: 'Y_succubus' // デフォルトの変化先
        }
    },
    Y_tentacle: {
        hp: 1,speed: 0,size: 0, // 当たり判定なし
        vectorUnder: false,
        behaviorPattern: 'patternGuard',
        affiliation: 'none',
        despawnTime: 8000 // こちらは8秒で消滅
    },
    Y_succubus: {
        hp: 50000,
        speed: 2,
        maxForce: 0.2, 
        weight: 10.0, // ★★★ ボスは非常に重い
        size: 50,
        contactDamage: 20,
        shootInterval: 0,
        range: 400,
        bulletSpeed: 5,
        bulletDamage: 150,
        lastShot: 0,
        vectorUnder: false,
        behaviorPattern: 'patternKnight',
        bulletPattern: '2',
        isBoss: false,
        species: 'Renate',
        appearancePattern: 'pattern2',
        invincibilityOnHit: 500, // ★ 味方になった後は0.5秒の無敵
        affiliation: 'ally',
        stateEffect: 'evil', // ★ 特殊ステートの初期値

    },
    X: {
        hp: 20000,
        speed: 1.5,
        maxForce: 0.1, 
        weight: 15.0, // ★★★ ボスは非常に重い
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
        affiliation: 'enemy'
    },

    //ウラヌスの呼び出すNPC
    KNIGHT: {
        hp: 100,
        speed: 5,
        maxForce: 0.3, 
        weight: 3.0, // ★★★ 味方ユニットにも重さを設定
        size: 30,
        contactDamage: 50,
        attackRange: 60,
        attackCooldown: 1500,
        shootInterval: 0,
        range: 0,
        bulletSpeed: 0,
        bulletDamage: 0,
        lastAttackTime: 0,
        vectorUnder: false,
        behaviorPattern: 'patternKnight',
        bulletPattern: null,
        species: 'knight',
        appearancePattern: 'patternKnight',
        deathEffectId: 1,
        affiliation: 'ally'
    },
    //NPC
        ALLY_GUARD: {
        hp: 800, // 耐久力は高めに設定
        speed: 4,  // その場で待機するため速度は0
        maxForce: 0.1, 
        weight: 10.0, // 押されにくいように重くする
        size: 32,
        contactDamage: 100, //
        attackRange: 60,   // 
        attackCooldown: 200,// 
        lastAttackTime: 0,
        vectorUnder: false,
        behaviorPattern: 'patternGuardAdvanced', // ★ 新しい行動パターンを指定
        bulletPattern: null,
        species: 'guard',
        appearancePattern: '1',
        deathEffectId: 1,
        spawnPriority: 0, // 通常のウェーブでは出現しない
        affiliation: 'ally'
    },
};
const GRID_CELL_SIZE = 100; // 1つのグリッドセルのサイズ (ピクセル)
let grid = []; // 2次元配列としてグリッドを保持
let gridCols;
let gridRows;

// ★★★ 修正: プレイヤー由来の攻撃種別をまとめたリストを定義 ★★★
const PLAYER_SOURCED_ATTACKS = [
    'player',
    'player_aoe',
    'player_poison',
    'player_skill',
    'chain_explosion'
];

function initializeGrid() {
    const mapSize = getStageConfig(currentStage).mapSize;
    gridCols = ceil(mapSize.width / GRID_CELL_SIZE);
    gridRows = ceil(mapSize.height / GRID_CELL_SIZE);
    grid = new Array(gridCols).fill(0).map(() => new Array(gridRows).fill(0).map(() => []));
    console.log(`Grid initialized: ${gridCols}x${gridRows} cells.`);
}
function getGridCoords(pos) {
    let col = floor(pos.x / GRID_CELL_SIZE);
    let row = floor(pos.y / GRID_CELL_SIZE);
    col = constrain(col, 0, gridCols - 1);
    row = constrain(row, 0, gridRows - 1);
    return { col, row };
}

function addUnitToGrid(unit) {
    const { col, row } = getGridCoords(unit.pos);
    unit.gridCol = col;
    unit.gridRow = row;
    grid[col][row].push(unit);
}

function removeUnitFromGrid(unit) {
    // ★★★ ここからが修正箇所 ★★★
    // ユニット自身が覚えているグリッド座標（unit.gridCol, unit.gridRow）を使用する
    const col = unit.gridCol;
    const row = unit.gridRow;

    // ユニットがグリッド座標を保持しているか、またその座標が有効かを確認
    if (col !== undefined && row !== undefined && grid[col] && grid[col][row]) {
        const index = grid[col][row].indexOf(unit);
        if (index > -1) {
            grid[col][row].splice(index, 1);
        } else {
            // この警告は、ユニットがグリッド移動の狭間で複数回削除されようとした場合などに出る可能性がある
            // console.warn('removeUnitFromGrid: Unit not found in its stored grid cell.');
        }
    }
    unit.gridCol = undefined; // グリッド情報をクリア
    unit.gridRow = undefined;
}

function updateUnitGridPosition(unit) {
    const { col: newCol, row: newRow } = getGridCoords(unit.pos);
    if (unit.gridCol !== newCol || unit.gridRow !== newRow) {
        // グリッドセルが変更された場合
        removeUnitFromGrid(unit); // 古い位置から削除
        addUnitToGrid(unit);      // 新しい位置に追加
    }
}

// 指定位置周辺のグリッドセルに存在するユニットを取得するヘルパー
// filterFnを指定すると、その条件を満たすユニットのみを返す
function getUnitsInNeighborCells(pos, filterFn = null) {
    const { col, row } = getGridCoords(pos);
    const result = [];
    for (let cOffset = -1; cOffset <= 1; cOffset++) {
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            const checkCol = col + cOffset;
            const checkRow = row + rOffset;
            if (checkCol < 0 || checkCol >= gridCols || checkRow < 0 || checkRow >= gridRows) continue;
            for (const unit of grid[checkCol][checkRow]) {
                if (!filterFn || filterFn(unit)) {
                    result.push(unit);
                }
            }
        }
    }
    return result;
}
const deathEffectTypes = {
    1: { // deathEffectId: 1 に対応
        duration: 1200, // 演出の時間 (ms)
        deathSe: 'enemy_explode' // この演出で再生するSEのID
    },
    // 将来的に新しいエフェクトを追加する場合は、ここに case 2: ... と追記
};

// Bullet pattern functions
const bulletPatterns = {
    1: singleShot,
    2: threeWayShot,
    3: burstShot,
    bossDecelerating: bossDeceleratingShot, // ★★★ 新しいパターンを追加 ★★★
    guided: guidedShot
    
};

function singleShot(unit, baseAngle) {
    // ★★★ 修正: `projectiles.push` を `spawnProjectile` に変更 ★★★
    spawnProjectile({
        pos: unit.pos.copy(),
        vel: p5.Vector.fromAngle(baseAngle).mult(unit.bulletSpeed),
        damage: unit.bulletDamage,
        sourceAffiliation: unit.affiliation,
        range: unit.range,
        sourceUnitType: unit.type
    });
}

function threeWayShot(unit, baseAngle) {
    const angles = [baseAngle - radians(20), baseAngle, baseAngle + radians(20)];
    for (const angle of angles) {
        // ★★★ 修正: `projectiles.push` を `spawnProjectile` に変更 ★★★
        spawnProjectile({
            pos: unit.pos.copy(),
            vel: p5.Vector.fromAngle(angle).mult(unit.bulletSpeed),
            damage: unit.bulletDamage,
            sourceAffiliation: unit.affiliation,
            range: unit.range,
            shape: unit.type === 'D' ? 'spindle' : null,
            sourceUnitType: unit.type
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
        // ★★★ 修正: `projectiles.push` を `spawnProjectile` に変更 ★★★
        spawnProjectile({
            pos: unit.pos.copy(),
            vel: p5.Vector.fromAngle(angle).mult(unit.bulletSpeed),
            damage: unit.bulletDamage,
            sourceAffiliation: unit.affiliation,
            range: unit.range,
            sourceUnitType: unit.type,
            // この弾専用のプロパティ
            slowDistance: 250,
            slowSpeedMultiplier: 0.2
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

function guidedShot(unit, baseAngle) {
    spawnProjectile({
        pos: unit.pos.copy(),
        vel: p5.Vector.fromAngle(baseAngle).mult(3), // 弾速を3に設定
        damage: unit.bulletDamage,
        sourceAffiliation: unit.affiliation,
        range: unit.range,
        sourceUnitType: unit.type,
        homing: true,
        homingStrength: 0.05,
        color: color(128, 0, 128) // 弾の色を紫に設定
    });
}

function shootBullet(unit, baseAngle, patternKey = null) {
    // patternKeyが指定されていればそれを使う、なければユニットのデフォルトを使う
    const pattern = patternKey || unitTypes[unit.type]?.bulletPattern || '1';
    const shootFunction = bulletPatterns[pattern] || bulletPatterns['1'];
    shootFunction(unit, baseAngle);
    if (pattern !== '3') { // burstShot以外はクールダウンタイマーをリセット
        unit.lastShot = millis();
    }
}

// Appearance pattern functions
const appearancePatterns = {
    '1': emergeFromBelow,
    pattern2: descendFromAbove,
    patternKnight: knightAppear, // ★★★ 新しいパターンを登録 ★★★
};

// ★★★ 浮遊騎士の登場演出用パーティクルを生成する関数を新規作成 ★★★
function createAppearanceParticles(unit) {
    const particles = [];
    const spriteKey = `unit_${unit.type}`;
    const spriteSheet = spriteSheets[spriteKey];
    if (!spriteSheet || !spriteSheet.width || !spriteSheet.pixels || spriteSheet.pixels.length === 0) {
        console.warn(`Pixels for ${spriteKey} not loaded. Skipping appearance particle creation.`);
        return particles;
    }

    const spriteWidth = 48;
    const spriteHeight = 48;
    const pixelSkip = 2; // パフォーマンスのためピクセルを間引く

    for (let x = 0; x < spriteWidth; x += pixelSkip) {
        for (let y = 0; y < spriteHeight; y += pixelSkip) {
            const index = (y * spriteWidth + x) * 4;
            const a = spriteSheet.pixels[index + 3];
            if (a === 0) continue; // 透明ピクセルは無視

            const r = spriteSheet.pixels[index];
            const g = spriteSheet.pixels[index + 1];
            const b = spriteSheet.pixels[index + 2];

            particles.push({
                // 最終的に収束するターゲット位置（ユニットの中心からの相対座標）
                targetPos: createVector(x - spriteWidth / 2, y - spriteHeight / 2),
                // 初期位置は全員ユニットの中心（光線が着弾した場所）
                pos: createVector(0, 0),
                // 初速はランダムに外側へ飛び散る
                vel: p5.Vector.random2D().mult(random(3, 6)),
                color: color(r, g, b, a),
                alpha: 255,
            });
        }
    }
    return particles;
}
function drawKnightAppearanceEffect(unit) {
    const DURATION_BEAM = 300;
    const DURATION_MORPH = 800;
    const DURATION_FADE = 400;
    const elapsed = millis() - unit.appearanceStartTime;

    push();
    // ユニットの最終出現位置を原点として描画
    translate(unit.pos.x, unit.pos.y);

    switch (unit.appearancePhase) {
        case 'beam':
            const beamProgress = easeInOutCubic(elapsed / DURATION_BEAM);
            const startY = -50 - 300; // 画面上部から
            const endY = 0; // ユニットの足元へ
            const currentY = lerp(startY, endY, beamProgress);
            
            // 白い光線を描画
            stroke(255, 255, 255, 200);
            strokeWeight(10);
            line(0, currentY, 0, currentY + 50);
            break;

        case 'morph':
        case 'fade':
            // パーティクルを描画
            for (const p of unit.appearanceParticles) {
                const c = p.color;
                fill(c.levels[0], c.levels[1], c.levels[2], p.alpha);
                noStroke();
                rect(p.pos.x, p.pos.y, 2, 2);
            }

            // フェードイン段階では、本体スプライトを半透明で重ねて描画
            if (unit.appearancePhase === 'fade') {
                const fadeInProgress = (elapsed - (DURATION_BEAM + DURATION_MORPH)) / DURATION_FADE;
                const spriteSheet = spriteSheets[`unit_${unit.type}`];
                if (spriteSheet) {
                    push();
                    tint(255, fadeInProgress * 255);
                    const frame = unit.currentFrame % (frameCounts[`unit_${unit.type}`] || 1);
                    image(spriteSheet, -24, -24, 48, 48, frame * 48, 0, 48, 48);
                    pop();
                }
            }
            break;
    }
    pop();
}
function knightAppear(unit) {
    const DURATION_BEAM = 300;
    const DURATION_MORPH = 800;
    const DURATION_FADE = 400;
    const TOTAL_DURATION = DURATION_BEAM + DURATION_MORPH + DURATION_FADE;

    const elapsed = millis() - unit.appearanceStartTime;

    // 演出のフェーズを管理
    if (!unit.appearancePhase) {
        unit.appearancePhase = 'beam';
    } else if (elapsed > DURATION_BEAM && unit.appearancePhase === 'beam') {
        unit.appearancePhase = 'morph';
        unit.appearanceParticles = createAppearanceParticles(unit); // モーフィング開始時にパーティクル生成
    } else if (elapsed > DURATION_BEAM + DURATION_MORPH && unit.appearancePhase === 'morph') {
        unit.appearancePhase = 'fade';
    }

    // パーティクルの動きを更新
    if (unit.appearancePhase === 'morph' || unit.appearancePhase === 'fade') {
        for (const p of unit.appearanceParticles) {
            if (unit.appearancePhase === 'morph') {
                // ターゲット位置に収束するように移動
                const steer = p5.Vector.sub(p.targetPos, p.pos);
                steer.mult(0.1); // 収束の速さ
                p.vel.add(steer);
                p.vel.mult(0.95); // 摩擦
            }
            p.pos.add(p.vel);

            if (unit.appearancePhase === 'fade') {
                p.alpha = max(0, p.alpha - 15); // パーティクルをフェードアウト
            }
        }
    }

    // 演出が終了したら通常状態に戻す
    if (elapsed >= TOTAL_DURATION) {
        unit.isAppearing = false;
        unit.appearancePhase = null;
        unit.appearanceParticles = null;
    }
}

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
// ユニットのターゲットを見つける関数
/**
 * 指定された所属の、最も近いターゲットを探す
 * @param {object} sourceUnit - 探索を行うユニット
 * @param {string} [targetAffiliation='any'] - 探す対象の所属 ('ally', 'enemy', または 'any')
 * @returns {object|null} - 見つかった最も近いターゲットオブジェクト、またはnull
 */
function findClosestTarget(sourceUnit, targetAffiliation = 'any') {
    let potentialTargets = [];

    // --- ターゲット候補のリストアップ ---
    if (targetAffiliation === 'ally' || targetAffiliation === 'any') {
        if (playerStats.hp > 0) potentialTargets.push(player);
        for (const u of units) {
            // ★★★ 味方であり、かつ戦闘可能なユニットのみを対象 ★★★
            if (u.affiliation === 'ally' && !u.isDying && !u.isAppearing) {
                potentialTargets.push(u);
            }
        }
    }
    if (targetAffiliation === 'enemy' || targetAffiliation === 'any') {
        for (const u of units) {
            // ★★★ 敵であり、かつ戦闘可能なユニットのみを対象 ★★★
            if (u.affiliation === 'enemy' && !u.isDying && !u.isAppearing) {
                potentialTargets.push(u);
            }
        }
    }

    // --- 最も近いターゲットの決定 ---
    if (potentialTargets.length === 0) return null;

    let closestTarget = null;
    // ★★★ 距離の2乗で比較するため、初期値を十分に大きく設定 ★★★
    let minDistanceSq = Infinity; 

    for (const target of potentialTargets) {
        // ★★★ p5.Vector.dist() の代わりに magSq() を使用 ★★★
        const distanceSq = p5.Vector.sub(sourceUnit.pos, target.pos).magSq();
        
        if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            closestTarget = target;
        }
    }
    return closestTarget;
}

/**
 * その場で待機し、範囲内に入った最も近い敵を自動で攻撃するAI
 * @param {object} unit - 対象ユニット (ALLY_GUARD)
 * @returns {p5.Vector} - このユニットに適用する力のベクトル（待機なので常に0）
 */
function behaviorGuard(unit) {
    // --- 攻撃ロジック ---
    let closestEnemy = null;
    let minDistance = unitTypes.ALLY_GUARD.attackRange;

    // グリッドを使い、自身の周囲の敵だけを効率的に索敵
    const { col, row } = getGridCoords(unit.pos);
    for (let cOffset = -1; cOffset <= 1; cOffset++) {
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            const checkCol = col + cOffset;
            const checkRow = row + rOffset;
            if (checkCol < 0 || checkCol >= gridCols || checkRow < 0 || checkRow >= gridRows) continue;

            for (const enemy of grid[checkCol][checkRow]) {
                if (enemy.affiliation === 'enemy' && !enemy.isDying) {
                    const distance = p5.Vector.dist(unit.pos, enemy.pos);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
        }
    }

    // 範囲内に敵を見つけ、かつ攻撃クールダウンが終わっていれば攻撃
    if (closestEnemy && millis() - (unit.lastAttackTime || 0) > unitTypes.ALLY_GUARD.attackCooldown) {
        executeAllyMeleeAttack(unit, closestEnemy);
        unit.lastAttackTime = millis();
    }

    // ★ 速度を直接0にするのではなく、現在の速度を打ち消す「ブレーキ力」を返す
    // これにより、他の力（衝突回避など）との合算が正しく行われる
    return unit.vel.copy().mult(-1).limit(unit.maxForce);
}

/**
 * 新しい待機・回避AI
 * @param {object} unit - 対象ユニット
 * @param {number} finalSpeed - 減速効果などを考慮した最終的な速度
 * @returns {p5.Vector} - 計算された力のベクトル
 */
function behaviorGuardAdvanced(unit, finalSpeed) {
    // 常に迎撃行動を試みる
    performGuardAttack(unit);

    // 1. 脅威となる弾を検知
    const threat = findClosestThreatProjectile(unit);
    if (threat) {
        // 回避行動
        // 弾の進行方向に対して垂直な方向に避ける
        const evadeDir = createVector(threat.vel.y, -threat.vel.x).normalize();
        
        // ホームポジションから離れすぎないように回避方向を微調整
        const futurePos = p5.Vector.add(unit.pos, evadeDir.copy().mult(unit.speed));
        if (p5.Vector.dist(futurePos, unit.homePosition) > 100) {
            evadeDir.mult(-1); // 範囲外に出るなら逆方向に避ける
        }
        
        const desired = evadeDir.mult(finalSpeed);
        return p5.Vector.sub(desired, unit.vel);
    }
    
    // 2. 脅威がない場合、ホームポジションに戻る
    const distFromHome = p5.Vector.dist(unit.pos, unit.homePosition);
    if (distFromHome > 5) {
        // 戻る速度は少しゆっくりに
        return moveDirectlyToTarget(unit, { pos: unit.homePosition }, 0.5, finalSpeed);
    }

    // 3. 脅威がなく、ホームポジションにいる場合はその場で停止
    return unit.vel.copy().mult(-0.1); // 緩やかなブレーキ力
}

function behaviorKnight(unit) {
    const ORBIT_RADIUS = 80;
    const ORBIT_SPEED = 0.02;

    // findClosestTargetは味方も含めて探してしまうため、敵専用の探索を行う
    let closestEnemy = null;
    let minDistance = Infinity;
    for (const enemy of units) {
        if (enemy.affiliation === 'enemy' && !enemy.isDying) {
            const distance = p5.Vector.dist(unit.pos, enemy.pos);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }
    }

    if (closestEnemy) {
        const distanceToTarget = p5.Vector.dist(unit.pos, closestEnemy.pos);
        if (distanceToTarget < unitTypes.KNIGHT.attackRange && millis() - unit.lastAttackTime > unitTypes.KNIGHT.attackCooldown) {
            executeKnightAttack(unit, closestEnemy);
            unit.lastAttackTime = millis();
            return createVector(0, 0);
        }
        return moveDirectlyToTarget(unit, closestEnemy);
    } else {
        if (!unit.orbitAngle) unit.orbitAngle = random(TWO_PI);
        unit.orbitAngle += ORBIT_SPEED;
        const orbitPosition = p5.Vector.add(player.pos, p5.Vector.fromAngle(unit.orbitAngle).mult(ORBIT_RADIUS));
        return moveDirectlyToTarget(unit, { pos: orbitPosition });
    }
}

// finalSpeed を引数として受け取り、速度計算に利用する
function moveDirectlyToTarget(unit, target, speedMultiplier = 1.0, finalSpeed) {
    if (!target || !target.pos) return createVector(0, 0);
    const desired = p5.Vector.sub(target.pos, unit.pos);
    desired.normalize();
    const speedToUse = (typeof finalSpeed !== 'undefined') ? finalSpeed : unit.speed;
    desired.mult(speedToUse * speedMultiplier);
    const steer = p5.Vector.sub(desired, unit.vel);
    return steer;
}

/**
 * ユニットにとって最も脅威となる敵の弾を探す
 * @param {object} unit - 対象ユニット
 * @returns {object|null} - 最も近い脅威となる弾オブジェクト、なければnull
 */
function findClosestTarget(enemyUnit, targetAffiliation = 'any') {
    let potentialTargets = [];
    if (targetAffiliation === 'ally' || targetAffiliation === 'any') {
        if (playerStats.hp > 0) potentialTargets.push(player);
        for (const u of units) {
            if (u.affiliation === 'ally' && !u.isDying) potentialTargets.push(u);
        }
    }
    if (targetAffiliation === 'enemy' || targetAffiliation === 'any') {
        for (const u of units) {
            if (u.affiliation === 'enemy' && !u.isDying) potentialTargets.push(u);
        }
    }
    if (potentialTargets.length === 0) return null;
    let closestTarget = null;
    let minDistance = Infinity;
    for (const target of potentialTargets) {
        const distance = p5.Vector.dist(enemyUnit.pos, target.pos);
        if (distance < minDistance) {
            minDistance = distance;
            closestTarget = target;
        }
    }
    return closestTarget;
}

/**
 * ユニットの攻撃範囲内の敵を探し、攻撃する
 * @param {object} unit - 攻撃するユニット
 */
function performGuardAttack(unit) {
    if (millis() - (unit.lastAttackTime || 0) < unitTypes[unit.type].attackCooldown) {
        return; // クールダウン中
    }

    let closestEnemy = null;
    let minDistance = unitTypes[unit.type].attackRange;

    const { col, row } = getGridCoords(unit.pos);
    for (let cOffset = -1; cOffset <= 1; cOffset++) {
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            const checkCol = col + cOffset;
            const checkRow = row + rOffset;
            if (checkCol < 0 || checkCol >= gridCols || checkRow < 0 || checkRow >= gridRows) continue;

            for (const enemy of grid[checkCol][checkRow]) {
                if (enemy.affiliation === 'enemy' && !enemy.isDying) {
                    const distance = p5.Vector.dist(unit.pos, enemy.pos);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
        }
    }
    
    if (closestEnemy) {
        executeAllyMeleeAttack(unit, closestEnemy);
        unit.lastAttackTime = millis();
    }
}

// moveDirectlyToPlayer は findClosestTarget と moveDirectlyToTarget の組み合わせに
function moveDirectlyToPlayer(unit, finalSpeed) {
    const target = findClosestTarget(unit, 'ally');
    return moveDirectlyToTarget(unit, target, 1.0, finalSpeed);
}

function prepareAndShoot(unit, finalSpeed) {
    const target = findClosestTarget(unit, 'ally');
    if (!target) return createVector(0, 0);
    const distance = p5.Vector.dist(unit.pos, target.pos);

    if (!unit.isPreparingAttack && distance < 400 && millis() > (unit.cooldownEndTime || 0)) {
        unit.isPreparingAttack = true;
        unit.stateTimer = millis();
    }
    if (unit.isPreparingAttack) {
        if (millis() - unit.stateTimer >= 1500) {
            shootBullet(unit, atan2(target.pos.y - unit.pos.y, target.pos.x - unit.pos.x));
            unit.isPreparingAttack = false;
            unit.cooldownEndTime = millis() + 4500;
        }
        return createVector(0, 0);
    }
    return moveDirectlyToTarget(unit, target, 1.0, finalSpeed);
}

function behaviorFlyby(unit, finalSpeed) {
    const vectorToPlayer = p5.Vector.sub(player.pos, unit.pos);
    const distance = vectorToPlayer.mag();
    if (distance < 150) {
        if (!unit.lastShotTime || millis() - unit.lastShotTime > 4000) {
            unit.lastShotTime = millis();
            shootBullet(unit, vectorToPlayer.heading(), '1');
        }
    }
    const futurePlayerPos = p5.Vector.add(player.pos, p5.Vector.mult(player.vel, 10));
    const vectorToFuture = p5.Vector.sub(futurePlayerPos, unit.pos);
    const crossProductZ = vectorToPlayer.cross(unit.vel).z;
    const swingbyAngle = (crossProductZ > 0 ? PI / 6 : -PI / 6);
    const targetOffset = vectorToFuture.copy().rotate(swingbyAngle);
    const target = p5.Vector.add(unit.pos, targetOffset);
    const desired = p5.Vector.sub(target, unit.pos);
    const distToTarget = desired.mag();
    desired.normalize();
    if (distToTarget < 100) {
        const m = map(distToTarget, 0, 100, 0, finalSpeed);
        desired.mult(m);
    } else {
        desired.mult(finalSpeed);
    }
    return p5.Vector.sub(desired, unit.vel);
}


/**
 * ボス専用の行動パターン。新しい直線的突撃ロジックに全面改修。
 * @param {object} unit - 対象のボスユニット
 * @returns {p5.Vector} - 計算された力のベクトル
 */
/**
 * ボス専用の行動パターン。追尾突撃と、内積による追い越し判定を実装した最終版。
 * @param {object} unit - 対象のボスユニット
 * @returns {p5.Vector} - 計算された力のベクトル
 */
function shakeAndCharge(unit, finalSpeed) {
    // 状態が未定義なら初期化
    if (!unit.attackState) {
        unit.attackState = 'approaching';
        unit.cooldownEndTime = millis() + 2000;
    }

    const distanceToPlayer = p5.Vector.dist(unit.pos, player.pos);

    // 状態に応じた行動を決定
    switch (unit.attackState) {
        
        case 'approaching':
            if (millis() > (unit.cooldownEndTime || 0) && distanceToPlayer > 400) {
                return moveDirectlyToTarget(unit, player, 0.5, finalSpeed);
            } 
            else if (millis() > (unit.cooldownEndTime || 0) && distanceToPlayer <= 400) {
                unit.attackState = 'preparing';
                unit.stateTimer = millis();
                return createVector(0, 0);
            } 
            else {
                return createVector(0, 0);
            }

        case 'preparing':
            unit.shakeOffset = sin(millis() * 0.05) * 5;
            if (millis() - unit.stateTimer >= 1000) {
                unit.attackState = 'charging';
                // ★ 突撃開始時の「ボスからプレイヤーへのベクトル」を記録
                unit.chargeStartVectorToPlayer = p5.Vector.sub(player.pos, unit.pos);
            }
            return unit.vel.copy().mult(-0.2);

        case 'charging':
            unit.temporarySpeedLimit = unit.speed * 3.5;

            // ★★★ ここからが新しい追尾突撃と追い越し判定のロジック ★★★

            // 1. 現在の「ボスからプレイヤーへのベクトル」を計算
            const currentVectorToPlayer = p5.Vector.sub(player.pos, unit.pos);

            // 2. 突撃開始時のベクトルと現在のベクトルの内積を計算
            //    内積が負になったら、プレイヤーは開始時とは逆の方向にいる＝追い越したと判断
            if (unit.chargeStartVectorToPlayer && unit.chargeStartVectorToPlayer.dot(currentVectorToPlayer) < 0) {
                unit.attackState = 'stopping';
                unit.stateTimer = millis();
                return createVector(0, 0); // 即座にブレーキを開始
            }
            
            // 3. プレイヤーに向かって緩やかに誘導する力を返す
            return moveDirectlyToTarget(unit, player, 3.5, finalSpeed);
            // ★★★ 新しいロジックここまで ★★★

        case 'stopping':
            unit.temporarySpeedLimit = null;
            if (millis() - unit.stateTimer > 200) {
                unit.attackState = 'shooting';
                unit.stateTimer = millis();
                unit.burstCount = 0;
            }
            return unit.vel.copy().mult(-1).limit(unit.maxForce * 5);

        case 'shooting':
            const SHOOT_COUNT = 8;
            const SHOOT_INTERVAL = 80;
            if (unit.burstCount < SHOOT_COUNT && millis() - unit.stateTimer > unit.burstCount * SHOOT_INTERVAL) {
                const target = findClosestTarget(unit);
                const baseAngle = target
                    ? atan2(target.pos.y - unit.pos.y, target.pos.x - unit.pos.x)
                    : random(TWO_PI);

                // --- 向きをターゲット方向に合わせる ---
                if (target && !unitTypes[unit.type]?.vectorUnder) {
                    unit.facingDirection = cos(baseAngle) >= 0 ? 1 : -1;
                }
                const spread = radians(20);
                const finalAngle = baseAngle + random(-spread / 2, spread / 2);
                shootBullet(unit, finalAngle, 'bossDecelerating');
                unit.burstCount++;
            }
            
            if (unit.burstCount >= SHOOT_COUNT) {
                unit.attackState = 'cooldown';
                unit.cooldownEndTime = millis() + 4000;
            }
            return unit.vel.copy().mult(-1).limit(unit.maxForce * 1);
            
        case 'cooldown':
            unit.temporarySpeedLimit = null;
            if (millis() > unit.cooldownEndTime) {
                unit.attackState = 'approaching';
            }
            return unit.vel.copy().mult(-1).limit(unit.maxForce);
    }
    
    return createVector(0, 0);
}
function behaviorY(unit, finalSpeed) {
    // ユニットの現在の状態が未定義、または行動サイクル外の'approaching'であれば、
    // 行動サイクルの起点である'patternA'に強制的に設定する
    if (!unit.attackState || unit.attackState === 'approaching') {
        unit.attackState = 'patternA';
    }

    switch (unit.attackState) {
        case 'patternA': {
            const target = player;
            if (millis() - (unit.lastShot || 0) > 2000) {
                shootBullet(unit, atan2(target.pos.y - unit.pos.y, target.pos.x - unit.pos.x));
            }
            const steer = moveDirectlyToTarget(unit, target, 1.0, finalSpeed);
            if (p5.Vector.dist(unit.pos, player.pos) < 100) {
                unit.attackState = 'startB';
            }
            return steer;
        }
        case 'startB': {
            const dirAway = p5.Vector.sub(unit.pos, player.pos).setMag(200);
            unit.jumpTarget = p5.Vector.add(player.pos, dirAway);
            unit.attackState = 'movingB';
            return createVector(0, 0);
        }
        case 'movingB': {
            const steer = moveDirectlyToTarget(unit, { pos: unit.jumpTarget }, 4.0, finalSpeed);
            if (p5.Vector.dist(unit.pos, unit.jumpTarget) < 10) {
                unit.attackState = 'summon';
                unit.stateTimer = millis();
                unit.hasSummoned = false;
            }
            return steer;
        }
        case 'summon': {
            if (!unit.hasSummoned) {
                const dir = p5.Vector.sub(player.pos, unit.pos).normalize();
                const spacing = 50;
                for (let i = -1; i <= 1; i++) {
                    const pos = p5.Vector.add(unit.pos, dir.copy().mult(spacing * (i + 2)));
                    spawnUnitAt('I', pos);
                }
                const baseAngle = dir.heading();
                shootBullet(unit, baseAngle + HALF_PI, 'guided');
                shootBullet(unit, baseAngle - HALF_PI, 'guided');
                unit.hasSummoned = true;
                unit.stateTimer = millis();
            }
            if (millis() - unit.stateTimer > 3000) {
                unit.attackState = 'patternA';
            }
            return createVector(0, 0);
        }
    }
    return createVector(0, 0);
}


// ★★★ 2. ボスの弾を生成する関数を修正 ★★★
/**
 * ボス用の高速減速弾を生成する
 */
function bossDeceleratingShot(unit, baseAngle) {
    const initialVelocity = p5.Vector.fromAngle(baseAngle).mult(unit.bulletSpeed * 2);

    // ★★★ 修正: `projectiles.push` を `spawnProjectile` に変更 ★★★
    spawnProjectile({
        pos: unit.pos.copy(),
        vel: initialVelocity.copy(),
        damage: unit.bulletDamage,
        sourceAffiliation: unit.affiliation,
        range: unit.range,
        sourceUnitType: unit.type,
        decelerates: true,
        initialSpeed: initialVelocity.mag()
    });
}
const behaviorPatterns = {
    'pattern1': moveDirectlyToPlayer,
    'pattern2': prepareAndShoot,
    'pattern3': shakeAndCharge,
    'patternKnight': behaviorKnight,
    'patternGuard': behaviorGuard,
    'patternGuardAdvanced': behaviorGuardAdvanced,
    'flyby': behaviorFlyby,
    'patternY': behaviorY
};


/**
 * ユニットのAIに基づいた「力（ステアリングフォース）」を計算して返す
 * @param {object} unit - 対象ユニット
 * @returns {p5.Vector} - 計算された力のベクトル
 */
function getBehaviorForce(unit, finalSpeed) {
    const unitConfig = unitTypes[unit.type];
    if (!unitConfig || !unitConfig.behaviorPattern) {
        return createVector(0, 0);
    }
    
    // behaviorPatternsオブジェクトから、対応する関数を取得
    const behaviorFunction = behaviorPatterns[unitConfig.behaviorPattern];

    if (typeof behaviorFunction === 'function') {
        // 関数が存在すれば、それを呼び出して力を返す
        return behaviorFunction(unit, finalSpeed);
    } else {
        // もし対応する関数がなければ、デフォルトの動き（プレイヤーへ直進）
        console.warn(`Behavior pattern '${unitConfig.behaviorPattern}' not found. Defaulting to pattern1.`);
        return moveDirectlyToPlayer(unit, finalSpeed);
    }
}

/**
 * 周囲の他のユニットとの衝突を避けるための「力（セパレーションフォース）」を計算して返す
 * @param {object} unit - 対象ユニット
 * @returns {p5.Vector} - 計算された力のベクトル
 */
function getSeparationForce(unit) {
    // この関数は新しいロジックでは使用されないため、中身を削除または関数自体を削除します。
    // 今回は安全のため、空のベクトルを返すようにだけしておきます。
    return createVector(0, 0);
}

// ★★★ 新しく追加する、ユニットの重なりを解決する関数 ★★★
/**
 * 全ユニットの重なりをチェックし、位置を直接補正して解決する
 */
function resolveUnitOverlaps() {
    const iterations = 3; // 複数回繰り返して安定させる
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                const unitA = units[i];
                const unitB = units[j];

                if (!unitA || !unitB || unitA.isDying || unitB.isDying || unitA.isAppearing || unitB.isAppearing) continue;
                
                const vec = p5.Vector.sub(unitA.pos, unitB.pos);
                const distSq = vec.magSq();
                const desiredDist = unitA.size / 2 + unitB.size / 2;

                if (distSq > 0 && distSq < desiredDist * desiredDist) {
                    const dist = sqrt(distSq);
                    const overlap = (desiredDist - dist);
                    const pushDirection = vec.div(dist); // 正規化された、BからAへのベクトル

                    // ★★★ ここからが修正箇所 ★★★
                    // 壁に面しているかどうかで押し出し方を変更
                    const a_is_blocked = unitA.isAgainstWall || false;
                    const b_is_blocked = unitB.isAgainstWall || false;

                    if (a_is_blocked && b_is_blocked) {
                        // 両方ブロックされている場合は何もしない
                        continue;
                    } else if (a_is_blocked) {
                        // Aがブロックされているので、Bだけを強く押し出す
                        unitB.pos.sub(pushDirection.copy().mult(overlap));
                    } else if (b_is_blocked) {
                        // Bがブロックされているので、Aだけを強く押し出す
                    unitA.pos.add(pushDirection.copy().mult(overlap));
                    } else {
                        // どちらもブロックされていないので、半分ずつ押し出す
                        const halfOverlap = overlap / 2;
                        unitA.pos.add(pushDirection.copy().mult(halfOverlap));
                        unitB.pos.sub(pushDirection.copy().mult(halfOverlap));
                    }
                }
            }
        }
    }
}


// ユニットの物理演算とアニメーション更新
function updateUnits() {
    const AI_UPDATE_INTERVAL = 6;

    // --- ステップ1: AIによる意思決定と、それに基づく移動 ---
    for (let i = units.length - 1; i >= 0; i--) {
        let unit = units[i];
        if (!unit || unitsToRemove.has(i)) continue;
        
        const unitConfig = unitTypes[unit.type];
        
        // ★★★ 修正点1: 自壊処理を handleUnitDeath の直接呼び出しに変更 ★★★
        if (unitConfig.despawnTime && millis() - (unit.spawnTime || 0) > unitConfig.despawnTime) {
            handleUnitDeath(unit, i, 'despawn'); // 'despawn'という理由で死亡させる
            continue; // このユニットの以降の処理をスキップ
        }

        if (unit.isDying) {
            updateDeathEffect(unit);
            continue;
        }
        if (unit.isAppearing) {
            const patternKey = unitTypes[unit.type]?.appearancePattern || '1';
            const appearanceUpdateFn = appearancePatterns[patternKey];
            if (appearanceUpdateFn) {
                appearanceUpdateFn(unit);
            }
            continue;
        }
        
        if (unit.isInvincible && millis() > (unit.invincibilityEndTime || 0)) {
            unit.isInvincible = false;
        }

        let finalSpeed = unit.speed;
        for (const zone of waterZones) {
            if (p5.Vector.dist(unit.pos, zone.pos) < zone.radius) {
                finalSpeed *= zone.slowFactor;
                break;
            }
        }
        
        if (unit.aiUpdateCounter === undefined) {
            unit.aiUpdateCounter = floor(random(AI_UPDATE_INTERVAL)); 
            unit.frameBehaviorForce = createVector(0, 0); 
        }
        unit.aiUpdateCounter++;

        if (unit.aiUpdateCounter % AI_UPDATE_INTERVAL === 0) {
            const totalSteeringImpulse = getBehaviorForce(unit, finalSpeed);
            unit.frameBehaviorForce = totalSteeringImpulse.div(AI_UPDATE_INTERVAL);
        }

        // --- 向きと移動ベクトルの決定 ---
        const behaviorForce = unit.frameBehaviorForce;

        if (!unitConfig.vectorUnder) {
            if (abs(behaviorForce.x) > 0.01) {
                unit.facingDirection = (behaviorForce.x > 0) ? 1 : -1;
            }
        }
        
        // --- 移動ベクトルの更新 (挙動フォースのみを適用) ---
        const weight = unitConfig.weight || 1;
        let acceleration = behaviorForce.copy().div(weight); // behaviorForceのみを使用
        
        if (unit.maxForce) {
            acceleration.limit(unit.maxForce);
        }
        unit.vel.add(acceleration);
        unit.vel.limit(unit.temporarySpeedLimit || finalSpeed);

        // --- 移動と地形との衝突判定 ---
        const unitRadius = unit.size / 2;
        const newPos = p5.Vector.add(unit.pos, unit.vel);
        
        let collidedWithTerrain = false; // ★ 壁との衝突フラグ
        const collision = getTerrainCollision(newPos, unitRadius);
        if (collision && (collision.shape.type === 1 || (collision.shape.type === 2 && !unitConfig.fly))) {
            const normal = getCollisionNormal(newPos, collision);
            const dot = unit.vel.dot(normal);
            const perpendicularVel = normal.mult(dot);
            const slideVel = p5.Vector.sub(unit.vel, perpendicularVel);
            
            unit.pos.add(slideVel);
            unit.vel = slideVel; 
            collidedWithTerrain = true;
        } else {
            unit.pos.add(unit.vel);
        }
        
        const finalCollision = getTerrainCollision(unit.pos, unitRadius);
        if (finalCollision) {
            const finalNormal = getCollisionNormal(unit.pos, finalCollision);
            unit.pos.add(finalNormal.mult(1.0));
            collidedWithTerrain = true;
        }
        
        // ★★★ 修正点2: isAgainstWall フラグを設定 ★★★
        unit.isAgainstWall = collidedWithTerrain;
    }

    // --- ステップ2: 全ユニットの重なりを解消 ---
    resolveUnitOverlaps();

    // --- ステップ3: 最終的な位置に基づき、グリッドとアニメーションを更新 ---
    for (let i = units.length - 1; i >= 0; i--) {
        let unit = units[i];
        if (!unit || unitsToRemove.has(i) || unit.isDying || unit.isAppearing) continue;

        const mapSize = getStageConfig(currentStage).mapSize;
        unit.pos.x = constrain(unit.pos.x, 0, mapSize.width);
        unit.pos.y = constrain(unit.pos.y, 0, mapSize.height);

        updateUnitGridPosition(unit);
        updateAnimation(unit, frameCounts[`unit_${unit.type}`] || 1);
    }
}


function drawUnits() {
    const { cameraX, cameraY } = getCameraPosition();
    const viewportWidth = 960; // ゲーム画面の幅
    const viewportHeight = 720; // ゲーム画面の高さ

    for (let unit of units) {
        if (!unit) continue;

                const unitScreenX = unit.pos.x - cameraX;
        const unitScreenY = unit.pos.y - cameraY;
        const margin = unit.size; // ユニットの半径分のマージン

        if (unitScreenX < -margin || unitScreenX > viewportWidth + margin ||
            unitScreenY < -margin || unitScreenY > viewportHeight + margin) {
            continue; // 画面外なら以降の描画処理をスキップ
        }

        // 状態1: 死亡演出中のユニット
        if (unit.isDying) {
            drawDeathEffect(unit);
            continue; // このユニットの以降の描画処理をスキップ
        }

        // ★★★ ここからが、登場演出に関する修正ブロックです ★★★
        // 状態2: 登場演出中のユニット
        if (unit.isAppearing) {
            
            // 2-a: 浮遊騎士専用の登場演出
            if (unit.type === 'KNIGHT') {
                drawKnightAppearanceEffect(unit);
            } 
            // 2-b: その他のユニットの既存の登場演出
            else {
                const spriteKey = `unit_${unit.type}`;
                const spriteSheet = spriteSheets[spriteKey];
                const frameCount = frameCounts[spriteKey] || 1;

                // スプライトがない場合は円で描画
                if (!spriteSheet || !spriteSheet.width) {
                    fill(255, 0, 0);
                    noStroke();
                    ellipse(unit.pos.x, unit.pos.y, unit.size);
                    console.warn(`Sprite missing for appearing unit: ${spriteKey}`);
                    continue; // スキップ
                }

                push();
                const drawPos = unit.appearancePos || unit.pos;
                const shakeX = (unit.isAppearing && unit.appearanceShakeOffset !== null && unitTypes[unit.type]?.appearancePattern === '1') 
                    ? unit.appearanceShakeOffset : 0;
                translate(drawPos.x + shakeX, drawPos.y);

                let rotation = 0;
                let scaleX = 1;
                let scaleY = 1;

         const unitConfig = unitTypes[unit.type];
        if (unitConfig.vectorUnder) {
            // 進行方向に機体を傾けるタイプ
            rotation = atan2(unit.vel.y, unit.vel.x) - PI / 2;
        } else {
            // ボスを含む、その他の全てのユニットは、保存された向き(facingDirection)を読み取るだけ
            scaleX = unit.facingDirection || 1;
        }
                scale(scaleX, scaleY);
                rotate(rotation);

                const frame = unit.currentFrame % frameCount;
                // 地面からせり上がる演出用のクリッピング描画
                if (unit.appearanceProgress !== null && unitTypes[unit.type]?.appearancePattern === '1') {
                    const spriteHeight = 48;
                    const visibleHeight = spriteHeight * unit.appearanceProgress;
                    image(spriteSheet, -24, -24 + spriteHeight - visibleHeight, 48, visibleHeight, 
                          frame * 48, spriteHeight - visibleHeight, 48, visibleHeight);
                } else {
                    image(spriteSheet, -24, -24, 48, 48, frame * 48, 0, 48, 48);
                }
                pop();
            }            if (showHitboxes) {
                push();
                translate(unit.pos.x, unit.pos.y);
                noFill();
                stroke(255, 100, 100, 150); // 味方・敵問わず赤色で表示
                strokeWeight(1);
                ellipse(0, 0, unit.size, unit.size);
                pop();
            }
            continue;
        }

        const spriteKey = `unit_${unit.type}`;
        const spriteSheet = spriteSheets[spriteKey];
        const frameCount = frameCounts[spriteKey] || 1;

        if (!spriteSheet || !spriteSheet.width) {
            fill(255, 0, 0); noStroke(); ellipse(unit.pos.x, unit.pos.y, unit.size);
            continue;
        }

        push();
        translate(unit.pos.x, unit.pos.y);

        let rotation = 0;
        let scaleX = 1;
        const unitConfig = unitTypes[unit.type];

        if (unitConfig.vectorUnder) {
            rotation = atan2(unit.vel.y, unit.vel.x) - PI / 2;
        } else {
            scaleX = unit.facingDirection || 1;
        }
        
        scale(scaleX, 1);
        rotate(rotation);

        const frame = (unit.currentFrame || 0) % frameCount;
        image(spriteSheet, -24, -24, 48, 48, frame * 48, 0, 48, 48);
        
        // ★★★ 通常時のユニットの当たり判定を描画 ★★★
        if (showHitboxes) {
            noFill();
            stroke(255, 100, 100, 150);
            strokeWeight(1);
            // scaleXの影響を打ち消すため、再度scaleを適用
            scale(scaleX, 1); 
            ellipse(0, 0, unit.size, unit.size);
        }
        
        pop();
                // ★★★ ここからが修正箇所 ★★★
        // --- 特殊ステートエフェクトの描画 ---
        // ユニットの描画後に、エフェクト描画関数を呼び出す
        if (unit.stateEffect && unit.stateEffect !== 'none') {
            drawStateEffect(unit); // effects.jsに新しく作る関数
        }
    }

    //pop();
}

const DEATH_EFFECTS = {
    // デフォルトのパーティクル拡散エフェクト
    1: {
        duration: 1200,         // 演出の時間 (ms)
        seId: 'enemy_explode'   // 再生するSEのID
    },
    // 将来的に別のエフェクトを追加する場合
    // 2: {
    //     duration: 2000,
    //     seId: 'boss_explode'
    // }
};

function updateDeathEffect(unit) {
    const effectId = unitTypes[unit.type]?.deathEffectId;
    // エフェクト設定オブジェクトを取得
    const effectConfig = deathEffectTypes[effectId];
    if (!effectConfig) return;

    // ★ハードコードされていた時間を、設定オブジェクトから取得するように変更
    const DEATH_EFFECT_DURATION = effectConfig.duration || 1000; // 未設定なら1秒

    switch (effectId) {
        case 1: // パーティクル拡散エフェクト
            const elapsedTime = millis() - unit.deathEffect.startTime;
            const progress = constrain(elapsedTime / DEATH_EFFECT_DURATION, 0, 1);
            
            unit.deathEffect.particles.forEach(p => {
                p.pos.add(p.vel);
                p.vel.mult(0.97);
                p.lifespan = 1.0 - progress;
            });

            if (progress >= 1) {
                const index = units.indexOf(unit);
                if (index !== -1 && !unitsToRemove.has(index)) {
                    unitsToRemove.add(index);
                    unit.isDying = false;
                }
            }
            break;
    }
}
function createDeathParticles(unit) {
    const particles = [];
    const spriteKey = `unit_${unit.type}`;
    const spriteSheet = spriteSheets[spriteKey];
    // ★ ピクセルが事前にロードされているか確認するガード節を追加
    if (!spriteSheet || !spriteSheet.width || !spriteSheet.pixels || spriteSheet.pixels.length === 0) {
        console.warn(`Pixels for ${spriteKey} not loaded. Skipping particle creation.`);
        return particles;
    }

    const spriteWidth = 48;
    const spriteHeight = 48;
    // パフォーマンスのために、全ピクセルでなく数ピクセルおきにパーティクルを生成
    const pixelSkip = 2; 

    // プレイヤーから敵への方向ベクトルを計算（これがエフェクトの基準方向）
    const directionFromPlayer = p5.Vector.sub(unit.pos, player.pos).normalize();

    for (let x = 0; x < spriteWidth; x += pixelSkip) {
        for (let y = 0; y < spriteHeight; y += pixelSkip) {
            const index = (y * spriteWidth + x) * 4;
            const r = spriteSheet.pixels[index];
            const g = spriteSheet.pixels[index + 1];
            const b = spriteSheet.pixels[index + 2];
            const a = spriteSheet.pixels[index + 3];

            // 透明ピクセルは無視
            if (a === 0) continue;

            // 拡散するパーティクルの初速をランダムに設定
            const velocity = p5.Vector.random2D().mult(random(0.5, 2.5));
            
            particles.push({
                // 元のスプライト上の相対位置（中心を0,0とする）
                pos: createVector(x - spriteWidth / 2, y - spriteHeight / 2),
                vel: velocity,
                color: color(r, g, b, a),
                lifespan: 1.0, // 寿命 (1.0 → 0)
            });
        }
    }
    return particles;
}

// ★★★「死亡演出中」のユニットを描画する関数 ★★★
function drawDeathEffect(unit) {
    const effectId = unitTypes[unit.type]?.deathEffectId;
    if (!effectId) return;

    switch (effectId) {
        case 1: // パーティクル拡散エフェクト
                    const spriteWidth = 48;

            push();
            // 敵が倒れた位置を基準にパーティクルを描画
            translate(unit.pos.x, unit.pos.y);
            
            // プレイヤーからの方向を基準にパーティクルを徐々に表示させる
            const direction = unit.deathEffect.directionFromPlayer;
            const progress = (millis() - unit.deathEffect.startTime) / 500; // 0.5秒かけて拡散開始

            unit.deathEffect.particles.forEach(p => {
                // パーティクルの位置とプレイヤーからの方向の内積を計算
                // これにより、プレイヤー側のピクセルほど値が小さくなる
                const projection = p.pos.dot(direction);

                // 演出の進行度(progress)が、そのピクセルの位置(projection)を超えたら描画
                // map関数でprojectionの範囲を調整
                if (progress > map(projection, -spriteWidth/2, spriteWidth/2, 0, 1)) {
                    const c = p.color;
                    const alpha = c.levels[3] * p.lifespan; // 寿命に応じて透明にする
                    fill(c.levels[0], c.levels[1], c.levels[2], alpha);
                    noStroke();
                    // パーティクルを点で描画
                    rect(p.pos.x, p.pos.y, 2, 2);
                }
            });
            pop();
            break;
            
    }
}

/**
 * ユニットが倒された際の処理（特殊敗北と通常死亡を明確に分離した最終版）
 * @param {object} unit - 倒されたユニット
 * @param {number} index - ユニット配列のインデックス
 * @param {string | null} [lastAttackerSpecies=null] - 最後にダメージを与えたユニットの種族
 */
function handleUnitDeath(unit, index, lastAttackerSpecies = null) {
    // 既に処理中のユニットは無視
    if (!unit || index < 0 || index >= units.length || units[index] !== unit || unitsToRemove.has(index) || unit.isDying) {
        return;
    }
    
    const unitConfig = unitTypes[unit.type];
    if (!unitConfig) return;

    // ★★★ ここからが新しいロジック ★★★

    // --- 1. ボス撃破判定 ---
    // ユニットが倒されたという事実を、まず最初に記録する
    if (unitConfig.isBoss) {
        defeatedBossesThisStage.add(unit.type);
        console.log(`[UNITDEATH LOG] Boss ${unit.type} defeated and tracked.`);
        
        const stageConfig = getStageConfig(currentStage);
        const trigger = stageConfig.scenarioTriggers?.find(t => t.conditionType === 'bossDefeated' && t.bossType === unit.type);
        if (trigger && trigger.scenarioTriggerId) {
            justTriggeredEventId = trigger.scenarioTriggerId;
            console.log(`[UNITDEATH LOG] Event ID set for bossDefeated: ${justTriggeredEventId}`);
        }
    }

    // --- 2. 特殊敗北変化の処理 ---
    // specialDefeatが設定されているユニットの場合、変身処理を行い、ここで関数を終了する
    if (unitConfig.specialDefeat) {
        let transformToType = unitConfig.specialDefeat.default;

        if (lastAttackerSpecies && unitConfig.specialDefeat.bySpecies && unitConfig.specialDefeat.bySpecies[lastAttackerSpecies]) {
            transformToType = unitConfig.specialDefeat.bySpecies[lastAttackerSpecies];
        }
        
        if (transformToType) {
            spawnUnitAt(transformToType, unit.pos.copy());
        }
        
        // ユニットを削除リストに追加し、処理を完結させる
        unitsToRemove.add(index);
        removeUnitFromGrid(unit);
        return; // ★★★ このreturnが重要 ★★★
    }

    // --- 3. 通常の死亡処理（特殊敗北を持たないユニットのみがここに来る） ---
    
    // a. 死亡エフェクトとSE
    const effectId = unitConfig.deathEffectId;
    const effectConfig = DEATH_EFFECTS[effectId];

    if (effectConfig && effectConfig.seId) {
        playSE(effectConfig.seId);
    }
    
    if (effectId) {
        unit.isDying = true;
        unit.deathEffect = {
            startTime: millis(),
            particles: createDeathParticles(unit),
            directionFromPlayer: p5.Vector.sub(player.pos, unit.pos).normalize()
        };
    } else {
        unitsToRemove.add(index);
        removeUnitFromGrid(unit);
    }
    
    // b. スコアやアイテム
    if (unit.affiliation === 'enemy') {
        rushEnemiesKilled++;
        enemiesKilled++;
        expItems.push({ 
            pos: unit.pos.copy(), 
            vel: createVector(0, 0), 
            speed: 5,
            createdAt: millis()
        });
    }

    if (playerStats.poisonSwampRadius > 0 && PLAYER_SOURCED_ATTACKS.includes(lastAttackerSpecies) && random() < 0.5) {
        let canCreateSwamp = true;
        for (const swamp of poisonSwamps) {
            if (p5.Vector.dist(unit.pos, swamp.pos) < swamp.radius) {
                canCreateSwamp = false;
                break;
            }
        }
        if (canCreateSwamp) {
            poisonSwamps.push({
                pos: unit.pos.copy(),
                radius: playerStats.poisonSwampRadius,
                time: millis()
            });
        }
    }
    
    // ★★★ 修正箇所: lastAttackerSpecies がプレイヤー由来攻撃リストに含まれるかチェック ★★★
    if (playerStats.chainExplosionEnabled && 
        playerStats.chainExplosionRadius > 0 && 
        PLAYER_SOURCED_ATTACKS.includes(lastAttackerSpecies) && 
        unit.affiliation !== 'ally') {
        
        activeExplosions.push({
            center: unit.pos.copy(),
            radius: playerStats.chainExplosionRadius,
            damage: playerStats.attack * playerStats.chainExplosionDamageMultiplier,
            startTime: millis(),
            delay: 100,
            hasExploded: false
        });
    }
}

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
/**
 * アクティブでなくなった弾丸を `projectiles` 配列から取り除き、プールに戻す
 */
function cleanupProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        // activeフラグがfalseなら、プールに戻してアクティブリストから削除
        if (!p.active) {
            projectilePool.push(p);
            projectiles.splice(i, 1);
        }
    }
}


function updateAnimation(entity, frameCount) {
    if (!entity || frameCount <= 1) return;
    const frameInterval = 333;
    if (millis() - (entity.lastFrameChange || 0) >= frameInterval) {
        if (!entity.hasOwnProperty('animationDirection')) entity.animationDirection = 1;
        
        entity.currentFrame = (entity.currentFrame || 0) + entity.animationDirection;
        
        if (entity.currentFrame >= frameCount - 1) {
            entity.currentFrame = frameCount - 1;
            entity.animationDirection = -1;
        } else if (entity.currentFrame <= 0) {
            entity.currentFrame = 0;
            entity.animationDirection = 1;
        }
        entity.lastFrameChange = millis();
    }
    entity.frameIndex = entity.currentFrame;
}