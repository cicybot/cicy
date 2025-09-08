import { WebviewTag } from 'electron';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import { useEffect, useState } from 'react';
import View from '../../../../components/View';
import MediaCards from './MediaCards';
import TelegramWebviewService from '../../../../services/common/TelegramWebviewService';
import { BackgroundApi } from '../../../../services/common/BackgroundApi';

const TgSide = ({ webview }: { webview: WebviewTag }) => {
    const [messages, setMessages] = useState<Record<number, any>>({});
    const [chats, setChats] = useState<{ id: number; username: string; title: string }[]>([]);
    const service = new TelegramWebviewService(webview);
    const [downloadItems, setDownloadItems] = useLocalStorageState<any[]>('downloadItems', []);
    const [downloadIds, setDownloadIds] = useLocalStorageState<Record<number, string>>(
        'downloadIds',
        {}
    );
    const [info, setInfo] = useState<{ version: string; downloaderInited: boolean } | any>(null);
    useTimeoutLoop(async () => {
        try {
            const downloadItemRows = await new BackgroundApi().getDownloadState(
                downloadItems,
                downloadIds
            );

            setDownloadItems(downloadItemRows);
            const data = await service.getData();

            if (data) {
                setInfo({
                    version: data.version,
                    downloaderInited: data.downloaderInited
                });
                const { messageMirrors, downloadIds, chats } = data;
                setChats(chats);
                setDownloadIds(downloadIds);
                setMessages((await service.handleDocumentMediaMessages(messageMirrors)) as any);
            }
        } catch (e) {
            console.error(e);
        }
    }, 1000);

    return (
        <View absFull>
            <MediaCards
                downloadIds={downloadIds}
                info={info}
                downloadItems={downloadItems}
                setMessages={(m: any) => setMessages(m)}
                chats={chats}
                webview={webview}
                messages={messages}
            ></MediaCards>
        </View>
    );
};
export default TgSide;
