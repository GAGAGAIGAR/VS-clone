const stageConfigs = [
  {
    stage: 1,
    duration: 180,
    mapSize: { width: 2000, height: 2000 },
    unitTypes: (level) => level >= 10 ? ['A', 'B', 'C', 'D'] : level >= 7 ? ['A', 'B', 'C'] : level >= 4 ? ['A', 'B'] : ['A'],
    spawnInterval: { fast: 2250, slow: 4500 },
    sparseCount: (level) => 2 + floor(level / 6),
    denseCount: (level) => 9 + floor(level / 3),
    bossSpawns: [
      { level: 6, type: 'Z', pattern: 'fixedPoint' },
      { level: 10, type: 'Y', pattern: 'fixedPoint' },
      { level: 20, type: 'X', interval: 10, pattern: 'fixedPoint' }
    ],
    rushTypeCorrections: { A: 5, B: 3, C: 2, D: 1, Z: 0 },
    rushSpawnCount: (level, unitType) => 20 + level + getRushTypeCorrection(unitType),
    specialReinforcements: [
      { level: 4, type: 'C', count: 5, pattern: 'edgeRush' },
      { level: 10, type: 'D', count: 10, pattern: 'cornerCluster' },
      { level: 8, type: 'C', count: 24, pattern: 'spiralWave' }
    ],
        clearConditions: {
        mode: 'ANY', // 'ANY' (いずれか) または 'ALL' (全て)
        conditions: [
            { type: 'killBoss', value: 'Z' }, // ボス 'Z' の撃破
            // { type: 'surviveTime', value: 150 }, // 150秒生存 (durationとは別に設定可能)
            // 他の条件タイプも将来的に追加可能 (例: アイテム収集、特定地点への到達など)
        ]
    },
    timeLimitFailure: { // タイムオーバー時の専用設定 (オプション)
        lastDamageUnitType: 'TIME_EXPIRED_STAGE1' // ゲームオーバーシナリオ用
    },
        scenarioTriggers: [
      {
        conditionType: 'reinforcementSpawned', // 条件タイプ
        reinforcementDetails: { type: 'C', level: 4, pattern: 'edgeRush' }, // 条件詳細 (例: 特定の増援が出現した時)
        scenarioTriggerId: 'REINFORCEMENT_C_LV4', // scenario.json の trigger と対応
        once: true // このトリガーは一度だけ発生するかどうか
      },
      {
        conditionType: 'bossAppeared', // ボス出現時
        bossType: 'Z',
        scenarioTriggerId: 'BOSS_Z_APPEAR',
        once: true
      },
      {
        conditionType: 'bossDefeated', // ボス撃破時
        bossType: 'Z',
        scenarioTriggerId: 'BOSS_Z_DEFEATED',
        once: true
      },
      
    ],
   manualExitRequiredForClear: true, // trueならGキー必須, falseなら条件達成で自動的にクリアシーケンスへ
  },
  {
    stage: 'fr',
    duration: 300,
    mapSize: { width: 3000, height: 500 },
    unitTypes: (level) => level >= 12 ? ['A', 'B', 'C', 'D'] : level >= 8 ? ['A', 'B', 'C'] : level >= 5 ? ['A', 'B'] : ['A'],
    spawnInterval: { fast: 2000, slow: 4000 },
    sparseCount: (level) => 3 + floor(level / 5),
    denseCount: (level) => 12 + floor(level / 2),
    bossSpawns: [
      { level: 8, type: 'Z', pattern: 'fixedPoint' },
      { level: 12, type: 'Y', pattern: 'fixedPoint' },
      { level: 18, type: 'X', interval: 8, pattern: 'fixedPoint' }
    ],
    rushTypeCorrections: { A: 6, B: 4, C: 3, D: 2, Z: 0 },
    rushSpawnCount: (level, unitType) => 25 + level + getRushTypeCorrection(unitType),
    specialReinforcements: [
      { level: 5, type: 'C', count: 8, pattern: 'edgeRush' },
      { level: 10, type: 'D', count: 15, pattern: 'edgeRush' },
      { level: 15, type: 'B', count: 20, pattern: 'spiralWave' }
    ],
    clearConditions: {
        mode: 'ANY',
        conditions: [
            { type: 'killBoss', value: 'X' }
            // { type: 'surviveTime', value: 280 } // 例：ほぼ最後まで生き残ればクリア
        ]
    },
    timeLimitFailure: {
        lastDamageUnitType: 'FRONTLINE_TIMEOUT'
    } ,scenarioTriggers: [
        {
            conditionType: 'rushOccurred', // ラッシュ発生時など
            rushNumber: 1, // 何回目のラッシュか
            scenarioTriggerId: 'FRONTLINE_RUSH_1',
            once: true
        },
        {
            conditionType: 'bossAppeared',
            bossType: 'Z',
            scenarioTriggerId: 'BOSS_Z_APPEAR_FR',
            once: true
        },
      { // クリア条件達成時に再生される「中間」シナリオ（Gキー離脱を促すなど）
        conditionType: 'clearConditionsMet', // game.js の checkStageClearConditions で justTriggeredEventId = 'STAGE_CLEAR_CONDITIONS_MET' が発行される
        scenarioTriggerId: 'STAGE_OBJECTIVES_COMPLETE_MESSAGE', // scenario.json の middleX.trigger と対応
        once: true // 通常、この通知は一度だけ
      }
    ],
       manualExitRequiredForClear: true
  }
];

let lastBossLevels = { Z: -1, Y: -1, X: -1 };
let lastSpawn = 0;
let pacing = 'slow';
let spawnMode = 'sparse';
let lastReinforcement = 0;
const reinforcementCooldown = 3000;
// Track triggered reinforcements to prevent duplicates
let triggeredReinforcements = new Set();

function getRushTypeCorrection(unitType) {
    const config = getStageConfig(currentStage);
    return config.rushTypeCorrections[unitType] || 0;
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
    triggeredReinforcements.clear();
    console.log('ステージ状態をリセットしました');
}

function updateStageLogic(stage) {
  const config = getStageConfig(stage);
  pacingTimer += deltaTime / 1000;
  if (pacingTimer >= 60) pacingTimer = 0;
  pacing = pacingTimer < 10 ? 'fast' : 'slow';
  const spawnInterval = pacing === 'fast' ? config.spawnInterval.fast : config.spawnInterval.slow;

  // 特殊増援の処理
 for (const reinforcement of config.specialReinforcements || []) {
    const reinforcementKey = `${reinforcement.level}-${reinforcement.pattern}-${reinforcement.type}`;
    if (millis() - lastReinforcement >= reinforcementCooldown &&
        ((reinforcement.level && playerStats.level === reinforcement.level) ||
         (reinforcement.time && floor(gameTime) === reinforcement.time)) &&
        !triggeredReinforcements.has(reinforcementKey)) {
      
      spawnUnits(reinforcement.count, reinforcement.type, reinforcement.pattern);
      console.log(`Special reinforcement: ${reinforcement.count} ${reinforcement.type}, pattern=${reinforcement.pattern}`);
      triggeredReinforcements.add(reinforcementKey);
      lastReinforcement = millis();
      lastSpawn = millis();

      // 対応するシナリオトリガーを探してイベントIDをセット
      const trigger = config.scenarioTriggers?.find(t => 
        // conditionType が 'reinforcementSpawned' または汎用的な 'eventOccurred' で、
        // reinforcementDetails (または details) が現在の増援と一致するか、
        // あるいは reinforcement オブジェクトに scenarioTriggerId を持たせて直接比較する。
        // ここでは scenarioTriggerId を直接比較する例（こちらがシンプル）
        t.scenarioTriggerId === `REINFORCEMENT_${reinforcement.type}_LV${reinforcement.level}` // 仮の命名規則
        // または、reinforcement オブジェクトに scenarioTriggerId を持たせておく:
        // t.scenarioTriggerId === reinforcement.scenarioTriggerIdToFire 
      );
      if (trigger && trigger.scenarioTriggerId) { // scenarioTriggerId を eventId として扱う場合
        justTriggeredEventId = trigger.scenarioTriggerId;
        console.log(`[STAGE LOG] Event ID set for reinforcement: ${justTriggeredEventId}`);
      }
    }
  }

  // 通常スポーン
  const activeUnits = units.filter(u => u && !unitsToRemove.has(units.indexOf(u))).length;
  if ((activeUnits <= 3 || millis() - lastSpawn > spawnInterval) && millis() - lastReinforcement >= reinforcementCooldown) {
    spawnMode = random() < 0.5 ? 'dense' : 'sparse';
    const count = floor(spawnMode === 'dense' ? config.denseCount(playerStats.level) : config.sparseCount(playerStats.level));
    const unitType = random(config.unitTypes(playerStats.level));
    const pattern = stage === 'fr' ? 'edgeRush' : 'round01'; // フロントラインではedgeRushを使用
    spawnUnits(max(1, count), unitType, pattern);
    console.log(`Spawn ${count} ${unitType} (mode: ${spawnMode}, level: ${playerStats.level}, activeUnits: ${activeUnits}, pattern: ${pattern}`);
    lastSpawn = millis();
  }

  // ボススポーン
  for (const boss of config.bossSpawns) {
    const level = playerStats.level;
    let bossSpawnedThisFrame = false;
    if (boss.interval) {
      if (level >= boss.level && (level - boss.level) % boss.interval === 0 && level > lastBossLevels[boss.type]) {
        bossSpawnedThisFrame = true;
      }
    } else {
      if (level === boss.level && level > lastBossLevels[boss.type]) {
        bossSpawnedThisFrame = true;
      }
    }
    if (bossSpawnedThisFrame) {
        const bossType = unitTypes[boss.type] ? boss.type : 'Z'; // units.js の unitTypes
        spawnUnits(1, bossType, boss.pattern || 'fixedPoint');
        lastBossLevels[boss.type] = level;
        console.log(`Boss ${bossType} spawned at level ${level}, pattern=${boss.pattern}`);
        // justSpawnedBossType は spawnUnits 内で設定されることを期待 (またはここで設定)
        // justSpawnedBossType = bossType; 
    }
  }


  // ラッシュ処理
  if (rushEnemiesKilled >= rushThreshold && enemiesKilled > lastRushKills) {
    const maxRushCount = config.unitTypes(playerStats.level).length;
    const selectedRushCount = floor(random(1, maxRushCount + 1));
    const rushType = String.fromCharCode(64 + selectedRushCount);
    const spawnCount = config.rushSpawnCount(playerStats.level, rushType);
    const pattern = stage === 'fr' ? 'edgeRush' : 'round01'; // フロントラインではedgeRushを使用
    spawnUnits(spawnCount, rushType, pattern);
    rushCount++;
    lastRushKills = enemiesKilled;
    lastRushSpawnCount = spawnCount;
    rushEffectTime = millis();
    rushEnemiesKilled = 0;
    rushThreshold = 15 + units.length;
    lastReinforcement = millis();
    console.log(`Rush spawned ${spawnCount} ${rushType} at level ${playerStats.level}, pattern=${pattern}`);
     const rushTrigger = config.scenarioTriggers?.find(t => 
        t.conditionType === 'rushOccurred' && 
        t.rushNumber === rushCount // rushCount は現在のラッシュ回数を追跡する変数と仮定
    );
    if (rushTrigger && rushTrigger.scenarioTriggerId) {
        justTriggeredEventId = rushTrigger.scenarioTriggerId;
        console.log(`[STAGE LOG] Event ID set for rush: ${justTriggeredEventId}`);
    }
  }
}