import React from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, MessageSquare, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/resumes", label: "Resumes", icon: FileText },
    { href: "/coach", label: "AI Coach", icon: MessageSquare },
    { href: "/skill-gaps", label: "Skill Gaps", icon: FileText },
    { href: "/career-recommendations", label: "Careers", icon: FileText },
    { href: "/roadmaps", label: "Roadmaps", icon: FileText },
    { href: "/mock-interviews", label: "Mock Interviews", icon: MessageSquare },
    { href: "/jobs", label: "Jobs", icon: FileText },
    { href: "/cover-letters", label: "Cover Letters", icon: FileText },
    { href: "/profile", label: "Profile", icon: FileText },
    { href: "/progress", label: "Progress", icon: FileText },
  ];

  const NavLinks = () => (
    <div className="space-y-2">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              location === item.href
                ? "bg-primary text-primary-foreground font-semibold shadow-md"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="md:hidden border-b p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold">SkillConnect</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="py-6 h-full flex flex-col">
              <NavLinks />
              <div className="mt-auto">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">SkillConnect</span>
          </div>
          <NavLinks />
        </div>
        <div className="mt-auto p-6 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">{user?.firstName?.[0]}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground truncate w-32">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
