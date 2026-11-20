import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { typeOrmOptions } from './database.config';
import { HealthController } from './health.controller';
import { LocationsModule } from './locations/locations.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions }),
    LocationsModule,
    UsersModule,
    AuthModule,
    RoomsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
