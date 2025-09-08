import { View } from '@cicy/app';
import axios from 'axios';
import { useNavigate } from 'react-router';

const PayBottom = ({
    payInfo
}: {
    payInfo: {
        order_info: string;
        order_type: 'vip' | 'wallet';
        add_first?: number;
        amount: number;
    };
}) => {
    let navigate = useNavigate();

    return (
        <View fixed h={64} xx0 borderBox bottom={0}>
            <View
                pointer
                h100p
                column
                onClick={async () => {
                    const res = await axios.post('/order/create', {
                        ...payInfo,
                        pay_method: 'alipay_qrcode'
                    });
                    const { id } = res.data;
                    navigate(`/user/order/${id}`);
                }}
                jCenter
                style={{
                    backgroundImage: 'linear-gradient(-72deg, #43256a 0%, #463d89 100%)'
                }}
            >
                <View center fontSize={16} fontWeight={700}>
                    确认充值：{payInfo.amount} 元
                </View>
                {Boolean(payInfo.add_first && payInfo.add_first > 0) && (
                    <View center rowVCenter>
                        <View>首次充值加赠余额</View>
                        <View mx={6}>
                            <img style={{ width: 16 }} src={'/img/common_coin@2x.png'} alt="" />
                        </View>
                        <View>{payInfo.add_first}</View>
                    </View>
                )}
            </View>
        </View>
    );
};
export default PayBottom;
