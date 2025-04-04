import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper function to check allowed file extensions
export const allowedFileExtensions = ['.xls', '.xlsx'];

export const isValidExcelFile = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return allowedFileExtensions.includes(ext);
};

// Safe filename function to sanitize filenames
export const safeFilename = (filename: string): string => {
  // Replace dangerous characters with underscores
  let safeName = filename.replace(/[\\/*?:"<>|]/g, '_');
  // Remove leading/trailing spaces and dots
  safeName = safeName.trim().replace(/^\.+|\.+$/g, '');
  // Ensure filename is not empty
  if (!safeName) {
    safeName = 'unnamed_file';
  }
  return safeName;
};

// Get all Excel files in the upload directory
export const getUploadedFiles = (): string[] => {
  if (!fs.existsSync(UPLOAD_DIR)) return [];
  
  return fs.readdirSync(UPLOAD_DIR)
    .filter((file: string) => isValidExcelFile(file));
};

// Delete a file from the upload directory
export const deleteFile = (filename: string): boolean => {
  const filePath = path.join(UPLOAD_DIR, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  
  return false;
};

// Get file path from filename
export const getFilePath = (filename: string): string => {
  return path.join(UPLOAD_DIR, filename);
};

// Read Excel headers from sheet
export const readExcelHeaders = (
  filePath: string, 
  sheetIndex: number, 
  headerRow: number
): { headers: string[], error?: string } => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    if (sheetIndex >= sheetNames.length) {
      return { 
        headers: [],
        error: `工作表 ${sheetIndex + 1} 不存在` 
      };
    }
    
    const worksheet = workbook.Sheets[sheetNames[sheetIndex]];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    
    if (headerRow >= data.length) {
      return { 
        headers: [],
        error: `表头行 ${headerRow + 1} 超出文件范围` 
      };
    }
    
    // Convert all header values to strings
    const headers = (data[headerRow] as any[]).map(val => 
      val !== undefined && val !== null ? String(val) : ""
    );
    
    return { headers };
  } catch (error) {
    return {
      headers: [],
      error: `读取文件失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Comparison result type
interface HeaderComparisonResult {
  success: boolean;
  allHeaders?: string[];
  comparison?: Array<{
    file: string;
    headers: Record<string, boolean>;
  }>;
  errors?: Array<{
    file: string;
    error: string;
  }>;
  message?: string;
}

// Compare headers from multiple Excel files
export const compareHeaders = (
  files: string[], 
  sheetIndex: number, 
  headerRow: number
): HeaderComparisonResult => {
  const headerData: Array<{ file: string, headers: string[] }> = [];
  const allHeaders = new Set<string>();
  const errorFiles: Array<{ file: string, error: string }> = [];
  
  // Read all Excel files and collect headers
  for (const file of files) {
    const filePath = getFilePath(file);
    const result = readExcelHeaders(filePath, sheetIndex, headerRow);
    
    if (result.error) {
      errorFiles.push({
        file,
        error: result.error
      });
    } else {
      headerData.push({
        file,
        headers: result.headers
      });
      
      // Add to the set of all unique headers
      result.headers.forEach(header => allHeaders.add(header));
    }
  }
  
  // If there are no successful files, return error
  if (!headerData.length) {
    return {
      success: false,
      errors: errorFiles,
      message: '所有文件都无法读取指定的工作表'
    };
  }
  
  // Convert set to sorted list for consistent display
  const allHeadersList = Array.from(allHeaders).sort();
  
  // Create comparison matrix
  const comparisonMatrix = headerData.map(data => {
    const row: { file: string, headers: Record<string, boolean> } = {
      file: data.file,
      headers: {}
    };
    
    for (const header of allHeadersList) {
      row.headers[header] = data.headers.includes(header);
    }
    
    return row;
  });
  
  return {
    success: true,
    allHeaders: allHeadersList,
    comparison: comparisonMatrix,
    errors: errorFiles
  };
};

// Merge Excel files result type
interface MergeExcelResult {
  success: boolean;
  filePath?: string;
  message?: string;
  errors?: Array<{
    file: string;
    error: string;
  }>;
}

// Merge Excel files
export const mergeExcelFiles = async (
  files: string[],
  sheetIndex: number,
  headerRowIndex: number
): Promise<MergeExcelResult> => {
  if (!files.length) {
    return { success: false, message: '没有找到Excel文件' };
  }
  
  const errorFiles: Array<{ file: string, error: string }> = [];
  
  try {
    // 创建新的工作簿
    const newWorkbook = XLSX.utils.book_new();
    
    // 用于存储所有文件的表头
    let allHeaders: string[] = [];
    
    // 用于存储每个文件的数据和原始工作表
    interface FileData {
      file: string;
      headers: string[];
      worksheet: XLSX.WorkSheet; // 存储原始工作表
      range: XLSX.Range; // 存储原始工作表的范围
      headerRowIndex: number; // 存储表头行索引
    }
    
    const filesData: FileData[] = [];
    
    // 1. 第一步：读取所有文件的表头和数据
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const filePath = getFilePath(file);
      
      try {
        const workbook = XLSX.readFile(filePath, {cellFormula: true, cellNF: true});
        const sheetNames = workbook.SheetNames;
        
        if (sheetIndex >= sheetNames.length) {
          errorFiles.push({ 
            file, 
            error: `工作表 ${sheetIndex + 1} 不存在` 
          });
          continue;
        }
        
        const worksheet = workbook.Sheets[sheetNames[sheetIndex]];
        // 获取工作表范围
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        // 检查表头行是否存在
        if (headerRowIndex > range.e.r) {
          errorFiles.push({
            file,
            error: `表头行 ${headerRowIndex + 1} 不存在`
          });
          continue;
        }
        
        // 获取表头行
        const headers: string[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellAddress = XLSX.utils.encode_cell({r: headerRowIndex, c});
          const cell = worksheet[cellAddress];
          headers.push(cell ? String(cell.v) : "");
        }
        
        // 存储文件数据
        filesData.push({
          file,
          headers,
          worksheet,
          range,
          headerRowIndex
        });
        
        // 如果是第一个文件或当前文件的表头比已知表头长，则更新表头
        if (fileIndex === 0 || headers.length > allHeaders.length) {
          allHeaders = [...headers];
        }
      } catch (error) {
        errorFiles.push({
          file,
          error: `读取文件失败: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    if (filesData.length === 0) {
      return {
        success: false,
        message: '没有有效的文件可以合并',
        errors: errorFiles
      };
    }
    
    // 2. 第二步：创建合并的数据工作表
    const newWorksheet: XLSX.WorkSheet = {};
    
    // 添加表头行 - 仅添加一行表头
    allHeaders.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({r: 0, c: index});
      newWorksheet[cellAddress] = {t: 's', v: header};
    });
    
    // 添加"来源文件"表头
    const sourceHeaderCell = XLSX.utils.encode_cell({r: 0, c: allHeaders.length});
    newWorksheet[sourceHeaderCell] = {t: 's', v: '来源文件'};
    
    // 3. 第三步：按照文件顺序添加所有数据行
    let currentRow = 1; // 从1开始，跳过表头行
    
    for (const fileData of filesData) {
      const { file, worksheet, range, headerRowIndex } = fileData;
      
      // 只复制表头行以下的行
      for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
        // 跳过空行
        let isEmptyRow = true;
        
        // 复制行单元格
        for (let c = range.s.c; c <= range.e.c; c++) {
          const srcCellAddress = XLSX.utils.encode_cell({r, c});
          const destCellAddress = XLSX.utils.encode_cell({r: currentRow, c});
          
          // 获取源单元格
          const srcCell = worksheet[srcCellAddress];
          
          if (srcCell) {
            isEmptyRow = false;
            
            // 创建新单元格
            const newCell: XLSX.CellObject = { ...srcCell };
            
            // 如果是公式，处理相对引用
            if (newCell.f && typeof newCell.f === 'string') {
              // 计算行偏移
              const rowOffset = currentRow - r;
              
              // 调整公式中的相对引用
              newCell.f = adjustFormulaReferences(newCell.f, rowOffset, 0);
            }
            
            // 复制到新工作表
            newWorksheet[destCellAddress] = newCell;
          }
        }
        
        // 如果不是空行，添加来源文件信息并增加当前行
        if (!isEmptyRow) {
          const sourceCell = XLSX.utils.encode_cell({r: currentRow, c: allHeaders.length});
          newWorksheet[sourceCell] = {t: 's', v: file};
          currentRow++;
        }
      }
    }
    
    // 4. 设置工作表范围
    const newRange = {
      s: {r: 0, c: 0},
      e: {r: currentRow - 1, c: allHeaders.length}
    };
    newWorksheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    // 复制列宽信息，如果存在
    if (filesData.length > 0 && filesData[0].worksheet['!cols']) {
      newWorksheet['!cols'] = [...filesData[0].worksheet['!cols']];
      // 确保列宽数组长度足够
      while (newWorksheet['!cols'].length <= allHeaders.length) {
        newWorksheet['!cols'].push({wch: 10}); // 默认列宽
      }
    }
    
    // 如果没有数据行，返回错误
    if (currentRow <= 1) {
      return {
        success: false,
        message: '合并后没有数据行',
        errors: errorFiles
      };
    }
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "合并数据");
    
    // 5. 生成输出文件
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").substring(0, 14);
    const outputFilename = `merged_${timestamp}_${uuidv4().substring(0, 8)}.xlsx`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);
    
    // 写入工作簿到文件，保留公式
    XLSX.writeFile(newWorkbook, outputPath, {bookType: 'xlsx', type: 'file'});
    
    return {
      success: true,
      filePath: outputFilename,
      errors: errorFiles.length > 0 ? errorFiles : undefined
    };
  } catch (error) {
    return {
      success: false,
      message: `合并Excel文件时出错: ${error instanceof Error ? error.message : String(error)}`,
      errors: errorFiles
    };
  }
};

// 辅助函数：调整公式中的相对引用
function adjustFormulaReferences(formula: string, rowOffset: number, colOffset: number): string {
  // 匹配Excel单元格引用的正则表达式 (例如 A1, $A$1, A$1, $A1)
  const cellRefRegex = /(\$?)([A-Z]+)(\$?)([0-9]+)/g;
  
  return formula.replace(cellRefRegex, (match, colLock, colRef, rowLock, rowRef) => {
    // 如果有行锁定符号 ($)，不调整行
    if (rowLock) return match;
    
    // 调整行号 (只有相对引用才调整)
    const newRow = parseInt(rowRef) + rowOffset;
    
    // 如果有列锁定符号 ($)，不调整列
    if (colLock) return `${colLock}${colRef}${rowLock}${newRow}`;
    
    // 这里是完整的引用调整，包括列
    // 注意：这个实现简化了列偏移的处理，实际上可能需要更复杂的列字母转换
    // 如果colOffset为0，可以保持原列引用
    return `${colLock}${colRef}${rowLock}${newRow}`;
  });
} 