import View from '../../components/View';
const Android = () => {
    return (
        <View wh100p>
            <webview
                style={{ width: '100%', height: '100%' }}
                src={'/#/androidConnector'}
            ></webview>
        </View>
    );
};

export default Android;
