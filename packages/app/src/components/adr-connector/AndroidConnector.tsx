import View from '../View';
import { useWsClients } from '../../hooks/ws';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useTimeoutLoop } from '@cicy/utils';
import { AndroidConnectorInner } from './AndroidConnectorInner';
import { AndroidLeiDian } from './AndroidLeiDian';
import Loading from '../UI/Loading';

export const AndroidConnector = ({ isLeiDian }: { isLeiDian?: boolean }) => {
    const { clients: clientsData, refetch: refetchClients } = useWsClients();

    const clients = (clientsData || [])
        .filter((clientId: string) => clientId.startsWith('CONNECTOR-'))
        .map((clientId: string) => {
            const t = clientId.split('-');
            t.pop();
            t.shift();
            return {
                value: clientId,
                label: <span>{t.join('-')}</span>
            };
        });

    useTimeoutLoop(async () => {
        await refetchClients(true);
    }, 2000);
    if (clients.length === 0) {
        return (
            <AndroidConnectorPage>
                <View wh100p center>
                    <Loading></Loading>
                </View>
            </AndroidConnectorPage>
        );
    }
    if (isLeiDian) {
        return <AndroidLeiDian allClients={clientsData} clients={clients}></AndroidLeiDian>;
    }
    return <AndroidConnectorInner></AndroidConnectorInner>;
};
