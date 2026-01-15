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
  const [tempo, setTempo] = useState(1); // 1 = 100% speed

  // Keep elements synced via properties imperatively
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.experimentalSetupAlg = experimentalSetupAlg;
    }
  }, [experimentalSetupAlg]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.alg = alg;
      setIsPlaying(false); // Reset playing status when new algorithm is applied
    }
  }, [alg]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.tempo = tempo;
    }
  }, [tempo]);

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

  const handleStepForward = () => {
    if (playerRef.current) {
      playerRef.current.stepForward();
    }
  };

  const handleStepBackward = () => {
    if (playerRef.current) {
      playerRef.current.stepBackward();
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

  const handleTempoChange = (e) => {
    const newTempo = parseFloat(e.target.value);
    setTempo(newTempo);
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
          <button 
            className="btn btn-secondary btn-ctrl" 
            onClick={handleStepBackward} 
            title="Step Backward"
            disabled={!alg}
          >
            ⏮️
          </button>
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
            onClick={handleStepForward} 
            title="Step Forward"
            disabled={!alg}
          >
            ⏭️
          </button>
          <button 
            className="btn btn-secondary btn-ctrl" 
            onClick={handleReset} 
            title="Reset Playback"
            disabled={!alg}
          >
            🔄 Reset
          </button>
        </div>

        <div className="speed-slider-container">
          <label htmlFor="speed-slider">Speed: {Math.round(tempo * 100)}%</label>
          <input
            id="speed-slider"
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={tempo}
            onChange={handleTempoChange}
            className="speed-slider"
          />
        </div>
      </div>
    </div>
  );
}
