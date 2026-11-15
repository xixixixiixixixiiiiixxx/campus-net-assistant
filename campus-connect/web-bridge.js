/* CampusConnect Web adapter. Original UI by Ye9137; see LICENSE.txt. */
(() => {
  'use strict';
  let token = '', available = false, setup, polling, pending = 0, lastState;
  const listeners = new Set();
  const emit = message => { if (message.kind === 'state') lastState = message.state; for (const listener of listeners) listener({ data: message }); };
  const notice = text => { const el = document.getElementById('web-connection'); if (el) el.textContent = text; };
  const offlineState = message => ({ kind: 'state', state: { target: '', wiredMode: false, wiredAuth: 'web', webPortalEnabled: true,
    currentSsid: null, campusConnected: false, internetOnline: null, connectionTitle: '先启动本机服务，再使用连接功能', automatic: false,
    busy: false, networks: [], status: message, portalStatus: '学校认证将在独立窗口打开。', ethernetAdapters: [], broadbandEntries: [] } });
  function clearErrors() {
    document.querySelectorAll('.web-field-error').forEach(el => el.remove());
    document.querySelectorAll('[aria-invalid="true"]').forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-errormessage'); });
  }
  function fieldError(message) {
    const id = /认证地址|认证页面|HTTP|http/.test(message) ? 'portalUrl' : /Wi-Fi 名称/.test(message) ? 'ssid' : null;
    const input = id && document.getElementById(id); if (!input) return;
    clearErrors();
    const error = document.createElement('span'); error.id = 'web-field-error'; error.className = 'web-field-error'; error.role = 'alert'; error.textContent = message;
    input.after(error); input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-errormessage', error.id); input.focus();
  }
  async function request(url, body) {
    const response = await fetch(url, { method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'omit',
      headers: { 'X-Campus-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45000) });
    const result = await response.json();
    for (const message of result.messages || []) emit(message);
    if (!response.ok) throw new Error(result.error || '本机服务暂时不可用。');
    return result;
  }
  async function initialize() {
    if (location.protocol === 'file:') throw new Error('这是界面预览。请在项目目录运行 npm run campus:start，再打开本机地址。');
    let response;
    try { response = await fetch('/api/campus/session', { cache: 'no-store', credentials: 'omit' }); }
    catch { throw new Error('尚未连接本机服务。请运行 npm run campus:start。'); }
    if (!response.ok) throw new Error('当前网页未运行连接服务，请使用 npm run campus:start 提供的地址。');
    const data = await response.json();
    token = data.token;
    if (!data.native?.available) throw new Error(data.native?.error || '本机 Windows 组件不可用。');
    available = true; notice('本机服务已连接 · Windows');
    polling = setInterval(async () => {
      if (document.hidden || pending) return;
      try { await request('/api/campus/state'); }
      catch { notice('本机服务已断开，请重启服务并刷新本页。'); }
    }, 2000);
  }
  async function postMessage(message) {
    if (['draft', 'page', 'portalBounds', 'hydrated'].includes(message.command)) return;
    try {
      setup ||= initialize(); await setup;
      pending++;
      if (lastState) emit({ kind: 'state', state: { ...lastState, busy: true } });
      await request('/api/campus/command', message);
      clearErrors();
    } catch (error) {
      if (!available) {
        notice(error.message);
        emit({ kind: 'profile', profile: { connectionMode: 'wifi', ssid: '', wiredAuth: 'web', portalEnabled: true, autoSubmit: false, automatic: false }, password: '' });
        emit({ kind: 'startup', available: false, enabled: false, error: '本机服务启动后可使用连接功能。' });
        emit(offlineState(error.message));
      } else {
        const status = document.getElementById('status'); if (status) status.textContent = error.message;
        fieldError(error.message);
      }
    } finally {
      pending = Math.max(0, pending - 1);
      if (!pending && lastState?.busy) emit({ kind: 'state', state: { ...lastState, busy: false } });
    }
  }
  window.chrome ||= {};
  window.chrome.webview = { postMessage, addEventListener(type, listener) { if (type === 'message') listeners.add(listener); } };
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', event => { if (event.target.hasAttribute('aria-invalid')) clearErrors(); });
    // Native desktop-only entry points are not advertised as browser features.
    for (const action of ['location', 'wifiSettings', 'ethernetSettings', 'broadbandSettings', 'networkConnections', 'chooseAuthClient']) {
      document.querySelectorAll('[data-action="' + action + '"]').forEach(el => { el.hidden = true; });
    }
    const startup = document.getElementById('startup'); if (startup) startup.closest('.card').hidden = true;
    const automaticDescription = document.getElementById('auto-description');
    const observer = new MutationObserver(() => {
      if (automaticDescription?.textContent.includes('每 5 秒') && !automaticDescription.textContent.includes('本机服务')) {
        automaticDescription.textContent += ' 本机服务运行期间生效，停止服务后结束。';
      }
    });
    if (automaticDescription) observer.observe(automaticDescription, { childList: true });
  });
  window.addEventListener('pagehide', () => clearInterval(polling));
})();
