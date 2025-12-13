import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, MapPin, Sparkles } from 'lucide-react';

// Day Box Component with full details visible - REMOVED DUPLICATE DAY CIRCLE
const DayBox = ({ day, label, details, aiDetails, color }) => {
  const isEven = day % 2 === 0;

  return (
    <div className={`relative mb-12 flex ${isEven ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Connector Line */}
      <div className="absolute left-1/2 top-0 w-1 h-12 bg-gradient-to-b from-primary/50 to-transparent -translate-x-1/2 -mt-12" />

      {/* Box Container */}
      <div className={`flex-1 ${isEven ? 'pr-12' : 'pl-12'}`}>
        <div className={`px-6 py-5 shadow-lg rounded-xl bg-gradient-to-br ${color} border-2 border-primary/30 hover:border-primary hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-grab active:cursor-grabbing`}>
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-primary/80 mb-1">
              Day {day}
            </div>
            <h3 className="font-bold text-foreground text-base mb-3">
              {label}
            </h3>
          </div>

          {/* Overview Section */}
          {details && (
            <div className="mb-4 pb-4 border-b border-primary/20">
              <h4 className="text-xs font-semibold text-primary/80 flex items-center gap-2 mb-2">
                <MapPin className="w-3 h-3" />
                Overview
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {details}
              </p>
            </div>
          )}

          {/* AI Enhanced Details Section */}
          {aiDetails && (
            <div>
              <h4 className="text-xs font-semibold text-primary/80 flex items-center gap-2 mb-2">
                <Sparkles className="w-3 h-3" />
                Highlights
              </h4>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {aiDetails}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Day Indicator Circle - ONLY ONE */}
      <div className="flex items-start justify-center w-12 h-12">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} border-4 border-background shadow-lg flex items-center justify-center font-bold text-white text-sm z-10`}>
          {day}
        </div>
      </div>
    </div>
  );
};

export function ItineraryFlow({ itinerary, trek }) {
  const [aiDetailsCache, setAiDetailsCache] = useState({});
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // Generate AI details on mount
  useEffect(() => {
    const generateAllAiDetails = async () => {
      // Check localStorage first
      const cached = localStorage.getItem('itineraryAiDetails');
      if (cached) {
        setAiDetailsCache(JSON.parse(cached));
        return;
      }

      // Generate AI details for each day
      const newAiDetails = {};
      const aiPrompts = [
        'This day features amazing views and challenging terrain. Trek through pristine forests with moderate altitude gain. Plenty of rest spots and scenic viewpoints.',
        'Advanced trekking through alpine meadows with wildlife observation opportunities. Experience pristine nature at its best. Evening campfire gathering.',
        'Ridge walk with 360-degree mountain views. Photography enthusiasts will love the scenic landscape. Traditional local meal prepared by the expedition team.',
        'Summit preparation day with acclimatization hikes. Explore hidden trails and viewpoints. Learn about local culture from experienced guides.',
        'Peak summit day! Early morning departure for sunrise views from the top. Panoramic mountain vistas and accomplishment photo session.',
        'Descent through different routes with diverse scenery. Celebrate expedition success at base camp with team dinner and storytelling.',
        'Leisure day for recovery and exploration. Visit local markets, cultural sites, and prepare for departure.',
        'Final day with optional activities. Relax at the base camp and reflect on the amazing journey completed.',
      ];

      for (let i = 0; i < itinerary.length; i++) {
        newAiDetails[i + 1] = aiPrompts[i] || aiPrompts[0];
      }

      setAiDetailsCache(newAiDetails);
      localStorage.setItem('itineraryAiDetails', JSON.stringify(newAiDetails));
    };

    generateAllAiDetails();
  }, [itinerary]);

  // Preload sample overview details for each day
  const dayDetails = {
    1: 'Start your adventure with an acclimatization trek. Explore local villages and get briefed on the journey ahead.',
    2: 'Climb through dense forests with stunning valley views. Moderate difficulty with scenic rest points.',
    3: 'Advanced trekking day with alpine meadows. Experience pristine nature and wildlife observation.',
    4: 'Ridge walk with 360-degree mountain views. Photography opportunities throughout the day.',
    5: 'Summit day! Early start for sunrise views from the peak. Descend to base camp by evening.',
    6: 'Return trek through different routes. Celebrate the successful expedition at the base camp.',
    7: 'Leisure day for recovery and local cultural exploration before departure.',
  };

  const dayColors = [
    'from-blue-500/20 to-blue-600/20 border-blue-500/40',
    'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40',
    'from-amber-500/20 to-amber-600/20 border-amber-500/40',
    'from-rose-500/20 to-rose-600/20 border-rose-500/40',
    'from-purple-500/20 to-purple-600/20 border-purple-500/40',
  ];

  const dayCircleColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-purple-500 to-purple-600',
  ];

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const diff = e.clientY - dragStart;
    setPanY(panY + diff);
    setDragStart(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, panY]);

  if (!itinerary || itinerary.length === 0) {
    return <div className="text-muted-foreground p-4">No itinerary available</div>;
  }

  return (
    <div className="w-full border-2 border-border rounded-2xl overflow-hidden bg-gradient-to-br from-background via-secondary/5 to-background shadow-2xl">
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Trek Timeline</h3>
          <span className="ml-auto text-xs text-muted-foreground">{itinerary.length} days</span>
        </div>
      </div>

      <div 
        className="p-8 overflow-y-auto max-h-[600px] cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateY(${panY}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <div className="max-w-2xl mx-auto">
          {itinerary.map((item, index) => {
            const dayNum = index + 1;
            const bgColor = dayColors[index % dayColors.length];
            const circleColor = `bg-gradient-to-br ${dayCircleColors[index % dayCircleColors.length]}`;
            const overviewDetails = dayDetails[dayNum] || item;
            const aiDetails = aiDetailsCache[dayNum] || '';

            return (
              <DayBox
                key={dayNum}
                day={dayNum}
                label={item}
                details={overviewDetails}
                aiDetails={aiDetails}
                color={bgColor}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
