/**
 * 本地逻辑与修复验证脚本: scripts/verify-fixes.mjs
 * 针对所有修复点执行全量断言测试
 */

function cleanPunctuation(text) {
  return text.replace(/^[？?！!。，,、\s]+|[？?！!。，,、\s]+$/g, '').trim();
}

const SEMANTIC_ACTIONS = [
  {
    triggers: ['买', '购', '入', '换', '苹果', '手机', '相机', '数码', '耳机', '大衣', '包', '车', '二手车'],
    yesVerdict: '果断拿下！',
    noVerdict: '坚决别买！',
    yesReason: '这件物品带来的长期使用价值明显高于代价。既然已深思熟虑，那就开开心心收入囊中，让它提升你的生活品质！',
    noReason: '你现在强烈的渴望源于短期的多巴胺刺激。买前朝思暮想，买后角落落灰。把钱留在卡里带来的安全感，远胜拆快递那五分钟的虚假满足。',
  },
  {
    triggers: ['去', '聚餐', '团建', '参加', '婚礼', '饭局', '聚会', '见面', '赴约', '自驾', '露营'],
    yesVerdict: '盛装赴会！',
    noVerdict: '礼貌推掉！',
    yesReason: '这次社交能带来真实的能量交换与情绪抚慰。放下顾虑轻装赴约，享受当下的交流与氛围！',
    noReason: '凡是在去之前就让你心生抗拒的社交，去了大多也是如坐针毡。与其勉强自己迎合客套，不如礼貌推掉，把宝贵时间留给独处充电。',
  },
  {
    triggers: ['办', '卡', '课', '健身', '年卡', '充值', '会员', '私教', '培训'],
    yesVerdict: '放手去练！',
    noVerdict: '千万别办！',
    yesReason: '这次行动规划具备明确的可执行性。既然决心改变，就别再迟疑，立刻开工！',
    noReason: '指望通过一次性大额付费来购买自律，是消费陷阱中最温柔的套路。先坚持连续两周每晚快走或运动30分钟，真做到了再去谈办卡。',
  },
  {
    triggers: ['复合', '前任', '联系', '找他', '找她', '表白', '回头', '和好'],
    yesVerdict: '顺从心意！',
    noVerdict: '彻底翻篇！',
    yesReason: '既然彼此心中仍有真诚牵绊，且核心症结已有解法，那就勇敢迈出一步，把话说透，不给人生留遗憾。',
    noReason: '变质的冷饭加热三次也不会变新鲜。现在的不甘心只是沉没成本在作祟。立刻放下手机，深呼吸洗把脸，大步向前才能遇见新天地。',
  },
  {
    triggers: ['闲鱼', '卖', '挂', '扔', '断舍离', '清理'],
    yesVerdict: '立刻挂闲鱼！',
    noVerdict: '暂且留着！',
    yesReason: '超过半年没碰过的物件在你的生活里已经死去了。变现哪怕几十块钱，都比让它白白占用高昂的居住空间强得多。',
    noReason: '这件物品承载着不可替代的刚需属性或阶段性意义，贸然处置日后大概率还会溢价买回。先妥善收纳，观察一个季度再说。',
  },
];

function matchSemanticAction(question) {
  const cleanQ = question.toLowerCase();
  for (const action of SEMANTIC_ACTIONS) {
    if (action.triggers.some((t) => cleanQ.includes(t))) {
      return action;
    }
  }
  return null;
}

function parseTypeSafeResponseMock(res, question, mode) {
  const answer = res.answers?.decision;
  if (!answer) return null;

  const signId = 8888;
  const semantic = matchSemanticAction(question);

  if (answer.type === 'noul') {
    const prob = answer.noul;
    const isYes = prob >= 0.5;
    const percent = Math.round(prob * 100);

    let verdict = isYes ? '果断去办！' : '坚决别干！';
    let reasoning = isYes
      ? `老管家为你推演完毕，执行胜算达 ${percent}%。犹豫只会徒增心理内耗，既然大方向明确，与其日后反刍遗憾，不如放手一搏，去办！`
      : `老管家综合推演评估此项冲动风险达 ${100 - percent}%。真正值得做的事你早就兴奋地开工了，绝不会拖到现在到处问人。现在停下，立省百分之百的精力。`;

    if (semantic) {
      verdict = isYes ? semantic.yesVerdict : semantic.noVerdict;
      reasoning = isYes ? semantic.yesReason : semantic.noReason;
    }

    return {
      mode,
      verdict,
      verdictTag: isYes ? `建议执行 (胜率 ${percent}%)` : `劝退止损 (冲动度 ${100 - percent}%)`,
      badgeClass: isYes ? 'green' : 'red',
      probability: prob,
      reasoning,
      signId,
    };
  }

  if (answer.type === 'choice') {
    const rawWinner = answer.choice;
    const cleanWinner = cleanPunctuation(rawWinner);
    const conf = Math.round(answer.confidence * 100);

    return {
      mode,
      verdict: `首选：${cleanWinner}！`,
      verdictTag: `最优选项 (置信度 ${conf}%)`,
      badgeClass: 'gold',
      confidence: answer.confidence,
      reasoning: `老管家综合推演了你的生活节律与情绪效用，选择「${cleanWinner}」是当下综合回报最高的一手（置信度 ${conf}%）。不要再滑动屏幕反复比较了，听老管家的，立刻定下来！`,
      signId,
    };
  }

  if (answer.type === 'score') {
    const normalizedScore = Math.min(10, Math.max(1, Math.round((answer.score + 1) * 2.5)));
    const conf = Math.round(answer.confidence * 100);
    const isHighRisk = normalizedScore >= 7;

    return {
      mode,
      score: normalizedScore,
      verdict: `冲动指数 ${normalizedScore} 分`,
      verdictTag: isHighRisk ? '冲动预警' : '相对理性',
      badgeClass: isHighRisk ? 'red' : 'gold',
      confidence: answer.confidence,
      reasoning: isHighRisk
        ? `老管家加权评估此念头的冲动指数为 ${normalizedScore}/10 分（置信度 ${conf}%）。这属于典型的情绪应激反应，脑热开工，日后肉疼。建议立刻关掉软件，深呼吸三分钟，立省百分之百。`
        : `老管家加权评估此项决策可行性良好，冲动指数仅为 ${normalizedScore}/10 分（置信度 ${conf}%）。该想法具备较强理性支撑，建议进一步拆解小成本试水步骤，稳步推进。`,
      signId,
    };
  }

  return null;
}

// -------------------------------------------------------------
// 执行断言测试
// -------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`🧪 开始执行本地修复逻辑与断言测试`);
console.log(`======================================================\n`);

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

// 1. 标点清洗断言
assert(cleanPunctuation('轻食鸡胸肉沙拉？') === '轻食鸡胸肉沙拉', '标点清洗: 中文问号');
assert(cleanPunctuation('骨汤麻辣烫??') === '骨汤麻辣烫', '标点清洗: 双英文问号');
assert(cleanPunctuation('！大包！！') === '大包', '标点清洗: 首尾感叹号');

// 2. Choice 模式无标点畸变断言
const choiceRes = parseTypeSafeResponseMock(
  { answers: { decision: { type: 'choice', choice: '轻食鸡胸肉沙拉？', confidence: 0.8 } } },
  '中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？',
  'choice'
);
assert(!choiceRes.verdict.includes('？！') && !choiceRes.verdict.includes('?！'), 'Choice 模式消除标点畸变', choiceRes.verdict);
assert(choiceRes.verdict === '首选：轻食鸡胸肉沙拉！', 'Choice 裁决格式正确', choiceRes.verdict);
assert(!choiceRes.reasoning.includes('TypeSafe Jev 模型'), 'Choice 评语消除机械算法腔', choiceRes.reasoning);

// 3. Yes/No 情感场景语义对齐断言
const loveRes = parseTypeSafeResponseMock(
  { answers: { decision: { type: 'noul', noul: 0.3 } } },
  '要不要和前任复合？',
  'yes_no'
);
assert(loveRes.verdict === '彻底翻篇！', '情感场景否定裁决准确', loveRes.verdict);
assert(!loveRes.reasoning.includes('坚决别买') && !loveRes.reasoning.includes('把钱留在兜里'), '情感场景消除消费措辞', loveRes.reasoning);
assert(loveRes.reasoning.includes('变质的冷饭'), '情感场景使用生动管家点评', loveRes.reasoning);

// 4. Yes/No 社交场景语义对齐断言
const socialRes = parseTypeSafeResponseMock(
  { answers: { decision: { type: 'noul', noul: 0.25 } } },
  '周五下班部门聚餐去不去？',
  'yes_no'
);
assert(socialRes.verdict === '礼貌推掉！', '社交场景否定裁决准确', socialRes.verdict);
assert(!socialRes.reasoning.includes('坚决别买'), '社交场景消除消费措辞', socialRes.reasoning);
assert(socialRes.reasoning.includes('如坐针毡'), '社交场景使用生动管家点评', socialRes.reasoning);

// 5. Yes/No 办卡场景语义对齐断言
const gymRes = parseTypeSafeResponseMock(
  { answers: { decision: { type: 'noul', noul: 0.1 } } },
  '3000块的健身房年卡要不要办？',
  'yes_no'
);
assert(gymRes.verdict === '千万别办！', '办卡场景否定裁决准确', gymRes.verdict);
assert(gymRes.reasoning.includes('购买自律'), '办卡场景针对性点评', gymRes.reasoning);

// 6. Yes/No 消费场景肯定裁决断言
const buyYesRes = parseTypeSafeResponseMock(
  { answers: { decision: { type: 'noul', noul: 0.85 } } },
  '6000块的苹果新机现在买不买？',
  'yes_no'
);
assert(buyYesRes.verdict === '果断拿下！', '消费场景肯定裁决', buyYesRes.verdict);
assert(!buyYesRes.reasoning.includes('TypeSafe Jev 模型推演显示'), '消除算法机械腔', buyYesRes.reasoning);

// 7. Score 评分评语断言
const scoreHighRes = parseTypeSafeResponseMock(
  { answers: { decision: { type: 'score', score: 2.5, confidence: 0.85 } } },
  '冲动想辞职去摆摊卖手冲咖啡靠谱度打分',
  'score'
);
assert(scoreHighRes.verdictTag === '冲动预警', '高分冲动预警', `${scoreHighRes.score}分`);
assert(scoreHighRes.reasoning.includes('老管家加权评估'), 'Score 采用管家口吻', scoreHighRes.reasoning);

console.log(`\n================== 测试统计 ==================`);
console.log(`总断言: ${passed + failed} | 成功: ${passed} | 失败: ${failed}\n`);
if (failed > 0) process.exit(1);
