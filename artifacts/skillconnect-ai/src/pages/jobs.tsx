import { useState } from "react";
import { useListJobs, useGetJob, useToggleJobBookmark } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BookmarkIcon, BriefcaseIcon, MapPinIcon, BanknoteIcon, ExternalLinkIcon, SearchIcon, ClockIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function Jobs() {
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: jobs, isLoading, refetch } = useListJobs({
    query: {
      queryKey: ["jobs", roleFilter, locationFilter, experienceFilter, bookmarkedOnly],
    },
    request: {
      query: {
        role: roleFilter || undefined,
        location: locationFilter || undefined,
        experienceLevel: experienceFilter || undefined,
        bookmarkedOnly: bookmarkedOnly || undefined,
      } as any
    }
  } as any);

  const { data: selectedJob, isLoading: isLoadingJob } = useGetJob(selectedJobId as number, {
    query: {
      enabled: selectedJobId !== null
    } as any
  });

  const toggleBookmark = useToggleJobBookmark();
  const { toast } = useToast();

  const handleToggleBookmark = (id: number, currentStatus: boolean) => {
    toggleBookmark.mutate({ id }, {
      onSuccess: () => {
        toast({ title: currentStatus ? "Bookmark removed" : "Job bookmarked" });
        refetch();
      },
      onError: () => {
        toast({ title: "Failed to update bookmark", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Board</h1>
          <p className="text-muted-foreground mt-1">Find roles that match your skill gaps and career goals.</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Search Role</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Developer..." 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-9"
                  data-testid="input-role-filter"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Remote..." 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-9"
                  data-testid="input-location-filter"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Experience</Label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Level</SelectItem>
                  <SelectItem value="Entry Level">Entry Level</SelectItem>
                  <SelectItem value="Mid Level">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pb-2 pl-2">
              <Switch 
                id="bookmarked" 
                checked={bookmarkedOnly}
                onCheckedChange={setBookmarkedOnly}
                data-testid="switch-bookmarked"
              />
              <Label htmlFor="bookmarked" className="cursor-pointer">Saved Only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-border bg-muted/5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
            <BriefcaseIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Try adjusting your filters or search terms.</p>
          <Button onClick={() => {
            setRoleFilter("");
            setLocationFilter("");
            setExperienceFilter("");
            setBookmarkedOnly(false);
          }} variant="outline">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs?.map((job) => (
            <Card key={job.id} className="overflow-hidden border-border/60 hover:shadow-md transition-all group flex flex-col h-full cursor-pointer" onClick={() => setSelectedJobId(job.id)} data-testid={`job-${job.id}`}>
              <CardHeader className="pb-4 items-start relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleBookmark(job.id, job.isBookmarked);
                  }}
                  data-testid={`button-bookmark-${job.id}`}
                >
                  <BookmarkIcon 
                    className={`h-5 w-5 transition-colors ${job.isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} 
                  />
                </Button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted border flex items-center justify-center shrink-0 overflow-hidden bg-white">
                    {job.logoUrl ? (
                      <img src={job.logoUrl} alt={job.company} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="font-bold text-lg text-muted-foreground">{job.company.charAt(0)}</span>
                    )}
                  </div>
                  <div className="pr-8">
                    <CardTitle className="text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{job.role}</CardTitle>
                    <CardDescription className="text-sm font-medium text-primary">{job.company}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pb-4">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" /> {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <BriefcaseIcon className="w-4 h-4" /> {job.experienceLevel}
                  </div>
                  <div className="flex items-center gap-1">
                    <BanknoteIcon className="w-4 h-4" /> {job.salary}
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-muted/50 text-xs font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/5 mt-auto flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" /> Posted {new Date(job.postedAt).toLocaleDateString()}
                </div>
                <Button size="sm" className="h-8 rounded-lg" data-testid={`button-apply-${job.id}`}>
                  View Details <ExternalLinkIcon className="w-3 h-3 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectedJobId !== null} onOpenChange={(open) => !open && setSelectedJobId(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {isLoadingJob ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full mt-4" />
            </div>
          ) : selectedJob ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-muted border flex items-center justify-center shrink-0 overflow-hidden bg-white">
                    {selectedJob.logoUrl ? (
                      <img src={selectedJob.logoUrl} alt={selectedJob.company} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="font-bold text-2xl text-muted-foreground">{selectedJob.company.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedJob.role}</DialogTitle>
                    <DialogDescription className="text-base text-primary font-medium">{selectedJob.company}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 text-sm text-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 w-[45%]">
                    <MapPinIcon className="w-4 h-4 text-muted-foreground" /> {selectedJob.location}
                  </div>
                  <div className="flex items-center gap-2 w-[45%]">
                    <BriefcaseIcon className="w-4 h-4 text-muted-foreground" /> {selectedJob.experienceLevel}
                  </div>
                  <div className="flex items-center gap-2 w-[45%]">
                    <BanknoteIcon className="w-4 h-4 text-muted-foreground" /> {selectedJob.salary}
                  </div>
                  <div className="flex items-center gap-2 w-[45%]">
                    <ClockIcon className="w-4 h-4 text-muted-foreground" /> Posted {new Date(selectedJob.postedAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6 pt-4 border-t flex flex-row items-center justify-between sm:justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => handleToggleBookmark(selectedJob.id, selectedJob.isBookmarked)}
                >
                  <BookmarkIcon className={`w-4 h-4 mr-2 ${selectedJob.isBookmarked ? 'fill-primary text-primary' : ''}`} />
                  {selectedJob.isBookmarked ? 'Saved' : 'Save Job'}
                </Button>
                <Button className="flex-1 sm:flex-none">
                  Apply on Company Site <ExternalLinkIcon className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div>Job not found</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
