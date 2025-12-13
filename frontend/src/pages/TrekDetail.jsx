import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AIDifficultyEstimator } from "@/components/AIDifficultyEstimator";

const TrekDetail = () => {
  const { id } = useParams();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trekId: id }),
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

          {/* CONTENT SECTION */}
          <div className="px-8 py-12 max-w-4xl mx-auto space-y-10">
            {/* AI SUMMARY */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-primary">AI Quick Summary</h3>
              </div>

              {aiSummary ? (
                <p className="text-sm italic text-muted-foreground">
                  {aiSummary}
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateSummary}
                  className="text-xs"
                >
                  Generate Summary
                </Button>
              )}
            </div>

            <AIDifficultyEstimator />

            {/* OVERVIEW */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                {trek.description}
              </p>
            </section>

            {/* HIGHLIGHTS */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Highlights</h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {trek.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>

            {/* ITINERARY */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Itinerary</h2>
              <div className="space-y-4">
                {trek.itinerary.map((it, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <p>{it}</p>
                  </div>
                ))}
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
