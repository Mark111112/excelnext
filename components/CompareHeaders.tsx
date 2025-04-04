import React, { useState, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import axios from 'axios';

interface CompareHeadersProps {
  files: string[];
}

interface ComparisonError {
  file: string;
  error: string;
}

interface ComparisonResponse {
  success: boolean;
  allHeaders?: string[];
  comparison?: Array<{
    file: string;
    headers: Record<string, boolean>;
  }>;
  errors?: ComparisonError[];
  message?: string;
}

interface ComparisonResult {
  allHeaders: string[];
  comparison: Array<{
    file: string;
    headers: Record<string, boolean>;
  }>;
  errors?: ComparisonError[];
}

export default function CompareHeaders({ files }: CompareHeadersProps) {
  const [sheetIndex, setSheetIndex] = useState('1');
  const [headerRow, setHeaderRow] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const handleCompare = async () => {
    if (files.length === 0) {
      setError('No files available for comparison');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<ComparisonResponse>('/api/compare-headers', {
        sheetIndex,
        headerRow
      });

      if (response.data.success && response.data.allHeaders && response.data.comparison) {
        setComparisonResult({
          allHeaders: response.data.allHeaders,
          comparison: response.data.comparison,
          errors: response.data.errors
        });
      } else {
        setError(response.data.message || 'Failed to compare headers');
      }
    } catch (error) {
      console.error('Error comparing headers:', error);
      setError('Failed to compare headers. Please try again.');
    } finally {
      setLoading(false);
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
        Compare Excel Headers
      </Typography>

      {files.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please upload files first to compare headers.
        </Alert>
      ) : (
        <React.Fragment>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Sheet Index"
                type="number"
                fullWidth
                value={sheetIndex}
                onChange={handleSheetIndexChange}
                helperText="Enter the sheet number (1, 2, 3...)"
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
                onClick={handleCompare}
                disabled={loading}
                fullWidth
                startIcon={<CompareArrowsIcon />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Compare'}
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {comparisonResult && comparisonResult.comparison.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Comparison Results
              </Typography>

              {comparisonResult.errors && comparisonResult.errors.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">The following files had errors:</Typography>
                  <ul>
                    {comparisonResult.errors.map((err, index) => (
                      <li key={index}>
                        {err.file}: {err.error}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>File</TableCell>
                      {comparisonResult.allHeaders.map((header) => (
                        <TableCell key={header}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonResult.comparison.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell component="th" scope="row">
                          {row.file}
                        </TableCell>
                        {comparisonResult.allHeaders.map((header) => (
                          <TableCell key={header}>
                            <Typography
                              color={row.headers[header] ? 'success.main' : 'error.main'}
                              fontWeight={row.headers[header] ? 'bold' : 'normal'}
                            >
                              {row.headers[header] ? '✓' : '✗'}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </React.Fragment>
      )}
    </Box>
  );
} 