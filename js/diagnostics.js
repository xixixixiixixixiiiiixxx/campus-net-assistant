(function (global) {
  'use strict';

  var D = global.NTA.diagnostics;
  var K = global.NTA.knowledge;

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function isoTime(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function bump(session, now) {
    session.revision = (session.revision || 0) + 1;
    session.lastInteractedAt = isoTime(now || Date.now());
    return session.revision;
  }

  function activeEvidence(session) {
    return (session.observations || []).filter(function (o) {
      return o && o.validity === 'active';
    });
  }

  function findActive(session, factKey) {
    var list = activeEvidence(session);
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].factKey === factKey) return list[i];
    }
    return null;
  }

  function facts(session) {
    var out = {};
    activeEvidence(session).forEach(function (o) {
      if (o.status === 'available') out[o.factKey] = o.value;
    });
    return out;
  }

  function factValue(session, factKey) {
    var o = findActive(session, factKey);
    return o && o.status === 'available' ? o.value : null;
  }

  function factStatus(session, factKey) {
    var o = findActive(session, factKey);
    return o ? o.status : null;
  }

  function nextEvidenceId(session) {
    session.evidenceSeq = (Number(session.evidenceSeq) || 0) + 1;
    return 'e-' + session.evidenceSeq;
  }

  function unique(list) {
    var seen = {};
    var out = [];
    list.forEach(function (item) {
      if (item == null || seen[item]) return;
      seen[item] = true;
      out.push(item);
    });
    return out;
  }

  function recordObservation(session, factKey, value, options) {
    options = options || {};
    var now = options.now || Date.now();
    var status = options.status || 'available';
    var question = options.questionId ? D.QUESTIONS[options.questionId] : null;

    if (status === 'available' && question) {
      var picked = null;
      question.options.forEach(function (opt) {
        if (opt.value === value) picked = opt;
      });
      if (picked && picked.status) status = picked.status;
    }
    if (value === 'unknown' && status === 'available') status = 'unknown';

    var existing = findActive(session, factKey);
    if (existing && existing.value === value && existing.status === status) {
      return { observation: existing, changed: false };
    }
    if (existing) existing.validity = 'superseded';

    var observation = {
      id: nextEvidenceId(session),
      factKey: factKey,
      kind: options.kind === 'browser' ? 'browser' : 'user_report',
      status: status,
      value: value,
      observedAt: isoTime(now),
      validity: 'active',
      context: {
        networkPath: session.context ? session.context.networkPath : 'unknown',
        accessScene: session.context ? session.context.accessScene : 'unknown',
        comparison: options.comparison || null
      },
      supersedes: existing ? existing.id : null,
      reasonCode: options.reasonCode || null,
      questionId: options.questionId || null
    };

    session.observations = session.observations || [];
    session.observations.push(observation);
    if (session.observations.length > 200) session.observations.shift();

    bump(session, now);

    if (status === 'available' && factKey === 'access_scene' && session.context) {
      session.context.accessScene = value;
    }

    if (existing && existing.value !== value && factKey === 'resource_scope') {
      session.conflict = {
        factKey: factKey,
        oldValue: existing.value,
        newValue: value,
        asked: false
      };
    }

    return { observation: observation, changed: true, superseded: existing || null };
  }

  function reviseObservation(session, evidenceId, nextValue, options) {
    options = options || {};
    var target = null;
    (session.observations || []).forEach(function (o) {
      if (o.id === evidenceId) target = o;
    });
    if (!target || target.validity !== 'active') return null;
    return recordObservation(session, target.factKey, nextValue, {
      now: options.now,
      status: options.status,
      kind: target.kind,
      reasonCode: options.reasonCode || target.reasonCode,
      questionId: target.questionId
    });
  }

  function answerQuestion(session, questionId, value, options) {
    options = options || {};
    var question = D.QUESTIONS[questionId];
    if (!question) return null;

    if (session.askedQuestionIds.indexOf(questionId) < 0) {
      session.askedQuestionIds.push(questionId);
      session.budgetUsed = (session.budgetUsed || 0) + 1;
    }

    var result = recordObservation(session, question.factKey, value, {
      now: options.now,
      questionId: questionId,
      reasonCode: 'answer_' + questionId
    });
    session.editingQuestionId = null;
    return result;
  }

  function answerClarify(session, value, options) {
    var conflict = session.conflict;
    if (!conflict) return null;
    conflict.asked = true;
    var result = recordObservation(session, conflict.factKey, value, {
      now: (options && options.now) || Date.now(),
      reasonCode: 'clarify_resolved'
    });
    session.conflict = null;
    session.budgetUsed = (session.budgetUsed || 0) + 1;
    return result;
  }

  function startScenario(session, scenarioId, now) {
    var scenario = D.SCENARIOS[scenarioId];
    if (!scenario) return session;
    var ts = now || Date.now();

    session.scenarioId = scenarioId;
    session.categoryId = scenario.categoryId;
    session.screen = 'diagnose';
    session.nodeId = null;
    session.stack = [];
    session.answers = [];
    session.stepRecords = {};
    session.observations = [];
    session.evidenceSeq = 0;
    session.actionRecords = [];
    session.askedQuestionIds = [];
    session.editingQuestionId = null;
    session.conflict = null;
    session.questionBudget = scenario.budget || D.DEFAULT_QUESTION_BUDGET;
    session.budgetUsed = 0;
    session.resolution = 'not_checked';
    session.handoff = null;
    session.extra = '';
    session.helpDraft = { text: '', edited: false, basedOnRevision: session.revision || 0, savedPref: false };
    session.startedAt = ts;
    session.context = {
      campus: 'songshanhu',
      audience: 'student',
      accessScene: 'unknown',
      area: '',
      servicePartition: 'unknown',
      networkPath: scenario.context.networkPath || 'unknown',
      deviceType: 'unknown',
      osFamily: 'unknown',
      symptomStarted: ''
    };

    (scenario.presetFacts || []).forEach(function (fact) {
      recordObservation(session, fact.factKey, fact.value, {
        now: ts,
        kind: fact.kind,
        reasonCode: fact.reasonCode
      });
    });

    return session;
  }

  function needsQuestion(session, question, f) {
    if (question.id === 'q-resource-scope') return !f.resource_scope;
    if (question.id === 'q-access-scene') {
      return f.resource_scope === 'internal_only' && !f.access_scene;
    }
    if (question.id === 'q-peer') {
      return f.resource_scope === 'all_web_down' && !f.peer_same_network;
    }
    if (question.id === 'q-mobile') {
      return f.resource_scope === 'all_web_down' && !!f.peer_same_network && !f.mobile_data_web;
    }
    if (question.id === 'q-auth-visible') {
      return f.resource_scope === 'all_web_down' &&
        f.peer_same_network === 'normal' &&
        factStatus(session, 'mobile_data_web') === 'not_tested' &&
        !f.auth_visible;
    }
    if (question.id === 'q-webvpn-visible') {
      return f.resource_scope === 'internal_only' &&
        f.access_scene === 'off_campus' &&
        !f.webvpn_portal_state;
    }
    return false;
  }

  function buildClarify(session) {
    var conflict = session.conflict;
    var labels = D.FACT_VALUE_LABELS[conflict.factKey] || {};
    return {
      id: 'q-clarify',
      factKey: conflict.factKey,
      prompt: '\u4f60\u524d\u540e\u9009\u62e9\u7684\u73b0\u8c61\u4e0d\u5b8c\u5168\u4e00\u81f4\uff0c\u73b0\u5728\u66f4\u63a5\u8fd1\u54ea\u4e00\u79cd\uff1f',
      reason: '\u9700\u8981\u786e\u8ba4\u5f53\u524d\u5b9e\u9645\u8868\u73b0\uff0c\u907f\u514d\u6309\u65e7\u7b54\u6848\u7ee7\u7eed\u5224\u65ad\u3002',
      options: [
        { value: conflict.oldValue, label: labels[conflict.oldValue] || conflict.oldValue },
        { value: conflict.newValue, label: labels[conflict.newValue] || conflict.newValue }
      ]
    };
  }

  function conditionSupport(session, factKey) {
    var o = findActive(session, factKey);
    if (!o || o.status !== 'available') return null;
    var label = D.FACT_LABELS[factKey] || factKey;
    var values = D.FACT_VALUE_LABELS[factKey] || {};
    return label + '\uff1a' + (values[o.value] || o.value);
  }

  function deriveAssessment(session) {
    var f = facts(session);
    var ruleIds = [];
    var direction = 'undetermined';
    var evidenceIds = [];
    var support = [];
    var unknowns = [];
    var actionIds = [];
    var reasonCode = 'insufficient';

    function cite(factKey) {
      var o = findActive(session, factKey);
      if (o) evidenceIds.push(o.id);
    }

    if (f.resource_scope === 'internal_only' && f.access_scene === 'off_campus') {
      ruleIds.push('r-internal-offcampus');
      direction = 'resource_or_access';
      reasonCode = 'offcampus_internal';
      cite('resource_scope');
      cite('access_scene');
      actionIds.push('a-webvpn-check-portal');
      unknowns.push('\u662f\u5426\u5df2\u6309\u6821\u65b9\u8bf4\u660e\u4ece\u95e8\u6237\u5185\u8bbf\u95ee\uff1b\u6682\u4e0d\u80fd\u786e\u8ba4\u5177\u4f53\u662f\u8d44\u6e90\u3001\u8d26\u53f7\u8fd8\u662f\u95e8\u6237\u72b6\u6001\u3002');
    } else if (f.resource_scope === 'internal_only' && f.webvpn_portal_state === 'wrong_entry') {
      ruleIds.push('r-internal-portal');
      direction = 'resource_or_access';
      reasonCode = 'portal_entry_wrong';
      cite('resource_scope');
      cite('webvpn_portal_state');
      actionIds.push('a-webvpn-check-portal');
      unknowns.push('\u8d26\u53f7\u672c\u8eab\u662f\u5426\u5f02\u5e38\u5c1a\u672a\u786e\u8ba4\u3002');
    } else if (f.resource_scope === 'internal_only' && f.webvpn_portal_state === 'not_enabled') {
      ruleIds.push('r-internal-portal');
      direction = 'resource_or_access';
      reasonCode = 'portal_not_enabled';
      cite('resource_scope');
      cite('webvpn_portal_state');
      actionIds.push('a-webvpn-check-portal');
      unknowns.push('\u95e8\u6237\u662f\u5426\u672a\u767b\u5f55\u6216\u672a\u5f00\u542f\u5c1a\u9700\u6838\u5bf9\u3002');
    } else if (f.resource_scope === 'all_web_down') {
      if (f.peer_same_network === 'normal' && f.mobile_data_web === 'fails') {
        ruleIds.push('r-multi-path-device');
        direction = 'device_or_user_state';
        reasonCode = 'multi_path_device';
        cite('resource_scope');
        cite('peer_same_network');
        cite('mobile_data_web');
        actionIds.push('a-check-device');
        unknowns.push('\u4e24\u79cd\u7f51\u7edc\u4e0b\u90fd\u5f02\u5e38\u65f6\uff0c\u8d26\u53f7\u3001\u6d4f\u89c8\u5668\u6216\u7cfb\u7edf\u8bbe\u7f6e\u5dee\u5f02\u5c1a\u672a\u9010\u4e00\u6392\u9664\u3002');
      } else if (f.peer_same_network === 'normal') {
        ruleIds.push('r-single-device');
        direction = 'device_or_user_state';
        reasonCode = 'single_device';
        cite('resource_scope');
        cite('peer_same_network');
        actionIds.push('a-check-device');
        unknowns.push('\u8d26\u53f7\u72b6\u6001\u3001\u6d4f\u89c8\u5668\u8bbe\u7f6e\u7b49\u5dee\u5f02\u5c1a\u672a\u9010\u4e00\u6392\u9664\u3002');
      } else if (f.peer_same_network === 'also_abnormal' && f.mobile_data_web === 'works') {
        ruleIds.push('r-shared-path');
        direction = 'shared_access_path';
        reasonCode = 'shared_path';
        cite('resource_scope');
        cite('peer_same_network');
        cite('mobile_data_web');
        actionIds.push('a-collect-area-info');
        unknowns.push('\u4e0d\u540c\u8bbe\u5907\u662f\u5426\u4f7f\u7528\u76f8\u540c\u8d26\u53f7\u3001\u662f\u5426\u5728\u540c\u4e00\u533a\u57df\uff1b\u4e0d\u80fd\u636e\u6b64\u8ba4\u5b9a\u5168\u6821\u6545\u969c\u3002');
      } else if (f.peer_same_network === 'also_abnormal') {
        ruleIds.push('r-shared-path');
        direction = 'shared_access_path';
        reasonCode = 'shared_path_partial';
        cite('resource_scope');
        cite('peer_same_network');
        unknowns.push('\u7f3a\u5c11\u540c\u4e00\u8bbe\u5907\u6362\u7f51\u7edc\u7684\u5bf9\u7167\uff0c\u5171\u540c\u8def\u5f84\u7ebf\u7d22\u4ecd\u9700\u6838\u5b9e\u3002');
      }
    } else if (f.resource_scope === 'single_site') {
      ruleIds.push('r-single-site');
      direction = 'resource_or_access';
      reasonCode = 'single_site';
      cite('resource_scope');
      actionIds.push('a-retry-single-site');
      unknowns.push('\u76ee\u6807\u7f51\u7ad9\u3001\u8bbf\u95ee\u8def\u5f84\u6216\u672c\u5730\u7f13\u5b58\u95ee\u9898\u5747\u672a\u6392\u9664\u3002');
    }

    if (!ruleIds.length) {
      ruleIds.push('r-insufficient');
      unknowns.push('\u7f3a\u5c11\u53ef\u6bd4\u7684\u5bf9\u7167\u89c2\u5bdf\uff0c\u6682\u4e0d\u80fd\u533a\u5206\u8bbe\u5907\u3001\u8d26\u53f7\u6216\u5171\u540c\u8def\u5f84\u3002');
    }

    evidenceIds = unique(evidenceIds);
    evidenceIds.forEach(function (id) {
      var observation = null;
      (session.observations || []).forEach(function (o) { if (o.id === id) observation = o; });
      if (!observation || observation.status !== 'available') return;
      var text = conditionSupport(session, observation.factKey);
      if (text) support.push(text);
    });

    actionIds = unique(actionIds).filter(function (actionId) {
      var action = D.ACTIONS[actionId];
      if (!action) return false;
      if (action.appliesTo && action.appliesTo.directions &&
        action.appliesTo.directions.indexOf(direction) < 0) return false;
      var tried = (session.actionRecords || []).filter(function (r) {
        return r.actionId === actionId && r.execution === 'completed' && r.effect === 'unchanged';
      });
      return tried.length === 0;
    }).slice(0, D.MAX_ACTION_PACKS);

    return {
      direction: direction,
      directionLabel: D.DIRECTIONS[direction].label,
      directionShort: D.DIRECTIONS[direction].short,
      ruleIds: unique(ruleIds),
      evidenceIds: evidenceIds,
      support: unique(support),
      unknowns: unique(unknowns),
      nextActionIds: actionIds,
      reasonCode: reasonCode,
      mode: 'rules'
    };
  }

  function getNextDecision(session) {
    var f = facts(session);
    var scenario = D.SCENARIOS[session.scenarioId];

    if (f.auth_visible === 'cert_warning') {
      return {
        kind: 'handoff',
        reasonCode: 'cert_warning',
        direction: 'undetermined',
        actionId: 'a-verify-official-entry'
      };
    }

    if (session.conflict && !session.conflict.asked) {
      return {
        kind: 'question',
        questionId: 'q-clarify',
        dynamic: buildClarify(session),
        reasonCode: 'conflict_clarify'
      };
    }

    if (scenario) {
      for (var i = 0; i < scenario.questionOrder.length; i++) {
        var questionId = scenario.questionOrder[i];
        var question = D.QUESTIONS[questionId];
        if (!question) continue;
        if (session.askedQuestionIds.indexOf(questionId) >= 0) continue;
        if (!needsQuestion(session, question, f)) continue;
        if ((session.budgetUsed || 0) >= (session.questionBudget || D.DEFAULT_QUESTION_BUDGET)) break;
        return {
          kind: 'question',
          questionId: questionId,
          reasonCode: 'need_' + question.factKey,
          reason: question.reason
        };
      }
    }

    var assessment = deriveAssessment(session);

    if (assessment.direction === 'undetermined') {
      return {
        kind: 'handoff',
        reasonCode: assessment.reasonCode,
        direction: 'undetermined',
        assessment: assessment
      };
    }

    if (assessment.nextActionIds.length) {
      return {
        kind: 'action',
        actionId: assessment.nextActionIds[0],
        direction: assessment.direction,
        reasonCode: assessment.reasonCode,
        assessment: assessment
      };
    }

    return {
      kind: 'handoff',
      reasonCode: assessment.reasonCode,
      direction: assessment.direction,
      assessment: assessment
    };
  }

  function recordActionResult(session, actionId, execution, effect, options) {
    options = options || {};
    var now = options.now || Date.now();
    var action = D.ACTIONS[actionId];
    if (!action) return null;

    var record = null;
    (session.actionRecords || []).forEach(function (r) {
      if (r.actionId === actionId) record = r;
    });

    if (!record) {
      record = {
        actionId: actionId,
        execution: 'not_started',
        effect: 'not_checked',
        basedOnEvidenceIds: options.evidenceIds || [],
        recordedAt: isoTime(now)
      };
      session.actionRecords = session.actionRecords || [];
      session.actionRecords.push(record);
    }
    if (execution) record.execution = execution;
    if (effect) record.effect = effect;
    if (options.stepStates) record.stepStates = options.stepStates;
    record.recordedAt = isoTime(now);
    bump(session, now);
    return record;
  }

  function recordVerification(session, actionId, effect, options) {
    var record = recordActionResult(session, actionId, null, effect, options);
    if (!record) return null;
    if (effect === 'restored') session.resolution = 'user_reported_restored';
    else if (effect === 'partial') session.resolution = 'user_reported_partial';
    else if (effect === 'unchanged') session.resolution = 'user_reported_unchanged';
    else session.resolution = 'not_checked';
    return record;
  }

  function categoryTitle(id) {
    var title = '\u672a\u5206\u7c7b';
    (K.CATEGORIES || []).forEach(function (cat) {
      if (cat.id === id) title = cat.title;
    });
    return title;
  }

  function deviceText(context) {
    var names = { phone: '\u624b\u673a', laptop: '\u7b14\u8bb0\u672c\u7535\u8111', tablet: '\u5e73\u677f', unknown: '\u672a\u586b\u5199' };
    var os = context.osFamily && context.osFamily !== 'unknown' ? context.osFamily : '';
    var device = names[context.deviceType] || '\u672a\u586b\u5199';
    return os ? device + ' / ' + os : device;
  }

  function sceneText(session) {
    var paths = { campus_wifi: '\u6821\u56ed Wi-Fi', webvpn: 'WebVPN', vpn: 'VPN', unknown: '\u672a\u786e\u8ba4' };
    var scenes = { on_campus: '\u6821\u5185', off_campus: '\u6821\u5916', unknown: '\u672a\u786e\u8ba4' };
    return (scenes[session.context.accessScene] || '\u672a\u786e\u8ba4') + ' / ' +
      (paths[session.context.networkPath] || '\u672a\u786e\u8ba4');
  }

  function observationText(session, factKey) {
    var o = findActive(session, factKey);
    if (!o) return '\u672a\u6d4b\u8bd5';
    if (o.status !== 'available') {
      var statusNames = { unknown: '\u4e0d\u77e5\u9053', not_tested: '\u672a\u6d4b\u8bd5', unsupported: '\u5f53\u524d\u6d4f\u89c8\u5668\u672a\u63d0\u4f9b', failed: '\u672c\u6b21\u8bf7\u6c42\u672a\u5f97\u5230\u53ef\u89e3\u91ca\u7ed3\u679c' };
      return statusNames[o.status] || '\u672a\u6d4b\u8bd5';
    }
    var values = D.FACT_VALUE_LABELS[factKey] || {};
    return values[o.value] || o.value;
  }

  function conflictText(session) {
    if (!session.conflict) return '\u672a\u53d1\u73b0\u5df2\u8bb0\u5f55\u51b2\u7a81';
    var values = D.FACT_VALUE_LABELS[session.conflict.factKey] || {};
    return '\u8bb0\u5f55\u4e2d\u5b58\u5728\u672a\u6f84\u6e05\u7684\u524d\u540e\u5dee\u5f02\uff1a\u5148\u9009\u300c' +
      (values[session.conflict.oldValue] || session.conflict.oldValue) + '\u300d\uff0c\u540e\u9009\u300c' +
      (values[session.conflict.newValue] || session.conflict.newValue) + '\u300d';
  }

  function executionText(value) {
    var names = { not_started: '\u672a\u5f00\u59cb', completed: '\u5df2\u5b8c\u6210', unable: '\u6682\u65f6\u505a\u4e0d\u4e86', skipped: '\u5df2\u8df3\u8fc7' };
    return names[value] || '\u672a\u8bb0\u5f55';
  }

  function effectText(value) {
    var names = { restored: '\u7528\u6237\u53cd\u9988\u5df2\u6062\u590d', unchanged: '\u4ecd\u65e0\u6539\u5584', partial: '\u90e8\u5206\u6062\u590d', not_checked: '\u5c1a\u672a\u590d\u6d4b' };
    return names[value] || '\u5c1a\u672a\u590d\u6d4b';
  }

  function buildHandoff(session, options) {
    options = options || {};
    var now = options.now || Date.now();
    var assessment = deriveAssessment(session);
    var lines = [];

    lines.push('\u3010\u677e\u5c71\u6e56\u6821\u533a\u6821\u56ed\u7f51\u7edc\u6c42\u52a9\u8bf4\u660e\u3011');
    lines.push('\u72b6\u6001\uff1a\u4ec5\u751f\u6210\u6587\u5b57\uff0c\u5c1a\u672a\u63d0\u4ea4\u5de5\u5355\u6216\u8054\u7cfb\u5b66\u6821');
    lines.push('');
    lines.push('\u4e00\u3001\u73b0\u8c61\u4e0e\u6761\u4ef6');
    lines.push('\u95ee\u9898\u7c7b\u578b\uff1a' + categoryTitle(session.categoryId));
    lines.push('\u6545\u969c\u5927\u81f4\u5f00\u59cb\u65f6\u95f4\uff1a' + (session.context.symptomStarted || '\u672a\u586b\u5199'));
    lines.push('\u5927\u81f4\u533a\u57df\uff1a' + (session.context.area || '\u672a\u586b\u5199'));
    lines.push('\u8bbe\u5907\u4e0e\u7cfb\u7edf\uff1a' + deviceText(session.context));
    lines.push('\u8bbf\u95ee\u573a\u666f\u548c\u7f51\u7edc\u8def\u5f84\uff1a' + sceneText(session));
    lines.push('');

    lines.push('\u4e8c\u3001\u5bf9\u7167\u89c2\u5bdf\uff08\u7528\u6237\u53cd\u9988\uff09');
    lines.push('\u666e\u901a\u7f51\u9875\u4e0e\u6821\u5185\u8d44\u6e90\uff1a' + observationText(session, 'resource_scope'));
    lines.push('\u540c\u5730\u70b9\u3001\u540c\u4e00\u7f51\u7edc\u7684\u5176\u4ed6\u8bbe\u5907\uff1a' + observationText(session, 'peer_same_network'));
    lines.push('\u540c\u4e00\u8bbe\u5907\u5207\u6362\u79fb\u52a8\u6570\u636e\u540e\u7684\u666e\u901a\u7f51\u9875\uff1a' + observationText(session, 'mobile_data_web'));
    lines.push('\u6d4b\u8bd5\u6761\u4ef6\u4e0d\u5b8c\u5168\u53ef\u6bd4\u6216\u524d\u540e\u51b2\u7a81\uff1a' + conflictText(session));
    lines.push('\u8865\u5145\u9519\u8bef\u63d0\u793a\uff1a' + (session.extra || '\u672a\u586b\u5199'));
    lines.push('');

    lines.push('\u4e09\u3001\u5df2\u5c1d\u8bd5\u53ca\u7ed3\u679c');
    if (!(session.actionRecords || []).length) {
      lines.push('\uff08\u5c1a\u672a\u6267\u884c\u5177\u4f53\u6b65\u9aa4\uff09');
    } else {
      session.actionRecords.forEach(function (record) {
        var action = D.ACTIONS[record.actionId];
        if (!action) return;
        lines.push('\u00b7 ' + action.title +
          '\uff1b\u6267\u884c\u72b6\u6001\uff1a' + executionText(record.execution) +
          '\uff1b\u590d\u6d4b\u7ed3\u679c\uff1a' + effectText(record.effect));
        if (record.stepStates) {
          action.steps.forEach(function (step) {
            if (!record.stepStates[step.id]) return;
            lines.push('    - ' + step.text + '\uff1a' + executionText(record.stepStates[step.id]));
          });
        }
      });
    }
    lines.push('');

    lines.push('\u56db\u3001\u52a9\u624b\u7ed9\u51fa\u7684\u521d\u6b65\u65b9\u5411');
    lines.push('\u65b9\u5411\uff1a' + assessment.directionLabel);
    if (assessment.support.length) lines.push('\u652f\u6301\u89c2\u5bdf\uff1a' + assessment.support.join('\uff1b'));
    if (assessment.unknowns.length) lines.push('\u5c1a\u672a\u786e\u8ba4\uff1a' + assessment.unknowns.join('\uff1b'));
    lines.push('\u4ee5\u4e0a\u4e3a\u8f85\u52a9\u5224\u65ad\uff0c\u8bf7\u5de5\u4f5c\u4eba\u5458\u6838\u5b9e\u3002');
    lines.push('');

    lines.push('\u4e94\u3001\u5e0c\u671b\u5f97\u5230\u7684\u5e2e\u52a9');
    lines.push('\u8bf7\u534f\u52a9\u5224\u65ad\u4e0b\u4e00\u6b65\u5e94\u5982\u4f55\u5904\u7406\u3002');
    lines.push('');
    lines.push('\u2014 \u8bbe\u5907\u8bb0\u5f55\u7684\u751f\u6210\u65f6\u95f4\uff1a' + formatTime(now));
    lines.push('\u2014 \u77e5\u8bc6\u7248\u672c\uff1a' + D.KNOWLEDGE_VERSION);
    lines.push('\u2014 \u672c\u8bf4\u660e\u7531\u300c\u677e\u5c71\u6e56\u6821\u533a\u5b66\u751f\u7f51\u7edc\u6392\u969c\u52a9\u624b\u300d\u6839\u636e\u672c\u4eba\u64cd\u4f5c\u8bb0\u5f55\u751f\u6210\uff0c\u5c1a\u672a\u63d0\u4ea4\u5de5\u5355\u3002');

    return lines.join('\n');
  }

  function matchCategory(text) {
    var t = String(text || '').toLowerCase().replace(/\s+/g, '');
    if (!t) return null;
    if (t.indexOf('套餐') >= 0 || t.indexOf('多少钱') >= 0 ||
      t.indexOf('资费') >= 0 || t.indexOf('价格') >= 0) return null;
    if (t.indexOf('webvpn') >= 0) return 'webvpn';
    if (t.indexOf('vpn') >= 0) return 'vpn';
    if (t.indexOf('wifi') >= 0 || t.indexOf('wi-fi') >= 0 || t.indexOf('无线') >= 0 || t.indexOf('校园网') >= 0) {
      return 'wifi';
    }
    if ((t.indexOf('校外') >= 0 || t.indexOf('家里') >= 0 || t.indexOf('回家') >= 0) &&
      (t.indexOf('教务') >= 0 || t.indexOf('图书馆') >= 0 || t.indexOf('知网') >= 0 ||
        t.indexOf('校内') >= 0 || t.indexOf('资源') >= 0)) {
      return 'webvpn';
    }
    if (t.indexOf('连不上') >= 0 || t.indexOf('认证') >= 0 || t.indexOf('宿舍') >= 0 ||
      t.indexOf('打不开网页') >= 0 || t.indexOf('打不开网站') >= 0) {
      return 'wifi';
    }
    if (t.indexOf('客户端') >= 0) return 'vpn';
    return null;
  }

  function parseDescription(text) {
    var t = String(text || '').toLowerCase();
    var facts = [];
    var summary = [];
    if (!t) return { facts: facts, summary: summary };

    var offCampus = /校外|家里|回家|不在学校/.test(t);
    var onCampus = /在校内|在学校|宿舍|教学楼|教室/.test(t);
    var internalOnly = /教务|图书馆|知网|校内资源|校内系统/.test(t);
    var allDown = /全部打不开|都打不开|所有网页|普通网页也|什么都打不开/.test(t);
    var singleSite = /只有一个|单个网站|某个网站|一个网站/.test(t);
    var ordinaryOk = /普通网页(能|可以|正常)|其他网页(能|可以|正常)|外网正常|上网正常/.test(t);

    if (internalOnly && (ordinaryOk || !allDown)) {
      facts.push({ factKey: 'resource_scope', value: 'internal_only' });
      summary.push('只有校内资源打不开');
    } else if (allDown) {
      facts.push({ factKey: 'resource_scope', value: 'all_web_down' });
      summary.push('普通网页也打不开');
    } else if (singleSite) {
      facts.push({ factKey: 'resource_scope', value: 'single_site' });
      summary.push('只有一个网站打不开');
    }

    if (offCampus && !onCampus) {
      facts.push({ factKey: 'access_scene', value: 'off_campus' });
      summary.push('在校外访问');
    } else if (onCampus && !offCampus) {
      facts.push({ factKey: 'access_scene', value: 'on_campus' });
      summary.push('在校内访问');
    }

    return { facts: facts, summary: summary };
  }

  function collectSources(session, extraIds) {
    var ids = [];
    var assessment = deriveAssessment(session);
    assessment.nextActionIds.forEach(function (actionId) {
      var action = D.ACTIONS[actionId];
      if (!action) return;
      (action.sourceIds || []).forEach(function (id) { ids.push(id); });
      (action.contactIds || []).forEach(function (contactId) {
        var contact = (K.CONTACTS || {})[contactId];
        if (contact && contact.sourceId) ids.push(contact.sourceId);
      });
    });
    (extraIds || []).forEach(function (id) { ids.push(id); });
    return unique(ids).filter(function (id) { return !!K.SOURCES[id]; });
  }

  function collectContacts(session, extraIds) {
    var ids = [];
    var assessment = deriveAssessment(session);
    assessment.nextActionIds.forEach(function (actionId) {
      var action = D.ACTIONS[actionId];
      if (!action) return;
      (action.contactIds || []).forEach(function (id) { ids.push(id); });
    });
    (extraIds || []).forEach(function (id) { ids.push(id); });
    return unique(ids).filter(function (id) { return !!K.CONTACTS[id]; });
  }

  global.NTA.diag = {
    facts: facts,
    factValue: factValue,
    factStatus: factStatus,
    activeEvidence: activeEvidence,
    findActive: findActive,
    recordObservation: recordObservation,
    reviseObservation: reviseObservation,
    answerQuestion: answerQuestion,
    answerClarify: answerClarify,
    startScenario: startScenario,
    needsQuestion: needsQuestion,
    deriveAssessment: deriveAssessment,
    getNextDecision: getNextDecision,
    recordActionResult: recordActionResult,
    recordVerification: recordVerification,
    buildHandoff: buildHandoff,
    parseDescription: parseDescription,
    matchCategory: matchCategory,
    collectSources: collectSources,
    collectContacts: collectContacts,
    formatTime: formatTime
  };
})(window);