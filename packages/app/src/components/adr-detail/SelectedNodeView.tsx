import { ProDescriptions, ProField } from '@ant-design/pro-components';
import type { TabsProps } from 'antd';
import { Button, Tabs } from 'antd';
import View from '../View';

import styled from 'styled-components';

const StyledTabs = styled(Tabs)`
    .ant-tabs-content-holder {
        position: absolute;
        top: 54px;
        overflow-y: auto;
        left: 12px;
        right: 0;
        bottom: 8px;
    }
`;

export function SelectedNodeView(props: {
    selectedNode: any;
    onClickNode: any;
    currentClickPoint: any;
}) {
    const { selectedNode, onClickNode, currentClickPoint } = props;
    const keysFilter = [
        'nodeKey',
        'clickable',
        'text',
        'resource-id',
        'class',
        'package',
        'content-desc',
        'selected'
    ];

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: '信息',
            children: (
                <ProDescriptions column={1}>
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
                <ProDescriptions column={2}>
                    {Object.keys(selectedNode)
                        .filter(key => ![...keysFilter, 'bounds'].includes(key))
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
            key: '3',
            label: '尺寸',
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
                    {Object.keys(selectedNode)
                        .filter(key => ['bounds'].includes(key))
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
    return <StyledTabs defaultActiveKey="1" items={items} onChange={() => {}} />;
}
