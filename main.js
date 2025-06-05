const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs').promises;

function createWindow() {
    const win = new BrowserWindow({
        width: 1284,
        height: 768,
        webPreferences: {
            nodeIntegration: false, // Disable nodeIntegration for security
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
    win.webContents.openDevTools({ mode: 'detach' });

    const watcher = chokidar.watch([
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'portrait.js'),
        path.join(__dirname, 'character&upgrades.js'),
        path.join(__dirname, 'stages.js'),
        path.join(__dirname, 'game.js'),
        path.join(__dirname, 'player.js'),
        path.join(__dirname, 'ui.js'),
        path.join(__dirname, 'scenario.js'), 
        path.join(__dirname, 'units.js'),
        path.join(__dirname, 'assets', 'images', '*.png')
    ], {
        persistent: true
    });

    watcher.on('change', (filePath) => {
        console.log(`File changed: ${filePath}`);
        win.reload();
    });
}

// Initialize save file path
const saveFilePath = path.join(__dirname, 'saveData.json'); //const saveFilePath = path.join(app.getPath('userData'), 'saveData.json');

// IPC handlers for save/load
ipcMain.handle('load-save-data', async () => {
    try {
        const data = await fs.readFile(saveFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // Create empty save file if it doesn't exist
            const defaultData = { characters: {} };
            await fs.writeFile(saveFilePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        console.error('Failed to load save data:', err);
        return { characters: {} };
    }
});

ipcMain.handle('save-data', async (event, data) => {
    try {
        await fs.writeFile(saveFilePath, JSON.stringify(data, null, 2));
        console.log('Save data written successfully');
        return true;
    } catch (err) {
        console.error('Failed to save data:', err);
        return false;
    }
});

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});