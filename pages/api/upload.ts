import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import path from 'path';
import fs from 'fs';
import { isValidExcelFile, safeFilename } from '@/utils/excelUtils';

// Configure upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Augment the formidable File interface
interface UploadedFile {
  originalFilename: string | null;
  filepath: string;
  size: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = new IncomingForm({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 16 * 1024 * 1024, // 16MB (same as original)
      multiples: true,
    });

    // Process the form
    const { files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Validate and process uploaded files
    const filesArray = files.files;
    const uploadedFiles = Array.isArray(filesArray) ? filesArray : [filesArray];
    const results: Array<{ name: string; size: number; savedAs: string }> = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const file of uploadedFiles as UploadedFile[]) {
      if (!file) continue;
      
      const originalFilename = file.originalFilename || 'unnamed_file';
      
      if (!isValidExcelFile(originalFilename)) {
        errors.push({
          name: originalFilename,
          error: 'Invalid file type. Only .xls and .xlsx files are allowed.',
        });
        
        // Delete the invalid file
        fs.unlinkSync(file.filepath);
        continue;
      }
      
      // Create a safe filename
      const safeFilenameResult = safeFilename(originalFilename);
      const destinationPath = path.join(UPLOAD_DIR, safeFilenameResult);
      
      // Move the file to its final destination with the safe name
      fs.renameSync(file.filepath, destinationPath);
      
      results.push({
        name: originalFilename,
        size: file.size,
        savedAs: safeFilenameResult,
      });
    }

    return res.status(200).json({
      success: true,
      files: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 