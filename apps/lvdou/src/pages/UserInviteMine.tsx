import { View } from '@cicy/app';
import { List, PullToRefresh, SearchBar } from 'antd-mobile';
import EmptyView from '../components/EmptyView';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDateTime, maskUserName } from '../utils/utils';
import { useGlobalContext } from '../providers/GlobalProvider';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserInviteMine = () => {
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState<
        { id: number; username: string; uid: number; uid_by: number; created_at: number }[]
    >([]);
    const fetchRows = async () => {
        return axios.get('/user/invite/list').then(res => res.data);
    };
    useEffect(() => {
        fetchRows().then(res => setRows(res));
    }, []);
    let items = rows;
    if (search) {
        items = rows.filter(row => row.username.indexOf(search) > -1);
    }
    const { state, fetchAppSetting } = useGlobalContext();
    useEffect(() => {
        fetchAppSetting();
    }, []);
    const { authUser } = state;
    const balance = authUser ? authUser.balance_withdraw : 0.0;
    console.log(authUser);
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
                    我的推广
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter></View>

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
                        可提现余额
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
            </View>

            <View px12 abs top={44 * 3} xx0 h={44} pt={8}>
                <SearchBar
                    onClear={() => {
                        setSearch('');
                    }}
                    onChange={v => {
                        setSearch(v);
                    }}
                    placeholder={'请输入用户名'}
                />
            </View>
            <View absFull top={44 * 4} overflowYAuto>
                <PullToRefresh
                    onRefresh={async () => {
                        fetchRows().then(res => setRows(res));
                    }}
                >
                    <List>
                        {items.map(row => {
                            return (
                                <List.Item key={row.id} extra={formatDateTime(row.created_at)}>
                                    {maskUserName(row.username)}
                                </List.Item>
                            );
                        })}
                    </List>
                </PullToRefresh>

                {rows.length === 0 && <EmptyView title={'您还没有推广好友'}></EmptyView>}
            </View>
        </View>
    );
};

export default UserInviteMine;
