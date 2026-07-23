/**
 * SheetManager.gs - จัดการ Google Sheet เป้าหมาย
 * 
 * ฟังก์ชันสำหรับ:
 * - หาหรือสร้างชีทตามปี
 * - สร้างและจัดการ header columns
 */

/**
 * หา Sheet ตามปี หรือสร้างใหม่ถ้ายังไม่มี
 * @param {Spreadsheet} spreadsheet - Spreadsheet object
 * @param {string} year - ปี (เช่น '2026')
 * @return {Sheet} Sheet object
 */
function getSheetByYear(spreadsheet, year) {
  try {
    const sheetName = String(year).trim();
    
    // ลองหาชีทที่มีชื่อตรงกัน
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // สร้างชีทใหม่
      sheet = spreadsheet.insertSheet(sheetName);
      log('Created new sheet: ' + sheetName, LOG_LEVEL.INFO);
    } else {
      log('Found existing sheet: ' + sheetName, LOG_LEVEL.INFO);
    }
    
    return sheet;
  } catch (e) {
    log('Error getting/creating sheet by year: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * สร้าง header map (จับคู่ key กับ column number)
 * @param {Sheet} sheet - Sheet object
 * @return {Object} Object ที่มี key: columnNumber
 */
function buildHeaderMap(sheet) {
  try {
    const map = {};
    
    // ถ้าชีทว่างเปล่า ให้สร้าง header ใหม่
    if (sheet.getLastColumn() === 0) {
      const headerRow = [];
      REQUIRED_HEADERS.forEach((header) => {
        headerRow.push(header.title);
      });
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }
    
    // อ่านแถว header ปัจจุบัน
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // สร้าง map ของ headers
    REQUIRED_HEADERS.forEach((header) => {
      const headerTitles = [header.title].concat((typeof HEADER_ALIASES !== 'undefined' && HEADER_ALIASES[header.key]) || []);
      const foundIndex = existingHeaders.findIndex((value) => {
        return headerTitles.indexOf(String(value).trim()) !== -1;
      });
      
      if (foundIndex !== -1) {
        map[header.key] = foundIndex + 1; // Column number (1-indexed)
        log('Header mapped: ' + header.key + ' -> Column ' + (foundIndex + 1), LOG_LEVEL.DEBUG);
      }
    });

    mapOptionalHeaders(existingHeaders, map);
    
    // ตรวจสอบคอลัมน์ที่ขาด
    ensureColumns(sheet, map);
    
    return map;
  } catch (e) {
    log('Error building header map: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * map optional legacy headers ถ้ามีอยู่แล้ว แต่ไม่สร้างคอลัมน์ใหม่
 * @param {Array} existingHeaders - header row
 * @param {Object} map - Header map object
 */
function mapOptionalHeaders(existingHeaders, map) {
  if (typeof OPTIONAL_HEADERS === 'undefined') {
    return;
  }

  OPTIONAL_HEADERS.forEach((header) => {
    const foundIndex = existingHeaders.findIndex((value) => {
      return String(value).trim() === header.title;
    });

    if (foundIndex !== -1) {
      map[header.key] = foundIndex + 1;
      log('Optional header mapped: ' + header.key + ' -> Column ' + (foundIndex + 1), LOG_LEVEL.DEBUG);
    }
  });
}

/**
 * หา/สร้างชีท FLOW_TRACKING สำหรับเก็บประวัติ flow ของงาน
 * @param {Spreadsheet} spreadsheet - Spreadsheet object
 * @return {Sheet} FLOW_TRACKING sheet
 */
function getFlowTrackingSheet(spreadsheet) {
  try {
    let sheet = spreadsheet.getSheetByName(FLOW_TRACKING_SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(FLOW_TRACKING_SHEET_NAME);
      log('Created new sheet: ' + FLOW_TRACKING_SHEET_NAME, LOG_LEVEL.INFO);
    }

    buildFlowTrackingHeaderMap(sheet);
    return sheet;
  } catch (e) {
    log('Error getting/creating flow tracking sheet: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * สร้าง header map ของชีท FLOW_TRACKING
 * @param {Sheet} sheet - FLOW_TRACKING sheet
 * @return {Object} Object ที่มี key: columnNumber
 */
function buildFlowTrackingHeaderMap(sheet) {
  try {
    return buildHeaderMapFromDefinitions(sheet, FLOW_TRACKING_HEADERS);
  } catch (e) {
    log('Error building flow tracking header map: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * หา/สร้างชีท EMAIL_LOG สำหรับเก็บประวัติการส่งอีเมล
 * @param {Spreadsheet} spreadsheet - Spreadsheet object
 * @return {Sheet} EMAIL_LOG sheet
 */
function getEmailLogSheet(spreadsheet) {
  try {
    let sheet = spreadsheet.getSheetByName(EMAIL_LOG_SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(EMAIL_LOG_SHEET_NAME);
      log('Created new sheet: ' + EMAIL_LOG_SHEET_NAME, LOG_LEVEL.INFO);
    }

    buildEmailLogHeaderMap(sheet);
    return sheet;
  } catch (e) {
    log('Error getting/creating email log sheet: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * สร้าง header map ของชีท EMAIL_LOG
 * @param {Sheet} sheet - EMAIL_LOG sheet
 * @return {Object} Object ที่มี key: columnNumber
 */
function buildEmailLogHeaderMap(sheet) {
  try {
    return buildHeaderMapFromDefinitions(sheet, EMAIL_LOG_HEADERS);
  } catch (e) {
    log('Error building email log header map: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * สร้าง header map จากชุด definition ที่กำหนด
 * @param {Sheet} sheet - Sheet object
 * @param {Array<Object>} headerDefinitions - รายการ header definitions
 * @return {Object} Header map
 */
function buildHeaderMapFromDefinitions(sheet, headerDefinitions) {
  const map = {};

  if (sheet.getLastColumn() === 0) {
    const headerRow = headerDefinitions.map((header) => header.title);
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  }

  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  headerDefinitions.forEach((header) => {
    const foundIndex = existingHeaders.findIndex((value) => {
      return String(value).trim() === header.title;
    });

    if (foundIndex !== -1) {
      map[header.key] = foundIndex + 1;
    }
  });

  ensureColumnsFromDefinitions(sheet, map, headerDefinitions);
  return map;
}

/**
 * เพิ่มคอลัมน์ที่ขาดตามชุด definition ที่กำหนด
 * @param {Sheet} sheet - Sheet object
 * @param {Object} map - Header map
 * @param {Array<Object>} headerDefinitions - รายการ header definitions
 */
function ensureColumnsFromDefinitions(sheet, map, headerDefinitions) {
  headerDefinitions.forEach((header) => {
    if (!map[header.key]) {
      const newColIndex = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColIndex).setValue(header.title);
      map[header.key] = newColIndex;
      log('Added new column: ' + header.title + ' (Column ' + newColIndex + ')', LOG_LEVEL.INFO);
    }
  });
}

/**
 * ตรวจสอบและเพิ่มคอลัมน์ที่ขาดหายไป
 * @param {Sheet} sheet - Sheet object
 * @param {Object} map - Header map object
 */
function ensureColumns(sheet, map) {
  try {
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const missingColumns = [];
    
    REQUIRED_HEADERS.forEach((header) => {
      // ถ้า key ไม่อยู่ใน map แสดงว่าขาด
      if (!map[header.key]) {
        missingColumns.push(header);
      }
    });
    
    if (missingColumns.length > 0) {
      // เพิ่มคอลัมน์ที่ขาดไป
      missingColumns.forEach((header) => {
        const newColIndex = sheet.getLastColumn() + 1;
        sheet.getRange(1, newColIndex).setValue(header.title);
        map[header.key] = newColIndex;
        log('Added new column: ' + header.title + ' (Column ' + newColIndex + ')', LOG_LEVEL.INFO);
      });
    }
  } catch (e) {
    log('Error ensuring columns: ' + e.message, LOG_LEVEL.WARNING);
  }
}

/**
 * หาตำแหน่งแถวของ jobNo ในชีท
 * @param {Sheet} sheet - Sheet object
 * @param {string} jobNo - Job No ที่ต้องหา
 * @param {Object} headerMap - Header map
 * @return {number|null} หมายเลขแถว (1-indexed) หรือ null ถ้าไม่เจอ
 */
function findRowByJobNo(sheet, jobNo, headerMap) {
  try {
    const jobNoColIndex = headerMap.jobNo - 1; // Convert to 0-indexed
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][jobNoColIndex]).trim() === String(jobNo).trim()) {
        return r + 1; // Return 1-indexed row number
      }
    }
    
    return null;
  } catch (e) {
    log('Error finding row by jobNo: ' + e.message, LOG_LEVEL.ERROR);
    return null;
  }
}

/**
 * อ่านค่าของเซลล์ที่ระบุ
 * @param {Sheet} sheet - Sheet object
 * @param {number} row - หมายเลขแถว (1-indexed)
 * @param {number} col - หมายเลขคอลัมน์ (1-indexed)
 * @return {*} ค่าที่อ่านได้
 */
function getCellValue(sheet, row, col) {
  try {
    return sheet.getRange(row, col).getValue();
  } catch (e) {
    log('Error getting cell value: ' + e.message, LOG_LEVEL.WARNING);
    return null;
  }
}

/**
 * ตั้งค่าของเซลล์ที่ระบุ
 * @param {Sheet} sheet - Sheet object
 * @param {number} row - หมายเลขแถว (1-indexed)
 * @param {number} col - หมายเลขคอลัมน์ (1-indexed)
 * @param {*} value - ค่าที่ต้องตั้ง
 */
function setCellValue(sheet, row, col, value) {
  try {
    sheet.getRange(row, col).setValue(value);
  } catch (e) {
    log('Error setting cell value: ' + e.message, LOG_LEVEL.WARNING);
  }
}

/**
 * ตั้งค่าของเซลล์หลายตัวใน row เดียว
 * @param {Sheet} sheet - Sheet object
 * @param {number} row - หมายเลขแถว (1-indexed)
 * @param {Object} values - Object ที่มี colNumber: value
 */
function setRowValues(sheet, row, values) {
  try {
    Object.keys(values).forEach((colIndex) => {
      const col = parseInt(colIndex, 10);
      const value = values[colIndex];
      setCellValue(sheet, row, col, value);
    });
  } catch (e) {
    log('Error setting row values: ' + e.message, LOG_LEVEL.ERROR);
  }
}
