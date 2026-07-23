/**
 * main.gs - ฟังก์ชันหลักของระบบ
 * 
 * ตัวจัดการโฟลว์ทั้งหมด:
 * - ค้นหาไฟล์ Excel ล่าสุด
 * - อ่านและประมวลผลข้อมูล
 * - ลงข้อมูลลง Google Sheet
 * - ส่งการแจ้งเตือนอีเมล
 */

/**
 * ฟังก์ชันหลักที่รัน
 * เรียกใช้งานได้โดยตรง หรือโดยการตั้ง Trigger
 */
function main() {
  const startTime = Date.now();
  const lock = LockService.getScriptLock();
  let latestFile = null;
  let latestFileName = '';
  let tempSpreadsheetId = '';
  let hasLock = false;
  
  try {
    if (!isWithinMainTriggerWorkingHours(new Date())) {
      return;
    }

    hasLock = lock.tryLock(1000);

    if (!hasLock) {
      log('main() skipped because another execution is still running', LOG_LEVEL.WARNING);
      return;
    }

    log('===== START MAIN EXECUTION =====', LOG_LEVEL.INFO);
    
    // ขั้นตอนที่ 1: ค้นหาไฟล์ Excel ล่าสุด
    log('Step 1: Finding latest Excel file...', LOG_LEVEL.INFO);
    const allFiles = getExcelFilesInFolder(DRIVE_FOLDER_ID);
    latestFile = getLatestExcelFileFromFiles(allFiles);
    
    if (!latestFile) {
      log('No Excel files found in folder. Exiting.', LOG_LEVEL.WARNING);
      return;
    }

    latestFileName = latestFile.getName();
    
    // ขั้นตอนที่ 2: ย้ายไฟล์เก่าไปถังขยะ
    log('Step 2: Moving old files to trash...', LOG_LEVEL.INFO);
    moveOtherFilesToTrash(allFiles, latestFile);
    
    // ขั้นตอนที่ 3: แปลงไฟล์ Excel เป็น Google Spreadsheet
    // ใช้ Drive conversion เป็นเส้นทางหลักเพื่อหลีกเลี่ยงหน่วยความจำสูงจาก
    // Utilities.unzip + XmlService ซึ่งอาจทำให้ Apps Script INTERNAL error
    log('Step 3: Converting Excel file to Google Spreadsheet...', LOG_LEVEL.INFO);
    const tempSpreadsheet = convertExcelToSpreadsheet(latestFile);
    tempSpreadsheetId = tempSpreadsheet ? tempSpreadsheet.getId() : '';

    // ขั้นตอนที่ 4: อ่านข้อมูลจาก Spreadsheet ที่แปลงแล้ว
    log('Step 4: Reading converted spreadsheet...', LOG_LEVEL.INFO);
    const rawData = tempSpreadsheet ? readDataFromSpreadsheet(tempSpreadsheet) : [];
    
    if (!rawData || rawData.length === 0) {
      log('No data found in Excel file. Exiting.', LOG_LEVEL.WARNING);
      cleanupTemporaryFiles(tempSpreadsheetId, latestFileName);
      return;
    }
    
    // ขั้นตอนที่ 5: หาปีจากข้อมูล
    log('Step 5: Extracting year from data...', LOG_LEVEL.INFO);
    const year = extractYearFromData(rawData);
    
    // ขั้นตอนที่ 6: เปิด Google Sheet เป้าหมาย
    log('Step 6: Opening target spreadsheet...', LOG_LEVEL.INFO);
    const targetSpreadsheet = SpreadsheetApp.openById(TARGET_SHEET_ID);
    
    // ขั้นตอนที่ 7: หาหรือสร้างชีทตามปี
    log('Step 7: Getting/creating sheet for year: ' + year, LOG_LEVEL.INFO);
    const targetSheet = getSheetByYear(targetSpreadsheet, year);
    
    // ขั้นตอนที่ 8: สร้าง header map
    log('Step 8: Building header map...', LOG_LEVEL.INFO);
    const headerMap = buildHeaderMap(targetSheet);
    
    // ขั้นตอนที่ 9: ประมวลผลข้อมูล
    log('Step 9: Processing data rows...', LOG_LEVEL.INFO);
    const rowsToNotify = processAllRows(targetSheet, rawData, headerMap);
    
    // ขั้นตอนที่ 10: ส่งอีเมลแจ้งเตือน
    log('Step 10: Sending notification emails...', LOG_LEVEL.INFO);
    const emailSummary = sendNotificationEmails(targetSheet, rowsToNotify, headerMap);
    
    // ขั้นตอนที่ 11: ล้างไฟล์ชั่วคราว
    log('Step 11: Cleaning up temporary files...', LOG_LEVEL.INFO);
    cleanupTemporaryFiles(tempSpreadsheetId, latestFileName);

    // ขั้นตอนที่ 12: ย้ายไฟล์ Excel ที่ประมวลผลแล้วไปถังขยะ
    log('Step 12: Moving processed Excel file to trash...', LOG_LEVEL.INFO);
    moveProcessedFileToTrash(latestFile);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log('===== MAIN EXECUTION COMPLETED =====', LOG_LEVEL.INFO);
    log('Total execution time: ' + duration.toFixed(2) + ' seconds', LOG_LEVEL.INFO);
    log('Rows processed: ' + rawData.length, LOG_LEVEL.INFO);
    log('Emails sent: ' + emailSummary.sent, LOG_LEVEL.INFO);
    log('Emails failed/skipped: ' + emailSummary.failed, LOG_LEVEL.INFO);
    
  } catch (e) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log('===== ERROR IN MAIN EXECUTION =====', LOG_LEVEL.ERROR);
    log('Error: ' + e.message, LOG_LEVEL.ERROR);
    log('Stack: ' + e.stack, LOG_LEVEL.ERROR);
    log('Duration: ' + duration.toFixed(2) + ' seconds', LOG_LEVEL.ERROR);
    
    // ลองล้างไฟล์ชั่วคราวแม้ว่าเกิด error
    try {
      cleanupTemporaryFiles(tempSpreadsheetId, latestFileName);
    } catch (cleanupError) {
      log('Error during cleanup: ' + cleanupError.message, LOG_LEVEL.ERROR);
    }
  } finally {
    if (hasLock) {
      lock.releaseLock();
      log('Released main execution lock', LOG_LEVEL.DEBUG);
    }
  }
}

/**
 * ตรวจสอบว่าอยู่ในวัน/เวลาที่อนุญาตให้ main trigger ทำงานหรือไม่
 * @param {Date} date - วันที่เวลาที่ต้องตรวจสอบ
 * @return {boolean} true ถ้าอยู่ในช่วงทำงาน
 */
function isWithinMainTriggerWorkingHours(date) {
  const now = date || new Date();
  const dayOfWeek = parseInt(Utilities.formatDate(now, EMAIL_TIMEZONE, 'u'), 10);
  const minutesOfDay = parseTimeTextToMinutes(Utilities.formatDate(now, EMAIL_TIMEZONE, 'HH:mm'));
  const startMinutes = parseTimeTextToMinutes(MAIN_TRIGGER_START_TIME);
  const endMinutes = parseTimeTextToMinutes(MAIN_TRIGGER_END_TIME);

  if (MAIN_TRIGGER_WORKDAYS.indexOf(dayOfWeek) === -1) {
    return false;
  }

  return minutesOfDay >= startMinutes && minutesOfDay <= endMinutes;
}

/**
 * แปลงข้อความเวลา HH:mm เป็นนาทีของวัน
 * @param {string} timeText - เวลา เช่น 09:00
 * @return {number} นาทีของวัน
 */
function parseTimeTextToMinutes(timeText) {
  const parts = String(timeText || '').split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  return (hours * 60) + minutes;
}

/**
 * ทดสอบฟังก์ชันที่ระบุ
 * ใช้สำหรับ debugging
 */
function testFunctions() {
  log('Testing basic functions...', LOG_LEVEL.INFO);
  
  try {
    let convertedData = [];
    
    // Test 1: getExcelFilesInFolder
    log('\n--- Test 1: getExcelFilesInFolder ---', LOG_LEVEL.INFO);
    const files = getExcelFilesInFolder(DRIVE_FOLDER_ID);
    log('Found ' + files.length + ' Excel files', LOG_LEVEL.INFO);
    
    if (files.length > 0) {
      // Test 2: getLatestExcelFileInFolder
      log('\n--- Test 2: getLatestExcelFileInFolder ---', LOG_LEVEL.INFO);
      const latest = getLatestExcelFileInFolder(DRIVE_FOLDER_ID);
      log('Latest file: ' + latest.getName(), LOG_LEVEL.INFO);
      
      // Test 3: convertExcelToSpreadsheet
      log('\n--- Test 3: convertExcelToSpreadsheet ---', LOG_LEVEL.INFO);
      const converted = convertExcelToSpreadsheet(latest);
      if (!converted) {
        log('Conversion returned null. Skipping read/normalize tests.', LOG_LEVEL.WARNING);
      } else {
        log('Converted file ID: ' + converted.getId(), LOG_LEVEL.INFO);

        // Test 4: readDataFromSpreadsheet
        log('\n--- Test 4: readDataFromSpreadsheet ---', LOG_LEVEL.INFO);
        convertedData = readDataFromSpreadsheet(converted);
        log('Read ' + convertedData.length + ' rows', LOG_LEVEL.INFO);

        if (convertedData.length > 0) {
          log('First row: ' + JSON.stringify(convertedData[0]), LOG_LEVEL.DEBUG);

          // Test 5: normalizeRow
          log('\n--- Test 5: normalizeRow ---', LOG_LEVEL.INFO);
          const normalized = normalizeRow(convertedData[0]);
          log('Normalized: ' + JSON.stringify(normalized), LOG_LEVEL.DEBUG);
        }

        // Cleanup converted spreadsheet
        deleteTempSpreadsheet();
      }
      
      // Test 6: extractYearFromData
      log('\n--- Test 6: extractYearFromData ---', LOG_LEVEL.INFO);
      const year = extractYearFromData(convertedData);
      log('Extracted year: ' + year, LOG_LEVEL.INFO);
      
      // Cleanup
      deleteTempSpreadsheet();
    }
    
    // Test 7: getEmailForAssignto
    log('\n--- Test 7: getEmailForAssignto ---', LOG_LEVEL.INFO);
    const email = getEmailForAssignto('6101');
    log('Email for 6101: ' + email, LOG_LEVEL.INFO);
    
    log('\n===== ALL TESTS COMPLETED =====', LOG_LEVEL.INFO);
  } catch (e) {
    log('Error in testing: ' + e.message, LOG_LEVEL.ERROR);
    deleteTempSpreadsheet();
  }
}

/**
 * สร้าง menu UI ใน Google Sheet (optional)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('CRM Report')
    .addItem('Run Sync', 'main')
    .addItem('Install Main Trigger', 'installMainTimeTrigger')
    .addItem('Delete Main Trigger', 'deleteMainTimeTriggers')
    .addItem('Mark Unsent As Sent Today', 'markUnsentEmailRowsAsSentToday')
    .addItem('Test Functions', 'testFunctions')
    .addItem('Test Email 6101', 'testSendEmailTo6101')
    .addItem('Test Summary 6101', 'testSendDailySummaryTo6101')
    .addItem('Send Daily Summary', 'sendDailySummaryEmails')
    .addItem('Send QA Summary', 'sendDailySummaryEmailsToQA')
    .addItem('Send DEV Summary', 'sendDailySummaryEmailsToDEV')
    .addItem('Send Account Summary', 'sendDailySummaryEmailsToAccount')
    .addItem('Send Support Summary', 'sendDailySummaryEmailsToSupport')
    .addSeparator()
    .addItem('View Logs', 'viewLogs')
    .addToUi();
}

/**
 * ติดตั้ง time-based trigger ให้รัน main() เป็นรอบ ๆ
 * ใช้สำหรับตรวจจับไฟล์ Excel ใหม่/ที่แก้ไขใน Drive folder แบบ polling
 * @return {string} สรุปผลการติดตั้ง
 */
function installMainTimeTrigger() {
  try {
    deleteTriggersByHandler('main');

    ScriptApp.newTrigger('main')
      .timeBased()
      .everyMinutes(MAIN_TRIGGER_INTERVAL_MINUTES)
      .create();

    const message = 'Installed main() time trigger: every ' + MAIN_TRIGGER_INTERVAL_MINUTES + ' minutes';
    log(message, LOG_LEVEL.INFO);
    return message;
  } catch (e) {
    log('Error installing main trigger: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * ลบ time-based trigger ของ main()
 * @return {string} สรุปผลการลบ
 */
function deleteMainTimeTriggers() {
  try {
    const deletedCount = deleteTriggersByHandler('main');
    const message = 'Deleted main() triggers: ' + deletedCount;
    log(message, LOG_LEVEL.INFO);
    return message;
  } catch (e) {
    log('Error deleting main triggers: ' + e.message, LOG_LEVEL.ERROR);
    throw e;
  }
}

/**
 * ลบ trigger ตามชื่อ handler function
 * @param {string} handlerFunction - ชื่อฟังก์ชันที่ trigger เรียก
 * @return {number} จำนวน trigger ที่ลบ
 */
function deleteTriggersByHandler(handlerFunction) {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;

  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === handlerFunction) {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  });

  return deletedCount;
}

/**
 * ดูรายการ trigger ของโปรเจค
 * @return {Array<Object>} รายการ trigger
 */
function listProjectTriggers() {
  const triggers = ScriptApp.getProjectTriggers().map((trigger) => {
    return {
      handlerFunction: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType()),
      source: String(trigger.getTriggerSource())
    };
  });

  log('Project triggers: ' + JSON.stringify(triggers), LOG_LEVEL.INFO);
  return triggers;
}

/**
 * ดู logs ล่าสุด
 * @return {string} ข้อความแนะนำการดู logs
 */
function viewLogs() {
  const message = 'ดู logs ได้จาก Apps Script editor > Executions หรือ View > Logs';

  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    log('viewLogs called without Spreadsheet UI context: ' + e.message, LOG_LEVEL.INFO);
  }

  return message;
}

/**
 * ล้าง properties (สำหรับ reset ระบบ)
 */
function clearProperties() {
  PropertiesService.getUserProperties().deleteAllProperties();
  log('All properties cleared', LOG_LEVEL.INFO);
}

/**
 * ส่วนเสริม: ตรวจสอบว่า API ถูกเปิดใช้งานหรือไม่
 */
function checkRequiredAPIs() {
  try {
    log('Checking required APIs...', LOG_LEVEL.INFO);
    
    // ลองเรียก Drive API
    const files = DriveApp.getRootFolder().getFiles();
    log('✓ Drive API is available', LOG_LEVEL.INFO);
    
    // ลองเรียก Spreadsheet API
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    log('✓ Spreadsheet API is available', LOG_LEVEL.INFO);
    
    // ลองเรียก Mail API
    const drafts = GmailApp.getDrafts();
    log('✓ Gmail API is available', LOG_LEVEL.INFO);
    
    log('All required APIs are available!', LOG_LEVEL.INFO);
    return true;
  } catch (e) {
    log('Error checking APIs: ' + e.message, LOG_LEVEL.ERROR);
    return false;
  }
}
