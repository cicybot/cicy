import View from '../View';
import { ReactNode } from 'react';
import { Breadcrumb } from 'antd';

export const AndroidConnectorPage = ({
    title,
    children
}: {
    title?: string;
    children?: ReactNode;
}) => {
    return (
        <View w100p h100vh overflowYAuto relative>
            <View pl12 mt12 mb12>
                <Breadcrumb
                    items={[
                        {
                            title: '首页'
                        },
                        {
                            title: title || '安卓连接器'
                        }
                    ]}
                />
            </View>
            <View absFull top={44}>
                {children}
            </View>
        </View>
    );
};
