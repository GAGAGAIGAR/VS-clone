const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const JSON5 = require('json5');

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1284,
        height: 750,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
                        // ★★★ ESCキーによるポインターロック解除を無効化するオプション ★★★
            escExitPointerLock: false
        }
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile('index.html');

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    
    // フォーカスイベントの通知は、レンダラー側でカーソルを再設定するために有用なので残します
    mainWindow.on('focus', () => {
        if (mainWindow) {
            mainWindow.webContents.send('window-focused');
        }
    });
    mainWindow.on('blur', () => {
        if (mainWindow) {
            mainWindow.webContents.send('window-blurred');
        }
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// フルスクリーン切り替え（変更なし）
ipcMain.on('toggle-fullscreen', (event) => {
    if (mainWindow) {
        const isFullScreen = mainWindow.isFullScreen();
        mainWindow.setFullScreen(!isFullScreen);
    }
});

ipcMain.on('quit-game', () => {
    app.quit();
});

/* 
// --- 既存のAPIハンドラ（変更なし） ---
ipcMain.handle('get-cursor-screen-point', () => {
    return screen.getCursorScreenPoint();
});
ipcMain.handle('get-window-bounds', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.getContentBounds() : null;
});
*/

// --- ファイル読み書き処理（変更なし） ---
ipcMain.handle('load-json5-file', async (event, filePath) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    const fileContent = await fs.readFile(fullPath, 'utf8');
    return JSON5.parse(fileContent);
  } catch (error) {
    console.error(`[Main Process] Failed to read or parse JSON5 file: ${filePath}`, error);
    return null;
  }
});
ipcMain.handle('load-upgrade-descriptions', async () => {
    const filePath = path.join(__dirname, 'descriptions.json5'); 
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        return JSON5.parse(fileContent);
    } catch (error) {
        console.error(`[Main Process] Failed to load descriptions: ${filePath}`, error);
        return {};
    }
});
const saveFilePath = path.join(__dirname, 'saveData.json');

ipcMain.handle('load-save-data', async () => {
    try {
        const data = await fs.readFile(saveFilePath, 'utf8');
        const saveData = JSON.parse(data);

        // ★★★ 下位互換性のための処理 ★★★
        
        // 'stagesUnlocked' が存在しない場合、初期値を設定
        if (!saveData.stagesUnlocked) {
            saveData.stagesUnlocked = [1]; 
        }

        // 'options' が存在しない場合、初期値を設定
        if (!saveData.options) {
            saveData.options = {
                sfxVolume: 0.5,
                bgmVolume: 0.5,
                enableMouseCorrection: true
            };
        }

        return saveData;

    } catch (err) {
        if (err.code === 'ENOENT') {
            // ★ 新規セーブデータ作成時のデフォルト値を修正 ★
            const defaultData = { 
                characters: {},
                stagesUnlocked: [1],
                options: {
                    sfxVolume: 0.5,
                    bgmVolume: 0.5,
                    enableMouseCorrection: true
                }
            };
            await fs.writeFile(saveFilePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        console.error('Failed to load save data:', err);
        return { 
            characters: {},
            stagesUnlocked: [1],
            options: { // エラー時もデフォルト値を返す
                sfxVolume: 0.5,
                bgmVolume: 0.5,
                enableMouseCorrection: true
            }
        };
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


// --- アプリケーションのライフサイクル ---
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});