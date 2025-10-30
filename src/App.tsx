import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ImageSorter from './components/ImageSorter';
import HomeScreen from './components/HomeScreen';
import './App.css';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading] = useState(false);

  // No default image loading; users upload their own images

  const handleUpload = (files: File[]) => {
    setUploadedFiles(files);
    console.log(`Received ${files.length} uploaded files`);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen onUpload={handleUpload} />} />
        <Route path="/sort" element={
          <ImageSorter 
            images={[]}
            uploadedFiles={uploadedFiles}
            loading={loading}
            totalExpected={uploadedFiles.length}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
