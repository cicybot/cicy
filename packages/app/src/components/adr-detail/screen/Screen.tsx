import { useEffect, useState } from 'react';
import Loading from '../../UI/Loading';
import View from '../../View';
import { AdrUtils } from '../../../services/common/AdrUtils';
import { AdrDeviceInfo, AdrDeviceModel } from '../../../services/model/AdrDeviceModel';
import { Popover } from 'antd';
import { useTimeoutLoop } from '@cicy/utils';

export const AdbUtilsCache: Map<number, AdrUtils> = new Map();
const Screen = ({
    device,
    useHttpShort,
    useWs,
    useKeyEvent,
    id,
    httpShortDelayMs
}: {
    useKeyEvent?: boolean;
    useWs?: boolean;
    httpShortDelayMs?: number;
    useHttpShort?: boolean;
    device: AdrDeviceInfo;
    id: number;
}) => {
    const { accessPort, accessIp } = device;
    const [screenUrl, setScreenUrl] = useState('');
    const [screenInfo, setDebugInfo] = useState<null | any>(null);
    const port = AdrDeviceModel.getForwardPortById(device.id);
    const [ws, setWs] = useState<null | WebSocket>(null);

    const adrUtils = AdbUtilsCache.get(port)
        ? AdbUtilsCache.get(port)!
        : (() => {
              const t = new AdrUtils(Boolean(useHttpShort));
              AdbUtilsCache.set(port, t);
              return t;
          })();
    if (ws) {
        adrUtils.setWs(ws);
    }
    if (screenInfo) {
        adrUtils.setScreenInfo(screenInfo);
    }
    adrUtils.setId(id).setAccessPort(accessPort).setAccessIp(accessIp);
    if (screenInfo) {
        adrUtils.setSize({
            width: screenInfo.width,
            height: screenInfo.height,
            scale: screenInfo.scale
        });
    }

    useTimeoutLoop(async () => {
        while (adrUtils.releaseUrl.length > 1) {
            const url = adrUtils.releaseUrl.shift();
            if (url && url !== screenUrl) {
                URL.revokeObjectURL(url);
            }
        }
    }, 1000);

    function onFinishLoadScreenImage(res: any) {
        if (!res) {
            return;
        }
        const { ts } = res;

        const delay0 = ts - adrUtils.lastTs;
        adrUtils.lastTs = Date.now() / 1000;
        setDebugInfo({
            ...res,
            delay0
        });
    }

    async function loadScreenImage() {
        if (!AdbUtilsCache.get(port)) {
            return;
        }
        const url = `${adrUtils.getBaseUrl()}/screenImg.jpeg?port=${port}`;
        let delay = httpShortDelayMs === undefined ? 500 : httpShortDelayMs;
        if (adrUtils.isFocus) {
            delay = 10;
        }
        try {
            const response = await fetch(`${url}`);
            setTimeout(() => loadScreenImage(), delay);
            try {
                const ab = await response.arrayBuffer();
                if (ab.byteLength > 0) {
                    const uint8Array = new Uint8Array(ab);
                    const res = AdrUtils.handleScreenImage(uint8Array, (imageUrl: string) => {
                        setScreenUrl(imageUrl);
                        if (!AdbUtilsCache.get(port)) {
                            return;
                        }
                        adrUtils.releaseUrl.push(imageUrl);
                    });
                    onFinishLoadScreenImage(res);
                }
            } catch (e) {
                console.error(port, e);
            }
        } catch (e) {
            console.error(port, e);
            setTimeout(() => loadScreenImage(), delay);
        }
    }

    const [stopMouse, setStopMouse] = useState(false);
    useEffect(() => {
        function onAction(e: any) {
            const action = e.detail.action;
            switch (action) {
                case 'stopMouse': {
                    setStopMouse(true);
                    break;
                }
                case 'resumeMouse': {
                    setStopMouse(false);
                    break;
                }
            }
        }
        window.addEventListener('onScreenAction', onAction);
        return () => window.removeEventListener('onScreenAction', onAction);
    }, []);

    useEffect(() => {
        if (useKeyEvent) {
            function keydown(e: any) {
                if (adrUtils.isFocus) {
                    adrUtils.handleKey(e, false);
                }
            }

            function keyup(e: any) {
                if (adrUtils.isFocus) {
                    adrUtils.handleKey(e, true);
                }
            }

            document.body.addEventListener('keydown', keydown);
            document.body.addEventListener('keyup', keyup);
            return () => {
                document.body.removeEventListener('keydown', keydown);
                document.body.removeEventListener('keyup', keydown);
            };
        }
    }, []);

    async function init() {
        adrUtils.inited = true;
        if (useHttpShort) {
            await loadScreenImage();
        } else {
            const url = `${adrUtils.getBaseUrl()}/screen.jpeg?q=80&m=3`;
            fetch(`${url}`).then(res => {
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
                                    const res = AdrUtils.handleScreenImage(
                                        value,
                                        (imageUrl: string) => {
                                            setScreenUrl(imageUrl);
                                            adrUtils.releaseUrl.push(imageUrl);
                                        }
                                    );
                                    onFinishLoadScreenImage(res);
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
    }

    useEffect(() => {
        init().catch(console.error);
        if (useWs) {
            AdrUtils.connectWs(id, {
                onOpen: (ws: WebSocket) => {
                    setWs(ws);
                    console.log('[+] ws connected!!');
                },
                onClose: () => {
                    setWs(null);
                }
            });
        }

        return () => {
            adrUtils.closeWs();
            AdbUtilsCache.delete(port);
        };
    }, []);
    const online = Boolean(screenUrl && screenInfo);
    const infoPop = !screenInfo ? (
        <>-</>
    ) : (
        <View rowVCenter>
            {screenInfo.width}x{screenInfo.height}{' '}
            {(len => {
                const res = Math.round(len / 100) / 10;
                if ((res + '').indexOf('.') === -1) {
                    return `${res}.0`;
                }
                return res;
            })(screenInfo.len)}
            k {Math.round(screenInfo.delay0 * 1000)} ms
        </View>
    );
    return (
        <View wh100p relative jCenter aStart borderBox>
            {!online && (
                <View
                    w100p
                    h={`calc(100% - ${AdrUtils.getBottomHeight()}px)`}
                    mb={AdrUtils.getBottomHeight()}
                    center
                >
                    <Loading></Loading>
                </View>
            )}
            {online && (
                <img
                    onContextMenu={e => {
                        e.preventDefault();
                    }}
                    onMouseEnter={() => {
                        adrUtils.setIsFocus(true);
                    }}
                    onMouseDown={e => {
                        if (!stopMouse) {
                            adrUtils.mousedown(e);
                        } else {
                            const { pageX, pageY } = e;
                            window.dispatchEvent(
                                new CustomEvent('onScreenMouseDown', {
                                    detail: {
                                        originScreenWidth: screenInfo.width,
                                        pageX,
                                        pageY
                                    }
                                })
                            );
                        }
                    }}
                    onMouseUp={e => {
                        if (!stopMouse) {
                            adrUtils.mouseup(e);
                        }
                    }}
                    onMouseLeave={e => {
                        adrUtils.setIsFocus(false);
                        if (!stopMouse) {
                            adrUtils.mouseleave(e);
                        }
                    }}
                    onMouseMove={e => {
                        if (!stopMouse) {
                            adrUtils.mousemove(e);
                        }
                    }}
                    style={{
                        // borderTopLeftRadius: 8,
                        // borderTopRightRadius: 8,
                        userSelect: 'none',
                        width: '100%',
                        height: 'calc(100% - 32px)'
                    }}
                    draggable={false}
                    id={`screenImg_${id}`}
                    src={screenUrl}
                    alt=""
                />
            )}
            <View displayNone id={`inspect_node_${id}`} abs zIdx={1}></View>
            <View
                rowVCenter
                jSpaceBetween
                borderBox
                fontSize={12}
                abs
                bottom={0}
                xx0
                h={AdrUtils.getBottomHeight()}
                color={'#999'}
            >
                <View ml={6} rowVCenter>
                    <View rowVCenter mr12>
                        <Popover content={infoPop}>
                            {device.brand} {port}
                        </Popover>
                    </View>
                </View>
            </View>
        </View>
    );
};
export default Screen;
