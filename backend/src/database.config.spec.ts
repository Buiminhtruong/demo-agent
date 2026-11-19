import { shouldSynchronize } from './database.config';

describe('shouldSynchronize', () => {
  it('bật khi NODE_ENV là development hoặc test', () => {
    expect(shouldSynchronize('development')).toBe(true);
    expect(shouldSynchronize('test')).toBe(true);
  });

  it('tắt khi production, giá trị lạ hoặc thiếu NODE_ENV', () => {
    expect(shouldSynchronize('production')).toBe(false);
    expect(shouldSynchronize('staging')).toBe(false);
    expect(shouldSynchronize(undefined)).toBe(false);
    expect(shouldSynchronize('')).toBe(false);
  });
});
