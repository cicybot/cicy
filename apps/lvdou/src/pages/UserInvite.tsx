import { View } from '@cicy/app';
import { useGlobalContext } from '../providers/GlobalProvider';
import { Toast } from 'antd-mobile';
import { useEffect, useState } from 'react';
import axios from 'axios';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserInvite = () => {
    const { state } = useGlobalContext();
    const { authUser, invite_link, invite_message } = state;
    const { invite_code } = authUser || {};
    const [dailyCount, setDailyCount] = useState(0);
    useEffect(() => {
        axios
            .get('/user/invite/daily/count')
            .then(res => res.data)
            .then(res => {
                setDailyCount(res);
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
                    推广送VIP
                </View>
            </View>
            <View abs right0 w={120} zIdx={1111} h={44} jEnd aCenter></View>
            <View absFull top={44} overflowYAuto>
                <div className="send-vip-content">
                    <div className="send-vip-top">
                        <div className="send-vip-top-bg">
                            <div className="send-vip-top-title"></div>
                            <View
                                borderBox
                                className="send-vip-top-text"
                                style={{
                                    lineHeight: 2
                                }}
                            >
                                每推广
                                <span style={{ color: 'white' }}>1人</span>
                                ，立刻获得
                                <span style={{ color: 'white' }}>1天VIP</span>
                                , 你的好友获得1天VIP
                                <br />
                                单日累计推广
                                <span style={{ color: 'white' }}>6人</span>
                                直接赠送
                                <span style={{ color: 'white' }}>24天VIP</span>
                                <View mt12>您加入SVIP会员,将获得好友每笔充值的20%</View>
                            </View>
                            <View h={2}></View>
                            <div className="send-vip-top-code">我的推广码</div>
                            <div className="send-vip-top-code-value">{invite_code}</div>
                            <View h={12}></View>
                            <div className="send-vip-top-btn-area">
                                <View
                                    className="send-vip-top-btn"
                                    pointer
                                    onClick={() => {
                                        navigator.clipboard
                                            .writeText(
                                                invite_message
                                                    .replace('{invite_code}', invite_code || '')
                                                    .replace(
                                                        '{invite_link}',
                                                        (invite_link || '').replace(
                                                            '{code}',
                                                            invite_code!
                                                        )
                                                    )
                                            )
                                            .then(() => {
                                                Toast.show(
                                                    '已复制到剪贴板, 请尽快发送给您的朋友进行推广吧！'
                                                );
                                            })
                                            .catch(() => {
                                                Toast.show('复制失败');
                                            });
                                    }}
                                >
                                    复制推广链接
                                </View>
                                {/*<div className="send-vip-top-btn">保存二维码</div>*/}
                            </div>
                        </div>
                    </div>
                    <div className="send-vip-today">
                        <div className="send-vip-today-icon"></div>
                        <div className="send-vip-today-count">
                            今日推广成功人数：
                            <span style={{ color: 'white' }}>{dailyCount}</span> 人
                        </div>
                    </div>
                    <div className="send-vip-privilege">
                        <div className="send-vip-privilege-title">
                            <div className="send-vip-privilege-icon"></div>
                            <div className="send-vip-privilege-title-text">VIP特权</div>
                            <div className="send-vip-privilege-icon send-vip-privilege-mirror"></div>
                        </div>
                        <div className="send-vip-privilege-function">
                            <div className="send-vip-privilege-function-item">
                                <img
                                    className="send-vip-privilege-function-icon"
                                    src="/img/prom_vip_unlimitedviewing@2x.png"
                                />
                                <div className="send-vip-privilege-function-name">无限观影</div>
                            </div>
                            <div className="send-vip-privilege-function-item">
                                <img
                                    className="send-vip-privilege-function-icon"
                                    src="/img/prom_vip_hd@2x.png"
                                />
                                <div className="send-vip-privilege-function-name">超清画质</div>
                            </div>
                            <div className="send-vip-privilege-function-item">
                                <img
                                    className="send-vip-privilege-function-icon"
                                    src="/img/prom_vip_unlimiteddownload@2x.png"
                                />
                                <div className="send-vip-privilege-function-name">无限缓存</div>
                            </div>
                        </div>
                        <div className="send-vip-privilege-title">
                            <div className="send-vip-privilege-icon"></div>
                            <div className="send-vip-privilege-title-text">如何推广</div>
                            <div className="send-vip-privilege-icon send-vip-privilege-mirror"></div>
                        </div>
                        <div className="send-vip-privilege-text">
                            将您的推广链接或发给好友，好友下载并注册成功即推广成功。
                        </div>
                        <div className="send-vip-privilege-title">
                            <div className="send-vip-privilege-icon"></div>
                            <div className="send-vip-privilege-title-text">链接打开方式</div>
                            <div className="send-vip-privilege-icon send-vip-privilege-mirror"></div>
                        </div>
                        <div className="send-vip-privilege-text">
                            如果使用微信、qq浏览器无法打开，请更换其他浏览器。如谷歌、搜狗等。
                        </div>
                    </div>
                </div>
            </View>
        </View>
    );
};
export default UserInvite;
