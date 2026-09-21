/**
 * Ask JEV (问问Jev) 生产环境全量用例自动化测试脚本
 * 目标站点: https://askjev.kuhung.me
 * 采用 curl 作为稳定网络传输驱动
 */

import { execFileSync } from 'child_process';

const BASE_URL = 'https://askjev.kuhung.me';
const API_URL = `${BASE_URL}/api/jev`;

const results = [];

function curlRequest(url, options = {}) {
  const method = options.method || 'GET';
  const args = ['-s', '-w', '\n%{http_code}', '-X', method, url];

  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      args.push('-H', `${k}: ${v}`);
    }
  }

  if (options.body) {
    args.push('-d', options.body);
  }

  const stdout = execFileSync('curl', args, { encoding: 'utf-8', timeout: 15000 });
  const lines = stdout.trim().split('\n');
  const status = parseInt(lines[lines.length - 1], 10);
  const text = lines.slice(0, lines.length - 1).join('\n');

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return { status, text, json };
}

async function recordTest(suite, name, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const duration = Math.round(performance.now() - start);
    results.push({
      suite,
      name,
      status: res.status || 'PASSED',
      latencyMs: duration,
      details: res.details,
    });
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    results.push({
      suite,
      name,
      status: 'FAILED',
      latencyMs: duration,
      error: err?.message || String(err),
    });
  }
}

async function runAllTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 开始对生产环境执行自动化全套件回归测试: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Suite 1: 基础网络与 HTTP 规范
  await recordTest('Suite 1: 基础网络与 HTTP 规范', '主页 200 OK 连通性测试', async () => {
    const res = curlRequest(BASE_URL);
    if (res.status !== 200) throw new Error(`期望状态码 200，实际为 ${res.status}`);
    if (!res.text.includes('问问Jev') && !res.text.includes('Ask Jev')) {
      return { status: 'WARNING', details: '返回 200 但 HTML 未包含标题特征词' };
    }
    return { details: `HTTP 200, HTML 长度 ${res.text.length} 字节` };
  });

  await recordTest('Suite 1: 基础网络与 HTTP 规范', 'HSTS 与安全响应头校验', async () => {
    const stdout = execFileSync('curl', ['-s', '-I', BASE_URL], { encoding: 'utf-8' });
    const hasHsts = stdout.toLowerCase().includes('strict-transport-security');
    if (!hasHsts) return { status: 'WARNING', details: '缺少 HSTS 标头' };
    return { details: 'HSTS 已正确配置' };
  });

  await recordTest('Suite 1: 基础网络与 HTTP 规范', '404 页面路由处理测试', async () => {
    const res = curlRequest(`${BASE_URL}/non-existent-page-test-404`);
    if (res.status !== 404) {
      return { status: 'FAILED', details: `期望返回 404，实际返回 ${res.status}` };
    }
    return { details: '正确返回 HTTP 404 Not Found' };
  });

  await recordTest('Suite 1: 基础网络与 HTTP 规范', 'API 路由不允许 GET 请求', async () => {
    const res = curlRequest(API_URL, { method: 'GET' });
    if (res.status !== 405) {
      return { status: 'WARNING', details: `响应状态码为 ${res.status}` };
    }
    return { details: '正确返回 HTTP 405 Method Not Allowed' };
  });

  // Suite 2: 业务功能契约与文案适配
  await recordTest('Suite 2: 业务功能契约', 'Yes/No 模式 (消费类 肯定裁决)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '6000块的苹果新机现在买不买？',
        mode: 'yes_no',
        context: '手头的iPhone 13电池健康81%，还能凑合用。',
      }),
    });
    if (res.json?.code !== 0) throw new Error(`响应异常: ${JSON.stringify(res.json)}`);
    const { verdict, verdictTag, reasoning, signId } = res.json.data;
    if (!verdict || !reasoning) throw new Error('返回字段缺失');
    return { details: `裁决: [${verdict}] | 标签: [${verdictTag}] | 备忘: No. #${signId}` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Yes/No 模式 (社交/去不去 场景与文案适配)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '周五下班部门聚餐去不去？',
        mode: 'yes_no',
      }),
    });
    const { verdict, reasoning } = res.json?.data || {};
    const hasMismatch = reasoning?.includes('买完就贬值') || verdict?.includes('别买');
    if (hasMismatch) {
      return { status: 'FAILED', details: `出现语义错位: ${verdict} - ${reasoning}` };
    }
    return { details: `裁决: [${verdict}], 解释: [${reasoning?.slice(0, 35)}...]` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Yes/No 模式 (情感类场景语义适配)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '要不要和前任复合？',
        mode: 'yes_no',
      }),
    });
    const { verdict, reasoning } = res.json?.data || {};
    if (verdict?.includes('买') || reasoning?.includes('留在兜里')) {
      return { status: 'FAILED', details: `出现消费类错位词: ${verdict}` };
    }
    return { details: `裁决: [${verdict}], 解释: [${reasoning?.slice(0, 35)}...]` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Choice 模式 (二选一及标点符号解析)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？',
        mode: 'choice',
      }),
    });
    const verdict = res.json?.data?.verdict;
    if (verdict?.includes('？！') || verdict?.includes('?！')) {
      return { status: 'FAILED', details: `存在标点畸变: ${verdict}` };
    }
    return { details: `胜出选项: ${verdict}` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Choice 模式 (无选项开放式输入启发式降级)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '中午吃什么？',
        mode: 'choice',
      }),
    });
    const verdict = res.json?.data?.verdict;
    if (verdict?.includes('选项A') || verdict?.includes('选项B')) {
      return { status: 'FAILED', details: `出现生硬的选项A占位符: ${verdict}` };
    }
    return { details: `智能降级候选: ${verdict}` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Score 模式 (冲动指数 1-10 分契约)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '冲动想辞职去大理租个院子摆摊卖手冲咖啡靠谱度打分',
        mode: 'score',
      }),
    });
    const score = res.json?.data?.score;
    if (typeof score !== 'number' || score < 1 || score > 10) {
      throw new Error(`score 异常: ${score}`);
    }
    return { details: `评分: ${score}/10, 标签: ${res.json.data.verdictTag}` };
  });

  // Suite 3: 异常边界与鲁棒性
  await recordTest('Suite 3: 边界与鲁棒性', '空问题拦截 (返回 HTTP 400)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '', mode: 'yes_no' }),
    });
    if (res.status !== 400) throw new Error(`期望 400，实际为 ${res.status}`);
    return { details: `正确返回 HTTP 400: ${res.json?.message}` };
  });

  await recordTest('Suite 3: 边界与鲁棒性', '纯空格换行拦截 (返回 HTTP 400)', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '   \n\t  ', mode: 'yes_no' }),
    });
    if (res.status !== 400) throw new Error(`期望 400，实际为 ${res.status}`);
    return { details: `正确拦截纯空格输入` };
  });

  await recordTest('Suite 3: 边界与鲁棒性', 'XSS 注入与特殊字符测试', async () => {
    const res = curlRequest(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '<script>alert(1)</script>', mode: 'yes_no' }),
    });
    if (res.status !== 200) throw new Error(`服务异常: ${res.status}`);
    return { details: `服务稳健返回裁决: ${res.json?.data?.verdict}` };
  });

  // Suite 4: 性能与延迟
  await recordTest('Suite 4: 性能与延迟基准', '并发 3 次真实决策延迟测算', async () => {
    const start = performance.now();
    const q1 = curlRequest(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: '晚上去不去夜跑？', mode: 'yes_no' }) });
    const q2 = curlRequest(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: '买不买耳机？', mode: 'yes_no' }) });
    const q3 = curlRequest(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: '周末看电影还是打球？', mode: 'choice' }) });
    const duration = Math.round(performance.now() - start);
    const avg = Math.round(duration / 3);
    return { details: `3 次调用总耗时 ${duration}ms，平均每个 ${avg}ms` };
  });

  // Suite 5: 前端元数据
  await recordTest('Suite 5: 前端页面元数据', 'Viewport 防缩放与安全区域配置', async () => {
    const res = curlRequest(BASE_URL);
    const hasViewport = res.text.includes('viewport');
    const hasScaleNo = res.text.includes('user-scalable=no') || res.text.includes('maximum-scale=1');
    const hasFitCover = res.text.includes('viewport-fit=cover');
    return { details: `viewport: ${hasViewport}, scale-lock: ${hasScaleNo}, fit-cover: ${hasFitCover}` };
  });

  console.log(`\n================== 测试执行结果汇总 ==================`);
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const r of results) {
    const tag = r.status === 'PASSED' ? '✅ PASS' : r.status === 'WARNING' ? '⚠️ WARN' : '❌ FAIL';
    console.log(`${tag} | [${r.suite}] ${r.name} (${r.latencyMs}ms)`);
    if (r.details) console.log(`   ↳ ${r.details}`);
    if (r.error) console.log(`   ↳ 错误: ${r.error}`);
    if (r.status === 'PASSED') passCount++;
    if (r.status === 'WARNING') warnCount++;
    if (r.status === 'FAILED') failCount++;
  }

  console.log(`\n总计: ${results.length} 项测试 | 成功: ${passCount} | 告警: ${warnCount} | 失败: ${failCount}\n`);
}

runAllTests().catch(console.error);
