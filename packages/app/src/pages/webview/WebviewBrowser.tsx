import { LoadingOutlined } from '@ant-design/icons';
import { Avatar, Button, message, Popconfirm } from 'antd';
import { WebviewTag } from 'electron';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import View from '../../components/View';
import { useGlobalContext } from '../../providers/GlobalProvider';
import { connectCCServer } from '../../services/CCWSClient';
import { CCWSMainWindowClient } from '../../services/CCWSMainWindowClient';
import { SiteService } from '../../services/SiteService';
import { BLANK_URL, WebveiwEventType } from '../../utils/webview';
import MenuBtn from './MenuBtn';

export let currentWebContentsId = 0;
export interface BrowserError {
    validatedURL: string;
    errorDescription: string;
}
let _favIcon = '';

const WebviewBrowser = () => {
    const { state } = useGlobalContext();
    let searchParams = useSearchParams();
    const windowId = searchParams[0].get('windowId') as string;

    const accountIndex = windowId.split('-')[0];
    const siteId = windowId.split('-')[1];
    const siteService = new SiteService(siteId, parseInt(accountIndex));
    const mainWindowWsClient = new CCWSMainWindowClient();
    const partition = `persist:account_${accountIndex || 0}`;
    const webviewRef = useRef(null);
    const [error, setError] = useState<BrowserError | null>(null);
    const [loading, setLoading] = useState(true);
    const [favicon, setFavicon] = useState('');
    const [currentUrl, setCurrentUrl] = useState(BLANK_URL);

    useEffect(() => {
        if (!webviewRef.current) {
            return;
        }
        const webview = webviewRef.current as WebviewTag;
        const onEvent = async (eventType: WebveiwEventType, evt?: any) => {
            const webview = evt.target as WebviewTag;
            switch (eventType) {
                case 'did-fail-load': {
                    const { isMainFrame, validatedURL, errorDescription } = evt;
                    if (isMainFrame && errorDescription) {
                        const accountState = await siteService.getAccountState();
                        await siteService.saveAccountState({
                            ...accountState,
                            err: errorDescription,
                            currentUrl,
                            loading: false,
                            state: 'did-fail-load',
                            updatedAt: Date.now()
                        });
                        setError({ validatedURL, errorDescription });
                        console.error({ validatedURL, errorDescription });
                    }
                    break;
                }
                case 'dom-ready': {
                    const currentUrl = webview.getURL();
                    console.log(`[+] dom-ready`, currentUrl);
                    if (currentUrl.startsWith(BLANK_URL)) {
                        console.log(`[+] webContentsId`, webview.getWebContentsId());
                        const site = await siteService.getSiteInfo();
                        console.log('[+] site', site);
                        connectCCServer(windowId, {
                            onOpen: () => {
                                currentWebContentsId = webview.getWebContentsId();
                                webview.executeJavaScript(`(()=>{
                                    location.href = "${site.url}"
                                })()`);
                            }
                        });
                    } else {
                        await webview.executeJavaScript(`(()=>{
                             console.log("init!")
                        })()`);
                        const accountState = await siteService.getAccountState();
                        await siteService.saveAccountState({
                            ...accountState,
                            err: '',
                            currentUrl,
                            loading: false,
                            state: 'dom-ready',
                            updatedAt: Date.now()
                        });
                    }

                    break;
                }
                default:
                    console.log(eventType, evt);
                    break;
            }
        };

        const events: Record<string, any> = {
            'context-menu': async (e: any) => {
                await onEvent('context-menu', e);
            },
            'did-start-navigation': async (e: any) => {
                await onEvent('did-start-navigation', e);
                const { isMainFrame, url } = e;
                if (isMainFrame) {
                    const accountState = await siteService.getAccountState();
                    await siteService.saveAccountState({
                        ...accountState,
                        err: '',
                        currentUrl: url,
                        loading: true,
                        state: 'did-start-navigation',
                        updatedAt: Date.now()
                    });
                    setCurrentUrl(url);
                }
            },
            'load-commit': async (e: any) => {
                await onEvent('load-commit', e);
            },
            'did-start-loading': async (e: any) => {
                setLoading(true);
                await onEvent('did-start-loading', e);
                await window.backgroundApi.message({
                    action: 'callBaseWindow',
                    payload: {
                        windowId,
                        method: 'setTitle',
                        params: {
                            title: '-'
                        }
                    }
                });
            },
            'did-stop-loading': async (e: any) => {
                setLoading(false);
                await onEvent('did-stop-loading', e);
                const accountState = await siteService.getAccountState();
                await siteService.saveAccountState({
                    ...accountState,
                    loading: false,
                    state: 'did-stop-loading',
                    updatedAt: Date.now()
                });
            },
            'did-finish-load': async (e: any) => {
                await onEvent('did-finish-load', e);
            },
            'did-fail-load': async (e: any) => {
                await onEvent('did-fail-load', e);
            },
            'console-message': async (e: any) => {
                await onEvent('console-message', e);
            },
            'page-title-updated': async (e: any) => {
                onEvent('page-title-updated', e);

                const res = await window.backgroundApi.message({
                    action: 'callBaseWindow',
                    payload: {
                        windowId,
                        method: 'setTitle',
                        params: {
                            title: e.title
                        }
                    }
                });
                console.log('page-title-updated', e.title, res);
                const site = await siteService.getSiteInfo();
                console.log({ site });
                if (!site.title) {
                    siteService.saveSiteInfo({
                        ...site,
                        title: e.title
                    });
                }
            },
            'page-favicon-updated': async (e: any) => {
                await onEvent('page-favicon-updated', e);
                const { favicons } = e;
                if (favicons.length > 0 && _favIcon !== favicons[0]) {
                    _favIcon = favicons[0];
                    setFavicon(_favIcon);
                    const site = await siteService.getSiteInfo();
                    if (!site.icon) {
                        siteService.saveSiteInfo({
                            ...site,
                            icon: _favIcon
                        });
                    }
                }
            },
            'dom-ready': async (e: any) => {
                await onEvent('dom-ready', e);
            },
            close: () => {},
            destroyed: () => {}
        };

        Object.keys(events).forEach(key => {
            if (events[key]) {
                webview.addEventListener(key, events[key]);
            }
        });
        return () => {
            if (webview) {
                Object.keys(events).forEach(key => {
                    if (events[key]) {
                        webview.removeEventListener(key, events[key]);
                    }
                });
            }
        };
    }, [webviewRef]);
    let userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) W/1.0.80 Chrome/126.0.6478.36 E/31.0.1 Safari/537.36';
    userAgent =
        'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) W/1.0.80 Chrome/126.0.6478.36 E/31.0.1 Safari/537.36';
    return (
        <View style={{ height: '100vh' }}>
            <View style={{ height: 'calc(100vh - 32px)' }}>
                {error && (
                    <View wh100p aCenter jCenter column>
                        <View mb12>{error.errorDescription}</View>
                        <Button
                            size={'small'}
                            onClick={() => {
                                if (webviewRef.current) {
                                    const webview = webviewRef.current as WebviewTag;
                                    webview.reload();
                                }
                            }}
                        >
                            刷新
                        </Button>
                    </View>
                )}
                {!error && (
                    <webview
                        useragent={userAgent}
                        ref={webviewRef}
                        partition={partition}
                        style={{
                            display: 'inline-flex',
                            width: '100%',
                            height: '100%'
                        }}
                        src={BLANK_URL}
                    />
                )}
            </View>
            <View
                rowVCenter
                h={32}
                pl12
                borderBox
                jSpaceBetween
                style={{
                    borderTop: `1px solid ${state.ui.broderColor}`
                }}
            >
                <View rowVCenter>
                    <View mr={4} center style={{ fontSize: 14 }}>
                        # {accountIndex}
                    </View>
                    <View hide={!loading} wh={18} center>
                        <LoadingOutlined></LoadingOutlined>
                    </View>
                    <View hide={loading} wh={18} center>
                        <Avatar size={16} src={favicon}></Avatar>
                    </View>
                    <View
                        flex1
                        w={'calc(100vw - 112px)'}
                        overflowHidden
                        h={32}
                        style={{ lineHeight: '32px' }}
                        ml={8}
                    >
                        <Popconfirm
                            okText={'复制'}
                            onConfirm={() => {
                                navigator.clipboard
                                    .writeText(currentUrl)
                                    .then(() => {
                                        message.success('URL已复制到剪贴板');
                                    })
                                    .catch(() => {
                                        message.error('复制失败');
                                    });
                            }}
                            showCancel={false}
                            title={currentUrl}
                        >
                            {currentUrl}
                        </Popconfirm>
                    </View>
                </View>
                <View rowVCenter>
                    <MenuBtn
                        siteService={siteService}
                        webview={webviewRef.current! as WebviewTag}
                    />
                </View>
            </View>
        </View>
    );
};

export default WebviewBrowser;
