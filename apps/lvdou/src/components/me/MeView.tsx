import { View } from '@cicy/app';
import { Dialog, List, Toast } from 'antd-mobile';
import {
    BillOutline,
    DownlandOutline,
    StopOutline,
    UnorderedListOutline,
    UserSetOutline
} from 'antd-mobile-icons';
import { PageNav, useGlobalContext } from '../../providers/GlobalProvider';
import { maskUserName, validateChinaMobile } from '../../utils/utils';
import { useNavigate } from 'react-router';
import { ShareAltOutlined } from '@ant-design/icons';
import { useEffect } from 'react';

const MeView = () => {
    let navigate = useNavigate();
    const { state, dispatch, fetchAppSetting } = useGlobalContext();
    const { app_download_url, service } = state;
    const { authUser } = state;
    useEffect(() => {
        fetchAppSetting();
    }, []);
    function checkLogin(goLogin: boolean) {
        if (!authUser) {
            if (goLogin) {
                dispatch({
                    type: 'UPDATE_STATE',
                    payload: {
                        currentPage: PageNav.Login
                    }
                });
            }
            return false;
        }
        return true;
    }

    const { invite_code, balance } = authUser || {};
    return (
        <View wh100p px12 borderBox overflowYAuto>
            <View mb={24} mt={32} rowVCenter>
                <View wh={64} pointer borderRadius={32} overflowHidden>
                    <img
                        onClick={() => {
                            if (checkLogin(true)) {
                                navigate('/user/avatar');
                            }
                        }}
                        style={{ width: '100%', height: '100%' }}
                        src={(() => {
                            if (authUser) {
                                const { avatar } = authUser;
                                if (avatar.startsWith('http')) {
                                    return avatar as string;
                                } else {
                                    return `/img/avatar/a${avatar}.png`;
                                }
                            }
                            return `/img/avatar/a1.png`;
                        })()}
                        alt=""
                    />
                </View>
                {authUser ? (
                    <View fontSize={16} fontWeight={700} ml12 column>
                        <View mb={6}>
                            {(() => {
                                if (validateChinaMobile(authUser.username)) {
                                    const mobile = authUser.username;
                                    return maskUserName(mobile);
                                }
                                return authUser.username;
                            })()}
                        </View>
                        <View
                            pointer
                            useSelectText
                            onClick={e => {
                                navigator.clipboard
                                    .writeText(invite_code!)
                                    .then(() => {
                                        Toast.show('已复制到剪贴板！');
                                    })
                                    .catch(() => {
                                        Toast.show('复制失败');
                                    });
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            fontSize={12}
                        >
                            邀请码: {invite_code}
                        </View>
                    </View>
                ) : (
                    <View
                        fontSize={16}
                        onClick={() => {
                            checkLogin(true);
                        }}
                        fontWeight={700}
                        ml12
                    >
                        登录 ｜ 注册
                    </View>
                )}
            </View>
            <View mb12 mt12 row jSpaceAround>
                <View
                    w={156}
                    h={60}
                    style={{
                        background: 'url(/img/me/my_money_money_bg@2x.png) center/contain no-repeat'
                    }}
                    onClick={() => {
                        if (checkLogin(true)) {
                            navigate('/user/balance/detail');
                        }
                    }}
                    column
                    borderBox
                    px12
                    pt={8}
                >
                    <View fontSize={14} fontWeight={700} mb={2}>
                        钱包余额
                    </View>
                    <View fontSize={18} fontWeight={700}>
                        {balance || '0.00'}
                    </View>
                </View>
                <View
                    w={156}
                    h={60}
                    onClick={() => {
                        if (checkLogin(true)) {
                            navigate('/user/invite');
                        }
                    }}
                    pointer
                    style={{
                        background: 'url(/img/me/my_money_share_bg@2x.png) center/contain no-repeat'
                    }}
                    borderBox
                    px12
                    pt={8}
                >
                    <View fontSize={14} fontWeight={700} mb={2}>
                        分享送VIP
                    </View>
                    <View>推广成功获得两天VIP</View>
                </View>
            </View>
            <View mb12 rowVCenter jSpaceAround mt={24}>
                <View
                    pointer
                    onClick={() => {
                        if (checkLogin(true)) {
                            navigate('/user/buy/vip');
                        }
                    }}
                >
                    <View center px={12} py={12}>
                        <img
                            style={{
                                width: 32,
                                height: 32
                            }}
                            src={'/img/me/my_money_ic_vip@2x.png'}
                            alt=""
                        />
                    </View>
                    <View center>购买会员</View>
                </View>
                <View
                    ml12
                    pointer
                    onClick={() => {
                        if (checkLogin(true)) {
                            navigate('/user/deposit');
                        }
                    }}
                >
                    <View center px={12} py={12}>
                        <img
                            style={{
                                width: 32,
                                height: 32
                            }}
                            src={'/img/me/my_money_ic_rchg@2x.png'}
                            alt=""
                        />
                    </View>
                    <View center>钱包充值</View>
                </View>
                <View
                    hide
                    ml12
                    pointer
                    onClick={() => {
                        if (checkLogin(true)) {
                            navigate('/user/buy/withdraw');
                        }
                    }}
                >
                    <View center px={12} py={12}>
                        <img
                            style={{
                                width: 32,
                                height: 32
                            }}
                            src={'/img/me/my_money_ic_wd@2x.png'}
                            alt=""
                        />
                    </View>
                    <View center>提现</View>
                </View>
            </View>
            <View mt={24} red>
                <List>
                    {/*<List.Item prefix={<SetOutline />} onClick={() => {}}>*/}
                    {/*    设置*/}
                    {/*</List.Item>*/}
                    <List.Item
                        prefix={<UnorderedListOutline />}
                        onClick={() => {
                            if (checkLogin(true)) {
                                navigate('/user/my/order');
                            }
                        }}
                    >
                        我的订单
                    </List.Item>
                    <List.Item
                        prefix={<BillOutline />}
                        onClick={() => {
                            if (checkLogin(true)) {
                                navigate('/user/balance/detail');
                            }
                        }}
                    >
                        账户明细
                    </List.Item>
                    <List.Item
                        prefix={<ShareAltOutlined />}
                        onClick={() => {
                            if (checkLogin(true)) {
                                navigate('/user/invite/mine');
                            }
                        }}
                    >
                        我的推广
                    </List.Item>
                    {service && (
                        <List.Item
                            prefix={<UserSetOutline />}
                            onClick={() => {
                                location.href = service.url;
                            }}
                            extra={service.name}
                        >
                            官方群
                        </List.Item>
                    )}

                    {/*<List.Item prefix={<SetOutline />} onClick={() => {}}>*/}
                    {/*    联系客服*/}
                    {/*</List.Item>*/}
                    {app_download_url && (
                        <List.Item
                            prefix={<DownlandOutline />}
                            onClick={() => {
                                location.href = app_download_url;
                            }}
                            extra={app_download_url}
                        >
                            下载App
                        </List.Item>
                    )}

                    {authUser && (
                        <List.Item
                            prefix={<StopOutline />}
                            onClick={() => {
                                Dialog.confirm({
                                    content: '是否退出',
                                    onConfirm: async () => {
                                        dispatch({
                                            type: 'LOGOUT',
                                            payload: {}
                                        });
                                        Toast.show('退出成功');
                                    }
                                });
                            }}
                        >
                            退出
                        </List.Item>
                    )}
                </List>
            </View>
        </View>
    );
};
export default MeView;
