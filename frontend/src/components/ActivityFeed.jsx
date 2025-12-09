import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Activity, MapPin, Clock, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function ActivityFeed() {
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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/activities/feed`, {
        headers: { 'x-user-id': user.mongo_uid }
      });
      setActivities(res.data);
    } catch (err) {
      console.error("Error fetching activity feed:", err);
      setError("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading feed...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Activity className="mx-auto h-12 w-12 mb-4 opacity-20" />
        <p>No recent activities from your friends.</p>
        <p className="text-sm mt-2">Follow more people to see their adventures!</p>
        <Button variant="link" onClick={() => navigate('/explore')}>Find People</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity._id}>
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
                  {formatDuration(activity.summary?.duration || 0)}
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
  );
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
