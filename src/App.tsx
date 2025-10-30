import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ImageSorter from './components/ImageSorter';
import HomeScreen from './components/HomeScreen';
import './App.css';

function App() {
  const [images, setImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load images from the public/renamed_images directory
    setLoading(true);
    console.log("Loading images from public/renamed_images directory...");
    
    try {
      const imageFiles: string[] = [];
      
      // Generate paths for all SVG files in the renamed_images directory
      // Use a pattern that matches all SVG files in renamed_images (image761.svg through image860.svg)
      for (let i = 1; i <= 860; i++) {
        imageFiles.push(`/renamed_images/image${i}.svg`);
      }
      
      console.log(`Loaded ${imageFiles.length} image paths`);
      setImages(imageFiles);
      setLoading(false);
    } catch (error) {
      console.error("Error generating image paths:", error);
      setLoading(false);
    }
  }, []);
  
  const handleUpload = (files: File[]) => {
    setUploadedFiles(files);
    console.log(`Received ${files.length} uploaded files`);
  };
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <HomeScreen
            defaultImages={images}
            onUpload={handleUpload}
          />
        } />
        <Route path="/sort" element={
          <ImageSorter 
            images={images} 
            uploadedFiles={uploadedFiles}
            loading={loading}
            totalExpected={860} // We have 100 files from image761.svg to image860.svg
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
