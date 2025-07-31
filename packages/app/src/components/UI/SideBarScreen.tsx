import {
    ArrowLeftOutlined,
    HomeOutlined,
    RotateRightOutlined,
    SettingOutlined,
    WindowsFilled
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
    { key: 'home', icon: <HomeOutlined />, label: '主屏幕' },
    { key: 'recent', icon: <WindowsFilled />, label: '最近' },
    { key: 'back', icon: <ArrowLeftOutlined />, label: '后退' },
    { key: 'rotate', icon: <RotateRightOutlined />, label: '旋转  ' },
    { key: 'setting', icon: <SettingOutlined />, label: '设置' }
];

const SizeBarScreen = ({
    sideBarWidth,
    minSideBar
}: {
    sideBarWidth: number;
    minSideBar: boolean;
}) => {
    let navigate = useNavigate();
    let location = useLocation();
    return (
        <Menu
            mode="inline"
            style={{ width: sideBarWidth, height: '100%', paddingInline: 4, paddingTop: 24 }}
            onClick={({ key }: { key: string }) => {
                window.dispatchEvent(
                    new CustomEvent('SIDE_BAR_ACTIONS', {
                        detail: {
                            action: key
                        }
                    })
                );
            }}
            theme="light"
            inlineCollapsed={minSideBar}
            items={items}
        />
    );
};

export default SizeBarScreen;
