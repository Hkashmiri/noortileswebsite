import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useLevel } from "@/hooks/use-levels";
import { useSubmitScore } from "@/hooks/use-scores";
import { GameData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Constants
const HIT_WINDOW = 0.2; // Seconds
const LANE_COUNT = 4;
const SPEED = 2; // Tiles falling speed multiplier

export default function Game() {
  const [match, params] = useRoute("/play/:id");
  const [, setLocation] = useLocation();
  const levelId = parseInt(params?.id || "0");
  
  const { data: level, isLoading } = useLevel(levelId);
  const submitScore = useSubmitScore();

  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [hits, setHits] = useState({ perfect: 0, good: 0, miss: 0 });
  const [gameTime, setGameTime] = useState(0);
  const [feedback, setFeedback] = useState<{text: string, id: number} | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  
  // Logic to process tiles
  const gameData = level?.gameData as GameData;
  const processedTiles = useMemo(() => {
    if (!gameData) return [];
    return gameData.tiles.sort((a, b) => a.time - b.time);
  }, [gameData]);

  const [activeTiles, setActiveTiles] = useState<typeof processedTiles>([]);

  // Initialize Game
  useEffect(() => {
    if (processedTiles.length > 0) {
      setActiveTiles(processedTiles.map(t => ({...t, hit: false})));
    }
  }, [processedTiles]);

  // Audio Setup
  useEffect(() => {
    if (level?.audioUrl) {
      audioRef.current = new Audio(level.audioUrl);
      audioRef.current.addEventListener('ended', handleGameEnd);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleGameEnd);
      }
      cancelAnimationFrame(requestRef.current!);
    };
  }, [level]);

  const handleGameEnd = () => {
    setIsPlaying(false);
    // Navigate to quiz with score data passed in state or context
    // For simplicity, we just submit here then redirect
    // In a real app, you'd show a results screen first
    const totalNotes = gameData.tiles.length;
    const hitNotes = hits.perfect + hits.good;
    const accuracy = Math.round((hitNotes / totalNotes) * 100);
    const stars = accuracy > 90 ? 3 : accuracy > 70 ? 2 : 1;
    
    submitScore.mutate({
      levelId,
      score,
      stars,
      accuracy,
      maxStreak,
      isFullCombo: combo === totalNotes,
    }, {
      onSuccess: () => setLocation(`/quiz/${levelId}`)
    });
  };

  const startGame = () => {
    if (!audioRef.current) return;
    setIsPlaying(true);
    audioRef.current.play();
    startTimeRef.current = Date.now() - (gameTime * 1000); // Resume correct time
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const pauseGame = () => {
    if (!audioRef.current) return;
    setIsPlaying(false);
    audioRef.current.pause();
    cancelAnimationFrame(requestRef.current!);
  };

  const gameLoop = () => {
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    setGameTime(elapsed);
    
    // Check for missed tiles
    setActiveTiles(prev => {
      return prev.map(tile => {
        // @ts-ignore
        if (!tile.hit && !tile.missed && elapsed > tile.time + HIT_WINDOW) {
          setCombo(0);
          setHits(h => ({ ...h, miss: h.miss + 1 }));
          showFeedback("Miss");
          // @ts-ignore
          return { ...tile, missed: true };
        }
        return tile;
      });
    });

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const showFeedback = (text: string) => {
    setFeedback({ text, id: Date.now() });
    setTimeout(() => setFeedback(null), 500);
  };

  const handleLaneTap = (laneIndex: number) => {
    if (!isPlaying) return;

    // Find nearest unhit tile in this lane
    const tileIndex = activeTiles.findIndex(t => 
      // @ts-ignore
      t.lane === laneIndex && !t.hit && !t.missed && 
      Math.abs(t.time - gameTime) < HIT_WINDOW
    );

    if (tileIndex !== -1) {
      const tile = activeTiles[tileIndex];
      const diff = Math.abs(tile.time - gameTime);
      let points = 0;
      
      // Update tile status
      const newTiles = [...activeTiles];
      // @ts-ignore
      newTiles[tileIndex] = { ...tile, hit: true };
      setActiveTiles(newTiles);

      // Score calculation
      if (diff < 0.05) {
        points = 100;
        showFeedback("Perfect!");
        setHits(h => ({ ...h, perfect: h.perfect + 1 }));
      } else {
        points = 50;
        showFeedback("Good");
        setHits(h => ({ ...h, good: h.good + 1 }));
      }

      setScore(s => s + points + (combo * 10)); // Combo bonus
      setCombo(c => {
        const newCombo = c + 1;
        setMaxStreak(m => Math.max(m, newCombo));
        return newCombo;
      });
    } else {
      // Penalty for spamming? Optional.
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const keys = ['d', 'f', 'j', 'k'];
      const lane = keys.indexOf(e.key.toLowerCase());
      if (lane !== -1) handleLaneTap(lane);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, activeTiles, gameTime]);


  if (isLoading || !level) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      {/* Header HUD */}
      <div className="flex justify-between items-center p-4 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard')}>
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-bold font-display">{level.title}</h2>
            <div className="text-sm text-muted-foreground font-mono">
              Score: {score.toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-primary">{combo}x</div>
          <div className="text-xs text-muted-foreground uppercase">Combo</div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative max-w-2xl mx-auto w-full perspective-1000">
        {/* Lanes */}
        <div className="absolute inset-0 grid grid-cols-4 px-4 h-full">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="relative border-r border-white/5 first:border-l lane-gradient">
              {/* Hit Zone Indicator */}
              <div className="absolute bottom-8 left-2 right-2 h-16 border-2 border-white/20 rounded-xl hit-zone" />
              
              {/* Lane Key Hint */}
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground font-mono opacity-50">
                {['D', 'F', 'J', 'K'][i]}
              </div>
            </div>
          ))}
        </div>

        {/* Tiles */}
        <div className="absolute inset-0 pointer-events-none">
          {activeTiles.map((tile, i) => {
            // @ts-ignore
            if (tile.hit) return null; // Hide hit tiles
            
            // Calculate position (0% at top, 90% at hit zone)
            // time - gameTime = seconds until hit
            // if time=2, gameTime=1, diff=1s. top should be negative or small.
            // We want it to arrive at bottom (85%) when diff = 0
            
            const timeUntilHit = tile.time - gameTime;
            const topPosition = 85 - (timeUntilHit * 100 * SPEED); // 85% is hit line
            
            if (topPosition < -20 || topPosition > 110) return null; // Optimization

            return (
              <div
                key={i}
                className="absolute h-12 rounded-lg shadow-lg flex items-center justify-center text-xs font-bold text-white z-10"
                style={{
                  left: `${(tile.lane * 25) + 2}%`,
                  width: '21%',
                  top: `${topPosition}%`,
                  backgroundColor: tile.lane % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                  opacity: timeUntilHit < 0.5 ? 1 : 0.8
                }}
              >
                {tile.word && <span className="drop-shadow-md">{tile.word}</span>}
              </div>
            );
          })}
        </div>
        
        {/* Feedback Text */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1.5, y: -50 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none font-display"
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Touch Controls (Invisible overlay) */}
        <div className="absolute inset-0 grid grid-cols-4 z-20">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i}
              className="active:bg-white/5 transition-colors"
              onPointerDown={() => handleLaneTap(i)}
            />
          ))}
        </div>
      </div>

      {/* Start Overlay */}
      {!isPlaying && gameTime === 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-display font-bold">{level.title}</h1>
            <p className="text-muted-foreground">{level.subTitle}</p>
            <Button size="lg" className="rounded-full h-16 px-12 text-xl shadow-xl" onClick={startGame}>
              <Play className="mr-2" /> Start
            </Button>
            <div className="flex justify-center gap-8 text-sm text-muted-foreground font-mono mt-8">
              <div className="flex flex-col items-center">
                <span className="kbd bg-muted px-2 py-1 rounded mb-2">D</span>
                Left
              </div>
              <div className="flex flex-col items-center">
                <span className="kbd bg-muted px-2 py-1 rounded mb-2">F</span>
                Left Mid
              </div>
              <div className="flex flex-col items-center">
                <span className="kbd bg-muted px-2 py-1 rounded mb-2">J</span>
                Right Mid
              </div>
              <div className="flex flex-col items-center">
                <span className="kbd bg-muted px-2 py-1 rounded mb-2">K</span>
                Right
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {!isPlaying && gameTime > 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="flex gap-4">
             <Button size="lg" onClick={startGame}>
               <Play className="mr-2" /> Resume
             </Button>
             <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
               <RotateCcw className="mr-2" /> Restart
             </Button>
           </div>
        </div>
      )}

      {/* Pause Button (during game) */}
      {isPlaying && (
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute top-4 right-4 z-50 bg-background/50 backdrop-blur"
          onClick={pauseGame}
        >
          <Pause className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
