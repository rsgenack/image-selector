import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
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

  // Log initial counts
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      log(`Found ${uploadedFiles.length} uploaded images`);
    }
  }, [uploadedFiles.length]);

  // Load current image URL (any format) and let <img> handle sizing
  useEffect(() => {
    if (processedImages.length === 0 || currentIndex >= processedImages.length) return;

    setIsLoading(true);
    setError(null);
    const imagePath = processedImages[currentIndex];
    log(`Loading image: ${imagePath}`);
    setCurrentImageUrl(imagePath);
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
    return <div className="text-lg text-muted-foreground p-8 text-center">Loading images... Please wait.</div>;
  }

  if (!loading && processedImages.length === 0) {
    return <div className="text-center p-6 text-muted-foreground">No images uploaded. Go back to Home to add files.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 bg-muted border-b border-border">
        <h1 className="m-0 text-lg font-semibold text-foreground">Image Sorter</h1>
        <button className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium shadow hover:opacity-90" onClick={handleBackToHome}>Back to Home</button>
      </div>

      <div className="flex flex-1 overflow-hidden bg-background text-foreground">
        <div className="w-80 max-w-xs bg-white dark:bg-card p-4 border-r border-border flex flex-col h-full overflow-hidden">
          <h3 className="m-0 mb-2 text-base font-medium sticky top-0 bg-white dark:bg-card py-2">Liked Images ({likedImages.length})</h3>
          <div className="flex-1 overflow-y-auto border border-border bg-muted/40 p-2 rounded" ref={likedImagesRef}>
            {likedImages.length === 0 ? (
              <div className="text-muted-foreground italic py-4 text-center">No images liked yet</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-1">
                {likedImagePaths.map((path, index) => (
                  <div key={index} className="border border-border rounded p-1 bg-white dark:bg-card flex flex-col items-center overflow-hidden hover:shadow transition-transform">
                    <img src={path} alt={`Liked image ${index + 1}`} className="max-w-full h-20 object-contain mb-1" />
                    <span className="text-[11px] text-muted-foreground w-full truncate text-center">{likedImages[index]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={copyLikedImages} className="inline-flex items-center rounded-md bg-neutral-600 text-white px-3 py-1 text-xs font-medium shadow hover:brightness-110">
              Copy List
            </button>
            <button onClick={downloadLikedImages} className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1 text-xs font-medium shadow hover:brightness-110">
              Download List
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-y-auto">
          {!completed ? (
            <>
              <h1 className="text-2xl font-semibold mb-2">Image Sorter</h1>
              <p className="mb-4 text-sm text-muted-foreground text-center">
                Use <span className="inline-block px-2 py-0.5 bg-muted rounded shadow text-xs">←</span> (Left Arrow) for NO,
                <span className="inline-block px-2 py-0.5 bg-muted rounded shadow text-xs ml-1">→</span> (Right Arrow) for YES,
                <span className="inline-block px-2 py-0.5 bg-muted rounded shadow text-xs ml-1">⌫</span> (Backspace) to Undo
              </p>
              <div className="mb-2 text-xs text-muted-foreground">Image {currentIndex + 1} of {totalImages} ({Math.round((currentIndex / totalImages) * 100)}% complete)</div>
              <div className="mb-3 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded">Loaded: {processedImages.length} of {totalExpected} images</div>
              <div className="relative w-full max-w-[1200px] h-[80vh] flex items-center justify-center mx-auto mb-4 bg-white dark:bg-card rounded-lg shadow overflow-hidden">
                {isLoading ? (
                  <div className="text-base text-muted-foreground">Loading image...</div>
                ) : error ? (
                  <div className="text-red-500 text-base text-center p-4">{error}</div>
                ) : currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Preview"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    onLoad={() => {
                      setIsLoading(false);
                      log(`Successfully loaded image ${currentIndex + 1}/${processedImages.length}`);
                    }}
                    onError={() => {
                      const display = currentImageUrl.replace('?url', '');
                      const msg = `Error loading image at path: ${display}`;
                      setError(msg);
                      setIsLoading(false);
                      log(msg);
                    }}
                  />
                ) : (
                  <div className="text-red-500 text-base text-center p-4">Error loading image. Try refreshing the page.</div>
                )}
              </div>
              <div className="font-mono text-sm text-muted-foreground mb-4 px-3 py-1 bg-muted rounded max-w-[90%] break-words text-center">
                {!isLoading && processedImages[currentIndex].split('/').pop()?.replace('?url', '')}
              </div>
              <div className="flex gap-4 mt-2 flex-col md:flex-row">
                <button onClick={handleDislike} className="inline-flex items-center justify-center rounded-full bg-red-500 text-white px-6 py-2 text-base font-semibold shadow hover:brightness-110">
                  NO ←
                </button>
                <button onClick={handleUndoLastAction} className="inline-flex items-center justify-center rounded-full bg-yellow-400 text-black px-6 py-2 text-base font-semibold shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed" disabled={currentIndex === 0}>
                  ↩ UNDO
                </button>
                <button onClick={handleLike} className="inline-flex items-center justify-center rounded-full bg-green-600 text-white px-6 py-2 text-base font-semibold shadow hover:brightness-110">
                  YES →
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-card rounded-lg shadow">
              <h1 className="text-2xl font-semibold mb-2">All Done!</h1>
              <p className="text-sm text-muted-foreground">You liked {likedImages.length} images and disliked {dislikedImages.length} out of {processedImages.length}.</p>
              <p className="text-xs text-muted-foreground italic mb-4">{processedImages.length < totalExpected ? `Note: Only ${processedImages.length} of the expected ${totalExpected} images were loaded.` : `All ${totalExpected} expected images were loaded.`}</p>
              <button onClick={handleDownload} className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow hover:brightness-110">
                Download Results
              </button>
            </div>
          )}
        </div>

        <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[101]">
          <button className="inline-flex items-center justify-center rounded-full bg-neutral-800 text-white w-40 px-4 py-2 text-sm font-semibold shadow hover:-translate-y-0.5 transition-transform" onClick={toggleLogs}>
            {showLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
          <button onClick={downloadLogs} className="inline-flex items-center justify-center rounded-full bg-neutral-800 text-white w-40 px-4 py-2 text-sm font-semibold shadow hover:-translate-y-0.5 transition-transform">
            Download Logs
          </button>
          {copySuccess && <div className="bg-green-600 text-white text-center px-2 py-1 rounded text-xs animate-[fadeOut_2s_forwards]">{copySuccess}</div>}
        </div>

        {showLogs && (
          <div className="fixed right-0 top-[50px] bottom-0 z-[100] w-[350px] bg-white dark:bg-card p-4 border-l border-border flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="m-0 text-base font-medium">Activity Log</h3>
              <div className="flex gap-2">
                <button onClick={copyLogs} className="inline-flex items-center rounded-md bg-neutral-600 text-white px-3 py-1 text-xs font-medium shadow hover:brightness-110">Copy</button>
                <button onClick={() => setShowLogs(false)} className="inline-flex items-center rounded-md bg-red-600 text-white px-3 py-1 text-xs font-medium shadow hover:brightness-110">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border border-border bg-muted/40 p-2 rounded" ref={logsRef}>
              {logs.map((log, index) => (
                <div key={index} className="mb-2 pb-2 border-b border-dashed border-border leading-tight break-words text-xs font-mono">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSorter;
