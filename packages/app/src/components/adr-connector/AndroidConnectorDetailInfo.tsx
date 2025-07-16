import View from '../View';
import { useEffect, useState } from 'react';
import { AndroidIcon } from '../Icons';
import { useTimeoutLoop } from '@cicy/utils';
import CCAndroidConnectorClient from '../../services/cicy/CCAndroidConnectorClient';
import type { DeviceInfo } from '../../services/cicy/CCWSAgentClient';
import Loading from '../UI/Loading';
import { UploadAgentButton } from './UploadAgentButton';
import { diffObj } from '../../utils/utils';
import { CCWSMainWindowClient } from '../../services/cicy/CCWSMainWindowClient';
import { DeviceInfoView } from './DeviceInfoView';

export const AndroidConnectorDetailInfo = ({
    connector,
    clients,
    allClients
}: {
    allClients: string[];
    clients: any[];
    connector: CCAndroidConnectorClient;
}) => {
    const [err, setErr] = useState('');

    const [appInfo, setAppInfo] = useState(null);
    const [serverIp, setServerIp] = useState(null);

    const [deviceInfo, setDeviceInfo] = useState<any | DeviceInfo>(null);

    useEffect(() => {
        new CCWSMainWindowClient().mainWindowInfo().then(res => {
            setAppInfo(res.result);
        });

        new CCWSMainWindowClient().getServerInfo().then(res => {
            setServerIp(res.ip);
            if (res.ip === '127.0.0.1') {
                setErr('本机没有局域网联网');
            }
        });
    }, []);

    async function fetchDeviceInfo() {
        if (!serverIp || serverIp === '127.0.0.1') {
            return null;
        }
        try {
            const deviceInfo = await connector.agentRustDeviceInfo();
            setDeviceInfo((r: any) => {
                if (diffObj(r || {}, deviceInfo || {})) {
                    return deviceInfo;
                }
                return r;
            });
            setErr('');
        } catch (error) {
            //@ts-ignore
            const { message } = error;
            if (message.indexOf('not found') > -1) {
                setErr('请上传Agent!');
            } else {
                console.error(error);
                setErr(message + '');
            }
        }
    }

    useEffect(() => {
        fetchDeviceInfo().catch(console.error);
    }, []);
    useTimeoutLoop(async () => {
        await fetchDeviceInfo();
    }, 1000);

    if (err) {
        console.log({ serverIp, appInfo });
        return (
            <View absFull zIdx={1000} top={88}>
                <View center wh100p>
                    <View p={12} borderRadius={8} center column>
                        <View center mb12>
                            <AndroidIcon width={88} height={88}></AndroidIcon>
                        </View>
                        <View pb12 fontSize={14} fontWeight={700}>
                            {err}
                        </View>
                        <View hide={'请上传Agent!' !== err}>
                            <UploadAgentButton
                                serverIp={serverIp!}
                                appInfo={appInfo}
                                connector={connector}
                                fetchDeviceInfo={fetchDeviceInfo}
                            ></UploadAgentButton>
                        </View>
                    </View>
                </View>
            </View>
        );
    }
    if (!deviceInfo || !serverIp || !appInfo) {
        return (
            <View wh100p center>
                <Loading />
            </View>
        );
    } else {
        return (
            <View>
                <DeviceInfoView
                    allClients={allClients}
                    appInfo={appInfo}
                    connector={connector}
                    serverIp={serverIp!}
                    fetchDeviceInfo={fetchDeviceInfo}
                    deviceInfo={deviceInfo}
                ></DeviceInfoView>
            </View>
        );
    }
};
