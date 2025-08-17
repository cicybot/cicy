import View from '../View';
import { useState } from 'react';
import { AdrDeviceInfo } from '../../services/model/AdrDeviceModel';
import { List, Switch } from 'antd-mobile';
import { SetOutline } from 'antd-mobile-icons';
import { useTimeoutLoop } from '@cicy/utils';
import { AdrUtils } from '../../services/common/AdrUtils';
import { Drawer } from 'antd';
import { hideLoading, showLoading } from '../../utils/utils';
import { ClashConfigView } from './ClashConfigView';
import Loading from '../UI/Loading';
export interface ClashConfig {
    accessControlMode: 'AcceptAll' | 'AcceptSelected' | 'DenySelected';
    accessControlPackages: string[];
    clashRunning: boolean;
    autoRestart: boolean;
    proxyPoolHost: string;
    proxyPoolPort: string;
    username: string;
    password: string;
    configYaml: string;
}
export const VpnView = ({ device }: { device: AdrDeviceInfo }) => {
    const packageName = 'com.cicy.agent.alpha';
    const activityName = 'com.github.kr328.clash.MainActivity';

    const installed = !!device.vpnAppInstalled;
    const vpnAppRunning = !!device.vpnAppRunning;
    const [editConfig, setEditConfig] = useState(false);
    const utils = new AdrUtils(true).setDevice(device);
    const [config, setConfig] = useState<null | ClashConfig>(null);
    const [showYaml, setShowYaml] = useState(false);
    useTimeoutLoop(async () => {
        const config = await utils.clashGetClashConfig();
        setConfig(config);
    }, 1000);
    if (!installed) {
        return <View></View>;
    }
    if (!vpnAppRunning) {
        return (
            <View>
                <List header="">
                    <List.Item
                        extra={
                            <View
                                onClick={async () => {
                                    showLoading();
                                    await utils.amStart(packageName, activityName);
                                    hideLoading();
                                }}
                            >
                                <Switch checked={false} />
                            </View>
                        }
                    >
                        Clash
                    </List.Item>
                </List>
            </View>
        );
    }
    if (!config) {
        return (
            <View wh100p center>
                <Loading />
            </View>
        );
    }
    return (
        <>
            <View absFull>
                <List>
                    <List.Item
                        extra={
                            <View
                                onClick={async () => {
                                    showLoading();
                                    await utils.amStop(packageName);
                                    hideLoading();
                                }}
                            >
                                <Switch checked={true} />
                            </View>
                        }
                    >
                        Clash
                    </List.Item>
                </List>
                <List>
                    <List.Item
                        extra={
                            <View
                                onClick={async () => {
                                    showLoading();
                                    if (config.clashRunning) {
                                        await utils.clashStop();
                                    } else {
                                        await utils.clashStart();
                                    }

                                    hideLoading();
                                }}
                            >
                                <Switch checked={config.clashRunning} />
                            </View>
                        }
                    >
                        {config.clashRunning ? '运行中' : '已停止'}
                    </List.Item>
                    <List.Item
                        onClick={async () => {
                            showLoading();
                            await utils.clashUpdate();
                            hideLoading();
                        }}
                    >
                        重置配置
                    </List.Item>
                    <List.Item
                        onClick={async () => {
                            setEditConfig(true);
                        }}
                    >
                        修改配置
                    </List.Item>
                </List>
                <List>
                    <List.Item
                        prefix={<SetOutline />}
                        onClick={() => {
                            setShowYaml(true);
                        }}
                    >
                        配置文件
                    </List.Item>
                </List>
                {/*<View json={config}></View>*/}
            </View>

            <Drawer
                width={'360px'}
                title={'配置文件'}
                closable={true}
                onClose={() => {
                    setShowYaml(false);
                }}
                open={showYaml}
            >
                <View p12 absFull top={64} overflowYAuto>
                    <pre>{config ? config.configYaml : ''}</pre>
                </View>
            </Drawer>

            <Drawer
                width={'360px'}
                title={'修改配置'}
                closable={true}
                onClose={() => {
                    setEditConfig(false);
                }}
                open={editConfig}
            >
                <View absFull top={64} overflowYAuto>
                    <ClashConfigView device={device} config={config} />
                </View>
            </Drawer>
        </>
    );
};
