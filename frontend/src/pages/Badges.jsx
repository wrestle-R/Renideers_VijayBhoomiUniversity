import React, { useEffect, useState } from "react";
import { UserSidebar } from "../components/UserSidebar";
import { useUser } from "../context/UserContext";

export default function Badges() {
  const { user } = useUser();
  const [badges, setBadges] = useState([]);
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/badges`);
        const data = await res.json();
        setBadges(data);
      } catch (err) {
        setBadges([]);
      }
    };
    fetchBadges();
  }, []);

  useEffect(() => {
    const fetchEarned = async () => {
      if (!user?.mongo_uid) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile/${user.mongo_uid}`);
        const data = await res.json();
        setEarned((data.badges || []).map(b => b._id));
      } catch (err) {
        setEarned([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEarned();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 z-30 border-r bg-white dark:bg-muted shadow-sm">
        <UserSidebar />
      </div>
      {/* Main content with left margin */}
      <main className="ml-0 md:ml-64 p-6 md:p-10 transition-all">
        <h1 className="text-3xl font-bold mb-8 text-primary">All Badges</h1>
        {loading ? (
          <div className="text-base text-muted-foreground">Loading badges...</div>
        ) : badges.length === 0 ? (
          <div className="text-base text-muted-foreground">No badges found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {badges.map(badge => {
              const isEarned = earned.includes(badge._id);
              return (
                <div
                  key={badge._id}
                  className={`rounded-xl shadow-md p-6 flex flex-col items-center border transition
                    ${isEarned
                      ? "bg-white dark:bg-muted border-primary/20 hover:shadow-lg"
                      : "bg-muted/60 border-muted-foreground/10 opacity-60 grayscale"}
                  `}
                >
                  <span className="text-5xl mb-3">{badge.icon}</span>
                  <div className={`text-lg font-semibold text-center mb-1 ${isEarned ? "text-primary" : "text-muted-foreground"}`}>{badge.name}</div>
                  <div className="text-sm text-muted-foreground text-center mb-2">{badge.description}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${isEarned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{badge.criteria}</div>
                  {!isEarned && (
                    <div className="mt-2 text-xs text-muted-foreground italic">Not earned yet</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}