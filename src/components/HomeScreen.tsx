import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="max-w-3xl mx-auto p-8 text-center">
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-8">Image Sorter</h1>
      <div className="flex flex-col gap-6">
        <div
          className={
            `border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors bg-muted/30 flex flex-col items-center justify-center gap-2 ${
              dragging ? 'border-primary/60 bg-primary/5' : 'border-muted'
            }`
          }
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <div className="text-muted-foreground mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V3M12 3L7 8M12 3L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 21H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Drag and drop images here</p>
          <p className="text-xs text-muted-foreground">or</p>
          <button className="mt-2 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:opacity-90">
            Browse Files
          </button>
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
          <div className="text-left bg-muted/40 p-4 rounded-lg max-h-52 overflow-y-auto">
            <h3 className="m-0 text-foreground font-medium">Selected Files: {selectedFiles.length}</h3>
            <ul className="list-none pl-0">
              {selectedFiles.slice(0, 5).map((file, index) => (
                <li key={index} className="py-1 border-b border-border last:border-b-0 text-sm">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
              {selectedFiles.length > 5 && (
                <li className="py-1 text-sm">...and {selectedFiles.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-4 justify-center mt-2 flex-col sm:flex-row">
          <button
            className="inline-flex items-center justify-center rounded-full bg-green-600 text-white px-5 py-2 font-semibold text-sm shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartSorting}
            disabled={selectedFiles.length === 0}
          >
            Start Sorting Custom Images
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-selective_yellow text-black px-5 py-2 font-semibold text-sm shadow hover:brightness-110"
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
