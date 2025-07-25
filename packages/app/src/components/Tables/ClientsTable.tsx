import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Dropdown, Tag } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { useWsClients } from '../../hooks/ws';
import BrowserService from '../../services/cicy/BrowserService';
import { SiteService } from '../../services/model/SiteService';
import {
    isAndroidAgentClient,
    isAndroidAgentManageClient,
    isAndroidAgentRustClient,
    isAndroidChatClient,
    isBrowserClient,
    isConnector,
    isMainWebContent,
    isMainWindow,
    isMasterWebContent
} from '../../utils/helper';
import { onEvent } from '../../utils/utils';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';

export type TableListItem = {
    key: string;
    clientId: string;
};

const ClientsTable = () => {
    const { clients, refetch } = useWsClients();

    const columns: ProColumns<TableListItem>[] = [
        {
            title: 'ClientId',
            width: 80,
            dataIndex: 'clientId',
            render: (_, record) => {
                if (
                    isAndroidChatClient(record.clientId) ||
                    isAndroidAgentClient(record.clientId) ||
                    isAndroidAgentRustClient(record.clientId) ||
                    isAndroidAgentManageClient(record.clientId)
                ) {
                    return (
                        <a
                            onClick={() => {
                                new BrowserService(
                                    location.href.replace(
                                        '#/clients',
                                        `#/android/detail/${record.clientId
                                            .replace('-APP', '')
                                            .replace('-MANAGE', '')}`
                                    )
                                ).openWindow({ noWebview: true });
                            }}
                        >
                            {_}
                        </a>
                    );
                } else if (isBrowserClient(record.clientId)) {
                    return (
                        <a
                            onClick={async () => {
                                const [accountIndex, siteId] = record.clientId.split('-');
                                const site = new SiteService(siteId, parseInt(accountIndex));
                                const siteInfo = await site.getSiteInfo();
                                new BrowserService(siteInfo.url, parseInt(accountIndex)).openWindow(
                                    {
                                        noWebview: true
                                    }
                                );
                            }}
                        >
                            {_}
                        </a>
                    );
                }
                return <>{_}</>;
            }
        },
        {
            title: '类型',
            width: 80,
            dataIndex: 'key',
            render: (_, record) => {
                let tag = '其他';
                if (isAndroidAgentRustClient(record.clientId)) {
                    tag = 'Agent';
                } else if (isAndroidAgentClient(record.clientId)) {
                    tag = 'Agent';
                } else if (isAndroidAgentManageClient(record.clientId)) {
                    tag = 'Agent';
                } else if (isAndroidChatClient(record.clientId)) {
                    tag = 'Agent';
                } else if (isBrowserClient(record.clientId)) {
                    tag = 'Browser';
                } else if (isMainWebContent(record.clientId)) {
                    tag = 'MainWebContent';
                } else if (isMasterWebContent(record.clientId)) {
                    tag = 'MainWebContent';
                } else if (isMainWindow(record.clientId)) {
                    tag = 'MainWindow';
                } else if (isConnector(record.clientId)) {
                    tag = '安卓连接器';
                }
                return <Tag>{tag}</Tag>;
            }
        }
    ];
    const [clientType, setClientType] = useLocalStorageState('clientType', 'android');
    const ClientTypes: any = {
        all: '全部',
        android: '安卓',
        browser: '浏览器',
        connector: '连接器',
        else: '其他'
    };
    const ClientTypesList = Object.keys(ClientTypes).map(key => {
        return {
            key,
            label: ClientTypes[key]
        };
    });
    useTimeoutLoop(async () => {
        await refetch(true);
    }, 2000);

    const dataSource = clients
        .filter(clientId => {
            if (clientType === 'all') {
                return true;
            }
            if (clientType === 'android') {
                return (
                    isAndroidAgentClient(clientId) ||
                    isAndroidAgentRustClient(clientId) ||
                    isAndroidChatClient(clientId) ||
                    isAndroidAgentManageClient(clientId)
                );
            }
            if (clientType === 'browser') {
                return isBrowserClient(clientId);
            }
            if (clientType === 'connector') {
                return isConnector(clientId);
            }

            if (clientType === 'else') {
                return (
                    isMainWindow(clientId) ||
                    isMainWebContent(clientId) ||
                    isMasterWebContent(clientId)
                );
            }
            return false;
        })
        .map((clientId: string) => {
            return {
                clientId,
                key: clientId
            };
        });
    return (
        <ProTable<TableListItem>
            dataSource={dataSource as TableListItem[]}
            rowKey="key"
            pagination={{
                showQuickJumper: true
            }}
            columns={columns}
            search={false}
            options={false}
            toolBarRender={() => [
                <Dropdown
                    key="menu"
                    trigger={['click']}
                    menu={{
                        onClick: e => {
                            setClientType(e.key);
                        },
                        items: ClientTypesList
                    }}
                >
                    <Button>
                        {ClientTypes[clientType]} ({dataSource.length} / {clients.length})
                        <DownOutlined />
                    </Button>
                </Dropdown>,
                <Button
                    size="small"
                    type="primary"
                    key="primary"
                    onClick={async () => {
                        await refetch();
                        onEvent('hideLoading');
                    }}
                >
                    刷新
                </Button>
            ]}
        />
    );
};
export default ClientsTable;
