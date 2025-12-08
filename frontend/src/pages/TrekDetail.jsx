import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TrekDetail = () => {
  const { id } = useParams();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/treks/${id}`)
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

  if (loading) return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div>Loading trek...</div>
        </main>
      </div>
    </SidebarProvider>
  );

  if (error) return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="text-destructive">Error: {error}</div>
        </main>
      </div>
    </SidebarProvider>
  );

  if (!trek) return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div>Trek not found.</div>
        </main>
      </div>
    </SidebarProvider>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 lg:ml-64">
          <div className="mx-auto max-w-4xl">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="mb-6 gap-2 pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Treks
            </Button>
            
            <Card className="overflow-hidden border-none shadow-none bg-transparent">
              {trek.images && trek.images.length > 0 && (
                <div className="mb-8 rounded-xl overflow-hidden">
                  <img
                    src={trek.images[0]}
                    alt={trek.title}
                    className="w-full h-[400px] object-cover"
                  />
                  {trek.images.length > 1 && (
                    <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                      {trek.images.slice(1).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${trek.title} ${idx + 2}`}
                          className="h-24 w-32 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{trek.title}</h1>
                  <p className="text-xl text-muted-foreground flex items-center gap-2">
                    {trek.location}
                  </p>
                </div>

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
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrekDetail;
