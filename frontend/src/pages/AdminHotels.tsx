import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

interface HotelRow {
  id: number;
  name: string;
  city: string;
  stars: number;
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
  description: string | null;
  address: string;
  city: string;
  lat: string | null;
  lng: string | null;
  stars: number;
  facilities: string[];
  policies: string | null;
  rooms: RoomDetails[];
}

const emptyForm = {
  name: '',
  city: '',
  address: '',
  stars: 4,
  lat: '',
  lng: '',
  description: '',
  policies: '',
  facilities: '',
  images: '',
  roomType: 'Double',
  capacity: 2,
  price: 100,
  count: 5,
};

type Form = typeof emptyForm;

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

  // Fill the form with an existing hotel, ready to edit
  async function startEdit(id: number) {
    setError('');
    setMessage('');
    try {
      const h = await api<HotelDetails>(`/hotels/${id}`);
      setForm({
        ...emptyForm,
        name: h.name,
        city: h.city,
        address: h.address,
        stars: h.stars,
        lat: h.lat ?? '',
        lng: h.lng ?? '',
        description: h.description ?? '',
        policies: h.policies ?? '',
        facilities: h.facilities.join(', '),
      });
      setRooms(h.rooms);
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Add a new hotel, or save changes to the one being edited
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
      city: form.city,
      address: form.address,
      stars: form.stars,
      description: form.description || undefined,
      policies: form.policies || undefined,
      lat: form.lat ? latNumber : undefined,
      lng: form.lng ? lngNumber : undefined,
      
      facilities: form.facilities.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editingId) {
        await api(`/hotels/${editingId}`, 'PUT', details);
        setMessage('Hotel updated.');
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
            },
          ],
        });
        setMessage('Hotel added.');
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
  if (!isAdmin) return <p>Sorry, this page is for admins only.</p>;

  return (
    <div className="stack">
      <h2>Manage hotels</h2>
      <Link to="/admin">← Back to reservations</Link>
      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="panel wide">
        <h3>{editingId ? 'Edit hotel' : 'Add a hotel'}</h3>
        <div className="formgrid">
          <label>
            Name
            <input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label>
            City
            <input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </label>
          <label>
            Address
            <input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </label>
          <label>
            Stars (1 to 5)
            <input type="number" min="1" max="5" value={form.stars} onChange={(e) => set('stars', Number(e.target.value))} />
          </label>
          <label>
            Latitude (for the map)
            <input value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="-29.8587" />
          </label>
          <label>
            Longitude (for the map)
            <input value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="31.0218" />
          </label>
          <label>
            Facilities (separated by commas)
            <input value={form.facilities} onChange={(e) => set('facilities', e.target.value)} placeholder="WiFi, Pool, Parking" />
          </label>
        </div>
        <label>
          Description
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label>
          Policies
          <textarea value={form.policies} onChange={(e) => set('policies', e.target.value)} />
        </label>

        {!editingId && (
          <>
            <label>
              Photo links (one per line)
              <textarea value={form.images} onChange={(e) => set('images', e.target.value)} placeholder="https://picsum.photos/seed/hotel3/800/500" />
            </label>
            <h4>First room type</h4>
            <div className="formgrid">
              <label>
                Room type
                <input value={form.roomType} onChange={(e) => set('roomType', e.target.value)} />
              </label>
              <label>
                Sleeps
                <input type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', Number(e.target.value))} />
              </label>
              <label>
                Price per night ($)
                <input type="number" min="1" value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
              </label>
              <label>
                Rooms available
                <input type="number" min="0" value={form.count} onChange={(e) => set('count', Number(e.target.value))} />
              </label>
            </div>
          </>
        )}

        <div className="actions">
          <button className="cta" onClick={submitHotel}>
            {editingId ? 'Save changes' : 'Add hotel'}
          </button>
          {editingId && <button onClick={clearForm}>Stop editing</button>}
        </div>

        {editingId && (
          <>
            <h4>Rooms: price and availability</h4>
            {rooms.map((room) => (
              <div key={room.id} className="formgrid">
                <p>
                  <b>{room.type}</b> (sleeps {room.capacity})
                </p>
                <label>
                  Price per night ($)
                  <input
                    type="number"
                    min="1"
                    value={room.price_per_night}
                    onChange={(e) => changeRoom(room.id, 'price_per_night', e.target.value)}
                  />
                </label>
                <label>
                  Rooms available
                  <input
                    type="number"
                    min="0"
                    value={room.total_rooms}
                    onChange={(e) => changeRoom(room.id, 'total_rooms', e.target.value)}
                  />
                </label>
                <button onClick={() => saveRoom(room)}>Save room</button>
              </div>
            ))}
          </>
        )}
      </section>

      <h3>Your hotels</h3>
      {hotels.length === 0 && <p>No hotels yet. Add the first one above.</p>}
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Stars</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.city}</td>
                <td>{'★'.repeat(h.stars)}</td>
                <td>
                  <div className="actions">
                    <button onClick={() => startEdit(h.id)}>Edit</button>
                    <button onClick={() => removeHotel(h)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}