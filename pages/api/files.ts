import { NextApiRequest, NextApiResponse } from 'next';
import { getUploadedFiles, deleteFile } from '@/utils/excelUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET request to list files
  if (req.method === 'GET') {
    try {
      const files = getUploadedFiles();
      return res.status(200).json({ success: true, files });
    } catch (error) {
      console.error('Error listing files:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list files',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } 
  
  // DELETE request to delete a file
  else if (req.method === 'DELETE') {
    try {
      const filename = req.query.filename as string;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required',
        });
      }
      
      const isDeleted = deleteFile(filename);
      
      if (isDeleted) {
        return res.status(200).json({
          success: true,
          message: `File ${filename} has been deleted`,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `File ${filename} not found`,
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } 
  
  // Any other method is not allowed
  else {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }
} 