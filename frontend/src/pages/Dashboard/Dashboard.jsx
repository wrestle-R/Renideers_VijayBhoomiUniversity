import { useUser } from "../../context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { SidebarProvider } from "../../components/ui/sidebar";
import { UserSidebar } from "../../components/UserSidebar";
import { Mountain, Trophy, Coins, Users, CheckCircle2, AlertCircle, Activity, MapPin, Clock, Bell } from "lucide-react";
import { LoadingPage } from "../../components/LoadingPage";
import { Button } from "../../components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ActivityFeed } from "../../components/ActivityFeed";
import { useDashboardViewMode } from "../../hooks/useDashboardViewMode";
import { MotivationalQuotes } from "../../components/MotivationalQuotes";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [friends, setFriends] = useState([]);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [viewMode, setViewMode] = useDashboardViewMode('dashboard');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myActivitiesCount, setMyActivitiesCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followers/stats`, {
            headers: { 'x-user-id': user.mongo_uid }
          });
          setStats(res.data);
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      };

      const fetchFriends = async () => {
        try {
          // Fetching following as "friends" for now
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followers/following`, {
            headers: { 'x-user-id': user.mongo_uid }
          });
          setFriends(res.data.slice(0, 5)); // Show top 5
        } catch (error) {
          console.error("Error fetching friends:", error);
        }
      };

      const checkProfileCompletion = async () => {
        try {
          setProfileLoading(true);
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile/${user.mongo_uid}`);
          if (res.ok) {
            const data = await res.json();
            const isComplete = !!(
              data.username && 
              data.bio && 
              data.location && 
              data.experienceLevel
            );
            setProfileComplete(isComplete);
          }
        } catch (error) {
          console.error("Error checking profile:", error);
        } finally {
          setProfileLoading(false);
        }
      };

      const fetchPendingRequests = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followers/pending`, {
            headers: { 'x-user-id': user.mongo_uid }
          });
          setPendingRequests(res.data);
        } catch (error) {
          console.error("Error fetching pending requests:", error);
        }
      };

      const fetchMyActivitiesCount = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/activities/my-activities`, {
            headers: { 'x-user-id': user.mongo_uid }
          });
          setMyActivitiesCount(res.data.length);
        } catch (error) {
          console.error("Error fetching my activities count:", error);
        }
      };

      fetchStats();
      fetchFriends();
      checkProfileCompletion();
      fetchPendingRequests();
      fetchMyActivitiesCount();
    }
  }, [user]);

  if (!user) {
    return <LoadingPage />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 pb-24 lg:pb-8 lg:ml-64">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
                <Button 
                  variant={viewMode === 'dashboard' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('dashboard')}
                  className="cursor-pointer"
                >
                  Dashboard
                </Button>
                <Button 
                  variant={viewMode === 'feed' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('feed')}
                  className="cursor-pointer"
                >
                  Feed
                </Button>
              </div>
            </div>

            {viewMode === 'dashboard' ? (
              <div className="space-y-8">
                {/* Motivational Quotes Section */}
                <MotivationalQuotes />

                {/* Pending Requests Notification */}
                {pendingRequests.length > 0 && (
                  <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                    <CardContent className="pt-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-blue-900 dark:text-blue-100">
                              {pendingRequests.length} Pending Follow Request{pendingRequests.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-sm leading-snug text-blue-700 dark:text-blue-200">
                              You have new follow requests waiting for your approval.
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => navigate("/explore")}
                          className="w-full md:w-auto flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Requests
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Profile Completion Indicator */}
                {!profileLoading && !profileComplete && (
                  <Card className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Complete Your Profile</h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Add your bio, location, and experience level to connect with more trekkers.
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/dashboard/profiles')}>
                          Complete Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* My Activities Mobile Card */}
                <Card className="lg:hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      My Activities
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myActivitiesCount}</div>
                    <p className="text-xs text-muted-foreground">
                      Recorded activities
                    </p>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => navigate('/my-activities')}
                    >
                      Show my activities
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Followers
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.followersCount}</div>
                      <Link to="/followers" className="text-xs text-muted-foreground hover:underline">
                        View all
                      </Link>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Following
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.followingCount}</div>
                      <Link to="/followers" className="text-xs text-muted-foreground hover:underline">
                        View all
                      </Link>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Treks
                      </CardTitle>
                      <Mountain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">
                        +0% from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Distance Travelled
                      </CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12.5 km</div>
                      <p className="text-xs text-muted-foreground">
                        this week
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 p-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user.photoUrl} />
                          <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>My Friends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {friends.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No friends yet. Go explore!</p>
                        ) : (
                          friends.map(friend => (
                            <div key={friend._id} className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={friend.photoUrl} />
                                <AvatarFallback>{friend.fullName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <Link to={`/${friend.username || friend._id}`} className="font-medium hover:underline text-foreground">
                                  {friend.fullName}
                                </Link>
                              </div>
                            </div>
                          ))
                        )}
                        <Link to="/explore">
                          <button className="w-full mt-4 text-sm text-primary hover:underline">
                            Find more friends
                          </button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                </div>
                ) : (
                  <div className="space-y-6">
                    <ActivityFeed />
                  </div>
                )}
              </div>
            </main>
          </div>
        </SidebarProvider>
      );
    }
