import { CCServerWebSocket } from './CCServerWebSocket';
import { initExpressServer } from './httpServer';

async function main() {
    const port = 3101;
    const httpServer = initExpressServer(port, {
        enableSwagger: true,
        publicPath: '/Users/ton/Desktop/projects/cicy/apps/desktop/public'
    });
    const test_server = new CCServerWebSocket('0.0.0.0', port);
    test_server.init(httpServer);
    test_server.startServer();
}

main();
