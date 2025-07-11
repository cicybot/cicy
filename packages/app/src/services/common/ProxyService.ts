import { BackgroundApi } from './BackgroundApi';
import { onEvent } from '../../utils/utils';
import { message } from 'antd';
import { BrowserAccount, BrowserAccountInfo } from '../model/BrowserAccount';

export const DEFAULT_META_CONFIG_YAML = `# 4445 4455 不可修改，其他参考 
# https://clash.wiki/configuration/configuration-reference.html

mixed-port: 4445
bind-address: '*'
allow-lan: true
log-level: info

external-controller: '127.0.0.1:4455'
external-controller-cors:
  allow-private-network: true
  allow-origins:
  - '*'

mode: rule

# proxies:
#    -
    
rules:
  #- 'IN-USER,Account_10000,PROXY_NODE'
  - 'MATCH,DIRECT'
`;

export const DEFAULT_META_ACCOUNT_CONFIG_YAML = `
mixed-port: @port@
bind-address: '*'
allow-lan: false
external-controller: '127.0.0.1:@port_web@'
external-controller-cors:
  allow-private-network: true
  allow-origins:
  - '*'
mode: rule

proxies:
    - name: "http"
      type: http
      server: @proxy_server@
      port: @proxy_port@
      username: Account_@port@
      password: password
  
rules:
  - 'MATCH,http'
`;
export default class ProxyService {
    static async init(meta: { configPath: string; bin: string; dataDir: string }) {
        const { bin, configPath, dataDir } = meta;
        const res = await new BackgroundApi().utils({
            method: 'fileExists',
            params: [configPath]
        });
        if (!res.result) {
            await new BackgroundApi().utils({
                method: 'fileWriteString',
                params: [configPath, DEFAULT_META_CONFIG_YAML]
            });
        }
        new BackgroundApi().isPortOnline(ProxyService.getProxyPort()).then((res: any) => {
            if (!res.result) {
                ProxyService.startServer(bin, dataDir, configPath, ProxyService.getProxyPort());
            }
        });
    }
    static getProxyPort() {
        return 4445;
    }
    static getProxyWebuiPort() {
        return 4455;
    }
    static getAccountIndexByPort(port: number) {
        return port - 10000;
    }
    static getMetaAccountProxyPort(accountIndex: number) {
        return 10000 + accountIndex;
    }
    static getMetaAccountProxyWebuiPort(accountIndex: number) {
        return 20000 + accountIndex;
    }
    static async initMetaAccountConfig(accountIndex: number, metaConfigPath: string) {
        const res = await ProxyService.isMetaAccountConfigPathExists(accountIndex, metaConfigPath);
        if (!res) {
            const port = ProxyService.getMetaAccountProxyPort(accountIndex);
            await new BackgroundApi().utils({
                method: 'fileWriteString',
                params: [
                    ProxyService.getMetaAccountConfigPath(accountIndex, metaConfigPath),
                    ProxyService.getMetaAccountConfig(port)
                ]
            });
        }
    }
    static async startServer(
        bin: string,
        dataDir: string,
        configPath: string,
        port: number,
        showWin?: boolean
    ) {
        return new BackgroundApi().metaStart(
            port,
            `${bin} -d ${dataDir} -f ${configPath}`,
            showWin
        );
    }
    static async testConfig(bin: string, configPath: string) {
        try {
            const { result, err } = await new BackgroundApi().metaConfigTest(bin, configPath);
            if (err) {
                throw new Error(err || 'Error Config');
            }
            const { stdout } = result;
            if (stdout && stdout.indexOf('test is successful') > -1) {
            } else {
                throw new Error('Error Config');
            }
        } catch (e) {
            throw new Error('Error Config');
        }
        return true;
    }
    static async isMetaAccountConfigPathExists(accountIndex: number, metaConfigPath: string) {
        const res = await new BackgroundApi().utils({
            method: 'fileExists',
            params: [ProxyService.getMetaAccountConfigPath(accountIndex, metaConfigPath)]
        });
        return res.result;
    }
    static getMetaAccountConfigPath(accountIndex: number, metaConfigPath: string) {
        const port = ProxyService.getMetaAccountProxyPort(accountIndex);
        return metaConfigPath.replace('.yaml', `_meta_${port}.yaml`);
    }
    static getMetaAccountConfig(port: number) {
        let config = DEFAULT_META_ACCOUNT_CONFIG_YAML.replace(/@port_web@/g, port + 10000 + '');
        config = config.replace(/@port@/g, port + '');
        config = config.replace(
            /@proxy_server@/g,
            ProxyService.getMetaAccountCacheProxyServerHost()
        );
        config = config.replace(/@proxy_port@/g, ProxyService.getMetaAccountCacheProxyServerPort());
        return config;
    }
    static getMetaAccountCacheProxyServerHost() {
        let host = '127.0.0.1';
        const cache = localStorage.getItem('proxy_server');
        if (cache) {
            host = JSON.parse(cache)[0];
        }
        return host;
    }

    static getMetaAccountCacheProxyServerPort() {
        let port = ProxyService.getProxyPort();
        const cache = localStorage.getItem('proxy_port');
        if (cache) {
            port = JSON.parse(cache)[0];
        }
        return port + '';
    }
    static getMetaConfig() {
        return DEFAULT_META_CONFIG_YAML;
    }
    static testSpeed(account: BrowserAccountInfo) {
        const startTime = Date.now();
        return new BackgroundApi()
            .axios('https://api.myip.com', {
                timeout: 5000,
                httpsProxy: `http://127.0.0.1:${ProxyService.getMetaAccountProxyPort(account.id)}`
            })
            .then(async (res: any) => {
                if (res.err) {
                    throw new Error(res.err);
                } else {
                    const { ip, country } = res.result;
                    const testTs = Math.floor(startTime / 1000);
                    await new BrowserAccount(account.id).save({
                        ...account.config,
                        testDelay: Date.now() - startTime,
                        testTs,
                        testLocation: country,
                        testIp: ip
                    });
                    return [ip, country, Date.now() - startTime, testTs];
                }
            });
    }
}
