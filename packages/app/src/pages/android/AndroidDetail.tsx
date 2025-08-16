import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import View from '../../components/View';
import { AdrDeviceInfo, AdrDeviceModel } from '../../services/model/AdrDeviceModel';
import { AdrUtils } from '../../services/common/AdrUtils';
import Loading from '../../components/UI/Loading';
import { AndroidWindow } from '../../components/adr-connector/AndroidWindow';

const AndroidDetail = () => {
    const { width, deviceId } = useParams();
    const utils = new AdrUtils(true);
    const [device, setDevice] = useState<null | AdrDeviceInfo>(null);
    useEffect(() => {
        new AdrDeviceModel(deviceId as string).get().then(res => {
            const device = res.info;
            utils
                .setDevice(device)
                .getDeviceInfo()
                .then(res => {
                    if (res) {
                        const newInfo = {
                            ...device,
                            ...res
                        };
                        new AdrDeviceModel(deviceId as string).save(newInfo);
                        setDevice(newInfo);
                    } else {
                        setDevice(device);
                    }
                })
                .catch(() => {
                    setDevice(device);
                });
        });
    }, []);

    async function saveDevice(device: AdrDeviceInfo) {
        await new AdrDeviceModel(device.deviceId).save(device);
        setDevice(device);
    }

    if (!device) {
        return (
            <View absFull center>
                <Loading></Loading>
            </View>
        );
    }
    return (
        <AndroidWindow
            saveDevice={saveDevice}
            device={device}
            width={parseInt(width as string)}
        ></AndroidWindow>
    );
};
export default AndroidDetail;
