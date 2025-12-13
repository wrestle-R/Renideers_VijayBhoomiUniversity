import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Sparkles } from "lucide-react"; // Add import
import { AIDifficultyEstimator } from "@/components/AIDifficultyEstimator";
import { AIQuickSummary } from "@/components/AIQuickSummary";
import { ItineraryFlow } from "@/components/ItineraryFlow";

const TrekDetail = () => {
  const { id } = useParams();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/treks/normal/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trek");
        return res.json();
      })
      .then((data) => {
        setTrek(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const generateSummary = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trekId: id })
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || error || !trek) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <UserSidebar />
          <main className="flex-1 flex items-center justify-center lg:ml-64">
            <p>{loading ? "Loading trek..." : error || "Trek not found"}</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />

        <main className="flex-1 overflow-auto lg:ml-64">
          {/* BACK BUTTON */}
          <div className="px-8 pt-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Treks
            </Button>
          </div>

          {/* HERO IMAGE SECTION */}
          {trek.images?.length > 0 && (
            <div
              className="relative h-[70vh] w-full mt-4"
              style={{
                backgroundImage: `url(${trek.images[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/60" />

              <div className="relative z-10 h-full flex flex-col justify-end px-8 pb-12 max-w-5xl text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {trek.title}
                </h1>

                <p className="text-lg opacity-90 mb-4">{trek.location}</p>

                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm">
                    {trek.difficulty}
                  </span>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm">
                    {trek.duration}
                  </span>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm">
                    {trek.altitude} m
                  </span>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm">
                    {trek.season}
                  </span>
                </div>
              </div>
            </div>
          )}

              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{trek.title}</h1>
                  <p className="text-xl text-muted-foreground flex items-center gap-2">
                    {trek.location}
                  </p>
                </div>

                {/* AI Summary Section */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-primary">AI Quick Summary</h3>
                  </div>
                  {aiSummary ? (
                    <p className="text-sm italic text-muted-foreground">{aiSummary}</p>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={generateSummary} className="text-xs h-8">
                      Generate Summary
                    </Button>
                  )}
                </div>

                <AIDifficultyEstimator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Altitude</p>
                    <p className="font-semibold">{trek.altitude} m</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold">{trek.duration}</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                    <p className="font-semibold">{trek.difficulty}</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Season</p>
                    <p className="font-semibold">{trek.season}</p>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-2xl font-semibold mb-4">Overview</h3>
                  <p className="text-muted-foreground leading-relaxed">{trek.description}</p>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold mb-4">Highlights</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trek.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold mb-4">Itinerary</h3>
                  <div className="space-y-4">
                    {trek.itinerary.map((it, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <p className="pt-1">{it}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-2xl font-semibold mb-4">In-Depth Details</h3>
                  <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
                    {trek.inDepthDescription}
                  </div>
                </div>
              </div>
            </section>

            {/* IN-DEPTH */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                In-Depth Details
              </h2>
              <p className="whitespace-pre-line text-muted-foreground">
                {trek.inDepthDescription}
              </p>
            </section>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrekDetail;
