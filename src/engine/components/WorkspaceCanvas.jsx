import React, { useRef, useState, useEffect } from 'react';
import { Camera, Lock, Plus, ZoomIn, ZoomOut, Compass, Target, RotateCw } from 'lucide-react';
import KineticTextCanvas from './KineticTextCanvas';
import { getCanvasFilterString } from '../utils/canvasFilters';
import { evaluatePath, evaluateMotionPathAtTime, calculatePathPosition } from '../utils/motionPathEngine';
import { clampJointRotation, calculateInterpolatedState } from '../utils/modularCharacterEngine';
import { KantoTextOverlay, useEngineStore } from '../../modules/KantoTextEngine';

export default function WorkspaceCanvas({
  assets,
  onUpdateAsset,
  selectedAssetId,
  onSelectAsset,
  camera,
  onUpdateCamera,
  onSelectCamera,
  isCameraSelected,
  viewfinderRef,
  focusCameraRef,
  onCaptureShot,
  isPanMode,
  gridType,
  sceneSettings,
  activeShotIndex,
  isPlaying = false,
  playbackProgress = 0,
  totalDuration = 10,
  onAddAsset,
  onAddModularPart,
  onSelectTextLayer
}) {
  const viewportRef = useRef(null);

  // FIGMA/MIRO INFINITE CANVAS NAVIGATION STATE
  const [canvasView, setCanvasView] = useState({
    x: 150,
    y: 120,
    scale: 0.85
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState(null);

  // TASK 2: "FOCUS ON CAMERA" UTILITY (Precise Camera Viewfinder Centering)
  const handleFocusOnCamera = () => {
    const viewport = viewportRef.current;
    if (!viewport || !camera) return;

    const rect = viewport.getBoundingClientRect();
    const viewportW = rect.width || window.innerWidth;
    const viewportH = rect.height || window.innerHeight;

    const camW = (camera.width || 270) * (camera.scale || 1);
    const camH = (camera.height || 480) * (camera.scale || 1);
    const camCenterX = camera.x + camW / 2;
    const camCenterY = camera.y + camH / 2;

    const targetScale = 0.85;
    const targetX = viewportW / 2 - camCenterX * targetScale;
    const targetY = viewportH / 2 - camCenterY * targetScale;

    setCanvasView({
      x: targetX,
      y: targetY,
      scale: targetScale
    });
  };

  useEffect(() => {
    if (focusCameraRef) {
      focusCameraRef.current = handleFocusOnCamera;
    }
  });

  // TASK 2: AUTO-CENTER CAMERA IN WORKSPACE VIEWPORT ON INITIAL MOUNT
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFocusOnCamera();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Shortcut Listener: Press 'F' to focus camera dead-center
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey && !e.metaKey) {
        handleFocusOnCamera();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [camera]);

  // Keyboard Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // CURSOR ANCHORED SMOOTH ZOOMING
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      
      setCanvasView((prev) => {
        const targetScale = Math.min(Math.max(prev.scale * zoomFactor, 0.1), 5.0);
        const scaleRatio = targetScale / prev.scale;

        const newX = mouseX - (mouseX - prev.x) * scaleRatio;
        const newY = mouseY - (mouseY - prev.y) * scaleRatio;

        return {
          x: newX,
          y: newY,
          scale: targetScale
        };
      });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  // CANVAS BACKGROUND MOUSE DOWN
  const handleMouseDown = (e) => {
    const isClickOnCanvasBackground = e.target === viewportRef.current || e.target.classList.contains('canvas-grid-bg');
    
    if (e.button === 1 || spacePressed || isPanMode || isClickOnCanvasBackground) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - canvasView.x,
        y: e.clientY - canvasView.y
      });

      if (isClickOnCanvasBackground) {
        onSelectAsset(null);
        onSelectCamera(false);
        useEngineStore.getState().selectLayer(null);
      }
    }
  };

  // ASSET POINTER DOWN
  const handleAssetPointerDown = (e, asset) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelectAsset(asset.id);
    onSelectCamera(false);
    useEngineStore.getState().selectLayer(null);

    if (asset.isLocked || isPanMode || spacePressed) return;

    // Auto-compute relative offsets if child part attached to base character
    if (asset.attachedBaseId) {
      const parentBase = assets.find((a) => a.id === asset.attachedBaseId);
      if (parentBase) {
        asset.relativeX = asset.x - parentBase.x;
        asset.relativeY = asset.y - parentBase.y;
      }
    }

    // Track initial children positions for rigid relative offset tracking (ONLY FOR PARTS WITH isLockedToCharacter !== false)
    const childParts = assets.filter((c) => 
      c.id !== asset.id && 
      c.isLockedToCharacter !== false && 
      (c.parentPartId === asset.id || c.attachedBaseId === asset.id)
    );
    const initialChildrenPositions = childParts.map((c) => ({
      id: c.id,
      startX: c.x,
      startY: c.y,
      relativeX: c.relativeX !== undefined ? c.relativeX : (c.x - asset.x),
      relativeY: c.relativeY !== undefined ? c.relativeY : (c.y - asset.y)
    }));

    setDraggingTarget({
      type: 'asset',
      id: asset.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: asset.x,
      startY: asset.y,
      initialChildrenPositions
    });
  };

  // ROTATION HANDLE POINTER DOWN
  const handleRotateHandleMouseDown = (e, asset) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelectAsset(asset.id);
    onSelectCamera(false);

    if (asset.isLocked || isPanMode || spacePressed) return;

    const rect = viewportRef.current ? viewportRef.current.getBoundingClientRect() : { left: 0, top: 0 };
    const centerX = asset.x + (asset.width || 100) / 2;
    const centerY = asset.y + (asset.height || 100) / 2;
    const centerScreenX = rect.left + canvasView.x + centerX * canvasView.scale;
    const centerScreenY = rect.top + canvasView.y + centerY * canvasView.scale;

    setDraggingTarget({
      type: 'rotate',
      id: asset.id,
      centerScreenX,
      centerScreenY,
      partType: asset.partType,
      startAngle: asset.rotation || 0
    });
  };

  // CAMERA VIEWFINDER POINTER DOWN
  const handleCameraPointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelectCamera(true);
    onSelectAsset(null);
    useEngineStore.getState().selectLayer(null);

    if (camera.isLocked || isPanMode || spacePressed) return;

    setDraggingTarget({
      type: 'camera',
      id: 'camera',
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: camera.x,
      startY: camera.y
    });
  };

  const handleResizeHandleMouseDown = (e, asset, corner) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelectAsset(asset.id);
    onSelectCamera(false);

    if (asset.isLocked || isPanMode || spacePressed) return;

    const currentW = asset.width || 300;
    const currentH = asset.height || 300;
    const aspect = (currentW && currentH) ? (currentW / currentH) : 1;

    setDraggingTarget({
      type: 'resize',
      id: asset.id,
      corner: corner,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: currentW,
      startH: currentH,
      startX: asset.x,
      startY: asset.y,
      aspectRatio: aspect
    });
  };

  // MOTION PATH NODE POINTER DOWN (TASK 2 - INTERACTIVE DRAGGING)
  const handleNodePointerDown = (e, asset, nodeIdx) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelectAsset(asset.id);
    onSelectCamera(false);

    if (isPanMode || spacePressed) return;

    const nodes = asset.motionPath?.pathNodes || [];
    const targetNode = nodes[nodeIdx];
    if (!targetNode) return;

    setDraggingTarget({
      type: 'pathNode',
      assetId: asset.id,
      nodeIndex: nodeIdx,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: typeof targetNode.x === 'number' && Number.isFinite(targetNode.x) ? targetNode.x : 0,
      startY: typeof targetNode.y === 'number' && Number.isFinite(targetNode.y) ? targetNode.y : 0
    });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setCanvasView((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
      return;
    }

    if (draggingTarget) {
      const deltaX = (e.clientX - draggingTarget.startMouseX) / canvasView.scale;
      const deltaY = (e.clientY - draggingTarget.startMouseY) / canvasView.scale;

      if (draggingTarget.type === 'asset') {
        const newX = draggingTarget.startX + deltaX;
        const newY = draggingTarget.startY + deltaY;

        const currentDraggedAsset = assets.find((a) => a.id === draggingTarget.id);

        // Update dragging asset's absolute position and relative offset if bound to parent base
        const updatePayload = {
          x: newX,
          y: newY
        };

        if (currentDraggedAsset && currentDraggedAsset.attachedBaseId) {
          const parentBase = assets.find((a) => a.id === currentDraggedAsset.attachedBaseId);
          if (parentBase) {
            updatePayload.relativeX = newX - parentBase.x;
            updatePayload.relativeY = newY - parentBase.y;
          }
        }

        onUpdateAsset(draggingTarget.id, updatePayload);

        // RIGID RELATIVE MATRIX BINDING LOOP FOR LOCKED CHILD PARTS
        if (Array.isArray(draggingTarget.initialChildrenPositions)) {
          draggingTarget.initialChildrenPositions.forEach((child) => {
            const childTarget = assets.find((a) => a.id === child.id);
            if (!childTarget || childTarget.isLockedToCharacter === false) return;

            const updatedChildX = newX + child.relativeX;
            const updatedChildY = newY + child.relativeY;

            onUpdateAsset(child.id, {
              x: updatedChildX,
              y: updatedChildY,
              relativeX: child.relativeX,
              relativeY: child.relativeY
            });
          });
        }
      } else if (draggingTarget.type === 'rotate') {
        const rad = Math.atan2(e.clientY - draggingTarget.centerScreenY, e.clientX - draggingTarget.centerScreenX);
        let proposedAngleDeg = Math.round(rad * (180 / Math.PI) - 90);

        if (draggingTarget.partType) {
          proposedAngleDeg = clampJointRotation(draggingTarget.partType, proposedAngleDeg);
        }

        onUpdateAsset(draggingTarget.id, {
          rotation: proposedAngleDeg
        });
      } else if (draggingTarget.type === 'pathNode') {
        const targetAsset = assets.find((a) => a.id === draggingTarget.assetId);
        if (targetAsset && targetAsset.motionPath && Array.isArray(targetAsset.motionPath.pathNodes)) {
          const updatedNodes = targetAsset.motionPath.pathNodes.map((n, idx) => {
            if (idx === draggingTarget.nodeIndex) {
              return {
                ...n,
                x: draggingTarget.startX + deltaX,
                y: draggingTarget.startY + deltaY
              };
            }
            return n;
          });

          onUpdateAsset(draggingTarget.assetId, {
            motionPath: {
              ...targetAsset.motionPath,
              pathNodes: updatedNodes
            }
          });
        }
      } else if (draggingTarget.type === 'camera') {
        onUpdateCamera({
          x: draggingTarget.startX + deltaX,
          y: draggingTarget.startY + deltaY
        });
      } else if (draggingTarget.type === 'resize') {
        const corner = draggingTarget.corner;
        let newW = draggingTarget.startW;
        let newH = draggingTarget.startH;
        let newX = draggingTarget.startX;
        let newY = draggingTarget.startY;

        if (corner === 'se') {
          newW = Math.max(30, draggingTarget.startW + deltaX);
          newH = Math.max(30, draggingTarget.startH + deltaY);
        } else if (corner === 'sw') {
          newW = Math.max(30, draggingTarget.startW - deltaX);
          newH = Math.max(30, draggingTarget.startH + deltaY);
          newX = draggingTarget.startX + (draggingTarget.startW - newW);
        } else if (corner === 'ne') {
          newW = Math.max(30, draggingTarget.startW + deltaX);
          newH = Math.max(30, draggingTarget.startH - deltaY);
          newY = draggingTarget.startY + (draggingTarget.startH - newH);
        } else if (corner === 'nw') {
          newW = Math.max(30, draggingTarget.startW - deltaX);
          newH = Math.max(30, draggingTarget.startH - deltaY);
          newX = draggingTarget.startX + (draggingTarget.startW - newW);
          newY = draggingTarget.startY + (draggingTarget.startH - newH);
        } else if (corner === 'top') {
          newH = Math.max(20, draggingTarget.startH - deltaY);
          newY = draggingTarget.startY + (draggingTarget.startH - newH);
        } else if (corner === 'bottom') {
          newH = Math.max(20, draggingTarget.startH + deltaY);
        } else if (corner === 'left') {
          newW = Math.max(20, draggingTarget.startW - deltaX);
          newX = draggingTarget.startX + (draggingTarget.startW - newW);
        } else if (corner === 'right') {
          newW = Math.max(20, draggingTarget.startW + deltaX);
        }

        onUpdateAsset(draggingTarget.id, {
          width: Math.round(newW),
          height: Math.round(newH),
          x: Math.round(newX),
          y: Math.round(newY)
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingTarget(null);
  };

  const handleResetCanvasView = () => {
    setCanvasView({ x: 150, y: 120, scale: 0.85 });
  };

  const sortedAssets = [...assets].sort((a, b) => a.zIndex - b.zIndex);

  const textureClass = sceneSettings.texture === 'lines'
    ? 'bg-grid-lines-ivory'
    : 'bg-dot-grid-ivory';

  const activeCursorClass = isPanning 
    ? 'cursor-grabbing' 
    : (spacePressed || isPanMode) 
    ? 'cursor-grab' 
    : draggingTarget 
    ? 'cursor-grabbing'
    : 'cursor-default';

  const handleDirectCanvasDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!viewportRef.current) return;

    // SCREEN-TO-WORLD COORDINATE CONVERSION (FIXES PAN & ZOOM DESYNC)
    const rect = viewportRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldX = (screenX - canvasView.x) / canvasView.scale;
    const worldY = (screenY - canvasView.y) / canvasView.scale;

    // 1. JSON / Text / URL payload drop from library or sidebar card
    const textData = e.dataTransfer ? e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain') : null;

    if (textData) {
      try {
        const item = JSON.parse(textData);
        if (item) {
          // Modular Body Part Drop
          if (item.kind === 'modular_part' && item.part && onAddModularPart) {
            const pW = item.part.width || 100;
            const pH = item.part.height || 120;
            const spawnX = Math.round(worldX - pW / 2);
            const spawnY = Math.round(worldY - pH / 2);
            onAddModularPart({
              ...item.part,
              x: spawnX,
              y: spawnY
            });
            return;
          }

          // Generic Library Asset Drop
          if ((item.src || item.url || item.type) && onAddAsset) {
            const itemW = item.width || 400;
            const itemH = item.height || 400;
            const spawnX = Math.round(worldX - itemW / 2);
            const spawnY = Math.round(worldY - itemH / 2);
            onAddAsset({
              ...item,
              x: spawnX,
              y: spawnY
            });
            return;
          }
        }
      } catch (err) {
        if (textData.startsWith('http://') || textData.startsWith('https://')) {
          const isVid = textData.match(/\.(mp4|webm|mov|ogv)$/i);
          const spawnX = Math.round(worldX - 200);
          const spawnY = Math.round(worldY - 200);
          if (onAddAsset) {
            onAddAsset({
              name: isVid ? 'Dropped Video' : 'Dropped Image',
              type: isVid ? 'video' : 'image',
              src: textData,
              url: textData,
              x: spawnX,
              y: spawnY
            });
            return;
          }
        }
      }
    }

    // 2. Local OS File Drop
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, "") || 'Dropped Media';
      if (file.type.startsWith('video/')) {
        const blobUrl = URL.createObjectURL(file);
        if (onAddAsset) {
          onAddAsset({
            name: fileName,
            type: 'video',
            category: 'Videos',
            src: blobUrl,
            url: blobUrl,
            x: Math.round(worldX - 300),
            y: Math.round(worldY - 200),
            width: 600,
            height: 400
          });
        }
        return;
      }

      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUrl = event.target.result;
        if (!dataUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const aspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 1;
          let baseW = 420;
          let baseH = Math.round(420 / aspect);
          if (baseH > 600) {
            baseH = 600;
            baseW = Math.round(600 * aspect);
          }
          if (onAddAsset) {
            onAddAsset({
              name: fileName,
              type: 'image',
              url: dataUrl,
              src: dataUrl,
              x: Math.round(worldX - baseW / 2),
              y: Math.round(worldY - baseH / 2),
              width: baseW,
              height: baseH,
              scale: 0.6
            });
          }
        };
        img.onerror = () => {
          if (onAddAsset) {
            onAddAsset({
              name: fileName,
              type: 'image',
              url: dataUrl,
              src: dataUrl,
              x: Math.round(worldX - 200),
              y: Math.round(worldY - 200),
              width: 400,
              height: 400,
              scale: 0.6
            });
          }
        };
        img.src = dataUrl;
      };

      reader.readAsDataURL(file);
    });
  };

  return (
    <main
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleDirectCanvasDrop}
      className={`flex-1 relative overflow-hidden select-none z-10 ${activeCursorClass}`}
      style={{ backgroundColor: sceneSettings?.bgColor || '#000000' }}
    >
      {/* SOLID UNIFIED GLOBAL WORKSPACE BACKGROUND (UNDER EVERYTHING) */}
      <div
        className={`w-[8000px] h-[8000px] absolute top-0 left-0 transform-origin-top-left transition-transform duration-75 canvas-grid-bg ${textureClass}`}
        style={{
          backgroundColor: sceneSettings?.bgColor || '#000000',
          transform: `translate(${canvasView.x}px, ${canvasView.y}px) scale(${canvasView.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {/* LAYER 0.5: INTERACTIVE MOTION PATH OVERLAY & NODE DRAGGING (TASK 2) */}
        {sortedAssets.filter((a) => a && a.motionPath && a.motionPath.isPathEnabled && Array.isArray(a.motionPath.pathNodes) && a.motionPath.pathNodes.length > 0).map((asset) => {
          try {
            const isSelected = selectedAssetId === asset.id;
            const nodes = asset.motionPath.pathNodes || [];

            // Per-Segment Catmull-Rom Spline Wave Curve Generation
            const segmentPaths = [];
            const count = nodes.length;

            if (count === 2) {
              const nx0 = typeof nodes[0].x === 'number' && Number.isFinite(nodes[0].x) ? nodes[0].x : 0;
              const ny0 = typeof nodes[0].y === 'number' && Number.isFinite(nodes[0].y) ? nodes[0].y : 0;
              const nx1 = typeof nodes[1].x === 'number' && Number.isFinite(nodes[1].x) ? nodes[1].x : 0;
              const ny1 = typeof nodes[1].y === 'number' && Number.isFinite(nodes[1].y) ? nodes[1].y : 0;
              segmentPaths.push(`M ${nx0.toFixed(1)} ${ny0.toFixed(1)} L ${nx1.toFixed(1)} ${ny1.toFixed(1)}`);
            } else if (count > 2) {
              for (let i = 0; i < count - 1; i++) {
                const p0 = nodes[Math.max(0, i - 1)];
                const p1 = nodes[i];
                const p2 = nodes[Math.min(count - 1, i + 1)];
                const p3 = nodes[Math.min(count - 1, i + 2)];

                let segD = '';
                const samples = 25;
                for (let s = 0; s <= samples; s++) {
                  const t = s / samples;
                  const t2 = t * t;
                  const t3 = t2 * t;

                  const p0x = typeof p0.x === 'number' && Number.isFinite(p0.x) ? p0.x : 0;
                  const p0y = typeof p0.y === 'number' && Number.isFinite(p0.y) ? p0.y : 0;
                  const p1x = typeof p1.x === 'number' && Number.isFinite(p1.x) ? p1.x : 0;
                  const p1y = typeof p1.y === 'number' && Number.isFinite(p1.y) ? p1.y : 0;
                  const p2x = typeof p2.x === 'number' && Number.isFinite(p2.x) ? p2.x : 0;
                  const p2y = typeof p2.y === 'number' && Number.isFinite(p2.y) ? p2.y : 0;
                  const p3x = typeof p3.x === 'number' && Number.isFinite(p3.x) ? p3.x : 0;
                  const p3y = typeof p3.y === 'number' && Number.isFinite(p3.y) ? p3.y : 0;

                  const x = 0.5 * (
                    (2 * p1x) +
                    (-p0x + p2x) * t +
                    (2 * p0x - 5 * p1x + 4 * p2x - p3x) * t2 +
                    (-p0x + 3 * p1x - 3 * p2x + p3x) * t3
                  );

                  const y = 0.5 * (
                    (2 * p1y) +
                    (-p0y + p2y) * t +
                    (2 * p0y - 5 * p1y + 4 * p2y - p3y) * t2 +
                    (-p0y + 3 * p1y - 3 * p2y + p3y) * t3
                  );

                  if (Number.isFinite(x) && Number.isFinite(y) && !isNaN(x) && !isNaN(y)) {
                    if (s === 0) {
                      segD += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                    } else {
                      segD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
                    }
                  }
                }
                if (segD) segmentPaths.push(segD);
              }
            }

            return (
              <svg
                key={`motion-svg-${asset.id}`}
                className="absolute inset-0 pointer-events-none z-[1200] overflow-visible"
                style={{ width: '100%', height: '100%' }}
              >
                {/* Visible Per-Segment Path Lines with Visual Highlighting (TASK 1) */}
                {segmentPaths.map((segD, segIdx) => {
                  const isSegSelected = isSelected && (asset.motionPath?.selectedSegmentIndex || 0) === segIdx;

                  return (
                    <path
                      key={`seg-line-${asset.id}-${segIdx}`}
                      d={segD}
                      fill="none"
                      stroke={isSegSelected ? '#c084fc' : isSelected ? '#3b82f6' : '#6b7280'}
                      strokeWidth={isSegSelected ? '4.5' : '2.5'}
                      strokeDasharray={isSelected ? 'none' : '4 4'}
                      className="pointer-events-auto cursor-pointer hover:stroke-purple-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateAsset) {
                          onUpdateAsset(asset.id, {
                            motionPath: {
                              ...asset.motionPath,
                              selectedSegmentIndex: segIdx
                            }
                          });
                        }
                      }}
                    />
                  );
                })}

                {/* Interactive Node Drag Circles */}
                {nodes.map((node, nIdx) => {
                  const nx = typeof node.x === 'number' && Number.isFinite(node.x) ? node.x : 0;
                  const ny = typeof node.y === 'number' && Number.isFinite(node.y) ? node.y : 0;

                  return (
                    <g
                      key={`node-circle-${asset.id}-${nIdx}`}
                      className="pointer-events-auto cursor-grab active:cursor-grabbing group"
                      onMouseDown={(e) => handleNodePointerDown(e, asset, nIdx)}
                    >
                      {/* Outer pulse ring on hover */}
                      <circle
                        cx={nx}
                        cy={ny}
                        r="16"
                        fill={node.isStopNode ? "rgba(245, 158, 11, 0.2)" : "rgba(59, 130, 246, 0.2)"}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />

                      {node.isStopNode ? (
                        // STOP STATION NODE (GOLD DIAMOND / SQUARE)
                        <g transform={`translate(${nx}, ${ny}) rotate(45)`}>
                          <rect
                            x="-7"
                            y="-7"
                            width="14"
                            height="14"
                            rx="2"
                            fill="#f59e0b"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="shadow-lg transition-transform group-hover:scale-110"
                          />
                        </g>
                      ) : (
                        // STANDARD PATH NODE (BLUE CIRCLE)
                        <circle
                          cx={nx}
                          cy={ny}
                          r="8"
                          fill="#3b82f6"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="shadow-lg transition-transform group-hover:scale-110"
                        />
                      )}

                      {/* Node Index Tag */}
                      <text
                        x={nx}
                        y={ny + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#ffffff"
                        className="select-none pointer-events-none font-mono"
                      >
                        {nIdx + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          } catch (err) {
            console.error("Motion Path SVG Overlay Error:", err);
            return null;
          }
        })}

        {/* LAYER 1: VISUAL SCENE ASSETS (EXCLUDES AUDIO AND TEXT ASSETS MANAGED BY KANTO TEXT OVERLAY) */}
        {sortedAssets.filter((a) => a && a.type !== 'audio' && a.type !== 'text' && a.type !== 'background' && !a.isBackgroundLayer && a.category !== 'Audio' && a.category !== 'Text').map((asset, idx) => {
          const isSelected = selectedAssetId === asset.id;
          const currentSec = (playbackProgress || 0) * (totalDuration || 10);

          // STRICT IN-POINT & OUT-POINT TIMELINE VISIBILITY CHECK
          const isAlwaysVisible = asset.type === 'background' || asset.isBackgroundLayer || asset.category === 'Stock' || asset.type === 'modular_body_part';
          if (!isAlwaysVisible) {
            const startSec = typeof asset.startTimeSec === 'number' ? asset.startTimeSec : 0;
            let duration = asset.duration !== undefined ? asset.duration : (asset.animationDuration || 5.0);

            if (asset.motionPath && asset.motionPath.isPathEnabled && Array.isArray(asset.motionPath.pathNodes)) {
              const totalStop = asset.motionPath.pathNodes.reduce(
                (sum, n) => sum + (n.isStopNode ? (n.freezeDurationSec !== undefined ? n.freezeDurationSec : 1.0) : 0),
                0
              );
              duration += totalStop;
            }

            const endSec = startSec + duration;
            const isWithinTimeWindow = currentSec >= startSec && currentSec <= endSec;

            // Do not render asset if outside its timeline interval (unless user is actively selecting/editing it when paused)
            if (!isWithinTimeWindow && !(isSelected && !isPlaying)) {
              return null;
            }
          }

          // EVALUATE KEYFRAME LERP INTERPOLATION & MOTION PATH POSITION
          let renderX = typeof asset.x === 'number' && Number.isFinite(asset.x) && !isNaN(asset.x) ? asset.x : 0;
          let renderY = typeof asset.y === 'number' && Number.isFinite(asset.y) && !isNaN(asset.y) ? asset.y : 0;
          let renderRotation = typeof asset.rotation === 'number' ? asset.rotation : 0;
          let renderScaleX = typeof asset.scaleX === 'number' ? asset.scaleX : 1.0;
          let renderScaleY = typeof asset.scaleY === 'number' ? asset.scaleY : 1.0;

          // Apply Keyframe LERP Engine Evaluation
          if (asset.keyframes && Array.isArray(asset.keyframes) && asset.keyframes.length > 0) {
            const interpState = calculateInterpolatedState(asset, currentSec);
            if (interpState) {
              if (typeof interpState.rotation === 'number') renderRotation = interpState.rotation;
              if (typeof interpState.scaleX === 'number') renderScaleX = interpState.scaleX;
              if (typeof interpState.scaleY === 'number') renderScaleY = interpState.scaleY;

              if (asset.attachedBaseId) {
                const parentBase = assets.find((a) => a.id === asset.attachedBaseId);
                if (parentBase) {
                  const relX = typeof interpState.relativeX === 'number' ? interpState.relativeX : (asset.relativeX || 0);
                  const relY = typeof interpState.relativeY === 'number' ? interpState.relativeY : (asset.relativeY || 0);
                  renderX = parentBase.x + relX;
                  renderY = parentBase.y + relY;
                }
              }
            }
          }

          if (asset.motionPath && asset.motionPath.isPathEnabled) {
            try {
              const currentSec = (playbackProgress || 0) * (totalDuration || 10);
              const elementStart = typeof asset.startTimeSec === 'number' ? asset.startTimeSec : 0;
              const elementDuration = Math.max(0.0001, typeof asset.duration === 'number' && asset.duration > 0 ? asset.duration : (asset.animationDuration || 5.0));

              // TASK 1, 2 & 3: DECOUPLED INDEPENDENT ELEMENT PROGRESS & ISOLATED BOUNDARIES
              const evaluated = evaluateMotionPathAtTime(
                asset.motionPath,
                elementStart,
                elementDuration,
                currentSec
              );

              if (evaluated && Number.isFinite(evaluated.x) && Number.isFinite(evaluated.y) && !isNaN(evaluated.x) && !isNaN(evaluated.y)) {
                // CENTER-ANCHORED PATH ALIGNMENT: Offset by -width/2 and -height/2 so element CENTER tracks the path
                const halfW = (typeof asset.width === 'number' && asset.width > 0 ? asset.width : 300) / 2;
                const halfH = (typeof asset.height === 'number' && asset.height > 0 ? asset.height : 100) / 2;
                renderX = evaluated.x - halfW;
                renderY = evaluated.y - halfH;
              }
            } catch (err) {
              console.error("Motion Path Center-Anchored Position Error:", err);
            }
          }

          return (
            <div
              key={asset.id}
              onMouseDown={(e) => handleAssetPointerDown(e, asset)}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: `${renderX}px`,
                top: `${renderY}px`,
                transform: `rotate(${renderRotation}deg) scale(${renderScaleX * (asset.scale || 1)}, ${renderScaleY * (asset.scale || 1)})`,
                transformOrigin: 'center center',
                opacity: asset.opacity,
                zIndex: (asset.type === 'background' || asset.isBackgroundLayer || asset.category === 'Stock') ? 1 : (idx + 10),
                cursor: asset.isLocked ? 'not-allowed' : isSelected ? 'move' : 'pointer'
              }}
              className="group select-none"
            >
              <div
                className={`relative transition-shadow rounded-xl p-1 bg-transparent ${
                  isSelected 
                    ? 'ring-2 ring-[#2A2529] ring-offset-2 ring-offset-[#F3F0E7] shadow-2xl shadow-[#2A2529]/20' 
                    : 'hover:ring-1 hover:ring-[#2A2529]/40'
                }`}
                style={{
                  width: asset.type === 'text' ? 'auto' : `${asset.width}px`,
                  height: asset.type === 'text' ? 'auto' : `${asset.height}px`,
                  maxWidth: 'none',
                  whiteSpace: 'pre'
                }}
              >
                {asset.type === 'text' ? (
                  <KineticTextCanvas
                    asset={asset}
                    currentTimeSec={(playbackProgress || 0) * (totalDuration || 10)}
                  />
                ) : asset.type === 'svg' ? (
                  <div 
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                    dangerouslySetInnerHTML={{
                      __html: asset.renderSvg
                        ? asset.renderSvg(
                            asset.color || '#3b82f6',
                            asset.borderColor || '#ffffff',
                            asset.borderWidth !== undefined ? asset.borderWidth : 3,
                            asset.hasBorder !== undefined ? asset.hasBorder : false
                          )
                        : ''
                    }}
                  />
                ) : asset.type === 'modular_body_part' ? (
                  <div className="w-full h-full relative pointer-events-none drop-shadow-md">
                    <svg viewBox="0 0 160 190" className="w-full h-full" preserveAspectRatio="none">
                      <path 
                        d={asset.svgPath || 'M 20 15 L 140 15 L 110 180 L 50 180 Z'} 
                        fill={asset.color || '#60A5FA'} 
                        stroke="#FFFFFF" 
                        strokeWidth="3" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    {/* Visual Joint Snap Anchor Dots */}
                    {Array.isArray(asset.snapJoints) && asset.snapJoints.map((j, idx) => (
                      <div 
                        key={idx}
                        className="absolute w-3 h-3 rounded-full bg-white border-2 border-purple-600 shadow-md transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${j.localX * 100}%`, top: `${j.localY * 100}%` }}
                        title={`Joint: ${j.name}`}
                      />
                    ))}
                  </div>
                ) : asset.isSolidColor || (!asset.url && !asset.src) ? (
                  <div 
                    className="w-full h-full rounded-lg pointer-events-none shadow-sm transition-colors"
                    style={{ backgroundColor: asset.color || '#FFFFFF' }}
                  />
                ) : (asset.type === 'video' || (asset.src && asset.src.match(/\.(mp4|webm|mov|ogv)$/i))) ? (
                  <video
                    src={asset.src || asset.url}
                    playsInline
                    muted
                    preload="auto"
                    className="w-full h-full object-contain rounded-lg pointer-events-none shadow-sm"
                    ref={(el) => {
                      if (el) {
                        const safeDuration = Math.max(totalDuration || 10, 1.0);
                        const currentSec = (playbackProgress || 0) * safeDuration;
                        const start = asset.startTimeSec || 0;
                        const duration = asset.duration || 5.0;
                        const end = start + duration;

                        if (isPlaying && currentSec >= start && currentSec <= end) {
                          const offset = currentSec - start;
                          if (el.paused) {
                            el.currentTime = offset;
                            el.play().catch(() => {});
                          } else if (Math.abs(el.currentTime - offset) > 0.15) {
                            el.currentTime = offset;
                          }
                        } else if (!el.paused) {
                          el.pause();
                        }
                      }
                    }}
                    style={{ filter: getCanvasFilterString(asset.filterStyle) }}
                  />
                ) : (
                  <img
                    src={asset.url || asset.src}
                    alt={asset.name}
                    draggable={false}
                    style={{ filter: getCanvasFilterString(asset.filterStyle) }}
                    className="w-full h-full object-contain rounded-lg pointer-events-none select-none"
                  />
                )}



                {isSelected && !asset.isLocked && (
                  <>
                    {/* Top Rotation Knob Handle */}
                    <div
                      onMouseDown={(e) => handleRotateHandleMouseDown(e, asset)}
                      className="absolute -top-9 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#000000] border border-[#FFFFFF] rounded-full shadow-xl cursor-grab active:cursor-grabbing z-50 flex items-center justify-center text-white pointer-events-auto transition-transform hover:scale-125"
                      title="Drag to rotate element"
                    >
                      <RotateCw className="w-3 h-3 text-[#FFFFFF]" />
                    </div>
                    {/* Stem connecting top rotation handle to bounding box */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[1px] h-4 bg-[#FFFFFF] pointer-events-none" />

                    {/* Edge Stretch Handles */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'top')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-[#000000] border border-[#FFFFFF] rounded-sm cursor-ns-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title="Stretch top edge"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'bottom')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-[#000000] border border-[#FFFFFF] rounded-sm cursor-ns-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title="Stretch bottom edge"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'left')}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-6 bg-[#000000] border border-[#FFFFFF] rounded-sm cursor-ew-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title="Stretch left edge"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'right')}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-6 bg-[#000000] border border-[#FFFFFF] rounded-sm cursor-ew-resize z-50 pointer-events-auto hover:scale-125 transition-transform"
                      title="Stretch right edge"
                    />

                    {/* 4 Monochrome Corner Handles */}
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'nw')}
                      className="absolute -top-2 -left-2 w-4 h-4 bg-[#FFFFFF] border border-[#000000] rounded-sm shadow-md cursor-nwse-resize z-50 pointer-events-auto transition-transform hover:scale-125"
                      title="Drag to resize top-left"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'ne')}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-[#FFFFFF] border border-[#000000] rounded-sm shadow-md cursor-nesw-resize z-50 pointer-events-auto transition-transform hover:scale-125"
                      title="Drag to resize top-right"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'sw')}
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#FFFFFF] border border-[#000000] rounded-sm shadow-md cursor-nesw-resize z-50 pointer-events-auto transition-transform hover:scale-125"
                      title="Drag to resize bottom-left"
                    />
                    <div
                      onMouseDown={(e) => handleResizeHandleMouseDown(e, asset, 'se')}
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#FFFFFF] border border-[#000000] rounded-sm shadow-md cursor-nwse-resize z-50 pointer-events-auto transition-transform hover:scale-125"
                      title="Drag to resize bottom-right"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* KANTO TEXT ENGINE TRANSPARENT INTERACTIVE OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '8000px',
            height: '8000px',
            zIndex: 1050,
          }}
        >
          <KantoTextOverlay
            currentTimeSec={(playbackProgress || 0) * (totalDuration || 10)}
            totalDurationSec={totalDuration || 10}
            isPlaying={isPlaying}
            sceneWidth={8000}
            sceneHeight={8000}
            interactive={!isPanMode}
            onSelectLayer={(layerId) => {
              if (layerId) {
                onSelectAsset(layerId);
                onSelectCamera(false);
              }
              if (onSelectTextLayer) onSelectTextLayer(layerId);
            }}
          />
        </div>

        {/* LAYER 2: INTERACTIVE CAMERA VIEWFINDER FRAME */}
        {(() => {
          let camX = typeof camera.x === 'number' && Number.isFinite(camera.x) ? camera.x : 0;
          let camY = typeof camera.y === 'number' && Number.isFinite(camera.y) ? camera.y : 0;

          if (camera.motionPath && camera.motionPath.isPathEnabled) {
            try {
              const currentSec = (playbackProgress || 0) * (totalDuration || 10);
              const clipDuration = Math.max(0.0001, camera.duration || (totalDuration || 10));

              const evaluated = evaluateMotionPathAtTime(
                camera.motionPath,
                camera.startTimeSec || 0,
                clipDuration,
                currentSec
              );

              if (evaluated && Number.isFinite(evaluated.x) && Number.isFinite(evaluated.y) && !isNaN(evaluated.x) && !isNaN(evaluated.y)) {
                const halfW = ((camera.width || 270) * (camera.scale || 1)) / 2;
                const halfH = ((camera.height || 480) * (camera.scale || 1)) / 2;
                camX = evaluated.x - halfW;
                camY = evaluated.y - halfH;
              }
            } catch (err) {
              console.error("Camera Motion Path Evaluation Error:", err);
            }
          }

          return (
            <div
              ref={viewfinderRef}
              onMouseDown={handleCameraPointerDown}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: `${camX}px`,
                top: `${camY}px`,
                width: `${(camera.width || 270) * (camera.scale || 1)}px`,
                height: `${(camera.height || 480) * (camera.scale || 1)}px`,
                zIndex: 2000,
                cursor: camera.isLocked ? 'default' : 'move'
              }}
              className="group select-none"
            >
              <div
                className={`w-full h-full relative rounded-xl border-2 transition-all ${
                  isCameraSelected 
                    ? 'border-[#2A2529] ring-4 ring-[#2A2529]/20 shadow-2xl bg-[#2A2529]/5' 
                    : 'border-[#2A2529]/80 shadow-xl bg-[#2A2529]/5 hover:border-[#2A2529]'
                }`}
              >
                {/* Rule of Thirds Overlay Grid */}
                {camera.showGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-[#2A2529]/30" />
                    <div className="border-r border-b border-[#2A2529]/30" />
                    <div className="border-b border-[#2A2529]/30" />
                    <div className="border-r border-b border-[#2A2529]/30" />
                    <div className="border-r border-b border-[#2A2529]/30" />
                    <div className="border-b border-[#2A2529]/30" />
                    <div className="border-r border-b border-[#2A2529]/30" />
                    <div className="border-r border-b border-[#2A2529]/30" />
                    <div className="" />
                  </div>
                )}

                {/* Center Crosshair Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-px bg-[#2A2529]/60" />
                  <div className="h-4 w-px bg-[#2A2529]/60 absolute" />
                </div>

                {/* 4 Corner L-Bracket Guides */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#2A2529] pointer-events-none" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#2A2529] pointer-events-none" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#2A2529] pointer-events-none" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#2A2529] pointer-events-none" />
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
