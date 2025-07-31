import View from '../../View';
import { NavBar } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { AdrUtils } from '../../../services/common/AdrUtils';
import { useTimeoutLoop } from '@cicy/utils';
import CCAndroidConnectorClient from '../../../services/cicy/CCAndroidConnectorClient';
import { AdrDeviceInfo } from '../../../services/model/AdrDeviceModel';
import { useEffect, useState } from 'react';
import {
    convertXmlToTreeData,
    getExpandKeys,
    parseBounds,
    Rect,
    XmlNode
} from '../../../pages/android/utils';
import { message, TreeDataNode, TreeProps } from 'antd';
import { getScreenInfo } from './Screen';
import { InspectView } from '../InspectView';

const ScreenInspector = ({ id }: { id: number }) => {
    const adrUtils = new AdrUtils(true);
    const [nodesMap, setNodesMap] = useState<Record<string, XmlNode>>({});
    const [nodeBoundsMap, setNodeBoundsMap] = useState<Record<string, Rect>>({});
    const [expandedKeys, setExpandedKeys] = useState<string[]>(['0']);
    const [selectedKey, setSelectedKey] = useState<string[]>([]);

    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<null | any>(null);

    useTimeoutLoop(async () => {
        const { result } = await adrUtils.dumpWindowHierarchy(id);
        console.log(result);
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
    const [currentClickPoint, setCurrentClickPoint] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0
    });

    // 计算高亮框的位置和尺寸
    const calculateHighlightStyle: any = () => {
        const screenInfo = getScreenInfo();
        const screenImg = document.getElementById('screenImg');
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
    //
    // function onClickImage(e: React.MouseEvent<HTMLDivElement>) {
    //     const img = imgRef.current;
    //     if (!img) return;
    //     const { pageX, pageY } = e;
    //
    //     // 获取图片位置和尺寸
    //     const rect = img.getBoundingClientRect();
    //     const scale = rect.width / originScreenWidth;
    //
    //     // 计算点击位置在原始屏幕上的坐标
    //     const screenX = Math.round((pageX - rect.left) / scale);
    //     const screenY = Math.round((pageY - rect.top) / scale);
    //
    //     if (!isInspect) {
    //         if (!agent.inputIsReady()) {
    //             message.error('没有开启无障碍辅助');
    //         } else {
    //             agent.click(screenX, screenY);
    //         }
    //
    //         return;
    //     }
    //
    //     // 查找所有包含点击位置的节点
    //     const candidates: { key: string; area: number }[] = [];
    //
    //     for (const key of Object.keys(nodesMap)) {
    //         const bounds = nodeBoundsMap[key];
    //         if (!bounds) continue;
    //
    //         // 检查点击是否在边界内
    //         if (
    //             screenX >= bounds.left &&
    //             screenX <= bounds.right &&
    //             screenY >= bounds.top &&
    //             screenY <= bounds.bottom
    //         ) {
    //             // 计算节点面积
    //             const width = bounds.right - bounds.left;
    //             const height = bounds.bottom - bounds.top;
    //             const area = width * height;
    //             candidates.push({ key, area });
    //         }
    //     }
    //
    //     // 如果没有找到任何节点
    //     if (candidates.length === 0) {
    //         console.log('未找到节点');
    //         setSelectedNode(null);
    //         setSelectedKey([]);
    //         return;
    //     }
    //
    //     // 按面积从小到大排序（面积最小的节点在最前面）
    //     candidates.sort((a, b) => a.area - b.area);
    //
    //     // 选择面积最小的节点作为最上层节点
    //     const topNodeKey = candidates[0].key;
    //     const topNode = nodesMap[topNodeKey];
    //
    //     if (topNode) {
    //         setSelectedNode(topNode);
    //         setSelectedKey([topNodeKey]);
    //         setExpandedKeys(getExpandKeys(topNodeKey));
    //         console.log('找到节点:', topNode);
    //         setCurrentClickPoint({ x: screenX, y: screenY });
    //     } else {
    //         setSelectedNode(null);
    //         setSelectedKey([]);
    //         setCurrentClickPoint({ x: 0, y: 0 });
    //         console.log('未找到有效节点');
    //     }
    // }
    const onSelect: TreeProps['onSelect'] = selectedKeys => {
        console.log('onSelect', selectedKeys);
        setSelectedKey(selectedKeys as string[]);
        const node = nodesMap![selectedKeys[0] as string];
        const { bounds } = node;
        const { left, right, top, bottom } = parseBounds(bounds)!;
        setCurrentClickPoint({ x: left + (right - left) / 2, y: top + (bottom - top) / 2 });
        setSelectedNode(node);

        const inspect_node = document.getElementById('inspect_node') as HTMLDivElement;
        if (inspect_node) {
            const style = calculateHighlightStyle();
            // Apply each style property individually
            Object.assign(inspect_node.style, style);
        }
    };

    return (
        <View wh100p>
            <InspectView
                {...{
                    setSelectedKey,
                    setSelectedNode,
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
        </View>
    );
};
export default ScreenInspector;
