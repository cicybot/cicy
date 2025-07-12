import View from '../View';
import { Welcome } from '@ant-design/x';
import SuggestionView from './SuggestionView';
import MessagesView, { AiMsgItem } from './MessagesView';
import { ViewWithSize } from '../View/ViewWithSize';
import { useState } from 'react';

export const AiView = () => {
    const height = 72;
    const [messageListHeight, setMessageListHeight] = useState(0);
    const onChangeSize = (size: { height: number }) => {
        setMessageListHeight(size.height);
    };

    const [msgList, setMsgList] = useState<AiMsgItem[]>([]);
    const setMsg = (msg: AiMsgItem) => {
        setMsgList([...msgList, msg]);
    };
    console.log(msgList.length, messageListHeight);
    return (
        <View relative wh100p borderBox>
            <View abs xx0 top={32} bottom={height + 12} overflowHidden borderBox>
                <ViewWithSize
                    onChangeSize={onChangeSize}
                    absFull
                    style={{ display: msgList.length > 0 ? undefined : 'none' }}
                >
                    <MessagesView msgList={msgList} height={messageListHeight}></MessagesView>
                </ViewWithSize>

                <View wh100p aStart column jSpaceBetween hide={msgList.length > 0}>
                    <View mr={12} ml={12}>
                        <Welcome
                            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                            title="Hello, I'm CiCy X"
                            description="AGI product interface solution, create a better intelligent vision~"
                        />
                    </View>
                    <View px={24}>{/*<PromptsView></PromptsView>*/}</View>
                </View>
            </View>
            <View abs bottom0 xx0 h={height} borderBox px12>
                <SuggestionView setMsg={setMsg}></SuggestionView>
            </View>
        </View>
    );
};
