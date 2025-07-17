import View from '../View';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import { Button, Divider, Drawer } from 'antd';
import { onEvent } from '../../utils/utils';
import { useEffect, useState } from 'react';
import { AppsView } from './apps/AppsView';

export const MobileInfoView = ({ agent }: { agent: CCAgentClient }) => {
    const agentAppInfo = agent.agentAppInfo();
    const keys = Object.keys(agentAppInfo);
    const keysFilter: string[] = [
        'ccAgentAccessibility',
        'ccAgentMediaProjection',
        'clientId',
        'ipAddress',
        'serverUrl'
    ];
    const [rustOnline, setRustOnline] = useState(false);
    const [appOnline, setAppOnline] = useState(false);
    const [chatOnline, setChatOnline] = useState(false);
    const [showApps, setShowApps] = useState(false);

    async function getOnline() {
        return agent.getClients().then(res => {
            const { clientId } = agentAppInfo;
            const { clients } = res;
            setRustOnline(clients.indexOf(clientId) > -1);
            setAppOnline(clients.indexOf(clientId + '-APP') > -1);
            setChatOnline(clients.indexOf(clientId + '-CHAT') > -1);
        });
    }

    useEffect(() => {
        getOnline();
    }, []);
    return (
        <View>
            <ProDescriptions column={1}>
                <ProDescriptions.Item label={'客户端ID'}>
                    <ProField text={agentAppInfo.clientId} mode="read" />
                </ProDescriptions.Item>
                <ProDescriptions.Item label={'服务端地址'}>
                    <ProField text={agentAppInfo.serverUrl} mode="read" />
                </ProDescriptions.Item>
                <ProDescriptions.Item label={'本机IP'}>
                    <ProField text={agentAppInfo.ipAddress} mode="read" />
                </ProDescriptions.Item>
            </ProDescriptions>
            <Divider />
            <ProDescriptions column={2}>
                <ProDescriptions.Item label={'无障碍'}>
                    <ProField text={agentAppInfo.ccAgentAccessibility + ''} mode="read" />
                </ProDescriptions.Item>

                <ProDescriptions.Item label={'屏幕录制'}>
                    <ProField text={agentAppInfo.ccAgentMediaProjection + ''} mode="read" />
                </ProDescriptions.Item>
            </ProDescriptions>
            <Divider />
            <View rowVCenter mt12>
                <View mr12 hide={!agentAppInfo.ccAgentAppInstalled}>
                    <Button
                        onClick={async () => {
                            setShowApps(true);
                        }}
                        size="small"
                    >
                        所有App
                    </Button>
                </View>
                <View mr12 hide={agentAppInfo.ccAgentMediaProjection}>
                    <Button
                        onClick={async () => {
                            onEvent('showLoading');
                            await agent.startMediaProjection();
                            onEvent('hideLoading');
                        }}
                        size="small"
                    >
                        开启录制
                    </Button>
                </View>
                <View mr12 hide={agentAppInfo.ccAgentAccessibility}>
                    <Button
                        onClick={async () => {
                            onEvent('showLoading');
                            await agent.startAccessibility();
                            onEvent('hideLoading');
                        }}
                        size="small"
                    >
                        开启无障碍
                    </Button>
                </View>
            </View>
            <Divider />
            <ProDescriptions column={3}>
                <ProDescriptions.Item label={'Rust'}>
                    <ProField text={'' + rustOnline} mode="read" />
                </ProDescriptions.Item>
                <ProDescriptions.Item label={'App'}>
                    <ProField text={'' + appOnline} mode="read" />
                </ProDescriptions.Item>
                <ProDescriptions.Item label={'Chat'}>
                    <ProField text={'' + chatOnline} mode="read" />
                </ProDescriptions.Item>
            </ProDescriptions>
            <Divider />
            <ProDescriptions column={2}>
                {keys
                    .filter(key => !keysFilter.includes(key))
                    .map((key: string) => {
                        //@ts-ignore
                        const text = deviceInfo[key];
                        return (
                            <ProDescriptions.Item key={key} label={key.replace('ccAgent', '')}>
                                <ProField text={text + ''} mode="read" />
                            </ProDescriptions.Item>
                        );
                    })}
            </ProDescriptions>
            <Drawer
                width={'360px'}
                title={'Apps'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setShowApps(false);
                }}
                open={showApps}
            >
                {showApps && <AppsView agent={agent} />}
            </Drawer>
        </View>
    );
};
