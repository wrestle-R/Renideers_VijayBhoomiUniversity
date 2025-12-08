import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCw, AlertTriangle, Loader, Info, BookOpen, Shield, Globe } from 'lucide-react';

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

  const getDangerColor = (dangerLevel) => {
    switch (dangerLevel) {
      case 'high': return '#b91c1c';
      case 'medium': return '#92400e';
      case 'low': return '#854d0e';
      default: return '#166534';
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>Trek Species Recognition</h1>
          <p style={styles.subtitle}>
            AI-powered plant and animal identification for safer, smarter treks.
          </p>
        </div>
      </header>

      <div style={styles.mainContent}>
        {!capturedImage && !useCamera && (
          <div style={styles.uploadSection}>
            <div style={styles.instructionCard}>
              <div style={styles.instructionHeader}>
                <h2 style={styles.instructionTitle}>Analyse a trek photo</h2>
                <p style={styles.instructionText}>
                  Capture or upload a photo from your trek. The system will identify visible species
                  and surface safety information, habitat details, and key facts.
                </p>
              </div>

              <div style={styles.featuresRow}>
                <div style={styles.featureColumn}>
                  <h3 style={styles.featureHeading}>What you get</h3>
                  <ul style={styles.featureList}>
                    <li>Species name with confidence score</li>
                    <li>Scientific classification and common names</li>
                    <li>Habitat, behaviour and distribution</li>
                    <li>Conservation and protection information</li>
                    <li>Safety guidance and precautions</li>
                  </ul>
                </div>
                <div style={styles.featureColumn}>
                  <h3 style={styles.featureHeading}>Best results</h3>
                  <ul style={styles.featureList}>
                    <li>Use clear, well-lit photos</li>
                    <li>Keep the subject centred and in focus</li>
                    <li>Avoid extreme zoom or heavy blur</li>
                    <li>Capture from a safe distance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button style={styles.primaryButton} onClick={startCamera}>
                <Camera size={18} />
                <span>Use Camera</span>
              </button>
              
              <button 
                style={styles.secondaryButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} />
                <span>Upload Photo</span>
              </button>
            </div>

            {error && (
              <div style={styles.errorCard}>
                <AlertTriangle size={18} />
                <p style={styles.errorText}>{error}</p>
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
          <div style={styles.cameraSection}>
            <div style={styles.videoWrapper}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={styles.video}
              />
            </div>
            <div style={styles.cameraControls}>
              <button style={styles.primaryButton} onClick={capturePhoto}>
                <Camera size={18} />
                <span>Capture Photo</span>
              </button>
              <button style={styles.tertiaryButton} onClick={stopCamera}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div style={styles.resultsSection}>
            <div style={styles.imageContainer}>
              <img src={capturedImage} alt="Captured" style={styles.capturedImage} />
            </div>

            {isAnalyzing && (
              <div style={styles.analyzingCard}>
                <Loader size={32} className="animate-spin" />
                <p style={styles.analyzingTitle}>Running analysis</p>
                <p style={styles.analyzingText}>
                  Identifying visible species and compiling safety and habitat information.
                </p>
              </div>
            )}

            {error && (
              <div style={styles.errorCard}>
                <AlertTriangle size={18} />
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            {!isAnalyzing && results && (
              <div style={styles.detailsContainer}>
                {/* Header with Species Name */}
                <div style={styles.speciesHeader}>
                  <div>
                    <h2 style={styles.speciesName}>{results.species}</h2>
                    {results.details?.scientificName && (
                      <p style={styles.scientificName}>
                        <em>{results.details.scientificName}</em>
                      </p>
                    )}
                  </div>
                  {results.isDangerous && (
                    <div
                      style={{
                        ...styles.dangerBadge,
                        borderColor: getDangerColor(results.dangerLevel),
                        color: getDangerColor(results.dangerLevel),
                      }}
                    >
                      <Shield size={18} />
                      <span>{results.dangerLevel.toUpperCase()} RISK</span>
                    </div>
                  )}
                </div>

                {/* Common Names */}
                {results.details?.commonNames && results.details.commonNames.length > 0 && (
                  <div style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>Common names</h3>
                    <div style={styles.tagContainer}>
                      {results.details.commonNames.map((name, idx) => (
                        <span key={idx} style={styles.tag}>{name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {results.details?.description && (
                  <div style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>
                      <Info size={18} />
                      Description
                    </h3>
                    <p style={styles.cardText}>{results.details.description}</p>
                  </div>
                )}

                {/* Habitat & Distribution */}
                <div style={styles.twoColumnGrid}>
                  {results.details?.habitat && (
                    <div style={styles.infoCard}>
                      <h3 style={styles.cardTitle}>Habitat</h3>
                      <p style={styles.cardText}>{results.details.habitat}</p>
                    </div>
                  )}
                  
                  {results.details?.distribution && (
                    <div style={styles.infoCard}>
                      <h3 style={styles.cardTitle}>
                        <Globe size={18} />
                        Distribution
                      </h3>
                      <p style={styles.cardText}>{results.details.distribution}</p>
                    </div>
                  )}
                </div>

                {/* Behavior & Diet */}
                <div style={styles.twoColumnGrid}>
                  {results.details?.behavior && (
                    <div style={styles.infoCard}>
                      <h3 style={styles.cardTitle}>Behaviour</h3>
                      <p style={styles.cardText}>{results.details.behavior}</p>
                    </div>
                  )}
                  
                  {results.details?.diet && (
                    <div style={styles.infoCard}>
                      <h3 style={styles.cardTitle}>Diet / growing conditions</h3>
                      <p style={styles.cardText}>{results.details.diet}</p>
                    </div>
                  )}
                </div>

                {/* Conservation Status */}
                {results.details?.conservation && (
                  <div
                    style={{
                      ...styles.infoCard,
                      ...(results.details.isThreatened ? styles.warningCard : {}),
                    }}
                  >
                    <h3 style={styles.cardTitle}>Conservation</h3>
                    <p style={styles.cardText}>{results.details.conservation}</p>
                  </div>
                )}

                {/* Danger Information */}
                {results.details?.dangerInfo && (
                  <div
                    style={{
                      ...styles.infoCard,
                      backgroundColor: '#fff7ed',
                      borderLeft: `4px solid ${getDangerColor(results.dangerLevel)}`,
                    }}
                  >
                    <h3 style={styles.cardTitle}>
                      <AlertTriangle size={18} />
                      Safety guidance
                    </h3>
                    <p style={styles.cardText}>{results.details.dangerInfo}</p>
                    
                    {results.details.isVenomous && (
                      <div style={styles.alertBox}>
                        Venomous species – maintain distance and avoid handling.
                      </div>
                    )}
                    
                    {results.details.isPoisonous && (
                      <div style={styles.alertBox}>
                        Poisonous species – do not touch, ingest, or allow pets to interact.
                      </div>
                    )}
                  </div>
                )}

                {/* Safety Tips */}
                {results.details?.safetyTips && results.details.safetyTips.length > 0 && (
                  <div style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>Safety tips on the trail</h3>
                    <ul style={styles.tipsList}>
                      {results.details.safetyTips.map((tip, idx) => (
                        <li key={idx} style={styles.tipItem}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interesting Facts */}
                {results.details?.interestingFacts && results.details.interestingFacts.length > 0 && (
                  <div style={styles.infoCard}>
                    <h3 style={styles.cardTitle}>
                      <BookOpen size={18} />
                      Field notes
                    </h3>
                    <ul style={styles.factsList}>
                      {results.details.interestingFacts.map((fact, idx) => (
                        <li key={idx} style={styles.factItem}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence Level */}
                <div style={styles.confidenceCard}>
                  <p style={styles.confidenceText}>
                    Identification confidence:&nbsp;
                    <strong>{results.confidence.toUpperCase()}</strong>
                  </p>
                </div>
              </div>
            )}

            <button style={styles.retakeButton} onClick={resetApp}>
              <RefreshCw size={18} />
              <span>Analyse another photo</span>
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerInner: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '24px 24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    marginTop: '6px',
    fontSize: '14px',
    color: '#6b7280',
  },
  mainContent: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '32px 24px 48px',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px 24px',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
    border: '1px solid #e5e7eb',
  },
  instructionHeader: {
    marginBottom: '20px',
  },
  instructionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    marginBottom: '8px',
  },
  instructionText: {
    fontSize: '14px',
    color: '#4b5563',
    margin: 0,
  },
  featuresRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginTop: '12px',
  },
  featureColumn: {},
  featureHeading: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6b7280',
    marginBottom: '8px',
  },
  featureList: {
    listStyle: 'disc',
    paddingLeft: '18px',
    margin: 0,
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.7,
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#166534',
    color: '#ffffff',
    border: 'none',
    borderRadius: '999px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(22, 101, 52, 0.25)',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#111827',
    color: '#ffffff',
    border: 'none',
    borderRadius: '999px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  tertiaryButton: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  cameraSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  videoWrapper: {
    backgroundColor: '#000',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.4)',
  },
  video: {
    width: '100%',
    display: 'block',
  },
  cameraControls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  resultsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  imageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e5e7eb',
  },
  capturedImage: {
    width: '100%',
    borderRadius: '12px',
    display: 'block',
  },
  analyzingCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  analyzingTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  analyzingText: {
    fontSize: '14px',
    color: '#4b5563',
    margin: 0,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #fca5a5',
  },
  errorText: {
    fontSize: '13px',
    color: '#b91c1c',
    margin: 0,
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  speciesHeader: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px 22px',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  speciesName: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  scientificName: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  dangerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: '#fef2f2',
    border: '1px solid',
    fontWeight: 500,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '18px 20px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1.7,
    margin: 0,
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    backgroundColor: '#ecfdf3',
    color: '#166534',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 500,
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  warningCard: {
    borderLeft: '3px solid #f97316',
  },
  alertBox: {
    marginTop: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    fontSize: '13px',
    color: '#7f1d1d',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '18px',
    lineHeight: 1.7,
    fontSize: '14px',
    color: '#4b5563',
  },
  tipItem: {
    marginBottom: '4px',
  },
  factsList: {
    listStyle: 'disc',
    paddingLeft: '18px',
    margin: 0,
  },
  factItem: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '4px',
    lineHeight: 1.7,
  },
  confidenceCard: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    padding: '10px 14px',
    border: '1px solid #bfdbfe',
    textAlign: 'left',
  },
  confidenceText: {
    fontSize: '13px',
    color: '#1d4ed8',
    margin: 0,
  },
  retakeButton: {
    marginTop: '8px',
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#111827',
    color: '#ffffff',
    border: 'none',
    borderRadius: '999px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default TrekPhotoRecognition;
