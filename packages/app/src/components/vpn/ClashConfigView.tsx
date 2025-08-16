import View from '../View';
import { Button, Form, Input, List, Selector } from 'antd-mobile';
import ProxyService from '../../services/common/ProxyService';
import { AppsView } from '../adr-detail/apps/AppsView';
import { Drawer, message } from 'antd';
import { useState } from 'react';
import CCWSAgentClient from '../../services/cicy/CCWSAgentClient';
import { onEvent } from '../../utils/utils';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import { ClashConfig } from './VpnView';
import * as util from 'node:util';
import { AdrUtils } from '../../services/common/AdrUtils';

export const ClashConfigView = ({
    config,
    device
}: {
    config: ClashConfig;
    device: AdrDeviceInfo;
}) => {
    const [showApps, setShowApps] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const utils = new AdrUtils(true).setDevice(device);
    const {
        accessControlMode,
        accessControlPackages: accessControlPackages_,
        proxyPoolHost,
        proxyPoolPort,
        username
    } = config;

    const [accessControlPackages, setAccessControlPackages] = useState(accessControlPackages_);

    return (
        <View>
            <Form
                footer={
                    <Button type={'submit'} block color="primary">
                        保存
                    </Button>
                }
                onFinish={async values => {
                    const { accessControlMode, username, proxyPoolHost, proxyPoolPort } = values;
                    if (proxyPoolHost === '127.0.0.1') {
                        message.error('代理主不能为127.0.0.1');
                        return;
                    }
                    if (!proxyPoolPort) {
                        message.error('代理主机端口不能为空');
                        return;
                    }

                    if (!username || !username.startsWith('user_')) {
                        message.error('用户名不能为空，并且需以user_开头');
                        return;
                    }
                    onEvent('showLoading');
                    await utils.clashStop();
                    await utils.clashEditClashProxyConfig(
                        proxyPoolHost,
                        proxyPoolPort,
                        username,
                        ProxyService.getUserPwd(),
                        accessControlMode ? accessControlMode[0] : 'AcceptAll',
                        accessControlPackages
                    );
                    await utils.clashStart();
                    onEvent('hideLoading');
                }}
                initialValues={{
                    password: ProxyService.getUserPwd(),
                    username: `user_${AdrDeviceModel.getForwardPortById(device.id)}`,
                    proxyPoolHost,
                    accessControlMode,
                    proxyPoolPort
                }}
                layout="horizontal"
                mode="card"
            >
                <Form.Item
                    label="代理主机"
                    name="proxyPoolHost"
                    help={'为局域网代理主机IP地址，不可为:127.0.0.1'}
                >
                    <Input
                        value={proxyPoolHost}
                        style={{ '--text-align': 'right' }}
                        placeholder="请输入代理主机IP地址"
                        clearable
                    />
                </Form.Item>
                <Form.Item
                    label="代理端口"
                    name="proxyPoolPort"
                    help={`代理池端口:${ProxyService.getProxyPort()},中间人代理端口:${ProxyService.getProxyMitmPort()}`}
                >
                    <Input
                        value={proxyPoolPort}
                        style={{ '--text-align': 'right' }}
                        placeholder="请输入代理主机端口"
                        clearable
                        type="text"
                    />
                </Form.Item>

                <Form.Item
                    help="用户名用于代理池入站路由节点,格式以'user_'开头',如:user_10000"
                    label="用户名"
                    name="username"
                >
                    <Input
                        readOnly
                        style={{ '--text-align': 'right' }}
                        value={username}
                        placeholder="请输入用户名"
                        clearable
                        type="text"
                    />
                </Form.Item>
                <Form.Item
                    label="密码"
                    name="password"
                    help={"密码固定为'" + ProxyService.getUserPwd() + "'"}
                >
                    <Input
                        readOnly
                        style={{ '--text-align': 'right' }}
                        placeholder="请输入密码"
                        clearable
                        type="text"
                    />
                </Form.Item>

                <Form.Item label="应用控制"></Form.Item>
                <Form.Item
                    name="accessControlMode"
                    label=""
                    style={{
                        flexDirection: 'column'
                    }}
                >
                    <Selector
                        columns={3}
                        options={[
                            { label: '全部', value: 'AcceptAll' },
                            { label: '允许应用', value: 'AcceptSelected' },
                            { label: '拒绝应用', value: 'DenySelected' }
                        ]}
                    />
                </Form.Item>
                <List header="">
                    <List.Item
                        extra={accessControlPackages.length}
                        onClick={() => {
                            setShowApps(true);
                        }}
                    >
                        应用清单
                    </List.Item>
                </List>
            </Form>
            <View h={8}></View>
            <Drawer
                width={'360px'}
                title={`Apps (${accessControlPackages.length})`}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setShowApps(false);
                }}
                open={showApps}
            >
                {showApps && (
                    <AppsView
                        device={device}
                        setAccessControlPackages={v => {
                            setAccessControlPackages(v);
                        }}
                        accessControlPackages={accessControlPackages}
                    />
                )}
            </Drawer>
        </View>
    );
};
