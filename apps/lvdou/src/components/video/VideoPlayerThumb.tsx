import { View } from '@cicy/app';
import { useEffect } from 'react';
import { Video } from '../../pages/Home';
import { PlayCircleTwoTone } from '@ant-design/icons';
import { useGlobalContext } from '../../providers/GlobalProvider';
import { useElementVisibility } from '../../hooks/useElementVisibility';

const VideoPlayerThumb = ({
    size,
    thumb,
    video
}: {
    size: { width: number; height: number; rate: number };
    video: Video;
    thumb: string;
}) => {
    const { ref, isVisible } = useElementVisibility();
    // console.log('isVisible', video.id, isVisible);
    const { state, dispatch } = useGlobalContext();
    const { currentVideoId } = state;
    const { width_m, height_m } = video;
    let videoWidth = width_m;
    let videoHeight = width_m / size.rate;
    if (height_m > size.height) {
        videoWidth = size.height / size.rate;
        videoHeight = size.height;
    }

    useEffect(() => {}, []);
    const play = currentVideoId === video.id;

    useEffect(() => {
        if (!isVisible && play) {
            dispatch({
                type: 'UPDATE_STATE',
                payload: {
                    currentVideoId: undefined
                }
            });
        }
    }, [isVisible, play]);
    return (
        <View center bgColor={'black'} relative pointer>
            <View
                onClick={() => {
                    dispatch({
                        type: 'UPDATE_STATE',
                        payload: {
                            currentVideoId: video.id
                        }
                    });
                }}
                absFull
                zIdx={1}
                center
            >
                <PlayCircleTwoTone style={{ fontSize: 32 }} />
            </View>
            <img
                style={{
                    width: videoWidth,
                    height: videoHeight
                }}
                src={thumb}
                alt=""
            />

            <span ref={ref}></span>
        </View>
    );
};
export default VideoPlayerThumb;
