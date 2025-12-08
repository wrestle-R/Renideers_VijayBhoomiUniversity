import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, AlertTriangle, Loader, Info, BookOpen, Shield, Globe } from 'lucide-react';
import { SidebarProvider } from '../../components/ui/sidebar';
import { UserSidebar } from '../../components/UserSidebar';

const TrekPhotoRecognition = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (useCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {});
      }
    }
  }, [useCamera, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      setStream(mediaStream);
      setUseCamera(true);
      setError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);
      stopCamera();
      analyzeImage(imageDataUrl);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        analyzeImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageDataUrl) => {
    setIsAnalyzing(true);
    setResults(null);
    setError(null);

    try {
      const blob = await fetch(imageDataUrl).then(r => r.blob());
      
      const identificationResult = await identifySpeciesWithClaude(blob);
      
      if (identificationResult && identificationResult.species && identificationResult.species !== 'unknown') {
        const detailedInfo = await getSpeciesDetails(identificationResult.species);
        
        setResults({
          species: identificationResult.species,
          category: identificationResult.category,
          confidence: identificationResult.confidence,
          isDangerous: identificationResult.isDangerous,
          dangerLevel: identificationResult.dangerLevel,
          details: detailedInfo,
        });
      } else {
        setError('Could not identify any species in the image. Please try a clearer photo.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const identifySpeciesWithClaude = async (imageBlob) => {
    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      console.log('Sending image to API...');
      
      const response = await fetch('http://localhost:8000/api/identify-species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });

      console.log('API Response Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Identification result:', result);
      
      if (!result || !result.species || result.species === 'unknown') {
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('Error identifying species:', error);
      return null;
    }
  };

  const getSpeciesDetails = async (speciesName) => {
    try {
      console.log('Getting species details for:', speciesName);
      
      const response = await fetch('http://localhost:8000/api/species-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciesName }),
      });

      if (!response.ok) {
        console.error('Species details API error:', response.statusText);
        throw new Error(`API error: ${response.statusText}`);
      }

      const details = await response.json();
      console.log('Species details received:', details);
      return details;
    } catch (error) {
      console.error('Error getting species details:', error);
      return null;
    }
  };

  const resetApp = () => {
    setCapturedImage(null);
    setResults(null);
    setError(null);
    stopCamera();
  };

  const getDangerClasses = (dangerLevel) => {
    switch (dangerLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      default: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 lg:pb-8 lg:ml-64">
          <div className="max-w-4xl mx-auto font-sans">
            <header className="mb-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Trek Species Recognition</h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
                  AI-powered plant and animal identification for safer, smarter treks.
                </p>
              </div>
            </header>

            <div className="flex flex-col gap-6">
        {!capturedImage && !useCamera && (
          <div className="flex flex-col gap-6">
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Analyse a trek photo</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Capture or upload a photo from your trek. The system will identify visible species
                  and surface safety information, habitat details, and key facts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">What you get</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                    <li>Species name with confidence score</li>
                    <li>Scientific classification and common names</li>
                    <li>Habitat, behaviour and distribution</li>
                    <li>Conservation and protection information</li>
                    <li>Safety guidance and precautions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Best results</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                    <li>Use clear, well-lit photos</li>
                    <li>Keep the subject centred and in focus</li>
                    <li>Avoid extreme zoom or heavy blur</li>
                    <li>Capture from a safe distance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-3 text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25" 
                onClick={startCamera}
              >
                <Camera size={18} />
                <span>Use Camera</span>
              </button>
              
              <button 
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-5 py-3 text-sm font-medium hover:bg-secondary/80 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} />
                <span>Upload Photo</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-300 m-0">{error}</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {useCamera && (
          <div className="flex flex-col gap-4">
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-[3/4] md:aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-3 text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25" 
                onClick={capturePhoto}
              >
                <Camera size={18} />
                <span>Capture Photo</span>
              </button>
              <button 
                className="px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors" 
                onClick={stopCamera}
              >
                Cancel
              </button>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {capturedImage && (
          <div className="flex flex-col gap-6">
            <div className="bg-card rounded-2xl p-4 shadow-lg border border-border">
              <img 
                src={capturedImage} 
                alt="Captured trek photo" 
                className="w-full rounded-xl block" 
              />
            </div>

            {isAnalyzing && (
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-border flex flex-col items-center gap-3 text-center">
                <Loader className="animate-spin text-primary" size={32} />
                <h3 className="text-base font-semibold text-foreground m-0">Analyzing Image...</h3>
                <p className="text-sm text-muted-foreground m-0">Identifying species and gathering details</p>
              </div>
            )}

            {results && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card rounded-2xl p-5 shadow-lg border border-border flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground mb-1">{results.species}</h2>
                    <p className="text-sm text-muted-foreground m-0 italic">{results.details?.scientificName || 'Scientific name unavailable'}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium uppercase tracking-wide ${getDangerClasses(results.dangerLevel)}`}>
                    <Shield size={14} />
                    <span>{results.dangerLevel || 'Unknown'} Risk</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 text-left">
                  <p className="text-sm text-blue-700 dark:text-blue-300 m-0 flex items-center gap-2">
                    <Info size={16} />
                    Confidence Score: {Math.round(results.confidence * 100)}% match
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Globe size={16} className="text-primary" />
                      Habitat & Distribution
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed m-0">
                      {results.details?.habitat || 'Information not available.'}
                    </p>
                  </div>

                  <div className={`bg-card rounded-xl p-5 shadow-sm border border-border ${results.isDangerous ? 'border-l-4 border-l-orange-500' : ''}`}>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} className={results.isDangerous ? "text-orange-500" : "text-primary"} />
                      Safety & Precautions
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed m-0">
                      {results.details?.safetyNotes || 'No specific safety warnings.'}
                    </p>
                    {results.isDangerous && (
                      <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        <strong>Warning:</strong> Exercise caution. Keep a safe distance.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" />
                    Key Facts
                  </h3>
                  <ul className="list-disc pl-4 space-y-1">
                    {results.details?.facts?.map((fact, index) => (
                      <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                        {fact}
                      </li>
                    )) || <li className="text-sm text-muted-foreground">No facts available.</li>}
                  </ul>
                </div>

                <button 
                  className="self-start inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-5 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors mt-2"
                  onClick={resetApp}
                >
                  <RefreshCw size={16} />
                  <span>Analyze Another Photo</span>
                </button>
              </div>
            )}
          </div>
        )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrekPhotoRecognition;
