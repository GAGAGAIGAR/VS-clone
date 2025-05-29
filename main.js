const { app, BrowserWindow } = require('electron');
const path = require('path');
const chokidar = require('chokidar');

function createWindow() {
    const win = new BrowserWindow({
        width: 1284,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true
        }
    });

    win.loadFile('index.html');
    win.webContents.openDevTools({ mode: 'detach' });

    const watcher = chokidar.watch([
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'portrait.js'),
        path.join(__dirname, 'upgrades.js'),
        path.join(__dirname, 'stages.js'),
        path.join(__dirname, 'enemies.js'),
        path.join(__dirname, 'game.js'),
        path.join(__dirname, 'map.js'),
        path.join(__dirname, 'player.js'),
        path.join(__dirname, 'ui.js'),
        path.join(__dirname, 'effects.js'),
        path.join(__dirname, 'assets', 'images', '*.png')
    ], {
        persistent: true
    });

    watcher.on('change', (filePath) => {
        console.log(`File changed: ${filePath}`);
        win.reload();
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});