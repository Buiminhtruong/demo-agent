import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { shouldSynchronize } from './database.config';
import { HealthController } from './health.controller';

const DEFAULT_DATABASE_URL = 'postgres://app:app@localhost:5432/app';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
        autoLoadEntities: true,
        synchronize: shouldSynchronize(process.env.NODE_ENV),
      }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
