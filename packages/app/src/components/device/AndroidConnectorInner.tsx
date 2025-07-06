import View from '../View';
import { useState } from 'react';
import { AndroidIcon } from '../Icons';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/CCAndroidConnectorClient';
import { Select } from 'antd';
import { AndroidConnectorDetail } from './AndroidConnectorDetail';

export const AndroidConnectorInner = ({
    clients
}: {
    clients: { value: string; label: any }[];
}) => {
    const [devices, setDevices] = useState<AdbDevice[]>([]);
    const connector = new CCAndroidConnectorClient();
    const [clientId, setClientId] = useLocalStorageState('androidClientId', '');
    if (clientId) {
        connector.setClientId(clientId);
    }
    const onChangeClient = (value: string) => {
        setClientId(value);
        setDevices([]);
    };
    console.log('clients', clients, devices);
    useTimeoutLoop(async () => {
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
                if (r.length === 0 && devices.length === 0) {
                    return r;
                }
                // console.log(diffDeivces(devices, r));
                if (diffDeivces(devices, r) || r.length === 0) {
                    return devices;
                } else {
                    return r;
                }
            });
        } catch (error) {
            console.error(error);
        }
    }, 1000);

    if (devices.length === 0) {
        return (
            <AndroidConnectorPage>
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
            </AndroidConnectorPage>
        );
    }
    console.log('[+] devices:', devices);
    return (
        <AndroidConnectorDetail
            onChangeClient={onChangeClient}
            clients={clients}
            clientId={clientId}
            connector={connector}
            devices={devices}
        ></AndroidConnectorDetail>
    );
};
