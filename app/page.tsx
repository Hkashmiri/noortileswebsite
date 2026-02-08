"use client";

import Image from "next/image";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const LEVELS = [
  {
    id: 1,
    name: "Moonlight Minarets",
    tempo: "Chill",
    track: "Sabr & Shukr",
    interval: 0.5,
    speed: 0.85,
    totalTiles: 40,
    audio: "/nasheeds/elheva.mp3",
  },
  {
    id: 2,
    name: "Golden Horizon",
    tempo: "Bright",
    track: "Light of Noor",
    interval: 0.42,
    speed: 0.95,
    totalTiles: 50,
    audio: "/nasheeds/elrahed.mp3",
  },
  {
    id: 3,
    name: "Star Caravan",
    tempo: "Fast",
    track: "Barakah Breeze",
    interval: 0.36,
    speed: 1.05,
    totalTiles: 60,
    audio: "/nasheeds/elsekat.mp3",
  },
];

const COLUMNS = 4;

type Tile = {
  id: number;
  column: number;
  y: number;
  hit: boolean;
};

type GameStatus = "idle" | "playing" | "ended";

type ProgressMap = Record<number, number>;

const starArray = (count: number) => Array.from({ length: count }, (_, i) => i);

const getStars = (hits: number, total: number) => {
  const accuracy = total === 0 ? 0 : hits / total;
  if (accuracy >= 0.85) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.5) return 1;
  return 0;
};

const createUserId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `noor-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

export default function Home() {
  const [activeLevel, setActiveLevel] = useState(LEVELS[0]);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [hits, setHits] = useState(0);
  const [tilesSpawned, setTilesSpawned] = useState(0);
  const [boardHeight, setBoardHeight] = useState(480);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const spawnTimerRef = useRef(0);
  const nextTileIdRef = useRef(1);
  const tappedIdsRef = useRef<Set<number>>(new Set());

  const speedPx = useMemo(() => boardHeight * activeLevel.speed, [boardHeight, activeLevel]);
  const tileHeight = useMemo(() => boardHeight * 0.18, [boardHeight]);
  const hitPadding = useMemo(() => Math.max(10, tileHeight * 0.15), [tileHeight]);

  useEffect(() => {
    if (!boardRef.current) return;
    const resize = () => {
      setBoardHeight(boardRef.current?.clientHeight ?? 480);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("noortiles_user_id");
    if (existing) {
      setUserId(existing);
      return;
    }
    const created = createUserId();
    window.localStorage.setItem("noortiles_user_id", created);
    setUserId(created);
  }, []);

  const loadProgress = useCallback(
    async (id: string) => {
      setLoadingProgress(true);
      const localRaw = window.localStorage.getItem("noortiles_progress");
      if (localRaw) {
        try {
          setProgress(JSON.parse(localRaw));
        } catch {
          setProgress({});
        }
      }

      if (!supabase) {
        setLoadingProgress(false);
        return;
      }

      const { data, error } = await supabase
        .from("progress")
        .select("level,best_stars")
        .eq("user_id", id);

      if (!error && data) {
        const next: ProgressMap = {};
        data.forEach((row: { level: number; best_stars: number }) => {
          next[row.level] = row.best_stars;
        });
        setProgress(next);
        window.localStorage.setItem("noortiles_progress", JSON.stringify(next));
      }
      setLoadingProgress(false);
    },
    []
  );

  useEffect(() => {
    if (!userId) return;
    loadProgress(userId);
  }, [userId, loadProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = activeLevel.audio;
    audio.pause();
    audio.currentTime = 0;
  }, [activeLevel]);

  const resetGame = useCallback(() => {
    setTiles([]);
    setHits(0);
    setTilesSpawned(0);
    spawnTimerRef.current = 0;
    lastTimeRef.current = null;
    nextTileIdRef.current = 1;
    tappedIdsRef.current = new Set();
  }, []);

  const removeTile = useCallback((tileId: number) => {
    setTiles((prev) => prev.filter((tile) => tile.id !== tileId));
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setStatus("playing");
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(() => {});
    }
  }, [resetGame, isMuted]);

  const endGame = useCallback(() => {
    setStatus("ended");
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const canSpawn = tilesSpawned < activeLevel.totalTiles;

  useEffect(() => {
    if (status !== "playing") return;

    const loop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      spawnTimerRef.current += delta;

      if (canSpawn && spawnTimerRef.current >= activeLevel.interval) {
        spawnTimerRef.current = 0;
        setTiles((prev) => [
          ...prev,
          {
            id: nextTileIdRef.current++,
            column: Math.floor(Math.random() * COLUMNS),
            y: -tileHeight,
            hit: false,
          },
        ]);
        setTilesSpawned((value) => value + 1);
      }

      setTiles((prev) =>
        prev
          .map((tile) => ({
            ...tile,
            y: tile.y + speedPx * delta,
          }))
          .filter((tile) => {
            if (tile.y > boardHeight + tileHeight && !tile.hit) {
              return false;
            }
            return tile.y <= boardHeight + tileHeight;
          })
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    status,
    activeLevel.interval,
    speedPx,
    tileHeight,
    boardHeight,
    canSpawn,
  ]);

  useEffect(() => {
    if (status !== "playing") return;
    if (tilesSpawned < activeLevel.totalTiles) return;
    if (tiles.length > 0) return;
    endGame();
  }, [status, tilesSpawned, activeLevel.totalTiles, tiles.length, endGame]);

  const starsEarned = getStars(hits, activeLevel.totalTiles);

  const unlockedLevels = useMemo(() => {
    const unlocked = new Set<number>();
    unlocked.add(1);
    LEVELS.forEach((level) => {
      const best = progress[level.id] ?? 0;
      if (best >= 3) {
        unlocked.add(level.id + 1);
      }
    });
    return unlocked;
  }, [progress]);

  const handleTileClick = useCallback(
    (tileId: number) => {
      if (status !== "playing") return;
      if (tappedIdsRef.current.has(tileId)) return;
      tappedIdsRef.current.add(tileId);
      setHits((value) => value + 1);
      removeTile(tileId);
    },
    [status, removeTile]
  );

  const updateProgress = useCallback(
    async (stars: number) => {
      if (!userId) return;
      const currentBest = progress[activeLevel.id] ?? 0;
      if (stars <= currentBest) return;
      const next = { ...progress, [activeLevel.id]: stars };
      setProgress(next);
      window.localStorage.setItem("noortiles_progress", JSON.stringify(next));

      if (!supabase) return;
      await supabase.from("progress").upsert({
        user_id: userId,
        level: activeLevel.id,
        best_stars: stars,
        updated_at: new Date().toISOString(),
      });
    },
    [activeLevel.id, progress, userId]
  );

  useEffect(() => {
    if (status !== "ended") return;
    updateProgress(starsEarned);
  }, [status, starsEarned, updateProgress]);

  useEffect(() => {
    if (status === "playing") return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [status]);

  const playAgain = () => {
    resetGame();
    setStatus("playing");
  };

  const locked = !unlockedLevels.has(activeLevel.id);

  return (
    <div className="min-h-screen">
      <audio ref={audioRef} preload="auto" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 lg:px-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-16 w-16 rounded-2xl bg-white/10 p-2 shadow-[0_0_30px_rgba(51,226,215,0.35)]">
                <Image
                  src="/NoorTiles.png"
                  alt="NoorTiles logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.45em] text-[#c5f5ff]">
                  NoorTiles
                </span>
                <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Piano Tiles with Nasheeds, built for joy.
                </h1>
              </div>
            </div>
            <p className="max-w-xl text-base text-white/80 sm:text-lg">
              Tap the glowing tiles in rhythm. Earn 3 stars to unlock the next level.
              Every beat is a reminder of light, gratitude, and focus.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-6">
              <span>Player ID</span>
              <span className="font-mono text-xs text-white/60">
                {userId ? userId.slice(0, 8) : "loading..."}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/60">
              <span>Progress saved {supabase ? "to Supabase" : "locally"}.</span>
              <button
                onClick={() => {
                  setIsMuted((value) => {
                    const next = !value;
                    if (audioRef.current) audioRef.current.muted = next;
                    return next;
                  });
                }}
                className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
              >
                {isMuted ? "Muted" : "Audio On"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#1b5c64] via-[#0e2f35] to-[#07181c] p-6 shadow-[0_30px_60px_rgba(4,30,36,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Level {activeLevel.id}</h2>
                <p className="text-sm text-white/60">
                  {activeLevel.name} · {activeLevel.track}
                </p>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f9e48a]">
                {activeLevel.tempo}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-[#0b2f36] via-[#0f3942] to-[#08181c] p-4">
              <div
                ref={boardRef}
                className="relative h-[420px] w-full overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(51,226,215,0.2),_rgba(8,18,22,0.9))]"
              >
                <div className="absolute inset-x-0 bottom-0 h-[28%] border-t border-dashed border-white/10 bg-gradient-to-t from-[#07181c] to-transparent" />

                <div className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-0">
                  {Array.from({ length: COLUMNS }).map((_, column) => (
                    <button
                      key={`col-${column}`}
                      className="relative h-full border-l border-white/5"
                      aria-label={`Tap column ${column + 1}`}
                    />
                  ))}
                </div>

                {tiles.map((tile) => {
                  const left = `${(tile.column / COLUMNS) * 100}%`;
                  return (
                    <button
                      key={tile.id}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        handleTileClick(tile.id);
                      }}
                      className="absolute w-1/4 px-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33e2d7]/70"
                      aria-label="Tap tile"
                      type="button"
                      style={{
                        transform: `translate(${left}, ${tile.y - hitPadding}px)`,
                        height: `${tileHeight + hitPadding * 2}px`,
                        ["--tile-h" as string]: `${tileHeight}px`,
                      }}
                    >
                      <div className="flex h-full w-full items-center">
                        <div className="h-[var(--tile-h)] w-full rounded-2xl bg-gradient-to-br from-[#6ef2c1] via-[#33e2d7] to-[#1b6b75] shadow-[0_15px_25px_rgba(51,226,215,0.35)]" />
                      </div>
                    </button>
                  );
                })}

                {status !== "playing" && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40 text-center text-white">
                    {locked ? (
                      <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-5">
                        <p className="text-lg font-semibold">Level Locked</p>
                        <p className="text-sm text-white/70">
                          Earn 3 stars on Level {activeLevel.id - 1} to unlock.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={startGame}
                        className="rounded-full bg-[#f9e48a] px-8 py-3 text-base font-semibold text-[#2b1f1f] shadow-[0_12px_20px_rgba(249,228,138,0.35)]"
                      >
                        {status === "ended" ? "Play Again" : "Start Level"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-white/70">
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-white/10 px-3 py-1">Hits {hits}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    Clicked {Math.min(hits, activeLevel.totalTiles)} / {activeLevel.totalTiles}
                  </span>
                </div>
                {status === "playing" && (
                  <span className="text-xs uppercase tracking-[0.3em] text-[#6ef2c1]">
                    Tap on beat
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">Level Select</h3>
              <p className="text-sm text-white/70">
                Earn 3 stars in a level to unlock the next stage.
              </p>
              <div className="mt-4 grid gap-3">
                {LEVELS.map((level) => {
                  const best = progress[level.id] ?? 0;
                  const isUnlocked = unlockedLevels.has(level.id);
                  const isActive = level.id === activeLevel.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => {
                        if (!isUnlocked) return;
                        setActiveLevel(level);
                        setStatus("idle");
                        resetGame();
                      }}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-[#f9e48a] bg-[#f9e48a]/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      } ${isUnlocked ? "" : "cursor-not-allowed opacity-50"}`}
                    >
                      <div>
                        <p className="text-base font-semibold text-white">Level {level.id}</p>
                        <p className="text-xs text-white/60">{level.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {starArray(3).map((star) => (
                          <span key={star} className={star < best ? "text-[#f9e48a]" : "text-white/30"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-xs text-white/60">
                Need more tracks? Add your own nasheed audio in `public/nasheeds` and map it in code.
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Session Results</h3>
              {status === "ended" ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-2xl text-[#f9e48a]">
                    {starArray(3).map((star) => (
                      <span key={star}>{star < starsEarned ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <p className="text-sm text-white/70">
                    Accuracy: {Math.round((hits / activeLevel.totalTiles) * 100)}% · Hits {hits}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={playAgain}
                      className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#1a1a2b]"
                    >
                      Play Again
                    </button>
                    {starsEarned >= 3 && activeLevel.id < LEVELS.length && (
                      <button
                        onClick={() => {
                          const next = LEVELS.find((lvl) => lvl.id === activeLevel.id + 1);
                          if (!next) return;
                          setActiveLevel(next);
                          setStatus("idle");
                          resetGame();
                        }}
                        className="rounded-full bg-[#6ef2c1] px-5 py-2 text-sm font-semibold text-[#123323]"
                      >
                        Next Level
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-white/60">
                  Finish a round to see your stars. You need 3 stars to unlock the next level.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#33e2d7]/20 via-[#1b6b75]/20 to-[#f9e48a]/20 p-6">
              <h3 className="text-lg font-semibold text-white">Supabase Sync</h3>
              <p className="mt-2 text-sm text-white/70">
                Connect your Supabase project to persist stars across devices. Without it, your
                progress stays local to this browser.
              </p>
              <div className="mt-4 text-xs text-white/60">
                Status: {loadingProgress ? "Loading..." : supabase ? "Connected" : "Offline"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
