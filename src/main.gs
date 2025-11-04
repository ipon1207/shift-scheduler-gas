function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Shift Scheduler')
    .addItem('シフト自動割り当て', 'runShiftAssignment')
    .addToUi();
}

function runShiftAssignment() {
  try {
    var memberRepository = new MemberRepository();
    var availabilityRepository = new AvailabilityRepository();
    var timeSlotRepository = new TimeSlotRepository();
    var assignmentService = new AssignmentService(
      memberRepository,
      availabilityRepository,
      timeSlotRepository
    );
    var result = assignmentService.buildAssignments();
    SheetUtils.writeShiftResults(result.assignments, AssignmentService.ROLES);
    SheetUtils.refreshIndividualSheet(result.members, AssignmentService.ROLES);
    SpreadsheetApp.getActiveSpreadsheet().toast('シフト割り当てが完了しました。', 'Shift Scheduler', 5);
  } catch (error) {
    console.error(error);
    SpreadsheetApp.getActiveSpreadsheet().toast('エラー: ' + error.message, 'Shift Scheduler', 10);
    throw error;
  }
}

function main() {
  runShiftAssignment();
}