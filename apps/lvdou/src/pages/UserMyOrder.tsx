import { View } from '@cicy/app';
import { Button, Card, Dropdown, PullToRefresh, Radio, Space, Tabs } from 'antd-mobile';
import { useEffect, useState } from 'react';
import axios from 'axios';
import EmptyView from '../components/EmptyView';

import { useNavigate } from 'react-router';
import { formatDateTime } from '../utils/utils';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

export interface OrderInfo {
    status: number;
    id: number;
    order_info: string;
    pay_method: string;
    amount: number;
    amount_real: number;
    add_first: number;
    order_type: string;
    pay_type: string;
    order_no: string;
    created_at: number;
    updated_at: number;
}
export function OrderCard({ order }: { order: OrderInfo }) {
    return (
        <View>
            <View>
                订单类型:
                {
                    {
                        wallet: '钱包充值',
                        vip: 'VIP开通'
                    }[order.order_type]
                }
            </View>
            <View>
                订单状态:
                {
                    {
                        0: '处理中',
                        1: '支付成功',
                        2: '支付失败'
                    }[order.status]
                }
            </View>
            <View>订单金额: {order.amount} 元</View>
            <View>应付金额: {order.amount_real} 元</View>
            <View>创建时间:{formatDateTime(order.created_at)}</View>
            {order.status > 0 && (
                <View>
                    更新时间:
                    {formatDateTime(order.updated_at)}
                </View>
            )}
        </View>
    );
}
const UserMyOrder = () => {
    let navigate = useNavigate();

    const [status, setStatus] = useState('0');
    const [orderType, setOrderType] = useState('all');
    const [orders, setOrders] = useState<OrderInfo[]>([]);
    const fetchOrder = (status: number, order_type?: string) => {
        return axios
            .request({
                url: '/order/list',
                params: {
                    status,
                    offset: 0,
                    order_type,
                    limit: 10000
                }
            })
            .then(res => res.data);
    };
    useEffect(() => {
        fetchOrder(0, 'all').then(res => {
            setOrders(res.orders);
        });
    }, []);
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
                    我的订单
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter>
                <Dropdown>
                    <Dropdown.Item key="sorter" title="订单类型">
                        <div style={{ padding: 12 }}>
                            <Radio.Group
                                defaultValue={orderType}
                                onChange={orderType => {
                                    setOrderType(orderType.toString());
                                    fetchOrder(Number(status), orderType.toString()).then(res => {
                                        setOrders(res.orders);
                                    });
                                }}
                            >
                                <Space direction="vertical" block>
                                    <Radio block value="all">
                                        全部
                                    </Radio>
                                    <Radio block value="vip">
                                        VIP开通
                                    </Radio>
                                    <Radio block value="wallet">
                                        钱包充值
                                    </Radio>
                                </Space>
                            </Radio.Group>
                        </div>
                    </Dropdown.Item>
                </Dropdown>
            </View>
            <View absFull top={44} h={44}>
                <View>
                    <Tabs
                        defaultActiveKey={status}
                        onChange={k => {
                            setStatus(k);
                            fetchOrder(Number(k), orderType).then(res => {
                                setOrders(res.orders);
                            });
                        }}
                    >
                        <Tabs.Tab title="全部" key="-1"></Tabs.Tab>
                        <Tabs.Tab title="处理中" key="0"></Tabs.Tab>
                        <Tabs.Tab title="充值成功" key="1"></Tabs.Tab>
                        <Tabs.Tab title="充值失败" key="2"></Tabs.Tab>
                    </Tabs>
                </View>
            </View>
            <View absFull top={44 * 2} overflowYAuto>
                {orders.length > 0 && (
                    <PullToRefresh
                        onRefresh={async () => {
                            fetchOrder(Number(status), orderType).then(res => {
                                setOrders(res.orders);
                            });
                        }}
                    >
                        {orders.length > 0 && (
                            <View px={8}>
                                {orders.map(order => {
                                    return (
                                        <View key={order.order_no}>
                                            <Card
                                                style={{
                                                    userSelect: 'text',
                                                    position: 'relative',
                                                    borderRadius: '16px'
                                                }}
                                                title={
                                                    <View useSelectText>
                                                        订单号: {order.order_no}
                                                    </View>
                                                }
                                            >
                                                <OrderCard order={order} />
                                                <View mt={12} row jEnd>
                                                    <Button
                                                        onClick={() => {
                                                            navigate(
                                                                `/user/my/order/tickets/${order.id}`
                                                            );
                                                        }}
                                                        color={'primary'}
                                                        size={'mini'}
                                                    >
                                                        工单
                                                    </Button>
                                                </View>
                                            </Card>
                                            <View h={10}></View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </PullToRefresh>
                )}
                {orders.length === 0 && <EmptyView></EmptyView>}
            </View>
        </View>
    );
};
export default UserMyOrder;
