import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_UA =
  process.env.NOMINATIM_UA ?? "PontoEletronico/1.0 (suporte@exemplo.com)";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (lat == null || lon == null) {
    return NextResponse.json({ error: "lat e lon obrigatórios" }, { status: 400 });
  }

  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    return NextResponse.json({ error: "coordenadas inválidas" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(la));
  url.searchParams.set("lon", String(lo));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_UA,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { displayName: `${la.toFixed(6)}, ${lo.toFixed(6)}`, error: response.statusText },
        { status: 200 }
      );
    }

    const data = (await response.json()) as { display_name?: string };
    const displayName =
      typeof data.display_name === "string" && data.display_name.length > 0
        ? data.display_name
        : `${la.toFixed(6)}, ${lo.toFixed(6)}`;

    return NextResponse.json({ displayName });
  } catch {
    return NextResponse.json(
      { displayName: `${la.toFixed(6)}, ${lo.toFixed(6)}` },
      { status: 200 }
    );
  }
}
