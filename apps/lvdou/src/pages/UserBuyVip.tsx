import { View } from '@cicy/app';
import { Swiper } from 'antd-mobile';
import PayBottom from '../components/pay/PayBottom';
import PayInfo from '../components/pay/PayInfo';
import { useEffect, useState } from 'react';
import { useGlobalContext, VipItem } from '../providers/GlobalProvider';
import { formatDateTime } from '../utils/utils';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserInvite = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const { state, fetchAppSetting } = useGlobalContext();
    const { vips, authUser } = state;
    let vip_first = false;
    if (authUser) {
        vip_first = authUser.vip_first;
    }
    useEffect(() => {
        fetchAppSetting();
    }, []);
    const vip = vips[currentIndex] || null;

    const items = vips.map(
        ({ amount_first, info, permission, amount, isSupper, title }: VipItem, index) => (
            <Swiper.Item key={index}>
                <View h={160} relative>
                    <View absFull px12 mr12>
                        <View absFull>
                            <img
                                draggable={false}
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                                src={
                                    isSupper
                                        ? '/img/rchg_vip_card_bg_svip@2x.png'
                                        : '/img/rchg_vip_card_bg_vip@2x.png'
                                }
                                alt=""
                            />
                        </View>
                        <View absFull top={32} left={24} right={12}>
                            <View mb={4} fontSize={20} fontWeight={700}>
                                {title}
                            </View>
                            <View mb={12} fontSize={14}>
                                {permission}
                            </View>
                            <View fontSize={12}>{info}</View>
                        </View>

                        {vip_first && (
                            <View abs top0 left0 hide={!amount_first}>
                                <img
                                    style={{ width: 36 }}
                                    src="/img/rchg_tag_first@2x.png"
                                    alt=""
                                />
                            </View>
                        )}

                        <View abs top0 right0 w={44} borderRadius={12}>
                            <img
                                style={{ width: '100%', height: '100%' }}
                                src={
                                    !isSupper
                                        ? '/img/rchg_vip_tag_vip@2x.png'
                                        : '/img/rchg_vip_tag_svip@2x.png'
                                }
                                alt=""
                            />
                        </View>

                        <View mr12 abs bottom={12} px12 xx0 rowVCenter>
                            <img style={{ width: 16 }} src={'/img/common_coin@2x.png'} alt="" />
                            <View ml={6} fontSize={20} fontWeight={700}>
                                {Boolean(amount_first && vip_first) ? (
                                    <View rowVCenter>
                                        {amount_first}
                                        <View
                                            ml={6}
                                            color={'val(--adm-color-text-secondary)'}
                                            fontSize={14}
                                            fontWeight={400}
                                            style={{
                                                textDecoration: 'line-through'
                                            }}
                                        >
                                            ({amount})
                                        </View>
                                    </View>
                                ) : (
                                    <View>{amount}</View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </Swiper.Item>
        )
    );
    const t: any = { 1: vips[0].title, 2: vips[1].title, 3: vips[2].title };
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
                    VIP会员
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter></View>
            <View absFull top={44} bottom={64}>
                <View mt12 mb12>
                    <Swiper
                        defaultIndex={currentIndex}
                        onIndexChange={index => {
                            setCurrentIndex(index);
                        }}
                        slideSize={80}
                        trackOffset={10}
                        stuckAtBoundary={false}
                    >
                        {items}
                    </Swiper>
                </View>

                {authUser?.vip_expired_at && (
                    <View mt={32} ml12>
                        <View rowVCenter mr12 fontSize={16} fontWeight={700}>
                            VIP到期: {formatDateTime(authUser?.vip_expired_at!)}
                        </View>
                    </View>
                )}
                {Boolean(authUser?.level) && (
                    <View mt={12} ml12>
                        <View rowVCenter mr12 fontSize={16} fontWeight={700}>
                            当前等级: {t[authUser?.level!]}
                        </View>
                    </View>
                )}
                <PayInfo />
            </View>

            {Boolean(vip && authUser?.level !== 1) && (
                <PayBottom
                    payInfo={{
                        order_info: JSON.stringify(vip),
                        order_type: 'vip',
                        add_first: vip_first ? vip.add_first : 0,
                        amount: Boolean(vip_first && vip.amount_first)
                            ? vip.amount_first!
                            : vip.amount!
                    }}
                />
            )}
        </View>
    );
};
export default UserInvite;
