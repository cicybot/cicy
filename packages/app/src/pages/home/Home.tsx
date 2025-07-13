import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import SizeBar from '../../components/UI/SideBar';
import View from '../../components/View';
import { CCWSClient, ClientIds, connectCCServer } from '../../services/cicy/CCWSClient';
import { MainClientMessageHandler } from '../../services/cicy/MainClientMessageHandler';
import Loading from '../../components/UI/Loading';
import { MainWindowProvider } from '../../providers/MainWindowProvider';
import { waitForResult } from '@cicy/utils';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { v4 as uuid } from 'uuid';

const Home = () => {
    const [wsConnected, setWsConnected] = useState(false);
    useEffect(() => {
        (async () => {
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
            if (window.backgroundApi) {
                const serverPort = 4444;
                let serverIp = localStorage.getItem('serverIp');
                let token = localStorage.getItem('token');
                if (!token) {
                    token = uuid();
                    localStorage.setItem('token', token);

                    const serverUrl = `ws://127.0.0.1:${serverPort}/ws?token=${token}`;
                    localStorage.setItem('serverUrl', serverUrl);
                    CCWSClient._setServerUrl(serverUrl);
                }
                if (!serverIp) {
                    serverIp = '0.0.0.0';
                    localStorage.setItem('token', token);
                }

                await window.backgroundApi.message({
                    action: 'initCCServer',
                    payload: {
                        serverIp,
                        serverPort,
                        useRust: true,
                        token
                    }
                });
                const res = await waitForResult(async () => {
                    const res = await new BackgroundApi().isPortOnline(serverPort);
                    return {
                        isPortOnline: res && res.result
                    };
                });
                if (!res.isPortOnline) {
                    setTimeout(() => {
                        location.reload();
                    }, 10000);
                    return;
                }
            }
            connectCCServer(clientId, {
                onLogged: () => {
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
        })();
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
