import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import View from '../View';
import Loading from '../UI/Loading';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';
import AndroidDetailInner from './AndroidDetailInner';

const AndroidDetailWrap = () => {
    const [agentAppInfo, setAgentAppInfo] = useState<any | null>(null);
    const { clientId } = useParams();
    const agent = new CCAgentClient(clientId!);
    const fetchDeviceInfo = () => agent.getAgentAppInfo();
    useEffect(() => {
        fetchDeviceInfo()
            .then(res => {
                setAgentAppInfo(res);
            })
            .catch(() => {
                setTimeout(() => fetchDeviceInfo(), 1000);
            });
    }, []);

    if (!agentAppInfo) {
        return (
            <View h100vh w100vw center column>
                <Loading></Loading>
                <View mt12>正在获取信息...</View>
            </View>
        );
    }

    return <AndroidDetailInner agentAppInfo={agentAppInfo}></AndroidDetailInner>;
};

export default AndroidDetailWrap;
