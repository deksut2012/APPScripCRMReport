/**
 * DataReader.gs - อ่านข้อมูลจาก Spreadsheet และปรับรูปแบบ
 * 
 * ฟังก์ชันสำหรับ:
 * - อ่านข้อมูลจากไฟล์ Excel ที่แปลงแล้ว
 * - แปลงข้อมูลวันที่
 * - จัดรูปแบบข้อมูลแต่ละแถว
 */

/**
 * อ่านข้อมูลทั้งหมดจาก Spreadsheet
 * @param {Spreadsheet} spreadsheet - Spreadsheet object
 * @return {Array} Array ของข้อมูล object
 */
function readDataFromSpreadsheet(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheets()[0];
    const values = sheet.getDataRange().getValues();
    
    if (values.length === 0) {
      log('No data found in spreadsheet', LOG_LEVEL.WARNING);
      return [];
    }
    
    // แถวแรกเป็น header
    const header = values[0].map((value) => String(value || '').trim());
    
    // แปลงข้อมูลเป็น array ของ objects
    const data = values.slice(1).map((row) => {
      const obj = {};
      header.forEach((name, index) => {
        obj[name] = row[index];
      });
      return obj;
    });
    
    log('Read ' + data.length + ' rows from spreadsheet', LOG_LEVEL.INFO);
    return data;
  } catch (e) {
    log('Error reading data from spreadsheet: ' + e.message, LOG_LEVEL.ERROR);
    return [];
  }
}

/**
 * อ่านข้อมูลจากไฟล์ .xlsx โดยตรง กรณี Drive API convert ไม่สำเร็จ
 * รองรับไฟล์ Excel ที่เป็น OOXML และมีข้อมูลใน worksheet แรก
 * @param {File} file - ไฟล์ Excel จาก Drive
 * @return {Array} Array ของข้อมูล object
 */
function readDataFromExcelFile(file) {
  try {
    log('Reading Excel file directly without Drive conversion: ' + file.getName(), LOG_LEVEL.INFO);

    const entries = Utilities.unzip(file.getBlob());
    const entryMap = {};
    entries.forEach((entry) => {
      entryMap[entry.getName()] = entry.getDataAsString('UTF-8');
    });

    const sheetXml = entryMap['xl/worksheets/sheet1.xml'];
    if (!sheetXml) {
      log('Cannot find xl/worksheets/sheet1.xml in Excel file', LOG_LEVEL.ERROR);
      return [];
    }

    const sharedStrings = parseSharedStrings(entryMap['xl/sharedStrings.xml']);
    const document = XmlService.parse(sheetXml);
    const root = document.getRootElement();
    const ns = root.getNamespace();
    const sheetData = root.getChild('sheetData', ns);

    if (!sheetData) {
      log('Cannot find sheetData in Excel file', LOG_LEVEL.ERROR);
      return [];
    }

    const rows = sheetData.getChildren('row', ns);
    if (rows.length === 0) {
      return [];
    }

    const table = rows.map((row) => {
      const cells = row.getChildren('c', ns);
      const values = [];

      cells.forEach((cell) => {
        const colIndex = getExcelColumnIndex(cell.getAttribute('r').getValue()) - 1;
        values[colIndex] = getExcelCellValue(cell, ns, sharedStrings);
      });

      return values;
    });

    const header = (table[0] || []).map((value) => String(value || '').trim());
    const data = table.slice(1).map((row) => {
      const obj = {};
      header.forEach((name, index) => {
        obj[name] = row[index];
      });
      return obj;
    });

    log('Read ' + data.length + ' rows directly from Excel file', LOG_LEVEL.INFO);
    return data;
  } catch (e) {
    log('Error reading Excel file directly: ' + e.message, LOG_LEVEL.ERROR);
    return [];
  }
}

function parseSharedStrings(sharedStringsXml) {
  if (!sharedStringsXml) return [];

  const document = XmlService.parse(sharedStringsXml);
  const root = document.getRootElement();
  const ns = root.getNamespace();

  return root.getChildren('si', ns).map((si) => {
    const textParts = [];
    const directText = si.getChild('t', ns);
    if (directText) {
      textParts.push(directText.getText());
    }

    si.getChildren('r', ns).forEach((run) => {
      const runText = run.getChild('t', ns);
      if (runText) {
        textParts.push(runText.getText());
      }
    });

    return textParts.join('');
  });
}

function getExcelColumnIndex(cellRef) {
  const letters = String(cellRef || '').replace(/[^A-Z]/g, '');
  let index = 0;

  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }

  return index;
}

function getExcelCellValue(cell, ns, sharedStrings) {
  const typeAttr = cell.getAttribute('t');
  const type = typeAttr ? typeAttr.getValue() : '';

  if (type === 'inlineStr') {
    const inlineString = cell.getChild('is', ns);
    if (!inlineString) return '';

    const text = inlineString.getChild('t', ns);
    if (text) return text.getText();

    return inlineString.getChildren('r', ns).map((run) => {
      const runText = run.getChild('t', ns);
      return runText ? runText.getText() : '';
    }).join('');
  }

  const value = cell.getChild('v', ns);
  if (!value) return '';

  const rawValue = value.getText();
  if (type === 's') {
    return sharedStrings[parseInt(rawValue, 10)] || '';
  }

  return rawValue;
}

/**
 * แปลงค่าวันที่จากรูปแบบต่างๆ
 * @param {*} value - ค่าวันที่ (Date, String, Number)
 * @return {Date|null} Date object หรือ null
 */
function parseDate(value) {
  if (!value) return null;
  
  try {
    // ถ้าเป็น Date object แล้ว ให้คืนมาเลย
    if (value instanceof Date) {
      return value;
    }
    
    // แปลงเป็น string
    const text = String(value).trim();
    
    // ลองแปลงโดยตรง
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // ลองแปลงจากรูปแบบ dd/MM/yyyy หรือ dd-MM-yyyy หรือ dd.MM.yyyy
    const parts = text.split(/[\/\-\.\s:]+/).map((p) => parseInt(p, 10));
    
    if (parts.length >= 3) {
      // กำหนด year, month, day
      let year, month, day;
      
      // ถ้า parts[0] > 31 แสดงว่าเป็น year (เช่น 2026)
      if (parts[0] > 31) {
        year = parts[0];
        month = (parts[1] || 1) - 1;
        day = parts[2] || 1;
      } else {
        // เป็น dd/MM/yyyy
        day = parts[0];
        month = (parts[1] || 1) - 1;
        year = parts[2];
      }
      
      return new Date(year, month, day);
    }
    
    return null;
  } catch (e) {
    log('Error parsing date: ' + value + ' - ' + e.message, LOG_LEVEL.WARNING);
    return null;
  }
}

/**
 * แปลงวันที่เป็นรูปแบบไทย dd/MM/yyyy HH:mm:ss
 * @param {Date|String|*} dateValue - ค่าวันที่
 * @return {string} รูปแบบวันที่ไทย หรือ '' ถ้าไม่สามารถแปลงได้
 */
function formatThaiDate(dateValue) {
  if (!dateValue) return '';
  
  try {
    // แปลงเป็น Date ถ้ายังไม่ใช่
    const date = dateValue instanceof Date ? dateValue : parseDate(dateValue);
    
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    
    return Utilities.formatDate(date, EMAIL_TIMEZONE, DATE_TIME_FORMAT);
  } catch (e) {
    log('Error formatting Thai date: ' + dateValue + ' - ' + e.message, LOG_LEVEL.WARNING);
    return '';
  }
}

/**
 * จัดรูปแบบข้อมูลแต่ละแถวให้ตรงกับที่ต้องการ
 * @param {Object} rawRow - ข้อมูลแถวดิบจากไฟล์ Excel
 * @return {Object} ข้อมูลแถวที่จัดรูปแบบแล้ว
 */
function normalizeRow(rawRow) {
  try {
    rawRow = expandFdRow(rawRow);

    // หา jobNo (คีย์หลัก) - ลองหลายชื่อที่เป็นไปได้
    const jobNo = rawRow['jobNo'] || 
                  rawRow['Job No'] || 
                  rawRow['job_no'] || 
                  rawRow['jobno'] ||
                  rawRow['เลขที่งาน'] ||
                  '';
    
    // หา subject (เรื่องที่แจ้ง)
    const subject = rawRow['subject'] || 
                    rawRow['เรื่องที่แจ้ง'] ||
                    rawRow['Subject'] ||
                    '';
    
    // หา ownerSubjectId (ผู้แจ้ง)
    const ownerSubjectId = String(rawRow['ownerSubjectId'] || 
                                  rawRow['ผู้แจ้ง'] ||
                                  rawRow['owner_id'] ||
                                  '').trim();
    
    // หา contactDate (วันที่แจ้ง) และแปลงเป็นรูปแบบไทย
    const rawContactDate = rawRow['contactDate'] || 
                           rawRow['วันที่แจ้ง'] ||
                           rawRow['contact_date'] ||
                           rawRow['วันที่'];
    const contactDate = formatThaiDate(parseDate(rawContactDate));
    
    // หา assignto (ผู้รับแจ้ง)
    const assignto = String(rawRow['assignto'] || 
                            rawRow['ผูรับแจ้ง'] ||
                            rawRow['ผู้รับแจ้ง'] ||
                            rawRow['assigned_to'] ||
                            '').trim();
    
    // หา sysserViceTypeName (ประเภทบริการ)
    const sysserViceTypeName = rawRow['sysserViceTypeName'] || 
                               rawRow['ประเภทบริการ'] ||
                               rawRow['service_type'] ||
                               '';
    
    // หา status (สถานะ)
    const status = rawRow['status'] || 
                   rawRow['สถานะ'] ||
                   rawRow['Status'] ||
                   '';
    
    // หา productName (โปรแกรม)
    const productName = rawRow['productName'] || 
                        rawRow['โปรแกรม'] ||
                        rawRow['product'] ||
                        '';
    
    // หา sysDevelop (DEV)
    const sysDevelop = rawRow['sysDevelop'] || 
                       rawRow['DEV'] ||
                       rawRow['dev'] ||
                       '';
    
    // สร้าง object ข้อมูล
    const rowData = {
      jobNo: String(jobNo).trim(),
      subject: subject,
      ownerSubjectId: ownerSubjectId,
      contactDate: contactDate,
      assignto: assignto,
      sysserViceTypeName: sysserViceTypeName,
      status: status,
      productName: productName,
      sysDevelop: sysDevelop
    };
    
    // ตรวจสอบ QA - ถ้า ownerSubjectId หรือ assignto ตรงกับ QA_ASSIGNEES
    if (QA_ASSIGNEES.includes(ownerSubjectId) || QA_ASSIGNEES.includes(assignto)) {
      rowData.QA = 'QA';
    } else {
      rowData.QA = '';
    }
    
    return rowData;
  } catch (e) {
    log('Error normalizing row: ' + JSON.stringify(rawRow) + ' - ' + e.message, LOG_LEVEL.ERROR);
    return null;
  }
}

/**
 * ไฟล์ export บางชุดเก็บข้อมูลหลักทั้งก้อนไว้ในคอลัมน์ fd เป็น Python dict string
 * ฟังก์ชันนี้ดึงเฉพาะ field ที่ระบบต้องใช้ให้ออกมาเป็น object ปกติ
 * @param {Object} rawRow - ข้อมูลแถวดิบ
 * @return {Object} ข้อมูลที่ขยายจาก fd แล้ว
 */
function expandFdRow(rawRow) {
  if (!rawRow || !rawRow.fd || rawRow.jobNo || rawRow['Job No']) {
    return rawRow;
  }

  const fdText = String(rawRow.fd || '');
  const expanded = {};
  const keys = [
    'jobNo',
    'subject',
    'ownerSubjectId',
    'contactDate',
    'assignto',
    'sysserViceTypeName',
    'status',
    'productName',
    'sysDevelop'
  ];

  keys.forEach((key) => {
    expanded[key] = getPythonDictValue(fdText, key);
  });

  return Object.assign({}, rawRow, expanded);
}

function getPythonDictValue(text, key) {
  const pattern = new RegExp("'" + key + "'\\s*:\\s*(?:'((?:\\\\'|[^'])*)'|([^,}\\]]+))");
  const match = pattern.exec(text);

  if (!match) return '';

  if (match[1] !== undefined) {
    return match[1].replace(/\\'/g, "'");
  }

  const value = String(match[2] || '').trim();
  if (value === 'None' || value === 'null') return '';

  return value;
}

/**
 * หาปีจากข้อมูล
 * @param {Array} rawData - Array ของข้อมูลดิบ
 * @return {string} ปี (เช่น '2026')
 */
function extractYearFromData(rawData) {
  try {
    // ลองหาวันที่จากข้อมูล
    for (const row of rawData) {
      const rawDate = row['contactDate'] || 
                      row['วันที่แจ้ง'] || 
                      row['contact_date'] ||
                      row['วันที่'];
      
      if (rawDate) {
        const date = parseDate(rawDate);
        if (date) {
          const year = Utilities.formatDate(date, EMAIL_TIMEZONE, 'yyyy');
          log('Extracted year from data: ' + year, LOG_LEVEL.INFO);
          return year;
        }
      }
    }
    
    // ถ้าไม่เจอวันที่ ให้ใช้ปีปัจจุบัน
    const now = new Date();
    const year = Utilities.formatDate(now, EMAIL_TIMEZONE, 'yyyy');
    log('Using current year: ' + year, LOG_LEVEL.INFO);
    return year;
  } catch (e) {
    log('Error extracting year: ' + e.message, LOG_LEVEL.ERROR);
    const now = new Date();
    return Utilities.formatDate(now, EMAIL_TIMEZONE, 'yyyy');
  }
}
