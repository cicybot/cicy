import { View } from '@cicy/app';
import PayBottom from '../components/pay/PayBottom';
import { ClockCircleOutline } from 'antd-mobile-icons';
import { useEffect, useState } from 'react';
import PayInfo from '../components/pay/PayInfo';
import { Col, Row } from 'antd';
import { useGlobalContext } from '../providers/GlobalProvider';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserDeposit = () => {
    const { state, fetchAppSetting } = useGlobalContext();
    const { authUser } = state;
    const { wallet_deposit_items: depositItems } = state;
    const { balance, wallet_first } = authUser || {};
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const depositItem = depositItems[currentItemIndex] || null;
    useEffect(() => {
        fetchAppSetting();
    }, []);
    return (
        <View
            absFull
            overflowHidden
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
                    钱包充值
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter></View>

            <View
                absFull
                top={44}
                h={44}
                rowVCenter
                center
                style={{
                    backgroundImage: 'linear-gradient(-72deg, #43256a 0%, #463d89 100%)'
                }}
            >
                <View mr12>
                    <ClockCircleOutline />
                </View>
                <View>充值成功，立赠VIP福利哦！</View>
            </View>
            <View absFull top={44 * 2} bottom={64}>
                <View rowVCenter ml12 h={44} fontSize={16} mb12>
                    <View>钱包余额：</View>
                    <View mx={6}>
                        <img style={{ width: 16 }} src={'/img/common_coin@2x.png'} alt="" />
                    </View>
                    <View>{balance || '0.00'}</View>
                </View>
                <View h={44} ml12 fontSize={16} column>
                    <View>请选择充值金额</View>
                    {wallet_first && (
                        <View fontSize={12} color={'var(--adm-color-weak)'}>
                            首冲活动最低充值金额为99
                        </View>
                    )}
                </View>
                <View ml12 rowVCenter mt12>
                    <Row gutter={[16, 24]}>
                        {depositItems.map(({ gift, vipGift, amount }, i) => {
                            return (
                                <Col key={i} className="gutter-row">
                                    <View
                                        relative
                                        onClick={() => {
                                            setCurrentItemIndex(i);
                                        }}
                                        rowVCenter
                                        px={12}
                                        w={100}
                                        py={8}
                                        h={64}
                                        borderBox
                                        borderRadius={8}
                                        style={{
                                            border:
                                                i === currentItemIndex
                                                    ? '2px solid var(--adm-color-primary)'
                                                    : '1px solid var(--adm-color-weak)'
                                        }}
                                    >
                                        <View
                                            abs
                                            bottom0
                                            right0
                                            hide={!gift}
                                            borderRadius={6}
                                            px12
                                            bgColor={'var(--adm-color-primary)'}
                                        >
                                            {vipGift && <View pr={4}>送{vipGift}天vip</View>}
                                        </View>
                                        {wallet_first && (
                                            <View abs top0 left0 hide={amount < 99}>
                                                <img
                                                    style={{ width: 36 }}
                                                    src="/img/rchg_tag_first@2x.png"
                                                    alt=""
                                                />
                                            </View>
                                        )}

                                        <View mr={6} ml={10}>
                                            <img
                                                style={{ width: 16 }}
                                                src={'/img/common_coin@2x.png'}
                                                alt=""
                                            />
                                        </View>
                                        <View fontSize={16} fontWeight={700}>
                                            {amount}
                                        </View>
                                    </View>
                                </Col>
                            );
                        })}
                    </Row>
                </View>
                <PayInfo />
            </View>

            {depositItem && (
                <PayBottom
                    payInfo={{
                        order_info: JSON.stringify(depositItem),
                        order_type: 'wallet',
                        add_first: wallet_first ? depositItem.add_first : 0,
                        amount: depositItem.amount
                    }}
                />
            )}
        </View>
    );
};
export default UserDeposit;
