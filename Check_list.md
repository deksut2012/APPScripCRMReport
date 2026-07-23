# Checklist - ความเคลื่อนไหวของโปรเจค

## ขั้นตอนการจัดเตรียม
- [x] สร้าง Google Apps Script project
- [x] เปิด Advanced Google services (Drive API)
- [x] เปิด Google Cloud Project API (Drive API)
- [x] ให้สิทธิ์ script ในการอ่านไฟล์จาก Drive
- [x] ให้สิทธิ์ script ในการแก้ไข Spreadsheet
- [x] ติดตั้ง Node.js และ `@google/clasp`
- [x] ตั้งค่า `.clasp.json` และ push ขึ้น Apps Script ได้

## ฟังก์ชันการอ่านไฟล์ Excel
- [x] สร้างฟังก์ชัน `getExcelFilesInFolder(folderId)` - หา Excel ทั้งหมด
- [x] สร้างฟังก์ชัน `getLatestExcelFileInFolder(folderId)` - หาไฟล์ล่าสุด
- [x] สร้างฟังก์ชัน `moveOtherFilesToTrash(files, keepFile)` - ย้ายไฟล์อื่นไปถังขยะ
- [x] สร้างฟังก์ชัน `convertExcelToSpreadsheet(file)` - แปลง Excel เป็น Spreadsheet
- [x] เพิ่ม fallback อ่าน `.xlsx` โดยตรงเมื่อ Drive conversion ไม่รองรับ
- [x] ลบ/ย้ายไฟล์ Excel ต้นทางหลังประมวลผลสำเร็จ
- [x] ลบไฟล์ converted/temp ที่เหลือหลังทำงานเสร็จ

## ฟังก์ชันอ่านข้อมูล
- [x] สร้างฟังก์ชัน `readDataFromSpreadsheet(spreadsheet)` - อ่านข้อมูลจาก Sheet
- [x] สร้างฟังก์ชัน `readDataFromExcelFile(file)` - อ่านข้อมูลจากไฟล์ Excel โดยตรง
- [x] สร้างฟังก์ชัน `normalizeRow(rawRow)` - จัดรูปแบบข้อมูลในแถว
- [x] รองรับข้อมูลต้นทางแบบ `fd` และ `answers`
- [x] สร้างฟังก์ชัน `parseDate(value)` - แปลงค่าวันที่
- [x] สร้างฟังก์ชัน `formatThaiDate(dateValue)` - แปลงเป็นรูปแบบไทย `dd/MM/yyyy HH:mm:ss`
- [x] กรองเฉพาะ `sysserViceTypeName` ตามรายการที่อนุญาต

## ฟังก์ชันจัดการ Google Sheet เป้าหมาย
- [x] สร้างฟังก์ชัน `extractYearFromData(rawData)` - หาปีจากข้อมูล
- [x] สร้างฟังก์ชัน `getSheetByYear(spreadsheet, year)` - หาหรือสร้างชีทตามปี
- [x] สร้างฟังก์ชัน `buildHeaderMap(sheet)` - สร้างตัวแมปหัวคอลัมน์
- [x] สร้างฟังก์ชัน `ensureColumns(sheet, map)` - ตรวจสอบและเพิ่มคอลัมน์ที่ขาด
- [x] รองรับ alias header เช่น `ผูรับแจ้ง`

## ฟังก์ชันลงข้อมูล
- [x] สร้างฟังก์ชัน `processRow(sheet, rowData, headerMap)` - ประมวลผลและลงข้อมูล
- [x] สร้างฟังก์ชัน `buildUpdateData(rowData, headerMap)` - สร้างข้อมูลสำหรับอัปเดต
- [x] สร้างฟังก์ชัน `processAllRows(sheet, dataRows, headerMap)` - ประมวลผลข้อมูลทั้งหมด
- [x] สร้างฟังก์ชัน `setRowValues(sheet, row, values)` - เขียนข้อมูลลงชีท
- [x] ปรับให้ทำงานแบบ batch เพื่อรองรับข้อมูลจำนวนมาก
- [x] อ่านข้อมูลเดิมครั้งเดียวและสร้าง index จาก `jobNo`
- [x] เรียงข้อมูลตาม `contactDate` จากน้อยไปมาก
- [x] sort ทั้งชีทเฉพาะเมื่อจำเป็น เพื่อลดเวลาในการทำงาน

## ตรวจสอบ jobNo และอัปเดตข้อมูล
- [x] ตรวจสอบ jobNo ซ้ำหรือไม่
- [x] ถ้าซ้ำ ให้ตรวจสอบการเปลี่ยนแปลงของ `assignto` และ `status`
- [x] ถ้ามีการเปลี่ยนแปลง ให้อัปเดตข้อมูลล่าสุด
- [x] บันทึก `lastStatus` และ `updatedAt` เมื่ออัปเดต
- [x] เพิ่ม `lastEmailKey` เพื่อกันส่งเมลซ้ำจาก `jobNo + status + assignto`

## ผู้รับเรื่องหลัก
- [x] เพิ่มคอลัมน์ `originalAssignto` / `ผู้รับเรื่องหลัก`
- [x] บันทึก `originalAssignto` เฉพาะตอน `status = Continue` ครั้งแรก
- [x] ใช้ `assignto` ณ ตอนที่เป็น `Continue` ครั้งแรกเป็นผู้รับเรื่องหลัก
- [x] ไม่เขียนทับ `originalAssignto` เมื่อ `assignto` เปลี่ยนไป DEV/ทดสอบ/ส่งคืนเจ้าของเรื่อง
- [x] Report Summary นับจาก `originalAssignto` หรือ `ownerSubjectId` เท่านั้น
- [x] Report Summary นับ `DEV/sysDevelop` เพิ่มเฉพาะผู้รับที่อยู่ใน `DEV_ASSIGNEES`

## ฟังก์ชันจัดการ QA
- [x] เพิ่มการตรวจสอบ `ownerSubjectId` และ `assignto`
- [x] เขียนค่า `QA` ในคอลัมน์ QA หากตรงเงื่อนไข (6101, 6610, 6619)
- [x] สร้างคอลัมน์ QA เมื่อไม่มีอยู่

## กลุ่มพนักงาน
- [x] เพิ่ม `EMPLOYEE_DEPARTMENTS` ใน `Config.gs`
- [x] แบ่งกลุ่ม `QA`: `6101`, `6619`, `6610`
- [x] แบ่งกลุ่ม `DEV`: `4208`, `5636`, `5640`, `5834`, `6620`, `6529`, `6305`, `6318`, `6137`
- [x] แบ่งกลุ่ม `ACCOUNT`: `5433`
- [x] แบ่งกลุ่ม `SUPPORT`: `5264`, `5627`, `5703`, `5725`, `5807`, `6001`, `6132`, `6136`, `6303`, `6409`, `6511`, `6512`, `6612`, `6702`, `6710`, `6738`, `6901`, `6907`, `6910`
- [x] เพิ่ม helper `getEmployeeDepartment()` สำหรับหาแผนกจากรหัสพนักงาน

## ฟังก์ชันการส่งอีเมล
- [x] สร้างฟังก์ชัน `shouldProcessForEmail(status, existingStatus)` - ตรวจสอบเงื่อนไขการส่ง
- [x] สร้างฟังก์ชัน `sendNotificationEmail(sheet, rowIndex, rowData, headerMap)` - ส่งอีเมลเมื่อจำเป็น
- [x] สร้างฟังก์ชัน `sendNotificationEmails(sheet, rowsToNotify, headerMap)` - ส่งอีเมลหลายรายการ
- [x] สร้างฟังก์ชัน `getEmailForAssignto(assignto)` - หาอีเมลจากชีท EMAIL
- [x] เพิ่ม `getEmailContactMap()` เพื่ออ่าน `name` จากชีท EMAIL
- [x] เพิ่ม `EMAIL_LOG` เป็นชีทหลักสำหรับบันทึกประวัติการส่งอีเมล
- [x] ใช้ `EMAIL_LOG.emailKey` กันส่งอีเมลแจ้งเตือนซ้ำ และ fallback ไป `lastEmailKey` เดิม
- [x] แสดง `ผู้แจ้ง`, `ผู้รับแจ้ง`, `DEV` เป็นรูปแบบ `รหัส ชื่อ`
- [x] เพิ่มฟังก์ชันทดสอบ `testSendEmailTo6101()`

## ฟังก์ชันสร้างเนื้อหาอีเมลแจ้งเตือน
- [x] สร้างฟังก์ชัน `buildEmailBody(sheet, rowIndex, rowData, headerMap)` - สร้างเนื้อหาอีเมล HTML
- [x] สร้างฟังก์ชัน `escapeHtml(text)` - ป้องกัน HTML injection
- [x] ออกแบบเมลให้สวยงามและรองรับมือถือ
- [x] แยก Summary ออกจากเมลแจ้งเตือนราย Job
- [x] เพิ่มลิงก์ Job Details สำหรับ `BHD` และ `BFR`
- [x] ให้ `Job No` และ `เรื่องที่แจ้ง` คลิกลิงก์ได้
- [x] เอาปุ่ม `เปิดรายละเอียดงาน` ออกจากเมลแจ้งเตือน
- [x] เพิ่มส่วน `ติดตาม Flow งาน` ในเมลแจ้งเตือนสถานะ
- [x] แสดง flow ล่าสุดว่าอยู่สถานะไหน กับผู้รับแจ้ง/DEV คนใด
- [x] อ่าน Flow Tracking จากชีท `FLOW_TRACKING` เป็นหลัก และ fallback ไปคอลัมน์ `flowTracking` หากยังไม่มีข้อมูลในชีทใหม่
- [x] หยุดเขียนประวัติใหม่ลงคอลัมน์ `flowTracking` ในชีทปี
- [x] ปรับ `testSendEmailTo6101()` ให้ทดสอบลิงก์และชื่อผู้เกี่ยวข้องได้
- [x] ปรับ `testSendEmailTo6101()` ให้ทดสอบ Flow Tracking ได้

## Report Summary
- [x] สร้างฟังก์ชัน `sendDailySummaryEmails()` สำหรับส่งรายงานสรุปของจริง
- [x] สร้างฟังก์ชัน `sendDailySummaryEmailsToQA()` สำหรับส่งรายงานสรุปเฉพาะกลุ่ม QA
- [x] สร้างฟังก์ชัน `sendDailySummaryEmailsToDEV()` สำหรับส่งรายงานสรุปเฉพาะกลุ่ม DEV
- [x] สร้างฟังก์ชัน `sendDailySummaryEmailsToAccount()` สำหรับส่งรายงานสรุปเฉพาะกลุ่ม Account
- [x] สร้างฟังก์ชัน `sendDailySummaryEmailsToSupport()` สำหรับส่งรายงานสรุปเฉพาะกลุ่ม Support
- [x] สร้างฟังก์ชันกลาง `sendDailySummaryEmailsToDepartment(department)` สำหรับส่ง Summary ตามแผนก
- [x] สร้างฟังก์ชัน `testSendDailySummaryTo6101()` สำหรับทดสอบรายงานสรุป
- [x] สร้างฟังก์ชัน `buildDailySummaryEmailBody(recipientId, relatedRows)`
- [x] สรุปจำนวนเคสเฉพาะสถานะ `Open`, `Continue`, `EditErr`, `Test`
- [x] นับเคสจาก `originalAssignto` หรือ `ownerSubjectId`
- [x] นับเคสจาก `DEV/sysDevelop` เพิ่มเฉพาะพนักงาน DEV: `4208`, `5636`, `5640`, `5834`, `6620`, `6529`, `6305`, `6318`, `6137`
- [x] แสดง `ผู้รับ` เป็นรูปแบบ `รหัส ชื่อ`
- [x] เพิ่มคอลัมน์ `ลำดับ`
- [x] แสดงวันที่แจ้งเป็น `dd/MM/yyyy HH:mm:ss` เวลาไทย
- [x] เพิ่มคอลัมน์ `จำนวนวัน`
- [x] เรียงรายการตาม `จำนวนวัน` จากมากไปน้อย
- [x] แยกรายการเป็นตารางตามสถานะ
- [x] แสดงครบทุกเคส ไม่จำกัด 30 รายการ
- [x] ไม่ส่ง CRM Report Summary ให้ผู้รับที่ไม่มีรายการในสถานะ `Open`, `Continue`, `EditErr`, `Test`
- [x] เพิ่มเมนู `Send Daily Summary`
- [x] เพิ่มเมนู `Send QA Summary`
- [x] เพิ่มเมนู `Send DEV Summary`
- [x] เพิ่มเมนู `Send Account Summary`
- [x] เพิ่มเมนู `Send Support Summary`
- [x] เพิ่มเมนู `Test Summary 6101`

## เงื่อนไขการส่งอีเมล
- [x] ไม่ส่ง ถ้า `status = Open`
- [x] ไม่ส่ง ถ้า `status = Close` หรือ `Closed`
- [x] ส่งถ้าเป็นสถานะอื่นและเป็นรายการใหม่
- [x] ส่งถ้าเป็นสถานะอื่นและ `status` หรือ `assignto` เปลี่ยนจากค่าเดิม
- [x] ตรวจสอบ `mailSent` status ป้องกันการส่งซ้ำ
- [x] ตรวจสอบ `lastEmailKey` เพื่อกันส่งซ้ำแม้ `mailSent` ว่างหรือไม่ถูกอัปเดต
- [x] เพิ่มฟังก์ชัน `markUnsentEmailRowsAsSentToday()` สำหรับ mark ข้อมูลเก่าที่ยัง `mailSent` ว่างให้เป็น `sent` พร้อมลง `lastEmailKey` ปัจจุบัน เพื่อกันส่งย้อนหลัง

## ชีท EMAIL
- [ ] สร้างชีท `EMAIL` (ถ้ายังไม่มี)
- [x] เพิ่มคอลัมน์ `assignto` ในชีท EMAIL
- [x] เพิ่มคอลัมน์ `email` ในชีท EMAIL
- [x] เพิ่มคอลัมน์ `name` ในชีท EMAIL
- [x] เพิ่มข้อมูล assignto, email, name ของผู้รับแจ้ง

## คอลัมน์เพิ่มเติม
- [x] `QA` - เก็บข้อมูล QA (auto fill เมื่อตรงเงื่อนไข)
- [x] `mailSent` - เก็บสถานะการส่งเมล (`sent` หรือ blank)
- [x] `lastEmailKey` - เก็บ key กันส่งเมลซ้ำ
- [x] `lastStatus` - เก็บสถานะก่อนหน้า
- [x] `updatedAt` - เก็บเวลาอัปเดตล่าสุด `dd/MM/yyyy HH:mm:ss`
- [x] `originalAssignto` / `ผู้รับเรื่องหลัก` - เก็บผู้รับเรื่องหลักตอน `Continue` ครั้งแรก
- [x] `flowTracking` - ข้อมูลเก่า/สำรองสำหรับ fallback เท่านั้น ไม่เขียนประวัติใหม่ลงคอลัมน์นี้แล้ว

## ชีท FLOW_TRACKING
- [x] สร้างชีท `FLOW_TRACKING` สำหรับเก็บประวัติ Flow งานแยกจากชีทปี
- [x] เพิ่มหัวคอลัมน์ `timestamp`, `jobNo`, `status`, `assignto`, `assigntoName`, `ownerSubjectId`, `ownerSubjectName`, `sysDevelop`, `sysDevelopName`, `eventType`, `sourceUpdatedAt`, `eventKey`
- [x] บันทึก event เมื่อเป็นงานใหม่ หรือมีการเปลี่ยน `status` / `assignto` / `DEV`
- [x] ใช้ `eventKey` จาก `jobNo + status + assignto + DEV` เพื่อกันบันทึกซ้ำ
- [x] เมลแจ้งเตือนสถานะอ่าน flow จากชีท `FLOW_TRACKING` ก่อน แล้วค่อย fallback ไปข้อมูลเก่า

## ชีท EMAIL_LOG
- [x] สร้างชีท `EMAIL_LOG` สำหรับเก็บประวัติการส่งอีเมลแยกจากชีทปี
- [x] เพิ่มหัวคอลัมน์ `timestamp`, `emailType`, `jobNo`, `status`, `assignto`, `assigntoName`, `email`, `emailKey`, `result`, `message`, `subject`
- [x] บันทึกอีเมลแจ้งเตือนราย Job เมื่อส่งสำเร็จหรือส่งล้มเหลว
- [x] บันทึกอีเมล `CRM Report Summary` เมื่อส่งสำเร็จหรือส่งล้มเหลว
- [x] บันทึกอีเมลทดสอบ `testSendEmailTo6101()` และ `testSendDailySummaryTo6101()`
- [x] คง `mailSent` / `lastEmailKey` ในชีทปีไว้เป็น fallback ช่วงเปลี่ยนผ่าน

## ฟังก์ชันหลัก
- [x] สร้างฟังก์ชัน `main()` - เรียกใช้ทั้งระบบ
- [x] เรียกใช้ `getLatestExcelFileInFolder()` หาไฟล์ล่าสุด
- [x] เรียกใช้ `moveOtherFilesToTrash()` ย้ายไฟล์เก่า
- [x] เรียกใช้ `convertExcelToSpreadsheet()` แปลงไฟล์
- [x] fallback ไป `readDataFromExcelFile()` หากแปลงไฟล์ไม่สำเร็จ
- [x] เรียกใช้ `readDataFromSpreadsheet()` อ่านข้อมูล
- [x] เรียกใช้ `getSheetByYear()` หาชีทตามปี
- [x] เรียกใช้ `buildHeaderMap()` สร้างแมป header
- [x] เรียกใช้ `processAllRows()` สำหรับ batch processing
- [x] ส่งอีเมลแจ้งเตือนจาก `rowsToNotify`
- [x] ลบไฟล์ Spreadsheet ชั่วคราวหลังเสร็จ
- [x] ย้ายไฟล์ Excel ต้นทางหลังประมวลผลสำเร็จ

## เมนู Google Sheet
- [x] เพิ่มเมนู `Run Sync`
- [x] เพิ่มเมนู `Install Main Trigger`
- [x] เพิ่มเมนู `Delete Main Trigger`
- [x] เพิ่มเมนู `Mark Unsent As Sent Today`
- [x] เพิ่มเมนู `Test Functions`
- [x] เพิ่มเมนู `Test Email 6101`
- [x] เพิ่มเมนู `Test Summary 6101`
- [x] เพิ่มเมนู `Send Daily Summary`
- [x] เพิ่มเมนู `Send QA Summary`
- [x] เพิ่มเมนู `Send DEV Summary`
- [x] เพิ่มเมนู `Send Account Summary`
- [x] เพิ่มเมนู `Send Support Summary`
- [x] เพิ่มเมนู `View Logs`

## การตั้ง Trigger
- [x] เพิ่มฟังก์ชัน `installMainTimeTrigger()` สำหรับตั้ง time-based trigger ให้รัน `main()`
  - [x] ตั้งค่าเริ่มต้นทุก 1 นาที เพื่อตรวจไฟล์ใหม่/ไฟล์ที่แก้ไขแบบ polling
  - [x] จำกัด `main()` ให้ทำงานเฉพาะวันจันทร์-ศุกร์ เวลา 09:00-18:30 ตามเวลาไทย
  - [x] เพิ่ม `LockService` ใน `main()` เพื่อกัน trigger รอบใหม่รันซ้อนกับรอบเดิม
  - [x] เพิ่มฟังก์ชัน `deleteMainTimeTriggers()` สำหรับลบ trigger เดิมของ `main()`
  - [x] เพิ่มฟังก์ชัน `listProjectTriggers()` สำหรับตรวจสอบ trigger ในโปรเจค
- [ ] ตั้ง trigger สำหรับ `sendDailySummaryEmails()` หากต้องการส่งรายงานอัตโนมัติ

## การทดสอบ
- [x] ทดสอบ syntax ของไฟล์ `.gs` ด้วย `node --check`
- [x] ทดสอบ push ด้วย `clasp push --force`
- [x] ทดสอบการอ่านไฟล์ Excel
- [x] ทดสอบการแปลงข้อมูล
- [x] ทดสอบ fallback อ่าน Excel โดยตรง
- [x] ทดสอบการลงข้อมูลเป้าหมาย (append)
- [x] ทดสอบการอัปเดตข้อมูล (update)
- [x] ทดสอบการส่งอีเมลแจ้งเตือนด้วย `testSendEmailTo6101()`
- [x] ทดสอบ Report Summary ด้วย `testSendDailySummaryTo6101()`
- [x] ทดสอบการตรวจสอบ jobNo ซ้ำ
- [x] ทดสอบการเพิ่มคอลัมน์ QA
- [x] ทดสอบการไม่ส่งอีเมลซ้ำด้วย `lastEmailKey`
- [x] ทดสอบวันที่เป็นรูปแบบไทย
- [x] ทดสอบลิงก์ Job Details สำหรับ `BHD` / `BFR`
- [x] ทดสอบรูปแบบรายงานสรุปแยกตามสถานะ

## ข้อมูลบันทึก / Logger
- [x] ตั้ง Logger เพื่อบันทึกการทำงาน
- [x] บันทึก error หากไม่สามารถอ่านไฟล์
- [x] บันทึก error หากไม่สามารถแปลงไฟล์
- [x] บันทึก error หากไม่สามารถเขียนข้อมูลลงเป้าหมาย
- [x] บันทึก error หากการส่งอีเมลล้มเหลว
- [x] บันทึก success เมื่อเสร็จสิ้นการทำงาน
- [x] เพิ่ม log สำหรับ Report Summary sent/skipped/failed

## ล้างข้อมูล
- [x] ลบ Spreadsheet ชั่วคราวหลังแปลงเรียบร้อย
- [x] ลบไฟล์ converted/temp ที่ค้าง
- [x] ย้ายไฟล์ Excel ที่ประมวลผลแล้วไปถังขยะ
- [x] ตรวจสอบไม่เหลือไฟล์ converted เพิ่มเติม

## เอกสารประกอบ
- [x] ✅ สร้าง `APP_SCRIPT_EXCEL_TO_GOOGLE_SHEET.md` - เอกสารรายละเอียด
- [x] ✅ สร้าง `Check_list.md` - ไฟล์นี้
- [x] ✅ อัปเดตเอกสารตาม flow ล่าสุด
- [ ] ตรวจสอบว่า `DEPLOYMENT.md` ยังตรงกับขั้นตอนล่าสุด
- [ ] ตรวจสอบว่า `TROUBLESHOOTING.md` ยังตรงกับปัญหาล่าสุด
- [ ] ตรวจสอบว่า `TEST.md` ยังตรงกับฟังก์ชันทดสอบล่าสุด

---

## หมายเหตุการทำงาน
- **วันที่สร้าง**: 12 มิถุนายน 2026
- **อัปเดตล่าสุด**: 15 มิถุนายน 2026
- **สถานะ**: พัฒนาและ push ขึ้น Apps Script แล้ว เหลือการตั้ง trigger/ตรวจเอกสารเสริม
- **ผู้พัฒนา**: Pond_QA / Codex

---

## เพิ่มเติม
ใช้ checklist นี้ในการติดตามความเคลื่อนไหว:
- ✅ = เสร็จสิ้น
- 🟡 = กำลังทำ (หากต้อง)
- ❌ = มีปัญหา (หากต้อง)
- [ ] = ยังไม่ทำ
