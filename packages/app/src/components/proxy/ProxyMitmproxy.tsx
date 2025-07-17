import View from '../View';
import { useEffect, useState } from 'react';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import { Button, Input } from 'antd';
import { onEvent } from '../../utils/utils';
import { AceEditorView } from '../ace/AceEditorView';
import ProxyMitmService from '../../services/common/ProxyMitmService';

const ProxyMitmproxy = () => {
    const { appInfo } = useMainWindowContext();
    const { appDataPath, isWin } = appInfo;
    const [code, setCode] = useState('');

    const [proxyPort, setProxyPort] = useLocalStorageState('proxy_mitm_port', '4449');
    const [proxyServer, setProxyServer] = useLocalStorageState('proxy_mitm_server', '127.0.0.1');
    const service = new ProxyMitmService(appDataPath, isWin);
    const [isServerOnline, setIsServerOnline] = useState(false);

    async function isPortOnline() {
        try {
            const res = await new BackgroundApi().isPortOnline(parseInt(proxyPort));
            setIsServerOnline(res.result);
        } catch (e) {
            setIsServerOnline(false);
        }
    }

    useEffect(() => {
        isPortOnline().catch(console.error);
        service.initScript().then(res => {
            setCode(res);
        });
    }, []);
    useTimeoutLoop(async () => {
        await isPortOnline();
    }, 1000);
    return (
        <View relative wh100p p12 borderBox>
            <View rowVCenter mb12>
                <View rowVCenter mr12>
                    <View mr12>代理地址:</View>
                    <View>
                        <Input
                            onChange={e => setProxyServer(e.target.value)}
                            value={proxyServer}
                        ></Input>
                    </View>
                </View>
                <View mr12 rowVCenter>
                    <View mr12>代理端口:</View>
                    <View>
                        <Input
                            onChange={e => setProxyPort(e.target.value)}
                            value={proxyPort}
                        ></Input>
                    </View>
                </View>
            </View>
            <View>
                <View mb12 rowVCenter>
                    <View>
                        <Button
                            size={'small'}
                            onClick={async () => {
                                onEvent('showLoading');
                                try {
                                    await new BackgroundApi().killPort(parseInt(proxyPort));
                                } catch (e) {}
                                // await service.startServer(proxyServer, proxyPort, false);
                                onEvent('hideLoading');
                            }}
                        >
                            {isServerOnline ? '重启' : '启动'}
                        </Button>
                    </View>
                    <View ml12>
                        <Button
                            disabled={!isServerOnline}
                            size={'small'}
                            onClick={async () => {
                                try {
                                    onEvent('showLoading');
                                    await new BackgroundApi().killPort(parseInt(proxyPort));
                                } catch (e) {}
                                onEvent('hideLoading');
                            }}
                        >
                            停止
                        </Button>
                    </View>
                </View>
                <View w100p h={44} mb12>
                    <AceEditorView
                        options={{
                            showLineNumbers: false,
                            wrap: true
                        }}
                        // value={service.getCmd(proxyServer, proxyPort)}
                        onChange={e => {
                            setCode(e);
                        }}
                        mode={'sh'}
                        id={'py_script'}
                    ></AceEditorView>
                </View>
                <View w100p h={44} mb12>
                    <AceEditorView
                        options={{
                            showLineNumbers: false,
                            wrap: true
                        }}
                        readOnly
                        value={`
curl -v -x http://127.0.0.1:4449 https://api.myip.com
                        `.trim()}
                        onChange={e => {
                            setCode(e);
                        }}
                        mode={'sh'}
                        id={'curl_mitm'}
                    ></AceEditorView>
                </View>
                <View>
                    <View mb12 rowVCenter>
                        <View>
                            <Button
                                size={'small'}
                                onClick={async () => {
                                    onEvent('showLoading');
                                    await service.saveScript(code);
                                    onEvent('hideLoading');
                                }}
                            >
                                保存
                            </Button>
                        </View>
                    </View>
                </View>
                <View w100p h={'calc(100vh - 360px)'}>
                    <AceEditorView
                        options={{
                            wrap: true
                        }}
                        value={code}
                        onChange={e => {
                            setCode(e);
                        }}
                        mode={'python'}
                        id={'py_script'}
                    ></AceEditorView>
                </View>
            </View>
        </View>
    );
};

export default ProxyMitmproxy;
