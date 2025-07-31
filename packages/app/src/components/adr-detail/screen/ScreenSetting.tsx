import View from '../../View';
import { NavBar } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import CCAndroidConnectorClient from '../../../services/cicy/CCAndroidConnectorClient';
import { AdrDeviceInfo } from '../../../services/model/AdrDeviceModel';
import { useEffect } from 'react';
import ScreenInspector from './ScreenInspector';
import { MobileInfoView } from '../MobileInfoView';

const ScreenSetting = ({
    id,
    deviceInfo,
    getDeviceInfo,
    connector
}: {
    connector: CCAndroidConnectorClient;
    getDeviceInfo: () => void;
    deviceInfo: AdrDeviceInfo;
    id: number;
}) => {
    useEffect(() => {
        getDeviceInfo();
    }, []);

    return (
        <View wh100p bgColor={'white'} relative>
            <NavBar
                backIcon={false}
                right={
                    <View rowVCenter jEnd>
                        <View
                            mr={2}
                            pointer
                            onClick={() => {
                                window.dispatchEvent(
                                    new CustomEvent('SIDE_BAR_ACTIONS', {
                                        detail: {
                                            action: 'setting'
                                        }
                                    })
                                );
                            }}
                        >
                            <CloseOutline fontSize={14}></CloseOutline>
                        </View>
                    </View>
                }
            >
                Setting
            </NavBar>
            <View abs xx0 top={44} bottom={0} px12 borderBox overflowHidden>
                {/*<ScreenInspector id={id}></ScreenInspector>*/}
                <MobileInfoView
                    getDeviceInfo={getDeviceInfo}
                    deviceInfo={deviceInfo}
                ></MobileInfoView>
            </View>
        </View>
    );
};
export default ScreenSetting;
