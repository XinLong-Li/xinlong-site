import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * 单作者站点的鉴权。密码以 scrypt 派生密钥的形式存放在服务器 .env 里，
 * 明文密码不落任何持久化介质，也不进仓库（.env 在 .gitignore 第 3 行，
 * 且 git reset --hard 只重置已跟踪文件，所以它能扛过部署）。
 *
 * 为什么用 scryptSync 而不是 bcrypt/argon2：避免在腾讯云服务器上编译
 * 原生模块 —— 那条部署链路已经有一条已知的 `git fetch` 网络脆弱性
 * （GnuTLS recv error），不该再引入一个需要拉取预编译包的依赖。
 */

export const SESSION_COOKIE = "xl_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 会话版本。无状态 cookie 一旦签发就收不回来，这是唯一的吊销手段：
 * 改密码时把它递增（并重新部署），所有旧 cookie 立即失效。
 * 这是刻意的设计取舍，不是漏了实现。
 */
const SESSION_VERSION = "1";

/**
 * Buffer → 干净的 Uint8Array。
 *
 * 不是风格偏好，是类型系统的硬要求：tsconfig 的 lib 同时包含 dom 与 Node
 * types，而两套 lib 各自声明了一份 Uint8Array —— DOM 那份的 entries() 返回
 * IterableIterator，ES 那份返回带 map/filter/take/drop 的 ArrayIterator
 * （TypeScript 5.6 引入的迭代器辅助方法）。Buffer 继承的是 DOM 那份，而
 * node:crypto 的签名期望另一份，于是 Buffer 不满足 BinaryLike。
 *
 * skipLibCheck 盖不住这个：那是声明之间的赋值兼容性，不是 lib 内部错误。
 * 转成新分配的 Uint8Array 即可消解交叉。密钥长度最多 64 字节，拷贝成本可忽略。
 */
function bytes(b: Buffer): Uint8Array {
  return new Uint8Array(b);
}

function requireSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    // 显式抛错并让错误消息自己说出原因。若退化成用空串签名，问题会
    // 伪装成"登录成功了但会话无效"，比直接失败难查得多。
    throw new Error("[auth] SESSION_SECRET 未配置，无法签发或校验会话");
  }
  return s;
}

/* ------------------------------------------------------------------ 密码 */

export function verifyPassword(input: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) {
    // 与"密码不匹配"打不同的日志。缺 env 时登录永远失败，若不打这条
    // 区分性日志，表现就是"密码怎么输都不对"，会让人反复试密码而不是
    // 去查服务器环境变量。
    console.error("[auth] ADMIN_PASSWORD_HASH 未配置，登录不可能成功");
    return false;
  }

  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) {
    console.error("[auth] ADMIN_PASSWORD_HASH 格式不合法，应为 <salt-hex>:<key-hex>");
    return false;
  }

  const expected = bytes(Buffer.from(keyHex, "hex"));
  const actual = bytes(
    scryptSync(input, bytes(Buffer.from(saltHex, "hex")), expected.length),
  );

  // 用 timingSafeEqual 而非 ===：字符串比较在第一个不同字节处提前返回，
  // 攻击者可以据此逐字节爆破。它要求两侧长度相同，所以先比长度——
  // 这个分支本身不泄露信息，因为派生密钥长度是固定的。
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/* ------------------------------------------------------------------ 会话 */

function sign(payload: string): string {
  return createHmac("sha256", requireSecret()).update(payload).digest("hex");
}

/**
 * 无状态 HMAC 会话，不引 session store。
 *
 * 必须无状态的原因：PM2 的 max_memory_restart: '512M' 会在任意时刻回收
 * 进程（见 ecosystem.config.js），任何进程内 session 表都会随机丢失，
 * 表现为"用着用着突然被登出"。
 *
 * 签名覆盖 expiresAt，因此过期时间不可被篡改——payload 本身不是机密
 * （单作者站点，它不携带身份信息），需要的只是完整性。
 */
export function issueSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}.${SESSION_VERSION}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expStr, version, mac] = parts;
  if (version !== SESSION_VERSION) return false;

  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = bytes(Buffer.from(sign(`${expStr}.${version}`), "hex"));
  const actual = bytes(Buffer.from(mac, "hex"));
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    // 必须按环境分支。写死 true 会让本地 http 下 cookie 根本不被保存，
    // 登录永远失败，看起来像逻辑 bug 而不是配置问题。
    //
    // 注意 localhost 有例外：浏览器把它当安全上下文，即使 http 也接受
    // Secure cookie，所以 `npm start` 在 localhost 上是能登录的。但
    // **局域网 IP 不是安全上下文**——用 `npm start` 后从手机访问
    // http://192.168.x.x:3000 时，Secure cookie 会被直接丢弃，表现为
    // "登录了但一刷新又回到登录页"。那种调试场景设 INSECURE_COOKIES=1。
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.INSECURE_COOKIES !== "1",
    // 不用 "strict"：strict 下从外部链接首次导航不带 cookie，会显示为
    // 未登录。lax 已足够阻止跨站 POST。
    sameSite: "lax" as const,
    path: "/",
    // 必须与签名里的 expiresAt 一致。只靠 maxAge 而签名无 exp 的话，
    // 攻击者可以本地改 cookie 的过期时间。
    maxAge: SESSION_TTL_MS / 1000,
  };
}

/* ------------------------------------------------------------ 登录限速 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * 进程内存实现，与 PM2 的 instances:1 / exec_mode:'fork' 绑定
 * （见 ecosystem.config.js）。**若将来改成 cluster 模式，这里会退化成
 * 每实例独立计数，必须换成共享存储。**
 *
 * 锁身份而非 IP：本站只有一个身份，锁 IP 会被换 IP 绕过，而锁身份对
 * 单作者站点的误伤面为零。代价是单个 IP 的分布式爆破拦不住——但
 * scrypt 本身刻意很慢，已经提供了天然的速率上限。
 *
 * 不再加 sleep 延迟：那会占住事件循环，且会连带拖慢成功登录。
 */
let attempts = 0;
let lockedUntil = 0;

export function isLockedOut(): boolean {
  if (Date.now() < lockedUntil) return true;

  // 锁定窗口已过才清零。若在每次失败时都清窗口，攻击者永远打不满阈值。
  if (lockedUntil !== 0) {
    attempts = 0;
    lockedUntil = 0;
  }
  return false;
}

export function recordLoginFailure(): void {
  attempts += 1;
  if (attempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MS;
  }
}

export function resetLoginAttempts(): void {
  attempts = 0;
  lockedUntil = 0;
}

export function remainingLockoutMinutes(): number {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 60000));
}

/** 供 Phase 0 的密钥生成脚本复用，保证与 verifyPassword 的格式一致 */
export function derivePasswordHash(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, bytes(salt), 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}
