import { Breadcrumb } from 'antd';
import ClientsTable from '../../components/Tables/ClientsTable';
import View from '../../components/View';

const Clients = () => {
    return (
        <View  relative>
            <View pl12 mt12 mb12>
                 <Breadcrumb
                    items={[
                    {
                        title: 'Home',
                    },
                    {
                        title: 'Clients',
                    },
                    ]}
                />
            </View>
            <ClientsTable />
        </View>
    );
};

export default Clients;
