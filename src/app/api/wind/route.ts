import { NextResponse } from "next/server";
import { fetchUVTiff } from "@/lib/wind/UV_TIFF";
import { computeWindRGBA } from "@/lib/wind/main";
import { API_KEY_METEO, BOUNDS } from "@/config/mapConfig";

const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface WindCache {
  rgba: string;  // base64
  width: number;
  height: number;
  imageUnscale: [number, number];
  speedMax: number;
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
    const { cachedAt: _cachedAt, ...payload } = cache;
    return NextResponse.json(payload);
  }

  try {
    const [uBuffer, vBuffer] = await fetchUVTiff(API_KEY_METEO, BOUNDS);
    const { rgba, width, height, imageUnscale, speedMax } = await computeWindRGBA([uBuffer, vBuffer]);

    const rgbaB64 = arrayBufferToBase64(rgba.buffer);

    cache = { rgba: rgbaB64, width, height, imageUnscale, speedMax, cachedAt: now };

    return NextResponse.json({ rgba: rgbaB64, width, height, imageUnscale, speedMax });
  } catch (err) {
    console.error("Wind API fetch failed:", err);
    return NextResponse.json(
      { error: "Impossible de récupérer les données vent" },
      { status: 502 }
    );
  }
}
