// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadSaveData: () => ipcRenderer.invoke('load-save-data'),
    saveData: (data) => ipcRenderer.invoke('save-data', data)
});