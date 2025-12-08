import { useUser } from "../../context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { SidebarProvider } from "../../components/ui/sidebar";
import { UserSidebar } from "../../components/UserSidebar";
import { Mountain, Trophy, Coins, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { LoadingPage } from "../../components/LoadingPage";
import { Button } from "../../components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [friends, setFriends] = useState([]);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

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

      fetchStats();
      fetchFriends();
      checkProfileCompletion();
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
            </div>

            {/* Profile Completion Indicator */}
            {!profileLoading && (
              <Card className={`border-2 ${profileComplete ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' : 'border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {profileComplete ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className={`font-semibold ${profileComplete ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}`}>
                          {profileComplete ? "Profile Complete" : "Complete Your Profile"}
                        </p>
                        <p className={`text-sm ${profileComplete ? 'text-green-700 dark:text-green-200' : 'text-amber-700 dark:text-amber-200'}`}>
                          {profileComplete ? "Great! Your profile is all set up." : "Add more details to your profile to help others find you."}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate("/dashboard/profiles")}
                      className={`flex-shrink-0 ${profileComplete ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                    >
                      {profileComplete ? "View Profile" : "Complete Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
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
                    Tokens Earned
                  </CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0 TRK</div>
                  <p className="text-xs text-muted-foreground">
                    +0% from last month
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
        </main>
      </div>
    </SidebarProvider>
  );
}
