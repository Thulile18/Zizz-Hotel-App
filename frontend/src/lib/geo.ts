export interface Point {
  lat: number;
  lng: number;
}

// Straight-line distance between two places on Earth, in kilometres
export function distanceKm(a: Point, b: Point) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km).toLocaleString('en-ZA')} km`;
}

// A stay's coordinates, or null when it has none
export function stayPoint(h: { latitude?: string | number | null; longitude?: string | number | null }): Point | null {
  if (h.latitude == null || h.longitude == null) return null;
  const lat = Number(h.latitude);
  const lng = Number(h.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Where is this visitor right now? (the browser asks permission first)
export function currentPosition(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser cannot share your location. Search for a place instead.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('We could not get your location. Allow location access, or search for a place instead.')),
      { timeout: 10000 },
    );
  });
}

// Finds any town, city, address or landmark in the world (OpenStreetMap's free search)
export async function geocodePlace(query: string): Promise<{ point: Point; label: string } | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) throw new Error('Place search is not available right now. Please try again in a moment.');
  const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  if (results.length === 0) return null;
  const first = results[0];
  return {
    point: { lat: Number(first.lat), lng: Number(first.lon) },
    label: first.display_name.split(',').slice(0, 2).join(',').trim(),
  };
}