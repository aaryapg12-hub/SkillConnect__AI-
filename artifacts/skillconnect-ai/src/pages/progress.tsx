import { useGetProgress } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Trophy, Zap, TrendingUp, Clock, Target, FileText, Send, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Progress() {
  const { data: progress, isLoading } = useGetProgress();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground mt-1">Track your learning journey and career readiness.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Zap className="w-8 h-8 text-yellow-500 mb-3" />
            <span className="text-3xl font-black text-foreground">{progress?.xp ?? 0}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Total XP</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-8 h-8 text-orange-500 mb-3" />
            <span className="text-3xl font-black text-foreground">{progress?.streak ?? 0}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Day Streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-blue-500 mb-3" />
            <span className="text-3xl font-black text-foreground">{progress?.learningHours ?? 0}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Hours Learned</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Target className="w-8 h-8 text-green-500 mb-3" />
            <span className="text-3xl font-black text-foreground">{progress?.mockInterviewsCompleted ?? 0}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Interviews Done</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Achievements
            </CardTitle>
            <CardDescription>Badges you've earned on your journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {progress?.achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-background to-primary/5 border-primary/20 shadow-sm' 
                      : 'bg-muted/30 border-dashed opacity-70 grayscale-[0.5]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                    achievement.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {achievement.unlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`font-bold ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Career Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-black text-primary">{progress?.careerReadiness ?? 0}%</span>
              </div>
              <ProgressBar value={progress?.careerReadiness ?? 0} className="h-3" />
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Complete roadmaps, practice interviews, and analyze your resume to increase this score.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Stats Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" /> Avg Resume Score
                </div>
                <span className="font-bold">{progress?.resumeScore ? `${progress.resumeScore}/100` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" /> Courses Completed
                </div>
                <span className="font-bold">{progress?.coursesCompleted ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Send className="w-4 h-4" /> Apps Submitted
                </div>
                <span className="font-bold">{progress?.applicationsSubmitted ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
