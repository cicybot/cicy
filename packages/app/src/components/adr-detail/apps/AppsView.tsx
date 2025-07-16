import CCAgentClient, { DeviceInfo } from '../../../services/cicy/CCWSAgentClient';
import View from '../../View';
import { useEffect, useState } from 'react';

export function AppsView({ agent, deviceInfo }: { deviceInfo: DeviceInfo; agent: CCAgentClient }) {
    const [apps, setApps] = useState<any[]>([]);
    useEffect(() => {
        agent.jsonrpcApp('getInstalledApps').then(({ apps }: { apps: any[] }) => {
            setApps(apps);
        });
    }, []);
    return (
        <View>
            {apps.map((app: any) => {
                return (
                    <View>
                        {app.name} - {app.packageName}
                    </View>
                );
            })}
        </View>
    );
}
