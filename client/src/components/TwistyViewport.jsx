import React, { useEffect, useRef, useState } from 'react';
import 'cubing/twisty';
import './TwistyViewport.css';

export default function TwistyViewport({ 
  experimentalSetupAlg = '', 
  alg = '', 
  onMoveComplete 
}) {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep elements synced via properties imperatively in a single unified effect
  // to prevent desynchronization or WebGL animation hangs during rapid updates.
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (err) {
        console.warn("Failed to pause twisty player:", err);
      }
      playerRef.current.experimentalSetupAlg = experimentalSetupAlg;
      playerRef.current.alg = alg;
      try {
        playerRef.current.timestamp = 0; // Force timeline back to start of the scramble
      } catch (err) {
        console.warn("Failed to reset twisty player timeline:", err);
      }
      setIsPlaying(false); // Reset playing status when new configuration is applied
    }
  }, [experimentalSetupAlg, alg]);

  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    if (playerRef.current) {
      // Jumps back to the start of the current algorithm (scramble or custom state)
      playerRef.current.timestamp = 0;
      playerRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="twisty-viewport-container">
      {/* 3D Viewport wrapper */}
      <div className="twisty-player-wrapper">
        <twisty-player
          ref={playerRef}
          puzzle="3x3x3"
          control-panel="none"
          background="none"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <div className="controls-row">
          {isPlaying ? (
            <button 
              className="btn btn-primary btn-ctrl btn-play-pause" 
              onClick={handlePause} 
              title="Pause"
              disabled={!alg}
            >
              ⏸️ Pause
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-ctrl btn-play-pause" 
              onClick={handlePlay} 
              title="Play"
              disabled={!alg}
            >
              ▶️ Play
            </button>
          )}
          <button 
            className="btn btn-secondary btn-ctrl" 
            onClick={handleReset} 
            title="Reset Playback"
            disabled={!alg}
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  );
}
