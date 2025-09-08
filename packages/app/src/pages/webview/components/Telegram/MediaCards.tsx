import { ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import React, { useState } from 'react';
import { View } from '../../../../index';
import { WebviewTag } from 'electron';

import { formatDateYYYYMMDD, formatDuration, formatSize } from '../../../../utils/utils';
import { Button, message, Tag } from 'antd';
import TelegramWebviewService from '../../../../services/common/TelegramWebviewService';
import VideoThumb from './VideoThumb';
import IconText from './IconText';
import { sleep, useLocalStorageState } from '@cicy/utils';
import DrawerButton from '../../../../components/DrawerButton';
import DownloadInfo from './DownloadInfo';

export interface ListType {
    messageRaw: any;
    downloadItem?: any;
    title: string;
    date: number;
    mid: number;
    media: any;
    mime_type: string;
    messageId: number;
    peerId: number;
    message: string;
    thumbs: any[];
    w: number;
    h: number;
    id: number;
    size: number;
    duration: number;
}

export default ({
    messages,
    info,
    downloadIds,
    downloadItems,
    chats,
    webview,
    setMessages
}: {
    downloadIds: Record<number, string>;
    info: { version: string } | null;
    downloadItems: any;
    setMessages: (messages: any) => void;
    chats: { id: number; username: string; title: string }[];
    webview: WebviewTag;
    messages: Record<number, any>;
}) => {
    const filterDownloadItems = (rows: any, type: 'completed' | 'progressing' | 'no-download') => {
        return rows.filter((row: { state: string }) => {
            if (type === 'no-download') {
                return row.state !== 'completed' && row.state !== 'progressing';
            } else {
                return row.state === type;
            }
        });
    };
    const [filterType, setFilterType] = useLocalStorageState<'all' | 'downloading' | 'downloaded'>(
        'filterType',
        'all'
    );
    const rows = Object.keys(messages)
        .map(key => {
            if (!messages[parseInt(key)]) {
                return null;
            }
            const messageRaw = messages[parseInt(key)];
            const { date, peerId, id: messageId, message, mid, media } = messageRaw;
            const { _, document } = media;
            if (!document) {
                return null;
            }
            const { file_name, supportsStreaming, size, id, w, h, thumbs, duration, mime_type } =
                document;

            if (mime_type !== 'video/mp4') {
                return null;
            }
            const downloadItem = downloadItems.find((row: any) => row.mediaId === id);

            const row = {
                messageRaw,
                mime_type,
                downloadItem,
                title: file_name.replace('.mp4', ''),
                supportsStreaming,
                size,
                id,
                messageId,
                peerId,
                w,
                h,
                thumbs,
                duration,
                date,
                media,
                message,
                mid
            };
            switch (filterType) {
                case 'downloading': {
                    if (downloadItem && downloadItem.state === 'progressing') {
                        return row;
                    }
                    return null;
                }

                case 'downloaded': {
                    if (downloadItem && downloadItem.state === 'completed') {
                        return row;
                    }
                    return null;
                }
                default: {
                    return row;
                }
            }
        })
        .filter(row => !!row);
    rows.sort((b: any, a: any) => a.date - b.date);
    const dataSource = rows as ListType[];
    const renderList = (
        type: 'description' | 'actions' | 'extra' | 'content' | 'title',
        record: ListType
    ) => {
        const date = formatDateYYYYMMDD(record.date);
        const time = new Date(record.date * 1000).toLocaleTimeString();

        const { messageRaw, messageId, mid, downloadItem, title, size, duration, media, peerId } =
            record;
        const chatId = Math.abs(peerId);
        const chat = chats.find(row => row.id === chatId);
        const chatUsername = chat ? chat['username'] : null;
        const chatTitle = chat ? chat['title'] : null;
        let tgaddr = chatUsername
            ? `tg://resolve?domain=${chatUsername}&post=${messageId}`
            : `tg://privatepost?channel=${chatId}&post=${messageId}`;
        const m = record.message.split('\n')[0];

        switch (type) {
            case 'title': {
                return <View pl12>{title}</View>;
            }
            case 'content': {
                return <View ml={-21}>{m}</View>;
            }
            case 'description': {
                return (
                    <View pl12 rowVCenter>
                        <View mr12 hide={!downloadItem}>
                            <DrawerButton buttonType={'primary'} title={'保存'}>
                                <DownloadInfo
                                    content={m}
                                    webview={webview}
                                    record={record}
                                    downloadItem={downloadItem}
                                ></DownloadInfo>
                            </DrawerButton>
                        </View>

                        <View rowVCenter>
                            <DrawerButton title={'Message'}>
                                <View json={messageRaw}></View>
                            </DrawerButton>
                        </View>
                    </View>
                );
            }

            case 'actions': {
                return [
                    <IconText icon={ClockCircleOutlined} text={date + ' ' + time} key="time" />
                ];
            }
            case 'extra': {
                return (
                    <View>
                        <VideoThumb webview={webview} record={record} />

                        <View rowVCenter mt12>
                            <IconText
                                onClick={async () => {
                                    const onClick = chatUsername ? 'tg_resolve' : 'tg_privatepost';
                                    await webview.executeJavaScript(`
                                        (()=>{
                                            const ele = document.querySelector('.media-viewer-topbar-left .btn-icon ');
                                            if(ele){
                                                ele.click()
                                            }
                                            const a = document.createElement('a');
                                            a.href = "${tgaddr}";
                                            window["${onClick}"](a);
                                        })()
                                    `);
                                }}
                                icon={ClockCircleOutlined}
                                text={(chatUsername || chatTitle) + '/' + messageId}
                                key="location"
                            />
                        </View>

                        {Boolean(downloadItem && downloadItem.state === 'completed') && (
                            <View rowVCenter ml12>
                                <View mr12>
                                    <Tag color={'green'}>已下载</Tag>
                                </View>
                            </View>
                        )}
                        {Boolean(downloadItem && downloadItem.state === 'progressing') && (
                            <View column ml12>
                                <View rowVCenter>
                                    <View mr12>
                                        <Tag color={'yellow'}>正在下载</Tag>
                                    </View>
                                    <View>
                                        {downloadItem.percent} % -{' '}
                                        {formatSize(downloadItem.bytesPerSecond)} / s
                                    </View>
                                </View>
                            </View>
                        )}

                        <View rowVCenter hide={downloadItem}>
                            <IconText
                                onClick={async () => {
                                    const service = new TelegramWebviewService(webview);
                                    const info = await service.getInfo();
                                    const mediaStr = JSON.stringify(media.document);
                                    if (info.downloaderInited) {
                                        await webview.executeJavaScript(`
                                         window.__downloadMedia(${mediaStr})
                                        `);
                                        return;
                                    }
                                    const res = await webview.executeJavaScript(`
                                    (async ()=>{
                                       const ele = document.querySelector('.media-viewer-topbar-left .btn-icon ');
                                       if(ele) ele.click()
                                       const specificDiv = document.querySelector('div[data-mid="${mid}"]');
                                       if(specificDiv){
                                          const ele = specificDiv.querySelector(".media-container")
                                          const rect = ele.getBoundingClientRect();
                                            return JSON.stringify({
                                                center:{
                                                    top:rect.top + rect.height/2,
                                                    left:rect.left + rect.width/2,
                                                }
                                            })
                                       }else{
                                        return null
                                       }
                                    })()
                                    `);
                                    if (res) {
                                        const rect = JSON.parse(res);
                                        const event = {
                                            button: 'left',
                                            clickCount: 1,
                                            type: 'mouseDown',
                                            x: rect.center.left,
                                            y: rect.center.top
                                        } as any;
                                        await webview.sendInputEvent(event);
                                        await sleep(400);
                                        await webview.sendInputEvent({
                                            ...event,
                                            type: 'mouseUp'
                                        });
                                        await sleep(400);
                                        const downloadBtnRes = await webview.executeJavaScript(`
                                            (async()=>{
                                                const ele = document.querySelector('.btn-icon.quality-download-options-button-menu ');
                                                if(ele){
                                                  const rect = ele.getBoundingClientRect();
                                                    return JSON.stringify({
                                                        center:{
                                                            top:rect.top + rect.height/2,
                                                            left:rect.left + rect.width/2,
                                                        }
                                                    })
                                               }else{
                                                return null
                                               }
                                            
                                            })()
                                        `);
                                        if (!downloadBtnRes) {
                                            message.error('没有找到下载按钮');
                                        } else {
                                            const downloadBtnRect = JSON.parse(downloadBtnRes);
                                            const event = {
                                                button: 'left',
                                                clickCount: 1,
                                                type: 'mouseDown',
                                                x: downloadBtnRect.center.left,
                                                y: downloadBtnRect.center.top
                                            } as any;
                                            await webview.sendInputEvent(event);
                                            await sleep(400);
                                            await webview.sendInputEvent({
                                                ...event,
                                                type: 'mouseUp'
                                            });
                                        }
                                    } else {
                                        message.error('没有找到消息');
                                    }
                                }}
                                icon={DownloadOutlined}
                                text={'下载'}
                                key="download"
                            />
                        </View>

                        <View pl12>
                            {formatSize(size)} - {formatDuration(duration)}
                        </View>
                    </View>
                );
            }
        }
    };
    const height = 88;
    return (
        <View absFull>
            <View abs xx0 top0 h={height} column>
                <View rowVCenter px12 mb12 mt12>
                    <Button
                        onClick={async () => {
                            webview.openDevTools();
                        }}
                    >
                        openDevTools
                    </Button>
                    <View ml12>
                        <Button
                            onClick={async () => {
                                await new TelegramWebviewService(webview).getInfo();
                            }}
                        >
                            HookIndexJs({info ? info.version : '-'})
                        </Button>
                    </View>
                    <View ml12>
                        <DrawerButton title={'Chats'}>
                            <View json={info}></View>
                            <View json={chats}></View>
                        </DrawerButton>
                    </View>
                    <View ml12>
                        <DrawerButton title={'Download'}>
                            <View json={downloadIds}></View>
                            <View json={downloadItems}></View>
                        </DrawerButton>
                    </View>
                </View>
                <View rowVCenter px12>
                    <View>
                        <Button
                            size={'small'}
                            type={filterType === 'all' ? 'primary' : undefined}
                            onClick={async () => {
                                setFilterType('all');
                            }}
                        >
                            所有
                        </Button>
                    </View>
                    <View ml12>
                        <Button
                            size={'small'}
                            type={filterType === 'downloading' ? 'primary' : undefined}
                            onClick={async () => {
                                setFilterType('downloading');
                            }}
                        >
                            正在下载
                        </Button>
                    </View>
                    <View ml12>
                        <Button
                            size={'small'}
                            type={filterType === 'downloaded' ? 'primary' : undefined}
                            onClick={async () => {
                                setFilterType('downloaded');
                            }}
                        >
                            下载完成
                        </Button>
                    </View>
                </View>
            </View>
            <View absFull top={height} overflowYAuto borderBox p12>
                <ProList<ListType>
                    itemLayout="vertical"
                    rowKey="mid"
                    headerTitle=""
                    dataSource={dataSource}
                    metas={{
                        title: {
                            render: (_: any, b: ListType) => renderList('title', b)
                        },
                        description: {
                            render: (_: any, b: ListType) => renderList('description', b)
                        },
                        actions: {
                            render: (_: any, b: ListType) => renderList('actions', b)
                        },
                        extra: {
                            render: (_: any, b: ListType) => renderList('extra', b)
                        },
                        content: {
                            render: (_: any, b: ListType) => renderList('content', b)
                        }
                    }}
                />
            </View>
        </View>
    );
};
