import { useState } from "react";
import { useListCoverLetters, useCreateCoverLetter, useDeleteCoverLetter, useGetCoverLetter } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Trash2, Copy, CheckCircle2, EyeIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function CoverLetters() {
  const { data: letters, isLoading, refetch } = useListCoverLetters();
  const createLetter = useCreateCoverLetter();
  const deleteLetter = useDeleteCoverLetter();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedLetterId, setSelectedLetterId] = useState<number | null>(null);

  const { data: selectedLetter, isLoading: isLoadingLetter } = useGetCoverLetter(selectedLetterId as number, {
    query: {
      enabled: selectedLetterId !== null
    } as any
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !company) return;

    createLetter.mutate({ data: { jobTitle, company, jobDescription } }, {
      onSuccess: () => {
        toast({ title: "Cover letter generated!" });
        setIsCreating(false);
        setJobTitle("");
        setCompany("");
        setJobDescription("");
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to generate cover letter", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Delete this cover letter?")) return;
    deleteLetter.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted" });
        refetch();
        if (selectedLetterId === id) setSelectedLetterId(null);
      }
    });
  };

  const copyToClipboard = (id: number, content: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cover Letters</h1>
          <p className="text-muted-foreground mt-1">Generate AI cover letters tailored to specific jobs.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-full shadow-md" data-testid="button-new-letter">
            <Plus className="w-4 h-4 mr-2" /> Generate Letter
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-primary/20 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle>Generate Cover Letter</CardTitle>
            <CardDescription>AI will use your latest resume and the details below to write a tailored cover letter.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input 
                    id="jobTitle" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)} 
                    placeholder="e.g. Frontend Developer" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input 
                    id="company" 
                    value={company} 
                    onChange={(e) => setCompany(e.target.value)} 
                    placeholder="e.g. Acme Corp" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description (Optional, but recommended)</Label>
                <Textarea 
                  id="jobDescription" 
                  value={jobDescription} 
                  onChange={(e) => setJobDescription(e.target.value)} 
                  placeholder="Paste the job description here for a more personalized letter..." 
                  className="h-32 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" disabled={createLetter.isPending || !jobTitle || !company}>
                  {createLetter.isPending ? "Generating..." : "Generate Cover Letter"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : letters?.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No cover letters</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Generate a highly-targeted cover letter in seconds.</p>
          <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full">
            Generate First Letter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {letters?.map((letter) => (
            <Card key={letter.id} className="flex flex-col h-full border-border/60 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLetterId(letter.id)}>
              <CardHeader className="bg-muted/10 border-b pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-lg">{letter.jobTitle}</CardTitle>
                    <CardDescription className="font-medium text-primary mt-1">{letter.company}</CardDescription>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(letter.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 relative">
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80 font-serif h-48 overflow-hidden relative">
                  {letter.content}
                  <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="flex items-center gap-1 shadow-sm"><EyeIcon className="w-3 h-3" /> Click to read full</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/5 flex justify-between mt-auto">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete(letter.id, e)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={(e) => copyToClipboard(letter.id, letter.content, e)}>
                  {copiedId === letter.id ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectedLetterId !== null} onOpenChange={(open) => !open && setSelectedLetterId(null)}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          {isLoadingLetter ? (
            <div className="space-y-4 py-4 flex-1">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-full w-full mt-4" />
            </div>
          ) : selectedLetter ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedLetter.jobTitle}</DialogTitle>
                <DialogDescription className="text-base text-primary font-medium">{selectedLetter.company}</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto bg-muted/30 p-6 rounded-xl border border-border/50 my-4 custom-scrollbar">
                <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedLetter.content}
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t flex flex-row items-center justify-between sm:justify-between">
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedLetter.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <Button onClick={() => copyToClipboard(selectedLetter.id, selectedLetter.content)}>
                  {copiedId === selectedLetter.id ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Copied to Clipboard</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy to Clipboard</>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div>Cover letter not found</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
