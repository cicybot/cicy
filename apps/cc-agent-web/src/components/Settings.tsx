import { View } from '@cicy/app';
import { Button } from 'antd';
import CCWSAgentClient from '@cicy/app/dist/services/cicy/CCWSAgentClient';
import { useEffect, useState } from 'react';
import { isAndroidApp } from '../utils/utils';

export const Settings = ({ appInfo, onFetchAppInfo }: { onFetchAppInfo: any; appInfo: any }) => {
    const { clientId } = appInfo;
    const agent = new CCWSAgentClient(clientId);
    const [deviceInfo, setDeviceInfo] = useState<any>({});

    agent.setAppInfo(appInfo);
    agent.isInApp(isAndroidApp());
    if (deviceInfo) {
        agent.setDeviceInfo(deviceInfo);
    }
    const { ccAgentAccessibility, ipAddress, ccAgentMediaProjection } = appInfo;
    const [rustConnected, setRustConnected] = useState(false);
    useEffect(() => {
        onFetchAppInfo(clientId);
    }, []);
    useEffect(() => {
        agent.isOnline().then((res: boolean) => {
            setRustConnected(res);
        });
        agent.getDeviceInfo().then((res: any) => {
            setDeviceInfo(res);
        });
    }, []);
    return (
        <View>
            <View>
                <View>{deviceInfo.clientId}</View>
            </View>
            <View style={{ marginTop: 12 }}>App Version: {appInfo.version}</View>

            <View style={{ marginTop: 12 }}>
                <View>Agent: {'' + rustConnected}</View>
            </View>

            <View style={{ marginTop: 12 }}>
                <View>IP: {ipAddress}</View>
            </View>

            <View style={{ marginTop: 12 }}>
                <View>ServerUrl: {appInfo.serverUrl}</View>
            </View>

            <View style={{ marginTop: 12 }}>
                <View>RustPid: {deviceInfo.ccAgentRustPid}</View>
            </View>

            <View style={{ marginTop: 12 }}>
                Rust Version: {deviceInfo.agentRustVersion || 'loading...'}
            </View>

            <View style={{ marginTop: 12 }}>Vpn : {appInfo.isVpnConnected + ''}</View>

            <View style={{ marginTop: 12 }} rowVCenter>
                <View>屏幕录制: {ccAgentMediaProjection ? '已开启' : '未开启'}</View>
                <View ml12>
                    <Button
                        type={'primary'}
                        size="small"
                        onClick={async () => {
                            if (!ccAgentMediaProjection) {
                                await agent.jsonrpcApp('startMediaProjection', []);
                            } else {
                                await agent.jsonrpcApp('stopMediaProjection', []);
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
                        onClick={async () => {
                            if (!ccAgentAccessibility) {
                                await agent.jsonrpcApp('startAccessibility', []);
                            } else {
                                await agent.jsonrpcApp('stopAccessibility', []);
                            }
                        }}
                    >
                        {ccAgentAccessibility ? '关闭' : '打开'}
                    </Button>
                </View>
            </View>
            <View style={{ marginTop: 12 }} rowVCenter>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            await agent.startAgentApp();
                        }}
                    >
                        打开App
                    </Button>
                </View>
            </View>
            <View style={{ marginTop: 12 }} rowVCenter>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            const config = `
[General]
loglevel = info
logoutput = console
dns-server = 8.8.8.8, 1.1.1.1
[Proxy]
Direct = direct
Reject = reject
Socks = socks, 192.168.246.244, 4445
[Rule]
FINAL, Socks
                            `;
                            await agent.jsonrpcApp('startVpn', [config]);
                        }}
                    >
                        SOCKS
                    </Button>
                </View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            const config = `
[General]
loglevel = info
logoutput = console
dns-server = 8.8.8.8, 1.1.1.1
[Proxy]
Direct = direct
Reject = reject
Socks = socks, 192.168.246.244, 4445
[Rule]
FINAL, Direct
                            `;
                            await agent.jsonrpcApp('startVpn', [config]);
                        }}
                    >
                        直连
                    </Button>
                </View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            await agent.jsonrpcApp('stopVpn', []);
                        }}
                    >
                        Stop Vpn
                    </Button>
                </View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            const res = await agent.jsonrpcApp('isVpnRunning', []);
                            alert(JSON.stringify(res));
                        }}
                    >
                        状态
                    </Button>
                </View>
            </View>
        </View>
    );
};
