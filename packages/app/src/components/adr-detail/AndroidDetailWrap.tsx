import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import View from '../View';
import Loading from '../UI/Loading';
import CCAgentClient, { DeviceInfo } from '../../services/cicy/CCWSAgentClient';
import AndroidDetailInner from './AndroidDetailInner';

const AndroidDetailWrap = () => {
    const [deviceInfo, setDeviceInfo] = useState<any | DeviceInfo>(null);
    const { clientId } = useParams();
    const agent = new CCAgentClient(clientId!);
    const fetchDeviceInfo = () => agent.getDeviceInfo();
    useEffect(() => {
        fetchDeviceInfo()
            .then(res => {
                setDeviceInfo(res);
            })
            .catch(() => {
                setTimeout(() => fetchDeviceInfo(), 1000);
            });
    }, []);

    if (!deviceInfo) {
        return (
            <View h100vh w100vw center>
                <Loading></Loading>
            </View>
        );
    }

    return <AndroidDetailInner deviceInfo={deviceInfo}></AndroidDetailInner>;
};

export default AndroidDetailWrap;
