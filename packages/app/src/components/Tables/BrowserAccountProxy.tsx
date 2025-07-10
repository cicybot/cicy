import { BrowserAccount, BrowserAccountInfo } from '../../services/model/BrowserAccount';
import View from '../View';
import { AceEditorView } from '../ace/AceEditorView';
import { Button, message } from 'antd';
import BrowserService from '../../services/cicy/BrowserService';
import { useEffect, useState } from 'react';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { useTimeoutLoop } from '@cicy/utils';
import { onEvent } from '../../utils/utils';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import ProxyService from '../../services/common/ProxyService';

export const BrowserAccountProxy = ({ browserAccount }: { browserAccount: BrowserAccountInfo }) => {
    const { id } = browserAccount;
    const { appInfo } = useMainWindowContext();
    const { configPath: metaConfigPath, bin, dataDir } = appInfo.meta;
    const port = ProxyService.getMetaAccountProxyPort(id);
    const port_web = ProxyService.getMetaAccountProxyWebuiPort(id);
    const configPath = ProxyService.getMetaAccountConfigPath(id, metaConfigPath);
    const [isServerOnline, setIsServerOnline] = useState(false);

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
            await testConfig(true);
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

    async function testConfig(hideMessage?: boolean) {
        await ProxyService.testConfig(bin, configPath);

        if (!hideMessage) {
            message.success('保存成功! 请重启服务');
        }
    }

    useEffect(() => {
        ProxyService.intMetaAccountConfig(id, metaConfigPath).catch(console.error);
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
                <View w={12}></View>
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
                            new BrowserService(`https://board.zash.run.place/#/proxies`).openWindow(
                                { noWebview: true }
                            );
                        }}
                    >
                        Zash
                    </Button>
                </View>
                <View w={12}></View>
                <View ml12>
                    <Button
                        size="small"
                        disabled={!isServerOnline}
                        onClick={() => {
                            new BrowserService(
                                `https://yacd.metacubex.one/?hostname=127.0.0.1&port=${port_web}&secret=#/proxies`
                            ).openWindow({ noWebview: true });
                        }}
                    >
                        代理节点
                    </Button>
                </View>
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
                <View ml12>
                    <Button
                        size="small"
                        onClick={async () => {
                            onEvent('showLoading');
                            try {
                                await testConfig();
                            } catch (e) {
                                message.error('测试失败：' + e);
                            }

                            onEvent('hideLoading');
                        }}
                    >
                        测试配置文件
                    </Button>
                </View>
            </View>

            <View w100p h={320}>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: true,
                        wrap: true
                    }}
                    value={ProxyService.getMetaAccountConfig(port)}
                    mode={'yaml'}
                    id={'config_yaml'}
                ></AceEditorView>
            </View>
            <View h={12}></View>

            <View w100p h={80}>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={`export https_proxy=http://127.0.0.1:${port} http_proxy=http://127.0.0.1:${port} all_proxy=socks5://127.0.0.1:${port}
curl -v -x http://127.0.0.1:${port} https://api.myip.com
`}
                    mode={'sh'}
                    id={'env'}
                ></AceEditorView>
            </View>
        </View>
    );
};
