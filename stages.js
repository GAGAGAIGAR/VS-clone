let lastBossLevels = { Z: -1, Y: -1, X: -1 };
let lastSpawn = 0;
let pacing = 'slow';
let spawnMode = 'sparse';

const stageConfigs = [
    {
        stage: 1,
        duration: 300,
        enemyTypes: (level) => level >= 10 ? ['A', 'B', 'C', 'D'] : level >= 7 ? ['A', 'B', 'C'] : level >= 4 ? ['A', 'B'] : ['A'],
        spawnInterval: { fast: 2250, slow: 4500 },
        sparseCount: (level) => 2 + floor(level / 6),
        denseCount: (level) => 9 + floor(level / 3),
        bossSpawns: [
            { level: 1, type: 'Z' },
            { level: 10, type: 'Y' },
            { level: 20, type: 'X', interval: 10 }
        ],
        rushTypeCorrections: { A: 5, B: 3, C: 2, D: 1, Z: 0 },
        rushSpawnCount: (level, enemyType) => 20 + level + getRushTypeCorrection(enemyType)
    }
];

function getRushTypeCorrection(enemyType) {
    const config = getStageConfig(currentStage);
    return config.rushTypeCorrections[enemyType] || 0;
}

function getStageConfig(stage) {
    const config = stageConfigs.find(s => s.stage === stage);
    return config || stageConfigs[0];
}

function resetStageState() {
    lastBossLevels = { Z: -1, Y: -1, X: -1 };
    lastSpawn = 0;
    pacing = 'slow';
    spawnMode = 'sparse';
    console.log('ステージ状態をリセットしました');
}

function updateStageLogic(stage) {
    const config = getStageConfig(stage);
    pacingTimer += deltaTime / 1000;
    if (pacingTimer >= 60) pacingTimer = 0;
    pacing = pacingTimer < 10 ? 'fast' : 'slow';
    const spawnInterval = pacing === 'fast' ? config.spawnInterval.fast : config.spawnInterval.slow;
    if (millis() - lastSpawn > spawnInterval) {
        spawnMode = random() < 0.5 ? 'dense' : 'sparse';
        const count = floor(spawnMode === 'dense' ? config.denseCount(playerStats.level) : config.sparseCount(playerStats.level));
        const enemyType = random(config.enemyTypes(playerStats.level));
        spawnEnemies(max(1, count), enemyType);
        console.log(`Spawn ${count} ${enemyType} (mode: ${spawnMode}, level: ${playerStats.level})`);
        lastSpawn = millis();
    }
    for (const boss of config.bossSpawns) {
        const level = playerStats.level;
        if (boss.interval) {
            if (level >= boss.level && (level - boss.level) % boss.interval === 0 && level > lastBossLevels[boss.type]) {
                const bossType = enemyTypes[boss.type] ? boss.type : 'Z';
                spawnEnemies(1, bossType);
                lastBossLevels[boss.type] = level;
                console.log(`Boss ${bossType} spawned at level ${level}`);
                if (bossType !== boss.type) {
                    console.log(`Warning: Boss ${boss.type} not in enemyTypes, used Z`);
                }
            }
        } else {
            if (level === boss.level && level > lastBossLevels[boss.type]) {
                const bossType = enemyTypes[boss.type] ? boss.type : 'Z';
                spawnEnemies(1, bossType);
                lastBossLevels[boss.type] = level;
                console.log(`Boss ${bossType} spawned at level ${level}`);
                if (bossType !== boss.type) {
                    console.log(`Warning: Boss ${boss.type} not in enemyTypes, used Z`);
                }
            }
        }
    }
    if (rushEnemiesKilled >= rushThreshold && enemiesKilled > lastRushKills) {
        const maxRushCount = config.enemyTypes(playerStats.level).length;
        const selectedRushCount = floor(random(1, maxRushCount + 1));
        const rushType = String.fromCharCode(64 + selectedRushCount);
        const spawnCount = config.rushSpawnCount(playerStats.level, rushType);
        spawnEnemies(spawnCount, rushType);
        rushCount++;
        lastRushKills = enemiesKilled;
        lastRushSpawnCount = spawnCount;
        rushEffectTime = millis();
        rushEnemiesKilled = 0;
        rushThreshold = 25 + enemies.length;
        console.log(`Rush spawned ${spawnCount} ${rushType} at level ${playerStats.level}`);
    }
}