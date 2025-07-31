import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import View from '../../components/View';
import CCAndroidConnectorClient from '../../services/cicy/CCAndroidConnectorClient';
import { connectCCServer } from '../../services/cicy/CCWSClient';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import Screen from '../../components/adr-detail/screen/Screen';
import SizeBarScreen from '../../components/UI/SideBarScreen';
import { useSessionStorageState } from '@cicy/utils';

const AndroidDetail = () => {
    const { clientId, sn, deviceId, id } = useParams();
    const connector = new CCAndroidConnectorClient();
    connector.setClientId(clientId as string);
    connector.setSn(sn as string);
    const [isSettingOpen, setIsSettingOpen] = useSessionStorageState('isSettingOpen', false);

    const [deviceInfo, setDeviceInfo] = useState<null | AdrDeviceInfo>(null);

    function getDeviceInfo() {
        connector.getDeviceInfo().then(res => {
            setDeviceInfo(res);
        });
    }
    useEffect(() => {
        //@ts-ignore
        document.title = sn;
        connectCCServer('ADR-' + sn, {
            onLogged: () => {
                getDeviceInfo();
            },
            onMessage: message => {},
            onClose: () => {}
        });
    }, [sn]);
    if (!deviceInfo) {
        return null;
    }
    return (
        <View w100vw h100vh bgColor={'#393939'} overflowHidden userSelectNone>
            <View abs left0 w={58} top0 bottom={0}>
                <SizeBarScreen minSideBar sideBarWidth={58}></SizeBarScreen>
            </View>
            <View abs left={58} top0 bottom={0} right={0}>
                <Screen
                    getDeviceInfo={getDeviceInfo}
                    connector={connector}
                    deviceInfo={deviceInfo}
                    isSettingOpen={isSettingOpen}
                    setIsSettingOpen={(v: boolean) => setIsSettingOpen(v)}
                    useKeyEvent
                    id={parseInt(id as string)}
                ></Screen>
            </View>
        </View>
    );
};
export default AndroidDetail;
