import {
    Alert,
    Checkbox,
    Breadcrumb,
    Button,
    Divider,
    Input,
    message,
    Tabs,
    type TabsProps
} from 'antd';
import View from '../../components/View';
import { useEffect, useState } from 'react';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { MainWindowAppInfo, useMainWindowContext } from '../../providers/MainWindowProvider';
import ProxyService from '../../services/common/ProxyService';
import { useTimeoutLoop } from '@cicy/utils';
import BrowserService from '../../services/cicy/BrowserService';
import { onEvent } from '../../utils/utils';
import { AceEditorView } from '../../components/ace/AceEditorView';

const ProxyPool = ({ appInfo }: { appInfo: MainWindowAppInfo }) => {
    const [isOnLine, setIsOnLine] = useState(false);
    const [showShellWindow, setShowShellWindow] = useState(false);
    useTimeoutLoop(async () => {
        const res = await new BackgroundApi().isPortOnline(ProxyService.getProxyPort());
        setIsOnLine(res.result);
    }, 1000);
    return (
        <>
            <View h={12}></View>
            <ProDescriptions column={1}>
                <ProDescriptions.Item label={'代理池'}>
                    <View rowVCenter>
                        <View mr12>端口</View>
                        <ProField text={ProxyService.getProxyPort()} mode="read" />

                        <View ml12>
                            <Checkbox
                                checked={showShellWindow}
                                onChange={() => {
                                    setShowShellWindow(!showShellWindow);
                                }}
                            >
                                新窗口打开
                            </Checkbox>
                        </View>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={async () => {
                                    await new BackgroundApi().killPort(ProxyService.getProxyPort());
                                    new BackgroundApi().openTerminal(
                                        ProxyService.getMetaCmd(appInfo),
                                        showShellWindow
                                    );
                                }}
                            >
                                {isOnLine ? '重启' : '启动'}
                            </Button>
                        </View>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={() => {
                                    new BackgroundApi().openPath(appInfo.meta.configPath);
                                }}
                            >
                                打开配置文件
                            </Button>
                        </View>
                        <View ml12>
                            <Button
                                size="small"
                                disabled={!isOnLine}
                                onClick={() => {
                                    new BrowserService(
                                        `https://yacd.metacubex.one/?hostname=127.0.0.1&port=${ProxyService.getProxyWebuiPort()}&secret=#/proxies`
                                    ).openWindow({ noWebview: true });
                                }}
                            >
                                节点
                            </Button>
                        </View>
                        <View ml12>
                            <Button
                                size="small"
                                disabled={!isOnLine}
                                onClick={() => {
                                    new BrowserService(
                                        `https://yacd.metacubex.one/?hostname=127.0.0.1&port=${ProxyService.getProxyWebuiPort()}&secret=#/rules`
                                    ).openWindow({ noWebview: true });
                                }}
                            >
                                规则
                            </Button>
                        </View>
                    </View>
                </ProDescriptions.Item>
            </ProDescriptions>

            <View w100p h={88} mt12 pr12 borderBox>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={`${ProxyService.getMetaCmd(appInfo)}`}
                    mode={'sh'}
                    id={'env1'}
                ></AceEditorView>
            </View>

            <View w100p h={44} mt12 pr12 borderBox>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={`curl -v -x http://127.0.0.1:${ProxyService.getProxyPort()} https://api.myip.com`}
                    mode={'sh'}
                    id={'env11'}
                ></AceEditorView>
            </View>
        </>
    );
};

const ProxyMitm = ({ appInfo }: { appInfo: MainWindowAppInfo }) => {
    const [isOnLine, setIsOnLine] = useState(false);
    const [showShellWindow, setShowShellWindow] = useState(false);
    useTimeoutLoop(async () => {
        const res = await new BackgroundApi().isPortOnline(ProxyService.getProxyMitmPort());
        setIsOnLine(res.result);
    }, 1000);

    async function startServer() {
        try {
            await new BackgroundApi().killPort(ProxyService.getProxyMitmPort());

            await new BackgroundApi().openTerminal(
                ProxyService.getMetaAccountCmd('mitmweb', appInfo),
                showShellWindow
            );
        } catch (e) {
            //@ts-ignore
            message.error(e.message);
        }
    }

    return (
        <>
            <View h={12}></View>
            <ProDescriptions column={1}>
                <ProDescriptions.Item label={'中间人代理'}>
                    <View rowVCenter>
                        <View mr12>端口</View>
                        <ProField text={ProxyService.getProxyMitmPort()} mode="read" />

                        <View ml12>
                            <Checkbox
                                checked={showShellWindow}
                                onChange={() => {
                                    setShowShellWindow(!showShellWindow);
                                }}
                            >
                                新窗口打开
                            </Checkbox>
                        </View>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={async () => {
                                    onEvent('showLoading');
                                    await startServer();
                                    onEvent('hideLoading');
                                }}
                            >
                                {isOnLine ? '重启' : '启动'}
                            </Button>
                        </View>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={() => {
                                    new BackgroundApi().openPath(
                                        ProxyService.getMitmForwardPath(appInfo)
                                    );
                                }}
                            >
                                打开脚本
                            </Button>
                        </View>
                    </View>
                </ProDescriptions.Item>
            </ProDescriptions>
            <View w100p h={88} mt12 pr12 borderBox>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={`${ProxyService.getMetaAccountCmd('mitmweb', appInfo)}`}
                    mode={'sh'}
                    id={'env1'}
                ></AceEditorView>
            </View>
            <View w100p h={44} mt12 pr12 borderBox>
                <AceEditorView
                    readOnly
                    options={{
                        showLineNumbers: false,
                        wrap: true
                    }}
                    value={`curl -v -x http://127.0.0.1:${ProxyService.getProxyMitmPort()} https://api.myip.com`}
                    mode={'sh'}
                    id={'env2'}
                ></AceEditorView>
            </View>
        </>
    );
};

function extractIPAndLocation(html: string) {
    // Regular expression to extract IP address and location
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const locationRegex = /来自：([^<]+)</;

    // Extract IP address using the regex
    const ipMatch = html.match(ipRegex);
    const ip = ipMatch ? ipMatch[1] : null;

    // Extract location using the regex
    const locationMatch = html.match(locationRegex);
    const location = locationMatch ? locationMatch[1] : null;

    // Return an array with the IP and location
    return [ip, location];
}

const Setting = () => {
    const { appInfo, serverIp, initAppInfo } = useMainWindowContext();
    const [publicIpInfo, setPublicIpInfo] = useState([null, null, null]);
    const [serverUrl, setServerUrl] = useState(localStorage.getItem('serverUrl') || '');
    useEffect(() => {
        setTimeout(() => {
            initAppInfo();
            let startTime = Date.now();
            new BackgroundApi().axios('https://2025.ip138.com/').then((res: any) => {
                const { err, result } = res as any;
                if (err) {
                    console.error(err);
                } else {
                    const ipInfo = extractIPAndLocation(result as string);
                    setPublicIpInfo([...(ipInfo as any), Date.now() - startTime]);
                }
            });
        }, 200);
    }, []);

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '本机',
            children: (
                <View>
                    <ProDescriptions column={1}>
                        <ProDescriptions.Item label={'版本'}>
                            <ProField text={appInfo.version} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'局域网IP'}>
                            <ProField text={appInfo.ip} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>
                    <View mt12 pl={44} w={'50%'} fontSize={12} hide={appInfo.ipList.length < 2}>
                        <Alert
                            type="warning"
                            description={
                                <>
                                    {appInfo.ipList.map(row => {
                                        return (
                                            <View key={row.adr} mb={8}>
                                                {row.adr} - {row.interfaceName}
                                            </View>
                                        );
                                    })}
                                </>
                            }
                        ></Alert>
                    </View>
                    <View mb12></View>
                    <ProDescriptions column={3}>
                        <ProDescriptions.Item label={'外网IP'}>
                            <ProField text={publicIpInfo[0]} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'外网地址'}>
                            <ProField text={publicIpInfo[1]} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'延时'}>
                            <ProField text={publicIpInfo[2]} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>
                    <Divider />
                    <ProDescriptions column={2}>
                        <ProDescriptions.Item label={'数据目录'}>
                            <ProField text={appInfo.appDataPath} mode="read" />
                        </ProDescriptions.Item>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={() => {
                                    new BackgroundApi().openPath(appInfo.appDataPath);
                                }}
                            >
                                打开
                            </Button>
                        </View>
                    </ProDescriptions>
                    <Divider />
                    <ProDescriptions column={2}>
                        <ProDescriptions.Item label={'程序目录'}>
                            <ProField text={appInfo.appDir} mode="read" />
                        </ProDescriptions.Item>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={() => {
                                    new BackgroundApi().openPath(appInfo.appDir);
                                }}
                            >
                                打开
                            </Button>
                        </View>
                    </ProDescriptions>
                    <Divider />
                </View>
            )
        },
        {
            key: '2',
            label: 'CiCy服务器',
            children: (
                <View>
                    <ProDescriptions column={1}>
                        <ProDescriptions.Item label={'服务器主机'}>
                            <ProField text={localStorage.getItem('serverIp')} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'服务器端口'}>
                            <ProField text={localStorage.getItem('serverPort')} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'Token'}>
                            <ProField text={localStorage.getItem('token')} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>
                    <Divider />
                    <ProDescriptions column={1}>
                        <ProDescriptions.Item label={'服务器IP'}>
                            <View>
                                {serverIp.split(',').map(row => (
                                    <View key={row}>{row}</View>
                                ))}
                            </View>
                        </ProDescriptions.Item>
                    </ProDescriptions>
                </View>
            )
        },
        {
            key: '3',
            label: 'CiCy安卓连接器',
            children: (
                <View>
                    <ProDescriptions column={1}>
                        <ProDescriptions.Item label={'连接地址'}>
                            <Input
                                size={'small'}
                                onChange={e => {
                                    setServerUrl(e.target.value);
                                    localStorage.setItem('serverUrl', e.target.value);
                                }}
                                value={serverUrl}
                            ></Input>
                        </ProDescriptions.Item>
                    </ProDescriptions>
                </View>
            )
        },
        {
            key: '4',
            label: '代理',
            children: (
                <View>
                    <ProxyPool appInfo={appInfo}></ProxyPool>
                    <Divider></Divider>
                    <ProxyMitm appInfo={appInfo}></ProxyMitm>
                </View>
            )
        }
    ];

    return (
        <View relative>
            <View pl12 mt12 mb12>
                <Breadcrumb
                    items={[
                        {
                            title: '首页'
                        },
                        {
                            title: '设置'
                        }
                    ]}
                />
            </View>
            <View pl={24} pr12 w100p borderBox>
                <Tabs defaultActiveKey="1" items={items} onChange={() => {}} />
            </View>
        </View>
    );
};

export default Setting;
