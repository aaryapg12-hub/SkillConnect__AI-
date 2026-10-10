import { useState } from "react";
import { useListCareerRecommendations, useCreateCareerRecommendation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Compass, Briefcase, DollarSign, BookOpen, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CareerRecommendations() {
  const { data: recommendations, isLoading, refetch } = useListCareerRecommendations();
  const createRec = useCreateCareerRecommendation();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [interests, setInterests] = useState("");
  const [background, setBackground] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interests) return;

    createRec.mutate({ data: { interests, background } }, {
      onSuccess: () => {
        toast({ title: "Recommendations generated!" });
        setIsCreating(false);
        setInterests("");
        setBackground("");
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to generate recommendations", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Career Paths</h1>
          <p className="text-muted-foreground mt-1">Discover new career opportunities tailored to your interests.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-full shadow-md" data-testid="button-new-recommendation">
            <Plus className="w-4 h-4 mr-2" /> Get Recommendations
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-secondary/30 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
          <CardHeader>
            <CardTitle>Find Your Path</CardTitle>
            <CardDescription>Tell us what you enjoy doing and your current background.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interests">Interests & Passions</Label>
                <Textarea 
                  id="interests" 
                  value={interests} 
                  onChange={(e) => setInterests(e.target.value)} 
                  placeholder="e.g. I love solving puzzles, designing user interfaces, and organizing data..." 
                  data-testid="input-interests"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="background">Current Background (Optional)</Label>
                <Textarea 
                  id="background" 
                  value={background} 
                  onChange={(e) => setBackground(e.target.value)} 
                  placeholder="e.g. 2 years working in customer service, took a bootcamp in frontend..." 
                  data-testid="input-background"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createRec.isPending || !interests} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" data-testid="button-submit">
                  {createRec.isPending ? "Generating..." : "Generate Paths"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : recommendations?.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/10">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4 text-secondary">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No recommendations yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Get personalized career path suggestions based on your unique interests and background.</p>
          <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" data-testid="button-start">
            Discover Careers
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {recommendations?.map((rec) => (
            <div key={rec.id} className="space-y-4" data-testid={`recommendation-${rec.id}`}>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold">Generated on {new Date(rec.createdAt).toLocaleDateString()}</h3>
                <span className="px-3 py-1 bg-muted text-xs font-semibold rounded-full uppercase tracking-wider">{rec.difficultyLevel} Difficulty</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rec.careerPaths.map((path, i) => (
                  <Card key={i} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg leading-tight"><Briefcase className="w-4 h-4 inline mr-2 text-primary -mt-1"/>{path.title}</CardTitle>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {path.matchScore}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-muted/30 border-0">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4 text-green-500" /> Salary Range</h4>
                    <p className="text-lg font-bold">{rec.salaryRange}</p>
                   </div>
                   <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3"><GraduationCap className="w-4 h-4 text-secondary" /> Certifications</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                      {rec.certifications.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                   </div>
                   <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-primary" /> Resources</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                      {rec.learningResources.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                   </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
