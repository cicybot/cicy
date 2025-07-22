import { app, BrowserWindow, globalShortcut, powerMonitor, WebContents } from 'electron';
import log from 'electron-log/main';
import { updateElectronApp } from 'update-electron-app';
import { MainWindow } from './electron/mainWindow';

import {
    setDefaultProtocolClient,
    setProtocolHandlerOSX,
    setProtocolHandlerWindowsLinux
} from './electron/protocol';

import { delay } from './electron/utils';
import { s3 } from './electron/db';
import WebContentsService from './electron/webContentsService';

app.setName('CiCy');

log.initialize({ preload: false });
log.info('Application start-up', app.getVersion());

if (require('electron-squirrel-startup')) {
    app.quit();
}

const onUnLock = () => {
    log.info('unlock-screen');
};

if (process.platform !== 'linux') {
    powerMonitor.on('unlock-screen', onUnLock);
}
app.on('ready', async () => {
    console.log('App is ready');
});

app.on('web-contents-created', (_event, contents) => {
    const session = contents.session;

    session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback(details);
    });
});

app.on('before-quit', async e => {
    globalShortcut.unregisterAll();

    e.preventDefault();
    if (process.platform !== 'linux') {
        powerMonitor.off('unlock-screen', onUnLock);
    }
    s3() && s3().close();
    await delay(100);
    app.exit();
});

setDefaultProtocolClient();

switch (process.platform) {
    case 'darwin':
        setProtocolHandlerOSX();
        break;
    case 'linux':
    case 'win32':
        setProtocolHandlerWindowsLinux();
        break;
    default:
        throw new Error('Process platform is undefined');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        MainWindow.openMainWindow();
    }
});

// Ignore SSL certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

app.on('login', (event, webContents, details, authInfo, callback) => {
    console.log('>>> [login] authInfo', authInfo);

    if (authInfo.isProxy) {
        const auth = WebContentsService.getAuthByWebContentsId(webContents.id);
        console.log('>>> [login] auth', auth);
        if (auth && auth.proxyUsername && auth.proxyPassword) {
            event.preventDefault();
            callback(auth.proxyUsername, auth.proxyPassword);
        }
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

updateElectronApp({ logger: log });
