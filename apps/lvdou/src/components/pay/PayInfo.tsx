import { View } from '@cicy/app';

const PayInfo = () => {
    return (
        <View ml={12} mt={24}>
            <View fontSize={20} fontWeight={700}>
                常见问题
            </View>
            <View center mt12>
                <div className="svip-body-issue svip-body-issue-white">
                    <div className="svip-body-issue-text">
                        1、如多次支付失败，请尝试其他支付方式或稍后再试。
                    </div>
                    <div className="svip-body-issue-text">
                        2、支付成功后一般10分钟内到账，超过30分钟未到账请联系客服。
                    </div>
                    <div className="svip-body-issue-text">
                        3、更多问题，请点击查看 <span>充值帮助</span>
                    </div>
                </div>
            </View>
        </View>
    );
};
export default PayInfo;
