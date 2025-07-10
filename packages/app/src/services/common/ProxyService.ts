import { BackgroundApi } from './BackgroundApi';

export const DEFAULT_META_CONFIG_YAML = `mixed-port: 4445
bind-address: '*'
allow-lan: true
log-level: info

external-controller: '12.0.0.1:4446'
external-controller-cors:
  allow-private-network: true
  allow-origins:
  - '*'

mode: rule

# proxies:
#    -
    
rules:
  #- 'IN-USER,10000,10000_PROXY_NODE'
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
      server: 127.0.0.1
      port: 4445
      username: @port@
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
        return 4446;
    }
    static getMetaAccountProxyPort(accountIndex: number) {
        return 10000 + accountIndex;
    }
    static getMetaAccountProxyWebuiPort(accountIndex: number) {
        return 20000 + accountIndex;
    }
    static async intMetaAccountConfig(accountIndex: number, metaConfigPath: string) {
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
        return config;
    }
    static getMetaConfig() {
        return DEFAULT_META_CONFIG_YAML;
    }
}
