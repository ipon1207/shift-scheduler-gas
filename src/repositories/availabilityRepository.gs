var AvailabilityRepository = (function () {
  function AvailabilityRepository(sheetName) {
    this.sheetName = sheetName || 'availability_sheet';
  }

  AvailabilityRepository.prototype.getAvailabilityMap = function () {
    var values = SheetUtils.getSheetValues(this.sheetName);
    var availabilityMap = new Map();

    if (!values || values.length <= 1) {
      return availabilityMap;
    }

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var memberIdRaw = row[0];
      if (!memberIdRaw) {
        continue;
      }
  var memberId = String(memberIdRaw).trim();
      var startValue = row[1];
      var endValue = row[2];

      if (!startValue || !endValue) {
        continue;
      }

      var start = SheetUtils.toDate(startValue);
      var end = SheetUtils.toDate(endValue);
      if (!start || !end || start >= end) {
        continue;
      }

      if (!availabilityMap.has(memberId)) {
        availabilityMap.set(memberId, []);
      }
      availabilityMap.get(memberId).push({ start: start, end: end });
    }

    availabilityMap.forEach(function (intervals) {
      intervals.sort(function (a, b) {
        return a.start.getTime() - b.start.getTime();
      });
    });

    return availabilityMap;
  };

  return AvailabilityRepository;
})();