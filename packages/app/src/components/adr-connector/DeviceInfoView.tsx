import { ProDescriptions, ProField } from '@ant-design/pro-components';
import { Button, Divider, message } from 'antd';
import BrowserService from '../../services/cicy/BrowserService';
import View from '../View';
import CCAndroidConnectorClient from '../../services/cicy/CCAndroidConnectorClient';
import { UploadAgentButton } from './UploadAgentButton';
import { useState } from 'react';
import Loading from '../UI/Loading';
import { useTimeoutLoop } from '@cicy/utils';
import { CCWSClient } from '../../services/cicy/CCWSClient';
import { onEvent } from '../../utils/utils';
import CCWSAgentClient from '../../services/cicy/CCWSAgentClient';
import { VpnView } from '../vpn/VpnView';

export const DeviceInfoView = ({
    deviceInfo,
    allClients,
    connector,
    serverIp,
    appInfo,
    fetchDeviceInfo
}: {
    allClients: string[];
    connector: CCAndroidConnectorClient;
    serverIp: string;
    appInfo: any;
    deviceInfo: any;
    fetchDeviceInfo: any;
}) => {
    const [screen, setScreen] = useState('');

    const cacheServerIp = localStorage.getItem('cacheServerIp') || '';
    const serverUrl = cacheServerIp ? CCWSClient.formatServerUrl(cacheServerIp) : '';
    const fetchScreen = async () => {
        const img = await connector.deviceScreenShot(deviceInfo);
        setScreen(img);
    };
    useTimeoutLoop(async () => {
        await fetchScreen();
    }, 500);
    const { size } = deviceInfo;
    const [orgWidth, orgHeight] = size.split('x');
    const width = 250;
    const height = (parseInt(orgHeight) * width) / parseInt(orgWidth);
    const { clientId } = deviceInfo;
    const wsOnlineAgentApp = allClients.find(row => row === clientId + '-APP');
    return (
        <View ml12 mr12 flx column>
            <View w100p rowVCenter borderBox mb12 jEnd pr12 mt12>
                <View>
                    <UploadAgentButton
                        deviceInfo={deviceInfo}
                        serverIp={serverIp}
                        appInfo={appInfo}
                        connector={connector}
                        fetchDeviceInfo={fetchDeviceInfo}
                    ></UploadAgentButton>
                </View>
                <View ml12>
                    <Button
                        disabled={!wsOnlineAgentApp}
                        size="small"
                        type="primary"
                        onClick={() => {
                            const url = location.href.replace(
                                '#/android',
                                `#/android/detail/${deviceInfo.clientId}`
                            );
                            new BrowserService(url).openWindow({ noWebview: true });
                        }}
                    >
                        调试节点
                    </Button>
                </View>
                <View ml12>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                            onEvent('showLoading');
                            fetchDeviceInfo();
                            onEvent('hideLoading');
                        }}
                    >
                        刷新
                    </Button>
                </View>
            </View>
            <View row relative>
                <View center w={width} h={height} absFull>
                    {screen ? (
                        <img
                            style={{ boxSizing: 'border-box', border: '1px solid #e9e9e9' }}
                            src={screen}
                            width={width + 'px'}
                            height={height + 'px'}
                            alt=""
                        />
                    ) : (
                        <Loading></Loading>
                    )}
                </View>
                <View flx ml={width}>
                    <View ml12>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="ID">
                                <ProField text={deviceInfo.clientId} mode="read" />
                            </ProDescriptions.Item>

                            <ProDescriptions.Item label="">
                                <ProField text={deviceInfo.abi} mode="read" />
                                <View ml12>
                                    <ProField text={`${deviceInfo.size}`} mode="read" />
                                </View>
                            </ProDescriptions.Item>
                            <ProDescriptions.Item label="安卓IP地址">
                                <View column>
                                    {deviceInfo.ipAddress.split(',').map((row: string) => {
                                        return (
                                            <View key={row}>
                                                <ProField text={row} mode="read" />
                                            </View>
                                        );
                                    })}
                                </View>

                                <View ml12>
                                    <ProField
                                        text={`${deviceInfo.isRoot ? 'Root' : ''}`}
                                        mode="read"
                                    />
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <Divider></Divider>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="Agent" tooltip="提供底层执行命令">
                                <View mr12>
                                    <Button
                                        onClick={async () => {
                                            if (!deviceInfo.serverUrl) {
                                                message.warning('请输入服务端地址');
                                                return;
                                            }
                                            onEvent('showLoading');
                                            await connector.agentRustStartLoop();
                                            setTimeout(() => {
                                                onEvent('hideLoading');
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        size="small"
                                    >
                                        {deviceInfo.agentPid ? '重启' : '启动'}
                                    </Button>
                                </View>
                                <ProField text={'PID:' + deviceInfo.agentPid} mode="read" />
                            </ProDescriptions.Item>

                            <ProDescriptions.Item label="Version">
                                <ProField text={deviceInfo.agentVersion + ''} mode={'read'} />
                            </ProDescriptions.Item>
                        </ProDescriptions>

                        <Divider></Divider>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="Agent App" tooltip="适配未Root的设备">
                                <ProField
                                    text={deviceInfo.agentAppInstalled + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '已安装', value: 'true' },
                                        { label: '未安装', value: 'false' }
                                    ]}
                                />

                                <View ml12 hide={!deviceInfo.agentPid}>
                                    <Button
                                        onClick={async () => {
                                            onEvent('showLoading');
                                            if (deviceInfo.agentAppInstalled) {
                                                await connector.deviceAdbShell(
                                                    'pm uninstall --user 0 com.cicy.agent.alpha'
                                                );
                                                await connector.deviceAdbShell(
                                                    'pm install -r /data/local/tmp/app.apk'
                                                );
                                            } else {
                                                await connector.deviceAdbShell(
                                                    'pm install -r /data/local/tmp/app.apk'
                                                );
                                            }

                                            await connector.deviceAdbShell(
                                                'am start -n com.cicy.agent.alpha/com.github.kr328.clash.MainActivity'
                                            );
                                            onEvent('hideLoading');
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        size="small"
                                        type={!deviceInfo.agentAppInstalled ? 'primary' : undefined}
                                    >
                                        {deviceInfo.agentAppInstalled ? '重新安装' : '安装'}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <View h={12}></View>
                        <ProDescriptions>
                            <ProDescriptions.Item label="运行状态">
                                <ProField
                                    text={deviceInfo.agentAppRunning + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '运行中', value: 'true' },
                                        { label: '未运行', value: 'false' }
                                    ]}
                                />

                                <View ml12 hide={!deviceInfo.agentAppRunning}>
                                    <Button
                                        onClick={async () => {
                                            onEvent('showLoading');
                                            await connector.deviceAdbShell(
                                                'am force-stop com.cicy.agent.alpha'
                                            );
                                            await connector.deviceAdbShell(
                                                'am start -n com.cicy.agent.alpha/com.github.kr328.clash.MainActivity'
                                            );
                                            onEvent('hideLoading');
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        type={!deviceInfo.agentAppRunning ? 'primary' : undefined}
                                        size="small"
                                    >
                                        重启
                                    </Button>
                                </View>
                                <View ml12 hide={!deviceInfo.agentAppInstalled}>
                                    <Button
                                        onClick={async () => {
                                            onEvent('showLoading');
                                            await connector.deviceAdbShell(
                                                'am start -n com.cicy.agent.alpha/com.github.kr328.clash.MainActivity'
                                            );
                                            onEvent('hideLoading');
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        size="small"
                                    >
                                        启动
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <ProDescriptions>
                            <View rowVCenter mt12>
                                <View>连接状态: </View>
                                <View>{wsOnlineAgentApp ? '在线' : '离线'}</View>
                            </View>
                        </ProDescriptions>
                        <View h={16}></View>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="无障碍辅助">
                                <ProField
                                    text={deviceInfo.inputIsReady + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '已开启', value: 'true' },
                                        { label: '未开启', value: 'false' }
                                    ]}
                                />
                                <View ml12 hide={!wsOnlineAgentApp}>
                                    <Button
                                        onClick={async () => {
                                            const agent = new CCWSAgentClient(deviceInfo.clientId);
                                            await agent.jsonrpcApp(
                                                deviceInfo.inputIsReady
                                                    ? 'onStopInput'
                                                    : 'onStartInput'
                                            );
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        type={!deviceInfo.agentAppRunning ? 'primary' : undefined}
                                        size="small"
                                    >
                                        {deviceInfo.inputIsReady ? '关闭' : '开启'}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>

                            <ProDescriptions.Item label="屏幕录制">
                                <ProField
                                    text={deviceInfo.recordingIsReady + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '已开启', value: 'true' },
                                        { label: '未开启', value: 'false' }
                                    ]}
                                />
                                <View ml12 hide={!wsOnlineAgentApp}>
                                    <Button
                                        onClick={async () => {
                                            const agent = new CCWSAgentClient(deviceInfo.clientId);
                                            await agent.jsonrpcApp(
                                                deviceInfo.recordingIsReady
                                                    ? 'onStopRecording'
                                                    : 'onStartRecording'
                                            );
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        type={!deviceInfo.agentAppRunning ? 'primary' : undefined}
                                        size="small"
                                    >
                                        {deviceInfo.recordingIsReady ? '关闭' : '开启'}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <Divider></Divider>
                        <VpnView
                            clientId={clientId}
                            wsOnlineAgentApp={!!wsOnlineAgentApp}
                        ></VpnView>
                    </View>
                </View>
            </View>
        </View>
    );
};
