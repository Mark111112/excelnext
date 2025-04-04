import React from 'react';
import { useState, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import MergeIcon from '@mui/icons-material/Merge';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

interface MergeExcelProps {
  files: string[];
  onMergeSuccess: (filename: string) => void;
}

interface MergeError {
  file: string;
  error: string;
}

interface MergeResponse {
  success: boolean;
  filePath?: string;
  errors?: MergeError[];
  message?: string;
}

interface MergeResult {
  filePath: string;
  errors?: MergeError[];
}

export default function MergeExcel({ files, onMergeSuccess }: MergeExcelProps) {
  const [sheetIndex, setSheetIndex] = useState('1');
  const [headerRow, setHeaderRow] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  const handleMerge = async () => {
    if (files.length === 0) {
      setError('No files available for merging');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<MergeResponse>('/api/merge-excel', {
        sheetIndex,
        headerRow
      });

      if (response.data.success && response.data.filePath) {
        setMergeResult({
          filePath: response.data.filePath,
          errors: response.data.errors
        });
        onMergeSuccess(response.data.filePath);
      } else {
        setError(response.data.message || 'Failed to merge Excel files');
      }
    } catch (error) {
      console.error('Error merging Excel files:', error);
      setError('Failed to merge Excel files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadMergedFile = () => {
    if (mergeResult?.filePath) {
      window.open(`/api/download/${encodeURIComponent(mergeResult.filePath)}`, '_blank');
    }
  };

  const handleSheetIndexChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSheetIndex(e.target.value);
  };

  const handleHeaderRowChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHeaderRow(e.target.value);
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Merge Excel Files
      </Typography>

      {files.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please upload files first to merge.
        </Alert>
      ) : (
        <React.Fragment>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Files to merge ({files.length}):
            </Typography>
            <List dense>
              {files.map((file, index) => (
                <ListItem key={index}>
                  <ListItemText primary={file} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Sheet Index"
                type="number"
                fullWidth
                value={sheetIndex}
                onChange={handleSheetIndexChange}
                helperText="Enter the sheet number to merge (1, 2, 3...)"
                InputProps={{ inputProps: { min: 1 } }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Header Row"
                type="number"
                fullWidth
                value={headerRow}
                onChange={handleHeaderRowChange}
                helperText="Enter the header row number (1, 2, 3...)"
                InputProps={{ inputProps: { min: 1 } }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleMerge}
                disabled={loading}
                fullWidth
                startIcon={<MergeIcon />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Merge'}
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {mergeResult && mergeResult.filePath && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="success" action={
                <Button 
                  color="inherit" 
                  size="small" 
                  startIcon={<DownloadIcon />}
                  onClick={downloadMergedFile}
                >
                  Download
                </Button>
              }>
                Files have been successfully merged into: {mergeResult.filePath}
              </Alert>

              {mergeResult.errors && mergeResult.errors.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    The following files had errors during merging:
                  </Typography>
                  <ul>
                    {mergeResult.errors.map((err, index) => (
                      <li key={index}>
                        {err.file}: {err.error}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Box>
          )}
        </React.Fragment>
      )}
    </Box>
  );
} 