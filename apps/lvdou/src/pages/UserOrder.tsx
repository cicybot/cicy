import { View } from '@cicy/app';
import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Toast } from 'antd-mobile';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserOrder = () => {
    const { id } = useParams();
    const [orderDetail, setOrderDetail] = useState<null | {
        pay_url: string;
        pay_tips: string;
        order: {
            id: number;
            amount_real: number;
        };
    }>(null);
    useEffect(() => {
        const loading = Toast.show({
            content: '正在加载',
            icon: 'loading'
        });
        axios
            .post(`/order/detail`, { id })
            .then(res => {
                const { order, pay_tips, pay_url } = res.data;
                setOrderDetail({ order, pay_url, pay_tips });
            })
            .finally(() => loading.close());
        return () => {
            loading.close();
        };
    }, []);
    if (!orderDetail) {
        return null;
    }
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
                    支付订单
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter></View>
            <View absFull top={44} overflowYAuto>
                <View center mt={10} mb={8}>
                    付款金额
                </View>
                <View center mb12 fontSize={32} fontWeight={700} rowVCenter>
                    {orderDetail.order.amount_real}
                    <View ml12 fontSize={12} mt={10}>
                        元
                    </View>
                </View>
                <View center mt12>
                    <img style={{ width: 260 }} src={orderDetail.pay_url} alt="" />
                </View>
                <View mt={24} ml12>
                    {orderDetail.pay_tips.split('\n').map((row, i) => {
                        return (
                            <View mb={6} key={i}>
                                {row}
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};
export default UserOrder;
