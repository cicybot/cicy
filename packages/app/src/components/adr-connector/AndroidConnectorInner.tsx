import View from '../View';
import { useState } from 'react';
import { AndroidIcon } from '../Icons';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/cicy/CCAndroidConnectorClient';
import { Select } from 'antd';
import AdrDevicesTable from '../Tables/AdrDevicesTable';

export const AndroidConnectorInner = ({
    clients
}: {
    clients: { value: string; label: any }[];
}) => {
    const [devices, setDevices] = useState<Map<string, AdbDevice>>(new Map());
    const connector = new CCAndroidConnectorClient();
    const [clientId, setClientId] = useLocalStorageState('androidClientId', '');
    if (clientId) {
        connector.setClientId(clientId);
    }
    const onChangeClient = (value: string) => {
        setClientId(value);
        setDevices(new Map());
    };
    useTimeoutLoop(async () => {
        try {
            const devices = await connector.getDeviceList();
            const devicesMap: Map<string, AdbDevice> = new Map();
            for (const devicesKey in devices) {
                const device = devices[devicesKey];
                devicesMap.set(device.id, device);
            }
            setDevices(devicesMap);
        } catch (error) {
            console.error(error);
        }
    }, 1000);

    if (devices.size === 0) {
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
                        style={{ width: 200 }}
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
    const deviceList = Array.from(devices).map(row => row[1]);
    deviceList.sort((a, b) => a.transport_id - b.transport_id);
    return (
        <AndroidConnectorPage>
            <AdrDevicesTable connectClientId={clientId} devices={deviceList}></AdrDevicesTable>
        </AndroidConnectorPage>
    );
};
