import { Breadcrumb, Button, Divider } from 'antd';
import View from '../../components/View';
import { useEffect, useState } from 'react';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import { CCWSClient } from '../../services/cicy/CCWSClient';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { useMainWindowContext } from '../../providers/MainWindowProvider';

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
    const { appInfo, serverIp } = useMainWindowContext();
    const [publicIpInfo, setPublicIpInfo] = useState([null, null, null]);

    useEffect(() => {
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
                <View p12 ml12>
                    <ProDescriptions column={1}>
                        <ProDescriptions.Item label={'CiCy 服务器 IP'}>
                            <ProField text={serverIp} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'CiCy 服务器 Url'}>
                            <ProField text={CCWSClient.getServerUrl()} mode="read" />
                        </ProDescriptions.Item>

                        <ProDescriptions.Item label={'Token'}>
                            <ProField text={localStorage.getItem('token')} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>
                    <Divider />
                    <ProDescriptions column={3}>
                        <ProDescriptions.Item label={'墙内IP'}>
                            <ProField text={publicIpInfo[0]} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'墙内地址'}>
                            <ProField text={publicIpInfo[1]} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'延时'}>
                            <ProField text={publicIpInfo[2]} mode="read" />
                        </ProDescriptions.Item>
                    </ProDescriptions>
                    <Divider />
                    <ProDescriptions column={3}>
                        <ProDescriptions.Item label={'版本'}>
                            <ProField text={appInfo.version} mode="read" />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={'本机IP'}>
                            <ProField text={appInfo.ip} mode="read" />
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
                        <ProDescriptions.Item label={'公开目录'}>
                            <ProField text={appInfo.publicDir} mode="read" />
                        </ProDescriptions.Item>
                        <View ml12>
                            <Button
                                size={'small'}
                                onClick={() => {
                                    new BackgroundApi().openPath(appInfo.publicDir);
                                }}
                            >
                                打开
                            </Button>
                        </View>
                    </ProDescriptions>
                    {/*<Divider />*/}
                    {/*<ProDescriptions column={1}>*/}
                    {/*    {Object.keys(appInfo || {}).map((key: string) => {*/}
                    {/*        //@ts-ignore*/}
                    {/*        const text = appInfo[key];*/}
                    {/*        return (*/}
                    {/*            <ProDescriptions.Item key={key} label={key.replace('ccAgent', '')}>*/}
                    {/*                <ProField text={text + ''} mode="read" />*/}
                    {/*            </ProDescriptions.Item>*/}
                    {/*        );*/}
                    {/*    })}*/}
                    {/*</ProDescriptions>*/}
                </View>
            </View>
        </View>
    );
};

export default Setting;
