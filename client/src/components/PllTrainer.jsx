import React, { useState, useEffect, useRef } from 'react';
import './PllTrainer.css';

const API_BASE = import.meta.env.VITE_API_URL;

// Helper to compute AoN (Average of N)
function computeAoN(times, n) {
  if (times.length < n) return null;
  const subset = times.slice(0, n);
  const min = Math.min(...subset);
  const max = Math.max(...subset);
  const sum = subset.reduce((acc, val) => acc + val, 0);
  return Math.round((sum - min - max) / (n - 2));
}

// Get statistics for a specific PLL case from localStorage
const getLocalStats = (caseId) => {
  const localDataStr = localStorage.getItem(`pll_solves_${caseId}`);
  const solves = localDataStr ? JSON.parse(localDataStr) : [];
  solves.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (solves.length === 0) {
    return {
      totalSolves: 0,
      pb: null,
      ao5: null,
      ao12: null,
      recent: []
    };
  }

  const times = solves.map(s => s.timeMs);
  const pb = Math.min(...times);
  const ao5 = computeAoN(times, 5);
  const ao12 = computeAoN(times, 12);

  return {
    totalSolves: solves.length,
    pb,
    ao5,
    ao12,
    recent: solves.slice(0, 10)
  };
};

// Save a practice solve time locally
const saveLocalSolve = (caseId, timeMs) => {
  const localDataStr = localStorage.getItem(`pll_solves_${caseId}`);
  const solves = localDataStr ? JSON.parse(localDataStr) : [];

  const newSolve = {
    id: 'solve_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    timeMs,
    date: new Date().toISOString()
  };

  solves.push(newSolve);
  localStorage.setItem(`pll_solves_${caseId}`, JSON.stringify(solves));
};

// Reset local history/stats
const deleteLocalStats = (caseId) => {
  localStorage.removeItem(`pll_solves_${caseId}`);
};

export default function PllTrainer({ onApplySetupAlg, onClearPlayAlg }) {
  const [pllCases, setPllCases] = useState([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState(new Set());
  const [currentCase, setCurrentCase] = useState(null);
  const [timerState, setTimerState] = useState('idle');
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerStateRef = useRef('idle');
  const readyTimeoutRef = useRef(null);

  const updateTimerState = (newState) => {
    setTimerState(newState);
    timerStateRef.current = newState;
  };

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
    const data = getLocalStats(caseId);
    setStats(data);
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
    updateTimerState('idle');
    setTime(0);

    // Apply the scramble setup directly to the 3D cube
    onApplySetupAlg(randomCase.scramble, randomCase.preferredAlg);
  };

  // Speedcubing Spacebar Timer Engine
  useEffect(() => {
    if (!currentCase) return;

    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (e.repeat) return;

      const currentState = timerStateRef.current;

      if (currentState === 'running') {
        stopTimer();
      } else if (currentState === 'idle' || currentState === 'stopped') {
        updateTimerState('preparing');

        readyTimeoutRef.current = setTimeout(() => {
          if (timerStateRef.current === 'preparing') {
            updateTimerState('ready');
          }
        }, 300);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();

      const currentState = timerStateRef.current;

      if (currentState === 'preparing') {
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
        updateTimerState('idle');
      } else if (currentState === 'ready') {
        startTimer();
      }
    };

    const handleGlobalKeyDown = (e) => {
      if (e.code === 'Space') return;
      if (timerStateRef.current === 'running') {
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
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
    };
  }, [currentCase]);

  // Click timer box to start/stop (friendly for mouse/touch users)
  const handleTimerBoxClick = () => {
    if (!currentCase) return;
    if (timerStateRef.current === 'running') {
      stopTimer();
    } else if (timerStateRef.current === 'idle' || timerStateRef.current === 'stopped') {
      startTimer();
    }
  };

  const startTimer = () => {
    setTime(0);
    updateTimerState('running');
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current);
    }, 10);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    const finalTime = Date.now() - startTimeRef.current;
    setTime(finalTime);
    updateTimerState('stopped');

    onClearPlayAlg();

    saveLocalSolve(currentCase._id, finalTime);
    fetchStats(currentCase._id);
  };

  // Reset case stats
  const handleResetStats = () => {
    if (!currentCase) return;
    if (window.confirm(`Are you sure you want to clear all history for ${currentCase.name}?`)) {
      deleteLocalStats(currentCase._id);
      fetchStats(currentCase._id);
    }
  };

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
                <div className="case-moves-info">
                  <div className="move-info-item">
                    <span className="move-info-label">Setup (Scramble):</span>
                    <div className="alg-display code font-mono scramble-display">
                      {currentCase.scramble}
                    </div>
                  </div>
                  <div className="move-info-item">
                    <span className="move-info-label">Preferred Algorithm:</span>
                    <div className="alg-display code font-mono solution-display">
                      {currentCase.preferredAlg}
                    </div>
                  </div>
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
