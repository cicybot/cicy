import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import bodyParser from 'body-parser';
import wsRoutes from './routes/wsRoutes';

export function initExpressServer(port:number,options?:{
    routes?:{path:string,route:any}[],
    publicPath?:string,
    enableSwagger?:boolean
}){
    const app = express();
    const publicPath = options?.publicPath||path.join(__dirname, 'public')
    app.set('view engine', 'ejs');
    app.set('views', publicPath);
    app.use('/static', express.static(path.join(publicPath,"static"),{
        dotfiles: 'ignore',     // how to treat dotfiles (hidden files)
        etag: true,             // enable or disable etag generation
        index: false,           // disable directory index
        maxAge: '1d',           // set cache-control max-age header
        redirect: false,        // redirect to trailing "/" when pathname is a dir
        }));

    app.use(
        cors({
            origin: ['*'], // Allow only specific origin
            methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
            allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
            credentials: true // Allow cookies/auth headers
        })
    );

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use('/ws', wsRoutes);
    if(options && options.routes){
        for (const route of options.routes) {
            app.use(route.path, route.route);
        }
    }
    app.get('/capture/page', (req, res) => {
        const {windowId,x,y,width,height} = req.query
        res.render('capture_page', { 
            windowId,
            x,y,width,height
        });
    });
    if(options?.enableSwagger){
        // Swagger 配置选项
        const swaggerOptions = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'CiCi API Documentation', // 文档标题
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
            apis: [__dirname+'/routes/*Routes.ts']
        };
        const swaggerSpec = swaggerJSDoc(swaggerOptions)
        app.get('/swagger.json', function (req, res) {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });
        app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
    }
    console.log(`[+] HttpServer listen at http://localhost:${port}`)
    return createServer(app);
}
