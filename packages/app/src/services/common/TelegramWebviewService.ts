import { WebviewTag } from 'electron';
import { dataURItoBlob } from '../../utils/utils';

export default class TelegramWebviewService {
    private webview: WebviewTag;
    constructor(webview: WebviewTag) {
        this.webview = webview;
    }

    async onGetVideo(id: number, size: number, mimeType: string) {
        const { webview } = this;
        const dataUri = await webview.executeJavaScript(`
            (async ()=>{   
                async function mergeCachedStreamChunks(cacheName, baseUrl, totalSize) {
                    try {
                        const cache = await caches.open(cacheName);
                        const allRequests = await cache.keys();
                        const regex = new RegExp(baseUrl, 'i');
                        const matchingRequests = allRequests.filter(request => regex.test(request.url));
                        const sortedRequests = matchingRequests.sort((a, b) => {
                            const getOffset = url => {
                                const match = url.match(/offset=(\\d+)/);
                                return match ? parseInt(match[1]) : 0;
                            };
                            return getOffset(a.url) - getOffset(b.url);
                        });
        
                        console.log('Sorted requests:', sortedRequests.map(r => r.url));
                        const chunks = [];
        
                        for (const request of sortedRequests) {
                            const response = await cache.match(request);
                            if (response && response.ok) {
                                const arrayBuffer = await response.arrayBuffer();
                                chunks.push(arrayBuffer);
                            }
                        }
        
                        // Calculate total size from all chunks
                        const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        
                        // Merge all chunks into a single ArrayBuffer
                        const mergedArrayBuffer = new ArrayBuffer(totalBytes);
                        const mergedView = new Uint8Array(mergedArrayBuffer);
        
                        let offset = 0;
                        for (const chunk of chunks) {
                            const chunkView = new Uint8Array(chunk);
                            mergedView.set(chunkView, offset);
                            offset += chunk.byteLength;
                        }
                        return mergedArrayBuffer
        
                    } catch (error) {
                        console.error('Error merging cached chunks:', error);
                        throw error;
                    }
                }
                const size = ${size};
                const baseUrl = '${id}';
        
                const arrayBuffer = await mergeCachedStreamChunks('cachedStreamChunks', baseUrl, size)
                
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const dataUri = "data:${mimeType};base64,"+btoa(binary)
                // function downloadFile(url, filename) {
                //     // Create a temporary anchor element
                //     const link = document.createElement('a');
                //     link.href = url;
                //     // Set the download filename
                //     link.download = filename;
                //     // Append to body, click, and remove
                //     document.body.appendChild(link);
                //     link.click();
                //     document.body.removeChild(link);
                // }

                // downloadFile(dataUri,"video.mp4")
                return dataUri;
               
            })()
        `);
        const blob = dataURItoBlob(dataUri);
        return URL.createObjectURL(blob);
    }
    async getVideoPlayerData() {
        const res = await this.webview.executeJavaScript(`
                (async ()=>{
                
                if(document.querySelector('.ckin__video')){
                    async function getVideoDuration(videoElement) {
                        // If a selector string is provided instead of element
                        const video = typeof videoElement === 'string' 
                            ? document.querySelector(videoElement)
                            : videoElement;
                    
                        if (!video || video.tagName !== 'VIDEO') {
                            throw new Error('Video element not found or not a video element');
                        }
                    
                        return new Promise((resolve, reject) => {
                            // If duration is already available and valid
                            if (video.duration && video.duration !== Infinity && !isNaN(video.duration)) {
                                resolve(video.duration);
                                return;
                            }
                    
                            // Event handlers
                            const handleLoadedMetadata = () => {
                                cleanup();
                                if (video.duration !== Infinity && !isNaN(video.duration)) {
                                    resolve(video.duration);
                                } else {
                                    reject(new Error('Could not determine valid video duration'));
                                }
                            };
                    
                            const handleError = (error) => {
                                cleanup();
                                console.error(error)
                                reject(new Error(error.message));
                            };
                    
                            // Cleanup function to remove event listeners
                            const cleanup = () => {
                                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                                video.removeEventListener('error', handleError);
                                video.removeEventListener('abort', handleError);
                            };
                    
                            // Add event listeners
                            video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
                            video.addEventListener('error', handleError, { once: true });
                            video.addEventListener('abort', handleError, { once: true });
                    
                            // If video hasn't started loading, trigger load
                            if (video.readyState === 0) {
                                video.load();
                            }
                    
                            // Set timeout for cases where metadata never loads
                            setTimeout(() => {
                                if (video.duration === Infinity || isNaN(video.duration)) {
                                    cleanup();
                                    reject(new Error('Timeout waiting for video metadata'));
                                }
                            }, 10000); // 10 second timeout
                        });
                    }
                
                    const video = document.querySelector('.ckin__video')
                    const duration = await getVideoDuration(video)
                    const src = video.src;
                    return JSON.stringify({src,duration})
                }else{
                    return null
                }
                })()
            `);

        if (res) {
            const { src, duration } = JSON.parse(res);
            const data = decodeURIComponent(src);
            const { location, mimeType, size, fileName } = JSON.parse(data.replace('stream/', ''));
            const { access_hash, id } = location;

            const dataUri = await this.webview.executeJavaScript(`
                        (async ()=>{
                           const cacheName = "cachedFiles"
                           const cache = await caches.open(cacheName);
                           const response = await cache.match('https://web.telegram.org/document_${id}_m');
                           const arrayBuffer = await response.arrayBuffer();
                            const bytes = new Uint8Array(arrayBuffer);
                            let binary = '';
                            for (let i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            const dataUri = "data:image/jpeg;base64,"+btoa(binary)
                            return dataUri;
                        })()
                    `);

            const blob = dataURItoBlob(dataUri);

            const downloadStateStr = await this.webview.executeJavaScript(`
                    (async ()=>{
                       const cacheName = "cachedStreamChunks"
                       const cache = await caches.open(cacheName);
                       const response = await cache.keys();
                       let limit = 0 ,limits = [],offsets=[];
                       response.filter(res=>res.url.indexOf('${id}') > -1).forEach(res=>{
                        const searchParams = new URL(res.url).searchParams
                        limit = parseInt(searchParams.get("limit"))
                        offsets.push(parseInt(searchParams.get("offset")))
                        if(limits.indexOf(limit) === -1){
                            limits.push(limit)
                        }
                       })
                       offsets.sort((b,a)=>a-b)
                       let offset = 0;
                       if(offsets.length > 0){
                        offset =offsets[0]
                       }
                       return JSON.stringify({limit,offset,limits});
                    })()
                `);
            const thumbVideoUrl = await this.webview.executeJavaScript(`
                        (async ()=>{
                           const cacheName = "cachedStreamChunks"
                           const cache = await caches.open(cacheName);
                           const keys = await cache.keys();
                           const results = keys.filter(res=>res.url.indexOf("${id}") > -1 && res.url.indexOf("?offset=0&") > -1)
                           if(results.length > 0){
                                const url = results[0].url
                                const response = await cache.match(url);
                                const arrayBuffer = await response.arrayBuffer();
                                const bytes = new Uint8Array(arrayBuffer);
                                let binary = '';
                                for (let i = 0; i < bytes.byteLength; i++) {
                                    binary += String.fromCharCode(bytes[i]);
                                }
                                const dataUri = "data:${mimeType};base64,"+btoa(binary)
                                return dataUri;
                           }else{
                                return null
                           }
                           
                        })()
                    `);

            const downloadState = JSON.parse(downloadStateStr);
            const { offset, limit } = downloadState;
            let total = offset + limit;
            if (total >= size) {
                total = size;
            }
            const process = (100 * total) / size;
            return {
                process,
                downloadState,
                duration,
                access_hash,
                id,
                mimeType,
                size,
                fileName,
                res
            };
        } else {
            return null;
        }
    }

    async __getInfo() {
        return await this.webview.executeJavaScript(
            `(()=>{return window.__info ? window.__info():null})()`
        );
    }
    async getData() {
        await this.getInfo();
        let str = await this.webview.executeJavaScript(
            `(()=>{return window.__data ? window.__data():null})()`
        );
        if (str) {
            return JSON.parse(str);
        }
        return null;
    }
    async getInfo() {
        const version = 'v0.0.27';
        let infoStr = await this.__getInfo();

        if (!infoStr) {
            await this.hookIndexJs(version);
            infoStr = await this.__getInfo();
        }
        let info = JSON.parse(infoStr);
        if (info.version !== version) {
            console.log('version updated', version, info.version);
            await this.hookIndexJs(version);
            infoStr = await this.__getInfo();
            info = JSON.parse(infoStr);
        }
        console.debug('[INFO]', version, info);
        return info;
    }
    async hookIndexJs(version: string) {
        await this.webview.executeJavaScript(`
        (async ()=>{
            const cache = await caches.open("cachedAssets");
            const allRequests = await cache.keys();

            const indexJs = allRequests.filter(res=>{
                const {url}  =res
                return url.indexOf("index-") > -1 && url.endsWith(".js")
            })
            if(indexJs){
                const url = indexJs[0].url
                console.log("indexJs",url)
                const response = await cache.match(url)
                const text = await response.text()
                const hookCode = \`  
console.log("[version] ${version}"),
window.__sleep = (ms)=>{
    return new Promise(resolve => setTimeout(resolve, ms));
}
window.__downloadMedia = (media)=>{
    window.__downloader.downloadToDisc({
        queueId:window.__queueId,
        media
    })
}
            
window.__hookStyle = ()=>{
    const __hook_id = "hook-style"
    const __existing = document.getElementById(__hook_id);
    if (__existing) __existing.remove();
    const __style = document.createElement('style');
    __style.id = __hook_id;
    __style.textContent = \\\`.quality-download-options-button-menu.hide {display:block!important} 
@media only screen and (max-width: 600px) {
    .media-viewer-buttons {
        display:block!important
    }
    .media-viewer-buttons button{
        display:block!important
    }
}\\\`;
    document.head.appendChild(__style);
};
window.__hookStyle();
window.getStoreData = async function(storeName, dbName){
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                reject(new Error("Store  not found"));
                return;
            }
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        request.onerror = () => reject(request.error);
    });
}
window.__downloadIds = localStorage.getItem("__downloadIds_1") ? JSON.parse(localStorage.getItem("__downloadIds_1")):{}
window.__fixDownloader = (obj,option,downloadId)=>{
    window.__downloader = obj;
    const media = option.media;
    window.__queueId = option.queueId;
    window.__downloadIds[downloadId] = media.id
    localStorage.setItem("__downloadIds_1",JSON.stringify(window.__downloadIds))
    console.log("==>>>> [__fixDownloader]",downloadId,window.__queueId,media)
},

window.__info = ()=>{
    return JSON.stringify({
        version:"${version}",
        queueId:window.__queueId,
        downloaderInited:!!window.__downloader,
    })
},
window.__chats = []
setInterval(async ()=>{
    const number_of_accounts = localStorage.getItem('number_of_accounts');
    if(number_of_accounts){
        try{
            window.__chats = await getStoreData("chats","tweb-account-"+number_of_accounts)              
        }catch(e){}
    }

},1000)
        
window.__data = ()=>{
    const info = JSON.parse(window.__info());
    return JSON.stringify({
        ...info,
        downloadIds:window.__downloadIds,
        chats:window.__chats,
        messageMirrors:window.__mirrors,
    })
},
\`
                console.log("[version] ${version}")
                console.log("[hook] hookCode",text.indexOf(hookCode))
                console.log(hookCode)
                console.log("[hook] window.__mirrors",text.indexOf("window.__mirrors"))
                console.log("[hook] window.__fixDownloader",text.indexOf("window.__fixDownloader"))
                let newText = text
                let flag = true;
                const startHook = "console.log('===>>> fix index.js');"
                const endHook = "console.log('===>>> fix end index.js');"
                if(!text.startsWith(startHook)){
                    flag = true;
                    newText = startHook + endHook + newText;
                }
                const startIndex = newText.indexOf(startHook ) + startHook.length
                const endIndex = newText.indexOf(endHook)
                const startCode = newText.substring(0,startIndex)
                const endCode = newText.substring(endIndex)
                
                newText = startCode + hookCode
                
                newText = newText + endCode
                if(newText.indexOf("window.__mirrors=this.mirrors,") === -1){
                    flag = true;
                    newText = newText.replace("this.processMirrorTaskMap=","window.__mirrors=this.mirrors,this.processMirrorTaskMap=")
                }
                if(newText.indexOf("window.__fixDownloader&&window.__fixDownloader(this,e,g),") === -1){
                    flag = true;
                    newText = newText.replace("J.pingServiceWorkerWithIframe(),","J.pingServiceWorkerWithIframe(),window.__fixDownloader&&window.__fixDownloader(this,e,g),")
                }
                if(flag){
                    const newResponse = new Response(newText, {
                        headers: response.headers,
                        status: response.status,
                        statusText: response.statusText
                    });
                    await cache.put(url, newResponse);
                }
                location.reload()
            }
        })()
        `);
    }

    handleDocumentMediaMessages(messageMirrors: any) {
        const { messages } = messageMirrors;
        const keys = Object.keys(messages);
        let res: Record<number, any> = {};
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const msg = messages[key];
            const keys1 = Object.keys(msg);
            for (let j = 0; j < keys1.length; j++) {
                const key11 = keys1[j];
                const m = msg[key11];
                if (m.media && m.media.document) {
                    res[m.mid] = m;
                }
            }
        }
        return res;
    }

    async getCachedFile(id: number, fileType: 'document', type: 'm') {
        try {
            const dataUri = await this.webview.executeJavaScript(`
            (async ()=>{
               const cacheName = "cachedFiles"
               const cache = await caches.open(cacheName);
               const response = await cache.match('https://web.telegram.org/${fileType}_${id}_${type}');
               if(!response){
                    return null;
               }
               const arrayBuffer = await response.arrayBuffer();
               if(arrayBuffer.byteLength > 0){
                  const bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const dataUri = "data:image/jpeg;base64,"+btoa(binary)
                    return dataUri;
               }else{
                    return null;
               }
            })()
        `);
            if (dataUri) {
                const blob = dataURItoBlob(dataUri);
                return URL.createObjectURL(blob);
            }
        } catch (e) {}
        return null;
    }
}
