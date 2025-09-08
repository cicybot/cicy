import { View } from '@cicy/app';

const EmptyView = ({ title }: { title?: string }) => {
    return (
        <View center wh100p column>
            <img
                style={{ width: 88, marginTop: -64 }}
                src={'/img/empty_data_black@2x.png'}
                alt=""
            />
            <View mt12>{title || '暂无记录'}</View>
        </View>
    );
};
export default EmptyView;
