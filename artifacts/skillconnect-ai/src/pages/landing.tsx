import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Target, Brain, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-background overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">SkillConnect</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-semibold">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary shadow-lg hover:shadow-xl transition-all font-semibold rounded-full px-6">
              Start Free
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center max-w-4xl mx-auto pt-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium mb-8 text-primary border border-primary/20 shadow-sm">
          <Sparkles className="w-4 h-4" />
          Your AI Career Mentor is Here
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
          Level up your career with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI guidance.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Upload your resume, find your skill gaps, and get personalized roadmaps to land your next dream role. The personal career studio for ambitious professionals.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg bg-primary shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
              Start your journey <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full">
          <div className="bg-card p-6 rounded-3xl shadow-xl border border-border/50 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Resume Optimization</h3>
            <p className="text-muted-foreground">Beat the ATS with AI-powered feedback tailored to your exact target role.</p>
          </div>
          
          <div className="bg-card p-6 rounded-3xl shadow-xl border border-border/50 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Skill Gap Analysis</h3>
            <p className="text-muted-foreground">Identify exactly what you need to learn to make your next career leap.</p>
          </div>

          <div className="bg-card p-6 rounded-3xl shadow-xl border border-border/50 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-foreground/5 rounded-full blur-3xl group-hover:bg-accent-foreground/20 transition-all duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Interview Prep</h3>
            <p className="text-muted-foreground">Practice with an AI interviewer that gives you real-time confidence scores.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
