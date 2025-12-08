import React, { useState } from "react";
import { Button } from "./ui/button";

export function AIItineraryOptimizer() {
  const [treks, setTreks] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    setResult(null);
    try {
      const trekList = treks.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treks: trekList, startDate, duration })
      });
      const data = await res.json();
      setResult(data.itinerary);
    } catch (err) {
      setResult("Sorry, could not optimize itinerary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card mb-8">
      <h3 className="font-bold mb-2">AI Itinerary Optimizer</h3>
      <div className="mb-2">
        <label className="block text-sm mb-1">Treks (comma separated)</label>
        <input
          type="text"
          value={treks}
          onChange={e => setTreks(e.target.value)}
          placeholder="e.g. Kedarkantha, Hampta Pass, Valley of Flowers"
          className="w-full rounded border p-2 mb-2 bg-background"
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full rounded border p-2 mb-2 bg-background"
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">Total Duration (days)</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="e.g. 10"
          className="w-full rounded border p-2 mb-2 bg-background"
        />
      </div>
      <Button onClick={handleOptimize} disabled={loading || !treks || !startDate || !duration}>
        {loading ? "Optimizing..." : "Optimize My Trek Plan"}
      </Button>
      {result && (
        <div className="mt-4 p-3 bg-muted rounded text-sm whitespace-pre-line">
          {result}
        </div>
      )}
    </div>
  );
}
