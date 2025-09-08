import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import { useEffectOnce } from '@cicy/app/dist/hooks/hooks';
import { GlobalProvider } from './providers/GlobalProvider';
import { ConfigProvider, theme } from 'antd';
import { useLocalStorageState } from '@cicy/utils';

import Index from './pages/Index';
import './boot';
import { useLayoutEffect } from 'react';
import { View } from '@cicy/app';
import UserAvatar from './pages/UserAvatar';
import UserBalanceDetail from './pages/UserBalanceDetail';
import UserInvite from './pages/UserInvite';
import UserInviteMine from './pages/UserInviteMine';
import UserBuyVip from './pages/UserBuyVip';
import UserDeposit from './pages/UserDeposit';
import UserOrder from './pages/UserOrder';
import UserMyOrder from './pages/UserMyOrder';
import UserMyOrderTickets from './pages/UserMyOrderTickets';
import PayQrcode from './pages/manage/PayQrcode';
import OrderUpdate from './pages/manage/OrderUpdate';
import ManageTickets from './pages/manage/ManageTickets';
import ManageTicketsReply from './pages/manage/ManageTicketsReply';

const router = createHashRouter([
    {
        path: '/',
        Component: Index,
        children: [
            {
                index: true,
                element: <Navigate to="/" replace />
            }
        ]
    },
    {
        path: '/user/avatar',
        Component: UserAvatar
    },

    {
        path: '/user/balance/detail',
        Component: UserBalanceDetail
    },
    {
        path: '/user/invite',
        Component: UserInvite
    },

    {
        path: '/user/invite/mine',
        Component: UserInviteMine
    },

    {
        path: '/user/buy/vip',
        Component: UserBuyVip
    },

    {
        path: '/user/deposit',
        Component: UserDeposit
    },
    {
        path: '/user/order/:id',
        Component: UserOrder
    },
    {
        path: '/user/my/order',
        Component: UserMyOrder
    },
    {
        path: '/user/my/order/tickets/:id',
        Component: UserMyOrderTickets
    },

    {
        path: '/manage/order/update',
        Component: OrderUpdate
    },
    {
        path: '/manage/pay/qrcode',
        Component: PayQrcode
    },
    {
        path: '/manage/tickets',
        Component: ManageTickets
    },
    {
        path: '/manage/tickets/reply/:id',
        Component: ManageTicketsReply
    }
]);

export const AppInner = () => {
    return <RouterProvider router={router} />;
};

const App = () => {
    useEffectOnce(() => {}, []);
    useLayoutEffect(() => {
        document.documentElement.setAttribute('data-prefers-color-scheme', 'dark');
    }, []);
    const [showSplash, setShowSplash] = useLocalStorageState('showSplash', true);
    if (showSplash) {
        return (
            <View
                absFull
                style={{
                    backgroundImage: 'url(/img/splash.jpg)',
                    backgroundSize: 'cover',
                    backgroundAttachment: 'fixed',
                    backgroundRepeat: 'no-repeat'
                }}
                center
            >
                <div id="id-com-tip" className="com-tip-content">
                    <div id="id-com-tip-title" className="com-tip-content-title">
                        未成年人警告!
                    </div>
                    <div className="com-tip-content-des">
                        <div id="id-com-tip-des" className="com-tip-content-des-text">
                            <div className="">
                                <div className="">本应用申明：</div>
                                <View className="" mb12 mt12>
                                    本站資訊以及連結含有部分少兒不宜限制級內容且本網站已依台灣網站內容分級規定處理
                                </View>
                                <View mb12 className="" style={{ color: 'red' }}>
                                    限18歲以上及願意接受者方可進入
                                </View>
                                <View className="startup-yearold-space" mb12>
                                    PROHIBITED TO PERSONS UNDER{' '}
                                    <span style={{ color: 'red' }}>18</span> YEARS OLD
                                </View>
                                <View className="" mb12>
                                    成人向けコンテンツを含んでおりますのでご注意ください。
                                </View>
                                <div className="">
                                    <span style={{ color: 'red' }}>18</span>
                                    歳未満の方はご遠慮願います。
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="id-com-tip-area" className="com-tip-content-btn-area">
                        <View
                            onClick={() => {
                                setShowSplash(false);
                            }}
                            pointer
                            id="id-com-tip-left"
                            className="com-tip-content-btn-center"
                            style={{
                                display: 'block'
                            }}
                        >
                            已满18
                        </View>
                        <View
                            pointer
                            id="id-com-tip-right"
                            className="com-tip-content-btn-right com-tip-content-btn-center"
                            style={{
                                display: 'block'
                            }}
                        >
                            未满18
                        </View>
                    </div>
                </div>
            </View>
        );
    }
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm
            }}
        >
            <GlobalProvider>
                <AppInner></AppInner>
            </GlobalProvider>
        </ConfigProvider>
    );
};
export { App };
