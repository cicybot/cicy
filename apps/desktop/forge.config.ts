import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';
import type { NotaryToolCredentials } from '@electron/notarize/lib/types';
import dotenv from 'dotenv';
import path from 'path';

import { MakerDebConfigOptions } from '@electron-forge/maker-deb/dist/Config';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

dotenv.config();

const IsDev = process.env.BUILD === 'false';

// console.log('>> IsDev', IsDev,process.env.APPLE_API_KEY);

const schemes = ['cc'];

const devAndRpmOptions = {
    name: 'CiCi',
    productName: 'CiCi',
    genericName: 'CiCi',
    license: 'Apache-2.0',
    maintainer: 'CiCi Group',
    bin: 'CiCi', // bin name
    description: 'Your desktop cc explorer',
    homepage: 'https://web3or.site',
    icon: path.join(__dirname, 'public', 'icon.png'),
    mimeType: schemes.map(schema => `x-scheme-handler/${schema}`)
};

const config: ForgeConfig = {
    packagerConfig: {
        download: {
            mirrorOptions: !process.env.APPLE_API_KEY
                ? {
                      mirror: ''
                  }
                : undefined
        },
        asar: true,
        icon: path.join(__dirname, 'public', 'icon'),
        name: 'CiCi',
        executableName: 'CiCi',
        protocols: [
            {
                name: 'CiCi Protocol',
                schemes: schemes
            }
        ],
        appBundleId: IsDev ? 'com.cc.browser.dev' : 'com.cc.browser',
        ...(process.env.APPLE_API_KEY
            ? {
                  osxSign: {
                      optionsForFile: (optionsForFile: string) => {
                          return {
                              entitlements: 'entitlements.plist'
                          };
                      }
                  },
                  // https://www.electronforge.io/guides/code-signing/code-signing-macos
                  osxNotarize: {
                      appleApiKey: process.env.APPLE_API_KEY,
                      appleApiKeyId: process.env.APPLE_API_KEY_ID,
                      appleApiIssuer: process.env.APPLE_API_ISSUER
                  } as NotaryToolCredentials
              }
            : {}),
        extraResource: ['./public']
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel(
            {
                name: 'CiCi',
                authors: 'CiCi Group',
                description: 'Your desktop web3 explorer on The Open Network',
                iconUrl: 'https://raw.githubusercontent.com/TonStockFi/web3-explorer/refs/heads/main/apps/desktop/public/icon.ico',
                setupIcon: path.join(process.cwd(), 'public', 'icon.ico'),
                loadingGif: path.join(process.cwd(), 'public', 'install.gif'),
                remoteReleases: 'https://github.com/TonStockFi/web3-explorer'
            },
            ['win32']
        ),
        new MakerZIP({}, ['darwin', 'linux', 'win32']),
        new MakerDMG(
            arch => ({
                background: path.join(process.cwd(), 'public', 'dmg-bg.png'),
                icon: path.join(process.cwd(), 'public', 'icon.icns'),
                format: 'ULFO',
                additionalDMGOptions: { window: { size: { width: 600, height: 372 } } },
                contents: [
                    {
                        x: 200,
                        y: 170,
                        type: 'file',
                        path: `${process.cwd()}/out/CiCi-darwin-${arch}/CiCi.app`
                    },
                    { x: 400, y: 170, type: 'link', path: '/Applications' }
                ]
            }),
            ['darwin']
        ),
        new MakerRpm(
            {
                options: devAndRpmOptions
            },
            ['linux']
        ),
        new MakerDeb(
            {
                options: { ...devAndRpmOptions, compression: 'xz' } as MakerDebConfigOptions
            },
            ['linux']
        )
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: './src/index.html',
                        js: './src/renderer.ts',
                        name: 'main_window',
                        preload: {
                            js: './src/preload.ts'
                        }
                    }
                ]
            }
        })
    ]
};

export default config;
