import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Search, Play, Pause, Upload, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoMusic } from "@/lib/store";

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  source: "audius" | "jamendo" | "device";
  duration?: number;
}

interface MusicPickerProps {
  value: VideoMusic | null;
  onChange: (music: VideoMusic | null) => void;
}

const JAMENDO_KEY = "e4ff0d94";
let audiusHost = "";

async function getAudiusHost(): Promise<string> {
  if (audiusHost) return audiusHost;
  try {
    const r = await fetch("https://api.audius.co", { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    audiusHost = d.data?.[0] || "https://discoveryprovider.audius.co";
  } catch {
    audiusHost = "https://discoveryprovider.audius.co";
  }
  return audiusHost;
}

async function fetchAudiusTrending(): Promise<Track[]> {
  try {
    const host = await getAudiusHost();
    const r = await fetch(`${host}/v1/tracks/trending?limit=20&app_name=cumbear`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    return (d.data || []).map((t: any) => ({
      id: t.id,
      name: t.title,
      artist: t.user?.name || "Unknown",
      url: `${host}/v1/tracks/${t.id}/stream?app_name=cumbear`,
      source: "audius" as const,
      duration: t.duration,
    }));
  } catch { return []; }
}

async function searchAudius(q: string): Promise<Track[]> {
  try {
    const host = await getAudiusHost();
    const r = await fetch(`${host}/v1/tracks/search?query=${encodeURIComponent(q)}&limit=20&app_name=cumbear`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    return (d.data || []).map((t: any) => ({
      id: t.id,
      name: t.title,
      artist: t.user?.name || "Unknown",
      url: `${host}/v1/tracks/${t.id}/stream?app_name=cumbear`,
      source: "audius" as const,
      duration: t.duration,
    }));
  } catch { return []; }
}

async function fetchJamendo(): Promise<Track[]> {
  try {
    const r = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_KEY}&format=json&limit=20&order=popularity_total&include=musicinfo&audioformat=mp31`,
      { signal: AbortSignal.timeout(8000) }
    );
    const d = await r.json();
    return (d.results || []).map((t: any) => ({
      id: `j-${t.id}`,
      name: t.name,
      artist: t.artist_name,
      url: t.audio,
      source: "jamendo" as const,
      duration: t.duration,
    }));
  } catch { return []; }
}

async function searchJamendo(q: string): Promise<Track[]> {
  try {
    const r = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_KEY}&format=json&limit=20&search=${encodeURIComponent(q)}&audioformat=mp31`,
      { signal: AbortSignal.timeout(8000) }
    );
    const d = await r.json();
    return (d.results || []).map((t: any) => ({
      id: `j-${t.id}`,
      name: t.name,
      artist: t.artist_name,
      url: t.audio,
      source: "jamendo" as const,
    }));
  } catch { return []; }
}

function fmtDur(s?: number) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function MusicPicker({ value, onChange }: MusicPickerProps) {
  const [tab, setTab] = useState<"trending" | "search" | "device">("trending");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [volume, setVolume] = useState(value?.volume ?? 0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setPreviewId(null);
  }, []);

  const togglePreview = (track: Track) => {
    if (previewId === track.id) { stopPreview(); return; }
    stopPreview();
    const audio = new Audio(track.url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPreviewId(track.id);
    audio.onended = () => setPreviewId(null);
  };

  useEffect(() => () => stopPreview(), [stopPreview]);

  // Load trending on mount + tab change
  useEffect(() => {
    if (tab === "search" || tab === "device") return;
    setLoading(true);
    Promise.all([fetchAudiusTrending(), fetchJamendo()])
      .then(([audius, jamendo]) => setTracks([...audius, ...jamendo]))
      .finally(() => setLoading(false));
  }, [tab]);

  // Search debounce
  useEffect(() => {
    if (tab !== "search" || !searchQuery.trim()) { if (tab === "search") setTracks([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const [a, j] = await Promise.all([searchAudius(searchQuery), searchJamendo(searchQuery)]);
      setTracks([...a, ...j]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery, tab]);

  const selectTrack = (track: Track) => {
    stopPreview();
    onChange({ name: track.name, artist: track.artist, url: track.url, volume, source: track.source });
  };

  const handleDeviceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    onChange({ name: f.name.replace(/\.[^.]+$/, ""), url, volume, source: "device" });
    e.target.value = "";
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (value) onChange({ ...value, volume: v });
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <Music className="w-4 h-4 text-primary" />
        <span className="font-semibold text-white text-sm">Background Music</span>
        {value && (
          <span className="ml-auto text-xs text-muted-foreground truncate max-w-[160px]">
            🎵 {value.name}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["trending", "search", "device"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold capitalize transition-colors",
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-white"
            )}
          >
            {t === "trending" ? "Trending" : t === "search" ? "Search" : "My Device"}
          </button>
        ))}
      </div>

      {/* Search bar */}
      {tab === "search" && (
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search songs, artists..."
              className="w-full bg-background text-white text-sm pl-8 pr-3 py-2 rounded-lg border border-border focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* Device upload */}
      {tab === "device" && (
        <div className="p-4">
          <input ref={deviceInputRef} type="file" accept="audio/*" onChange={handleDeviceFile} className="hidden" />
          <button
            onClick={() => deviceInputRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-white transition-colors"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Upload audio from device</span>
            <span className="text-xs">MP3, WAV, M4A supported</span>
          </button>
        </div>
      )}

      {/* Track list */}
      {(tab === "trending" || tab === "search") && (
        <div className="max-h-52 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {tab === "search" && !searchQuery ? "Type to search…" : "No tracks found"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tracks.map(track => (
                <div
                  key={track.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors",
                    value?.name === track.name && value?.artist === track.artist && "bg-primary/10"
                  )}
                >
                  <button
                    onClick={() => togglePreview(track)}
                    className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
                  >
                    {previewId === track.id
                      ? <Pause className="w-3 h-3 text-primary" />
                      : <Play className="w-3 h-3 text-white ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => selectTrack(track)}>
                    <p className="text-white text-sm font-medium truncate">{track.name}</p>
                    <p className="text-muted-foreground text-xs truncate">{track.artist}{track.duration ? ` · ${fmtDur(track.duration)}` : ""}</p>
                  </div>
                  {value?.url === track.url ? (
                    <button onClick={() => onChange(null)} className="text-primary text-xs font-semibold">✓ Selected</button>
                  ) : (
                    <button onClick={() => selectTrack(track)} className="text-xs text-muted-foreground hover:text-white px-2 py-1 rounded-lg border border-border hover:border-primary transition-colors">Use</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected track + volume */}
      {value && (
        <div className="px-4 py-3 border-t border-border bg-primary/5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{value.name}</p>
              {value.artist && <p className="text-muted-foreground text-xs truncate">{value.artist}</p>}
            </div>
            <button onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              type="range" min={0.01} max={1} step={0.01} value={volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              className="flex-1 h-1 accent-primary cursor-pointer"
            />
            <span className="text-muted-foreground text-xs w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
