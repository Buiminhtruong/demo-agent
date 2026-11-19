import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('trả về { ok: true }', () => {
    expect(new HealthController().check()).toEqual({ ok: true });
  });
});
