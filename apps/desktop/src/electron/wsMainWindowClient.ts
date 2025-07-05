import { WebContents, webContents } from 'electron';
import WebSocket from 'ws';
import { MainWindow } from './mainWindow';
import WebContentsRequest from './webContentsRequest';
import { CCClientWebsocket } from '@cicy/cicy-ws';
import { s3 } from './db';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { getAppInfo } from './info';
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const DEV_URL: string;

const execPromise = util.promisify(exec);

const CURRENT_CLIENT_ID = 'MainWindow';

const serverUrl = 'ws://127.0.0.1:4444/ws';

const CaptureCache: Map<
    string,
    {
        windowId: string;
        imgData: string;
        rect: {
            widht: number;
            height: number;
            x: number;
            y: number;
        };
    }
> = new Map();

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function showRect(
    webview: WebContents,
    rect: { x: number; y: number; width: number; height: number },
    hideDelaySec = 3
) {
    const code = `
    var highlightDiv = document.createElement('div');
    highlightDiv.style.position = 'fixed';
    highlightDiv.style.left = '${rect.x}px';
    highlightDiv.style.top = '${rect.y}px';
    highlightDiv.style.width = '${rect.width}px';
    highlightDiv.style.height = '${rect.height}px';
    highlightDiv.style.backgroundColor = 'red';
    highlightDiv.style.zIndex = '2147483647'; // Maximum z-index
    highlightDiv.style.opacity = '0.5'; // Semi-transparent
    document.body.appendChild(highlightDiv);
    setTimeout(function() {
        if (highlightDiv && highlightDiv.parentNode) {
            highlightDiv.parentNode.removeChild(highlightDiv);
        }
    }, ${hideDelaySec || 1} * 1000);
    `;
    await webview.executeJavaScript(code);
}
function getCodeForBounds(selector: string) {
    const code = `
    const ele = document.querySelector('${selector}');
    if(ele){
        const rect = ele.getBoundingClientRect();
        return {
            top:rect.top,
            left:rect.left,
            x:rect.x,
            y:rect.y,
            width:rect.width,
            height:rect.height,
            center:{
                top:rect.top + rect.height/2,
                left:rect.left + rect.width/2,
            }
        }
    }else{
        return {
            err:"not found ele"
        }
    }
    `;
    return code;
}
async function execJs(webview: WebContents, code: string) {
    const code_ = `(async () => {
        try {
            ${code}
        } catch (e) {
            console.error("exec js error",e);
            return {
                err:e
            }
        }
    })();`;
    const res = await webview.executeJavaScript(code_);
    if (typeof res === 'string') {
        return { result: res };
    }
    return res;
}
const callFunction = async (obj: any, action: string) => {
    let res;
    if (action in obj) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line no-case-declarations
        let callRes;
        if (typeof obj[action] === 'function') {
            if (obj[action].constructor.name === 'AsyncFunction') {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line no-case-declarations
                callRes = await obj[action]();
            } else {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line no-case-declarations
                callRes = obj[action]();
            }
        } else {
            callRes = {
                ...obj[action]
            };
        }
        res = {
            err: '',
            ...callRes
        };
    } else {
        res = {
            err: 'not found action'
        };
    }
    return res;
};
export const handleMsg = async (action: string, payload: any) => {
    let res: any = { err: '' };
    try {
        switch (action) {
            case 'db': {
                const { method, params } = payload || {};
                switch (method) {
                    case 'exec': {
                        return s3().exec(params[0]);
                    }
                    case 'run': {
                        const stmt = s3().prepare(params[0]);
                        return stmt.run(...params[1]);
                    }
                    case 'get': {
                        const stmt = s3().prepare(params[0]);
                        return stmt.get(...params[1]);
                    }
                    case 'all': {
                        const stmt = s3().prepare(params[0]);
                        return stmt.all(...params[1]);
                    }
                    default: {
                        break;
                    }
                }
            }
            case 'mainWindowInfo': {
                const info = MainWindow.getInfo();
                res = {
                    err: '',
                    result: info
                };
                break;
            }
            case 'callBaseWindow': {
                const { windowId, method, params } = payload || {};
                const win = MainWindow.getWinById(windowId);
                if (win) {
                    res = {
                        err: ''
                    };
                    switch (method) {
                        case 'setTitle': {
                            const { title } = params || {};
                            win.setTitle(title);
                            break;
                        }
                        case 'setBounds': {
                            const { rect, animate } = params || {};
                            win.setBounds({ ...rect }, !!animate);
                            break;
                        }

                        case 'close': {
                            win.close();
                            break;
                        }
                        default:
                            res = await callFunction(win, action);
                            break;
                    }
                }
                break;
            }
            case 'callWebContents': {
                const { webContentsId, windowId, method, params } = payload || {};
                const win = MainWindow.getWinById(windowId);
                if (win) {
                    const webview = webContents.fromId(webContentsId as number);
                    res = {
                        err: ''
                    };
                    switch (method) {
                        case 'setConfig': {
                            const { requestFilters, proxyRules } = params || {};
                            new WebContentsRequest(windowId)
                                .setWebContentsId(webContentsId)
                                .setFilters(requestFilters);
                            webview.session
                                .setProxy({
                                    proxyRules
                                })
                                .then(() => {
                                    console.log('proxyRules set', { webContentsId, proxyRules });
                                });
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'setRequestFilters': {
                            const { requestFilters } = params || {};
                            new WebContentsRequest(windowId)
                                .setWebContentsId(webContentsId)
                                .setFilters(requestFilters);
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'setProxy': {
                            const { proxyRules } = params || {};
                            webview.session
                                .setProxy({
                                    proxyRules
                                })
                                .then(() => {
                                    console.log('proxyRules set', { webContentsId, proxyRules });
                                });
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'getRequests': {
                            const requests = new WebContentsRequest(windowId).getRequests();
                            res = {
                                requests,
                                err: ''
                            };
                            break;
                        }
                        case 'execJs': {
                            const { code } = params || {};
                            const execJsRes = await execJs(webview, code);
                            res = {
                                err: '',
                                ...execJsRes
                            };
                            break;
                        }
                        case 'getSelectorBounds': {
                            const { selector } = params || {};
                            const code = getCodeForBounds(selector);
                            const execJsRes = await execJs(webview, code);
                            res = {
                                err: '',
                                ...execJsRes
                            };
                            break;
                        }
                        case 'setInputValue': {
                            const { selector, value } = params || {};
                            const code = `
                            const ele = document.querySelector('${selector}')
                            if(ele){
                                ele.value = "${value}";
                                ele.dispatchEvent(new Event("input", { bubbles: true }));
                                return {err: ''}
                            }else{
                                return {err:"selector not found"}
                            }
                            `;
                            const res1 = await execJs(webview, code);
                            res = {
                                err: '',
                                ...res1
                            };
                            break;
                        }
                        case 'getDocumentReadyState': {
                            const readyState = await execJs(webview, 'return document.readyState;');
                            res = {
                                err: '',
                                readyState
                            };
                            break;
                        }
                        case 'showRect': {
                            const { rect, hideDelaySec } = params || {};
                            await showRect(webview, rect, hideDelaySec);
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'capturePage': {
                            const { rect, quality } = params || {};
                            const nativeImage = await webview.capturePage(rect);
                            const resizedImage = nativeImage.resize({
                                width: rect.width,
                                height: rect.height
                            });
                            const imgBuffer = resizedImage.toJPEG(quality || 65);
                            const imgBase64 = `data:image/jpeg;base64,${imgBuffer.toString(
                                'base64'
                            )}`;
                            CaptureCache.set(windowId, {
                                rect,
                                windowId,
                                imgData: imgBase64
                            });
                            res = {
                                rect,
                                windowId,
                                imgData: imgBase64,
                                err: ''
                            };
                            break;
                        }
                        case 'sendClickEvent': {
                            const { x, y, delay, showPoint } = params || {};
                            if (showPoint) {
                                await showRect(
                                    webview,
                                    { x: x - 22, y: y - 22, width: 44, height: 44 },
                                    1
                                );
                            } else {
                                webview.sendInputEvent({
                                    type: 'mouseDown',
                                    button: 'left',
                                    x,
                                    y,
                                    clickCount: 1
                                });
                                if (delay) {
                                    await sleep(delay);
                                }
                                webview.sendInputEvent({
                                    type: 'mouseUp',
                                    button: 'left',
                                    x,
                                    y,
                                    clickCount: 1
                                });
                            }
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'clickSelector': {
                            const { selector, delay, showPoint } = params || {};

                            const code = getCodeForBounds(selector);
                            const execJsRes = await execJs(webview, code);
                            if (!execJsRes || execJsRes.err) {
                                res = {
                                    err: execJsRes.err || 'exec js error'
                                };
                            } else {
                                const rect = execJsRes;
                                if (showPoint) {
                                    await showRect(webview, rect, 1);
                                } else {
                                    const x = rect.x + rect.width / 2;
                                    const y = rect.y + rect.height / 2;
                                    webview.sendInputEvent({
                                        type: 'mouseDown',
                                        button: 'left',
                                        x,
                                        y,
                                        clickCount: 1
                                    });
                                    if (delay) {
                                        await sleep(delay);
                                    }
                                    webview.sendInputEvent({
                                        type: 'mouseUp',
                                        button: 'left',
                                        x,
                                        y,
                                        clickCount: 1
                                    });
                                }
                                res = {
                                    err: ''
                                };
                            }

                            break;
                        }
                        case 'sendInputEvent': {
                            const { event, showPoint } = params || {};
                            if (showPoint && event.x !== undefined) {
                                await showRect(
                                    webview,
                                    { x: event.x - 22, y: event.y - 22, width: 44, height: 44 },
                                    1
                                );
                            } else {
                                webview.sendInputEvent(event);
                            }
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'typeWords': {
                            const { words, delay } = params || {};
                            const characters = Array.from(words);
                            characters.forEach((char: string) => {
                                webview.sendInputEvent({
                                    type: 'keyDown',
                                    keyCode: char
                                });

                                // Then send the char event
                                webview.sendInputEvent({
                                    type: 'char',
                                    keyCode: char
                                });

                                // Optionally, you might want to send keyUp as well
                                webview.sendInputEvent({
                                    type: 'keyUp',
                                    keyCode: char
                                });
                            });
                            res = {
                                err: ''
                            };
                            break;
                        }
                        case 'executeJavaScript': {
                            const { code } = params || {};
                            const execRes = await webview.executeJavaScript(code);
                            res = {
                                err: '',
                                ...execRes
                            };
                            break;
                        }
                        case 'openDevTools': {
                            let { mode } = params || {};
                            if (!mode) {
                                mode = 'detach';
                            }
                            webview.openDevTools({ mode });
                            break;
                        }
                        default:
                            res = await callFunction(webview, action);
                            break;
                    }
                }
                break;
            }
            case 'createWindow': {
                const { windowId, noWebview, url } = payload || {};
                let { openDevTools, windowOptions } = payload || {};
                if (!url || !windowId) {
                    break;
                }
                if (openDevTools === undefined) {
                    openDevTools = false;
                } else {
                    openDevTools = !!openDevTools;
                }

                if (windowOptions === undefined) {
                    windowOptions = {};
                }
                const url_home = DEV_URL ? DEV_URL : MAIN_WINDOW_WEBPACK_ENTRY;
                MainWindow.createWindow({
                    openDevTools,
                    winId: windowId,
                    url: noWebview ? url : `${url_home}/#browser?windowId=${windowId}`,
                    windowOptions
                }).catch(console.error);
                break;
            }
            default:
                break;
        }
    } catch (e) {
        console.error(e);
        res = { err: e.message };
    }
    return res;
};

export async function initCCClient() {
    CCClientWebsocket.configServer(serverUrl, CURRENT_CLIENT_ID, {
        onMessage: async (ws: WebSocket, data: string) => {
            const { id, action, payload: payload, from: fromClientId } = JSON.parse(data as string);
            const res: any = handleMsg(action, payload);

            if (id && fromClientId) {
                ws.send(
                    JSON.stringify({
                        id,
                        to: fromClientId,
                        action: 'callback',
                        payload: res
                    })
                );
            }
        }
    }).connectCCServer();
    initConnector(serverUrl).catch(console.error);
}

export function setServerUrl(serverUrl: string) {
    CCClientWebsocket.setServerUrl(serverUrl);
    initConnector(serverUrl).catch(console.error);
}

export async function initConnector(serverUrl: string) {
    const platform = process.platform;
    const arch = process.arch;
    const prefix = platform === 'win32' ? '.exe' : '';
    const { publicDir, userDataPath, version, isDev } = getAppInfo();
    const ver = isDev ? '0.0.0' : version;

    const connectorFile = `cicy-connector-${ver}-${platform}-${arch}${prefix}`;
    const assetsDir = path.join(publicDir, 'static', 'assets');
    const cmd = `${path.join(
        assetsDir,
        connectorFile
    )} -d --dir "${userDataPath}" --ws-server ${serverUrl} --client-id CONNECTOR-ELECTRON`;

    console.log('initConnector rust: ', {
        platform,
        publicDir,
        arch,
        assetsDir,
        userDataPath,
        serverUrl,
        version,
        cmd
    });
    await execPromise(cmd);
}
