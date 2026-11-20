import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Room } from '../api/types';
import { DELETE_CONFIRM, NO_PHOTO_WARNING, errorText, formatPrice, statusLabels } from '../rooms';

export default function MyRoomsPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<Room[]>('/api/my/rooms')
      .then((list) => {
        if (!cancelled) setRooms(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(errorText(err));
          setRooms([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(room: Room, changes: Partial<Pick<Room, 'status' | 'hiddenByOwner'>>) {
    setError('');
    setBusyId(room.id);
    try {
      const updated = await api<Room>(`/api/my/rooms/${room.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      // Giữ số lịch hẹn chờ duyệt nếu phản hồi PATCH không kèm theo.
      setRooms((list) =>
        (list ?? []).map((r) =>
          r.id === room.id ? { ...updated, pendingAppointmentCount: updated.pendingAppointmentCount ?? r.pendingAppointmentCount } : r,
        ),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(room: Room) {
    if (!window.confirm(DELETE_CONFIRM)) return;
    setError('');
    setBusyId(room.id);
    try {
      await api<void>(`/api/my/rooms/${room.id}`, { method: 'DELETE' });
      setRooms((list) => (list ?? []).filter((r) => r.id !== room.id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Phòng của tôi</h1>
        <Link className="btn" to="/chu-tro/phong/moi">
          Đăng phòng mới
        </Link>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {rooms === null && <p>Đang tải...</p>}
      {rooms?.length === 0 && !error && <p className="box">Bạn chưa đăng phòng nào</p>}
      <ul className="room-list">
        {rooms?.map((room) => {
          const cover = room.photos[0];
          const busy = busyId === room.id;
          const pending = room.pendingAppointmentCount ?? 0;
          return (
            <li key={room.id} className="room-card box">
              {cover ? (
                <img className="room-thumb" src={cover.url} alt={`Ảnh đại diện của ${room.title}`} />
              ) : (
                <div className="room-thumb empty">Chưa có ảnh</div>
              )}
              <div className="room-info">
                <h2>{room.title}</h2>
                <div className="price">{formatPrice(room.price)}</div>
                <div className="badges">
                  {statusLabels(room).map((label) => (
                    <span key={label} className={`badge ${label === 'Bị admin ẩn' ? 'bad' : label === 'Đang ẩn' ? 'warn' : label === 'Đã cho thuê' ? 'muted' : 'ok'}`}>
                      {label}
                    </span>
                  ))}
                </div>
                {pending > 0 && <div className="note">{pending} lịch hẹn chờ duyệt</div>}
                {room.photos.length === 0 && <div className="warn-note">{NO_PHOTO_WARNING}</div>}
                <div className="actions">
                  <Link className="btn ghost sm" to={`/chu-tro/phong/${room.id}`}>
                    Sửa
                  </Link>
                  <button className="btn ghost sm" disabled={busy} onClick={() => patch(room, { hiddenByOwner: !room.hiddenByOwner })}>
                    {room.hiddenByOwner ? 'Hiện' : 'Ẩn'}
                  </button>
                  <button
                    className="btn ghost sm"
                    disabled={busy}
                    onClick={() => patch(room, { status: room.status === 'rented' ? 'available' : 'rented' })}
                  >
                    {room.status === 'rented' ? 'Đánh dấu còn trống' : 'Đánh dấu đã cho thuê'}
                  </button>
                  <button className="btn danger sm" disabled={busy} onClick={() => remove(room)}>
                    Xoá
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
