import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/user.entity';

// Lấy req.user do JwtAuthGuard / OptionalJwtGuard gắn vào.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined =>
    context.switchToHttp().getRequest().user,
);
