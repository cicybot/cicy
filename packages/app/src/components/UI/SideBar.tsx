import { AndroidOutlined, WindowsOutlined,LinkOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
    { key: '/android', icon: <AndroidOutlined />, label: '安卓连接器' },
    { key: '/clients', icon: <LinkOutlined />, label: '客户端' },
    { key: '/sites', icon: <WindowsOutlined />, label: '浏览器' }
];

const SizeBar: React.FC = () => {
    let navigate = useNavigate();
    let location = useLocation();
    return (
        <Menu
            defaultSelectedKeys={[location.pathname === "/"?"/android":location.pathname]}
            mode="inline"
            style={{ width: '100%', height: '100%' }}
            onSelect={({ key }: { key: string }) => {
                switch (key) {
                    default:
                        navigate(key);
                        break;
                }
            }}
            theme="dark"
            inlineCollapsed={false}
            items={items}
        />
    );
};

export default SizeBar;
