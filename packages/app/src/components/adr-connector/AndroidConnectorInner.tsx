import View from '../View';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { Drawer, message, Tabs, type TabsProps } from 'antd';

import styled from 'styled-components';
import { AndroidLocal } from './AndroidLocal';
import AdrDevicesTable from './AdrDevicesTable';
import { useEffect, useState } from 'react';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/cicy/CCAndroidConnectorClient';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import { hideLoading, onEvent, showLoading } from '../../utils/utils';
import BrowserService from '../../services/cicy/BrowserService';
import { AdrUtils } from '../../services/common/AdrUtils';
import { useTimeoutLoop } from '@cicy/utils';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import AdrDeviceDetail from './AdrDeviceDetail';
import MirrorItem from './MirrorItem';
import { CloseIcon } from '../UI/CloseIcon';

const StyledTabs = styled(Tabs)`
    .ant-tabs-content.ant-tabs-content-top {
        position: absolute;
        top: 44px;
        left: 0;
        right: 0;
        bottom: 0;
    }
`;

export const AndroidConnectorInner = () => {
    const [forwardPorts, setForwardPorts] = useState<number[]>([]);
    const [devices, setDevices] = useState<Map<string, AdbDevice>>(new Map());
    const connector = new CCAndroidConnectorClient();
    const { appInfo } = useMainWindowContext();
    const [currentDevice, setCurrentDevice_] = useState<null | AdrDeviceInfo>(null);
    const [currentFullscreenDevice, setCurrentFullscreenDevice_] = useState<null | AdrDeviceInfo>(
        null
    );
    const setCurrentDevice = (device: null | AdrDeviceInfo) => {
        if (device) {
            new AdrUtils(true)
                .setDevice(device)
                .getDeviceInfo()
                .then(res => {
                    if (!res) {
                        setCurrentDevice_(device);
                    } else {
                        const deviceNew = {
                            ...device,
                            ...res
                        };
                        setCurrentDevice_(deviceNew);
                        saveDevice(deviceNew).then(updateDevices);
                    }
                });
        } else {
            setCurrentDevice_(device);
        }
    };

    const setCurrentFullscreenDevice = (device: null | AdrDeviceInfo) => {
        setCurrentFullscreenDevice_(device);
        if (device) {
            new AdrUtils(true)
                .setDevice(device)
                .getDeviceInfo()
                .then(res => {
                    if (!res) {
                        setCurrentDevice_(device);
                    } else {
                        const deviceNew = {
                            ...device,
                            ...res
                        };
                        setCurrentDevice_(deviceNew);
                        saveDevice(deviceNew).then(updateDevices);
                    }
                });
        } else {
            setCurrentFullscreenDevice_(device);
        }
    };
    const [adrDevice, setAdrDevice] = useState<Map<string, AdrDeviceInfo>>(new Map());
    const [connectClientId, setConnectClientId] = useState('');
    const openAdr = async (device: AdrDeviceInfo) => {
        showLoading();
        let screenSize = await new AdrUtils(true).setId(device.id).getScreenSize();
        if (!screenSize) {
            screenSize = await new AdrUtils(true).setDevice(device).getScreenSize();
            if (!screenSize) {
                message.error('设备Agent未运行');
                hideLoading();
                return;
            }
        }
        try {
            const { width, height } = screenSize;
            const size = AdrUtils.getWindowSize(width, height, appInfo.isWin);
            const url = location.href.replace(
                '#/android',
                `#/android/detail/${device.deviceId}/${size.width}`
            );
            await new BrowserService(url).openWindow({
                noWebview: true,
                windowOptions: {
                    ...size
                }
            });
        } catch (e) {
            console.error(e);
            message.error('打开失败: ' + e);
        } finally {
            hideLoading();
        }
    };

    const onConnect = async (sn: string) => {
        if (!connectClientId) {
            return;
        }
        onEvent('showLoading');
        connector.setClientId(connectClientId);
        connector.setSn(sn);
        try {
            let deviceInfo = await connector.handleDeviceInfo();
            const { publicDir, pathSep } = appInfo;
            const assetDir = `${publicDir}${pathSep}static${pathSep}assets`;
            let flag = false;
            if (!deviceInfo.agentAppApkExists) {
                const apk = `${assetDir}${pathSep}agent.apk`;
                await connector.deviceAdbPush(apk, '/sdcard/Download/cicy/agent.apk');
                flag = true;
            }
            if (!deviceInfo.vpnAppApkExists) {
                const { abi } = deviceInfo;
                let apk = '';
                switch (abi) {
                    case 'x86_64':
                        apk = `${assetDir}${pathSep}cmfa-2.11.14-alpha-x86_64-release.apk`;
                        break;
                    case 'arm64-v8a':
                        apk = `${assetDir}${pathSep}cmfa-2.11.14-alpha-arm64-v8a-release.apk`;
                        break;
                    case 'armeabi-v7a':
                        apk = `${assetDir}${pathSep}cmfa-2.11.14-alpha-armeabi-v7a-release.apk`;
                        break;
                }
                if (apk) {
                    await connector.deviceAdbPush(apk, '/sdcard/Download/cicy/vpn.apk');
                    flag = true;
                }
            }
            if (flag) {
                deviceInfo = await connector.getDeviceInfo();
            }

            const { deviceId } = deviceInfo;
            setAdrDevice(adrDevice);
            const adrDeviceModel = new AdrDeviceModel(deviceId);

            const row = await adrDeviceModel.get();
            let id = 0;

            if (!row) {
                id = await adrDeviceModel.add({
                    ...deviceInfo,
                    sn: sn
                });
                adrDevice.set(sn, { ...deviceInfo, sn: sn, id });
            } else {
                const newDevice = {
                    ...row.info,
                    ...deviceInfo,
                    sn: sn
                };
                await adrDeviceModel.save(newDevice);
                id = row.id!;
                adrDevice.set(sn, { ...newDevice, sn: sn, id });
            }

            if (1 || !deviceInfo.ports.includes(9010) || !deviceInfo.ports.includes(9008)) {
                await connector.deviceAdbPush(
                    '/Users/ton/Desktop/projects/cicy/apps/desktop/public/static/scrcpy/u2.jar',
                    '/data/local/tmp'
                );
                await connector.deviceAdbPush(
                    '/Users/ton/Desktop/projects/cicy/apps/desktop/public/static/scrcpy/win32/scrcpy-server',
                    '/data/local/tmp/scrcpy-server.jar'
                );
                await connector.deviceAdbShell(
                    'CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / com.genymobile.scrcpy.Server 3.3.1 boot=true port=9010'
                );
            }

            await connector.deviceAdbForward(AdrDeviceModel.getForwardPortById(id), 9010);

            message.success('连接成功!');
        } catch (e) {
            // @ts-ignore
            message.error(e.message);
        }

        onEvent('hideLoading');
    };

    function updateDevices() {
        AdrDeviceModel.getAll().then(res => {
            for (const resKey in res) {
                const row = res[resKey];
                adrDevice.set(row.info.sn, {
                    ...row.info,
                    id: row.id!
                });
            }
            setAdrDevice(adrDevice);
        });
    }

    async function saveDevice(device: AdrDeviceInfo) {
        await new AdrDeviceModel(device.deviceId).save(device);
        adrDevice.set(device.sn, device);
        setAdrDevice(adrDevice);
    }

    useEffect(() => {
        updateDevices();
    }, []);

    useTimeoutLoop(async () => {
        try {
            const { clientId } = await new BackgroundApi().currentConnectorClientId();
            if (clientId) {
                setConnectClientId(clientId);
                connector.setClientId(clientId);

                const devices = await connector.getDeviceList();
                const forwardPorts = await connector.getForwardPorts();
                setForwardPorts(forwardPorts);
                const devicesMap: Map<string, AdbDevice> = new Map();
                for (const devicesKey in devices) {
                    const device = devices[devicesKey];
                    const deviceInfo = adrDevice.get(device.sn);
                    if (deviceInfo) {
                        if (
                            !forwardPorts.includes(AdrDeviceModel.getForwardPortById(deviceInfo.id))
                        ) {
                            connector.setSn(deviceInfo.sn);
                            await connector.deviceAdbForward(
                                AdrDeviceModel.getForwardPortById(deviceInfo.id),
                                9010
                            );
                        }
                    }
                    devicesMap.set(device.sn, device);
                }
                setDevices(devicesMap);
            }
        } catch (error) {
            console.error(error);
        }
    }, 1000);
    const items: TabsProps['items'] = [
        {
            key: 'all',
            label: '所有',
            children: (
                <View absFull p12>
                    <AdrDevicesTable
                        {...{
                            adrDevice,
                            setCurrentFullscreenDevice,
                            setCurrentDevice,
                            forwardPorts,
                            openAdr,
                            onConnect,
                            devices
                        }}
                    />
                </View>
            )
        },
        {
            key: 'local',
            label: '本地',
            children: (
                <View absFull p12>
                    <AndroidLocal {...{ adrDevice, forwardPorts, openAdr, onConnect, devices }} />
                </View>
            )
        },
        {
            key: 'cloud',
            label: '云手机',
            children: (
                <View absFull p12>
                    云手机
                </View>
            )
        }
    ];
    return (
        <AndroidConnectorPage>
            {!currentFullscreenDevice && (
                <View borderBox wh100p relative px12 overflowHidden>
                    <StyledTabs defaultActiveKey="all" items={items} onChange={key => {}} />
                </View>
            )}

            {currentFullscreenDevice && (
                <View
                    fixed
                    abs
                    top0
                    left0
                    bottom0
                    w={currentDevice ? 320 : undefined}
                    right={currentDevice ? undefined : 0}
                    zIdx={100}
                    bgColor={'#999'}
                >
                    {!currentDevice && (
                        <CloseIcon
                            props={{
                                top: 12,
                                left: 24,
                                wh: 44
                            }}
                            fontSize={24}
                            onClick={() => {
                                setCurrentFullscreenDevice(null);
                                setCurrentDevice(null);
                            }}
                        />
                    )}
                    <View wh100p center={currentDevice ? undefined : true} overflowYAuto>
                        <MirrorItem
                            isMax={true}
                            httpShortDelayMs={10}
                            setCurrentFullscreenDevice={setCurrentFullscreenDevice}
                            openAdr={openAdr}
                            setCurrentDevice={async (device: AdrDeviceInfo) =>
                                setCurrentDevice(device)
                            }
                            width={320}
                            device={currentFullscreenDevice}
                        />
                    </View>
                </View>
            )}

            {!currentFullscreenDevice && (
                <Drawer
                    width={360}
                    headerStyle={{ display: 'none' }}
                    title={currentDevice?.brand}
                    open={!!currentDevice}
                >
                    <View wh100p overflowHidden bgColor={'#f5f5f5'} relative>
                        {currentDevice && (
                            <AdrDeviceDetail
                                onClose={async () => {
                                    setCurrentDevice(null);
                                }}
                                showTop={true}
                                updateDevices={() => {
                                    setCurrentDevice(null);
                                    updateDevices();
                                }}
                                saveDevice={saveDevice}
                                device={currentDevice}
                            />
                        )}
                    </View>
                </Drawer>
            )}
            {Boolean(currentFullscreenDevice && currentDevice) && (
                <View fixed top0 bottom0 right0 left={320} bgColor={'#f5f5f5'}>
                    <View absFull top={0}>
                        <AdrDeviceDetail
                            showTop
                            showInspect
                            setCurrentDevice={(d: null | AdrDeviceInfo) => setCurrentDevice(d)}
                            updateDevices={() => {
                                setCurrentDevice(null);
                                updateDevices();
                            }}
                            saveDevice={saveDevice}
                            device={currentDevice!}
                        />
                    </View>
                </View>
            )}
        </AndroidConnectorPage>
    );
};
