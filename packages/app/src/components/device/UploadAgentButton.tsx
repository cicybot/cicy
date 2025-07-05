import { Button, message } from 'antd';
import CCAndroidConnectorClient from '../../services/CCAndroidConnectorClient';
import { onEvent } from '../../utils/utils';
import { CCWSClient } from '../../services/CCWSClient';

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
                if (!appInfo) {
                    return;
                }
                let { version, isDev } = appInfo;
                if (isDev) {
                    version = '0.0.0';
                }
                onEvent('showLoading');
                try {
                    let abi = await connector.getDevcieCpuAbi();
                    if (abi.includes('arm64')) {
                        abi = 'arm64';
                    }
                    if (abi.includes('armeabi')) {
                        abi = 'armv7a';
                    }

                    const serverUrl = CCWSClient.getServerUrl(serverIp);
                    const name = 'cicy-agent';
                    const url = `${CCWSClient.getHttpUrl(
                        serverIp
                    )}/static/assets/${name}-${version}-${abi}`;
                    console.log('cicy-agent url', url);
                    await connector.dowloadUrl(url, name);

                    await connector.deviceAdbPush(name, '/data/local/tmp/' + name);
                    await connector.deviceAdbShell('chmod +x /data/local/tmp/' + name);
                    await connector.deviceAdbShell(
                        `echo ${serverUrl} > /data/local/tmp/config_server.txt`
                    );
                    await connector.agentRustStartLoop();
                    message.success('上传成功');
                } catch (error) {
                    console.error(error);
                    message.error('上传失败:' + error);
                }
                setTimeout(() => {
                    fetchDeviceInfo().finally(() => {
                        onEvent('hideLoading');
                    });
                }, 1000);
            }}
        >
            更新上传Agent
        </Button>
    );
};
