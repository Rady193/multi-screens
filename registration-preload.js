// The registration window's one request to the app (registration.js): save these details and send them.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scaffapps', {
  register: (details) => ipcRenderer.invoke('scaffapps-register', details),
});
