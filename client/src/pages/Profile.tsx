import { useAuth } from "@/hooks/use-auth";
import { useMyScores } from "@/hooks/use-scores";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Calendar } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: scores } = useMyScores();

  const totalScore = scores?.reduce((acc, s) => acc + s.score, 0) || 0;
  const totalStars = scores?.reduce((acc, s) => acc + s.stars, 0) || 0;
  const avgAccuracy = scores?.length 
    ? Math.round(scores.reduce((acc, s) => acc + s.accuracy, 0) / scores.length) 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-3xl border shadow-sm">
          <Avatar className="w-24 h-24 border-4 border-primary/10">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="text-2xl bg-primary/5 text-primary">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-display font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 justify-center md:justify-start">
               <Badge variant="secondary" className="bg-primary/10 text-primary">Beginner Traveler</Badge>
               <Badge variant="outline">Member since {new Date().getFullYear()}</Badge>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Score", value: totalScore.toLocaleString(), icon: Trophy, color: "text-yellow-600" },
            { label: "Stars Earned", value: totalStars, icon: Star, color: "text-secondary" },
            { label: "Avg Accuracy", value: `${avgAccuracy}%`, icon: Target, color: "text-primary" },
            { label: "Levels Played", value: scores?.length || 0, icon: Calendar, color: "text-blue-500" },
          ].map((stat, i) => (
            <Card key={i} className="text-center p-6 hover:shadow-md transition-shadow">
              <div className={`mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {scores?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No games played yet. Go to the dashboard to start!</p>
            ) : (
              <div className="space-y-4">
                {scores?.slice(0, 5).map((score) => (
                  <div key={score.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center font-bold text-lg text-primary">
                         {score.stars}⭐
                      </div>
                      <div>
                        <div className="font-semibold">{score.level?.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(score.createdAt || '').toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{score.score.toLocaleString()} pts</div>
                      <div className={`text-xs ${score.accuracy > 90 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {score.accuracy}% Acc
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
