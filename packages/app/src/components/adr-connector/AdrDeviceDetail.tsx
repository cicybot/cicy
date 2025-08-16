import View from '../View';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import { Button, Button as MobileButton, Form, Input, List } from 'antd-mobile';
import Block from '../View/Block';
import { hideLoading, showLoading } from '../../utils/utils';
import { message } from 'antd';
import { SetOutline, UnorderedListOutline } from 'antd-mobile-icons';
import { CloseIcon } from '../UI/CloseIcon';
import { useState } from 'react';
import { BackIcon } from '../UI/BackIcon';
import { AdrUtils } from '../../services/common/AdrUtils';
import ScreenInspector from '../adr-detail/screen/ScreenInspector';
import { VpnView } from '../vpn/VpnView';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import * as util from 'node:util';

export enum PageNav {
    Home,
    Inspect,
    Setting,
    Access,
    PortChange,
    Apps,
    Vpn,
    DebugInfo
}
const AdrDeviceDetail = ({
    saveDevice,
    showInspect,
    onClose,
    updateDevices,
    device,
    setCurrentDevice,
    showTop
}: {
    showInspect?: boolean;
    onClose?: () => Promise<void>;
    showTop?: boolean;
    saveDevice: (device: AdrDeviceInfo) => Promise<void>;
    setCurrentDevice?: (device: AdrDeviceInfo | null) => void;
    device: AdrDeviceInfo;
    updateDevices: () => void;
}) => {
    const adrUtils = new AdrUtils(true);
    adrUtils.setDevice(device);
    const [pageNav, setPageNav] = useState<PageNav>(PageNav.Home);
    const [apps, setApps] = useState<{ name: string; packageName: string; type: string }[]>([]);
    const titles = {
        [PageNav.Home]: '',
        [PageNav.Setting]: '设置',
        [PageNav.Inspect]: '调试节点',
        [PageNav.Access]: '访问地址',
        [PageNav.PortChange]: '端口修改',
        [PageNav.Apps]: '安装程序',
        [PageNav.Vpn]: '代理',
        [PageNav.DebugInfo]: 'Debug'
    };
    return (
        <View absFull>
            <View abs xx0 top0 h={44} borderBottomColor={'#e9e9e9'} userSelectNone>
                {pageNav !== PageNav.Home && (
                    <BackIcon
                        props={{
                            top: 0,
                            wh: 44,
                            left: 0
                        }}
                        fontSize={16}
                        onClick={async () => {
                            window.dispatchEvent(
                                new CustomEvent('onScreenAction', {
                                    detail: {
                                        action: 'resumeMouse'
                                    }
                                })
                            );
                            document.getElementById(`inspect_node_${device.id}`)!.style.display =
                                'none';
                            setPageNav(PageNav.Home);
                        }}
                    />
                )}

                <View ml={pageNav !== PageNav.Home ? 44 : 12} h100p rowVCenter fontSize={18}>
                    {titles[pageNav]}
                </View>
                {pageNav === PageNav.Home && (
                    <CloseIcon
                        props={{
                            top: 0,
                            wh: 44,
                            right: 0
                        }}
                        onClick={async () => {
                            if (onClose) {
                                await onClose();
                            } else {
                                setCurrentDevice && setCurrentDevice(null);
                            }
                        }}
                    />
                )}
            </View>

            <View overflowYAuto wh100p absFull top={showTop ? 44 : undefined}>
                {pageNav === PageNav.Home && (
                    <List>
                        <List.Item
                            prefix={<SetOutline />}
                            onClick={() => {
                                setPageNav(PageNav.Setting);
                            }}
                        >
                            设置
                        </List.Item>
                        {showInspect && (
                            <List.Item
                                prefix={<UnorderedListOutline />}
                                onClick={() => {
                                    window.dispatchEvent(
                                        new CustomEvent('onScreenAction', {
                                            detail: {
                                                action: 'stopMouse'
                                            }
                                        })
                                    );
                                    setPageNav(PageNav.Inspect);
                                }}
                            >
                                调试节点
                            </List.Item>
                        )}

                        <List.Item
                            prefix={<SetOutline />}
                            onClick={() => {
                                setPageNav(PageNav.Vpn);
                            }}
                        >
                            代理
                        </List.Item>

                        <List.Item
                            prefix={<SetOutline />}
                            onClick={() => {
                                setPageNav(PageNav.Access);
                            }}
                        >
                            访问地址
                        </List.Item>

                        <List.Item
                            prefix={<SetOutline />}
                            onClick={() => {
                                setPageNav(PageNav.PortChange);
                            }}
                        >
                            端口修改
                        </List.Item>
                        <List.Item
                            prefix={<SetOutline />}
                            onClick={() => {
                                adrUtils.getAppsList().then(apps => {
                                    setApps(apps);
                                });
                                setPageNav(PageNav.Apps);
                            }}
                        >
                            安装程序
                        </List.Item>
                        <List.Item
                            prefix={<SetOutline />}
                            onClick={() => {
                                setPageNav(PageNav.DebugInfo);
                            }}
                        >
                            Debug Info
                        </List.Item>
                    </List>
                )}
                {pageNav === PageNav.Setting && (
                    <>
                        <List header="基础信息">
                            <List.Item extra={device.sn}>序列号</List.Item>
                            <List.Item extra={device.brand}>品牌</List.Item>
                            <List.Item extra={device.model}>型号</List.Item>
                            <List.Item extra={device.sdkVersion}>SDK</List.Item>
                            <List.Item extra={device.releaseVersion}>发布版本</List.Item>
                            <List.Item extra={device.abilist}>CPU</List.Item>
                            <List.Item extra={device.ports.join(',')}>端口</List.Item>
                            <List.Item extra={device.userRotation}>屏幕</List.Item>
                        </List>
                        <List header="Api">
                            <List.Item
                                prefix={<SetOutline />}
                                onClick={() => {
                                    setPageNav(PageNav.Setting);
                                    new BackgroundApi().openUrl(adrUtils.getSwagger());
                                }}
                            >
                                Swagger
                            </List.Item>
                        </List>
                    </>
                )}

                {pageNav === PageNav.Apps && (
                    <List header="">
                        {apps.map(app => {
                            return (
                                <List.Item key={app.packageName} extra={app.packageName}>
                                    {app.type} {app.name}
                                </List.Item>
                            );
                        })}
                    </List>
                )}
                {pageNav === PageNav.Access && (
                    <>
                        <Block title={'访问地址'}>
                            <Form
                                layout="horizontal"
                                onFinish={values => {
                                    showLoading();
                                    const newDevice = {
                                        ...device,
                                        ...values
                                    };
                                    adrUtils.setDevice(newDevice);
                                    saveDevice(newDevice)
                                        .catch(console.error)
                                        .finally(() => hideLoading());
                                }}
                                initialValues={{
                                    accessIp: device.accessIp || '',
                                    accessPort: device.accessPort || ''
                                }}
                                footer={
                                    <MobileButton block type="submit" color="primary">
                                        提交
                                    </MobileButton>
                                }
                            >
                                <Form.Item label="访问IP" name="accessIp">
                                    <Input placeholder="请输入访问IP" clearable />
                                </Form.Item>
                                <Form.Item label="访问端口" name="accessPort">
                                    <Input type={'number'} placeholder="请输入访问端口" clearable />
                                </Form.Item>
                            </Form>
                        </Block>
                        <Block title={'IP地址'}>
                            <List header="">
                                {device.netIps.map((ip: string) => {
                                    return <List.Item key={ip}>{ip}</List.Item>;
                                })}
                            </List>
                        </Block>
                    </>
                )}
                {pageNav === PageNav.PortChange && (
                    <Block title={'修改端口'}>
                        <Form
                            initialValues={{
                                port: AdrDeviceModel.getForwardPortById(device.id)
                            }}
                            name="form_port"
                            onFinish={async values => {
                                const { port } = values;
                                if (
                                    parseInt(port) === AdrDeviceModel.getForwardPortById(device.id)
                                ) {
                                    message.error('端口未修改!');
                                    return;
                                }
                                showLoading();
                                try {
                                    await new AdrDeviceModel(device.deviceId).updatePort(
                                        parseInt(port)
                                    );
                                    updateDevices();
                                    message.success('修改成功!');
                                } catch (e) {
                                    message.error('修改失败: ' + e);
                                } finally {
                                    hideLoading();
                                }
                            }}
                            footer={
                                <Button block type="submit" color="primary">
                                    修改
                                </Button>
                            }
                        >
                            <Form.Item
                                name="port"
                                label="端口"
                                help="请输入10000-29999范围内的未占用的端口"
                            >
                                <Input
                                    type={'number'}
                                    min={10000}
                                    max={29999}
                                    placeholder="请输入端口"
                                />
                            </Form.Item>
                        </Form>
                    </Block>
                )}
                {pageNav === PageNav.DebugInfo && (
                    <Block>
                        <View px12 json={device}></View>
                    </Block>
                )}

                {pageNav === PageNav.Vpn && <VpnView device={device} />}

                {pageNav === PageNav.Inspect && <ScreenInspector device={device} />}
            </View>
        </View>
    );
};

export default AdrDeviceDetail;
