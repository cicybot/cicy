import View from '../View';
import { Drawer } from 'antd';
import { useState } from 'react';
import { AppsView } from './apps/AppsView';
import { List, Switch } from 'antd-mobile';
import { useTimeoutLoop } from '@cicy/utils';
import { ClashConfigView } from '../vpn/ClashConfigView';
import { onEvent } from '../../utils/utils';
import { AdrDeviceInfo } from '../../services/model/AdrDeviceModel';

export const MobileInfoView = ({
    deviceInfo,
    getDeviceInfo
}: {
    deviceInfo: AdrDeviceInfo;
    getDeviceInfo: () => void;
}) => {
    const [showApps, setShowApps] = useState(false);
    const [clashConfig, setClashConfig] = useState<null | any>(null);

    useTimeoutLoop(async () => {
        await getDeviceInfo();
    }, 1000);
    return (
        <View wh100p overflowYAuto>
            {/*<View useSelectText json={deviceInfo}></View>*/}
            <List header="基础信息">
                <List.Item extra={deviceInfo.sn}>序列号</List.Item>
                <List.Item extra={deviceInfo.brand}>品牌</List.Item>
                <List.Item extra={deviceInfo.model}>型号</List.Item>
                <List.Item extra={deviceInfo.sdkVersion}>SDK</List.Item>
                <List.Item extra={deviceInfo.releaseVersion}>发布版本</List.Item>
                <List.Item extra={deviceInfo.abilist}>CPU</List.Item>
                <List.Item extra={deviceInfo.ports.join(',')}>端口</List.Item>
                <List.Item extra={deviceInfo.userRotation}>屏幕</List.Item>
            </List>

            {/*<List header="Clash">*/}
            {/*    <List.Item*/}
            {/*        extra={*/}
            {/*            <Switch*/}
            {/*                onChange={async _ => {*/}
            {/*                    onEvent('showLoading');*/}
            {/*                    if (!agentAppInfo.isClashRunning) {*/}
            {/*                        await agent.jsonrpcApp('startClash');*/}
            {/*                    } else {*/}
            {/*                        await agent.jsonrpcApp('stopClash');*/}
            {/*                    }*/}
            {/*                    onEvent('hideLoading');*/}
            {/*                }}*/}
            {/*                checked={agentAppInfo.isClashRunning}*/}
            {/*            />*/}
            {/*        }*/}
            {/*    >*/}
            {/*        开启状态*/}
            {/*    </List.Item>*/}
            {/*    <List.Item*/}
            {/*        clickable*/}
            {/*        onClick={async () => {*/}
            {/*            onEvent('showLoading');*/}
            {/*            await agent.jsonrpcApp('updateClash');*/}
            {/*            onEvent('hideLoading');*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        更新配置*/}
            {/*    </List.Item>*/}
            {/*    <List.Item*/}
            {/*        clickable*/}
            {/*        onClick={async () => {*/}
            {/*            const res = await agent.jsonrpcApp('getClashConfig');*/}
            {/*            setClashConfig(res);*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        修改配置*/}
            {/*    </List.Item>*/}
            {/*</List>*/}

            {/*<List header="Apps">*/}
            {/*    <List.Item*/}
            {/*        clickable*/}
            {/*        onClick={() => {*/}
            {/*            setShowApps(true);*/}
            {/*        }}*/}
            {/*    >*/}
            {/*        App列表*/}
            {/*    </List.Item>*/}
            {/*</List>*/}

            {/*<Drawer*/}
            {/*    width={'360px'}*/}
            {/*    title={'Apps'}*/}
            {/*    closable={{ 'aria-label': 'Close Button' }}*/}
            {/*    onClose={() => {*/}
            {/*        setShowApps(false);*/}
            {/*    }}*/}
            {/*    open={showApps}*/}
            {/*>*/}
            {/*    {showApps && (*/}
            {/*        <AppsView*/}
            {/*            accessControlPackages={[]}*/}
            {/*            setAccessControlPackages={() => {}}*/}
            {/*            agent={agent}*/}
            {/*        />*/}
            {/*    )}*/}
            {/*</Drawer>*/}
            {/*<Drawer*/}
            {/*    width={'360px'}*/}
            {/*    title={'Clash'}*/}
            {/*    closable={{ 'aria-label': 'Close Button' }}*/}
            {/*    onClose={() => {*/}
            {/*        setClashConfig(null);*/}
            {/*    }}*/}
            {/*    open={!!clashConfig}*/}
            {/*>*/}
            {/*    {clashConfig && (*/}
            {/*        <ClashConfigView*/}
            {/*            setClashConfig={(c: any) => {*/}
            {/*                setClashConfig(c);*/}
            {/*            }}*/}
            {/*            agentAppInfo={agentAppInfo}*/}
            {/*            clashConfig={clashConfig}*/}
            {/*        />*/}
            {/*    )}*/}
            {/*</Drawer>*/}
        </View>
    );
};
