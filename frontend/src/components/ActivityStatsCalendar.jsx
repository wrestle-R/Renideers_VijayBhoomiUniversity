import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar } from './ui/calendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Target, Zap, Flame } from 'lucide-react';

export function ActivityStatsCalendar({ last30DaysData, monthlyStats, activities }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  
  // Safe date handling
  const safeSelectedDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
  
  // Get activities for selected date with error handling
  const selectedDateStr = safeSelectedDate ? safeSelectedDate.toISOString().split('T')[0] : '';
  const activitiesOnSelectedDate = activities && Array.isArray(activities) ? activities.filter(a => {
    try {
      if (!a || !a.startTime) return false;
      const actDate = new Date(a.startTime).toISOString().split('T')[0];
      return actDate === selectedDateStr;
    } catch (e) {
      console.warn('Error filtering activity:', e);
      return false;
    }
  }) : [];

  // Calculate stats with error handling
  const goalDistance = 100;
  const safeMonthlyStats = monthlyStats || { totalDistance: 0 };
  const currentMonthDistance = (safeMonthlyStats.totalDistance || 0) / 1000;
  const progressPercent = Math.min((currentMonthDistance / goalDistance) * 100, 100);
  const remainingDistance = Math.max(goalDistance - currentMonthDistance, 0);
  
  // Get max distance for scaling with error handling
  const safeChartData = last30DaysData && Array.isArray(last30DaysData) ? last30DaysData : [];
  const maxDistance = safeChartData.length > 0 ? Math.max(...safeChartData.map(d => d?.distance || 0), 10) : 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Activity Dashboard</h2>
          </div>
          <p className="text-white/80 text-sm font-medium">Last 30 Days • Monthly Goal • Calendar View</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Calendar Section - Full Width */}
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/5">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Activity Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="flex justify-center">
                {safeSelectedDate ? (
                  <Calendar
                    mode="single"
                    selected={safeSelectedDate}
                    onSelect={(date) => {
                      if (date instanceof Date && !isNaN(date)) {
                        setSelectedDate(date);
                      }
                    }}
                    className="[&_.rdp-button[data-selected-single=true]]:bg-primary [&_.rdp-button[data-selected-single=true]]:text-primary-foreground [&_.rdp-button[data-selected-single=true]]:font-bold [&_.rdp-button[data-selected-single=true]]:shadow-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">Unable to load calendar</div>
                )}
              </div>
              
              {/* Activities on selected date */}
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                  {safeSelectedDate ? safeSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select a date'}
                </p>
                {activitiesOnSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {activitiesOnSelectedDate.map((activity, idx) => {
                      try {
                        const distance = activity?.summary?.totalDistance ? (activity.summary.totalDistance / 1000).toFixed(1) : '0';
                        const time = activity?.startTime ? new Date(activity.startTime).toLocaleTimeString() : 'N/A';
                        return (
                          <div key={idx} className="p-4 bg-card rounded-lg border border-primary/10">
                            <p className="font-semibold text-foreground">{activity?.title || 'Untitled Activity'}</p>
                            <p className="text-sm text-primary font-bold mt-1">{distance} km</p>
                            <p className="text-xs text-muted-foreground mt-2">{time}</p>
                          </div>
                        );
                      } catch (e) {
                        console.warn('Error rendering activity:', e);
                        return null;
                      }
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                    <p className="text-sm">No activities on this day</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Charts */}
        <div className="space-y-6">
          {/* Last 30 Days Chart */}
          <Card className="overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Last 30 Days Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {safeChartData && safeChartData.length > 0 ? (
                <>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={safeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrimaryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          vertical={false} 
                          stroke="var(--border)"
                          opacity={0.3}
                        />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          interval={Math.floor(safeChartData.length / 6)}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          unit=" km"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                          }}
                          cursor={{ stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.5 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="distance" 
                          stroke="var(--primary)" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorPrimaryGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Stats under chart */}
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-primary/10">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Highest Day</p>
                      <p className="text-lg font-bold text-primary">
                        {Math.max(...safeChartData.map(d => d?.distance || 0)).toFixed(1)} km
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Average</p>
                      <p className="text-lg font-bold text-primary">
                        {(safeChartData.reduce((sum, d) => sum + (d?.distance || 0), 0) / safeChartData.length).toFixed(1)} km
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total</p>
                      <p className="text-lg font-bold text-primary">
                        {safeChartData.reduce((sum, d) => sum + (d?.distance || 0), 0).toFixed(1)} km
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <p className="text-sm">No activity data available for the last 30 days</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Goal Progress */}
          <Card className="overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Monthly Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {typeof currentMonthDistance === 'number' && typeof progressPercent === 'number' ? (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-2xl font-bold text-foreground">{currentMonthDistance.toFixed(1)} km</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Progress</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{progressPercent.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Complete</p>
                      </div>
                    </div>
                    
                    {/* Enhanced progress bar with animation */}
                    <div className="relative h-4 w-full bg-secondary rounded-full overflow-hidden border border-primary/20">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out shadow-lg relative"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Goal details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-card border border-primary/10">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Goal</p>
                      <p className="text-2xl font-bold text-primary">{goalDistance} km</p>
                    </div>
                    
                    <div className={`p-4 rounded-xl border transition-colors ${
                      remainingDistance === 0 
                        ? 'bg-card border-primary/20'
                        : 'bg-card border-primary/10'
                    }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                        remainingDistance === 0
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}>
                        {remainingDistance === 0 ? '🎉 Goal Achieved' : 'Remaining'}
                      </p>
                      <p className={`text-2xl font-bold ${
                        remainingDistance === 0
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}>
                        {remainingDistance.toFixed(1)} km
                      </p>
                    </div>
                  </div>

                  {/* Motivational message */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-sm font-medium text-foreground">
                      {progressPercent >= 100 ? (
                        <>🌟 Amazing! You've crushed your goal! Keep the momentum going!</>
                      ) : progressPercent >= 75 ? (
                        <>🚀 You're so close! Just {remainingDistance.toFixed(1)} km to go!</>
                      ) : progressPercent >= 50 ? (
                        <>💪 You're halfway there! Keep pushing!</>
                      ) : progressPercent >= 25 ? (
                        <>🔥 Great start! Build on this momentum!</>
                      ) : (
                        <>⭐ Every journey starts with a single step. You got this!</>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">Unable to load goal progress data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
