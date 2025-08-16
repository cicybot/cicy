import { AndroidOutlined, SettingOutlined, WindowsOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FingerPrint } from './Icons';
import styled from 'styled-components';

type MenuItem = Required<MenuProps>['items'][number];

const StyledDiv = styled('div')`
    height: 100vh;
    position: relative;
    .ant-menu-item:last-child {
        position: absolute;
        bottom: 24px;
        transition: none;
    }
    .ant-menu-item.ant-menu-item-selected:last-child {
        width: 44px;
        padding-inline: calc(50% - 24px);
        left: 12px;
    }
`;
const items: MenuItem[] = [
    { key: '/android', icon: <AndroidOutlined />, label: '安卓连接器' },
    { key: '/sites', icon: <WindowsOutlined />, label: '站点' },
    {
        key: '/browserAccounts',
        icon: <FingerPrint></FingerPrint>,
        label: '指纹浏览器'
    },
    { key: '/setting', icon: <SettingOutlined />, label: '设置' }
];

const SizeBar = ({ sideBarWidth, minSideBar }: { sideBarWidth: number; minSideBar: boolean }) => {
    let navigate = useNavigate();
    let location = useLocation();

    return (
        <StyledDiv>
            <Menu
                defaultSelectedKeys={[location.pathname === '/' ? '/android' : location.pathname]}
                mode="inline"
                style={{
                    width: sideBarWidth,
                    height: '100%',
                    paddingInline: 12,
                    paddingTop: 24
                }}
                onSelect={({ key }: { key: string }) => {
                    switch (key) {
                        default:
                            navigate(key);
                            break;
                    }
                }}
                theme="dark"
                inlineCollapsed={minSideBar}
                items={items}
            />
        </StyledDiv>
    );
};

export default SizeBar;
