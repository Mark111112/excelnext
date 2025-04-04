import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareIcon from '@mui/icons-material/Compare';
import MergeIcon from '@mui/icons-material/Merge';
import DownloadIcon from '@mui/icons-material/Download';
import FileUpload from '@/components/FileUpload';
import CompareHeaders from '@/components/CompareHeaders';
import MergeExcel from '@/components/MergeExcel';
import axios from 'axios';
import Head from 'next/head';

interface AlertItem {
  type: 'success' | 'error';
  message: string;
}

interface DeleteDialogState {
  open: boolean;
  filename: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    filename: ''
  });
  const [activeTab, setActiveTab] = useState<'upload' | 'compare' | 'merge'>('upload');
  
  // Add a new alert
  const addAlert = (type: 'success' | 'error', message: string) => {
    setAlerts(prevAlerts => [...prevAlerts, { type, message }]);
  };
  
  // Fetch files from the API
  const fetchFiles = useCallback(async () => {
    try {
      const response = await axios.get<{ success: boolean; files: string[] }>('/api/files');
      if (response.data.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      addAlert('error', 'Failed to fetch files');
    }
  }, [addAlert]);
  
  // Load files when component mounts
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  
  // Clear alerts after 5 seconds
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        setAlerts([]);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [alerts]);
  
  // Handle file upload success
  const handleUploadSuccess = (uploadedFiles: string[]) => {
    addAlert('success', `Successfully uploaded: ${uploadedFiles.join(', ')}`);
    fetchFiles();
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (filename: string) => {
    setDeleteDialog({
      open: true,
      filename
    });
  };
  
  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      filename: ''
    });
  };
  
  // Delete a file
  const deleteFile = async () => {
    try {
      const response = await axios.delete<ApiResponse>(`/api/files?filename=${encodeURIComponent(deleteDialog.filename)}`);
      
      if (response.data.success) {
        addAlert('success', response.data.message || 'File has been deleted');
        fetchFiles();
      } else {
        addAlert('error', response.data.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      addAlert('error', 'Failed to delete file');
    } finally {
      closeDeleteDialog();
    }
  };
  
  // Download a file
  const downloadFile = (filename: string) => {
    window.open(`/api/download/${encodeURIComponent(filename)}`, '_blank');
  };
  
  return (
    <React.Fragment>
      <Head>
        <title>Excel File Combiner</title>
        <meta name="description" content="Upload, compare and merge Excel files" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Excel File Combiner
        </Typography>
        
        {/* Alert messages */}
        <Box sx={{ mb: 3 }}>
          {alerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={alert.type} 
              sx={{ mb: 1 }}
              onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
        
        {/* Navigation tabs */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant={activeTab === 'upload' ? 'contained' : 'outlined'} 
            onClick={() => setActiveTab('upload')}
            sx={{ mx: 1 }}
          >
            Upload Files
          </Button>
          <Button 
            variant={activeTab === 'compare' ? 'contained' : 'outlined'} 
            onClick={() => setActiveTab('compare')}
            sx={{ mx: 1 }}
            startIcon={<CompareIcon />}
          >
            Compare Headers
          </Button>
          <Button 
            variant={activeTab === 'merge' ? 'contained' : 'outlined'} 
            onClick={() => setActiveTab('merge')}
            sx={{ mx: 1 }}
            startIcon={<MergeIcon />}
          >
            Merge Files
          </Button>
        </Box>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Upload tab */}
          {activeTab === 'upload' && (
            <React.Fragment>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Uploaded Files
                </Typography>
                
                {files.length === 0 ? (
                  <Typography>No files uploaded yet.</Typography>
                ) : (
                  <List>
                    {files.map((file) => (
                      <ListItem
                        key={file}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              aria-label="download"
                              onClick={() => downloadFile(file)}
                              sx={{ mr: 1 }}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => openDeleteDialog(file)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText primary={file} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </React.Fragment>
          )}
          
          {/* Compare tab */}
          {activeTab === 'compare' && (
            <CompareHeaders files={files} />
          )}
          
          {/* Merge tab */}
          {activeTab === 'merge' && (
            <MergeExcel 
              files={files} 
              onMergeSuccess={(filename: string) => {
                addAlert('success', `Files successfully merged into ${filename}`);
                fetchFiles();
              }} 
            />
          )}
        </Paper>
        
        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={closeDeleteDialog}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the file &quot;{deleteDialog.filename}&quot;?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={deleteFile} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </React.Fragment>
  );
} 