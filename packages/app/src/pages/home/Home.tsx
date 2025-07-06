import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import SizeBar from '../../components/UI/SideBar';
import View from '../../components/View';
import { connectCCServer, ClientIds, CCWSClient } from '../../services/CCWSClient';
import { MainClientMessageHandler } from '../../services/MainClientMessageHandler';
import Loading from '../../components/UI/Loading';

const Home = () => {
    const [wsConnected, setWsConnected] = useState(false);
    useEffect(() => {
        let clientId = '';
        if (window.backgroundApi) {
            clientId = ClientIds.MainWebContent;
        } else {
            clientId = localStorage.getItem('MasterWebContentClientId') || '';
            if (!clientId) {
                clientId = 'MasterWebContent-' + Date.now();
                localStorage.setItem('MasterWebContentClientId', clientId);
            }
        }
        connectCCServer(clientId, {
            onOpen: () => {
                setWsConnected(true);
                window.backgroundApi &&
                    window.backgroundApi.message({
                        action: 'initConnector',
                        payload: {
                            serverUrl: CCWSClient.getServerUrl()
                        }
                    });
            },
            onMessage: message => {
                MainClientMessageHandler.handleMsg(message);
            },
            onClose: () => {
                setWsConnected(false);
            }
        });
    }, []);

    if (!wsConnected) {
        return (
            <View h100vh w100vw center>
                <Loading></Loading>
            </View>
        );
    }
    const sideBarWidth = 220;

    return (
        <View wh100p>
            <View h100vh w={sideBarWidth} borderBox>
                <SizeBar></SizeBar>
            </View>
            <View absFull left={sideBarWidth}>
                <Outlet></Outlet>
            </View>
        </View>
    );
};

export default Home;
