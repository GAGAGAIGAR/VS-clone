const stageConfigs = [
  {
    stage: 1,
    backgroundKey: 'st1',
    terrain: [
  {
    "shape": "circle",
    "type": 1,
    "x": 151.41955835962145,
    "y": 157.53155680224404,
    "r": 66.39228421898777
  }
],
    bgmId: 3,
    duration: 180,
    levelCap: 25,
    maxPlayerLevel: 60,
    mapSize: { width: 3000, height: 2000 },
    unitTypes: (level) => level >= 10 ? ['A', 'B', 'C', 'D'] : level >= 7 ? ['A', 'B', 'C'] : level >= 4 ? ['A', 'B'] : ['A'],
    spawnInterval: { fast: 2250, slow: 4500 },
    sparseCount: (level) => 2 + floor(level / 8),
    denseCount: (level) => 7 + floor(level / 4),
    bossSpawns: [
      { level: 6, type: 'Z', pattern: 'fixedPoint', cutin: 'random:renate01:flashend'  },
      { level: 10, type: 'Z', pattern: 'fixedPoint' },
      { level: 20, type: 'Z', interval: 10, pattern: 'fixedPoint' }
    ],
    rushSpawnCount: (level) => 20 + level,
    initialRushThreshold: 30, // ★ ラッシュの初期しきい値
    reinforcementCooldown: 5000, // ★ 通常増援のクールダウン(ms)
    specialReinforcements: [
      { level: 4, type: 'C', count: 5, pattern: 'edgeRush' },
      { level: 10, type: 'D', count: 10, pattern: 'cornerCluster' },
      { level: 8, type: 'C', count: 24, pattern: 'spiralWave' }
    ],
    clearConditions: {
        mode: 'ANY',
        conditions: [
            { type: 'killBoss', value: 'Z' },
        ]
    },
    timeLimitFailure: {
        lastDamageUnitType: 'TIME_EXPIRED_STAGE1'
    },
    scenarioTriggers: [
      // 増援時のイベント
      {
        conditionType: 'reinforcementSpawned',
        reinforcementDetails: { type: 'C', level: 4, pattern: 'edgeRush' },
        scenarioTriggerId: 'REINFORCEMENT_C_LV4', // 再生したいシナリオのID
        cutin: 'random:renate01:flashend',     // ★ 表示したいカットインのコマンド
        once: true
      },
      // ボス登場時のイベント
      {
        conditionType: 'bossAppeared',
        bossType: 'Z',
        scenarioTriggerId: 'BOSS_Z_APPEAR',
        cutin: 'lu:renate01:fade',             // ★ 左上に表示するカットイン 
         changeBGM: { "id": 9, "loop": true },    // ★ シナリオ後に再生するBGM
        once: true
      },
      // 特定時間経過時のイベント
      {
        conditionType: 'timeReached',
        timeValue: 1, // ゲーム内時間120秒で発生
        // このイベントはシナリオは再生せず、カットインのみ表示する例
        scenarioTriggerId: null, 
        cutin: 'rd:renate01:flashend',     // ★ 右下に表示するカットイン
        once: true
      } ,
      // 特定時間経過時のイベント
      {
        conditionType: 'timeReached',
        timeValue: 2, // ゲーム内時間120秒で発生
        // このイベントはシナリオは再生せず、カットインのみ表示する例
        scenarioTriggerId: null, 
        cutin: 'ru:renate01:flashend',     // ★ 右下に表示するカットイン
        once: true
      },
      // 特定時間経過時のイベント
      {
        conditionType: 'timeReached',
        timeValue: 3, // ゲーム内時間120秒で発生
        // このイベントはシナリオは再生せず、カットインのみ表示する例
        scenarioTriggerId: null, 
        cutin: 'lu:renate01:flashend',     // ★ 右下に表示するカットイン

        once: true
      },
      // 特定時間経過時のイベント
      {
        conditionType: 'timeReached',
        timeValue: 4, // ゲーム内時間120秒で発生
        // このイベントはシナリオは再生せず、カットインのみ表示する例
        scenarioTriggerId: null, 
        cutin: 'ld:renate01:flashend',     // ★ 右下に表示するカットイン
        once: true
      }
    ],
   manualExitRequiredForClear: true,
  },
  {
    stage: 2,
    backgroundKey: 'st2',
    bgmId: 3,
    duration: 180,
    levelCap: 25,
    maxPlayerLevel: 60,

    mapSize: { width: 3000, height: 2000 },
terrain: [
  {
    "shape": "triangle",
    "type": 1,
    "rotation": 0,
    "x1": 1263.0965496048664,
    "y1": 941.7328822071215,
    "x2": 1407.4498619077056,
    "y2": 941.7328822071215,
    "x3": 1407.4498619077056,
    "y3": 1262.854901842466
  },
  {
    "shape": "rect",
    "type": 1,
    "rotation": 0,
    "x": 1548.7747830433523,
    "y": 988.1844951103474,
    "w": 22.208201892744455,
    "h": 28.274894810659134
  },
  {
    "shape": "rect",
    "type": 1,
    "rotation": 0,
    "x": 1611.5457413249212,
    "y": 908.6115007012622,
    "w": 280.6309148264984,
    "h": 147.4333800841514
  }
],
    unitTypes: (level) => level >= 10 ? ['E', 'F', 'G', 'H'] : level >= 7 ? ['E', 'F', 'G'] : level >= 4 ? ['E', 'F'] : ['F'],
    spawnInterval: { fast: 2250, slow: 4500 },
    sparseCount: (level) => 2 + floor(level / 6),
    denseCount: (level) => 9 + floor(level / 3),
    bossSpawns: [
      { level: 6, type: 'Y', pattern: 'fixedPoint' },
      { level: 10, type: 'Y', pattern: 'fixedPoint' },
      { level: 20, type: 'Y', interval: 10, pattern: 'fixedPoint' }
    ],
    rushSpawnCount: (level) => 20 + level,
    initialRushThreshold: 25, // ★ ラッシュの初期しきい値
    reinforcementCooldown: 4000, // ★ 通常増援のクールダウン(ms)
    specialReinforcements: [
      { level: 4, type: 'F', count: 5, pattern: 'edgeRush' },
      { level: 10, type: 'H', count: 10, pattern: 'cornerCluster' },
      { level: 8, type: 'H', count: 24, pattern: 'spiralWave' }
    ],
    clearConditions: {
        mode: 'ANY',
        conditions: [
            { type: 'killBoss', value: 'Y' },
        ]
    },
    timeLimitFailure: {
        lastDamageUnitType: 'TIME_EXPIRED_STAGE1'
    },
    scenarioTriggers: [
      {
        conditionType: 'reinforcementSpawned',
        reinforcementDetails: { type: 'F', level: 4, pattern: 'edgeRush' },
        scenarioTriggerId:null, // 再生したいシナリオのID
        selectedCharacter:'ANNA',//プレイヤーキャラがアンナの時のみ
                cutin: 'lu:renate01:flashend', 
        speech:"アンナ:固いだけね。動きは鈍い",
        once: true
      },
            {
        conditionType: 'reinforcementSpawned',
        reinforcementDetails: { type: 'F', level: 4, pattern: 'edgeRush' },
        scenarioTriggerId:null, // 再生したいシナリオのID
        selectedCharacter:'TRACY',//プレイヤーキャラがトレーシーの時のみ
                cutin: 'lu:renate01:flashend', 
        speech:"トレーシー:野人共が…!",
        once: true
      },
      {
        conditionType: 'bossAppeared',
        bossType: 'Y',
        scenarioTriggerId: 'BOSS_Z_APPEAR',
        once: true
      },
    ],
   manualExitRequiredForClear: true,
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
    rushSpawnCount: (level) => 25 + level,
    initialRushThreshold: 25, // ★ ラッシュの初期しきい値
    reinforcementCooldown: 4000, // ★ 通常増援のクールダウン(ms)
    specialReinforcements: [
      { 
        time: 0, 
        type: 'ALLY_GUARD', 
        count: 1, 
        pos: { x: 1600, y: 250 }, 
        overrideStats: { hp: 1200, contactDamage: 150 } // 例：HPと攻撃力を上書き
      },
      { level: 5, type: 'C', count: 8, pattern: 'edgeRush' },
      { level: 10, type: 'D', count: 15, pattern: 'edgeRush' },
      { level: 15, type: 'B', count: 20, pattern: 'spiralWave' },
      
    ],
    clearConditions: {
        mode: 'ANY',
        conditions: [
            { type: 'killBoss', value: 'X' }
        ]
    },
    timeLimitFailure: {
        lastDamageUnitType: 'FRONTLINE_TIMEOUT'
    } ,scenarioTriggers: [
        {
            conditionType: 'rushOccurred',
            rushNumber: 1,
            scenarioTriggerId: 'FRONTLINE_RUSH_1',
            once: true
        },
        {
            conditionType: 'bossAppeared',
            bossType: 'Z',
            scenarioTriggerId: 'BOSS_Z_APPEAR_FR',
            once: true
        },
      {
        conditionType: 'clearConditionsMet',
        scenarioTriggerId: 'STAGE_OBJECTIVES_COMPLETE_MESSAGE',
        once: true
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
let triggeredReinforcements = new Set();

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
    const reinforcementKey = `${reinforcement.level || reinforcement.time}-${reinforcement.pattern || reinforcement.pos.x}-${reinforcement.type}`;
    if (millis() - lastReinforcement >= config.reinforcementCooldown &&
        ((reinforcement.level && playerStats.level === reinforcement.level) ||
         (reinforcement.time !== undefined && floor(gameTime) === reinforcement.time)) &&
        !triggeredReinforcements.has(reinforcementKey)) {
      
      // posキーが指定されているか、patternキーが指定されているかで処理を分岐
      if (reinforcement.pos) {
        // posキーがある場合：指定座標にユニットを生成
        for (let i = 0; i < reinforcement.count; i++) {
          const position = createVector(
            reinforcement.pos.x + (i > 0 ? random(-20, 20) : 0),
            reinforcement.pos.y + (i > 0 ? random(-20, 20) : 0)
          );
          // ★ overrideStatsも引数として渡す
          spawnUnitAt(reinforcement.type, position, reinforcement.overrideStats);
        }
        console.log(`Special reinforcement (fixed pos): ${reinforcement.count} ${reinforcement.type}`);
      } else if (reinforcement.pattern) {
        // patternキーがある場合：従来の関数を呼び出す
        spawnUnits(reinforcement.count, [reinforcement.type], reinforcement.pattern);
        console.log(`Special reinforcement (pattern): ${reinforcement.count} ${reinforcement.type}, pattern=${reinforcement.pattern}`);
      }
            
      justSpawnedReinforcement = reinforcement;// どの増援が出現したかを記録する
      triggeredReinforcements.add(reinforcementKey);
      lastReinforcement = millis();
      lastSpawn = millis();

      const trigger = config.scenarioTriggers?.find(t => 
        t.scenarioTriggerId === `REINFORCEMENT_${reinforcement.type}_LV${reinforcement.level}`
      );
      if (trigger && trigger.scenarioTriggerId) {
        justTriggeredEventId = trigger.scenarioTriggerId;
        console.log(`[STAGE LOG] Event ID set for reinforcement: ${justTriggeredEventId}`);
      }
    }
  }

  // 通常スポーン
  const activeUnits = units.filter(u => u && !unitsToRemove.has(units.indexOf(u))).length;
  // ★ グローバル変数の代わりにconfigからクールダウン時間を読み込む
  if ((activeUnits <= 3 || millis() - lastSpawn > spawnInterval) && millis() - lastReinforcement >= config.reinforcementCooldown) {
    spawnMode = random() < 0.5 ? 'dense' : 'sparse';
    const count = floor(spawnMode === 'dense' ? config.denseCount(playerStats.level) : config.sparseCount(playerStats.level));
    
    const availableUnitTypes = config.unitTypes(playerStats.level);
    const pattern = stage === 'fr' ? 'edgeRush' : 'round01';
    
    spawnUnits(max(1, count), availableUnitTypes, pattern);
    
    console.log(`Spawn ${count} units (mode: ${spawnMode}, level: ${playerStats.level}, activeUnits: ${activeUnits}, pattern: ${pattern}`);
    lastSpawn = millis();
  }

  // ★★★ ここからがボススポーンの修正箇所です ★★★
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
        const bossType = unitTypes[boss.type] ? boss.type : 'Z';
        
        // 修正点：bossType を配列 [bossType] で渡します
        spawnUnits(1, [bossType], boss.pattern || 'fixedPoint');

        lastBossLevels[boss.type] = level;
        console.log(`Boss ${bossType} spawned at level ${level}, pattern=${boss.pattern}`);
        justSpawnedBossType = bossType; 
    }
  }
  // ★★★ ボススポーンの修正ここまで ★★★

  // ラッシュ処理
    if (rushEnemiesKilled >= rushThreshold && enemiesKilled > lastRushKills) {
        rushCount++;
        lastRushKills = enemiesKilled;
        rushEnemiesKilled = 0;
        rushEffectTime = millis();
        lastReinforcement = millis();
        rushThreshold = 15 + units.length;

        const availableUnitTypes = config.unitTypes(playerStats.level);
        const baseSpawnCount = config.rushSpawnCount(playerStats.level);
        
        console.log(`Rush #${rushCount} triggered! Base count: ${baseSpawnCount}, Unit types: [${availableUnitTypes.join(', ')}]`);

        const patternRoll = random(3);

        if (patternRoll < 1) {
            const pattern = stage === 'fr' ? 'edgeRush' : 'round01';
            console.log(`  -> Scatter Rush selected. Spawning ${baseSpawnCount} units.`);
            spawnUnits(baseSpawnCount, availableUnitTypes, pattern);

        } else {
            const spawnCount = baseSpawnCount + playerStats.level;
            const numClusters = random([1, 2]);
            const clusterPoints = [];

            console.log(`  -> Cluster Rush selected. Spawning ${spawnCount} units in ${numClusters} cluster(s).`);

            for (let i = 0; i < numClusters; i++) {
                const angle = random(TWO_PI);
                const radius = random(500, 700);
                const point = createVector(player.pos.x + cos(angle) * radius, player.pos.y + sin(angle) * radius);
                clusterPoints.push(safeSpawn(point, player.pos, config.mapSize));
            }
            
            spawnClusteredUnits(spawnCount, availableUnitTypes, clusterPoints);
        }

        const rushTrigger = config.scenarioTriggers?.find(t => 
            t.conditionType === 'rushOccurred' && 
            t.rushNumber === rushCount
        );
        if (rushTrigger && rushTrigger.scenarioTriggerId) {
            justTriggeredEventId = rushTrigger.scenarioTriggerId;
            console.log(`[STAGE LOG] Event ID set for rush: ${justTriggeredEventId}`);
        }
    }
}