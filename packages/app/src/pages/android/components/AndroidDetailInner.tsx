import { Drawer, TreeDataNode, TreeProps } from 'antd';
import { Button, message } from 'antd';
import {
    HomeOutlined,
    ArrowLeftOutlined,
    WindowsOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import View from '../../../components/View';

import {
    convertXmlToTreeData,
    getExpandKeys,
    parseBounds,
    type Rect,
    type XmlNode
} from './../utils';
import { Checkbox } from 'antd';
import Loading from '../../../components/UI/Loading';
import CCAgentClient, { DeviceInfo } from '../../../services/CCWSAgentClient';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import { InspectView } from './InspectView';
import { AiView } from './AiView';
import SiteDetail from '../../../components/Tables/SiteDetail';
import { MobileInfoView } from './MobileInfoView';

function AndroidDetailInner({ deviceInfo: deviceInfo_ }: { deviceInfo: DeviceInfo }) {
    const [img, setImg] = useState('');
    const [settingDrawer, showSettingDawer] = useState(false);
    const [autoScreen, setAutoScreen] = useLocalStorageState('autoScreen', false);
    const [isInspect, setInspect] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(deviceInfo_);
    const currentImageWidth = 300;
    const [originScreenWidth, originScreenHeight] = deviceInfo.size
        .split('x')
        .map(r => parseInt(r));
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
        if (!isInspect) {
            return;
        }
        if (selectedNode && !nodesMap[selectedNode.nodeKey]) {
            setSelectedNode(null);
        }
    }, [selectedNode, nodesMap, isInspect]);
    const agent = new CCAgentClient(deviceInfo.clientId);
    agent.setDeviceInfo(deviceInfo);
    const fetchDeviceInfo = () =>
        agent.getDeviceInfo().then(res => {
            setDeviceInfo(res);
            return res;
        });

    const getScreenImage = async () => {
        const { imgData, hierarchy } = await agent.getScreen();
        setImg(imgData);
        if (hierarchy && hierarchy.startsWith('<error')) {
            message.error(hierarchy);
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
            if (agent.isNotRootAndNoAccessibilityEnabled()) {
                message.error('非root设置没有开启无障碍辅助');
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

    const onChange = (key: string) => {
        setInspect(key === 'inspect');
        console.log('onChange tab', key);
    };
    const keysFilter = [
        'nodeKey',
        'clickable',
        'text',
        'resource-id',
        'class',
        'package',
        'content-desc',
        'bounds',
        'selected'
    ];

    return (
        <View style={{ position: 'fixed', top: 0, left: 0, display: 'flex', flexDirection: 'row' }}>
            <View pl12 pr12 w={currentImageWidth + 32} relative>
                <View w={32} abs right={0} top={44} aCenter column>
                    <Button
                        icon={<HomeOutlined></HomeOutlined>}
                        size="small"
                        onClick={() => {
                            if (agent.isNotRootAndNoAccessibilityEnabled()) {
                                message.error('非root设置没有开启无障碍辅助');
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
                            if (agent.isNotRootAndNoAccessibilityEnabled()) {
                                message.error('非root设置没有开启无障碍辅助');
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
                            if (agent.isNotRootAndNoAccessibilityEnabled()) {
                                message.error('非root设置没有开启无障碍辅助');
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
                    <Checkbox
                        style={{ marginLeft: 12 }}
                        checked={isInspect}
                        onChange={e => {
                            if (e.target.checked) {
                                if (!agent.isAccessibilityEnabled()) {
                                    message.error('请先打开无障碍服务');
                                    return;
                                }
                            }
                            setInspect(e.target.checked);
                        }}
                    >
                        调试节点
                    </Checkbox>
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
                <View hide={isInspect} wh100p>
                    <AiView></AiView>
                </View>
                {isInspect && (
                    <InspectView
                        {...{
                            agent,
                            onSelect,
                            treeData,
                            selectedKey,
                            expandedKeys,
                            selectedNode,
                            setInspect,
                            currentClickPoint,
                            setExpandedKeys
                        }}
                    ></InspectView>
                )}
            </View>

            <Drawer
                width={'50%'}
                title={'Settings'}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => {
                    showSettingDawer(false);
                }}
                open={settingDrawer}
            >
                {settingDrawer && <MobileInfoView deviceInfo={deviceInfo} />}
            </Drawer>
        </View>
    );
}

export default AndroidDetailInner;
