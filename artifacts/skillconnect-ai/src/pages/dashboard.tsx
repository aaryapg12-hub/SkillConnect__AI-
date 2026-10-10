import { useGetDashboardSummary, useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Trophy, Target, Sparkles, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();

  if (profileLoading || summaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Good to see you, {profile?.name}</h1>
          <p className="text-muted-foreground mt-1">Ready to level up your career today?</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold">
          <Trophy className="w-5 h-5" />
          <span>{profile?.xp} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm font-medium flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Career Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{summary?.careerReadiness}%</div>
            <Progress value={summary?.careerReadiness} className="h-2 bg-primary-foreground/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" /> Latest ATS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summary?.latestAtsScore || "--"}</div>
            <p className="text-sm text-muted-foreground mt-2">from your latest resume</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summary?.currentStreak} days</div>
            <p className="text-sm text-muted-foreground mt-2">Keep the momentum going!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.tasksToday.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks for today. You're all caught up!</p>
            ) : (
              <ul className="space-y-4">
                {summary?.tasksToday.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${task.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                      {task.done && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}>{task.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-muted/30 border-0">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
                {summary?.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
