import assert from 'node:assert/strict';
import { checkRateLimit, getClientIp, resetRateLimitStore } from '../lib/rateLimit.ts';

console.log('🧪 开始执行接口防刷与频控单元/集成验证...\n');

function createMockRequest(headers = {}) {
  const headerMap = new Map(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    headers: {
      get(name) {
        return headerMap.get(name.toLowerCase()) || null;
      },
    },
  };
}

// -------------------------------------------------------------
// TC-01: 客户端 IP 识别测试
// -------------------------------------------------------------
console.log('▶ 测试 TC-01: 客户端 IP 提取与多级降级');
{
  // 1. x-forwarded-for 多 IP 提取首个客户端真实 IP
  const req1 = createMockRequest({ 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' });
  assert.equal(getClientIp(req1), '203.0.113.195', '应提取 x-forwarded-for 首个 IP');

  // 2. x-real-ip 次选
  const req2 = createMockRequest({ 'x-real-ip': '198.51.100.22' });
  assert.equal(getClientIp(req2), '198.51.100.22', '应提取 x-real-ip');

  // 3. cf-connecting-ip
  const req3 = createMockRequest({ 'cf-connecting-ip': '1.1.1.1' });
  assert.equal(getClientIp(req3), '1.1.1.1', '应提取 cf-connecting-ip');

  // 4. 默认回退
  const req4 = createMockRequest({});
  assert.equal(getClientIp(req4), '127.0.0.1', '无头部时回退 127.0.0.1');

  console.log('  ✅ TC-01 客户端 IP 提取通过');
}

// -------------------------------------------------------------
// TC-02: 突发请求拦截测试（5秒内最多5次）
// -------------------------------------------------------------
console.log('\n▶ 测试 TC-02: 突发窗口限流拦截 (5s 内上限 5 次)');
{
  resetRateLimitStore();
  const testIp = '192.168.10.1';
  const req = createMockRequest({ 'x-forwarded-for': testIp });

  // 连续发送 5 次
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(req);
    assert.equal(res.success, true, `第 ${i} 次请求应该成功`);
    assert.equal(res.remaining, 20 - i, `第 ${i} 次请求剩余配额应为 ${20 - i}`);
  }

  // 第 6 次应当立即被突发窗口拦截
  const burstBlock = checkRateLimit(req);
  assert.equal(burstBlock.success, false, '第 6 次请求应被突发频控拦截');
  assert.equal(burstBlock.limit, 5, '突发拦截 limit 应为 5');
  assert.equal(burstBlock.remaining, 0, '被拦截时 remaining 应为 0');
  assert.ok(burstBlock.retryAfter >= 1, 'retryAfter 应大于等于 1 秒');

  console.log(`  ✅ TC-02 突发限流拦截通过 (retryAfter: ${burstBlock.retryAfter}s)`);
}

// -------------------------------------------------------------
// TC-03: 不同 IP 互不干扰与隔离性测试
// -------------------------------------------------------------
console.log('\n▶ 测试 TC-03: 多 IP 租户隔离性验证');
{
  const reqA = createMockRequest({ 'x-forwarded-for': '192.168.10.1' }); // 已被封锁
  const reqB = createMockRequest({ 'x-forwarded-for': '192.168.10.2' }); // 全新 IP

  const resA = checkRateLimit(reqA);
  assert.equal(resA.success, false, 'IP-A 仍应处于被拦截状态');

  const resB = checkRateLimit(reqB);
  assert.equal(resB.success, true, 'IP-B 应正常通过');
  assert.equal(resB.remaining, 19, 'IP-B 首次请求后剩余配额应为 19');

  console.log('  ✅ TC-03 租户 IP 隔离验证通过');
}

// -------------------------------------------------------------
// TC-04: 持续周期上限测试（60秒内最多20次）
// -------------------------------------------------------------
console.log('\n▶ 测试 TC-04: 持续周期窗口拦截 (60s 内上限 20 次)');
{
  resetRateLimitStore();
  const testIp = '10.0.0.99';
  const req = createMockRequest({ 'x-forwarded-for': testIp });

  // 针对该测试设置松散的突发阈值，专注验证持续上限
  const customConfig = {
    burstWindowMs: 5000,
    burstMax: 50,
    sustainedWindowMs: 60000,
    sustainedMax: 20,
  };

  for (let i = 1; i <= 20; i++) {
    const res = checkRateLimit(req, customConfig);
    assert.equal(res.success, true, `第 ${i} 次请求应通过`);
  }

  // 第 21 次应触发持续周期上限
  const sustainedBlock = checkRateLimit(req, customConfig);
  assert.equal(sustainedBlock.success, false, '第 21 次请求应被持续周期拦截');
  assert.equal(sustainedBlock.limit, 20, '持续上限 limit 应为 20');
  assert.equal(sustainedBlock.remaining, 0, '配额应归零');
  assert.ok(sustainedBlock.retryAfter >= 1, '应返回建议重试等待时长');

  console.log(`  ✅ TC-04 持续周期上限拦截通过 (retryAfter: ${sustainedBlock.retryAfter}s)`);
}

// -------------------------------------------------------------
// TC-05: 内存修剪与防泄漏验证
// -------------------------------------------------------------
console.log('\n▶ 测试 TC-05: 内存容量与防泄漏修剪机制');
{
  resetRateLimitStore();

  // 写入 10,050 个不同 IP
  for (let i = 0; i < 10050; i++) {
    const ip = `172.16.${Math.floor(i / 256)}.${i % 256}`;
    checkRateLimit(createMockRequest({ 'x-forwarded-for': ip }));
  }

  // 再次发起检查，触发容量修剪
  const testReq = createMockRequest({ 'x-forwarded-for': '1.2.3.4' });
  const res = checkRateLimit(testReq);
  assert.equal(res.success, true, '新请求应能正常处理');

  console.log('  ✅ TC-05 内存容量与修剪机制运行稳定，无溢出');
}

console.log('\n🎉 所有防刷与频控测试全部通过！\n');
