import { Alert, Button, Checkbox, Drawer, message, TreeDataNode, TreeProps } from 'antd';
import {
    ArrowLeftOutlined,
    HomeOutlined,
    SettingOutlined,
    WindowsOutlined
} from '@ant-design/icons';

import { useEffect, useRef, useState } from 'react';
import View from '../View';

import {
    convertXmlToTreeData,
    getExpandKeys,
    parseBounds,
    type Rect,
    type XmlNode
} from '../../pages/android/utils';
import Loading from '../UI/Loading';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import { InspectView } from './InspectView';
import { AiView } from './AiView';
import { MobileInfoView } from './MobileInfoView';
import { CCWSMainWindowClient } from '../../services/cicy/CCWSMainWindowClient';
import { MainWindowAppInfo } from '../../providers/MainWindowProvider';

function AndroidDetailInner({ agentAppInfo: agentAppInfo_ }: { agentAppInfo: any }) {
    const [img, setImg] = useState('');
    const [appInfo, setAppInfo] = useState<MainWindowAppInfo | null>(null);

    const [settingDrawer, showSettingDawer] = useState(false);
    const [autoScreen, setAutoScreen] = useLocalStorageState('autoScreen', false);
    // const [isInspect, setInspect] = useState(true);
    const isInspect = true;
    const [agentAppInfo, setAgentAppInfo] = useState<any>(agentAppInfo_);
    const currentImageWidth = 300;
    const { width: originScreenWidth, height: originScreenHeight } = agentAppInfo;
    const [nodesMap, setNodesMap] = useState<Record<string, XmlNode>>({});
    const [nodeBoundsMap, setNodeBoundsMap] = useState<Record<string, Rect>>({});
    const [currentClickPoint, setCurrentClickPoint] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0
    });

    const imgRef = useRef<HTMLImageElement>(null);
    const [expandedKeys, setExpandedKeys] = useState<string[]>(['0']); // 添加展开的keys
    const [selectedKey, setSelectedKey] = useState<string[]>([]); // 添加选中的key

    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<null | any>(null);

    useEffect(() => {
        new CCWSMainWindowClient().mainWindowInfo().then(res => {
            setAppInfo(res.result);
        });
        if (!isInspect) {
            return;
        }
        if (selectedNode && !nodesMap[selectedNode.nodeKey]) {
            setSelectedNode(null);
        }
    }, [selectedNode, nodesMap, isInspect]);
    const agent = new CCAgentClient(agentAppInfo.clientId);
    appInfo && agent.setAppInfo(appInfo);
    agent.setAgentAppInfo(agentAppInfo);
    const [nodeError, setNodeError] = useState('');
    const fetchDeviceInfo = () =>
        agent.getAgentAppInfo().then(res => {
            setAgentAppInfo(res);
            return res;
        });

    const getScreenImage = async () => {
        if (!agentAppInfo.recordingIsReady) {
            return;
        }
        const { imgData, hierarchy } = await agent.getScreen();
        setImg(imgData);
        if (hierarchy && hierarchy.startsWith('<error')) {
            setNodeError(hierarchy);
        } else {
            setNodeError('');
        }
        if (hierarchy && !hierarchy.startsWith('<error')) {
            const { treeData, nodesMap, nodeBoundsMap } = await convertXmlToTreeData(hierarchy);
            // console.log('nodesMap', nodesMap);
            setTreeData(treeData);
            setNodesMap(nodesMap);
            setNodeBoundsMap(nodeBoundsMap);
            if (!expandedKeys) {
                //@ts-ignore
                setExpandedKeys(['0', ...treeData![0].children!.map(row => row.key)]);
            }
        }
    };

    const onSelect: TreeProps['onSelect'] = selectedKeys => {
        console.log('onSelect', selectedKeys);
        setSelectedKey(selectedKeys as string[]);
        const node = nodesMap![selectedKeys[0] as string];
        const { bounds } = node;
        const { left, right, top, bottom } = parseBounds(bounds)!;
        setCurrentClickPoint({ x: left + (right - left) / 2, y: top + (bottom - top) / 2 });
        setSelectedNode(node);
    };

    useTimeoutLoop(async () => {
        if (autoScreen && img) {
            await getScreenImage();
        }
    }, 500);
    useTimeoutLoop(async () => {
        if (!img) {
            await getScreenImage();
        }
        await fetchDeviceInfo();
    }, 1000);

    function onClickImage(e: React.MouseEvent<HTMLDivElement>) {
        const img = imgRef.current;
        if (!img) return;
        const { pageX, pageY } = e;

        // 获取图片位置和尺寸
        const rect = img.getBoundingClientRect();
        const scale = rect.width / originScreenWidth;

        // 计算点击位置在原始屏幕上的坐标
        const screenX = Math.round((pageX - rect.left) / scale);
        const screenY = Math.round((pageY - rect.top) / scale);

        if (!isInspect) {
            if (!agent.inputIsReady()) {
                message.error('没有开启无障碍辅助');
            } else {
                agent.click(screenX, screenY);
            }

            return;
        }

        // 查找所有包含点击位置的节点
        const candidates: { key: string; area: number }[] = [];

        for (const key of Object.keys(nodesMap)) {
            const bounds = nodeBoundsMap[key];
            if (!bounds) continue;

            // 检查点击是否在边界内
            if (
                screenX >= bounds.left &&
                screenX <= bounds.right &&
                screenY >= bounds.top &&
                screenY <= bounds.bottom
            ) {
                // 计算节点面积
                const width = bounds.right - bounds.left;
                const height = bounds.bottom - bounds.top;
                const area = width * height;
                candidates.push({ key, area });
            }
        }

        // 如果没有找到任何节点
        if (candidates.length === 0) {
            console.log('未找到节点');
            setSelectedNode(null);
            setSelectedKey([]);
            return;
        }

        // 按面积从小到大排序（面积最小的节点在最前面）
        candidates.sort((a, b) => a.area - b.area);

        // 选择面积最小的节点作为最上层节点
        const topNodeKey = candidates[0].key;
        const topNode = nodesMap[topNodeKey];

        if (topNode) {
            setSelectedNode(topNode);
            setSelectedKey([topNodeKey]);
            setExpandedKeys(getExpandKeys(topNodeKey));
            console.log('找到节点:', topNode);
            setCurrentClickPoint({ x: screenX, y: screenY });
        } else {
            setSelectedNode(null);
            setSelectedKey([]);
            setCurrentClickPoint({ x: 0, y: 0 });
            console.log('未找到有效节点');
        }
    }

    // 计算高亮框的位置和尺寸
    const calculateHighlightStyle: any = () => {
        if (!selectedNode || !selectedNode.bounds || !imgRef.current) {
            return { display: 'none' };
        }

        const bounds = parseBounds(selectedNode.bounds);
        if (!bounds) return { display: 'none' };

        const imgRect = imgRef.current.getBoundingClientRect();
        const scale = imgRect.width / originScreenWidth;

        const width = (bounds.right - bounds.left) * scale;
        const height = (bounds.bottom - bounds.top) * scale;

        return {
            position: 'absolute',
            left: `${bounds.left * scale}px`,
            top: `${bounds.top * scale}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: '2px solid red',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            pointerEvents: 'none', // 防止遮挡点击事件
            zIndex: 10
        };
    };

    if (!agentAppInfo.recordingIsReady) {
        return (
            <View w100vw h100vh center column>
                <View>{agentAppInfo.clientId}</View>
                <View mt12>没有开启屏幕录制</View>
                <View center mt12>
                    <Button
                        onClick={async () => {
                            await agent.jsonrpcApp('onStartRecording');
                        }}
                        size={'small'}
                    >
                        开启
                    </Button>
                </View>
            </View>
        );
    }
    return (
        <View style={{ position: 'fixed', top: 0, left: 0, display: 'flex', flexDirection: 'row' }}>
            <View pl12 pr12 w={currentImageWidth + 32} relative>
                <View w={32} abs right={0} top={44} aCenter column>
                    <Button
                        icon={<HomeOutlined></HomeOutlined>}
                        size="small"
                        onClick={() => {
                            if (!agent.inputIsReady()) {
                                message.error('没有开启无障碍辅助');
                            } else {
                                agent.pressKey('home');
                            }
                        }}
                    ></Button>
                    <Button
                        icon={<ArrowLeftOutlined></ArrowLeftOutlined>}
                        size="small"
                        style={{ marginTop: 12 }}
                        onClick={() => {
                            if (!agent.inputIsReady()) {
                                message.error('没有开启无障碍辅助');
                            } else {
                                agent.pressKey('back');
                            }
                        }}
                    ></Button>
                    <Button
                        icon={<WindowsOutlined></WindowsOutlined>}
                        size="small"
                        style={{ marginTop: 12 }}
                        onClick={() => {
                            if (!agent.inputIsReady()) {
                                message.error('没有开启无障碍辅助');
                            } else {
                                agent.pressKey('recent');
                            }
                        }}
                    ></Button>
                    <Button
                        icon={<SettingOutlined></SettingOutlined>}
                        size="small"
                        style={{ marginTop: 12 }}
                        onClick={() => {
                            fetchDeviceInfo();
                            showSettingDawer(true);
                        }}
                    ></Button>
                </View>
                <View rowVCenter h={32}>
                    <Button
                        size="small"
                        onClick={() => {
                            getScreenImage();
                        }}
                    >
                        刷新屏幕
                    </Button>
                    <Checkbox
                        style={{ marginLeft: 6 }}
                        checked={autoScreen}
                        onChange={e => {
                            setAutoScreen(e.target.checked);
                        }}
                    >
                        自动
                    </Checkbox>
                    {/*<Checkbox*/}
                    {/*    style={{ marginLeft: 12 }}*/}
                    {/*    checked={isInspect}*/}
                    {/*    onChange={e => {*/}
                    {/*        if (e.target.checked) {*/}
                    {/*            if (!agent.inputIsReady()) {*/}
                    {/*                message.error('请先打开无障碍服务');*/}
                    {/*                return;*/}
                    {/*            }*/}
                    {/*        }*/}
                    {/*        setInspect(e.target.checked);*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    调试节点*/}
                    {/*</Checkbox>*/}
                </View>
                <View
                    style={{
                        overflow: 'hidden',
                        width: currentImageWidth,
                        height: originScreenHeight * (currentImageWidth / originScreenWidth),
                        position: 'relative',
                        border: `1px solid #d9d9d9`,
                        borderRadius: 12
                    }}
                >
                    {!img && (
                        <View wh100p center>
                            <Loading></Loading>
                        </View>
                    )}
                    {img && (
                        <img
                            ref={imgRef}
                            width={currentImageWidth + 'px'}
                            src={img}
                            alt="device screen"
                        />
                    )}
                    <View hide={!isInspect} id="hightLightNode" style={calculateHighlightStyle()} />
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1000
                        }}
                        onClick={onClickImage}
                    ></View>
                </View>
            </View>
            <View
                style={{
                    height: '100vh',
                    overflow: 'hidden',
                    width: 'calc(100vw - 360px)'
                }}
                borderBox
                relative
                ml={8}
            >
                <View hide={true} wh100p borderBox px12>
                    <AiView></AiView>
                </View>
                <View hide={agentAppInfo.inputIsReady} wh100p borderBox px12 center column>
                    <View>
                        <Alert type={'warning'} description={'无障碍辅助未开启'}></Alert>
                    </View>
                    <View mt12 rowVCenter>
                        <Button
                            size={'small'}
                            type={'primary'}
                            onClick={async () => {
                                await agent.jsonrpcApp('onStartInput');
                            }}
                        >
                            打开无障碍
                        </Button>
                    </View>
                </View>
                {agentAppInfo.inputIsReady && (
                    <InspectView
                        {...{
                            agent,
                            onSelect,
                            treeData,
                            selectedKey,
                            expandedKeys,
                            selectedNode,
                            setInspect: () => {},
                            currentClickPoint,
                            setExpandedKeys
                        }}
                    ></InspectView>
                )}
                <View hide={!nodeError} abs bottom={0} xx0 w={'50%'} h={44} red>
                    <Alert type={'error'} description={nodeError}></Alert>
                </View>
            </View>

            <Drawer
                width={'360px'}
                title={'Settings'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    showSettingDawer(false);
                }}
                open={settingDrawer}
            >
                {settingDrawer && <MobileInfoView agent={agent} />}
            </Drawer>
        </View>
    );
}

export default AndroidDetailInner;
