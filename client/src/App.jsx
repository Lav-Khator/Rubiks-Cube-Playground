import React, { useState, useEffect } from 'react';
import Cube from 'cubejs';
import TwistyViewport from './components/TwistyViewport';
import CubeNet from './components/CubeNet';
import PllTrainer from './components/PllTrainer';
import { 
  initSolver, 
  validateAndConvertNet, 
  solveCube 
} from './utils/cubeSolver';
import './App.css';

// Helper to invert algorithm moves
function inverseAlg(algString) {
  if (!algString) return '';
  const moves = algString.trim().split(/\s+/);
  const invertMove = (move) => {
    if (move.endsWith("'")) {
      return move.slice(0, -1);
    } else if (move.endsWith('2')) {
      return move;
    } else {
      return move + "'";
    }
  };
  return moves.reverse().map(invertMove).join(' ');
}

const DEFAULT_NET = {
  U: Array(9).fill('W'),
  L: Array(9).fill('O'),
  F: Array(9).fill('G'),
  R: Array(9).fill('R'),
  B: Array(9).fill('B'),
  D: Array(9).fill('Y')
};

export default function App() {
  const [solverStatus, setSolverStatus] = useState('initializing'); // 'initializing' | 'ready' | 'error'
  const [cubeStatus, setCubeStatus] = useState('Solved'); // 'Solved' | 'Scrambled' | 'Custom' | 'Solving'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Main tabs: 'playground' | 'pll-trainer'
  const [mainTab, setMainTab] = useState('playground');

  // Tab control inside playground: 'controls' | 'custom-colors'
  const [activeTab, setActiveTab] = useState('controls');
  const [setupAlg, setSetupAlg] = useState('');
  const [playAlg, setPlayAlg] = useState('');
  const [manualScramble, setManualScramble] = useState('');

  // 2D Net state
  const [netState, setNetState] = useState(DEFAULT_NET);

  // Solution log
  const [solution, setSolution] = useState(null);

  // Load Kociemba tables on startup
  useEffect(() => {
    initSolver()
      .then(() => {
        setSolverStatus('ready');
      })
      .catch((err) => {
        console.error("Solver init failed:", err);
        setSolverStatus('error');
        setErrorMessage("Failed to load solver tables. Please reload.");
      });
  }, []);

  // Compute facelet string from setup and play algs
  const getFaceletString = (setup, play) => {
    const temp = new Cube();
    if (setup) temp.move(setup);
    if (play) temp.move(play);
    return temp.asString();
  };

  // Convert current cube state to Net Colors
  const syncNetColors = (setup, play) => {
    try {
      const facelets = getFaceletString(setup, play);
      const faceToColor = {
        'U': netState.U[4],
        'R': netState.R[4],
        'F': netState.F[4],
        'D': netState.D[4],
        'L': netState.L[4],
        'B': netState.B[4]
      };
      
      const newNet = {
        U: Array(9).fill(null).map((_, i) => faceToColor[facelets[0 + i]]),
        R: Array(9).fill(null).map((_, i) => faceToColor[facelets[9 + i]]),
        F: Array(9).fill(null).map((_, i) => faceToColor[facelets[18 + i]]),
        D: Array(9).fill(null).map((_, i) => faceToColor[facelets[27 + i]]),
        L: Array(9).fill(null).map((_, i) => faceToColor[facelets[36 + i]]),
        B: Array(9).fill(null).map((_, i) => faceToColor[facelets[45 + i]])
      };

      setNetState(newNet);
    } catch (err) {
      console.error("Failed to sync net colors:", err);
    }
  };

  // Apply scramble
  const applyScrambleStr = (scrambleStr) => {
    if (!scrambleStr.trim()) return;
    setErrorMessage('');
    try {
      // Validate that it is a valid move string using cubejs
      const temp = new Cube();
      temp.move(scrambleStr);

      setSetupAlg(scrambleStr);
      setPlayAlg('');
      setSolution(null);
      setCubeStatus('Scrambled');
      syncNetColors(scrambleStr, '');
    } catch (err) {
      setErrorMessage("Invalid scramble moves detected. Double-check move notation.");
    }
  };

  // Generate WCA scramble
  const handleRandomScramble = () => {
    const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
    const SUFFIXES = ['', "'", '2'];
    const scrambleMoves = [];
    
    let lastFace = null;
    let secondLastFace = null;
    
    const count = 20 + Math.floor(Math.random() * 6); // 20-25 moves
    for (let i = 0; i < count; i++) {
      let face;
      do {
        face = FACES[Math.floor(Math.random() * FACES.length)];
      } while (
        face === lastFace ||
        (face === secondLastFace && (
          (face === 'U' && lastFace === 'D') || (face === 'D' && lastFace === 'U') ||
          (face === 'L' && lastFace === 'R') || (face === 'R' && lastFace === 'L') ||
          (face === 'F' && lastFace === 'B') || (face === 'B' && lastFace === 'F')
        ))
      );
      const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      scrambleMoves.push(face + suffix);
      secondLastFace = lastFace;
      lastFace = face;
    }

    const scrambleStr = scrambleMoves.join(' ');
    setManualScramble(scrambleStr);
    applyScrambleStr(scrambleStr);
  };

  // Handle manual move pad presses
  const handleManualMove = (move) => {
    const currentSetup = playAlg 
      ? (setupAlg ? `${setupAlg} ${playAlg}` : playAlg)
      : setupAlg;
    
    const newSetup = currentSetup ? `${currentSetup} ${move}` : move;
    setSetupAlg(newSetup);
    setPlayAlg('');
    setSolution(null);
    if (cubeStatus === 'Solved') {
      setCubeStatus('Scrambled');
    }
    syncNetColors(newSetup, '');
  };

  // Reset to solved state
  const handleResetToSolved = () => {
    setSetupAlg('');
    setPlayAlg('');
    setSolution(null);
    setErrorMessage('');
    setCubeStatus('Solved');
    setNetState(DEFAULT_NET);
  };

  // Reset Net only
  const handleResetNetOnly = () => {
    setNetState(DEFAULT_NET);
  };

  // Apply Net coloring to 3D cube
  const handleApplyNetToCube = async () => {
    setErrorMessage('');
    try {
      const faceletString = validateAndConvertNet(netState);
      
      // Verify solvability using solver
      setCubeStatus('Solving');
      const sol = await solveCube(faceletString, 5000);
      
      // If solvable, apply inverse solution as setup
      const setup = inverseAlg(sol);
      setSetupAlg(setup);
      setPlayAlg('');
      setSolution(null);
      setCubeStatus('Custom');
      setActiveTab('controls'); // Switch back to see playback
    } catch (err) {
      setCubeStatus('Custom');
      setErrorMessage(err.message || "This isn't a solvable cube state — double check your colors.");
    }
  };

  // Solve current state
  const handleSolve = async () => {
    if (solverStatus !== 'ready') return;
    setErrorMessage('');
    
    // First commit any manual moves to the setup
    const currentSetup = playAlg 
      ? (setupAlg ? `${setupAlg} ${playAlg}` : playAlg)
      : setupAlg;
    
    setSetupAlg(currentSetup);
    setPlayAlg('');

    const faceletString = getFaceletString(currentSetup, '');
    
    setCubeStatus('Solving');
    try {
      const sol = await solveCube(faceletString, 5000);
      setSolution(sol);
      setPlayAlg(sol);
      setCubeStatus('Solved');
    } catch (err) {
      setCubeStatus('Scrambled');
      setErrorMessage(err.message || "Failed to solve cube.");
    }
  };

  // Render buttons helper
  const renderMoveButton = (move) => (
    <button 
      key={move} 
      className="btn btn-secondary btn-move" 
      onClick={() => handleManualMove(move)}
    >
      {move}
    </button>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title-section">
          <h1 className="gradient-text">3D Rubik's Cube Playground</h1>
          <div className="status-badge" data-status={cubeStatus}>
            Status: {cubeStatus}
          </div>
        </div>
        <div className="main-tabs">
          <button 
            className={`main-tab-btn ${mainTab === 'playground' ? 'active' : ''}`}
            onClick={() => {
              setMainTab('playground');
              handleResetToSolved();
            }}
          >
            🧩 Playground & Solver
          </button>
          <button 
            className={`main-tab-btn ${mainTab === 'pll-trainer' ? 'active' : ''}`}
            onClick={() => {
              setMainTab('pll-trainer');
              handleResetToSolved();
            }}
          >
            🏆 PLL Trainer
          </button>
        </div>
      </header>

      {solverStatus === 'initializing' && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <h2>Preparing Solver Tables...</h2>
          <p>This takes a moment on first load to optimize Kociemba lookup tables.</p>
        </div>
      )}

      {errorMessage && (
        <div className="error-banner">
          ⚠️ {errorMessage}
        </div>
      )}

      <main className="app-main">
        {/* Left Side: 3D Viewport */}
        <section className="viewport-section">
          <TwistyViewport 
            experimentalSetupAlg={setupAlg}
            alg={playAlg}
          />
        </section>

        {/* Right Side: Control Panels */}
        <section className="control-section card">
          {mainTab === 'playground' ? (
            <>
              <div className="tabs-header">
                <button 
                  className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('controls');
                    handleResetToSolved();
                  }}
                >
                  🎮 Solver & Manual
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'custom-colors' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('custom-colors');
                    handleResetToSolved();
                  }}
                >
                  🎨 Custom Colors (2D Net)
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'controls' ? (
                  <div className="controls-tab-content">
                    {/* Scramble Actions */}
                    <div className="panel-group">
                      <h3>Scramble & Setup</h3>
                      <div className="scramble-controls">
                        <button className="btn btn-primary" onClick={handleRandomScramble}>
                          🎰 WCA Scramble
                        </button>
                        <div className="scramble-input-group">
                          <input 
                            type="text" 
                            placeholder="Enter scramble string (e.g. R U' F2...)" 
                            value={manualScramble}
                            onChange={(e) => setManualScramble(e.target.value)}
                            className="text-input"
                          />
                          <button className="btn btn-secondary" onClick={() => applyScrambleStr(manualScramble)}>
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Manual Move Pad */}
                    <div className="panel-group">
                      <h3>Manual Twist Pad</h3>
                      <div className="move-pad">
                        {['U', "U'", 'U2', 'D', "D'", 'D2'].map(renderMoveButton)}
                        {['L', "L'", 'L2', 'R', "R'", 'R2'].map(renderMoveButton)}
                        {['F', "F'", 'F2', 'B', "B'", 'B2'].map(renderMoveButton)}
                      </div>
                    </div>

                    {/* Solving Action */}
                    <div className="panel-group solver-actions">
                      <button 
                        className="btn btn-success btn-solve" 
                        onClick={handleSolve}
                        disabled={solverStatus !== 'ready' || cubeStatus === 'Solving'}
                      >
                        🚀 Solve Cube
                      </button>
                      <button className="btn btn-danger" onClick={handleResetToSolved}>
                        Reset to Solved
                      </button>
                    </div>

                    {/* Solution Log */}
                    {solution !== null && (
                      <div className="solution-log panel-group">
                        <h3>Solution Details</h3>
                        <div className="solution-info">
                          <div className="info-item">
                            <strong>Moves:</strong> <span>{solution ? solution.split(' ').length : 0}</span>
                          </div>
                          <div className="info-item">
                            <strong>Moves Sequence:</strong>
                            <div className="move-sequence">{solution || 'Already solved!'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <CubeNet 
                    netState={netState}
                    onChangeNetState={setNetState}
                    onApplyToCube={handleApplyNetToCube}
                    onResetToSolved={handleResetNetOnly}
                  />
                )}
              </div>
            </>
          ) : (
            <PllTrainer
              onApplySetupAlg={(scramble, preferredAlg) => {
                setSetupAlg(scramble);
                setPlayAlg(preferredAlg || '');
                setSolution(null);
                setCubeStatus('Custom');
              }}
              onClearPlayAlg={() => {
                handleResetToSolved();
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}
