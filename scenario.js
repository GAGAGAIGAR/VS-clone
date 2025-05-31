let scenarioData = null;
let currentScenario = null;
let scenarioStepIndex = 0;
let scenarioStartTime = 0;
let loadedImages = {};
let isScenarioPlaying = false;
let textHistory = [];
let showText = true;
let showKeyInstructions = true;
let waitForInput = false;
let scenarioDataLoaded = false;
let lastImage = null;
let previousGameState = null;

function loadScenarioData() {
    loadJSON('scenario.json', (data) => {
        scenarioData = data;
        scenarioDataLoaded = true;
        console.log('Scenario data loaded:', scenarioData);
        // Initialize recallScenarios
        if (scenarioData?.events?.gameOver) {
            recallScenarios = [];
            const characters = Object.keys(scenarioData.events.gameOver);
            for (let character of characters) {
                const speciesList = Object.keys(scenarioData.events.gameOver[character]);
                for (let species of speciesList) {
                    if (scenarioData.events.gameOver[character][species].thumbnail) {
                        recallScenarios.push({ character, species });
                        const thumbnail = scenarioData.events.gameOver[character][species].thumbnail;
                        if (thumbnail && !loadedImages[thumbnail]) {
                            loadImage(thumbnail, 
                                img => {
                                    loadedImages[thumbnail] = img;
                                    console.log(`Loaded thumbnail: ${thumbnail}`);
                                },
                                err => {
                                    console.error(`Failed to load thumbnail: ${thumbnail}`);
                                    loadedImages[thumbnail] = null;
                                }
                            );
                        }
                    }
                }
            }
            console.log('Initialized recallScenarios:', recallScenarios);
        }
    }, (err) => {
        console.error('Failed to load scenario.json:', err);
        scenarioDataLoaded = true;
    });
}

function startScenario(eventType, character, species) {
    if (!scenarioDataLoaded || !scenarioData) {
        console.warn('Scenario data not loaded');
        return false;
    }

    if (isScenarioPlaying) {
        console.warn('Scenario already playing');
        return false;
    }

    if (!scenarioData.events[eventType]) {
        console.warn(`No scenarios defined for event=${eventType}`);
        return false;
    }

    if (!scenarioData.events[eventType][character]) {
        console.warn(`No scenario found for event=${eventType}, character=${character}`);
        return false;
    }

    const scenarios = scenarioData.events[eventType][character];
    const scenarioObj = scenarios[species] || scenarios['default'];

    if (!scenarioObj || !scenarioObj.steps) {
        console.warn(`No scenario found for event=${eventType}, character=${character}, species=${species || 'null'}. No default scenario available.`);
        return false;
    }

    previousGameState = gameState;
    currentScenario = scenarioObj.steps;
    const thumbnail = scenarioObj.thumbnail;
    scenarioStepIndex = 0;
    scenarioStartTime = millis();
    isScenarioPlaying = true;
    textHistory = [];
    showText = true;
    showKeyInstructions = true;
    waitForInput = true;
    lastImage = null;
    console.log(`Started scenario: ${eventType}, character=${character}, species=${species || 'default'}, thumbnail=${thumbnail || 'none'}`);

    if (thumbnail && !loadedImages[thumbnail]) {
        loadImage(thumbnail, 
            img => {
                loadedImages[thumbnail] = img;
                console.log(`Loaded thumbnail: ${thumbnail}`);
            },
            err => {
                console.error(`Failed to load thumbnail: ${thumbnail}`);
                loadedImages[thumbnail] = null;
            }
        );
    }

    loadNextImage();
    if (currentScenario[0].type === 'text') {
        addToBacklog(currentScenario[0].content);
    }
    return true;
}

function loadNextImage() {
    if (scenarioStepIndex >= currentScenario.length) return;
    const step = currentScenario[scenarioStepIndex];
    if (step.type === 'image' && !loadedImages[step.path]) {
        loadImage(step.path, 
            img => {
                loadedImages[step.path] = img;
                console.log(`Loaded image: ${step.path}`);
            },
            err => {
                console.error(`Failed to load image: ${step.path}`);
                loadedImages[step.path] = null;
            }
        );
    }
}

function advanceScenario() {
    if (!isScenarioPlaying || !currentScenario) return;

    scenarioStepIndex++;
    scenarioStartTime = millis();
    if (scenarioStepIndex < currentScenario.length) {
        loadNextImage();
        if (currentScenario[scenarioStepIndex].type === 'text') {
            addToBacklog(currentScenario[scenarioStepIndex].content);
        }
        console.log(`Moved to scenario step ${scenarioStepIndex + 1}`);
    } else {
        endScenario();
    }
}

function updateScenario() {
    if (!isScenarioPlaying || !currentScenario || waitForInput) return;

    const step = currentScenario[scenarioStepIndex];
    if (!step) {
        endScenario();
        return;
    }

    const elapsed = millis() - scenarioStartTime;
    if (elapsed >= step.duration) {
        advanceScenario();
    }
}

function drawScenario() {
    if (!isScenarioPlaying || !currentScenario) return;

    const step = currentScenario[scenarioStepIndex];
    if (!step) return;

    if (debugLog && debugMode) console.log(`Drawing scenario step ${scenarioStepIndex}, type=${step.type}`);

    fill(0, 0, 0, 200);
    rect(0, 0, 1280, 720);

    if (lastImage && lastImage.img && lastImage.img.width) {
        let drawImage = true;
        if (lastImage.effect === 'flash') {
            const elapsed = millis() - lastImage.startTime;
            let alpha = 0;
            if (elapsed < 300) {
                alpha = map(elapsed, 0, 300, 0, 255);
            } else if (elapsed < 500) {
                alpha = 255;
            } else if (elapsed < 900) {
                alpha = map(elapsed, 500, 900, 255, 0);
            } else {
                alpha = 0;
            }
            if (alpha > 0) {
                fill(255, 255, 255, alpha);
                rect(0, 0, 1280, 720);
            }
        }
        if (drawImage) {
            const scale = min(1280 / lastImage.img.width, 720 / lastImage.img.height);
            const w = lastImage.img.width * scale;
            const h = lastImage.img.height * scale;
            image(lastImage.img, (1280 - w) / 2, (720 - h) / 2, w, h);
        }
    }

    if (step.type === 'image') {
        const img = loadedImages[step.path];
        if (img && img.width) {
            lastImage = {
                img,
                effect: step.effect,
                effectParams: step.effectParams,
                startTime: scenarioStartTime
            };
        }
    }

    if (step.type === 'text' && showText) {
        fill(255);
        textSize(24);
        textAlign(CENTER, CENTER);
        text(step.content, 1280 / 2, 720 / 2);
    }

    if (showKeyInstructions) {
        fill(255);
        textSize(20);
        textAlign(CENTER, BOTTOM);
        text("スペース/クリック: 次へ, C: バックログ, V: テキスト非表示", 1280 / 2, 700);
    }
}

function drawBacklog() {
    if (!isScenarioPlaying || !textHistory.length) return;

    fill(0, 0, 0, 220);
    rect(200, 50, 880, 620);
    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    let y = 70;
    text("バックログ (C: 閉じる)", 220, y);
    y += 40;
    for (let entry of textHistory) {
        textWrap(WORD);
        text(entry, 220, y, 840);
        y += textAscent() * 1.5 * (1 + floor(textWidth(entry) / 840));
        if (y > 650) break;
    }
}

function endScenario() {
    if (currentScenario && selectedCharacter) {
        if (previousGameState !== 'recall') {
            const species = playerStats.lastDamageEnemyType && enemyTypes[playerStats.lastDamageEnemyType]
                ? enemyTypes[playerStats.lastDamageEnemyType].species || 'default'
                : 'default';
            if (!saveData.characters[selectedCharacter]) {
                saveData.characters[selectedCharacter] = {
                    stages: {},
                    scenarios: { gameOver: {} }
                };
            }
            if (!saveData.characters[selectedCharacter].scenarios.gameOver) {
                saveData.characters[selectedCharacter].scenarios.gameOver = {};
            }
            saveData.characters[selectedCharacter].scenarios.gameOver[species] = true;
            console.log(`Marked scenario as viewed: character=${selectedCharacter}, event=gameOver, species=${species}`);
            saveGameData();
        }
    }

    isScenarioPlaying = false;
    currentScenario = null;
    scenarioStepIndex = 0;
    textHistory = [];
    showText = true;
    showKeyInstructions = true;
    waitForInput = false;
    lastImage = null;
    scenarioStarted = false; // 明示的にリセット
    console.log('Scenario ended');

    if (previousGameState === 'recall') {
        setGameState('recall');
        console.log('シナリオ終了後、回想モードに戻る');
    } else {
        backToTitle(); // ゲームオーバー後はタイトル画面へ
        console.log('シナリオ終了後、タイトル画面に戻る');
    }
    previousGameState = null;
}

function isScenarioActive() {
    return isScenarioPlaying;
}

function toggleText() {
    showText = !showText;
    showKeyInstructions = !showKeyInstructions;
    console.log(`Text visibility: ${showText}, Key instructions: ${showKeyInstructions}`);
}

function addToBacklog(content) {
    textHistory.push(content);
    if (textHistory.length > 50) textHistory.shift();
}