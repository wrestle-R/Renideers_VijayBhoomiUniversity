import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Mountain, Search, Filter, MapPin, Compass } from "lucide-react";
import { AIItineraryOptimizer } from "./AIItineraryOptimizer";
import { AIDifficultyEstimator } from "./AIDifficultyEstimator";
import VR360Modal from "../pages/VRView";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from 'leaflet';

// --- Fix for Default Leaflet Marker Icons in React ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Custom Violet Marker to match theme ---
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DIFFICULTY_OPTIONS = ["All", "Easy", "Moderate", "Difficult"];
const SEASON_OPTIONS = ["All", "Summer", "Winter", "Monsoon", "Spring", "Autumn"];

// --- Helper Component for Map Animations ---
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 2, // Slow zoom duration (seconds)
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

const TrekList = () => {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [season, setSeason] = useState("All");
  const [sort, setSort] = useState("title");
  const [vrImage, setVrImage] = useState(null);
  
  // Map State
  const [activeTrekId, setActiveTrekId] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.07283, 72.88261]); // Default Mumbai
  const [mapZoom, setMapZoom] = useState(8);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/treks`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch treks");
        return res.json();
      })
      .then((data) => {
        setTreks(data);
        // Set initial map center to first trek if available
        if (data.length > 0 && data[0].latitude) {
          setMapCenter([data[0].latitude, data[0].longitude]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filtering
  let filtered = treks.filter(trek => {
    const title = trek.title ? trek.title.toLowerCase() : "";
    const location = trek.location ? trek.location.toLowerCase() : "";
    const matchesSearch = title.includes(search.toLowerCase()) || location.includes(search.toLowerCase());
    const matchesDifficulty = difficulty === "All" || trek.difficulty === difficulty;
    const matchesSeason = season === "All" || trek.season === season;
    return matchesSearch && matchesDifficulty && matchesSeason;
  });

  // Sorting
  filtered = filtered.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "difficulty") return a.difficulty.localeCompare(b.difficulty);
    if (sort === "season") return a.season.localeCompare(b.season);
    return 0;
  });

  // Handle Marker Click
  const handleMarkerClick = (trek) => {
    setActiveTrekId(trek._id);
    setMapCenter([trek.latitude, trek.longitude]);
    setMapZoom(13); // Zoom in closer
  };

  const handleViewCard = (trek) => {
  setActiveTrekId(trek._id);
  setMapCenter([trek.latitude, trek.longitude]);
  setMapZoom(13);
  setTimeout(() => {
    const element = document.getElementById(`trek-card-${trek._id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
};

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <Mountain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary/50" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Locating trails...</p>
      </div>
    </div>
  );

  if (error) return <div className="text-destructive text-center py-20">Error: {error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* --- MAP SECTION --- */}
      <div className="relative w-full h-[450px] rounded-2xl overflow-hidden shadow-xl border border-border/50 group">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={false} // Disable scroll zoom for better page scrolling
        >
          {/* Controller for FlyTo animation */}
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Cleaner, Modern Tiles (CartoDB Voyager) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {filtered.map(trek =>
            trek.latitude && trek.longitude && (
              <Marker
                key={trek._id}
                position={[trek.latitude, trek.longitude]}
                icon={customIcon}
                eventHandlers={{
                  click: () => handleMarkerClick(trek)
                }}
              >
                <Popup className="rounded-lg overflow-hidden">
                  <div className="text-center p-1">
                    <h3 className="font-bold text-sm mb-1">{trek.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{trek.location}</p>
                    <button
                      className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
                      onClick={() => handleViewCard(trek)}
                    >
                      View Card
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          )}
        </MapContainer>
        
        {/* Map Overlay Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-[400]" />
      </div>

      {/* --- FILTERS & SEARCH --- */}
      <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm sticky top-4 z-30">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search treks by title or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border text-sm text-muted-foreground whitespace-nowrap">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>
            
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="h-10 rounded-lg border px-3 text-sm bg-background hover:bg-accent/50 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              {DIFFICULTY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === "All" ? "Difficulty: All" : opt}</option>)}
            </select>

            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              className="h-10 rounded-lg border px-3 text-sm bg-background hover:bg-accent/50 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SEASON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === "All" ? "Season: All" : opt}</option>)}
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="h-10 rounded-lg border px-3 text-sm bg-background hover:bg-accent/50 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="title">Sort: A-Z</option>
              <option value="difficulty">Sort: Difficulty</option>
              <option value="season">Sort: Season</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIItineraryOptimizer />
        <AIDifficultyEstimator />
      </div>

      {/* --- TREK CARDS GRID --- */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-6 bg-muted/30 rounded-full">
            <Compass className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No treks found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
          <Button variant="outline" onClick={() => {setSearch(""); setDifficulty("All"); setSeason("All");}}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {filtered.map((trek) => (
            <Card
              key={trek._id}
              id={`trek-card-${trek._id}`}
              className={`
                group overflow-hidden transition-all duration-500 cursor-pointer border-muted
                hover:shadow-2xl hover:-translate-y-1
                ${activeTrekId === trek._id ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : 'hover:border-primary/30'}
              `}
              onClick={() => navigate(`/treks/${trek._id}`)}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                {trek.images && trek.images.length > 0 ? (
                  <img
                    src={trek.images[0]}
                    alt={trek.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                    <Mountain className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/10">
                    {trek.difficulty}
                  </span>
                </div>
                
                {trek.vrImage && (
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 px-2 py-1 bg-primary/90 backdrop-blur-md text-primary-foreground text-[10px] font-bold rounded-md shadow-lg animate-pulse">
                      <Compass className="w-3 h-3" /> 360° VR
                    </span>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {trek.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{trek.location}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {trek.description}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground/80 bg-muted/30 p-3 rounded-lg">
                  <div className="flex flex-col items-center p-1">
                    <span className="uppercase text-[10px] tracking-wider opacity-70">Season</span>
                    <span className="text-foreground">{trek.season}</span>
                  </div>
                  <div className="flex flex-col items-center p-1 border-l border-border/50">
                    <span className="uppercase text-[10px] tracking-wider opacity-70">Duration</span>
                    <span className="text-foreground">{trek.duration}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 group/btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/treks/${trek._id}`);
                    }}
                  >
                    Explore Details
                    <span className="ml-2 group-hover/btn:translate-x-1 transition-transform">→</span>
                  </Button>
                  
                  {trek.vrImage && (
                    <Button
                      variant="secondary"
                      className="px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVrImage(trek.vrImage);
                      }}
                      title="View 360° VR"
                    >
                      <Compass className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* VR Modal */}
      {vrImage && (
        <VR360Modal imageUrl={vrImage} onClose={() => setVrImage(null)} />
      )}
    </div>
  );
};

export default TrekList;
