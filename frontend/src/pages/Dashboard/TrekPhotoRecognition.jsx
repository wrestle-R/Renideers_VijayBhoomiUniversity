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
    console.log('[startCamera] Attempting to start camera...');
    try {
      console.log('[startCamera] Requesting media stream...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      console.log('[startCamera] Media stream obtained:', {
        active: mediaStream.active,
        tracks: mediaStream.getTracks().length
      });
      setStream(mediaStream);
      setUseCamera(true);
      setError(null);
      console.log('[startCamera] Camera started successfully');
    } catch (error) {
      console.error('[startCamera] ERROR:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      });
      setError(`Could not access camera: ${error.message}. Please check permissions.`);
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
    console.log('[capturePhoto] Capturing photo...');
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        console.log('[capturePhoto] Video dimensions:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        console.log('[capturePhoto] Image captured, data URL length:', imageDataUrl.length);
        setCapturedImage(imageDataUrl);
        stopCamera();
        analyzeImage(imageDataUrl);
      } else {
        console.error('[capturePhoto] Video or canvas ref not available');
        setError('Camera capture failed. Please try again.');
      }
    } catch (error) {
      console.error('[capturePhoto] ERROR:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      setError(`Failed to capture photo: ${error.message}`);
    }
  };

  const handleFileUpload = (event) => {
    console.log('[handleFileUpload] File upload triggered');
    try {
      const file = event.target.files[0];
      if (file) {
        console.log('[handleFileUpload] File selected:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('[handleFileUpload] File read successfully, result length:', e.target.result.length);
          setCapturedImage(e.target.result);
          analyzeImage(e.target.result);
        };
        reader.onerror = (error) => {
          console.error('[handleFileUpload] FileReader error:', error);
          setError('Failed to read file. Please try again.');
        };
        reader.readAsDataURL(file);
      } else {
        console.warn('[handleFileUpload] No file selected');
      }
    } catch (error) {
      console.error('[handleFileUpload] ERROR:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      setError(`Failed to upload file: ${error.message}`);
    }
  };

  const analyzeImage = async (imageDataUrl) => {
    console.log('[analyzeImage] Starting image analysis...');
    setIsAnalyzing(true);
    setResults(null);
    setError(null);

    try {
      console.log('[analyzeImage] Converting image data URL to blob...');
      const blob = await fetch(imageDataUrl).then(r => r.blob());
      console.log('[analyzeImage] Blob created:', { size: blob.size, type: blob.type });
      
      console.log('[analyzeImage] Calling identifySpeciesWithClaude...');
      const identificationResult = await identifySpeciesWithClaude(blob);
      console.log('[analyzeImage] Identification result:', identificationResult);
      
      if (identificationResult && identificationResult.species && identificationResult.species !== 'unknown') {
        console.log('[analyzeImage] Valid species identified, fetching details...');
        const detailedInfo = await getSpeciesDetails(identificationResult.species);
        console.log('[analyzeImage] Details received:', detailedInfo);
        
        const resultsData = {
          species: identificationResult.species,
          category: identificationResult.category,
          confidence: identificationResult.confidence,
          confidenceScore: identificationResult.confidenceScore,
          isDangerous: identificationResult.isDangerous,
          dangerLevel: identificationResult.dangerLevel,
          details: detailedInfo,
        };
        setResults(resultsData);
        console.log('[analyzeImage] ✅ Results set successfully:', resultsData);
      } else {
        console.warn('[analyzeImage] No valid species identified:', identificationResult);
        setError('Could not identify any species in the image. Please try a clearer photo.');
      }
    } catch (error) {
      console.error('[analyzeImage] ERROR:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      });
      setError(`Failed to analyze image: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      console.log('[analyzeImage] Analysis complete, setting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  };

  const identifySpeciesWithClaude = async (imageBlob) => {
    console.log('[identifySpeciesWithClaude] Starting identification...');
    try {
      console.log('[identifySpeciesWithClaude] Converting blob to base64...');
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          console.log('[identifySpeciesWithClaude] Base64 conversion complete, length:', base64String.length);
          resolve(base64String);
        };
        reader.onerror = (error) => {
          console.error('[identifySpeciesWithClaude] FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(imageBlob);
      });

      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/identify-species`;
      console.log('[identifySpeciesWithClaude] Sending request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });

      console.log('[identifySpeciesWithClaude] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('[identifySpeciesWithClaude] API Error Response:', errorData);
        throw new Error(`API error (${response.status}): ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('[identifySpeciesWithClaude] ✅ Identification successful:', {
        species: result.species,
        category: result.category,
        confidence: result.confidence,
        confidenceScore: result.confidenceScore,
        isDangerous: result.isDangerous,
        dangerLevel: result.dangerLevel
      });
      
      if (!result || !result.species || result.species === 'unknown') {
        console.warn('[identifySpeciesWithClaude] No species identified or unknown species');
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('[identifySpeciesWithClaude] CATCH ERROR:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      });
      return null;
    }
  };

  const getSpeciesDetails = async (speciesName) => {
    console.log('[getSpeciesDetails] Starting details fetch for:', speciesName);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/species-details`;
      console.log('[getSpeciesDetails] Sending request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciesName }),
      });

      console.log('[getSpeciesDetails] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('[getSpeciesDetails] API Error Response:', errorData);
        throw new Error(`API error (${response.status}): ${errorData.error || response.statusText}`);
      }

      const details = await response.json();
      console.log('[getSpeciesDetails] ✅ Details received successfully');
      console.log('[getSpeciesDetails] Full details object:', details);
      console.log('[getSpeciesDetails] Details summary:', {
        scientificName: details.scientificName || 'N/A',
        commonNames: details.commonNames?.length || 0,
        hasDescription: !!details.description,
        hasHabitat: !!details.habitat,
        hasDistribution: !!details.distribution,
        hasBehavior: !!details.behavior,
        hasDiet: !!details.diet,
        interestingFacts: details.interestingFacts?.length || 0,
        safetyTips: details.safetyTips?.length || 0,
        isThreatened: details.isThreatened || false,
        isVenomous: details.isVenomous || false,
        isPoisonous: details.isPoisonous || false
      });
      return details;
    } catch (error) {
      console.error('[getSpeciesDetails] CATCH ERROR:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      });
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
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-3/4 md:aspect-video">
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
                    Confidence Score: {Math.round((results.confidenceScore || 0) * 100)}% match
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Globe size={16} className="text-primary" />
                      Habitat & Distribution
                    </h3>
                    <div className="space-y-3">
                      {results.details?.habitat && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Habitat</p>
                          <p className="text-sm text-foreground leading-relaxed">{results.details.habitat}</p>
                        </div>
                      )}
                      {results.details?.distribution && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Distribution</p>
                          <p className="text-sm text-foreground leading-relaxed">{results.details.distribution}</p>
                        </div>
                      )}
                      {!results.details?.habitat && !results.details?.distribution && (
                        <p className="text-sm text-muted-foreground">Information not available.</p>
                      )}
                    </div>
                  </div>

                  <div className={`bg-card rounded-xl p-5 shadow-sm border border-border ${results.isDangerous ? 'border-l-4 border-l-orange-500' : ''}`}>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className={results.isDangerous ? "text-orange-500" : "text-primary"} />
                      Safety & Precautions
                    </h3>
                    {results.details?.safetyTips && results.details.safetyTips.length > 0 ? (
                      <ul className="space-y-2">
                        {results.details.safetyTips.map((tip, index) => (
                          <li key={index} className="text-sm text-foreground flex gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific safety warnings.</p>
                    )}
                    {results.isDangerous && (
                      <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        <strong>⚠️ Warning:</strong> Exercise caution. Keep a safe distance.
                      </div>
                    )}
                  </div>
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
