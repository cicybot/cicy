import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Drawer, message } from 'antd';

import { useBrowserAccounts } from '../../hooks/ws';
import { formatRelativeTime, onEvent } from '../../utils/utils';
import { BrowserAccount, BrowserAccountInfo } from '../../services/model/BrowserAccount';
import { EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import View from '../View';
import BrowserAccountDetail from './BrowserAccountDetail';
import { BackgroundApi } from '../../services/common/BackgroundApi';
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
            title: 'IP',
            dataIndex: 'ip',
            render: (_, { config }) => {
                return <>{config.testIp || '-'}</>;
            }
        },
        {
            title: 'location',
            dataIndex: 'location',
            render: (_, { config }) => {
                return <>{config.testLocation || '-'}</>;
            }
        },
        {
            title: '延时',
            dataIndex: 'delay',
            render: (_, { config }) => {
                return <>{config.testDelay || '-'}</>;
            }
        },

        {
            title: '测试时间',
            dataIndex: 'ts',
            render: (_, { config }) => {
                return <>{config.testTs ? formatRelativeTime(config.testTs) : '-'}</>;
            }
        },
        {
            title: '操作',
            width: 120,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <a
                    key="editable"
                    onClick={async () => {
                        setDetail(record);
                    }}
                    style={{ marginRight: 8 }}
                >
                    <EditOutlined />
                </a>,
                <a
                    key="test"
                    onClick={async () => {
                        onEvent('showLoading');
                        const startTime = Date.now();
                        new BackgroundApi()
                            .axios('https://api.myip.com', {
                                timeout: 5000,
                                httpsProxy: `http://127.0.0.1:${ProxyService.getMetaAccountProxyPort(
                                    record.id
                                )}`
                            })
                            .then(async (res: any) => {
                                if (res.err) {
                                    message.error(res.err);
                                } else {
                                    const { ip, country } = res.result;
                                    await new BrowserAccount(record.id).save({
                                        ...record.config,
                                        testDelay: Date.now() - startTime,
                                        testTs: Math.floor(startTime / 1000),
                                        testLocation: country,
                                        testIp: ip
                                    });
                                    await refresh();
                                }
                            })
                            .catch(e => {
                                //@ts-ignore
                                message.error(e.message);
                            })
                            .finally(() => {
                                onEvent('hideLoading');
                            });
                    }}
                    style={{ marginRight: 8 }}
                >
                    测试
                </a>
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
