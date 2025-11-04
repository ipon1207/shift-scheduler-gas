var SheetUtils = (function () {
  var TIMEZONE = Session.getScriptTimeZone() || 'Asia/Tokyo';

  function getSheet(sheetName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('シート「' + sheetName + '」が見つかりません。');
    }
    return sheet;
  }

  function getSheetValues(sheetName) {
    try {
      var sheet = getSheet(sheetName);
      var range = sheet.getDataRange();
      return range.getValues();
    } catch (error) {
      if (error && error.message && error.message.indexOf('見つかりません') > -1) {
        throw error;
      }
      return [];
    }
  }

  function overwriteSheet(sheetName, headers, rows) {
    var sheet = getSheet(sheetName);
    sheet.clearContents();

    var data = [];
    if (headers && headers.length) {
      data.push(headers);
    }
    if (rows && rows.length) {
      data = data.concat(rows);
    }

    if (data.length) {
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
  }

  function formatDate(date) {
    return Utilities.formatDate(date, TIMEZONE, 'yyyy/MM/dd');
  }

  function formatTime(date) {
    return Utilities.formatDate(date, TIMEZONE, 'HH:mm');
  }

  function toDate(value) {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return new Date(value.getTime());
    }
    if (typeof value === 'number') {
      return new Date(Math.round((value - 25569) * 86400000));
    }
    if (typeof value === 'string') {
      var parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  }

  function combineDateAndTime(dateValue, timeValue) {
    var baseDate = toDate(dateValue);
    if (!baseDate) {
      return null;
    }
    var hours = 0;
    var minutes = 0;

    if (timeValue instanceof Date) {
      hours = timeValue.getHours();
      minutes = timeValue.getMinutes();
    } else if (typeof timeValue === 'string') {
      var parts = timeValue.split(':');
      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      }
    } else if (typeof timeValue === 'number') {
      var totalMinutes = Math.round(timeValue * 24 * 60);
      hours = Math.floor(totalMinutes / 60);
      minutes = totalMinutes % 60;
    }

    var combined = new Date(baseDate.getTime());
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  function refreshIndividualSheet(members, roles) {
    var sheet;
    try {
      sheet = getSheet('shift_result_individual');
    } catch (error) {
      return;
    }

    sheet.clearContents();
    sheet.getRange(1, 1).setValue('メンバー選択');
    sheet.getRange(1, 2).setValue('選択');
    sheet.getRange(2, 1, 1, 2).setValues([['氏名', '']]);

    var memberSheet;
    try {
      memberSheet = getSheet('member_master');
    } catch (error) {
      memberSheet = null;
    }

    if (memberSheet && memberSheet.getLastRow() >= 2) {
      var validationRange = memberSheet.getRange(2, 2, memberSheet.getLastRow() - 1, 1);
      var rule = SpreadsheetApp.newDataValidation()
        .requireValueInRange(validationRange, true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange(2, 2).setDataValidation(rule);
    } else if (members && members.length) {
      var names = members.map(function (member) { return member.name; });
      var ruleList = SpreadsheetApp.newDataValidation()
        .requireValueInList(names, true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange(2, 2).setDataValidation(ruleList);
    }

    var headers = ['日付', '開始', '終了', '担当'];
    sheet.getRange(3, 1, 1, headers.length).setValues([headers]);

    var roleConditions = roles.map(function (_, index) {
      var columnLetter = columnLetterFromIndex(4 + index);
      return 'shift_result_overall!' + columnLetter + '2:' + columnLetter + '=$B$2';
    });

    var conditionExpression = roleConditions.length
      ? '(' + roleConditions.join(')+(') + ')'
      : 'FALSE';

    var roleValueExpression = '""';
    for (var idx = roles.length - 1; idx >= 0; idx--) {
      var roleColumnLetter = columnLetterFromIndex(4 + idx);
      var roleName = roles[idx];
      roleValueExpression = 'IF(shift_result_overall!' + roleColumnLetter + '2:' + roleColumnLetter + '=$B$2,"' + roleName + '",' + roleValueExpression + ')';
    }

    var arrayExpression = '{shift_result_overall!A2:A,shift_result_overall!B2:B,shift_result_overall!C2:C,' + roleValueExpression + '}';
    var formula = '=IF($B$2="","",SORT(FILTER(' + arrayExpression + ',' + conditionExpression + '),1,TRUE,2,TRUE))';
    sheet.getRange(4, 1).setFormula(formula);
  }

  function columnLetterFromIndex(index) {
    var dividend = index;
    var columnName = '';
    var modulo;

    while (dividend > 0) {
      modulo = (dividend - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      dividend = Math.floor((dividend - modulo) / 26);
    }

    return columnName;
  }

  function writeShiftResults(assignments, roles) {
    var headers = ['date', 'startTime', 'endTime'].concat(roles);
    var rows = [];

    for (var i = 0; i < assignments.length; i++) {
      var entry = assignments[i];
      var slot = entry.slot;
      var roleMap = {};
      for (var j = 0; j < entry.assignments.length; j++) {
        var assignment = entry.assignments[j];
        roleMap[assignment.role] = assignment.member.name;
      }
      rows.push([
        formatDate(slot.startDateTime),
        formatTime(slot.startDateTime),
        formatTime(slot.endDateTime),
        roleMap['レジ'] || '',
        roleMap['商品渡し'] || '',
        roleMap['調理'] || ''
      ]);
    }

    overwriteSheet('shift_result_overall', headers, rows);
  }

  return {
    TIMEZONE: TIMEZONE,
    getSheet: getSheet,
    getSheetValues: getSheetValues,
    overwriteSheet: overwriteSheet,
    formatDate: formatDate,
    formatTime: formatTime,
    toDate: toDate,
    combineDateAndTime: combineDateAndTime,
    refreshIndividualSheet: refreshIndividualSheet,
    columnLetterFromIndex: columnLetterFromIndex,
    writeShiftResults: writeShiftResults
  };
})();