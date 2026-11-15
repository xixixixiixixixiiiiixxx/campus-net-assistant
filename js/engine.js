(function (global) {
  'use strict';

  var K = global.NTA.knowledge;
  var D = global.NTA.diagnostics;
  var S = global.NTA.session;
  var Diag = global.NTA.diag;

  var STAGE_LABELS = ['问题', '现象', '排查', '结果'];

  Object.keys(K.NODES).forEach(function (key) {
    if (!K.NODES[key].id) K.NODES[key].id = key;
  });

  function getNode(id) {
    return (id && K.NODES[id]) ? K.NODES[id] : null;
  }

  function getCategory(id) {
    var i;
    for (i = 0; i < K.CATEGORIES.length; i++) {
      if (K.CATEGORIES[i].id === id) return K.CATEGORIES[i];
    }
    return null;
  }

  function getSource(id) {
    return K.SOURCES[id] || null;
  }

  function getContact(id) {
    return K.CONTACTS[id] || null;
  }

  function createHomeSession() {
    return S.createHomeSession();
  }

  function startDiagnostic(session, scenarioId) {
    Diag.startScenario(session, scenarioId);
    session.screen = 'diagnose';
    session.nodeId = null;
    return session;
  }

  function createSession(categoryId) {
    var cat = getCategory(categoryId);
    var session = S.createHomeSession();
    if (!cat) return session;
    session.categoryId = categoryId;
    session.nodeId = cat.entry;
    var node = getNode(cat.entry);
    if (node && node.type === 'diagnose') return startDiagnostic(session, node.scenarioId);
    session.screen = (node && node.type === 'outcome') ? 'outcome' : 'node';
    return session;
  }

  function createDiagnosticSession(categoryId, scenarioId) {
    var session = S.createHomeSession();
    session.categoryId = categoryId;
    return startDiagnostic(session, scenarioId);
  }

  function createSessionFromNode(nodeId) {
    var node = getNode(nodeId);
    if (!node) return S.createHomeSession();
    var session = S.createHomeSession();
    session.nodeId = nodeId;
    session.categoryId = node.category || null;
    if (node.type === 'diagnose') return startDiagnostic(session, node.scenarioId);
    session.screen = node.type === 'outcome' ? 'outcome' : 'node';
    session.startedAt = Date.now();
    return session;
  }

  function startSymptom(symptomId) {
    var found = null;
    (K.SYMPTOMS || []).forEach(function (symptom) {
      if (symptom.id === symptomId) found = symptom;
    });
    if (!found) return S.createHomeSession();
    return createSessionFromNode(found.entry);
  }

  function goTo(session, nodeId) {
    var node = getNode(nodeId);
    if (!node) return session;
    if (node.type === 'diagnose') return startDiagnostic(session, node.scenarioId);
    if (session.nodeId) session.stack.push(session.nodeId);
    session.nodeId = nodeId;
    session.screen = node.type === 'outcome' ? 'outcome' : 'node';
    if (node.category) session.categoryId = node.category;
    return session;
  }

  function choose(session, value) {
    var node = getNode(session.nodeId);
    if (!node || !node.options) return session;
    var picked = null;
    node.options.forEach(function (opt) {
      if (opt.value === value) picked = opt;
    });
    if (!picked) return session;
    session.answers = session.answers.filter(function (a) {
      return a.nodeId !== node.id;
    });
    session.answers.push({
      nodeId: node.id,
      prompt: node.prompt,
      label: picked.label,
      value: picked.value
    });
    session.revision = (session.revision || 0) + 1;
    return goTo(session, picked.next);
  }

  function back(session) {
    if (!session.stack.length) return session;
    var prev = session.stack.pop();
    session.answers = session.answers.filter(function (a) {
      return a.nodeId !== prev;
    });
    session.nodeId = prev;
    var node = getNode(prev);
    session.screen = (node && node.type === 'outcome') ? 'outcome' : 'node';
    if (node && node.category) session.categoryId = node.category;
    return session;
  }

  function markStep(session, stepId, result) {
    var nodeId = session.nodeId;
    if (!nodeId || !stepId) return session;
    session.stepRecords[nodeId] = session.stepRecords[nodeId] || {};
    if (session.stepRecords[nodeId][stepId] === result) {
      delete session.stepRecords[nodeId][stepId];
    } else {
      session.stepRecords[nodeId][stepId] = result;
    }
    return session;
  }

  function stepProgress(session, node) {
    var rec = session.stepRecords[node.id] || {};
    var done = 0;
    node.steps.forEach(function (step) {
      if (rec[step.id]) done += 1;
    });
    return { done: done, total: node.steps.length };
  }

  function visitedIds(session) {
    var ids = session.stack.concat([session.nodeId]);
    var seen = {};
    var out = [];
    ids.forEach(function (id) {
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }

  function collectStepNodes(session) {
    var out = [];
    visitedIds(session).forEach(function (id) {
      var node = getNode(id);
      if (node && node.type === 'steps') out.push(node);
    });
    return out;
  }

  function currentNodeSourceIds(session) {
    var node = getNode(session.nodeId);
    return node && node.sourceIds ? node.sourceIds.slice() : [];
  }

  function currentNodeContactIds(session) {
    var node = getNode(session.nodeId);
    return node && node.contactIds ? node.contactIds.slice() : [];
  }

  function collectSourceIds(session) {
    if (session.scenarioId) {
      return Diag.collectSources(session, currentNodeSourceIds(session));
    }
    var seen = {};
    var out = [];
    visitedIds(session).forEach(function (id) {
      var node = getNode(id);
      if (!node || !node.sourceIds) return;
      node.sourceIds.forEach(function (sid) {
        if (!seen[sid] && K.SOURCES[sid]) {
          seen[sid] = true;
          out.push(sid);
        }
      });
    });
    return out;
  }

  function collectContactIds(session) {
    if (session.scenarioId) {
      return Diag.collectContacts(session, currentNodeContactIds(session));
    }
    var seen = {};
    var out = [];
    visitedIds(session).forEach(function (id) {
      var node = getNode(id);
      if (!node || !node.contactIds) return;
      node.contactIds.forEach(function (contactId) {
        if (!seen[contactId] && K.CONTACTS[contactId]) {
          seen[contactId] = true;
          out.push(contactId);
        }
      });
    });
    return out;
  }

  function stageFor(session) {
    if (!session || session.screen === 'home') return 0;
    if (session.screen === 'diagnose' || session.screen === 'revise') return 2;
    if (session.screen === 'assessment' || session.screen === 'action' || session.screen === 'verify') return 3;
    if (session.screen === 'handoff' || session.screen === 'outcome') return 4;
    var node = getNode(session.nodeId);
    return node ? (node.stage || 1) : 1;
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function categoryTitle(id) {
    var cat = getCategory(id);
    return cat ? cat.title : '未分类';
  }

  function statusTag(status) {
    if (status === 'done') return '已完成';
    if (status === 'fail') return '无效';
    if (status === 'na') return '不适用';
    return '未标注';
  }

  function buildLegacyHelpText(session) {
    var lines = [];

    lines.push('【校园网络问题求助说明】');
    lines.push('生成时间：' + formatTime(Date.now()));
    lines.push('校区：' + K.META.campus);
    lines.push('适用对象：' + K.META.audience);
    lines.push('问题类型：' + categoryTitle(session.categoryId));
    lines.push('');

    lines.push('一、我遇到的情况');
    if (!session.answers.length) {
      lines.push('（未记录具体选择）');
    } else {
      session.answers.forEach(function (a, i) {
        lines.push((i + 1) + '. ' + a.prompt + ' → ' + a.label);
      });
    }
    lines.push('');

    lines.push('二、我已经尝试过的步骤');
    var stepNodes = collectStepNodes(session);
    if (!stepNodes.length) {
      lines.push('（尚未进入具体排查步骤）');
    } else {
      stepNodes.forEach(function (node) {
        var rec = session.stepRecords[node.id] || {};
        lines.push('【' + node.title + '】');
        node.steps.forEach(function (step, i) {
          lines.push('  ' + (i + 1) + '. [' + statusTag(rec[step.id]) + '] ' + step.text);
        });
      });
    }
    lines.push('');

    lines.push('三、补充信息');
    lines.push('错误提示：' + (session.extra ? session.extra : '未填写'));
    lines.push('');

    lines.push('四、希望得到的帮助');
    lines.push('请协助判断问题原因，并告知下一步应该如何处理。');
    lines.push('');
    lines.push('——');
    lines.push('本说明由「松山湖校区学生网络排障助手」根据本人操作记录生成。');
    lines.push('本说明仅为文字材料，尚未提交工单，也未联系信息技术中心。');

    return lines.join('\n');
  }

  function buildHelpText(session) {
    if (session.scenarioId) return Diag.buildHandoff(session);
    return buildLegacyHelpText(session);
  }

  function getDecision(session) {
    return Diag.getNextDecision(session);
  }

  function deriveAssessment(session) {
    return Diag.deriveAssessment(session);
  }

  global.NTA.engine = {
    STAGE_LABELS: STAGE_LABELS,
    getNode: getNode,
    getCategory: getCategory,
    getSource: getSource,
    getContact: getContact,
    createHomeSession: createHomeSession,
    createSession: createSession,
    createDiagnosticSession: createDiagnosticSession,
    createSessionFromNode: createSessionFromNode,
    startSymptom: startSymptom,
    startDiagnostic: startDiagnostic,
    goTo: goTo,
    choose: choose,
    back: back,
    markStep: markStep,
    stepProgress: stepProgress,
    collectStepNodes: collectStepNodes,
    collectSourceIds: collectSourceIds,
    collectContactIds: collectContactIds,
    stageFor: stageFor,
    buildHelpText: buildHelpText,
    getDecision: getDecision,
    deriveAssessment: deriveAssessment,
    categoryTitle: categoryTitle,
    formatTime: formatTime
  };
})(window);