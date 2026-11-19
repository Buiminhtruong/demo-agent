import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../users/user.entity';

// Có token hợp lệ thì gắn req.user; không có token (hoặc token hỏng/hết hạn, user bị khoá)
// thì coi như khách. Lỗi khác (vd DB) vẫn ném ra.
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(err: unknown, user: TUser | false): TUser {
    if (err && !(err instanceof UnauthorizedException)) throw err;
    return (user || undefined) as TUser;
  }
}
