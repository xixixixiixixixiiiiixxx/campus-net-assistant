(function (global) {
  'use strict';

  var META = {
    campus: '广东科技学院松山湖校区',
    audience: '在校学生',
    baselineDate: '2026-11-07',
    disclaimer: '资料内容依据校方公开页面整理；适用校区和核验日期见来源卡片，重要操作请以原文为准。'
  };

  var SOURCES = {
    'wifi-password': {
      title: '松山湖校区 Wi-Fi 忘记密码说明',
      url: 'https://www.gdust.edu.cn/jszx/jszx/20260604/161.html',
      publisher: '广东科技学院 信息与教育技术中心',
      verifiedAt: '2026-11-07',
      scope: '松山湖校区已设置的校园 Wi-Fi 密码；学生可携带证件前往校园营业厅办理'
    },
    'wifi-guide': {
      title: '校园无线 Wi-Fi 使用指南（含松山湖校区入口）',
      url: 'https://www.gdust.edu.cn/jszx/xywx/',
      publisher: '广东科技学院 信息与教育技术中心',
      verifiedAt: '2026-11-07',
      scope: '官网指南目录列出南城及松山湖校区说明；松山湖详情跳转学校微信公众号'
    },
    'vpn-password': {
      title: '校园 VPN 密码忘记',
      url: 'https://www.gdust.edu.cn/jszx/jszx/20260604/160.html',
      publisher: '广东科技学院 信息与教育技术中心',
      verifiedAt: '2026-11-07',
      scope: '学生可通过智慧校园门户、微信智慧校园小程序或钉钉工作台修改'
    },
    'webvpn': {
      title: 'WebVPN 服务',
      url: 'https://www.gdust.edu.cn/jszx/jszx/20250418/139.html',
      publisher: '广东科技学院 信息与教育技术中心',
      verifiedAt: '2026-11-07',
      scope: '师生校外访问校内资源；登录后需在门户页面内访问并保持页面打开'
    },
    'it-contact': {
      title: '信息技术中心联系方式',
      url: 'https://www.gdust.edu.cn/jszx/hdjl/lxwm/',
      publisher: '广东科技学院 信息与教育技术中心',
      verifiedAt: '2026-11-07',
      scope: '松山湖校区分北门片区和南门片区；公开页面列出对应办公室及电话'
    },
    'wifi-security': {
      title: 'Wi-Fi 安全问题',
      url: 'https://www.gdust.edu.cn/jszx/wlaq1/flcs/index.aspx?id=215',
      publisher: '广东科技学院 信息与教育技术中心',
      verifiedAt: '2026-11-07',
      scope: '通用公共 Wi-Fi 安全提醒，不是校园 Wi-Fi 连接或故障处理步骤'
    },
    'library-wifi-history': {
      title: '图书馆免费 Wi-Fi 通知（历史线索）',
      url: 'https://www.gdust.edu.cn/article/20180304/2187.html',
      publisher: '广东科技学院图书馆',
      verifiedAt: '当前状态未核实',
      scope: '2018 年通知提到部分图书馆区域的 GKTSG 免密 Wi-Fi；不能据此确认目前仍开放'
    }
  };

  var CONTACTS = {
    'unicom-a2': {
      name: '松山湖校区 A2 宿舍一楼 联通服务点',
      phone: '13266262696',
      scope: '松山湖校区忘记已设置的校园 Wi-Fi 密码；需本人携带身份证或学生证原件。',
      sourceId: 'wifi-password',
      caution: '校方资料提供了咨询电话，但没有列出营业时间。'
    },
    'net-consultant': {
      name: '校园网络顾问（微信在线咨询）',
      wechat: 'xty0769-2',
      scope: '各类校园网络问题在线咨询；加好友时请说明所在宿舍/教学楼区域与问题现象，可附上本助手生成的求助说明。',
      origin: '微信号由用户提供；目前未在本项目已核验的校方公开来源中确认。',
      caution: '联系前请先确认对方身份；不要发送密码、验证码、身份证照片或其他敏感信息。如无法添加，请以信息技术中心电话为准。'
    },
    'it-center': {
      name: '松山湖校区信息技术中心 · L6-205',
      phone: '0769-88027079',
      scope: '北门片区教学、办公区域的网络维护、信息化及技术支持。',
      sourceId: 'it-contact',
      caution: '该办公室公开服务范围为北门片区；其他区域请核对官网联系方式。'
    },
    'it-center-south': {
      name: '松山湖校区信息技术中心 · 3-304',
      phone: '0769-88027080',
      scope: '南门片区教学、办公区域的网络维护、信息化及技术支持。',
      sourceId: 'it-contact',
      caution: '该办公室公开服务范围为南门片区；其他区域请核对官网联系方式。'
    }
  };

  var CATEGORIES = [
    {
      id: 'wifi',
      no: '01',
      title: '校园 Wi-Fi',
      desc: '连不上、认证失败、忘记密码',
      entry: 'wifi-start'
    },
    {
      id: 'vpn',
      no: '02',
      title: 'VPN 密码 / 登录',
      desc: '智慧校园门户、小程序登录异常',
      entry: 'vpn-start'
    },
    {
      id: 'webvpn',
      no: '03',
      title: 'WebVPN 校外访问',
      desc: '在校外打不开校内系统',
      entry: 'webvpn-start'
    },
    {
      id: 'unsure',
      no: '04',
      title: '我不确定',
      desc: '分不清是哪类问题，先做个判断',
      entry: 'unsure-start'
    }
  ];

  var SYMPTOMS = [
    {
      id: 's-wifi-cannot',
      no: '01',
      title: 'Wi-Fi 一直连不上',
      desc: '搜不到、认证失败、一直转圈',
      entry: 'wifi-connect-symptom',
      category: 'wifi'
    },
    {
      id: 's-wifi-no-internet',
      no: '02',
      title: '已连上 Wi-Fi，但网页打不开',
      desc: '显示已连接，浏览器加载不出来',
      entry: 'wifi-diagnose',
      category: 'wifi'
    },
    {
      id: 's-password',
      no: '03',
      title: '忘记某个密码',
      desc: '校园 Wi-Fi、VPN 或门户密码',
      entry: 'password-type',
      category: 'unsure'
    },
    {
      id: 's-offcampus',
      no: '04',
      title: '在校外打不开校内资源',
      desc: '教务、图书馆、知网等',
      entry: 'webvpn-start',
      category: 'webvpn'
    },
    {
      id: 's-unsure',
      no: '05',
      title: '我说不清楚',
      desc: '先帮我判断是哪类问题',
      entry: 'unsure-start',
      category: 'unsure'
    }
  ];

  var NODES = {
    /* ---------------- 校园 Wi-Fi ---------------- */
    'wifi-start': {
      type: 'question',
      category: 'wifi',
      stage: 1,
      eyebrow: '校园 Wi-Fi',
      prompt: '先确认一下：你现在遇到的具体情况是？',
      hint: '选最接近的一项即可，判断错了可以返回重选。',
      options: [
        { value: 'forgot', label: '忘记 Wi-Fi 密码', next: 'wifi-forgot-device' },
        { value: 'cannot-connect', label: '密码正确，但连不上 / 一直转圈', next: 'wifi-connect-symptom' },
        { value: 'no-internet', label: '能连上，但打不开网页', next: 'wifi-diagnose' },
        { value: 'library-wifi', label: '想了解图书馆 Wi-Fi（历史公告）', next: 'library-wifi-history' },
        { value: 'wifi-safety', label: '公共 Wi-Fi 安全提醒', next: 'wifi-security-notice' },
        { value: 'unsure', label: '我也说不清', next: 'wifi-unsure' }
      ]
    },

    'wifi-unsure': {
      type: 'question',
      category: 'wifi',
      stage: 1,
      eyebrow: '校园 Wi-Fi',
      prompt: '没关系，我们从最常见的情况开始判断。',
      hint: '下面三项里，哪一项最像你现在的样子？',
      options: [
        { value: 'forgot', label: '我好像忘了密码', next: 'wifi-forgot-device' },
        { value: 'cannot-connect', label: 'Wi-Fi 连都连不上', next: 'wifi-connect-symptom' },
        { value: 'no-internet', label: '能连上，但打不开网页', next: 'wifi-diagnose' }
      ]
    },

    'wifi-forgot-device': {
      type: 'question',
      category: 'wifi',
      stage: 2,
      eyebrow: '校园 Wi-Fi · 补充信息',
      prompt: '你现在用哪种设备？',
      hint: '这条信息会写进最后的求助说明，方便工作人员判断。',
      options: [
        { value: 'phone', label: '手机', next: 'wifi-forgot-steps' },
        { value: 'laptop', label: '笔记本电脑', next: 'wifi-forgot-steps' },
        { value: 'tablet', label: '平板', next: 'wifi-forgot-steps' }
      ]
    },

    'wifi-forgot-steps': {
      type: 'steps',
      category: 'wifi',
      stage: 3,
      eyebrow: '校园 Wi-Fi · 按步骤操作',
      title: '重置校园 Wi-Fi 密码',
      intro: '校方说明：松山湖校区忘记已设置的校园 Wi-Fi 密码，需携带证件到校园营业厅办理。不要套用南城校区的密码同步说明。',
      steps: [
        {
          id: 'f1',
          basis: 'official',
          text: '确认你需要办理的是松山湖校区校园 Wi-Fi 密码；南城校区 Wi-Fi 与 VPN 密码同步的说明不适用于此流程。',
          note: '不同校区办理方式不同，请以松山湖校区原文为准。'
        },
        {
          id: 'f2',
          basis: 'official',
          text: '准备本人身份证或学生证。'
        },
        {
          id: 'f3',
          basis: 'official',
          text: '前往松山湖校区 A2 宿舍一楼联通服务点，说明需要重置校园 Wi-Fi 密码。'
        },
        {
          id: 'f4',
          basis: 'official',
          text: '办理前如需确认时间或要求，可拨打下方校园营业厅电话。',
          note: '号码来自校方公开页面。'
        }
      ],
      sourceIds: ['wifi-password'],
      contactIds: ['unicom-a2'],
      onComplete: 'wifi-done-q'
    },

    'wifi-connect-symptom': {
      type: 'question',
      category: 'wifi',
      stage: 2,
      eyebrow: '校园 Wi-Fi · 判断现象',
      prompt: '设备上显示的提示，更接近哪一种？',
      hint: '如果没有留意提示，选最后一项即可。',
      options: [
        { value: 'auth-fail', label: '提示密码错误 / 认证失败', next: 'wifi-auth-steps' },
        { value: 'stuck', label: '一直「正在连接」/ 获取 IP 地址', next: 'wifi-dhcp-steps' },
        { value: 'no-ssid', label: '根本搜不到校园 Wi-Fi 名称', next: 'wifi-ssid-steps' },
        { value: 'unknown', label: '没注意 / 说不清', next: 'wifi-generic-steps' }
      ]
    },

    'wifi-auth-steps': {
      type: 'steps',
      category: 'wifi',
      stage: 3,
      eyebrow: '校园 Wi-Fi · 认证失败',
      title: '先排除密码与旧配置问题',
      intro: '先做通用设备排查；关于松山湖校区密码办理，请按下方校方说明。',
      steps: [
        {
          id: 'a1',
          basis: 'general',
          text: '在 Wi-Fi 设置里「忘记」或「删除」该校网络，然后重新输入密码连接。',
          note: '旧配置残留会导致一直提示认证失败。'
        },
        {
          id: 'a2',
          basis: 'general',
          text: '确认设备连接的是校园 Wi-Fi，并在设备设置中重新输入该网络密码。',
          note: '本工具不会接收密码；不要把密码或验证码填在这里。'
        },
        {
          id: 'a3',
          basis: 'official',
          text: '仍然提示认证失败时，按校方流程重置 Wi-Fi 密码。',
          note: '下一步会给出正式的办理方式与联系方式。'
        }
      ],
      sourceIds: ['wifi-password'],
      contactIds: ['unicom-a2'],
      onComplete: 'wifi-done-q'
    },

    'wifi-dhcp-steps': {
      type: 'steps',
      category: 'wifi',
      stage: 3,
      eyebrow: '校园 Wi-Fi · 卡在连接中',
      title: '先尝试重新获取地址',
      intro: '官网未提供这一现象的专门诊断步骤；以下为通用设备排查，仍无效时联系校方技术支持。',
      steps: [
        {
          id: 'd1',
          basis: 'general',
          text: '关闭 Wi-Fi 再重新打开，等待 10 秒后重连。'
        },
        {
          id: 'd2',
          basis: 'general',
          text: '在系统设置里「忘记」该网络后重新连接。'
        },
        {
          id: 'd3',
          basis: 'general',
          text: '关闭 VPN、代理或网络加速类应用后重试。',
          note: '开启代理可能导致认证页面无法弹出。'
        },
        {
          id: 'd4',
          basis: 'general',
          text: '重启设备，换一个位置（例如靠近走廊或公共区域）再试。'
        }
      ],
      sourceIds: [],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'wifi-done-q'
    },

    'wifi-ssid-steps': {
      type: 'steps',
      category: 'wifi',
      stage: 3,
      eyebrow: '校园 Wi-Fi · 搜不到网络',
      title: '先确认是否在覆盖范围内',
      intro: '先通过官网无线网络指南入口核对松山湖校区的使用说明；其余步骤为通用设备排查。',
      steps: [
        {
          id: 's1',
          basis: 'official',
          text: '打开校方「校园无线 Wi-Fi 使用指南」，从目录进入松山湖校区说明，核对适用范围和网络名称。',
          note: '松山湖详细指南链接至学校微信公众号页面。'
        },
        {
          id: 's2',
          basis: 'general',
          text: '关闭再打开 Wi-Fi 开关，或切换一次飞行模式。'
        },
        {
          id: 's3',
          basis: 'general',
          text: '重启设备后重新搜索网络列表。'
        }
      ],
      sourceIds: ['wifi-guide'],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'wifi-done-q'
    },

    'wifi-generic-steps': {
      type: 'steps',
      category: 'wifi',
      stage: 3,
      eyebrow: '校园 Wi-Fi · 通用排查',
      title: '按顺序试一遍基础操作',
      intro: '这些是通用设备操作，不属于校方资料。',
      steps: [
        {
          id: 'g1',
          basis: 'general',
          text: '在 Wi-Fi 设置里「忘记」该校网络，然后重新连接。'
        },
        {
          id: 'g2',
          basis: 'general',
          text: '关闭 VPN、代理或网络加速类应用。'
        },
        {
          id: 'g3',
          basis: 'general',
          text: '重启设备后重试。'
        },
        {
          id: 'g4',
          basis: 'official',
          text: '仍然无效时，按校方流程重置 Wi-Fi 密码或联系服务点。'
        }
      ],
      sourceIds: ['wifi-password'],
      contactIds: ['unicom-a2', 'it-center', 'it-center-south'],
      onComplete: 'wifi-done-q'
    },

    'wifi-no-internet-steps': {
      type: 'steps',
      category: 'wifi',
      stage: 3,
      eyebrow: '校园 Wi-Fi · 已连接但无法上网',
      title: '先排除认证与代理问题',
      intro: '这些是通用设备操作，不属于校方资料。',
      steps: [
        {
          id: 'n1',
          basis: 'general',
          text: '打开浏览器访问任意校内页面，确认是否弹出统一认证页面。',
          note: '认证未完成时，网络会显示已连接但无法上网。'
        },
        {
          id: 'n2',
          basis: 'general',
          text: '关闭 VPN、代理或网络加速类应用后重试。'
        },
        {
          id: 'n3',
          basis: 'general',
          text: '换一个网站或应用试试，排除单个站点故障。'
        },
        {
          id: 'n4',
          basis: 'general',
          text: '「忘记」网络后重新连接一次。'
        }
      ],
      sourceIds: [],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'wifi-done-q'
    },

    'library-wifi-history': {
      type: 'notice',
      category: 'wifi',
      stage: 2,
      eyebrow: '图书馆 Wi-Fi · 历史公告',
      title: '目前是否仍开放，需要现场确认',
      body: '图书馆 2018 年公告曾提到部分楼层和自习区域可使用名为「GKTSG」的免密 Wi-Fi。该信息较旧，当前是否仍开放尚未核实；请以图书馆现场说明为准，不要仅凭这条历史公告判断现行网络名称或服务状态。',
      reason: '历史线索，不代表当前仍提供该服务。',
      sourceIds: ['library-wifi-history']
    },

    'wifi-security-notice': {
      type: 'notice',
      category: 'wifi',
      stage: 2,
      eyebrow: '公共 Wi-Fi · 安全提醒',
      title: '处理敏感账号时优先使用移动数据',
      body: '信息与教育技术中心提醒，公共场所开放 Wi-Fi 可能带来钓鱼或网络劫持风险；尽量避免在无密码公共 Wi-Fi 上登录支付或其他敏感账号。此建议针对公共开放 Wi-Fi，不是校园 Wi-Fi 的接入或故障处理步骤。',
      reason: '通用公共网络安全提示。',
      sourceIds: ['wifi-security']
    },

    'wifi-diagnose': {
      type: 'diagnose',
      category: 'wifi',
      stage: 2,
      scenarioId: 'wifi_no_internet',
      eyebrow: '校园 Wi-Fi · 对照诊断',
      title: '先做几个对照观察'
    },

    'wifi-done-q': {
      type: 'question',
      category: 'wifi',
      stage: 3,
      eyebrow: '确认结果',
      prompt: '按上面的步骤操作后，现在能正常上网了吗？',
      hint: '如果还有步骤没做完，也可以如实选择，我们会把未完成的情况写进求助说明。',
      options: [
        { value: 'yes', label: '可以了，已经解决', next: 'outcome-resolved' },
        { value: 'no', label: '还是不行', next: 'outcome-unresolved' },
        { value: 'partial', label: '有些步骤做不了 / 不确定', next: 'outcome-unresolved' }
      ]
    },

    /* ---------------- 结果 ---------------- */
    'outcome-resolved': {
      type: 'outcome',
      status: 'resolved',
      stage: 4,
      title: '这次解决了',
      body: '建议再使用一次刚才出问题的服务，确认连接稳定。本次排查记录保存在当前浏览器，可在右侧查看。'
    },

    'outcome-unresolved': {
      type: 'outcome',
      status: 'unresolved',
      stage: 4,
      title: '需要人工协助',
      body: '下面是为你整理好的求助说明。它只是一段可复制的文字，不会自动提交给学校，也不代表已经报修。'
    },

    /* ---------------- VPN ---------------- */
    'vpn-start': {
      type: 'question',
      category: 'vpn',
      stage: 1,
      eyebrow: 'VPN 密码 / 登录',
      prompt: '你现在需要处理哪种情况？',
      hint: '学校公开的学生 VPN 指南包含密码修改方式；其他客户端错误会转人工确认。',
      options: [
        { value: 'password', label: '忘记或需要修改 VPN 密码', next: 'vpn-reset-channel' },
        { value: 'client-error', label: 'VPN 客户端登录报错', next: 'vpn-login-help' },
        { value: 'remote-resource', label: '在校外访问校内资源', next: 'webvpn-start' }
      ]
    },

    'vpn-reset-channel': {
      type: 'question',
      category: 'vpn',
      stage: 2,
      eyebrow: 'VPN 密码修改 · 选择方式',
      prompt: '你想通过哪种官方渠道修改密码？',
      hint: '账号、密码和验证码只在学校门户、小程序或钉钉中输入，不要发给本工具或他人。',
      options: [
        { value: 'portal', label: '智慧校园门户（网页）', next: 'vpn-reset-portal' },
        { value: 'wechat', label: '微信智慧校园小程序', next: 'vpn-reset-wechat' },
        { value: 'dingtalk', label: '钉钉工作台', next: 'vpn-reset-dingtalk' }
      ]
    },

    'vpn-reset-portal': {
      type: 'steps',
      category: 'vpn',
      stage: 3,
      eyebrow: 'VPN 密码修改 · 智慧校园门户',
      title: '通过学校门户修改 VPN 密码',
      intro: '以下步骤来自校方学生密码修改说明。只在 portal.gdust.edu.cn 官方门户输入账号、密码和验证码。',
      steps: [
        { id: 'vp1', basis: 'official', text: '打开智慧校园门户 portal.gdust.edu.cn，在「常用工具」中选择「VPN 密码修改」。' },
        { id: 'vp2', basis: 'official', text: '按页面要求输入学号和新密码，点击「获取验证码」；验证码会发送到钉钉。' },
        { id: 'vp3', basis: 'official', text: '把钉钉收到的验证码输入学校门户并确认修改。', note: '不要把验证码复制到本工具或发送给他人。' }
      ],
      sourceIds: ['vpn-password'],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'vpn-done-q'
    },

    'vpn-reset-wechat': {
      type: 'steps',
      category: 'vpn',
      stage: 3,
      eyebrow: 'VPN 密码修改 · 微信小程序',
      title: '通过微信智慧校园修改 VPN 密码',
      intro: '以下步骤来自校方学生密码修改说明。',
      steps: [
        { id: 'vw1', basis: 'official', text: '在微信中搜索并打开「广东科技学院智慧校园」小程序，确认已登录。' },
        { id: 'vw2', basis: 'official', text: '在首页进入「校园 VPN」，下滑到「修改 VPN 密码」。' },
        { id: 'vw3', basis: 'official', text: '按页面要求输入学号和新密码，点击「确认修改密码」。', note: '账号和密码只在学校官方小程序中输入。' }
      ],
      sourceIds: ['vpn-password'],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'vpn-done-q'
    },

    'vpn-reset-dingtalk': {
      type: 'steps',
      category: 'vpn',
      stage: 3,
      eyebrow: 'VPN 密码修改 · 钉钉工作台',
      title: '通过钉钉智慧校园门户修改 VPN 密码',
      intro: '以下步骤来自校方学生密码修改说明。',
      steps: [
        { id: 'vd1', basis: 'official', text: '打开钉钉底部「广科学院」，在「全员」中进入「智慧校园门户」。' },
        { id: 'vd2', basis: 'official', text: '进入校园 VPN 的「修改 VPN 密码」，按页面要求输入学号和新密码并确认。', note: '只在学校官方门户中输入账号和密码。' }
      ],
      sourceIds: ['vpn-password'],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'vpn-done-q'
    },

    'vpn-login-help': {
      type: 'notice',
      category: 'vpn',
      stage: 2,
      eyebrow: 'VPN 客户端登录',
      title: '官网暂未提供客户端报错的逐项排查表',
      body: '校方公开页面确认了学生 VPN 密码修改方式，但没有说明各类客户端错误码。若错误与密码有关，可返回选择官方修改渠道；如果密码修改后仍无法登录，请联系信息技术中心并提供错误提示，不要提供密码或验证码。',
      reason: '未找到可引用的学生客户端错误码说明。',
      sourceIds: ['vpn-password', 'it-contact'],
      contactIds: ['it-center', 'it-center-south']
    },

    'vpn-done-q': {
      type: 'question',
      category: 'vpn',
      stage: 3,
      eyebrow: '确认结果',
      prompt: '操作后，VPN 问题解决了吗？',
      hint: '如果仍然失败，请把错误提示记下来；不要记录或提交密码、验证码。',
      options: [
        { value: 'yes', label: '可以了，已经解决', next: 'outcome-resolved' },
        { value: 'no', label: '还是不行', next: 'outcome-unresolved' },
        { value: 'partial', label: '有些步骤做不了 / 不确定', next: 'outcome-unresolved' }
      ]
    },

    /* ---------------- WebVPN ---------------- */
    'webvpn-start': {
      type: 'question',
      category: 'webvpn',
      stage: 1,
      eyebrow: 'WebVPN 校外访问',
      prompt: '你现在遇到哪种情况？',
      hint: 'WebVPN 用于在校外访问教务、科研、图书资源等校内信息化资源。',
      options: [
        { value: 'setup', label: '还没开启，想从校外访问校内资源', next: 'webvpn-steps' },
        { value: 'resource', label: '已开启 VPN，但资源仍打不开', next: 'webvpn-resource-diagnose' },
        { value: 'portal-login', label: '智慧校园门户无法登录 / 有其他错误', next: 'webvpn-login-help' }
      ]
    },

    'webvpn-resource-diagnose': {
      type: 'diagnose',
      category: 'webvpn',
      stage: 2,
      scenarioId: 'webvpn_resource',
      eyebrow: 'WebVPN · 对照诊断',
      title: '先核对访问条件'
    },

    'webvpn-steps': {
      type: 'steps',
      category: 'webvpn',
      stage: 2,
      eyebrow: 'WebVPN · 从校外访问',
      title: '通过智慧校园门户开启 WebVPN',
      intro: '校方说明 WebVPN 无需安装客户端；账号和密码只在 portal.gdust.edu.cn 官方门户输入。',
      steps: [
        { id: 'wv1', basis: 'official', text: '打开 https://portal.gdust.edu.cn/#/home，点击「去登录」。' },
        { id: 'wv2', basis: 'official', text: '在学校统一身份认证页面使用扫码或账号密码登录。', note: '不要在本工具填写账号、密码或验证码。' },
        { id: 'wv3', basis: 'official', text: '登录后查看网页右下角的 VPN 标识；显示「正在使用 VPN」表示已启用。' },
        { id: 'wv4', basis: 'official', text: '保持智慧校园门户页面打开，并在该页面中访问校内资源。' }
      ],
      sourceIds: ['webvpn'],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'webvpn-done-q'
    },

    'webvpn-resource-steps': {
      type: 'steps',
      category: 'webvpn',
      stage: 2,
      eyebrow: 'WebVPN · 资源无法访问',
      title: '确认 VPN 状态和访问位置',
      intro: '以下检查依据校方 WebVPN 使用说明。',
      steps: [
        { id: 'wr1', basis: 'official', text: '确认智慧校园门户右下角显示「正在使用 VPN」。' },
        { id: 'wr2', basis: 'official', text: '不要关闭智慧校园门户；从这个门户页面中打开需要访问的校内资源。', note: '校方说明所有资源都必须在已登录的门户页面中访问。' },
        { id: 'wr3', basis: 'official', text: '仍然无法访问时，使用 WebVPN 原文中的钉钉扫码反馈入口联系信息与教育技术中心。' }
      ],
      sourceIds: ['webvpn'],
      contactIds: ['net-consultant', 'it-center', 'it-center-south'],
      onComplete: 'webvpn-done-q'
    },

    'webvpn-login-help': {
      type: 'notice',
      category: 'webvpn',
      stage: 2,
      eyebrow: 'WebVPN 登录问题',
      title: '先确认使用的是学校智慧校园门户',
      body: '校方 WebVPN 指南给出的入口是智慧校园门户。如果门户无法登录，或扫码/账号登录后仍没有显示「正在使用 VPN」，官网没有提供对应错误码的自助修复步骤；请联系信息技术中心并说明错误提示，不要提供密码或验证码。',
      reason: '官网未公开门户登录错误码的自助排查步骤。',
      sourceIds: ['webvpn', 'it-contact'],
      contactIds: ['it-center', 'it-center-south']
    },

    'webvpn-done-q': {
      type: 'question',
      category: 'webvpn',
      stage: 3,
      eyebrow: '确认结果',
      prompt: '现在能在门户页面中打开校内资源了吗？',
      hint: '如果没有解决，可复制排查记录联系信息技术中心。',
      options: [
        { value: 'yes', label: '可以了，已经解决', next: 'outcome-resolved' },
        { value: 'no', label: '还是不行', next: 'outcome-unresolved' },
        { value: 'partial', label: '有些步骤做不了 / 不确定', next: 'outcome-unresolved' }
      ]
    },

    /* ---------------- 不确定 ---------------- */
    'password-type': {
      type: 'question',
      category: 'unsure',
      stage: 1,
      eyebrow: '忘记密码',
      prompt: '你想找回哪个密码？',
      hint: '校园 Wi-Fi 密码和 VPN / 智慧校园密码的办理方式不同。',
      options: [
        { value: 'wifi', label: '校园 Wi-Fi 密码', next: 'wifi-forgot-device' },
        { value: 'vpn', label: 'VPN / 智慧校园密码', next: 'vpn-reset-channel' },
        { value: 'unsure', label: '分不清是哪个', next: 'password-unsure' }
      ]
    },

    'password-unsure': {
      type: 'notice',
      category: 'unsure',
      stage: 1,
      eyebrow: '忘记密码',
      title: '先判断是哪个密码',
      body: '校园 Wi-Fi 密码用于连接无线网络，办理方式见「校园 Wi-Fi 密码」；VPN 和智慧校园密码用于登录门户或校外访问，可在智慧校园门户、微信小程序或钉钉中修改。两个密码不是同一个入口。',
      reason: '两类密码的办理渠道不同，避免带你走错流程。',
      sourceIds: ['wifi-password', 'vpn-password'],
      contactIds: ['unicom-a2', 'it-center', 'it-center-south']
    },

    'unsure-start': {
      type: 'question',
      category: 'unsure',
      stage: 1,
      eyebrow: '先做个判断',
      prompt: '你主要想解决哪方面的问题？',
      hint: '选一个最接近的，我们会带你进入对应的排查。',
      options: [
        { value: 'wifi', label: '在校园里连 Wi-Fi 出问题', next: 'wifi-start' },
        { value: 'vpn', label: 'VPN 登录不上 / 忘记密码', next: 'vpn-start' },
        { value: 'webvpn', label: '在校外访问校内系统打不开', next: 'webvpn-start' },
        { value: 'none', label: '都不是 / 说不上来', next: 'unsure-fallback' }
      ]
    },

    'unsure-fallback': {
      type: 'notice',
      category: 'unsure',
      stage: 1,
      eyebrow: '先做个判断',
      title: '暂时无法自动判断',
      body: '现有资料不足以覆盖你的情况。建议直接查看信息技术中心的联系方式页面，说明你的设备、位置和具体提示。',
      reason: '暂未找到与你的描述匹配的官方资料。',
      sourceIds: ['it-contact'],
      contactIds: ['it-center', 'it-center-south']
    }
  };

  global.NTA = global.NTA || {};
  global.NTA.knowledge = {
    META: META,
    SOURCES: SOURCES,
    CONTACTS: CONTACTS,
    CATEGORIES: CATEGORIES,
    SYMPTOMS: SYMPTOMS,
    NODES: NODES
  };
})(window);
