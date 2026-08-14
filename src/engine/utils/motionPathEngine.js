/**
 * PRISTINE UNIFIED PATH ENGINE FOR KANTO MOTION WITH SEQUENTIAL TRACK CHUNKS
 * Single Source of Truth: evaluatePath(pathNodes, progress0to1)
 * Enforces pixel-perfect linear arc-length distance tracking and stop station hold coordinates.
 */

// 1. EASING PRESETS & CUBIC BEZIER EVALUATOR
export const EASING_PRESETS = {
  linear: { id: 'linear', label: 'Linear (Constant)', points: [0, 0, 1, 1] },
  easeIn: { id: 'easeIn', label: 'Ease In (Slow Start)', points: [0.42, 0, 1, 1] },
  easeOut: { id: 'easeOut', label: 'Ease Out (Slow End)', points: [0, 0, 0.58, 1] },
  easeInOut: { id: 'easeInOut', label: 'Ease In-Out (Smooth)', points: [0.42, 0, 0.58, 1] }
};

function sampleCubicBezierComponent(t, p1, p2) {
  return 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * Math.pow(t, 2) * p2 + Math.pow(t, 3);
}

function sampleCubicBezierDerivative(t, p1, p2) {
  return 3 * Math.pow(1 - t, 2) * p1 + 6 * (1 - t) * t * (p2 - p1) + 3 * Math.pow(t, 2) * (1 - p2);
}

export function solveCubicBezierY(x, p1x, p1y, p2x, p2y) {
  try {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    if (p1x === p1y && p2x === p2y) return x;

    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleCubicBezierComponent(t, p1x, p2x) - x;
      if (Math.abs(currentX) < 1e-5) break;
      const derivativeX = sampleCubicBezierDerivative(t, p1x, p2x);
      if (Math.abs(derivativeX) < 1e-5) break;
      t -= currentX / derivativeX;
    }
    t = Math.max(0, Math.min(1, t));
    const y = sampleCubicBezierComponent(t, p1y, p2y);
    return Math.max(0, Math.min(1, Number.isFinite(y) && !isNaN(y) ? y : x));
  } catch (err) {
    return Math.max(0, Math.min(1, x));
  }
}

/**
 * CUBIC BEZIER CURVE SOLVER
 */
export function evaluateBezier(t, p1x = 0.42, p1y = 0.0, p2x = 0.58, p2y = 1.0) {
  try {
    const safeT = Math.max(0, Math.min(1, typeof t === 'number' && Number.isFinite(t) ? t : 0));
    const solvedY = solveCubicBezierY(safeT, p1x, p1y, p2x, p2y);
    return Math.max(0, Math.min(1, Number.isFinite(solvedY) ? solvedY : safeT));
  } catch (err) {
    return Math.max(0, Math.min(1, t));
  }
}

// 2. CATMULL-ROM SPLINE SAMPLER
function sampleSplinePoint(nodes, globalT) {
  if (!nodes || nodes.length === 0) return { x: 0, y: 0 };
  if (nodes.length === 1) return { x: nodes[0].x || 0, y: nodes[0].y || 0 };

  const segCount = nodes.length - 1;
  const clampedT = Math.max(0, Math.min(segCount, globalT));
  const segIndex = Math.min(segCount - 1, Math.floor(clampedT));
  const localT = clampedT - segIndex;

  const p0 = nodes[Math.max(0, segIndex - 1)];
  const p1 = nodes[segIndex];
  const p2 = nodes[Math.min(nodes.length - 1, segIndex + 1)];
  const p3 = nodes[Math.min(nodes.length - 1, segIndex + 2)];

  const p0x = p0?.x || 0, p0y = p0?.y || 0;
  const p1x = p1?.x || 0, p1y = p1?.y || 0;
  const p2x = p2?.x || 0, p2y = p2?.y || 0;
  const p3x = p3?.x || 0, p3y = p3?.y || 0;

  const t2 = localT * localT;
  const t3 = t2 * localT;

  const x = 0.5 * (
    (2 * p1x) +
    (-p0x + p2x) * localT +
    (2 * p0x - 5 * p1x + 4 * p2x - p3x) * t2 +
    (-p0x + 3 * p1x - 3 * p2x + p3x) * t3
  );

  const y = 0.5 * (
    (2 * p1y) +
    (-p0y + p2y) * localT +
    (2 * p0y - 5 * p1y + 4 * p2y - p3y) * t2 +
    (-p0y + 3 * p1y - 3 * p2y + p3y) * t3
  );

  return { x, y };
}

// 3. UNIFORM ARC-LENGTH DISTANCE LOOKUP TABLE
function buildArcLengthTable(nodes, samplesPerSegment = 50) {
  if (!nodes || nodes.length < 2) {
    return { table: [{ t: 0, distance: 0 }], totalLength: 0 };
  }

  const segCount = nodes.length - 1;
  const totalSamples = segCount * samplesPerSegment;
  const table = [{ t: 0, distance: 0 }];

  let cumulativeDistance = 0;
  let prevPt = sampleSplinePoint(nodes, 0);

  for (let s = 1; s <= totalSamples; s++) {
    const globalT = (s / totalSamples) * segCount;
    const currPt = sampleSplinePoint(nodes, globalT);

    const dx = currPt.x - prevPt.x;
    const dy = currPt.y - prevPt.y;
    const stepDist = Math.sqrt(dx * dx + dy * dy);

    cumulativeDistance += stepDist;
    table.push({ t: globalT, distance: cumulativeDistance });
    prevPt = currPt;
  }

  return { table, totalLength: cumulativeDistance };
}

function getParamAtDistanceFraction(arcData, distancePercent) {
  const { table, totalLength } = arcData;
  if (!table || table.length === 0 || totalLength <= 0) return 0;

  const targetDist = Math.max(0, Math.min(1, distancePercent)) * totalLength;
  let low = 0, high = table.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (table[mid].distance < targetDist) low = mid + 1;
    else high = mid - 1;
  }

  const index = Math.max(0, Math.min(table.length - 2, high));
  const entryA = table[index];
  const entryB = table[index + 1];

  const distRange = entryB.distance - entryA.distance;
  if (distRange <= 0) return entryA.t;

  const lerpFactor = (targetDist - entryA.distance) / distRange;
  return entryA.t + lerpFactor * (entryB.t - entryA.t);
}

/**
 * THE SINGLE UNIFIED PATH FUNCTION (SINGLE SOURCE OF TRUTH)
 * 
 * @param {Array<{x: number, y: number}>} pathNodes - Control nodes array
 * @param {number} progress0to1 - Normalized progress strictly from 0.0 to 1.0
 * @returns {{x: number, y: number}} Exact pixel coordinates on path
 */
export function evaluatePath(pathNodes, progress0to1 = 0) {
  try {
    const nodes = Array.isArray(pathNodes) ? pathNodes : [];
    if (nodes.length === 0) return { x: 0, y: 0 };
    if (nodes.length === 1) {
      return {
        x: typeof nodes[0]?.x === 'number' && Number.isFinite(nodes[0].x) ? nodes[0].x : 0,
        y: typeof nodes[0]?.y === 'number' && Number.isFinite(nodes[0].y) ? nodes[0].y : 0
      };
    }

    const u = Math.max(0, Math.min(1, typeof progress0to1 === 'number' && Number.isFinite(progress0to1) ? progress0to1 : 0));

    // STRICT ENDPOINT ANCHOR LOCK
    if (u <= 0) {
      return {
        x: typeof nodes[0].x === 'number' && Number.isFinite(nodes[0].x) ? nodes[0].x : 0,
        y: typeof nodes[0].y === 'number' && Number.isFinite(nodes[0].y) ? nodes[0].y : 0
      };
    }
    if (u >= 1) {
      const lastNode = nodes[nodes.length - 1];
      return {
        x: typeof lastNode.x === 'number' && Number.isFinite(lastNode.x) ? lastNode.x : 0,
        y: typeof lastNode.y === 'number' && Number.isFinite(lastNode.y) ? lastNode.y : 0
      };
    }

    // UNIFORM PIXEL-PERFECT ARC-LENGTH PARAMETERIZATION
    const arcData = buildArcLengthTable(nodes, 50);
    const globalT = getParamAtDistanceFraction(arcData, u);
    const pt = sampleSplinePoint(nodes, globalT);

    if (isNaN(pt.x) || isNaN(pt.y) || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) {
      return { x: nodes[0].x || 0, y: nodes[0].y || 0 };
    }

    return pt;
  } catch (err) {
    console.error("evaluatePath error:", err);
    return { x: 0, y: 0 };
  }
}

// Backward compatibility wrappers
export function calculatePathPosition(pathNodes, currentTime = 0, duration = 5.0) {
  const safeDuration = Math.max(0.0001, duration || 5.0);
  const u = Math.max(0, Math.min(1, (currentTime || 0) / safeDuration));
  return evaluatePath(pathNodes, u);
}

/**
 * CANONICAL TIME-SEGMENTATION PARSER FOR MOTION PATHS
 * Breaks down motion path into strictly non-overlapping sequential chunks:
 * [Segment 1 Move] -> [Stop Node 1 Pause (Yellow Zone)] -> [Segment 2 Move] -> [Stop Node 2 Pause...]
 */
export function buildMotionPathChunks(motionPath, clipDurationSec = 5.0) {
  try {
    const nodes = Array.isArray(motionPath?.pathNodes) ? motionPath.pathNodes : [];
    if (nodes.length <= 1) return { chunks: [], totalEffectiveDuration: Math.max(0.0001, clipDurationSec || 5.0) };

    const numSegments = nodes.length - 1;
    const segmentDurations = Array.isArray(motionPath?.segmentDurations) ? motionPath.segmentDurations : [];
    
    // Total pause time across all active stop stations
    const totalStopSeconds = nodes.reduce((sum, n) => sum + (n.isStopNode ? (n.freezeDurationSec !== undefined ? n.freezeDurationSec : 1.0) : 0), 0);

    // Default duration per segment if segmentDurations is incomplete
    const hasPerSegDurs = segmentDurations.length === numSegments;
    const baseMoveDuration = hasPerSegDurs
      ? segmentDurations.reduce((a, b) => a + b, 0)
      : Math.max(0.0001, (clipDurationSec || 5.0) - totalStopSeconds);
    const defaultSegDuration = baseMoveDuration / numSegments;

    const chunks = [];
    let currentTime = 0;

    for (let i = 0; i < numSegments; i++) {
      // 1. Movement Chunk i (Node i -> Node i+1)
      const segDur = (segmentDurations[i] !== undefined && segmentDurations[i] > 0)
        ? segmentDurations[i]
        : defaultSegDuration;

      chunks.push({
        type: 'move',
        segmentIndex: i,
        fromNodeIndex: i,
        toNodeIndex: i + 1,
        startTimeSec: currentTime,
        endTimeSec: currentTime + segDur,
        durationSec: segDur
      });
      currentTime += segDur;

      // 2. Stop Station Pause Chunk at Node i+1 (Destination Node of Segment i)
      const destNode = nodes[i + 1];
      if (destNode && destNode.isStopNode) {
        const freezeDur = destNode.freezeDurationSec !== undefined ? destNode.freezeDurationSec : 1.0;
        chunks.push({
          type: 'pause',
          nodeIndex: i + 1,
          startTimeSec: currentTime,
          endTimeSec: currentTime + freezeDur,
          durationSec: freezeDur
        });
        currentTime += freezeDur;
      }
    }

    return { chunks, totalEffectiveDuration: currentTime };
  } catch (err) {
    console.error("buildMotionPathChunks error:", err);
    return { chunks: [], totalEffectiveDuration: Math.max(0.0001, clipDurationSec || 5.0) };
  }
}

/**
 * MASTER MOTION PATH EVALUATOR USING CANONICAL SEQUENTIAL TRACK CHUNKS
 */
export function evaluateMotionPathAtTime(motionPath, clipStartTimeSec = 0, clipDurationSec = 5.0, currentTimeSec = 0) {
  try {
    if (!motionPath || !motionPath.isPathEnabled) return null;
    const nodes = Array.isArray(motionPath.pathNodes) ? motionPath.pathNodes : [];
    if (nodes.length === 0) return null;
    if (nodes.length === 1) return { x: nodes[0].x || 0, y: nodes[0].y || 0 };

    const { chunks, totalEffectiveDuration } = buildMotionPathChunks(motionPath, clipDurationSec);
    const tLocal = Math.max(0, currentTimeSec - clipStartTimeSec);
    const numSegments = nodes.length - 1;

    if (tLocal <= 0) return evaluatePath(nodes, 0.0);
    if (tLocal >= totalEffectiveDuration) return evaluatePath(nodes, 1.0);

    for (const chunk of chunks) {
      if (tLocal >= chunk.startTimeSec && tLocal <= chunk.endTimeSec) {
        if (chunk.type === 'pause') {
          // Playhead is INSIDE yellow stop zone! Freeze dead-center at nodeIndex!
          const distancePercent = chunk.nodeIndex / numSegments;
          return evaluatePath(nodes, distancePercent);
        } else if (chunk.type === 'move') {
          // Playhead is INSIDE movement chunk!
          const segProgress = Math.max(0, Math.min(1, (tLocal - chunk.startTimeSec) / Math.max(0.0001, chunk.durationSec)));

          const segEasings = Array.isArray(motionPath.segmentEasings) ? motionPath.segmentEasings : [];
          const segConfig = segEasings[chunk.segmentIndex] || {
            easingPreset: motionPath.easingPreset || 'linear',
            customBezier: motionPath.customBezier || [1, 0, 0, 0.97]
          };

          let localEased = segProgress;
          const presetKey = segConfig.easingPreset || 'linear';
          if (presetKey === 'custom' && Array.isArray(segConfig.customBezier) && segConfig.customBezier.length === 4) {
            const [p1x, p1y, p2x, p2y] = segConfig.customBezier;
            localEased = evaluateBezier(segProgress, p1x, p1y, p2x, p2y);
          } else if (presetKey !== 'linear') {
            const preset = EASING_PRESETS[presetKey] || EASING_PRESETS.linear;
            const [p1x, p1y, p2x, p2y] = preset.points;
            localEased = evaluateBezier(segProgress, p1x, p1y, p2x, p2y);
          }

          const distancePercent = Math.max(0, Math.min(1, (chunk.segmentIndex + localEased) / numSegments));
          return evaluatePath(nodes, distancePercent);
        }
      }
    }

    return evaluatePath(nodes, 1.0);
  } catch (err) {
    console.error("evaluateMotionPathAtTime Error:", err);
    return null;
  }
}
