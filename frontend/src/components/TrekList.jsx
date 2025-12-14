import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Mountain,
  Search,
  Filter,
  MapPin,
  Compass,
} from "lucide-react";
import { AIItineraryOptimizer } from "./AIItineraryOptimizer";
import { AIDifficultyEstimator } from "./AIDifficultyEstimator";

import VR360Modal from "../pages/VRView";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/* ---------- LEAFLET FIX ---------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DIFFICULTY_OPTIONS = ["All", "Easy", "Moderate", "Difficult"];
const SEASON_OPTIONS = [
  "All",
  "Winter",
  "Spring",
  "Summer",
  "Monsoon",
  "Autumn",
];
const monthToSeasonMap = {
  winter: ["december", "january", "february"],
  spring: ["march", "april"],
  summer: ["may", "june"],
  monsoon: ["july", "august", "september"],
  autumn: ["october", "november"],
};



function matchesSeason(trekSeasonText = "", selectedSeason) {
  if (selectedSeason === "All") return true;

  const months = monthToSeasonMap[selectedSeason.toLowerCase()];
  if (!months) return true;

  const text = trekSeasonText.toLowerCase();

  return months.some((month) => text.includes(month));
}



function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { duration: 2 }); // 2 seconds for slow zoom
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

  const [mapCenter, setMapCenter] = useState([19.07283, 72.88261]);
  const [mapZoom, setMapZoom] = useState(6);
  const [activeTrekId, setActiveTrekId] = useState(null); // <-- ADD THIS LINE

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/treks`)
      .then((res) => res.json())
      .then((data) => {
        setTreks(data);
        if (data.length && data[0].latitude) {
          setMapCenter([data[0].latitude, data[0].longitude]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = treks
  .filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.title?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q)) &&
      (difficulty === "All" || t.difficulty === difficulty) &&
      matchesSeason(t.season, season)
    );
  })
  .sort((a, b) =>
    sort === "title"
      ? a.title.localeCompare(b.title)
      : sort === "difficulty"
      ? a.difficulty.localeCompare(b.difficulty)
      : a.season.localeCompare(b.season)
  );


  const handleViewCard = (trek) => {
    setActiveTrekId(trek._id); // Now this will work
    setTimeout(() => {
      const element = document.getElementById(`trek-card-${trek._id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  if (loading) return null;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-10">

      {/* ---------------- MAP ---------------- */}
      <div className="h-[450px] rounded-xl overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {filtered.map(
            (t) =>
              t.latitude && (
                <Marker
                  key={t._id}
                  position={[t.latitude, t.longitude]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => {
                      setMapCenter([t.latitude, t.longitude]);
                      setMapZoom(13); // Slow zoom in
                    }
                  }}
                >
                  <Popup>
                    <strong>{t.title}</strong>
                    <br />
                    {t.location}
                    <br />
                    <Button
                      className="mt-2"
                      size="sm"
                      onClick={() => handleViewCard(t)}
                    >
                      View Card
                    </Button>
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>

      {/* ---------------- FILTERS ---------------- */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search treks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

       <select
  value={difficulty}
  onChange={(e) => setDifficulty(e.target.value)}
  className="border rounded px-3 py-2"
>
  <option value="All">Difficulty: All</option>
  <option value="Easy">Easy</option>
  <option value="Moderate">Moderate</option>
  <option value="Difficult">Difficult</option>
</select>


        <select
  value={season}
  onChange={(e) => setSeason(e.target.value)}
  className="border rounded px-3 py-2"
>
  <option value="All">Season: All</option>
  <option value="Winter">Winter</option>
  <option value="Spring">Spring</option>
  <option value="Summer">Summer</option>
  <option value="Monsoon">Monsoon</option>
  <option value="Autumn">Autumn</option>
</select>

      </div>

      {/* ---------------- AI TOOLS ---------------- */}
     <div className="grid md:grid-cols-2 gap-6">
  <div className="bg-card border rounded-xl p-6 shadow-sm">
    <AIItineraryOptimizer />
  </div>

  <div className="bg-card border rounded-xl p-6 shadow-sm">
    <AIDifficultyEstimator />
  </div>
</div>


      {/* ---------------- TREK CARDS ---------------- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((trek) => (
          <Card
            key={trek._id}
            id={`trek-card-${trek._id}`}
            onClick={() => navigate(`/treks/${trek._id}`)}
            className={`cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 ${
              activeTrekId === trek._id 
                ? "ring-4 ring-primary ring-offset-4 shadow-2xl scale-105" 
                : ""
            }`}
          >
            {/* IMAGE AS BACKGROUND */}
            <div
              className="relative h-60"
              style={{
                backgroundImage: `url(${trek.images?.[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="absolute bottom-0 p-4 text-white z-10">
                <h3 className="text-xl font-bold">{trek.title}</h3>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-3 h-3" />
                  {trek.location}
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full">
                    {trek.difficulty}
                  </span>
                  <span className="bg-white/20 px-2 py-1 rounded-full">
                    {trek.duration}
                  </span>
                </div>
              </div>

              {trek.vrImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVrImage(trek.vrImage);
                  }}
                  className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold"
                >
                  <Compass className="inline w-3 h-3 mr-1" />
                  360° VR
                </button>
              )}
            </div>

            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {trek.description}
              </p>
              <Button className="w-full mt-3">Explore Details →</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------------- VR MODAL ---------------- */}
      {vrImage && (
        <VR360Modal imageUrl={vrImage} onClose={() => setVrImage(null)} />
      )}
    </div>
  );
};

export default TrekList;
