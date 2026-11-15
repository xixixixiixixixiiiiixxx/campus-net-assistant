(function (global) {
  'use strict';

  var D = global.NTA.diagnostics;

  var SCHEMA_VERSION = D.SCHEMA_VERSION;
  var STORAGE_KEY = 'nta.session.v2';
  var LEGACY_KEY = 'nta.session.v1';

  var STATUS = ['available', 'unknown', 'not_tested', 'unsupported', 'failed'];
  var VALIDITY = ['active', 'superseded', 'stale'];
  var EXECUTION = ['not_started', 'completed', 'unable', 'skipped'];
  var EFFECT = ['restored', 'unchanged', 'partial', 'not_checked'];
  var FACT_KEYS = {};

  Object.keys(D.QUESTIONS).forEach(function (key) {
    FACT_KEYS[D.QUESTIONS[key].factKey] = true;
  });

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function isoTime(ts) {
    var d = new Date(ts);
    var offset = -d.getTimezoneOffset();
    var sign = offset >= 0 ? '+' : '-';
    var abs = Math.abs(offset);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
      sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
  }

  function toTime(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    var parsed = Date.parse(value);
    if (!isNaN(parsed)) return parsed;
    var match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value));
    if (match) {
      return new Date(
        Number(match[1]), Number(match[2]) - 1, Number(match[3]),
        Number(match[4]), Number(match[5]), Number(match[6] || 0)
      ).getTime();
    }
    return 0;
  }

  function createHomeSession(now) {
    var ts = now || Date.now();
    return {
      schemaVersion: SCHEMA_VERSION,
      knowledgeVersion: D.KNOWLEDGE_VERSION,
      revision: 0,
      mode: 'rules',
      screen: 'home',
      scenarioId: null,
      categoryId: null,
      nodeId: null,
      stack: [],
      answers: [],
      stepRecords: {},
      context: {
        campus: 'songshanhu',
        audience: 'student',
        accessScene: 'unknown',
        area: '',
        servicePartition: 'unknown',
        networkPath: 'unknown',
        deviceType: 'unknown',
        osFamily: 'unknown',
        symptomStarted: ''
      },
      observations: [],
      evidenceSeq: 0,
      actionRecords: [],
      askedQuestionIds: [],
      editingQuestionId: null,
      conflict: null,
      questionBudget: D.DEFAULT_QUESTION_BUDGET,
      budgetUsed: 0,
      resolution: 'not_checked',
      handoff: null,
      helpDraft: { text: '', edited: false, basedOnRevision: 0, savedPref: false },
      extra: '',
      startedAt: ts,
      lastInteractedAt: ts
    };
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function cleanString(value, max) {
    if (typeof value !== 'string') return '';
    return value.slice(0, max);
  }

  function cleanObservations(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    list.slice(-200).forEach(function (o) {
      if (!isPlainObject(o)) return;
      if (typeof o.id !== 'string' || !/^e-[0-9]+$/.test(o.id)) return;
      if (!FACT_KEYS[o.factKey]) return;
      if (STATUS.indexOf(o.status) < 0) return;
      if (VALIDITY.indexOf(o.validity) < 0) return;
      out.push({
        id: o.id,
        factKey: o.factKey,
        kind: o.kind === 'browser' ? 'browser' : 'user_report',
        status: o.status,
        value: cleanString(o.value, 40),
        observedAt: cleanString(o.observedAt, 40),
        validity: o.validity,
        context: isPlainObject(o.context) ? o.context : {},
        supersedes: typeof o.supersedes === 'string' ? o.supersedes : null,
        reasonCode: typeof o.reasonCode === 'string' ? o.reasonCode : null,
        questionId: typeof o.questionId === 'string' ? o.questionId : null
      });
    });
    return out;
  }

  function cleanStepStates(raw) {
    if (!isPlainObject(raw)) return null;
    var out = {};
    Object.keys(raw).slice(0, 40).forEach(function (stepId) {
      if (EXECUTION.indexOf(raw[stepId]) >= 0) out[stepId] = raw[stepId];
    });
    return out;
  }

  function cleanActionRecords(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    list.slice(-40).forEach(function (r) {
      if (!isPlainObject(r)) return;
      if (!D.ACTIONS[r.actionId]) return;
      if (EXECUTION.indexOf(r.execution) < 0) return;
      if (EFFECT.indexOf(r.effect) < 0) return;
      out.push({
        actionId: r.actionId,
        execution: r.execution,
        effect: r.effect,
        basedOnEvidenceIds: Array.isArray(r.basedOnEvidenceIds)
          ? r.basedOnEvidenceIds.filter(function (id) { return typeof id === 'string'; }).slice(0, 20)
          : [],
        stepStates: cleanStepStates(r.stepStates),
        recordedAt: cleanString(r.recordedAt, 40)
      });
    });
    return out;
  }

  function cleanAnswers(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (a) {
      return isPlainObject(a) && typeof a.prompt === 'string' && typeof a.label === 'string';
    }).slice(-40).map(function (a) {
      return {
        nodeId: typeof a.nodeId === 'string' ? a.nodeId : '',
        prompt: cleanString(a.prompt, 200),
        label: cleanString(a.label, 200),
        value: cleanString(a.value, 60)
      };
    });
  }

  function cleanStack(list, getNode) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (id) {
      return typeof id === 'string' && getNode && getNode(id);
    }).slice(-40);
  }

  function cleanStepRecords(raw) {
    if (!isPlainObject(raw)) return {};
    var out = {};
    Object.keys(raw).slice(0, 40).forEach(function (nodeId) {
      var record = raw[nodeId];
      if (!isPlainObject(record)) return;
      var cleaned = {};
      Object.keys(record).slice(0, 40).forEach(function (stepId) {
        var value = record[stepId];
        if (value === 'done' || value === 'fail' || value === 'na') cleaned[stepId] = value;
      });
      out[nodeId] = cleaned;
    });
    return out;
  }

  function cleanContext(raw) {
    var base = createHomeSession(0).context;
    if (!isPlainObject(raw)) return base;
    return {
      campus: cleanString(raw.campus, 40) || base.campus,
      audience: cleanString(raw.audience, 40) || base.audience,
      accessScene: ['on_campus', 'off_campus', 'unknown'].indexOf(raw.accessScene) >= 0 ? raw.accessScene : 'unknown',
      area: cleanString(raw.area, 60),
      servicePartition: ['north', 'south', 'unknown'].indexOf(raw.servicePartition) >= 0 ? raw.servicePartition : 'unknown',
      networkPath: cleanString(raw.networkPath, 40) || 'unknown',
      deviceType: ['phone', 'laptop', 'tablet', 'unknown'].indexOf(raw.deviceType) >= 0 ? raw.deviceType : 'unknown',
      osFamily: cleanString(raw.osFamily, 20) || 'unknown',
      symptomStarted: cleanString(raw.symptomStarted, 60)
    };
  }

  function validate(raw, getNode) {
    if (!isPlainObject(raw)) return null;
    if (raw.schemaVersion !== SCHEMA_VERSION) return null;
    if (['rules', 'model'].indexOf(raw.mode) < 0) return null;

    var session = createHomeSession(0);
    session.revision = typeof raw.revision === 'number' && raw.revision >= 0 ? Math.min(raw.revision, 99999) : 0;
    session.mode = raw.mode;
    session.screen = ['home', 'node', 'diagnose', 'assessment', 'action', 'verify', 'handoff', 'revise', 'outcome'].indexOf(raw.screen) >= 0
      ? raw.screen : 'home';
    session.scenarioId = D.SCENARIOS[raw.scenarioId] ? raw.scenarioId : null;
    session.categoryId = ['wifi', 'vpn', 'webvpn', 'unsure'].indexOf(raw.categoryId) >= 0 ? raw.categoryId : null;
    session.nodeId = typeof raw.nodeId === 'string' && getNode && getNode(raw.nodeId) ? raw.nodeId : null;
    session.stack = cleanStack(raw.stack, getNode);
    session.answers = cleanAnswers(raw.answers);
    session.stepRecords = cleanStepRecords(raw.stepRecords);
    session.context = cleanContext(raw.context);
    session.observations = cleanObservations(raw.observations);
    session.evidenceSeq = session.observations.reduce(function (max, o) {
      var n = parseInt(o.id.replace('e-', ''), 10);
      return n > max ? n : max;
    }, typeof raw.evidenceSeq === 'number' ? Math.max(0, Math.min(raw.evidenceSeq, 99999)) : 0);
    session.actionRecords = cleanActionRecords(raw.actionRecords);
    session.askedQuestionIds = Array.isArray(raw.askedQuestionIds)
      ? raw.askedQuestionIds.filter(function (id) { return typeof id === 'string'; }).slice(-20)
      : [];
    session.questionBudget = typeof raw.questionBudget === 'number' ? Math.max(1, Math.min(raw.questionBudget, 10)) : D.DEFAULT_QUESTION_BUDGET;
    session.budgetUsed = typeof raw.budgetUsed === 'number' ? Math.max(0, Math.min(raw.budgetUsed, 20)) : 0;
    session.resolution = ['not_checked', 'user_reported_restored', 'user_reported_partial', 'user_reported_unchanged'].indexOf(raw.resolution) >= 0
      ? raw.resolution : 'not_checked';
    session.extra = cleanString(raw.extra, D.MAX_FREE_TEXT);
    session.helpDraft = {
      text: cleanString(raw.helpDraft && raw.helpDraft.text, D.MAX_HANDOFF_TEXT),
      edited: !!(raw.helpDraft && raw.helpDraft.edited),
      basedOnRevision: typeof (raw.helpDraft && raw.helpDraft.basedOnRevision) === 'number'
        ? Math.max(0, Math.min(raw.helpDraft.basedOnRevision, 99999)) : session.revision,
      savedPref: !!(raw.helpDraft && raw.helpDraft.savedPref)
    };
    session.startedAt = toTime(raw.startedAt) || 0;
    session.lastInteractedAt = toTime(raw.lastInteractedAt) || 0;

    if (session.screen !== 'home' && !session.nodeId && !session.scenarioId && session.categoryId) {
      session.screen = 'home';
      session.categoryId = null;
    }
    return session;
  }

  function isExpired(session, now) {
    var last = toTime(session.lastInteractedAt) || session.startedAt || 0;
    if (!last) return false;
    return (now || Date.now()) - last > D.SESSION_TTL_MS;
  }

  function migrate(raw, getNode, now) {
    if (!isPlainObject(raw)) return { session: createHomeSession(now), status: 'invalid' };
    if (raw.schemaVersion === SCHEMA_VERSION) {
      var session = validate(raw, getNode);
      if (!session) return { session: createHomeSession(now), status: 'invalid' };
      if (isExpired(session, now)) return { session: createHomeSession(now), status: 'expired' };
      return { session: session, status: 'ok' };
    }
    if (typeof raw.nodeId === 'string' && getNode && getNode(raw.nodeId)) {
      return { session: createHomeSession(now), status: 'legacy', legacy: raw };
    }
    return { session: createHomeSession(now), status: 'invalid' };
  }

  function serialize(session, includeText) {
    var draft = session.helpDraft || {};
    var out = {
      schemaVersion: SCHEMA_VERSION,
      knowledgeVersion: D.KNOWLEDGE_VERSION,
      revision: session.revision,
      mode: session.mode,
      screen: session.screen,
      scenarioId: session.scenarioId,
      categoryId: session.categoryId,
      nodeId: session.nodeId,
      stack: session.stack,
      answers: session.answers,
      stepRecords: session.stepRecords,
      context: session.context,
      observations: session.observations,
      evidenceSeq: session.evidenceSeq,
      actionRecords: session.actionRecords,
      askedQuestionIds: session.askedQuestionIds,
      questionBudget: session.questionBudget,
      budgetUsed: session.budgetUsed,
      resolution: session.resolution,
      startedAt: session.startedAt,
      lastInteractedAt: session.lastInteractedAt,
      helpDraft: {
        text: includeText ? cleanString(draft.text, D.MAX_HANDOFF_TEXT) : '',
        edited: !!draft.edited,
        basedOnRevision: draft.basedOnRevision || 0,
        savedPref: includeText
      },
      extra: includeText ? cleanString(session.extra, D.MAX_FREE_TEXT) : ''
    };
    return out;
  }

  function save(storage, session, includeText) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(serialize(session, includeText)));
      return true;
    } catch (err) {
      return false;
    }
  }

  function load(storage, getNode, now) {
    var raw = null;
    try {
      var text = storage.getItem(STORAGE_KEY);
      raw = text ? JSON.parse(text) : null;
    } catch (err) {
      return { session: createHomeSession(now), status: 'invalid' };
    }
    if (raw) return migrate(raw, getNode, now);

    var legacy = null;
    try {
      var old = storage.getItem(LEGACY_KEY);
      legacy = old ? JSON.parse(old) : null;
    } catch (err2) {
      legacy = null;
    }
    if (legacy) return { session: createHomeSession(now), status: 'legacy', legacy: legacy };
    return { session: createHomeSession(now), status: 'empty' };
  }

  function clear(storage) {
    try {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(LEGACY_KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  global.NTA.session = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    LEGACY_KEY: LEGACY_KEY,
    STATUS: STATUS,
    VALIDITY: VALIDITY,
    EXECUTION: EXECUTION,
    EFFECT: EFFECT,
    createHomeSession: createHomeSession,
    validate: validate,
    migrate: migrate,
    isExpired: isExpired,
    serialize: serialize,
    save: save,
    load: load,
    clear: clear,
    isoTime: isoTime,
    toTime: toTime
  };
})(window);