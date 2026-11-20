import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { PASSWORD_TOO_LONG, passwordTooLong } from '../auth/password';
import { errorText } from '../rooms';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    if (passwordTooLong(newPassword)) {
      setError(PASSWORD_TOO_LONG);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api<void>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap auth-box">
      <h1>Đổi mật khẩu</h1>
      <form className="form box" onSubmit={onSubmit}>
        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <p className="note">Mật khẩu mới ít nhất 8 ký tự, tối đa 72 byte (chữ có dấu tính 2–3 byte).</p>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {done && (
          <div className="success" role="status">
            Đã đổi mật khẩu
          </div>
        )}
        <button className="btn" type="submit" disabled={busy}>
          Đổi mật khẩu
        </button>
      </form>
    </div>
  );
}
