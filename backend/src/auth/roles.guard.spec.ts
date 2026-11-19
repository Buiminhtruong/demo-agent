import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class DemoController {
  @Roles('admin')
  adminOnly() {}

  open() {}
}

function contextFor(handler: () => void, user?: { role: string }) {
  return {
    getHandler: () => handler,
    getClass: () => DemoController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const proto = DemoController.prototype;

  it('không có @Roles thì cho qua', () => {
    expect(guard.canActivate(contextFor(proto.open))).toBe(true);
  });

  it('đúng vai trò thì cho qua', () => {
    expect(
      guard.canActivate(contextFor(proto.adminOnly, { role: 'admin' })),
    ).toBe(true);
  });

  it('sai vai trò → 403', () => {
    expect(() =>
      guard.canActivate(contextFor(proto.adminOnly, { role: 'tenant' })),
    ).toThrow(ForbiddenException);
  });

  it('chưa có user → 403', () => {
    expect(() => guard.canActivate(contextFor(proto.adminOnly))).toThrow(
      ForbiddenException,
    );
  });
});
