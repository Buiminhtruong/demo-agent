import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { District, Province, Room } from '../api/types';
import { NO_PHOTO_WARNING, errorText, statusLabels, validatePhotoFiles, validateRoom } from '../rooms';

const EMPTY = { title: '', description: '', price: '', area: '', provinceCode: '', districtCode: '', address: '' };

function photoForm(files: File[]): FormData {
  const form = new FormData();
  files.forEach((f) => form.append('photos', f));
  return form;
}

// Key theo đường dẫn: sang /moi hoặc sang phòng khác thì form dựng lại từ đầu, không giữ dữ liệu cũ.
export function RoomFormRoute() {
  const { id } = useParams();
  return <RoomFormPage key={id ?? 'moi'} />;
}

export default function RoomFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const location = useLocation();

  const [fields, setFields] = useState(EMPTY);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState(
    (location.state as { photoError?: string } | null)?.photoError ?? '',
  );
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Lỗi ảnh chỉ hiện một lần: đã đọc vào state thì xoá khỏi location để không hiện lại sau khi tải lại trang.
  useEffect(() => {
    if ((location.state as { photoError?: string } | null)?.photoError) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let cancelled = false;
    api<Province[]>('/api/locations/provinces')
      .then((list) => !cancelled && setProvinces(list))
      .catch((err) => !cancelled && setError(errorText(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoading(true);
    api<Room>(`/api/my/rooms/${id}`)
      .then((r) => {
        if (cancelled) return;
        setRoom(r);
        setFields({
          title: r.title,
          description: r.description ?? '',
          price: String(r.price),
          area: String(r.area),
          provinceCode: r.provinceCode,
          districtCode: r.districtCode,
          address: r.address,
        });
      })
      .catch((err) => !cancelled && setError(errorText(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  useEffect(() => {
    if (!fields.provinceCode) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    api<District[]>(`/api/locations/provinces/${fields.provinceCode}/districts`)
      .then((list) => !cancelled && setDistricts(list))
      .catch((err) => !cancelled && setError(errorText(err)));
    return () => {
      cancelled = true;
    };
  }, [fields.provinceCode]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setSaved(false);
    setFields((f) => ({ ...f, [key]: value }));
  }

  function onProvinceChange(code: string) {
    setSaved(false);
    setDistricts([]);
    setFields((f) => ({ ...f, provinceCode: code, districtCode: '' }));
  }

  function payload() {
    return {
      title: fields.title.trim(),
      description: fields.description,
      price: Number(fields.price),
      area: Number(fields.area),
      provinceCode: fields.provinceCode,
      districtCode: fields.districtCode,
      address: fields.address.trim(),
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const problem = validateRoom(fields);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (isEdit) {
        const updated = await api<Room>(`/api/my/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(payload()) });
        setRoom(updated);
        setSaved(true);
        return;
      }
      const created = await api<Room>('/api/my/rooms', { method: 'POST', body: JSON.stringify(payload()) });
      if (pending.length > 0) {
        try {
          await api<Room>(`/api/my/rooms/${created.id}/photos`, { method: 'POST', body: photoForm(pending) });
        } catch (err) {
          navigate(`/chu-tro/phong/${created.id}`, {
            state: { photoError: `Phòng đã được lưu nhưng tải ảnh lỗi: ${errorText(err)}` },
          });
          return;
        }
      }
      navigate('/chu-tro/phong');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onPickPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const existing = isEdit ? (room?.photos.length ?? 0) : pending.length;
    const problem = validatePhotoFiles(files, existing);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    setPhotoError('');
    if (!isEdit) {
      setPending((p) => [...p, ...files]);
      return;
    }
    setBusy(true);
    try {
      setRoom(await api<Room>(`/api/my/rooms/${id}/photos`, { method: 'POST', body: photoForm(files) }));
    } catch (err) {
      setPhotoError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photoId: number) {
    setPhotoError('');
    setBusy(true);
    try {
      setRoom(await api<Room>(`/api/my/rooms/${id}/photos/${photoId}`, { method: 'DELETE' }));
    } catch (err) {
      setPhotoError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function movePhoto(index: number, delta: -1 | 1) {
    if (!room) return;
    const ids = room.photos.map((p) => p.id);
    const target = index + delta;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setPhotoError('');
    setBusy(true);
    try {
      setRoom(await api<Room>(`/api/my/rooms/${id}/photos/order`, { method: 'PUT', body: JSON.stringify({ photoIds: ids }) }));
    } catch (err) {
      setPhotoError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function movePending(index: number, delta: -1 | 1) {
    setPending((list) => {
      const next = [...list];
      const target = index + delta;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  if (loading) return <p className="wrap">Đang tải...</p>;
  if (isEdit && !room) {
    return (
      <div className="wrap">
        <div className="error" role="alert">
          {error || 'Không tìm thấy phòng'}
        </div>
        <p>
          <Link to="/chu-tro/phong">← Về Phòng của tôi</Link>
        </p>
      </div>
    );
  }

  const photoCount = isEdit ? (room?.photos.length ?? 0) : pending.length;

  return (
    <div className="wrap room-form">
      <h1>{isEdit ? 'Sửa phòng' : 'Đăng phòng mới'}</h1>
      {room && (
        <div className="badges">
          {statusLabels(room).map((label) => (
            <span key={label} className={`badge ${label === 'Bị admin ẩn' ? 'bad' : label === 'Đang ẩn' ? 'warn' : label === 'Đã cho thuê' ? 'muted' : 'ok'}`}>
              {label}
            </span>
          ))}
        </div>
      )}
      {room?.hiddenByAdmin && (
        <div className="error">Phòng đang bị quản trị viên ẩn khỏi trang tìm kiếm. Bạn vẫn có thể chỉnh sửa thông tin.</div>
      )}
      <form className="form box" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="rf-title">Tiêu đề</label>
          <input id="rf-title" value={fields.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rf-desc">Mô tả</label>
          <textarea id="rf-desc" rows={5} value={fields.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="rf-price">Giá (đồng/tháng)</label>
            <input id="rf-price" inputMode="numeric" value={fields.price} onChange={(e) => set('price', e.target.value)} />
            <p className="note">Nhập số, không dấu chấm (vd 3200000)</p>
          </div>
          <div className="field">
            <label htmlFor="rf-area">Diện tích (m²)</label>
            <input id="rf-area" inputMode="numeric" value={fields.area} onChange={(e) => set('area', e.target.value)} />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="rf-province">Tỉnh/Thành phố</label>
            <select id="rf-province" value={fields.provinceCode} onChange={(e) => onProvinceChange(e.target.value)}>
              <option value="">Chọn tỉnh/thành phố</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rf-district">Quận/Huyện</label>
            <select id="rf-district" value={fields.districtCode} onChange={(e) => set('districtCode', e.target.value)}>
              <option value="">Chọn quận/huyện</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="rf-address">Địa chỉ</label>
          <input id="rf-address" value={fields.address} onChange={(e) => set('address', e.target.value)} />
        </div>

        <section className="photos">
          <h2>Ảnh phòng</h2>
          {photoCount === 0 && <div className="warn-note">{NO_PHOTO_WARNING}</div>}
          <ul className="photo-list">
            {isEdit
              ? room?.photos.map((p, i) => (
                  <li key={p.id}>
                    <img src={p.url} alt={`Ảnh ${i + 1}`} />
                    {i === 0 && <span className="badge ok">Ảnh đại diện</span>}
                    <div className="actions">
                      <button type="button" className="btn ghost sm" disabled={busy || i === 0} aria-label={`Chuyển ảnh ${i + 1} lên`} onClick={() => movePhoto(i, -1)}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={busy || i === photoCount - 1}
                        aria-label={`Chuyển ảnh ${i + 1} xuống`}
                        onClick={() => movePhoto(i, 1)}
                      >
                        ↓
                      </button>
                      <button type="button" className="btn danger sm" disabled={busy} aria-label={`Xoá ảnh ${i + 1}`} onClick={() => removePhoto(p.id)}>
                        Xoá
                      </button>
                    </div>
                  </li>
                ))
              : pending.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    <span className="file-name">{f.name}</span>
                    {i === 0 && <span className="badge ok">Ảnh đại diện</span>}
                    <div className="actions">
                      <button type="button" className="btn ghost sm" disabled={i === 0} aria-label={`Chuyển ảnh ${i + 1} lên`} onClick={() => movePending(i, -1)}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={i === pending.length - 1}
                        aria-label={`Chuyển ảnh ${i + 1} xuống`}
                        onClick={() => movePending(i, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn danger sm"
                        aria-label={`Xoá ảnh ${i + 1}`}
                        onClick={() => setPending((list) => list.filter((_, j) => j !== i))}
                      >
                        Xoá
                      </button>
                    </div>
                  </li>
                ))}
          </ul>
          <div className="field">
            <label htmlFor="rf-photos">Thêm ảnh</label>
            <input id="rf-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={onPickPhotos} />
          </div>
          <p className="note">JPG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB, tối đa 10 ảnh. Ảnh đầu tiên là ảnh đại diện.</p>
          {photoError && (
            <div className="error" role="alert">
              {photoError}
            </div>
          )}
        </section>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {saved && (
          <div className="success" role="status">
            Đã lưu
          </div>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {isEdit ? 'Lưu thay đổi' : 'Đăng phòng'}
        </button>
      </form>
    </div>
  );
}
