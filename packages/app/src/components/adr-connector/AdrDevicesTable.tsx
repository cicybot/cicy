import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Checkbox, Select } from 'antd';
import View from '../View';
import { AdbDevice } from '../../services/cicy/CCAndroidConnectorClient';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import { useLocalStorageState } from '@cicy/utils';
import MirrorAdrView from '../adr-connector/MirrorAdrView';
import { CheckCircleFilled } from '@ant-design/icons';
import DrawerButton from '../DrawerButton';

const AdrDevicesTable = ({
    adrDevice,
    forwardPorts,
    onConnect,
    devices,
    openAdr,
    setCurrentFullscreenDevice,
    setCurrentDevice
}: {
    adrDevice: Map<string, AdrDeviceInfo>;
    forwardPorts: number[];
    onConnect: (sn: string) => Promise<void>;
    openAdr: (device: AdrDeviceInfo) => Promise<void>;
    devices: Map<string, AdbDevice>;

    setCurrentFullscreenDevice: (device: AdrDeviceInfo) => void;
    setCurrentDevice: (device: AdrDeviceInfo) => void;
}) => {
    const columns: ProColumns<AdrDeviceInfo>[] = [
        {
            title: 'SN',
            width: 80,
            dataIndex: 'sn',
            render: (_, record) => {
                return <>{record.model}</>;
            }
        },
        {
            title: '品牌',
            dataIndex: 'brand',
            render: (_, record) => {
                const { brand } = record;
                return <>{brand}</>;
            }
        },

        {
            title: '端口',
            width: 80,
            dataIndex: 'port',
            render: (_, record) => {
                const { id } = record;

                const port = AdrDeviceModel.getForwardPortById(id);
                const isConnected = forwardPorts.includes(port);
                if (isConnected) {
                    return (
                        <>
                            {port} <CheckCircleFilled style={{ color: 'green' }} />
                        </>
                    );
                }
                return <>{port}</>;
            }
        },
        {
            title: 'Api',
            dataIndex: 'releaseVersion',
            render: (_, record) => {
                const { releaseVersion, sdkVersion } = record;
                return (
                    <>
                        {releaseVersion} - API {sdkVersion}
                    </>
                );
            }
        },
        {
            title: '尺寸',
            dataIndex: 'size',
            render: (_, record) => {
                const { width, height } = record;
                return (
                    <>
                        {width} - {height}
                    </>
                );
            }
        },
        {
            title: '操作',
            width: 132,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <Button
                    disabled={!devices.get(record.sn)}
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
                    disabled={!devices.get(record.sn)}
                    key="open"
                    onClick={async () => {
                        await openAdr(record);
                    }}
                >
                    新窗口
                </Button>,

                <Button
                    size="small"
                    key="edit"
                    onClick={async () => {
                        setCurrentDevice(record);
                    }}
                >
                    设置
                </Button>
            ]
        }
    ];
    const [isMirror, setIsMirror] = useLocalStorageState('isMirrorAdr', false);
    const height = 32;

    const deviceList = Array.from(adrDevice).map(row => row[1]);
    deviceList.sort((a, b) => a.id - b.id);
    const [currentThumbWidth, setCurrentThumbWidth] = useLocalStorageState(
        'currentThumbWidth',
        240
    );
    return (
        <View wh100p relative>
            <View h={height} jEnd rowVCenter>
                <View mr12 hide={!isMirror} rowVCenter>
                    <View mr12>宽度</View>
                    <Select
                        onChange={value => {
                            setCurrentThumbWidth(value);
                        }}
                        value={currentThumbWidth}
                        style={{ width: 120 }}
                        options={[
                            {
                                value: 120,
                                label: '120px'
                            },
                            {
                                value: 240,
                                label: '240px'
                            },
                            {
                                value: 360,
                                label: '360px'
                            }
                        ]}
                        size={'small'}
                    ></Select>
                </View>
                <View mr12>
                    <Checkbox
                        checked={isMirror}
                        onClick={() => {
                            setIsMirror(!isMirror);
                        }}
                    >
                        投影
                    </Checkbox>
                </View>
                <View mr12>
                    <DrawerButton title={'DebugInfo'}>
                        <View
                            json={{
                                devices: Array.from(adrDevice).map(row => row[1])
                            }}
                        ></View>
                    </DrawerButton>
                </View>
            </View>
            <View absFull top={height}>
                <View hide={isMirror}>
                    <ProTable<AdrDeviceInfo>
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

                <View hide={!isMirror} wh100p overflowYAuto>
                    <MirrorAdrView
                        openAdr={openAdr}
                        setCurrentFullscreenDevice={setCurrentFullscreenDevice}
                        width={currentThumbWidth}
                        setCurrentDevice={setCurrentDevice}
                        deviceList={deviceList.filter(device => {
                            if (device.accessIp) {
                                return true;
                            } else {
                                return forwardPorts.includes(
                                    AdrDeviceModel.getForwardPortById(device.id)
                                );
                            }
                        })}
                    ></MirrorAdrView>
                </View>
            </View>
        </View>
    );
};
export default AdrDevicesTable;
