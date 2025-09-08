import { View } from '@cicy/app';
import { Button, Card, Dialog, SearchBar, Toast } from 'antd-mobile';
import { useState } from 'react';
import axios from 'axios';
import { formatDateTime } from '../../utils/utils';
import HeaderLeftIcon from '../../components/HeaderLeftIcon';
import { useGlobalContext } from '../../providers/GlobalProvider';
import { useAuthLogin } from '../../hooks/useAuthLogin';

const OrderUpdate = () => {
    const { state } = useGlobalContext();
    console.log('authUser:', state.authUser);
    const [amount, setAmount] = useState('');
    const [order, setOrder] = useState<any | null>(null);
    const t: any = {
        wallet: '钱包充值',
        vip: 'VIP开通'
    };
    const t1: any = {
        0: '处理中',
        1: '支付成功',
        2: '支付失败'
    };
    useAuthLogin();
    if (!state.authUser) {
        return null;
    }
    return (
        <View absFull>
            <View>
                <HeaderLeftIcon />
                <View abs top0 xx0 h={44} center>
                    <View fontSize={16} fontWeight={700}>
                        更新订单
                    </View>
                </View>
                <View abs right0 w={64} zIdx={1111} h={44} jEnd aCenter></View>
            </View>
            <View absFull top={44} h={44} px12 rowVCenter jSpaceBetween>
                <View w={'calc(100% - 74px)'}>
                    <SearchBar
                        onClear={() => {
                            setOrder(null);
                            setAmount('');
                        }}
                        onChange={v => {
                            setAmount(v);
                        }}
                        placeholder={'带小数点的订单金额'}
                    />
                </View>
                <View w={64}>
                    <Button
                        onClick={async () => {
                            if (!amount || !amount.trim()) {
                                Toast.show('金额不能为空！');
                                return;
                            }
                            try {
                                const res = await axios.get(
                                    `/order/by/amount?amount=${amount.trim()}`
                                );
                                const order = res.data;
                                setOrder(order);
                            } catch (e: any) {
                                if (e.response && e.response.data && e.response.data.detail) {
                                    Toast.show(e.response.data.detail);
                                } else {
                                    Toast.show(e.message);
                                }
                            }
                        }}
                        size={'mini'}
                        color={'primary'}
                    >
                        查询
                    </Button>
                </View>
            </View>

            <View absFull top={44 * 2} overflowHidden>
                {order && (
                    <View>
                        <Card
                            style={{
                                lineHeight: 2,
                                userSelect: 'text',
                                position: 'relative',
                                borderRadius: '16px'
                            }}
                            title={<View useSelectText>订单号: {order.order_no}</View>}
                        >
                            <View>
                                订单类型:
                                {t[order.order_type]}
                            </View>
                            <View rowVCenter>
                                订单状态:
                                <View fontWeight={700} ml12 color={'green'}>
                                    {t1[order.status]}
                                </View>
                            </View>
                            <View>订单金额: {order.amount} 元</View>
                            <View>应付金额: {order.amount_real} 元</View>
                            <View>创建时间:{formatDateTime(order.created_at)}</View>
                            {order.status > 0 && (
                                <View>更新时间:{formatDateTime(order.updated_at)}</View>
                            )}
                            <View mt={12} row jEnd hide={order.status !== 0}>
                                <Button
                                    onClick={() => {
                                        Dialog.confirm({
                                            content: '确定？',
                                            onConfirm: async () => {
                                                try {
                                                    await axios.post(
                                                        '/order/update/status/by/amount',
                                                        {
                                                            amount,
                                                            status: 1
                                                        }
                                                    );
                                                    const res = await axios.get(
                                                        `/order/by/amount?amount=${amount.trim()}`
                                                    );
                                                    const order = res.data;
                                                    setOrder(order);
                                                    Toast.show('操作成功');
                                                } catch (e: any) {
                                                    if (
                                                        e.response &&
                                                        e.response.data &&
                                                        e.response.data.detail
                                                    ) {
                                                        Toast.show(e.response.data.detail);
                                                    } else {
                                                        Toast.show(e.message);
                                                    }
                                                }
                                            }
                                        });
                                    }}
                                    color={'primary'}
                                    size={'mini'}
                                >
                                    支付成功
                                </Button>
                            </View>
                        </Card>
                        <View h={10}></View>
                    </View>
                )}
            </View>
        </View>
    );
};

export default OrderUpdate;
