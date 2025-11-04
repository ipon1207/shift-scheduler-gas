var MemberRepository = (function () {
  function MemberRepository(sheetName) {
    this.sheetName = sheetName || 'member_master';
  }

  MemberRepository.prototype.getMembers = function () {
    var values = SheetUtils.getSheetValues(this.sheetName);
    if (!values || values.length <= 1) {
      return [];
    }
    var members = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var memberIdRaw = row[0];
      var nameRaw = row[1];
      var gradeRaw = row[2];
      if (!memberIdRaw || !nameRaw) {
        continue;
      }
      var memberId = String(memberIdRaw).trim();
      var name = String(nameRaw).trim();
      var grade = parseInt(gradeRaw, 10);
      if (isNaN(grade)) {
        grade = null;
      }
      members.push({
        memberId: memberId,
        name: name,
        grade: grade
      });
    }
    return members;
  };

  return MemberRepository;
})();