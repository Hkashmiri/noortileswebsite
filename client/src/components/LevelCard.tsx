import { Level } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, Music2, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface LevelCardProps {
  level: Level;
  stars?: number;
  locked?: boolean;
}

export function LevelCard({ level, stars = 0, locked = false }: LevelCardProps) {
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      locked ? 'opacity-75 grayscale' : 'border-primary/20'
    }`}>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 pattern-overlay opacity-10 group-hover:opacity-20 transition-opacity" />
      
      <div className="relative p-6 space-y-4">
        <div className="flex justify-between items-start">
          <Badge 
            variant="secondary" 
            className="capitalize bg-secondary/10 text-secondary-foreground border-secondary/20"
          >
            {level.type}
          </Badge>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i <= stars ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} 
              />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
            {level.title}
          </h3>
          <p className="text-sm text-muted-foreground">{level.subTitle}</p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {level.type === 'quran' ? <BookOpen className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
            <span>{Math.floor(level.duration / 60)}:{(level.duration % 60).toString().padStart(2, '0')}</span>
          </div>

          <Link href={locked ? "#" : `/play/${level.id}`}>
            <Button 
              disabled={locked}
              className={`rounded-full shadow-lg ${
                locked 
                  ? "bg-muted text-muted-foreground" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
              }`}
            >
              {locked ? "Locked" : "Play"}
              {!locked && <Play className="w-4 h-4 ml-2 fill-current" />}
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Gradient Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}
