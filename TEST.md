# TEST.md - การทดสอบ

คู่มือการทดสอบ Google Apps Script สำหรับโปรเจค CRM Report Excel to Google Sheet

---

## ประเภทการทดสอบ

### 1. Unit Test - ทดสอบฟังก์ชันแต่ละตัว
### 2. Integration Test - ทดสอบการทำงานร่วมกัน
### 3. End-to-End Test - ทดสอบการทำงานทั้งระบบ
### 4. Regression Test - ทดสอบว่าการแก้ไขใหม่ไม่ทำให้เก่าเสีย

---

## Unit Test

### Test 1: parseDate() Function
**วัตถุประสงค์**: ทดสอบการแปลงวันที่

**Test Cases**:
```javascript
function testParseDate() {
  // Test 1.1: วันที่ใน format "01/01/2026"
  let result = parseDate('01/01/2026');
  Logger.log('Test 1.1: ' + (result instanceof Date ? 'PASS' : 'FAIL'));

  // Test 1.2: วันที่ใน format "2026-01-01"
  result = parseDate('2026-01-01');
  Logger.log('Test 1.2: ' + (result instanceof Date ? 'PASS' : 'FAIL'));

  // Test 1.3: Date object
  result = parseDate(new Date());
  Logger.log('Test 1.3: ' + (result instanceof Date ? 'PASS' : 'FAIL'));

  // Test 1.4: ค่างว่าง
  result = parseDate('');
  Logger.log('Test 1.4: ' + (result === null ? 'PASS' : 'FAIL'));
}
```

### Test 2: formatThaiDate() Function
**วัตถุประสงค์**: ทดสอบการแปลงวันที่เป็นรูปแบบไทย

**Test Cases**:
```javascript
function testFormatThaiDate() {
  // Test 2.1: วันที่ปกติ
  let date = new Date(2026, 5, 12); // June 12, 2026
  let result = formatThaiDate(date);
  let expected = '12/06/2026 00:00:00';
  Logger.log('Test 2.1: ' + (result.includes('12/06/2026') ? 'PASS' : 'FAIL'));

  // Test 2.2: ค่างว่าง
  result = formatThaiDate(null);
  Logger.log('Test 2.2: ' + (result === '' ? 'PASS' : 'FAIL'));

  // Test 2.3: String วันที่
  result = formatThaiDate('2026-06-12');
  Logger.log('Test 2.3: ' + (result.includes('12/06/2026') ? 'PASS' : 'FAIL'));
}
```

### Test 3: escapeHtml() Function
**วัตถุประสงค์**: ทดสอบการป้องกัน HTML injection

**Test Cases**:
```javascript
function testEscapeHtml() {
  // Test 3.1: ข้อความธรรมดา
  let result = escapeHtml('Hello World');
  Logger.log('Test 3.1: ' + (result === 'Hello World' ? 'PASS' : 'FAIL'));

  // Test 3.2: HTML tags
  result = escapeHtml('<script>alert("xss")</script>');
  Logger.log('Test 3.2: ' + (result.includes('&lt;') && result.includes('&gt;') ? 'PASS' : 'FAIL'));

  // Test 3.3: Special characters
  result = escapeHtml('Test & "quotes" \'apostrophe\'');
  Logger.log('Test 3.3: ' + (result.includes('&amp;') && result.includes('&quot;') ? 'PASS' : 'FAIL'));

  // Test 3.4: ค่างว่าง
  result = escapeHtml(null);
  Logger.log('Test 3.4: ' + (result === '' ? 'PASS' : 'FAIL'));
}
```

### Test 4: normalizeRow() Function
**วัตถุประสงค์**: ทดสอบการจัดรูปแบบข้อมูลแถว

**Test Cases**:
```javascript
function testNormalizeRow() {
  // Test 4.1: ข้อมูลตามปกติ
  let rawRow = {
    'Job No': 'JOB001',
    'เรื่องที่แจ้ง': 'Issue 1',
    'ผู้แจ้ง': '6101',
    'วันที่แจ้ง': '2026-06-12',
    'ผูรับแจ้ง': '6101'
  };
  let result = normalizeRow(rawRow);
  Logger.log('Test 4.1: ' + (result.jobNo === 'JOB001' ? 'PASS' : 'FAIL'));

  // Test 4.2: ตรวจสอบ QA
  Logger.log('Test 4.2: ' + (result.QA === 'QA' ? 'PASS' : 'FAIL'));

  // Test 4.3: วันที่ถูกแปลง
  Logger.log('Test 4.3: ' + (result.contactDate.includes('12/06/2026') ? 'PASS' : 'FAIL'));
}
```

### Test 5: buildUpdateData() Function
**วัตถุประสงค์**: ทดสอบการสร้างข้อมูลสำหรับอัปเดต

**Test Cases**:
```javascript
function testBuildUpdateData() {
  let rowData = {
    jobNo: 'JOB001',
    subject: 'Test Issue',
    status: 'In Progress'
  };
  let headerMap = {
    jobNo: 1,
    subject: 2,
    status: 3,
    lastStatus: 12,
    updatedAt: 13
  };
  let result = buildUpdateData(rowData, headerMap);
  Logger.log('Test 5.1: ' + (result[1] === 'JOB001' ? 'PASS' : 'FAIL'));
  Logger.log('Test 5.2: ' + (result[12] === 'In Progress' ? 'PASS' : 'FAIL'));
  Logger.log('Test 5.3: ' + (result[13] ? 'PASS' : 'FAIL')); // updatedAt ต้องมีค่า
}
```

---

## Integration Test

### Test 6: Sheet Operations
**วัตถุประสงค์**: ทดสอบการอ่านและเขียนข้อมูลใน Sheet

**ขั้นตอน**:
```javascript
function testSheetOperations() {
  // Test 6.1: สร้างชีทตามปี
  const spreadsheet = SpreadsheetApp.openById(TARGET_SHEET_ID);
  let sheet = getSheetByYear(spreadsheet, '2026');
  Logger.log('Test 6.1 - Sheet created: ' + (sheet ? 'PASS' : 'FAIL'));

  // Test 6.2: สร้าง header map
  let headerMap = buildHeaderMap(sheet);
  Logger.log('Test 6.2 - Headers mapped: ' + (Object.keys(headerMap).length > 0 ? 'PASS' : 'FAIL'));

  // Test 6.3: เขียนข้อมูล
  let rowData = {
    jobNo: 'TEST_' + Date.now(),
    subject: 'Test Subject',
    status: 'Open'
  };
  let newRow = sheet.getLastRow() + 1;
  setRowValues(sheet, newRow, buildUpdateData(rowData, headerMap));
  Logger.log('Test 6.3 - Data written: PASS');

  // Test 6.4: อ่านข้อมูล
  let values = sheet.getRange(newRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('Test 6.4 - Data read: ' + (values[0] === rowData.jobNo ? 'PASS' : 'FAIL'));
}
```

### Test 7: Email Sending
**วัตถุประสงค์**: ทดสอบการส่งอีเมล

**ขั้นตอน**:
```javascript
function testEmailSending() {
  // Test 7.1: ค้นหา email จาก assignto
  let email = getEmailForAssignto('6101');
  Logger.log('Test 7.1 - Email found: ' + (email ? 'PASS' : 'FAIL: ' + email));

  // Test 7.2: ตรวจสอบเงื่อนไขการส่ง
  let shouldSend = shouldProcessForEmail('In Progress', '');
  Logger.log('Test 7.2 - Should send: ' + (shouldSend ? 'PASS' : 'FAIL'));

  // Test 7.3: ตรวจสอบไม่ส่ง Open status
  shouldSend = shouldProcessForEmail('Open', '');
  Logger.log('Test 7.3 - Should not send (Open): ' + (!shouldSend ? 'PASS' : 'FAIL'));

  // Test 7.4: ตรวจสอบไม่ส่ง Close ปกติ
  shouldSend = shouldProcessForEmail('Close', '');
  Logger.log('Test 7.4 - Should not send (Close unchanged): ' + (!shouldSend ? 'PASS' : 'FAIL'));

  // Test 7.5: สร้าง email body
  let rowData = {
    jobNo: 'JOB001',
    subject: 'Test',
    status: 'In Progress'
  };
  let body = buildEmailBody(null, 1, rowData, {});
  Logger.log('Test 7.5 - Email body created: ' + (body.length > 0 ? 'PASS' : 'FAIL'));
}
```

### Test 8: File Operations
**วัตถุประสงค์**: ทดสอบการจัดการไฟล์ Excel

**ขั้นตอน**:
```javascript
function testFileOperations() {
  // Test 8.1: หาไฟล์ Excel ทั้งหมด
  let files = getExcelFilesInFolder(DRIVE_FOLDER_ID);
  Logger.log('Test 8.1 - Found Excel files: ' + (files.length > 0 ? 'PASS' : 'FAIL: No files found'));

  // Test 8.2: หาไฟล์ล่าสุด
  if (files.length > 0) {
    let latest = getLatestExcelFileInFolder(DRIVE_FOLDER_ID);
    Logger.log('Test 8.2 - Latest file found: ' + (latest ? 'PASS' : 'FAIL'));

    // Test 8.3: แปลงไฟล์
    let converted = convertExcelToSpreadsheet(latest);
    Logger.log('Test 8.3 - File converted: ' + (converted ? 'PASS' : 'FAIL'));
  }
}
```

---

## End-to-End Test

### Test 9: Full Workflow
**วัตถุประสงค์**: ทดสอบการทำงานทั้งระบบจากไฟล์ Excel ไปยัง Google Sheet

**ขั้นตอน**:
1. เตรียม Test Excel File
   - สร้างไฟล์ Excel ขนาดเล็กพร้อมข้อมูลทดสอบ
   - อัปโหลดไปยังโฟลเดอร์ `1aXRC4l8aepBut_mBfYtJvwikiAXbAfhQ`

2. รัน Script
   ```javascript
   function testEndToEnd() {
     try {
       main();
       Logger.log('Test 9 - Full workflow: PASS');
     } catch (e) {
       Logger.log('Test 9 - Full workflow: FAIL - ' + e);
     }
   }
   ```

3. ตรวจสอบผลลัพธ์
   - ตรวจสอบ Google Sheet ว่ามีข้อมูลใหม่
   - ตรวจสอบวันที่เป็นรูปแบบไทย
   - ตรวจสอบคอลัมน์ QA (ถ้าเข้าเงื่อนไข)
   - ตรวจสอบ email ถูกส่งหรือไม่

---

## Regression Test

### Test 10: ตรวจสอบไม่เสียเก่า

**สิ่งที่ต้องตรวจสอบ**:
- [ ] ข้อมูลเก่าไม่ถูกลบ
- [ ] จำนวนแถวเพิ่มขึ้นอย่างถูกต้อง
- [ ] jobNo เดิมไม่ถูกแทนที่ (เว้นแต่เป็นการอัปเดต)
- [ ] Header ไม่เปลี่ยนแปลง
- [ ] วันที่ของแถวเก่าไม่เปลี่ยน

---

## Performance Test

### Test 11: ทดสอบประสิทธิภาพ

```javascript
function testPerformance() {
  let startTime = Date.now();
  main();
  let endTime = Date.now();
  let duration = (endTime - startTime) / 1000; // วินาที
  Logger.log('Test 11 - Execution time: ' + duration + ' seconds');
  Logger.log('Test 11 - Status: ' + (duration < 300 ? 'PASS (< 5 min)' : 'WARNING (> 5 min)'));
}
```

---

## Test Checklist

### ก่อน Deploy

- [ ] ทดสอบการอ่านไฟล์ Excel
- [ ] ทดสอบการแปลงข้อมูล
- [ ] ทดสอบการลงข้อมูลเป้าหมาย (append)
- [ ] ทดสอบการอัปเดตข้อมูล (update)
- [ ] ทดสอบการส่งอีเมล
- [ ] ทดสอบการตรวจสอบ jobNo ซ้ำ
- [ ] ทดสอบการเพิ่มคอลัมน์ QA
- [ ] ทดสอบการไม่ส่งอีเมลซ้ำ
- [ ] ทดสอบวันที่เป็นรูปแบบไทย
- [ ] ทดสอบการสร้างชีทตามปี
- [ ] ทดสอบ Edge cases (data empty, null, etc.)
- [ ] ทดสอบ Error handling

### ระหว่าง Deploy

- [ ] ตรวจสอบ logs
- [ ] ตรวจสอบข้อมูลใน Sheet
- [ ] ตรวจสอบอีเมลที่ส่ง
- [ ] ตรวจสอบไม่มี error

### หลัง Deploy

- [ ] ติดตามการทำงาน ตั้งแต่ trigger แรก
- [ ] ตรวจสอบข้อมูลเป็นประจำ
- [ ] บันทึก issues ที่เกิดขึ้น

---

## Test Report Template

```
Test Date: ________________
Tester: ________________
Build Version: ________________

Test Results:
- Unit Tests: PASS / FAIL
- Integration Tests: PASS / FAIL
- End-to-End Tests: PASS / FAIL
- Regression Tests: PASS / FAIL
- Performance Tests: PASS / FAIL

Issues Found:
[
  Issue 1: ...
  Issue 2: ...
]

Overall Status: PASS / FAIL
Approved for Deploy: YES / NO
```

---

## Automated Test Runner

```javascript
function runAllTests() {
  Logger.log('====== TEST SUITE START ======');
  
  Logger.log('\n--- Unit Tests ---');
  testParseDate();
  testFormatThaiDate();
  testEscapeHtml();
  testNormalizeRow();
  testBuildUpdateData();

  Logger.log('\n--- Integration Tests ---');
  testSheetOperations();
  testEmailSending();
  testFileOperations();

  Logger.log('\n--- Performance Test ---');
  testPerformance();

  Logger.log('\n====== TEST SUITE END ======');
}
```

---

## Tips สำหรับการทดสอบ

1. **ใช้ Test Data ขนาดเล็ก** - ง่ายต่อการ debug
2. **บันทึก Logs** - เก็บไว้สำหรับการตรวจสอบ
3. **ทดสอบ Edge Cases** - ข้อมูลว่าง, ข้อมูลมากเกิน, ฯลฯ
4. **สร้าง Backup** - ก่อนการทดสอบสำคัญ
5. **ลองซ้ำหลายครั้ง** - เพื่อให้แน่ใจ
6. **ตรวจสอบ Logs อย่างละเอียด** - หาข้อมูลเบื้องหลัง
7. **บันทึกผลลัพธ์** - สำหรับการพัฒนาต่อไป

