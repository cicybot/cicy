import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';

import { useWsClients } from '../../hooks/ws';
import BrowserService from '../../services/BrowserService';
import { SiteService } from '../../services/SiteService';
import {
    isAdroidAgentRustClient,
    isAdroidAgentClient,
    isAdroidAgentManageClient,
    isBrowserClient,
    isMainWebContent,
    isMainWindow,
    isClientAdr
} from '../../utils/helper';

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
                    isAdroidAgentRustClient(record.clientId) ||
                    isAdroidAgentClient(record.clientId) ||
                    isAdroidAgentManageClient(record.clientId)
                ) {
                    return (
                        <a
                            onClick={() => {
                                new BrowserService(
                                    location.href.replace(
                                        '#/clients',
                                        `#/android/detail/${record.clientId.replace('-APP', '').replace('-MANAGE', '')}`
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
                if (isAdroidAgentRustClient(record.clientId)) {
                    tag = 'Agent Rust';
                } else if (isAdroidAgentClient(record.clientId)) {
                    tag = 'Agent Agent';
                } else if (isAdroidAgentManageClient(record.clientId)) {
                    tag = 'Agent Manage';
                } else if (isBrowserClient(record.clientId)) {
                    tag = 'Browser';
                } else if (isMainWebContent(record.clientId)) {
                    tag = 'MainWebContent';
                } else if (isMainWindow(record.clientId)) {
                    tag = 'MainWindow';
                } else if (isClientAdr(record.clientId)) {
                    tag = '安卓连接器';
                }
                return <Tag>{tag}</Tag>;
            }
        }
    ];
    const dataSource = clients.map((clientId: string) => {
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
                <Button size="small" type="primary" key="primary" onClick={() => refetch()}>
                    刷新
                </Button>
            ]}
        />
    );
};
export default ClientsTable;
