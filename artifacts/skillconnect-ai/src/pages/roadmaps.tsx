import { useState } from "react";
import { useListRoadmaps, useCreateRoadmap, useUpdateRoadmapProgress } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Map, Route as RouteIcon, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Roadmaps() {
  const { data: roadmaps, isLoading, refetch } = useListRoadmaps();
  const createRoadmap = useCreateRoadmap();
  const updateProgress = useUpdateRoadmapProgress();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [targetRole, setTargetRole] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole) return;

    createRoadmap.mutate({ data: { targetRole } }, {
      onSuccess: () => {
        toast({ title: "Roadmap generated!" });
        setIsCreating(false);
        setTargetRole("");
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to generate roadmap", variant: "destructive" });
      }
    });
  };

  const handleToggleStep = (roadmapId: number, currentCompleted: number[], stepOrder: number, isCompleted: boolean) => {
    const newCompleted = isCompleted 
      ? [...currentCompleted, stepOrder]
      : currentCompleted.filter(o => o !== stepOrder);

    updateProgress.mutate({ id: roadmapId, data: { completedSteps: newCompleted } }, {
      onSuccess: () => {
        toast({ title: "Progress updated!" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Roadmaps</h1>
          <p className="text-muted-foreground mt-1">Step-by-step guides to master your target role.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-full shadow-md" data-testid="button-new-roadmap">
            <Plus className="w-4 h-4 mr-2" /> New Roadmap
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-primary/20 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle>Generate a Roadmap</CardTitle>
            <CardDescription>Enter a role and AI will break it down into actionable learning steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input 
                  id="targetRole" 
                  value={targetRole} 
                  onChange={(e) => setTargetRole(e.target.value)} 
                  placeholder="e.g. Full Stack Developer, Data Scientist..." 
                  data-testid="input-target-role"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createRoadmap.isPending || !targetRole} data-testid="button-submit">
                  {createRoadmap.isPending ? "Generating..." : "Generate Roadmap"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      ) : roadmaps?.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <Map className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No roadmaps yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Generate your first learning roadmap to get a clear, step-by-step path to your dream job.</p>
          <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full" data-testid="button-start">
            Generate Roadmap
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {roadmaps?.map((roadmap) => {
            const completedCount = roadmap.steps.filter(s => s.completed).length;
            const totalCount = roadmap.steps.length;
            const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
            const completedStepsArray = roadmap.steps.filter(s => s.completed).map(s => s.order);

            return (
              <Card key={roadmap.id} className="overflow-hidden border-border/60" data-testid={`roadmap-${roadmap.id}`}>
                <CardHeader className="bg-muted/20 border-b pb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <RouteIcon className="w-6 h-6 text-primary" /> {roadmap.targetRole}
                      </CardTitle>
                      <CardDescription className="mt-1">Generated {new Date(roadmap.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="w-full md:w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-muted-foreground">Progress</span>
                        <span className="font-bold text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y border-t-0">
                    {roadmap.steps.sort((a, b) => a.order - b.order).map((step) => (
                      <div key={step.order} className={`p-6 transition-colors ${step.completed ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <div className="flex gap-4">
                          <div className="mt-1">
                            <Checkbox 
                              checked={step.completed}
                              onCheckedChange={(checked) => handleToggleStep(roadmap.id, completedStepsArray, step.order, checked === true)}
                              className="w-6 h-6 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              data-testid={`checkbox-step-${roadmap.id}-${step.order}`}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className={`text-lg font-bold ${step.completed ? 'text-muted-foreground line-through' : ''}`}>
                              {step.order}. {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                            
                            {step.resources && step.resources.length > 0 && (
                              <div className="pt-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Recommended Resources</h4>
                                <ul className="flex flex-wrap gap-2">
                                  {step.resources.map((resource, i) => (
                                    <li key={i} className="px-3 py-1 bg-background border rounded-lg text-sm text-muted-foreground shadow-sm">
                                      {resource}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
