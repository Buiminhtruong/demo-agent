import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function onLogout() {
    setOpen(false);
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <Link className="logo" to="/">
        🏠 ThuêPhòng
      </Link>
      <nav>
        {!user && (
          <>
            <Link to="/tim-phong">Tìm phòng</Link>
            <Link to="/dang-nhap">Đăng nhập</Link>
            <Link className="btn sm" to="/dang-ky">
              Đăng ký
            </Link>
          </>
        )}
        {user?.role === 'tenant' && (
          <>
            <Link to="/tim-phong">Tìm phòng</Link>
            <Link to="/lich-hen">Lịch hẹn của tôi</Link>
          </>
        )}
        {user?.role === 'landlord' && (
          <>
            <Link to="/chu-tro/phong">Phòng của tôi</Link>
            <Link to="/chu-tro/lich-hen">Lịch hẹn</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/phong">Quản lý tin</Link>
            <Link to="/admin/tai-khoan">Quản lý tài khoản</Link>
          </>
        )}
        {user && (
          <div className="user-menu">
            <button type="button" className="btn ghost sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <span>{user.fullName}</span> ▾
            </button>
            {open && (
              <div className="menu">
                <Link to="/doi-mat-khau" onClick={() => setOpen(false)}>
                  Đổi mật khẩu
                </Link>
                <button type="button" onClick={onLogout}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
