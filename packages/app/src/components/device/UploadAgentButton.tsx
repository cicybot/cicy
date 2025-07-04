import { Button, message } from 'antd';
import CCAndroidConnectorClient from '../../services/CCAndroidConnectorClient';
import { onEvent } from '../../utils/utils';

export const UploadAgentButton = ({
    serverIp,
    connector,
    fetchDeviceInfo
}: {
    connector:CCAndroidConnectorClient;
    serverIp: null | string;
    fetchDeviceInfo: any;
}) => {
    return (
        <Button
            size="small"
            type="primary"
            onClick={async () => {
                onEvent('showLoading');
                try {
                    let abi = await connector.getDevcieCpuAbi();
                    if (abi.includes('arm64')) {
                        abi = abi.split('-')[0];
                    }
                    if (abi.includes('armeabi')) {
                        abi = 'arm';
                    }

                    const httpServerUrl = `http://${serverIp}:3101/static/assets`;
                    const serverUrl = `ws://${serverIp}:3101/ws`;

                    await connector.dowloadUrl(
                        `${httpServerUrl}/cc-agent-rust-${abi}`,
                        `cc-agent-rust-${abi}`
                    );

                    await connector.deviceAdbPush(
                        `cc-agent-rust-${abi}`,
                        '/data/local/tmp/cc-agent-rust'
                    );

                    await connector.deviceAdbShell('chmod +x /data/local/tmp/cc-agent-rust');
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
