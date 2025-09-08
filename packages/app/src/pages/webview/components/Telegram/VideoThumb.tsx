import React, { useEffect, useState } from 'react';
import { View } from '../../../../index';
import { WebviewTag } from 'electron';
import { VideoCameraOutlined } from '@ant-design/icons';

import { hideLoading, showLoading } from '../../../../utils/utils';
import { ListType } from './MediaCards';
import TelegramWebviewService from '../../../../services/common/TelegramWebviewService';
export interface PhotoStrippedSize {
    _: string;
    type: string;
    bytes: number[];
}
const VideoThumb = ({
    width,
    webview,
    record,
    height
}: {
    height?: number;
    width?: number | string;
    webview: WebviewTag;
    record: ListType;
}) => {
    const { thumbs, id, w, h, size, duration } = record;
    const [thumbImg, setThumbImg] = useState<string | null>(null);

    const onGetThumb = async (ignoreLoading?: boolean) => {
        try {
            if (!ignoreLoading) {
                showLoading();
            }

            const url = await new TelegramWebviewService(webview).getCachedFile(
                id,
                'document',
                'm'
            );

            if (url) {
                setThumbImg(url);
            } else {
            }
        } catch (e) {}
        hideLoading();
    };
    useEffect(() => {
        onGetThumb(true).catch(console.error);
    }, []);

    return (
        <View bgColor={'black'} w={width || 272} h={height || 154} center>
            {thumbImg ? (
                <img
                    onClick={() => onGetThumb()}
                    style={{
                        cursor: 'pointer',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                    alt="logo"
                    src={thumbImg}
                />
            ) : (
                <VideoCameraOutlined style={{ fontSize: 24 }} />
            )}
        </View>
    );
};
export default VideoThumb;
