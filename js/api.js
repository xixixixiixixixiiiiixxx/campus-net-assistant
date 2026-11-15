(function (global) {
  'use strict';

  var DEFAULT_TIMEOUT = 20000;

  function buildPayload(text, context, history) {
    var payload = {
      query: String(text == null ? '' : text).slice(0, 500),
      context: context || { campus: 'songshanhu', audience: 'student' }
    };
    if (Object.prototype.toString.call(history) === '[object Array]' && history.length) {
      payload.history = history.slice(-12).map(function (item) {
        return {
          role: item && item.role === 'assistant' ? 'assistant' : 'user',
          content: String(item && item.content == null ? '' : item.content).slice(0, 300)
        };
      }).filter(function (item) { return !!item.content; });
    }
    return payload;
  }

  function chat(payload, options) {
    var opts = options || {};
    if (typeof fetch !== 'function' || (global.location && global.location.protocol === 'file:')) {
      return Promise.resolve(null);
    }

    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, opts.timeout || DEFAULT_TIMEOUT);

    return fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      clearTimeout(timer);
      if (!response.ok) return null;
      return response.json();
    }).then(function (data) {
      return data && (data.mode === 'model' || data.mode === 'rules') ? data : null;
    }, function () {
      clearTimeout(timer);
      return null;
    });
  }

  global.NTA = global.NTA || {};
  global.NTA.api = {
    chat: chat,
    buildPayload: buildPayload
  };
})(window);
