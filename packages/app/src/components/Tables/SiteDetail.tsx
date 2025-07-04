import { useEffect, useState } from 'react';
import Loading from '../UI/Loading';
import View from '../View';
import SiteAccountsTable from './SiteAccountsTable';
import { SiteAccountInfo, SiteInfo, SiteService } from '../../services/SiteService';

const SiteDetail = ({ site }: { site: SiteInfo }) => {
    const [accounts, setAccounts] = useState<SiteAccountInfo[]>([]);
    useEffect(() => {
        new SiteService(site.site_id).getAccounts().then(res => {
            let accounts:SiteAccountInfo[] = [
                    {
                        auth:{},
                        account_index:0
                    }
                ]
            if(res.length > 0){
                accounts = res
            }
            setAccounts(accounts)
        });
    }, [site]);
    

    const changeAccounts = (
        site: SiteInfo,
        accounts: SiteAccountInfo[],
        account: SiteAccountInfo
    ) => {
        const accounts_ = SiteService.updateAccount(accounts,account)
        setAccounts(accounts_);
        new SiteService(site.site_id,account.account_index).saveAccounts(accounts_);
    };

    const addAccounts = (site: SiteInfo, accounts: SiteAccountInfo[]) => {
        const {accounts:accounts_,account_index} = SiteService.addAccount(accounts)
        new SiteService(site.site_id,account_index).saveAccounts(accounts_);
        setAccounts(accounts_);
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
                accounts={accounts }
            ></SiteAccountsTable>
        </View>
    );
};

export default SiteDetail;
