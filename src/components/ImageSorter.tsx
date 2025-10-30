import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ImageSorter.css';

interface ImageSorterProps {
  images: string[];
  uploadedFiles?: File[];
  loading?: boolean;
  totalExpected?: number;
}

const ImageSorter: React.FC<ImageSorterProps> = ({ 
  images, 
  uploadedFiles = [],
  loading = false,
  totalExpected = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedImages, setLikedImages] = useState<string[]>([]);
  const [likedImagePaths, setLikedImagePaths] = useState<string[]>([]);
  const [dislikedImages, setDislikedImages] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const navigate = useNavigate();
  
  // Reference to logs div for autoscrolling
  const logsRef = useRef<HTMLDivElement | null>(null);
  const likedImagesRef = useRef<HTMLDivElement | null>(null);

  // Get the total number of images
  const totalImages = totalExpected > 0 ? totalExpected : images.length + uploadedFiles.length;

  // Process uploaded files
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      log(`Processing ${uploadedFiles.length} uploaded files`);
      
      const tempImages: string[] = [...images];
      const objectUrls: string[] = [];
      
      uploadedFiles.forEach(file => {
        const objectUrl = URL.createObjectURL(file);
        tempImages.push(objectUrl);
        objectUrls.push(objectUrl);
        log(`Added uploaded file: ${file.name}`);
      });
      
      setProcessedImages(tempImages);
      
      // Cleanup function for object URLs
      return () => {
        objectUrls.forEach(url => {
          URL.revokeObjectURL(url);
          log(`Revoked object URL: ${url}`);
        });
      };
    } else {
      setProcessedImages(images);
    }
  }, [images, uploadedFiles]);

  // Log actions to both console and state for visibility
  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
    
    // Auto-scroll logs only if already at the bottom
    setTimeout(() => {
      if (logsRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = logsRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        
        if (isAtBottom) {
          logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
      }
      
      if (likedImagesRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = likedImagesRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        
        if (isAtBottom) {
          likedImagesRef.current.scrollTop = likedImagesRef.current.scrollHeight;
        }
      }
    }, 10);
  };

  // Log the image count on initial load
  useEffect(() => {
    if (images.length > 0) {
      log(`Found ${images.length} images of ${totalImages} expected`);
      
      if (images.length < totalImages) {
        log(`Warning: Only loaded ${images.length} of the expected ${totalImages} images`);
      }
    }
  }, [images.length, totalImages]);

  // Load current image
  useEffect(() => {
    if (processedImages.length === 0 || currentIndex >= processedImages.length) return;
    
    // Fetch SVG content
    setIsLoading(true);
    setError(null);
    const imagePath = processedImages[currentIndex];
    
    log(`Loading image: ${imagePath}`);

    // Strip the URL parameter for display purposes
    const displayPath = imagePath.replace('?url', '');
    
    // Create an img element to display the SVG
    const img = document.createElement('img');
    img.src = imagePath;
    img.alt = "SVG Image";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    
    img.onload = () => {
      // Create a wrapper for the img tag
      const svgWrapper = `<div class="svg-wrapper"><img src="${imagePath}" alt="SVG Image" /></div>`;
      setSvgContent(svgWrapper);
      setIsLoading(false);
      log(`Successfully loaded image ${currentIndex + 1}/${processedImages.length}`);
    };
    
    img.onerror = () => {
      const errorMsg = `Error loading SVG at path: ${displayPath}`;
      log(errorMsg);
      setError(errorMsg);
      setIsLoading(false);
    };
  }, [currentIndex, processedImages]);

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (completed) return;
      
      if (e.key === 'ArrowLeft') {
        // No - dislike
        handleDislike();
      } else if (e.key === 'ArrowRight') {
        // Yes - like
        handleLike();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Undo the last action
        handleUndoLastAction();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentIndex, processedImages, completed, likedImages, dislikedImages]);

  // Clear copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Handle user liking an image
  const handleLike = () => {
    if (completed) return;
    
    const imagePath = processedImages[currentIndex];
    // Extract just the filename from the path, removing URL parameters
    const filename = imagePath.split('/').pop()?.replace('?url', '') || '';
    
    // Store just the filename for simplicity
    log(`LIKED: ${filename}`);
    setLikedImages(prev => [...prev, filename]);
    setLikedImagePaths(prev => [...prev, imagePath]);
    handleNext();
  };

  // Handle user disliking an image
  const handleDislike = () => {
    if (completed) return;
    
    const imagePath = processedImages[currentIndex];
    // Extract just the filename from the path, removing URL parameters
    const filename = imagePath.split('/').pop()?.replace('?url', '') || '';
    
    // Store just the filename for simplicity
    log(`DISLIKED: ${filename}`);
    setDislikedImages(prev => [...prev, filename]);
    handleNext();
  };

  // Undo the last action
  const handleUndoLastAction = () => {
    if (currentIndex === 0 || completed) return;
    
    // Go back to the previous image
    setCurrentIndex(currentIndex - 1);
    
    // Check if the previous image was liked or disliked
    const prevImage = processedImages[currentIndex - 1];
    const prevFilename = prevImage.split('/').pop()?.replace('?url', '') || '';
    
    // Remove the previous image from either liked or disliked
    if (likedImages.includes(prevFilename)) {
      log(`UNDO LIKE: ${prevFilename}`);
      setLikedImages(prev => prev.filter(img => img !== prevFilename));
      setLikedImagePaths(prev => prev.filter((_, index) => likedImages[index] !== prevFilename));
    } else if (dislikedImages.includes(prevFilename)) {
      log(`UNDO DISLIKE: ${prevFilename}`);
      setDislikedImages(prev => prev.filter(img => img !== prevFilename));
    }
  };

  // Move to next image
  const handleNext = () => {
    if (currentIndex < processedImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of images
      setCompleted(true);
      log('Completed reviewing all images');
      saveResults();
    }
  };

  // Toggle logs visibility
  const toggleLogs = () => {
    setShowLogs(!showLogs);
  };

  // Copy logs to clipboard
  const copyLogs = () => {
    try {
      const logsContent = logs.join('\n');
      navigator.clipboard.writeText(logsContent);
      setCopySuccess('Copied!');
      log('Logs copied to clipboard');
    } catch (error) {
      setCopySuccess('Failed to copy');
      log(`Error copying logs: ${error}`);
    }
  };

  // Copy liked images to clipboard
  const copyLikedImages = () => {
    try {
      const likedContent = likedImages.join('\n');
      navigator.clipboard.writeText(likedContent);
      setCopySuccess('Copied!');
      log('Liked images copied to clipboard');
    } catch (error) {
      setCopySuccess('Failed to copy');
      log(`Error copying liked images: ${error}`);
    }
  };

  // Download just the logs
  const downloadLogs = () => {
    try {
      const logsContent = logs.join('\n');
      const blob = new Blob([logsContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      log('Logs downloaded');
    } catch (error) {
      log(`Error downloading logs: ${error}`);
    }
  };

  // Download just the liked images
  const downloadLikedImages = () => {
    try {
      const likedContent = likedImages.join('\n');
      const blob = new Blob([likedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `liked-images-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      log('Liked images downloaded');
    } catch (error) {
      log(`Error downloading liked images: ${error}`);
    }
  };

  // Save results to JSON file
  const saveResults = () => {
    try {
      const results = {
        likedImages,
        dislikedImages,
        timestamp: new Date().toISOString(),
        totalImages: images.length,
        totalExpected: totalExpected,
        totalLiked: likedImages.length,
        totalDisliked: dislikedImages.length
      };
      
      const jsonContent = JSON.stringify(results, null, 2); // pretty print
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-results-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      log('Results saved to JSON file');
      
      // Also save logs
      const logsContent = logs.join('\n');
      const logsBlob = new Blob([logsContent], { type: 'text/plain' });
      const logsUrl = URL.createObjectURL(logsBlob);
      
      const logsLink = document.createElement('a');
      logsLink.href = logsUrl;
      logsLink.download = `image-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(logsLink);
      logsLink.click();
      document.body.removeChild(logsLink);
      
      log('Logs saved to text file');
      
      // Create a separate "liked-images.txt" file
      const likedImagesContent = likedImages.join('\n');
      const likedImagesBlob = new Blob([likedImagesContent], { type: 'text/plain' });
      const likedImagesUrl = URL.createObjectURL(likedImagesBlob);
      
      const likedImagesLink = document.createElement('a');
      likedImagesLink.href = likedImagesUrl;
      likedImagesLink.download = `liked-images-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(likedImagesLink);
      likedImagesLink.click();
      document.body.removeChild(likedImagesLink);
      
      log('Liked images saved to text file');
    } catch (error) {
      log(`Error saving results: ${error}`);
    }
  };

  // Manual download
  const handleDownload = () => {
    saveResults();
  };

  const handleBackToHome = () => {
    // Navigate back to home screen
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading images... Please wait.</div>;
  }

  if (images.length === 0) {
    return <div className="error-message">No images found. Please check the Images directory.</div>;
  }

  return (
    <div className="image-sorter-container">
      {/* Header */}
      <div className="header">
        <h1>Image Sorter</h1>
        <button className="back-button" onClick={handleBackToHome}>Back to Home</button>
      </div>
      
      <div className="image-sorter">
        <div className="liked-images-sidebar">
          <h3>Liked Images ({likedImages.length})</h3>
          <div className="liked-images-grid" ref={likedImagesRef}>
            {likedImages.length === 0 ? (
              <div className="no-images">No images liked yet</div>
            ) : (
              <>
                <div className="images-grid">
                  {likedImagePaths.map((path, index) => (
                    <div key={index} className="liked-image-tile">
                      <img src={path} alt={`Liked image ${index + 1}`} />
                      <span className="liked-image-name">{likedImages[index]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="logs-buttons">
            <button onClick={copyLikedImages} className="copy-btn-small">
              Copy List
            </button>
            <button onClick={downloadLikedImages} className="download-btn-small">
              Download List
            </button>
          </div>
        </div>
        
        <div className="main-content">
          {!completed ? (
            <>
              <h1>Image Sorter</h1>
              <p className="instructions">
                Use <span className="key">←</span> (Left Arrow) for NO, <span className="key">→</span> (Right Arrow) for YES, <span className="key">⌫</span> (Backspace) to Undo
              </p>
              <div className="progress">
                Image {currentIndex + 1} of {totalImages} ({Math.round((currentIndex / totalImages) * 100)}% complete)
              </div>
              <div className="total-stats">
                Loaded: {images.length} of {totalExpected} images
              </div>
              <div className="image-container">
                {isLoading ? (
                  <div className="loading-indicator">Loading image...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : svgContent ? (
                  <div 
                    className="svg-container" 
                    dangerouslySetInnerHTML={{ __html: svgContent }} 
                  />
                ) : (
                  <div className="error-message">
                    Error loading image. Try refreshing the page.
                  </div>
                )}
              </div>
              <div className="filename">
                {!isLoading && processedImages[currentIndex].split('/').pop()?.replace('?url', '')}
              </div>
              <div className="buttons">
                <button onClick={handleDislike} className="dislike-btn">
                  NO ←
                </button>
                <button onClick={handleUndoLastAction} className="undo-btn" disabled={currentIndex === 0}>
                  ↩ UNDO
                </button>
                <button onClick={handleLike} className="like-btn">
                  YES →
                </button>
              </div>
            </>
          ) : (
            <div className="completion">
              <h1>All Done!</h1>
              <p>You liked {likedImages.length} images and disliked {dislikedImages.length} out of {images.length}.</p>
              <p className="completion-note">
                {images.length < totalExpected ? 
                  `Note: Only ${images.length} of the expected ${totalExpected} images were loaded.` : 
                  `All ${totalExpected} expected images were loaded.`}
              </p>
              <button onClick={handleDownload} className="download-btn">
                Download Results
              </button>
            </div>
          )}
        </div>
        
        <div className="logs-buttons-container">
          <button className="toggle-logs-btn" onClick={toggleLogs}>
            {showLogs ? "Hide Logs" : "Show Logs"}
          </button>
          <button onClick={downloadLogs} className="download-logs-btn">
            Download Logs
          </button>
          {copySuccess && <div className="copy-success">{copySuccess}</div>}
        </div>
        
        {showLogs && (
          <div className="logs-container">
            <div className="logs-header">
              <h3>Activity Log</h3>
              <div className="logs-buttons">
                <button onClick={copyLogs} className="copy-btn-small">
                  Copy
                </button>
                <button onClick={() => setShowLogs(false)} className="close-btn-small">
                  Close
                </button>
              </div>
            </div>
            <div className="logs" ref={logsRef}>
              {logs.map((log, index) => (
                <div key={index} className="log-entry">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSorter; 