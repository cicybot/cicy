import { View } from '@cicy/app';
import { Video } from '../../pages/Home';
import { useEffect } from 'react';
import { LeftOutline } from 'antd-mobile-icons';
import { useGlobalContext } from '../../providers/GlobalProvider';
import axios from 'axios';
import { getAndroidApi } from '../../utils/utils';

const VideoPlayer = ({ video }: { video: Video }) => {
    const { dispatch, state } = useGlobalContext();
    const { token_video: token } = state;
    const { width, height } = video;
    const thumb = `${axios.defaults.baseURL?.replace('/api', '/assets')}/thumb/${video.path}.jpeg`;
    const videoPath = token
        ? thumb.replace('.jpeg', '').replace('/thumb', '/video') +
          '?token=' +
          encodeURIComponent(token)
        : thumb.replace('.jpeg', '').replace('/thumb', '/preview');

    useEffect(() => {
        //@ts-ignore
        let player;
        try {
            //@ts-ignore
            player = window.videojs(`video-${video.id}`, {});
            player.ready(function () {
                if (getAndroidApi()) {
                    //@ts-ignore
                    player.play();
                }
            });
        } catch (e) {}

        return () => {
            try {
                //@ts-ignore
                player && player.dispose();
            } catch (e) {}
        };
    }, []);
    const widthVideo = 360;
    const heightVideo = widthVideo / (width / height);

    return (
        <View center bgColor={'black'} relative pointer wh100p>
            <View
                zIdx={111111}
                abs
                left={8}
                top={8}
                center
                wh={44}
                onClick={() => {
                    dispatch({
                        type: 'UPDATE_STATE',
                        payload: {
                            currentVideoId: undefined
                        }
                    });
                }}
            >
                <LeftOutline fontSize={18} color={'white'} />
            </View>
            <View absFull center>
                <video
                    id={`video-${video.id}`}
                    className="video-js"
                    controls
                    autoPlay
                    preload="auto"
                    style={{
                        width: widthVideo,
                        height: heightVideo
                    }}
                    poster={thumb}
                    data-setup="{}"
                >
                    <source src={videoPath} type="video/mp4" />
                </video>
            </View>
            <View abs xx0 bottom0 h={44} rowVCenter>
                <View px={12} color={'white'} fontSize={16} fontWeight={700}>
                    {video.content}
                </View>
            </View>
        </View>
    );
};
export default VideoPlayer;
