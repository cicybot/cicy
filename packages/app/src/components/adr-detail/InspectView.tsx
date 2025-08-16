import { Tree } from 'antd';
import View from '../View';
import { SelectedNodeView } from './SelectedNodeView';
import { DownOutlined } from '@ant-design/icons';
import { CloseOutline } from 'antd-mobile-icons';

export const InspectView = ({
    onSelect,
    treeData,
    selectedKey,
    expandedKeys,
    selectedNode,
    currentClickPoint,
    setExpandedKeys,
    setSelectedNode,
    setSelectedKey,
    onClickNode
}: {
    setSelectedNode: any;
    treeData: any;
    setSelectedKey: any;
    onSelect: any;
    selectedKey: any;
    expandedKeys: any;
    onClickNode: any;
    selectedNode: any;
    currentClickPoint: any;
    setExpandedKeys: any;
}) => {
    return (
        <View relative wh100p>
            <View abs bottom={selectedNode ? 360 : 0} xx0 top={12} overflowYAuto>
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

            <View abs pl12 borderBox bottom={0} xx0 h={selectedNode ? 360 : 0}>
                <View h={1} abs top0 left={0} right={0} bgColor={'#e9e9e9'}></View>
                <View
                    abs
                    top={12}
                    right={12}
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
                        currentClickPoint={currentClickPoint}
                        onClickNode={onClickNode}
                        selectedNode={selectedNode}
                    ></SelectedNodeView>
                ) : null}
            </View>
        </View>
    );
};
