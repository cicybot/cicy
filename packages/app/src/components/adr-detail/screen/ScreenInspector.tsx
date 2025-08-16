import View from '../../View';
import { AdrUtils } from '../../../services/common/AdrUtils';
import { sleep, useTimeoutLoop } from '@cicy/utils';
import { useCallback, useEffect, useState } from 'react';
import { TreeDataNode, TreeProps } from 'antd';
import { InspectView } from '../InspectView';
import { convertXmlToTreeData, getExpandKeys, parseBounds, Rect, XmlNode } from './utils';
import { AdrDeviceInfo, AdrDeviceModel } from '../../../services/model/AdrDeviceModel';
import { AdbUtilsCache } from './Screen';
import Loading from '../../UI/Loading';

let nodeBoundsMap_: Record<string, Rect>, nodesMap_: Record<string, XmlNode>;
const ScreenInspector = ({ device }: { device: AdrDeviceInfo }) => {
    const adrUtils = new AdrUtils(true);
    adrUtils.setDevice(device);
    const id = device.id;
    const [nodesMap, setNodesMap] = useState<Record<string, XmlNode>>({});
    const [nodeBoundsMap, setNodeBoundsMap] = useState<Record<string, Rect>>({});
    nodeBoundsMap_ = nodeBoundsMap;
    nodesMap_ = nodesMap;
    const [expandedKeys, setExpandedKeys] = useState<string[]>(['0']);
    const [selectedKey, setSelectedKey] = useState<string[]>([]);

    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<null | any>(null);
    const onClickNode = async ({ x, y }: { x: number; y: number }) => {
        const adrUtils = AdbUtilsCache.get(AdrDeviceModel.getForwardPortById(id));
        if (!adrUtils) {
            return {};
        }
        const { width, height } = adrUtils.getScreenInfo();
        const rect = {
            x,
            y,
            width,
            height
        };
        await adrUtils._mousedown(rect);
        await sleep(200);
        await adrUtils._mouseup(rect);
        setSelectedKey([]);
        setSelectedNode(null);
        hideInspector();
    };
    useTimeoutLoop(async () => {
        const { result } = await adrUtils.dumpWindowHierarchy();
        // console.debug(result);
        const { treeData, nodesMap, nodeBoundsMap } = await convertXmlToTreeData(result);
        // console.log('nodesMap', nodesMap);
        setTreeData(treeData);
        setNodesMap(nodesMap);
        setNodeBoundsMap(nodeBoundsMap);
        if (!expandedKeys) {
            //@ts-ignore
            setExpandedKeys(['0', ...treeData![0].children!.map(row => row.key)]);
        }
    }, 1000);
    const [currentClickPoint, setCurrentClickPoint] = useState<{
        x: number;
        y: number;
    }>({
        x: 0,
        y: 0
    });

    // 计算高亮框的位置和尺寸
    const calculateHighlightStyle: any = (selectedNode: any) => {
        const port = AdrDeviceModel.getForwardPortById(id);
        const adrUtils = AdbUtilsCache.get(port);
        if (!adrUtils) {
            return {};
        }
        const screenInfo = adrUtils.getScreenInfo();
        const screenImg = document.getElementById(`screenImg_${id}`);
        if (!selectedNode || !selectedNode.bounds || !screenImg || !screenInfo) {
            return { display: 'none' };
        }

        const bounds = parseBounds(selectedNode.bounds);
        if (!bounds) return { display: 'none' };

        const imgRect = screenImg.getBoundingClientRect();
        const scale = imgRect.width / screenInfo.width;

        const width = (bounds.right - bounds.left) * scale;
        const height = (bounds.bottom - bounds.top) * scale;

        return {
            display: 'block',
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
    function hideInspector() {
        const inspect_node = document.getElementById(`inspect_node_${id}`) as HTMLDivElement;
        if (inspect_node) {
            inspect_node.style.display = 'none';
        }
    }
    const onAction = useCallback(
        (e: any) => {
            const { pageX, pageY, originScreenWidth } = e.detail;

            const img = document.getElementById(`screenImg_${id}`) as HTMLImageElement;
            const rect = img!.getBoundingClientRect();
            const scale = rect.width / originScreenWidth;

            const screenX = Math.round((pageX - rect.left) / scale);
            const screenY = Math.round((pageY - rect.top) / scale);

            // 查找所有包含点击位置的节点
            const candidates: { key: string; area: number }[] = [];

            for (const key of Object.keys(nodesMap_)) {
                const bounds = nodeBoundsMap_[key];
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
            const topNode = nodesMap_[topNodeKey];
            const inspect_node = document.getElementById(`inspect_node_${id}`) as HTMLDivElement;

            if (topNode) {
                setSelectedNode(topNode);
                setSelectedKey([topNodeKey]);
                setExpandedKeys(getExpandKeys(topNodeKey));
                console.log('找到节点:', topNode);
                setCurrentClickPoint({
                    x: screenX,
                    y: screenY
                });
                if (inspect_node) {
                    const style = calculateHighlightStyle(topNode);
                    // Apply each style property individually
                    Object.assign(inspect_node.style, style);
                }
            } else {
                setSelectedNode(null);
                setSelectedKey([]);
                setCurrentClickPoint({ x: 0, y: 0 });
                console.log('未找到有效节点');
                Object.assign(inspect_node.style, { display: 'none' });
            }
        },
        [nodesMap]
    );

    useEffect(() => {
        window.addEventListener('onScreenMouseDown', onAction);
        return () => window.removeEventListener('onScreenMouseDown', onAction);
    }, []);

    const onSelect: TreeProps['onSelect'] = selectedKeys => {
        console.log('onSelect', selectedKeys);
        setSelectedKey(selectedKeys as string[]);
        const node = nodesMap![selectedKeys[0] as string];
        const { bounds } = node;
        const { left, right, top, bottom } = parseBounds(bounds)!;

        setCurrentClickPoint({
            x: left + (right - left) / 2,
            y: top + (bottom - top) / 2
        });
        setSelectedNode(node);

        const inspect_node = document.getElementById(`inspect_node_${id}`) as HTMLDivElement;
        if (inspect_node) {
            const style = calculateHighlightStyle(node);
            Object.assign(inspect_node.style, style);
        }
    };
    if (treeData.length === 0) {
        return (
            <View absFull center>
                <Loading />
            </View>
        );
    }
    return (
        <View absFull overflowHidden bgColor={'white'}>
            <InspectView
                {...{
                    onClickNode,
                    setSelectedKey,
                    setSelectedNode,
                    onSelect,
                    treeData,
                    selectedKey,
                    expandedKeys,
                    selectedNode,
                    currentClickPoint,
                    setExpandedKeys
                }}
            ></InspectView>
        </View>
    );
};
export default ScreenInspector;
