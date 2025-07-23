import View from '../../components/View';
import { useEffect } from 'react';
import { Breadcrumb } from 'antd';
import BrowserAccountsTable from '../../components/Tables/BrowserAccountsTable';

const BrowserAccounts = () => {
    useEffect(() => {}, []);
    return (
        <View relative>
            <View pl12 mt12 mb12>
                <Breadcrumb
                    items={[
                        {
                            title: '首页'
                        },
                        {
                            title: '浏览器帐户'
                        }
                    ]}
                />
            </View>
            <BrowserAccountsTable />
        </View>
    );
};

export default BrowserAccounts;
