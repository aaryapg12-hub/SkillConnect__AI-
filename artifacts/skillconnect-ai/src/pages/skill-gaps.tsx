import { useState } from "react";
import { useListSkillGapAnalyses, useCreateSkillGapAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target, CheckCircle2, AlertCircle, TrendingUp, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function SkillGaps() {
  const { data: analyses, isLoading, refetch } = useListSkillGapAnalyses();
  const createAnalysis = useCreateSkillGapAnalysis();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [currentSkill, setCurrentSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const addSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole || skills.length === 0) {
      toast({ title: "Please provide target role and at least one skill", variant: "destructive" });
      return;
    }

    createAnalysis.mutate({ data: { targetRole, currentSkills: skills } }, {
      onSuccess: () => {
        toast({ title: "Analysis complete!" });
        setIsCreating(false);
        setTargetRole("");
        setSkills([]);
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to analyze skills", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Gaps</h1>
          <p className="text-muted-foreground mt-1">Identify missing skills for your target role.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-full shadow-md" data-testid="button-new-analysis">
            <Plus className="w-4 h-4 mr-2" /> New Analysis
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-primary/20 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle>Analyze Skill Gaps</CardTitle>
            <CardDescription>Enter your target role and current skills to see what's missing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input 
                  id="targetRole" 
                  value={targetRole} 
                  onChange={(e) => setTargetRole(e.target.value)} 
                  placeholder="e.g. Senior Frontend Engineer" 
                  data-testid="input-target-role"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Current Skills</Label>
                <div className="flex gap-2">
                  <Input 
                    id="skills" 
                    value={currentSkill} 
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="e.g. React, TypeScript (Press Enter to add)" 
                    data-testid="input-current-skill"
                  />
                  <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/50 rounded-xl border border-border/50 min-h-[50px]">
                    {skills.map(skill => (
                      <div key={skill} className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-full text-sm font-medium shadow-sm border border-border">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="text-muted-foreground hover:text-destructive ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} data-testid="button-cancel-analysis">Cancel</Button>
                <Button type="submit" disabled={createAnalysis.isPending || skills.length === 0 || !targetRole} data-testid="button-submit-analysis">
                  {createAnalysis.isPending ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : analyses?.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No analyses yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Run a skill gap analysis to find out what you need to learn for your dream job.</p>
          <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full" data-testid="button-start-first-analysis">
            Start Analysis
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyses?.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow" data-testid={`card-analysis-${analysis.id}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{analysis.targetRole}</CardTitle>
                <CardDescription>{new Date(analysis.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Current Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.currentSkills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-muted rounded-md text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-destructive" /> Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-destructive/10 text-destructive rounded-md text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>

                {analysis.prioritySkills && analysis.prioritySkills.length > 0 && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-primary">
                      <TrendingUp className="w-4 h-4" /> Top Priorities to Learn
                    </h4>
                    <ul className="text-sm space-y-1 pl-6 list-disc text-muted-foreground">
                      {analysis.prioritySkills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
