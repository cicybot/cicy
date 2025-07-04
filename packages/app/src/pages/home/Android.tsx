import { useLocalStorageState, useTimeoutLoop } from '@cc/utils';

import { Breadcrumb, Divider, Select } from 'antd';

import { ReactNode, useEffect, useState } from 'react';
import { AndroidIcon } from '../../components/Icons';
import Loading from '../../components/UI/Loading';
import View from '../../components/View';
import { useWsClients } from '../../hooks/ws';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/CCAndroidConnectorClient';
import { CCWSMainWindowClient } from '../../services/CCWSMainWindowClient';
import { DeviceInfo } from '../../components/device/DeviceInfo';
import { UploadAgentButton } from '../../components/device/UploadAgentButton';

const Android = () => {
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useLocalStorageState('androidClientId', '');
    const [deviceId, setDeviceId] = useLocalStorageState('androidDeviceId', '');
    const [deviceInfo, setDeviceInfo] = useState<any | null>(null);
    const { clients: clientsData, refetch: refetchClients } = useWsClients();
    const [serverIp, setServerIp] = useState(null);
    const [devices, setDevices] = useState<AdbDevice[]>([]);
    const connector = new CCAndroidConnectorClient();

    useEffect(() => {
        new CCWSMainWindowClient().mainWindowInfo().then(res => {
            const { result } = res;
            const { publicDir, userDataDir } = result || {};
        });

        new CCWSMainWindowClient().getServerInfo().then(res => {
            setServerIp(res.ip);
        });
    }, []);

    const clients = (clientsData || [])
        .filter((clientId: string) => clientId.startsWith('CONNECTOR-ADR-'))
        .map((clientId: string) => {
            return {
                value: clientId,
                label: <span>{clientId}</span>
            };
        });

    const deviceOptions = devices.map((device: AdbDevice) => {
        return {
            value: device.transport_id,
            label: (
                <span>
                    {device.model}:{device.transport_id}
                </span>
            )
        };
    });

    connector.setClientId(clientId);
    connector.setTransportId(deviceId);

    useEffect(() => {
        if (!clientId && clients.length > 0) {
            setClientId(clients[0].value);
        }
        if (clientId && clients.length === 0) {
            setClientId('');
        }
    }, [clientId, clients]);

    useEffect(() => {
        if (!deviceId && devices.length > 0) {
            setDeviceId(devices[0].transport_id);
            setDeviceInfo(null);
        }

        if (deviceId && devices.length === 0) {
            setDeviceId('');
            setDeviceInfo(null);
        }
    }, [devices, deviceId]);

    const onChangeClient = (value: string) => {
        setClientId(value);
        setDevices([]);
        setDeviceId('');
        setDeviceInfo(null);
        setErr('');
        setLoading(true);
    };

    const onChangeDevice = (value: string) => {
        setDeviceId(value);
        setDeviceInfo(null);
        setErr('');
        setLoading(true);
    };
    async function fetchDeviceInfo() {
        try {
            const deviceInfo = await connector.agentRustDeviceInfo();
            setDeviceInfo(deviceInfo);
            setErr('');
        } catch (error) {
            //@ts-ignore
            const {message} = error
            if(message.indexOf("not found") > -1){
                setErr('请上传Agent!');
                setLoading(false);
            }else{
                console.error(error)
                setLoading(true);
            }
        }
    }
    useTimeoutLoop(async () => {
        refetchClients(true);
        try {
            const devices = await connector.getDeviceList();
            const diffDeivces = (aa: any, bb: any) => {
                aa.sort(
                    (b: AdbDevice, a: AdbDevice) =>
                        parseInt(a.transport_id) - parseInt(b.transport_id)
                );
                bb.sort(
                    (b: AdbDevice, a: AdbDevice) =>
                        parseInt(a.transport_id) - parseInt(b.transport_id)
                );

                for (let i in aa) {
                    const row_a = aa[i];
                    const row_b = aa[i];
                    for (let key in row_a) {
                        if (row_b[key] !== row_a[key]) {
                            return true;
                        }
                    }
                }
                return false;
            };
            setDevices(r => {
                // console.log(diffDeivces(devices, r));
                if (diffDeivces(devices, r) || r.length === 0) {
                    return devices;
                } else {
                    return r;
                }
            });
            if (devices.length > 0 && !deviceInfo) {
                await fetchDeviceInfo();
            }
            if (devices.length === 0 && deviceInfo) {
                setDeviceInfo(null);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }, 1000);

    console.log("device",{deviceId, clientId },devices,deviceInfo);

    const Page = ({ children }: { children?: ReactNode }) => {
        return (
            <View w100p h100vh overflowYAuto relative>
                <View pl12 mt12 mb12>
                    <Breadcrumb
                        items={[
                            {
                                title: 'Home'
                            },
                            {
                                title: 'Android'
                            }
                        ]}
                    />
                </View>
                <View absFull top={44}>
                    {children}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <Page>
                <View wh100p center>
                    <Loading size={32} />
                </View>
            </Page>
        );
    }

    if (clients.length === 0) {
        return (
            <Page>
                <View wh100p center>
                    <View p={12} center column>
                        <View center mb12 mt={-88}>
                            <AndroidIcon width={88} height={88}></AndroidIcon>
                        </View>
                        <View pb12 fontSize={14} fontWeight={700}>
                            安卓连接器没有连接！
                        </View>
                    </View>
                </View>
            </Page>
        );
    }
    if (devices.length === 0) {
        return (
            <Page>
                <View ml12 rowVCenter mt12>
                    <View fontSize={14} mr12>
                        客户端:
                    </View>
                    <Select
                        size="small"
                        onChange={onChangeClient}
                        value={clientId}
                        style={{ width: 260 }}
                        options={clients}
                    />
                </View>
                <View wh100p center>
                    <View p={12} center column>
                        <View center mb12 mt={-88}>
                            <AndroidIcon width={88} height={88}></AndroidIcon>
                        </View>
                        <View pb12 fontSize={14} fontWeight={700}>
                            ADB 设备没有连接,请使用USB或无线连接安卓设备
                        </View>
                    </View>
                </View>
            </Page>
        );
    }

    return (
        <Page>
            <View rowVCenter jSpaceBetween w100p>
                <View ml12 rowVCenter mt12>
                    <View fontSize={14} mr12>
                        客户端:
                    </View>
                    <Select
                        size="small"
                        onChange={onChangeClient}
                        defaultValue={clientId}
                        style={{ width: 260 }}
                        options={clients}
                    />
                    <View fontSize={14} ml={24} mr12>
                        设备:
                    </View>
                    <Select
                        size="small"
                        onChange={onChangeDevice}
                        defaultValue={deviceId}
                        style={{ width: 180 }}
                        options={deviceOptions}
                    />
                </View>
            </View>
            <Divider></Divider>

            {err && (
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
                                    serverIp={serverIp}
                                    connector={connector}
                                    fetchDeviceInfo={fetchDeviceInfo}
                                ></UploadAgentButton>
                            </View>
                        </View>
                    </View>
                </View>
            )}
            {Boolean(deviceInfo && serverIp) && (
                <DeviceInfo
                    connector={connector}
                    serverIp={serverIp!}
                    refetchClients={refetchClients}
                    fetchDeviceInfo={fetchDeviceInfo}
                    deviceInfo={deviceInfo}
                ></DeviceInfo>
            )}
        </Page>
    );
};

export default Android;
