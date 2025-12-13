import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Activity, MapPin, Clock, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserSidebar } from "../components/UserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";

export default function MyActivities() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/activities/my-activities`, {
        headers: { 'x-user-id': user.mongo_uid }
      });
      setActivities(res.data);
    } catch (err) {
      console.error("Error fetching my activities:", err);
      setError("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds, start, end) => {
    if (seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
    }
    if (start && end) {
      const diff = (new Date(end) - new Date(start)) / 1000;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      return `${h > 0 ? `${h}h ` : ''}${m}m`;
    }
    return '0m';
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 pb-24 lg:pb-8 lg:ml-64">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="flex items-center justify-between space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="lg:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">My Activities</h2>
              </div>
              <span className="text-muted-foreground">{activities.length} Activities</span>
            </div>

            {loading && <div className="text-center py-10">Loading activities...</div>}
            
            {error && <div className="text-center py-10 text-red-500">{error}</div>}

            {!loading && !error && activities.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>You haven't recorded any activities yet.</p>
                <p className="text-sm mt-2">Start tracking your adventures!</p>
              </div>
            )}

            <div className="space-y-4">
              {activities.map((activity) => (
                <Card 
                  key={activity._id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/activity/${activity._id}`)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar>
                      <AvatarImage src={activity.userId?.photoUrl} />
                      <AvatarFallback>{activity.userId?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">{activity.userId?.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.startTime).toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="font-medium">{activity.title}</span>
                    </div>
                    
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {activity.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
                      <div className="flex flex-col items-center gap-1 p-2 bg-muted/50 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {activity.summary?.totalDistance ? (activity.summary.totalDistance / 1000).toFixed(2) : 0} km
                        </span>
                        <span className="text-xs">Distance</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 bg-muted/50 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {formatDuration(activity.summary?.duration || activity.duration || 0, activity.startTime, activity.endTime)}
                        </span>
                        <span className="text-xs">Duration</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {new Date(activity.startTime).toLocaleDateString()}
                        </span>
                        <span className="text-xs">Date</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
