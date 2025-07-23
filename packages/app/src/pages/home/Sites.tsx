import { Breadcrumb } from 'antd';
import SitesTable from '../../components/Tables/SitesTable';
import View from '../../components/View';

const Sites = () => {
    return (
        <View relative>
            <View pl12 mt12 mb12>
                <Breadcrumb
                    items={[
                        {
                            title: '首页'
                        },
                        {
                            title: '站点'
                        }
                    ]}
                />
            </View>
            <SitesTable />
        </View>
    );
};

export default Sites;
