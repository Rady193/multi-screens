const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('multiScreens', {
  config: () => ipcRenderer.invoke('config'),
  display: {
    get: () => ipcRenderer.invoke('display-get'),
    set: (inches) => ipcRenderer.invoke('display-set', inches),
    onChange: (callback) => ipcRenderer.on('display-changed', (_event, info) => callback(info)),
  },
  ready: () => ipcRenderer.send('interface-ready'),
  emulate: (id, device) => ipcRenderer.invoke('emulate', id, device),
  devtools: (id) => ipcRenderer.invoke('devtools', id),
  capture: {
    begin: (webContentsId, preview) => ipcRenderer.invoke('capture-begin', webContentsId, preview),
    window: () => ipcRenderer.invoke('capture-window'),
    cancel: (token) => ipcRenderer.invoke('capture-cancel', token),
    save: (token, name, full) => ipcRenderer.invoke('capture-save', token, name, full),
  },
  clearData: () => ipcRenderer.invoke('clear-data'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  mouseMove: (id, x, y, leave) => ipcRenderer.invoke('mouse-move', id, x, y, leave),
  reveal: (file) => ipcRenderer.invoke('reveal', file),
  output: {
    get: () => ipcRenderer.invoke('output-get'),
    choose: () => ipcRenderer.invoke('output-choose'),
    open: () => ipcRenderer.invoke('output-open'),
  },
  notes: {
    cancel: (token) => ipcRenderer.invoke('capture-cancel', token),
    add: (note) => ipcRenderer.invoke('notes-add', note),
    list: () => ipcRenderer.invoke('notes-list'),
    remove: (id) => ipcRenderer.invoke('notes-delete', id),
    clear: () => ipcRenderer.invoke('notes-clear'),
    update: (id, text) => ipcRenderer.invoke('notes-update', id, text),
    image: (id, full) => ipcRenderer.invoke('notes-image', id, full),
    report: (deviceId, reviewed) => ipcRenderer.invoke('notes-report', deviceId, reviewed),
    open: (file) => ipcRenderer.invoke('notes-open', file),
  },
  saveVideo: (buffer, name) => ipcRenderer.invoke('save-video', buffer, name),
  mediaSourceId: () => ipcRenderer.invoke('media-source-id'),
  logins: {
    list: () => ipcRenderer.invoke('logins-list'),
    save: (entry) => ipcRenderer.invoke('logins-save', entry),
    remove: (id) => ipcRenderer.invoke('logins-delete', id),
    fill: (id, webContentsIds) => ipcRenderer.invoke('logins-fill', id, webContentsIds),
  },
});
