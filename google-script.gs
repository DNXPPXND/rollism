function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = JSON.parse(e.postData.contents);
    
    // สร้าง Header หากแผ่นงานยังว่างอยู่
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["วันที่", "หมวดหมู่", "รายการ", "จำนวน", "หน่วย", "ราคารวม/ยอดขาย (บาท)", "ประเภท"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#dcfce7");
    }

    if (contents.action === "syncSingle") {
      var log = contents.data;
      // ลบแถวข้อมูลของวันที่เดิมออกก่อนบันทึกใหม่ ป้องกันแถวซ้ำใน Google Sheet
      removeExistingDateRows(sheet, log.date);
      appendLogToSheet(sheet, log);
    } else if (contents.action === "syncAll") {
      sheet.clearContents();
      sheet.appendRow(["วันที่", "หมวดหมู่", "รายการ", "จำนวน", "หน่วย", "ราคารวม/ยอดขาย (บาท)", "ประเภท"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#dcfce7");
      
      contents.logs.forEach(function(log) {
        appendLogToSheet(sheet, log);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชันลบแถวของวันที่เดิมที่มีอยู่แล้วออก
function removeExistingDateRows(sheet, dateStr) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  var range = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = range.getValues();
  
  for (var i = values.length - 1; i >= 0; i--) {
    var cellValue = values[i][0];
    var formattedDate = cellValue;
    
    if (cellValue instanceof Date) {
      formattedDate = Utilities.formatDate(cellValue, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    
    if (formattedDate == dateStr) {
      sheet.deleteRow(i + 2);
    }
  }
}

function appendLogToSheet(sheet, log) {
  if (log.items && log.items.length > 0) {
    log.items.forEach(function(item) {
      sheet.appendRow([
        log.date,
        item.category || "อื่นๆ",
        item.itemName,
        item.qty,
        item.unit || "",
        item.price,
        item.itemName === "ขายได้" ? "รายรับ" : "รายจ่าย"
      ]);
    });
  }
}
// ฟังก์ชันอ่านข้อมูล (doGet)
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    var logs = {};

    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
      
      data.forEach(function(row) {
        var rawDate = row[0];
        if (!rawDate) return;

        var dateStr = rawDate;
        if (rawDate instanceof Date) {
          dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (typeof rawDate === 'string' && rawDate.includes('T')) {
          dateStr = rawDate.split('T')[0];
        }

        if (!logs[dateStr]) {
          logs[dateStr] = {
            date: dateStr,
            items: [],
            boxesSold: 0,
            totalRevenue: 0,
            totalExpense: 0,
            netProfit: 0
          };
        }

        var itemName = row[2];
        var qty = Number(row[3]) || 0;
        var price = Number(row[5]) || 0;

        logs[dateStr].items.push({
          itemName: itemName,
          qty: qty,
          price: price
        });

        if (itemName === "ขายได้") {
          logs[dateStr].boxesSold += qty;
          logs[dateStr].totalRevenue += price;
        } else {
          logs[dateStr].totalExpense += price;
        }
        logs[dateStr].netProfit = logs[dateStr].totalRevenue - logs[dateStr].totalExpense;
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", logs: logs }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชันบันทึกข้อมูล (doPost)
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = JSON.parse(e.postData.contents);
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["วันที่", "หมวดหมู่", "รายการ", "จำนวน", "หน่วย", "ราคารวม/ยอดขาย (บาท)", "ประเภท"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#dcfce7");
    }

    if (contents.action === "syncSingle") {
      var log = contents.data;
      removeExistingDateRows(sheet, log.date);
      appendLogToSheet(sheet, log);
    } else if (contents.action === "syncAll") {
      sheet.clearContents();
      sheet.appendRow(["วันที่", "หมวดหมู่", "รายการ", "จำนวน", "หน่วย", "ราคารวม/ยอดขาย (บาท)", "ประเภท"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#dcfce7");
      
      contents.logs.forEach(function(log) {
        appendLogToSheet(sheet, log);
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function removeExistingDateRows(sheet, dateStr) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  var range = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = range.getValues();
  
  for (var i = values.length - 1; i >= 0; i--) {
    var cellValue = values[i][0];
    var formattedDate = cellValue;
    
    if (cellValue instanceof Date) {
      formattedDate = Utilities.formatDate(cellValue, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    
    if (formattedDate == dateStr) {
      sheet.deleteRow(i + 2);
    }
  }
}

function appendLogToSheet(sheet, log) {
  if (log.items && log.items.length > 0) {
    log.items.forEach(function(item) {
      sheet.appendRow([
        log.date,
        item.category || "อื่นๆ",
        item.itemName,
        item.qty,
        item.unit || "",
        item.price,
        item.itemName === "ขายได้" ? "รายรับ" : "รายจ่าย"
      ]);
    });
  }
}