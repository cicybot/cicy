import { Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { CCWSClient, AiView, View, connectCCServer } from '@cicy/app';
import { isAndroidApp, sendAndroidApiJsonRpc } from './utils/utils';
import { Settings } from './components/Settings';
import CCWSAgentClient from '@cicy/app/dist/services/cicy/CCWSAgentClient';

function App() {
    const isConnected = useRef(false);
    const [showSettings, setShowSettings] = useState(false);
    const [chatConnected, setChatConnected] = useState(false);
    const [appInfo, setAppInfo] = useState<any>({});
    async function onFetchAppInfo(clientId?: string) {
        if (isAndroidApp()) {
            const { result } = sendAndroidApiJsonRpc('appInfo');
            setAppInfo(result);
            return result;
        } else {
            const appInfo = await new CCWSAgentClient(clientId!).jsonrpcApp('appInfo');
            setAppInfo(appInfo);
            return appInfo;
        }
    }
    async function onLogged(clientId: string) {
        setChatConnected(true);
        const appInfo = await new CCWSAgentClient(clientId).jsonrpcApp('appInfo');
        setAppInfo(appInfo);
    }

    function initConnect(serverUrl: string, clientId: string) {
        CCWSClient.setServerUrl(serverUrl);
        connectCCServer(clientId + (isAndroidApp() ? '-CHAT' : '-CHAT-1'), {
            onLogged: () => {
                onLogged(clientId!).catch(console.error);
            },
            onMessage: (message: string) => {
                console.log('onMessage', message);
            },
            onClose: () => {
                setChatConnected(false);
            }
        });
    }

    useEffect(() => {
        const fetchAppInfo = () => onFetchAppInfo();
        window.addEventListener('fetchAppInfo', fetchAppInfo);
        return () => window.removeEventListener('fetchAppInfo', fetchAppInfo);
    }, []);
    useEffect(() => {
        if (isConnected.current) return;
        isConnected.current = true;

        if (isAndroidApp()) {
            sendAndroidApiJsonRpc('webviewIsReady');
            //@ts-ignore
            window.AppCallback = async (message: string) => {
                console.log('[+][AppCallback]', message);
                onFetchAppInfo();
            };
            onFetchAppInfo().then((res: any) => {
                const { serverUrl, clientId } = res;
                initConnect(serverUrl, clientId);
            });
        } else {
            let serverUrl = localStorage.getItem('serverUrl');
            if (!serverUrl) {
                serverUrl = prompt('serverUrl:');
                if (serverUrl) {
                    serverUrl = serverUrl.trim();
                    if (serverUrl) {
                        localStorage.setItem('serverUrl', serverUrl);
                    }
                }
            }
            let clientId = localStorage.getItem('clientId');
            if (!clientId) {
                clientId = prompt('clientId:');
                if (clientId) {
                    clientId = clientId.trim();
                    if (clientId) {
                        localStorage.setItem('clientId', clientId);
                    }
                }
            }
            if (serverUrl && clientId) {
                initConnect(serverUrl, clientId);
            }
        }
    }, []);
    return (
        <View>
            <View fixed top={0} h={44} xx0 borderBox rowVCenter jStart>
                <View rowVCenter wh={44} ml12>
                    <Button
                        type={'link'}
                        onClick={async () => {
                            setShowSettings(true);
                            onFetchAppInfo();
                        }}
                        size={'large'}
                        icon={<MenuOutlined />}
                    ></Button>
                </View>
            </View>
            <View fixed top={32} bottom0 xx0 borderBox>
                <AiView></AiView>
            </View>
            <Drawer
                title={'设置'}
                width={'100%'}
                closable={true}
                onClose={() => setShowSettings(false)}
                open={showSettings}
            >
                {Boolean(showSettings && appInfo.ipAddress) && (
                    <Settings chatConnected={chatConnected} appInfo={appInfo}></Settings>
                )}
            </Drawer>
        </View>
    );
}

export default App;
