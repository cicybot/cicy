import { DeleteOutlined, ExportOutlined, MoreOutlined, WindowsOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Avatar, Button, Drawer, Input, message, Popconfirm } from 'antd';
import { useState } from 'react';
import { useSites } from '../../hooks/ws';
import BrowserService from '../../services/cicy/BrowserService';
import SiteDetail from './SiteDetail';
import { SiteInfo, SiteService } from '../../services/model/SiteService';
import { onEvent } from '../../utils/utils';

const SitesTable = () => {
    const { sites, refetch } = useSites();
    const [detail, setDetail] = useState<SiteInfo | null>(null);
    const columns: ProColumns<SiteInfo>[] = [
        {
            title: 'Logo',
            width: 44,
            dataIndex: 'icon',
            render: dom => {
                if (dom === '-') {
                    return <Avatar icon={<WindowsOutlined />}></Avatar>;
                }
                return <Avatar src={dom}></Avatar>;
            }
        },
        {
            title: 'Title',
            dataIndex: 'title',
            render: (title, record: SiteInfo) => {
                if (!title || title === '-') {
                    title = record.url.substring(0.5);
                }
                return (
                    <a title={record.url} onClick={() => setDetail(record)}>
                        {title}
                    </a>
                );
            }
        },
        {
            title: '操作',
            width: 64,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <a
                    style={{ marginRight: 8 }}
                    key="open"
                    onClick={async () => {
                        try {
                            const service = new BrowserService(record.url);
                            await service.openWindow();
                        } catch (error) {
                            //@ts-ignore
                            message.error(error.message);
                        }
                    }}
                >
                    <ExportOutlined />
                </a>,
                <Popconfirm
                    onConfirm={() => {
                        new SiteService(record.site_id).deleteSite().finally(refetch);
                    }}
                    key="delete"
                    title={'确定要删除？'}
                >
                    <a>
                        <DeleteOutlined color="red" />
                    </a>
                </Popconfirm>,
                <Button
                    size={'small'}
                    key="editable"
                    onClick={async () => {
                        setDetail(record);
                    }}
                    style={{ marginLeft: 8 }}
                >
                    <MoreOutlined />
                </Button>
            ]
        }
    ];
    const dataSource = sites.map((row: SiteInfo) => {
        return {
            ...row
        };
    });
    return (
        <>
            <ProTable<SiteInfo>
                dataSource={dataSource as SiteInfo[]}
                rowKey="site_id"
                pagination={{
                    showQuickJumper: true
                }}
                columns={columns}
                search={false}
                options={false}
                toolBarRender={() => [
                    <Input
                        placeholder="输入以http开头的完整网址"
                        style={{ width: 320 }}
                        key="input"
                        id="url"
                        size="small"
                    />,
                    <Button
                        size="small"
                        type="primary"
                        key="add"
                        onClick={async () => {
                            const ele = document.querySelector('#url')! as HTMLInputElement;
                            const url = ele.value;
                            if (
                                !url ||
                                !(url.startsWith('http://') || url.startsWith('https://'))
                            ) {
                                ele.focus();
                                message.error('网址不合法');
                                return;
                            }
                            const service = new BrowserService(url);
                            await service.openWindow();
                            ele.value = '';
                            refetch();
                        }}
                    >
                        新加
                    </Button>,
                    <Button size="small" type="primary" key="reload" onClick={() => refetch()}>
                        刷新
                    </Button>
                ]}
            />
            <Drawer
                width={'50%'}
                title={
                    <Input
                        onChange={e => {
                            if (detail) {
                                setDetail({
                                    ...detail,
                                    title: e.target.value
                                });
                            }
                        }}
                        onBlur={async e => {
                            if (detail) {
                                onEvent('showLoading');
                                await new SiteService(detail?.site_id).saveSiteInfo(detail);
                                await refetch();
                                onEvent('hideLoading');
                            }
                        }}
                        value={detail?.title}
                    />
                }
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setDetail(null);
                }}
                open={!!detail}
            >
                {detail && <SiteDetail site={detail}></SiteDetail>}
            </Drawer>
        </>
    );
};
export default SitesTable;
