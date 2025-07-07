import { Breadcrumb, Divider } from 'antd';
import View from '../../components/View';
import { useEffect, useState } from 'react';
import { CCWSMainWindowClient } from '../../services/CCWSMainWindowClient';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import axios from 'axios';
import { CCWSClient } from '../../services/CCWSClient';
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
    const [appInfo, setAppInfo] = useState(null);
    const [serverIp, setServerIp] = useState(null);
    const [publicIpInfo, setPublicIpInfo] = useState([null, null]);
    useEffect(() => {
        if (window.backgroundApi) {
            window.backgroundApi
                .message({
                    action: 'utils',
                    payload: {
                        method: 'axios',
                        params: {
                            url: 'https://2025.ip138.com/'
                        }
                    }
                })
                .then(res => {
                    const { err, result } = res as any;
                    if (err) {
                        console.error(err);
                    } else {
                        const ipInfo = extractIPAndLocation(result as string);
                        setPublicIpInfo(ipInfo as any);
                    }
                });
        }
        new CCWSMainWindowClient().mainWindowInfo().then(res => {
            setAppInfo(res.result);
        });

        new CCWSMainWindowClient().getServerInfo().then(res => {
            setServerIp(res.ip);
        });
    }, []);
    return (
        <View relative>
            <View pl12 mt12 mb12>
                <Breadcrumb
                    items={[
                        {
                            title: 'Home'
                        },
                        {
                            title: 'Setting'
                        }
                    ]}
                />
            </View>
            <View>
                <View p12>
                    <ProDescriptions column={3}>
                        <ProDescriptions.Item label={'CiCy Server IP'}>
                            <ProField text={serverIp} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'CiCy Server URL'}>
                            <ProField text={CCWSClient.getServerUrl()} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>
                    <Divider />
                    <ProDescriptions column={2}>
                        <ProDescriptions.Item label={'PublicIp'}>
                            <ProField text={publicIpInfo[0]} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'Location'}>
                            <ProField text={publicIpInfo[1]} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>

                    <Divider />
                    <ProDescriptions column={1}>
                        {Object.keys(appInfo || {}).map((key: string) => {
                            //@ts-ignore
                            const text = appInfo[key];
                            return (
                                <ProDescriptions.Item key={key} label={key.replace('ccAgent', '')}>
                                    <ProField text={text + ''} mode="read" />
                                </ProDescriptions.Item>
                            );
                        })}
                    </ProDescriptions>
                </View>
            </View>
        </View>
    );
};

export default Setting;
