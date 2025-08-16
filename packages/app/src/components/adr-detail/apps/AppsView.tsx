import CCAgentClient from '../../../services/cicy/CCWSAgentClient';
import View from '../../View';
import { useEffect, useState } from 'react';
import { CheckList } from 'antd-mobile';
import { AdrDeviceInfo } from '../../../services/model/AdrDeviceModel';
import { AdrUtils } from '../../../services/common/AdrUtils';

export function AppsView({
    device,
    accessControlPackages,
    setAccessControlPackages
}: {
    accessControlPackages: string[];
    setAccessControlPackages: (v: string[]) => void;
    device: AdrDeviceInfo;
}) {
    const [apps, setApps] = useState<{ name: string; packageName: string; type: string }[]>([]);
    const utils = new AdrUtils(true).setDevice(device);
    useEffect(() => {
        utils.getAppsList().then(res => {
            setApps(res);
        });
    }, []);
    return (
        <View>
            <CheckList
                multiple
                onChange={v => {
                    setAccessControlPackages(v as string[]);
                }}
                value={accessControlPackages}
            >
                {apps.map(app => (
                    <CheckList.Item key={app.packageName} value={app.packageName}>
                        <View>
                            <View fontWeight={700}>
                                {app.type} {app.name}
                            </View>
                            <View fontSize={12}> {app.packageName}</View>
                        </View>
                    </CheckList.Item>
                ))}
            </CheckList>
        </View>
    );
}
