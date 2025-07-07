import { Button } from 'antd';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { CCWSClient, AiView, View, connectCCServer } from '@cicy/app';

function App() {
    const isConnected = useRef(false);
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
                const { result } = res;
                const { serverUrl, clientId } = result;
                CCWSClient.setServerUrl(serverUrl);
                connectCCServer(clientId + '-WS', {
                    onOpen: () => {
                        console.log('onopen');
                    },
                    onMessage: (message: string) => {
                        console.log('onMessage', message);
                    }
                });
                setDeviceInfo(result);
            });
        });
    }, []);
    return (
        <View>
            <View fixed top0 bottom0 xx0 borderBox pl12>
                <AiView></AiView>
            </View>
            <View hide>
                <View style={{ marginTop: 12 }}>
                    <View>
                        {appInfo.brand}-{appInfo.model}-1
                    </View>
                </View>

                <View style={{ marginTop: 12 }}>
                    <View>IP: {ipAddress}</View>
                </View>
                <View style={{ marginTop: 12 }}>Agent App Version: {appInfo.version}</View>

                <View style={{ marginTop: 12 }}>
                    Agent Rust Version: {deviceInfo.agentRustVersion || 'loading...'}
                </View>

                <View style={{ marginTop: 12 }}>
                    <View>屏幕录制: {ccAgentMediaProjection ? '已开启' : '未开启'}</View>
                    <View>
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

                <View style={{ marginTop: 12 }}>
                    <View>无障碍辅助: {ccAgentAccessibility ? '已开启' : '未开启'}</View>
                    <View>
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
        </View>
    );
}

export default App;
