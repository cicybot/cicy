import { Badge, TabBar } from 'antd-mobile';
import { AppOutline, SetOutline, UserOutline } from 'antd-mobile-icons';
import { View } from '@cicy/app';
import { TabBarKey, useGlobalContext } from '../providers/GlobalProvider';

export default () => {
    const { state, dispatch } = useGlobalContext();
    const { currentTabBarKey } = state;
    const tabs = [
        {
            key: TabBarKey.Home,
            title: '首页',
            icon: <AppOutline />,
            badge: Badge.dot
        },
        {
            key: TabBarKey.Me,
            title: '我的',
            icon: <UserOutline />
        }
    ];
    if (state.authUser && state.authUser.is_admin) {
        tabs.push({
            key: TabBarKey.Manage,
            title: '管理',
            icon: <SetOutline />
        });
    }
    return (
        <View fixed zIdx={1111111} bottom0 xx0 bgColor={'black'}>
            <TabBar
                onChange={(key: string) => {
                    dispatch({
                        type: 'UPDATE_STATE',
                        payload: {
                            currentTabBarKey: key as TabBarKey
                        }
                    });
                }}
                safeArea
                defaultActiveKey={currentTabBarKey}
            >
                {tabs.map(item => (
                    <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
                ))}
            </TabBar>
        </View>
    );
};
