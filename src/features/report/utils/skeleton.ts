/**
 * [skeleton.ts]
 * 백엔드/파이썬이 내려주는 skeleton CSV를 파싱해 프레임별 관절 좌표로 변환합니다.
 *
 * CSV 컬럼(파이썬 pose.py 기준):
 *   frame_index, time_sec,
 *   {joint}_x, {joint}_y, {joint}_confidence,           // 원본(정규화 0~1)
 *   {joint}_imputed_flag,
 *   {joint}_x_smooth, {joint}_y_smooth,                 // 스무딩(표시용 권장)
 *   pitcher_com_*, ...
 *
 * 좌표는 원본 영상 기준 0~1 정규화 값이며, 프레임 밖 관절은 0 미만/1 초과일 수 있습니다.
 */

/** 표시 대상 15개 관절 (파이썬 JOINTS와 동일 순서) */
export const SKELETON_JOINTS = [
  'nose',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_foot_index',
  'right_foot_index',
] as const;

/** 관절 연결(뼈대) 정의 — 선으로 이어 그립니다. */
export const SKELETON_EDGES: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['left_ankle', 'left_foot_index'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['right_ankle', 'right_foot_index'],
];

export interface JointPoint {
  x: number; // 0~1 정규화
  y: number; // 0~1 정규화
  confidence: number;
}

export interface SkeletonFrame {
  frameIndex: number;
  timeSec: number;
  points: Record<string, JointPoint>;
}

function num(value: string | undefined): number {
  if (value == null) return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * skeleton CSV 텍스트 → 프레임 배열.
 * 좌표는 {joint}_x_smooth/_y_smooth를 우선 쓰고, 없으면 원본 {joint}_x/_y로 폴백합니다.
 */
export function parseSkeletonCsv(csv: string | null | undefined): SkeletonFrame[] {
  if (!csv || !csv.trim()) return [];

  // 줄 구분자가 \n, \r\n, \r 어느 것이든 처리
  const lines = csv.trim().split(/\r\n|\r|\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',');
  const idx: Record<string, number> = {};
  header.forEach((name, i) => {
    idx[name.trim()] = i;
  });

  const frames: SkeletonFrame[] = [];
  for (let r = 1; r < lines.length; r += 1) {
    const cols = lines[r].split(',');
    if (cols.length < 2) continue;

    const points: Record<string, JointPoint> = {};
    for (const joint of SKELETON_JOINTS) {
      let x = num(cols[idx[`${joint}_x_smooth`]]);
      let y = num(cols[idx[`${joint}_y_smooth`]]);
      // 스무딩 좌표가 없거나 NaN이면 원본 좌표로 폴백
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        x = num(cols[idx[`${joint}_x`]]);
        y = num(cols[idx[`${joint}_y`]]);
      }
      const confidence = num(cols[idx[`${joint}_confidence`]]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points[joint] = { x, y, confidence: Number.isFinite(confidence) ? confidence : 0 };
      }
    }

    frames.push({
      frameIndex: num(cols[idx.frame_index]) || r - 1,
      timeSec: num(cols[idx.time_sec]) || 0,
      points,
    });
  }
  return frames;
}

/**
 * 주어진 원본 프레임 인덱스에 해당하는 재생 시간(초)을 구합니다.
 * 스켈레톤은 균등 샘플링돼 있으므로 인접 샘플 사이를 선형 보간합니다.
 * (phase 구간 startFrame/endFrame → 타임라인 위치 매핑용)
 */
export function timeAtFrameIndex(frames: SkeletonFrame[], frameIndex: number): number | null {
  if (frames.length === 0) return null;
  if (frameIndex <= frames[0].frameIndex) return frames[0].timeSec;
  const last = frames[frames.length - 1];
  if (frameIndex >= last.frameIndex) return last.timeSec;
  let lo = 0;
  let hi = frames.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].frameIndex <= frameIndex) lo = mid;
    else hi = mid;
  }
  const a = frames[lo];
  const b = frames[hi];
  const span = b.frameIndex - a.frameIndex;
  if (span <= 0) return a.timeSec;
  const t = (frameIndex - a.frameIndex) / span;
  return a.timeSec + t * (b.timeSec - a.timeSec);
}

/** 주어진 원본 프레임 인덱스에 가장 가까운 스켈레톤 프레임을 반환합니다(프로 리샘플링용). */
export function frameNearestFrameIndex(
  frames: SkeletonFrame[],
  frameIndex: number,
): SkeletonFrame | null {
  if (frames.length === 0) return null;
  if (frameIndex <= frames[0].frameIndex) return frames[0];
  const last = frames[frames.length - 1];
  if (frameIndex >= last.frameIndex) return last;
  let lo = 0;
  let hi = frames.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].frameIndex <= frameIndex) lo = mid;
    else hi = mid;
  }
  return Math.abs(frames[lo].frameIndex - frameIndex) <= Math.abs(frames[hi].frameIndex - frameIndex)
    ? frames[lo]
    : frames[hi];
}

/** 재생 위치(초)에 가장 가까운 프레임 인덱스를 찾습니다(시간 기준). */
export function frameIndexAtTime(frames: SkeletonFrame[], timeSec: number): number {
  if (frames.length === 0) return -1;
  let lo = 0;
  let hi = frames.length - 1;
  // timeSec 오름차순 가정, 이진 탐색으로 가장 가까운 프레임
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].timeSec < timeSec) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(frames[lo - 1].timeSec - timeSec) <= Math.abs(frames[lo].timeSec - timeSec)) {
    return lo - 1;
  }
  return lo;
}
