import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Mountain, Map, Flag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AIQuickSummary({ trek }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // Simulate AI generation or fetch from API
  const generateStory = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the AI endpoint with trek details
      // For now, we'll simulate a delay and set a story based on the trek data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const story = `Imagine stepping onto the trail of ${trek.title}, where the air is crisp and the ${trek.season} breeze guides your way. Your journey begins at an altitude of ${trek.altitude}m, challenging you with a ${trek.difficulty} terrain that promises both thrill and serenity. Over the course of ${trek.duration}, you'll uncover hidden gems of nature. ${trek.description} This isn't just a trek; it's a story waiting for you to write.`;
      
      setSummary(story);
    } catch (error) {
      console.error("Failed to generate summary", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

              {/* AI Experience */}
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <Sparkles className="w-6 h-6" />
            AI Experience
          </h2>
          {!summary && (
            <Button onClick={generateStory} disabled={loading} variant="outline" size="sm" className="gap-2">
              {loading ? "Weaving..." : "Generate Story"}
              <BookOpen className="w-4 h-4" />
            </Button>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        )}

        {summary && (
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed font-serif text-foreground/90 first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left">
              {summary}
            </p>
          </div>
        )}
        
        {!summary && !loading && (
             <div className="text-muted-foreground italic text-sm p-4 border border-dashed rounded-lg bg-muted/30">
                Click generate to read a personalized story about this trek.
             </div>
        )}
      </div>
      {/* At a Glance */}
      <Card className="bg-card border-primary/10 shadow-xl overflow-hidden w-full">
        <CardHeader className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg leading-tight">At a Glance</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {trek.distance && <span>{trek.distance} • </span>}
            {trek.duration && <span>{trek.duration} • </span>}
            {trek.difficulty && <span className="capitalize">{trek.difficulty}</span>}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Map className="w-4 h-4 text-primary" /> 
              Overview
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {trek.description}
            </p>
          </div>
          
          <div className="w-full h-px bg-border" />

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Flag className="w-4 h-4 text-primary" />
              Highlights
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {trek.highlights.map((highlight, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary shrink-0">•</span>
                  <span className="leading-snug">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
