const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'TicketVault',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f0f13'
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  checkForUpdates()
})

function checkForUpdates() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('update-status', {
      type: 'available',
      version: info.version
    })
  })

  autoUpdater.on('update-not-available', () => {
    // ticho - neobtezovat uzivatele
  })

  autoUpdater.on('download-progress', (progress) => {
    win.webContents.send('update-status', {
      type: 'downloading',
      percent: Math.round(progress.percent)
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update-status', {
      type: 'downloaded',
      version: info.version
    })
  })

  autoUpdater.on('error', (err) => {
    console.log('AutoUpdater error:', err.message)
  })

  try {
    autoUpdater.checkForUpdates()
  } catch(e) {
    console.log('Update check failed:', e.message)
  }
}

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
