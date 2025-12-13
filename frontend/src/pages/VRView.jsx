import React from "react";

// Add A-Frame via CDN in public/index.html if not already:
// <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>

export default function VR360Modal({ imageUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        className="absolute top-4 right-4 px-3 py-1 bg-white text-black rounded"
        onClick={onClose}
      >
        Close VR
      </button>
      <div style={{ width: "90vw", height: "90vh" }}>
        <a-scene embedded vr-mode-ui="enabled: true">
          <a-sky src={imageUrl} rotation="0 -130 0"></a-sky>
          <a-entity camera look-controls wasd-controls position="0 1.6 0"></a-entity>
        </a-scene>
      </div>
    </div>
  );
}