type SupportedLocale = 'zh-CN' | 'en-US';

const MESSAGE_MAP: Record<string, Record<SupportedLocale, string>> = {
  'email or password is invalid': {
    'zh-CN': '邮箱或密码不正确',
    'en-US': 'email or password is invalid',
  },
  'refresh token is invalid': {
    'zh-CN': '刷新令牌无效',
    'en-US': 'refresh token is invalid',
  },
  'refresh token is expired': {
    'zh-CN': '刷新令牌已过期',
    'en-US': 'refresh token is expired',
  },
  'access token is invalid': {
    'zh-CN': '访问令牌无效',
    'en-US': 'access token is invalid',
  },
  'missing bearer token': {
    'zh-CN': '缺少 Bearer 令牌',
    'en-US': 'missing bearer token',
  },
  'invalid bearer token': {
    'zh-CN': 'Bearer 令牌无效',
    'en-US': 'invalid bearer token',
  },
  'permission denied': {
    'zh-CN': '权限不足',
    'en-US': 'permission denied',
  },
  'missing api key headers': {
    'zh-CN': '缺少 API Key 请求头',
    'en-US': 'missing api key headers',
  },
  'invalid api signature': {
    'zh-CN': 'API 签名无效',
    'en-US': 'invalid api signature',
  },
  'api key not found': {
    'zh-CN': 'API Key 不存在',
    'en-US': 'api key not found',
  },
  'api key disabled': {
    'zh-CN': 'API Key 已禁用',
    'en-US': 'api key disabled',
  },
  'invalid timestamp': {
    'zh-CN': '时间戳无效',
    'en-US': 'invalid timestamp',
  },
  'timestamp expired': {
    'zh-CN': '时间戳已过期',
    'en-US': 'timestamp expired',
  },
  'invalid signature': {
    'zh-CN': '签名无效',
    'en-US': 'invalid signature',
  },
  'invalid encrypted payload': {
    'zh-CN': '加密载荷无效',
    'en-US': 'invalid encrypted payload',
  },
  'Internal server error': {
    'zh-CN': '服务器内部错误',
    'en-US': 'Internal server error',
  },
};

interface HeaderCarrier {
  headers?: Record<string, string | string[] | undefined>;
}

export function resolveApiLocale(request: HeaderCarrier | undefined): SupportedLocale {
  const rawLanguage = request?.headers?.['accept-language'];
  const headerValue = Array.isArray(rawLanguage) ? rawLanguage[0] : rawLanguage;
  const normalized = (headerValue ?? '').toLowerCase();

  if (normalized.includes('zh')) {
    return 'zh-CN';
  }

  return 'en-US';
}

export function translateApiMessage(message: string, locale: SupportedLocale): string {
  const localized = MESSAGE_MAP[message]?.[locale];
  return localized ?? message;
}
