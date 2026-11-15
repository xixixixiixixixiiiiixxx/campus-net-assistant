(function (global) {
  'use strict';

  var K = global.NTA.knowledge;
  var D = global.NTA.diagnostics;
  var E = global.NTA.engine;

  function icon(name) {
    return global.NTA.icon ? global.NTA.icon(name) : '';
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function sourceCard(id) {
    var s = E.getSource(id);
    if (!s) return '';
    var verified = s.verifiedAt && s.verifiedAt !== 'unknown'
      ? '核验 ' + s.verifiedAt
      : '未核验';
    return '<a class="source" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="source__title">' + esc(s.title) + '</span>' +
      '<span class="source__meta">' + esc(s.publisher) + ' · ' + esc(verified) + '</span>' +
      (s.scope ? '<span class="source__meta">适用范围：' + esc(s.scope) + '</span>' : '') +
      '</a>';
  }

  function sourceSection(ids, title) {
    if (!ids || !ids.length) return '';
    var cards = ids.map(sourceCard).join('');
    if (!cards) return '';
    return '<div class="source-block">' +
      '<p class="source-block__title">' + esc(title || '资料来源') + '</p>' +
      cards +
      '</div>';
  }

  function contactCard(id) {
    var c = E.getContact(id);
    if (!c) return '';
    var phone = c.phone
      ? '<a class="contact__phone" href="tel:' + esc(c.phone) + '">' + esc(c.phone) + '</a>'
      : (c.wechat ? '' : '<span class="contact__phone contact__phone--none">号码请以官网页面为准</span>');
    var wechat = c.wechat
      ? '<p class="contact__wechat">微信号：<code class="contact__wechat-id">' + esc(c.wechat) + '</code>' +
        '<button type="button" class="contact__wechat-copy" data-action="copy-wechat" data-wechat="' + esc(c.wechat) + '">复制</button></p>'
      : '';
    return '<div class="contact">' +
      '<p class="contact__name">' + esc(c.name) + '</p>' +
      phone +
      wechat +
      '<p class="contact__scope">' + esc(c.scope) + '</p>' +
      (c.origin ? '<p class="contact__origin">' + esc(c.origin) + '</p>' : '') +
      (c.caution ? '<p class="contact__caution">' + esc(c.caution) + '</p>' : '') +
      '</div>';
  }

  function renderStudentContacts() {
    return contactCard('net-consultant');
  }

  function contactSection(ids, title) {
    if (!ids || !ids.length) return '';
    var cards = ids.filter(function (id) { return id !== 'net-consultant'; }).map(contactCard).join('');
    if (!cards) return '';
    return '<div class="source-block">' +
      '<p class="source-block__title">' + esc(title || '官方联系方式') + '</p>' +
      cards +
      '</div>';
  }

  function userContactSection() {
    return '<div class="source-block">' +
      '<p class="source-block__title">用户提供的联系人（未在官网核验）</p>' +
      contactCard('net-consultant') +
      '</div>';
  }

  function entryCard(item, useSymptom) {
    var action = useSymptom ? 'start-symptom' : 'start';
    var attr = useSymptom ? 'data-symptom' : 'data-category';
    var icons = { 's-wifi-cannot': 'wifi-high', 's-wifi-no-internet': 'globe-simple',
      's-password': 'key', 's-offcampus': 'globe-simple', 's-unsure': 'chat-circle-dots' };
    var titles = { 's-wifi-cannot': '无线连不上', 's-wifi-no-internet': '网页打不开',
      's-password': '忘记密码', 's-offcampus': '校外访问', 's-unsure': '说不清楚' };
    return '<button type="button" class="entry" aria-label="' + esc(item.title) + '" data-message="' + esc(item.title) + '" data-action="' + action + '" ' + attr + '="' + esc(item.id) + '">' +
      '<span class="entry__icon" aria-hidden="true">' + icon(icons[item.id] || 'chat-circle-dots') + '</span>' +
      '<span class="entry__copy"><span class="entry__title">' + esc(titles[item.id] || item.title) + '</span>' +
      '<span class="entry__desc">' + esc(item.desc) + '</span></span>' +
      '</button>';
  }

  function sceneCard(item, index) {
    return '<article class="scene-slide' + (index === 0 ? ' is-active' : '') + '" role="group" aria-roledescription="幻灯片" aria-label="' +
      (index + 1) + '，共 3 张：' + esc(item.title) + '"' + (index ? ' aria-hidden="true" inert' : '') + '>' +
      '<div class="scene-art scene-art--' + item.kind + '" aria-hidden="true">' +
      '<span class="scene-orbit scene-orbit--outer"></span><span class="scene-orbit scene-orbit--inner"></span>' +
      '<span class="scene-orbit-dot"></span><span class="scene-core">' + icon(item.icon) + '</span>' +
      '<span class="scene-float scene-float--left">' + icon(item.smallIcon) + '<span>' + esc(item.left) + '</span></span>' +
      '<span class="scene-float scene-float--right">' + icon('check') + '<span>' + esc(item.right) + '</span></span>' +
      '</div><h2 class="scene-slide__title title-2">' + esc(item.title) + '</h2>' +
      '<p class="scene-slide__desc body-6">' + esc(item.desc) + '</p>' +
      '<button class="scene-slide__action button-sm" type="button" aria-label="开始排查：' + esc(item.title) + '" data-message="' + esc(item.title) + '" data-action="start-symptom" data-symptom="' + item.symptom + '">' +
      '从这个情况开始' + icon('arrow-right') + '</button></article>';
  }

  function renderHome(session) {
    var notice = '';
    if (session && session.screen === 'home' && session.notice) {
      notice = '<div class="page-notice">' + esc(session.notice) + '</div>';
    }
    var scenes = [
      { kind: 'network', icon: 'wifi-high', smallIcon: 'globe-simple', left: '无线连接', right: '逐步排查',
        title: '连上了，网页却打不开', desc: '对照几个关键现象，缩小问题范围。', symptom: 's-wifi-no-internet' },
      { kind: 'password', icon: 'key', smallIcon: 'wifi-high', left: '账号与密码', right: '对应入口',
        title: '忘记密码，也有下一步', desc: '先分清账号类型，再找到对应指引。', symptom: 's-password' },
      { kind: 'remote', icon: 'globe-simple', smallIcon: 'copy', left: '校外设备', right: '校内资源',
        title: '校外访问，从入口开始', desc: '分清资源和访问方式，再看下一步。', symptom: 's-offcampus' }
    ];
    return notice + '<div class="welcome-screen" id="welcome-screen">' +
      '<section class="welcome" aria-labelledby="welcome-title">' +
      '<div class="welcome__copy">' +
      '<p class="welcome__kicker caption-2"><span aria-hidden="true"></span>遇到问题，先别着急</p>' +
      '<h1 class="welcome__title heading-2" id="welcome-title"><span class="welcome__title-line"><span>校园网络有状况？</span></span><span class="welcome__title-line"><span>一起把问题理清</span></span></h1>' +
      '<div class="welcome__support"><p class="welcome__lead body-3">连不上网、忘记密码，或在校外打不开校内资源。<br class="desktop-break">告诉我发生了什么，我们从下一步开始。</p>' +
      '<div class="welcome__actions"><button class="btn btn--primary welcome__start button-md" type="button" data-welcome-focus>描述我的问题' + icon('arrow-right') + '</button>' +
      '<span class="welcome__reassurance caption-2">' + icon('chat-circle-dots') + '不知道的，也可以跳过</span></div>' +
      '<div class="welcome__principles caption-2"><span>' + icon('check') + '一次只看下一步</span><span>' + icon('copy') + '建议附资料来源</span></div></div>' +
      '</div>' +
      '<section class="scene-deck" id="scene-deck" aria-roledescription="轮播" aria-label="常见网络问题" tabindex="0">' +
      '<div class="scene-deck__head"><span class="scene-deck__label caption-2"><span aria-hidden="true"></span>常见网络小状况</span>' +
      '<span class="scene-deck__count caption-2" aria-hidden="true"><span data-slide-current>01</span><span> / 03</span></span></div>' +
      '<div class="scene-viewport"><div class="scene-track">' + scenes.map(sceneCard).join('') + '</div></div>' +
      '<div class="scene-progress" aria-hidden="true"><span data-slide-progress></span></div>' +
      '<div class="scene-controls"><div class="scene-dots" role="group" aria-label="选择场景">' + scenes.map(function (item, i) {
        return '<button type="button" class="scene-dot' + (i === 0 ? ' is-active' : '') + '" data-slide-to="' + i + '" aria-label="查看' + esc(item.title) + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '"><span></span></button>';
      }).join('') + '</div><div class="scene-controls__buttons">' +
      '<button type="button" class="scene-control" data-slide-prev aria-label="上一个场景">' + icon('arrow-left') + '</button>' +
      '<button type="button" class="scene-control scene-control--pause" data-slide-pause aria-label="暂停自动切换" aria-pressed="false">' + icon('pause') + '</button>' +
      '<button type="button" class="scene-control" data-slide-next aria-label="下一个场景">' + icon('arrow-right') + '</button></div></div>' +
      '<span class="sr-only" data-slide-status aria-live="polite" aria-atomic="true"></span></section></section>' +
      '<section class="quick-start" aria-labelledby="quick-start-title"><div class="quick-start__head">' +
      '<h2 class="title-3" id="quick-start-title">也可以，直接选个情况</h2><span class="caption-2">从你看到的现象开始</span></div>' +
      '<div class="entry-grid start-grid">' + (K.SYMPTOMS || K.CATEGORIES).map(function (item) { return entryCard(item, true); }).join('') + '</div></section>' +
      '<div class="home-tools caption-2"><span>需要更多帮助？</span><button type="button" data-action="speedtest-open">打开网络测速' + icon('arrow-right') + '</button>' +
      '<span class="home-tools__note">中科大测速站提供，结果仅供参考</span></div></div>';
  }

  function renderConfirmCategory(session, category, text) {
    return '<article class="card">' +
      '<span class="card__eyebrow">确认入口</span>' +
      '<h1 class="card__title">你描述的情况更接近「' + esc(category.title) + '」？</h1>' +
      '<p class="card__hint">原始描述：' + esc(text) + '</p>' +
      '<p class="card__body">确认后会进入对应的排查流程；如果不准确，可以返回自己选。</p>' +
      '<div class="actions actions--end">' +
      '<button type="button" class="btn btn--soft" data-action="home">返回自己选</button>' +
      '<button type="button" class="btn btn--primary" data-action="confirm-category" data-category="' + esc(category.id) + '">确认，开始排查</button>' +
      '</div>' +
      '</article>';
  }

  function optionButton(questionId, opt) {
    var meta = '';
    if (opt.status === 'unknown' || opt.status === 'not_tested') {
      meta = '<span class="opt__meta">暂时不知道也可以继续</span>';
    }
    return '<button type="button" class="opt" data-action="answer" data-q="' + esc(questionId) + '" data-value="' + esc(opt.value) + '">' +
      '<span class="opt__main">' + esc(opt.label) + meta + '</span>' +
      '</button>';
  }

  function capturedBlock(session) {
    if (!session.descriptionSummary || !session.descriptionSummary.length) return '';
    return '<div class="captured">' +
      '<p class="captured__title">我先记下这些情况</p>' +
      '<ul class="captured__list">' +
      session.descriptionSummary.map(function (text) { return '<li>' + esc(text) + '</li>'; }).join('') +
      '</ul>' +
      '<p class="captured__hint">如果不准确，可以点「修改前面的回答」。</p>' +
      '</div>';
  }

  function renderDiagnose(session, question) {
    var html = '<article class="card">';
    html += '<span class="card__eyebrow">' + esc(question.eyebrow || '对照观察') + '</span>';
    html += '<div class="budget">观察 ' + (Math.min((session.budgetUsed || 0) + 1, session.questionBudget || 4)) +
      ' / ' + (session.questionBudget || 4) + '</div>';
    if (session.descriptionSummary && session.descriptionSummary.length) {
      html += capturedBlock(session);
    }
    html += '<h1 class="card__title">' + esc(question.prompt) + '</h1>';
    if (question.reason) {
      html += '<p class="why"><span class="why__label">为什么问</span>' + esc(question.reason) + '</p>';
    }
    html += '<div class="opt-list">' +
      question.options.map(function (opt) { return optionButton(question.id, opt); }).join('') +
      '</div>';
    html += '<div class="actions actions--end">' +
      '<button type="button" class="btn btn--soft" data-action="revise">修改前面的回答</button>' +
      '<button type="button" class="btn btn--soft" data-action="handoff">直接整理求助信息</button>' +
      '</div>';
    html += '</article>';
    return html;
  }

  function renderRevise(session) {
    var list = (session.observations || []).filter(function (o) { return o.validity === 'active'; });
    var rows = list.map(function (o) {
      var label = D.FACT_LABELS[o.factKey] || o.factKey;
      var values = D.FACT_VALUE_LABELS[o.factKey] || {};
      var value = o.status === 'available' ? (values[o.value] || o.value) : '未获得有效结果';
      return '<div class="revise-row">' +
        '<div><p class="revise-row__q">' + esc(label) + '</p>' +
        '<p class="revise-row__a">' + esc(value) + '</p></div>' +
        '<button type="button" class="btn btn--soft btn--sm" data-action="edit-answer" data-evidence-id="' + esc(o.id) + '">修改</button>' +
        '</div>';
    }).join('');

    return '<article class="card">' +
      '<span class="card__eyebrow">修改回答</span>' +
      '<h1 class="card__title">选择要修改的观察</h1>' +
      '<p class="card__hint">修改后，旧结论会退回历史，当前建议和求助卡会重新计算。</p>' +
      (rows ? '<div class="revise-list">' + rows + '</div>' : '<p class="empty">还没有可修改的观察。</p>') +
      '<div class="actions"><button type="button" class="btn btn--soft" data-action="back-to-flow">返回当前步骤</button></div>' +
      '</article>';
  }

  function listBlock(title, items) {
    if (!items || !items.length) return '';
    return '<div class="assess__block">' +
      '<h2 class="assess__title">' + esc(title) + '</h2>' +
      '<ul class="assess__list">' + items.map(function (item) {
        return '<li>' + esc(item) + '</li>';
      }).join('') + '</ul>' +
      '</div>';
  }

  function renderAssessment(session, assessment, decision) {
    var direction = D.DIRECTIONS[assessment.direction] || {};
    var action = (decision && decision.kind === 'action') ? D.ACTIONS[decision.actionId] : null;
    var title = direction.actionTitle || assessment.directionLabel;
    var reason = assessment.support.length ? assessment.support[0] : '';
    var keyUnknown = assessment.unknowns.length ? assessment.unknowns[0] : '';

    var html = '<article class="card">' +
      '<div class="result-head">' +
      '<span class="result-mark result-mark--info" aria-hidden="true">i</span>' +
      '<div>' +
      '<span class="card__eyebrow">现在的建议 · 规则辅助</span>' +
      '<h1 class="card__title">' + esc(title) + '</h1>' +
      '</div>' +
      '</div>';

    if (reason) html += '<p class="assess__lead">' + esc(reason) + '</p>';
    if (keyUnknown) html += '<p class="assess__key-unknown">还需要确认：' + esc(keyUnknown) + '</p>';
    html += capturedBlock(session);

    html += '<div class="actions actions--stack">';
    if (action) {
      html += '<button type="button" class="btn btn--primary btn--block" data-action="open-action">' + esc(action.title) + '</button>';
      html += '<button type="button" class="btn btn--soft btn--block" data-action="handoff">已经试过了，整理求助信息</button>';
    } else {
      html += '<button type="button" class="btn btn--primary btn--block" data-action="handoff">整理求助信息</button>';
    }
    html += '<button type="button" class="btn btn--soft btn--block" data-action="revise">修改前面的回答</button>';
    html += '</div>';

    html += '<details class="assess-details">' +
      '<summary>查看依据、尚未确认和资料原文</summary>' +
      '<div class="assess">' +
      listBlock('依据', assessment.support) +
      listBlock('尚未确认', assessment.unknowns) +
      '</div>';
    html += contactSection(E.collectContactIds(session), '可联系的服务人员');
    html += userContactSection();
    html += sourceSection(E.collectSourceIds(session), '资料来源');
    html += '</details>';

    html += '<p class="assess__disclaimer">这是辅助判断，不是学校确认的根因，也不代表已经报修。</p>';
    html += '</article>';
    return html;
  }

  function stepItem(step, index, status, actionPrefix) {
    var badge = step.basis === 'official'
      ? '<span class="badge badge--official">官方资料</span>'
      : '<span class="badge badge--general">通用建议</span>';
    var cls = 'step-item';
    if (status === 'completed') cls += ' is-done';
    if (status === 'unable' || status === 'skipped') cls += ' is-skip';

    function chip(exec, label) {
      return '<button type="button" class="chip" data-action="' + actionPrefix + '" data-step="' + esc(step.id) + '" ' +
        'data-exec="' + exec + '" aria-pressed="' + (status === exec ? 'true' : 'false') + '">' + label + '</button>';
    }

    return '<li class="' + cls + '" data-step-item="' + esc(step.id) + '">' +
      '<div class="step-item__top">' +
      '<span class="step-item__idx">' + (index + 1) + '</span>' +
      '<div>' +
      '<p class="step-item__text">' + esc(step.text) + ' ' + badge + '</p>' +
      (step.note ? '<p class="step-item__note">' + esc(step.note) + '</p>' : '') +
      '</div>' +
      '</div>' +
      '<div class="step-item__actions">' +
      chip('completed', '已完成') +
      chip('unable', '暂时做不了') +
      chip('skipped', '跳过') +
      '</div>' +
      '</li>';
  }

  function renderActionPack(session, action) {
    var draft = session.actionStepDraft || {};
    var marks = action.steps.filter(function (step) { return !!draft[step.id]; }).length;
    var html = '<article class="card">';
    html += '<span class="card__eyebrow">排查动作 · 规则辅助</span>';
    html += '<h1 class="card__title">' + esc(action.title) + '</h1>';
    html += '<p class="card__hint">做过后，再试一下原来打不开的页面；做不了的步骤可以如实标出来。</p>';
    html += '<ol class="step-list">' + action.steps.map(function (step, i) {
      return stepItem(step, i, draft[step.id] || '', 'exec');
    }).join('') + '</ol>';
    html += '<p class="step-progress">已标记 <span id="step-count">' + marks + '</span> / ' + action.steps.length + ' 步</p>';
    html += '<div class="actions actions--end">' +
      '<button type="button" class="btn btn--soft" data-action="back-to-assessment">返回结果</button>' +
      '<button type="button" class="btn btn--soft" data-action="handoff">做不了，直接求助</button>' +
      '<button type="button" class="btn btn--primary" data-action="verify-start">继续（复测）</button>' +
      '</div>';
    html += contactSection(action.contactIds, '官方联系方式');
    html += userContactSection();
    html += sourceSection(action.sourceIds, '本动作依据的资料');
    html += '</article>';
    return html;
  }

  function renderVerify(session, action) {
    var html = '<article class="card">';
    html += '<span class="card__eyebrow">复测确认</span>';
    html += '<h1 class="card__title">' + esc(action.verifyPrompt) + '</h1>';
    html += '<p class="card__hint">按你的实际感受选择，方便下一步整理说明。</p>';
    html += '<div class="opt-list">' +
      '<button type="button" class="opt" data-action="verify-result" data-effect="restored"><span class="opt__main">恢复了，可以正常使用</span></button>' +
      '<button type="button" class="opt" data-action="verify-result" data-effect="unchanged"><span class="opt__main">还是不行</span></button>' +
      '<button type="button" class="opt" data-action="verify-result" data-effect="partial"><span class="opt__main">部分恢复 / 不稳定</span></button>' +
      '<button type="button" class="opt" data-action="verify-result" data-effect="not_checked"><span class="opt__main">还没有复测</span></button>' +
      '</div>';
    html += '<div class="actions"><button type="button" class="btn btn--soft" data-action="back-to-action">返回动作步骤</button></div>';
    html += '</article>';
    return html;
  }

  function draftState(session) {
    var draft = session.helpDraft || {};
    if (!draft.edited) return '';
    if ((draft.basedOnRevision || 0) !== (session.revision || 0)) {
      return '<div class="draft-state draft-state--warn">' +
        '<p>排查记录已更新，手工稿尚未同步。</p>' +
        '<div class="actions">' +
        '<button type="button" class="btn btn--soft btn--sm" data-action="keep-draft">保留手工稿</button>' +
        '<button type="button" class="btn btn--primary btn--sm" data-action="regen">按当前记录重新生成</button>' +
        '</div></div>';
    }
    return '<div class="draft-state">当前文本基于第 ' + (draft.basedOnRevision || 0) + ' 次记录修订。</div>';
  }

  function deviceOption(value, label, current) {
    return '<option value="' + value + '"' + (current === value ? ' selected' : '') + '>' + label + '</option>';
  }

  function renderHandoff(session, text, assessment) {
    var html = '<article class="card">';
    html += '<div class="result-head">' +
      '<span class="result-mark result-mark--help" aria-hidden="true">!</span>' +
      '<div><span class="card__eyebrow">交接材料</span>' +
      '<h1 class="card__title">把这次排查整理给工作人员</h1></div>' +
      '</div>';
    html += '<p class="card__body">这些内容会写进求助说明，方便工作人员接着判断。不会自动提交，也不代表已经报修。</p>';

    html += '<div class="assess assess--compact">';
    html += '<div class="assess__block"><h2 class="assess__title">初步方向</h2>' +
      '<p class="assess__text">' + esc(assessment.directionLabel) + '</p></div>';
    html += listBlock('尚未确认', assessment.unknowns);
    html += '</div>';

    html += '<div class="context-fields">' +
      '<p class="context-fields__title">补充现场情况（选填）</p>' +
      '<div class="field-row"><label for="ctx-time">大概从什么时候开始</label>' +
      '<input id="ctx-time" data-ctx="symptomStarted" maxlength="60" value="' + esc(session.context.symptomStarted) + '" placeholder="例如：今天下午"></div>' +
      '<div class="field-row"><label for="ctx-area">大致区域</label>' +
      '<input id="ctx-area" data-ctx="area" maxlength="60" value="' + esc(session.context.area) + '" placeholder="例如：宿舍、教学楼"></div>' +
      '<div class="field-row"><label for="ctx-device">设备</label>' +
      '<select id="ctx-device" data-ctx="deviceType">' +
      deviceOption('unknown', '不确定', session.context.deviceType) +
      deviceOption('phone', '手机', session.context.deviceType) +
      deviceOption('laptop', '电脑', session.context.deviceType) +
      deviceOption('tablet', '平板', session.context.deviceType) +
      '</select></div>' +
      '<p class="context-fields__hint">不用填精确位置，也不要填学号、密码或验证码。</p>' +
      '</div>';

    html += '<div class="extra-field">' +
      '<label for="extra">补充错误提示（选填，最多 200 字）</label>' +
      '<input id="extra" type="text" maxlength="200" value="' + esc(session.extra) + '" placeholder="例如：提示「认证失败」">' +
      '<small>不要填写密码、验证码、身份证号等敏感信息。</small>' +
      '</div>';

    html += '<div class="actions actions--stack">' +
      '<button type="button" class="btn btn--primary btn--block" data-action="copy">复制求助说明</button>' +
      '<button type="button" class="btn btn--soft btn--block" data-action="download">下载为文本</button>' +
      '</div>';

    html += draftState(session);

    html += '<details class="copy-details">' +
      '<summary>查看并编辑完整文字</summary>' +
      '<div class="copy-box">' +
      '<div class="copy-box__label"><span>求助说明</span>' +
      '<span class="copy-box__warn">请勿填写密码或验证码</span></div>' +
      '<textarea id="help-text" spellcheck="false">' + esc(text) + '</textarea>' +
      '<div class="actions"><button type="button" class="btn btn--soft btn--sm" data-action="regen">重新生成</button></div>' +
      '</div></details>';

    html += '<label class="save-toggle"><input type="checkbox" id="save-toggle" data-action="save-toggle" ' +
      (session.helpDraft.savedPref ? 'checked' : '') + '> 在此浏览器保存本次记录（含求助说明文字）</label>' +
      '<div class="actions"><button type="button" class="btn btn--soft btn--sm" data-action="clear">清除本次记录</button></div>';

    var officialContacts = E.collectContactIds(session).filter(function (id) {
      return id !== 'net-consultant';
    });
    var usedSources = E.collectSourceIds(session);
    if (!officialContacts.length) {
      officialContacts = ['it-center', 'it-center-south'];
      if (usedSources.indexOf('it-contact') < 0) usedSources.push('it-contact');
    }

    html += contactSection(officialContacts, '官方联系方式');
    html += userContactSection();
    html += sourceSection(usedSources, '资料来源');
    html += '<div class="actions actions--end">' +
      '<button type="button" class="btn btn--soft" data-action="revise">修改回答</button>' +
      '<button type="button" class="btn btn--soft" data-action="restart">重新开始</button>' +
      '</div>';
    html += '</article>';
    return html;
  }

  function renderRecovered(session) {
    var html = '<article class="card">' +
      '<div class="result-head">' +
      '<span class="result-mark result-mark--ok" aria-hidden="true">✓</span>' +
      '<div><span class="card__eyebrow">根据你的复测反馈</span>' +
      '<h1 class="card__title">现在可以正常使用了</h1></div>' +
      '</div>' +
      '<p class="card__body">如果刚才打不开的页面现在能打开，就不需要再操作。建议再试一次，确认稳定。</p>';
    html += '<div class="actions">' +
      '<button type="button" class="btn btn--primary" data-action="restart">再排查一次</button>' +
      '<button type="button" class="btn btn--soft" data-action="handoff">仍然生成一份说明</button>' +
      '</div>';
    html += '</article>';
    return html;
  }

  function renderQuestion(node, session) {
    var html = '<article class="card">';
    if (node.eyebrow) html += '<span class="card__eyebrow">' + esc(node.eyebrow) + '</span>';
    html += '<h1 class="card__title">' + esc(node.prompt) + '</h1>';
    if (node.hint) html += '<p class="card__hint">' + esc(node.hint) + '</p>';
    html += '<div class="opt-list">' + node.options.map(function (opt) {
      return '<button type="button" class="opt" data-action="choose" data-value="' + esc(opt.value) + '">' +
        '<span class="opt__main">' + esc(opt.label) + '</span></button>';
    }).join('') + '</div>';
    html += '<div class="actions">' + (session.stack.length ? '<button type="button" class="btn btn--soft" data-action="back">返回上一步</button>' : '') + '</div>';
    html += '</article>';
    return html;
  }

  function renderSteps(node, session) {
    var record = session.stepRecords[node.id] || {};
    var progress = E.stepProgress(session, node);
    var html = '<article class="card">';
    if (node.eyebrow) html += '<span class="card__eyebrow">' + esc(node.eyebrow) + '</span>';
    html += '<h1 class="card__title">' + esc(node.title) + '</h1>';
    if (node.intro) html += '<p class="card__hint">' + esc(node.intro) + '</p>';
    html += '<ol class="step-list">' + node.steps.map(function (step, i) {
      var status = record[step.id];
      if (status === 'done') status = 'completed';
      if (status === 'na') status = 'skipped';
      if (status === 'fail') status = 'unable';
      return stepItem(step, i, status || '', 'mark');
    }).join('') + '</ol>';
    html += '<p class="step-progress">已标记 <span id="step-count">' + progress.done + '</span> / ' + progress.total + ' 步</p>';
    html += contactSection(node.contactIds, '可联系的服务人员');
    html += userContactSection();
    html += sourceSection(node.sourceIds, '资料来源');
    html += '<div class="actions actions--end">' +
      '<button type="button" class="btn btn--soft" data-action="back">返回上一步</button>' +
      '<button type="button" class="btn btn--soft" data-action="handoff">做不了，直接求助</button>' +
      '<button type="button" class="btn btn--primary" data-action="steps-next" ' +
      (progress.done < progress.total ? 'disabled' : '') + '>下一步</button>' +
      '</div>';
    html += '</article>';
    return html;
  }

  function renderNotice(node, session) {
    var html = '<article class="card">';
    if (node.eyebrow) html += '<span class="card__eyebrow">' + esc(node.eyebrow) + '</span>';
    html += '<h1 class="card__title">' + esc(node.title) + '</h1>';
    html += '<p class="card__body">' + esc(node.body) + '</p>';
    html += '<p class="actions"><span class="badge badge--pending">' + esc(node.reason || '暂未找到官方依据') + '</span></p>';
    html += contactSection(node.contactIds, '可联系的服务人员');
    html += userContactSection();
    html += sourceSection(node.sourceIds, '已收录的资料');
    html += '<div class="actions">' +
      (session && session.stack.length ? '<button type="button" class="btn btn--soft" data-action="back">返回上一步</button>' : '') +
      '<button type="button" class="btn btn--soft" data-action="home">回到首页</button>' +
      '</div>';
    html += '</article>';
    return html;
  }

  function renderLegacyOutcome(node, session, helpText) {
    var html = '<article class="card">' +
      '<div class="result-head">' +
      '<span class="result-mark ' + (node.status === 'resolved' ? 'result-mark--ok' : 'result-mark--help') + '" aria-hidden="true">' +
      (node.status === 'resolved' ? '✓' : '!') + '</span>' +
      '<h1 class="card__title">' + esc(node.title) + '</h1>' +
      '</div>' +
      '<p class="card__body">' + esc(node.body) + '</p>';
    if (node.status !== 'resolved') {
      html += '<div class="copy-box"><div class="copy-box__label"><span>求助说明（可编辑）</span>' +
        '<span class="copy-box__warn">请勿填写密码或验证码</span></div>' +
        '<textarea id="help-text" spellcheck="false">' + esc(helpText) + '</textarea>' +
        '<div class="actions">' +
        '<button type="button" class="btn btn--primary" data-action="copy">复制求助说明</button>' +
        '<button type="button" class="btn btn--soft" data-action="download">下载为文本</button>' +
        '</div></div>';
    }
    html += contactSection(E.collectContactIds(session), '可联系的服务人员');
    html += userContactSection();
    html += sourceSection(E.collectSourceIds(session), '本次排查资料');
    html += '<div class="actions actions--end">' +
      '<button type="button" class="btn btn--soft" data-action="back">返回上一步</button>' +
      '<button type="button" class="btn btn--soft" data-action="restart">重新开始</button>' +
      '</div></article>';
    return html;
  }

  function renderStepsBar(stage) {
    return E.STAGE_LABELS.map(function (label, i) {
      var n = i + 1;
      var cls = n < stage ? 'is-done' : (n === stage ? 'is-current' : '');
      return '<li class="' + cls + '"' + (n === stage ? ' aria-current="step"' : '') + '><span>' + esc(label) + '</span></li>';
    }).join('');
  }

  function renderTrace(el, session) {
    var items = [];
    if (session.scenarioId) {
      (session.observations || []).forEach(function (o) {
        if (o.validity !== 'active') return;
        var label = D.FACT_LABELS[o.factKey] || o.factKey;
        var values = D.FACT_VALUE_LABELS[o.factKey] || {};
        var value = o.status === 'available' ? (values[o.value] || o.value) : '未获得有效结果';
        items.push('<div class="trace__item' + (o.validity === 'active' ? '' : ' trace__item--muted') + '">' +
          '<p class="trace__q">' + esc(label) + '</p>' +
          '<p class="trace__a">' + esc(value) + '</p>' +
          '</div>');
      });
    } else {
      (session.answers || []).forEach(function (a) {
        items.push('<div class="trace__item">' +
          '<p class="trace__q">' + esc(a.prompt) + '</p>' +
          '<p class="trace__a">' + esc(a.label) + '</p>' +
          '</div>');
      });
    }
    if (!items.length) {
      el.innerHTML = '<p class="empty">还没有开始排查。<br>选择一个问题入口后，过程会记录在这里。</p>';
      return;
    }
    el.innerHTML = items.join('');
  }

  function renderSources(el, session) {
    var ids = session.screen === 'home' ? Object.keys(K.SOURCES) : E.collectSourceIds(session);
    if (!ids.length) {
      el.innerHTML = '<p class="empty">当前步骤没有可引用的校方资料。</p>';
      return;
    }
    el.innerHTML = ids.map(sourceCard).join('');
  }

  function renderPrivacy(session) {
    var saved = session.helpDraft && session.helpDraft.savedPref;
    return '<div class="privacy">' +
      '<p class="privacy__state">' + (saved ? '本次记录已保存在此浏览器' : '结构化记录暂存在此浏览器；求助说明文字默认不长期保存') + '</p>' +
      '<p class="privacy__meta">24 小时未操作后不再自动恢复。可随时清除。</p>' +
      '<button type="button" class="btn btn--soft btn--sm btn--block" data-action="clear">清除本次记录</button>' +
      '</div>';
  }

  function contactCardFromObject(c) {
    if (!c) return '';
    var phone = c.phone
      ? '<a class="contact__phone" href="tel:' + esc(c.phone) + '">' + esc(c.phone) + '</a>'
      : '';
    var wechat = c.wechat
      ? '<p class="contact__wechat">微信号：<code class="contact__wechat-id">' + esc(c.wechat) + '</code>' +
        '<button type="button" class="contact__wechat-copy" data-action="copy-wechat" data-wechat="' + esc(c.wechat) + '">复制</button></p>'
      : '';
    return '<div class="contact">' +
      '<p class="contact__name">' + esc(c.name) + '</p>' +
      phone +
      wechat +
      '<p class="contact__scope">' + esc(c.scope) + '</p>' +
      (c.origin ? '<p class="contact__origin">' + esc(c.origin) + '</p>' : '') +
      (c.caution ? '<p class="contact__caution">' + esc(c.caution) + '</p>' : '') +
      '</div>';
  }

  function renderChatReply(result) {
    if (!result) return '';
    var html = '<div class="reply">';
    html += '<p class="reply__text"><span data-typewrite data-full-text="' + esc(result.reply) + '" aria-hidden="true"></span>' +
      '<span class="sr-only">' + esc(result.reply) + '</span></p>';
    if (result.question) {
      html += '<p class="reply__question">' + esc(result.question) + '</p>';
    }
    if (result.steps && result.steps.length) {
      html += '<ol class="reply__steps">' + result.steps.map(function (step) {
        return '<li class="reply__step">' + esc(step.text) + '</li>';
      }).join('') + '</ol>';
    }
    if (result.sources && result.sources.length) {
      html += '<details class="reply__details"><summary>官方来源</summary>';
      html += result.sources.map(function (source) {
        return '<a class="source" href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="source__title">' + esc(source.title) + '</span>' +
          '<span class="source__meta">发布 ' + esc(source.publishedAt) + ' · 核验 ' + esc(source.lastCheckedAt) + '</span>' +
          '</a>';
      }).join('');
      html += '</details>';
    }
    if (result.contacts && result.contacts.length) {
      html += '<div class="reply__contacts">' + result.contacts.map(contactCardFromObject).join('') + '</div>';
    }
    if (result.fallback) {
      html += '<p class="reply__fallback">本次未采用模型回答，已使用规则与已核验资料。</p>';
    }
    html += '</div>';
    return html;
  }

  function renderSpeedTest() {
    return '<div class="speed-note">' +
      '<p class="speed-note__lead">测速页面来自<strong>中国科学技术大学测速站</strong>，在本工具里嵌入它的官方页面，测速仍由该站完成。</p>' +
      '<ul class="speed-note__list">' +
      '<li>该站会记录测试时间、你的 IP 地址和测速结果；本工具不接收、不保存这些数据。</li>' +
      '<li>测的是到中科大测速服务器的链路，<strong>不代表校园网官方质量</strong>，也不能作为报修依据。</li>' +
      '<li>测速会消耗流量；短时间内反复测可能被该站临时封禁，建议一次测完再看结果。</li>' +
      '<li>首次加载需先完成约 0.5–2 秒的本地验证，页面短暂空白属于正常现象。</li>' +
      '</ul>' +
      '<div class="actions">' +
      '<button type="button" class="btn btn--primary" data-action="speedtest-start">开始测速</button>' +
      '<a class="btn btn--soft" href="https://test.ustc.edu.cn/" target="_blank" rel="noopener noreferrer">在新窗口打开</a>' +
      '</div>' +
      '</div>' +
      '<div class="speed-frame-wrap" id="speed-frame-wrap" hidden>' +
      '<iframe id="speedtest-frame" title="中国科学技术大学测速页面" src="about:blank" loading="lazy" referrerpolicy="no-referrer"></iframe>' +
      '</div>';
  }

  global.NTA.ui = {
    esc: esc,
    renderSpeedTest: renderSpeedTest,
    renderChatReply: renderChatReply,
    renderHome: renderHome,
    renderConfirmCategory: renderConfirmCategory,
    renderDiagnose: renderDiagnose,
    renderRevise: renderRevise,
    renderAssessment: renderAssessment,
    renderActionPack: renderActionPack,
    renderVerify: renderVerify,
    renderHandoff: renderHandoff,
    renderRecovered: renderRecovered,
    renderQuestion: renderQuestion,
    renderSteps: renderSteps,
    renderNotice: renderNotice,
    renderLegacyOutcome: renderLegacyOutcome,
    renderStepsBar: renderStepsBar,
    renderTrace: renderTrace,
    renderSources: renderSources,
    renderStudentContacts: renderStudentContacts,
    renderPrivacy: renderPrivacy,
    sourceSection: sourceSection,
    contactSection: contactSection
  };
})(window);
