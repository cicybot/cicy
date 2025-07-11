import View from '../../components/View';
import { useEffect, useState } from 'react';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import { Button, message, Tabs, type TabsProps } from 'antd';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { AceEditorView } from '../../components/ace/AceEditorView';
import { onEvent } from '../../utils/utils';
import BrowserService from '../../services/cicy/BrowserService';
import { useTimeoutLoop } from '@cicy/utils';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import ProxyService from '../../services/common/ProxyService';
import ProxyPorts from '../../components/proxy/ProxyPorts';

const Proxy = () => {
    const { appInfo } = useMainWindowContext();
    const [config, setConfig] = useState('');
    const [isServerOnline, setIsServerOnline] = useState(false);
    const { configPath, bin, dataDir } = appInfo.meta;
    const port = ProxyService.getProxyPort();
    const port_web = ProxyService.getProxyWebuiPort();

    async function startServer() {
        try {
            await ProxyService.testConfig(bin, configPath);
            await ProxyService.startServer(bin, dataDir, configPath, port, true);
        } catch (e) {
            message.error(e as string);
        }
    }

    async function isPortOnline() {
        try {
            const res = await new BackgroundApi().isPortOnline(port);
            setIsServerOnline(res.result);
        } catch (e) {
            setIsServerOnline(false);
        }
    }
    async function fetchMetaAccountPorts() {
        let result = '';
        if (appInfo.isWin) {
            const res = await new BackgroundApi().shell(
                `powershell -command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine  -like '*meta_*' } | Select-Object CommandLine"`
            );
            result = res.result.stdout;
        } else {
            const res = await new BackgroundApi().shell("ps aux | grep meta_ | awk '{print $15}'");
            result = res.result.stdout;
        }

        const rows = result
            .trim()
            .split('\n')
            .map((row: string) => row.trim())
            .filter((row: string) => row.endsWith('.yaml'))
            .map((row: string) => parseInt(row.split('meta_')[1].replace('.yaml', '')));

        return rows;
    }
    useTimeoutLoop(async () => {
        await fetchMetaAccountPorts();
        await isPortOnline();
    }, 2000);

    useEffect(() => {
        isPortOnline().catch(console.error);
        new BackgroundApi()
            .utils({ method: 'fileReadString', params: [configPath] })
            .then((res: any) => {
                if (res.result) {
                    setConfig(res.result);
                }
            });
    }, []);

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '代理池',
            children: (
                <View wh100p>
                    <View p12>
                        <ProDescriptions column={1}>
                            <ProDescriptions.Item label={'端口'}>
                                <ProField text={port} mode="read" />
                                <View rowVCenter pl12>
                                    <View empty>
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
                                    </View>
                                </View>
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <View h={12}></View>
                        <ProDescriptions column={1}>
                            <ProDescriptions.Item label={'WebUI'}>
                                <ProField text={port_web} mode="read" />
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
                                        节点
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
                            </ProDescriptions.Item>
                        </ProDescriptions>
                        <View h={12}></View>
                        <ProDescriptions column={1}>
                            <View>CURL 测试</View>
                            <View h={100} w={'95%'}>
                                <AceEditorView
                                    readOnly
                                    options={{
                                        showLineNumbers: false,
                                        wrap: true
                                    }}
                                    value={`export https_proxy=http://127.0.0.1:${port} http_proxy=http://127.0.0.1:${port} all_proxy=socks5://127.0.0.1:${port}

curl -v -x http://10001:pwd@127.0.0.1:${port} https://api.myip.com
`}
                                    mode={'sh'}
                                    id={'env'}
                                ></AceEditorView>
                            </View>
                        </ProDescriptions>
                    </View>
                </View>
            )
        },
        {
            key: '2',
            label: '代理池配置',
            children: (
                <View wh100p>
                    <View h={44} rowVCenter pl12>
                        <Button
                            size={'small'}
                            onClick={() => {
                                onEvent('showLoading');
                                new BackgroundApi()
                                    .utils({
                                        method: 'fileWriteString',
                                        params: [configPath, config]
                                    })
                                    .then(async () => {
                                        await startServer();
                                        message.success('保存成功并重启成功!');
                                    })
                                    .finally(() => {
                                        onEvent('hideLoading');
                                    });
                            }}
                        >
                            保存
                        </Button>
                        <View w={12}></View>
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
                                节点
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
                                disabled={!isServerOnline}
                                onClick={() => {
                                    new BrowserService(
                                        `https://board.zash.run.place/#/proxies`
                                    ).openWindow({ noWebview: true });
                                }}
                            >
                                Zash
                            </Button>
                        </View>
                    </View>
                    <View w100p h={'calc(100vh - 138px)'}>
                        <AceEditorView
                            options={{
                                wrap: true
                            }}
                            defaultCode={config}
                            onChange={e => {
                                setConfig(e);
                            }}
                            mode={'yaml'}
                            id={'meta_config'}
                        ></AceEditorView>
                    </View>
                </View>
            )
        },
        {
            key: '3',
            label: '窗口代理',
            children: (
                <View wh100p>
                    <ProxyPorts></ProxyPorts>
                </View>
            )
        }
    ];
    return (
        <View relative wh100p p12 borderBox>
            <Tabs defaultActiveKey="1" items={items} />
        </View>
    );
};

export default Proxy;
