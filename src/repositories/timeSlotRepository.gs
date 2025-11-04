var TimeSlotRepository = (function () {
  function TimeSlotRepository(sheetName) {
    this.sheetName = sheetName || 'time_slot_master';
  }

  TimeSlotRepository.prototype.getTimeSlots = function () {
    var values = SheetUtils.getSheetValues(this.sheetName);
    var slots = [];

    if (!values || values.length <= 1) {
      return slots;
    }

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var dateValue = row[0];
      var startValue = row[1];
      var endValue = row[2];

      if (!dateValue || !startValue || !endValue) {
        continue;
      }

      var startDateTime = SheetUtils.combineDateAndTime(dateValue, startValue);
      var endDateTime = SheetUtils.combineDateAndTime(dateValue, endValue);
      if (!startDateTime || !endDateTime || startDateTime >= endDateTime) {
        continue;
      }

      var durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000;

      slots.push({
        date: SheetUtils.toDate(dateValue),
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        durationMinutes: durationMinutes
      });
    }

    slots.sort(function (a, b) {
      return a.startDateTime.getTime() - b.startDateTime.getTime();
    });

    return slots;
  };

  return TimeSlotRepository;
})();