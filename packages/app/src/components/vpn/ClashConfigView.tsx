import View from '../View';
import { Button, Form, Input, List, Selector } from 'antd-mobile';
import ProxyService from '../../services/common/ProxyService';
import { AppsView } from '../adr-detail/apps/AppsView';
import { Drawer, message } from 'antd';
import { useState } from 'react';
import CCWSAgentClient from '../../services/cicy/CCWSAgentClient';
import { onEvent } from '../../utils/utils';

export const ClashConfigView = ({
    agentAppInfo,
    clashConfig,
    setClashConfig
}: {
    setClashConfig: (v: any) => void;
    clashConfig: any;
    agentAppInfo: any;
}) => {
    const [showApps, setShowApps] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    const agent = new CCWSAgentClient(agentAppInfo.clientId);
    const {
        accessControlMode,
        accessControlPackages: accessControlPackages1,
        proxyPoolHost,
        proxyPoolPort,
        username
    } = clashConfig;
    const [accessControlPackages, setAccessControlPackages] = useState(
        JSON.parse(accessControlPackages1 || '[]')
    );
    return (
        <View px={8}>
            <View h={8}></View>
            <Form
                footer={
                    <Button type={'submit'} block color="primary">
                        保存
                    </Button>
                }
                onFinish={async values => {
                    const { accessControlMode, proxyPoolHost, proxyPoolPort } = values;
                    if (!proxyPoolHost || proxyPoolHost === '127.0.0.1') {
                        message.error('代理主机不能为空并且不能为127.0.0.1');
                        return;
                    }
                    if (!proxyPoolPort) {
                        message.error('代理主机端口不能为空');
                        return;
                    }

                    if (!username || !username.startsWith('Account_')) {
                        message.error('用户名不能为空，并且需以Account_开头');
                        return;
                    }
                    onEvent('showLoading');
                    await agent.jsonrpcApp('stopClash', []);
                    await agent.jsonrpcApp('editClashProxyConfig', [
                        proxyPoolHost,
                        proxyPoolPort,
                        username,
                        'pwd'
                    ]);

                    await agent.jsonrpcApp('setAccessControlMode', [
                        accessControlMode ? accessControlMode[0] : 'AcceptAll'
                    ]);
                    await agent.jsonrpcApp('setAccessControlPackages', [accessControlPackages]);
                    await agent.jsonrpcApp('startClash', []);
                    onEvent('hideLoading');
                }}
                initialValues={{
                    password: 'pwd',
                    username,
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
                    help="用户名用于代理池入站路由节点,格式以'Account_'开头',如:Account_10000"
                    label="用户名"
                    name="username"
                >
                    <Input
                        style={{ '--text-align': 'right' }}
                        value={username}
                        placeholder="请输入用户名"
                        clearable
                        type="text"
                    />
                </Form.Item>
                <Form.Item label="密码" name="password" help={"密码固定为'pwd'"}>
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
                    <List.Item
                        onClick={async () => {
                            const res = await agent.jsonrpcApp('getClashConfig');
                            setClashConfig(res);
                            setShowConfig(true);
                        }}
                    >
                        配置文件
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
                        setAccessControlPackages={v => {
                            setAccessControlPackages(v);
                        }}
                        accessControlPackages={accessControlPackages}
                        agent={agent}
                    />
                )}
            </Drawer>
            <Drawer
                width={'360px'}
                title={`Config`}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setShowConfig(false);
                }}
                open={showConfig}
            >
                {showConfig && (
                    <View p12>
                        <pre>{clashConfig.configYaml}</pre>
                    </View>
                )}
            </Drawer>
        </View>
    );
};
