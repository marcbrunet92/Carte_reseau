import { NextResponse } from "next/server";
import { fetchUVTiff } from "@/lib/wind/UV_TIFF";
import { API_KEY_METEO, BOUNDS } from "@/config/mapConfig";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface WindCache {
  u: string; // base64
  v: string; // base64
  cachedAt: number;
}

let cache: WindCache | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return btoa(chunks.join(""));
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ u: cache.u, v: cache.v });
  }

  try {
    const [uBuffer, vBuffer] = await fetchUVTiff(API_KEY_METEO, BOUNDS);
    const u = arrayBufferToBase64(uBuffer);
    const v = arrayBufferToBase64(vBuffer);

    cache = { u, v, cachedAt: now };

    return NextResponse.json({ u, v });
  } catch (err) {
    console.error("Wind API fetch failed:", err);
    return NextResponse.json(
      { error: "Impossible de récupérer les données vent" },
      { status: 502 }
    );
  }
}
