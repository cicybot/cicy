import { View } from '@cicy/app';
import VideoPlayer from '../components/video/VideoPlayer';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGlobalContext } from '../providers/GlobalProvider';
import VideoPlayerThumb from '../components/video/VideoPlayerThumb';
import { PullToRefresh, SearchBar, Tabs } from 'antd-mobile';
import styled from 'styled-components';

export interface Video {
    id_key: string;
    path: string;
    id: number;
    width: number;
    height: number;
    height_m: number;
    width_m: number;
    size: number;
    mime_type: string;
    content: string;
    created_at: string;
    duration: number;
}

const StyledTabs = styled(Tabs)`
    --title-font-size: 14px;
    .adm-tabs-header {
        border-bottom: none;
    }
`;

const Home = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const { state, fetchAppSetting } = useGlobalContext();
    const fetchRows = async () => {
        return axios.get('/video/list').then(res => {
            setVideos(res.data);
        });
    };
    useEffect(() => {
        fetchAppSetting();
        fetchRows();
    }, []);

    const { currentVideoId } = state;
    const maxWidth = 360;
    const isMobile = true;
    const currentVideo = videos.find(video => video.id === currentVideoId);
    return (
        <View style={{ overflow: 'hidden' }}>
            <View fixed top0 xx0 h={92} zIdx={1111111} bgColor={'--adm-color-background-body'}>
                <View mb12 px12 mt12>
                    <SearchBar placeholder={'请输入关键字'} />
                </View>
                <View mb={6}>
                    <StyledTabs>
                        <StyledTabs.Tab title="推荐" key="rec"></StyledTabs.Tab>
                        <StyledTabs.Tab title="热门" key="hot"></StyledTabs.Tab>
                        <StyledTabs.Tab title="国产" key="cn"></StyledTabs.Tab>
                        <StyledTabs.Tab title="日本" key="jp"></StyledTabs.Tab>
                        <StyledTabs.Tab title="诱惑" key="yh"></StyledTabs.Tab>
                        <StyledTabs.Tab title="白人" key="br"></StyledTabs.Tab>
                        <StyledTabs.Tab title="老黑" key="lh"></StyledTabs.Tab>
                    </StyledTabs>
                </View>
            </View>
            <View center fixed xx0 bottom={48} top={98} overflowHidden column>
                <View w100p h={'calc(100%)'} overflowYAuto>
                    <PullToRefresh
                        onRefresh={async () => {
                            await fetchRows();
                        }}
                    >
                        <View style={{ width: 360, margin: '0 auto' }}>
                            {maxWidth &&
                                videos.map(video => {
                                    const rate = 1.8;
                                    const maxHeight = maxWidth / 1.8;
                                    const { path, content } = video;
                                    const thumb = `${axios.defaults.baseURL?.replace(
                                        '/api',
                                        '/assets'
                                    )}/thumb/${path}.jpeg`;
                                    return (
                                        <View w100p key={video.id_key}>
                                            <View pt={4} overflowHidden column>
                                                {/*{width_m / height_m}*/}
                                                {/*{token}*/}
                                                {/*{formatSize(size)}*/}
                                                <View
                                                    pl={16}
                                                    mt={4}
                                                    fontSize={16}
                                                    fontWeight={500}
                                                    mb={8}
                                                >
                                                    {content}
                                                </View>
                                                <View
                                                    w={maxWidth}
                                                    h={maxHeight}
                                                    bgColor={'black'}
                                                    center
                                                    overflowHidden
                                                >
                                                    <VideoPlayerThumb
                                                        size={{
                                                            rate,
                                                            width: maxWidth!,
                                                            height: maxHeight
                                                        }}
                                                        video={video}
                                                        thumb={thumb}
                                                    />
                                                </View>
                                            </View>
                                            <View
                                                bgColor={isMobile ? '--adm-color-weak' : undefined}
                                                h={12}
                                            ></View>
                                        </View>
                                    );
                                })}
                        </View>
                    </PullToRefresh>
                </View>
            </View>
            {Boolean(currentVideoId && currentVideo) && <Player video={currentVideo!} />}
        </View>
    );
};

export const Player = ({ video }: { video: Video }) => {
    return (
        <View bgColor={'black'} absFull fixed zIdx={1111112}>
            <VideoPlayer video={video!} />
        </View>
    );
};
export default Home;
