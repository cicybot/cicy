import { WebviewTag } from 'electron';
import { View } from '../../../../index';
import React, { useState } from 'react';
import { ListType } from './MediaCards';
import { BackgroundApi } from '../../../../services/common/BackgroundApi';
import VideoThumb from './VideoThumb';
import md5 from 'md5';
import axios from 'axios';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import { Button, Divider, Form, Input, TextArea } from 'antd-mobile';
import TelegramWebviewService from '../../../../services/common/TelegramWebviewService';
import { message, Tag } from 'antd';
import DrawerButton from '../../../../components/DrawerButton';
import { uploadFile } from '../../../../utils/images';
import { formatSize, hideLoading, showLoading } from '../../../../utils/utils';
import { FormInstance } from 'antd-mobile/es/components/form';

function DownloadInfo({
    downloadItem,
    webview,
    content,
    record
}: {
    content: string;
    webview: WebviewTag;
    record: ListType;
    downloadItem: any;
}) {
    const formRef = React.createRef<FormInstance>();

    const { savePath, state } = downloadItem;

    const id_key = record.id;
    const [video, setVideo] = useState<null | any>(null);
    const checkUrlAndToken = (hideMessage?: boolean) => {
        if (!baseUrl) {
            if (!hideMessage) {
                message.error('Api没有设置');
            }

            return false;
        }
        if (!token) {
            if (!hideMessage) {
                message.error('Token没有设置');
            }
            return false;
        }
        return true;
    };
    const updateVideo = async () => {
        if (!checkUrlAndToken(true)) {
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/video/key/${id_key}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.status === 200) {
                const json = await res.json();
                setVideo(json);
                return json;
            }
        } catch (e) {
            return null;
        }
    };

    useTimeoutLoop(async () => {
        const flag = !video;
        const res = await updateVideo();
        if (formRef.current && res && flag) {
            formRef.current.setFieldValue('content', res.video.content);
        }
    }, 1000);
    const [token, setToken] = useLocalStorageState('token_lvdou_1', '');
    const [baseUrl, setBaseUrl] = useLocalStorageState('baseUrl_lvdou_1', '');

    const getCurlUploadCmd = (filePath: string, token: string) => {
        return `curl -X 'POST' \\\\
  '${baseUrl}/file/upload?path=${encodeURIComponent(filePath)}' \\\\
  -H 'Authorization: Bearer ${token}' \\\\
  -H 'accept: application/json' \\\\
  -H 'Content-Type: multipart/form-data' \\\\
  -F 'file=@${savePath}'`;
    };

    return (
        <View>
            <View>
                <View mt12 ml12 rowVCenter>
                    <View mr12>
                        <DrawerButton title="设置">
                            <Form
                                initialValues={{
                                    token,
                                    baseUrl
                                }}
                                onFinish={async (values: any) => {
                                    let { token, baseUrl } = values;
                                    setToken(token);
                                    setBaseUrl(baseUrl);
                                }}
                                footer={
                                    <Button size={'small'} block type="submit" color="primary">
                                        保存
                                    </Button>
                                }
                            >
                                <Form.Item label="Token" name="token">
                                    <TextArea rows={3} placeholder="请输入Token" />
                                </Form.Item>

                                <Form.Item
                                    description={'如:http://119.29.236.138/api'}
                                    label="Api地址"
                                    name="baseUrl"
                                >
                                    <Input placeholder="请输入Api地址" />
                                </Form.Item>
                            </Form>
                        </DrawerButton>
                    </View>
                    {video && (
                        <View mr12>
                            <DrawerButton title="Video">
                                <View json={video}></View>
                            </DrawerButton>
                        </View>
                    )}

                    {downloadItem && (
                        <View mr12>
                            <DrawerButton title="Download">
                                <View json={downloadItem}></View>
                            </DrawerButton>
                        </View>
                    )}
                </View>
            </View>
            {state === 'completed' && (
                <View mt12 column px12 borderBox>
                    <View>
                        <Form
                            ref={formRef}
                            initialValues={{
                                content: content
                            }}
                            onFinish={async (values: any) => {
                                if (!checkUrlAndToken()) {
                                    return;
                                }
                                let { content } = values;
                                const {
                                    size,
                                    mime_type,
                                    duration,
                                    date,
                                    id,
                                    w: width,
                                    h: height,
                                    thumbs
                                } = record;

                                const photoSizeM = thumbs
                                    ? thumbs.find(
                                          thumb =>
                                              thumb['_'] === 'photoSize' && thumb['type'] === 'm'
                                      )
                                    : null;

                                const width_m = photoSizeM ? photoSizeM.w : width;
                                const height_m = photoSizeM ? photoSizeM.h : height;

                                const hash = md5(`${id}${id}`);
                                const p1 = hash.substring(0, 2);
                                const p2 = hash.substring(2, 4);
                                const p3 = hash.substring(4, 6);
                                const path = `${p1}/${p2}/${p3}/${id}`;
                                const id_key = id;
                                const row = {
                                    path,
                                    content,
                                    id_key,
                                    width,
                                    height,
                                    width_m,
                                    height_m,
                                    created_at: date,
                                    size,
                                    duration,
                                    mime_type
                                };
                                try {
                                    showLoading();
                                    const res = await axios.post(`${baseUrl}/video/save`, row, {
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    });
                                    setVideo(res.data);
                                    message.success('保存成功');
                                } catch (e) {
                                    message.error('保存失败');
                                } finally {
                                    hideLoading();
                                }
                            }}
                            footer={
                                <Button size={'small'} block type="submit" color="primary">
                                    保存
                                </Button>
                            }
                        >
                            <Form.Item help={`原文: ${content}`} label="描述" name="content">
                                <TextArea
                                    maxLength={100}
                                    rows={2}
                                    showCount
                                    placeholder="请输入描述"
                                />
                            </Form.Item>
                        </Form>
                    </View>
                </View>
            )}

            {Boolean(video && state === 'completed') && (
                <View ml12>
                    <View rowVCenter px12 mr12>
                        <Button
                            block
                            color="primary"
                            size={'small'}
                            onClick={async () => {
                                if (!checkUrlAndToken()) {
                                    return;
                                }
                                if (1 || !video || !video.file_info.thumb_size) {
                                    const url = await new TelegramWebviewService(
                                        webview
                                    ).getCachedFile(record.id, 'document', 'm');
                                    if (!url) {
                                        message.error('没有找到缩略图');
                                        return;
                                    }
                                    showLoading();
                                    const response = await fetch(url);
                                    const blob = await response.blob();
                                    const fileName = video!.file_info.thumb;
                                    const file = new File([blob], fileName, {
                                        type: 'image/jpeg'
                                    });

                                    try {
                                        await uploadFile(
                                            file,
                                            `${baseUrl}/file/upload?path=${fileName}`, // Replace with your actual upload URL
                                            token
                                        );
                                    } catch (e) {
                                        message.error('上传缩略图失败');
                                        hideLoading();
                                        return;
                                    }
                                } else {
                                    showLoading();
                                }

                                try {
                                    const filePath = video!.file_info.video;
                                    await new BackgroundApi().openTerminal(
                                        getCurlUploadCmd(filePath, token),
                                        true
                                    );
                                    message.success('上传队列提交成功');
                                } catch (e) {
                                    message.error('上传源视频失败');
                                } finally {
                                    hideLoading();
                                }
                            }}
                        >
                            上传视频
                        </Button>
                    </View>
                </View>
            )}
            <Divider></Divider>
            <View ml12>
                {Boolean(video && video.file_info.thumb_size) && (
                    <View mb12 rowVCenter>
                        <Tag color={'success'}>缩略图已上传</Tag>
                        <View>{formatSize(video.file_info.thumb_size)}</View>
                    </View>
                )}
                {Boolean(video && video.file_info.video_size) && (
                    <View mb12 rowVCenter>
                        <Tag color={'success'}>源视频已同步</Tag>
                        <View>{formatSize(video.file_info.video_size)}</View>
                    </View>
                )}

                {Boolean(video && video.file_info.preview_size) && (
                    <View rowVCenter mb12>
                        <Tag color={'success'}>预览视频已生成</Tag>
                        <View>{formatSize(video.file_info.preview_size)}</View>
                    </View>
                )}
            </View>

            <View column mb12>
                <VideoThumb height={320} width={'100%'} {...{ record, webview }} />
            </View>
        </View>
    );
}
export default DownloadInfo;
