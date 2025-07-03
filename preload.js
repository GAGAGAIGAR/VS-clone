const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadSaveData: () => ipcRenderer.invoke('load-save-data'),
    saveData: (data) => ipcRenderer.invoke('save-data', data),
    loadJson5File: (filePath) => ipcRenderer.invoke('load-json5-file', filePath),
    toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
        loadUpgradeDescriptions: () => ipcRenderer.invoke('load-upgrade-descriptions'),
    onWindowFocus: (callback) => ipcRenderer.on('window-focused', callback),
    onWindowBlur: (callback) => ipcRenderer.on('window-blurred', callback),
        quitGame: () => ipcRenderer.send('quit-game')
});