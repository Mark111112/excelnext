import { NextApiRequest, NextApiResponse } from 'next';
import { mergeExcelFiles, getUploadedFiles } from '@/utils/excelUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { sheetIndex = '1', headerRow = '1' } = req.body;
    
    let sheetIndexNum: number;
    let headerRowNum: number;
    
    try {
      sheetIndexNum = parseInt(sheetIndex, 10) - 1;  // Convert to 0-based index
      headerRowNum = parseInt(headerRow, 10) - 1;    // Convert to 0-based index
      
      if (sheetIndexNum < 0 || headerRowNum < 0) {
        throw new Error('Sheet index and header row must be positive');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: '工作表索引和表头行必须是正整数'
      });
    }
    
    const files = getUploadedFiles();
    
    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: '没有找到Excel文件'
      });
    }
    
    const result = await mergeExcelFiles(files, sheetIndexNum, headerRowNum);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error merging Excel files:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to merge Excel files',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 