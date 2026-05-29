import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gamepad2, ArrowLeft, Star, Lock, Cloud, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChallengeBoard } from "@/components/practice/ChallengeBoard";
import { generateRandomArray } from "@/lib/visualizer-algorithms";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { AuthModal } from "@/components/AuthModal";

const LEVELS = Array.from({ length: 50 }).map((_, i) => ({
  id: i + 1,
  difficulty: i < 10 ? "Easy" : i < 30 ? "Medium" : "Hard",
  algorithm: ["bubble", "selection", "insertion"][i % 3], // simple algorithms for game
  arraySize: Math.floor(i / 5) + 5,
}));

export default function Practice() {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [starsData, setStarsData] = useState<Record<number, number>>({});
  const { user, token, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("algoviz_practice_progress");
    if (saved) {
      const data = JSON.parse(saved);
      setUnlockedLevels(data.unlocked || [1]);
      setStarsData(data.stars || {});
    }

    if (token) {
      setSyncing(true);
      api.getProgress(token).then((data) => {
        setUnlockedLevels(data.unlockedLevels);
        setStarsData(data.starsData);
        localStorage.setItem("algoviz_practice_progress", JSON.stringify({ unlocked: data.unlockedLevels, stars: data.starsData }));
      }).catch(console.error).finally(() => setSyncing(false));
    }
  }, [token]);

  const saveProgress = async (levelId: number, stars: number) => {
    const nextLevel = levelId + 1;
    const newUnlocked = [...new Set([...unlockedLevels, levelId, nextLevel])];
    const newStars = { ...starsData, [levelId]: Math.max(starsData[levelId] || 0, stars) };
    setUnlockedLevels(newUnlocked);
    setStarsData(newStars);
    localStorage.setItem("algoviz_practice_progress", JSON.stringify({ unlocked: newUnlocked, stars: newStars }));

    if (token) {
      setSyncing(true);
      try {
        await api.updateProgress(token, newUnlocked, newStars);
      } catch (err) {
        console.error("Cloud sync failed", err);
      }
      setSyncing(false);
    }
  };

  if (activeLevel) {
    const levelDef = LEVELS.find((l) => l.id === activeLevel)!;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => setActiveLevel(null)}>
            <ArrowLeft className="h-4 w-4" /> Back to Arena
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-neon-cyan">LEVEL {activeLevel}</span>
            <span className="text-[10px] tracking-wider text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">{levelDef.difficulty}</span>
          </div>
        </div>
        <ChallengeBoard 
          level={activeLevel} 
          algorithm={levelDef.algorithm || 'bubble'} 
          initialArray={generateRandomArray(levelDef.arraySize)} 
          onComplete={(stars) => saveProgress(activeLevel, stars)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-neon-orange/10 border border-neon-orange/30 neon-glow-orange">
            <Gamepad2 className="h-5 w-5 text-neon-orange" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground leading-none">Practice Arena</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Solve algorithms interactively block by block.</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-full border border-border shadow-sm">
              <div className="flex items-center gap-1.5">
               <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs uppercase shadow-[0_0_10px_var(--primary)]">{user.username.charAt(0)}</div>
               <span className="text-sm font-bold text-foreground">{user.username}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              {syncing ? (
                 <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 uppercase tracking-wider font-bold"><Cloud className="h-3 w-3"/> Syncing</span>
              ) : (
                 <span className="text-[10px] text-neon-green flex items-center gap-1 uppercase tracking-wider font-bold"><Cloud className="h-3 w-3"/> Synced</span>
              )}
              <div className="w-px h-4 bg-border" />
              <button title="Logout" onClick={logout} className="text-muted-foreground hover:text-neon-pink transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button onClick={() => setAuthModalOpen(true)} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary gap-2 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
              <Cloud className="h-4 w-4" /> Login & Save Progress
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {LEVELS.map((level) => {
          const isUnlocked = unlockedLevels.includes(level.id);
          const stars = starsData[level.id] || 0;
          return (
            <motion.button
              key={level.id}
              whileHover={isUnlocked ? { scale: 1.05 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              onClick={() => isUnlocked && setActiveLevel(level.id)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center border transition-all ${
                isUnlocked 
                  ? "bg-muted/30 border-neon-cyan/50 hover:border-neon-cyan hover:bg-neon-cyan/10 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.2)]" 
                  : "bg-muted/10 border-muted-foreground/20 cursor-not-allowed opacity-60"
              }`}
            >
              <span className={`font-display font-bold text-xl ${isUnlocked ? "text-foreground" : "text-muted-foreground/50"}`}>
                {level.id}
              </span>
              <div className="mt-1 flex gap-0.5">
                {isUnlocked ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Star key={i} className={`h-2.5 w-2.5 ${i < stars ? "text-neon-yellow fill-neon-yellow" : "text-muted-foreground/30"}`} />
                  ))
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground/40 mt-1" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
