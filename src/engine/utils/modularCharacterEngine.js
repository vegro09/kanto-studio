// SMART MODULAR COLORED BODY PARTS DEFINITIONS & ANATOMICAL BRAIN

export const MODULAR_BODY_PARTS = [
  // 1. HEAD & NECK
  {
    id: 'part_head',
    name: 'Head',
    category: 'Head & Neck',
    color: '#F87171', // Soft Coral Red
    parentPartType: 'neck',
    jointType: 'neck_head',
    width: 110,
    height: 130,
    pivotX: 0.5,
    pivotY: 0.9,
    constraints: { minAngle: -45, maxAngle: 45 },
    snapJoints: [
      { name: 'neck_joint', localX: 0.5, localY: 0.95, targetJoint: 'head_joint' }
    ],
    svgPath: 'M 25 15 C 25 5, 85 5, 85 15 C 95 45, 95 85, 75 115 C 60 128, 50 128, 35 115 C 15 85, 15 45, 25 15 Z'
  },
  {
    id: 'part_neck',
    name: 'Neck',
    category: 'Head & Neck',
    color: '#FBBF24', // Warm Amber
    parentPartType: 'torso',
    jointType: 'torso_neck',
    width: 50,
    height: 60,
    pivotX: 0.5,
    pivotY: 0.85,
    constraints: { minAngle: -30, maxAngle: 30 },
    snapJoints: [
      { name: 'head_joint', localX: 0.5, localY: 0.1, targetJoint: 'neck_joint' },
      { name: 'torso_top_joint', localX: 0.5, localY: 0.9, targetJoint: 'neck_base_joint' }
    ],
    svgPath: 'M 10 5 L 40 5 L 35 55 L 15 55 Z'
  },

  // 2. TORSO & PELVIS
  {
    id: 'part_torso',
    name: 'Chest / Upper Torso',
    category: 'Torso & Pelvis',
    color: '#60A5FA', // Sky Blue (Primary Root Anchor)
    parentPartType: null,
    jointType: 'root',
    width: 160,
    height: 190,
    pivotX: 0.5,
    pivotY: 0.5,
    constraints: { minAngle: -60, maxAngle: 60 },
    snapJoints: [
      { name: 'neck_base_joint', localX: 0.5, localY: 0.08, targetJoint: 'torso_top_joint' },
      { name: 'shoulder_l_joint', localX: 0.1, localY: 0.18, targetJoint: 'upper_arm_l_shoulder' },
      { name: 'shoulder_r_joint', localX: 0.9, localY: 0.18, targetJoint: 'upper_arm_r_shoulder' },
      { name: 'pelvis_top_joint', localX: 0.5, localY: 0.92, targetJoint: 'torso_pelvis_joint' }
    ],
    svgPath: 'M 20 15 L 140 15 C 150 70, 130 140, 110 180 L 50 180 C 30 140, 10 70, 20 15 Z'
  },
  {
    id: 'part_pelvis',
    name: 'Pelvis / Abdomen',
    category: 'Torso & Pelvis',
    color: '#818CF8', // Indigo
    parentPartType: 'torso',
    jointType: 'torso_pelvis',
    width: 140,
    height: 110,
    pivotX: 0.5,
    pivotY: 0.2,
    constraints: { minAngle: -40, maxAngle: 40 },
    snapJoints: [
      { name: 'torso_pelvis_joint', localX: 0.5, localY: 0.1, targetJoint: 'pelvis_top_joint' },
      { name: 'hip_l_joint', localX: 0.2, localY: 0.75, targetJoint: 'thigh_l_hip' },
      { name: 'hip_r_joint', localX: 0.8, localY: 0.75, targetJoint: 'thigh_r_hip' }
    ],
    svgPath: 'M 15 10 L 125 10 L 110 95 C 70 105, 70 105, 30 95 Z'
  },

  // 3. ARMS & HANDS (LEFT & RIGHT)
  {
    id: 'part_upper_arm_l',
    name: 'Upper Arm (Left)',
    category: 'Arms & Hands',
    color: '#34D399', // Emerald Green
    parentPartType: 'torso',
    jointType: 'shoulder',
    width: 55,
    height: 140,
    pivotX: 0.5,
    pivotY: 0.12,
    constraints: { minAngle: -180, maxAngle: 180 },
    snapJoints: [
      { name: 'upper_arm_l_shoulder', localX: 0.5, localY: 0.1, targetJoint: 'shoulder_l_joint' },
      { name: 'elbow_l_top', localX: 0.5, localY: 0.9, targetJoint: 'elbow_l_joint' }
    ],
    svgPath: 'M 10 15 C 10 5, 45 5, 45 15 L 40 125 C 40 135, 15 135, 15 125 Z'
  },
  {
    id: 'part_forearm_l',
    name: 'Forearm (Left)',
    category: 'Arms & Hands',
    color: '#10B981', // Deep Emerald
    parentPartType: 'upper_arm_l',
    jointType: 'elbow',
    width: 48,
    height: 130,
    pivotX: 0.5,
    pivotY: 0.1,
    constraints: { minAngle: 0, maxAngle: 145 }, // Anatomical Elbow Flexion Guard
    snapJoints: [
      { name: 'elbow_l_joint', localX: 0.5, localY: 0.1, targetJoint: 'elbow_l_top' },
      { name: 'wrist_l_bottom', localX: 0.5, localY: 0.92, targetJoint: 'hand_l_wrist' }
    ],
    svgPath: 'M 8 12 L 40 12 L 34 118 L 14 118 Z'
  },
  {
    id: 'part_hand_l',
    name: 'Hand (Left)',
    category: 'Arms & Hands',
    color: '#059669', // Dark Emerald
    parentPartType: 'forearm_l',
    jointType: 'wrist',
    width: 45,
    height: 60,
    pivotX: 0.5,
    pivotY: 0.15,
    constraints: { minAngle: -50, maxAngle: 50 },
    snapJoints: [
      { name: 'hand_l_wrist', localX: 0.5, localY: 0.15, targetJoint: 'wrist_l_bottom' }
    ],
    svgPath: 'M 10 8 L 35 8 C 42 25, 40 50, 22 55 C 5 50, 3 25, 10 8 Z'
  },

  {
    id: 'part_upper_arm_r',
    name: 'Upper Arm (Right)',
    category: 'Arms & Hands',
    color: '#38BDF8', // Light Blue
    parentPartType: 'torso',
    jointType: 'shoulder',
    width: 55,
    height: 140,
    pivotX: 0.5,
    pivotY: 0.12,
    constraints: { minAngle: -180, maxAngle: 180 },
    snapJoints: [
      { name: 'upper_arm_r_shoulder', localX: 0.5, localY: 0.1, targetJoint: 'shoulder_r_joint' },
      { name: 'elbow_r_top', localX: 0.5, localY: 0.9, targetJoint: 'elbow_r_joint' }
    ],
    svgPath: 'M 10 15 C 10 5, 45 5, 45 15 L 40 125 C 40 135, 15 135, 15 125 Z'
  },
  {
    id: 'part_forearm_r',
    name: 'Forearm (Right)',
    category: 'Arms & Hands',
    color: '#0284C7', // Deep Cyan/Blue
    parentPartType: 'upper_arm_r',
    jointType: 'elbow',
    width: 48,
    height: 130,
    pivotX: 0.5,
    pivotY: 0.1,
    constraints: { minAngle: -145, maxAngle: 0 }, // Anatomical Elbow Flexion Guard
    snapJoints: [
      { name: 'elbow_r_joint', localX: 0.5, localY: 0.1, targetJoint: 'elbow_r_top' },
      { name: 'wrist_r_bottom', localX: 0.5, localY: 0.92, targetJoint: 'hand_r_wrist' }
    ],
    svgPath: 'M 8 12 L 40 12 L 34 118 L 14 118 Z'
  },
  {
    id: 'part_hand_r',
    name: 'Hand (Right)',
    category: 'Arms & Hands',
    color: '#0369A1', // Dark Blue
    parentPartType: 'forearm_r',
    jointType: 'wrist',
    width: 45,
    height: 60,
    pivotX: 0.5,
    pivotY: 0.15,
    constraints: { minAngle: -50, maxAngle: 50 },
    snapJoints: [
      { name: 'hand_r_wrist', localX: 0.5, localY: 0.15, targetJoint: 'wrist_r_bottom' }
    ],
    svgPath: 'M 10 8 L 35 8 C 42 25, 40 50, 22 55 C 5 50, 3 25, 10 8 Z'
  },

  // 4. LEGS & FEET (LEFT & RIGHT)
  {
    id: 'part_thigh_l',
    name: 'Thigh (Left)',
    category: 'Legs & Feet',
    color: '#F472B6', // Pink
    parentPartType: 'pelvis',
    jointType: 'hip',
    width: 65,
    height: 160,
    pivotX: 0.5,
    pivotY: 0.1,
    constraints: { minAngle: -120, maxAngle: 90 },
    snapJoints: [
      { name: 'thigh_l_hip', localX: 0.5, localY: 0.1, targetJoint: 'hip_l_joint' },
      { name: 'knee_l_top', localX: 0.5, localY: 0.92, targetJoint: 'knee_l_joint' }
    ],
    svgPath: 'M 10 12 L 55 12 L 48 150 L 18 150 Z'
  },
  {
    id: 'part_calf_l',
    name: 'Calf / Shin (Left)',
    category: 'Legs & Feet',
    color: '#EC4899', // Deep Pink
    parentPartType: 'thigh_l',
    jointType: 'knee',
    width: 55,
    height: 150,
    pivotX: 0.5,
    pivotY: 0.1,
    constraints: { minAngle: 0, maxAngle: 145 }, // Knee flexion (bends back, not forward)
    snapJoints: [
      { name: 'knee_l_joint', localX: 0.5, localY: 0.1, targetJoint: 'knee_l_top' },
      { name: 'ankle_l_bottom', localX: 0.5, localY: 0.92, targetJoint: 'foot_l_ankle' }
    ],
    svgPath: 'M 8 10 L 47 10 L 40 140 L 15 140 Z'
  },
  {
    id: 'part_foot_l',
    name: 'Foot (Left)',
    category: 'Legs & Feet',
    color: '#DB2777', // Dark Magenta
    parentPartType: 'calf_l',
    jointType: 'ankle',
    width: 75,
    height: 45,
    pivotX: 0.3,
    pivotY: 0.3,
    constraints: { minAngle: -35, maxAngle: 45 },
    snapJoints: [
      { name: 'foot_l_ankle', localX: 0.3, localY: 0.3, targetJoint: 'ankle_l_bottom' }
    ],
    svgPath: 'M 10 10 L 40 10 L 70 35 L 5 35 Z'
  },

  {
    id: 'part_thigh_r',
    name: 'Thigh (Right)',
    category: 'Legs & Feet',
    color: '#C084FC', // Purple
    parentPartType: 'pelvis',
    jointType: 'hip',
    width: 65,
    height: 160,
    pivotX: 0.5,
    pivotY: 0.1,
    constraints: { minAngle: -120, maxAngle: 90 },
    snapJoints: [
      { name: 'thigh_r_hip', localX: 0.5, localY: 0.1, targetJoint: 'hip_r_joint' },
      { name: 'knee_r_top', localX: 0.5, localY: 0.92, targetJoint: 'knee_r_joint' }
    ],
    svgPath: 'M 10 12 L 55 12 L 48 150 L 18 150 Z'
  },
  {
    id: 'part_calf_r',
    name: 'Calf / Shin (Right)',
    category: 'Legs & Feet',
    color: '#A855F7', // Deep Purple
    parentPartType: 'thigh_r',
    jointType: 'knee',
    width: 55,
    height: 150,
    pivotX: 0.5,
    pivotY: 0.1,
    constraints: { minAngle: 0, maxAngle: 145 }, // Knee flexion (bends back, not forward)
    snapJoints: [
      { name: 'knee_r_joint', localX: 0.5, localY: 0.1, targetJoint: 'knee_r_top' },
      { name: 'ankle_r_bottom', localX: 0.5, localY: 0.92, targetJoint: 'foot_r_ankle' }
    ],
    svgPath: 'M 8 10 L 47 10 L 40 140 L 15 140 Z'
  },
  {
    id: 'part_foot_r',
    name: 'Foot (Right)',
    category: 'Legs & Feet',
    color: '#9333EA', // Dark Violet
    parentPartType: 'calf_r',
    jointType: 'ankle',
    width: 75,
    height: 45,
    pivotX: 0.3,
    pivotY: 0.3,
    constraints: { minAngle: -35, maxAngle: 45 },
    snapJoints: [
      { name: 'foot_r_ankle', localX: 0.3, localY: 0.3, targetJoint: 'ankle_r_bottom' }
    ],
    svgPath: 'M 10 10 L 40 10 L 70 35 L 5 35 Z'
  }
];

// Helper to clamp rotation angles to anatomical limits
export const clampJointRotation = (partType, proposedAngleDeg) => {
  const partDef = MODULAR_BODY_PARTS.find((p) => p.id === partType);
  if (!partDef || !partDef.constraints) return proposedAngleDeg;

  const { minAngle, maxAngle } = partDef.constraints;
  return Math.min(maxAngle, Math.max(minAngle, proposedAngleDeg));
};

// Helper to calculate joint snap proximity (returns target snap coordinate if within threshold)
export const checkJointSnapProximity = (partA, partB, thresholdPx = 25) => {
  if (!partA || !partB || !partA.snapJoints || !partB.snapJoints) return null;

  for (const jA of partA.snapJoints) {
    const posA = {
      x: partA.x + jA.localX * partA.width,
      y: partA.y + jA.localY * partA.height
    };

    for (const jB of partB.snapJoints) {
      if (jA.targetJoint === jB.name || jB.targetJoint === jA.name) {
        const posB = {
          x: partB.x + jB.localX * partB.width,
          y: partB.y + jB.localY * partB.height
        };

        const dist = Math.hypot(posA.x - posB.x, posA.y - posB.y);
        if (dist <= thresholdPx) {
          return {
            snapTargetX: posB.x - jA.localX * partA.width,
            snapTargetY: posB.y - jA.localY * partA.height,
            jointName: jA.name,
            connectedPartId: partB.id
          };
        }
      }
    }
  }

  return null;
};

// Native Linear Interpolation (LERP) Keyframe Engine for Modular Character Parts
export const calculateInterpolatedState = (part, currentTime) => {
  if (!part || !part.keyframes || part.keyframes.length === 0) return part;

  const sortedFrames = [...part.keyframes].sort((a, b) => a.time - b.time);

  if (currentTime <= sortedFrames[0].time) {
    const k = sortedFrames[0];
    return {
      ...part,
      relativeX: k.relativeX !== undefined ? k.relativeX : part.relativeX,
      relativeY: k.relativeY !== undefined ? k.relativeY : part.relativeY,
      rotation: k.rotation !== undefined ? k.rotation : part.rotation,
      scaleX: k.scaleX !== undefined ? k.scaleX : (part.scaleX || 1.0),
      scaleY: k.scaleY !== undefined ? k.scaleY : (part.scaleY || 1.0)
    };
  }

  if (currentTime >= sortedFrames[sortedFrames.length - 1].time) {
    const k = sortedFrames[sortedFrames.length - 1];
    return {
      ...part,
      relativeX: k.relativeX !== undefined ? k.relativeX : part.relativeX,
      relativeY: k.relativeY !== undefined ? k.relativeY : part.relativeY,
      rotation: k.rotation !== undefined ? k.rotation : part.rotation,
      scaleX: k.scaleX !== undefined ? k.scaleX : (part.scaleX || 1.0),
      scaleY: k.scaleY !== undefined ? k.scaleY : (part.scaleY || 1.0)
    };
  }

  let prevFrame = null;
  let nextFrame = null;
  for (let i = 0; i < sortedFrames.length - 1; i++) {
    if (currentTime >= sortedFrames[i].time && currentTime < sortedFrames[i + 1].time) {
      prevFrame = sortedFrames[i];
      nextFrame = sortedFrames[i + 1];
      break;
    }
  }

  if (!prevFrame || !nextFrame) return part;

  const timeDelta = nextFrame.time - prevFrame.time;
  if (timeDelta <= 0) return { ...part, ...prevFrame };

  const progress = (currentTime - prevFrame.time) / timeDelta;
  const lerp = (start, end, amt) => start + (end - start) * amt;

  const defaultRelX = part.relativeX || 0;
  const defaultRelY = part.relativeY || 0;

  return {
    ...part,
    relativeX: lerp(
      prevFrame.relativeX !== undefined ? prevFrame.relativeX : defaultRelX,
      nextFrame.relativeX !== undefined ? nextFrame.relativeX : defaultRelX,
      progress
    ),
    relativeY: lerp(
      prevFrame.relativeY !== undefined ? prevFrame.relativeY : defaultRelY,
      nextFrame.relativeY !== undefined ? nextFrame.relativeY : defaultRelY,
      progress
    ),
    rotation: lerp(
      prevFrame.rotation !== undefined ? prevFrame.rotation : (part.rotation || 0),
      nextFrame.rotation !== undefined ? nextFrame.rotation : (part.rotation || 0),
      progress
    ),
    scaleX: lerp(
      prevFrame.scaleX !== undefined ? prevFrame.scaleX : (part.scaleX || 1.0),
      nextFrame.scaleX !== undefined ? nextFrame.scaleX : (part.scaleX || 1.0),
      progress
    ),
    scaleY: lerp(
      prevFrame.scaleY !== undefined ? prevFrame.scaleY : (part.scaleY || 1.0),
      nextFrame.scaleY !== undefined ? nextFrame.scaleY : (part.scaleY || 1.0),
      progress
    )
  };
};
