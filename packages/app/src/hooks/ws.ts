import { CCWSClient } from '../services/CCWSClient';
import { SiteInfo, SiteService } from '../services/SiteService';
import { useEffect, useState } from 'react';
import { onEvent } from '../utils/utils';

export const useWsClients = () => {
    const [clients, setData] = useState([]);
    const getData = async () => {
        return new CCWSClient('').getClients().then(res => {
            try {
                setData(r => {
                    if (JSON.stringify(r) === JSON.stringify(res.clients)) {
                        return r;
                    }
                    return res.clients;
                });
            } catch (error) {
                setData([]);
            }
        });
    };
    useEffect(() => {
        getData();
    }, []);
    return {
        clients,
        refetch: (noLoading?: boolean) => {
            if (!noLoading) {
                onEvent('showLoading');
            }

            getData().finally(() => onEvent('hideLoading'));
        }
    };
};

export const useSites = () => {
    const [sites, setData] = useState<SiteInfo[]>([]);
    const getData = async () => {
        return SiteService.getAllSite().then(res => {
            try {
                setData(res.map(row => row) || []);
            } catch (e) {
                console.error('site map error:', e, '[res]:', res);
            }
        });
    };
    useEffect(() => {
        getData();
    }, []);
    return {
        sites,
        refetch: () => {
            onEvent('showLoading');
            getData().finally(() => onEvent('hideLoading'));
        }
    };
};
