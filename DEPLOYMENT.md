# DEPLOYMENT.md - ขั้นตอนการ Deploy

คู่มือการ Deploy Google Apps Script สำหรับโปรเจค CRM Report Excel to Google Sheet

---

## เตรียมความพร้อม

### 1. สร้าง Google Apps Script Project
1. ไปที่ [Google Apps Script](https://script.google.com/)
2. คลิก **+ New project**
3. ตั้งชื่อโปรเจค เช่น `CRM Report - Excel to Sheet`
4. บันทึก Project ID สำหรับการใช้งานในภายหลัง

### 2. เปิดใช้งาน Advanced Google Services
1. ใน Google Apps Script editor คลิก **Services** (ด้านซ้าย)
2. ค้นหา **Drive API** และเลือกเพิ่ม
3. คลิก **OK** เพื่อเปิดใช้งาน

### 3. เปิดใช้งาน Google Cloud Project API
1. ใน Google Apps Script editor คลิก **Project Settings** (ด้านซ้าย)
2. คัดลอก **GCP Project ID**
3. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
4. เลือก Project ตามที่คัดลอกมา
5. ค้นหา **Drive API** และคลิก
6. คลิก **Enable** เพื่อเปิดใช้งาน

### 4. ให้สิทธิ์ Google Apps Script
1. ใน Google Apps Script editor เลือก **Authorization**
2. คลิก **Review Permissions**
3. เลือก Google Account ที่ต้องการให้สิทธิ์
4. คลิก **Allow** เพื่อให้สิทธิ์

---

## โครงสร้างไฟล์ Script

สร้างไฟล์ Google Apps Script ตามนี้:

### ไฟล์ 1: `main.gs` - ฟังก์ชันหลัก
- `main()` - เรียกใช้งานทั้งระบบ
- `onOpen()` - เมนู Custom UI (ถ้าต้องการ)

### ไฟล์ 2: `FileHandler.gs` - จัดการไฟล์
- `getExcelFilesInFolder(folderId)`
- `getLatestExcelFileInFolder(folderId)`
- `moveOtherFilesToTrash(files, keepFile)`
- `convertExcelToSpreadsheet(file)`

### ไฟล์ 3: `DataReader.gs` - อ่านข้อมูล
- `readDataFromSpreadsheet(spreadsheet)`
- `normalizeRow(rawRow)`
- `parseDate(value)`
- `formatThaiDate(dateValue)`

### ไฟล์ 4: `SheetManager.gs` - จัดการ Sheet เป้าหมาย
- `extractYearFromData(rawData)`
- `getSheetByYear(spreadsheet, year)`
- `buildHeaderMap(sheet)`
- `ensureColumns(sheet, map)`

### ไฟล์ 5: `DataProcessor.gs` - ประมวลผลข้อมูล
- `processRow(sheet, rowData, headerMap)`
- `buildUpdateData(rowData, headerMap)`
- `processAllRows(sheet, dataRows, headerMap)`
- `shouldProcessForEmail(status, existingStatus)`

### ไฟล์ 6: `EmailHandler.gs` - ส่งอีเมล
- `getEmailForAssignto(assignto)`
- `sendNotificationEmail(sheet, rowIndex, rowData, headerMap)`
- `sendNotificationEmails(sheet, rowsToNotify, headerMap)`
- `hasStatusChangedForEmail(sheet, rowIndex, headerMap, currentStatus)`

### ไฟล์ 7: `EmailTemplate.gs` - เทมเพลตอีเมล
- `buildEmailBody(sheet, rowIndex, rowData, headerMap)`
- `buildStatusSummary(sheet, headerMap)`
- `escapeHtml(text)`

### ไฟล์ 8: `Config.gs` - ค่าคอนฟิก (ถ้าต้องการแยก)
```javascript
const DRIVE_FOLDER_ID = '1aXRC4l8aepBut_mBfYtJvwikiAXbAfhQ';
const TARGET_SHEET_ID = '11Fi4uDaCmVF3IBY_wCQRNrmWOwVlwHOlbiZhfs35sdo';
const QA_ASSIGNEES = ['6101', '6610', '6619'];
const EMAIL_SHEET_NAME = 'EMAIL';
const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';
```

---

## ขั้นตอนการ Deploy

### วิธีที่ 1: การคัดลอก Script ไปยัง Google Apps Script Editor

1. เตรียม Script Files ทั้งหมด
2. ใน Google Apps Script editor คลิก **+ File** > **New > Script file**
3. สร้างไฟล์ใหม่ตามชื่อด้านบน
4. คัดลอก code จากแต่ละไฟล์ไป
5. บันทึกทั้งหมด (Ctrl+S)

### วิธีที่ 2: การใช้ clasp (Google Apps Script CLI)

#### ติดตั้ง clasp
```bash
npm install -g @google/clasp
```

#### เข้าสู่ระบบ
```bash
clasp login
```

#### สร้าง Project ใหม่
```bash
cd /path/to/project
clasp create --title "CRM Report - Excel to Sheet"
```

#### Push Code ไปยัง Google
```bash
clasp push
```

#### ดู logs
```bash
clasp logs
```

---

## ตั้งค่า Constants

แก้ไข Config.gs ใส่ค่าที่ถูกต้อง:

```javascript
const DRIVE_FOLDER_ID = '1aXRC4l8aepBut_mBfYtJvwikiAXbAfhQ';  // Folder ID ของไฟล์ Excel
const TARGET_SHEET_ID = '11Fi4uDaCmVF3IBY_wCQRNrmWOwVlwHOlbiZhfs35sdo';  // Google Sheet ID เป้าหมาย
const QA_ASSIGNEES = ['6101', '6610', '6619'];  // IDs ที่มี QA
const EMAIL_SHEET_NAME = 'EMAIL';  // ชีทชื่อ EMAIL
const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';  // รูปแบบวันที่
```

---

## ตั้ง Trigger

### ตั้ง Time-based Trigger
1. ใน Google Apps Script editor คลิก **Triggers** (ไอคอนนาฬิกา)
2. คลิก **+ Create new trigger**
3. ตั้งค่าดังนี้:
   - **Choose which function to run**: `main`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `Time-driven`
   - **Select type of time-based trigger**: 
     - `Hour timer` (ทุกชั่วโมง)
     - `Day timer` (ทุกวัน ที่เลือก)
     - `Week timer` (ทุกสัปดาห์)
   - **Select hour interval** (ถ้าเลือก Hour timer): `Every hour` หรือตามต้องการ
4. คลิก **Save**

### ตั้ง Trigger ผ่าน Script
```javascript
function createTrigger() {
  ScriptApp.newTrigger('main')
    .timeBased()
    .everyHours(1)
    .create();
}
```

---

## ตรวจสอบ Sheet เป้าหมาย

### สร้างชีท EMAIL
1. เปิด Google Sheet ที่มี ID `11Fi4uDaCmVF3IBY_wCQRNrmWOwVlwHOlbiZhfs35sdo`
2. สร้างชีทชื่อ `EMAIL` (ถ้ายังไม่มี)
3. เพิ่มคอลัมน์:
   - `assignto` - ID ของผู้รับแจ้ง
   - `email` - Email address ของผู้รับแจ้ง

**ตัวอย่างข้อมูล**:
| assignto | email |
|----------|-------|
| 6101 | user1@example.com |
| 6610 | user2@example.com |
| 6619 | user3@example.com |

### สร้างชีทตามปี
- ระบบจะสร้างชีทตามปีอัตโนมัติ เช่น `2026`, `2027` เป็นต้น
- สามารถสร้างชีทล่วงหน้าก็ได้ หรือปล่อยให้ระบบสร้างเอง

---

## ทดสอบ Script

### ทดสอบจากนอก Google Apps Script
1. ใน Google Apps Script editor คลิก **Run** (ไอคอนเล่น)
2. เลือก `main` function
3. ตรวจสอบ **Logs** เพื่อดูข้อมูลการทำงาน
4. ตรวจสอบ Google Sheet เพื่อดูข้อมูลที่ถูกลงเข้าไป

### ดู Logs
1. คลิก **Executions** (ไอคอนกิจกรรม)
2. ดูประวัติการเรียกใช้งาน
3. คลิกแต่ละรายการเพื่อดูรายละเอียด

---

## ปัญหาที่อาจเกิดขึ้น

### Error: "Exception: The file cannot be converted"
**สาเหตุ**: ไฟล์ Excel อาจเสียหรือรูปแบบไม่ถูกต้อง
**แก้ไข**: ตรวจสอบไฟล์ Excel หรือลองแปลงด้วยตัวเอง

### Error: "Authorization required"
**สาเหตุ**: ยังไม่ได้ให้สิทธิ์
**แก้ไข**: ไปที่ "ให้สิทธิ์ Google Apps Script" ตามข้างต้น

### Error: "Sheet not found"
**สาเหตุ**: ชีท EMAIL ยังไม่มี
**แก้ไข**: สร้างชีท `EMAIL` ตามขั้นตอนข้างต้น

### Email ไม่ส่ง
**สาเหตุ**: อาจเพราะ `status = Open`, `status = Close` หรือเมลถูกส่งไปแล้ว
**แก้ไข**: ตรวจสอบค่า `status` และคอลัมน์ `mailSent`

---

## Back Up และ Recovery

### Back Up Script
```bash
clasp pull
```

### Recovery Script
1. ถ้าลบ Script โดยไม่ตั้งใจ ให้ไปที่ Google Drive
2. คลิก **More** > **Show trash**
3. ค้นหา Script ที่ลบ
4. คลิกขวา > **Restore**

---

## Monitoring

### ตรวจสอบการทำงาน
1. คลิก **Executions** ใน Google Apps Script editor
2. ดูประวัติการเรียกใช้งาน
3. ตรวจสอบ error หากเกิดขึ้น

### Setting Up Alerts (ถ้าต้องการ)
1. สามารถปรับ Script เพื่อส่งเมลแจ้งเมื่อมี error
2. เพิ่มการส่ง Slack notification หรือ Discord webhook

---

## ตัดสินใจ Deploy
- **Development**: เปิดใช้ Trigger ทุก 1 ชั่วโมง
- **Production**: เปิดใช้ Trigger ทุก 24 ชั่วโมง (หรือตามต้องการ)
- **Testing**: ปิด Trigger และรัน manual

---

## ท้ายที่สุด
- ✅ ตรวจสอบ API เปิดใช้งาน
- ✅ ตรวจสอบสิทธิ์
- ✅ ตั้ง Trigger
- ✅ ทดสอบ Script
- ✅ ตรวจสอบข้อมูล
- ✅ Deploy ไปยัง Production

