import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../users/user.entity';
import {
  CreateRoomDto,
  MyRoomDto,
  ReorderPhotosDto,
  RoomDto,
  UpdateRoomDto,
} from './dto/room.dto';
import { MyRoomsService } from './my-rooms.service';
import {
  PhotoUploadInterceptor,
  UploadedPhoto,
} from './photo-upload.interceptor';
import { ParsePhotoIdPipe, ParseRoomIdPipe } from './room-id.pipe';

@Controller('my/rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('landlord')
export class MyRoomsController {
  constructor(private readonly myRooms: MyRoomsService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<MyRoomDto[]> {
    return this.myRooms.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomDto> {
    return this.myRooms.create(user.id, dto);
  }

  @Get(':id')
  get(
    @CurrentUser() user: User,
    @Param('id', ParseRoomIdPipe) id: number,
  ): Promise<RoomDto> {
    return this.myRooms.get(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseRoomIdPipe) id: number,
    @Body() dto: UpdateRoomDto,
  ): Promise<RoomDto> {
    return this.myRooms.update(user.id, id, dto);
  }

  @Post(':id/photos')
  @UseInterceptors(PhotoUploadInterceptor)
  addPhotos(
    @CurrentUser() user: User,
    @Param('id', ParseRoomIdPipe) id: number,
    @UploadedFiles() files: UploadedPhoto[] | undefined,
  ): Promise<RoomDto> {
    return this.myRooms.addPhotos(user.id, id, files);
  }

  @Put(':id/photos/order')
  reorderPhotos(
    @CurrentUser() user: User,
    @Param('id', ParseRoomIdPipe) id: number,
    @Body() dto: ReorderPhotosDto,
  ): Promise<RoomDto> {
    return this.myRooms.reorderPhotos(user.id, id, dto.photoIds);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(
    @CurrentUser() user: User,
    @Param('id', ParseRoomIdPipe) id: number,
    @Param('photoId', ParsePhotoIdPipe) photoId: number,
  ): Promise<RoomDto> {
    return this.myRooms.deletePhoto(user.id, id, photoId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseRoomIdPipe) id: number,
  ): Promise<void> {
    return this.myRooms.softDelete(user.id, id);
  }
}
