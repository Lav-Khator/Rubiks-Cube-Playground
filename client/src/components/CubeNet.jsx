import React, { useState, useEffect } from 'react';
import './CubeNet.css';

const DEFAULT_COLORS = {
  W: '#ffffff',
  Y: '#ffd700',
  R: '#d10000',
  O: '#ff6b00',
  B: '#0045ad',
  G: '#009b48'
};

const COLOR_NAMES = {
  W: 'White',
  Y: 'Yellow',
  R: 'Red',
  O: 'Orange',
  B: 'Blue',
  G: 'Green'
};

export default function CubeNet({ netState, onChangeNetState, onApplyToCube, onResetToSolved }) {
  const [selectedColor, setSelectedColor] = useState('W');
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Stop painting when mouse is released anywhere
  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleStickerPaint = (face, index) => {
    // Centers should not be painted directly if it changes the face coordinates, 
    // but the prompt says: "User picks a color from a 6-color palette (W/Y/R/O/B/G) and clicks/drags to paint stickers there."
    // So we allow painting any sticker, including centers.
    const newFaceState = [...netState[face]];
    newFaceState[index] = selectedColor;
    
    onChangeNetState({
      ...netState,
      [face]: newFaceState
    });
  };

  const handleMouseDown = (face, index) => {
    setIsMouseDown(true);
    handleStickerPaint(face, index);
  };

  const handleMouseEnter = (face, index) => {
    if (isMouseDown) {
      handleStickerPaint(face, index);
    }
  };


  const renderFace = (faceName) => {
    const stickers = netState[faceName];
    return (
      <div className={`cube-face-net face-${faceName}`}>
        <span className="face-label">{faceName}</span>
        <div className="face-grid">
          {stickers.map((color, index) => (
            <div
              key={index}
              className="sticker"
              style={{ backgroundColor: DEFAULT_COLORS[color] }}
              onMouseDown={() => handleMouseDown(faceName, index)}
              onMouseEnter={() => handleMouseEnter(faceName, index)}
              title={`${faceName} face, sticker ${index + 1}: ${COLOR_NAMES[color]}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="cube-net-container">
      <h3>2D Unfolded Net Editor</h3>
      <p className="help-text">Select a color, then click or click-and-drag to paint the stickers. Face centers define the face's identity.</p>

      {/* Color Palette */}
      <div className="palette">
        {Object.keys(DEFAULT_COLORS).map((cKey) => (
          <button
            key={cKey}
            className={`palette-color ${selectedColor === cKey ? 'active' : ''}`}
            style={{ '--color-val': DEFAULT_COLORS[cKey] }}
            onClick={() => setSelectedColor(cKey)}
            title={`Select ${COLOR_NAMES[cKey]}`}
          >
            <span className="palette-label">{cKey}</span>
          </button>
        ))}
      </div>

      {/* The Unfolded Net Layout */}
      <div className="net-layout">
        {renderFace('U')}
        <div className="middle-faces">
          {renderFace('L')}
          {renderFace('F')}
          {renderFace('R')}
          {renderFace('B')}
        </div>
        {renderFace('D')}
      </div>

      {/* Controls */}
      <div className="net-controls">
        <button className="btn btn-secondary" onClick={onResetToSolved}>Reset Net to Solved</button>
        <button className="btn btn-primary btn-apply" onClick={onApplyToCube}>Apply to 3D Cube</button>
      </div>
    </div>
  );
}
