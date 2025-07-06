import { Button, message } from 'antd';
import CCAndroidConnectorClient from '../../services/CCAndroidConnectorClient';
import { onEvent } from '../../utils/utils';
import { CCWSClient } from '../../services/CCWSClient';
import { DeviceInfo } from '../../services/CCWSAgentClient';

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
                let { version, isDev } = appInfo;
                if (isDev) {
                    version = '0.0.0';
                }
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
                    const name1 = `${name}-v${version}-${abi}`;
                    const url = `${CCWSClient.getHttpUrl(serverIp)}/static/assets/${name1}`;
                    await connector.dowloadUrl(url, name1);
                    await connector.deviceAdbPush(name1, '/data/local/tmp/' + name);
                    await connector.deviceAdbShell('chmod +x /data/local/tmp/' + name);
                    await connector.deviceAdbShell(
                        `echo ${serverUrl} > /data/local/tmp/config_server.txt`
                    );

                    const name11 = `app-v${version}.apk`;
                    const url11 = `${CCWSClient.getHttpUrl(serverIp)}/static/assets/${name11}`;

                    await connector.dowloadUrl(url11, name11);
                    await connector.deviceAdbPush(name11, '/data/local/tmp/app.apk');
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
