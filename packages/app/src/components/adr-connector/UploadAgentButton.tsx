import { Button, message } from 'antd';
import CCAndroidConnectorClient from '../../services/cicy/CCAndroidConnectorClient';
import { onEvent } from '../../utils/utils';
import { CCWSClient } from '../../services/cicy/CCWSClient';

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
    return (
        <Button
            size="small"
            type="primary"
            onClick={async () => {
                onEvent('showLoading');
                let { version, isWin, isDev, publicDir } = appInfo;
                if (isDev) {
                    version = '0.0.0';
                }
                try {
                    const agentName = 'cicy-agent';
                    const sep = isWin ? '\\' : '/';
                    let nameApk = `app.apk`;
                    let nameApkVer = `app-v${version}.apk`;
                    const serverUrl = CCWSClient.getServerUrl(serverIp);
                    const isLocalServer = CCWSClient.isLocalServer();

                    let abi = await connector.getDevcieCpuAbi();
                    if (abi.includes('arm64')) {
                        abi = 'arm64';
                    }
                    if (abi.includes('armeabi')) {
                        abi = 'armv7a';
                    }
                    let agentNameVer = `${agentName}-v${version}-${abi}`;

                    if (isLocalServer) {
                        agentNameVer = `${publicDir}${sep}static${sep}assets${sep}${agentNameVer}`;
                    } else {
                        const url = `https://github.com/cicybot/cicy/releases/download/v${version}/${agentNameVer}`;
                        await connector.dowloadUrl(url, agentName);
                    }

                    await connector.deviceAdbPush(agentNameVer, '/data/local/tmp/' + agentName);
                    await connector.deviceAdbShell('chmod +x /data/local/tmp/' + agentName);
                    await connector.deviceAdbShell(
                        `echo ${serverUrl} > /data/local/tmp/config_server.txt`
                    );

                    if (isLocalServer) {
                        nameApkVer = `${publicDir}${sep}static${sep}assets${sep}${nameApkVer}`;
                    } else {
                        const url = `https://github.com/cicybot/cicy/releases/download/v${version}/${nameApkVer}`;
                        await connector.dowloadUrl(url, nameApkVer);
                    }
                    await connector.deviceAdbPush(nameApkVer, '/data/local/tmp/' + nameApk);
                    await connector.deviceAdbShell('pm install -r /data/local/tmp/' + nameApk);
                    try {
                        await connector.deviceAdbShell(
                            'am start -n com.cc.agent.adr/com.web3desk.adr.MainActivity'
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
    );
};
