const characterParams = {
    ANNA: {
        hp: 100,
        moveSpeed: 5,
        attack: 120,
        attackSpeed: 400,
        attackRange: 1200,
        bulletSpeed: 10,
        attackWays: 1,
        bits: 0,
        slowField: 0,
        collectRange: 150,
        bulletSizeScale: 1,
        explosionRadius: 0,
        areaDamageRadius: 0,
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
        availableUpgrades: [
            '攻撃力アップ',
            '射撃速度アップ',
            '範囲ダメージ化',
            'シールドバリア',
            'エナジーウェーブ',
            '射撃ビット',
            '毒沼化',
            '射撃多方向化',
            'アイテム回収範囲増加',
            '射程拡張',
            '拡大弾'
        ]
    },
    TRACY: {
        hp: 120,
        moveSpeed: 6,
        attack: 8,
        attackSpeed: 500,
        attackRange: 800,
        bulletSpeed: 8,
        attackWays: 1,
        bits: 0,
        slowField: 0,
        collectRange: 100,
        bulletSizeScale: 1,
        explosionRadius: 0,
        areaDamageRadius: 0,
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
        isMelee: false,
        lastWave: 0,
        lastShockField: 0,
        currentFrame: 0,
        lastFrameChange: 0,
        animationDirection: 1,
        availableUpgrades: [
            '攻撃力アップ',
            '射撃速度アップ',
            '攻撃ビット追加',
            'スローフィールド',
            'アイテム回収範囲増加',
            '拡大弾',
            'スピードブースト',
            'アサルトアーマー',
            '射撃多方向化',
            'リジェネレーション'
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
    { name: '攻撃力アップ', effect: () => playerStats.attack *= 1.2, maxLevel: 3, level: 0 },
    { name: '射撃速度アップ', effect: () => playerStats.attackSpeed *= 0.8, maxLevel: 3, level: 0 },
    { name: '射撃多方向化', effect: (level) => {
        playerStats.attackWays = [3, 5, 7][level];
        if (debugMode) console.log(`多方向射撃を${playerStats.attackWays}方向にアップグレード`);
    }, maxLevel: 3, level: 0 },
    { name: '攻撃ビット追加', effect: () => playerStats.bits += 1, maxLevel: 3, level: 0 },
    { name: 'スローフィールド', effect: () => playerStats.slowField += 50, maxLevel: 3, level: 0 },
    { name: 'アイテム回収範囲増加', effect: () => playerStats.collectRange *= 1.5, maxLevel: 3, level: 0 },
    { name: '射程拡張', effect: () => playerStats.attackRange *= 1.5, maxLevel: 3, level: 0 },
    { name: '弾速アップ', effect: () => playerStats.bulletSpeed *= 1.2, maxLevel: 3, level: 0 },
    { name: '拡大弾', effect: (level) => {
        playerStats.bulletSizeScale = [1.5, 2.0, 2.5][level];
        if (debugMode) console.log(`弾サイズを${playerStats.bulletSizeScale}倍に設定`);
    }, maxLevel: 3, level: 0 },
    { name: '誘爆ダメージ', effect: () => {
        playerStats.explosionRadius += 60;
        if (debugMode) console.log(`爆発範囲を${playerStats.explosionRadius}に設定`);
    }, maxLevel: 3, level: 0 },
    { name: '範囲ダメージ化', effect: () => {
        playerStats.areaDamageRadius += 50;
        if (debugMode) console.log(`範囲ダメージ半径を${playerStats.areaDamageRadius}に設定`);
    }, maxLevel: 3, level: 0 },
    { name: '貫通弾', effect: (level) => {
        playerStats.pierceCount = [3, 6, Infinity][level];
    }, maxLevel: 3, level: 0 },
    { name: 'スピードブースト', effect: (level) => {
        playerStats.moveSpeed *= [1.1, 1.3, 1.5][level];
    }, maxLevel: 3, level: 0 },
    {
        name: 'シールドバリア',
        effect: (level) => {
            playerStats.shieldHits = [1, 2, 3][level];
            playerStats.shieldActive = playerStats.shieldHits;
            playerStats.lastShield = 0;
            if (debugMode) console.log(`シールドをアップグレード、レベル: ${level + 1}, 耐久: ${playerStats.shieldHits}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'エナジーウェーブ',
        effect: (level) => {
            if (level === 0) playerStats.waveRadius = 100;
            else if (level === 1) playerStats.waveRadius = 175;
            else if (level === 2) playerStats.waveDamageMultiplier = 1.5;
            if (debugMode) console.log(`ウェーブをアップグレード、半径: ${playerStats.waveRadius}, 倍率: ${playerStats.waveDamageMultiplier}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'アサルトアーマー',
        effect: (level) => {
            if (level === 0) playerStats.assaultArmorRadius = 200;
            else if (level === 1) playerStats.assaultArmorRadius = 300;
            else if (level === 2) playerStats.assaultArmorDamageMultiplier = 2.0;
            if (debugMode) console.log(`アサルトアーマーをアップグレード、半径: ${playerStats.assaultArmorRadius}, 倍率: ${playerStats.assaultArmorDamageMultiplier}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '射撃ビット',
        effect: () => {
            playerStats.shootingBits += 1;
            if (debugMode) console.log(`射撃ビットを追加: ${playerStats.shootingBits}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'ショックフィールド',
        effect: (level) => {
            if (level === 0) {
                playerStats.shockFieldRadius = 100;
                playerStats.shockFieldCooldown = 6000;
            } else if (level === 1) {
                playerStats.shockFieldDamageMultiplier = 0.5;
            } else if (level === 2) {
                playerStats.shockFieldCooldown = 4000;
            }
            if (debugMode) console.log(`ショックフィールドをアップグレード、半径: ${playerStats.shockFieldRadius}, ダメージ: ${playerStats.shockFieldDamageMultiplier}, クールダウン: ${playerStats.shockFieldCooldown}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: '毒沼化',
        effect: (level) => {
            if (level === 0) {
                playerStats.poisonSwampRadius = 75;
                playerStats.poisonSwampDamageMultiplier = 0.25;
            } else if (level === 1) {
                playerStats.poisonSwampDamageMultiplier = 0.5;
            } else if (level === 2) {
                playerStats.poisonSwampRadius = 125;
            }
            if (debugMode) console.log(`毒沼をアップグレード、半径: ${playerStats.poisonSwampRadius}, ダメージ: ${playerStats.poisonSwampDamageMultiplier}`);
        },
        maxLevel: 3,
        level: 0
    },
    {
        name: 'リジェネレーション',
        effect: (level) => {
            playerStats.regenerationInterval = [3000, 2000, 1000][level];
            playerStats.lastRegeneration = millis();
            if (debugMode) console.log(`リジェネレーションをアップグレード、間隔: ${playerStats.regenerationInterval}ms`);
        },
        maxLevel: 3,
        level: 0
    }
];

let levelUpChoices = [];

const expRequirements = [2, 4, 8, 16, 32, 64, 96, 128, 160, 256];

function levelUp() {
    playerStats.level++;
    playerStats.exp = 0;
    playerStats.expToNext = expRequirements[Math.min(playerStats.level - 1, expRequirements.length - 1)];
    gameState = 'levelUp';
    levelUpChoices = [];
    let availableUpgrades = window.upgrades.filter(u => u.level < u.maxLevel);
    if (selectedCharacter && characterParams[selectedCharacter]) {
        availableUpgrades = availableUpgrades.filter(u => characterParams[selectedCharacter].availableUpgrades.includes(u.name));
    }
    for (let i = 0; i < Math.min(3, availableUpgrades.length); i++) {
        let choice;
        do {
            choice = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
        } while (levelUpChoices.includes(choice));
        levelUpChoices.push(choice);
    }
    if (debugMode) console.log(`レベルアップ: レベル ${playerStats.level}, キャラクター: ${selectedCharacter}, 選択肢: ${levelUpChoices.map(c => c.name)}`);
}