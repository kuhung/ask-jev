export interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
}

export interface RateLimitConfig {
  /**
   * 突发请求窗口时间（毫秒），默认 5000ms（5秒）
   */
  burstWindowMs: number;
  /**
   * 突发窗口允许的最大请求次数，默认 5 次
   */
  burstMax: number;
  /**
   * 持续请求窗口时间（毫秒），默认 60000ms（60秒）
   */
  sustainedWindowMs: number;
  /**
   * 持续窗口允许的最大请求次数，默认 20 次
   */
  sustainedMax: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // 秒级时间戳
  retryAfter: number; // 建议等待的秒数
  clientIp: string;
}

interface IpRecord {
  timestamps: number[];
  lastActive: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  burstWindowMs: 5 * 1000,
  burstMax: 5,
  sustainedWindowMs: 60 * 1000,
  sustainedMax: 20,
};

const MAX_TRACKED_IPS = 10000;
const ipStore = new Map<string, IpRecord>();
let lastPruneTime = Date.now();

/**
 * 清理过期的 IP 访问记录，防止内存持续增长
 */
function pruneExpiredRecords(now: number, maxRetentionMs: number) {
  for (const [ip, record] of ipStore.entries()) {
    if (now - record.lastActive > maxRetentionMs) {
      ipStore.delete(ip);
    }
  }

  // 若清理后仍超出上限，按最旧访问时间强制逐出
  if (ipStore.size > MAX_TRACKED_IPS) {
    const entries = Array.from(ipStore.entries()).sort(
      (a, b) => a[1].lastActive - b[1].lastActive
    );
    const dropCount = ipStore.size - MAX_TRACKED_IPS;
    for (let i = 0; i < dropCount; i++) {
      ipStore.delete(entries[i][0]);
    }
  }
}

/**
 * 提取客户端真实 IP 地址
 */
export function getClientIp(req: RequestLike): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  return '127.0.0.1';
}

/**
 * 双层滑动窗口访问频控校验
 */
export function checkRateLimit(
  req: RequestLike,
  customConfig?: Partial<RateLimitConfig>
): RateLimitResult {
  const config: RateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  const clientIp = getClientIp(req);
  const now = Date.now();

  // 每隔 60 秒或记录数超限时执行修剪
  if (now - lastPruneTime > config.sustainedWindowMs || ipStore.size > MAX_TRACKED_IPS) {
    pruneExpiredRecords(now, config.sustainedWindowMs);
    lastPruneTime = now;
  }

  let record = ipStore.get(clientIp);
  if (!record) {
    record = {
      timestamps: [],
      lastActive: now,
    };
    ipStore.set(clientIp, record);
  }

  // 移出超出持续窗口有效期的旧时间戳
  record.timestamps = record.timestamps.filter(
    (time) => now - time < config.sustainedWindowMs
  );
  record.lastActive = now;

  // 1. 突发窗口限制检查（5秒内最多5次）
  const burstStart = now - config.burstWindowMs;
  const burstTimestamps = record.timestamps.filter((time) => time >= burstStart);

  if (burstTimestamps.length >= config.burstMax) {
    const earliestBurst = burstTimestamps[0];
    const retryAfterMs = earliestBurst + config.burstWindowMs - now;
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
    const reset = Math.ceil((earliestBurst + config.burstWindowMs) / 1000);

    return {
      success: false,
      limit: config.burstMax,
      remaining: 0,
      reset,
      retryAfter,
      clientIp,
    };
  }

  // 2. 持续周期限制检查（60秒内最多20次）
  if (record.timestamps.length >= config.sustainedMax) {
    const earliestSustained = record.timestamps[0];
    const retryAfterMs = earliestSustained + config.sustainedWindowMs - now;
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
    const reset = Math.ceil((earliestSustained + config.sustainedWindowMs) / 1000);

    return {
      success: false,
      limit: config.sustainedMax,
      remaining: 0,
      reset,
      retryAfter,
      clientIp,
    };
  }

  // 通过频控校验，记录当前请求时间戳
  record.timestamps.push(now);

  const remaining = Math.max(0, config.sustainedMax - record.timestamps.length);
  const reset = Math.ceil((now + config.sustainedWindowMs) / 1000);

  return {
    success: true,
    limit: config.sustainedMax,
    remaining,
    reset,
    retryAfter: 0,
    clientIp,
  };
}

/**
 * 测试环境重置频控缓存
 */
export function resetRateLimitStore(): void {
  ipStore.clear();
  lastPruneTime = Date.now();
}
