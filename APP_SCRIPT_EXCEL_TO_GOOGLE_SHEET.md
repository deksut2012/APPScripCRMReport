# รายละเอียดการพัฒนา Google Apps Script

เอกสารนี้เป็นรายละเอียดการพัฒนาโปรเจค Google Apps Script สำหรับอ่านไฟล์ Excel จาก Google Drive แล้วนำข้อมูลไปเขียนลง Google Sheet ตามเงื่อนไขที่กำหนด

## วัตถุประสงค์
- อ่านไฟล์ Excel จาก folder ที่มี Drive Folder ID = `1aXRC4l8aepBut_mBfYtJvwikiAXbAfhQ`
- ถ้ามีไฟล์มากกว่า 1 ไฟล์ ให้เลือกไฟล์ล่าสุดไฟล์เดียว และย้ายไฟล์ที่เหลือไปถังขยะ
- เมื่อประมวลผลไฟล์ล่าสุดเสร็จสมบูรณ์ ให้ย้ายไฟล์ Excel ต้นทางนั้นไปถังขยะด้วย
- นำข้อมูลจากไฟล์ Excel มาเขียนลง Google Sheet ที่มี ID = `11Fi4uDaCmVF3IBY_wCQRNrmWOwVlwHOlbiZhfs35sdo`
- ใช้ชื่อชีทตามปีของข้อมูล เช่น ปี 2026 จะลงในชีทชื่อ `2026`
- หากชีทยังไม่มี ให้สร้างชีทใหม่อัตโนมัติ

## คอลัมน์เป้าหมาย
สร้างหัวคอลัมน์ในชีทเป้าหมายตามนี้:
- `jobNo` : `Job No` (คีย์หลัก)
- `subject` : `เรื่องที่แจ้ง`
- `ownerSubjectId` : `ผู้แจ้ง`
- `contactDate` : `วันที่แจ้ง`
- `assignto` : `ผู้รับแจ้ง`
- `originalAssignto` : `ผู้รับเรื่องหลัก` เก็บผู้รับเรื่องจาก `assignto` ตอนที่สถานะเป็น `Continue` ครั้งแรก และไม่เขียนทับเมื่อ `assignto` เปลี่ยน
- `sysserViceTypeName` : `ประเภทบริการ`
- `status` : `สถานะ`
- `productName` : `โปรแกรม`
- `sysDevelop` : `DEV`

และเพิ่มคอลัมน์เสริมได้ตามต้องการ เช่น `QA`, `mailSent`, `lastEmailKey`, `lastStatus`, `updatedAt` เป็นต้น

## เงื่อนไขการลงข้อมูล
- นำเข้าเฉพาะรายการที่ `sysserViceTypeName` อยู่ในรายการประเภทบริการที่อนุญาต
- ลงข้อมูลล่าสุดไปเรื่อย ๆ โดยตรวจสอบจาก `jobNo`
- ถ้า `jobNo` ซ้ำ ให้ตรวจสอบ `assignto` และ `status` ว่ามีการเปลี่ยนแปลงหรือไม่
- ถ้ามีการเปลี่ยนแปลง ให้อัปเดตค่าล่าสุดในแถวเดียวกัน
- บันทึก `originalAssignto` เฉพาะตอน `status = Continue` ครั้งแรก โดยใช้ค่า `assignto` ณ ตอนนั้น; ถ้าเป็น `jobNo` เดิมจะไม่เขียนทับ `originalAssignto`
- เพื่อรองรับข้อมูลจำนวนมาก ระบบจะอ่านข้อมูลเดิมจากชีทครั้งเดียว สร้าง index ของ `jobNo` และเขียนข้อมูลกลับแบบ batch
- เรียงข้อมูลตาม `contactDate` จากน้อยไปมาก โดยเรียงข้อมูลใหม่ใน memory ก่อน append และ sort ทั้งชีทเฉพาะเมื่อข้อมูลใหม่ทำให้ลำดับวันที่เสีย
- ถ้า `ownerSubjectId` หรือ `assignto` เป็น `6101`, `6610`, `6619` ให้เขียนค่าในคอลัมน์ `QA`
- ถ้าไม่พบคอลัมน์ `QA` ให้เพิ่มคอลัมน์ใหม่เอง
- แปลงค่าของ `contactDate` เป็นรูปแบบ `dd/MM/yyyy HH:mm:ss` โดยใช้เวลาประเทศไทย

### กลุ่มพนักงาน
- `QA`: `6101`, `6619`, `6610`
- `DEV`: `4208`, `5636`, `5640`, `5834`, `6620`, `6529`, `6305`, `6318`, `6137`
- `ACCOUNT`: `5433`
- `SUPPORT`: `5264`, `5627`, `5703`, `5725`, `5807`, `6001`, `6132`, `6136`, `6303`, `6409`, `6511`, `6512`, `6612`, `6702`, `6710`, `6738`, `6901`, `6907`, `6910`

### ประเภทบริการที่อนุญาตให้นำเข้า
- `สอบถามปัญหาทั่วไป`
- `สอบถามเรื่องฟอร์ม&รายงาน`
- `Bug`
- `Question`
- `Feature`
- `สอบถามปัญหาทั่วไป(HD)`
- `ต้องการสั่งทำ Feature เพิ่มเติม`
- `ตรวจสอบฐานข้อมูล`
- `ติดต่อสอบถาม Form/Report`
- `เรื่องทั่วไป/ประสานงาน`
- `DB-เปลี่ยน Config ในโปรแกรม`
- `DB-เคลียร์คลาวน์(กรณีเริ่มฐานข้อมูลใหม่)`
- `DB-เปลี่ยนประเภทฐานข้อมูล H B เป็น N`
- `DB-Recovery Data`
- `DB-QA ขอตรวจสอบ`
- `ติดต่อสั่งทำแบบ Form Premium`
- `ติดต่อสั่งทำแบบ Report`
- `ติดต่อสั่งทำแบบ Form`

## ระบบการส่งอีเมลแจ้งเตือน
- ถ้า `status = Open` หรือ `status = Close` ไม่ต้องส่งเมลล์
- ถ้าเป็นสถานะอื่น และเป็นรายการใหม่หรือมีการเปลี่ยน `status`/`assignto` ให้ส่งเมลล์
- ต้องมีระบบเก็บสถานะการส่งเมลล์เพื่อป้องกันการส่งซ้ำ
- ใช้ชีท `EMAIL_LOG` เป็นแหล่งหลักในการบันทึกประวัติการส่งเมลและกันส่งซ้ำ โดยใช้ `emailKey` จากค่า `jobNo + status + assignto`
- คอลัมน์ `mailSent` และ `lastEmailKey` ในชีทปีคงไว้เป็น fallback ช่วงเปลี่ยนผ่าน
- ถ้า `status` เปลี่ยน แสดงว่าให้แจ้งเมลล์ทันที
- ใช้ข้อมูล `assignto` ไปค้นหาในชีท `EMAIL` แล้วใช้ค่าจากคอลัมน์ `email` ในการส่ง
- ในเนื้อหาอีเมลจะแสดง `ผู้แจ้ง`, `ผู้รับแจ้ง`, และ `DEV` เป็นรูปแบบ `รหัส ชื่อ` โดยใช้คอลัมน์ `name` จากชีท `EMAIL`
- หัวรายงานสรุปแสดง `ผู้รับ` เป็นรูปแบบ `รหัส ชื่อ` และตารางรายการงานมีคอลัมน์ `ลำดับ`
- รายงานสรุปแยกรายการงานเป็นตารางตามสถานะ `Open`, `Continue`, `EditErr`, `Test` และแสดงครบทุกเคสโดยไม่จำกัด 30 รายการ
- รูปแบบอีเมลแจ้งเตือนราย Job แสดงเฉพาะสถานะล่าสุด หัวข้อ และรายละเอียดงานนั้น เพื่อให้อ่านง่ายและไม่หนักเกินไป
- เมลแจ้งเตือนราย Job มีส่วน `ติดตาม Flow งาน` เพื่อแสดงสถานะล่าสุดและประวัติว่าเคสอยู่กับใคร/DEV ใดแล้ว
- ประวัติ Flow งานเก็บในชีทแยก `FLOW_TRACKING` เป็นหลัก โดยบันทึก event ตาม `jobNo`, `status`, `assignto`, `DEV` และใช้ `eventKey` กันข้อมูลซ้ำ
- คอลัมน์ `flowTracking` ในชีทปีเป็นข้อมูลเก่า/สำรองสำหรับ fallback เท่านั้น ระบบจะไม่เขียนประวัติใหม่ลงคอลัมน์นี้แล้ว
- รายงานสรุปจำนวนเคสตามสถานะแยกส่งด้วยฟังก์ชัน `sendDailySummaryEmails()` โดยนับงานที่เกี่ยวข้องกับผู้รับเมลจาก `originalAssignto` และ `ownerSubjectId`; ถ้าผู้รับอยู่ในกลุ่ม `DEV_ASSIGNEES` จะนับงานที่ `sysDevelop` เป็นรหัสคนนั้นเพิ่มด้วย; ถ้าเป็น `jobNo` เดียวกันให้นับเพียง 1 ครั้ง
- สามารถส่งรายงานสรุปเฉพาะกลุ่มด้วยฟังก์ชัน `sendDailySummaryEmailsToQA()`, `sendDailySummaryEmailsToDEV()`, `sendDailySummaryEmailsToAccount()`, `sendDailySummaryEmailsToSupport()`
- รายงานสรุปแสดงเฉพาะสถานะ `Open`, `Continue`, `EditErr`, `Test` และรายการงานที่ต้องติดตาม
- รายงานสรุปหาเคสจาก `originalAssignto` หรือ `ownerSubjectId` เป็นหลัก และเพิ่ม `sysDevelop` เฉพาะผู้รับที่เป็น DEV
- รายงานสรุปแสดงวันที่เป็น `dd/MM/yyyy HH:mm:ss` เวลาไทย แสดงจำนวนวันที่ส่งเคสมา และเรียงจากจำนวนวันมากไปน้อย
- รองรับการเปิดผ่านมือถือด้วย email HTML layout ที่เรียบง่าย

## การตั้งค่าเบื้องต้น
1. สร้าง Google Apps Script project
2. เปิด Advanced Google services:
   - Drive API
3. เปิด Google Cloud Project API:
   - Drive API
4. ให้สิทธิ์ script ในการอ่านไฟล์จาก Drive และแก้ไข Spreadsheet

## โครงสร้างหลักของ Script

### ฟังก์ชันหลัก
- `main()` : เรียกใช้งานทั้งหมด
- `getLatestExcelFileInFolder(folderId)` : หาฟล์ Excel ล่าสุดในโฟลเดอร์
- `moveOtherFilesToTrash(files, keepFile)` : ย้ายไฟล์อื่นไปถังขยะ
- `convertExcelToSpreadsheet(file)` : แปลง Excel เป็น Spreadsheet ชั่วคราว
- `getSheetByYear(spreadsheet, year)` : หา หรือสร้างชีทตามปี
- `buildHeaderMap()` : สร้างตัวแมปหัวคอลัมน์
- `getEmailForAssignto(assignto)` : หาอีเมลจากชีท EMAIL
- `formatThaiDate(dateValue)` : แปลงวันที่เป็น `dd/MM/yyyy HH:mm:ss`
- `processRows(dataRows)` : อ่านข้อมูลจากแถว Excel แล้ว map คอลัมน์
- `processRow(sheet, rowData, headerMap)` : เพิ่มหรืออัปเดตรายการตาม `jobNo`
- `getFlowTrackingSheet(spreadsheet)` : หา/สร้างชีท `FLOW_TRACKING`
- `buildFlowTrackingHeaderMap(sheet)` : สร้างแมปหัวคอลัมน์ของชีท `FLOW_TRACKING`
- `sendNotificationEmail(sheet, rowIndex, rowData, headerMap)` : ส่งอีเมลแจ้งเตือนถ้าจำเป็น
- `sendDailySummaryEmails()` : ส่งรายงานสรุปแยกตามผู้รับจากชีท `EMAIL`
- `sendDailySummaryEmailsToQA()` : ส่งรายงานสรุปเฉพาะผู้รับกลุ่ม QA
- `sendDailySummaryEmailsToDEV()` : ส่งรายงานสรุปเฉพาะผู้รับกลุ่ม DEV
- `sendDailySummaryEmailsToAccount()` : ส่งรายงานสรุปเฉพาะผู้รับกลุ่ม Account
- `sendDailySummaryEmailsToSupport()` : ส่งรายงานสรุปเฉพาะผู้รับกลุ่ม Support
- `getEmailLogSheet(spreadsheet)` : หา/สร้างชีท `EMAIL_LOG`
- `appendEmailLogEntry(params)` : บันทึกประวัติการส่งอีเมล

## ตัวอย่างโค้ด Google Apps Script
```javascript
const DRIVE_FOLDER_ID = '1aXRC4l8aepBut_mBfYtJvwikiAXbAfhQ';
const TARGET_SHEET_ID = '11Fi4uDaCmVF3IBY_wCQRNrmWOwVlwHOlbiZhfs35sdo';
const QA_ASSIGNEES = ['6101', '6610', '6619'];
const EMAIL_SHEET_NAME = 'EMAIL';
const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';

function main() {
  const folderId = DRIVE_FOLDER_ID;
  const targetSpreadsheet = SpreadsheetApp.openById(TARGET_SHEET_ID);
  const latestFile = getLatestExcelFileInFolder(folderId);
  if (!latestFile) {
    Logger.log('ไม่พบไฟล์ Excel ในโฟลเดอร์');
    return;
  }

  const allFiles = getExcelFilesInFolder(folderId);
  moveOtherFilesToTrash(allFiles, latestFile);

  const tempSpreadsheet = convertExcelToSpreadsheet(latestFile);
  if (!tempSpreadsheet) {
    Logger.log('ไม่สามารถแปลงไฟล์ Excel เป็น Spreadsheet ได้');
    return;
  }

  const rawData = readDataFromSpreadsheet(tempSpreadsheet);
  if (!rawData || rawData.length === 0) {
    Logger.log('ไฟล์ Excel ไม่มีข้อมูล');
    return;
  }

  const year = extractYearFromData(rawData);
  const targetSheet = getSheetByYear(targetSpreadsheet, year);
  const headerMap = buildHeaderMap(targetSheet);
  ensureColumns(targetSheet, headerMap);

  rawData.forEach((row) => {
    const rowData = normalizeRow(row);
    processRow(targetSheet, rowData, headerMap);
  });

  Logger.log('เสร็จสิ้นการอัปเดตข้อมูล');
}

function getExcelFilesInFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  const iterator = folder.getFiles();
  while (iterator.hasNext()) {
    const file = iterator.next();
    const mimeType = file.getMimeType();
    if (mimeType === MimeType.MICROSOFT_EXCEL || mimeType === MimeType.MICROSOFT_EXCEL_LEGACY) {
      files.push(file);
    }
  }
  return files;
}

function getLatestExcelFileInFolder(folderId) {
  const files = getExcelFilesInFolder(folderId);
  if (files.length === 0) return null;
  files.sort((a, b) => b.getLastUpdated() - a.getLastUpdated());
  return files[0];
}

function moveOtherFilesToTrash(files, keepFile) {
  files.forEach((file) => {
    if (file.getId() !== keepFile.getId()) {
      file.setTrashed(true);
    }
  });
}

function convertExcelToSpreadsheet(file) {
  const blob = file.getBlob();
  const resource = {
    title: file.getName(),
    mimeType: MimeType.GOOGLE_SHEETS,
  };
  const convertedFile = Drive.Files.insert(resource, blob, {convert: true});
  return SpreadsheetApp.openById(convertedFile.id);
}

function readDataFromSpreadsheet(spreadsheet) {
  const sheet = spreadsheet.getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const header = values[0].map((value) => String(value || '').trim());
  return values.slice(1).map((row) => {
    const obj = {};
    header.forEach((name, index) => {
      obj[name] = row[index];
    });
    return obj;
  });
}

function extractYearFromData(rawData) {
  for (const row of rawData) {
    const rawDate = row['contactDate'] || row['วันที่แจ้ง'] || row['contact_date'];
    if (rawDate) {
      const date = parseDate(rawDate);
      if (date) {
        return Utilities.formatDate(date, 'GMT+7', 'yyyy');
      }
    }
  }
  const now = new Date();
  return Utilities.formatDate(now, 'GMT+7', 'yyyy');
}

function parseDate(value) {
  if (value instanceof Date) return value;
  const text = String(value).trim();
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return parsed;
  const parts = text.split(/[\/\-\.\s:]+/).map((p) => parseInt(p, 10));
  if (parts.length >= 3) {
    const year = parts[0] > 31 ? parts[0] : parts[2];
    const month = (parts[1] || parts[0]) - 1;
    const day = parts[2] || parts[1] || parts[0];
    return new Date(year, month, day);
  }
  return null;
}

function getSheetByYear(spreadsheet, year) {
  let sheet = spreadsheet.getSheetByName(year);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(year);
  }
  return sheet;
}

function buildHeaderMap(sheet) {
  const requiredHeaders = [
    { key: 'jobNo', title: 'Job No' },
    { key: 'subject', title: 'เรื่องที่แจ้ง' },
    { key: 'ownerSubjectId', title: 'ผู้แจ้ง' },
    { key: 'contactDate', title: 'วันที่แจ้ง' },
    { key: 'assignto', title: 'ผู้รับแจ้ง' },
    { key: 'sysserViceTypeName', title: 'ประเภทบริการ' },
    { key: 'status', title: 'สถานะ' },
    { key: 'productName', title: 'โปรแกรม' },
    { key: 'sysDevelop', title: 'DEV' },
    { key: 'QA', title: 'QA' },
    { key: 'mailSent', title: 'mailSent' },
    { key: 'lastStatus', title: 'lastStatus' },
    { key: 'updatedAt', title: 'updatedAt' },
  ];  

  const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  const headerRow = [];

  requiredHeaders.forEach((header) => {
    const index = existingHeaders.findIndex((value) => String(value).trim() === header.title);
    if (index !== -1) {
      map[header.key] = index + 1;
      headerRow.push(existingHeaders[index]);
    } else {
      headerRow.push(header.title);
      map[header.key] = headerRow.length;
    }
  });

  if (sheet.getLastColumn() < headerRow.length) {
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
  } else {
    const current = sheet.getRange(1, 1, 1, headerRow.length).getValues()[0];
    sheet.getRange(1, 1, 1, headerRow.length).setValues([current.map((cell, idx) => cell || headerRow[idx])]);
  }

  return map;
}

function ensureColumns(sheet, map) {
  const headers = sheet.getRange(1, 1, 1, Object.keys(map).length).getValues()[0];
  const changes = [];
  Object.keys(map).forEach((key) => {
    const colIndex = map[key];
    if (!headers[colIndex - 1]) {
      changes.push({ index: colIndex, value: key === 'jobNo' ? 'Job No' : key });
    }
  });
  if (changes.length) {
    changes.forEach((item) => {
      sheet.getRange(1, item.index).setValue(item.value);
    });
  }
}

function normalizeRow(rawRow) {
  const rowData = {
    jobNo: rawRow['jobNo'] || rawRow['Job No'] || rawRow['job_no'] || rawRow['jobno'],
    subject: rawRow['subject'] || rawRow['เรื่องที่แจ้ง'] || '',
    ownerSubjectId: rawRow['ownerSubjectId'] || rawRow['ผู้แจ้ง'] || '',
    contactDate: formatThaiDate(parseDate(rawRow['contactDate'] || rawRow['วันที่แจ้ง'] || rawRow['contact_date'] || rawRow['วันที่'])),
    assignto: String(rawRow['assignto'] || rawRow['ผูรับแจ้ง'] || rawRow['ผู้รับแจ้ง'] || ''),
    sysserViceTypeName: rawRow['sysserViceTypeName'] || rawRow['ประเภทบริการ'] || '',
    status: rawRow['status'] || rawRow['สถานะ'] || '',
    productName: rawRow['productName'] || rawRow['โปรแกรม'] || '',
    sysDevelop: rawRow['sysDevelop'] || rawRow['DEV'] || '',
  };
  if (QA_ASSIGNEES.includes(rowData.ownerSubjectId) || QA_ASSIGNEES.includes(rowData.assignto)) {
    rowData.QA = 'QA';
  }
  return rowData;
}

function formatThaiDate(dateValue) {
  if (!dateValue) return '';
  const date = dateValue instanceof Date ? dateValue : parseDate(dateValue);
  if (!date) return '';
  return Utilities.formatDate(date, 'GMT+7', DATE_TIME_FORMAT);
}

function processRow(sheet, rowData, headerMap) {
  if (!rowData.jobNo) return;

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headerRow = values[0].map((name) => String(name || '').trim());
  const jobNoCol = headerMap.jobNo;

  let foundRow = null;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][jobNoCol - 1]).trim() === String(rowData.jobNo).trim()) {
      foundRow = r + 1;
      break;
    }
  }

  const updateData = buildUpdateData(rowData, headerMap);
  if (foundRow) {
    const existingStatus = sheet.getRange(foundRow, headerMap.lastStatus).getValue();
    const existingAssignto = sheet.getRange(foundRow, headerMap.assignto).getValue();
    const shouldNotify = shouldProcessForEmail(rowData.status, existingStatus) ||
      (rowData.assignto !== existingAssignto && shouldProcessForEmail(rowData.status, ''));
    setRowValues(sheet, foundRow, updateData);
    if (shouldNotify) {
      sendNotificationEmail(sheet, foundRow, rowData, headerMap);
    }
  } else {
    const newRow = sheet.getLastRow() + 1;
    setRowValues(sheet, newRow, updateData);
    if (shouldProcessForEmail(rowData.status, '')) {
      sendNotificationEmail(sheet, newRow, rowData, headerMap);
    }
  }
}

function buildUpdateData(rowData, headerMap) {
  const update = {};
  Object.keys(headerMap).forEach((key) => {
    if (rowData[key] !== undefined) {
      update[headerMap[key]] = rowData[key];
    }
  });
  update[headerMap.lastStatus] = rowData.status;
  update[headerMap.updatedAt] = Utilities.formatDate(new Date(), 'GMT+7', DATE_TIME_FORMAT);
  return update;
}

function setRowValues(sheet, rowNumber, updateData) {
  Object.keys(updateData).forEach((colIndex) => {
    sheet.getRange(rowNumber, parseInt(colIndex, 10)).setValue(updateData[colIndex]);
  });
}

function shouldProcessForEmail(status, existingStatus) {
  if (!status || status.toString().trim().toLowerCase() === 'open') {
    return false;
  }
  if (status.toString().trim().toLowerCase() === 'close') {
    return false;
  }
  if (existingStatus && status.toString().trim() !== existingStatus.toString().trim()) {
    return true;
  }
  return !existingStatus;
}

function sendNotificationEmail(sheet, rowNumber, rowData, headerMap) {
  const email = getEmailForAssignto(rowData.assignto);
  if (!email) return;
  const mailSentCol = headerMap.mailSent;
  const mailSentValue = sheet.getRange(rowNumber, mailSentCol).getValue();
  const status = String(rowData.status || '').trim().toLowerCase();
  if (status === 'open') return;
  if (mailSentValue && mailSentValue.toString().trim() === 'sent' && !statusChanged(sheet, rowNumber, headerMap, rowData.status)) {
    return;
  }

  const subject = `แจ้งเตือนสถานะงาน ${rowData.jobNo} : ${rowData.status}`;
  const body = buildEmailBody(sheet, rowNumber, rowData, headerMap);
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: body,
  });
  sheet.getRange(rowNumber, mailSentCol).setValue('sent');
}

function statusChanged(sheet, rowNumber, headerMap, newStatus) {
  const existingStatus = sheet.getRange(rowNumber, headerMap.lastStatus).getValue();
  return String(existingStatus || '').trim() !== String(newStatus || '').trim();
}

function getEmailForAssignto(assignto) {
  if (!assignto) return null;
  const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
  const sheet = ss.getSheetByName(EMAIL_SHEET_NAME);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  const header = rows[0].map((value) => String(value || '').trim().toLowerCase());
  const assigntoCol = header.indexOf('assignto');
  const emailCol = header.indexOf('email');
  if (assigntoCol === -1 || emailCol === -1) return null;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][assigntoCol]).trim() === String(assignto).trim()) {
      return String(rows[i][emailCol]).trim();
    }
  }
  return null;
}

function buildEmailBody(sheet, rowNumber, rowData, headerMap) {
  const statusSummary = buildStatusSummary(sheet, headerMap);
  return `
    <div style="font-family:Arial, sans-serif; line-height:1.4; color:#333;">
      <h2>สรุปสถานะงาน</h2>
      ${statusSummary}
      <h3>รายละเอียดงาน ${rowData.jobNo}</h3>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; max-width:600px;">
        <tr style="background:#f5f5f5;"><th align="left">ฟิลด์</th><th align="left">ค่า</th></tr>
        <tr><td>Job No</td><td>${escapeHtml(rowData.jobNo)}</td></tr>
        <tr><td>เรื่องที่แจ้ง</td><td>${escapeHtml(rowData.subject)}</td></tr>
        <tr><td>ผู้แจ้ง</td><td>${escapeHtml(rowData.ownerSubjectId)}</td></tr>
        <tr><td>วันที่แจ้ง</td><td>${escapeHtml(rowData.contactDate)}</td></tr>
        <tr><td>ผู้รับแจ้ง</td><td>${escapeHtml(rowData.assignto)}</td></tr>
        <tr><td>ประเภทบริการ</td><td>${escapeHtml(rowData.sysserViceTypeName)}</td></tr>
        <tr><td>สถานะ</td><td>${escapeHtml(rowData.status)}</td></tr>
        <tr><td>โปรแกรม</td><td>${escapeHtml(rowData.productName)}</td></tr>
        <tr><td>DEV</td><td>${escapeHtml(rowData.sysDevelop)}</td></tr>
      </table>
      <p>อัปเดตล่าสุด: ${Utilities.formatDate(new Date(), 'GMT+7', DATE_TIME_FORMAT)}</p>
    </div>
  `;
}

function buildStatusSummary(sheet, headerMap) {
  const values = sheet.getDataRange().getValues();
  const statusIndex = headerMap.status - 1;
  const summary = {};
  for (let i = 1; i < values.length; i++) {
    const status = String(values[i][statusIndex] || '').trim();
    if (!status) continue;
    summary[status] = (summary[status] || 0) + 1;
  }
  let html = '<div style="margin-bottom:16px;"><strong>จำนวนเคสตามสถานะ</strong><ul>';
  Object.keys(summary).forEach((status) => {
    html += `<li>${escapeHtml(status)}: ${summary[status]} เคส</li>`;
  });
  html += '</ul></div>';
  return html;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

## วิธีใช้งาน
1. นำสคริปต์นี้ไปวางใน Google Apps Script project
2. เปิดใช้งาน Advanced Drive API
3. ตั้งค่า `DRIVE_FOLDER_ID` และ `TARGET_SHEET_ID` ตามที่จำเป็น
4. กำหนด `EMAIL` sheet ให้มีคอลัมน์ `assignto` และ `email`
5. ตั้ง trigger ให้รัน `main()` อัตโนมัติ เช่น ทุกชั่วโมง หรือทุกวัน

## หมายเหตุสำคัญ
- การใช้ `Drive.Files.insert` ต้องเปิดใช้งาน Advanced Drive service ใน Apps Script
- ต้องให้สิทธิ์ Google Apps Script อ่านไฟล์จาก Drive และแก้ไข Spreadsheet
- ถ้า Excel มีรูปแบบวันที่ต่างกัน อาจต้องปรับ `parseDate()` เพิ่มเติม
- หากไม่ต้องการเก็บไฟล์ชั่วคราว ควรลบ Spreadsheet ชั่วคราวหลังใช้งานเสร็จ

## ข้อควรระวัง
- ถ้ามีไฟล์ Excel ในโฟลเดอร์มากกว่า 1 ไฟล์ ระบบจะเก็บเฉพาะไฟล์ล่าสุดและย้ายที่เหลือไปถังขยะ
- หากชีทปียังไม่มี จะสร้างใหม่ แต่ต้องระวังชื่อซ้ำกับชีทอื่น
- อีเมลจะส่งเฉพาะกรณีสถานะไม่ใช่ `Open`/`Close` และเป็นรายการใหม่หรือมีการเปลี่ยน `status`/`assignto`

## เสริม
- หากต้องการให้แจ้งเตือนแยก `assignto` ให้เพิ่มคอลัมน์ `cc` หรือ `bcc` ตามต้องการ
- หากต้องการแสดงแดชบอร์ดใน Google Sheet สามารถเพิ่มชีทสรุปสถานะแยกต่างหากได้
- หากต้องการทำงานกับ Excel ที่มีหลายชีท อาจต้องปรับ `readDataFromSpreadsheet()` ให้เลือกชีทที่ต้องการ
