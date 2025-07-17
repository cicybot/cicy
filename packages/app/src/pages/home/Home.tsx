import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import SizeBar from '../../components/UI/SideBar';
import View from '../../components/View';
import { CCWSClient, connectCCServer, getMainWindowClientId } from '../../services/cicy/CCWSClient';
import { MainClientMessageHandler } from '../../services/cicy/MainClientMessageHandler';
import Loading from '../../components/UI/Loading';
import { MainWindowProvider } from '../../providers/MainWindowProvider';
import { sleep } from '@cicy/utils';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { v4 as uuid } from 'uuid';

const HomePage = () => {
    const [wsConnected, setWsConnected] = useState(false);
    useEffect(() => {
        (async () => {
            let clientId = getMainWindowClientId();
            if (window.backgroundApi) {
                let serverPort = localStorage.getItem('serverPort');
                if (!serverPort) {
                    serverPort = '4444';
                    localStorage.setItem('serverPort', serverPort);
                }
                let serverIp = localStorage.getItem('serverIp');

                if (!serverIp) {
                    serverIp = '0.0.0.0';
                    localStorage.setItem('serverIp', serverIp);
                }
                let token = localStorage.getItem('token');
                if (!token) {
                    token = uuid();
                    localStorage.setItem('token', token);
                    const serverUrl = `ws://127.0.0.1:${serverPort}/ws?token=${token}`;
                    localStorage.setItem('serverUrl', serverUrl);
                    CCWSClient._setServerUrl(serverUrl);
                } else {
                    CCWSClient._setServerUrl(localStorage.getItem('serverUrl')!);
                }

                await new BackgroundApi().killPort(parseInt(serverPort));
                window.backgroundApi
                    .message({
                        action: 'initCCServer',
                        payload: {
                            serverIp,
                            serverPort,
                            useRust: true,
                            token
                        }
                    })
                    .catch(console.error);
                await sleep(1000);
            }
            let ts = localStorage.getItem('initConnectorTs');
            if (!ts) {
                ts = Date.now() + '';
                localStorage.setItem('initConnectorTs', ts);
            }
            connectCCServer(clientId, {
                onLogged: () => {
                    setWsConnected(true);
                    window.backgroundApi &&
                        window.backgroundApi.message({
                            action: 'initConnector',
                            payload: {
                                serverUrl: CCWSClient.getServerUrl(),
                                ts: parseInt(ts!)
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

export default HomePage;
