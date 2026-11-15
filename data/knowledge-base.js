(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.NTA = root.NTA || {};
    root.NTA.knowledgeBase = api;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var META = {
    version: '2026-11-11.v2',
    baselineDate: '2026-11-11',
    campus: 'songshanhu',
    audience: 'student',
    policy: '只把项目已核验的校方原文整理为可执行条目；PENDING 与 superseded 材料不参与回答。'
  };

  var SOURCES = {
    'wifi-password': {
      title: '松山湖校区 Wi-Fi 忘记密码说明',
      url: 'https://www.gdust.edu.cn/jszx/jszx/20260604/161.html',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: '2026-04-13',
      publishedAtBasis: '取自官方页面正文「发布日期：2026-04-13」；URL 中的 20260604 是批次路径，不是发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '松山湖校区已设置的校园 Wi-Fi 密码；页面同时含其他校区和教师内容'
    },
    'vpn-password': {
      title: '校园 VPN 密码忘记',
      url: 'https://www.gdust.edu.cn/jszx/jszx/20260604/160.html',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: '2026-04-09',
      publishedAtBasis: '取自官方页面正文「发布日期：2026-04-09」；URL 中的 20260604 不是发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '学生可通过智慧校园门户、微信智慧校园小程序或钉钉工作台修改'
    },
    'webvpn': {
      title: 'WebVPN 服务',
      url: 'https://www.gdust.edu.cn/jszx/jszx/20250418/139.html',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: '2025-04-02',
      publishedAtBasis: '取自官方页面正文「发布日期：2025-04-02」',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '师生校外访问校内资源；登录后需在门户页面内访问并保持页面打开'
    },
    'it-contact': {
      title: '信息技术中心联系方式',
      url: 'https://www.gdust.edu.cn/jszx/hdjl/lxwm/',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: 'unknown',
      publishedAtBasis: '页面未标注发布日期',
      lastCheckedAt: '2026-11-07',
      verifiedAt: '2026-11-07',
      scope: '松山湖校区分北门片区和南门片区；公开页面列出对应办公室及电话'
    },
    'wifi-security': {
      title: 'Wi-Fi 安全问题',
      url: 'https://www.gdust.edu.cn/jszx/wlaq1/flcs/index.aspx?id=215',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: 'unknown',
      publishedAtBasis: '页面未标注发布日期',
      lastCheckedAt: '2026-11-07',
      verifiedAt: '2026-11-07',
      scope: '通用公共 Wi-Fi 安全提醒，不是校园 Wi-Fi 连接或故障处理步骤'
    },
    'wifi-guide': {
      title: '松山湖校区校园无线网络使用指南（微信公众号）',
      url: 'https://mp.weixin.qq.com/s/fgPtEFcFtdvlB-riJCkceQ',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: 'unknown',
      publishedAtBasis: '公众号文章未标注发布日期；页面目录显示 2021-11-05，正文未重复标注',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '松山湖校区学生与教师连接 GDUST、10.9.9.9 上网认证、苹果息屏断网等说明'
    },
    'library-wifi-history': {
      title: '图书馆免费 Wi-Fi 通知（历史线索）',
      url: 'https://www.gdust.edu.cn/article/20180304/2187.html',
      publisher: '广东科技学院图书馆',
      publishedAt: '2018-03-04',
      publishedAtBasis: '取自官方页面路径 20180304',
      lastCheckedAt: '2026-11-07',
      verifiedAt: 'unknown',
      scope: '2018 年通知提到部分图书馆区域的 GKTSG 免密 Wi-Fi；不能据此确认目前仍开放'
    },
    'vpn-tools-portal': {
      title: '智慧校园门户 · VPN 访问工具',
      url: 'https://portal.gdust.edu.cn/#/home',
      publisher: '广东科技学院 信息与教育技术中心（智慧校园门户）',
      publishedAt: 'unknown',
      publishedAtBasis: '登录后弹窗，无发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '提供 Windows、Mac、安卓客户端下载与 2025 年 3 月版师生手册；iOS 需在 App Store 搜 iNode connect'
    },
    'vpn-manual-2025': {
      title: 'VPN 操作手册（学生版，2025 年 3 月更新）',
      url: 'https://portal.gdust.edu.cn/explain/VPN_Operation_Manual_for_students_v3.0.pdf',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: '2025-03',
      publishedAtBasis: '门户下载入口标注「2025年3月更新」，PDF 内未单独印日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '学生 VPN 密码修改、四平台客户端安装、校外访问校内资源用法'
    },
    'portal-phone-directory': {
      title: '智慧校园门户 · 部门学院电话表',
      url: 'https://portal.gdust.edu.cn/#/home',
      publisher: '广东科技学院 信息与教育技术中心（智慧校园门户）',
      publishedAt: 'unknown',
      publishedAtBasis: '登录后弹窗，无发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '96 条部门/学院电话，含现教中心 1-906、8-506、工1-401、L6-205 与图书馆'
    },
    'portal-help': {
      title: '智慧校园门户 · 帮助与反馈 / 业务办理',
      url: 'https://portal.gdust.edu.cn/#/help-feedback',
      publisher: '广东科技学院 信息与教育技术中心（智慧校园门户）',
      publishedAt: 'unknown',
      publishedAtBasis: '登录后页面，无发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '钉钉扫码提交问题，官方写 1 个工作日内处理；咨询电话 0769-86211914；业务办理含 VPN 账号问题反馈表'
    },
    'campusnet-service': {
      title: '广科校园网服务（微信公众号）',
      url: 'https://mp.weixin.qq.com/s/fQ33gGL2D_am2L0WfNLfdQ',
      publisher: '广东科技学院 信息与教育技术中心',
      publishedAt: 'unknown',
      publishedAtBasis: '公众号文章未标注发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      scope: '宿舍宽带与校园 WiFi 办理入口、南城与松山湖营业厅位置'
    },
    'user-voice-2026-11-11': {
      title: '用户口述补充（营业时间、网口报修、故障渠道、图书馆）',
      url: 'docs/notices/用户口述_2026-11-11.md',
      publisher: '用户本人（非校方公开来源）',
      publishedAt: 'unknown',
      publishedAtBasis: '用户口述，无网页发布日期',
      lastCheckedAt: '2026-11-11',
      verifiedAt: 'unknown',
      scope: 'A2 营业时间、宿舍网口报修、无固定故障公告渠道、图书馆有校园网'
    },
    'dorm-broadband-screenshot': {
      title: '广科宿舍 WiFi 套餐截图（中国移动合作）',
      url: 'docs/notices/用户口述_2026-11-11.md',
      publisher: '用户提供的微信小程序截图（非校方原文）',
      publishedAt: 'unknown',
      publishedAtBasis: '截图无发布日期，取回日期 2026-11-11',
      lastCheckedAt: '2026-11-11',
      verifiedAt: 'unknown',
      scope: '截图显示套餐 2：20M 360 元/年；套餐 4：30M 480 元/年；价格可能变动'
    }
  };

  var CONTACTS = {
    'unicom-a2': {
      id: 'unicom-a2',
      name: '松山湖校区 A2 宿舍一楼 联通服务点',
      phone: '13266262696',
      scope: '松山湖校区忘记已设置的校园 Wi-Fi 密码；需本人携带身份证或学生证原件。',
      sourceId: 'wifi-password',
      origin: 'official',
      caution: '校方资料没有列出营业时间。用户口述：周末与上课时间都营业；具体钟点以现场或电话确认为准。'
    },
    'it-center': {
      id: 'it-center',
      name: '松山湖校区信息技术中心 · L6-205',
      phone: '0769-88027079',
      scope: '北门片区教学、办公区域的网络维护、信息化及技术支持。',
      sourceId: 'it-contact',
      origin: 'official',
      caution: '该办公室公开服务范围为北门片区；其他区域请核对官网联系方式。'
    },
    'it-center-south': {
      id: 'it-center-south',
      name: '松山湖校区信息技术中心 · 3-304',
      phone: '0769-88027080',
      scope: '南门片区教学、办公区域的网络维护、信息化及技术支持。',
      sourceId: 'it-contact',
      origin: 'official',
      caution: '官网「联系我们」标注为南门片区 3-304、电话 88027080；门户电话表把 88027080 记在 L6-205 名下且没有 3-304。两处官方来源不一致，回答时应说明可按官网页面或现场确认。'
    },
    'net-consultant': {
      id: 'net-consultant',
      name: '校园网络顾问（微信在线咨询）',
      phone: '',
      wechat: 'xty0769-2',
      scope: '各类校园网络问题在线咨询；加好友时请说明所在宿舍/教学楼区域与问题现象，可附上本助手生成的求助说明。',
      sourceId: '',
      origin: '用户提供；目前未在本项目已核验的校方公开来源中确认。',
      caution: '联系前请先确认对方身份；不要发送密码、验证码、身份证照片或其他敏感信息。如无法添加，请以信息技术中心电话为准。'
    },
    'portal-help': {
      id: 'portal-help',
      name: '智慧校园门户 · 帮助与反馈 / 业务办理咨询',
      phone: '0769-86211914',
      scope: '智慧校园门户使用、VPN 账号问题反馈等；业务办理需在钉钉扫码提交，官方写 1 个工作日内处理。',
      sourceId: 'portal-help',
      origin: 'official',
      caution: '这是门户帮助页公布的咨询电话，不等于网络故障报修电话；网络故障优先联系所在片区信息中心。'
    },
    'dorm-admin': {
      id: 'dorm-admin',
      name: '宿舍管理员（宿管）',
      phone: '',
      scope: '宿舍网口不能用、网线或端口故障登记报修。',
      sourceId: 'user-voice-2026-11-11',
      origin: '用户提供；目前未在本项目已核验的校方公开来源中确认。',
      caution: '没有公开的宿管电话，需到所住楼栋值班室登记；报修时说明楼栋、房间号、网口位置和现象。'
    }
  };

  var ENTRIES = [
    {
      id: 'wifi-password-reset',
      topic: 'wifi-password',
      title: '松山湖校区校园 Wi-Fi 密码重置（学生）',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: '2026-04-13',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['忘记已设置的校园 Wi-Fi 密码', 'Wi-Fi 提示密码错误', '需要重置校园 Wi-Fi 密码'],
      notAppliesWhen: ['南城校区的密码同步说明', '教师账号', '宿舍无线路由器密码'],
      content: '松山湖校区学生忘记已设置的校园 Wi-Fi 密码，需本人携带身份证或学生证，到 A2 宿舍一楼联通服务点办理重置。用户口述该服务点周末与上课时间都营业，具体钟点以现场为准。校方页面同时包含其他校区和教师内容，不能套用。',
      steps: [
        { id: 'wp1', basis: 'official', text: '确认办理的是松山湖校区校园 Wi-Fi 密码；南城校区的密码同步说明不适用。' },
        { id: 'wp2', basis: 'official', text: '准备本人身份证或学生证。' },
        { id: 'wp3', basis: 'official', text: '前往松山湖校区 A2 宿舍一楼联通服务点，说明需要重置校园 Wi-Fi 密码。' },
        { id: 'wp4', basis: 'official', text: '办理前可拨打 13266262696，确认营业时间和所需材料。' },
        { id: 'wp5', basis: 'user-provided', text: '用户口述该服务点周末与上课时间都营业；具体钟点以现场或电话为准。' }
      ],
      contactIds: ['unicom-a2'],
      sourceIds: ['wifi-password', 'user-voice-2026-11-11'],
      prohibited: ['不要向任何人提供密码或验证码', '不要套用南城校区或教师流程', '不要把用户口述的营业时间当作固定钟点'],
      verificationNote: '2026-11-11 重新抓取官方页面正文核对，页面发布日期为 2026-04-13；营业时间来自用户口述，未在官网确认。'
    },
    {
      id: 'vpn-password-reset',
      topic: 'vpn-password',
      title: '校园 VPN 密码修改（学生）',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: '2026-04-09',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['忘记 VPN 密码', '需要修改 VPN 密码', '智慧校园密码需要重置'],
      notAppliesWhen: ['Wi-Fi 密码', '教师账号', '客户端错误码的逐项排查'],
      content: '学生可通过智慧校园门户、微信「广东科技学院智慧校园」小程序或钉钉工作台修改 VPN 密码；2025 版学生手册把微信小程序列为首选入口。账号、密码和验证码只在学校官方页面输入。',
      steps: [
        { id: 'vp1', basis: 'official', text: '智慧校园门户：打开 portal.gdust.edu.cn，在「常用工具」中选择「VPN 密码修改」，输入学号和新密码，验证码会发送到钉钉。' },
        { id: 'vp2', basis: 'official', text: '微信小程序：打开「广东科技学院智慧校园」，进入「校园 VPN」并下滑到「修改 VPN 密码」。' },
        { id: 'vp3', basis: 'official', text: '钉钉：打开底部「广科学院」→「智慧校园门户」→ 校园 VPN →「修改 VPN 密码」。' }
      ],
      contactIds: ['it-center', 'it-center-south'],
      sourceIds: ['vpn-password'],
      prohibited: ['不要把验证码复制给任何人', '不要在本工具填写账号或密码'],
      verificationNote: '2026-11-11 重新抓取官方页面正文核对，页面发布日期为 2026-04-09；并对照 2025 年 3 月版学生手册。'
    },
    {
      id: 'webvpn-offcampus',
      topic: 'webvpn',
      title: '校外访问校内资源（WebVPN）',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: '2025-04-02',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['在校外访问教务、图书馆等校内资源', '校外普通网页正常但校内系统打不开'],
      notAppliesWhen: ['校内访问', '普通网站单独故障', '需要安装客户端的 VPN'],
      content: 'WebVPN 无需安装客户端。登录智慧校园门户后，在门户页面内访问校内资源；门户右下角显示「正在使用 VPN」表示已启用。',
      steps: [
        { id: 'wv1', basis: 'official', text: '打开 https://portal.gdust.edu.cn/#/home，点击「去登录」。' },
        { id: 'wv2', basis: 'official', text: '在学校统一身份认证页面使用扫码或账号密码登录。' },
        { id: 'wv3', basis: 'official', text: '确认页面右下角显示「正在使用 VPN」。' },
        { id: 'wv4', basis: 'official', text: '保持智慧校园门户页面打开，并从该页面中打开需要访问的校内资源。' }
      ],
      contactIds: ['it-center', 'it-center-south'],
      sourceIds: ['webvpn'],
      prohibited: ['不要把密码或验证码发给任何人', '不要关闭门户后直接在新标签页打开校内地址'],
      verificationNote: '2026-11-11 重新抓取官方页面正文核对，页面发布日期为 2025-04-02。'
    },
    {
      id: 'contact-directory',
      topic: 'contact',
      title: '松山湖校区信息技术中心联系方式',
      campus: ['songshanhu'],
      audience: ['student', 'teacher'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['需要人工协助', '报修或咨询校园网络问题'],
      notAppliesWhen: ['要求代为提交工单', '要求远程修改设备设置'],
      content: '按所在片区联系：北门片区 L6-205，电话 0769-88027079；南门片区 3-304，电话 0769-88027080。门户电话表把 88027080 也记在 L6-205 名下且没有 3-304，两处官方来源不一致；公开页面均未列出服务时间。',
      steps: [
        { id: 'ct1', basis: 'official', text: '确认你所在的教学楼或宿舍更接近北门片区还是南门片区。' },
        { id: 'ct2', basis: 'official', text: '北门片区拨打 0769-88027079；南门片区拨打 0769-88027080。' },
        { id: 'ct3', basis: 'official', text: '说明位置、设备、具体提示和已经做过的步骤；不要提供密码或验证码。' }
      ],
      contactIds: ['it-center', 'it-center-south'],
      sourceIds: ['it-contact'],
      prohibited: ['不要声称已经代为报修'],
      verificationNote: '2026-11-11 抓取官网「联系我们」与门户部门电话表，发现 88027080 的归属标注不一致；官网页面未列服务时间。'
    },
    {
      id: 'wifi-public-security',
      topic: 'security',
      title: '公共 Wi-Fi 安全提醒',
      campus: ['songshanhu'],
      audience: ['student', 'teacher'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-07',
      verifiedAt: '2026-11-07',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['在公共开放 Wi-Fi 上登录敏感账号', '担心钓鱼或网络劫持'],
      notAppliesWhen: ['校园 Wi-Fi 接入或故障处理'],
      content: '信息与教育技术中心提醒，公共场所开放 Wi-Fi 可能带来钓鱼或网络劫持风险；尽量避免在无密码公共 Wi-Fi 上登录支付或其他敏感账号。',
      steps: [
        { id: 'ws1', basis: 'official', text: '处理支付、网银等敏感账号时，优先使用移动数据。' },
        { id: 'ws2', basis: 'official', text: '不要连接来源不明的开放 Wi-Fi；必要时向现场工作人员确认网络名称。' }
      ],
      contactIds: [],
      sourceIds: ['wifi-security'],
      prohibited: ['不要把这条安全提醒当作校园 Wi-Fi 的故障处理步骤'],
      verificationNote: '沿用项目 2026-11-07 核验基准；本轮未重新抓取原文。'
    },
    {
      id: 'library-wifi-history',
      topic: 'wifi-access',
      title: '图书馆免费 Wi-Fi（2018 历史通知）',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: '2018-03-04',
      lastCheckedAt: '2026-11-07',
      verifiedAt: 'unknown',
      status: 'superseded',
      confidence: 'historical',
      appliesWhen: ['询问图书馆是否有免费 Wi-Fi'],
      notAppliesWhen: ['作为当前网络名称或服务状态的依据'],
      content: '2018 年通知曾提到部分图书馆区域可使用名为 GKTSG 的免密 Wi-Fi。当前是否仍开放尚未核实，不能据此判断现行网络名称或服务状态。',
      steps: [],
      contactIds: [],
      sourceIds: ['library-wifi-history'],
      prohibited: ['不要把 2018 年信息当作当前状态'],
      verificationNote: '历史线索，状态未核实。'
    },
    {
      id: 'wifi-connect-guide',
      topic: 'wifi-connect',
      title: '松山湖校区校园 Wi-Fi 连接与认证（学生）',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['第一次连接校园 Wi-Fi', '连上 GDUST 但没网', '不知道 10.9.9.9 是什么', '苹果手机息屏后断网'],
      notAppliesWhen: ['忘记密码', '教师账号', '校外访问校内资源'],
      content: '松山湖校区学生连接校园 Wi-Fi：先连 GDUST，再在浏览器打开 10.9.9.9，点「上网认证」，输入账号和新密码。已办理联通广科校园卡的同学，账号密码与宿舍宽带一致。苹果手机息屏断网时，打开「自动加入」并关闭「自动登录」。',
      steps: [
        { id: 'wc1', basis: 'official', text: '手机或电脑连接 Wi-Fi 名称 GDUST。' },
        { id: 'wc2', basis: 'official', text: '如果认证页没有自动弹出，打开浏览器，在地址栏输入 10.9.9.9。' },
        { id: 'wc3', basis: 'official', text: '点击「上网认证」，输入账号和新密码，点击 Login。' },
        { id: 'wc4', basis: 'official', text: '看到「您已成功连接校园网」即完成。' },
        { id: 'wc5', basis: 'official', text: '苹果手机一息屏就断网：在 Wi-Fi 设置里打开「自动加入」，关闭「自动登录」。' }
      ],
      contactIds: ['unicom-a2', 'it-center', 'it-center-south'],
      sourceIds: ['wifi-guide', 'campusnet-service'],
      prohibited: ['不要索要或代填密码', '不要把 10.9.9.9 说成校外网站'],
      verificationNote: '2026-11-11 抓取学校公众号《松山湖校区校园无线网络使用指南》正文与《广科校园网服务》；公众号未标发布日期。'
    },
    {
      id: 'dorm-broadband-plans',
      topic: 'dorm-broadband',
      title: '宿舍宽带办理与套餐参考',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'user-provided',
      appliesWhen: ['宿舍宽带多少钱', '校园网套餐', '想办宿舍网络', '电话卡和宽带怎么办', '周末能不能去办', 'A2 营业时间'],
      notAppliesWhen: ['已经办理但连不上', '宿舍网口坏了', '教室或办公区网络'],
      content: '宿舍宽带和营业厅合作电话卡都要到 A2 宿舍楼一楼营业厅咨询办理。用户提供的截图显示中国移动合作套餐有 20M 360 元/年、30M 480 元/年两档；价格可能随时间和校区调整，最终以营业厅现场为准。用户口述该营业厅周末与上课时间都营业。',
      steps: [
        { id: 'db1', basis: 'official', text: '到松山湖校区 A2 宿舍楼一楼营业厅咨询当前在售套餐。' },
        { id: 'db2', basis: 'user-provided', text: '用户截图参考：20M 360 元/年；30M 480 元/年。' },
        { id: 'db3', basis: 'official', text: '办理时确认速率、使用时限、是否绑定电话卡，并保留缴费凭证。' },
        { id: 'db4', basis: 'official', text: '如需线上入口，可在微信关注「广科校园网」按提示实名办理。' },
        { id: 'db5', basis: 'user-provided', text: '用户口述营业厅周末与上课时间都营业；具体钟点以现场为准。' }
      ],
      contactIds: ['unicom-a2'],
      sourceIds: ['dorm-broadband-screenshot', 'campusnet-service', 'user-voice-2026-11-11'],
      prohibited: ['不要把截图价格当作当前统一价', '不要承诺一定有此套餐'],
      verificationNote: '价格来自用户 2026-11-11 提供的微信截图，未在官网核验，可能过期。'
    },
    {
      id: 'dorm-port-repair',
      topic: 'dorm-port',
      title: '宿舍网口不能用怎么报修',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'user-provided',
      appliesWhen: ['宿舍网口没网', '网线插上不能用', '有线网络坏了', '网口松动'],
      notAppliesWhen: ['Wi-Fi 密码错误', '办理宽带套餐', '教室网络故障'],
      content: '宿舍有网口。网口插上网线仍不能用时，找所住楼栋的宿管登记报修；报修时说明楼栋、房间号、网口位置和现象。',
      steps: [
        { id: 'dp1', basis: 'user-provided', text: '先确认网线两端插紧，换一根网线或换一个网口再试。' },
        { id: 'dp2', basis: 'user-provided', text: '到所住楼栋值班室找宿管登记报修。' },
        { id: 'dp3', basis: 'user-provided', text: '说明楼栋、房间号、网口位置、是否亮灯和具体现象。' },
        { id: 'dp4', basis: 'official', text: '如果宿管无法处理，再联系所在片区信息技术中心。' }
      ],
      contactIds: ['dorm-admin', 'it-center', 'it-center-south'],
      sourceIds: ['user-voice-2026-11-11'],
      prohibited: ['不要承诺已经代为报修', '不要建议学生自行拆开网口面板'],
      verificationNote: '来自用户 2026-11-11 口述，未在官网核验；没有公开宿管电话。'
    },
    {
      id: 'library-campus-net',
      topic: 'library-net',
      title: '图书馆有没有校园网',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'user-provided',
      appliesWhen: ['图书馆有 Wi-Fi 吗', '图书馆能不能上网', '图书馆网络'],
      notAppliesWhen: ['图书馆借阅规则', '数据库使用'],
      content: '图书馆有校园网覆盖。用户口述未确认当前 Wi-Fi 名称和是否免密；2018 年通知里的 GKTSG 免密 Wi-Fi 不能当作现在的状态。',
      steps: [
        { id: 'ln1', basis: 'user-provided', text: '在图书馆连接校园网 Wi-Fi，按 GDUST 的认证方式登录。' },
        { id: 'ln2', basis: 'official', text: '如果认证页没有弹出，在浏览器打开 10.9.9.9 点「上网认证」。' },
        { id: 'ln3', basis: 'official', text: '仍连不上时，向图书馆现场工作人员确认当前网络名称。' }
      ],
      contactIds: ['it-center', 'it-center-south'],
      sourceIds: ['user-voice-2026-11-11'],
      prohibited: ['不要把 2018 年的 GKTSG 当作当前网络名称'],
      verificationNote: '用户 2026-11-11 口述图书馆有校园网；未确认 SSID 与免密状态。'
    },
    {
      id: 'outage-channel',
      topic: 'outage',
      title: '校园网实时故障公告渠道',
      campus: ['songshanhu'],
      audience: ['student', 'teacher'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'user-provided',
      appliesWhen: ['现在是不是全校断网', '校园网故障公告在哪看', '是不是只有我没网'],
      notAppliesWhen: ['个人 Wi-Fi 密码错误', '宿舍网口故障'],
      content: '学校目前没有固定的校园网实时故障公告渠道。本助手无法查询实时故障状态，也不会声称已检测到全校断网；请以现场情况和信息中心电话为准。',
      steps: [
        { id: 'oc1', basis: 'user-provided', text: '先问同宿舍或同楼层的同学是否也断网，判断是个别设备还是区域问题。' },
        { id: 'oc2', basis: 'official', text: '区域性问题联系所在片区信息技术中心，说明楼栋、时间和现象。' },
        { id: 'oc3', basis: 'official', text: '不要等待并不存在的统一故障公告。' }
      ],
      contactIds: ['it-center', 'it-center-south'],
      sourceIds: ['user-voice-2026-11-11'],
      prohibited: ['不要声称已检测到全校断网', '不要编造故障恢复时间'],
      verificationNote: '用户 2026-11-11 口述“没有固定公告渠道”；不代表学校不会发生故障。'
    },
    {
      id: 'vpn-client-install',
      topic: 'vpn-client',
      title: 'VPN 客户端安装与连接（学生）',
      campus: ['songshanhu'],
      audience: ['student'],
      publishedAt: '2025-03',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['VPN 客户端装不上', 'iNode 怎么装', 'VPN 下载地址', 'Windows/Mac/安卓/iOS VPN'],
      notAppliesWhen: ['忘记 VPN 密码', 'WebVPN 网页访问', '教师账号'],
      content: '在智慧校园门户「VPN 访问工具」下载对应客户端：Windows 用 windowVpn.exe，Mac 用 iNodeClient.pkg，安卓用 androidVpn.apk，iOS 在 App Store 搜 iNode connect。装好后 Windows/Mac 网关选「学生角色」并刷新，再输学号和密码。',
      steps: [
        { id: 'vi1', basis: 'official', text: '登录智慧校园门户，在常用工具中打开「VPN 访问工具」。' },
        { id: 'vi2', basis: 'official', text: 'Windows 下载 windowVpn.exe；Mac 下载 iNodeClient.pkg；安卓下载 androidVpn.apk。' },
        { id: 'vi3', basis: 'official', text: 'iOS 在 App Store 搜索 iNode connect；服务器地址填写 vpn.gdust.edu.cn:2222。' },
        { id: 'vi4', basis: 'official', text: 'Windows/Mac 安装后，网关选择「学生角色」并点刷新，输入学号和密码连接。' },
        { id: 'vi5', basis: 'official', text: '安卓客户端在齿轮设置里填写 27.37.67.1:5555，再输学号和密码登录。' },
        { id: 'vi6', basis: 'official', text: '连接成功后，在校内资源地址访问；例如教学平台用 172.16.254.1。' }
      ],
      contactIds: ['portal-help', 'it-center', 'it-center-south'],
      sourceIds: ['vpn-tools-portal', 'vpn-manual-2025'],
      prohibited: ['不要索要账号密码', '不要把客户端地址说成官网首页'],
      verificationNote: '2026-11-11 抓取门户 VPN 工具弹窗与 2025 年 3 月版学生手册；手册未提供错误码对照表。'
    },
    {
      id: 'portal-feedback',
      topic: 'feedback',
      title: '门户问题反馈与 VPN 账号反馈',
      campus: ['songshanhu'],
      audience: ['student', 'teacher'],
      publishedAt: 'unknown',
      lastCheckedAt: '2026-11-11',
      verifiedAt: '2026-11-11',
      status: 'active',
      confidence: 'official',
      appliesWhen: ['门户打不开', 'VPN 账号有问题要反馈', '智慧校园问题反馈', '想提意见'],
      notAppliesWhen: ['宿舍网口坏了', '校园网实时故障'],
      content: '智慧校园门户的问题反馈和 VPN 账号问题反馈都要在钉钉扫码提交，官方写 1 个工作日内处理，咨询电话 0769-86211914。业务办理里没有网络报修入口。',
      steps: [
        { id: 'pf1', basis: 'official', text: '打开智慧校园门户的「帮助与反馈」或「业务办理」。' },
        { id: 'pf2', basis: 'official', text: '选择「VPN账号问题反馈表」或「智慧校园门户问题反馈审批表」，用钉钉扫码填写。' },
        { id: 'pf3', basis: 'official', text: '提交后关注钉钉消息；官方写 1 个工作日内处理。' },
        { id: 'pf4', basis: 'official', text: '需要电话咨询时拨打 0769-86211914。' }
      ],
      contactIds: ['portal-help'],
      sourceIds: ['portal-help'],
      prohibited: ['不要声称已经代为提交', '不要把门户反馈电话当作网络故障报修电话'],
      verificationNote: '2026-11-11 登录智慧校园门户抓取帮助与反馈、业务办理页面。'
    }
  ];

  var PENDING = [
    {
      id: 'vpn-error-codes',
      topic: 'vpn-client',
      title: 'VPN 客户端错误码对照表',
      reason: '官网、2025 年学生手册与门户均未提供逐项错误码表；只能等校方补充或人工收集。',
      sourceIds: ['vpn-manual-2025']
    },
    {
      id: 'area-mapping',
      topic: 'contact',
      title: '楼栋与北门/南门片区对照',
      reason: '官网与门户电话表对 88027080 的归属不一致，且没有楼栋对照表；用户选择暂不确认。',
      sourceIds: ['it-contact', 'portal-phone-directory']
    }
  ];

  var TOPIC_RULES = [
    { topic: 'security', re: /(钓鱼|公共\s*wi-?fi|网银|网络劫持)/ },
    { topic: 'webvpn', re: /(webvpn|校外|在外|家里|回家).{0,16}(资源|教务|知网|图书馆|打不开|访问)/ },
    { topic: 'vpn-password', re: /(vpn|门户|统一身份认证|智慧校园).{0,10}密码|密码.{0,10}(vpn|门户|统一身份认证)/ },
    { topic: 'wifi-password', re: /(wi-?fi|无线|校园网|宿舍网).{0,10}密码|密码.{0,10}(wi-?fi|无线|校园网|宿舍网)/ },
    { topic: 'vpn-client', re: /(客户端|inode|装不上|安装包|vpn.{0,6}(软件|app|下载)|下载.{0,6}vpn)/ },
    { topic: 'dorm-port', re: /(网口|网线|有线|端口|插口)/ },
    { topic: 'dorm-broadband', re: /(宽带|套餐|资费|多少钱|收费|价格|流量卡|电话卡|校园卡|营业时间|几点开门|周末.{0,8}(办|营业|开)|A2.{0,8}(开|办))/ },
    { topic: 'library-net', re: /图书馆.{0,8}(网|wi-?fi|无线)|(wi-?fi|无线|上网).{0,8}图书馆/ },
    { topic: 'outage', re: /(全校.{0,6}(断网|没网|故障)|故障公告|故障通知|是不是.{0,6}没网|只有我)/ },
    { topic: 'feedback', re: /(反馈|投诉|建议|工单)/ },
    { topic: 'wifi-connect', re: /(怎么连|如何连接|连不上|认证|10\.9\.9\.9|gdust|息屏|断流)/ },
    { topic: 'contact', re: /(电话|联系电话|找谁|联系谁|人工|报修|工作人员)/ }
  ];

  function normalize(text) {
    return String(text == null ? '' : text).toLowerCase().replace(/\s+/g, ' ');
  }

  function scoreTopic(query) {
    var text = normalize(query);
    for (var i = 0; i < TOPIC_RULES.length; i++) {
      if (TOPIC_RULES[i].re.test(text)) return TOPIC_RULES[i].topic;
    }
    return null;
  }

  function isUsable(entry, context) {
    var ctx = context || {};
    if (!entry || entry.status !== 'active') return false;
    if (ctx.campus && entry.campus.indexOf(ctx.campus) < 0) return false;
    if (ctx.audience && entry.audience.indexOf(ctx.audience) < 0) return false;
    return true;
  }

  function isStale(entry, now) {
    if (!entry) return true;
    var base = entry.lastCheckedAt || entry.verifiedAt;
    if (!base || base === 'unknown') return true;
    var stamp = Date.parse(base + 'T00:00:00Z');
    if (isNaN(stamp)) return true;
    var current = now == null ? new Date().getTime() : now;
    return current - stamp > 365 * 24 * 60 * 60 * 1000;
  }

  function getEntry(id) {
    for (var i = 0; i < ENTRIES.length; i++) {
      if (ENTRIES[i].id === id) return ENTRIES[i];
    }
    return null;
  }

  function getContact(id) {
    return CONTACTS[id] || null;
  }

  function getSource(id) {
    return SOURCES[id] || null;
  }

  function findByTopic(topic, context) {
    var candidates = ENTRIES.filter(function (entry) {
      return entry.topic === topic;
    });
    var usable = candidates.filter(function (entry) {
      return isUsable(entry, context);
    });
    if (!usable.length) {
      return {
        hit: false,
        topic: topic,
        reason: candidates.length ? 'filtered_out' : 'no_entry'
      };
    }
    return { hit: true, topic: topic, entry: usable[0], reason: 'matched' };
  }

  function matchTopics(query) {
    var text = normalize(query);
    var out = [];
    for (var i = 0; i < TOPIC_RULES.length; i++) {
      if (TOPIC_RULES[i].re.test(text)) {
        out.push({ topic: TOPIC_RULES[i].topic, weight: 100 - i });
      }
    }
    return out;
  }

  function bigramMap(text) {
    var t = normalize(text).replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
    var map = {};
    for (var i = 0; i < t.length - 1; i++) {
      var gram = t.substr(i, 2);
      map[gram] = (map[gram] || 0) + 1;
    }
    return map;
  }

  function overlapScore(query, haystack) {
    var a = bigramMap(query);
    var b = bigramMap(haystack);
    var keys = Object.keys(a);
    if (!keys.length) return 0;
    var hit = 0;
    for (var i = 0; i < keys.length; i++) {
      if (b[keys[i]]) hit += 1;
    }
    return hit / keys.length;
  }

  function scoreEntry(entry, query, base) {
    var haystack = normalize([entry.title, entry.content]
      .concat(entry.appliesWhen || []).join(' '));
    return base + overlapScore(query, haystack) * 20;
  }

  function findAll(query, context) {
    var ctx = context || {};
    var topics = matchTopics(query);
    if (!topics.length) return { hit: false, hits: [], topic: null, reason: 'no_topic' };

    var seen = {};
    var scored = [];
    topics.forEach(function (item) {
      ENTRIES.forEach(function (entry) {
        if (entry.topic !== item.topic || seen[entry.id]) return;
        if (!isUsable(entry, ctx)) return;
        seen[entry.id] = true;
        scored.push({ entry: entry, topic: item.topic, score: scoreEntry(entry, query, item.weight) });
      });
    });

    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.slice(0, 5);
    if (top.length) {
      return {
        hit: true,
        hits: top.map(function (item) { return item.entry; }),
        scored: top,
        topic: top[0].topic,
        reason: 'matched'
      };
    }

    var hadEntries = topics.some(function (item) {
      return ENTRIES.some(function (entry) { return entry.topic === item.topic; });
    });
    return {
      hit: false,
      hits: [],
      topic: topics[0].topic,
      reason: hadEntries ? 'filtered_out' : 'no_entry'
    };
  }

  function find(query, context) {
    var result = findAll(query, context);
    return {
      hit: result.hit,
      topic: result.topic,
      entry: result.hits[0] || null,
      hits: result.hits,
      scored: result.scored || [],
      reason: result.reason
    };
  }

  return {
    META: META,
    SOURCES: SOURCES,
    CONTACTS: CONTACTS,
    ENTRIES: ENTRIES,
    PENDING: PENDING,
    TOPIC_RULES: TOPIC_RULES,
    find: find,
    findAll: findAll,
    matchTopics: matchTopics,
    findByTopic: findByTopic,
    scoreTopic: scoreTopic,
    isUsable: isUsable,
    isStale: isStale,
    getEntry: getEntry,
    getContact: getContact,
    getSource: getSource
  };
});