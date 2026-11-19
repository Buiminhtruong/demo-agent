import { validate } from 'class-validator';
import { MaxBytes, PASSWORD_MAX_BYTES, PASSWORD_TOO_LONG } from './max-bytes';

class Sample {
  @MaxBytes(PASSWORD_MAX_BYTES, { message: PASSWORD_TOO_LONG })
  password: unknown;
}

async function errorsFor(password: unknown) {
  const s = new Sample();
  s.password = password;
  return validate(s);
}

describe('MaxBytes', () => {
  it('chuỗi ASCII đúng 72 byte → hợp lệ', async () => {
    expect(await errorsFor('a'.repeat(72))).toHaveLength(0);
  });

  it('chuỗi ASCII 73 byte → bị từ chối', async () => {
    expect(await errorsFor('a'.repeat(73))).toHaveLength(1);
  });

  it('25 ký tự tiếng Việt 3 byte (75 byte) → bị từ chối với thông báo tiếng Việt', async () => {
    const pw = 'ệ'.repeat(25); // "ệ" chiếm 3 byte UTF-8
    expect(pw).toHaveLength(25);
    const errors = await errorsFor(pw);
    expect(errors).toHaveLength(1);
    expect(Object.values(errors[0].constraints ?? {})).toEqual([PASSWORD_TOO_LONG]);
  });

  it('24 ký tự tiếng Việt 3 byte (72 byte) → hợp lệ', async () => {
    expect(await errorsFor('ệ'.repeat(24))).toHaveLength(0);
  });
});
