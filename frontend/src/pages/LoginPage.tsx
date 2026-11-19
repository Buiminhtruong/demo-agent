import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Chỉ cho phép đích cùng origin (giải mã như trình duyệt, kể cả ký tự điều khiển), tránh chuyển hướng ra ngoài site. */
export function safeNext(next: string | null): string {
  if (!next) return '/';
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return '/';
    const path = url.pathname + url.search + url.hash;
    // Sau chuẩn hoá, "/.//evil.com" thành "//evil.com": vẫn bị coi là URL ngoài site khi điều hướng.
    if (path.startsWith('//') || path.startsWith('/\\')) return '/';
    return path;
  } catch {
    return '/';
  }
}

export default function LoginPage() {
  const { login, notice } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(safeNext(params.get('next')), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
      setBusy(false);
    }
  }

  return (
    <div className="wrap auth-box">
      <h1>Đăng nhập</h1>
      <form className="form box" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {(error || notice) && (
          <div className="error" role="alert">
            {error || notice}
          </div>
        )}
        <button className="btn" type="submit" disabled={busy}>
          Đăng nhập
        </button>
        <p className="note">
          Chưa có tài khoản? <Link to="/dang-ky">Đăng ký</Link>
        </p>
      </form>
    </div>
  );
}
