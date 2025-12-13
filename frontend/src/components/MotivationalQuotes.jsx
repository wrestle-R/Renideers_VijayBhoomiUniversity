import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';

const QUOTES = [
  "You've got this! Don't let a few days off derail your progress. Keep moving forward.",
  "The journey of a thousand miles begins with a single step. Every trek counts.",
  "Consistency builds momentum, and momentum builds results. One step at a time.",
  "The hardest part of any trek is the decision to start. Challenge yourself today!",
  "Look how far you've come! Celebrate your victories, no matter how small.",
  "Your consistency today will become your strength tomorrow. Keep going!",
  "The best time to trek was yesterday. The second best time is today.",
  "Every rep, every km, every climb – it all adds up. You're becoming stronger!"
];

export function MotivationalQuotes() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setCurrentIndex(randomIndex);
  }, []);

  const currentQuote = QUOTES[currentIndex];

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardContent className="p-6">
        <p className="text-lg font-medium leading-relaxed text-foreground italic text-center">
          "{currentQuote}"
        </p>
      </CardContent>
    </Card>
  );
}
