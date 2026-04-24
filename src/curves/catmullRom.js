import { Vector3 } from "three";

/**
 * 標準的な一様 Catmull-Rom（立方）区間。
 * p1→p2 を結び、p0,p3 は接線決定にのみ使用。
 * q(t) = 0.5 * ( 2*p1 + (-p0+p2)*t + (2p0-5p1+4p2-p3)*t^2 + (-p0+3p1-3p2+p3)*t^3 )
 * @param {Vector3} p0
 * @param {Vector3} p1
 * @param {Vector3} p2
 * @param {Vector3} p3
 * @param {number} t ∈ [0,1]
 * @param {Vector3} [target]
 */
export function evaluateCatmullRomSegment(p0, p1, p2, p3, t, target = new Vector3()) {
  const t2 = t * t;
  const t3 = t2 * t;
  const v0 = -p0.x + p2.x;
  const v1 = -p0.y + p2.y;
  const v2 = -p0.z + p2.z;
  const w0 = 2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x;
  const w1 = 2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y;
  const w2 = 2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z;
  const u0 = -p0.x + 3 * p1.x - 3 * p2.x + p3.x;
  const u1 = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
  const u2 = -p0.z + 3 * p1.z - 3 * p2.z + p3.z;
  return target.set(
    0.5 * (2 * p1.x + v0 * t + w0 * t2 + u0 * t3),
    0.5 * (2 * p1.y + v1 * t + w1 * t2 + u1 * t3),
    0.5 * (2 * p1.z + v2 * t + w2 * t2 + u2 * t3)
  );
}

/**
 * 開いた点列に対し、端を重複させて接線を定義しつつ全区間を連結サンプル。
 * @param {Vector3[]} points 長さ ≥ 2 を推奨
 * @param {number} samplesPerSegment 各区間の分割数
 * @param {Vector3[]} [out]
 * @returns {Vector3[]}
 */
export function sampleCatmullRomOpenPolyline(points, samplesPerSegment, out = []) {
  out.length = 0;
  const n = points.length;
  if (n === 0) return out;
  if (n === 1) {
    out.push(points[0].clone());
    return out;
  }

  const k = Math.max(2, samplesPerSegment | 0);
  const tmp = new Vector3();

  for (let i = 0; i < n - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < n ? points[i + 2] : points[n - 1];

    const end = i === n - 2 ? k : k + 1;
    for (let s = 0; s < end; s++) {
      const t = s / k;
      out.push(evaluateCatmullRomSegment(p0, p1, p2, p3, t, tmp.clone()));
    }
  }

  return out;
}
