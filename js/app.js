(function (global) {
  'use strict';

  var E = global.NTA.engine;
  var U = global.NTA.ui;
  var D = global.NTA.diagnostics;
  var Diag = global.NTA.diag;
  var S = global.NTA.session;

  var els = {
    view: document.getElementById('view'),
    bar: document.getElementById('steps-bar'),
    trace: document.getElementById('trace'),
    contacts: document.getElementById('contact-list'),
    sources: document.getElementById('source-list'),
    privacy: document.getElementById('privacy'),
    restart: document.getElementById('btn-restart'),
    toast: document.getElementById('toast'),
    thread: document.getElementById('chat-thread'),
    composer: document.getElementById('chat-composer'),
    input: document.getElementById('chat-input'),
    send: document.querySelector('.chat-send')
  };

  function getStorage() {
    try {
      return window.localStorage;
    } catch (err) {
      return null;
    }
  }

  var storage = getStorage();
  var loaded = storage
    ? S.load(storage, E.getNode)
    : { session: E.createHomeSession(), status: 'empty' };

  var state = loaded.session;
  var toastTimer = null;

  if (loaded.status === 'expired') {
    state.notice = '上次排查记录已超过 24 小时，已为你重新开始。';
  } else if (loaded.status === 'legacy') {
    state.notice = '检测到旧版记录。旧记录已保留，但不会自动继续，也不会把旧的“已完成”当作已修复；请重新选择入口。';
  } else if (loaded.status === 'invalid') {
    state.notice = '上次保存的记录无法安全读取，已重新开始。';
  }

  function persist() {
    if (!storage) return;
    S.save(storage, state, !!(state.helpDraft && state.helpDraft.savedPref));
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      els.toast.classList.remove('is-show');
    }, 2400);
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  var archivedKey = '';

  function syncWelcome() {
    var hasConversation = !!(els.thread && els.thread.querySelector('.chat-msg--user'));
    els.restart.hidden = state.screen === 'home' && !hasConversation;
    if (global.NTA.welcome) {
      global.NTA.welcome.sync(state.screen, hasConversation);
    }
  }

  function clearThread() {
    if (els.thread) els.thread.innerHTML = '';
    archivedKey = '';
    live.revealed = true;
  }

  function scrollThread() {
    if (!els.thread || !els.thread.children.length) return;
    if (els.thread) els.thread.scrollTop = els.thread.scrollHeight;
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function archiveView() {
    if (!els.thread || !els.view || !els.view.innerHTML) return;
    if (state.screen === 'home') return;
    var key = [state.screen, state.nodeId || '', state.pendingActionId || '',
      state.editingQuestionId || '', state.scenarioId || ''].join('|');
    if (key === archivedKey) return;
    archivedKey = key;

    var clone = els.view.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('tabindex');
    clone.classList.remove('view');
    clone.classList.remove('chat-current');
    clone.classList.remove('chat-live');
    clone.classList.remove('is-revealing');
    Array.prototype.forEach.call(clone.querySelectorAll('[id]'), function (el) {
      el.removeAttribute('id');
    });
    Array.prototype.forEach.call(clone.querySelectorAll('[data-action]'), function (el) {
      el.removeAttribute('data-action');
    });
    Array.prototype.forEach.call(clone.querySelectorAll('button, input, textarea, select'), function (el) {
      el.disabled = true;
    });
    clone.classList.add('chat-past');

    var wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg--assistant chat-msg--past';
    wrap.appendChild(clone);
    els.thread.appendChild(wrap);
    scrollThread();
  }

  function pushUser(text) {
    if (!els.thread || !text) return;
    var node = document.createElement('div');
    node.className = 'chat-msg chat-msg--user';
    node.textContent = String(text).slice(0, 500);
    els.thread.appendChild(node);
    syncWelcome();
    scrollThread();
  }

  function pushAssistantHtml(html) {
    if (!els.thread || !html) return;
    var node = document.createElement('div');
    node.className = 'chat-msg chat-msg--assistant';
    node.innerHTML = html;
    els.thread.appendChild(node);
    scrollThread();
  }

  function pushNotice(text) {
    if (!els.thread || !text) return;
    var node = document.createElement('div');
    node.className = 'chat-msg chat-msg--notice';
    node.textContent = text;
    els.thread.appendChild(node);
    scrollThread();
  }

  var THINK_DELAY = { urgent: 120, quick: 260, normal: 420, stage: 620 };
  var live = { seq: 0, timer: null, task: null, revealed: true };
  var motionQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function reduceMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  function pushThinking(text) {
    if (!els.thread) return;
    var node = document.createElement('div');
    node.className = 'chat-msg chat-msg--assistant chat-msg--thinking';
    node.id = 'chat-thinking';
    node.setAttribute('role', 'status');
    node.innerHTML = '<span class="thinking__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="thinking__text">' + U.esc(text || '正在对照你的回答…') + '</span>';
    els.thread.appendChild(node);
    scrollThread();
  }

  function removeThinking() {
    var node = document.getElementById('chat-thinking');
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function lockChat(locked) {
    if (els.view) {
      if (locked) {
        els.view.setAttribute('inert', '');
        els.view.setAttribute('aria-busy', 'true');
      } else {
        els.view.removeAttribute('inert');
        els.view.removeAttribute('aria-busy');
      }
    }
    if (els.send) els.send.disabled = !!locked;
  }

  function stopThinking() {
    if (live.timer) {
      clearTimeout(live.timer);
      live.timer = null;
    }
    removeThinking();
  }

  function cancelPending() {
    live.seq += 1;
    live.task = null;
    stopThinking();
    lockChat(false);
  }

  function flushPending() {
    if (!live.timer || !live.task) return;
    live.seq += 1;
    var task = live.task;
    live.task = null;
    stopThinking();
    lockChat(false);
    task();
    revealView();
  }

  function beginTurn(label, task, delay, text) {
    archiveView();
    pushUser(label);
    live.seq += 1;
    var seq = live.seq;
    stopThinking();
    lockChat(true);
    pushThinking(text);
    live.task = task;
    live.timer = setTimeout(function () {
      if (seq !== live.seq) return;
      live.timer = null;
      var run = live.task;
      live.task = null;
      stopThinking();
      lockChat(false);
      if (run) run();
      revealView();
    }, delay || THINK_DELAY.normal);
  }

  function scrollToLive() {
    if (!els.view) return;
    var rect = els.view.getBoundingClientRect();
    var viewport = global.innerHeight || document.documentElement.clientHeight;
    if (rect.top >= 96 && rect.bottom <= viewport) return;
    var top = rect.top + (global.pageYOffset || document.documentElement.scrollTop || 0) - 96;
    if (typeof global.scrollTo === 'function') {
      global.scrollTo({ top: Math.max(0, top), behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }

  function typewriteLast() {
    if (!els.thread) return;
    var msg = els.thread.lastElementChild;
    if (!msg) return;
    var reduced = reduceMotion();
    Array.prototype.forEach.call(msg.querySelectorAll('[data-typewrite]'), function (span) {
      var full = span.getAttribute('data-full-text') || '';
      if (!full) return;
      if (reduced) {
        span.textContent = full;
        return;
      }
      var perChar = Math.max(16, Math.min(24, Math.round(900 / Math.max(12, full.length))));
      var index = 0;
      span.textContent = '';
      var timer = global.setInterval(function () {
        index += 1;
        span.textContent = full.slice(0, index);
        if (index % 6 === 0 || index >= full.length) scrollThread();
        if (index >= full.length) global.clearInterval(timer);
      }, perChar);
    });
  }

  function revealView() {
    if (!els.view || !els.view.classList.contains('chat-live')) {
      scrollToLive();
      return;
    }
    if (live.revealed) {
      scrollToLive();
      return;
    }
    live.revealed = true;
    els.view.classList.remove('is-revealing');
    void els.view.offsetWidth;
    els.view.classList.add('is-revealing');
    scrollToLive();
    typewriteLast();
  }


  function localReplyHtml(entry, reason) {
    var kb = global.NTA.knowledgeBase;
    var result = {
      mode: 'rules',
      reply: entry ? entry.content : '暂未找到与你的描述匹配的官方依据。',
      steps: entry ? entry.steps : [],
      sources: entry ? entry.sourceIds.map(function (id) { return kb.getSource(id); }).filter(Boolean) : [],
      contacts: entry ? entry.contactIds.map(function (id) { return kb.getContact(id); }).filter(Boolean) : [],
      fallback: reason || 'no_backend'
    };
    return U.renderChatReply(result);
  }

  function handleFreeText(text) {
    var value = String(text || '').trim().slice(0, 500);
    if (!value) return;

    if (state.screen === 'home') {
      var categoryId = Diag.matchCategory(value);
      if (categoryId) {
        beginTurn(value, function () {
          state.pendingCategoryId = categoryId;
          state.pendingCategoryText = value;
          state.screen = 'confirm';
          render({ focus: true });
        }, THINK_DELAY.normal, '正在对照你的描述…');
        return;
      }
    }

    var kb = global.NTA.knowledgeBase;
    var hit = kb ? kb.find(value, { campus: 'songshanhu', audience: 'student' }) : { hit: false };
    if (hit && hit.hit) {
      askModel(value, hit);
      return;
    }

    if (state.screen === 'diagnose' || state.screen === 'action' || state.screen === 'verify') {
      beginTurn(value, function () {
        state.extra = ((state.extra || '') + ' ' + value).trim().slice(0, D.MAX_FREE_TEXT);
        render({ focus: false });
        pushNotice('已记下这条补充说明，会写入求助说明。');
      }, THINK_DELAY.quick, '正在记下这条补充…');
      return;
    }

    beginTurn(value, function () {
      pushNotice('暂未找到与这句话匹配的官方依据。可以点上面的选项，或者直接说“找人工”。');
    }, THINK_DELAY.quick, '正在找对应的官方依据…');
  }

  function collectHistory() {
    if (!els.thread) return [];
    var nodes = els.thread.querySelectorAll('.chat-msg');
    var start = Math.max(0, nodes.length - 6);
    var out = [];
    for (var i = start; i < nodes.length; i++) {
      var node = nodes[i];
      var isUser = String(node.className || '').indexOf('chat-msg--user') >= 0;
      var text = String(node.innerText || node.textContent || '')
        .replace(/\s+/g, ' ').trim().slice(0, 300);
      if (!text) continue;
      out.push({ role: isUser ? 'user' : 'assistant', content: text });
    }
    return out;
  }

  function askModel(text, hit) {
    var entry = hit.entry;
    var history = collectHistory();
    var seq = ++live.seq;
    var started = Date.now();
    archiveView();
    pushUser(text);
    stopThinking();
    lockChat(true);
    pushThinking('正在查官方资料…');

    function finish(html) {
      if (seq !== live.seq) return;
      var wait = reduceMotion() ? 0 : Math.max(0, 600 - (Date.now() - started));
      global.setTimeout(function () {
        if (seq !== live.seq) return;
        stopThinking();
        lockChat(false);
        if (!html) return;
        pushAssistantHtml(html);
        typewriteLast();
      }, wait);
    }

    if (!global.NTA.api || typeof global.NTA.api.chat !== 'function') {
      finish(localReplyHtml(entry, 'no_backend'));
      return;
    }

    global.NTA.api.chat(global.NTA.api.buildPayload(text, null, history)).then(function (result) {
      finish(result ? U.renderChatReply(result) : localReplyHtml(entry, 'no_backend'));
    }, function () {
      finish(localReplyHtml(entry, 'network'));
    });
  }

  var speedTrigger = null;

  function openSpeedTest(trigger) {
    var layer = document.getElementById('speed-layer');
    var body = document.getElementById('speed-body');
    if (!layer || !body) return;
    speedTrigger = trigger || null;
    body.innerHTML = U.renderSpeedTest();
    layer.hidden = false;
    document.body.classList.add('is-locked');
    var start = layer.querySelector('[data-action="speedtest-start"]');
    if (start) start.focus();
  }

  function closeSpeedTest() {
    var layer = document.getElementById('speed-layer');
    var body = document.getElementById('speed-body');
    var frame = document.getElementById('speedtest-frame');
    if (frame) frame.src = 'about:blank';
    if (body) body.innerHTML = '';
    if (layer) layer.hidden = true;
    document.body.classList.remove('is-locked');
    var trigger = speedTrigger || document.querySelector('[data-action="speedtest-open"]');
    speedTrigger = null;
    if (trigger) trigger.focus();
  }

  function currentQuestion() {
    if (state.editingQuestionId) {
      return D.QUESTIONS[state.editingQuestionId] || null;
    }
    var decision = E.getDecision(state);
    if (decision.kind !== 'question') return null;
    if (decision.dynamic) return decision.dynamic;
    return D.QUESTIONS[decision.questionId] || null;
  }

  function currentAssessment() {
    if (state.scenarioId) return E.deriveAssessment(state);
    return {
      direction: 'undetermined',
      directionLabel: '基于已执行的步骤整理信息',
      support: [],
      unknowns: ['当前流程没有做对照观察，暂不能区分具体方向。'],
      nextActionIds: [],
      ruleIds: []
    };
  }

  function ensureDraft() {
    if (!state.helpDraft.edited) {
      state.helpDraft.text = E.buildHelpText(state);
      state.helpDraft.basedOnRevision = state.revision;
    }
  }

  function regenerateDraft() {
    state.helpDraft.text = E.buildHelpText(state);
    state.helpDraft.edited = false;
    state.helpDraft.basedOnRevision = state.revision;
  }

  function setHidden(id, hidden) {
    var el = document.getElementById(id);
    if (el) el.hidden = hidden;
  }

  function syncSidebar() {
    var screen = state.screen;
    setHidden('side-record', screen === 'home' || screen === 'confirm');
    setHidden('side-contact', screen === 'home' || screen === 'assessment' || screen === 'handoff');
    setHidden('side-privacy', screen === 'home' || screen === 'handoff');
    setHidden('side-source', screen === 'home' || screen === 'confirm');
    setHidden('side-note', screen !== 'home' && screen !== 'confirm');
  }

  function render(options) {
    var opts = options || {};
    live.revealed = false;
    if (els.view) els.view.classList.toggle('chat-live', state.screen !== 'home');
    var node = E.getNode(state.nodeId);
    var decision = null;
    var assessment = null;
    var action = null;

    if (state.screen !== 'home' && state.screen !== 'confirm' && !state.scenarioId && !node) {
      state = E.createHomeSession();
      loaded.status = 'empty';
      return render(options);
    }

    if (state.screen === 'home') {
      els.bar.hidden = true;
      els.view.innerHTML = U.renderHome(state);
      els.restart.hidden = true;
    } else if (state.screen === 'confirm') {
      var confirmCategory = E.getCategory(state.pendingCategoryId);
      if (!confirmCategory) {
        state.screen = 'home';
        return render(options);
      }
      els.bar.hidden = true;
      els.view.innerHTML = U.renderConfirmCategory(state, confirmCategory, state.pendingCategoryText || '');
      els.restart.hidden = false;
    } else if (state.screen === 'diagnose') {
      var question = currentQuestion();
      if (!question) {
        state.screen = 'assessment';
        return render(options);
      }
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(2);
      els.view.innerHTML = U.renderDiagnose(state, question);
      els.restart.hidden = false;
    } else if (state.screen === 'revise') {
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(E.stageFor(state));
      els.view.innerHTML = U.renderRevise(state);
      els.restart.hidden = false;
    } else if (state.screen === 'assessment') {
      decision = E.getDecision(state);
      if (decision.kind === 'question') {
        state.screen = 'diagnose';
        return render(options);
      }
      assessment = decision.assessment || currentAssessment();
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(3);
      els.view.innerHTML = U.renderAssessment(state, assessment, decision);
      els.restart.hidden = false;
    } else if (state.screen === 'action') {
      decision = E.getDecision(state);
      var actionId = state.pendingActionId;
      if (!actionId && decision.kind === 'action') actionId = decision.actionId;
      action = D.ACTIONS[actionId];
      if (!action) {
        state.screen = 'assessment';
        return render(options);
      }
      state.pendingActionId = actionId;
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(3);
      els.view.innerHTML = U.renderActionPack(state, action);
      els.restart.hidden = false;
    } else if (state.screen === 'verify') {
      action = D.ACTIONS[state.pendingActionId];
      if (!action) {
        state.screen = 'assessment';
        return render(options);
      }
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(3);
      els.view.innerHTML = U.renderVerify(state, action);
      els.restart.hidden = false;
    } else if (state.screen === 'handoff') {
      ensureDraft();
      assessment = currentAssessment();
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(4);
      els.view.innerHTML = U.renderHandoff(state, state.helpDraft.text, assessment);
      els.restart.hidden = false;
    } else if (state.screen === 'recovered') {
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(4);
      els.view.innerHTML = U.renderRecovered(state);
      els.restart.hidden = false;
    } else {
      if (!node) {
        state = E.createHomeSession();
        return render(options);
      }
      if (node.type === 'diagnose') {
        E.startDiagnostic(state, node.scenarioId);
        return render(options);
      }
      els.bar.hidden = false;
      els.bar.innerHTML = U.renderStepsBar(node.stage || 1);
      if (node.type === 'outcome') {
        els.view.innerHTML = U.renderLegacyOutcome(node, state,
          state.helpDraft.edited ? state.helpDraft.text : E.buildHelpText(state));
      } else if (node.type === 'steps') {
        els.view.innerHTML = U.renderSteps(node, state);
      } else if (node.type === 'notice') {
        els.view.innerHTML = U.renderNotice(node, state);
      } else {
        els.view.innerHTML = U.renderQuestion(node, state);
      }
      els.restart.hidden = false;
    }

    if (els.trace) U.renderTrace(els.trace, state);
    if (els.contacts) els.contacts.innerHTML = U.renderStudentContacts();
    if (els.privacy) els.privacy.innerHTML = U.renderPrivacy(state);
    if (els.sources) U.renderSources(els.sources, state);
    syncSidebar();
    syncWelcome();
    scrollThread();

    if (opts.focus) {
      els.view.focus({ preventScroll: true });
    }

    persist();
  }

  function syncStepButton() {
    var node = E.getNode(state.nodeId);
    var action = D.ACTIONS[state.pendingActionId];

    if (state.screen === 'action' && action) {
      var draft = state.actionStepDraft || {};
      var marked = action.steps.filter(function (step) { return !!draft[step.id]; }).length;
      var actionCounter = els.view.querySelector('#step-count');
      if (actionCounter) actionCounter.textContent = marked;
      return;
    }

    if (!node || node.type !== 'steps') return;
    var progress = E.stepProgress(state, node);
    var btn = els.view.querySelector('[data-action="steps-next"]');
    var counter = els.view.querySelector('#step-count');
    if (btn) btn.disabled = progress.done < progress.total;
    if (counter) counter.textContent = progress.done + '/' + progress.total;
  }

  function currentHelpText() {
    var box = document.getElementById('help-text');
    return box ? box.value : (state.helpDraft.text || E.buildHelpText(state));
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  function copyText(text, okMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        toast(okMessage);
      }, function () {
        toast(legacyCopy(text) ? okMessage : '复制失败，请手动选择文本');
      });
    } else {
      toast(legacyCopy(text) ? okMessage : '复制失败，请手动选择文本');
    }
  }

  function downloadText(text) {
    var stamp = E.formatTime(Date.now()).replace(/[-: ]/g, '');
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = '校园网络求助说明_' + stamp + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('已生成文本文件');
  }

  function aggregateExecution(action) {
    var draft = state.actionStepDraft || {};
    var completed = 0;
    var unable = 0;
    action.steps.forEach(function (step) {
      if (draft[step.id] === 'completed') completed += 1;
      if (draft[step.id] === 'unable') unable += 1;
    });
    if (completed > 0) return 'completed';
    if (unable > 0) return 'unable';
    return 'skipped';
  }

  function applyDescription(targetState, text) {
    if (!targetState || !text) return;
    var parsed = Diag.parseDescription(text);
    targetState.description = text;
    targetState.descriptionSummary = parsed.summary;
    if (!targetState.scenarioId) return;
    parsed.facts.forEach(function (fact) {
      Diag.recordObservation(targetState, fact.factKey, fact.value, {
        kind: 'user_report',
        reasonCode: 'from_description'
      });
    });
  }


  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');

    if (action === 'chat-chip') {
      handleFreeText(target.getAttribute('data-text') || '');
      return;
    }

    if (action === 'start') {
      var startCategory = target.getAttribute('data-category');
      beginTurn(target.textContent.trim(), function () {
        state = E.createSession(startCategory);
        state.notice = '';
        render({ focus: true });
      }, THINK_DELAY.normal, '正在准备第一个问题…');
      return;
    }

    if (action === 'start-symptom') {
      var startSymptom = target.getAttribute('data-symptom');
      beginTurn(target.getAttribute('data-message') || target.textContent.trim(), function () {
        state = E.startSymptom(startSymptom);
        state.notice = '';
        render({ focus: true });
      }, THINK_DELAY.normal, '正在准备第一个问题…');
      return;
    }

    if (action === 'confirm-category') {
      var confirmedId = target.getAttribute('data-category');
      beginTurn(target.textContent.trim(), function () {
        var pendingText = state.pendingCategoryText || '';
        var parsedForEntry = Diag.parseDescription(pendingText);
        var hasInternalOnly = parsedForEntry.facts.some(function (fact) {
          return fact.factKey === 'resource_scope' && fact.value === 'internal_only';
        });
        if (confirmedId === 'webvpn' && hasInternalOnly) {
          state = E.createDiagnosticSession('webvpn', 'webvpn_resource');
        } else {
          state = E.createSession(confirmedId);
        }
        applyDescription(state, pendingText);
        render({ focus: true });
      }, THINK_DELAY.stage, '正在对照你的情况…');
      return;
    }

    if (action === 'quick-match') {
      var input = document.getElementById('quick-desc');
      var text = input ? input.value.slice(0, 200) : '';
      var categoryId = Diag.matchCategory(text);
      if (!categoryId) {
        toast('没有匹配到明确入口，请直接选择下面的情况');
        return;
      }
      state.pendingCategoryId = categoryId;
      state.pendingCategoryText = text;
      state.screen = 'confirm';
      render({ focus: true });
      return;
    }

    if (action === 'answer') {
      var questionId = target.getAttribute('data-q');
      var value = target.getAttribute('data-value');
      beginTurn(target.textContent.trim(), function () {
        if (questionId === 'q-clarify') {
          Diag.answerClarify(state, value);
        } else if (state.editingQuestionId) {
          var question = D.QUESTIONS[state.editingQuestionId];
          Diag.recordObservation(state, question.factKey, value, { questionId: question.id, reasonCode: 'revise_answer' });
          state.editingQuestionId = null;
        } else {
          Diag.answerQuestion(state, questionId, value);
        }

        var next = E.getDecision(state);
        state.screen = next.kind === 'question' ? 'diagnose' : 'assessment';
        render({ focus: true });
      }, THINK_DELAY.normal, '正在对照你的回答…');
      return;
    }

    if (action === 'choose') {
      var chooseValue = target.getAttribute('data-value');
      beginTurn(target.textContent.trim(), function () {
        E.choose(state, chooseValue);
        if (state.screen === 'node' && state.nodeId) {
          var picked = E.getNode(state.nodeId);
          if (picked && picked.type === 'diagnose') {
            E.startDiagnostic(state, picked.scenarioId);
          }
        }
        render({ focus: true });
      }, THINK_DELAY.normal, '正在对照你的选择…');
      return;
    }

    if (action === 'revise') {
      state.screen = 'revise';
      render({ focus: true });
      return;
    }

    if (action === 'edit-answer') {
      var evidenceId = target.getAttribute('data-evidence-id');
      var found = null;
      (state.observations || []).forEach(function (o) {
        if (o.id === evidenceId) found = o;
      });
      if (!found || !found.questionId) {
        toast('这条观察没有对应的问题，暂时不能直接修改');
        return;
      }
      state.editingQuestionId = found.questionId;
      state.screen = 'diagnose';
      render({ focus: true });
      return;
    }

    if (action === 'back-to-flow') {
      var decision = E.getDecision(state);
      state.screen = decision.kind === 'question' ? 'diagnose' : 'assessment';
      render({ focus: true });
      return;
    }

    if (action === 'open-action') {
      beginTurn(target.textContent.trim(), function () {
        var assessment = E.deriveAssessment(state);
        if (!assessment.nextActionIds.length) {
          state.screen = 'handoff';
          render({ focus: true });
          return;
        }
        state.pendingActionId = assessment.nextActionIds[0];
        state.actionStepDraft = {};
        state.screen = 'action';
        render({ focus: true });
      }, THINK_DELAY.stage, '正在整理下一步…');
      return;
    }

    if (action === 'exec') {
      var stepId = target.getAttribute('data-step');
      var exec = target.getAttribute('data-exec');
      state.actionStepDraft = state.actionStepDraft || {};
      if (state.actionStepDraft[stepId] === exec) delete state.actionStepDraft[stepId];
      else state.actionStepDraft[stepId] = exec;

      var item = target.closest('.step-item');
      if (item) {
        var chips = item.querySelectorAll('.chip');
        Array.prototype.forEach.call(chips, function (chip) {
          chip.setAttribute('aria-pressed', state.actionStepDraft[stepId] === chip.getAttribute('data-exec') ? 'true' : 'false');
        });
        item.classList.toggle('is-done', state.actionStepDraft[stepId] === 'completed');
        item.classList.toggle('is-skip', state.actionStepDraft[stepId] === 'unable' || state.actionStepDraft[stepId] === 'skipped');
      }
      syncStepButton();
      persist();
      return;
    }

    if (action === 'verify-start') {
      var activeAction = D.ACTIONS[state.pendingActionId];
      if (!activeAction) return;
      Diag.recordActionResult(state, activeAction.id, aggregateExecution(activeAction), 'not_checked', {
        stepStates: state.actionStepDraft || {}
      });
      state.screen = 'verify';
      render({ focus: true });
      return;
    }

    if (action === 'verify-result') {
      var effect = target.getAttribute('data-effect');
      beginTurn(target.textContent.trim(), function () {
        Diag.recordVerification(state, state.pendingActionId, effect);
        state.actionStepDraft = {};
        if (effect === 'restored') {
          state.screen = 'recovered';
        } else {
          state.screen = 'handoff';
          regenerateDraft();
        }
        render({ focus: true });
      }, THINK_DELAY.stage, effect === 'restored' ? '正在确认复测结果…' : '正在整理求助信息…');
      return;
    }

    if (action === 'back-to-assessment') {
      state.screen = 'assessment';
      render({ focus: true });
      return;
    }

    if (action === 'back-to-action') {
      state.screen = 'action';
      render({ focus: true });
      return;
    }

    if (action === 'handoff') {
      beginTurn(target.textContent.trim(), function () {
        regenerateDraft();
        state.screen = 'handoff';
        render({ focus: true });
      }, THINK_DELAY.urgent, '正在整理这次排查…');
      return;
    }

    if (action === 'regen') {
      regenerateDraft();
      render({ focus: false });
      toast('已按当前记录重新生成');
      return;
    }

    if (action === 'keep-draft') {
      state.helpDraft.basedOnRevision = state.revision;
      render({ focus: false });
      toast('已保留手工稿，并标记为当前版本');
      return;
    }

    if (action === 'save-toggle') {
      state.helpDraft.savedPref = !!document.getElementById('save-toggle').checked;
      persist();
      if (els.privacy) els.privacy.innerHTML = U.renderPrivacy(state);
      toast(state.helpDraft.savedPref ? '已选择在此浏览器保存本次记录' : '已关闭长期保存，求助说明文字不再写入浏览器存储');
      return;
    }

    if (action === 'clear') {
      cancelPending();
      if (storage) S.clear(storage);
      state = E.createHomeSession();
      clearThread();
      state.notice = '本次记录已清除。';
      render({ focus: true });
      window.scrollTo(0, 0);
      toast('已清除本次记录');
      return;
    }

    if (action === 'speedtest-open') {
      openSpeedTest(target);
      return;
    }

    if (action === 'speedtest-close') {
      closeSpeedTest();
      return;
    }

    if (action === 'speedtest-start') {
      var speedWrap = document.getElementById('speed-frame-wrap');
      var speedFrame = document.getElementById('speedtest-frame');
      if (speedWrap && speedFrame) {
        speedFrame.src = 'https://test.ustc.edu.cn/';
        speedWrap.hidden = false;
        target.disabled = true;
        target.textContent = '测速页面加载中…';
      }
      return;
    }

    if (action === 'home' || action === 'restart') {
      cancelPending();
      state = E.createHomeSession();
      clearThread();
      render({ focus: true });
      window.scrollTo(0, 0);
      return;
    }

    if (action === 'back') {
      beginTurn(target.textContent.trim(), function () {
        E.back(state);
        render({ focus: true });
      }, THINK_DELAY.quick, '正在回到上一步…');
      return;
    }

    if (action === 'mark') {
      var legacyStepId = target.getAttribute('data-step');
      var execResult = target.getAttribute('data-exec');
      var stored = execResult === 'completed' ? 'done' : (execResult === 'unable' ? 'fail' : 'na');
      E.markStep(state, legacyStepId, stored);

      var record = state.stepRecords[state.nodeId] || {};
      var legacyItem = target.closest('.step-item');
      if (legacyItem) {
        var legacyChips = legacyItem.querySelectorAll('.chip');
        Array.prototype.forEach.call(legacyChips, function (chip) {
          var chipExec = chip.getAttribute('data-exec');
          var chipStored = chipExec === 'completed' ? 'done' : (chipExec === 'unable' ? 'fail' : 'na');
          chip.setAttribute('aria-pressed', record[legacyStepId] === chipStored ? 'true' : 'false');
        });
        legacyItem.classList.toggle('is-done', record[legacyStepId] === 'done');
        legacyItem.classList.toggle('is-skip', record[legacyStepId] === 'fail' || record[legacyStepId] === 'na');
      }
      syncStepButton();
      persist();
      return;
    }

    if (action === 'steps-next') {
      var stepNode = E.getNode(state.nodeId);
      if (!stepNode || stepNode.type !== 'steps') return;
      if (E.stepProgress(state, stepNode).done < stepNode.steps.length) return;
      beginTurn(target.textContent.trim(), function () {
        E.goTo(state, stepNode.onComplete);
        render({ focus: true });
      }, THINK_DELAY.normal, '正在进入下一步…');
      return;
    }

    if (action === 'copy') {
      copyText(currentHelpText(), '求助说明已复制');
      return;
    }

    if (action === 'copy-wechat') {
      copyText(target.getAttribute('data-wechat') || '', '微信号已复制');
      return;
    }

    if (action === 'download') {
      downloadText(currentHelpText());
    }
  });

  function applyContextField(key, value) {
    if (!state.context || !key) return;
    state.context[key] = String(value || '').slice(0, 60);
    if (!state.helpDraft.edited) {
      var box = document.getElementById('help-text');
      if (box) {
        box.value = E.buildHelpText(state);
        state.helpDraft.basedOnRevision = state.revision;
      }
    }
    persist();
  }

  document.addEventListener('input', function (event) {
    var contextKey = event.target.getAttribute ? event.target.getAttribute('data-ctx') : null;
    if (contextKey) {
      applyContextField(contextKey, event.target.value);
      return;
    }

    if (event.target.id === 'extra') {
      state.extra = event.target.value.slice(0, D.MAX_FREE_TEXT);
      if (!state.helpDraft.edited) {
        var box = document.getElementById('help-text');
        if (box) {
          box.value = E.buildHelpText(state);
          state.helpDraft.basedOnRevision = state.revision;
        }
      }
      persist();
      return;
    }

    if (event.target.id === 'help-text') {
      state.helpDraft.edited = true;
      state.helpDraft.text = event.target.value.slice(0, D.MAX_HANDOFF_TEXT);
      state.helpDraft.basedOnRevision = state.revision;
      persist();
    }
  });

  document.addEventListener('change', function (event) {
    var contextKey = event.target.getAttribute ? event.target.getAttribute('data-ctx') : null;
    if (contextKey) applyContextField(contextKey, event.target.value);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var layer = document.getElementById('speed-layer');
    if (layer && !layer.hidden) {
      closeSpeedTest();
      return;
    }
    if (live.timer) {
      flushPending();
      return;
    }
    if (els.send && els.send.disabled) cancelPending();
  });

  if (els.composer) {
    els.composer.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = els.input ? els.input.value : '';
      if (els.input) els.input.value = '';
      handleFreeText(value);
    });
  }

  els.restart.addEventListener('click', function () {
    cancelPending();
    state = E.createHomeSession();
    clearThread();
    render({ focus: true });
    window.scrollTo(0, 0);
  });

  render({ focus: false });
})(window);
