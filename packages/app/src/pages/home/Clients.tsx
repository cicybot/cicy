import { Breadcrumb } from 'antd';
import ClientsTable from '../../components/Tables/ClientsTable';
import View from '../../components/View';

const Clients = () => {
    return (
        <View relative>
            <View pl12 mt12 mb12>
                <Breadcrumb
                    items={[
                        {
                            title: '首页'
                        },
                        {
                            title: '客户端'
                        }
                    ]}
                />
            </View>
            <ClientsTable />
        </View>
    );
};

export default Clients;
