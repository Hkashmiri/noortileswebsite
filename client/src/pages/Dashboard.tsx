import { useAuth } from "@/hooks/use-auth";
import { useLevels } from "@/hooks/use-levels";
import { useMyScores } from "@/hooks/use-scores";
import { Navbar } from "@/components/Navbar";
import { LevelCard } from "@/components/LevelCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: levels, isLoading: levelsLoading } = useLevels();
  const { data: scores } = useMyScores();

  if (authLoading || levelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Create a map of scores for easy lookup
  const scoresMap = new Map(scores?.map(s => [s.levelId, s]));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Journey Map</h1>
            <p className="text-muted-foreground">Select a path to continue your learning</p>
          </div>
          <div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-primary">{scores?.length || 0}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Levels</div>
            </div>
            <div className="w-px bg-border h-12" />
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-secondary">
                {scores?.reduce((acc, curr) => acc + curr.stars, 0) || 0}
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Stars</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-full mb-8">
            <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">All Levels</TabsTrigger>
            <TabsTrigger value="quran" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Quran</TabsTrigger>
            <TabsTrigger value="nasheed" className="rounded-full px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Nasheeds</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels?.map((level, idx) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <LevelCard 
                    level={level} 
                    stars={scoresMap.get(level.id)?.stars || 0} 
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quran">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels?.filter(l => l.type === 'quran').map((level) => (
                <LevelCard 
                  key={level.id} 
                  level={level}
                  stars={scoresMap.get(level.id)?.stars || 0}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nasheed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels?.filter(l => l.type === 'nasheed').map((level) => (
                <LevelCard 
                  key={level.id} 
                  level={level}
                  stars={scoresMap.get(level.id)?.stars || 0}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
