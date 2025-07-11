import { BrowserAccount, BrowserAccountInfo } from '../../services/model/BrowserAccount';
import View from '../View';
import { AceEditorView } from '../ace/AceEditorView';
import { Button, message } from 'antd';
import BrowserService from '../../services/cicy/BrowserService';
import { useEffect, useState } from 'react';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { useTimeoutLoop } from '@cicy/utils';
import { formatRelativeTime, onEvent } from '../../utils/utils';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import ProxyService from '../../services/common/ProxyService';

export const BrowserAccountProxy = ({ browserAccount }: { browserAccount: BrowserAccountInfo }) => {
    const { id, config } = browserAccount;
    const { appInfo } = useMainWindowContext();
    const { configPath: metaConfigPath, bin, dataDir } = appInfo.meta;
    const port = ProxyService.getMetaAccountProxyPort(id);
    const port_web = ProxyService.getMetaAccountProxyWebuiPort(id);
    const configPath = ProxyService.getMetaAccountConfigPath(id, metaConfigPath);
    const [isServerOnline, setIsServerOnline] = useState(false);

    const [ipInfo, setIpInfo] = useState([
        config.testIp,
        config.testLocation,
        config.testDelay,
        config.testTs
    ]);

    async function isPortOnline() {
        try {
            const res = await new BackgroundApi().isPortOnline(port);
            setIsServerOnline(res.result);
        } catch (e) {
            setIsServerOnline(false);
        }
    }

    async function startServer() {
        try {
            await testConfig();
            return new BackgroundApi().metaStart(
                port,
                `${bin} -d ${dataDir} -f ${configPath}`,
                true
            );
        } catch (e) {
            //@ts-ignore
            message.error(e.message);
        }
    }

    async function testConfig() {
        await ProxyService.testConfig(bin, configPath);
    }

    useEffect(() => {
        ProxyService.initMetaAccountConfig(id, metaConfigPath).catch(console.error);
        isPortOnline().catch(console.error);
    }, []);
    useTimeoutLoop(async () => {
        await isPortOnline();
    }, 2000);

    return (
        <View>
            <View rowVCenter mb12>
                <Button
                    size="small"
                    onClick={async () => {
                        onEvent('showLoading');
                        await startServer();
                        onEvent('hideLoading');
                    }}
                >
                    {isServerOnline ? '重启' : '启动'}
                </Button>
                <View w={12}></View>
                <View ml12>
                    <Button
                        size="small"
                        disabled={!isServerOnline}
                        onClick={() => {
                            new BrowserService(
                                `https://yacd.metacubex.one/?hostname=127.0.0.1&port=${port_web}&secret=#/rules`
                            ).openWindow({ noWebview: true });
                        }}
                    >
                        规则
                    </Button>
                </View>
                <View w={12}></View>
                <Button
                    size="small"
                    onClick={async () => {
                        new BrowserService('https://api.myip.com/', browserAccount.id)
                            .openWindow()
                            .then(console.error);
                    }}
                >
                    测试站点1
                </Button>
                <View w={6}></View>
                <Button
                    size="small"
                    onClick={async () => {
                        new BrowserService('https://ip.cicybot.workers.dev/', browserAccount.id)
                            .openWindow()
                            .then(console.error);
                    }}
                >
                    测试站点2
                </Button>
                <View w={12}></View>
                <View ml12>
                    <Button
                        size="small"
                        disabled={!isServerOnline}
                        onClick={() => {
                            new BrowserService(
                                `https://yacd.metacubex.one/?hostname=127.0.0.1&port=${port_web}&secret=#/rules`
                            ).openWindow({ noWebview: true });
                        }}
                    >
                        规则
                    </Button>
                </View>
                <View w={12}></View>
                <View ml12>
                    <Button
                        size="small"
                        disabled={!isServerOnline}
                        onClick={async () => {
                            onEvent('showLoading');
                            try {
                                const [ip, location, delay, ts] = await ProxyService.testSpeed(
                                    browserAccount
                                );
                                setIpInfo([ip, location, delay, ts]);
                                debugger;
                            } catch (e) {
                                message.error(e + '');
                            }
                            onEvent('hideLoading');
                        }}
                    >
                        测速
                    </Button>
                </View>
            </View>
            <View rowVCenter h={44}>
                <View mr12>{ipInfo[0] || '-'}</View>
                <View mr12>{ipInfo[1] || '-'}</View>
                <View mr12>{ipInfo[2] || '-'}</View>
                <View mr12>
                    {ipInfo[3]
                        ? (port => {
                              return formatRelativeTime(port as number);
                          })(ipInfo[3]!)
                        : '-'}
                </View>
            </View>

            <View h={12}></View>

            <View w100p h={44}>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={`curl -v -x http://127.0.0.1:${port} https://api.myip.com`}
                    mode={'sh'}
                    id={'env'}
                ></AceEditorView>
            </View>
            <View h={12}></View>

            <View w100p h={400}>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={ProxyService.getMetaAccountConfig(port).trim()}
                    mode={'yaml'}
                    id={'config_yaml'}
                ></AceEditorView>
            </View>
        </View>
    );
};
