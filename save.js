const fs = require('fs').promises;
const path = require('path');

const SAVE_FILE = path.join(__dirname, 'saveData.json');
let saveData = { characters: {} };
let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 1000;

async function loadSaveData() {
    try {
        const data = await fs.readFile(SAVE_FILE, 'utf8');
        saveData = JSON.parse(data);
        console.log('Save data loaded:', saveData);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('No save file found, initializing new save data');
            await saveDataToFile();
        } else {
            console.error('Failed to load save data:', err);
        }
    }
    return saveData;
}

async function saveDataToFile() {
    const now = Date.now();
    if (now - lastSaveTime < SAVE_DEBOUNCE_MS) {
        console.log('Save debounced');
        return;
    }
    try {
        await fs.writeFile(SAVE_FILE, JSON.stringify(saveData, null, 2));
        lastSaveTime = now;
        console.log('Save data written to', SAVE_FILE);
    } catch (err) {
        console.error('Failed to save data:', err);
    }
}

function updateStageScore(character, stage, score) {
    if (!saveData.characters[character]) saveData.characters[character] = { stages: {}, scenarios: { gameOver: {} } };
    if (!saveData.characters[character].stages[stage]) saveData.characters[character].stages[stage] = { highScore: 0 };
    const currentScore = saveData.characters[character].stages[stage].highScore || 0;
    if (score > currentScore) {
        saveData.characters[character].stages[stage].highScore = score;
        console.log(`Updated score for ${character} stage ${stage}: ${score}`);
        saveDataToFile();
    }
}

function markScenarioTriggered(character, eventType, species) {
    if (!saveData.characters[character]) saveData.characters[character] = { stages: {}, scenarios: { gameOver: {} } };
    if (!saveData.characters[character].scenarios[eventType]) saveData.characters[character].scenarios[eventType] = {};
    if (!saveData.characters[character].scenarios[eventType][species]) {
        saveData.characters[character].scenarios[eventType][species] = true;
        console.log(`Marked scenario as triggered: ${character}, ${eventType}, ${species}`);
        saveDataToFile();
    }
}

function wasScenarioTriggered(character, eventType, species) {
    return saveData.characters[character]?.scenarios?.[eventType]?.[species] || false;
}

module.exports = {
    loadSaveData,
    updateStageScore,
    markScenarioTriggered,
    wasScenarioTriggered
};