import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Activity, MapPin, Clock, Calendar, ArrowLeft, BarChart2, Map as MapIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserSidebar } from "../components/UserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MyActivities() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('default'); // 'default' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Stats Calculations
  const getWeeklyStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyActivities = activities.filter(a => new Date(a.startTime) >= oneWeekAgo);
    
    const totalDistance = weeklyActivities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0);
    const count = weeklyActivities.length;
    
    return {
      distance: (totalDistance / 1000).toFixed(2),
      count
    };
  };

  const getMonthlyStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthlyActivities = activities.filter(a => {
      const d = new Date(a.startTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    // Group by day for chart
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const chartData = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayActivities = monthlyActivities.filter(a => new Date(a.startTime).getDate() === i);
      const dayDistance = dayActivities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0);
      chartData.push({
        day: i,
        distance: parseFloat((dayDistance / 1000).toFixed(2))
      });
    }

    return {
      activities: monthlyActivities,
      chartData,
      totalDistance: monthlyActivities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0)
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const hasActivity = monthlyStats.activities.some(a => new Date(a.startTime).getDate() === i);
      days.push(
        <div 
          key={i} 
          className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium
            ${hasActivity ? 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90' : 'text-muted-foreground hover:bg-muted'}
          `}
          title={hasActivity ? 'Activity recorded' : ''}
        >
          {i}
        </div>
      );
    }
    
    return days;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 pb-24 lg:pb-8 lg:ml-64">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Header & Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="lg:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">My Activities</h2>
              </div>
              
              <div className="flex items-center bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('default')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'default' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Feed
                </button>
                <button
                  onClick={() => setViewMode('stats')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'stats' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Stats
                </button>
              </div>
            </div>

            {/* Weekly Stats Summary (Visible in both views) */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Weekly Average (Last 7 Days)</h3>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="text-2xl font-bold">{weeklyStats.distance} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Runs</p>
                    <p className="text-2xl font-bold">{weeklyStats.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {viewMode === 'default' ? (
              /* Default View: Activity List */
              <div className="space-y-4">
                {loading && <div className="text-center py-10">Loading activities...</div>}
                {error && <div className="text-center py-10 text-red-500">{error}</div>}
                {!loading && !error && activities.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No activities found.</p>
                  </div>
                )}

                {activities.map((activity) => (
                  <Card key={activity._id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/20 cursor-pointer" onClick={() => navigate(`/activity/${activity._id}`)}>
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
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/activity/${activity._id}/map`);
                        }}
                        className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-6 py-2 text-sm font-semibold"
                      >
                        <MapIcon className="h-5 w-5" />
                        Maps
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="font-medium">{activity.title}</span>
                      </div>
                      
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
            ) : (
              /* Stats View */
              <div className="space-y-6">
                {/* Calendar Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Activity Calendar</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-medium min-w-[100px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2 text-center mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-xs font-medium text-muted-foreground">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 place-items-center">
                      {renderCalendar()}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Progress Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Distance Progression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyStats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="distance" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Progress Bar Section */}
                 <Card>
                  <CardHeader>
                    <CardTitle>Monthly Goal Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{monthlyStats.totalDistance ? (monthlyStats.totalDistance / 1000).toFixed(1) : 0} km</span>
                        <span className="text-muted-foreground">Goal: 100 km</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(((monthlyStats.totalDistance / 1000) / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
