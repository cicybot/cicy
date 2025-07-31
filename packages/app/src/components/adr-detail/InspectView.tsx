import { Button, Tree } from 'antd';
import View from '../View';
import { SelectedNodeView } from './SelectedNodeView';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';
import { CloseOutline } from 'antd-mobile-icons';

export const InspectView = ({
    setInspect,
    onSelect,
    treeData,
    selectedKey,
    expandedKeys,
    selectedNode,
    currentClickPoint,
    setExpandedKeys,
    setSelectedNode,
    setSelectedKey
}: {
    setSelectedNode: any;
    treeData: any;
    setSelectedKey: any;
    setInspect: any;
    onSelect: any;
    selectedKey: any;
    expandedKeys: any;
    selectedNode: any;
    currentClickPoint: any;
    setExpandedKeys: any;
}) => {
    return (
        <View relative wh100p>
            <View abs top0 xx0 pl12 pt12 h={22}>
                调试节点：
            </View>

            <View abs bottom={selectedNode ? 360 : 0} xx0 top={44} overflowYAuto>
                <Tree
                    showLine
                    switcherIcon={<DownOutlined />}
                    defaultExpandedKeys={['0']}
                    onSelect={onSelect}
                    treeData={treeData}
                    selectedKeys={selectedKey}
                    expandedKeys={expandedKeys}
                    onExpand={keys => {
                        console.log('onExpand', keys);
                        setExpandedKeys(keys as string[]);
                    }}
                />
            </View>

            <View abs bottom={0} xx0 h={selectedNode ? 360 : 0}>
                <View
                    abs
                    top={12}
                    right={4}
                    zIdx={1000000}
                    pointer
                    onClick={() => {
                        setSelectedNode(null);
                        setSelectedKey([]);
                    }}
                >
                    <CloseOutline fontSize={14}></CloseOutline>
                </View>

                {selectedNode ? (
                    <SelectedNodeView
                        inputText={(text: string) => {
                            // agent.inputText(text);
                        }}
                        currentClickPoint={currentClickPoint}
                        onClickNode={(point: { x: number; y: number }) => {
                            // agent.click(point.x, point.y);
                        }}
                        selectedNode={selectedNode}
                    ></SelectedNodeView>
                ) : null}
            </View>
        </View>
    );
};
