import CCAgentClient from '../../../services/cicy/CCWSAgentClient';
import View from '../../View';
import { useEffect, useState } from 'react';
import { CheckList } from 'antd-mobile';

export function AppsView({
    agent,
    accessControlPackages,
    setAccessControlPackages
}: {
    accessControlPackages: string[];
    setAccessControlPackages: (v: string[]) => void;
    agent: CCAgentClient;
}) {
    const [apps, setApps] = useState<any[]>([]);
    useEffect(() => {
        agent.jsonrpcApp('getInstalledApps').then(({ apps }: { apps: any[] }) => {
            setApps(apps);
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
                            <View fontWeight={700}> {app.name}</View>
                            <View fontSize={12}> {app.packageName}</View>
                        </View>
                    </CheckList.Item>
                ))}
            </CheckList>
        </View>
    );
}
