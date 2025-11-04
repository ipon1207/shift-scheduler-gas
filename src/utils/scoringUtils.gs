var ScoringUtils = (function () {
    var BASE_SCORE = 100;
    var PAIR_BONUS = 1000;
    var ROLE_BONUS = 100;
    var DIVERSITY_BONUS = 50;
    var FAIRNESS_BONUS = 10;

    function calculateScore(params) {
        var candidateState = params.candidateState;
        var role = params.role;
        var assignedStates = params.assignedStates || [];
        var pairHistory = params.pairHistory;
        var averageMinutes = params.averageMinutes || 0;

        var score = BASE_SCORE;
        var candidateId = candidateState.member.memberId;

        if (assignedStates.length === 0 || assignedStates.every(function (other) {
            return getPairCount(pairHistory, candidateId, other.member.memberId) === 0;
        })) {
            score += PAIR_BONUS;
        }

        if (!candidateState.experiencedRoles.has(role)) {
            score += ROLE_BONUS;
        }

        if (!assignedStates.length || assignedStates.every(function (other) {
            return other.member.grade === null || candidateState.member.grade === null || other.member.grade !== candidateState.member.grade;
        })) {
            score += DIVERSITY_BONUS;
        }

        if (candidateState.totalMinutes < averageMinutes) {
            score += FAIRNESS_BONUS;
        }

        return score;
    }

    function getPairCount(pairHistory, memberId, otherId) {
        if (!pairHistory || !pairHistory.has(memberId)) {
            return 0;
        }
        var map = pairHistory.get(memberId);
        return map.get(otherId) || 0;
    }

    return {
        calculateScore: calculateScore
    };
})();