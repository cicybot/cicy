import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import SizeBar from '../../components/UI/SideBar';
import View from '../../components/View';
import { CCWSClient, ClientIds, connectCCServer } from '../../services/cicy/CCWSClient';
import { MainClientMessageHandler } from '../../services/cicy/MainClientMessageHandler';
import Loading from '../../components/UI/Loading';
import { MainWindowProvider } from '../../providers/MainWindowProvider';

const Home = () => {
    const [wsConnected, setWsConnected] = useState(false);
    useEffect(() => {
        let clientId = '';
        if (window.backgroundApi) {
            clientId = ClientIds.MainWebContent;
        } else {
            clientId = sessionStorage.getItem('MasterWebContentClientId') || '';
            if (!clientId) {
                clientId = 'MasterWebContent-' + Date.now();
                sessionStorage.setItem('MasterWebContentClientId', clientId);
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
        <MainWindowProvider>
            <View wh100p>
                <View h100vh w={sideBarWidth} borderBox>
                    <SizeBar></SizeBar>
                </View>
                <View absFull left={sideBarWidth}>
                    <Outlet></Outlet>
                </View>
            </View>
        </MainWindowProvider>
    );
};

export default Home;
