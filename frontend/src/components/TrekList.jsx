import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";

const TrekList = () => {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/treks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch treks");
        return res.json();
      })
      .then((data) => {
        setTreks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading treks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      {treks.map((trek) => (
        <Card
          key={trek._id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
          onClick={() => navigate(`/treks/${trek._id}`)}
        >
          {trek.images && trek.images.length > 0 ? (
            <img
              src={trek.images[0]}
              alt={trek.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-secondary/50 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image available</span>
            </div>
          )}
          <CardHeader>
            <CardTitle>{trek.title}</CardTitle>
            <CardDescription>{trek.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 text-sm">
              <span><strong>Duration:</strong> {trek.duration}</span>
              <span><strong>Difficulty:</strong> {trek.difficulty}</span>
              <span><strong>Season:</strong> {trek.season}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrekList;
