import { ProDescriptions, ProField } from '@ant-design/pro-components';
import type { TabsProps } from 'antd';
import { Button, Input, Tabs } from 'antd';
import View from '../../../components/View';

export function SelectedNodeView(props: {
    inputText: any;
    selectedNode: any;
    onClickNode: any;
    currentClickPoint: any;
}) {
    const { selectedNode, onClickNode, inputText, currentClickPoint } = props;
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
    const onChange = (key: string) => {
        console.log('onChange tab', key);
    };
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '信息',
            children: (
                <ProDescriptions column={1}>
                    <View>
                        <Button
                            size="small"
                            onClick={() => {
                                onClickNode(currentClickPoint);
                            }}
                        >
                            点击: {currentClickPoint.x} / {currentClickPoint.y}
                        </Button>
                    </View>
                    <View rowVCenter>
                        <Button
                            size="small"
                            onClick={() => {
                                //@ts-ignore
                                inputText(document.querySelector('#text')?.value! as string);
                            }}
                        >
                            输入
                        </Button>
                        <Input
                            style={{ marginLeft: 12, width: 120 }}
                            size="small"
                            type="text"
                            id="text"
                        />
                    </View>
                    {Object.keys(selectedNode)
                        .filter(key => keysFilter.includes(key))
                        .map(key => {
                            return (
                                <ProDescriptions.Item key={key} label={key}>
                                    <ProField text={selectedNode[key]} mode="read" />
                                </ProDescriptions.Item>
                            );
                        })}
                </ProDescriptions>
            )
        },
        {
            key: '2',
            label: '其他',
            children: (
                <ProDescriptions column={1}>
                    {Object.keys(selectedNode)
                        .filter(key => !keysFilter.includes(key))
                        .map(key => {
                            return (
                                <ProDescriptions.Item key={key} label={key}>
                                    <ProField text={selectedNode[key]} mode="read" />
                                </ProDescriptions.Item>
                            );
                        })}
                </ProDescriptions>
            )
        }
    ];
    return <Tabs defaultActiveKey="1" items={items} onChange={onChange} />;
}
