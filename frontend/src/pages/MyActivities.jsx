import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Activity, MapPin, Clock, Calendar, ArrowLeft, BarChart2, Map as MapIcon, ChevronLeft, ChevronRight, Brain, TrendingUp, Flame, Mountain, Timer, Footprints, Zap, Trophy, Target } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserSidebar } from "../components/UserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { ActivityStatsCalendar } from "../components/ActivityStatsCalendar";

export default function MyActivities() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('default'); // 'default' | 'stats'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [consistencySuggestions, setConsistencySuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showConsistency, setShowConsistency] = useState(false);

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

  const handleConsistencyClick = async () => {
    try {
      setLoadingSuggestions(true);
      setShowConsistency(true);
      const detailedStats = getDetailedStats();
      const consistencyStatus = detailedStats.find(s => s.label === "Consistency")?.value;
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/consistency-suggestions`, {
        consistencyStatus,
        activities,
        userProfile: user
      });
      setConsistencySuggestions(res.data);
    } catch (err) {
      console.error("Consistency suggestions failed:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAnalyzeProfile = async () => {
    try {
      setAnalyzing(true);
      setShowAnalysis(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/analyze-profile`, {
        activities,
        userProfile: user
      });
      setAiAnalysis(res.data);
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setAnalyzing(false);
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

  const getLast30DaysStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentActivities = activities.filter(a => new Date(a.startTime) >= thirtyDaysAgo);
    
    // Create array of last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayActivities = recentActivities.filter(a => {
        const ad = new Date(a.startTime);
        return ad.getDate() === d.getDate() && ad.getMonth() === d.getMonth();
      });
      
      const dayDistance = dayActivities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0);
      
      chartData.push({
        date: dateStr,
        distance: parseFloat((dayDistance / 1000).toFixed(2))
      });
    }
    
    return chartData;
  };

  const getDetailedStats = () => {
    const totalActivities = activities.length;
    const totalDistance = activities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0);
    const totalDuration = activities.reduce((sum, a) => sum + (a.summary?.duration || 0), 0);
    
    // Simple consistency check
    const lastActivityDate = activities.length > 0 ? new Date(activities[0].startTime) : null;
    const daysSinceLast = lastActivityDate ? Math.floor((new Date() - lastActivityDate) / (1000 * 60 * 60 * 24)) : 999;
    let consistencyStatus = "Inactive";
    let consistencyColor = "text-gray-500";
    
    if (daysSinceLast <= 3) {
      consistencyStatus = "Very Active";
      consistencyColor = "text-green-500";
    } else if (daysSinceLast <= 7) {
      consistencyStatus = "Active";
      consistencyColor = "text-blue-500";
    } else if (daysSinceLast <= 14) {
      consistencyStatus = "Slipping";
      consistencyColor = "text-yellow-500";
    }

    return [
      { label: "Total Activities", value: totalActivities, icon: Activity, color: "text-blue-500" },
      { label: "Total Distance", value: `${(totalDistance / 1000).toFixed(1)} km`, icon: MapPin, color: "text-green-500" },
      { label: "Total Time", value: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`, icon: Clock, color: "text-orange-500" },
      { label: "Consistency", value: consistencyStatus, icon: Target, color: consistencyColor },
    ];
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
      chartData, // Keeping this for backward compatibility if needed, but we use getLast30DaysStats for the main chart
      totalDistance: monthlyActivities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0)
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const last30DaysData = getLast30DaysStats();
  const detailedStats = getDetailedStats();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const hasActivity = monthlyStats.activities.some(a => new Date(a.startTime).getDate() === i);
      days.push(
        <div 
          key={i} 
          className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium transition-all
            ${hasActivity ? 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 shadow-sm' : 'text-muted-foreground hover:bg-muted'}
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
              
              <div className="flex items-center gap-3">
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
            </div>

            {/* Consistency Suggestions Dialog */}
            <Dialog open={showConsistency} onOpenChange={setShowConsistency}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <Target className="h-6 w-6 text-cyan-500" />
                    Consistency Improvement Guide
                  </DialogTitle>
                  <DialogDescription>
                    AI-powered suggestions to help you stay consistent with your fitness goals.
                  </DialogDescription>
                </DialogHeader>
                
                {loadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                    <p className="text-muted-foreground">Generating personalized suggestions...</p>
                  </div>
                ) : consistencySuggestions ? (
                  <div className="space-y-6 py-4">
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-100 dark:border-cyan-800">
                      <h4 className="font-semibold text-cyan-700 dark:text-cyan-300 mb-2">Why Consistency Matters</h4>
                      <p className="text-sm text-cyan-900 dark:text-cyan-200 leading-relaxed">
                        {typeof consistencySuggestions.importance === 'string' ? consistencySuggestions.importance : JSON.stringify(consistencySuggestions.importance)}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" /> Your Action Plan This Week
                      </h4>
                      <ul className="space-y-2">
                        {consistencySuggestions.tips && Array.isArray(consistencySuggestions.tips) ? consistencySuggestions.tips.map((tip, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground pt-0.5">{typeof tip === 'string' ? tip : JSON.stringify(tip)}</span>
                          </li>
                        )) : null}
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" /> Your Motivation Boost
                      </h4>
                      <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                        {typeof consistencySuggestions.motivation === 'string' ? consistencySuggestions.motivation : JSON.stringify(consistencySuggestions.motivation)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to generate suggestions. Please try again.
                  </div>
                )}
              </DialogContent>
            </Dialog>

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
                
                {/* Detailed Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {detailedStats.map((stat, index) => (
                    <Card 
                      key={index} 
                      className={`overflow-hidden border-2 ${stat.label === "Consistency" ? "border-purple-200/30 dark:border-purple-700/30 cursor-pointer hover:shadow-lg hover:border-purple-500 transition-all" : "border-purple-200/20 dark:border-purple-700/20 hover:shadow-md transition-shadow hover:border-purple-200/40"}`}
                      onClick={() => stat.label === "Consistency" && handleConsistencyClick()}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                        <div className={`p-2 rounded-full ${stat.color === "text-blue-500" ? "bg-blue-100 dark:bg-blue-900/30" : stat.color === "text-green-500" ? "bg-green-100 dark:bg-green-900/30" : stat.color === "text-orange-500" ? "bg-orange-100 dark:bg-orange-900/30" : "bg-purple-100 dark:bg-purple-900/30"}`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                          <p className="text-lg font-bold">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* New Activity Stats Calendar Component */}
                <ActivityStatsCalendar 
                  last30DaysData={last30DaysData}
                  monthlyStats={monthlyStats}
                  activities={activities}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
