import React, { useState } from 'react';
import { Button } from './ui/button';

export function AIDifficultyEstimator() {
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc })
      });
      const data = await res.json();
      setResult(data.estimation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-bold mb-2">AI Difficulty Estimator</h3>
      <textarea
        placeholder="Describe a trek (e.g., 10km steep uphill, rocky terrain...)"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        className="mb-2 w-full rounded border p-2 min-h-[80px] bg-background"
        ></textarea>
      <Button onClick={handleEstimate} disabled={loading || !desc}>
        {loading ? "Estimating..." : "Estimate Difficulty"}
      </Button>
      {result && <div className="mt-4 p-3 bg-muted rounded text-sm">{result}</div>}
    </div>
  );
}