import { Button, Tree } from 'antd';
import View from '../View';
import { SelectedNodeView } from './SelectedNodeView';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import CCAgentClient from '../../services/cicy/CCWSAgentClient';

export const InspectView = ({
    agent,
    setInspect,
    onSelect,
    treeData,
    selectedKey,
    expandedKeys,
    selectedNode,
    currentClickPoint,
    setExpandedKeys
}: {
    treeData: any;
    setInspect: any;
    agent: CCAgentClient;
    onSelect: any;
    selectedKey: any;
    expandedKeys: any;
    selectedNode: any;
    currentClickPoint: any;
    setExpandedKeys: any;
}) => {
    return (
        <View relative bgColor="white">
            <View hide zIdx={100} abs wh={44} top={12} right={6}>
                <Button
                    size="small"
                    onClick={() => {
                        setInspect(false);
                    }}
                    icon={<CloseOutlined />}
                ></Button>
            </View>
            <View
                w={'calc(100% - 320px)'}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'auto',
                    height: '100vh'
                }}
                column
                relative
            >
                <View abs top0 xx0 pl12 pt12>
                    调试节点：
                </View>
                <View
                    pt={48}
                    borderBox
                    style={{ width: '100%', overflow: 'auto', height: '100vh' }}
                >
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
            </View>

            <View
                abs
                style={{
                    width: '310px',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'auto'
                }}
            >
                <View pl12>
                    {selectedNode ? (
                        <SelectedNodeView
                            inputText={(text: string) => {
                                agent.inputText(text);
                            }}
                            currentClickPoint={currentClickPoint}
                            onClickNode={(point: { x: number; y: number }) => {
                                agent.click(point.x, point.y);
                            }}
                            selectedNode={selectedNode}
                        ></SelectedNodeView>
                    ) : null}
                </View>
            </View>
        </View>
    );
};
