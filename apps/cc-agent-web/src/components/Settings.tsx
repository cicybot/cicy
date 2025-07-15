import { View } from '@cicy/app';
import { Button, Drawer } from 'antd';
import CCWSAgentClient from '@cicy/app/dist/services/cicy/CCWSAgentClient';
import { useEffect, useState } from 'react';
import { isAndroidApp, sendAndroidApiJsonRpc } from '../utils/utils';
import { Proxy } from './Proxy';

export const Settings = ({ chatConnected, appInfo }: { chatConnected: boolean; appInfo: any }) => {
    const { clientId } = appInfo;
    const agent = new CCWSAgentClient(clientId);
    const [deviceInfo, setDeviceInfo] = useState<any>({});
    const [showVpnConfig, setShowVpnConfig] = useState(false);
    const [changeProxy, setChangeProxy] = useState(false);

    agent.setAppInfo(appInfo);
    agent.isInApp(isAndroidApp());
    if (deviceInfo) {
        agent.setDeviceInfo(deviceInfo);
    }
    const { ccAgentAccessibility, ipAddress, ccAgentMediaProjection } = appInfo;
    const [rustConnected, setRustConnected] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            agent.isOnline().then((res: boolean) => {
                setRustConnected(res);
            });
            const { result } = sendAndroidApiJsonRpc('deviceInfo');
            setDeviceInfo(result);
        }, 200);
    }, []);
    return (
        <View>
            <View>
                <View>{appInfo.clientId}</View>
            </View>
            <View mt12>App Version: {appInfo.version}</View>

            <View mt12>
                <View>Agent: {'' + rustConnected}</View>
            </View>

            <View mt12>
                <View>Chat: {'' + chatConnected}</View>
            </View>

            <View mt12>
                <View>IP: {ipAddress}</View>
            </View>

            <View mt12>
                <View>ServerUrl: {appInfo.serverUrl}</View>
            </View>

            <View mt12>
                <View>Agent Pid: {deviceInfo.ccAgentRustPid}</View>
            </View>

            <View mt12>Agent Version: {deviceInfo.agentRustVersion || 'loading...'}</View>

            <View mt12>Vpn : {appInfo.isVpnConnected + ''}</View>

            <View mt12 rowVCenter>
                <View>通知: {appInfo.notificationsIsGranted ? '已授权' : '未授权'}</View>
                <View ml12 hide={appInfo.notificationsIsGranted}>
                    <Button
                        size="small"
                        onClick={async () => {
                            sendAndroidApiJsonRpc('requestNotificationPermission');
                        }}
                    >
                        授权
                    </Button>
                </View>
            </View>

            <View mt12 rowVCenter>
                <View>屏幕录制: {ccAgentMediaProjection ? '已开启' : '未开启'}</View>
                <View ml12>
                    <Button
                        type={'primary'}
                        size="small"
                        onClick={async () => {
                            if (!ccAgentMediaProjection) {
                                sendAndroidApiJsonRpc('startMediaProjection');
                            } else {
                                sendAndroidApiJsonRpc('stopMediaProjection');
                            }
                        }}
                    >
                        {ccAgentMediaProjection ? '关闭' : '开启'}
                    </Button>
                </View>
            </View>

            <View mt12 rowVCenter>
                <View>无障碍辅助: {ccAgentAccessibility ? '已开启' : '未开启'}</View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            if (!ccAgentAccessibility) {
                                sendAndroidApiJsonRpc('startAccessibility');
                            } else {
                                sendAndroidApiJsonRpc('stopAccessibility');
                            }
                        }}
                    >
                        {ccAgentAccessibility ? '关闭' : '打开'}
                    </Button>
                </View>
            </View>
            <View mt12 rowVCenter>
                <View>Vpn: {appInfo.isVpnConnected ? '已开启' : '未开启'}</View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            if (!appInfo.isVpnConnected) {
                                sendAndroidApiJsonRpc('startVpn');
                            } else {
                                sendAndroidApiJsonRpc('stopVpn');
                            }
                        }}
                    >
                        {appInfo.isVpnConnected ? '关闭' : '打开'}
                    </Button>
                </View>
                <View ml12 hide={!appInfo.isVpnConnected}>
                    <Button
                        size="small"
                        onClick={async () => {
                            sendAndroidApiJsonRpc('startVpn');
                        }}
                    >
                        重启
                    </Button>
                </View>
            </View>
            <View mt12 rowVCenter pl={24}>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            setShowVpnConfig(true);
                        }}
                    >
                        配置
                    </Button>
                </View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            setChangeProxy(true);
                        }}
                    >
                        修改节点
                    </Button>
                </View>
            </View>
            <Drawer
                title={'Vpn'}
                width={'100%'}
                closable={true}
                onClose={() => setShowVpnConfig(false)}
                open={showVpnConfig}
            >
                <View mt12 rowVCenter>
                    <pre>{appInfo.vpnInfo.configYaml}</pre>
                </View>
            </Drawer>
            <Drawer
                bodyStyle={{ margin: 0, padding: 0 }}
                title={'Proxy'}
                width={'100%'}
                closable={true}
                onClose={() => setChangeProxy(false)}
                open={changeProxy}
            >
                <View mt12 rowVCenter hide={!changeProxy}>
                    <Proxy appInfo={appInfo}></Proxy>
                </View>
            </Drawer>

            <View hide json={appInfo}></View>
        </View>
    );
};
