import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Bắt buộc có token hợp lệ; gắn req.user (User đọc lại từ DB).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
