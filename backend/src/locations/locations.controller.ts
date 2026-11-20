import { Controller, Get, Param } from '@nestjs/common';
import { LocationsService } from './locations.service';

// Công khai: ai cũng xem được danh sách tỉnh/thành, quận/huyện.
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('provinces')
  provinces() {
    return this.locations.listProvinces();
  }

  @Get('provinces/:code/districts')
  districts(@Param('code') code: string) {
    return this.locations.listDistricts(code);
  }
}
