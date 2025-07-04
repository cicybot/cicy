import { ProDescriptions, ProField } from '@ant-design/pro-components';
import { Button, Divider, message } from 'antd';
import BrowserService from '../../services/BrowserService';
import View from '../View';
import CCAndroidConnectorClient from '../../services/CCAndroidConnectorClient';
import { UploadAgentButton } from './UploadAgentButton';
import { useEffect, useState } from 'react';
import Loading from '../UI/Loading';
import { useTimeoutLoop } from '@cc/utils';
import { CCWSClient } from '../../services/CCWSClient';

export const DeviceInfo = ({
    refetchClients,
    deviceInfo,
    connector,
    serverIp,
    fetchDeviceInfo
}: {
    connector: CCAndroidConnectorClient;
    serverIp: string;
    deviceInfo: any;
    fetchDeviceInfo: any;
    refetchClients: any;
}) => {
    const serverUrl = `ws://${serverIp}:3101/ws`;
    const [screen, setScreen] = useState('');
    const fetchScreen = async () => {
        const img = await connector.deviceScreenShot(deviceInfo);
        setScreen(img);
    };
    useTimeoutLoop(async () => {
        console.log('fetchScreen');
        await fetchScreen();
    }, 500);
    const { size } = deviceInfo;
    const [orgWidth, orgHeight] = size.split('x');
    const width = 250;
    const height = (parseInt(orgHeight) * width) / parseInt(orgWidth);

    return (
        <View ml12 mr12 flx column>
            <View w100p rowVCenter borderBox mb12 jEnd pr12>
                <View>
                    <UploadAgentButton
                        serverIp={serverIp}
                        connector={connector}
                        fetchDeviceInfo={fetchDeviceInfo}
                    ></UploadAgentButton>
                </View>
                <View ml12>
                    <Button
                        disabled={
                            !Boolean(
                                deviceInfo &&
                                    deviceInfo.ccAgentRustPid
                            )
                        }
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
                        打开
                    </Button>
                </View>
                <View ml12>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                            refetchClients();
                            fetchDeviceInfo();
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
                            <ProDescriptions.Item label="本机IP">
                                <ProField text={deviceInfo.ipAddress} mode="read" />
                                <View ml12>
                                    <ProField text={`${deviceInfo.isRoot ? "Root":""}`} mode="read" />
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <Divider></Divider>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="Agent Rust" tooltip="提供底层执行命令">
                                <ProField text={deviceInfo.ccAgentRustPid} mode="read" />
                                <View ml12>
                                    <Button
                                        onClick={async () => {
                                            if (!deviceInfo.serverUrl) {
                                                message.warning('请输入服务端地址');
                                                return;
                                            }
                                            await connector.agentRustStartLoop();
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        size="small"
                                    >
                                        {deviceInfo.ccAgentRustPid ? '重启' : '启动'}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>

                            <ProDescriptions.Item label="Version">
                                <ProField text={deviceInfo.agentRustVersion + ''} mode={'read'} />
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <Divider></Divider>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="Agent App" tooltip="主要适配未Root的设备">
                                <ProField
                                    text={deviceInfo.ccAgentAppInstalled + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '已安装', value: 'true' },
                                        { label: '未安装', value: 'false' }
                                    ]}
                                />

                                <View ml12 hide={!deviceInfo.ccAgentAppUploaded}>
                                    <Button
                                        onClick={async () => {
                                            const serverUrl = `http://${serverIp}:3101/static/assets`;
                                            await connector.agentRustDownload(
                                                `${serverUrl}/app.apk`,
                                                `app.apk`
                                            );
                                            if (deviceInfo.ccAgentAppInstalled) {
                                                await connector.deviceAdbShell(
                                                    'pm uninstall --user 0 com.cc.agent.adr'
                                                );
                                                await connector.deviceAdbShell(
                                                    'pm install -r /data/local/tmp/app.apk'
                                                );
                                            } else {
                                                await connector.deviceAdbShell(
                                                    'pm install -r /data/local/tmp/app.apk'
                                                );
                                            }

                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        size="small"
                                        type={!deviceInfo.ccAgentAppInstalled ? 'primary' : undefined}
                                    >
                                        {deviceInfo.ccAgentAppInstalled ? '重新安装' : '安装'}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                            <ProDescriptions.Item label="Running">
                                <ProField
                                    text={deviceInfo.ccAgentAppRunning + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '运行中', value: 'true' },
                                        { label: '未运行', value: 'false' }
                                    ]}
                                />

                                <View ml12 hide={!deviceInfo.ccAgentAppInstalled}>
                                    <Button
                                        onClick={async () => {
                                            if (deviceInfo.ccAgentAppRunning) {
                                                await connector.deviceAdbShell(
                                                    'am force-stop com.cc.agent.adr'
                                                );
                                                await connector.deviceAdbShell(
                                                    'am start -n com.cc.agent.adr/com.web3desk.adr.MainActivity'
                                                );
                                            } else {
                                                await connector.deviceAdbShell(
                                                    'am start -n com.cc.agent.adr/com.web3desk.adr.MainActivity'
                                                );
                                            }
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        type={!deviceInfo.ccAgentAppRunning ? 'primary' : undefined}
                                        size="small"
                                    >
                                        {deviceInfo.ccAgentAppRunning ? '重启' : '启动'}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <View h={16}></View>
                        <ProDescriptions column={2}>
                            <ProDescriptions.Item label="无障碍辅助">
                                <ProField
                                    text={deviceInfo.ccAgentAccessibility + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '已开启', value: 'true' },
                                        { label: '未开启', value: 'false' }
                                    ]}
                                />
                                <View ml12 hide={!deviceInfo.ccAgentAppRunning}>
                                    <Button
                                        onClick={async () => {
                                            new CCWSClient(deviceInfo.clientId + "-APP").sendAction(
                                                "jsonrpc",
                                                {
                                                    method:deviceInfo.ccAgentAccessibility ? "stopAccessibility":"startAccessibility"
                                                }
                                            )
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        type={!deviceInfo.ccAgentAppRunning ? 'primary' : undefined}
                                        size="small"
                                    >
                                        {deviceInfo.ccAgentAccessibility?"关闭":"开启"}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>

                            <ProDescriptions.Item label="屏幕录制">
                                <ProField
                                    text={deviceInfo.ccAgentMediaProjection + ''}
                                    mode={'read'}
                                    valueType="select"
                                    request={async () => [
                                        { label: '运行中', value: 'true' },
                                        { label: '未运行', value: 'false' }
                                    ]}
                                />
                                <View ml12 hide={!deviceInfo.ccAgentAppRunning}>
                                    <Button
                                        onClick={async () => {
                                            
                                            new CCWSClient(deviceInfo.clientId + "-APP").sendAction(
                                                "jsonrpc",
                                                {
                                                    method:deviceInfo.ccAgentMediaProjection ? "stopMediaProjection":"startMediaProjection"
                                                }
                                            )
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        type={!deviceInfo.ccAgentAppRunning ? 'primary' : undefined}
                                        size="small"
                                    >
                                        {deviceInfo.ccAgentMediaProjection?"关闭":"开启"}
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <Divider></Divider>
                        <ProDescriptions column={1}>
                            <ProDescriptions.Item
                                label="服务端地址"
                                
                            >
                                <ProField
                                    text={deviceInfo.serverUrl}
                                    mode={'read'}
                                />
                                
                                <View ml12 hide={deviceInfo.serverUrl === serverUrl}>
                                    <Button
                                        onClick={async () => {
                                            await connector.deviceAdbShell(
                                                `echo ${serverUrl} > /data/local/tmp/config_server.txt`
                                            );
                                            setTimeout(() => {
                                                fetchDeviceInfo();
                                            }, 1000);
                                        }}
                                        size="small"
                                    >
                                        修改
                                    </Button>
                                </View>
                            </ProDescriptions.Item>
                            <View hide={deviceInfo.serverUrl === serverUrl} color={deviceInfo.serverUrl !== serverUrl ? 'red' : 'green'}>
                                {serverUrl}
                            </View>
                        </ProDescriptions>
                    </View>
                </View>
            </View>
        </View>
    );
};
