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
    // Fetch the generated manifest of image files (any image type)
    setLoading(true);
    fetch('/renamed_images/manifest.json')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
        const data = await res.json();
        const files: string[] = Array.isArray(data.files) ? data.files : [];
        const paths = files.map((name) => `/renamed_images/${name}`);
        console.log(`Loaded ${paths.length} images from manifest`);
        setImages(paths);
      })
      .catch((err) => {
        console.error('Error loading manifest:', err);
        setImages([]);
      })
      .finally(() => setLoading(false));
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
            totalExpected={images.length}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
