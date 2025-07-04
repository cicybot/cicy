import { Button, Tree } from 'antd';
import View from '../../../components/View';
import { Bubble } from '@ant-design/x';
import SuggestionView from './SuggestionView';
import PromptsView from './PromptsView';
import { Welcome } from '@ant-design/x';
import MessagesView from './MessagesView';
import { ViewWithSize } from '../../../components/View/ViewWithSize';
import { useState } from 'react';

export const AiView = () => {
    const height = 72;
    const [messageListHeigth, setMessageListHeigth] = useState(0);
    const onChangeSize = (size:{height:number})=>{
        setMessageListHeigth(size.height);
    }
    return (
        <View relative wh100p borderBox pl12>
            <View abs xx0 top={32} bottom={height + 12} overflowHidden borderBox pr={32}>
                <ViewWithSize onChangeSize={onChangeSize} absFull right={24}>
                    <MessagesView height={messageListHeigth}></MessagesView>
                </ViewWithSize>
                <View wh100p aStart column jSpaceBetween hide>
                    <View mr={36} ml={12}>
                        <Welcome
                        icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                        title="Hello, I'm Ant Design X"
                        description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
                    />
                    </View>
                    <PromptsView></PromptsView>
                </View>
            </View>
            <View abs bottom0 xx0 h={height} borderBox pr={32}>
                <SuggestionView></SuggestionView>
            </View>
        </View>
    );
};
