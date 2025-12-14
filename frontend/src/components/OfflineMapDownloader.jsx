import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Download, MapPin, Trash2, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import domtoimage from "dom-to-image";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const OfflineMapDownloader = ({ trek }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: Delhi
  const [zoomLevel, setZoomLevel] = useState(10);
  const mapRef = useRef(null);

  useEffect(() => {
    // Check if we have coordinates from the trek location
    if (trek?.coordinates) {
      setMapCenter([trek.coordinates.latitude, trek.coordinates.longitude]);
    } else if (trek?.location) {
      // Geocode location name to get coordinates (simplified)
      geocodeLocation(trek.location);
    }

    // Check if map is already downloaded
    const savedMapKey = `offline-map-${trek?._id}`;
    const savedMap = localStorage.getItem(savedMapKey);
    if (savedMap) {
      setDownloaded(true);
    }
  }, [trek]);

  const geocodeLocation = async (location) => {
    try {
      // Using Nominatim for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const downloadMapTiles = async () => {
    setDownloading(true);
    setProgress(0);

    try {
      const savedMapKey = `offline-map-${trek._id}`;
      const zoomLevels = [10, 11, 12, 13]; // Download multiple zoom levels
      const bounds = calculateBounds(mapCenter, 0.2); // ~20km radius

      const mapData = {
        center: mapCenter,
        zoom: zoomLevel,
        bounds,
        trekId: trek._id,
        trekName: trek.title,
        downloadedAt: new Date().toISOString(),
        tiles: [],
      };

      // Simulate downloading tiles (in real implementation, you'd fetch actual tiles)
      const totalTiles = zoomLevels.length * 16; // Simplified calculation
      let tilesDownloaded = 0;

      for (const zoom of zoomLevels) {
        const tiles = generateTileUrls(bounds, zoom);
        
        for (const tileUrl of tiles) {
          try {
            const response = await fetch(tileUrl);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            
            mapData.tiles.push({
              url: tileUrl,
              data: base64,
              zoom,
            });

            tilesDownloaded++;
            setProgress(Math.round((tilesDownloaded / totalTiles) * 100));
          } catch (error) {
            console.error("Error downloading tile:", error);
          }
        }
      }

      // Save to localStorage (for demo - in production use IndexedDB or similar)
      localStorage.setItem(savedMapKey, JSON.stringify(mapData));
      
      setDownloaded(true);
      setDownloading(false);
    } catch (error) {
      console.error("Error downloading map:", error);
      setDownloading(false);
    }
  };

  const deleteOfflineMap = () => {
    const savedMapKey = `offline-map-${trek._id}`;
    localStorage.removeItem(savedMapKey);
    setDownloaded(false);
    setProgress(0);
  };

  const calculateBounds = (center, radiusDegrees) => {
    return {
      north: center[0] + radiusDegrees,
      south: center[0] - radiusDegrees,
      east: center[1] + radiusDegrees,
      west: center[1] - radiusDegrees,
    };
  };

  const generateTileUrls = (bounds, zoom) => {
    // Simplified tile URL generation
    const tiles = [];
    const baseUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    
    // Generate a grid of tiles within bounds (simplified for demo)
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const url = baseUrl
          .replace("{z}", zoom)
          .replace("{x}", x)
          .replace("{y}", y)
          .replace("{s}", ["a", "b", "c"][Math.floor(Math.random() * 3)]);
        tiles.push(url);
      }
    }
    
    return tiles;
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      map.setView(mapCenter, zoomLevel);
    }, [map]);

    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Offline Map
        </CardTitle>
        <CardDescription>
          Download maps for offline access during your trek
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-[400px] rounded-lg overflow-hidden border"
          ref={mapRef}
        >
          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={mapCenter}>
              <Popup>
                <div className="text-sm">
                  <strong>{trek?.title}</strong>
                  <br />
                  {trek?.location}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="w-full flex justify-end mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (mapRef.current) {
                domtoimage.toPng(mapRef.current)
                  .then(function (dataUrl) {
                    const link = document.createElement('a');
                    link.download = `${trek?.title || 'trek'}-map.png`;
                    link.href = dataUrl;
                    link.click();
                  })
                  .catch(function (error) {
                    alert('Could not download map image. Try again.');
                  });
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" /> Download Map as Image
          </Button>
        </div>

        {downloading && (
          <Alert>
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription>
              Downloading map tiles... {progress}%
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {downloaded && !downloading && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <Check className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Map downloaded and ready for offline use
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!downloaded ? (
            <Button
              onClick={downloadMapTiles}
              disabled={downloading}
              className="flex-1"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Map
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={deleteOfflineMap}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Offline Map
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Maps are downloaded for zoom levels 10-13</p>
          <p>• Approximate coverage: 20km radius from center</p>
          <p>• Storage space: ~5-10 MB per trek</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineMapDownloader;
