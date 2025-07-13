import { EditOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProForm, ProFormGroup, ProFormText, ProTable } from '@ant-design/pro-components';
import { Button, Checkbox, Drawer, message, Tabs, type TabsProps, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import BrowserService from '../../services/cicy/BrowserService';
import { SiteAccountInfo, SiteInfo, SiteService } from '../../services/model/SiteService';
import { BrowserAccountProxy } from '../browser_account/BrowserAccountProxy';
import View from '../View';
import { BrowserAccount, BrowserAccountSite } from '../../services/model/BrowserAccount';

export const AccountDetail = ({
    changeAccounts,
    account
}: {
    site: SiteInfo;
    changeAccounts: any;
    account: SiteAccountInfo;
}) => {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '帐户',
            children: (
                <ProForm
                    readonly={false}
                    name=""
                    initialValues={{
                        username: account.auth.username,
                        password: account.auth.password,
                        email: account.auth.email,
                        phone: account.auth.phone
                    }}
                    onFinish={async value => {
                        changeAccounts({
                            ...account,
                            auth: value
                        });
                    }}
                >
                    <ProFormGroup title="">
                        <ProFormText width="md" name="email" label="Email" />
                        <ProFormText.Password width="md" name="password" label="密码" />
                        <ProFormText width="md" name="phone" label="电话" />
                        <ProFormText width="md" name="username" label="用户名" />
                    </ProFormGroup>
                </ProForm>
            )
        }
    ];
    return <Tabs defaultActiveKey="1" items={items} onChange={() => {}} />;
};

const SiteAccountsTable = ({
    site,
    addAccounts,
    changeAccounts,
    accounts
}: {
    addAccounts: any;
    changeAccounts: any;
    site: SiteInfo;
    accounts: SiteAccountInfo[];
}) => {
    const [account, setAccount] = useState<null | SiteAccountInfo>(null);
    const [isAll, setIsAll] = useState(false);

    const columns: ProColumns<SiteAccountInfo>[] = [
        {
            title: 'Account',
            dataIndex: 'account_index',
            render: dom => {
                return <># {dom}</>;
            }
        },
        {
            title: 'Auth',
            dataIndex: 'is_deleted',
            render: (_, record) => {
                console.log({ record });
                const { email, phone, username } = record.auth;
                let item = '-';
                if (email) {
                    item = email;
                } else if (phone) {
                    item = phone;
                } else if (username) {
                    item = username;
                }
                return <>{item}</>;
            }
        },
        {
            title: '操作',
            width: 88,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <a
                    key="editable"
                    onClick={async () => {
                        setAccount(record);
                    }}
                    style={{ marginRight: 8 }}
                >
                    <EditOutlined />
                </a>,

                <a
                    style={{ marginRight: 8 }}
                    key="open"
                    onClick={async () => {
                        try {
                            const service = new BrowserService(site.url, record.account_index);
                            await service.openWindow();
                        } catch (error) {
                            //@ts-ignore
                            message.error(error.message);
                        }
                    }}
                >
                    <ExportOutlined></ExportOutlined>
                </a>,

                <Tooltip key="delete" title={record.is_deleted ? '可见' : '隐藏'}>
                    <a
                        onClick={async () => {
                            changeAccounts({
                                ...record,
                                is_deleted: !record.is_deleted ? 1 : 0
                            });
                        }}
                    >
                        {!record.is_deleted ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </a>
                </Tooltip>
            ]
        }
    ];
    const dataSource = isAll ? accounts : accounts.filter(row => !row.is_deleted);
    return (
        <>
            <ProTable<SiteAccountInfo>
                dataSource={dataSource as SiteAccountInfo[]}
                rowKey="account_index"
                pagination={{
                    showQuickJumper: true
                }}
                columns={columns}
                search={false}
                options={false}
                toolBarRender={() => [
                    <Button onClick={() => addAccounts(site)} size="small" type="primary" key="add">
                        增加
                    </Button>,
                    <Checkbox
                        key="all"
                        style={{ marginLeft: 12 }}
                        checked={isAll}
                        onChange={e => {
                            setIsAll(e.target.checked);
                        }}
                    >
                        全部
                    </Checkbox>
                ]}
            />
            <Drawer
                title={account ? `# ${account.account_index}` : ''}
                width={480}
                closable={false}
                onClose={() => setAccount(null)}
                open={!!account}
            >
                {account && (
                    <AccountDetail
                        site={site}
                        changeAccounts={changeAccounts}
                        account={account}
                    ></AccountDetail>
                )}
            </Drawer>
        </>
    );
};
export default SiteAccountsTable;
