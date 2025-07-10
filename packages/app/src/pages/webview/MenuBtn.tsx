import { Drawer, Dropdown, MenuProps, message } from 'antd';

import {
    ArrowLeftOutlined,
    ConsoleSqlOutlined,
    HomeOutlined,
    MenuOutlined,
    ReloadOutlined,
    SettingOutlined
} from '@ant-design/icons';
import View from '../../components/View';
import { SiteAccountInfo, SiteInfo, SiteService } from '../../services/model/SiteService';
import { useEffect, useState } from 'react';
import { AccountDetail } from '../../components/Tables/SiteAccountsTable';
import { onEvent } from '../../utils/utils';
import WebviewTag = Electron.WebviewTag;
import { SiteAccount } from '../../services/model/SiteAccount';

const items: MenuProps['items'] = [
    {
        key: 'home',
        label: '主页',
        icon: <HomeOutlined />
    },
    {
        key: 'back',
        label: '后退',
        icon: <ArrowLeftOutlined />
    },
    {
        key: 'reload',
        label: '刷新',
        icon: <ReloadOutlined />
    },
    {
        key: 'openDevTools',
        label: '控制台',
        icon: <ConsoleSqlOutlined />
    },
    {
        key: 'setting',
        label: '设置',
        icon: <SettingOutlined />
    }
];

const MenuBtn = ({ siteService, webview }: { siteService: SiteService; webview: WebviewTag }) => {
    const [showSettingDrawer, setShowSettingDrawer] = useState(false);
    const [site, setSite] = useState<SiteInfo | null>(null);
    const [account, setAccount] = useState<SiteAccountInfo | null>(null);
    useEffect(() => {
        (async () => {
            const site = await siteService.getSiteInfo();
            setSite(site);

            const account = await siteService.getAccount();
            setAccount(
                account ||
                    ({
                        account_index: 0,
                        site_id: site.site_id,
                        config: {},
                        auth: {}
                    } as SiteAccountInfo)
            );
        })();
    }, []);
    const changeAccounts = async (account: SiteAccountInfo) => {
        if (site) {
            return;
        }
        onEvent('showLoading');
        await new SiteAccount(site!.site_id, account.account_index).save(account);
        onEvent('hideLoading');
    };

    return (
        <View center mr={18} pointer>
            <Dropdown
                menu={{
                    items,
                    onClick: async ({ key }: { key: string }) => {
                        switch (key) {
                            case 'home': {
                                const { url } = await siteService.getSiteInfo();
                                webview && webview.executeJavaScript(`location.href = '${url}'`);
                                break;
                            }
                            case 'back': {
                                Boolean(webview && webview.canGoBack()) && webview.goBack();
                                break;
                            }
                            case 'reload': {
                                webview && webview.reload();
                                break;
                            }
                            case 'openDevTools': {
                                webview && webview.openDevTools();
                                break;
                            }
                            case 'setting': {
                                setShowSettingDrawer(true);
                                break;
                            }
                            default:
                                break;
                        }
                    }
                }}
                placement="topRight"
                trigger={['click']}
                arrow={{ pointAtCenter: true }}
            >
                <MenuOutlined />
            </Dropdown>
            <Drawer
                title={'Setting'}
                width={'50%'}
                closable={false}
                onClose={() => setShowSettingDrawer(false)}
                open={showSettingDrawer}
            >
                {Boolean(site && account) && (
                    <AccountDetail
                        site={site!}
                        changeAccounts={changeAccounts}
                        account={account!}
                    ></AccountDetail>
                )}
            </Drawer>
        </View>
    );
};

export default MenuBtn;
