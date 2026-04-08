const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const https = require('https')
const gmailService = require('./gmail-service')

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 800, minHeight: 600,
    title: 'TicketVault',
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    autoHideMenuBar: true, backgroundColor: '#0f0f13'
  })
  win.loadFile('index.html')
  gmailService.setWindow(win)

  setTimeout(() => runGmailCheck(), 30000)
  setInterval(() => runGmailCheck(), 30 * 60 * 1000)
}

function runGmailCheck() {
  win?.webContents.send('gmail-checking', true)
  gmailService.checkEmails((err, results) => {
    win?.webContents.send('gmail-checking', false)
    if (err) { console.log('Gmail error:', err.message); win?.webContents.send('gmail-update', { msg: '⚣️ Gmail chyba: ' + err.message, type: 'error' }); return; }
    if (results.length > 0) {
      results.forEach(r => { if (r.msg) win?.webContents.send('gmail-update', { msg: r.msg, type: r.action === 'updated' ? 'success' : 'info' }) })
      win?.webContents.send('gmail-refresh', results)
    }
  })
}

ipcMain.handle('check-gmail-now', async () => {
  return new Promise((resolve) => {
    gmailService.checkEmails((err, results) => {
      if (err) resolve({ ok: false, error: err.message })
      else resolve({ ok: true, results })
    })
  })
})

ipcMain.handle('fetch-viagogo', async (event, url) => {
  return new Promise((resolve) => {
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'cs-CZ,cs;q=0.9,en;q=0.8' }
    const urlObj = new URL(url)
    const req = https.get({ hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, headers }, (res) => {
      let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve({ ok: true, html: data }))
    })
    req.on('error', err => resolve({ ok: false, error: err.message }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }) })
  })
})

app.whenReady().then(() => { createWindow(); checkForUpdates() })

function checkForUpdates() {
  autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-available', (info) => { win.webContents.send('update-status', { type: 'available', version: info.version }) })
  autoUpdater.on('download-progress', (p) => { win.webContents.send('update-status', { type: 'downloading', percent: Math.round(p.percent) }) })
  autoUpdater.on('update-downloaded', (info) => { win.webContents.send('update-status', { type: 'downloaded', version: info.version }) })
  autoUpdater.on('error', (err) => { console.log('AutoUpdater error:', err.message) })
  try { autoUpdater.checkForUpdates() } catch(e) {}
}

ipcMain.on('install-update', () => { autoUpdater.quitAndInstall() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
