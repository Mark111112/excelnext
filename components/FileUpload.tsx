import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  LinearProgress, 
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

interface FileUploadProps {
  onUploadSuccess: (fileNames: string[]) => void;
}

interface UploadResponse {
  success: boolean;
  files: Array<{
    name: string;
    size: number;
    savedAs: string;
  }>;
  errors?: Array<{
    name: string;
    error: string;
  }>;
}

interface UploadProgressEvent {
  loaded: number;
  total?: number;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
    }
  };
  
  // Handle file upload
  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    
    if (selectedFiles.length === 0) {
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    selectedFiles.forEach((file: File) => {
      formData.append('files', file);
    });
    
    try {
      const response = await axios.post<UploadResponse>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: UploadProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      
      if (response.data.success) {
        // Reset the form
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notify parent component
        const uploadedFileNames = response.data.files.map((file) => file.savedAs);
        onUploadSuccess(uploadedFileNames);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleUpload}>
      <Typography variant="h5" component="h2" gutterBottom>
        Upload Excel Files
      </Typography>
      
      <Box sx={{ 
        border: '2px dashed #ccc',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        mb: 2,
        backgroundColor: '#f8f8f8'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="excel-file-input"
        />
        <label htmlFor="excel-file-input">
          <Button
            component="span"
            variant="contained"
            startIcon={<UploadFileIcon />}
            sx={{ mb: 2 }}
            disabled={uploading}
          >
            Select Excel Files
          </Button>
        </label>
        
        <Typography variant="body2" color="textSecondary">
          Only .xls and .xlsx files are supported (max 16MB)
        </Typography>
        
        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">
              {selectedFiles.length} file(s) selected:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  <Typography variant="body2" noWrap>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </Typography>
                </li>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      
      {uploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={selectedFiles.length === 0 || uploading}
        sx={{ mt: 1 }}
      >
        {uploading ? (
          <React.Fragment>
            <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
            Uploading...
          </React.Fragment>
        ) : 'Upload Files'}
      </Button>
    </Box>
  );
} 