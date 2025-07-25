export { default as Html5Cache } from './common/Html5Cache';
export { default as IndexedDbCache } from './common/IndexedDbCache';

export {
    generateRandomPassword,
    formatNumber,
    sleep,
    generateDeviceId,
    stringToHex,
    padKeyTo8Bytes,
    formatTimeAgo,
    deepDiff,
    isString,
    stringIsJson,
    waitForResult
} from './common/utils';
export { default as useLocalStorageState } from './hooks/useLocalStorageState';
export { default as useSessionStorageState } from './hooks/useSessionStorageState';

export { default as useInterval } from './hooks/useInterval';
export { default as useTimeoutLoop } from './hooks/useTimeoutLoop';

export { default as useOnce } from './hooks/useOnce';
