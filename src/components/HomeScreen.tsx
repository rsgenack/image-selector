import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeScreen.css';

interface HomeScreenProps {
  defaultImages: string[];
  onUpload: (files: File[]) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ defaultImages, onUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleStartSorting = () => {
    onUpload(selectedFiles);
    navigate('/sort');
  };
  
  const handleUseDefault = () => {
    onUpload([]);
    navigate('/sort');
  };
  
  return (
    <div className="home-container">
      <h1>Image Sorter</h1>
      <div className="upload-section">
        <div 
          className={`drop-area ${dragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V3M12 3L7 8M12 3L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 21H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p>Drag and drop images here</p>
          <p>or</p>
          <button className="browse-button">Browse Files</button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            style={{ display: 'none' }} 
          />
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h3>Selected Files: {selectedFiles.length}</h3>
            <ul>
              {selectedFiles.slice(0, 5).map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
              {selectedFiles.length > 5 && (
                <li>...and {selectedFiles.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            className="start-button"
            onClick={handleStartSorting}
            disabled={selectedFiles.length === 0}
          >
            Start Sorting Custom Images
          </button>
          <button 
            className="default-button"
            onClick={handleUseDefault}
          >
            Use Default Images ({defaultImages.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen; 