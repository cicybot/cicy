import { openTerminal, killProcessByName } from '@cicy/node-utils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { openTerminal, killProcessByName, delay };
