import { View } from '@cicy/app';
import { useEffect, useState } from 'react';
import axios from 'axios';
import EmptyView from '../../components/EmptyView';
import { Card, PullToRefresh, Tabs } from 'antd-mobile';
import { useLocalStorageState } from '@cicy/utils';
import { formatDateTime } from '../../utils/utils';
import { useNavigate } from 'react-router';
import HeaderLeftIcon from '../../components/HeaderLeftIcon';

const ManageTickets = () => {
    let navigate = useNavigate();

    const [rows, setRows] = useState<
        { text: string; is_reply: boolean; order_id: number; updated_at: number; id: number }[]
    >([]);
    const [isAll, setIsAll] = useLocalStorageState('ManageTickets_isAll', false);
    const fetchRows = async (is_all: boolean) => {
        return axios
            .request({
                url: '/order/tickets/session/list',
                params: {
                    is_all
                },
                method: 'GET'
            })
            .then(res => setRows(res.data));
    };
    useEffect(() => {
        fetchRows(isAll);
    }, []);
    return (
        <View absFull>
            <View>
                <HeaderLeftIcon />
                <View abs top0 xx0 h={44} center>
                    <View fontSize={16} fontWeight={700}>
                        工单管理
                    </View>
                </View>
                <View abs right0 w={64} zIdx={1111} h={44} jEnd aCenter></View>
            </View>
            <View absFull top={44} h={44}>
                <View>
                    <Tabs
                        activeKey={isAll ? 'all' : 'waiting'}
                        onChange={k => {
                            setIsAll(k === 'all');
                            fetchRows(k === 'all');
                        }}
                    >
                        <Tabs.Tab title="待处理" key="waiting"></Tabs.Tab>
                        <Tabs.Tab title="全部" key="all"></Tabs.Tab>
                    </Tabs>
                </View>
            </View>

            <View absFull top={44 * 2} overflowHidden>
                {rows.length === 0 && <EmptyView />}
                {rows.length > 0 && (
                    <View px12>
                        <PullToRefresh
                            onRefresh={async () => {
                                await fetchRows(isAll);
                            }}
                        >
                            {rows.map(row => {
                                return (
                                    <View key={row.id}>
                                        <Card>
                                            <View
                                                pointer
                                                onClick={() => {
                                                    navigate(
                                                        `/manage/tickets/reply/${row.order_id}`
                                                    );
                                                }}
                                            >
                                                <View pointer mb12 rowVCenter jSpaceBetween>
                                                    <View rowVCenter>
                                                        订单ID：{row.id}{' '}
                                                        <View ml12>
                                                            {!row.is_reply ? '未回复' : '已回复'}
                                                        </View>
                                                    </View>
                                                    <View>{formatDateTime(row.updated_at)}</View>
                                                </View>
                                                <View>{row.text}</View>
                                            </View>
                                        </Card>
                                        <View h={12}></View>
                                    </View>
                                );
                            })}
                        </PullToRefresh>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ManageTickets;
