import { View } from '@cicy/app';
import { Button, Divider, ImageUploader, List, PullToRefresh, TextArea, Toast } from 'antd-mobile';
import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import EmptyView from '../components/EmptyView';
import axios from 'axios';
import styled from 'styled-components';
import { uploadFile } from '../utils/image';
import { getToken } from '../config';
import md5 from 'md5';
import { formatDateTime } from '../utils/utils';
import PopButton from '../components/PopButton';
import { AuthUser } from '../providers/GlobalProvider';
import { OrderCard, OrderInfo } from './UserMyOrder';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const StyledImageUploader = styled(ImageUploader)`
    .adm-image-uploader-cell {
        display: none;
    }
`;

export function UserCard({ user }: { user: AuthUser }) {
    const levelObj: any = { 0: '普通用户', 1: '超级VIP', 2: '年卡', 3: '月卡' };

    return (
        <View px12 mt12 absFull overflowYAuto>
            <View center fontWeight={700} fontSize={18} mb12 mt12>
                用户资料
            </View>
            <List>
                <List.Item extra={user.id}>UID</List.Item>
                <List.Item extra={user.username}>用户名</List.Item>
                <List.Item extra={user.invite_code}>推荐码</List.Item>
                <List.Item extra={user.invite_by}>被邀请码</List.Item>
                <List.Item extra={user.balance}>钱包余额</List.Item>
                <List.Item extra={user.balance_withdraw}>可提现余额</List.Item>
                <List.Item extra={levelObj[user.level]}>等级</List.Item>
                <List.Item extra={formatDateTime(user.created_at)}>注册时间</List.Item>
                <List.Item extra={user.vip_expired_at ? formatDateTime(user.vip_expired_at) : ''}>
                    Vip截止
                </List.Item>
                <List.Item extra={user.vip_first ? '是' : '否'}>VIP开通首充</List.Item>
                <List.Item extra={user.wallet_first ? '是' : '否'}>钱包首充</List.Item>
            </List>
        </View>
    );
}
const UserMyOrderTickets = ({ isAdmin }: { isAdmin?: boolean }) => {
    const { id } = useParams();
    const [order, setOrder] = useState<null | OrderInfo>(null);
    const [user, setUser] = useState<null | AuthUser>(null);
    const [rows, setRows] = useState<
        {
            id: number;
            is_owner: boolean;
            text: string;
            img: string;
            uid: number;
            created_at: number;
        }[]
    >([]);
    const [text, setText] = useState('');
    const orderId = Number(id);
    const fetchRows = (order_id: number) => {
        return axios
            .request({
                method: 'GET',
                url: '/order/tickets/list',
                params: {
                    order_id,
                    is_admin: !!isAdmin
                }
            })
            .then(res => res.data)
            .then(res => {
                setRows(res.rows);
                setOrder(res.order);
                setUser(res.user);
            });
    };
    useEffect(() => {
        fetchRows(orderId);
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
                    工单: <span style={{ userSelect: 'text' }}>{orderId}</span>
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter></View>

            <View absFull top={44} h={160}>
                <Divider />
                <View px12 mt12>
                    <View>
                        <TextArea
                            onChange={v => {
                                setText(v);
                            }}
                            value={text}
                            autoFocus
                            defaultValue={''}
                            placeholder={'请输入您的具体订单问题'}
                            showCount
                        />
                    </View>
                    <View rowVCenter jSpaceBetween mt12>
                        <Button
                            color={'primary'}
                            onClick={async () => {
                                const t = text;
                                setText('');
                                await axios.post('/order/tickets/create', {
                                    order_id: orderId,
                                    text: t,
                                    img: '',
                                    is_admin: !!isAdmin
                                });
                                await fetchRows(orderId);

                                Toast.show('发送成功');
                            }}
                            size={'small'}
                        >
                            发送
                        </Button>

                        <View rowVCenter>
                            <View mr12>
                                <PopButton height={'75vh'} size={'small'} title={'用户'}>
                                    {user && (
                                        <View>
                                            <UserCard user={user}></UserCard>
                                        </View>
                                    )}
                                </PopButton>
                            </View>

                            <View mr12>
                                <PopButton height={'40vh'} size={'small'} title={'订单'}>
                                    {order && (
                                        <View px12 mt12>
                                            <View mb12 fontSize={18} fontWeight={700}>
                                                订单号:{order.order_no}
                                            </View>
                                            <OrderCard order={order} />
                                            <View mt12 json={JSON.parse(order.order_info)}></View>
                                        </View>
                                    )}
                                </PopButton>
                            </View>
                            <StyledImageUploader
                                value={[]}
                                upload={async file => {
                                    try {
                                        const hash = md5(`${Date.now()}${orderId}`);
                                        const p1 = hash.substring(0, 2);
                                        const p2 = hash.substring(2, 4);
                                        const p3 = hash.substring(4, 6);
                                        const path = `static/${p1}/${p2}/${p3}/${hash}.${file.type.replace(
                                            'image/',
                                            ''
                                        )}`;

                                        await uploadFile(
                                            file,
                                            `${
                                                axios.defaults.baseURL
                                            }/file/upload?path=${encodeURIComponent(`${path}`)}`,
                                            getToken() || ''
                                        );
                                        const img = `${axios.defaults.baseURL!.replace(
                                            '/api',
                                            ''
                                        )}/assets/${path}`;
                                        await axios.post('/order/tickets/create', {
                                            order_id: orderId,
                                            text: '',
                                            img,
                                            is_admin: !!isAdmin
                                        });

                                        await fetchRows(orderId);

                                        Toast.show('上传成功');
                                    } catch (e) {
                                        Toast.show('上传失败');
                                    }

                                    return { url: '' };
                                }}
                            >
                                <Button color={'warning'} size={'small'}>
                                    上传图片
                                </Button>
                            </StyledImageUploader>
                        </View>
                    </View>
                </View>
                <Divider />
            </View>
            <View absFull top={44 + 170} overflowYAuto mt12>
                {rows.length === 0 && <EmptyView></EmptyView>}
                {rows.length > 0 && (
                    <View px12>
                        <PullToRefresh
                            onRefresh={async () => {
                                fetchRows(orderId);
                            }}
                        >
                            {rows.map(row => {
                                return (
                                    <View key={row.id} mb12>
                                        <View jEnd={!row.is_owner}>
                                            <View
                                                style={{ display: 'inline-flex' }}
                                                borderRadius={12}
                                                py={12}
                                                px={12}
                                                bgColor={
                                                    !row.is_owner
                                                        ? 'var(--adm-color-success)'
                                                        : 'var(--adm-color-wathet)'
                                                }
                                                fontSize={14}
                                                relative
                                                mb={24}
                                            >
                                                {row.text || ''}
                                                {row.img && (
                                                    <View w={200}>
                                                        <img
                                                            style={{ width: '100%' }}
                                                            src={row.img}
                                                            alt=""
                                                        />
                                                    </View>
                                                )}
                                                <View
                                                    abs
                                                    jStart
                                                    pl={8}
                                                    left0
                                                    bottom={-16}
                                                    fontSize={12}
                                                    color={'var(--adm-color-text-secondary)'}
                                                >
                                                    {formatDateTime(row.created_at).split(' ')[1]}
                                                </View>
                                            </View>
                                        </View>
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
export default UserMyOrderTickets;
