import { execFileSync } from 'child_process';
import fs from 'fs';

const BASE_URL = 'https://askjev.kuhung.me';
const API_URL = `${BASE_URL}/api/jev`;

function requestApi(payload) {
  const jsonStr = JSON.stringify(payload);
  const start = performance.now();
  try {
    const stdout = execFileSync('curl', [
      '-s',
      '-w', '\n%{http_code}',
      '-X', 'POST',
      API_URL,
      '-H', 'Content-Type: application/json',
      '-d', jsonStr,
    ], { encoding: 'utf-8', timeout: 15000 });

    const latency = Math.round(performance.now() - start);
    const lines = stdout.trim().split('\n');
    const httpCode = parseInt(lines[lines.length - 1], 10);
    const bodyStr = lines.slice(0, lines.length - 1).join('\n');
    let data = null;
    try {
      data = JSON.parse(bodyStr);
    } catch {
      data = bodyStr;
    }
    return { httpCode, latency, data };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return { httpCode: 0, latency, error: err.message };
  }
}

const cases = [
  // 1. Yes/No 消费类
  {
    category: 'Yes/No 消费决策',
    name: '苹果手机换机',
    payload: { question: '6000块的苹果新机现在买不买？', mode: 'yes_no', context: '手头的iPhone 13电池健康81%，还能凑合用。' },
    expected: '概率倾向劝退或谨慎，返回结构合法',
  },
  {
    category: 'Yes/No 消费决策',
    name: '健身房年卡',
    payload: { question: '3000块的健身房年卡要不要办？', mode: 'yes_no', context: '离家800米，过去两年办的卡平均一年只去了三次。' },
    expected: '概率倾向劝退，返回结构合法',
  },
  // 2. Yes/No 社交与行为类 (文案语境检验)
  {
    category: 'Yes/No 社交/行为语义适配',
    name: '部门聚餐去不去',
    payload: { question: '周五下班部门聚餐去不去？', mode: 'yes_no' },
    expected: '社交场景，排查是否有消费类模板文案（坚决别买/把钱留在兜里）',
  },
  {
    category: 'Yes/No 社交/行为语义适配',
    name: '情感决策是否复合',
    payload: { question: '要不要和前任复合？', mode: 'yes_no' },
    expected: '情感语境，排查是否出现“买完就贬值”',
  },
  {
    category: 'Yes/No 社交/行为语义适配',
    name: '前同事婚礼随礼',
    payload: { question: '前同事下周结婚要不要随500块礼金？', mode: 'yes_no', context: '在上一家公司共事一年半，离职后大半年没说过话。' },
    expected: '人情社交评估，返回结构合法',
  },
  // 3. Choice 模式与标点解析
  {
    category: 'Choice 选项解析',
    name: '午餐二选一(带末尾问号)',
    payload: { question: '中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？', mode: 'choice' },
    expected: '选项应剥除末尾问号，不应出现“轻食鸡胸肉沙拉？！”',
  },
  {
    category: 'Choice 选项解析',
    name: '无选项自由提问(极端边界)',
    payload: { question: '中午吃什么？', mode: 'choice' },
    expected: '应有友好降级，不应机械返回“选项A”',
  },
  {
    category: 'Choice 选项解析',
    name: '斜杠多选一',
    payload: { question: '喝美式 / 拿铁 / 纯净水 / 燕麦奶', mode: 'choice' },
    expected: '成功解析 4 个候选项并择一',
  },
  // 4. Score 评分模式
  {
    category: 'Score 冲动评分',
    name: '摆摊冲动度打分',
    payload: { question: '冲动想辞职去大理租个院子摆摊卖手冲咖啡靠谱度打分', mode: 'score' },
    expected: '返回 1-10 分且包含冲动级别与置信度',
  },
  {
    category: 'Score 冲动评分',
    name: '理性小额消费打分',
    payload: { question: '买一本25块钱的经典原著图书靠谱度打分', mode: 'score' },
    expected: '冲动指数应偏低（相对理性）',
  },
  // 5. Context 上下文反转测试
  {
    category: 'Context 上下文敏感度',
    name: '二手车极端劣势背景',
    payload: { question: '这辆二手车买不买？', mode: 'yes_no', context: '重大事故水浸车，底盘全锈烂，修车费3万' },
    expected: '概率显著倾向 No（劝退）',
  },
  {
    category: 'Context 上下文敏感度',
    name: '二手车极端优势背景',
    payload: { question: '这辆二手车买不买？', mode: 'yes_no', context: '亲舅舅全新未开原封车免费过户送给我' },
    expected: '概率显著倾向 Yes（果断去办）',
  },
  // 6. 异常与注入防护
  {
    category: '鲁棒性与边界防护',
    name: '空文本',
    payload: { question: '', mode: 'yes_no' },
    expected: '返回 HTTP 400 状态码',
  },
  {
    category: '鲁棒性与边界防护',
    name: '纯空格与换行',
    payload: { question: '   \n  \t  ', mode: 'yes_no' },
    expected: '返回 HTTP 400 状态码',
  },
  {
    category: '鲁棒性与边界防护',
    name: 'XSS 注入',
    payload: { question: '<script>alert(document.cookie)</script>', mode: 'yes_no' },
    expected: '服务正常返回，无反射或代码注入风险',
  },
  {
    category: '鲁棒性与边界防护',
    name: 'SQL 注入式字符串',
    payload: { question: "1'; DROP TABLE users; --", mode: 'yes_no' },
    expected: '服务正常处理，无错误中断',
  },
];

console.log(`\n======================================================`);
console.log(`🚀 开始对生产环境执行深度测试: ${API_URL}`);
console.log(`======================================================\n`);

const results = [];

for (const c of cases) {
  const res = requestApi(c.payload);
  results.push({ ...c, result: res });
  const icon = res.httpCode === 200 || (c.expected.includes('400') && res.httpCode === 400) ? '✅' : '⚠️';
  console.log(`${icon} [HTTP ${res.httpCode}] (${res.latency}ms) ${c.category} - ${c.name}`);
  if (res.data?.data) {
    const d = res.data.data;
    console.log(`   ↳ 裁决: ${d.verdict} | 标签: ${d.verdictTag || ''} | 置信度/概率: ${d.confidence ?? d.probability ?? ''}`);
  } else if (res.data?.message) {
    console.log(`   ↳ 响应消息: ${res.data.message}`);
  }
}

fs.writeFileSync('scripts/deep-test-results.json', JSON.stringify(results, null, 2), 'utf-8');
console.log(`\n测试数据已写入 scripts/deep-test-results.json`);
