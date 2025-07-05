import { DownOutlined } from '@ant-design/icons';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import type { TreeDataNode, TreeProps } from 'antd';
import { Button, Input, Tree } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import View from '../../components/View';
import { connectCCServer } from '../../services/CCWSClient';

import Loading from '../../components/UI/Loading';
import CCAgentClient, { DeviceInfo } from '../../services/CCWSAgentClient';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import AndroidDetailWrap from './components/AndroidDetailWrap';

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
            onOpen: () => {
                setWsConnected(true);
                agent.isOnline().then(isOnline => {
                    setIsOnLine(isOnline);
                });
            },
            onMessage: message => {},
            onClose: () => {
                setWsConnected(false);
            }
        });
    }, [clientId]);
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
            <View h100vh w100vw center>
                <Loading></Loading>
            </View>
        );
    }
    if (!isOnline) {
        return (
            <View h100vh w100vw center>
                <Loading></Loading>
            </View>
        );
    }
    return <AndroidDetailWrap></AndroidDetailWrap>;
};
export default AndroidDetail;
