import { Button, Drawer, message } from 'antd';
import CCAndroidConnectorClient from '../../services/cicy/CCAndroidConnectorClient';
import { onEvent } from '../../utils/utils';
import { CCWSClient } from '../../services/cicy/CCWSClient';
import View from '../View';
import { useState } from 'react';
import { CheckList } from 'antd-mobile';

export const UploadAgentButton = ({
    appInfo,
    connector,
    serverIp,
    fetchDeviceInfo
}: {
    serverIp: string;
    connector: CCAndroidConnectorClient;
    appInfo: null | any;
    fetchDeviceInfo: any;
}) => {
    const [showPickServerIp, setShowPickServerIp] = useState(false);
    return (
        <View rowVCenter>
            <View mr12>
                <Button
                    size="small"
                    type="primary"
                    onClick={async () => {
                        const cacheServerIp = localStorage.getItem('cacheServerIp') || '';
                        debugger;

                        if (!cacheServerIp) {
                            message.warning('请选择服务器IP');
                            setShowPickServerIp(true);
                            return;
                        }
                        onEvent('showLoading');
                        let { version, isWin, isDev, publicDir } = appInfo;
                        if (isDev) {
                            version = '0.0.0';
                        }
                        try {
                            const agentName = 'cicy-agent';
                            const sep = isWin ? '\\' : '/';
                            let nameApk = `app.apk`;
                            const serverUrl = CCWSClient.formatServerUrl(cacheServerIp);
                            const isLocalServer = CCWSClient.isLocalServer();

                            let abi = await connector.getDevcieCpuAbi();
                            if (abi.includes('arm64')) {
                                abi = 'arm64';
                            } else if (abi.includes('armeabi')) {
                                abi = 'armv7a';
                            } else {
                                abi = 'x86_64';
                            }
                            let nameApkVer = `app-v${version}.apk`;

                            let agentNameVer = `${agentName}-v${version}-${abi}`;

                            if (isLocalServer) {
                                agentNameVer = `${publicDir}${sep}static${sep}assets${sep}${agentNameVer}`;
                            } else {
                                const url = `https://github.com/cicybot/cicy/releases/download/v${version}/${agentNameVer}`;
                                try {
                                    await connector.downloadUrl(url, agentName);
                                } catch (e) {
                                    message.error(`${url} 下载失败`);
                                    return;
                                }
                            }

                            await connector.deviceAdbPush(
                                agentNameVer,
                                '/data/local/tmp/' + agentName
                            );
                            await connector.deviceAdbShell('chmod +x /data/local/tmp/' + agentName);
                            await connector.deviceAdbShell(
                                `echo ${serverUrl} > /data/local/tmp/config_server.txt`
                            );

                            if (isLocalServer) {
                                nameApkVer = `${publicDir}${sep}static${sep}assets${sep}${nameApkVer}`;
                            } else {
                                const url = `https://github.com/cicybot/cicy/releases/download/v${version}/${nameApkVer}`;

                                try {
                                    await connector.downloadUrl(url, nameApkVer);
                                } catch (e) {
                                    message.error(`${url} 下载失败`);
                                    return;
                                }
                            }
                            await connector.deviceAdbPush(nameApkVer, '/data/local/tmp/' + nameApk);
                            await connector.deviceAdbShell(
                                'pm install -r /data/local/tmp/' + nameApk
                            );
                            try {
                                await connector.deviceAdbShell(
                                    'am start -n com.cicy.agent.alpha/com.github.kr328.clash.MainActivity'
                                );
                            } catch (e) {
                                console.error(e);
                            }

                            await connector.agentRustStartLoop();
                            await fetchDeviceInfo();
                            onEvent('hideLoading');
                            message.success('上传成功');
                        } catch (error) {
                            console.error(error);
                            await fetchDeviceInfo();
                            onEvent('hideLoading');
                            message.error('上传失败:' + error);
                        }
                    }}
                >
                    更新上传Agent
                </Button>
            </View>
            <View>
                <Button size="small" onClick={async () => setShowPickServerIp(true)}>
                    选择服务器IP
                </Button>
            </View>
            <Drawer
                width={'360px'}
                title={'选择服务器IP'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    setShowPickServerIp(false);
                }}
                open={showPickServerIp}
            >
                {showPickServerIp && (
                    <View>
                        <CheckList
                            onChange={e => {
                                localStorage.setItem('cacheServerIp', '' + e[0]);
                            }}
                            defaultValue={[localStorage.getItem('cacheServerIp') || '']}
                        >
                            {serverIp
                                .split(',')
                                .filter(ip => ip !== '127.0.0.1')
                                .map(ip => {
                                    return (
                                        <CheckList.Item value={ip} key={ip}>
                                            {ip}
                                        </CheckList.Item>
                                    );
                                })}
                        </CheckList>
                    </View>
                )}
            </Drawer>
        </View>
    );
};
