import { useEffect, useState } from 'react';
import Loading from '../../UI/Loading';
import View from '../../View';
import { AdrDeviceInfo, AdrDeviceModel } from '../../../services/model/AdrDeviceModel';
import { AdrUtils, TYPE_ROTATE_DEVICE } from '../../../services/common/AdrUtils';
import { getSessionStoredValue } from '@cicy/utils';
import { CCWSMainWindowClient } from '../../../services/cicy/CCWSMainWindowClient';
import ScreenSetting from './ScreenSetting';
import CCAndroidConnectorClient from '../../../services/cicy/CCAndroidConnectorClient';
import { BinaryDataReader } from '../../../services/common/BinaryDataReader';

let initScreen = false;
let __screenInfo: { width: any; height: any; scale: any } | null = null;
export function getScreenInfo() {
    return __screenInfo;
}
const Screen = ({
    setIsSettingOpen,
    isSettingOpen,
    id,
    useKeyEvent,
    deviceInfo,
    getDeviceInfo,
    connector
}: {
    connector: CCAndroidConnectorClient;
    getDeviceInfo: () => void;
    deviceInfo: AdrDeviceInfo;
    isSettingOpen: boolean;
    setIsSettingOpen: (v: boolean) => void;
    useKeyEvent?: boolean;
    id: number;
}) => {
    const [_, setIsFocus] = useState(false);

    const [screenUrl, setScreenUrl] = useState('');
    const [screenInfo, setDebugInfo] = useState<null | any>(null);
    __screenInfo = screenInfo;
    const [ws, setWs] = useState<null | WebSocket>(null);
    console.warn(JSON.stringify(screenInfo));
    const baseUrl = `http://localhost:${AdrDeviceModel.getForwardPortById(id)}`;

    const adrUtils = new AdrUtils(false);
    if (screenInfo) {
        adrUtils.setSize({
            width: screenInfo.width,
            height: screenInfo.height,
            scale: screenInfo.scale
        });
    }
    adrUtils.setWs(ws);
    useEffect(() => {
        AdrUtils.connectWs(id, {
            onOpen: (ws: WebSocket) => {
                setWs(ws);
                console.log('[+] ws connected!!');
                adrUtils.setWs(ws);
                init();
            },
            onClose: () => {
                setWs(null);
            }
        });
    }, []);
    useEffect(() => {
        if (useKeyEvent) {
            function keydown(e: any) {
                setIsFocus(r => {
                    if (r) {
                        adrUtils.handleKey(e, false);
                    }
                    return r;
                });
            }
            function keyup(e: any) {
                setIsFocus(r => {
                    if (r) {
                        adrUtils.handleKey(e, true);
                    }
                    return r;
                });
            }
            async function onAction(e: any) {
                const { action } = e.detail;
                switch (action) {
                    case 'back': {
                        adrUtils.pressKey(id, 'back');
                        break;
                    }
                    case 'home': {
                        adrUtils.pressKey(id, 'home');
                        break;
                    }
                    case 'recent': {
                        adrUtils.pressKey(id, 'recent');
                        break;
                    }
                    case 'rotate': {
                        adrUtils.injectEvent(TYPE_ROTATE_DEVICE);
                        break;
                    }
                    case 'setting': {
                        const mainWindow = new CCWSMainWindowClient();
                        const windowId = sessionStorage.getItem('__winId')!;
                        const bounds = await mainWindow._baseWindow(windowId, 'getBounds');
                        const heightOrg = parseInt(sessionStorage.getItem('__height')!);
                        const widthOrg = parseInt(sessionStorage.getItem('__width')!);
                        const screenWidth = __screenInfo?.width || widthOrg;
                        const screenHeight = __screenInfo?.height || heightOrg;
                        const { width, height, minHeight, minWidth } = AdrUtils.getWindowSize(
                            screenWidth,
                            screenHeight,
                            __screenInfo?.scale || 0.5,
                            window.backgroundApi.platform() === 'win32'
                        );
                        if (bounds.width < width || bounds.height < height) {
                            await mainWindow._baseWindow(windowId, 'setBounds', {
                                rect: {
                                    width,
                                    height
                                },
                                animate: true
                            });
                        }
                        if (getSessionStoredValue('isSettingOpen')) {
                            setIsSettingOpen(false);
                            mainWindow._baseWindow(windowId, 'setMinimumSize', {
                                width: minWidth,
                                height: minHeight
                            });
                            return;
                        } else {
                            if (screenWidth > screenHeight) {
                                mainWindow._baseWindow(windowId, 'setMinimumSize', {
                                    width: minWidth,
                                    height: minHeight + AdrUtils.getSettingHeight()
                                });
                            } else {
                                mainWindow._baseWindow(windowId, 'setMinimumSize', {
                                    width: minWidth + 360,
                                    height: minHeight
                                });
                            }

                            setIsSettingOpen(true);
                        }

                        break;
                    }
                }
            }
            window.addEventListener('SIDE_BAR_ACTIONS', onAction);
            document.body.addEventListener('keydown', keydown);
            document.body.addEventListener('keyup', keyup);
            return () => {
                window.removeEventListener('SIDE_BAR_ACTIONS', onAction);
                document.body.removeEventListener('keydown', keydown);
                document.body.removeEventListener('keyup', keydown);
            };
        }
    }, []);
    function handleImage(value: Uint8Array) {
        const reader = new BinaryDataReader(value);

        // Read the JPEG data length first
        const len = reader.readInt();
        if (len < 0 || len > value.byteLength) {
            return;
        }
        console.log('===>>>:', value.byteLength, len);

        // Read the actual JPEG data
        const jpegData = reader.readBytes(len);
        const blob = new Blob([jpegData], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setScreenUrl(imageUrl);

        const width = reader.readInt();
        const height = reader.readInt();
        const quality = reader.readInt();
        const maxImages = reader.readInt();
        const scale = reader.readInt() / 100; // Convert back from percentage
        const timeDiff = reader.readInt();
        const seconds = reader.readInt();
        const millis = reader.readInt();
        const ts = Date.now() / 1000;
        const ts0 = seconds + millis / 1000;
        const delay = Math.floor(ts - ts0);
        setDebugInfo({
            width,
            height,
            quality,
            maxImages,
            scale,
            len,
            timeDiff,
            seconds,
            millis,
            ts0,
            ts,
            delay: delay < 0 ? 0 : delay
        });
        if (!initScreen) {
            initScreen = true;

            const mainWindow = new CCWSMainWindowClient();
            const windowId = sessionStorage.getItem('__winId')!;
            const { minWidth, minHeight } = AdrUtils.getWindowSize(
                width,
                height,
                scale,
                window.backgroundApi.platform() === 'win32'
            );
            mainWindow._baseWindow(windowId, 'setMinimumSize', {
                width: minWidth,
                height: minHeight
            });
        }
    }
    async function init() {
        initScreen = false;
        fetch(`${baseUrl}/screen.jpg?q=80&m=3`).then(res => {
            const responseBody = res.body as any;
            const reader = responseBody.getReader();
            new ReadableStream({
                start(controller) {
                    function processChunk() {
                        reader.read().then(({ done, value }: any) => {
                            if (done) {
                                controller.close();
                                reader.releaseLock();
                                responseBody.cancel();
                                return;
                            }
                            try {
                                handleImage(value);
                            } catch (e) {
                                console.error(e);
                            }
                            processChunk();
                        });
                    }
                    processChunk();
                }
            });
        });
    }

    const online = Boolean(screenUrl && ws && screenInfo);
    if (!online) {
        return (
            <View wh100p center>
                <Loading color={'white'}></Loading>
            </View>
        );
    }
    const { width, height } = screenInfo;
    const flag = width > height;
    const ScreenInner = (
        <>
            <View style={{ marginTop: -24 }} relative>
                {online && (
                    <img
                        onMouseEnter={() => {
                            setIsFocus(true);
                        }}
                        onContextMenu={e => {
                            e.preventDefault();
                        }}
                        onMouseDown={e => adrUtils.mousedown(e)}
                        onMouseUp={e => adrUtils.mouseup(e)}
                        onMouseLeave={e => {
                            setIsFocus(false);
                            adrUtils.mouseleave(e);
                        }}
                        onMouseMove={e => adrUtils.mousemove(e)}
                        style={{
                            cursor: 'grab',
                            userSelect: 'none',
                            borderRadius: 12
                            // width: fit ? '100%' : undefined,
                            // height: fit ? '100%' : undefined
                        }}
                        draggable={false}
                        id={'screenImg'}
                        src={screenUrl}
                        alt=""
                    />
                )}
                <View displayNone id={'inspect_node'} abs zIdx={1}></View>
            </View>
            {screenInfo && (
                <View
                    rowVCenter
                    px12
                    borderBox
                    fontSize={12}
                    abs
                    bottom={0}
                    xx0
                    h={24}
                    color={'#999'}
                >
                    {screenInfo.width}x{screenInfo.height} {screenInfo.scale} {screenInfo.quality}{' '}
                    {Math.round(screenInfo.len / 100) / 10}k {screenInfo.delay}ms
                </View>
            )}
        </>
    );
    const h1 = 32 + screenInfo.height * screenInfo.scale;
    return (
        <View wh100p relative jCenter center borderBox>
            {flag ? (
                <>
                    <View
                        abs
                        h={isSettingOpen ? h1 : '100vh'}
                        left={0}
                        right={0}
                        top0
                        overflowHidden
                        center
                    >
                        {ScreenInner}
                    </View>
                    <View
                        abs
                        left={0}
                        right={0}
                        bottom={0}
                        top={isSettingOpen ? h1 : 0}
                        w={isSettingOpen ? '100%' : 0}
                    >
                        {isSettingOpen && (
                            <ScreenSetting
                                {...{ deviceInfo, getDeviceInfo, connector }}
                                id={id}
                            ></ScreenSetting>
                        )}
                    </View>
                </>
            ) : (
                <>
                    <View
                        abs
                        left={0}
                        top={0}
                        bottom={0}
                        w={isSettingOpen ? AdrUtils.getSettingHeight() : 0}
                    >
                        {isSettingOpen && (
                            <ScreenSetting
                                {...{ deviceInfo, getDeviceInfo, connector }}
                                id={id}
                            ></ScreenSetting>
                        )}
                    </View>
                    <View
                        abs
                        left={!isSettingOpen ? 0 : AdrUtils.getSettingHeight()}
                        top0
                        bottom={0}
                        right={0}
                        overflowHidden
                        center
                    >
                        {ScreenInner}
                    </View>
                </>
            )}
        </View>
    );
};
export default Screen;
