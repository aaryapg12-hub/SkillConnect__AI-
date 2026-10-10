import { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Save, Calendar, Award, Zap, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";

export default function Profile() {
  const { data: profile, isLoading, refetch } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useUser();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setHeadline(profile.headline || "");
      setTargetRole(profile.targetRole || "");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: { name, headline, targetRole } }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        setIsEditing(false);
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to update profile", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your identity and career goals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/10 bg-gradient-to-b from-primary/5 to-transparent">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center overflow-hidden mb-4 shadow-inner">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-12 h-12 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-1">{profile?.name}</h2>
            <p className="text-sm font-medium text-primary mb-6">{profile?.headline || "No headline set"}</p>
            
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> XP</span>
                <span className="font-bold">{profile?.xp || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-500" /> Streak</span>
                <span className="font-bold">{profile?.streak || 0} days</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background rounded-xl border text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4 text-blue-500" /> Readiness</span>
                <span className="font-bold">{profile?.careerReadiness || 0}%</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t w-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'recently'}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your basic info and goals.</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Jane Doe" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional Headline</Label>
                  <Input 
                    id="headline" 
                    value={headline} 
                    onChange={(e) => setHeadline(e.target.value)} 
                    placeholder="e.g. Aspiring Full Stack Developer" 
                  />
                  <p className="text-xs text-muted-foreground">A short description of who you are professionally.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role</Label>
                  <Input 
                    id="targetRole" 
                    value={targetRole} 
                    onChange={(e) => setTargetRole(e.target.value)} 
                    placeholder="e.g. Junior React Engineer" 
                  />
                  <p className="text-xs text-muted-foreground">The job title you are currently aiming for. This helps AI tailor recommendations.</p>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Full Name</h4>
                  <p className="text-lg font-medium">{profile?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Headline</h4>
                  <p className="text-lg font-medium">{profile?.headline || <span className="text-muted-foreground italic">Not set</span>}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Role</h4>
                  <p className="text-lg font-medium bg-muted inline-block px-3 py-1 rounded-lg">
                    {profile?.targetRole || "Not set"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
