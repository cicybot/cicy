import { AdrDeviceInfo } from '../../services/model/AdrDeviceModel';
import View from '../View';
import MirrorItem from './MirrorItem';
import AdrDeviceDetail from './AdrDeviceDetail';
import { useState } from 'react';
import { BackgroundApi } from '../../services/common/BackgroundApi';
import { AdrUtils } from '../../services/common/AdrUtils';
import { hideLoading, showLoading } from '../../utils/utils';

export const AndroidWindow = ({
    saveDevice,
    device,
    width
}: {
    saveDevice: (device: AdrDeviceInfo) => Promise<void>;
    width: number;
    device: AdrDeviceInfo;
}) => {
    const [currentDevice, setCurrentDevice] = useState<null | AdrDeviceInfo>(null);

    return (
        <View empty>
            <View
                abs
                top0
                bottom0
                left0
                center={true}
                bgColor={'#999'}
                w={currentDevice ? width + 24 : '100vw'}
            >
                <MirrorItem
                    isMax={true}
                    isWin={true}
                    httpShortDelayMs={10}
                    setCurrentDevice={async (device: AdrDeviceInfo) => {
                        const windowId = sessionStorage.getItem('__winId')!;
                        showLoading();
                        try {
                            const { width: winWidth } = await new BackgroundApi().getBounds(
                                windowId
                            );
                            if (winWidth < width + 360 + 24) {
                                await new BackgroundApi().setBounds(
                                    windowId,
                                    { width: width + 360 + 24 },
                                    true
                                );
                            }
                            const res = await new BackgroundApi().getMinimumSize(windowId);
                            await new BackgroundApi().setMinimumSize(
                                windowId,
                                width + 360 + 24,
                                res[1]
                            );
                            new AdrUtils(true)
                                .setDevice(device)
                                .getDeviceInfo()
                                .then(res => {
                                    if (!res) {
                                        setCurrentDevice(device);
                                    } else {
                                        const deviceNew = {
                                            ...device,
                                            ...res
                                        };
                                        setCurrentDevice(device);
                                        saveDevice(deviceNew);
                                    }
                                });
                        } catch (e) {
                            console.error(e);
                        } finally {
                            hideLoading();
                        }
                    }}
                    width={width}
                    device={device}
                />
            </View>
            {currentDevice && (
                <View
                    abs
                    top0
                    bottom0
                    right0
                    w={`calc(100vw - ${width + 24}px)`}
                    bgColor={'#f5f5f5'}
                >
                    <View absFull overflowHidden>
                        <AdrDeviceDetail
                            showInspect
                            onClose={async () => {
                                const windowId = sessionStorage.getItem('__winId')!;
                                const res = await new BackgroundApi().getMinimumSize(windowId);
                                await new BackgroundApi().setMinimumSize(windowId, width, res[1]);
                                setCurrentDevice(null);
                            }}
                            showTop
                            updateDevices={() => {
                                setCurrentDevice(null);
                            }}
                            saveDevice={async (device: AdrDeviceInfo) => {
                                await saveDevice(device);
                                setCurrentDevice(device);
                            }}
                            device={currentDevice}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};
