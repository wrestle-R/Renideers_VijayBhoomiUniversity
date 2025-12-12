import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { SidebarProvider } from "../../components/ui/sidebar";
import { UserSidebar } from "../../components/UserSidebar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { toast } from "react-hot-toast";

export default function Profiles() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    experienceLevel: "beginner",
    goals: "",
    motivations: "",
    website: "",
    instagram: "",
    twitter: "",
    visibility: "private"
  });

  useEffect(() => {
    if (user?.mongo_uid) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile/${user.mongo_uid}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          username: data.username || "",
          bio: data.bio || "",
          location: data.location || "",
          experienceLevel: data.experienceLevel || "beginner",
          goals: data.goals ? data.goals.join(", ") : "",
          motivations: data.motivations ? data.motivations.join(", ") : "",
          website: data.socialLinks?.website || "",
          instagram: data.socialLinks?.instagram || "",
          twitter: data.socialLinks?.twitter || "",
          visibility: data.visibility || "private"
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Normalize website input:
  // - leave full URLs (http/https) as-is
  // - prepend https:// for domain-like inputs (contain a dot)
  // - treat other inputs as local usernames and convert to site URL
  const normalizeWebsite = (input) => {
    if (!input) return '';
    const v = String(input).trim();
    if (!v) return '';

    // full URL
    if (/^https?:\/\//i.test(v)) return v;

    // looks like a domain (example.com) -> add https://
    if (/\./.test(v) && !/\s/.test(v)) {
      return `https://${v}`;
    }

    // otherwise treat as username -> build a profile link on this site
    const origin = import.meta.env.VITE_APP_URL || window.location?.origin || 'http://localhost:5173';
    const clean = v.replace(/^@/, '').trim();
    return `${origin}/${encodeURIComponent(clean)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        userId: user.mongo_uid,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        experienceLevel: formData.experienceLevel,
        goals: formData.goals.split(",").map(s => s.trim()).filter(Boolean),
        motivations: formData.motivations.split(",").map(s => s.trim()).filter(Boolean),
        socialLinks: {
          website: normalizeWebsite(formData.website),
          instagram: formData.instagram,
          twitter: formData.twitter
        },
        visibility: formData.visibility
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 pb-24 lg:pb-8 lg:ml-64">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your profile information and preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" value={formData.username} onChange={handleChange} placeholder="username" className="border border-input" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself" className="border border-input" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className="border border-input" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <select 
                        id="experienceLevel" 
                        name="experienceLevel" 
                        value={formData.experienceLevel} 
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">Goals (comma separated)</Label>
                    <Input id="goals" name="goals" value={formData.goals} onChange={handleChange} placeholder="e.g. Hike Everest, Run 5k" className="border border-input" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivations">Motivations (comma separated)</Label>
                    <Input id="motivations" name="motivations" value={formData.motivations} onChange={handleChange} placeholder="e.g. Fitness, Nature" className="border border-input" />
                  </div>

                  <div className="space-y-2">
                    <Label>Social Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input name="website" value={formData.website} onChange={handleChange} placeholder="Website URL" className="border border-input" />
                      <Input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram Handle" className="border border-input" />
                      <Input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="Twitter Handle" className="border border-input" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Profile Visibility</Label>
                    <select 
                      id="visibility" 
                      name="visibility" 
                      value={formData.visibility} 
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
