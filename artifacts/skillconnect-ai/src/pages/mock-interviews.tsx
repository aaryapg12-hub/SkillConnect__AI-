import { useState } from "react";
import { useListMockInterviews, useCreateMockInterview, useGetMockInterview, useAnswerMockInterview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PlayCircle, MessageSquare, CheckCircle, BarChart, CheckCircle2, ChevronRight, RefreshCw, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MockInterviewInputInterviewType } from "@workspace/api-client-react";

export default function MockInterviews({ params }: { params?: { id?: string } }) {
  const { toast } = useToast();
  
  if (params?.id) {
    return <MockInterviewSession id={Number(params.id)} />;
  }

  return <MockInterviewList />;
}

function MockInterviewList() {
  const { data: interviews, isLoading, refetch } = useListMockInterviews();
  const createInterview = useCreateMockInterview();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Entry Level");
  const [interviewType, setInterviewType] = useState<MockInterviewInputInterviewType>(MockInterviewInputInterviewType.technical);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRole) return;

    createInterview.mutate({ data: { jobRole, experienceLevel, interviewType } }, {
      onSuccess: (data) => {
        toast({ title: "Interview created!" });
        setIsCreating(false);
        setJobRole("");
        window.location.href = `/mock-interviews/${data.id}`;
      },
      onError: () => {
        toast({ title: "Failed to start interview", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Interviews</h1>
          <p className="text-muted-foreground mt-1">Practice and perfect your interview skills.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="rounded-full shadow-md" data-testid="button-new-interview">
            <Plus className="w-4 h-4 mr-2" /> Start Interview
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-primary/20 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle>Configure Mock Interview</CardTitle>
            <CardDescription>Set up the context for your practice session.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role</Label>
                <Input 
                  id="jobRole" 
                  value={jobRole} 
                  onChange={(e) => setJobRole(e.target.value)} 
                  placeholder="e.g. Software Engineer" 
                  data-testid="input-job-role"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger data-testid="select-experience">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entry Level">Entry Level</SelectItem>
                      <SelectItem value="Mid Level">Mid Level</SelectItem>
                      <SelectItem value="Senior Level">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewType">Interview Type</Label>
                  <Select value={interviewType} onValueChange={(val) => setInterviewType(val as MockInterviewInputInterviewType)}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="hr">HR Screen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createInterview.isPending || !jobRole} data-testid="button-start-session">
                  {createInterview.isPending ? "Starting..." : "Start Session"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : interviews?.length === 0 && !isCreating ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No past interviews</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Start your first mock interview to get personalized feedback.</p>
          <Button onClick={() => setIsCreating(true)} size="lg" className="rounded-full" data-testid="button-start">
            Start Mock Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviews?.map((interview) => (
            <Card key={interview.id} className="overflow-hidden border-border/60 hover:shadow-md transition-shadow" data-testid={`interview-${interview.id}`}>
              <CardHeader className="bg-muted/20 border-b pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{interview.jobRole}</CardTitle>
                  {interview.status === "completed" ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 dark:bg-blue-900/30 dark:text-blue-400">
                      <RefreshCw className="w-3 h-3" /> In Progress
                    </span>
                  )}
                </div>
                <CardDescription className="flex gap-2 text-xs">
                  <span className="capitalize">{interview.interviewType}</span> • <span>{interview.experienceLevel}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                {interview.status === "completed" && interview.overallScore !== null ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="text-4xl font-black text-primary mb-1">{interview.overallScore}</div>
                    <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Score</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <PlayCircle className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Session incomplete</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 border-t bg-muted/5 p-4 flex justify-end">
                <Button variant={interview.status === "completed" ? "outline" : "default"} className="w-full" asChild>
                  <a href={`/mock-interviews/${interview.id}`} data-testid={`link-interview-${interview.id}`}>
                    {interview.status === "completed" ? "View Results" : "Continue Session"} <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MockInterviewSession({ id }: { id: number }) {
  const { data: interview, isLoading, refetch } = useGetMockInterview(id);
  const answerInterview = useAnswerMockInterview();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    answerInterview.mutate({ id, data: { answer } }, {
      onSuccess: () => {
        setAnswer("");
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to submit answer", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <Skeleton className="h-[600px] rounded-2xl" />;
  }

  if (!interview) {
    return <div>Interview not found</div>;
  }

  if (interview.status === "completed") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Results</h1>
            <p className="text-muted-foreground mt-1">{interview.jobRole} • {interview.experienceLevel}</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/mock-interviews">Back to Interviews</a>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overall</span>
              <span className="text-4xl font-black text-primary">{interview.overallScore ?? 0}/100</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Technical</span>
              <span className="text-3xl font-bold">{interview.technicalScore ?? 0}/100</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Communication</span>
              <span className="text-3xl font-bold">{interview.communicationScore ?? 0}/100</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Confidence</span>
              <span className="text-3xl font-bold">{interview.confidenceScore ?? 0}/100</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-green-200 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.strengths.map((str, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <XCircle className="w-5 h-5" /> Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.weaknesses.map((wk, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" /> Key Suggestions for Next Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {interview.suggestions.map((sug, i) => (
                <li key={i} className="flex gap-3 bg-muted/40 p-4 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <span className="font-medium text-sm leading-relaxed">{sug}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = interview.messages.filter(m => m.role === 'interviewer').pop();
  const pastMessages = interview.messages.slice(0, interview.messages.length - 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mock Interview</h1>
          <p className="text-sm text-muted-foreground mt-1">{interview.jobRole} • {interview.interviewType}</p>
        </div>
        <Button variant="ghost" asChild>
          <a href="/mock-interviews">Save & Exit</a>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
        {pastMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'interviewer' 
                ? 'bg-muted/80 text-foreground rounded-tl-sm' 
                : 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
            }`}>
              <div className="text-xs font-semibold mb-1 opacity-70 uppercase tracking-wide">
                {msg.role === 'interviewer' ? 'AI Interviewer' : 'You'}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {currentQuestion && (
          <div className="flex justify-start pt-4 border-t">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-6 py-5 bg-card border-2 border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-3 uppercase tracking-wide">
                <PlayCircle className="w-4 h-4" /> Current Question
              </div>
              <p className="whitespace-pre-wrap leading-relaxed font-medium text-lg">{currentQuestion.content}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAnswerSubmit} className="bg-card border rounded-2xl shadow-sm p-3 flex gap-3 shrink-0">
        <Textarea 
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[80px] resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent"
          data-testid="input-answer"
        />
        <Button 
          type="submit" 
          disabled={answerInterview.isPending || !answer.trim()} 
          className="h-auto px-6 rounded-xl self-end"
          data-testid="button-submit-answer"
        >
          {answerInterview.isPending ? "Sending..." : "Submit Answer"}
        </Button>
      </form>
    </div>
  );
}
