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
      console.log(res.data);
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
        <Card 
          key={activity._id} 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/20"
          onClick={() => navigate(`/activity/${activity._id}`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-4 flex-1">
              <Avatar>
                <AvatarImage src={activity.userId?.photoUrl} />
                <AvatarFallback>{activity.userId?.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1">
                <span className="font-semibold">{activity.userId?.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.startTime).toLocaleString()}
                </span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/activity/${activity._id}/map`);
              }}
              className="gap-2 flex items-center bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-6 py-2 text-sm font-semibold flex-shrink-0"
            >
              <MapPin className="h-5 w-5" />
              <span>Maps</span>
            </button>
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

            <div className="grid grid-cols-3 gap-3 text-sm mt-4">
              <div className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10 hover:border-primary/20 transition-colors">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground">
                  {activity.summary?.totalDistance ? (activity.summary.totalDistance / 1000).toFixed(2) : 0}
                </span>
                <span className="text-xs text-muted-foreground">km</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10 hover:border-primary/20 transition-colors">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground text-sm">
                  {formatDuration(activity.summary?.duration || activity.duration || 0, activity.startTime, activity.endTime)}
                </span>
                <span className="text-xs text-muted-foreground">time</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10 hover:border-primary/20 transition-colors">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground">
                  {new Date(activity.startTime).getDate()}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(activity.startTime).toLocaleString('default', { month: 'short' })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDuration(durationInSeconds, startTime, endTime) {
  let seconds = durationInSeconds;
  
  // If duration is 0 or not provided, calculate from timestamps
  if (!seconds || seconds === 0) {
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      seconds = Math.floor((end - start) / 1000);
    } else {
      return "N/A";
    }
  }
  
  // Ensure we have a valid number
  if (typeof seconds !== 'number' || seconds < 0) {
    return "N/A";
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${secs}s`;
  }
}
