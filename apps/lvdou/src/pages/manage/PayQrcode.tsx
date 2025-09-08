import { View } from '@cicy/app';
import { Button, Card, Checkbox, Dialog, ImageUploader, Toast } from 'antd-mobile';
import axios from 'axios';
import md5 from 'md5';
import { uploadFile } from '../../utils/image';
import { getToken } from '../../config';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import EmptyView from '../../components/EmptyView';
import HeaderLeftIcon from '../../components/HeaderLeftIcon';
import { useAuthLogin } from '../../hooks/useAuthLogin';
import { useGlobalContext } from '../../providers/GlobalProvider';

const StyledImageUploader = styled(ImageUploader)`
    cursor: pointer;
    .adm-image-uploader-cell {
        display: none;
    }
`;

const PayQrcode = () => {
    const [rows, setRows] = useState<
        { id: number; img: string; status: number; created_at: number }[]
    >([]);
    const fetchRows = async () => {
        return axios
            .get('/order/pay/qrcode/list')
            .then(res => {
                return res.data;
            })
            .then(rows => setRows(rows));
    };
    useEffect(() => {
        fetchRows();
    }, []);
    const { state } = useGlobalContext();
    useAuthLogin();
    if (!state.authUser) {
        return null;
    }
    return (
        <View absFull>
            <View>
                <HeaderLeftIcon />
                <View abs top0 xx0 h={44} center>
                    <View fontSize={16} fontWeight={700}>
                        支付码管理
                    </View>
                </View>
                <View abs right0 w={100} zIdx={11111111} h={44} center>
                    <StyledImageUploader
                        value={[]}
                        upload={async file => {
                            try {
                                const hash = md5(`${Date.now()}${Date.now()}`);
                                const p1 = hash.substring(0, 2);
                                const p2 = hash.substring(2, 4);
                                const p3 = hash.substring(4, 6);
                                const path = `static/${p1}/${p2}/${p3}/${hash}.${file.type.replace(
                                    'image/',
                                    ''
                                )}`;

                                await uploadFile(
                                    file,
                                    `${
                                        axios.defaults.baseURL
                                    }/file/upload?path=${encodeURIComponent(`${path}`)}`,
                                    getToken() || ''
                                );
                                const img = `${axios.defaults.baseURL!.replace(
                                    '/api',
                                    ''
                                )}/assets/${path}`;

                                await axios.request({
                                    method: 'GET',
                                    url: '/order/pay/qrcode/create',
                                    params: {
                                        img
                                    }
                                });
                                await fetchRows();
                                Toast.show('上传成功');
                            } catch (e) {
                                Toast.show('上传失败');
                            }

                            return { url: '' };
                        }}
                    >
                        <Button color={'primary'} size={'small'}>
                            上传
                        </Button>
                    </StyledImageUploader>
                </View>
            </View>

            <View absFull top={64} overflowHidden>
                {rows.length === 0 && <EmptyView></EmptyView>}
                {rows.length > 0 && (
                    <View row>
                        {rows.map(row => {
                            return (
                                <View w={'45%'} key={row.id}>
                                    <Card>
                                        <View w={200}>
                                            <img style={{ width: '100%' }} src={row.img} alt="" />
                                        </View>
                                        <View px12 borderBox mt12 rowVCenter jSpaceBetween>
                                            <Checkbox
                                                onClick={() => {
                                                    if (row.status === 0) {
                                                        axios
                                                            .request({
                                                                method: 'GET',
                                                                url: '/order/pay/qrcode/active',
                                                                params: {
                                                                    aid: row.id
                                                                }
                                                            })
                                                            .then(() => {
                                                                fetchRows();
                                                            });
                                                    }
                                                }}
                                                checked={row.status === 1}
                                            >
                                                激活
                                            </Checkbox>
                                            <Button
                                                onClick={() => {
                                                    Dialog.confirm({
                                                        content: '确定？',
                                                        onConfirm: async () => {
                                                            axios
                                                                .request({
                                                                    method: 'DELETE',
                                                                    url: '/order/pay/qrcode/delete',
                                                                    params: {
                                                                        aid: row.id
                                                                    }
                                                                })
                                                                .then(() => {
                                                                    fetchRows();
                                                                });
                                                        }
                                                    });
                                                }}
                                                size={'small'}
                                                color={'danger'}
                                            >
                                                删除
                                            </Button>
                                        </View>
                                    </Card>
                                    <View h={12}></View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
};

export default PayQrcode;
