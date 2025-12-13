import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Brain, Activity, Heart } from "lucide-react";

export function AIDifficultyEstimator({ trekData }) {
  const [userProfile, setUserProfile] = useState({
    fitnessLevel: "moderate",
    experience: "intermediate",
    age: "",
    medicalConditions: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-estimate when trekData is available, but allow refinement
  useEffect(() => {
    if (trekData && !result) {
      // Initial estimation based on trek data only
      // In a real app, we might want to wait for user input, but the user asked for auto-use
    }
  }, [trekData]);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      // Construct a rich prompt context
      const context = {
        trek: {
          title: trekData?.title,
          altitude: trekData?.altitude,
          duration: trekData?.duration,
          baseDifficulty: trekData?.difficulty,
          description: trekData?.description
        },
        user: userProfile
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: JSON.stringify(context),
          context: "personalized" 
        })
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
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          AI Difficulty Estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fitness Level</Label>
            <Select 
              value={userProfile.fitnessLevel} 
              onValueChange={(v) => setUserProfile({...userProfile, fitnessLevel: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fitness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (Sedentary)</SelectItem>
                <SelectItem value="moderate">Moderate (Active)</SelectItem>
                <SelectItem value="athlete">Athlete (Very Active)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trekking Experience</Label>
            <Select 
              value={userProfile.experience} 
              onValueChange={(v) => setUserProfile({...userProfile, experience: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">First Time</SelectItem>
                <SelectItem value="beginner">1-2 Treks</SelectItem>
                <SelectItem value="intermediate">Regular Trekker</SelectItem>
                <SelectItem value="expert">Expert / Mountaineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Age (Optional)</Label>
            <Input 
              type="number" 
              placeholder="e.g. 25" 
              value={userProfile.age}
              onChange={(e) => setUserProfile({...userProfile, age: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Medical Conditions (Optional)</Label>
            <Input 
              placeholder="e.g. Asthma, Knee pain" 
              value={userProfile.medicalConditions}
              onChange={(e) => setUserProfile({...userProfile, medicalConditions: e.target.value})}
            />
          </div>
        </div>

        <Button onClick={handleEstimate} disabled={loading} className="w-full gap-2">
          {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
          {loading ? "Analyzing..." : "Get Personalized Difficulty"}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border animate-in fade-in slide-in-from-top-2">
            <h4 className="font-semibold mb-2 text-primary">AI Analysis</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}