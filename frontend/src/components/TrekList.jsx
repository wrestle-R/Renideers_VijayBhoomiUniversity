
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Mountain, Search, Filter } from "lucide-react";
import { AIItineraryOptimizer } from "./AIItineraryOptimizer";
import { AIDifficultyEstimator } from "./AIDifficultyEstimator";


const DIFFICULTY_OPTIONS = ["All", "Easy", "Moderate", "Difficult"];
const SEASON_OPTIONS = ["All", "Summer", "Winter", "Monsoon", "Spring", "Autumn"];

const TrekList = () => {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [season, setSeason] = useState("All");
  const [sort, setSort] = useState("title");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/treks`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch treks");
        return res.json();
      })
      .then((data) => {
        setTreks(data);
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

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="space-y-4 text-center">
        <div className="inline-block p-3 bg-primary/10 rounded-full">
          <Mountain className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground">Loading treks...</p>
      </div>
    </div>
  );
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex gap-2 items-center w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search treks by title or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
          <Button variant="outline" className="gap-2 hidden md:flex" disabled>
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="h-10 rounded-md border px-3 text-sm bg-background"
          >
            {DIFFICULTY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
          <select
            value={season}
            onChange={e => setSeason(e.target.value)}
            className="h-10 rounded-md border px-3 text-sm bg-background"
          >
            {SEASON_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-10 rounded-md border px-3 text-sm bg-background"
          >
            <option value="title">Sort: Title</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="season">Sort: Season</option>
          </select>
        </div>
      </div>

      <AIItineraryOptimizer />
      <AIDifficultyEstimator />

      {/* Trek Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="space-y-4 text-center">
            <div className="inline-block p-4 bg-muted rounded-full">
              <Mountain className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">No treks found.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trek) => (
            <Card
              key={trek._id}
              className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate(`/treks/${trek._id}`)}
            >
              <div className="aspect-square w-full overflow-hidden bg-muted">
                {trek.images && trek.images.length > 0 ? (
                  <img
                    src={trek.images[0]}
                    alt={trek.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <Mountain className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {trek.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {trek.location}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Difficulty</p>
                    <p className="text-sm line-clamp-1 font-medium text-primary">
                      {trek.difficulty}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Season</p>
                    <p className="text-sm line-clamp-1 font-medium text-primary">
                      {trek.season}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Duration</p>
                    <p className="text-sm line-clamp-1 font-medium text-primary">
                      {trek.duration}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trek.description}
                  </p>
                </div>
                <Button 
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/treks/${trek._id}`);
                  }}
                  variant="default"
                  className="w-full group/btn"
                >
                  Explore Trek
                  <span className="ml-2 group-hover/btn:translate-x-1 transition-transform">→</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrekList;
