import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Resumes from "@/pages/resumes";
import Coach from "@/pages/coach";
import SkillGaps from "@/pages/skill-gaps";
import CareerRecommendations from "@/pages/career-recommendations";
import Roadmaps from "@/pages/roadmaps";
import MockInterviews from "@/pages/mock-interviews";
import Jobs from "@/pages/jobs";
import CoverLetters from "@/pages/cover-letters";
import Profile from "@/pages/profile";
import Progress from "@/pages/progress";
import { Layout } from "@/components/layout";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(250 100% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInputBackground: "hsl(240 5% 96%)",
    colorInputText: "hsl(240 10% 10%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "1rem",
  },
  elements: {
    card: "shadow-2xl border-0 rounded-3xl",
    formButtonPrimary: "bg-primary hover:opacity-90 shadow-md transition-all",
  }
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background -z-10" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function AuthenticatedRoutes() {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/resumes" component={Resumes} />
            <Route path="/coach" component={Coach} />
            <Route path="/skill-gaps" component={SkillGaps} />
            <Route path="/career-recommendations" component={CareerRecommendations} />
            <Route path="/roadmaps" component={Roadmaps} />
            <Route path="/mock-interviews" component={MockInterviews} />
            <Route path="/mock-interviews/:id" component={MockInterviews} />
            <Route path="/jobs" component={Jobs} />
            <Route path="/cover-letters" component={CoverLetters} />
            <Route path="/profile" component={Profile} />
            <Route path="/progress" component={Progress} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to SkillConnect AI to continue your journey",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Join SkillConnect AI and level up your career",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={AuthenticatedRoutes} />
            <Route path="/resumes" component={AuthenticatedRoutes} />
            <Route path="/coach" component={AuthenticatedRoutes} />
            <Route path="/skill-gaps" component={AuthenticatedRoutes} />
            <Route path="/career-recommendations" component={AuthenticatedRoutes} />
            <Route path="/roadmaps" component={AuthenticatedRoutes} />
            <Route path="/mock-interviews" component={AuthenticatedRoutes} />
            <Route path="/mock-interviews/:id" component={AuthenticatedRoutes} />
            <Route path="/jobs" component={AuthenticatedRoutes} />
            <Route path="/cover-letters" component={AuthenticatedRoutes} />
            <Route path="/profile" component={AuthenticatedRoutes} />
            <Route path="/progress" component={AuthenticatedRoutes} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
