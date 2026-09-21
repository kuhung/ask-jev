/**
 * Ask JEV (问问Jev) 生产环境全量用例自动化测试脚本
 * 目标站点: https://ask-jev-mu.vercel.app
 */

const BASE_URL = 'https://ask-jev-mu.vercel.app';
const API_URL = `${BASE_URL}/api/jev`;

const results = [];

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
  console.log(`🚀 开始对生产环境执行自动化用例测试: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------
  // Suite 1: 基础服务与 HTTP 头规范测试
  // -------------------------------------------------------------
  await recordTest('Suite 1: 基础网络与 HTTP 规范', '主页 200 OK 连通性测试', async () => {
    const res = await fetch(BASE_URL, { method: 'GET' });
    if (res.status !== 200) throw new Error(`期望状态码 200，实际为 ${res.status}`);
    const text = await res.text();
    if (!text.includes('问问Jev') && !text.includes('Ask Jev')) {
      return { status: 'WARNING', details: '返回 200 但 HTML 未包含标题特征词' };
    }
    return { details: `HTTP 200, HTML 长度 ${text.length} 字节` };
  });

  await recordTest('Suite 1: 基础网络与 HTTP 规范', 'HSTS 与安全响应头校验', async () => {
    const res = await fetch(BASE_URL, { method: 'HEAD' });
    const hsts = res.headers.get('strict-transport-security');
    const server = res.headers.get('server');
    const details = `HSTS: ${hsts || '未配置'}, Server: ${server || '未知'}`;
    if (!hsts) {
      return { status: 'WARNING', details: `缺少 HSTS 标头; ${details}` };
    }
    return { details };
  });

  await recordTest('Suite 1: 基础网络与 HTTP 规范', '404 页面路由处理测试', async () => {
    const res = await fetch(`${BASE_URL}/non-existent-page-test-404`, { method: 'GET' });
    if (res.status !== 404) {
      return { status: 'FAILED', details: `期望返回 404，实际返回 ${res.status}` };
    }
    return { details: `正确返回 HTTP 404 Not Found` };
  });

  await recordTest('Suite 1: 基础网络与 HTTP 规范', 'API 路由不允许 GET 请求', async () => {
    const res = await fetch(API_URL, { method: 'GET' });
    if (res.status !== 405) {
      return { status: 'WARNING', details: `未定义的 GET 响应状态码为 ${res.status} (通常推荐 405)` };
    }
    return { details: `正确返回 HTTP 405 Method Not Allowed` };
  });

  // -------------------------------------------------------------
  // Suite 2: 决策 API 业务功能与数据契约测试
  // -------------------------------------------------------------
  await recordTest('Suite 2: 业务功能契约', 'Yes/No 模式 (买/不买 常见场景)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '6000块的苹果新机现在买不买？',
        mode: 'yes_no',
        context: '手头的iPhone 13电池健康81%，还能凑合用。',
      }),
    });
    const json = await res.json();
    if (json.code !== 0 || !json.data) throw new Error(`响应 code 异常: ${JSON.stringify(json)}`);
    const { verdict, verdictTag, badgeClass, reasoning, signId } = json.data;
    if (!verdict || !verdictTag || !reasoning || !signId) {
      throw new Error(`缺少核心返回字段: ${JSON.stringify(json.data)}`);
    }
    return { details: `裁决: [${verdict}] | 标签: [${verdictTag}] | 签号: #${signId}` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Yes/No 模式 (社交/去不去 场景与文案适配)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '周五下班部门聚餐去不去？',
        mode: 'yes_no',
      }),
    });
    const json = await res.json();
    const verdict = json.data?.verdict;
    const reasoning = json.data?.reasoning;
    const hasSemanticMismatch = reasoning?.includes('买完就贬值') || reasoning?.includes('坚决别买');
    if (hasSemanticMismatch) {
      return {
        status: 'WARNING',
        details: `非消费类社交场景给出了消费类措辞: "${verdict}"，原因: "${reasoning?.slice(0, 45)}..."`,
      };
    }
    return { details: `裁决: [${verdict}], 解释: [${reasoning?.slice(0, 30)}...]` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Choice 模式 (二选一及标点符号解析)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '中午吃骨汤麻辣烫还是轻食鸡胸肉沙拉？',
        mode: 'choice',
      }),
    });
    const json = await res.json();
    if (json.code !== 0 || !json.data) throw new Error(`响应 code 异常: ${JSON.stringify(json)}`);
    const verdict = json.data?.verdict;
    const hasDoublePunctuation = verdict?.includes('？！') || verdict?.includes('?！');
    if (hasDoublePunctuation) {
      return {
        status: 'WARNING',
        details: `末尾问号未清洗导致怪异标点: "${verdict}"`,
      };
    }
    return { details: `胜出选项: ${verdict}` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Choice 模式 (三选一或斜杠分隔符)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '下午喝美式 / 拿铁 / 纯净水',
        mode: 'choice',
      }),
    });
    const json = await res.json();
    if (json.code !== 0 || !json.data) throw new Error(`响应异常: ${JSON.stringify(json)}`);
    return { details: `多项选择解析正常: ${json.data.verdict}` };
  });

  await recordTest('Suite 2: 业务功能契约', 'Score 模式 (冲动指数评估 1-10 分契约)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '冲动想辞职去大理租个院子摆摊卖手冲咖啡靠谱度打分',
        mode: 'score',
      }),
    });
    const json = await res.json();
    if (json.code !== 0 || !json.data) throw new Error(`响应异常: ${JSON.stringify(json)}`);
    const score = json.data?.score;
    if (typeof score !== 'number' || score < 1 || score > 10) {
      throw new Error(`score 字段不在 1-10 范围内: ${score}`);
    }
    return { details: `评分: ${score}/10, 标签: ${json.data.verdictTag}` };
  });

  // -------------------------------------------------------------
  // Suite 3: 异常输入与边界压力测试
  // -------------------------------------------------------------
  await recordTest('Suite 3: 边界与鲁棒性', '空问题请求 (应当返回 400)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '', mode: 'yes_no' }),
    });
    if (res.status !== 400) {
      return { status: 'FAILED', details: `空问题未返回 400，状态码: ${res.status}` };
    }
    const json = await res.json();
    return { details: `正确返回 HTTP 400: ${json.message}` };
  });

  await recordTest('Suite 3: 边界与鲁棒性', '纯空格字符串请求 (应当返回 400)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '     \n\t   ', mode: 'yes_no' }),
    });
    if (res.status !== 400) {
      return { status: 'FAILED', details: `纯空格未返回 400，状态码: ${res.status}` };
    }
    return { details: `正确拦截纯空格输入并返回 HTTP 400` };
  });

  await recordTest('Suite 3: 边界与鲁棒性', '超长文本测试 (2000字压力输入)', async () => {
    const longText = '买不买新手机？'.repeat(300);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: longText, mode: 'yes_no' }),
    });
    if (!res.ok) {
      return { status: 'WARNING', details: `超长输入返回 HTTP ${res.status}` };
    }
    const json = await res.json();
    return { details: `超长输入正常处理，裁决: ${json.data?.verdict}` };
  });

  await recordTest('Suite 3: 边界与鲁棒性', 'XSS 注入与特殊字符测试', async () => {
    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>&quot;\'';
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: xssPayload, mode: 'yes_no' }),
    });
    if (!res.ok) throw new Error(`处理特殊字符异常: ${res.status}`);
    const json = await res.json();
    return { details: `服务未崩溃，正常返回裁决: ${json.data?.verdict}` };
  });

  await recordTest('Suite 3: 边界与鲁棒性', '未知 mode 参数容错 (传入未知字符串)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '今天要不要喝奶茶？', mode: 'unknown_magic_mode' }),
    });
    if (!res.ok) {
      return { status: 'WARNING', details: `未知 mode 导致非 200 响应: ${res.status}` };
    }
    const json = await res.json();
    return { details: `未崩溃，自动兜底处理: ${json.data?.verdict || '无'}` };
  });

  // -------------------------------------------------------------
  // Suite 4: 协议与数据解析容错
  // -------------------------------------------------------------
  await recordTest('Suite 4: 协议与解析容错', '非法 JSON 请求体 (畸形语法)', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"question": "坏掉的JSON...',
    });
    if (res.status === 200) {
      return { status: 'FAILED', details: `畸形 JSON 居然返回了 200` };
    }
    return { details: `正确返回错误响应: HTTP ${res.status}` };
  });

  // -------------------------------------------------------------
  // Suite 5: 响应耗时与并发性能测试
  // -------------------------------------------------------------
  await recordTest('Suite 5: 性能与延迟基准', '并发 5 个真实决断请求耗时测算', async () => {
    const questions = [
      '晚上要不要去夜跑？',
      '买不买机械键盘？',
      '中午吃麦当劳还是肯德基？',
      '周末去爬山还是去图书馆？',
      '换个新发型靠谱度打分',
    ];
    const tStart = performance.now();
    const responses = await Promise.all(
      questions.map((q, idx) =>
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, mode: idx < 2 ? 'yes_no' : idx < 4 ? 'choice' : 'score' }),
        }).then((r) => r.json())
      )
    );
    const totalTime = Math.round(performance.now() - tStart);
    const allSuccess = responses.every((r) => r.code === 0 && r.data);
    if (!allSuccess) throw new Error('部分并发请求失败');
    const avg = Math.round(totalTime / questions.length);
    return { details: `5 个并发请求总耗时 ${totalTime}ms，平均每个 ${avg}ms` };
  });

  // -------------------------------------------------------------
  // Suite 6: 移动端视口与前端元数据走查
  // -------------------------------------------------------------
  await recordTest('Suite 6: 前端页面元数据走查', 'Viewport 防缩放与安全区域配置', async () => {
    const res = await fetch(BASE_URL);
    const html = await res.text();
    const hasViewport = html.includes('viewport');
    const hasScaleNo = html.includes('user-scalable=no') || html.includes('maximum-scale=1');
    const hasFitCover = html.includes('viewport-fit=cover');
    const details = `viewport: ${hasViewport}, scale-lock: ${hasScaleNo}, fit-cover: ${hasFitCover}`;
    return { details };
  });

  // -------------------------------------------------------------
  // 输出统计摘要
  // -------------------------------------------------------------
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

  console.log(`\n总计: ${results.length} 项测试 | 成功: ${passCount} | 告警/优化点: ${warnCount} | 失败: ${failCount}\n`);
}

runAllTests().catch(console.error);
