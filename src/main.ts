import * as config from 'config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const host: string = config.get('server.host');
    const port: number = config.get('server.port');

    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.listen(port, host);
}

bootstrap();
