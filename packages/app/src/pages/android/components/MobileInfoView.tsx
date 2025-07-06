import View from '../../../components/View';
import { DeviceInfo } from '../../../services/CCWSAgentClient';
import { ProDescriptions, ProField } from '@ant-design/pro-components';

export const MobileInfoView = ({ deviceInfo }: { deviceInfo: DeviceInfo }) => {
    const keys = Object.keys(deviceInfo);
    return (
        <View>
            <ProDescriptions column={2}>
                {keys.map((key: string) => {
                    //@ts-ignore
                    const text = deviceInfo[key];
                    return (
                        <ProDescriptions.Item key={key} label={key.replace('ccAgent', '')}>
                            <ProField text={text + ''} mode="read" />
                        </ProDescriptions.Item>
                    );
                })}
            </ProDescriptions>
        </View>
    );
};
