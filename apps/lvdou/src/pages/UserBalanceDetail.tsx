import { View } from '@cicy/app';
import EmptyView from '../components/EmptyView';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from 'antd-mobile';
import { formatDateTime } from '../utils/utils';
import { useGlobalContext } from '../providers/GlobalProvider';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserBalanceDetail = () => {
    const { state, fetchAppSetting } = useGlobalContext();
    const { authUser } = state;
    const balance = authUser ? authUser.balance : 0.0;
    const [rows, setRows] = useState<
        {
            id: number;
            uid: number;
            info: string;
            kind: string;
            created_at: number;
        }[]
    >([]);
    useEffect(() => {
        fetchAppSetting();
        axios
            .get('/user/activity/list')
            .then(res => res.data)
            .then(rows => setRows(rows));
    }, []);

    const t: any = {
        wallet_gift: '钱包充值加赠',
        invite_add: '推荐加赠',
        wallet_first: '钱包首充加赠',
        vip_first: 'VIP首充加赠',
        wallet: '钱包充值',
        vip: 'VIP开通',
        pay_reward: '订单支付返利'
    };
    return (
        <View
            absFull
            style={{
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat',
                backgroundImage: 'url(/img/auth/reg_bg.jpg)'
            }}
        >
            <HeaderLeftIcon />
            <View abs top0 xx0 h={44} center>
                <View fontSize={16} fontWeight={700}>
                    帐户明细
                </View>
            </View>
            <View abs right0 w={64} zIdx={1111} h={44} jEnd aCenter></View>
            <View
                abs
                top={44}
                xx0
                h={88}
                rowVCenter
                jSpaceBetween
                style={{
                    backgroundImage: 'linear-gradient(-72deg, #43256a 0%, #463d89 100%)'
                }}
            >
                <View>
                    <View ml12 mb12 fontSize={16} mt={16}>
                        帐户余额
                    </View>
                    <View rowVCenter ml12>
                        <View mr12>
                            <img style={{ width: 22 }} src={'/img/common_coin@2x.png'} alt="" />
                        </View>
                        <View fontSize={24} fontWeight={700}>
                            {balance + ''}
                        </View>
                    </View>
                </View>
                <View>
                    <View mr12 mb12 fontSize={16} mt={16}>
                        VIP到期
                    </View>
                    <View rowVCenter mr12 fontSize={18} fontWeight={700}>
                        {formatDateTime(authUser?.vip_expired_at!)}
                    </View>
                </View>
            </View>
            <View absFull top={44 + 88} overflowYAuto>
                {rows.length > 0 && (
                    <View px12 mt12 borderBox>
                        {rows.map(row => {
                            return (
                                <View key={row.id}>
                                    <Card
                                        style={{
                                            userSelect: 'text',
                                            position: 'relative',
                                            borderRadius: '16px'
                                        }}
                                        title={<View>{t[row.kind]}</View>}
                                    >
                                        <View mb12>{row.info}</View>
                                        <View>{formatDateTime(row.created_at)}</View>
                                    </Card>
                                    <View h={10}></View>
                                </View>
                            );
                        })}
                    </View>
                )}
                {rows.length === 0 && <EmptyView />}
            </View>
        </View>
    );
};
export default UserBalanceDetail;
