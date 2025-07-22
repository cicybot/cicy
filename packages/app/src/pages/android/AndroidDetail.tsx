import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import View from '../../components/View';
import { connectCCServer } from '../../services/cicy/CCWSClient';

import Loading from '../../components/UI/Loading';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';
import { useTimeoutLoop } from '@cicy/utils';
import AndroidDetailWrap from '../../components/adr-detail/AndroidDetailWrap';

const AndroidDetail = () => {
    const { clientId } = useParams();
    const [wsConnected, setWsConnected] = useState(false);
    const [isOnline, setIsOnLine] = useState(false);
    const agent = new CCAgentClient(clientId!);
    useEffect(() => {
        //@ts-ignore
        document.title = clientId;
    }, [clientId]);
    useEffect(() => {
        if (!clientId) {
            return;
        }
        connectCCServer(clientId + '-MANAGE', {
            onLogged: () => {
                setWsConnected(true);
                agent.isAppOnline().then(isOnline => {
                    setIsOnLine(isOnline);
                });
            },
            onMessage: message => {},
            onClose: () => {
                setWsConnected(false);
            }
        });
    }, [clientId]);
    console.log({ wsConnected, isOnline });
    useTimeoutLoop(async () => {
        if (wsConnected && !isOnline) {
            const res = await agent.isOnline();
            if (res) {
                setIsOnLine(true);
            }
        }
    }, 1000);
    if (!wsConnected) {
        return (
            <View h100vh w100vw center column>
                <Loading></Loading>
                <View mt12>正在连接...</View>
            </View>
        );
    }
    if (!isOnline) {
        return (
            <View h100vh w100vw center column>
                <Loading></Loading>
                <View mt12>{clientId}</View>
                <View mt12>未启动</View>
            </View>
        );
    }
    return <AndroidDetailWrap></AndroidDetailWrap>;
};
export default AndroidDetail;
