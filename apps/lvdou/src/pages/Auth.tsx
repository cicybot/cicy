import { useState } from 'react';

import { View } from '@cicy/app';
import { Button, Form, Input, Toast } from 'antd-mobile';

import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import styled from 'styled-components';
import axios from 'axios';
import { PageNav, useGlobalContext } from '../providers/GlobalProvider';
import { validateChinaMobile } from '../utils/utils';
import { CloseIcon } from '@cicy/app/dist/components/UI/CloseIcon';
import { setToken } from '../config';

const StyledDiv = styled('div')`
    &.eye {
        position: absolute;
        padding: 4px;
        margin-left: -10px;
        cursor: pointer;
        svg {
            display: block;
            font-size: var(--adm-font-size-7);
        }
    },
`;

const StyledForm = styled(Form)`
    width: 280px;
    --border-inner: none;
    --border-top: none;
    --border-bottom: none;
    --adm-color-background: rgba(0, 0, 0, 0);
    ::placeholder {
        color: var(--adm-color-weak);
    }
`;

const Auth = ({ isReg }: { isReg?: boolean }) => {
    const { dispatch, fetchAppSetting } = useGlobalContext();
    const [visible, setVisible] = useState(false);
    const [visibleRepeat, setVisibleRepeat] = useState(false);
    const invite_code_query = new URL(location.href).searchParams.get('i');
    return (
        <View
            absFull
            style={{
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat',
                backgroundImage: 'url(/img/auth/reg_bg.jpg)'
            }}
        >
            <CloseIcon
                zIdx={1000}
                props={{
                    top: 0,
                    left: 12,
                    wh: 44
                }}
                fontSize={18}
                onClick={() => {
                    dispatch({
                        type: 'UPDATE_STATE',
                        payload: {
                            currentPage: PageNav.Main
                        }
                    });
                }}
            ></CloseIcon>
            <View abs top0 xx0 h={44} center>
                <View fontSize={16} fontWeight={700}>
                    {isReg ? '注册' : '登录'}
                </View>
            </View>
            <View abs right0 w={64} zIdx={1111} h={44} jEnd aCenter>
                <View
                    pointer
                    h100p
                    mr={24}
                    fontSize={14}
                    center
                    onClick={() => {
                        dispatch({
                            type: 'UPDATE_STATE',
                            payload: {
                                currentPage: isReg ? PageNav.Login : PageNav.Reg
                            }
                        });
                    }}
                >
                    {!isReg ? '注册' : '登录'}
                </View>
            </View>
            <View h100p center>
                <View>
                    <StyledForm
                        onFinish={async (values: any) => {
                            let { invite_code, username, password } = values;
                            invite_code = invite_code ? invite_code.trim() : invite_code;
                            username = username ? username.trim() : username;
                            password = password ? password.trim() : password;

                            if (!username || !validateChinaMobile(username)) {
                                Toast.show({
                                    icon: 'fail',
                                    content: '手机号不合法'
                                });
                                return;
                            }

                            if (!password || password.length < 6) {
                                Toast.show({
                                    icon: 'fail',
                                    content: '密码不能少于6位'
                                });
                                return;
                            }
                            if (isReg) {
                                let { passwordRepeat } = values;

                                passwordRepeat = passwordRepeat
                                    ? passwordRepeat.trim()
                                    : passwordRepeat;

                                if (passwordRepeat !== password) {
                                    Toast.show({
                                        icon: 'fail',
                                        content: '两次输入的密码不一致'
                                    });
                                    return;
                                }
                            }

                            const loading = Toast.show({
                                icon: 'loading',
                                maskClickable: false,
                                content: '登录中'
                            });
                            if (!isReg) {
                                invite_code = undefined;
                            } else {
                                if (invite_code_query) {
                                    invite_code = invite_code_query;
                                }
                            }
                            try {
                                const res = await axios.post('/auth/sign', {
                                    username,
                                    password,
                                    invite_code,
                                    is_reg: isReg
                                });
                                const { err_msg, access_token, user } = res.data;

                                if (err_msg) {
                                    loading.close();
                                    Toast.show({
                                        icon: 'fail',
                                        content: err_msg
                                    });
                                    return;
                                }

                                setToken(access_token);
                                dispatch({
                                    type: 'UPDATE_STATE',
                                    payload: {
                                        token: access_token,
                                        authUser: user
                                    }
                                });
                                await fetchAppSetting();
                                loading.close();
                                Toast.show({
                                    icon: 'success',
                                    content: isReg ? '注册成功' : '登录成功'
                                });
                                dispatch({
                                    type: 'UPDATE_STATE',
                                    payload: {
                                        currentPage: PageNav.Main
                                    }
                                });
                            } catch (e: any) {
                                console.log(e.status, e);
                                loading.close();
                                Toast.show({
                                    icon: 'fail',
                                    content: isReg ? '注册失败' : '登录失败'
                                });
                            }
                        }}
                        footer={
                            <Button block type="submit" color="primary">
                                提交
                            </Button>
                        }
                    >
                        <StyledForm.Item label="手机号" name="username">
                            <Input placeholder="请输入手机号" clearable />
                        </StyledForm.Item>
                        <StyledForm.Item
                            label="密码"
                            name="password"
                            extra={
                                <StyledDiv className={'eye'}>
                                    {!visible ? (
                                        <EyeInvisibleOutline onClick={() => setVisible(true)} />
                                    ) : (
                                        <EyeOutline onClick={() => setVisible(false)} />
                                    )}
                                </StyledDiv>
                            }
                        >
                            <Input
                                placeholder="请输入至少6位密码"
                                clearable
                                type={visible ? 'text' : 'password'}
                            />
                        </StyledForm.Item>
                        {isReg && (
                            <StyledForm.Item
                                label="密码确认"
                                name="passwordRepeat"
                                extra={
                                    <StyledDiv className={'eye'}>
                                        {!visibleRepeat ? (
                                            <EyeInvisibleOutline
                                                onClick={() => setVisibleRepeat(true)}
                                            />
                                        ) : (
                                            <EyeOutline onClick={() => setVisibleRepeat(false)} />
                                        )}
                                    </StyledDiv>
                                }
                            >
                                <Input
                                    placeholder="请再次确认输入密码"
                                    clearable
                                    type={visibleRepeat ? 'text' : 'password'}
                                />
                            </StyledForm.Item>
                        )}
                        {Boolean(!invite_code_query && isReg) && (
                            <StyledForm.Item label="推荐码" name="invite_code">
                                <Input placeholder="请输入推荐码，选填" clearable type={'text'} />
                            </StyledForm.Item>
                        )}
                    </StyledForm>
                </View>
            </View>
        </View>
    );
};
export default Auth;
