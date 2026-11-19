import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../users/role';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { jwtSecret } from './jwt-secret';

export interface JwtPayload {
  sub: number;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  // Đọc lại user từ DB mỗi yêu cầu: bị xoá hoặc bị khoá thì mất quyền ngay, không chờ token hết hạn.
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.isLocked) throw new UnauthorizedException();
    return user;
  }
}
