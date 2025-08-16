import { Col, Row } from 'antd';
import View from '../View';
import { AdrDeviceInfo } from '../../services/model/AdrDeviceModel';
import MirrorItem from './MirrorItem';

const MirrorAdrView = ({
    setCurrentDevice,
    width,
    openAdr,
    deviceList,
    setCurrentFullscreenDevice
}: {
    setCurrentFullscreenDevice: (device: AdrDeviceInfo) => void;
    openAdr: (device: AdrDeviceInfo) => Promise<void>;
    setCurrentDevice: (device: AdrDeviceInfo) => void;
    width: number;
    deviceList: AdrDeviceInfo[];
}) => {
    return (
        <View>
            <Row gutter={[16, 24]}>
                {deviceList.map(device => {
                    return (
                        <Col key={device.id}>
                            <MirrorItem
                                setCurrentFullscreenDevice={setCurrentFullscreenDevice}
                                openAdr={openAdr}
                                setCurrentDevice={async (device: AdrDeviceInfo) =>
                                    setCurrentDevice(device)
                                }
                                width={width}
                                device={device}
                            />
                        </Col>
                    );
                })}
            </Row>
        </View>
    );
};
export default MirrorAdrView;
