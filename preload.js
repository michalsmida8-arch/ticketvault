const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_, data) => callback(data)),
  installUpdate: () => ipcRenderer.send('install-update'),
  fetchViagogo: (url) => ipcRenderer.invoke('fetch-viagogo', url),
  checkGmailNow: () => ipcRenderer.invoke('check-gmail-now'),
  onGmailUpdate: (callback) => ipcRenderer.on('gmail-update', (_, data) => callback(data)),
  onGmailChecking: (callback) => ipcRenderer.on('gmail-checking', (_, data) => callback(data)),
  onGmailRefresh: (callback) => ipcRenderer.on('gmail-refresh', (_, data) => callback(data)),
})
