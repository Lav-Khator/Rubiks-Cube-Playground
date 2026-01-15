import React, { useState, useEffect, useRef } from 'react';
import './PllTrainer.css';

const API_BASE = 'http://localhost:5000/api';

export default function PllTrainer({ onApplySetupAlg, onClearPlayAlg }) {
  const [pllCases, setPllCases] = useState([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set());
  const [currentCase, setCurrentCase] = useState(null);
  const [showAlg, setShowAlg] = useState(false);

  // Timer states: 'idle' | 'preparing' | 'ready' | 'running' | 'stopped'
  const [timerState, setTimerState] = useState('idle');
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const spacePressedTimeRef = useRef(null);

  // Statistics
  const [stats, setStats] = useState({
    totalSolves: 0,
    pb: null,
    ao5: null,
    ao12: null,
    recent: []
  });

  // Fetch all PLL cases
  useEffect(() => {
    fetch(`${API_BASE}/pll`)
      .then(res => res.json())
      .then(data => {
        setPllCases(data);
        // Default to all selected
        setSelectedCaseIds(new Set(data.map(c => c._id)));
      })
      .catch(err => console.error("Failed to load PLL cases:", err));
  }, []);

  // Fetch stats when currentCase changes
  useEffect(() => {
    if (currentCase) {
      fetchStats(currentCase._id);
    }
  }, [currentCase]);

  const fetchStats = (caseId) => {
    fetch(`${API_BASE}/pll/stats/${caseId}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Failed to fetch stats:", err));
  };

  // Checkbox handlers
  const handleToggleCase = (id) => {
    const next = new Set(selectedCaseIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCaseIds(next);
  };

  const handleSelectAll = () => {
    setSelectedCaseIds(new Set(pllCases.map(c => c._id)));
  };

  const handleSelectNone = () => {
    setSelectedCaseIds(new Set());
  };

  // Generate training scramble
  const handleNextScramble = () => {
    if (selectedCaseIds.size === 0) {
      alert("Please select at least one PLL case to practice!");
      return;
    }

    const pool = pllCases.filter(c => selectedCaseIds.has(c._id));
    const randomCase = pool[Math.floor(Math.random() * pool.length)];
    
    setCurrentCase(randomCase);
    setShowAlg(false);
    setTimerState('idle');
    setTime(0);

    // Apply the scramble setup directly to the 3D cube
    onApplySetupAlg(randomCase.scramble);
  };

  // Speedcubing Spacebar Timer Engine
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space' || !currentCase) return;
      e.preventDefault();

      if (timerState === 'running') {
        // Stop timer
        stopTimer();
      } else if (timerState === 'idle' || timerState === 'stopped') {
        // Preparing timer (turns red)
        if (!spacePressedTimeRef.current) {
          spacePressedTimeRef.current = Date.now();
          setTimerState('preparing');
          
          // Check if spacebar is held down for >300ms to be "Ready" (turns green)
          timerRef.current = setInterval(() => {
            if (spacePressedTimeRef.current && Date.now() - spacePressedTimeRef.current >= 300) {
              setTimerState('ready');
              clearInterval(timerRef.current);
            }
          }, 50);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code !== 'Space' || !currentCase) return;
      e.preventDefault();

      if (timerState === 'preparing') {
        // Space released too quickly -> reset to idle
        clearInterval(timerRef.current);
        spacePressedTimeRef.current = null;
        setTimerState('idle');
      } else if (timerState === 'ready') {
        // Space released after ready hold -> start timer!
        spacePressedTimeRef.current = null;
        startTimer();
      }
    };

    // Any key (excluding Space) stops the timer if it's running
    const handleGlobalKeyDown = (e) => {
      if (e.code === 'Space') return;
      if (timerState === 'running') {
        stopTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearInterval(timerRef.current);
    };
  }, [timerState, currentCase]);

  // Click timer box to start/stop (friendly for mouse/touch users)
  const handleTimerBoxClick = () => {
    if (!currentCase) return;
    if (timerState === 'running') {
      stopTimer();
    } else if (timerState === 'idle' || timerState === 'stopped') {
      // Direct instant start on click
      startTimer();
    }
  };

  const startTimer = () => {
    setTime(0);
    setTimerState('running');
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current);
    }, 10);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    const finalTime = Date.now() - startTimeRef.current;
    setTime(finalTime);
    setTimerState('stopped');

    // On solve, clear the play/setup algs so the cube returns solved!
    onClearPlayAlg();

    // Post statistics solve time to backend
    fetch(`${API_BASE}/pll/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pllCaseId: currentCase._id, timeMs: finalTime })
    })
      .then(res => res.json())
      .then(() => fetchStats(currentCase._id))
      .catch(err => console.error("Failed to save time:", err));
  };

  // Reset case stats
  const handleResetStats = () => {
    if (!currentCase) return;
    if (window.confirm(`Are you sure you want to clear all history for ${currentCase.name}?`)) {
      fetch(`${API_BASE}/pll/stats/${currentCase._id}`, { method: 'DELETE' })
        .then(() => fetchStats(currentCase._id))
        .catch(err => console.error("Failed to reset stats:", err));
    }
  };

  // Helper formatting milliseconds -> seconds (e.g. 12.34s)
  const formatTime = (ms) => {
    return (ms / 1000).toFixed(2);
  };

  // Group cases
  const groupedCases = pllCases.reduce((acc, c) => {
    acc[c.group] = acc[c.group] || [];
    acc[c.group].push(c);
    return acc;
  }, {});

  return (
    <div className="pll-trainer-container">
      <div className="trainer-layout">
        
        {/* Left Side: Case checklist & Pool selector */}
        <div className="case-selection-panel">
          <div className="panel-header-actions">
            <h3>PLL Cases Practice Pool</h3>
            <div className="selection-quick-btns">
              <button className="btn btn-secondary btn-xs" onClick={handleSelectAll}>Select All</button>
              <button className="btn btn-secondary btn-xs" onClick={handleSelectNone}>Clear</button>
            </div>
          </div>

          <div className="case-groups-list">
            {Object.keys(groupedCases).map(groupName => (
              <div key={groupName} className="case-group-section">
                <h4>{groupName}</h4>
                <div className="case-checklist-grid">
                  {groupedCases[groupName].map(cCase => (
                    <label key={cCase._id} className="case-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedCaseIds.has(cCase._id)}
                        onChange={() => handleToggleCase(cCase._id)}
                      />
                      <span className="case-check-name">{cCase.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Trainer, Timer & Statistics */}
        <div className="timer-stats-panel">
          {/* Active Case Controller */}
          <div className="active-case-header">
            {currentCase ? (
              <div className="active-case-details">
                <div className="case-meta">
                  <span className="case-name">{currentCase.name}</span>
                  <span className="case-group-badge">{currentCase.group}</span>
                </div>
                <div className="alg-toggle-box">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAlg(!showAlg)}>
                    {showAlg ? '🙈 Hide Alg' : '👁️ Show Alg'}
                  </button>
                  {showAlg && (
                    <div className="alg-display code font-mono">
                      {currentCase.preferredAlg}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-active-case">
                Select cases on the left and generate a scramble to start practicing.
              </div>
            )}
            <button className="btn btn-primary btn-scramble-next" onClick={handleNextScramble}>
              🎯 Next Scramble
            </button>
          </div>

          {/* Speedcubing Timer Box */}
          <div 
            className={`timer-display-box timer-state-${timerState}`}
            onClick={handleTimerBoxClick}
          >
            <div className="timer-clock">
              {formatTime(time)}s
            </div>
            <div className="timer-instructions">
              {timerState === 'idle' && "Hold [SPACEBAR] until green, then release to start. (Or click here)"}
              {timerState === 'preparing' && "Keep holding..."}
              {timerState === 'ready' && "RELEASE NOW TO START!"}
              {timerState === 'running' && "PRESS ANY KEY OR CLICK TO STOP"}
              {timerState === 'stopped' && "Solve saved! Hold [SPACEBAR] to ready again."}
            </div>
          </div>

          {/* Stats Dashboard */}
          {currentCase && (
            <div className="stats-dashboard panel-group">
              <div className="stats-header">
                <h3>{currentCase.name} Stats</h3>
                {stats.totalSolves > 0 && (
                  <button className="btn btn-danger btn-xs" onClick={handleResetStats}>Reset Stats</button>
                )}
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">Solves</span>
                  <span className="metric-value font-mono">{stats.totalSolves}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Best PB</span>
                  <span className="metric-value font-mono text-emerald">
                    {stats.pb ? `${formatTime(stats.pb)}s` : '-'}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Avg of 5 (Ao5)</span>
                  <span className="metric-value font-mono text-cyan">
                    {stats.ao5 ? `${formatTime(stats.ao5)}s` : '-'}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Avg of 12 (Ao12)</span>
                  <span className="metric-value font-mono text-cyan">
                    {stats.ao12 ? `${formatTime(stats.ao12)}s` : '-'}
                  </span>
                </div>
              </div>

              {/* History list */}
              {stats.recent.length > 0 && (
                <div className="recent-solves-list">
                  <h4>Recent Practice Solves</h4>
                  <div className="recent-list-row font-mono">
                    {stats.recent.map((s, idx) => (
                      <span key={s.id} className="recent-time-badge">
                        #{stats.totalSolves - idx}: <strong>{formatTime(s.timeMs)}s</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
