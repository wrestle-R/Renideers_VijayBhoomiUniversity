import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { UserSidebar } from "../../components/UserSidebar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Plus, Users, Search, Flame, BookOpen, User as UserIcon, Image as ImageIcon, Upload } from "lucide-react";
import toast from "react-hot-toast";

const PUBLIC_IMAGES = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60", // Crowd/Party
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=60", // Friends
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60", // Group Study
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60", // Team
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=60", // Travel
];

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search"); // 'search' or 'my-clubs'
  const [newClub, setNewClub] = useState({ name: "", description: "", motivation: "", image: null, selectedImage: "" });
  const [creatingClub, setCreatingClub] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clubs`, {
        withCredentials: true,
        headers: { 'x-user-id': user?.mongo_uid }
      });
      setClubs(res.data);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast.error("Failed to fetch clubs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClub.name.trim() || !newClub.description.trim() || !newClub.motivation.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newClub.name.trim().length < 3) {
      toast.error("Club name must be at least 3 characters");
      return;
    }

    if (newClub.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (!newClub.image && !newClub.selectedImage) {
      toast.error("Please select an image for the club");
      return;
    }
    
    setCreatingClub(true);
    try {
      const formData = new FormData();
      formData.append("name", newClub.name);
      formData.append("description", newClub.description);
      formData.append("motivation", newClub.motivation);
      
      if (newClub.image) {
        formData.append("image", newClub.image);
      } else if (newClub.selectedImage) {
        formData.append("selectedImage", newClub.selectedImage);
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/clubs`, formData, {
        withCredentials: true,
        headers: { 
          'x-user-id': user?.mongo_uid,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("Club created successfully!");
      setShowCreateForm(false);
      setNewClub({ name: "", description: "", motivation: "", image: null, selectedImage: "" });
      fetchClubs();
      setActiveTab("my-clubs");
    } catch (error) {
      console.error("Error creating club:", error);
      toast.error(error.response?.data?.message || "Failed to create club");
    } finally {
      setCreatingClub(false);
    }
  };

  const myClubs = clubs.filter(club => 
    club.members?.some(member => member._id === user?.mongo_uid)
  );

  const filteredClubs = activeTab === "search"
    ? clubs.filter(club => {
        const isMember = club.members?.some(member => member._id === user?.mongo_uid);
        const matchesSearch = 
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.motivation.toLowerCase().includes(searchQuery.toLowerCase());
        return !isMember && matchesSearch;
      })
    : myClubs;

  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <main className="flex-1 ml-0 lg:ml-64 p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Clubs</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Join communities with shared passions and goals
                </p>
              </div>
            </div>
          </div>

          {/* Create Club Form */}
          {showCreateForm && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Start Your Club
                </CardTitle>
                <CardDescription>Create a community and invite others to join</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateClub} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium">Club Name</Label>
                    <Input
                      id="name"
                      value={newClub.name}
                      onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                      required
                      placeholder="e.g. Morning Runners, Book Club"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">Description</Label>
                    <Input
                      id="description"
                      value={newClub.description}
                      onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                      required
                      placeholder="What is this club about? Keep it concise..."
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivation" className="text-base font-medium">Motivation</Label>
                    <Input
                      id="motivation"
                      value={newClub.motivation}
                      onChange={(e) => setNewClub({ ...newClub, motivation: e.target.value })}
                      required
                      placeholder="What drives this club? What will members gain?"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Club Image</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Upload Option */}
                      <div 
                        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          newClub.image ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewClub({ ...newClub, image: file, selectedImage: "" });
                            }
                          }}
                        />
                        {newClub.image ? (
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-sm font-medium text-primary truncate max-w-[200px]">
                              {newClub.image.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-medium">Upload Image</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                          </div>
                        )}
                      </div>

                      {/* Public Images Option */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">Or choose a cover:</p>
                        <div className="grid grid-cols-5 gap-2">
                          {PUBLIC_IMAGES.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => setNewClub({ ...newClub, selectedImage: img, image: null })}
                              className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                                newClub.selectedImage === img 
                                  ? "border-primary ring-2 ring-primary/20" 
                                  : "border-transparent hover:border-primary/50"
                              }`}
                            >
                              <img 
                                src={img} 
                                alt={`Cover ${idx + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base" disabled={creatingClub}>
                    {creatingClub ? "Creating..." : "Create Club"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
            <div className="flex gap-3 border-b border-border items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => { setActiveTab("search"); setSearchQuery(""); }}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === "search"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Discover Clubs
                  </div>
                  {activeTab === "search" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("my-clubs")}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === "my-clubs"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    My Clubs ({myClubs.length})
                  </div>
                  {activeTab === "my-clubs" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
                  )}
                </button>
              </div>
              
              {/* Create Club Button - Only show in My Clubs tab */}
              {activeTab === "my-clubs" && (
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="gap-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  {showCreateForm ? "Cancel" : "Create Club"}
                </Button>
              )}
            </div>

            {/* Search Bar - Only show in search tab */}
            {activeTab === "search" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search clubs by name, description, or motivation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="space-y-4 text-center">
                <div className="inline-block p-3 bg-primary/10 rounded-full">
                  <Users className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <p className="text-muted-foreground">Loading clubs...</p>
              </div>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="space-y-4 text-center">
                <div className="inline-block p-4 bg-muted rounded-full">
                  {activeTab === "search" ? (
                    <Search className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-muted-foreground text-lg">
                  {activeTab === "search" 
                    ? searchQuery 
                      ? "No clubs match your search"
                      : "No clubs available yet"
                    : "You haven't joined any clubs yet"
                  }
                </p>
                {activeTab === "my-clubs" && (
                  <Button 
                    onClick={() => setActiveTab("search")}
                    variant="outline"
                    className="mt-2"
                  >
                    Discover Clubs
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => {
                const isMember = club.members?.some(member => member._id === user?.mongo_uid);
                return (
                  <Card 
                    key={club._id} 
                    className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => navigate(`/clubs/${club._id}`)}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img 
                        src={club.photoUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60"}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="space-y-2">
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {club.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                            <Users className="w-3 h-3" />
                            {club.members?.length || 0}
                          </div>
                          {isMember && (
                            <div className="bg-green-500/10 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                              ✓ Joined
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Motivation</p>
                          <p className="text-sm line-clamp-1 font-medium text-primary">
                            {club.motivation}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {club.description}
                        </p>
                      </div>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clubs/${club._id}`);
                        }}
                        variant="default"
                        className="w-full group/btn"
                      >
                        {isMember ? "View Club" : "Explore Club"}
                        <span className="ml-2 group-hover/btn:translate-x-1 transition-transform">→</span>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
