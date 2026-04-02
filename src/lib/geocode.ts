/** Reverse geocoding via rota interna (Nominatim no servidor — evita CORS). */

export type ReverseGeocodeResult = {
  displayName: string;
};

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const qs = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });
  const response = await fetch(`/api/geocode?${qs.toString()}`);

  if (!response.ok) {
    return {
      displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    };
  }

  const data = (await response.json()) as { displayName?: string };
  return {
    displayName:
      typeof data.displayName === "string" && data.displayName.length > 0
        ? data.displayName
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
  };
}
