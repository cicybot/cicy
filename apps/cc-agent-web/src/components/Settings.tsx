import { View } from '@cicy/app';
import { Button, Drawer } from 'antd';
import CCWSAgentClient from '@cicy/app/dist/services/cicy/CCWSAgentClient';
import { useEffect, useState } from 'react';
import { isAndroidApp, sendAndroidApiJsonRpc } from '../utils/utils';
import { Proxy } from './Proxy';

export const Settings = ({
    chatConnected,
    agentAppInfo
}: {
    chatConnected: boolean;
    agentAppInfo: any;
}) => {
    const { clientId } = agentAppInfo;
    const agent = new CCWSAgentClient(clientId);
    const [deviceInfo, setDeviceInfo] = useState<any>({});
    const [showVpnConfig, setShowVpnConfig] = useState(false);
    const [changeProxy, setChangeProxy] = useState(false);

    agent.setAgentAppInfo(agentAppInfo);
    agent.isInApp(isAndroidApp());
    if (deviceInfo) {
        agent.setDeviceInfo(deviceInfo);
    }
    const { ccAgentAccessibility, ipAddress, ccAgentMediaProjection } = agentAppInfo;
    const [rustConnected, setRustConnected] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            agent.isOnline().then((res: boolean) => {
                setRustConnected(res);
            });
            const { result } = sendAndroidApiJsonRpc('deviceInfo');
            if (result) {
                setDeviceInfo(result);
            }
        }, 200);
    }, []);
    return (
        <View>
            <View>
                <View>{agentAppInfo.clientId}</View>
            </View>
            <View mt12>App Version: {agentAppInfo.version}</View>

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
                <View>ServerUrl: {agentAppInfo.serverUrl}</View>
            </View>

            <View mt12>
                <View>Agent Pid: {deviceInfo?.ccAgentRustPid}</View>
            </View>

            <View mt12>Agent Version: {deviceInfo?.agentRustVersion || 'loading...'}</View>

            <View mt12>Vpn : {agentAppInfo.isVpnConnected + ''}</View>

            <View mt12 rowVCenter>
                <View>通知: {agentAppInfo.notificationsIsGranted ? '已授权' : '未授权'}</View>
                <View ml12 hide={agentAppInfo.notificationsIsGranted}>
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
                <View>Vpn: {agentAppInfo.isVpnConnected ? '已开启' : '未开启'}</View>
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            if (!agentAppInfo.isVpnConnected) {
                                sendAndroidApiJsonRpc('startVpn');
                            } else {
                                sendAndroidApiJsonRpc('stopVpn');
                            }
                        }}
                    >
                        {agentAppInfo.isVpnConnected ? '关闭' : '打开'}
                    </Button>
                </View>
                <View ml12 hide={!agentAppInfo.isVpnConnected}>
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
                    <pre>{agentAppInfo.vpnInfo.configYaml}</pre>
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
                    <Proxy agentAppInfo={agentAppInfo}></Proxy>
                </View>
            </Drawer>

            <View json={deviceInfo || '{}'}></View>
            <View json={agentAppInfo}></View>
        </View>
    );
};
