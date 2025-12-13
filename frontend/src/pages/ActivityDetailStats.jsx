import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { 
  ArrowLeft, Calendar, Clock, MapPin, Flame, TrendingUp, TrendingDown, 
  Activity as ActivityIcon, Heart, Zap, Footprints, Wind, Mountain, 
  AlertCircle, CheckCircle2, Lightbulb, Trophy, BarChart as BarChartIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import ReactMarkdown from 'react-markdown';
import { UserSidebar } from "../components/UserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";

const formatDuration = (durationInSeconds, startTime, endTime) => {
  let seconds = durationInSeconds;
  
  if (!seconds || seconds === 0) {
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      seconds = Math.floor((end - start) / 1000);
    } else {
      return "N/A";
    }
  }
  
  if (typeof seconds !== 'number' || seconds < 0 || isNaN(seconds)) {
    return "N/A";
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const StatCard = ({ icon: Icon, label, value, unit, trend = null }) => (
  <Card className="flex-1 min-w-[150px]">
    <CardContent className="flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </div>
      {trend && (
        <span className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </CardContent>
  </Card>
);

export default function ActivityDetailStats() {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [insights, setInsights] = useState(null);
  const [paceSplits, setPaceSplits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [paceSplitsLoading, setPaceSplitsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    localStorage.setItem('lastVisitedPage', window.location.pathname);
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/activities/${id}`, {
          headers: { 'x-user-id': user?.mongo_uid }
        });
        setActivity(res.data);
      } catch (err) {
        console.error("Error fetching activity details:", err);
        setError("Failed to load activity details.");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchActivity();
    }
  }, [user, id]);

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/activities/${id}/insights`, {
        headers: { 'x-user-id': user?.mongo_uid }
      });
      setInsights(res.data);
    } catch (err) {
      console.error("Error fetching insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchPaceSplits = async () => {
    try {
      setPaceSplitsLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/activities/${id}/pace-splits?unit=km`, {
        headers: { 'x-user-id': user?.mongo_uid }
      });
      setPaceSplits(res.data);
    } catch (err) {
      console.error("Error fetching pace splits:", err);
    } finally {
      setPaceSplitsLoading(false);
    }
  };

  useEffect(() => {
    if (user && id && activity) {
      fetchPaceSplits();
    }
  }, [user, id, activity]);

  const formatPaceNumeric = (pace) => {
    const num = Number(pace);
    if (!isFinite(num) || num <= 0) return '0:00';
    const minutes = Math.floor(num);
    const seconds = Math.round((num - minutes) * 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500 text-lg">{error || "Activity not found"}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const pathCoordinates = activity.path?.map(p => [p.latitude, p.longitude]) || [];
  const center = pathCoordinates.length > 0 ? pathCoordinates[0] : [19.252206, 72.850559];

  // Prepare split data for charts
  const splitData = activity.splits?.map((split, idx) => ({
    name: `km ${idx + 1}`,
    distance: (split.distance / 1000).toFixed(2),
    time: split.time ? (split.time / 60).toFixed(1) : 0, // Convert seconds to minutes
    speed: split.time > 0 ? (split.distance / split.time) * 3.6 : 0, // Calculate speed in km/h
    elevation: split.elevationGain || 0,
    calories: split.calories || 0,
    steps: split.steps || 0,
  })) || [];

  // Calculate Milestones (Fastest 1k, 3k, 5k, 10k, 20k)
  const calculateFastestSplit = (splits, distanceKm) => {
    if (!splits || splits.length < distanceKm) return null;
    
    let minTime = Infinity;
    for (let i = 0; i <= splits.length - distanceKm; i++) {
      let timeSum = 0;
      for (let j = 0; j < distanceKm; j++) {
        timeSum += splits[i + j].time;
      }
      if (timeSum < minTime) minTime = timeSum;
    }
    return minTime === Infinity ? null : minTime;
  };

  const milestones = [
    { distance: 1, label: '1 km', time: calculateFastestSplit(activity.splits, 1) },
    { distance: 3, label: '3 km', time: calculateFastestSplit(activity.splits, 3) },
    { distance: 5, label: '5 km', time: calculateFastestSplit(activity.splits, 5) },
    { distance: 10, label: '10 km', time: calculateFastestSplit(activity.splits, 10) },
    { distance: 20, label: '20 km', time: calculateFastestSplit(activity.splits, 20) },
  ].filter(m => m.time !== null);

  // Safe value extraction
  const summary = activity.summary || {};
  const totalDistance = summary.totalDistance || 0;
  const totalDuration = activity.duration || 0;
  const avgSpeed = summary.averageSpeed || 0;
  const maxSpeed = summary.maxSpeed || 0;
  const caloriesBurned = Math.round(summary.caloriesBurned || 0);
  const totalSteps = summary.totalSteps || 0;
  const elevationGain = summary.totalElevationGain || 0;
  const elevationLoss = summary.totalElevationLoss || 0;
  const avgHeartRate = summary.avgHeartRate ? Math.round(summary.avgHeartRate) : null;
  const maxHeartRate = summary.maxHeartRate ? Math.round(summary.maxHeartRate) : null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 pb-24 lg:pb-8 lg:ml-64">
          <div className="container mx-auto max-w-6xl space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              className="pl-0 hover:bg-transparent" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={activity.userId?.photoUrl} />
              <AvatarFallback>{activity.userId?.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{activity.title}</h1>
              <div className="flex items-center text-muted-foreground gap-2 mt-2">
                <span className="font-medium">{activity.userId?.fullName}</span>
                <span>•</span>
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{new Date(activity.startTime).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button onClick={() => navigate(`/activity/${id}/map`)} className="gap-2">
              <MapPin className="h-4 w-4" />
              View Map
            </Button>
            <div className="flex flex-wrap gap-2 justify-end">
              {activity.tags?.map(tag => (
                <span key={tag} className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium capitalize">
                  {tag}
                </span>
              ))}
              {activity.difficulty && (
                <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                  activity.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                  activity.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                  activity.difficulty === 'hard' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {activity.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>            {/* Main Stats Grid - 4 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={MapPin} 
                label="Distance" 
                value={(totalDistance / 1000).toFixed(2)} 
                unit="km" 
              />
              <StatCard 
                icon={Clock} 
                label="Duration" 
                value={formatDuration(totalDuration, activity.startTime, activity.endTime)} 
                unit="" 
              />
              <StatCard 
                icon={Flame} 
                label="Calories" 
                value={caloriesBurned} 
                unit="kcal" 
              />
              <StatCard 
                icon={TrendingUp} 
                label="Elevation" 
                value={Math.round(elevationGain)} 
                unit="m" 
              />
            </div>

            {/* Secondary Stats Grid - Full Width Scrollable */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Wind} 
                label="Avg Speed" 
                value={avgSpeed.toFixed(2)} 
                unit="km/h" 
              />
              <StatCard 
                icon={Zap} 
                label="Max Speed" 
                value={maxSpeed.toFixed(2)} 
                unit="km/h" 
              />
              <StatCard 
                icon={Footprints} 
                label="Steps" 
                value={totalSteps} 
                unit="steps" 
              />
              <StatCard 
                icon={Mountain} 
                label="Elevation Loss" 
                value={Math.round(elevationLoss)} 
                unit="m" 
              />
            </div>

            {/* Heart Rate Stats (if available) */}
            {(avgHeartRate || maxHeartRate) && (
              <div className="grid grid-cols-2 gap-4">
                {avgHeartRate && (
                  <StatCard 
                    icon={Heart} 
                    label="Avg Heart Rate" 
                    value={avgHeartRate} 
                    unit="bpm" 
                  />
                )}
                {maxHeartRate && (
                  <StatCard 
                    icon={Heart} 
                    label="Max Heart Rate" 
                    value={maxHeartRate} 
                    unit="bpm" 
                  />
                )}
              </div>
            )}

            {/* Pace Per Kilometer/Mile Section */}
            {paceSplitsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
              </Card>
            ) : paceSplits && paceSplits.splits && paceSplits.splits.length > 0 ? (
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Clock className="h-6 w-6 text-primary" />
                      Pace Per {paceSplits.unit === 'km' ? 'Kilometer' : 'Mile'}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {paceSplits.splitCount} {paceSplits.unit === 'km' ? 'km' : 'mile'} splits • {paceSplits.totalDistance} {paceSplits.unit}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={paceSplits.splits}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="label"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        label={{ 
                          value: `Pace (min/${paceSplits.unit})`, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fontSize: '14px', fontWeight: 'bold' }
                        }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid rgba(59, 130, 246, 0.5)', 
                          borderRadius: '8px', 
                          color: '#fff',
                          padding: '12px'
                        }}
                        formatter={(value, name, props) => {
                          if (name === 'pace') {
                            const paceFormatted = props && props.payload && props.payload.paceFormatted
                              ? props.payload.paceFormatted
                              : (typeof value === 'number' ? formatPaceNumeric(value) : value);
                            return [paceFormatted, `Pace (min/${paceSplits.unit})`];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Split: ${label}`}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => value === 'pace' ? `Pace (min/${paceSplits.unit})` : value}
                      />
                      <Bar
                        dataKey="pace"
                        fill="#3b82f6"
                        name="pace"
                        radius={[8, 8, 0, 0]}
                        label={{
                          position: 'top',
                          formatter: (value, entry) => {
                            return (entry && entry.payload && entry.payload.paceFormatted) || formatPaceNumeric(value);
                          },
                          style: { fontSize: '11px', fontWeight: 'bold' }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Pace Summary Table */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Best Pace</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.min(...paceSplits.splits.map(s => s.pace)).toFixed(2)} 
                        <span className="text-xs ml-1">min/{paceSplits.unit}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Slowest Pace</div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {Math.max(...paceSplits.splits.map(s => s.pace)).toFixed(2)}
                        <span className="text-xs ml-1">min/{paceSplits.unit}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Avg Pace</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {(paceSplits.splits.reduce((acc, s) => acc + s.pace, 0) / paceSplits.splits.length).toFixed(2)}
                        <span className="text-xs ml-1">min/{paceSplits.unit}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground mb-1">Total Splits</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {paceSplits.splitCount}
                        <span className="text-xs ml-1">{paceSplits.unit}s</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Map Section Removed */}


            {/* Split Breakdown - Bar Chart */}
            {splitData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Distance Split Breakdown (by km)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={splitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="distance" fill="#3b82f6" name="Distance (km)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Split Breakdown - Comprehensive Vertical Bar Chart */}
            {splitData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5" />
                    Speed per Kilometer Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={splitData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => [`${parseFloat(value).toFixed(2)} km/h`, 'Speed']}
                      />
                      <Legend />
                      <Bar dataKey="speed" fill="#10b981" name="Speed (km/h)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Elevation & Calories Split - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {splitData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mountain className="h-5 w-5" />
                      Elevation Gain per Split
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart 
                        data={splitData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                          formatter={(value) => [`${parseFloat(value).toFixed(1)} m`, 'Elevation']}
                        />
                        <Bar dataKey="elevation" fill="#f59e0b" name="Elevation (m)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {splitData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5" />
                      Calories Burned per Split
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart 
                        data={splitData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis label={{ value: 'Calories (kcal)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                          formatter={(value) => [`${parseFloat(value).toFixed(1)} kcal`, 'Calories']}
                        />
                        <Bar dataKey="calories" fill="#ef4444" name="Calories (kcal)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

        {/* Speed Split Data */}
        {splitData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Speed Per Kilometer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={splitData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`${parseFloat(value).toFixed(2)} km/h`, 'Speed']}
                  />
                  <Legend />
                  <Bar dataKey="speed" fill="#10b981" name="Speed (km/h)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Milestones Section */}
        {milestones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Fastest Splits (Milestones)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {milestones.map((milestone) => (
                  <div key={milestone.distance} className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border-2 border-transparent hover:border-primary/20 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-2">
                      <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-lg font-bold">{milestone.label}</span>
                    <span className="text-2xl font-mono font-bold text-primary mt-1">
                      {formatDuration(milestone.time, null, null)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Best Effort</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Per Km Breakdown */}
            {splitData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Per Split (Pace Analysis)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={splitData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => [`${value.toFixed(1)} min`, 'Time']}
                      />
                      <Legend />
                      <Bar dataKey="time" fill="#8b5cf6" name="Time (minutes)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5" />
                  Detailed Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Speed</p>
                    <p className="text-2xl font-bold">{avgSpeed.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Max Speed</p>
                    <p className="text-2xl font-bold">{maxSpeed.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Distance</p>
                    <p className="text-2xl font-bold">{(totalDistance / 1000).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
                    <p className="text-2xl font-bold">{formatDuration(totalDuration, activity.startTime, activity.endTime)}</p>
                    <p className="text-xs text-muted-foreground">hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Steps</p>
                    <p className="text-2xl font-bold">{totalSteps}</p>
                    <p className="text-xs text-muted-foreground">steps</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Calories Burned</p>
                    <p className="text-2xl font-bold">{caloriesBurned}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Section */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    AI Coach Analysis
                  </CardTitle>
                  {!showInsights && (
                    <Button 
                      onClick={() => {
                        setShowInsights(true);
                        if (!insights) fetchInsights();
                      }}
                      disabled={insightsLoading}
                      size="sm"
                    >
                      {insightsLoading ? 'Analyzing...' : 'Analyze Activity'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showInsights && (
                <CardContent>
                  {insightsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : insights?.insights ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold text-foreground mt-4 mb-2" {...props} />,
                          ul: ({node, ...props}) => <ul className="space-y-2 my-3" {...props} />,
                          li: ({node, ...props}) => (
                            <li className="flex items-start gap-2 text-foreground" {...props}>
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              <span>{props.children}</span>
                            </li>
                          ),
                          p: ({node, ...props}) => <p className="text-foreground/90 leading-relaxed" {...props} />
                        }}
                      >
                        {insights.insights}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Failed to generate insights</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Notes Section */}
            {activity.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed border-l-4 border-primary pl-4 py-2">
                    {activity.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Photos Section */}
            {activity.photos && activity.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Photos ({activity.photos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activity.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={photo.url} 
                          alt={`Activity photo ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}