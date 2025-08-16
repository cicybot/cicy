import View from '../View';
import { AdbDevice } from '../../services/cicy/CCAndroidConnectorClient';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import { Alert, Button, message } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

export const AndroidLocal = ({
    adrDevice,
    forwardPorts,
    onConnect,
    devices,
    openAdr
}: {
    adrDevice: Map<string, AdrDeviceInfo>;
    forwardPorts: number[];
    openAdr: (device: AdrDeviceInfo) => Promise<void>;
    onConnect: (sn: string) => Promise<void>;
    devices: Map<string, AdbDevice>;
}) => {
    const columns: ProColumns<AdbDevice>[] = [
        {
            title: '序列号',
            width: 80,
            dataIndex: 'sn',
            render: (_, record) => {
                const deviceInfo = adrDevice.get(record.sn);
                if (deviceInfo && deviceInfo.serialno) {
                    return <>{deviceInfo.serialno}</>;
                } else {
                    return <>{record.sn}</>;
                }
            }
        },
        {
            title: '品牌',
            dataIndex: 'brand',
            render: (_, record) => {
                const { sn } = record;
                const deviceInfo = adrDevice.get(sn);
                if (deviceInfo) {
                    return <>{deviceInfo.brand}</>;
                } else {
                    return <>-</>;
                }
            }
        },

        {
            title: '端口',
            width: 80,
            dataIndex: 'port',
            render: (_, record) => {
                const { sn } = record;
                const deviceInfo = adrDevice.get(sn);
                if (deviceInfo) {
                    const port = AdrDeviceModel.getForwardPortById(deviceInfo.id);
                    const isConnected = forwardPorts.includes(port);
                    if (isConnected) {
                        return (
                            <>
                                {port} <CheckCircleFilled style={{ color: 'green' }} />
                            </>
                        );
                    }
                    return <>{port}</>;
                } else {
                    return <>-</>;
                }
            }
        },
        {
            title: '尺寸',
            dataIndex: 'size',
            render: (_, record) => {
                const { sn } = record;
                const deviceInfo = adrDevice.get(sn);
                if (deviceInfo) {
                    return (
                        <>
                            {deviceInfo.width} - {deviceInfo.height}
                        </>
                    );
                } else {
                    return <>-</>;
                }
            }
        },

        {
            title: 'Api',
            dataIndex: 'releaseVersion',
            render: (_, record) => {
                const { sn } = record;
                const deviceInfo = adrDevice.get(sn);
                if (deviceInfo) {
                    const { releaseVersion, sdkVersion } = deviceInfo;
                    return (
                        <>
                            {releaseVersion} - API {sdkVersion}
                        </>
                    );
                } else {
                    return <>-</>;
                }
            }
        },
        {
            title: '操作',
            width: 88,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <Button
                    size="small"
                    type="primary"
                    key="connect"
                    onClick={async () => {
                        await onConnect(record.sn);
                    }}
                >
                    连接
                </Button>,
                <Button
                    size="small"
                    key="open"
                    onClick={async () => {
                        const { sn } = record;
                        const deviceInfo = adrDevice.get(sn);
                        if (deviceInfo) {
                            await openAdr(deviceInfo);
                        } else {
                            message.error('请先连接!');
                        }
                    }}
                >
                    新窗口
                </Button>
            ]
        }
    ];

    const deviceList = Array.from(devices).map(row => row[1]);
    deviceList.sort((a, b) => a.transport_id - b.transport_id);

    return (
        <View>
            <View mb12 hide={deviceList.length > 0}>
                <Alert type="warning" description={<>未找到ADB设备</>}></Alert>
            </View>
            <ProTable<AdbDevice>
                dataSource={deviceList}
                rowKey="sn"
                pagination={{
                    showQuickJumper: true,
                    pageSize: 8
                }}
                columns={columns}
                search={false}
                options={false}
            />
        </View>
    );
};
