# TROUBLESHOOTING.md - แก้ไขปัญหา

คู่มือการแก้ไขปัญหาที่อาจเกิดขึ้นใน Google Apps Script

---

## ปัญหาทั่วไป

### 1. "Exception: Authorization required"

**สาเหตุ**:
- ยังไม่ได้ให้สิทธิ์ให้ Google Apps Script อ่านไฟล์ Drive
- ยังไม่ได้ให้สิทธิ์ให้ Script แก้ไข Spreadsheet

**วิธีแก้ไข**:
1. ใน Google Apps Script editor คลิก **Authorization**
2. คลิก **Review Permissions**
3. เลือก Google Account
4. คลิก **Allow** เพื่อให้สิทธิ์

**หรือ**:
1. ให้รัน Script เพียงครั้งเดียว
2. ระบบจะขอให้ Accept permissions
3. คลิก **Review Permissions** > **Allow**

---

### 2. "Exception: Drive API has not been used before"

**สาเหตุ**:
- Drive API ยังไม่ได้เปิดใช้งาน

**วิธีแก้ไข**:
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. ค้นหา **Drive API**
3. คลิก **Enable**
4. รอ 1-2 นาที เพื่อให้ API บูตสำเร็จ

---

### 3. "Exception: The file cannot be converted"

**สาเหตุ**:
- ไฟล์ Excel เสียหรือรูปแบบไม่ถูกต้อง
- ไฟล์ Excel มีการป้องกัน

**วิธีแก้ไข**:
1. ตรวจสอบไฟล์ Excel ว่าเปิดได้ปกติหรือไม่
2. ลองแปลงไฟล์ Excel ด้วยตัวเอง:
   - ใน Google Drive คลิก **New** > **File upload** > เลือกไฟล์
   - คลิกขวาไฟล์ > **Open with** > **Google Sheets**
3. ถ้ายังไม่ได้ ให้บันทึกไฟล์ Excel ใหม่
4. ถ้าเป็นไฟล์ที่ป้องกัน ให้ถอดการป้องกัน

---

### 4. "Cannot find method getLastUpdated()"

**สาเหตุ**:
- File API ยังไม่ได้เปิดใช้งาน

**วิธีแก้ไข**:
1. ตรวจสอบ Advanced Services ว่าเปิด Drive API หรือไม่
2. ใน Google Apps Script editor คลิก **Services**
3. ค้นหา **Drive API** และเลือก
4. คลิก **OK** เพื่อเปิดใช้งาน

---

### 5. "Sheet not found"

**สาเหตุ**:
- ชีท EMAIL ยังไม่มีใน Google Sheet
- ชื่อชีทไม่ตรงกัน (case sensitive)

**วิธีแก้ไข**:
1. เปิด Google Sheet ที่มี ID `11Fi4uDaCmVF3IBY_wCQRNrmWOwVlwHOlbiZhfs35sdo`
2. สร้างชีทชื่อ `EMAIL` (อักษรใหญ่ทั้งหมด)
3. เพิ่มคอลัมน์ `assignto` และ `email`
4. ลองรัน Script อีกครั้ง

---

### 6. Email ไม่ส่ง

**สาเหตุ**:
- `status = Open` หรือ `status = Close` (Script ไม่ส่ง)
- Email ถูกส่งไปแล้ว (ตรวจสอบจาก `mailSent` column)
- ไม่พบ assignto ในชีท EMAIL
- ที่อยู่ email ไม่ถูกต้อง

**วิธีแก้ไข**:
1. ตรวจสอบค่า `status` ว่าเป็นอะไร
2. ถ้าต้องการส่งซ้ำ ให้ลบค่า `mailSent` column
3. ตรวจสอบ `assignto` มีใน EMAIL sheet หรือไม่
4. ตรวจสอบ email address ว่าถูกต้องหรือไม่
5. ตรวจสอบ Logger เพื่อดูข้อความ error

---

### 7. Logs ไม่ปรากฏ

**สาเหตุ**:
- Script ยังไม่มี Logger.log()
- Logs ถูกลบตามเวลา (เก่าเกิน 7 วัน)

**วิธีแก้ไข**:
1. เพิ่ม Logger.log() ในจุดต่างๆ:
   ```javascript
   Logger.log('ข้อมูล: ' + JSON.stringify(data));
   ```
2. รัน Script ใหม่
3. คลิก **Executions** เพื่อดู logs ล่าสุด

---

### 8. Data ไม่ลงใน Sheet

**สาเหตุ**:
- Header ไม่ตรงกัน
- Spreadsheet ID ไม่ถูกต้อง
- ไม่ได้เปิด Google Sheet โดยรับสิทธิ์
- ข้อมูล jobNo เป็นค่างว่าง

**วิธีแก้ไข**:
1. ตรวจสอบ TARGET_SHEET_ID ว่าถูกต้องหรือไม่
2. ตรวจสอบหัวคอลัมน์ใน Google Sheet ว่าตรงกันหรือไม่
3. ให้สิทธิ์ Google Sheet ใหม่ (อ่านได้ และเขียนได้)
4. ตรวจสอบว่า jobNo มีค่าหรือไม่ (jobNo เป็นคีย์หลัก)

---

### 9. Duplicate Data

**สาเหตุ**:
- Script ตรวจสอบ jobNo ไม่ถูกต้อง
- ข้อมูล jobNo ที่ค่างหรือช่องว่าง

**วิธีแก้ไข**:
1. ตรวจสอบค่า jobNo ว่าไม่ว่าง
2. ลบข้อมูลซ้ำออกด้วยมือ
3. ตรวจสอบ Excel ว่า jobNo ในแต่ละแถวไม่ซ้ำ

---

### 10. Date Format ไม่ถูกต้อง

**สาเหตุ**:
- วันที่จากไฟล์ Excel ไม่ตรงกับรูปแบบที่คาดหวัง
- timezone ไม่ใช่ GMT+7 (ประเทศไทย)

**วิธีแก้ไข**:
1. ตรวจสอบฟังก์ชัน `parseDate()` ว่าจัดการรูปแบบวันที่ได้หรือไม่
2. ตรวจสอบ Excel ว่าวันที่อยู่ในคอลัมน์ที่ถูกต้อง
3. หากต้องการเปลี่ยน timezone ให้แก้ `formatThaiDate()`:
   ```javascript
   function formatThaiDate(dateValue) {
     if (!dateValue) return '';
     const date = dateValue instanceof Date ? dateValue : parseDate(dateValue);
     if (!date) return '';
     return Utilities.formatDate(date, 'GMT+7', DATE_TIME_FORMAT);
   }
   ```

---

### 11. Quota exceeded

**สาเหตุ**:
- Script ประมวลผลข้อมูลจำนวนมากมายเกินไป
- Script เรียก API จำนวนมากเกิน quota ที่กำหนด

**วิธีแก้ไข**:
1. แบ่งข้อมูลออกเป็นส่วนน้อยลง
2. เพิ่มเวลารอระหว่างการเรียก API:
   ```javascript
   Utilities.sleep(100); // รอ 100ms
   ```
3. ตัดสินใจ trigger ให้นานขึ้น (เช่น ทุก 24 ชั่วโมง แทน ทุกชั่วโมง)

---

### 12. QA Column ไม่ปรากฏ

**สาเหตุ**:
- Script ยังไม่สร้างคอลัมน์ QA
- ผู้รับแจ้ง (assignto) หรือผู้แจ้ง (ownerSubjectId) ไม่ตรงกับ `['6101', '6610', '6619']`

**วิธีแก้ไข**:
1. ตรวจสอบค่า `ownerSubjectId` และ `assignto` ว่าตรงกับรายชื่อในค่าคงที่ `QA_ASSIGNEES` หรือไม่
2. ถ้าต้องเปิ่นรายชื่อ ให้เพิ่มเติมใน Config:
   ```javascript
   const QA_ASSIGNEES = ['6101', '6610', '6619', '...'];
   ```
3. รัน Script ใหม่

---

### 13. Status Change Detection ไม่ทำงาน

**สาเหตุ**:
- ค่า `lastStatus` ยังไม่มี
- การเปรียบเทียบค่า status ไม่ถูกต้อง (spaces หรือ case)

**วิธีแก้ไข**:
1. ตรวจสอบว่าคอลัมน์ `lastStatus` มีอยู่หรือไม่
2. ตรวจสอบว่าค่า status ไม่มี spaces พิเศษ
3. ปรับ `statusChanged()` เพื่อลบ spaces:
   ```javascript
   function statusChanged(sheet, rowNumber, headerMap, newStatus) {
     const existingStatus = String(sheet.getRange(rowNumber, headerMap.lastStatus).getValue() || '').trim();
     return existingStatus !== String(newStatus || '').trim();
   }
   ```

---

### 14. Trigger ไม่ทำงาน

**สาเหตุ**:
- Trigger ยังไม่ได้ตั้ง
- Trigger ถูกลบ
- Script มี error ทำให้ trigger หยุดทำงาน

**วิธีแก้ไข**:
1. ตรวจสอบ **Executions** ว่าเคยรันหรือไม่
2. ตั้ง Trigger ใหม่ (ตามขั้นตอน DEPLOYMENT.md)
3. ตรวจสอบ logs เพื่อหา error
4. รัน Script ด้วยตัวเอง (click Run) เพื่อทดสอบ

---

### 15. Permission Denied for Moving File

**สาเหตุ**:
- Script ไม่มีสิทธิ์ย้ายไฟล์ไปถังขยะ
- ไฟล์อยู่ใน folder ที่ read-only

**วิธีแก้ไข**:
1. ตรวจสอบสิทธิ์ folder
2. ให้ edit access ให้กับ Google Account
3. หรือปิดการย้ายไฟล์ใน `moveOtherFilesToTrash()`

---

## วิธีการ Debug

### 1. ใช้ Logger
```javascript
Logger.log('ตัวแปร: ' + variable);
Logger.log('Object: ' + JSON.stringify(object));
```

### 2. ดู Logs ที่ Executions
1. คลิก **Executions** ใน Google Apps Script editor
2. คลิกรายการล่าสุด
3. ดู **Logs** section

### 3. ใช้ Breakpoints (Advanced)
```javascript
// ตั้งจุด pause ที่นี่
debugger;
```

### 4. ส่ง Email Debug
```javascript
MailApp.sendEmail('youremail@example.com', 'Debug Info', 'Data: ' + JSON.stringify(data));
```

---

## การหาปัญหาอื่นๆ

ถ้าพบปัญหาที่ไม่อยู่ในรายการ ให้:

1. **ตรวจสอบ Error Message**
   - ข้อความ error มักระบุสาเหตุ
   - ค้นหา error ใน Google

2. **ตรวจสอบ Logs**
   - ค้นหาจุดที่เกิด error

3. **ลองแบ่งส่วน**
   - ลองรัน function ทีละตัว
   - หาว่า function ไหนที่เป็นปัญหา

4. **ตรวจสอบ Data**
   - ข้อมูล input ถูกต้องหรือไม่
   - Output ที่คาดหวังคืออะไร

5. **ลองใหม่**
   - บางครั้ง error เป็นเรื่องชั่วคราว
   - ลองรัน Script ใหม่

---

## ติดต่อขอความช่วยเหลือ

หากปัญหายังไม่แก้ได้ ให้:

1. บันทึก **Error Message** ทั้งหมด
2. ถ่ายภาพ **Logs**
3. ตรวจสอบ **Data** ที่เป็นปัญหา
4. ติดต่อผู้พัฒนา หรือทีมสนับสนุน

