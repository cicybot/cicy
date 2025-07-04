import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';

import { MenuOutlined } from '@ant-design/icons';
import View from '../../components/View';
import WebviewTag = Electron.WebviewTag;
import { SiteService } from '../../services/SiteService';
const items: MenuProps['items'] = [
    {
        key: 'home',
        label: '主页'
    },
    {
        key: 'back',
        label: '后退'
    },
    {
        key: 'reload',
        label: '刷新'
    },
    {
        key: 'openDevTools',
        label: '控制台'
    }
];

const MenuBtn = ({ siteService,webview }: { siteService:SiteService,webview: WebviewTag }) => (
    <View center mr={18} pointer>
        <Dropdown
            menu={{
                items,
                onClick: async ({ key }: { key: string }) => {
                    switch (key) {
                        case 'home': {
                            const {url} = await siteService.getSiteInfo()
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
    </View>
);

export default MenuBtn;
