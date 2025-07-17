import View from '../View';
import { useEffect, useState } from 'react';
import { AndroidIcon } from '../Icons';
import { AndroidConnectorPage } from './AndroidConnectorPage';
import { useLocalStorageState } from '@cicy/utils';
import { Select } from 'antd';
import CCAndroidLeidianConnectorClient, {
    VmInfo
} from '../../services/cicy/CCAndroidLeidianConnectorClient';
import LeiDianTable from '../Tables/LeiDianTable';

export const AndroidLeiDian = ({
    allClients,
    clients
}: {
    allClients: string[];
    clients: { value: string; label: any }[];
}) => {
    const connector = new CCAndroidLeidianConnectorClient();
    const [clientId, setClientId] = useLocalStorageState('androidClientId', '');
    if (clientId) {
        connector.setClientId(clientId);
    }
    const onChangeClient = (value: string) => {
        setClientId(value);
    };
    const [installed, setInstalled] = useState(false);
    const [vmList, setVmList] = useState<VmInfo[]>([]);

    useEffect(() => {
        if (clientId) {
            connector.isInstalled().then(async res => {
                setInstalled(!!res);
                if (res) {
                    const { rows } = await connector.getVmList();
                    setVmList(rows as VmInfo[]);
                } else {
                    setVmList([]);
                }
            });
        }
    }, [clientId]);

    return (
        <AndroidConnectorPage title={'安卓模拟器'}>
            <View ml12 rowVCenter mt12>
                <View fontSize={14} mr12>
                    客户端:
                </View>
                <Select
                    size="small"
                    onChange={onChangeClient}
                    value={clientId}
                    style={{ width: 260 }}
                    options={clients}
                />
            </View>
            {!installed && (
                <View wh100p center>
                    <View p={12} center column>
                        <View center mb12 mt={-88}>
                            <AndroidIcon width={88} height={88}></AndroidIcon>
                        </View>
                        <View pb12 fontSize={14} fontWeight={700}>
                            没有安装 "雷电模拟器",请确保安装于: {connector.getLeidainDir()}
                        </View>
                    </View>
                </View>
            )}
            {installed && <LeiDianTable connector={connector} vmList={vmList}></LeiDianTable>}
        </AndroidConnectorPage>
    );
};
