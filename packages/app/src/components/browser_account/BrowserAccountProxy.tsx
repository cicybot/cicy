import { BrowserAccountInfo } from '../../services/model/BrowserAccount';
import View from '../View';
import { Button, message } from 'antd';
import BrowserService from '../../services/cicy/BrowserService';
import { useEffect, useState } from 'react';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { useTimeoutLoop } from '@cicy/utils';
import { formatRelativeTime, onEvent } from '../../utils/utils';
import ProxyService from '../../services/common/ProxyService';

export const BrowserAccountProxy = ({
    browserAccount: browserAccount1
}: {
    browserAccount: BrowserAccountInfo;
}) => {
    const [browserAccount, _] = useState<BrowserAccountInfo>(browserAccount1);
    const { config } = browserAccount;

    const [isServerOnline, setIsServerOnline] = useState(false);

    const [ipInfo, setIpInfo] = useState([
        config.testIp,
        config.testLocation,
        config.testDelay,
        config.testTs
    ]);

    async function isPortOnline() {
        try {
            const port = config.useMitm
                ? ProxyService.getProxyMitmPort()
                : ProxyService.getProxyPort();
            const res = await new BackgroundApi().isPortOnline(port);
            setIsServerOnline(res.result);
        } catch (e) {
            setIsServerOnline(false);
        }
    }

    useEffect(() => {
        isPortOnline().catch(console.error);
    }, []);
    useTimeoutLoop(async () => {
        await isPortOnline();
    }, 2000);

    return (
        <View>
            <View column mb12 w={200}>
                <Button
                    size="small"
                    onClick={async () => {
                        new BrowserService('https://api.myip.com/', browserAccount.id)
                            .openWindow()
                            .then(console.error);
                    }}
                >
                    测试站点:api.myip.com
                </Button>
                <View h={6}></View>
                <Button
                    size="small"
                    onClick={async () => {
                        new BrowserService('https://ip.cicybot.workers.dev/', browserAccount.id)
                            .openWindow()
                            .then(console.error);
                    }}
                >
                    测试站点:ip.cicybot
                </Button>
                <View h={6}></View>
                <Button
                    size="small"
                    onClick={async () => {
                        new BrowserService('https://2025.ip138.com/', browserAccount.id)
                            .openWindow()
                            .then(console.error);
                    }}
                >
                    测试站点:ip138
                </Button>

                <View h={6}></View>
                <View>
                    <Button
                        size="small"
                        disabled={!isServerOnline}
                        onClick={async () => {
                            onEvent('showLoading');
                            try {
                                const [ip, location, delay, ts] = await ProxyService.testSpeed(
                                    browserAccount
                                );
                                setIpInfo([ip, location, delay, ts]);
                            } catch (e) {
                                message.error(e + '');
                            }
                            onEvent('hideLoading');
                        }}
                    >
                        测速
                    </Button>
                </View>
            </View>
            <View rowVCenter h={44}>
                <View mr12>{ipInfo[0] || '-'}</View>
                <View mr12>{ipInfo[1] || '-'}</View>
                <View mr12>{ipInfo[2] || '-'}</View>
                <View mr12>
                    {ipInfo[3]
                        ? (port => {
                              return formatRelativeTime(port as number);
                          })(ipInfo[3]!)
                        : '-'}
                </View>
            </View>
        </View>
    );
};
