import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';

import { redisConfig } from './config/redis';
import RedisCache from './db/RedisCache';

import wsRoutes from './routes/wsRoutes';

import { DB_DRIVER, masterConfig } from './config/db';
import Database from './db/Database';
import { WsClientsService } from './services/WsClientsService';

var bodyParser = require('body-parser');

export function initServer({
    port
}:{
    port:number
}){

    Database.initialize(DB_DRIVER,masterConfig)
    RedisCache.initialize(redisConfig)

    const app = express();

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'public'));

    // Swagger 配置选项
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'CiCy API Documentation', // 文档标题
                version: '1.0.2', // API 版本
                description: 'API for managing file uploads and downloads'
            },
            servers: [
                { url: 'http://localhost:' + port, description: 'Local Server' } // 服务端地址
            ],
            components: {
                securitySchemes: {
                    // 可选的认证配置（如 JWT）
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        },
        apis: [__dirname+'/routes/*Routes.js']
    };
    const swaggerSpec = swaggerJSDoc(swaggerOptions);

    app.use(
        cors({
            origin: ['http://localhost:3173','http://localhost:3174'], // Allow only specific origin
            methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
            allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
            credentials: true // Allow cookies/auth headers
        })
    );

    app.use(bodyParser.json({ limit: '50mb' }));

    app.use('/ws', wsRoutes);


    app.get('/swagger.json', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

    const httpServer = createServer(app);
    WsClientsService.init(httpServer);

    httpServer.listen(port, () => {
        console.log(`Http Server running on http://localhost:${port}`);
        console.log(`Http Server running on ws://localhost:${port}/ws`);
    });
}