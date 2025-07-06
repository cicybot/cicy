import View from '../View';
import { useEffect, useState } from 'react';
import { useWsClients } from '../../hooks/ws';
import { AndroidIcon } from '../Icons';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/CCAndroidConnectorClient';
import { Select } from 'antd';
import { onEvent } from '../../utils/utils';
import Loading from '../UI/Loading';
import { AndroidConnectorDetailInfo } from './AndroidConnectorDetailInfo';

export const AndroidConnectorDetail = ({
    connector,
    devices,
    clients,
    clientId,
    onChangeClient
}: {
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
            debugger;
            setDeviceId('');
        }
        if (devices.length === 0) {
            debugger;
            setDeviceId('');
        }
    }, [devices, deviceId]);
    useTimeoutLoop(async () => {}, 1000);
    console.log('[+] devices:', deviceId, devices);

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
                        defaultValue={deviceId}
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
                    defaultValue={deviceId}
                    style={{ width: 180 }}
                    options={deviceOptions}
                />
            </View>
            <View wh100p>
                <AndroidConnectorDetailInfo connector={connector}></AndroidConnectorDetailInfo>
            </View>
        </AndroidConnectorPage>
    );
};
