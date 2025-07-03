// ★★★ 1. キャラクターの役割を定義するリストを追加 ★★★
const PLAYABLE_CHARACTERS = ['ANNA', 'TRACY','URANUS'];
const SCENARIO_CHARACTERS = [ 'RENATE','snowgirl']; 

const characterParams = {
    ANNA: {
        hp: 100,
        moveSpeed: 4,
        attack: 120,
        attackSpeed: 400,
        attackRange: 300,
        bulletSpeed: 10,
        attackWays: 1,
        bits: 0,
        slowField: 0,
        slowFieldFactor: 0, // ★★★ 減速効果の倍率を追加
        collectRange: 150,
        bulletSizeScale: 1,
        explosionRadius: 0, // 既存の誘爆ダメージ用
        areaDamageRadius: 0,
        areaDamageMultiplier: 0,
        pierceCount: 0,
        waveRadius: 0,
        waveDamageMultiplier: 1,
        assaultArmorRadius: 0,
        assaultArmorDamageMultiplier: 1,
        shootingBits: 0,
        shockFieldRadius: 0,
        shockFieldCooldown: 0,
        shockFieldDamageMultiplier: 0,
        poisonSwampRadius: 0,
        poisonSwampDamageMultiplier: 0,
        regenerationInterval: 0,
        shieldHits: 0,
        shieldActive: false,
        lastShield: 0,
        lastRegeneration: 0,
        exp: 0,
        expToNext: 2,
        level: 1,
        isFlashing: false,
        isInvincible: false,
        flashStart: 0,
        isMelee: false,
        lastWave: 0,
        lastShockField: 0,
        currentFrame: 0,
        lastFrameChange: 0,
        animationDirection: 1,
         attackSe: 'shoot',
        hitSe: 'hit_bullet',
        lastDamageUnitType: null,
        fly: false, // ★ この行を追加

        
        // ▼▼▼ 連鎖爆裂関連のステータスを追加 ▼▼▼
        chainExplosionEnabled: false,
        chainExplosionRadius: 0, // アップグレードで設定
        chainExplosionDamageMultiplier: 0.2, // 固定値
        //水流地帯のステータス
                waterZone_enabled: false,
        waterZone_count: 0,
        waterZone_radius: 0,
        waterZone_cooldown: 0,
        waterZone_duration: 0,
        waterZone_slowFactor: 1.0, // 減速効果なし（速度を1.0倍する）
                //バウンスエナジー関連
        bounceEnergy_enabled: false,
        bounceEnergy_count: 0,
        bounceEnergy_damageMultiplier: 0,
        bounceEnergy_speed: 0,
        bounceEnergy_radius: 0,
        availableUpgrades: [
            '攻撃力アップ',
            '射撃速度アップ',
            '範囲ダメージ化',
            '魔導防壁',
            'エナジーウェーブ',
            '射撃ビット',
            '毒沼化',
            'スプレッドショット',
            'アイテム回収範囲増加',
            '射程拡張',
            '拡大弾',
            '連鎖爆裂' // 連鎖爆裂をリストに追加
        ]
    },
    TRACY: {
        hp: 120,
        moveSpeed: 6,
        attack: 120,                       // 近接用に攻撃力をアップ
        attackSpeed: 300,                 // 攻撃速度をアップ (数値を小さく)
        attackRange: 150,                 // 攻撃の半径 (射程)
        attackWays: 1,                    // 近接攻撃では使わないが1にしておく
        isMelee: true,                    // ★近接攻撃フラグを追加
        meleeArc: (120 * Math.PI) / 180,  // ★攻撃の角度(120度)をラジアンで定義
        bulletSpeed: 0,                   // 弾は使わないので0
        consecutiveSlashes: 0,            // 追加の切りつけ回数 (アップグレードで増加)
        consecutiveSlashInterval: 100,    // 切りつけの間隔 (100ms = 0.1秒)
        isSlashing: false,                // 現在、連続切り実行中かどうかのフラグ
        slashCount: 0,                    // 現在の連続切りで何回攻撃したか
        lastSlashTime: 0, // この変数は新しいロジックでは不要になりますが、念のため残しても問題ありません
        comboStartTime: 0, // ★★★ 連続攻撃の開始時間を記録する変数を追加 ★★★
        bits: 0,
        slowField: 0,
        slowFieldFactor: 0, // ★★★ 減速効果の倍率を追加
        collectRange: 150,
        bulletSizeScale: 1,
        explosionRadius: 0,
        areaDamageRadius: 0,
        areaDamageMultiplier: 0,
        pierceCount: 0,
        waveRadius: 0,
        waveDamageMultiplier: 1,
        assaultArmorRadius: 0,
        assaultArmorDamageMultiplier: 1,
        shootingBits: 0,
        shockFieldRadius: 0,
        shockFieldCooldown: 0,
        shockFieldDamageMultiplier: 0,
        poisonSwampRadius: 0,
        poisonSwampDamageMultiplier: 0,
        regenerationInterval: 0,
        shieldHits: 1,
        shieldActive: true,
        lastShield: 0,
        lastRegeneration: 0,
        exp: 0,
        expToNext: 2,
        level: 1,
        isFlashing: false,
        isInvincible: false,
        flashStart: 0,
        lastWave: 0,
        lastShockField: 0,
        currentFrame: 0,
        lastFrameChange: 0,
        animationDirection: 1,
        lastDamageUnitType: null,
        chainExplosionEnabled: false,
        chainExplosionRadius: 0,
        chainExplosionDamageMultiplier: 0.34,
        //水流地帯のステータス
        waterZone_enabled: false,
        waterZone_count: 0,
        waterZone_radius: 0,
        waterZone_cooldown: 0,
        waterZone_duration: 0,
        waterZone_slowFactor: 1.0, // 減速効果なし（速度を1.0倍する）
                //バウンスエナジー関連
        bounceEnergy_enabled: false,
        bounceEnergy_count: 0,
        bounceEnergy_damageMultiplier: 0,
        bounceEnergy_speed: 0,
        bounceEnergy_radius: 0,

        attackSe: 'slash',
        hitSe: '',
        // 近接キャラ用にアップグレードリストを見直し
        availableUpgrades: [
            '攻撃力アップ',
            '攻撃速度アップ',  // attackSpeedを下げる
            '攻撃ビット追加',
            'スローフィールド',
            'アイテム回収範囲増加',
            'スピードブースト',
            'アサルトアーマー',
            'リジェネレーション',
            '攻撃範囲拡張', // attackRangeを広げる新しいアップグレード
            '攻撃角度拡張', // meleeArcを広げる新しいアップグレード
                        '連続切り', // 連続切りのアップグレード
        ]
    },

    // ★★★ 2. URANUSのパラメータをここに追加 ★★★
    URANUS: {
        hp: 100,
        moveSpeed: 3, // 移動力をANNA(4)より低めに設定
        attack: 120,
        attackSpeed: 400,
        attackRange: 300,
        bulletSpeed: 10,
        attackWays: 2,
        bits: 0,
        slowField: 0,
        slowFieldFactor: 0, // ★★★ 減速効果の倍率を追加
        collectRange: 250,
        bulletSizeScale: 1,
        explosionRadius: 0,
        areaDamageRadius: 0,
        areaDamageMultiplier: 0,
        pierceCount: 0,
        waveRadius: 0,
        waveDamageMultiplier: 1,
        assaultArmorRadius: 0,
        assaultArmorDamageMultiplier: 1,
        shootingBits: 0,
        shockFieldRadius: 0,
        shockFieldCooldown: 0,
        shockFieldDamageMultiplier: 0,
        poisonSwampRadius: 0,
        poisonSwampDamageMultiplier: 0,
        regenerationInterval: 0,
        shieldHits: 0,
        shieldActive: false,
        lastShield: 0,
        lastRegeneration: 0,
        exp: 0,
        expToNext: 2,
        level: 1,
        isFlashing: false,
        isInvincible: false,
        flashStart: 0,
        isMelee: false,
        lastWave: 0,
        lastShockField: 0,
        currentFrame: 0,
        lastFrameChange: 0,
        animationDirection: 1,
        attackSe: 'shoot',
        hitSe: 'hit_bullet',
        lastDamageUnitType: null,
        chainExplosionEnabled: false,
        chainExplosionRadius: 0,
        chainExplosionDamageMultiplier: 0.34,
        //水流地帯のステータス
        waterZone_enabled: false,
        waterZone_count: 0,
        waterZone_radius: 0,
        waterZone_cooldown: 0,
        waterZone_duration: 0,
        waterZone_slowFactor: 1.0, // 減速効果なし（速度を1.0倍する）
        //バウンスエナジー関連
        bounceEnergy_enabled: false,
        bounceEnergy_count: 0,
        bounceEnergy_damageMultiplier: 0,
        bounceEnergy_speed: 0,
        bounceEnergy_radius: 0,
        
        // アップグレードリストを設定
        availableUpgrades: [
             '浮遊騎士', // ★★★ ここに追加 ★★★
            '攻撃力アップ',
            '射撃速度アップ',
            '範囲ダメージ化',
            '魔導防壁',
            '水流地帯',
            '射撃ビット',
            '毒沼化',
            'スプレッドショット',
            'アイテム回収範囲増加',
            '射程拡張',
            '拡大弾',
            'バウンスエナジー',
            'ショックフィールド',
        ]
    }
};

function loadCharacter(character) {
    if (!characterParams[character]) {
        console.error(`キャラクター ${character} のパラメータが見つかりません`);
        return;
    }
    Object.assign(playerStats, characterParams[character]);
    playerStats.maxHp = characterParams[character].hp; // Set maxHp to initial hp
    console.log(`キャラクター ${character} をロードしました:`, playerStats);
}

window.upgrades = [
    {
        name: '攻撃力アップ',
        // 従来：固定倍率 → 新：レベル毎に加算されるボーナスが上昇 (20% → 30% → 50%)
        effect: (level) => { // levelは0から始まるインデックス (Lv1→0, Lv2→1, Lv3→2)
            const bonuses = [0.20, 0.30, 0.50];
            playerStats.attack *= (1 + bonuses[level]);
            console.log(`攻撃力アップ Lv.${level + 1}適用。現在の攻撃力: ${playerStats.attack.toFixed(0)}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '射撃速度アップ', // attackSpeedの数値を下げる
        // 従来：固定倍率 → 新：レベル毎に上昇するボーナスで除算
        effect: (level) => {
            const bonuses = [0.20, 0.25, 0.30]; // 20%, 25%, 30%ずつ速くなるイメージ
            playerStats.attackSpeed /= (1 + bonuses[level]);
            console.log(`射撃速度アップ Lv.${level + 1}適用。現在の攻撃速度: ${playerStats.attackSpeed.toFixed(0)}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '攻撃速度アップ', // TRACY用 (射撃速度アップと同じ効果)
        effect: (level) => {
            const bonuses = [0.15, 0.20, 0.25];
            playerStats.attackSpeed /= (1 + bonuses[level]);
            console.log(`攻撃速度アップ Lv.${level + 1}適用。現在の攻撃速度: ${playerStats.attackSpeed.toFixed(0)}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'スプレッドショット',
        // 従来：固定値を設定 → 新：レベル毎に発射数を追加
        effect: (level) => {
            const bonus = 2; // 1レベルごとに2方向追加
            // 初回取得時は基礎値1にボーナスを加算
            if (level === 0 && playerStats.attackWays === 1) {
                 playerStats.attackWays += bonus;
            } else {
                 playerStats.attackWays += bonus;
            }
            console.log(`スプレッドショット Lv.${level + 1}適用。現在の手数: ${playerStats.attackWays}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '魔導防壁',
        // 従来：レベルに応じた固定値を設定 → 新：レベル毎に耐久値を追加
        effect: (level) => {
            const bonuses = [1, 1, 2]; // Lv1で+1, Lv2で+1, Lv3で+2
            if (level === 0) { // 初回取得時
                playerStats.shieldHits = bonuses[level];
            } else {
                playerStats.shieldHits += bonuses[level];
            }
            playerStats.shieldActive = playerStats.shieldHits; // 現在の耐久値を最大値にリセット
            console.log(`魔導防壁 Lv.${level + 1}適用。最大耐久値: ${playerStats.shieldHits}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '毒沼化',
        // 従来：固定値を設定 → 新：初回取得で有効化、以降は効果を累加
        effect: (level) => {
            const damageBonuses = [0.25, 0.3, 0.35]; // ダメージ倍率の加算値
            const radiusBonuses = [40, 15, 25]; // 半径の加算値

            if (level === 0) { // 初回取得時
                playerStats.poisonSwampRadius = (playerStats.poisonSwampRadius || 0) + radiusBonuses[level];
                playerStats.poisonSwampDamageMultiplier = (playerStats.poisonSwampDamageMultiplier || 0) + damageBonuses[level];
            } else {
                playerStats.poisonSwampRadius += radiusBonuses[level];
                playerStats.poisonSwampDamageMultiplier += damageBonuses[level];
            }
            console.log(`毒沼化 Lv.${level + 1}適用。半径: ${playerStats.poisonSwampRadius}, ダメージ倍率: ${playerStats.poisonSwampDamageMultiplier.toFixed(2)}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '浮遊騎士',
        // 従来：固定値を設定 → 新：初回取得で有効化、以降は効果を累加
        effect: (level) => {
            const countBonuses = [1, 1, 1]; // 1レベルごとに1体追加
            const attackBonuses = [0.5, 0.6, 0.7]; // 攻撃力倍率の加算値

            if (level === 0) { // 初回取得時
                playerStats.floatingKnight_maxCount = countBonuses[level];
                playerStats.floatingKnight_attackMultiplier = attackBonuses[level];
            } else {
                playerStats.floatingKnight_maxCount += countBonuses[level];
                playerStats.floatingKnight_attackMultiplier += attackBonuses[level];
            }
            console.log(`浮遊騎士 Lv.${level + 1}適用。最大数: ${playerStats.floatingKnight_maxCount}, 攻撃倍率: ${playerStats.floatingKnight_attackMultiplier.toFixed(2)}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'スピードブースト',
        effect: (level) => {
            const bonuses = [0.10, 0.15, 0.20]; // 10%, 15%, 20%ずつ速度上昇
            playerStats.moveSpeed *= (1 + bonuses[level]);
            console.log(`スピードブースト Lv.${level + 1}適用。現在の移動速度: ${playerStats.moveSpeed.toFixed(2)}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'アイテム回収範囲増加',
        effect: (level) => {
            const bonuses = [0.3, 0.4, 0.6]; // 50%, 60%, 70%ずつ範囲拡大
            playerStats.collectRange *= (1 + bonuses[level]);
            console.log(`アイテム回収範囲増加 Lv.${level + 1}適用。現在の範囲: ${playerStats.collectRange.toFixed(0)}`);
        },
        maxLevel: 3,
        level: 0
    },
     {
        name: 'バウンスエナジー',
        effect: (level) => {
            const countBonuses = [1, 1, 1];               // Lv毎のオーブ数追加量
            const damageBonuses = [0.45, 0.25, 0.3];       // Lv毎のダメージ倍率追加量
            const speedBonuses = [4, 1, 2];                 // Lv毎の速度追加量
            const radiusBonuses = [25, 5, 6];               // Lv毎の半径追加量

            if (level === 0) { // 初回取得時
                playerStats.bounceEnergy_enabled = true;
                playerStats.bounceEnergy_count = countBonuses[level];
                playerStats.bounceEnergy_damageMultiplier = damageBonuses[level];
                playerStats.bounceEnergy_speed = speedBonuses[level];
                playerStats.bounceEnergy_radius = radiusBonuses[level];
            } else { // 2回目以降の取得
                playerStats.bounceEnergy_count += countBonuses[level];
                playerStats.bounceEnergy_damageMultiplier += damageBonuses[level];
                playerStats.bounceEnergy_speed += speedBonuses[level];
                playerStats.bounceEnergy_radius += radiusBonuses[level];
            }
        },
        maxLevel: 3,
        level: 0
    },

     {
        name: '水流地帯',
        effect: (level) => {
            const countBonuses = [1, 1, 1];        // Lv毎の投擲数追加量
            const radiusBonuses = [80, 20, 20];     // Lv毎の範囲追加量
            const cooldownReductions = [8000, -1500, -1500]; // Lv毎のクールダウン（Lv1は初期値、以降は短縮量）
            const durationBonuses = [5000, 1000, 1000]; // Lv毎の効果時間（Lv1は初期値、以降は延長量）
            const slowFactorSettings = [0.6, 0.5, 0.4]; // Lv毎の減速倍率（40%減 -> 50%減 -> 60%減）

            if (level === 0) { // 初回取得時
                playerStats.waterZone_enabled = true;
                playerStats.waterZone_count = countBonuses[level];
                playerStats.waterZone_radius = radiusBonuses[level];
                playerStats.waterZone_cooldown = cooldownReductions[level];
                playerStats.waterZone_duration = durationBonuses[level];
                playerStats.waterZone_slowFactor = slowFactorSettings[level];
            } else { // 2回目以降の取得
                playerStats.waterZone_count += countBonuses[level];
                playerStats.waterZone_radius += radiusBonuses[level];
                playerStats.waterZone_cooldown += cooldownReductions[level];
                playerStats.waterZone_duration += durationBonuses[level];
                playerStats.waterZone_slowFactor = slowFactorSettings[level];
            }
        },
        maxLevel: 3,
        level: 0
    },
    // --- 以下、同様の考え方で他のアップグレードも修正 ---
    { name: '攻撃ビット追加', effect: () => playerStats.bits += 1, maxLevel: 3, level: 0 },
    { name: '射撃ビット', effect: () => playerStats.shootingBits += 1, maxLevel: 3, level: 0 },
    {
        name: 'スローフィールド',
        effect: (level) => {
            const radiusBonuses = [100, 20, 20];     // 半径の追加量
            const slowFactors = [0.4, 0.5, 0.6];    // 減速率 (40% -> 50% -> 60%)

            if (level === 0) { // 初回取得時
                playerStats.slowField = radiusBonuses[level];
            } else {
                playerStats.slowField += radiusBonuses[level];
            }
            playerStats.slowFieldFactor = slowFactors[level]; // レベルに応じて減速率を設定
        },
        maxLevel: 3,
        level: 0
    },
    { name: '射程拡張', effect: (level) => {
        const bonuses = [1.2, 1.3, 1.5];
        playerStats.attackRange *= bonuses[level];
    }, maxLevel: 3, level: 0 },
    { name: '拡大弾', effect: (level) => {
        const bonuses = [0.5, 0.75, 1.0];
        playerStats.bulletSizeScale += bonuses[level];
    }, maxLevel: 3, level: 0 },
   {
        name: '範囲ダメージ化',
        effect: (level) => {
            const radiusBonuses = [40, 20, 20];      // 半径の追加量
            const multiplierBonuses = [0.25, 0.15, 0.1]; // 爆風ダメージ倍率の追加量 (Lv1:25%, Lv2:+15%, Lv3:+10%)

            if (level === 0) { // 初回取得時
                playerStats.areaDamageRadius = (playerStats.areaDamageRadius || 0) + radiusBonuses[level];
                playerStats.areaDamageMultiplier = (playerStats.areaDamageMultiplier || 0) + multiplierBonuses[level];
            } else {
                playerStats.areaDamageRadius += radiusBonuses[level];
                playerStats.areaDamageMultiplier += multiplierBonuses[level];
            }
            console.log(`範囲ダメージ化 Lv.${level + 1}適用。半径: ${playerStats.areaDamageRadius}, 爆風ダメージ倍率: ${playerStats.areaDamageMultiplier.toFixed(2)}`);
        },
        maxLevel: 3,
        level: 0
    },
    { name: '貫通弾', effect: (level) => {
        if (level === 0) playerStats.pierceCount = 3;
        else if (level === 1) playerStats.pierceCount += 3; // 合計6
        else if (level === 2) playerStats.pierceCount = Infinity; // Lv3で無限貫通
    }, maxLevel: 3, level: 0 },
    { name: 'エナジーウェーブ', effect: (level) => {
        const radiusBonuses = [100, 75, 50];
        const damageBonuses = [0, 0.5, 0.5];
        if (level === 0) playerStats.waveRadius = radiusBonuses[level];
        else playerStats.waveRadius += radiusBonuses[level];
        playerStats.waveDamageMultiplier += damageBonuses[level];
    }, maxLevel: 3, level: 0 },
    { name: 'アサルトアーマー', effect: (level) => {
        const radiusBonuses = [200, 100, 50];
        const damageBonuses = [0, 1.0, 1.0];
        if (level === 0) playerStats.assaultArmorRadius = radiusBonuses[level];
        else playerStats.assaultArmorRadius += radiusBonuses[level];
        playerStats.assaultArmorDamageMultiplier += damageBonuses[level];
    }, maxLevel: 3, level: 0 },
    { name: 'ショックフィールド', effect: (level) => {
        if (level === 0) {
            playerStats.shockFieldRadius = 100;
            playerStats.shockFieldCooldown = 6000;
        } else if (level === 1) {
            playerStats.shockFieldDamageMultiplier += 0.5;
        } else if (level === 2) {
            playerStats.shockFieldCooldown -= 2000;
        }
    }, maxLevel: 3, level: 0 },
    { name: '連鎖爆裂', effect: (level) => { 
        playerStats.chainExplosionEnabled = true;
        const radiusBonuses = [60, 20, 30];
        const damageBonuses = [0.2, 0.3, 0.4];
        if (level === 0) {
            playerStats.chainExplosionRadius = radiusBonuses[level];
            playerStats.chainExplosionDamageMultiplier = damageBonuses[level];
        } else {
            playerStats.chainExplosionRadius += radiusBonuses[level];
            playerStats.chainExplosionDamageMultiplier += damageBonuses[level];
        }
    }, maxLevel: 3, level: 0 },
    { name: 'リジェネレーション', effect: (level) => {
        const intervalReduction = [0, 1000, 1000];
        if (level === 0) playerStats.regenerationInterval = 3000;
        else playerStats.regenerationInterval -= intervalReduction[level];
    }, maxLevel: 3, level: 0 },
    { name: '攻撃範囲拡張', effect: (level) => {
        const bonuses = [1.15, 1.15, 1.2];
        playerStats.attackRange *= bonuses[level];
    }, maxLevel: 3, level: 0 },
    { name: '攻撃角度拡張', effect: (level) => {
        const bonuses = [1.1, 1.1, 1.2];
        playerStats.meleeArc *= bonuses[level];
    }, maxLevel: 3, level: 0 },
    { name: '連続切り', effect: () => {
        playerStats.consecutiveSlashes += 1;
        playerStats.attackSe = 'slash2'; 
    }, maxLevel: 3, level: 0 }
];

let levelUpChoices = [];

const expRequirements = [2, 4, 8, 16, 32, 64, 96, 128, 128, 128];

function levelUp() {
    const config = getStageConfig(currentStage);
    const levelCap = config.levelCap || 25;

    // 先にレベルを上げておく
    playerStats.level++;
    playerStats.exp = 0;
    playerStats.expToNext = expRequirements[Math.min(playerStats.level - 1, expRequirements.length - 1)];

    // 強化限界レベルに達しているかチェック
    if (playerStats.level > levelCap) { // ★等号を外し、上限を超えた次のレベルからボーナス
        console.log(`強化限界レベル ${levelCap} に到達。ボーナスを獲得。`);
        playerStats.hp = min(playerStats.hp + 30, playerStats.maxHp);
        score += 10000;
        return; // アップグレード画面に移行せず終了
    }

    // --- 限界に達していない場合は、従来のアップグレード処理 ---
    gameState = 'levelUp';
    levelUpChoices = [];
    levelUpHoverIndex = 0; // ホバーを先頭にリセット
    
    // 選択可能なアップグレードのリストを作成
    let availableUpgrades = window.upgrades.filter(u => 
        u.level < u.maxLevel &&
        characterParams[selectedCharacter]?.availableUpgrades.includes(u.name)
    );

    // 選択肢をランダムに3つ選ぶ
    for (let i = 0; i < 3; i++) {
        if (availableUpgrades.length === 0) break;
        let choiceIndex = Math.floor(Math.random() * availableUpgrades.length);
        levelUpChoices.push(availableUpgrades[choiceIndex]);
        // 一度選んだものは候補から除く
        availableUpgrades.splice(choiceIndex, 1);
    }

    if (debugMode) console.log(`レベルアップ: レベル ${playerStats.level}, 選択肢: ${levelUpChoices.map(c => c.name)}`);
}
function applyUpgrade(upgrade) {
    if (!upgrade) return;

    // effect関数を呼び出す前にレベルを上げる
    upgrade.level++;
    
    console.log(`アップグレード選択: ${upgrade.name}, 新しいレベル: ${upgrade.level}`);

    // effect関数を呼び出し、引数として (新しいレベル - 1) を渡す
    if (typeof upgrade.effect === 'function') {
        // levelは1から始まるので、配列のインデックスとして使うには-1する
        upgrade.effect(upgrade.level - 1);
    }

    setGameState('playing');
    levelUpChoices = [];
    levelUpHoverIndex = -1;
}