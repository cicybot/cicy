import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { onEvent } from '../../utils/utils';
import View from '../View';
import CCAndroidConnectorClient, { AdbDevice } from '../../services/cicy/CCAndroidConnectorClient';
import BrowserService from '../../services/cicy/BrowserService';
import { AdrDeviceModel, AdrDeviceInfo } from '../../services/model/AdrDeviceModel';
import { useEffect, useState } from 'react';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import { AdrUtils } from '../../services/common/AdrUtils';

const AdrDevicesTable = ({
    connectClientId,
    devices
}: {
    connectClientId: string;
    devices: AdbDevice[];
}) => {
    const { appInfo } = useMainWindowContext();
    const [adrDevice, setAdrDevice] = useState<Map<string, AdrDeviceInfo>>(new Map());
    useEffect(() => {
        AdrDeviceModel.getAll().then(res => {
            console.log('AdrDeviceModel:', res);
            for (const resKey in res) {
                const row = res[resKey];
                adrDevice.set(row.info.sn, {
                    ...row.info,
                    id: row.id!
                });
            }
            setAdrDevice(adrDevice);
        });
    }, []);
    const columns: ProColumns<AdbDevice>[] = [
        {
            title: 'SN',
            width: 80,
            dataIndex: 'sn',
            render: sn => {
                return <>{sn}</>;
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
            title: 'Port',
            width: 80,
            dataIndex: 'port',
            render: (_, record) => {
                const { sn } = record;
                const deviceInfo = adrDevice.get(sn);
                if (deviceInfo) {
                    return <>{AdrDeviceModel.getForwardPortById(deviceInfo.id)}</>;
                } else {
                    return <>-</>;
                }
            }
        },
        {
            title: '尺寸',
            dataIndex: 'size',
            render: (_, record) => {
                const { id } = record;
                const deviceInfo = adrDevice.get(id);
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
            title: '操作',
            width: 88,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                // <TableDropdown
                //     onSelect={k => {
                //         // connector.setIndex(record.index);
                //         // switch (k) {
                //         //     case 'remove':
                //         //         return connector.remove();
                //         //     case 'reboot':
                //         //         return connector.reboot();
                //         //     case 'launch':
                //         //         return connector.launch();
                //         //     case 'quit':
                //         //         return connector.quit();
                //         // }
                //     }}
                //     key="actionGroup"
                //     menus={[{ key: 'launch', name: '启动' }]}
                // />,
                <Button
                    size="small"
                    type="primary"
                    key="primary"
                    onClick={async () => {
                        onEvent('showLoading');
                        const connector = new CCAndroidConnectorClient();
                        connector.setClientId(connectClientId);
                        connector.setSn(record.sn);
                        try {
                            const deviceInfo = await connector.handleDeviceInfo();
                            console.log({ deviceInfo });
                            const { deviceId } = deviceInfo;
                            setAdrDevice(adrDevice);
                            const adrDeviceModel = new AdrDeviceModel(deviceId);

                            const row = await adrDeviceModel.get();
                            let id = 0;

                            if (!row) {
                                id = await adrDeviceModel.add({
                                    ...deviceInfo,
                                    sn: record.sn
                                });
                            } else {
                                if (row.info.sn !== record.sn) {
                                    await adrDeviceModel.save({
                                        ...deviceInfo,
                                        sn: record.sn
                                    });
                                }
                                id = row.id!;
                            }

                            adrDevice.set(record.sn, { ...deviceInfo, sn: record.sn, id });

                            if (
                                1 ||
                                !deviceInfo.ports.includes(9010) ||
                                !deviceInfo.ports.includes(9008)
                            ) {
                                await connector.deviceAdbPush(
                                    '/Users/ton/Desktop/projects/cicy/apps/desktop/public/static/scrcpy/u2.jar',
                                    '/data/local/tmp'
                                );
                                await connector.deviceAdbPush(
                                    '/Users/ton/Desktop/projects/cicy/apps/desktop/public/static/scrcpy/win32/scrcpy-server',
                                    '/data/local/tmp/scrcpy-server.jar'
                                );
                                await connector.deviceAdbShell(
                                    'CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / com.genymobile.scrcpy.Server 3.3.1 boot=true port=9010'
                                );
                            }

                            await connector.deviceAdbForward(
                                AdrDeviceModel.getForwardPortById(id),
                                9010
                            );

                            const { width, height } = await connector.getDeviceInfo();
                            const url = location.href.replace(
                                '#/android',
                                `#/android/detail/${connectClientId}/${record.sn}/${deviceId}/${id}`
                            );
                            await new BrowserService(url).openWindow({
                                noWebview: true,
                                windowOptions: {
                                    ...AdrUtils.getWindowSize(width, height, 0.5, appInfo.isWin)
                                }
                            });
                        } catch (e) {
                            // @ts-ignore
                            message.error(e.message);
                        }

                        onEvent('hideLoading');
                    }}
                >
                    连接
                </Button>
            ]
        }
    ];
    return (
        <View wh100p p12 borderBox overflowYAuto>
            <ProTable<AdbDevice>
                dataSource={devices}
                rowKey="sn"
                pagination={{
                    showQuickJumper: true
                }}
                columns={columns}
                search={false}
                options={false}
            />
        </View>
    );
};
export default AdrDevicesTable;
