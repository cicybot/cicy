import View from '../View';
import { useWsClients } from '../../hooks/ws';
import { AndroidIcon } from '../Icons';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useTimeoutLoop } from '@cicy/utils';
import { AndroidConnectorInner } from './AndroidConnectorInner';

export const AndroidConnector = () => {
    const { clients: clientsData, refetch: refetchClients } = useWsClients();

    const clients = (clientsData || [])
        .filter((clientId: string) => clientId.startsWith('CONNECTOR-'))
        .map((clientId: string) => {
            return {
                value: clientId,
                label: <span>{clientId}</span>
            };
        });

    useTimeoutLoop(async () => {
        await refetchClients(true);
    }, 2000);
    if (clients.length === 0) {
        return (
            <AndroidConnectorPage>
                <View wh100p center>
                    <View p={12} center column>
                        <View center mb12 mt={-88}>
                            <AndroidIcon width={88} height={88}></AndroidIcon>
                        </View>
                        <View pb12 fontSize={14} fontWeight={700}>
                            安卓连接器没有连接！
                        </View>
                    </View>
                </View>
            </AndroidConnectorPage>
        );
    }
    return (
        <AndroidConnectorInner allClients={clientsData} clients={clients}></AndroidConnectorInner>
    );
};
