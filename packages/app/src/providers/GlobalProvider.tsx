import {
    createContext,
    Dispatch,
    ReactNode,
    useContext,
    useEffect,
    useReducer,
    useState
} from 'react';
import Loading from '../components/UI/Loading';
import View from '../components/View';

export interface SiteInfo {
    title: string;
    id: number;
    url: string;
    icon: string;
    updatedAt: number;
}

interface GlobalState {
    siteLoading: boolean;
    currentSite: SiteInfo | null;
    ui: {
        broderColor: string;
    };
}

type GlobalAction = { type: 'UPDATE_STATE'; payload: Partial<GlobalState> };

interface GlobalContextType {
    state: GlobalState;
    dispatch: Dispatch<GlobalAction>;
}

const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

const initialState: GlobalState = {
    currentSite: null,
    siteLoading: false,

    ui: {
        broderColor: '#999'
    }
};

const reducer = (state: GlobalState, action: GlobalAction): GlobalState => {
    switch (action.type) {
        case 'UPDATE_STATE':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
    const { Provider } = GlobalContext;
    const [state, dispatch] = useReducer(reducer, initialState);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const onEvent = (e: any) => {
            const { action } = e.detail;
            switch (action) {
                case 'showLoading': {
                    setLoading(true);
                    break;
                }
                case 'hideLoading': {
                    setTimeout(() => setLoading(false), 800);
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
        <Provider value={{ state, dispatch }}>
            <>
                {children}
                <View
                    hide={!loading}
                    center
                    absFull
                    zIdx={100000}
                    style={{ position: 'fixed', backgroundColor: 'rgba(0,0,0,0.2)' }}
                >
                    <Loading></Loading>
                </View>
            </>
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
