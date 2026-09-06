/**
 * [apiError.ts]
 * 백엔드가 내려주는 에러 응답을 앱이 다룰 수 있는 하나의 타입(ApiError)으로 바꿉니다.
 *
 * 왜 필요한가요?
 * - 백엔드(GlobalExceptionHandler)는 모든 실패를 아래 형식으로 통일해 내려줍니다.
 *     { code: "VIDEO_NOT_FOUND", message: "영상을 찾을 수 없습니다.", path, timestamp, fieldErrors? }
 *   그런데 기존 프론트는 `throw new Error(\`... ${status}: ${await res.text()}\`)` 처럼
 *   본문을 통째로 문자열에 붙였고, 그 문자열이 그대로 화면에 노출됐습니다.
 *   사용자가 JSON 원문과 서버 경로·타임스탬프를 보게 되는 셈입니다.
 * - code를 살려두면 화면이 상황별로 다르게 반응할 수 있습니다.
 *   (재로그인이 필요한지, 다시 시도하면 되는지, 데이터가 없는 것인지)
 *
 * 사용 규칙: API 모듈은 실패 시 반드시 ApiError를 던지고,
 *          화면은 error.message(사용자에게 보여줄 문구)와 error.code(분기용)만 씁니다.
 */

/** 백엔드 ErrorResponse.fieldErrors 항목 (@Valid 검증 실패 시에만 내려옴) */
export interface ApiFieldError {
  field: string;
  message: string;
}

/** 서버 응답이 아니라 통신 자체가 실패했을 때 쓰는 코드들 (백엔드 ErrorCode에는 없음) */
export const NETWORK_ERROR = 'NETWORK_ERROR';
export const TIMEOUT_ERROR = 'TIMEOUT_ERROR';
/** 응답은 왔지만 우리 형식이 아니었을 때 (프록시 HTML 에러 페이지 등) */
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';

/** 사용자에게 보여줄 최후의 문구. 서버가 message를 안 줬을 때만 쓰입니다. */
const DEFAULT_MESSAGE = '문제가 발생했어요. 잠시 후 다시 시도해 주세요.';

/** 재로그인이 필요한 코드들 — 토큰 재발급으로도 회복되지 않는 상태 */
const RE_LOGIN_CODES = new Set([
  'LOGIN_REQUIRED',
  'INVALID_TOKEN',
  'EXPIRED_TOKEN',
  'INVALID_REFRESH_TOKEN',
  'INVALID_GOOGLE_TOKEN',
]);

/** 잠시 후 다시 시도하면 성공할 수 있는 코드들 — 일시적 장애 */
const RETRYABLE_CODES = new Set([
  NETWORK_ERROR,
  TIMEOUT_ERROR,
  'ANALYSIS_SERVER_UNAVAILABLE',
  'ANALYSIS_FAILED',
  'INVALID_ANALYSIS_RESPONSE',
  'INTERNAL_ERROR',
]);

/**
 * API 실패를 나타내는 예외.
 *
 * @param status HTTP 상태 코드. 통신 실패라 상태가 없으면 0.
 * @param code   백엔드 ErrorCode 이름 또는 위 통신 실패 코드.
 * @param message 사용자에게 그대로 보여줘도 되는 문구(백엔드가 이미 그렇게 작성함).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: ApiFieldError[];

  constructor(params: {
    status: number;
    code: string;
    message: string;
    fieldErrors?: ApiFieldError[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors;
    // 일부 JS 엔진에서 Error를 상속하면 프로토타입 체인이 끊겨 instanceof가 false가 됩니다.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 실패한 Response를 ApiError로 바꿉니다.
 *
 * 본문이 우리 ErrorResponse 형식이 아닐 수도 있습니다(리버스 프록시의 HTML 502 등).
 * 그때 본문을 message에 담으면 사용자에게 HTML이 노출되므로, 기본 문구로 대체하고
 * 원문은 버립니다. 상태 코드만으로도 화면이 필요한 분기는 할 수 있습니다.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = JSON.parse(await response.text());
  } catch {
    // 본문이 없거나 JSON이 아님 → 아래에서 기본값으로 처리
  }

  const parsed = body as {
    code?: unknown;
    message?: unknown;
    fieldErrors?: unknown;
  } | null;

  const code = typeof parsed?.code === 'string' ? parsed.code : UNKNOWN_ERROR;
  const message =
    typeof parsed?.message === 'string' && parsed.message.trim() ? parsed.message : DEFAULT_MESSAGE;
  const fieldErrors = Array.isArray(parsed?.fieldErrors)
    ? (parsed.fieldErrors as ApiFieldError[])
    : undefined;

  return new ApiError({ status: response.status, code, message, fieldErrors });
}

/**
 * fetch 자체가 실패했을 때(서버 미기동·와이파이 끊김·타임아웃) ApiError로 바꿉니다.
 * 이미 ApiError면 그대로 돌려주므로, try/catch에서 안전하게 감쌀 수 있습니다.
 */
export function toNetworkError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError({
      status: 0,
      code: TIMEOUT_ERROR,
      message: '서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요.',
    });
  }

  return new ApiError({
    status: 0,
    code: NETWORK_ERROR,
    message: '서버에 연결하지 못했어요. 네트워크 상태를 확인해 주세요.',
  });
}

/**
 * 화면에 표시할 문구를 꺼냅니다.
 * ApiError가 아닌 예외(코드 버그 등)의 message에는 내부 정보가 담길 수 있으므로 노출하지 않습니다.
 */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_MESSAGE): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** 다시 시도 버튼을 보여줄지 판단합니다. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true; // 원인을 모르면 재시도는 열어둔다
  if (RETRYABLE_CODES.has(error.code)) return true;
  return error.status >= 500;
}

/** 재로그인이 필요한 실패인지 판단합니다. */
export function requiresReLogin(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return RE_LOGIN_CODES.has(error.code) || error.status === 401;
}

/**
 * 서버까지 닿지도 못한 실패(끊긴 네트워크·타임아웃)인지 판단합니다.
 *
 * 인증 실패와 반드시 구분해야 합니다. 지하철에서 앱을 한 번 열었다는 이유로
 * 저장된 로그인 정보를 지워버리면 안 되기 때문입니다. 이 경우는 토큰을 그대로 두고
 * 다음 기회에 다시 시도합니다.
 */
export function isConnectionError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.code === NETWORK_ERROR || error.code === TIMEOUT_ERROR;
}
