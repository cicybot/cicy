import View from '../View';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';
import { Drawer } from 'antd';
import { useEffect, useState } from 'react';
import { AppsView } from './apps/AppsView';
import { List, Switch } from 'antd-mobile';
import { useTimeoutLoop } from '@cicy/utils';
import { ClashConfigView } from '../vpn/ClashConfigView';
import { onEvent } from '../../utils/utils';

export const MobileInfoView = ({ agent }: { agent: CCAgentClient }) => {
    const [agentAppInfo, setAgentAppInfo] = useState<any>(agent.agentAppInfo());

    const [showApps, setShowApps] = useState(false);
    const [clashConfig, setClashConfig] = useState<null | any>(null);
    const getAgentAppInfo = async () => {
        const res = await agent.getAgentAppInfo();
        setAgentAppInfo(res);
    };
    useEffect(() => {
        getAgentAppInfo().catch(console.error);
    }, []);
    useTimeoutLoop(async () => {
        await getAgentAppInfo();
    }, 1000);
    return (
        <View px12 pt12>
            <List header="基础信息">
                <List.Item extra={agentAppInfo.clientId}>客户端ID</List.Item>
                <List.Item extra={agentAppInfo.ipAddress}>本机IP</List.Item>
                <List.Item extra={agentAppInfo.serverUrl}>服务端地址</List.Item>
            </List>
            <List header="权限">
                <List.Item
                    extra={
                        <Switch
                            onChange={v => {
                                if (!agentAppInfo.inputIsReady) {
                                    agent.jsonrpcApp('onStartInput');
                                }
                            }}
                            checked={agentAppInfo.inputIsReady}
                        />
                    }
                >
                    无障碍辅助
                </List.Item>
                <List.Item extra={<Switch checked={agentAppInfo.recordingIsReady} />}>
                    屏幕录制
                </List.Item>
            </List>

            <List header="Clash">
                <List.Item
                    extra={
                        <Switch
                            onChange={async _ => {
                                onEvent('showLoading');
                                if (!agentAppInfo.isClashRunning) {
                                    await agent.jsonrpcApp('startClash');
                                } else {
                                    await agent.jsonrpcApp('stopClash');
                                }
                                onEvent('hideLoading');
                            }}
                            checked={agentAppInfo.isClashRunning}
                        />
                    }
                >
                    开启状态
                </List.Item>
                <List.Item
                    clickable
                    onClick={async () => {
                        onEvent('showLoading');
                        await agent.jsonrpcApp('updateClash');
                        onEvent('hideLoading');
                    }}
                >
                    更新配置
                </List.Item>
                <List.Item
                    clickable
                    onClick={async () => {
                        const res = await agent.jsonrpcApp('getClashConfig');
                        setClashConfig(res);
                    }}
                >
                    修改配置
                </List.Item>
            </List>

            <List header="Apps">
                <List.Item
                    clickable
                    onClick={() => {
                        setShowApps(true);
                    }}
                >
                    App列表
                </List.Item>
            </List>

            <Drawer
                width={'360px'}
                title={'Apps'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setShowApps(false);
                }}
                open={showApps}
            >
                {showApps && (
                    <AppsView
                        accessControlPackages={[]}
                        setAccessControlPackages={() => {}}
                        agent={agent}
                    />
                )}
            </Drawer>
            <Drawer
                width={'360px'}
                title={'Clash'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setClashConfig(null);
                }}
                open={!!clashConfig}
            >
                {clashConfig && (
                    <ClashConfigView
                        setClashConfig={(c: any) => {
                            setClashConfig(c);
                        }}
                        agentAppInfo={agentAppInfo}
                        clashConfig={clashConfig}
                    />
                )}
            </Drawer>
        </View>
    );
};
