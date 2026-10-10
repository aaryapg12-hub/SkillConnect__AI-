import { useState } from "react";
import { useListResumes, useCreateResume } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, UploadCloud, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Resumes() {
  const { data: resumes, isLoading, refetch } = useListResumes();
  const createResume = useCreateResume();
  const { toast } = useToast();
  
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [resumeText, setResumeText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !resumeText) return;
    
    createResume.mutate({ data: { fileName, resumeText } }, {
      onSuccess: () => {
        toast({ title: "Resume analyzed successfully!" });
        setIsUploading(false);
        setFileName("");
        setResumeText("");
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to analyze resume", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground mt-1">Upload and analyze your resumes for ATS compatibility.</p>
        </div>
        {!isUploading && (
          <Button onClick={() => setIsUploading(true)} className="rounded-full shadow-md">
            <Plus className="w-4 h-4 mr-2" /> New Analysis
          </Button>
        )}
      </div>

      {isUploading && (
        <Card className="border-primary/20 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle>Analyze New Resume</CardTitle>
            <CardDescription>Paste your resume text below for AI evaluation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filename">Resume Title</Label>
                <Input 
                  id="filename" 
                  value={fileName} 
                  onChange={(e) => setFileName(e.target.value)} 
                  placeholder="e.g. Frontend Developer 2024" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text">Resume Content</Label>
                <Textarea 
                  id="text" 
                  value={resumeText} 
                  onChange={(e) => setResumeText(e.target.value)} 
                  placeholder="Paste your resume text here..." 
                  className="min-h-[200px]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsUploading(false)}>Cancel</Button>
                <Button type="submit" disabled={createResume.isPending}>
                  {createResume.isPending ? "Analyzing..." : (
                    <>
                      <UploadCloud className="w-4 h-4 mr-2" /> Analyze Resume
                    </>
                  )}
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
      ) : resumes?.length === 0 && !isUploading ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No resumes yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Upload your first resume to get actionable AI feedback on how to improve your ATS score and stand out to recruiters.</p>
          <Button onClick={() => setIsUploading(true)} size="lg" className="rounded-full">
            Analyze a Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resumes?.map((resume) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{resume.fileName}</CardTitle>
                    <CardDescription>{new Date(resume.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    resume.atsScore >= 80 ? 'bg-green-100 text-green-700' : 
                    resume.atsScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {resume.atsScore} ATS
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Strengths
                  </h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    {resume.strengths.slice(0, 2).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Areas to Improve
                  </h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    {resume.improvementTips.slice(0, 2).map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View Full Report <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
