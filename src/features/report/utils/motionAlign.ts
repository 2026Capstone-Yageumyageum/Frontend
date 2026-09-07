/**
 * [motionAlign.ts]
 * 사용자 프레임 → 비교 대상 프레임 대응.
 *
 * 점수는 구간 내부를 같은 진행률로 리샘플링해 비교하는데, 화면은 비교 대상을 실제
 * 타이밍으로 흘렸다. 그래서 사용자가 보는 것과 점수가 말하는 것이 다른 기준 위에 있었다.
 * 여기서 점수와 같은 규칙(구간별 선형 대응)을 만든다.
 *
 * 지표의 측정 지점도 같은 규칙으로 뽑히므로, 이 대응을 쓰면 "이 순간 보기"에서 양쪽이
 * 자동으로 실제 측정 순간에 놓인다.
 */

export interface PhaseSpan {
  userStartFrame: number;
  userEndFrame: number;
  proStartFrame: number;
  proEndFrame: number;
}

/**
 * 대응하는 비교 프레임. 대응을 만들 수 없으면 null을 돌려 호출부가 기존 실시간 정렬로
 * 되돌아가게 한다.
 */
export function alignToCompareFrame(userFrame: number, spans: PhaseSpan[]): number | null {
  if (!Number.isFinite(userFrame) || spans.length === 0) {
    return null;
  }

  const first = spans[0];
  if (userFrame <= first.userStartFrame) {
    return first.proStartFrame;
  }
  const last = spans[spans.length - 1];
  if (userFrame >= last.userEndFrame) {
    return last.proEndFrame;
  }

  for (const span of spans) {
    if (userFrame < span.userStartFrame || userFrame > span.userEndFrame) {
      continue;
    }
    const userLength = span.userEndFrame - span.userStartFrame;
    if (userLength <= 0) {
      // 사용자 구간 길이가 0이면 진행률을 정의할 수 없다. 구간 시작으로 보낸다.
      return span.proStartFrame;
    }
    const progress = (userFrame - span.userStartFrame) / userLength;
    // 비교 구간 길이가 0이어도 정상이다 — 그 구간 전체가 한 프레임에 대응된다.
    // 실측에서 가속 구간이 0프레임인 프로가 있었다.
    return span.proStartFrame + (progress * (span.proEndFrame - span.proStartFrame));
  }

  return null;
}
