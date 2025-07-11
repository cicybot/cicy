import View from '../View';
import { useEffect, useState } from 'react';
import { useMainWindowContext } from '../../providers/MainWindowProvider';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import { Avatar, Button, Drawer, Input, message, Popconfirm } from 'antd';
import ProxyService from '../../services/common/ProxyService';
import { onEvent } from '../../utils/utils';
import { BrowserAccount, BrowserAccountInfo } from '../../services/model/BrowserAccount';
import BrowserAccountDetail from '../browser_account/BrowserAccountDetail';
import { BrowserAccountProxy } from '../browser_account/BrowserAccountProxy';

const ProxyPorts = () => {
    const { appInfo } = useMainWindowContext();
    const { bin, dataDir, configPath } = appInfo.meta;
    const [ports, setPorts] = useState<number[]>([]);
    const [browserAccountInfo, setBrowserAccountInfo] = useState<BrowserAccountInfo | null>(null);
    const [proxyPort, setProxyPort] = useLocalStorageState(
        'proxy_port',
        ProxyService.getProxyPort() + ''
    );

    const [proxyServer, setProxyServer] = useLocalStorageState('proxy_server', '127.0.0.1');
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
        rows.sort((a: number, b: number) => a - b);
        setPorts(rows);
        return rows;
    }

    useEffect(() => {
        fetchMetaAccountPorts();
    }, []);
    useTimeoutLoop(async () => {
        await fetchMetaAccountPorts();
    }, 2000);

    async function startServer(port: number, configPath: string) {
        try {
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

    const columns: ProColumns<{ port: number }>[] = [
        {
            title: '端口',
            dataIndex: 'port',
            render: port => {
                return <>{port}</>;
            }
        },
        {
            title: '操作',
            width: 120,
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <a
                    key="editable"
                    onClick={async () => {
                        onEvent('showLoading');
                        const accountIndex = ProxyService.getAccountIndexByPort(record.port);
                        await ProxyService.initMetaAccountConfig(accountIndex, configPath);
                        await startServer(
                            record.port,
                            ProxyService.getMetaAccountConfigPath(accountIndex, configPath)
                        );
                        onEvent('hideLoading');
                    }}
                    style={{ marginRight: 8 }}
                >
                    重启
                </a>,
                <a
                    key="more"
                    onClick={async () => {
                        onEvent('showLoading');
                        const browserAccountInfo = await new BrowserAccount(
                            ProxyService.getAccountIndexByPort(record.port)
                        ).get();
                        setBrowserAccountInfo(browserAccountInfo);
                        onEvent('hideLoading');
                    }}
                    style={{ marginRight: 8 }}
                >
                    更多
                </a>
            ]
        }
    ];
    const dataSource = ports.map((port: number) => {
        return {
            port
        };
    });

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
                <View rowVCenter>
                    <View rowVCenter>
                        <Button
                            onClick={async () => {
                                const { isWin } = appInfo;
                                const sep = !isWin ? '/' : '\\';
                                const t = configPath.split(sep);
                                const configDir = t.slice(0, t.length - 1).join(sep);
                                const cmd = !isWin
                                    ? `rm -f ${configDir}/*meta_*.yaml`
                                    : `del /Q "${configDir}\\*meta_*.yaml`;
                                await new BackgroundApi().shell(cmd);
                                message.success('重启成功');
                            }}
                        >
                            重置
                        </Button>
                    </View>
                </View>
            </View>
            <View>
                <ProTable<{ port: number }>
                    dataSource={dataSource}
                    rowKey="port"
                    pagination={{
                        showQuickJumper: true
                    }}
                    columns={columns}
                    search={false}
                    options={false}
                />
            </View>
            <Drawer
                width={'75%'}
                title={`# ${
                    browserAccountInfo
                        ? ProxyService.getMetaAccountProxyPort(browserAccountInfo?.id)
                        : ''
                }`}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setBrowserAccountInfo(null);
                }}
                open={!!browserAccountInfo}
            >
                {browserAccountInfo && (
                    <BrowserAccountProxy browserAccount={browserAccountInfo}></BrowserAccountProxy>
                )}
            </Drawer>
        </View>
    );
};

export default ProxyPorts;
