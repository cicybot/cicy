import { View } from '@cicy/app';
import { sendAndroidApiJsonRpc } from '../utils/utils';
import { ProForm, ProFormGroup, ProFormText } from '@ant-design/pro-components';
import { CheckList } from 'antd-mobile';
import { Tabs } from 'antd-mobile';
import { useState } from 'react';

export const Proxy = ({ appInfo }: { appInfo: any }) => {
    const [selectedApps, setSelectedApps] = useState(appInfo.vpnInfo.allowList.split('|'));
    const [currentTab, setCurrentTab] = useState('proxy');

    const [apps, setApps] = useState<{ name: string; icon: string; packageName: string }[]>([]);

    return (
        <View h100p w100p overflowHidden>
            <Tabs
                activeKey={currentTab}
                onChange={v => {
                    setCurrentTab(v);
                    if (v === 'allowList') {
                        setTimeout(() => {
                            const { result } = sendAndroidApiJsonRpc('getInstalledApps', [
                                'notAll'
                            ]);
                            setApps(result.apps);
                        }, 200);
                    }
                }}
            >
                <Tabs.Tab title="代理" key="proxy">
                    <ProForm
                        readonly={false}
                        name=""
                        initialValues={{
                            proxyPoolHost: appInfo.vpnInfo.proxyPoolHost || '127.0.0.1',
                            proxyPoolPort: appInfo.vpnInfo.proxyPoolPort || '4445',
                            accountIndex: appInfo.vpnInfo.accountIndex || '10000',
                            allowList: appInfo.vpnInfo.allowList || ''
                        }}
                        onFinish={async (value: any) => {
                            sendAndroidApiJsonRpc('editVpnConfig', [
                                value.proxyPoolHost,
                                value.proxyPoolPort,
                                value.accountIndex,
                                appInfo.vpnInfo.allowList
                            ]);
                            window.dispatchEvent(new CustomEvent('fetchAppInfo'));
                        }}
                    >
                        <ProFormGroup title="">
                            <ProFormText width="xl" label="代理主机" name="proxyPoolHost" />
                            <ProFormText width="xl" label="代理端口" name="proxyPoolPort" />
                            <ProFormText width="xl" label="帐户ID" name="accountIndex" />
                        </ProFormGroup>
                    </ProForm>
                </Tabs.Tab>
                <Tabs.Tab title="应用白名单" key="allowList">
                    <View hide={apps.length === 0}>
                        <CheckList
                            multiple
                            defaultValue={selectedApps}
                            onChange={(a: any[]) => {
                                setSelectedApps(a);
                                sendAndroidApiJsonRpc('editVpnConfig', [
                                    appInfo.vpnInfo.proxyPoolHost,
                                    appInfo.vpnInfo.proxyPoolPort,
                                    appInfo.vpnInfo.accountIndex,
                                    a.join('|')
                                ]);
                                window.dispatchEvent(new CustomEvent('fetchAppInfo'));
                            }}
                        >
                            {apps.map(app => {
                                return (
                                    <CheckList.Item value={app.packageName}>
                                        {app.name}
                                    </CheckList.Item>
                                );
                            })}
                        </CheckList>
                    </View>
                </Tabs.Tab>
            </Tabs>
            {/*<View json={appInfo}></View>*/}
        </View>
    );
};
