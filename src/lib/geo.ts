// Mock GPS helpers — used until backend exposes real positions.
// Deterministic per-id so the same delivery always lands at the same spot.

const DOUALA: [number, number] = [4.0511, 9.7679];
const YAOUNDE: [number, number] = [3.848, 11.5021];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function cityCenter(city?: string): [number, number] {
  return city?.toLowerCase().includes("yaound") ? YAOUNDE : DOUALA;
}

/** Stable lat/lng around the city center for a given id. */
export function mockCoord(id: string, city?: string, spread = 0.04): [number, number] {
  const [lat, lng] = cityCenter(city);
  const h = hash(id);
  const dLat = ((h % 1000) / 1000 - 0.5) * spread * 2;
  const dLng = (((h >> 10) % 1000) / 1000 - 0.5) * spread * 2;
  return [lat + dLat, lng + dLng];
}

/** A pickup→drop pair: restaurant near city center, client a bit further out. */
export function mockTrip(
  id: string,
  city?: string
): { rider: [number, number]; restaurant: [number, number]; client: [number, number] } {
  const restaurant = mockCoord(id + "-r", city, 0.02);
  const client = mockCoord(id + "-c", city, 0.05);
  // Rider is currently somewhere along the route
  const t = ((hash(id) % 100) / 100) * 0.7 + 0.15;
  const rider: [number, number] = [
    restaurant[0] + (client[0] - restaurant[0]) * t,
    restaurant[1] + (client[1] - restaurant[1]) * t,
  ];
  return { rider, restaurant, client };
}
