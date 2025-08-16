import React, { useEffect, useState } from 'react';
import {
    ArrowLeftOutlined,
    BugOutlined,
    HomeOutlined,
    ReloadOutlined,
    SecurityScanOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { Drawer, GetProp, Menu, MenuProps } from 'antd';
import View from '../View';
import { SiteAccountInfo, SiteInfo, SiteService } from '../../services/model/SiteService';
import { onEvent } from '../../utils/utils';
import { SiteAccount } from '../../services/model/SiteAccount';
import { AccountDetail } from '../Tables/SiteAccountsTable';

import styled from 'styled-components';
import WebviewTag = Electron.WebviewTag;

const StyledMenu = styled(Menu)`
    .ant-menu-item {
        line-height: 36px;
        height: 36px;
    }
`;
type MenuItem = GetProp<MenuProps, 'items'>[number];

export interface ContextMenuParams {
    linkText: string;
    selectionRect: { x: number; y: number; height: number; width: number };
    linkURL: string;
    selectionText: string;
    x: number;
    y: number;
}

const Setting = ({ siteService }: { siteService: SiteService }) => {
    const changeAccounts = async (account: SiteAccountInfo) => {
        if (site) {
            return;
        }
        onEvent('showLoading');
        await new SiteAccount(site!.site_id, account.account_index).save(account);
        onEvent('hideLoading');
    };
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
    if (!Boolean(site && account)) {
        return null;
    }
    return (
        <AccountDetail
            site={site!}
            changeAccounts={changeAccounts}
            account={account!}
        ></AccountDetail>
    );
};
const ContextMenuView = ({
    hideContextMenu,
    params,
    webview,
    proxyRules,
    siteService
}: {
    hideContextMenu: () => void;
    params: ContextMenuParams | null;
    proxyRules: string;
    siteService: SiteService;
    webview: WebviewTag;
}) => {
    const [showSettingDrawer, setShowSettingDrawer] = useState(false);

    if (!params) {
        return (
            <Drawer
                title={'设置'}
                width={'50%'}
                closable={false}
                onClose={() => setShowSettingDrawer(false)}
                open={showSettingDrawer}
            >
                {showSettingDrawer && <Setting siteService={siteService}></Setting>}
            </Drawer>
        );
    }
    const width = 240;
    const { innerWidth } = window;

    const items: MenuItem[] = [
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
            type: 'divider'
        },
        {
            key: 'setting',
            label: '设置',
            icon: <SettingOutlined />
        },
        {
            type: 'divider'
        }
    ];

    if (proxyRules) {
        items.push({
            key: 'proxy',
            label: `代理:${proxyRules}`,
            icon: <SecurityScanOutlined />
        });
    }

    items.push({
        key: 'openDevTools',
        label: '检查元素',
        icon: <BugOutlined />
    });

    let { x, y, selectionText } = params;
    selectionText = selectionText.trim();

    if (selectionText) {
        x = params.selectionRect.x;
        y = params.selectionRect.y + params.selectionRect.height;
    }
    if (x + width > innerWidth) {
        x = innerWidth - width - 24;
    }

    if (y + width > innerHeight) {
        y = innerHeight - width - 24;
    }
    return (
        <View
            absFull
            onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onClick={() => {
                hideContextMenu();
            }}
        >
            <View
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }}
                borderBox
                borderRadius={12}
                p={2}
                bgColor={'white'}
                overflowHidden
                style={{ border: '1px solid #e9e9e9' }}
                w={width}
                x={x}
                y={y}
                abs
            >
                <StyledMenu
                    onSelect={async ({ key }: { key: string }) => {
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
                                webview && webview.inspectElement(params.x, params.y);
                                break;
                            }
                            case 'setting': {
                                setShowSettingDrawer(true);
                                break;
                            }
                            default:
                                break;
                        }

                        hideContextMenu();
                    }}
                    style={{ width: width, paddingRight: 4 }}
                    defaultSelectedKeys={[]}
                    defaultOpenKeys={[]}
                    mode={'inline'}
                    theme={'light'}
                    items={items}
                />
            </View>
        </View>
    );
};

export default ContextMenuView;
