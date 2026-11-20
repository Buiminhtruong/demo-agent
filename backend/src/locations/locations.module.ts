import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { District } from './district.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Province } from './province.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Province, District])],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
