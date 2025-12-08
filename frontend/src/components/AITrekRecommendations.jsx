import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export function AITrekRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: "moderate difficulty, scenic views, summer" }) // Replace with real user prefs
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 my-8 p-6 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">AI Recommended Treks</h2>
        </div>
        <Button onClick={getRecommendations} disabled={loading} variant="outline" size="sm">
          {loading ? "Analyzing..." : "Refresh Recommendations"}
        </Button>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map(trek => (
            <Card key={trek._id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/treks/${trek._id}`)}>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{trek.title}</h3>
                <p className="text-xs text-muted-foreground">{trek.location} • {trek.difficulty}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Click refresh to get personalized trek ideas powered by AI.</p>
      )}
    </div>
  );
}