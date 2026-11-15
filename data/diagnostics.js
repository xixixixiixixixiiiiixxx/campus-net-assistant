(function (global) {
  'use strict';

  var KNOWLEDGE_VERSION = '2026-11-07.v1';
  var SCHEMA_VERSION = 2;
  var DEFAULT_QUESTION_BUDGET = 4;
  var MAX_ACTION_PACKS = 2;
  var SESSION_TTL_MS = 24 * 60 * 60 * 1000;
  var MAX_FREE_TEXT = 200;
  var MAX_HANDOFF_TEXT = 6000;

  var DIRECTIONS = {
    device_or_user_state: {
      id: 'device_or_user_state',
      label: '\u4f18\u5148\u68c0\u67e5\u5f53\u524d\u8bbe\u5907\u3001\u6d4f\u89c8\u5668\u6216\u4e2a\u4eba\u8ba4\u8bc1\u72b6\u6001',
      short: '\u5f53\u524d\u8bbe\u5907\u6216\u8d26\u53f7\u72b6\u6001',
      actionTitle: '\u5148\u68c0\u67e5\u5f53\u524d\u8bbe\u5907\u548c\u8d26\u53f7\u72b6\u6001'
    },
    account_or_auth: {
      id: 'account_or_auth',
      label: '\u4f18\u5148\u6838\u5bf9\u8d26\u53f7\u6216\u8ba4\u8bc1\u6d41\u7a0b',
      short: '\u8d26\u53f7\u6216\u8ba4\u8bc1',
      actionTitle: '\u5148\u6838\u5bf9\u8d26\u53f7\u6216\u8ba4\u8bc1\u6d41\u7a0b'
    },
    shared_access_path: {
      id: 'shared_access_path',
      label: '\u51fa\u73b0\u5171\u540c\u8bbf\u95ee\u8def\u5f84\u5f02\u5e38\u7ebf\u7d22\uff0c\u5efa\u8bae\u6574\u7406\u4fe1\u606f\u540e\u6c42\u52a9',
      short: '\u5171\u540c\u8bbf\u95ee\u8def\u5f84',
      actionTitle: '\u6574\u7406\u5171\u540c\u7ebf\u7d22\uff0c\u8054\u7cfb\u5de5\u4f5c\u4eba\u5458'
    },
    resource_or_access: {
      id: 'resource_or_access',
      label: '\u4f18\u5148\u6838\u5bf9\u6821\u5185\u8d44\u6e90\u7684\u8bbf\u95ee\u65b9\u5f0f',
      short: '\u8d44\u6e90\u8bbf\u95ee\u65b9\u5f0f',
      actionTitle: '\u5148\u6838\u5bf9\u6821\u5185\u8d44\u6e90\u7684\u6253\u5f00\u65b9\u5f0f'
    },
    undetermined: {
      id: 'undetermined',
      label: '\u8bc1\u636e\u4e0d\u8db3\uff0c\u6682\u4e0d\u80fd\u533a\u5206\u5177\u4f53\u65b9\u5411',
      short: '\u6682\u4e0d\u80fd\u786e\u5b9a',
      actionTitle: '\u628a\u76ee\u524d\u77e5\u9053\u7684\u60c5\u51b5\u6574\u7406\u7ed9\u5de5\u4f5c\u4eba\u5458'
    }
  };

  var QUESTIONS = {
    'q-resource-scope': {
      id: 'q-resource-scope',
      factKey: 'resource_scope',
      prompt: '\u73b0\u5728\u6253\u4e0d\u5f00\u7684\u5185\u5bb9\uff0c\u66f4\u63a5\u8fd1\u54ea\u4e00\u79cd\uff1f',
      reason: '\u5148\u786e\u8ba4\u662f\u666e\u904d\u6253\u4e0d\u5f00\uff0c\u8fd8\u662f\u53ea\u6709\u6821\u5185\u8d44\u6e90\u5f02\u5e38\uff0c\u8fd9\u4f1a\u51b3\u5b9a\u662f\u5426\u9700\u8981\u68c0\u67e5 WebVPN\u3002',
      options: [
        { value: 'all_web_down', label: '\u666e\u901a\u7f51\u9875\u4e5f\u6253\u4e0d\u5f00' },
        { value: 'internal_only', label: '\u53ea\u6709\u6821\u5185\u8d44\u6e90\uff08\u6559\u52a1\u3001\u56fe\u4e66\u7b49\uff09\u6253\u4e0d\u5f00' },
        { value: 'single_site', label: '\u53ea\u6709\u4e00\u4e2a\u666e\u901a\u7f51\u7ad9\u6253\u4e0d\u5f00' },
        { value: 'unknown', label: '\u4e0d\u77e5\u9053 / \u8bf4\u4e0d\u6e05', status: 'unknown' }
      ]
    },
    'q-access-scene': {
      id: 'q-access-scene',
      factKey: 'access_scene',
      prompt: '\u4f60\u73b0\u5728\u662f\u5728\u6821\u5185\u8fd8\u662f\u6821\u5916\u8bbf\u95ee\uff1f',
      reason: 'WebVPN \u4e3b\u8981\u7528\u4e8e\u6821\u5916\u8bbf\u95ee\u6821\u5185\u8d44\u6e90\uff1b\u5148\u786e\u8ba4\u4f60\u6240\u5728\u7684\u4f4d\u7f6e\uff0c\u907f\u514d\u8ba9\u4f60\u505a\u65e0\u5173\u64cd\u4f5c\u3002',
      options: [
        { value: 'on_campus', label: '\u5728\u6821\u5185' },
        { value: 'off_campus', label: '\u5728\u6821\u5916' },
        { value: 'unknown', label: '\u4e0d\u786e\u5b9a', status: 'unknown' }
      ]
    },
    'q-peer': {
      id: 'q-peer',
      factKey: 'peer_same_network',
      prompt: '\u540c\u5730\u70b9\u3001\u76f8\u8fd1\u65f6\u95f4\uff0c\u53e6\u4e00\u53f0\u8fde\u63a5\u540c\u4e00\u6821\u56ed Wi-Fi \u7684\u8bbe\u5907\u4e5f\u6709\u7c7b\u4f3c\u95ee\u9898\u5417\uff1f',
      reason: '\u60f3\u786e\u8ba4\u95ee\u9898\u662f\u5426\u53ea\u5728\u4f60\u8fd9\u53f0\u8bbe\u5907\u4e0a\u51fa\u73b0\uff0c\u8fd9\u4f1a\u51b3\u5b9a\u5148\u68c0\u67e5\u8bbe\u5907\u8fd8\u662f\u6574\u7406\u5171\u540c\u8def\u5f84\u7ebf\u7d22\u3002',
      options: [
        { value: 'also_abnormal', label: '\u4e5f\u6253\u4e0d\u5f00 / \u4e5f\u6709\u7c7b\u4f3c\u95ee\u9898' },
        { value: 'normal', label: '\u53ef\u4ee5\u6b63\u5e38\u8bbf\u95ee' },
        { value: 'not_tested', label: '\u6ca1\u6709\u6761\u4ef6\u6d4b\u8bd5', status: 'not_tested' },
        { value: 'unknown', label: '\u4e0d\u77e5\u9053', status: 'unknown' }
      ]
    },
    'q-mobile': {
      id: 'q-mobile',
      factKey: 'mobile_data_web',
      prompt: '\u540c\u4e00\u53f0\u8bbe\u5907\u6362\u5230\u79fb\u52a8\u6570\u636e\u540e\uff0c\u540c\u6837\u7684\u666e\u901a\u7f51\u9875\u80fd\u6253\u5f00\u5417\uff1f',
      reason: '\u60f3\u7528\u540c\u4e00\u53f0\u8bbe\u5907\u6362\u4e00\u6761\u7f51\u7edc\u8bbf\u95ee\uff0c\u770b\u770b\u95ee\u9898\u662f\u5426\u8ddf\u7740\u8bbe\u5907\u8d70\u3002',
      options: [
        { value: 'works', label: '\u53ef\u4ee5\u6253\u5f00' },
        { value: 'fails', label: '\u4e5f\u6253\u4e0d\u5f00' },
        { value: 'not_tested', label: '\u65e0\u6cd5\u6d4b\u8bd5\uff08\u6ca1\u6709\u79fb\u52a8\u6570\u636e\u7b49\uff09', status: 'not_tested' },
        { value: 'unknown', label: '\u4e0d\u77e5\u9053', status: 'unknown' }
      ]
    },
    'q-auth-visible': {
      id: 'q-auth-visible',
      factKey: 'auth_visible',
      prompt: '\u5b98\u65b9\u9875\u9762\u73b0\u5728\u663e\u793a\u4ec0\u4e48\uff1f',
      reason: '\u60f3\u83b7\u53d6\u4f60\u80fd\u770b\u5230\u7684\u8ba4\u8bc1\u7ebf\u7d22\uff0c\u4e0d\u6839\u636e\u8bf7\u6c42\u65f6\u957f\u731c\u6d4b\u8ba4\u8bc1\u72b6\u6001\u3002',
      options: [
        { value: 'auth_prompt', label: '\u51fa\u73b0\u7edf\u4e00\u8ba4\u8bc1\u63d0\u793a' },
        { value: 'credential_error', label: '\u63d0\u793a\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef', status: 'available' },
        { value: 'cert_warning', label: '\u51fa\u73b0\u8bc1\u4e66\u8b66\u544a' },
        { value: 'no_prompt', label: '\u6ca1\u6709\u4efb\u4f55\u660e\u786e\u63d0\u793a' },
        { value: 'unknown', label: '\u4e0d\u77e5\u9053', status: 'unknown' }
      ]
    },
    'q-webvpn-visible': {
      id: 'q-webvpn-visible',
      factKey: 'webvpn_portal_state',
      prompt: '\u767b\u5f55\u540e\u7684\u5b98\u65b9\u95e8\u6237\u662f\u5426\u663e\u793a\u300c\u6b63\u5728\u4f7f\u7528 VPN\u300d\uff0c\u4e14\u8d44\u6e90\u662f\u4ece\u95e8\u6237\u5185\u6253\u5f00\u7684\uff1f',
      reason: '\u6821\u65b9\u8bf4\u660e WebVPN \u9700\u8981\u5728\u95e8\u6237\u5185\u4fdd\u6301\u5f00\u542f\uff1b\u5148\u6838\u5bf9\u9875\u9762\u72b6\u6001\uff0c\u518d\u51b3\u5b9a\u4e0b\u4e00\u6b65\u3002',
      options: [
        { value: 'active_in_portal', label: '\u90fd\u6ee1\u8db3\uff1a\u663e\u793a VPN \u6807\u8bc6\uff0c\u4e14\u4ece\u95e8\u6237\u5185\u6253\u5f00' },
        { value: 'not_enabled', label: '\u95e8\u6237\u672a\u663e\u793a VPN \u6807\u8bc6' },
        { value: 'wrong_entry', label: '\u6ca1\u6709\u4ece\u95e8\u6237\u8bbf\u95ee\uff0c\u6216\u5df2\u5173\u95ed\u95e8\u6237\u9875\u9762' },
        { value: 'unknown', label: '\u4e0d\u77e5\u9053', status: 'unknown' }
      ]
    }
  };

  var SCENARIOS = {
    wifi_no_internet: {
      id: 'wifi_no_internet',
      categoryId: 'wifi',
      context: { networkPath: 'campus_wifi' },
      presetFacts: [],
      questionOrder: ['q-resource-scope', 'q-access-scene', 'q-peer', 'q-mobile', 'q-auth-visible'],
      budget: 4
    },
    webvpn_resource: {
      id: 'webvpn_resource',
      categoryId: 'webvpn',
      context: { networkPath: 'webvpn' },
      presetFacts: [
        {
          factKey: 'resource_scope',
          value: 'internal_only',
          kind: 'user_report',
          reasonCode: 'entry_webvpn_resource'
        }
      ],
      questionOrder: ['q-access-scene', 'q-webvpn-visible'],
      budget: 3
    }
  };

  var ACTIONS = {
    'a-check-device': {
      id: 'a-check-device',
      title: '\u5148\u6838\u5bf9\u5f53\u524d\u8bbe\u5907\u4e0e\u8ba4\u8bc1\u72b6\u6001',
      basis: 'general',
      sourceIds: [],
      contactIds: [],
      appliesTo: { directions: ['device_or_user_state'] },
      steps: [
        { id: 'ad1', basis: 'general', text: '\u786e\u8ba4\u5f53\u524d\u8bbe\u5907\u8fde\u63a5\u7684\u662f\u6821\u56ed Wi-Fi\uff1b\u5982\u679c\u540c\u5730\u70b9\u5176\u4ed6\u8bbe\u5907\u80fd\u6b63\u5e38\u8bbf\u95ee\uff0c\u5148\u8bb0\u5f55\u8fd9\u4e00\u70b9\u3002' },
        { id: 'ad2', basis: 'general', text: '\u5728\u6d4f\u89c8\u5668\u4e2d\u9000\u51fa\u5e76\u91cd\u65b0\u767b\u5f55\u6821\u56ed\u95e8\u6237\uff0c\u786e\u8ba4\u8ba4\u8bc1\u72b6\u6001\u5df2\u66f4\u65b0\u3002', note: '\u8d26\u53f7\u548c\u5bc6\u7801\u53ea\u5728\u5b66\u6821\u5b98\u65b9\u95e8\u6237\u4e2d\u8f93\u5165\u3002' },
        { id: 'ad3', basis: 'general', text: '\u5173\u95ed\u4ee3\u7406\u3001VPN \u6216\u7f51\u7edc\u52a0\u901f\u5e94\u7528\u540e\uff0c\u91cd\u65b0\u6253\u5f00\u539f\u6765\u5931\u8d25\u7684\u9875\u9762\u3002' }
      ],
      verifyPrompt: '\u6309\u4e0a\u9762\u7684\u6b65\u9aa4\u64cd\u4f5c\u540e\uff0c\u539f\u6765\u6253\u4e0d\u5f00\u7684\u9875\u9762\u73b0\u5728\u80fd\u6253\u5f00\u4e86\u5417\uff1f'
    },
    'a-webvpn-check-portal': {
      id: 'a-webvpn-check-portal',
      title: '\u6838\u5bf9 WebVPN \u95e8\u6237\u4f7f\u7528\u72b6\u6001',
      basis: 'official',
      sourceIds: ['webvpn'],
      contactIds: ['it-center', 'it-center-south'],
      legacyNodeId: 'webvpn-resource-steps',
      appliesTo: { directions: ['resource_or_access'], categories: ['webvpn'] },
      steps: [
        { id: 'wv-a1', basis: 'official', text: '\u786e\u8ba4\u667a\u6167\u6821\u56ed\u95e8\u6237\u53f3\u4e0b\u89d2\u663e\u793a\u300c\u6b63\u5728\u4f7f\u7528 VPN\u300d\u3002' },
        { id: 'wv-a2', basis: 'official', text: '\u4e0d\u8981\u5173\u95ed\u667a\u6167\u6821\u56ed\u95e8\u6237\uff1b\u4ece\u8fd9\u4e2a\u95e8\u6237\u9875\u9762\u4e2d\u6253\u5f00\u9700\u8981\u8bbf\u95ee\u7684\u6821\u5185\u8d44\u6e90\u3002', note: '\u6821\u65b9\u8bf4\u660e\u6240\u6709\u8d44\u6e90\u90fd\u5fc5\u987b\u5728\u5df2\u767b\u5f55\u7684\u95e8\u6237\u9875\u9762\u4e2d\u8bbf\u95ee\u3002' },
        { id: 'wv-a3', basis: 'official', text: '\u4ecd\u7136\u65e0\u6cd5\u8bbf\u95ee\u65f6\uff0c\u6309 WebVPN \u539f\u6587\u4e2d\u7684\u53cd\u9988\u5165\u53e3\u8054\u7cfb\u4fe1\u606f\u4e0e\u6559\u80b2\u6280\u672f\u4e2d\u5fc3\u3002' }
      ],
      verifyPrompt: '\u4fdd\u6301\u95e8\u6237\u6253\u5f00\u5e76\u4ece\u4e2d\u91cd\u65b0\u8bbf\u95ee\u539f\u6765\u5931\u8d25\u7684\u6821\u5185\u8d44\u6e90\uff0c\u73b0\u5728\u662f\u5426\u6062\u590d\uff1f'
    },
    'a-retry-single-site': {
      id: 'a-retry-single-site',
      title: '\u5148\u786e\u8ba4\u76ee\u6807\u7f51\u7ad9\u672c\u8eab\u7684\u72b6\u6001',
      basis: 'general',
      sourceIds: [],
      contactIds: [],
      appliesTo: { directions: ['resource_or_access'] },
      steps: [
        { id: 'rs1', basis: 'general', text: '\u7a0d\u7b49\u51e0\u5206\u949f\u540e\u91cd\u65b0\u6253\u5f00\u540c\u4e00\u4e2a\u7f51\u7ad9\uff0c\u786e\u8ba4\u662f\u5426\u53ea\u662f\u4e34\u65f6\u6545\u969c\u3002' },
        { id: 'rs2', basis: 'general', text: '\u6362\u4e00\u4e2a\u6d4f\u89c8\u5668\u6216\u65e0\u75d5\u7a97\u53e3\u6253\u5f00\u540c\u4e00\u5730\u5740\uff0c\u6392\u9664\u672c\u5730\u7f13\u5b58\u5f71\u54cd\u3002' },
        { id: 'rs3', basis: 'general', text: '\u5982\u679c\u53ea\u6709\u8be5\u7f51\u7ad9\u5f02\u5e38\u3001\u5176\u4ed6\u7f51\u9875\u6b63\u5e38\uff0c\u5148\u4e0d\u8981\u91cd\u7f6e\u6821\u56ed\u7f51\u7edc\u8bbe\u7f6e\u3002' }
      ],
      verifyPrompt: '\u518d\u6b21\u6253\u5f00\u90a3\u4e2a\u7f51\u7ad9\uff0c\u73b0\u5728\u80fd\u6b63\u5e38\u8bbf\u95ee\u4e86\u5417\uff1f'
    },
    'a-collect-area-info': {
      id: 'a-collect-area-info',
      title: '\u6574\u7406\u5171\u540c\u8def\u5f84\u7ebf\u7d22\u5e76\u8054\u7cfb\u5de5\u4f5c\u4eba\u5458',
      basis: 'general',
      sourceIds: ['it-contact'],
      contactIds: ['it-center', 'it-center-south'],
      appliesTo: { directions: ['shared_access_path'] },
      steps: [
        { id: 'ca1', basis: 'general', text: '\u8bb0\u5f55\u51fa\u73b0\u95ee\u9898\u7684\u5730\u70b9\u3001\u65f6\u95f4\u6bb5\uff0c\u4ee5\u53ca\u540c\u5730\u70b9\u5176\u4ed6\u8bbe\u5907\u7684\u73b0\u8c61\u3002' },
        { id: 'ca2', basis: 'general', text: '\u786e\u8ba4\u8fd9\u4e9b\u8bbe\u5907\u662f\u5426\u4f7f\u7528\u76f8\u540c\u7684\u6821\u56ed\u7f51\u7edc\u5165\u53e3\u3002' },
        { id: 'ca3', basis: 'general', text: '\u628a\u8bb0\u5f55\u6574\u7406\u6210\u6c42\u52a9\u8bf4\u660e\uff0c\u8054\u7cfb\u4fe1\u606f\u6280\u672f\u4e2d\u5fc3\u6838\u5b9e\u3002' }
      ],
      verifyPrompt: '\u8054\u7cfb\u5de5\u4f5c\u4eba\u5458\u540e\uff0c\u95ee\u9898\u662f\u5426\u5f97\u5230\u5904\u7406\uff1f'
    },
    'a-verify-official-entry': {
      id: 'a-verify-official-entry',
      title: '\u6838\u5bf9\u5b98\u65b9\u5165\u53e3\uff0c\u4e0d\u8981\u5ffd\u7565\u8bc1\u4e66\u8b66\u544a',
      basis: 'general',
      sourceIds: ['webvpn'],
      contactIds: ['it-center', 'it-center-south'],
      appliesTo: { directions: ['undetermined'] },
      steps: [
        { id: 'ce1', basis: 'general', text: '\u5148\u505c\u6b62\u7ee7\u7eed\u8f93\u5165\u8d26\u53f7\u6216\u5bc6\u7801\uff0c\u4e0d\u8981\u70b9\u51fb\u300c\u7ee7\u7eed\u8bbf\u95ee\u300d\u5ffd\u7565\u8bc1\u4e66\u8b66\u544a\u3002' },
        { id: 'ce2', basis: 'general', text: '\u624b\u52a8\u6838\u5bf9\u5730\u5740\u662f\u5426\u4e3a\u5b66\u6821\u5b98\u65b9\u95e8\u6237\uff1b\u4e0d\u8981\u5b89\u88c5\u672a\u77e5\u8bc1\u4e66\u6216\u6539\u52a8\u7cfb\u7edf\u4fe1\u4efb\u8bbe\u7f6e\u3002' },
        { id: 'ce3', basis: 'general', text: '\u628a\u8bc1\u4e66\u8b66\u544a\u4e0e\u5f53\u524d\u5730\u5740\u8bb0\u5f55\u4e0b\u6765\uff0c\u8054\u7cfb\u4fe1\u606f\u6280\u672f\u4e2d\u5fc3\u786e\u8ba4\u3002' }
      ],
      verifyPrompt: '\u6838\u5bf9\u5b98\u65b9\u5165\u53e3\u540e\uff0c\u8bc1\u4e66\u8b66\u544a\u662f\u5426\u6d88\u5931\uff1f'
    }
  };

  var RULES = {
    'r-single-device': {
      id: 'r-single-device',
      direction: 'device_or_user_state',
      label: '\u540c\u6761\u4ef6\u5176\u4ed6\u8bbe\u5907\u6b63\u5e38\uff0c\u5f53\u524d\u8bbe\u5907\u5f02\u5e38'
    },
    'r-shared-path': {
      id: 'r-shared-path',
      direction: 'shared_access_path',
      label: '\u540c\u6761\u4ef6\u591a\u8bbe\u5907\u51fa\u73b0\u76f8\u540c\u73b0\u8c61'
    },
    'r-internal-offcampus': {
      id: 'r-internal-offcampus',
      direction: 'resource_or_access',
      label: '\u666e\u901a\u7f51\u9875\u6b63\u5e38\u3001\u4ec5\u6821\u5185\u8d44\u6e90\u5f02\u5e38\uff0c\u4e14\u5728\u6821\u5916'
    },
    'r-internal-portal': {
      id: 'r-internal-portal',
      direction: 'resource_or_access',
      label: '\u6821\u5185\u8d44\u6e90\u9700\u4ece\u5df2\u767b\u5f55\u95e8\u6237\u5185\u8bbf\u95ee'
    },
    'r-single-site': {
      id: 'r-single-site',
      direction: 'resource_or_access',
      label: '\u4ec5\u5355\u4e00\u666e\u901a\u7f51\u7ad9\u5f02\u5e38'
    },
    'r-multi-path-device': {
      id: 'r-multi-path-device',
      direction: 'device_or_user_state',
      label: '\u540c\u4e00\u8bbe\u5907\u5728\u4e24\u79cd\u7f51\u7edc\u4e0b\u90fd\u5f02\u5e38\uff0c\u4e14\u53ef\u6bd4\u7684\u5176\u4ed6\u8bbe\u5907\u6b63\u5e38'
    },
    'r-insufficient': {
      id: 'r-insufficient',
      direction: 'undetermined',
      label: '\u8bc1\u636e\u4e0d\u8db3\u3001\u4e0d\u53ef\u6bd4\u6216\u8ffd\u95ee\u9884\u7b97\u5df2\u7528\u5c3d'
    }
  };

  var FACT_LABELS = {
    resource_scope: '\u6253\u4e0d\u5f00\u7684\u8303\u56f4',
    access_scene: '\u5f53\u524d\u8bbf\u95ee\u4f4d\u7f6e',
    peer_same_network: '\u540c\u5730\u70b9\u5176\u4ed6\u8bbe\u5907',
    mobile_data_web: '\u540c\u4e00\u8bbe\u5907\u5207\u6362\u79fb\u52a8\u6570\u636e',
    auth_visible: '\u5b98\u65b9\u9875\u9762\u63d0\u793a',
    webvpn_portal_state: 'WebVPN \u9875\u9762\u72b6\u6001'
  };

  var FACT_VALUE_LABELS = {
    resource_scope: {
      all_web_down: '\u666e\u901a\u7f51\u9875\u4e5f\u6253\u4e0d\u5f00',
      internal_only: '\u53ea\u6709\u6821\u5185\u8d44\u6e90\u6253\u4e0d\u5f00',
      single_site: '\u53ea\u6709\u4e00\u4e2a\u666e\u901a\u7f51\u7ad9\u6253\u4e0d\u5f00',
      unknown: '\u4e0d\u77e5\u9053'
    },
    access_scene: {
      on_campus: '\u5728\u6821\u5185',
      off_campus: '\u5728\u6821\u5916',
      unknown: '\u4e0d\u786e\u5b9a'
    },
    peer_same_network: {
      also_abnormal: '\u4e5f\u6709\u7c7b\u4f3c\u95ee\u9898',
      normal: '\u53ef\u4ee5\u6b63\u5e38\u8bbf\u95ee',
      not_tested: '\u672a\u6d4b\u8bd5',
      unknown: '\u4e0d\u77e5\u9053'
    },
    mobile_data_web: {
      works: '\u53ef\u4ee5\u6253\u5f00',
      fails: '\u4e5f\u6253\u4e0d\u5f00',
      not_tested: '\u672a\u6d4b\u8bd5',
      unknown: '\u4e0d\u77e5\u9053'
    },
    auth_visible: {
      auth_prompt: '\u51fa\u73b0\u7edf\u4e00\u8ba4\u8bc1\u63d0\u793a',
      credential_error: '\u63d0\u793a\u8d26\u53f7\u6216\u5bc6\u7801\u9519\u8bef',
      cert_warning: '\u51fa\u73b0\u8bc1\u4e66\u8b66\u544a',
      no_prompt: '\u6ca1\u6709\u660e\u786e\u63d0\u793a',
      unknown: '\u4e0d\u77e5\u9053'
    },
    webvpn_portal_state: {
      active_in_portal: '\u663e\u793a VPN \u6807\u8bc6\uff0c\u4e14\u4ece\u95e8\u6237\u5185\u8bbf\u95ee',
      not_enabled: '\u95e8\u6237\u672a\u663e\u793a VPN \u6807\u8bc6',
      wrong_entry: '\u672a\u4ece\u95e8\u6237\u8bbf\u95ee\u6216\u5df2\u5173\u95ed',
      unknown: '\u4e0d\u77e5\u9053'
    }
  };

  global.NTA = global.NTA || {};
  global.NTA.diagnostics = {
    KNOWLEDGE_VERSION: KNOWLEDGE_VERSION,
    SCHEMA_VERSION: SCHEMA_VERSION,
    DEFAULT_QUESTION_BUDGET: DEFAULT_QUESTION_BUDGET,
    MAX_ACTION_PACKS: MAX_ACTION_PACKS,
    SESSION_TTL_MS: SESSION_TTL_MS,
    MAX_FREE_TEXT: MAX_FREE_TEXT,
    MAX_HANDOFF_TEXT: MAX_HANDOFF_TEXT,
    DIRECTIONS: DIRECTIONS,
    QUESTIONS: QUESTIONS,
    SCENARIOS: SCENARIOS,
    ACTIONS: ACTIONS,
    RULES: RULES,
    FACT_LABELS: FACT_LABELS,
    FACT_VALUE_LABELS: FACT_VALUE_LABELS
  };
})(window);