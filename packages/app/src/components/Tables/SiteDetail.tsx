import { useEffect, useState } from 'react';
import Loading from '../UI/Loading';
import View from '../View';
import SiteAccountsTable from './SiteAccountsTable';
import { SiteAccountInfo, SiteInfo, SiteService } from '../../services/model/SiteService';
import { onEvent } from '../../utils/utils';
import { SiteAccount } from '../../services/model/SiteAccount';

const SiteDetail = ({ site }: { site: SiteInfo }) => {
    const [accounts, setAccounts] = useState<SiteAccountInfo[]>([]);
    const fetchAccounts = () => {
        return new SiteService(site.site_id).getAccounts().then(res => {
            if (res.length === 0) {
                SiteAccount.add(site.site_id).then(() => {
                    fetchAccounts().catch(console.error);
                });
            }
            setAccounts(res);
        });
    };
    useEffect(() => {
        fetchAccounts().catch(console.error);
    }, [site]);

    const changeAccounts = async (account: SiteAccountInfo) => {
        onEvent('showLoading');
        await new SiteAccount(site.site_id, account.account_index).save(account);
        await fetchAccounts();
        onEvent('hideLoading');
    };

    const addAccounts = (site: SiteInfo) => {
        SiteAccount.add(site.site_id).then(() => {
            fetchAccounts().catch(console.error);
        });
    };
    if (!site) {
        return (
            <View center wh100p>
                <Loading size={44}></Loading>
            </View>
        );
    }

    accounts.sort((a, b) => -a.account_index + b.account_index);
    return (
        <View>
            <SiteAccountsTable
                changeAccounts={changeAccounts}
                addAccounts={addAccounts}
                site={site!}
                accounts={accounts}
            ></SiteAccountsTable>
        </View>
    );
};

export default SiteDetail;
