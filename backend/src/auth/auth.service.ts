import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import { PublicUser, toPublicUser } from '../users/public-user';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt.strategy';
import { LoginAttempts } from './login-attempts';
import { hashPassword, verifyPassword } from './password';

export interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(LoginAttempts) private readonly loginAttempts: LoginAttempts,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email đã được sử dụng');
    }
    let user: User;
    try {
      user = await this.usersService.create({
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
      });
    } catch (err) {
      // Hai yêu cầu đăng ký cùng email chạy song song: chỉ mục unique chặn cái sau.
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw err;
    }
    return this.authResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    if (this.loginAttempts.isBlocked(dto.email)) {
      throw new HttpException(
        'Bạn nhập sai quá nhiều lần, thử lại sau 15 phút',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      this.loginAttempts.recordFailure(dto.email);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.isLocked) {
      throw new ForbiddenException('Tài khoản đã bị khoá');
    }
    this.loginAttempts.reset(dto.email);
    return this.authResult(user);
  }

  async changePassword(user: User, dto: ChangePasswordDto): Promise<void> {
    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    await this.usersService.updatePasswordHash(
      user.id,
      await hashPassword(dto.newPassword),
    );
  }

  private async authResult(user: User): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: toPublicUser(user),
    };
  }
}
