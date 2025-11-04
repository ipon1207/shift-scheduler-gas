var AssignmentService = (function () {
  var ROLES = ['レジ', '商品渡し', '調理'];

  function AssignmentService(memberRepository, availabilityRepository, timeSlotRepository) {
    this.memberRepository = memberRepository;
    this.availabilityRepository = availabilityRepository;
    this.timeSlotRepository = timeSlotRepository;
  }

  AssignmentService.ROLES = ROLES;

  AssignmentService.prototype.buildAssignments = function () {
    var members = this.memberRepository.getMembers();
    if (!members.length) {
      throw new Error('メンバー情報が登録されていません。');
    }

    var availabilityMap = this.availabilityRepository.getAvailabilityMap();
    var timeSlots = this.timeSlotRepository.getTimeSlots();
    if (!timeSlots.length) {
      throw new Error('時間枠が登録されていません。');
    }

    var memberStates = this.initialiseMemberStates(members);
    var pairHistory = new Map();
    var assignments = [];

    for (var i = 0; i < timeSlots.length; i++) {
      var slot = timeSlots[i];
      var slotAssignments = [];
      var assignedStates = [];

      for (var r = 0; r < ROLES.length; r++) {
        var role = ROLES[r];
        var candidate = this.selectCandidate(slot, role, assignedStates, memberStates, availabilityMap, pairHistory);
        if (!candidate) {
          throw new Error(this.buildInsufficientCandidateMessage(slot, role));
        }
        this.applyAssignment(candidate.state, slot, role, assignedStates, pairHistory);
        slotAssignments.push({
          role: role,
          member: candidate.state.member
        });
        assignedStates.push(candidate.state);
      }

      assignments.push({
        slot: slot,
        assignments: slotAssignments
      });
    }

    return {
      assignments: assignments,
      members: members
    };
  };

  AssignmentService.prototype.initialiseMemberStates = function (members) {
    var memberStates = new Map();
    for (var i = 0; i < members.length; i++) {
      var member = members[i];
      memberStates.set(member.memberId, {
        member: member,
        experiencedRoles: new Set(),
        totalMinutes: 0,
        lastAssignedEnd: null
      });
    }
    return memberStates;
  };

  AssignmentService.prototype.selectCandidate = function (slot, role, assignedStates, memberStates, availabilityMap, pairHistory) {
    var averageMinutes = this.computeAverageMinutes(memberStates);
    var bestCandidate = null;

    memberStates.forEach(function (state) {
      if (this.isAlreadyAssigned(state, assignedStates)) {
        return;
      }
      if (!this.isEligible(state, slot, availabilityMap)) {
        return;
      }

      var score = ScoringUtils.calculateScore({
        candidateState: state,
        role: role,
        slot: slot,
        assignedStates: assignedStates,
        pairHistory: pairHistory,
        averageMinutes: averageMinutes
      });

      if (!bestCandidate ||
        score > bestCandidate.score ||
        (score === bestCandidate.score && this.hasPreference(state, bestCandidate.state))) {
        bestCandidate = { state: state, score: score };
      }
    }, this);

    return bestCandidate;
  };

  AssignmentService.prototype.isEligible = function (state, slot, availabilityMap) {
    if (state.lastAssignedEnd && state.lastAssignedEnd.getTime() === slot.startDateTime.getTime()) {
      return false;
    }
    var intervals = availabilityMap.get(state.member.memberId) || [];
    for (var i = 0; i < intervals.length; i++) {
      var interval = intervals[i];
      if (slot.startDateTime < interval.end && slot.endDateTime > interval.start) {
        return false;
      }
    }
    return true;
  };

  AssignmentService.prototype.isAlreadyAssigned = function (state, assignedStates) {
    for (var i = 0; i < assignedStates.length; i++) {
      if (assignedStates[i] === state) {
        return true;
      }
    }
    return false;
  };

  AssignmentService.prototype.applyAssignment = function (state, slot, role, assignedStates, pairHistory) {
    state.totalMinutes += slot.durationMinutes;
    state.lastAssignedEnd = slot.endDateTime;
    state.experiencedRoles.add(role);

    for (var i = 0; i < assignedStates.length; i++) {
      var otherState = assignedStates[i];
      this.incrementPairHistory(pairHistory, state.member.memberId, otherState.member.memberId);
      this.incrementPairHistory(pairHistory, otherState.member.memberId, state.member.memberId);
    }
  };

  AssignmentService.prototype.incrementPairHistory = function (pairHistory, memberId, otherMemberId) {
    if (!pairHistory.has(memberId)) {
      pairHistory.set(memberId, new Map());
    }
    var map = pairHistory.get(memberId);
    var count = map.get(otherMemberId) || 0;
    map.set(otherMemberId, count + 1);
  };

  AssignmentService.prototype.computeAverageMinutes = function (memberStates) {
    var total = 0;
    memberStates.forEach(function (state) {
      total += state.totalMinutes;
    });
    return memberStates.size ? total / memberStates.size : 0;
  };

  AssignmentService.prototype.hasPreference = function (candidateState, currentBestState) {
    if (candidateState.totalMinutes !== currentBestState.totalMinutes) {
      return candidateState.totalMinutes < currentBestState.totalMinutes;
    }
    return candidateState.member.memberId < currentBestState.member.memberId;
  };

  AssignmentService.prototype.buildInsufficientCandidateMessage = function (slot, role) {
    var dateString = Utilities.formatDate(slot.startDateTime, SheetUtils.TIMEZONE, 'yyyy/MM/dd HH:mm');
    return '時間枠 ' + dateString + ' の役割「' + role + '」に割り当て可能なメンバーが不足しています。';
  };

  return AssignmentService;
})();