import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Drawer } from 'antd';

import { useBrowserAccounts } from '../../hooks/ws';
import { onEvent } from '../../utils/utils';
import { BrowserAccountInfo } from '../../services/model/BrowserAccount';
import { MoreOutlined } from '@ant-design/icons';
import { useState } from 'react';
import View from '../View';
import BrowserAccountDetail from '../browser_account/BrowserAccountDetail';
import ProxyService from '../../services/common/ProxyService';

const BrowserAccountsTable = () => {
    const { rows, refresh } = useBrowserAccounts();
    const [detail, setDetail] = useState<BrowserAccountInfo | null>(null);

    const columns: ProColumns<BrowserAccountInfo>[] = [
        {
            title: 'ID',
            width: 80,
            dataIndex: 'id',
            render: id => {
                return <>帐户 {id}</>;
            }
        },
        {
            title: '代理',
            dataIndex: 'proxy',
            render: (_, { id, config }) => {
                let { proxyHost, useMitm, proxyType } = config;
                if (proxyType === 'direct' || !proxyType) {
                    return <>直连</>;
                } else {
                    if (!proxyHost) {
                        proxyHost = '127.0.0.1';
                    }
                    return (
                        <View rowVCenter>
                            {proxyType}://{proxyHost}:
                            {useMitm
                                ? ProxyService.getProxyMitmPort()
                                : ProxyService.getProxyPort()}
                            <View ml12>Account_{10000 + id}:pwd</View>
                        </View>
                    );
                }
            }
        },
        {
            title: '操作',
            width: 44,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <Button
                    size={'small'}
                    key="editable"
                    onClick={async () => {
                        setDetail(record);
                    }}
                    style={{ marginRight: 8 }}
                >
                    <MoreOutlined />
                </Button>
                // <a
                //     key="test"
                //     onClick={async () => {
                //         onEvent('showLoading');
                //         try {
                //             await ProxyService.testSpeed(record);
                //             await refresh();
                //         } catch (e) {
                //             message.error(e + '');
                //         }
                //         onEvent('hideLoading');
                //     }}
                //     style={{ marginRight: 8 }}
                // >
                //     测试
                // </a>
            ]
        }
    ];
    const dataSource: BrowserAccountInfo[] = rows;
    return (
        <View>
            <ProTable<BrowserAccountInfo>
                dataSource={dataSource}
                rowKey="id"
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
                        key="primary"
                        onClick={async () => {
                            onEvent('showLoading');
                            await refresh();
                            onEvent('hideLoading');
                        }}
                    >
                        刷新
                    </Button>
                ]}
            />

            <Drawer
                width={'75%'}
                title={`#${detail?.id}`}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setDetail(null);
                }}
                open={!!detail}
            >
                {detail && <BrowserAccountDetail row={detail}></BrowserAccountDetail>}
            </Drawer>
        </View>
    );
};
export default BrowserAccountsTable;
