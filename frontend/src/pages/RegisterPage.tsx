import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ email, password, fullName, phone, role });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
      setBusy(false);
    }
  }

  return (
    <div className="wrap auth-box">
      <h1>Đăng ký</h1>
      <form className="form box" onSubmit={onSubmit}>
        <fieldset className="roles">
          <legend>Vai trò</legend>
          <label className="radio">
            <input type="radio" name="role" checked={role === 'tenant'} onChange={() => setRole('tenant')} />
            Tôi là người thuê
          </label>
          <label className="radio">
            <input type="radio" name="role" checked={role === 'landlord'} onChange={() => setRole('landlord')} />
            Tôi là chủ trọ
          </label>
        </fieldset>
        <label>
          Họ và tên
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Số điện thoại
          <input
            type="tel"
            required
            pattern="[0-9]{9,11}"
            title="Số điện thoại gồm 9–11 chữ số"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <p className="note">Mật khẩu từ 8 đến 72 ký tự.</p>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit" disabled={busy}>
          Đăng ký
        </button>
        <p className="note">
          Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
