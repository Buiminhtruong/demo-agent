import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { District } from '../locations/district.entity';
import { Province } from '../locations/province.entity';
import { MyRoomsController } from './my-rooms.controller';
import { MyRoomsService } from './my-rooms.service';
import { RoomPhoto } from './room-photo.entity';
import { Room } from './room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomPhoto, Province, District])],
  controllers: [MyRoomsController],
  providers: [MyRoomsService],
  exports: [MyRoomsService],
})
export class RoomsModule {}
