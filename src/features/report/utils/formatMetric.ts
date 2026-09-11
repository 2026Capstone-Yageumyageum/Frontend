/**
 * [formatMetric.ts]
 * 구간 상세 지표의 값 표기.
 *
 * 절대값과 판정값의 자릿수가 다르다. 절대 각도는 1도 아래가 노이즈라 정수로 줄이지만,
 * 차이는 임계값과 비교되는 값이라 자릿수를 줄이면 안 된다. 차이를 정수로 줄이면
 * 15.4°가 15°로 보이는데 허용도 15°라 같아 보이면서 뱃지는 '주의'인 구간이 생긴다.
 * 게이지 마커는 띠 밖에 있는데 문구는 같다고 말하는, 앞뒤가 맞지 않는 화면이 된다.
 */

export const DEGREE = 'degree';

/** 알 수 없는 단위가 오면 좌표 표기로 폴백한다. 화면이 죽지 않는 것이 우선이다. */
export function formatValue(value: number, unit: string | null): string {
  return unit === DEGREE ? `${Math.round(value)}°` : value.toFixed(2);
}

export function formatJudgment(value: number, unit: string | null): string {
  return unit === DEGREE ? `${value.toFixed(1)}°` : value.toFixed(2);
}

/**
 * 게이지가 방향까지 보여주므로 문구도 방향을 갖는다. 절댓값만 쓰면 마커가 왼쪽에
 * 있는데 문구는 방향이 없어 서로 다른 말을 하게 된다.
 *
 * "차이 없음" 판정은 표시에 쓰는 자릿수와 같은 자릿수로 한다. 다르면 "기준보다
 * 0.0° 큼" 같은 문구가 나온다.
 */
export function describeDifference(difference: number, unit: string | null): string {
  const magnitude = Math.abs(difference);
  const rounded = Number(unit === DEGREE ? magnitude.toFixed(1) : magnitude.toFixed(2));
  if (rounded === 0) {
    return '기준과 거의 같음';
  }
  return `기준보다 ${formatJudgment(magnitude, unit)} ${difference > 0 ? '큼' : '작음'}`;
}
