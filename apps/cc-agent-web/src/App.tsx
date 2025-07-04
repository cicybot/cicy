import { Button } from 'antd';
import { useEffect, useRef, useState } from 'react';
import './App.css';

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
                setDeviceInfo(result);
            });
        });
    }, []);
    return (
        <div style={{ padding: 12 }}>
            <div style={{ marginTop: 12 }}>
                <div>
                    {appInfo.brand}-{appInfo.model}-1
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <div>IP: {ipAddress}</div>
            </div>
            <div style={{ marginTop: 12 }}>Agent App Version: {appInfo.version}</div>

            <div style={{ marginTop: 12 }}>
                Agent Rust Version: {deviceInfo.agentRustVersion || 'loading...'}
            </div>

            <div style={{ marginTop: 12 }}>
                <div>屏幕录制: {ccAgentMediaProjection ? '已开启' : '未开启'}</div>
                <div>
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
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <div>无障碍辅助: {ccAgentAccessibility ? '已开启' : '未开启'}</div>
                <div>
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
                </div>
            </div>
            <pre style={{ display: 'none', textAlign: 'left', width: '100vw' }}>
                {JSON.stringify(appInfo, null, 2)}
            </pre>
            <pre style={{ display: 'none', textAlign: 'left', width: '100vw' }}>
                {JSON.stringify(deviceInfo, null, 2)}
            </pre>
        </div>
    );
}

export default App;
