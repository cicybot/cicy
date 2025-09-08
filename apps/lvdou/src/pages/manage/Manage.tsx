import { View } from '@cicy/app';
import { List } from 'antd-mobile';
import { UnorderedListOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router';

const Manage = () => {
    let navigate = useNavigate();

    return (
        <View wh100p overflowYAuto>
            <List>
                <List.Item
                    prefix={<UnorderedListOutline />}
                    onClick={() => {
                        navigate('/manage/order/update');
                    }}
                >
                    订单更新
                </List.Item>
                <List.Item
                    prefix={<UnorderedListOutline />}
                    onClick={() => {
                        navigate('/manage/pay/qrcode');
                    }}
                >
                    支付码管理
                </List.Item>
                <List.Item
                    prefix={<UnorderedListOutline />}
                    onClick={() => {
                        navigate('/manage/tickets');
                    }}
                >
                    工单管理
                </List.Item>
            </List>
        </View>
    );
};

export default Manage;
