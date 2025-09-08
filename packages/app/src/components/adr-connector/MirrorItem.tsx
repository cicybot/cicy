import type { MenuProps } from 'antd';
import { Card, Dropdown } from 'antd';
import View from '../View';
import { AdrDeviceInfo } from '../../services/model/AdrDeviceModel';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
    ArrowLeftOutlined,
    EllipsisOutlined,
    ExportOutlined,
    FullscreenOutlined,
    HomeOutlined,
    SettingOutlined,
    WindowsFilled
} from '@ant-design/icons';
import { AdrUtils } from '../../services/common/AdrUtils';
import Screen from '../adr-detail/screen/Screen';
import { useTimeoutLoop } from '@cicy/utils';
import Loading from '../UI/Loading';

const StyledCard = styled(Card)`
    .ant-card-body {
        padding: 0;
    }

    .ant-card-actions li {
        margin: 0;
    }
`;
const MirrorItem = ({
    setCurrentDevice,
    isMax,
    isWin,
    width,
    device,
    openAdr,
    httpShortDelayMs,
    setCurrentFullscreenDevice
}: {
    isWin?: boolean;
    isMax?: boolean;
    setCurrentFullscreenDevice?: (device: AdrDeviceInfo) => void;
    openAdr?: (device: AdrDeviceInfo) => Promise<void>;
    setCurrentDevice: (device: AdrDeviceInfo) => Promise<void>;
    width: number;
    device: AdrDeviceInfo;
    httpShortDelayMs?: number;
}) => {
    const { id, width: deviceWidth, height } = device;
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const utils = new AdrUtils(true)
        .setAccessIp(device.accessIp)
        .setAccessPort(device.accessPort)
        .setId(device.id);

    async function fetchVersion() {
        const version = await utils.getVersion();
        setIsOnline(!!version);
    }

    useEffect(() => {
        fetchVersion().catch(console.error);
    }, []);
    useTimeoutLoop(async () => {
        try {
            await fetchVersion();
        } catch (e) {}
    }, 5000);

    const items: MenuProps['items'] = [];

    if (!isWin) {
        items.push({
            label: '新窗口打开',
            key: 'outOpen',
            icon: <ExportOutlined />
        });
        items.push({
            label: '设置',
            key: 'setting',
            icon: <SettingOutlined />
        });
    } else {
        items.push({
            label: '设置',
            key: 'setting',
            icon: <SettingOutlined />
        });
    }
    // if (!isMax) {
    //     items.push({
    //         label: '最大化',
    //         key: 'max',
    //         icon: <FullscreenOutlined />
    //     });
    // }
    const actionHeight = AdrUtils.getBottomHeight();
    const actions: React.ReactNode[] = [
        <View
            h={actionHeight}
            key="home"
            center
            onClick={() => {
                utils.pressKey('home');
            }}
        >
            <HomeOutlined />
        </View>,
        <View h={actionHeight} key="back" center onClick={() => utils.pressKey('back')}>
            <ArrowLeftOutlined />
        </View>
    ];

    actions.push(
        <View h={actionHeight} key="recent" center onClick={() => utils.pressKey('recent')}>
            <WindowsFilled />
        </View>
    );

    actions.push(
        <Dropdown
            key="more"
            menu={{
                items,
                onClick: menu => {
                    switch (menu.key) {
                        case 'max': {
                            setCurrentFullscreenDevice && setCurrentFullscreenDevice(device);
                            break;
                        }
                        case 'outOpen': {
                            openAdr && openAdr(device);
                            break;
                        }
                        case 'recent': {
                            utils.pressKey('recent');
                            break;
                        }
                        case 'setting': {
                            setCurrentDevice(device);
                            break;
                        }
                    }
                }
            }}
            placement="topRight"
            trigger={['click']}
            arrow={{ pointAtCenter: true }}
        >
            <View h={actionHeight} center>
                <EllipsisOutlined />
            </View>
        </Dropdown>
    );

    const h = (height * width) / deviceWidth;

    return (
        <StyledCard
            hoverable
            actions={width < 240 ? undefined : actions}
            style={{ width, overflow: 'hidden' }}
            variant="outlined"
        >
            <View h={h + AdrUtils.getBottomHeight()} overflowHidden>
                {isOnline && (
                    <Screen
                        httpShortDelayMs={httpShortDelayMs}
                        useHttpShort={true}
                        device={device}
                        id={device.id}
                    ></Screen>
                )}
                {!isOnline && (
                    <View wh100p center relative>
                        {isOnline === null ? <Loading></Loading> : '未连接'}
                    </View>
                )}
            </View>
        </StyledCard>
    );
};

export default MirrorItem;
