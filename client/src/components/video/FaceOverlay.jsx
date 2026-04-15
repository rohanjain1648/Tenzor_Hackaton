import React from 'react';

export default function FaceOverlay({ detection }) {
  if (!detection) return null;

  const { box, age, dims } = detection;
  
  // Detection box is relative to video element
  // We'll trust the parent renders this overlay accurately over the video
  
  const widthPercent = (box.width / dims.width) * 100;
  const heightPercent = (box.height / dims.height) * 100;
  const leftPercent = (box.x / dims.width) * 100;
  const topPercent = (box.y / dims.height) * 100;

  return (
    <div style={{
      position: 'absolute',
      border: '2px solid var(--color-accent-2)',
      borderRadius: '4px',
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      pointerEvents: 'none',
      zIndex: 5,
      boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
    }}>
      <div style={{
        position: 'absolute',
        top: '-25px',
        left: '0',
        background: 'var(--color-accent-2)',
        color: 'white',
        fontSize: '0.7rem',
        padding: '2px 6px',
        borderRadius: '2px',
        whiteSpace: 'nowrap'
      }}>
        FACE DETECTED • AGED {Math.round(age)}
      </div>
    </div>
  );
}
