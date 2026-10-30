import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

interface HotelRow {
  id: number;
  name: string;
  city: string;
  stars: number;
  property_type?: string | null;
}

interface RoomDetails {
  id: number;
  type: string;
  capacity: number;
  price_per_night: string;
  total_rooms: number;
}

interface HotelDetails {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string;
  city: string;
  region: string | null;
  country: string | null;
  lat: string | null;
  lng: string | null;
  stars: number;
  property_type: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  facilities: string[];
  policies: string | null;
  rooms: RoomDetails[];
}

// The kinds of stay you can list. Guests can filter by these.
const PROPERTY_TYPES = [
  'Hotel',
  'Boutique Hotel',
  'Resort',
  'Guesthouse',
  'Bed & Breakfast',
  'Apartment',
  'Villa',
  'Safari Lodge',
  'Lodge',
  'Riad',
  'Ryokan',
  'Country Manor',
  'Villa Resort',
];

const emptyForm = {
  name: '',
  propertyType: 'Hotel',
  tagline: '',
  city: '',
  region: '',
  country: 'South Africa',
  address: '',
  stars: 4,
  lat: '',
  lng: '',
  description: '',
  policies: '',
  facilities: '',
  tags: '',
  featured: false,
  images: '',
  roomType: 'Double',
  capacity: 2,
  price: 1500,
  count: 5,
  roomDescription: '',
  roomAmenities: '',
};

type Form = typeof emptyForm;

const splitList = (text: string) => text.split(',').map((s) => s.trim()).filter(Boolean);

export default function AdminHotels() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<RoomDetails[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function loadHotels() {
    api<HotelRow[]>('/hotels')
      .then(setHotels)
      .catch((err) => setError((err as Error).message));
  }

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isAdmin) loadHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm({ ...form, [key]: value });
  }

  function clearForm() {
    setForm(emptyForm);
    setEditingId(null);
    setRooms([]);
  }

  // Fill the form with an existing stay, ready to edit
  async function startEdit(id: number) {
    setError('');
    setMessage('');
    try {
      const h = await api<HotelDetails>(`/hotels/${id}`);
      setForm({
        ...emptyForm,
        name: h.name,
        propertyType: h.property_type ?? 'Hotel',
        tagline: h.tagline ?? '',
        city: h.city,
        region: h.region ?? '',
        country: h.country ?? '',
        address: h.address,
        stars: h.stars,
        lat: h.lat ?? '',
        lng: h.lng ?? '',
        description: h.description ?? '',
        policies: h.policies ?? '',
        facilities: h.facilities.join(', '),
        tags: (h.tags ?? []).join(', '),
        featured: Boolean(h.is_featured),
      });
      setRooms(h.rooms);
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Add a new stay, or save changes to the one being edited
  async function submitHotel() {
    setError('');
    setMessage('');

    const latNumber = Number(form.lat);
    const lngNumber = Number(form.lng);
    if ((form.lat && Number.isNaN(latNumber)) || (form.lng && Number.isNaN(lngNumber))) {
      setError('Latitude and longitude must be numbers only, like -33.9026 and 18.42235.');
      return;
    }

    const details = {
      name: form.name,
      property_type: form.propertyType,
      tagline: form.tagline || undefined,
      city: form.city,
      region: form.region || undefined,
      country: form.country || undefined,
      address: form.address,
      stars: form.stars,
      is_featured: form.featured,
      tags: splitList(form.tags),
      description: form.description || undefined,
      policies: form.policies || undefined,
      lat: form.lat ? latNumber : undefined,
      lng: form.lng ? lngNumber : undefined,
      facilities: splitList(form.facilities),
    };

    try {
      if (editingId) {
        await api(`/hotels/${editingId}`, 'PUT', details);
        setMessage('Stay updated.');
      } else {
        await api('/hotels', 'POST', {
          ...details,
          images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
          rooms: [
            {
              type: form.roomType,
              capacity: form.capacity,
              price_per_night: form.price,
              total_rooms: form.count,
              description: form.roomDescription || undefined,
              amenities: splitList(form.roomAmenities),
            },
          ],
        });
        setMessage('Stay added.');
        clearForm();
      }
      loadHotels();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Change one room's price and how many rooms are available
  async function saveRoom(room: RoomDetails) {
    setError('');
    setMessage('');
    try {
      await api(`/hotels/rooms/${room.id}`, 'PUT', {
        price_per_night: Number(room.price_per_night),
        total_rooms: Number(room.total_rooms),
      });
      setMessage(`${room.type} room updated.`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function changeRoom(id: number, field: 'price_per_night' | 'total_rooms', value: string) {
    setRooms(rooms.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function removeHotel(h: HotelRow) {
    if (!window.confirm(`Delete ${h.name}? This cannot be undone.`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/hotels/${h.id}`, 'DELETE');
      setMessage(`${h.name} was deleted.`);
      if (editingId === h.id) clearForm();
      loadHotels();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="v-center">
        <div className="v-status-card v-status-card-error">
          <p className="v-error">Sorry, this page is for admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v-page">
      <div className="v-pagehead">
        <div>
          <p className="eyebrow">Inventory control</p>
          <h1 className="v-title">Manage stays</h1>
        </div>
        <Link to="/admin" className="v-textlink">← Back to dashboard</Link>
      </div>

      <div className="v-admin-grid">
        {/* Left: add / edit form and rooms */}
        <div className="v-stack">
          {message && <p className="v-msg v-msg-ok fade-up">{message}</p>}
          {error && <p className="v-msg v-msg-err fade-up">{error}</p>}

          <section className="v-panel fade-up">
            <h3 className="v-panel-title">{editingId ? 'Edit stay' : 'Add a new stay'}</h3>

            <div className="v-form-grid">
              <div className="v-field">
                <label className="v-label">Name</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="v-field">
                <label className="v-label">Type of stay</label>
                <select value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="v-field v-span-2">
                <label className="v-label">Tagline</label>
                <input
                  value={form.tagline}
                  onChange={(e) => set('tagline', e.target.value)}
                  placeholder="A short line guests will see under the name"
                />
              </div>
              <div className="v-field">
                <label className="v-label">City</label>
                <input value={form.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div className="v-field">
                <label className="v-label">Province or state</label>
                <input value={form.region} onChange={(e) => set('region', e.target.value)} />
              </div>
              <div className="v-field">
                <label className="v-label">Country</label>
                <input value={form.country} onChange={(e) => set('country', e.target.value)} />
              </div>
              <div className="v-field">
                <label className="v-label">Stars (1 to 5)</label>
                <input type="number" min="1" max="5" value={form.stars} onChange={(e) => set('stars', Number(e.target.value))} />
              </div>
              <div className="v-field v-span-2">
                <label className="v-label">Address</label>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div className="v-field">
                <label className="v-label">Latitude</label>
                <input value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="-29.8587" />
              </div>
              <div className="v-field">
                <label className="v-label">Longitude</label>
                <input value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="31.0218" />
              </div>
              <div className="v-field v-span-2">
                <label className="v-label">Facilities (comma-separated)</label>
                <input value={form.facilities} onChange={(e) => set('facilities', e.target.value)} placeholder="Wi-Fi, Pool, Parking" />
              </div>
              <div className="v-field v-span-2">
                <label className="v-label">Tags (comma-separated, used for moods)</label>
                <input
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  placeholder="romantic, beach, nature, luxury, city, hidden-gem, family, spa, affordable"
                />
              </div>
              <div className="v-field v-span-2">
                <label className="v-label">Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
              </div>
              <div className="v-field v-span-2">
                <label className="v-label">Policies</label>
                <textarea value={form.policies} onChange={(e) => set('policies', e.target.value)} rows={2} />
              </div>
              <div className="v-check v-span-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                />
                <label htmlFor="featured">Show on the home page as a featured address</label>
              </div>
            </div>

            {!editingId && (
              <div className="v-subsection">
                <h4>First room type</h4>
                <div className="v-rooms-grid">
                  <div className="v-field">
                    <label className="v-label">Room type</label>
                    <input value={form.roomType} onChange={(e) => set('roomType', e.target.value)} />
                  </div>
                  <div className="v-field">
                    <label className="v-label">Sleeps</label>
                    <input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', Number(e.target.value))} />
                  </div>
                  <div className="v-field">
                    <label className="v-label">Price per night (R)</label>
                    <input type="number" min="1" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
                  </div>
                  <div className="v-field">
                    <label className="v-label">Available</label>
                    <input type="number" min="0" value={form.count} onChange={(e) => set('count', Number(e.target.value))} />
                  </div>
                </div>
                <div className="v-field">
                  <label className="v-label">Room description</label>
                  <textarea value={form.roomDescription} onChange={(e) => set('roomDescription', e.target.value)} rows={2} />
                </div>
                <div className="v-field">
                  <label className="v-label">Room amenities (comma-separated)</label>
                  <input value={form.roomAmenities} onChange={(e) => set('roomAmenities', e.target.value)} placeholder="Sea view, Free Wi-Fi, Breakfast included" />
                </div>
                <div className="v-field">
                  <label className="v-label">Photo links (one per line, like /images/my-hotel.jpg)</label>
                  <textarea value={form.images} onChange={(e) => set('images', e.target.value)} rows={3} placeholder="/images/my-hotel-cover.jpg" />
                </div>
              </div>
            )}

            <div className="v-form-actions">
              <button className="v-btn" onClick={submitHotel}>
                {editingId ? 'Save changes' : 'Add stay'}
              </button>
              {editingId && (
                <button className="v-btn v-btn-outline" onClick={clearForm}>
                  Cancel
                </button>
              )}
            </div>
          </section>

          {editingId && rooms.length > 0 && (
            <section className="v-panel fade-up">
              <h3 className="v-panel-title">Rooms</h3>
              <div>
                {rooms.map((r) => (
                  <div key={r.id} className="v-roomrow">
                    <div>
                      <span className="v-cell-main">{r.type}</span>
                      <span className="v-cell-sub">Sleeps up to {r.capacity} guests</span>
                    </div>
                    <div className="v-roomrow-controls">
                      <span className="v-muted">R</span>
                      <input
                        type="number"
                        className="v-input-sm"
                        value={r.price_per_night}
                        onChange={(e) => changeRoom(r.id, 'price_per_night', e.target.value)}
                      />
                      <span className="v-muted">Available:</span>
                      <input
                        type="number"
                        className="v-input-sm"
                        value={r.total_rooms}
                        onChange={(e) => changeRoom(r.id, 'total_rooms', e.target.value)}
                      />
                      <button className="v-linkbtn" onClick={() => saveRoom(r)}>Update</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: list of stays */}
        <div className="v-stack">
          <h3 className="v-panel-title">Your stays</h3>
          {hotels.length === 0 ? (
            <p className="v-muted">No stays yet. Add your first one.</p>
          ) : (
            <div className="v-hotel-list fade-up">
              {hotels.map((h) => (
                <div key={h.id} className="v-hotel-item">
                  <div>
                    <span className="v-cell-main">{h.name}</span>
                    <span className="v-cell-sub">
                      {h.property_type ? `${h.property_type} · ` : ''}
                      {h.city} · <span className="v-gold">{'★'.repeat(h.stars)}</span>
                    </span>
                  </div>
                  <div className="v-row-actions">
                    <button className="v-linkbtn" onClick={() => startEdit(h.id)}>Edit</button>
                    <button className="v-linkbtn muted danger" onClick={() => removeHotel(h)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
