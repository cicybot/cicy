import { DownOutlined } from '@ant-design/icons';
import { ProDescriptions, ProField } from '@ant-design/pro-components';
import type { TreeDataNode, TreeProps } from 'antd';
import { Button, Input, Tree } from 'antd';
import { HomeOutlined, ArrowLeftOutlined, WindowsOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import View from '../../../components/View';
import { connectCCServer } from '../../../services/CCWSClient';

import { convertXmlToTreeData, getExpandKeys, parseBounds, type Rect, type XmlNode } from './../utils';

import type { TabsProps } from 'antd';
import { Tabs, Checkbox } from 'antd';
import Loading from '../../../components/UI/Loading';
import CCAgentClient, { DeviceInfo } from '../../../services/CCWSAgentClient';
import { useLocalStorageState, useTimeoutLoop } from '@cicy/utils';
import AndroidDetailInner from './AndroidDetailInner';


const AndroidDetailWrap = () => {
    const [deviceInfo, setDeviceInfo] = useState<any | DeviceInfo>(null);
    const { clientId } = useParams();
    const agent = new CCAgentClient(clientId!);
    const fetchDeviceInfo = () => agent.getDeviceInfo();
    useEffect(() => {
        fetchDeviceInfo()
            .then(res => {
                setDeviceInfo(res);
            })
            .catch(() => {
                setTimeout(() => fetchDeviceInfo(), 1000);
            });
    }, []);

    if (!deviceInfo) {
        return (
            <View h100vh w100vw center>
                <Loading></Loading>
            </View>
        );
    }

    return <AndroidDetailInner deviceInfo={deviceInfo}></AndroidDetailInner>;
};


export default AndroidDetailWrap;
