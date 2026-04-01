export type GeoCoords = { latitude: number; longitude: number };

export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GPS indisponível neste dispositivo ou navegador."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err: GeolocationPositionError) => {
        if (err.code === 1) {
          reject(new Error("Permissão de localização negada. Ative o GPS e permita o acesso."));
        } else if (err.code === 2) {
          reject(new Error("Localização indisponível. Verifique se o GPS está ligado."));
        } else if (err.code === 3) {
          reject(new Error("Tempo esgotado ao obter GPS. Tente novamente ao ar livre."));
        } else {
          reject(new Error("Não foi possível obter a localização."));
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
