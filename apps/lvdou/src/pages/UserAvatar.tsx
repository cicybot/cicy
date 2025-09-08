import { View } from '@cicy/app';
import { Grid, Toast } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useGlobalContext } from '../providers/GlobalProvider';
import axios from 'axios';
import HeaderLeftIcon from '../components/HeaderLeftIcon';

const UserAvatar = () => {
    const { state, fetchAppSetting } = useGlobalContext();
    const { authUser } = state;
    if (!authUser) {
        return null;
    }
    const { avatar } = authUser;
    return (
        <View absFull style={{}}>
            <HeaderLeftIcon />
            <View abs top0 xx0 h={44} center>
                <View fontSize={16} fontWeight={700}>
                    更换头像
                </View>
            </View>
            <View abs right0 w={64} zIdx={1111} h={44} jEnd aCenter></View>
            <View absFull top={44} overflowYAuto pt12 borderBox>
                <Grid columns={3} gap={8}>
                    {Array.from({ length: 15 }).map((_, i) => {
                        if (i === 0) {
                            return (
                                <Grid.Item key={i}>
                                    <View
                                        wh={88}
                                        ml12
                                        mb12
                                        center
                                        pointer
                                        onClick={() => {
                                            Toast.show('正在开发中');
                                        }}
                                        borderRadius={13}
                                        overflowHidden
                                        relative
                                        bgColor={'var(--adm-color-background-body)'}
                                    >
                                        <View
                                            abs
                                            top0
                                            left0
                                            w={44}
                                            borderRadius={12}
                                            bgColor={'var(--adm-color-background-body)'}
                                        >
                                            <img
                                                style={{ width: '100%', height: '100%' }}
                                                src={'/img/common_tag_svip@2x.png'}
                                                alt=""
                                            />
                                        </View>
                                        <AddOutline style={{ fontSize: 32 }} />
                                        <View
                                            abs
                                            bottom0
                                            center
                                            xx0
                                            h={24}
                                            bgColor={'var(--adm-color-primary)'}
                                        >
                                            上传头像
                                        </View>
                                    </View>
                                </Grid.Item>
                            );
                        }
                        let isSelected = avatar === String(i);

                        return (
                            <Grid.Item key={i}>
                                <View
                                    pointer
                                    wh={88}
                                    bgColor={'var(--adm-color-background-body)'}
                                    ml12
                                    mb12
                                    onClick={async () => {
                                        try {
                                            await axios.post('/user/avatar/update', {
                                                avatar: String(i)
                                            });

                                            setTimeout(() => {
                                                Toast.show('更新成功');
                                            }, 100);
                                        } catch (e) {
                                            setTimeout(() => {
                                                Toast.show('更新失败');
                                            }, 100);
                                        }
                                        await fetchAppSetting();
                                    }}
                                    borderRadius={12}
                                    center
                                    overflowHidden
                                    relative
                                >
                                    {isSelected && (
                                        <View abs top0 right0 w={44} borderRadius={12}>
                                            <img
                                                style={{ width: '100%', height: '100%' }}
                                                src={'/img/avatar/my_profile_sel@2x.png'}
                                                alt=""
                                            />
                                        </View>
                                    )}

                                    <View wh={64} borderRadius={32} overflowHidden>
                                        <img
                                            style={{ width: '100%', height: '100%' }}
                                            src={`/img/avatar/a${i + 1}.png`}
                                            alt=""
                                        />
                                    </View>
                                </View>
                            </Grid.Item>
                        );
                    })}
                </Grid>
            </View>
        </View>
    );
};
export default UserAvatar;
