import React, { useState } from "react";
import { Button } from "./ui/button";
import { Heart, Brain } from "lucide-react";

export function AIDifficultyEstimator() {
  const [fitness, setFitness] = useState("Moderate (Active)");
  const [experience, setExperience] = useState("Regular Trekker");
  const [age, setAge] = useState("");
  const [medical, setMedical] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/estimate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fitnessLevel: fitness,
            trekkingExperience: experience,
            age,
            medicalConditions: medical,
          }),
        }
      );
      const data = await res.json();
      setResult(data.estimation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-xl bg-card space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-bold">AI Difficulty Estimator</h3>
      </div>

      {/* FORM GRID */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Fitness Level */}
        <div>
          <label className="text-sm font-medium">Fitness Level</label>
          <select
            value={fitness}
            onChange={(e) => setFitness(e.target.value)}
            className="mt-1 w-full rounded border bg-background p-2"
          >
            <option>Low (Sedentary)</option>
            <option>Moderate (Active)</option>
            <option>High (Very Fit)</option>
          </select>
        </div>

        {/* Trekking Experience */}
        <div>
          <label className="text-sm font-medium">Trekking Experience</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="mt-1 w-full rounded border bg-background p-2"
          >
            <option>Beginner</option>
            <option>Regular Trekker</option>
            <option>Experienced Trekker</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <label className="text-sm font-medium">
            Age <span className="text-muted-foreground">(Optional)</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 25"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 w-full rounded border bg-background p-2"
          />
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="text-sm font-medium">
            Medical Conditions{" "}
            <span className="text-muted-foreground">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Asthma, Knee pain"
            value={medical}
            onChange={(e) => setMedical(e.target.value)}
            className="mt-1 w-full rounded border bg-background p-2"
          />
        </div>
      </div>

      {/* BUTTON */}
      <Button
        onClick={handleEstimate}
        disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 flex items-center gap-2"
      >
        <Heart className="w-4 h-4" />
        {loading ? "Analyzing..." : "Get Personalized Difficulty"}
      </Button>

      {/* RESULT */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-700 mb-1">
            AI Analysis
          </h4>
          <p className="text-sm text-green-800">{result}</p>
        </div>
      )}
    </div>
  );
}
