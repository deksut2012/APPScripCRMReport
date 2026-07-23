/**
 * EmailTemplate.gs - เทมเพลตและการสร้างเนื้อหาอีเมล
 * 
 * ฟังก์ชันสำหรับ:
 * - สร้างเนื้อหา email HTML
 * - สรุปสถานะงาน
 * - ป้องกัน HTML injection
 */

/**
 * สร้างเนื้อหาอีเมล HTML
 * @param {Sheet} sheet - Sheet object (เพื่อดึงข้อมูล summary)
 * @param {number} rowIndex - หมายเลขแถว
 * @param {Object} rowData - ข้อมูลแถว
 * @param {Object} headerMap - Header map
 * @return {string} HTML content ของ email
 */
let FLOW_TRACKING_EVENTS_CACHE = null;

function buildEmailBody(sheet, rowIndex, rowData, headerMap) {
  try {
    const detailsTable = buildDetailsTable(rowData);
    const flowTrackingSection = buildFlowTrackingSection(sheet, rowIndex, rowData, headerMap);
    const headerStatusColor = getStatusColor(rowData.status);
    const headerStatusTextColor = getStatusTextColor(rowData.status);
    const headerSubject = buildJobLinkHtml(rowData.jobNo, rowData.subject, 'header-subject');
    const headerStatus = escapeHtml(rowData.status || 'STATUS');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'DM Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.45;
            color: #0D1E1C;
            background-color: #E8F4F2;
            margin: 0;
            padding: 12px;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #F4FAFA;
            border: 1px solid rgba(26,122,110,0.15);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(13,30,28,0.08);
            overflow: hidden;
          }
          .header {
            background-color: #FFFFFF;
            color: #0D1E1C;
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid rgba(13,30,28,0.08);
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            background-color: transparent;
            border: 0;
            table-layout: fixed;
          }
          .header-table td {
            border: 0;
            padding: 0;
            vertical-align: middle;
          }
          .status-pill {
            display: inline-block;
            min-width: 76px;
            max-width: 112px;
            color: #0D1E1C;
            background-color: #F4FAFA;
            border: 1px solid rgba(26,122,110,0.15);
            border-radius: 100px;
            padding: 6px 10px;
            font-size: 12px;
            line-height: 1;
            font-weight: 800;
            text-transform: none;
            text-align: center;
          }
          .header-subject {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #0D1E1C;
            font-size: 15px;
            font-weight: 800;
            line-height: 1.25;
            padding-left: 10px;
          }
          .content {
            padding: 18px;
          }
          .section {
            margin-bottom: 16px;
          }
          .section h2 {
            font-size: 14px;
            border-bottom: 1px solid rgba(26,122,110,0.15);
            padding-bottom: 8px;
            margin: 0 0 10px 0;
            color: #1A7A6E;
            letter-spacing: -0.01em;
          }
          .section h3 {
            font-size: 14px;
            margin: 12px 0 8px 0;
            color: #0D1E1C;
          }
          .status-box {
            background-color: #FFFFFF;
            border-left: 4px solid #1A7A6E;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
          }
          .status-box strong {
            color: #1A7A6E;
          }
          .status-grid {
            display: table;
            width: 100%;
            border-spacing: 6px 0;
            margin-top: 8px;
          }
          .status-item {
            display: table-cell;
            width: 25%;
            vertical-align: top;
            padding: 10px 10px 9px 10px;
            border-radius: 8px;
            border: 1px solid rgba(13,30,28,0.08);
            box-shadow: 0 2px 8px rgba(13,30,28,0.05);
            text-align: center;
          }
          .status-item strong {
            display: block;
            font-size: 24px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 5px;
          }
          .status-item span {
            display: block;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.2;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 8px;
            background-color: #FFFFFF;
            border: 1px solid rgba(13,30,28,0.08);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 8px rgba(13,30,28,0.035);
          }
          table th {
            background-color: #F4FAFA;
            padding: 8px 10px;
            text-align: left;
            font-weight: 700;
            border-bottom: 1px solid rgba(13,30,28,0.08);
            font-size: 11px;
          }
          table td {
            padding: 8px 10px;
            border-bottom: 1px solid rgba(13,30,28,0.08);
            font-size: 12px;
            color: #0D1E1C;
          }
          table tr:hover {
            background-color: #F4FAFA;
          }
          .label {
            font-weight: 700;
            color: #3A5C58;
            width: 118px;
            background-color: #F4FAFA;
          }
          .footer {
            background-color: #DFF0EE;
            padding: 10px 16px;
            font-size: 11px;
            color: #6B8C88;
            text-align: center;
            border-top: 1px solid rgba(13,30,28,0.08);
          }
          .footer p {
            margin: 2px 0;
          }
          .updated-time {
            color: #3A5C58;
            margin-top: 2px;
            font-size: 11px;
            background-color: rgba(26,122,110,0.08);
            border: 1px solid rgba(26,122,110,0.15);
            border-radius: 100px;
            display: inline-block;
            padding: 5px 11px;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .container {
              border-radius: 12px;
            }
            .header {
              padding: 12px;
            }
            .status-pill {
              min-width: 64px;
              font-size: 11px;
              padding: 6px 8px;
            }
            .header-subject {
              font-size: 13px;
              padding-left: 8px;
            }
            .content {
              padding: 12px;
            }
            .status-grid {
              display: block;
            }
            .status-item {
              display: block;
              width: auto;
              margin: 0 0 10px 0;
            }
            table {
              font-size: 12px;
            }
            table th, table td {
              padding: 7px;
            }
            .label {
              width: 104px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <table class="header-table" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:28%; text-align:left;">
                  <span class="status-pill" style="background-color:${headerStatusColor}; color:${headerStatusTextColor};">${headerStatus}</span>
                </td>
                <td style="width:72%; text-align:left;">
                  ${headerSubject}
                </td>
              </tr>
            </table>
          </div>
          
          <div class="content">
            <!-- Job Details -->
            <div class="section">
              <h2>รายละเอียดงาน</h2>
              ${detailsTable}
            </div>

            ${flowTrackingSection}
            
            <!-- Updated Time -->
            <div class="updated-time">
              อัปเดตล่าสุด: ${escapeHtml(formatThaiDate(new Date()))}
            </div>
          </div>
          
          <div class="footer">
            <p>ข้อความนี้ถูกส่งโดยระบบ CRM Report เพื่อแจ้งสถานะงานอัตโนมัติ</p>
            <p>โปรดไม่ตอบกลับอีเมลนี้</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return html;
  } catch (e) {
    log('Error building email body: ' + e.message, LOG_LEVEL.ERROR);
    return '<p>Error generating email body</p>';
  }
}

/**
 * สรุปจำนวนเคสตามสถานะ
 * @param {Sheet} sheet - Sheet object
 * @param {Object} headerMap - Header map
 * @param {string} recipientAssignto - assignto ของผู้รับอีเมล
 * @return {string} HTML content ของ summary
 */
function buildStatusSummary(sheet, headerMap, recipientAssignto) {
  try {
    const rows = getRelatedJobRowsForRecipient(sheet, headerMap, recipientAssignto);
    return buildSummaryCardsFromRows(rows);
  } catch (e) {
    log('Error building status summary: ' + e.message, LOG_LEVEL.WARNING);
    return '<p>ไม่สามารถสรุปสถานะได้</p>';
  }
}

/**
 * สร้างเนื้อหาอีเมลรายงานสรุปแยกจากเมลแจ้งเตือนราย Job
 * @param {string} recipientId - ID ผู้รับรายงาน
 * @param {Array<Object>} relatedRows - รายการงานที่เกี่ยวข้องกับผู้รับ
 * @return {string} HTML content ของ summary email
 */
function buildDailySummaryEmailBody(recipientId, relatedRows) {
  try {
    const statusSummary = buildSummaryCardsFromRows(relatedRows);
    const jobList = buildSummaryJobList(relatedRows, recipientId);
    const today = Utilities.formatDate(new Date(), EMAIL_TIMEZONE, 'dd/MM/yyyy');
    const contactMap = getEmailContactMap();
    const recipientDisplayName = formatPersonWithName(recipientId, contactMap);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'DM Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.45;
            color: #0D1E1C;
            background-color: #E8F4F2;
            margin: 0;
            padding: 12px;
          }
          .container {
            max-width: 820px;
            margin: 0 auto;
            background-color: #F4FAFA;
            border: 1px solid rgba(26,122,110,0.15);
            border-radius: 12px;
            overflow: hidden;
          }
          .header {
            background-color: #FFFFFF;
            padding: 16px 18px;
            border-bottom: 1px solid rgba(13,30,28,0.08);
          }
          .eyebrow {
            display: inline-block;
            background: rgba(26,122,110,0.08);
            border: 1px solid rgba(26,122,110,0.15);
            border-radius: 100px;
            color: #1A7A6E;
            font-size: 11px;
            font-weight: 800;
            padding: 5px 10px;
          }
          .title {
            margin: 10px 0 0 0;
            font-size: 18px;
            line-height: 1.25;
            font-weight: 800;
          }
          .subtitle {
            margin: 4px 0 0 0;
            color: #3A5C58;
            font-size: 12px;
          }
          .content {
            padding: 18px;
          }
          .section {
            margin-bottom: 16px;
          }
          .section h2 {
            font-size: 14px;
            border-bottom: 1px solid rgba(26,122,110,0.15);
            padding-bottom: 8px;
            margin: 0 0 10px 0;
            color: #1A7A6E;
          }
          .status-grid {
            display: table;
            width: 100%;
            border-spacing: 6px 0;
            margin-top: 8px;
          }
          .status-item {
            display: table-cell;
            width: 25%;
            vertical-align: top;
            padding: 10px 10px 9px 10px;
            border-radius: 8px;
            border: 1px solid rgba(13,30,28,0.08);
            text-align: center;
          }
          .status-item strong {
            display: block;
            font-size: 24px;
            line-height: 1;
            font-weight: 800;
            margin-bottom: 5px;
          }
          .status-item span {
            display: block;
            font-size: 11px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 8px;
            background-color: #FFFFFF;
            border: 1px solid rgba(13,30,28,0.08);
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background-color: #F4FAFA;
            padding: 8px;
            text-align: left;
            font-size: 11px;
            color: #3A5C58;
          }
          td {
            padding: 8px;
            border-top: 1px solid rgba(13,30,28,0.08);
            font-size: 12px;
          }
          .summary-table {
            table-layout: fixed;
          }
          .summary-no {
            width: 42px;
            text-align: center;
          }
          .summary-job {
            width: 110px;
            white-space: nowrap;
          }
          .summary-assingto {
            width: 120px;
            white-space: nowrap;
          }
          .summary-date {
            width: 140px;
            white-space: nowrap;
          }
          .summary-age {
            width: 64px;
            text-align: center;
            white-space: nowrap;
          }
          .summary-subject {
            width: auto;
          }
          .summary-card-list {
            display: none;
          }
          .summary-card {
            background-color: #FFFFFF;
            border: 1px solid rgba(13,30,28,0.08);
            border-radius: 8px;
            margin: 8px 0;
            padding: 10px;
          }
          .summary-card-top {
            font-size: 11px;
            color: #6B8C88;
            margin-bottom: 4px;
          }
          .summary-card-job {
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .summary-card-subject {
            font-size: 12px;
            line-height: 1.35;
            margin-bottom: 8px;
          }
          .summary-card-meta {
            font-size: 11px;
            color: #3A5C58;
            line-height: 1.4;
          }
          .status-text {
            font-weight: 800;
          }
          .muted {
            color: #6B8C88;
            font-size: 11px;
          }
          .footer {
            background-color: #DFF0EE;
            padding: 10px 16px;
            font-size: 11px;
            color: #6B8C88;
            text-align: center;
          }
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            .content {
              padding: 12px;
            }
            .status-grid {
              display: block;
            }
            .status-item {
              display: block;
              width: auto;
              margin: 0 0 8px 0;
            }
            th, td {
              padding: 7px;
              font-size: 11px;
            }
            .summary-table {
              display: none;
            }
            .summary-card-list {
              display: block;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="eyebrow">CRM REPORT SUMMARY</span>
            <div class="title">สรุปรายงานงานที่เกี่ยวข้อง</div>
            <div class="subtitle">ผู้รับ: ${escapeHtml(recipientDisplayName)} | วันที่รายงาน: ${escapeHtml(today)}</div>
          </div>
          <div class="content">
            <div class="section">
              <h2>สรุปจำนวนเคสตามสถานะ</h2>
              ${statusSummary}
            </div>
            <div class="section">
              <h2>รายการงานที่ต้องติดตาม</h2>
              ${jobList}
            </div>
          </div>
          <div class="footer">
            ข้อความนี้ถูกส่งโดยระบบ CRM Report เพื่อสรุปสถานะงานอัตโนมัติ
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  } catch (e) {
    log('Error building daily summary email body: ' + e.message, LOG_LEVEL.ERROR);
    return '<p>Error generating summary email body</p>';
  }
}

/**
 * ดึงงานที่เกี่ยวข้องกับผู้รับ โดยนับ originalAssignto/ownerSubjectId และถ้าผู้รับเป็น DEV ให้นับ sysDevelop เพิ่ม โดยไม่ซ้ำ jobNo
 * @param {Sheet} sheet - Sheet object
 * @param {Object} headerMap - Header map
 * @param {string} recipientId - ID ผู้รับรายงาน
 * @return {Array<Object>} รายการงานที่เกี่ยวข้อง
 */
function getRelatedJobRowsForRecipient(sheet, headerMap, recipientId, includeQaRows) {
  const values = sheet.getDataRange().getValues();
  const normalizedRecipientId = normalizeId(recipientId);
  const relatedRows = [];
  const countedJobNo = {};
  const shouldIncludeDevWork = isDevAssignee(normalizedRecipientId);

  if (!normalizedRecipientId || values.length <= 1) {
    return relatedRows;
  }

  const indexes = {
    jobNo: headerMap.jobNo - 1,
    subject: headerMap.subject - 1,
    ownerSubjectId: headerMap.ownerSubjectId - 1,
    contactDate: headerMap.contactDate - 1,
    assignto: headerMap.assignto - 1,
    originalAssignto: headerMap.originalAssignto ? headerMap.originalAssignto - 1 : -1,
    sysserViceTypeName: headerMap.sysserViceTypeName - 1,
    status: headerMap.status - 1,
    productName: headerMap.productName - 1,
    sysDevelop: headerMap.sysDevelop - 1
  };

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const assignto = normalizeId(row[indexes.assignto]);
    const originalAssignto = indexes.originalAssignto !== -1
      ? normalizeId(row[indexes.originalAssignto])
      : '';
    const primaryAssignto = originalAssignto || assignto;
    const ownerSubjectId = normalizeId(row[indexes.ownerSubjectId]);
    const sysDevelop = normalizeId(row[indexes.sysDevelop]);
    const isRelatedToRecipient =
      primaryAssignto === normalizedRecipientId ||
      ownerSubjectId === normalizedRecipientId ||
      (shouldIncludeDevWork && sysDevelop === normalizedRecipientId);

    if (!isRelatedToRecipient) {
      continue;
    }

    const jobNo = String(row[indexes.jobNo] || '').trim();
    const countKey = jobNo || ('row-' + i);
    if (countedJobNo[countKey]) {
      continue;
    }

    countedJobNo[countKey] = true;
    relatedRows.push({
      jobNo: jobNo,
      subject: row[indexes.subject],
      ownerSubjectId: row[indexes.ownerSubjectId],
      contactDate: row[indexes.contactDate],
      assignto: row[indexes.assignto],
      originalAssignto: indexes.originalAssignto !== -1 ? row[indexes.originalAssignto] : '',
      sysserViceTypeName: row[indexes.sysserViceTypeName],
      status: row[indexes.status],
      productName: row[indexes.productName],
      sysDevelop: row[indexes.sysDevelop]
    });
  }

  return relatedRows;
}

/**
 * ตรวจสอบว่ารหัสผู้รับเป็นพนักงาน DEV หรือไม่
 * @param {*} assigntoId - รหัสพนักงาน
 * @return {boolean} true ถ้าเป็น DEV
 */
function isDevAssignee(assigntoId) {
  return getEmployeeDepartment(assigntoId) === 'DEV';
}

/**
 * หาแผนกของพนักงานจากรหัส
 * @param {*} assigntoId - รหัสพนักงาน
 * @return {string} ชื่อแผนก หรือค่าว่างถ้าไม่พบ
 */
function getEmployeeDepartment(assigntoId) {
  const normalizedId = normalizeId(assigntoId);
  const departments = Object.keys(EMPLOYEE_DEPARTMENTS);

  for (let i = 0; i < departments.length; i++) {
    const department = departments[i];
    if (EMPLOYEE_DEPARTMENTS[department].indexOf(normalizedId) !== -1) {
      return department;
    }
  }

  return '';
}

/**
 * สร้าง card สรุปสถานะ 4 สถานะหลักจากรายการงาน
 * @param {Array<Object>} rows - รายการงาน
 * @return {string} HTML card summary
 */
function buildSummaryCardsFromRows(rows) {
  const summary = {};
  const statuses = ['Open', 'Continue', 'EditErr', 'Test'];

  statuses.forEach((status) => {
    summary[status] = 0;
  });

  rows.forEach((row) => {
    const status = normalizeSummaryStatus(row.status);
    if (status) {
      summary[status]++;
    }
  });

  let html = '<div class="status-grid">';
  statuses.forEach((status) => {
    const color = getStatusColor(status);
    const textColor = getStatusTextColor(status);
    html += `
      <div class="status-item" style="background-color:${color}; color:${textColor};">
        <strong style="color:${textColor};">${summary[status]}</strong>
        <span style="color:${textColor};">${escapeHtml(status)}</span>
      </div>
    `;
  });
  html += '</div>';

  return html;
}

/**
 * สร้างตารางรายการงานสำหรับอีเมล summary
 * @param {Array<Object>} rows - รายการงาน
 * @return {string} HTML table
 */
function buildSummaryJobList(rows, recipientId) {
  const trackedRows = rows
    .filter((row) => normalizeSummaryStatus(row.status))
    .sort(compareRowsByCaseAgeDaysDesc);
  const statuses = ['Open', 'Continue', 'EditErr', 'Test'];
  const contactMap = getEmailContactMap();
  const normalizedRecipientId = normalizeId(recipientId);

  if (trackedRows.length === 0) {
    return '<p class="muted">ไม่มีรายการในสถานะ Open, Continue, EditErr หรือ Test</p>';
  }

  let html = '<p class="muted">รวมทั้งหมด ' + trackedRows.length + ' รายการ</p>';
  const assingtoMatchedRows = normalizedRecipientId
    ? trackedRows.filter((row) => normalizeId(row.assignto) === normalizedRecipientId)
    : [];
  const otherRelatedRows = normalizedRecipientId
    ? trackedRows.filter((row) => normalizeId(row.assignto) !== normalizedRecipientId)
    : trackedRows;

  if (assingtoMatchedRows.length > 0) {
    html += buildSummaryJobGroup('Assingto ตรงกับผู้รับอีเมล', assingtoMatchedRows, statuses, contactMap);
  }

  if (otherRelatedRows.length > 0) {
    const title = assingtoMatchedRows.length > 0 ? 'งานเกี่ยวข้องอื่น' : 'รายการงาน';
    html += buildSummaryJobGroup(title, otherRelatedRows, statuses, contactMap);
  }

  return html;
}

/**
 * สร้างกลุ่มรายการงานใน Report Summary โดยแยกตามสถานะ
 * @param {string} title - ชื่อกลุ่ม
 * @param {Array<Object>} rows - รายการงาน
 * @param {Array<string>} statuses - สถานะที่ต้องแสดง
 * @param {Object} contactMap - map จาก getEmailContactMap
 * @return {string} HTML table/card group
 */
function buildSummaryJobGroup(title, rows, statuses, contactMap) {
  let html = '<h3 style="font-size:13px; color:#1A7A6E; margin:16px 0 8px 0;">' + escapeHtml(title) + ' (' + rows.length + ')</h3>';

  statuses.forEach((status) => {
    const statusRows = rows.filter((row) => normalizeSummaryStatus(row.status) === status);
    if (statusRows.length === 0) {
      return;
    }

    html += `
      <h3 style="font-size:13px; color:#0D1E1C; margin:14px 0 6px 0;">${escapeHtml(status)} (${statusRows.length})</h3>
      <table class="summary-table">
        <tr>
          <th class="summary-no">ลำดับ</th>
          <th class="summary-job">Job No</th>
          <th class="summary-subject">เรื่องที่แจ้ง</th>
          <th class="summary-assingto">Assingto</th>
          <th class="summary-date">วันที่แจ้ง</th>
          <th class="summary-age">จำนวนวัน</th>
        </tr>
    `;

    statusRows.forEach((row, index) => {
      html += `
        <tr>
          <td class="summary-no">${index + 1}</td>
          <td class="summary-job">${buildJobLinkHtml(row.jobNo, row.jobNo, '')}</td>
          <td class="summary-subject">${buildJobLinkHtml(row.jobNo, truncateText(row.subject, 90), '')}</td>
          <td class="summary-assingto">${escapeHtml(formatPersonWithName(row.assignto, contactMap) || '-')}</td>
          <td class="summary-date">${escapeHtml(formatSummaryContactDate(row.contactDate))}</td>
          <td class="summary-age">${escapeHtml(getCaseAgeDays(row.contactDate))}</td>
        </tr>
      `;
    });

    html += '</table>';
    html += '<div class="summary-card-list">';

    statusRows.forEach((row, index) => {
      html += `
        <div class="summary-card">
          <div class="summary-card-top">#${index + 1} | ${escapeHtml(status)}</div>
          <div class="summary-card-job">${buildJobLinkHtml(row.jobNo, row.jobNo, '')}</div>
          <div class="summary-card-subject">${buildJobLinkHtml(row.jobNo, truncateText(row.subject, 120), '')}</div>
          <div class="summary-card-meta">
            Assingto: ${escapeHtml(formatPersonWithName(row.assignto, contactMap) || '-')}<br>
            วันที่แจ้ง: ${escapeHtml(formatSummaryContactDate(row.contactDate))}<br>
            จำนวนวัน: ${escapeHtml(getCaseAgeDays(row.contactDate))}
          </div>
        </div>
      `;
    });

    html += '</div>';
  });

  return html;
}

/**
 * สร้าง HTML table ของรายละเอียดงาน
 * @param {Object} rowData - ข้อมูลแถว
 * @return {string} HTML table
 */
function buildDetailsTable(rowData) {
  try {
    const contactMap = getEmailContactMap();
    const html = `
      <table>
        <tr>
          <th class="label">Job No</th>
          <td>${buildJobLinkHtml(rowData.jobNo, rowData.jobNo, '')}</td>
        </tr>
        <tr>
          <th class="label">เรื่องที่แจ้ง</th>
          <td>${buildJobLinkHtml(rowData.jobNo, rowData.subject, '')}</td>
        </tr>
        <tr>
          <th class="label">ผู้แจ้ง</th>
          <td>${escapeHtml(formatPersonWithName(rowData.ownerSubjectId, contactMap))}</td>
        </tr>
        <tr>
          <th class="label">วันที่แจ้ง</th>
          <td>${escapeHtml(rowData.contactDate)}</td>
        </tr>
        <tr>
          <th class="label">ผู้รับแจ้ง</th>
          <td>${escapeHtml(formatPersonWithName(rowData.assignto, contactMap))}</td>
        </tr>
        <tr>
          <th class="label">ประเภทบริการ</th>
          <td>${escapeHtml(rowData.sysserViceTypeName)}</td>
        </tr>
        <tr>
          <th class="label">สถานะ</th>
          <td><strong>${escapeHtml(rowData.status)}</strong></td>
        </tr>
        <tr>
          <th class="label">โปรแกรม</th>
          <td>${escapeHtml(rowData.productName)}</td>
        </tr>
        <tr>
          <th class="label">DEV</th>
          <td>${escapeHtml(formatPersonWithName(rowData.sysDevelop, contactMap))}</td>
        </tr>
      </table>
    `;
    
    return html;
  } catch (e) {
    log('Error building details table: ' + e.message, LOG_LEVEL.ERROR);
    return '<p>Error generating details table</p>';
  }
}

/**
 * สร้างส่วน Flow Tracking สำหรับเมลแจ้งสถานะงาน
 * @param {Sheet} sheet - Sheet object
 * @param {number} rowIndex - หมายเลขแถว
 * @param {Object} rowData - ข้อมูลแถว
 * @param {Object} headerMap - Header map
 * @return {string} HTML section
 */
function buildFlowTrackingSection(sheet, rowIndex, rowData, headerMap) {
  try {
    let events = getFlowTrackingEventsFromSheet(rowData && rowData.jobNo);

    if (events.length === 0) {
      const flowTrackingText = getFlowTrackingText(sheet, rowIndex, rowData, headerMap);
      events = parseFlowTrackingEvents(flowTrackingText);
    }

    if (events.length === 0) {
      return '';
    }

    const contactMap = getEmailContactMap();
    const latest = events[events.length - 1];
    let html = `
      <div class="section">
        <h2>ติดตาม Flow งาน</h2>
        <div style="background:#FFFFFF; border:1px solid rgba(13,30,28,0.08); border-radius:8px; padding:10px; margin-bottom:8px;">
          <div style="font-size:11px; color:#6B8C88; font-weight:700;">ล่าสุด</div>
          <div style="font-size:13px; font-weight:800; color:#0D1E1C; margin-top:2px;">
            ${escapeHtml(latest.status || '-')} | ผู้รับแจ้ง: ${escapeHtml(formatPersonWithName(latest.assignto, contactMap) || '-')} | DEV: ${escapeHtml(formatPersonWithName(latest.sysDevelop, contactMap) || '-')}
          </div>
          <div style="font-size:11px; color:#6B8C88; margin-top:2px;">${escapeHtml(formatFlowTrackingTimestamp(latest.timestamp))}</div>
        </div>
        <table>
          <tr>
            <th>ลำดับ</th>
            <th>เวลา</th>
            <th>สถานะ</th>
            <th>ผู้รับแจ้ง</th>
            <th>DEV</th>
          </tr>
    `;

    events.forEach((event, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(formatFlowTrackingTimestamp(event.timestamp))}</td>
          <td><strong>${escapeHtml(event.status)}</strong></td>
          <td>${escapeHtml(formatPersonWithName(event.assignto, contactMap))}</td>
          <td>${escapeHtml(formatPersonWithName(event.sysDevelop, contactMap))}</td>
        </tr>
      `;
    });

    html += `
        </table>
      </div>
    `;

    return html;
  } catch (e) {
    log('Error building flow tracking section: ' + e.message, LOG_LEVEL.WARNING);
    return '';
  }
}

/**
 * แสดงเวลา Flow Tracking เป็น dd/MM/yyyy HH:mm:ss เวลาไทย
 * @param {*} value - timestamp จาก FLOW_TRACKING หรือ flowTracking เดิม
 * @return {string} วันที่เวลาที่จัดรูปแบบแล้ว
 */
function formatFlowTrackingTimestamp(value) {
  const date = parseContactDateValue(value);

  if (!date) {
    return String(value || '').trim();
  }

  return Utilities.formatDate(date, EMAIL_TIMEZONE, DATE_TIME_FORMAT);
}

/**
 * อ่าน flow events จากชีท FLOW_TRACKING ตาม jobNo
 * @param {*} jobNo - Job No
 * @return {Array<Object>} events
 */
function getFlowTrackingEventsIndex() {
  if (FLOW_TRACKING_EVENTS_CACHE) {
    return FLOW_TRACKING_EVENTS_CACHE;
  }

  FLOW_TRACKING_EVENTS_CACHE = {};

  try {
    const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
    const flowSheet = ss.getSheetByName(FLOW_TRACKING_SHEET_NAME);

    if (!flowSheet || flowSheet.getLastRow() <= 1) {
      return FLOW_TRACKING_EVENTS_CACHE;
    }

    const flowHeaderMap = buildFlowTrackingHeaderMap(flowSheet);
    const maxCol = getMaxHeaderColumn(flowHeaderMap);
    const rows = flowSheet.getRange(2, 1, flowSheet.getLastRow() - 1, maxCol).getValues();

    rows.forEach((row) => {
      const rowJobNo = String(row[flowHeaderMap.jobNo - 1] || '').trim();
      if (!rowJobNo) return;

      if (!FLOW_TRACKING_EVENTS_CACHE[rowJobNo]) {
        FLOW_TRACKING_EVENTS_CACHE[rowJobNo] = [];
      }

      FLOW_TRACKING_EVENTS_CACHE[rowJobNo].push({
        timestamp: row[flowHeaderMap.timestamp - 1],
        status: row[flowHeaderMap.status - 1],
        assignto: row[flowHeaderMap.assignto - 1],
        assigntoName: flowHeaderMap.assigntoName ? row[flowHeaderMap.assigntoName - 1] : '',
        sysDevelop: row[flowHeaderMap.sysDevelop - 1],
        sysDevelopName: flowHeaderMap.sysDevelopName ? row[flowHeaderMap.sysDevelopName - 1] : '',
        eventType: flowHeaderMap.eventType ? row[flowHeaderMap.eventType - 1] : ''
      });
    });

    Object.keys(FLOW_TRACKING_EVENTS_CACHE).forEach((key) => {
      FLOW_TRACKING_EVENTS_CACHE[key].sort(compareFlowTrackingEventsByTimestamp);
    });
  } catch (e) {
    log('Error reading flow tracking sheet: ' + e.message, LOG_LEVEL.WARNING);
  }

  return FLOW_TRACKING_EVENTS_CACHE;
}

function getFlowTrackingEventsFromSheet(jobNo) {
  try {
    const normalizedJobNo = String(jobNo || '').trim();

    if (!normalizedJobNo) {
      return [];
    }

    const eventsIndex = getFlowTrackingEventsIndex();
    return eventsIndex[normalizedJobNo] ? eventsIndex[normalizedJobNo].slice() : [];

    const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
    const flowSheet = ss.getSheetByName(FLOW_TRACKING_SHEET_NAME);

    if (!flowSheet || flowSheet.getLastRow() <= 1) {
      return [];
    }

    const flowHeaderMap = buildFlowTrackingHeaderMap(flowSheet);
    const maxCol = getMaxHeaderColumn(flowHeaderMap);
    const rows = flowSheet.getRange(2, 1, flowSheet.getLastRow() - 1, maxCol).getValues();
    const events = [];

    rows.forEach((row) => {
      const rowJobNo = String(row[flowHeaderMap.jobNo - 1] || '').trim();

      if (rowJobNo !== normalizedJobNo) {
        return;
      }

      events.push({
        timestamp: row[flowHeaderMap.timestamp - 1],
        status: row[flowHeaderMap.status - 1],
        assignto: row[flowHeaderMap.assignto - 1],
        assigntoName: flowHeaderMap.assigntoName ? row[flowHeaderMap.assigntoName - 1] : '',
        sysDevelop: row[flowHeaderMap.sysDevelop - 1],
        sysDevelopName: flowHeaderMap.sysDevelopName ? row[flowHeaderMap.sysDevelopName - 1] : '',
        eventType: flowHeaderMap.eventType ? row[flowHeaderMap.eventType - 1] : ''
      });
    });

    events.sort(compareFlowTrackingEventsByTimestamp);
    return events;
  } catch (e) {
    log('Error reading flow tracking sheet: ' + e.message, LOG_LEVEL.WARNING);
    return [];
  }
}

/**
 * เรียง flow events ตาม timestamp จากเก่าไปใหม่
 * @param {Object} a - event แรก
 * @param {Object} b - event ที่สอง
 * @return {number} sort order
 */
function compareFlowTrackingEventsByTimestamp(a, b) {
  const dateA = parseContactDateValue(a && a.timestamp);
  const dateB = parseContactDateValue(b && b.timestamp);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA.getTime() - dateB.getTime();
}

/**
 * อ่าน flowTracking จาก rowData หรือจากชีท ถ้าไม่มีให้สร้างจากสถานะปัจจุบัน
 * @param {Sheet} sheet - Sheet object
 * @param {number} rowIndex - หมายเลขแถว
 * @param {Object} rowData - ข้อมูลแถว
 * @param {Object} headerMap - Header map
 * @return {string} flowTracking
 */
function getFlowTrackingText(sheet, rowIndex, rowData, headerMap) {
  if (rowData && rowData.flowTracking) {
    return String(rowData.flowTracking || '').trim();
  }

  if (sheet && rowIndex > 0 && headerMap && headerMap.flowTracking) {
    const value = getCellValue(sheet, rowIndex, headerMap.flowTracking);
    if (value) {
      return String(value || '').trim();
    }
  }

  return [
    formatThaiDate(new Date()),
    String((rowData && rowData.status) || '').trim(),
    String((rowData && rowData.assignto) || '').trim(),
    String((rowData && rowData.sysDevelop) || '').trim()
  ].join('\t');
}

/**
 * แปลง flowTracking text เป็น event objects
 * @param {string} flowTrackingText - flowTracking text
 * @return {Array<Object>} events
 */
function parseFlowTrackingEvents(flowTrackingText) {
  const text = String(flowTrackingText || '').trim();

  if (!text) {
    return [];
  }

  return text.split('\n').map((line) => {
    const parts = String(line || '').split('\t');
    return {
      timestamp: parts[0] || '',
      status: parts[1] || '',
      assignto: parts[2] || '',
      sysDevelop: parts[3] || ''
    };
  }).filter((event) => event.timestamp || event.status || event.assignto || event.sysDevelop);
}

/**
 * แสดงรหัสต่อด้วยชื่อจากชีท EMAIL เช่น 6101 เหรียญทอง
 * @param {*} personId - รหัสผู้ใช้
 * @param {Object} contactMap - map จาก getEmailContactMap
 * @return {string} ข้อความสำหรับแสดงในอีเมล
 */
function formatPersonWithName(personId, contactMap) {
  const id = String(personId || '').trim();

  if (!id) {
    return '';
  }

  const contact = contactMap && contactMap[id];
  const name = contact ? String(contact.name || '').trim() : '';

  return name ? id + ' ' + name : id;
}

/**
 * ป้องกัน HTML Injection โดยเขียน HTML characters
 * @param {string} text - ข้อความที่ต้องป้องกัน
 * @return {string} ข้อความที่ป้องกันแล้ว
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * สร้าง URL หน้า Job Details ตาม prefix ของ Job No
 * @param {*} jobNo - Job No
 * @return {string} URL หรือค่าว่างถ้าไม่รองรับ
 */
function buildJobDetailUrl(jobNo) {
  const value = String(jobNo || '').trim();
  const upperValue = value.toUpperCase();
  const encodedJobNo = encodeURIComponent(value);

  if (upperValue.indexOf('BHD') === 0) {
    return 'https://bluesea.seniorsoft.com/bluesea/BookLicence/MA/Support/JobDetailsHD?JobNo=' + encodedJobNo + '&JobType=HD';
  }

  if (upperValue.indexOf('BFR') === 0) {
    return 'https://bluesea.seniorsoft.com/bluesea/BookLicence/MA/Support/JobDetailsFR?JobNo=' + encodedJobNo + '&JobType=FR';
  }

  return '';
}

/**
 * สร้าง HTML link สำหรับ Job No หรือ Subject ถ้า Job No รองรับลิงก์
 * @param {*} jobNo - Job No
 * @param {*} text - ข้อความที่จะแสดง
 * @param {string} className - CSS class สำหรับ tag
 * @return {string} HTML text/link ที่ escape แล้ว
 */
function buildJobLinkHtml(jobNo, text, className) {
  const url = buildJobDetailUrl(jobNo);
  const safeText = escapeHtml(text);
  const safeClassName = String(className || '').trim();
  const classAttribute = safeClassName ? ' class="' + escapeHtml(safeClassName) + '"' : '';
  const inlineStyle = safeClassName ? '' : ' style="color:#0F766E; font-weight:700; text-decoration:none;"';

  if (!url) {
    return safeClassName ? '<span' + classAttribute + '>' + safeText + '</span>' : safeText;
  }

  return '<a href="' + escapeHtml(url) + '"' + classAttribute + inlineStyle + ' target="_blank" rel="noopener noreferrer">' + safeText + '</a>';
}

/**
 * หา card color ที่เหมาะสมสำหรับแต่ละสถานะ
 * @param {string} status - สถานะ
 * @return {string} CSS color
 */
function getStatusColor(status) {
  const statusLower = String(status || '').trim().toLowerCase();
  
  const colorMap = {
    'open': '#DCDCDC',
    'continue': '#FFA500',
    'editerr': '#FF4500',
    'test': '#4169E1'
  };
  
  return colorMap[statusLower] || '#FFFFFF';
}

/**
 * แปลง status เป็นชื่อมาตรฐานสำหรับ summary เฉพาะ 4 สถานะ
 * @param {string} status - สถานะ
 * @return {string} Open, Continue, EditErr, Test หรือ ''
 */
function normalizeSummaryStatus(status) {
  const statusLower = String(status || '').trim().toLowerCase();

  const statusMap = {
    'open': 'Open',
    'continue': 'Continue',
    'editerr': 'EditErr',
    'test': 'Test'
  };

  return statusMap[statusLower] || '';
}

/**
 * ตัดข้อความให้สั้นลงสำหรับแสดงในอีเมล
 * @param {*} value - ข้อความต้นทาง
 * @param {number} maxLength - จำนวนตัวอักษรสูงสุด
 * @return {string} ข้อความที่ตัดแล้ว
 */
function truncateText(value, maxLength) {
  const text = String(value || '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * แสดงวันที่แจ้งใน Report Summary เป็น dd/MM/yyyy HH:mm:ss เวลาไทย
 * @param {*} value - วันที่แจ้ง
 * @return {string} วันที่ที่จัดรูปแบบแล้ว
 */
function formatSummaryContactDate(value) {
  const date = parseContactDateValue(value);

  if (!date) {
    return String(value || '').trim();
  }

  return Utilities.formatDate(date, EMAIL_TIMEZONE, DATE_TIME_FORMAT);
}

/**
 * คำนวณจำนวนวันที่ส่งเคสมา นับจาก contactDate ถึงเวลาปัจจุบัน
 * @param {*} value - วันที่แจ้ง
 * @return {string} จำนวนวัน
 */
function getCaseAgeDays(value) {
  const date = parseContactDateValue(value);

  if (!date) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs <= 0) {
    return '0';
  }

  return String(Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

/**
 * เรียงรายการ Report Summary ตามจำนวนวันจากมากไปน้อย
 * @param {Object} a - row แรก
 * @param {Object} b - row ที่สอง
 * @return {number} sort order
 */
function compareRowsByCaseAgeDaysDesc(a, b) {
  const dateA = parseContactDateValue(a.contactDate);
  const dateB = parseContactDateValue(b.contactDate);
  const ageA = getCaseAgeDaysNumber(dateA);
  const ageB = getCaseAgeDaysNumber(dateB);

  if (ageA !== ageB) {
    return ageB - ageA;
  }

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA.getTime() - dateB.getTime();
}

/**
 * คืนจำนวนวันเป็นตัวเลขสำหรับใช้ sort
 * @param {Date|null} date - วันที่แจ้ง
 * @return {number} จำนวนวัน
 */
function getCaseAgeDaysNumber(date) {
  if (!date) {
    return -1;
  }

  const diffMs = new Date().getTime() - date.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Normalize ID สำหรับเทียบ assignto/ownerSubjectId
 * @param {*} value - ค่า ID
 * @return {string} ID ที่ trim แล้ว
 */
function normalizeId(value) {
  return String(value || '').trim();
}

/**
 * หา text color สำหรับ status card
 * @param {string} status - สถานะ
 * @return {string} CSS color
 */
function getStatusTextColor(status) {
  const statusLower = String(status || '').trim().toLowerCase();

  if (statusLower === 'continue' || statusLower === 'editerr' || statusLower === 'test') {
    return '#FFFFFF';
  }

  return '#0D1E1C';
}
