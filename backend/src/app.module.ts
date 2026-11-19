import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { typeOrmOptions } from './database.config';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions }),
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
