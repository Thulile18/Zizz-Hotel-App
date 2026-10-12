import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

interface Room {
  id: number;
  type: string;
  capacity: number;
  price_per_night: string;
  total_rooms: number;
}

interface Review {
  name: string;
  rating: number;
  comment: string | null;
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
  images: string[];
  rooms: Room[];
  reviews: Review[];
}

export default function HotelPage() {
  const { id } = useParams();
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<HotelDetails>(`/hotels/${id}`)
      .then(setHotel)
      .catch((err) => setError((err as Error).message));
  }, [id]);

  async function share() {
    const link = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: hotel?.name, url: link });
    } else {
      await navigator.clipboard.writeText(link);
      setMessage('Link copied. You can paste it to share.');
    }
  }

  if (error) return <p>Sorry: {error}</p>;
  if (!hotel) return <p>Loading hotel...</p>;

  const mapSrc =
    hotel.lat && hotel.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(hotel.lng) - 0.01},${
          Number(hotel.lat) - 0.006
        },${Number(hotel.lng) + 0.01},${Number(hotel.lat) + 0.006}&marker=${hotel.lat},${hotel.lng}`
      : null;

  return (
    <div className="detail">
      <Link to="/">← Back to all hotels</Link>

      <div className="gallery">
        <img className="gallery-main" src={hotel.images[photo]} alt={hotel.name} />
        <div className="thumbs">
          {hotel.images.map((url, i) => (
            <img key={url} src={url} alt="" onClick={() => setPhoto(i)} />
          ))}
        </div>
      </div>

      <h2>
        {hotel.name} <span className="stars">{'★'.repeat(hotel.stars)}</span>
      </h2>
      <p>
        {hotel.address}, {hotel.city}
      </p>
      <button onClick={share}>Share</button>
      {message && <p>{message}</p>}

      {hotel.description && <p>{hotel.description}</p>}

      <h3>Rooms and prices</h3>
      <ul className="rooms">
        {hotel.rooms.map((room) => (
          <li key={room.id}>
            <b>{room.type}</b>: sleeps {room.capacity}, <b>${Number(room.price_per_night)}</b> per
            night
          </li>
        ))}
      </ul>

      <h3>Facilities</h3>
      <ul className="tags">
        {hotel.facilities.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      {hotel.policies && (
        <>
          <h3>Policies</h3>
          <p>{hotel.policies}</p>
        </>
      )}

      {mapSrc && (
        <>
          <h3>Location</h3>
          <iframe className="map" title="Hotel location" src={mapSrc} loading="lazy" />
        </>
      )}

      <h3>Guest reviews</h3>
      {hotel.reviews.length === 0 && <p>No reviews yet.</p>}
      {hotel.reviews.map((r, i) => (
        <p key={i}>
          <b>{r.name}</b> {'★'.repeat(r.rating)}
          <br />
          {r.comment}
        </p>
      ))}
    </div>
  );
}