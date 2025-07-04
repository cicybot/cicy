// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { clipboard, contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('backgroundApi', {
    writeText: async (text: string) => clipboard.writeText(text),
    readText: async () => clipboard.readText(),
    writeImage: async (image: Electron.NativeImage) => clipboard.writeImage(image),
    readImage: async () => clipboard.readImage(),
    platform: () => process.platform,
    arch: () => process.arch,
    node: () => process.versions.node,
    chrome: () => process.versions.chromes,
    electron: () => process.versions.electron,
    message: (message: {action:string,payload?:object}) => ipcRenderer.invoke('message', message),
});
