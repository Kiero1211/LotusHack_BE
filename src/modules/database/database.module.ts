import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
        autoIndex: true,
        connectionFactory: (connection: Connection) => {
          connection.on('connected', () => {
            Logger.log('MongoDB connected successfully', 'MongoDB');
          });

          connection.on('error', err => {
            Logger.error('MongoDB connection error', err, 'MongoDB');
          });

          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
