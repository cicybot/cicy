import View from '../View';
import { useEffect } from 'react';
import { AndroidIcon } from '../Icons';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useLocalStorageState } from '@cicy/utils';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/cicy/CCAndroidConnectorClient';
import { Select } from 'antd';
import { AndroidConnectorDetailInfo } from './AndroidConnectorDetailInfo';

export const AndroidConnectorDetail = ({
    connector,
    devices,
    clients,
    clientId,
    allClients,
    onChangeClient
}: {
    allClients: string[];
    onChangeClient: any;
    connector: CCAndroidConnectorClient;
    devices: AdbDevice[];
    clientId: string;
    clients: { value: string; label: any }[];
}) => {
    const [deviceId, setDeviceId] = useLocalStorageState('androidDeviceId', '');

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

    const onChangeDevice = (value: string) => {
        setDeviceId(value);
    };

    if (deviceId) {
        connector.setTransportId(deviceId);
    }
    useEffect(() => {
        if (devices.length > 0 && !devices.find(device => device.transport_id === deviceId)) {
            setDeviceId('');
        }
        if (devices.length === 0) {
            setDeviceId('');
        }
        if (devices.length == 1 && !deviceId) {
            setDeviceId(devices[0].transport_id);
        }
    }, [devices, deviceId]);

    if (!deviceId) {
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

                    <View fontSize={14} ml={24} mr12>
                        设备:
                    </View>
                    <Select
                        size="small"
                        onChange={onChangeDevice}
                        value={deviceId}
                        style={{ width: 180 }}
                        options={deviceOptions}
                    />
                </View>
                <View wh100p center>
                    <View p={12} center column>
                        <View center mb12 mt={-88}>
                            <AndroidIcon width={88} height={88}></AndroidIcon>
                        </View>
                        <View pb12 fontSize={14} fontWeight={700}>
                            请选择ADB设备
                        </View>
                    </View>
                </View>
            </AndroidConnectorPage>
        );
    }
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

                <View fontSize={14} ml={24} mr12>
                    设备:
                </View>
                <Select
                    size="small"
                    onChange={onChangeDevice}
                    value={deviceId}
                    style={{ width: 180 }}
                    options={deviceOptions}
                />
            </View>
            <View wh100p>
                <AndroidConnectorDetailInfo
                    allClients={allClients}
                    clients={clients}
                    connector={connector}
                ></AndroidConnectorDetailInfo>
            </View>
        </AndroidConnectorPage>
    );
};
