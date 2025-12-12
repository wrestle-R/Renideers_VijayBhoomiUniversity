import React, { useEffect, useState } from "react";

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/badges`)
      .then(res => res.json())
      .then(setBadges)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-primary">All Badges</h3>
      {loading ? (
        <div className="text-xs text-muted-foreground">Loading badges...</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map(badge => (
            <div
              key={badge._id}
              title={badge.description}
              className="flex flex-col items-center p-2 rounded bg-muted w-20"
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-xs font-medium text-center">{badge.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}