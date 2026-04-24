import { Vector3 } from "three";

/**
 * De Casteljau: 次数 n のベジェ曲線上の点（t ∈ [0,1]）。
 * @param {Vector3[]} controlPoints 長さ n+1
 * @param {number} t
 * @param {Vector3} [target]
 * @returns {Vector3}
 */
export function evaluateBezierDeCasteljau(controlPoints, t, target = new Vector3()) {
  const n = controlPoints.length;
  if (n === 0) return target.set(0, 0, 0);
  if (n === 1) return target.copy(controlPoints[0]);

  const work = controlPoints.map((p) => p.clone());
  for (let r = 1; r < n; r++) {
    for (let i = 0; i < n - r; i++) {
      work[i].lerpVectors(work[i], work[i + 1], t);
    }
  }
  return target.copy(work[0]);
}

/**
 * ベジェ曲線を等間隔 t でサンプリングした頂点列（折れ線用）。
 * @param {Vector3[]} controlPoints
 * @param {number} segments 区間数（頂点数は segments + 1）
 * @param {Vector3[]} [out]
 * @returns {Vector3[]}
 */
export function sampleBezierPolyline(controlPoints, segments, out = []) {
  out.length = 0;
  const m = Math.max(1, segments | 0);
  const tmp = new Vector3();
  for (let i = 0; i <= m; i++) {
    const t = i / m;
    out.push(evaluateBezierDeCasteljau(controlPoints, t, tmp.clone()));
  }
  return out;
}
