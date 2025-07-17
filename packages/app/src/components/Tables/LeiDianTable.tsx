import { ProColumns, ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button } from 'antd';

import CCAndroidLeidianConnectorClient, {
    VmInfo
} from '../../services/cicy/CCAndroidLeidianConnectorClient';
import { onEvent } from '../../utils/utils';
import { useState } from 'react';
import View from '../View';
import { useTimeoutLoop } from '@cicy/utils';

const LeiDianTable = ({
    connector,
    vmList: vmList_
}: {
    connector: CCAndroidLeidianConnectorClient;
    vmList: VmInfo[];
}) => {
    const [vmList, setVmList] = useState<VmInfo[]>(vmList_);
    const fetchRows = async () => {
        const { rows: vmList } = await connector.getVmList();
        setVmList(vmList);
    };
    useTimeoutLoop(async () => {
        await fetchRows();
    }, 1000);
    const columns: ProColumns<VmInfo>[] = [
        {
            title: 'ID',
            width: 80,
            dataIndex: 'index',
            render: index => {
                return <>帐户 {index}</>;
            }
        },
        {
            title: '名称',
            width: 80,
            dataIndex: 'name',
            render: name => {
                return <>{name}</>;
            }
        },
        {
            title: 'ADB Port',
            width: 80,
            dataIndex: 'adb',
            render: adb => {
                return <>{adb}</>;
            }
        },
        {
            title: '运行状态',
            width: 80,
            dataIndex: 'is_running',
            render: is_running => {
                return <>{is_running ? '运行中' : '未运行'}</>;
            }
        },
        {
            title: '宽高',
            dataIndex: 'name',
            render: (_, record) => {
                return (
                    <>
                        {record.width} / {record.height}
                    </>
                );
            }
        },
        {
            title: '操作',
            width: 64,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <TableDropdown
                    onSelect={k => {
                        connector.setIndex(record.index);
                        switch (k) {
                            case 'remove':
                                return connector.remove();
                            case 'reboot':
                                return connector.reboot();
                            case 'launch':
                                return connector.launch();
                            case 'quit':
                                return connector.quit();
                        }
                    }}
                    key="actionGroup"
                    menus={[
                        { key: 'remove', name: '删除' },
                        { key: 'reboot', name: '重启' },
                        { key: 'launch', name: '启动' },
                        { key: 'quit', name: '退出' }
                    ]}
                />
            ]
        }
    ];
    return (
        <View>
            <ProTable<VmInfo>
                dataSource={vmList}
                rowKey="index"
                pagination={{
                    showQuickJumper: true
                }}
                columns={columns}
                search={false}
                options={false}
                toolBarRender={() => [
                    <Button
                        size="small"
                        type="primary"
                        key="add"
                        onClick={async () => {
                            onEvent('showLoading');
                            await connector.add(`Account_${Date.now()}`);
                            onEvent('hideLoading');
                        }}
                    >
                        新加
                    </Button>,
                    <Button
                        size="small"
                        type="primary"
                        key="primary"
                        onClick={async () => {
                            onEvent('showLoading');
                            await fetchRows();
                            onEvent('hideLoading');
                        }}
                    >
                        刷新
                    </Button>
                ]}
            />
        </View>
    );
};
export default LeiDianTable;
