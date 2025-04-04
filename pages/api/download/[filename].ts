import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getFilePath } from '@/utils/excelUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { filename } = req.query;
    
    if (!filename || Array.isArray(filename)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename parameter',
      });
    }
    
    const filePath = getFilePath(filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }
    
    // Set appropriate headers for file download
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath);
    
    // Set appropriate content type for Excel files
    let contentType = 'application/octet-stream';
    if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (ext === '.xls') {
      contentType = 'application/vnd.ms-excel';
    }
    
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Handle stream errors
    fileStream.on('error', (err: Error) => {
      console.error('Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file',
        });
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 