import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import data from './data/vn-locations.json';
import { District } from './district.entity';
import { Province } from './province.entity';

interface LocationData {
  code: string;
  name: string;
  districts: { code: string; name: string }[];
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'vi', { numeric: true });

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Province) private readonly provinces: Repository<Province>,
    @InjectRepository(District) private readonly districts: Repository<District>,
  ) {}

  async listProvinces(): Promise<Province[]> {
    return (await this.provinces.find()).sort(byName);
  }

  async listDistricts(provinceCode: string): Promise<District[]> {
    const province = await this.provinces.findOneBy({ code: provinceCode });
    if (!province) throw new NotFoundException('Không tìm thấy tỉnh/thành');
    return (await this.districts.find({ where: { provinceCode } })).sort(byName);
  }

  // Nạp (upsert theo mã) — chạy lại không tạo trùng.
  async seed(list: LocationData[]): Promise<void> {
    await this.provinces.upsert(
      list.map(({ code, name }) => ({ code, name })),
      ['code'],
    );
    await this.districts.upsert(
      list.flatMap((p) =>
        p.districts.map((d) => ({ code: d.code, name: d.name, provinceCode: p.code })),
      ),
      ['code'],
    );
  }

  seedFromFile(): Promise<void> {
    return this.seed(data as LocationData[]);
  }
}
