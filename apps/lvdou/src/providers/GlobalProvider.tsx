import { createContext, Dispatch, ReactNode, useContext, useEffect, useReducer } from 'react';
import { setToken } from '../config';
import axios from 'axios';

export enum TabBarKey {
    Home = 'Home',
    Me = 'Me',
    Manage = 'Manage'
}

export interface VipItem {
    type: 'svip' | 'year' | 'month';
    isSupper: boolean;
    title: string;
    info: string;
    permission: string;
    amount: number;
    amount_first?: number;
    add_first?: number;
}
export interface DepositItems {
    add_first?: number;
    amount: number;
    vipGift?: number;
    gift?: boolean;
}

export interface s {
    add_first?: number;
    amount: number;
    vipGift?: number;
    gift?: boolean;
}
export enum PageNav {
    Main = 'Main',
    Reg = 'Reg',
    Login = 'Login'
}

export enum UserLevel {
    Normal,
    SVIP,
    YEAR,
    MONTH
}
export interface AuthUser {
    id: number;
    wallet_first: boolean;
    vip_first: boolean;
    invite_by: string;
    invite_code: string;
    avatar: string;
    username: string;
    password: string;
    is_admin: boolean;
    level: UserLevel;
    balance: number;
    balance_withdraw: number;
    vip_expired_at: number;
    created_at: number;
}

interface GlobalState {
    currentPage: PageNav;
    currentVideoId?: number;
    siteLoading: boolean;
    currentTabBarKey: TabBarKey;
    token: null | string;
    token_video: null | string;
    invite_link: string;
    invite_message: string;
    authUser: null | AuthUser;
    app_download_url?: string;
    service?: any;
    token_expires_date: number;
    token_expires: string;
    vips: VipItem[];
    wallet_deposit_items: DepositItems[];
}

type GlobalAction = { type: 'UPDATE_STATE' | 'LOGOUT'; payload: Partial<GlobalState> };

interface GlobalContextType {
    fetchAppSetting: () => Promise<any>;
    state: GlobalState;
    dispatch: Dispatch<GlobalAction>;
}

const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);
const GlobalStateStr = localStorage.getItem('GlobalState');

const initialState: GlobalState = GlobalStateStr
    ? JSON.parse(GlobalStateStr)
    : {
          currentVideoId: undefined,
          siteLoading: false,
          token: null,
          invite_link: '',
          invite_message: '',
          authUser: null,
          token_video: null,
          app_download_url: '',
          token_expires: '',
          token_expires_date: 0,
          service: {
              name: '',
              url: ''
          },
          wallet_deposit_items: [],
          vips: [],
          currentTabBarKey: TabBarKey.Home,
          currentPage: PageNav.Main
      };

const reducer = (state: GlobalState, action: GlobalAction): GlobalState => {
    let state_;
    switch (action.type) {
        case 'UPDATE_STATE':
            state_ = { ...state, ...action.payload };
            break;
        case 'LOGOUT':
            state_ = {
                ...state,
                ...{
                    token_expires: '',
                    token: null,
                    token_video: null,
                    authUser: null
                }
            };
            break;
        default:
            state_ = state;
            break;
    }
    localStorage.setItem('GlobalState', JSON.stringify(state_));
    return state_;
};

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
    const { Provider } = GlobalContext;
    const [state, dispatch] = useReducer(reducer, initialState);
    setToken(state.token);
    const fetchAppSetting = async () => {
        return await axios
            .post('/app/settings', {
                token_video: state.token_video
            })
            .then(async res => {
                const {
                    user,
                    token_video,
                    app_download_url,
                    service,
                    token,
                    token_expires_date,
                    vips,
                    wallet_deposit_items,
                    invite_link,
                    token_expires,
                    invite_message
                } = res.data;

                dispatch({
                    type: 'UPDATE_STATE',
                    payload: {
                        token_expires,
                        invite_message,
                        invite_link,
                        token,
                        token_video,
                        authUser: user,
                        app_download_url,
                        service,
                        token_expires_date,
                        vips: JSON.parse(vips),
                        wallet_deposit_items: JSON.parse(wallet_deposit_items)
                    }
                });
                return res.data;
            });
    };
    useEffect(() => {
        fetchAppSetting().catch(console.error);
        const onEvent = (e: any) => {
            const { action } = e.detail;
            switch (action) {
                default: {
                    break;
                }
            }
        };
        window.addEventListener('onEvent', onEvent);
        return () => {
            window.removeEventListener('onEvent', onEvent);
        };
    }, []);
    return (
        <Provider value={{ state, dispatch, fetchAppSetting }}>
            <>{children}</>
        </Provider>
    );
};

export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }
    return context;
};
