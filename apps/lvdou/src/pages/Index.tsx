import { TabBarKey, useGlobalContext } from '../providers/GlobalProvider';
import { View } from '@cicy/app';
import TabBar from '../components/TabBar';
import Me from './Me';
import Home from './Home';
import Manage from './manage/Manage';

const Index = () => {
    const { state } = useGlobalContext();
    return (
        <View>
            {state.currentTabBarKey === TabBarKey.Home && <Home />}
            {state.currentTabBarKey === TabBarKey.Me && <Me />}
            {state.currentTabBarKey === TabBarKey.Manage && <Manage />}
            <TabBar></TabBar>
        </View>
    );
};

export default Index;
