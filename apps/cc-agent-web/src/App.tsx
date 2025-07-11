import { Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { CCWSClient, AiView, View, connectCCServer } from '@cicy/app';

function App() {
    const isConnected = useRef(false);
    const [showSettings, setShowSettings] = useState(false);
    const [chatConnected, setChatConnected] = useState(false);
    const [rustConnected, setRustConnected] = useState(false);
    const [appInfo, setServiceInfo] = useState<any>({});
    const [deviceInfo, setDeviceInfo] = useState<any>({});
    const { ccAgentAccessibility, ipAddress, ccAgentMediaProjection } = appInfo;
    async function fetchAppInfo() {
        return fetch('/appInfo?t=' + Date.now()).then(async res => {
            const json = await res.json();
            setServiceInfo(json.result);
            setTimeout(() => {
                fetchAppInfo();
            }, 1000);
            return json.result;
        });
    }

    async function jsonRpc(method: string, params?: any[]) {
        return fetch('/jsonrpc', {
            method: 'POST',
            body: JSON.stringify({
                method,
                params: params || []
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            return res.json();
        });
    }

    useEffect(() => {
        if (isConnected.current) return;
        isConnected.current = true;
        fetchAppInfo().then(() => {
            jsonRpc('deviceInfo').then(res => {
                console.log('deviceInfo', JSON.stringify(res));
                const { result } = res;
                const { serverUrl, clientId } = result;
                CCWSClient.setServerUrl(serverUrl);
                connectCCServer(clientId + '-CHAT', {
                    onLogged: () => {
                        setChatConnected(true);
                    },
                    onMessage: (message: string) => {
                        console.log('onMessage', message);
                    },
                    onClose: () => {
                        setChatConnected(false);
                    }
                });
                setDeviceInfo(result);
            });
        });
    }, []);
    return (
        <View>
            <View fixed top={0} h={32} xx0 borderBox rowVCenter jEnd>
                <View rowVCenter wh={32} mr12>
                    <Button
                        type={'link'}
                        onClick={async () => {
                            const agent = new CCWSClient(deviceInfo.clientId);
                            agent.isOnline(deviceInfo.clientId).then((res: boolean) => {
                                setRustConnected(res);
                            });
                            jsonRpc('deviceInfo').then(res => {
                                const { result } = res;
                                setDeviceInfo(result);
                            });
                            setShowSettings(true);
                        }}
                        icon={<MenuOutlined />}
                    ></Button>
                </View>
            </View>
            <View fixed top={32} bottom0 xx0 borderBox>
                <AiView></AiView>
            </View>
            <Drawer
                title={'设置'}
                width={'80%'}
                closable={true}
                onClose={() => setShowSettings(false)}
                open={showSettings}
            >
                <View>
                    <View>
                        <View>{deviceInfo?.clientId}</View>
                    </View>
                    <View style={{ marginTop: 12 }}>App Version: {appInfo.version}</View>

                    <View style={{ marginTop: 12 }}>
                        <View>Chat: {'' + chatConnected}</View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <View>Rust: {'' + rustConnected}</View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <View>IP: {ipAddress}</View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <View>ServerUrl: {deviceInfo.serverUrl}</View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <View>RustPid: {deviceInfo.ccAgentRustPid}</View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        Rust Version: {deviceInfo.agentRustVersion || 'loading...'}
                    </View>

                    <View style={{ marginTop: 12 }} rowVCenter>
                        <View>屏幕录制: {ccAgentMediaProjection ? '已开启' : '未开启'}</View>
                        <View ml12>
                            <Button
                                type={'primary'}
                                size="small"
                                onClick={() => {
                                    if (!ccAgentMediaProjection) {
                                        jsonRpc('startMediaProjection');
                                        // getAndroidAppApi().startMediaProjection();
                                    } else {
                                        jsonRpc('stopMediaProjection');
                                        // getAndroidAppApi().stopMediaProjection();
                                    }
                                }}
                            >
                                {ccAgentMediaProjection ? '关闭' : '开启'}
                            </Button>
                        </View>
                    </View>

                    <View style={{ marginTop: 12 }} rowVCenter>
                        <View>无障碍辅助: {ccAgentAccessibility ? '已开启' : '未开启'}</View>
                        <View ml12>
                            <Button
                                size="small"
                                onClick={() => {
                                    if (!ccAgentAccessibility) {
                                        jsonRpc('startAccessibility');
                                        // getAndroidAppApi().startAccessibility();
                                    } else {
                                        jsonRpc('stopAccessibility');
                                        // getAndroidAppApi().stopAccessibility();
                                    }
                                }}
                            >
                                {ccAgentAccessibility ? '关闭' : '打开'}
                            </Button>
                        </View>
                    </View>
                </View>
            </Drawer>
        </View>
    );
}

export default App;
