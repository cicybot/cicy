import { ProDescriptions, ProField } from '@ant-design/pro-components';
import { Button, Drawer } from 'antd';
import View from '../View';
import { useEffect, useState } from 'react';
import { sleep, useTimeoutLoop } from '@cicy/utils';
import { onEvent } from '../../utils/utils';
import CCWSAgentClient from '../../services/cicy/CCWSAgentClient';
import { ClashConfigView } from './ClashConfigView';

export const VpnView = ({
    clientId,
    wsOnlineAgentApp
}: {
    wsOnlineAgentApp: boolean;
    clientId: string;
}) => {
    const [agentAppInfo, setAgentAppInfo] = useState<null | any>(null);
    const [clashConfig, setClashConfig] = useState<null | any>(null);
    const agent = new CCWSAgentClient(clientId);

    async function getAgentAppInfo() {
        const res = await agent.jsonrpcApp('agentAppInfo');
        setAgentAppInfo(res);
    }

    useEffect(() => {
        getAgentAppInfo().catch(console.error);
    }, []);
    useTimeoutLoop(async () => {
        await getAgentAppInfo();
    }, 1000);
    if (!agentAppInfo) {
        return null;
    }
    console.log({ agentAppInfo });
    const { isClashRunning } = agentAppInfo;
    return (
        <>
            <ProDescriptions column={1}>
                <ProDescriptions.Item label="Vpn">
                    <ProField
                        text={'' + isClashRunning}
                        mode={'read'}
                        valueType="select"
                        request={async () => [
                            { label: '已开启', value: 'true' },
                            { label: '未开启', value: 'false' }
                        ]}
                    />
                </ProDescriptions.Item>
                <View rowVCenter>
                    <View ml12>
                        <Button
                            onClick={async () => {
                                onEvent('showLoading');
                                if (isClashRunning) {
                                    await agent.jsonrpcApp('stopClash');
                                } else {
                                    await agent.jsonrpcApp('startClash');
                                }
                                onEvent('hideLoading');
                            }}
                            size="small"
                        >
                            {isClashRunning ? '停止' : '启动'}
                        </Button>
                    </View>
                    <View ml12 hide={!isClashRunning}>
                        <Button
                            onClick={async () => {
                                onEvent('showLoading');
                                await agent.jsonrpcApp('stopClash');
                                await sleep(1000);
                                await agent.jsonrpcApp('startClash');
                                onEvent('hideLoading');
                            }}
                            size="small"
                        >
                            重启
                        </Button>
                    </View>
                    <View ml12>
                        <Button
                            onClick={async () => {
                                onEvent('showLoading');
                                await agent.jsonrpcApp('updateClash');
                                onEvent('hideLoading');
                            }}
                            size="small"
                        >
                            更新配置
                        </Button>
                    </View>
                    <View ml12>
                        <Button
                            onClick={async () => {
                                onEvent('showLoading');
                                const res = await agent.jsonrpcApp('getClashConfig');
                                setClashConfig(res);
                                onEvent('hideLoading');
                            }}
                            size="small"
                        >
                            修改配置
                        </Button>
                    </View>
                </View>
            </ProDescriptions>
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
        </>
    );
};
