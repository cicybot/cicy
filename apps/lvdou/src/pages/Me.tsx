import { View } from '@cicy/app';
import MeView from '../components/me/MeView';

const Me = () => {
    return (
        <View absFull>
            <View h100p style={{ maxWidth: 360, margin: '0 auto' }} center>
                <View wh100p overflowHidden center>
                    <MeView />
                </View>
            </View>
        </View>
    );
};
export default Me;
