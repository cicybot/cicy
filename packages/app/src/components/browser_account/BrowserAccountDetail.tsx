import { useEffect, useState } from 'react';
import View from '../View';
import { AccountAuthInfo, SiteInfo } from '../../services/model/SiteService';
import { Avatar, Button, message, Tabs, type TabsProps } from 'antd';
import {
    BrowserAccount,
    BrowserAccountInfo,
    BrowserAccountSite
} from '../../services/model/BrowserAccount';
import BrowserService from '../../services/cicy/BrowserService';
import {
    type ProColumns,
    ProForm,
    ProFormCheckbox,
    ProFormGroup,
    ProFormSelect,
    ProFormText,
    ProTable
} from '@ant-design/pro-components';
import { ExportOutlined, WindowsOutlined } from '@ant-design/icons';
import { BrowserAccountProxy } from './BrowserAccountProxy';
import { onEvent } from '../../utils/utils';

export const getUsernameByAuth = (auth: AccountAuthInfo) => {
    const { email, phone, username } = auth;
    let item = '-';
    if (email) {
        item = email;
    } else if (phone) {
        item = phone;
    } else if (username) {
        item = username;
    }
    return item;
};
const BrowserAccountDetail = ({ row }: { row: BrowserAccountInfo }) => {
    const browserAccount = row;
    const [sites, setSite] = useState<BrowserAccountSite[]>([]);
    const [useMitm, setUseMitm] = useState(browserAccount.config.useMitm || false);

    const refresh = async () => {
        return new BrowserAccount(browserAccount.id).getSites().then(res => {
            setSite(res);
        });
    };
    useEffect(() => {
        refresh();
    }, []);

    const columns: ProColumns<BrowserAccountSite>[] = [
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
                return <>{title}</>;
            }
        },
        {
            title: '用户',
            dataIndex: 'auth',
            render: auth => {
                return <>{getUsernameByAuth(auth as any)}</>;
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
                            const service = new BrowserService(record.url, browserAccount.id);
                            await service.openWindow();
                        } catch (error) {
                            //@ts-ignore
                            message.error(error.message);
                        }
                    }}
                >
                    <ExportOutlined />
                </a>
            ]
        }
    ];

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '站点',
            children: (
                <View>
                    <ProTable<BrowserAccountSite>
                        dataSource={sites}
                        rowKey="site_id"
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
                                key="reload"
                                onClick={() => refresh()}
                            >
                                刷新
                            </Button>
                        ]}
                    />
                </View>
            )
        },
        {
            key: '2',
            label: '基本设置',
            children: (
                <View>
                    <ProForm
                        readonly={false}
                        name=""
                        onChange={(e: any) => {
                            if (e.target.id === 'useMitm') {
                                setUseMitm(e.target.checked);
                            }
                        }}
                        initialValues={{
                            userAgent: browserAccount.config.userAgent || '',
                            proxyType: browserAccount.config.proxyType || 'direct',
                            proxyHost: browserAccount.config.proxyHost || '127.0.0.1',
                            useMitm: browserAccount.config.useMitm || false
                        }}
                        onFinish={async value => {
                            onEvent('showLoading');
                            await new BrowserAccount(browserAccount.id).save({
                                ...browserAccount.config,
                                ...value
                            });
                            window.dispatchEvent(new CustomEvent('reloadBrowserAccounts'));
                            onEvent('hideLoading');
                        }}
                    >
                        <ProFormGroup title="">
                            <ProFormText width="xl" name="userAgent" label="UserAgent" />
                            <ProFormSelect
                                options={['direct', 'http']}
                                width="xl"
                                name="proxyType"
                                label="代理类型"
                            />
                            <ProFormText width="md" name="proxyHost" label="代理主机" />
                        </ProFormGroup>
                        <ProFormGroup title="">
                            <ProFormCheckbox width="md" name="useMitm" label="使用中间人" />
                        </ProFormGroup>
                        <View mb={24}>代理端口 {useMitm ? 4446 : 4445}</View>
                    </ProForm>
                </View>
            )
        },
        {
            key: '3',
            label: '代理',
            children: <BrowserAccountProxy browserAccount={browserAccount}></BrowserAccountProxy>
        }
    ];
    return <Tabs defaultActiveKey="1" items={items} onChange={() => {}} />;
};

export default BrowserAccountDetail;
