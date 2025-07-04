import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';
import SizeBar from '../../components/UI/SideBar';
import View from '../../components/View';
import { connectCCServer, ClientIds } from '../../services/CCWSClient';
import { MainClientMessageHandler } from '../../services/MainClientMessageHandler';
import Loading from '../../components/UI/Loading';

const Home = () => {
    const [wsConnected, setWsConnected] = useState(false);
    useEffect(() => {
        connectCCServer(window.backgroundApi ? ClientIds.MainWebContent : 'MasterWebContent', {
            onOpen: () => {
                setWsConnected(true);
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
        return <View h100vh w100vw center><Loading></Loading></View>;
    }
    const sideBarWidth = 220;

    return (
        <View wh100p>
            <View h100vh w={sideBarWidth}>
                <SizeBar></SizeBar>
            </View>
            <View absFull left={sideBarWidth}>
                <Outlet></Outlet>
            </View>
        </View>
    );
};

export default Home;
