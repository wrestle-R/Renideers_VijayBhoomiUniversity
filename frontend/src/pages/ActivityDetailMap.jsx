import React, { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/UserSidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ArrowLeft, Map as MapIcon, Box, Play, Pause, RotateCcw,
  Clock, TrendingUp, Footprints, Mountain, Timer, Zap,
  ChevronUp, ChevronDown
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

import DeckGL from "@deck.gl/react"
import { PathLayer, ScatterplotLayer, IconLayer } from "@deck.gl/layers"
import { TerrainLayer } from "@deck.gl/geo-layers"
import { LightingEffect, AmbientLight, DirectionalLight } from "@deck.gl/core"
import { FlyToInterpolator } from "@deck.gl/core"

import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"


export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // All hooks must be declared first
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("2d")
  const [playIndex, setPlayIndex] = useState(0)
  const [snappedPath, setSnappedPath] = useState(null)
  const [snapping, setSnapping] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [viewState3d, setViewState3d] = useState(null)
  const playRef = useRef(null)
  const mapRef = useRef(null)
  const deckRef = useRef(null)

  // Fetch activity
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/treks/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setActivity(data.activity)
      })
      .finally(() => setLoading(false))
  }, [id])


  // Prepare path
  const rawPath = activity?.path || []
  const hasData = rawPath.length > 0

  // Use snapped path if available, else raw
  const path2d = snappedPath && snappedPath.length > 0
    ? snappedPath.map(([lon, lat]) => [lat, lon])
    : hasData ? rawPath.map(p => [p.latitude, p.longitude]) : [];

  const path3d = snappedPath && snappedPath.length > 0
    ? snappedPath.map(([lon, lat]) => [lon, lat, 0])
    : hasData ? rawPath.map(p => [p.longitude, p.latitude, p.altitude || 0]) : [];

  const start = path2d.length > 0 ? path2d[0] : [0, 0];
  const end = path2d.length > 1 ? path2d[path2d.length - 1] : start;

  // Calculate stats
  const totalDistance = activity?.summary?.totalDistance || 0;
  const elevationGain = activity?.summary?.elevationGain || 0;
  const duration = activity?.summary?.duration || activity?.duration || 0;
  const avgSpeed = duration > 0 ? (totalDistance / 1000) / (duration / 3600) : 0;
  const calories = activity?.summary?.calories || Math.round(totalDistance * 0.06);

  // Format helpers
  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatPace = (speed) => {
    if (speed <= 0) return '--';
    const paceMin = 60 / speed;
    const mins = Math.floor(paceMin);
    const secs = Math.round((paceMin - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  // Snap path to roads/trails using OSRM (no API key required)
  useEffect(() => {
    const snapPath = async () => {
      if (!hasData) return;
      setSnapping(true);
      try {
        // OSRM only allows up to 100 coordinates per request, so batch if needed
        const maxBatch = 100;
        let snapped = [];
        for (let i = 0; i < rawPath.length - 1; i += maxBatch - 1) {
          // Always overlap last point of previous batch as first of next
          const batch = rawPath.slice(i, i + maxBatch);
          const coords = batch.map(p => `${p.longitude},${p.latitude}`).join(';');
          const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('OSRM fetch failed');
          const data = await res.json();
          if (!data.routes || !data.routes[0]) throw new Error('No route found from OSRM');
          const snappedCoords = data.routes[0].geometry.coordinates;
          // Avoid duplicating overlap point
          if (snapped.length > 0) snappedCoords.shift();
          snapped = snapped.concat(snappedCoords);
        }
        setSnappedPath(snapped);
      } catch (err) {
        setSnappedPath(null);
      } finally {
        setSnapping(false);
      }
    };
    snapPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity]);

  // Initialize 3D view state
  useEffect(() => {
    if (path2d.length > 0 && !viewState3d) {
      setViewState3d({
        longitude: start[1],
        latitude: start[0],
        zoom: 14,
        pitch: 60,
        bearing: -20,
        transitionDuration: 1000
      });
    }
  }, [path2d, start]);

  const initialViewState3d = viewState3d || {
    longitude: start[1],
    latitude: start[0],
    zoom: 14,
    pitch: 60,
    bearing: -20
  };

  // Lighting - cinematic sun
  const lights = new LightingEffect({
    ambientLight: new AmbientLight({ color: [255, 255, 255], intensity: 0.8 }),
    directionalLight: new DirectionalLight({ 
      color: [255, 245, 230], 
      intensity: 1.2, 
      direction: [-1, -2, -1]
    }),
    directionalLight2: new DirectionalLight({
      color: [200, 220, 255],
      intensity: 0.4,
      direction: [1, 1, -1]
    })
  })

  // Premium terrain layer with satellite imagery
  const terrainLayer = hasData
    ? new TerrainLayer({
        id: "terrain",
        elevationData: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        texture: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        elevationDecoder: {
          rScaler: 256,
          gScaler: 1,
          bScaler: 1 / 256,
          offset: -32768
        },
        wireframe: false,
        color: [255, 255, 255]
      })
    : null

  // Beautiful gradient path layer
  const pathLayer = hasData
    ? new PathLayer({
        id: "path",
        data: [
          {
            path: path3d.slice(0, Math.max(1, playIndex || path3d.length)),
            name: activity?.title
          }
        ],
        getPath: d => d.path,
        getColor: [255, 90, 120],
        getWidth: 8,
        widthScale: 1,
        widthMinPixels: 4,
        widthMaxPixels: 12,
        capRounded: true,
        jointRounded: true,
        billboard: false,
        pickable: true,
        parameters: {
          depthTest: false
        }
      })
    : null;

  // Ghost/remaining path layer
  const ghostPathLayer = hasData && playIndex > 0 && playIndex < path3d.length
    ? new PathLayer({
        id: "ghost-path",
        data: [{ path: path3d.slice(playIndex) }],
        getPath: d => d.path,
        getColor: [150, 150, 150, 100],
        getWidth: 4,
        widthMinPixels: 2,
        capRounded: true,
        jointRounded: true,
        parameters: {
          depthTest: false
        }
      })
    : null;

  // Current position marker
  const currentPosLayer = hasData && playIndex > 0
    ? new ScatterplotLayer({
        id: "current-pos",
        data: [{ position: path3d[Math.min(playIndex, path3d.length - 1)] }],
        getPosition: d => d.position,
        getFillColor: [255, 255, 255],
        getLineColor: [255, 90, 120],
        stroked: true,
        lineWidthMinPixels: 3,
        filled: true,
        parameters: {
          depthTest: false
        }
      })
    : null;

  // Start marker
  const startMarkerLayer = hasData
    ? new ScatterplotLayer({
        id: "start-marker",
        data: [{ position: path3d[0] }],
        getPosition: d => d.position,
        getFillColor: [34, 197, 94],
        getLineColor: [255, 255, 255],
        getRadius: 10,
        radiusMinPixels: 8,
        stroked: true,
        lineWidthMinPixels: 2,
        filled: true,
        parameters: {
          depthTest: false
        }
      })
    : null;

  // End marker
  const endMarkerLayer = hasData && path3d.length > 1
    ? new ScatterplotLayer({
        id: "end-marker",
        data: [{ position: path3d[path3d.length - 1] }],
        getPosition: d => d.position,
        getFillColor: [239, 68, 68],
        getLineColor: [255, 255, 255],
        getRadius: 10,
        radiusMinPixels: 8,
        stroked: true,
        lineWidthMinPixels: 2,
        filled: true,
        parameters: {
          depthTest: false
        }
      })
    : null;

  // Playback controls
  const startPlayback = () => {
    if (playRef.current || !hasData) return
    if (playIndex >= path3d.length - 1) setPlayIndex(0);
    setIsPlaying(true);

    playRef.current = setInterval(() => {
      setPlayIndex(i => {
        const nextIndex = i + 1;
        if (nextIndex >= path3d.length) {
          clearInterval(playRef.current)
          playRef.current = null
          setIsPlaying(false);
          return path3d.length;
        }
        
        // Smooth camera follow in 3D
        if (viewMode === "3d" && path3d[nextIndex]) {
          const [lon, lat] = path3d[nextIndex];
          setViewState3d(prev => ({
            ...prev,
            longitude: lon,
            latitude: lat,
            transitionDuration: 100
          }));
        }
        
        return nextIndex;
      })
    }, 50)
  }

  const pausePlayback = () => {
    if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    setIsPlaying(false);
  }

  const resetPlayback = () => {
    pausePlayback();
    setPlayIndex(0);
    if (viewMode === "3d" && path3d.length > 0) {
      setViewState3d(prev => ({
        ...prev,
        longitude: path3d[0][0],
        latitude: path3d[0][1],
        zoom: 14,
        pitch: 60,
        bearing: -20,
        transitionDuration: 1000
      }));
    }
  }

  const onDeckViewChange = ({ viewState }) => {
    if (!isPlaying) {
      setViewState3d(viewState);
    }
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        pitch: viewState.pitch,
        bearing: viewState.bearing
      })
    }
  }

  // Create MapLibre instance only after switching to 3d
  useEffect(() => {
    if (viewMode !== "3d" || !hasData) return

    const container = document.getElementById("maplibre-container");
    if (!container) return;

    const mapInstance = new maplibregl.Map({
      container: "maplibre-container",
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [start[1], start[0]],
      zoom: 14,
      pitch: 60,
      bearing: -20,
      antialias: true
    })

    mapRef.current = mapInstance

    return () => mapInstance.remove()
  }, [viewMode, hasData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playRef.current) {
        clearInterval(playRef.current);
      }
    };
  }, []);

  // Progress percentage
  const progress = path3d.length > 0 ? Math.round((playIndex / path3d.length) * 100) : 0;

  // 2D Map component to handle animated polyline
  const AnimatedPolyline = () => {
    const map = useMap();
    
    useEffect(() => {
      if (path2d.length > 0 && playIndex > 0) {
        const currentPos = path2d[Math.min(playIndex, path2d.length - 1)];
        if (isPlaying) {
          map.panTo(currentPos, { animate: true, duration: 0.1 });
        }
      }
    }, [playIndex, map]);

    return null;
  };


  // UI return section
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-black">
        <div className="h-screen flex-shrink-0" style={{ width: 256 }}>
          <UserSidebar />
        </div>
        <main className="flex-1 h-screen w-full relative overflow-hidden">
          {/* Loading States */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 z-50">
              <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4"></div>
              <p className="text-white/80 text-lg font-light tracking-wide">Loading activity...</p>
            </div>
          )}
          
          {snapping && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <p className="text-white text-sm font-medium">Mapping route to roads...</p>
              </div>
            </div>
          )}
          
          {!loading && !hasData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
              <Mountain className="w-16 h-16 text-white/20 mb-4" />
              <p className="text-white/60 text-lg">No GPS data available</p>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4 text-white/80">
                Go Back
              </Button>
            </div>
          )}

          {!loading && hasData && (
            <>
              {/* Map Container */}
              <div className="absolute inset-0 z-0 shadow-2xl shadow-black/40">
                {viewMode === "2d" ? (
                  <MapContainer
                    center={start}
                    zoom={15}
                    scrollWheelZoom={true}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                    className="h-full w-full"
                  >
                    {/* Premium dark map tiles */}
                    <TileLayer 
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    
                    {/* Ghost path (full route) */}
                    <Polyline 
                      positions={path2d} 
                      pathOptions={{
                        color: "#4a5568",
                        weight: 4,
                        opacity: 0.4,
                        lineCap: "round",
                        lineJoin: "round"
                      }}
                    />
                    
                    {/* Animated path */}
                    <Polyline 
                      positions={path2d.slice(0, Math.max(1, playIndex || path2d.length))} 
                      pathOptions={{
                        color: "#f472b6",
                        weight: 5,
                        opacity: 1,
                        lineCap: "round",
                        lineJoin: "round"
                      }}
                    />
                    
                    {/* Start marker */}
                    <CircleMarker 
                      center={start} 
                      radius={10}
                      pathOptions={{
                        fillColor: "#22c55e",
                        fillOpacity: 1,
                        color: "#fff",
                        weight: 3
                      }}
                    >
                      <Popup>
                        <span className="font-semibold">Start</span>
                      </Popup>
                    </CircleMarker>
                    
                    {/* End marker */}
                    <CircleMarker 
                      center={end} 
                      radius={10}
                      pathOptions={{
                        fillColor: "#ef4444",
                        fillOpacity: 1,
                        color: "#fff",
                        weight: 3
                      }}
                    >
                      <Popup>
                        <span className="font-semibold">Finish</span>
                      </Popup>
                    </CircleMarker>
                    
                    {/* Current position */}
                    {playIndex > 0 && playIndex < path2d.length && (
                      <CircleMarker 
                        center={path2d[playIndex]} 
                        radius={8}
                        pathOptions={{
                          fillColor: "#fff",
                          fillOpacity: 1,
                          color: "#f472b6",
                          weight: 4
                        }}
                      />
                    )}
                    
                    <AnimatedPolyline />
                  </MapContainer>
                ) : (
                  <div className="relative h-full w-full">
                    <div 
                      id="maplibre-container" 
                      className="absolute inset-0"
                      style={{ background: '#1a1a2e' }}
                    />
                    <DeckGL
                      ref={deckRef}
                      viewState={viewState3d}
                      onViewStateChange={onDeckViewChange}
                      controller={{ touchRotate: true, dragRotate: true }}
                      effects={[lights]}
                      layers={[
                        terrainLayer,
                        ghostPathLayer,
                        pathLayer,
                        startMarkerLayer,
                        endMarkerLayer,
                        currentPosLayer
                      ].filter(Boolean)}
                      style={{ position: 'absolute', inset: 0 }}
                      getTooltip={({object}) => object && object.name && {
                        html: `<div class="font-semibold">${object.name}</div>`,
                        style: {
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 p-4 z-50">
                <div className="flex justify-between items-start gap-4">
                  {/* Back button & title */}
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => navigate(`/activity/${id}`)} 
                      className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 hover:text-white"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                      <h1 className="text-white font-bold text-lg leading-tight">{activity?.title || "Activity"}</h1>
                      <p className="text-white/60 text-xs mt-0.5">
                        {activity?.startTime && new Date(activity.startTime).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* View mode toggle */}
                  <div className="flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("2d")}
                      className={`rounded-full px-4 h-9 font-medium transition-all ${
                        viewMode === "2d" 
                          ? "bg-white text-black hover:bg-white" 
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <MapIcon className="w-4 h-4 mr-1.5" />
                      2D
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("3d")}
                      className={`rounded-full px-4 h-9 font-medium transition-all ${
                        viewMode === "3d" 
                          ? "bg-white text-black hover:bg-white" 
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Box className="w-4 h-4 mr-1.5" />
                      3D
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Panel */}
              <div className="absolute bottom-0 left-0 right-0 z-50">
                {/* Stats Panel - Collapsible */}
                <div className={`transition-all duration-300 ${showStats ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
                  {/* Toggle button */}
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setShowStats(!showStats)}
                      className="bg-black/60 backdrop-blur-md rounded-t-xl px-6 py-2 border border-b-0 border-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      {showStats ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Stats container */}
                  <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
                    {/* Progress bar */}
                    <div className="h-1 bg-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="p-4">
                      {/* Stats grid */}
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <Footprints className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{formatDistance(totalDistance)}</p>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Distance</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{formatDuration(duration)}</p>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Duration</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{elevationGain}m</p>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Elevation</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center hidden md:block">
                          <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{avgSpeed.toFixed(1)} km/h</p>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Avg Speed</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center hidden md:block">
                          <Timer className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{formatPace(avgSpeed)}</p>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Pace</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center hidden md:block">
                          <Mountain className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{calories}</p>
                          <p className="text-white/50 text-xs uppercase tracking-wider">Calories</p>
                        </div>
                      </div>

                      {/* Playback controls */}
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={resetPlayback}
                          className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          onClick={isPlaying ? pausePlayback : startPlayback}
                          className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/30"
                        >
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                        </Button>
                        
                        <div className="text-white/60 text-sm font-mono min-w-[60px] text-center">
                          {progress}%
                        </div>
                      </div>

                      {/* Split Breakdown Chart */}
                      {activity?.splits && activity.splits.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/80 text-sm font-semibold mb-3">Split Breakdown (Speed per km)</p>
                          <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={activity.splits.map((split, idx) => ({
                                name: `km ${idx + 1}`,
                                speed: split.time > 0 ? ((split.distance / split.time) * 3.6).toFixed(1) : 0
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                                  stroke="rgba(255,255,255,0.2)"
                                />
                                <YAxis 
                                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                                  stroke="rgba(255,255,255,0.2)"
                                  label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.6)', offset: 10 }}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                  formatter={(value) => [`${value} km/h`, 'Speed']}
                                />
                                <Bar dataKey="speed" fill="#ec4899" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
