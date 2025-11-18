import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Clock, Home, ArrowLeft, BarChart3 } from 'lucide-react';
import Navbar from './components/Navbar';

// ==================== BACK BUTTON COMPONENT ====================
const BackButton = ({ onClick }) => (
  <button className="btn" onClick={onClick} style={{ marginBottom: '1.5rem', background: 'transparent', color: '#4f46e5', padding: '0.5rem' }}>
    <ArrowLeft size={20} /> Back to Home
  </button>
);

// ==================== FEATURE CARD COMPONENT ====================
const FeatureCard = ({ icon: Icon, title, description, onClick, disabled = false }) => (
  <div 
    className={`feature-card ${disabled ? 'disabled' : ''}`}
    onClick={!disabled ? onClick : undefined}
    style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <div className="feature-icon">
      <Icon size={32} />
    </div>
    <h3>{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
);

// ==================== HOME PAGE COMPONENT ====================
const HomePage = ({ setCurrentView }) => {
  const featuresRef = useRef(null);
  
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">Ther4py</h1>
          <p className="hero-subtitle">
            An app for your mental well-being and productivity.
          </p>
          <button onClick={scrollToFeatures} className="hero-button">
            See Functions
          </button>
        </div>
      </section>

      <section className="features" ref={featuresRef}>
        <div className="container">
          <h2 className="features-title">Available Functions</h2>
          <div className="features-grid">
            <FeatureCard
              icon={Clock}
              title="Pomodoro Timer"
              description="Customizable timer with work sessions and breaks to maximize focus and productivity."
              onClick={() => setCurrentView('pomodoro')}
            />
            
            <FeatureCard
              icon={BarChart3}
              title="Statistics"
              description="Track your progress and analyze your work sessions."
              onClick={() => setCurrentView('statistics')}
            />
            
            <FeatureCard
              icon={Clock}
              title="Personalization"
              description="Themes and notification sounds customization."
              disabled={true}
            />
          </div>
        </div>
      </section>
    </>
  );
};

// ==================== TIMER CIRCLE COMPONENT ====================
const TimerCircle = ({ timeLeft, progress, isSession, formatTime }) => {
  const circumference = 2 * Math.PI * 125; // r=125 per viewBox 0 0 250 250
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="timer-circle-container">
      <svg viewBox="0 0 250 250" className="timer-circle-svg">
        <circle cx="125" cy="125" r="115" className="timer-circle-track"/>
        <circle
          cx="125" cy="125" r="115"
          className={`timer-circle-progress ${isSession ? 'work' : 'rest'}`}
          style={{ 
            strokeDasharray: circumference, 
            strokeDashoffset: strokeDashoffset
          }}
        />
      </svg>
      <div className="timer-time">{formatTime(timeLeft)}</div>
    </div>
  );
};

// ==================== TIMER CONTROLS COMPONENT ====================
const TimerControls = ({ isRunning, onStart, onPause, onReset, hasStarted }) => (
  <div className="flex justify-center gap-4" style={{ marginBottom: '2rem' }}>
    <button
      onClick={isRunning ? onPause : onStart}
      className={`btn ${isRunning ? 'btn-pause' : 'btn-start'}`}
    >
      {isRunning ? (
        <>
          <Pause size={20} /> Pause
        </>
      ) : hasStarted ? (
        <>
          <Play size={20} /> Resume
        </>
      ) : (
        <>
          <Play size={20} /> Start
        </>
      )}
    </button>

    <button onClick={onReset} className="btn btn-stop">
      <Square size={20} /> Reset
    </button>
  </div>
);

// ==================== SETTINGS PANEL COMPONENT ====================
const SettingsPanel = ({ 
  sessionTime, 
  setSessionTime, 
  restTime, 
  setRestTime, 
  totalDuration, 
  setTotalDuration, 
  isRunning 
}) => (
  <div className="settings-card">
    <h2 className="text-center" style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
      Timer Settings
    </h2>
    <div className="settings-grid">
      <div className="form-group">
        <label>Total Duration (min)</label>
        <input
          type="number"
          min={0.1}
          max={180}
          step={0.1}
          value={totalDuration}
          onChange={(e) => setTotalDuration(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isRunning}
        />
      </div>

      <div className="form-group">
        <label>Work Session (min)</label>
        <input
          type="number"
          min={0.1}
          max={60}
          step={0.1}
          value={sessionTime}
          onChange={(e) => setSessionTime(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isRunning}
        />
      </div>

      <div className="form-group">
        <label>Break (min)</label>
        <input
          type="number"
          min={0.1}
          max={30}
          step={0.1}
          value={restTime}
          onChange={(e) => setRestTime(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isRunning}
        />
      </div>
    </div>

    {isRunning && (
      <div className="settings-notice">
        Settings are locked during timer execution. Reset to modify.
      </div>
    )}
  </div>
);

// ==================== POMODORO TIMER PAGE ====================
const PomodoroTimerPage = ({ setCurrentView }) => {
  // Stati principali
  const [totalDuration, setTotalDuration] = useState(2);
  const [sessionTime, setSessionTime] = useState(1);
  const [restTime, setRestTime] = useState(0.5);
  
  // Stati del timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSession, setIsSession] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  
  // Configurazione attiva
  const [activeTotalDuration, setActiveTotalDuration] = useState(0);
  const [activeSessionTime, setActiveSessionTime] = useState(0);
  const [activeRestTime, setActiveRestTime] = useState(0);

  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Audio e Vibrazione
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playSound = useCallback((freq, dur) => {
    try {
      initAudio();
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + dur);
      osc.start(audioContextRef.current.currentTime);
      osc.stop(audioContextRef.current.currentTime + dur);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }, [initAudio]);

  const vibrate = useCallback((pattern) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const playNotification = useCallback(() => {
    playSound(800, 0.2);
    setTimeout(() => playSound(600, 0.2), 250);
    vibrate([200, 100, 200]);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Phase Complete', {
        body: isSession ? 'Time for a break!' : 'Back to work!',
        silent: false
      });
    }
  }, [playSound, vibrate, isSession]);

  const playAlarm = useCallback(() => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        playSound(1000, 0.5);
        setTimeout(() => playSound(800, 0.5), 600);
      }, i * 1200);
    }
    vibrate([500, 200, 500, 200, 500]);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Session finished. Well done!',
        silent: false
      });
    }
  }, [playSound, vibrate]);

  // Permessi notifiche
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Salva statistiche
  const saveSession = useCallback((completed = true, currentTimeRemaining = 0) => {
    // Non salvare se la durata attiva è 0 (es. reset senza mai avviare)
    if (activeTotalDuration <= 0) return;

    const spentDurationInSeconds = (activeTotalDuration * 60) - currentTimeRemaining;
    const spentDurationInMinutes = spentDurationInSeconds / 60;

    const sessionData = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString(),
      totalDuration: parseFloat(spentDurationInMinutes.toFixed(2)), // Arrotonda a 2 decimali
      sessionTime: activeSessionTime,
      restTime: activeRestTime,
      cyclesCompleted,
      cyclesPlanned: Math.floor((activeTotalDuration * 60) / ((activeSessionTime + activeRestTime) * 60)),
      completed
    };

    const stats = JSON.parse(localStorage.getItem('pomodoroStats') || '[]');
    stats.push(sessionData);
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}, [activeTotalDuration, activeSessionTime, activeRestTime, cyclesCompleted]);

  // Timer principale
  useEffect(() => {
    if (!isRunning || totalTimeRemaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setTotalTimeRemaining(prevTotal => {
        if (prevTotal <= 1) {
          clearInterval(intervalRef.current);
          playAlarm();
          saveSession(true, 0);
          setIsRunning(false);
          setTimeLeft(0);
          setHasStarted(false); // <-- aggiungi qui
          return 0;
        }
        return prevTotal - 1;
      });

      setTimeLeft(prevTimeLeft => {
        if (prevTimeLeft <= 1) {
          if (isSession) {
            setCyclesCompleted(prev => prev + 1);
            setIsSession(false);
            const nextPhaseTime = Math.min(activeRestTime * 60, totalTimeRemaining - 1);
            playNotification();
            return nextPhaseTime;
          } else {
            setIsSession(true);
            const nextPhaseTime = Math.min(activeSessionTime * 60, totalTimeRemaining - 1);
            playNotification();
            return nextPhaseTime;
          }
        }
        return prevTimeLeft - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isSession, totalTimeRemaining, activeSessionTime, activeRestTime, playNotification, playAlarm, saveSession]);

  // Controlli timer
  const startTimer = () => {
    if (!hasStarted) {
      // Primo avvio: inizializza i valori
      setActiveTotalDuration(totalDuration);
      setActiveSessionTime(sessionTime);
      setActiveRestTime(restTime);

      setTotalTimeRemaining(totalDuration * 60);
      setTimeLeft(sessionTime * 60);
      setIsSession(true);
      setCyclesCompleted(0);
      setHasStarted(true);
    }
    // Avvia o riprende
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    if (hasStarted) {
      saveSession(false, totalTimeRemaining);
    }
    setIsRunning(false);
    setHasStarted(false);
    setTimeLeft(0);
    setTotalTimeRemaining(0);
    setIsSession(true);
    setCyclesCompleted(0);
    setActiveTotalDuration(0);
    setActiveSessionTime(0);
    setActiveRestTime(0);
    clearInterval(intervalRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  const getCurrentPhaseTime = () => isSession ? activeSessionTime * 60 : activeRestTime * 60;
  const progress = () => {
    const currentPhaseTime = getCurrentPhaseTime();
    if (currentPhaseTime <= 0 || timeLeft <= 0) return 0;
    return ((currentPhaseTime - timeLeft) / currentPhaseTime) * 100;
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 6rem)', background: 'linear-gradient(135deg,#fef2f2,#fed7aa)', padding: '2rem 0' }}>
      <div className="container">
        <BackButton onClick={() => setCurrentView('home')} />

        <h1 className="text-center" style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>
          Pomodoro Timer
        </h1>
        
        {activeTotalDuration > 0 && (
          <div style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center', margin: '1rem auto', maxWidth: '22rem', color: '#374151', fontSize: '0.9rem' }}>
            <p><strong>Active Configuration:</strong></p>
            <p>Total: {activeTotalDuration}min | Work: {activeSessionTime}min | Break: {activeRestTime}min</p>
          </div>
        )}

        <div className="flex justify-center gap-4" style={{ marginBottom: '1.5rem' }}>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '0.9rem', color: '#374151', fontWeight: '500' }}>
            Total Remaining: {formatTime(totalTimeRemaining)}
          </div>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '0.9rem', color: '#374151', fontWeight: '500' }}>
            Cycles Completed: {cyclesCompleted}
          </div>
        </div>

        <div className="timer-card">
          <div className={`session-badge ${isSession ? 'work' : 'rest'}`}>
            {isSession ? '🍅 Work Session' : '☕ Break'}
          </div>

          <TimerCircle 
            timeLeft={timeLeft}
            progress={progress()}
            isSession={isSession}
            formatTime={formatTime}
          />

          <TimerControls
          isRunning={isRunning}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          hasStarted={hasStarted} // <-- aggiunto
        />

          <SettingsPanel
            sessionTime={sessionTime}
            setSessionTime={setSessionTime}
            restTime={restTime}
            setRestTime={setRestTime}
            totalDuration={totalDuration}
            setTotalDuration={setTotalDuration}
            isRunning={isRunning}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== SESSION CARD COMPONENT ====================
const SessionCard = ({ session, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    totalDuration: session.totalDuration,
    sessionTime: session.sessionTime,
    restTime: session.restTime
  });

  const handleSave = () => {
    onEdit(session.id, {
      ...editData,
      cyclesPlanned: Math.floor((editData.totalDuration * 60) / ((editData.sessionTime + editData.restTime) * 60))
    });
    setIsEditing(false);
  };

  return (
    <div className="session-card">
      <div className="session-header">
        <span className="session-date">{session.date}</span>
        <span className="session-time">{session.startTime}</span>
      </div>
      
      {isEditing ? (
        <div className="edit-form">
          <input
            type="number"
            step="0.1"
            value={editData.totalDuration}
            onChange={(e) => setEditData({...editData, totalDuration: parseFloat(e.target.value)})}
            placeholder="Total (min)"
          />
          <input
            type="number"
            step="0.1"
            value={editData.sessionTime}
            onChange={(e) => setEditData({...editData, sessionTime: parseFloat(e.target.value)})}
            placeholder="Work (min)"
          />
          <input
            type="number"
            step="0.1"
            value={editData.restTime}
            onChange={(e) => setEditData({...editData, restTime: parseFloat(e.target.value)})}
            placeholder="Break (min)"
          />
          <div className="edit-actions">
            <button onClick={handleSave} className="save-btn">Save</button>
            <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="session-details">
          <p><strong>Total:</strong> {session.totalDuration.toFixed(2)}min</p>
          <p><strong>Work:</strong> {session.sessionTime.toFixed(2)}min | <strong>Break:</strong> {session.restTime.toFixed(2)}min</p>
          <p><strong>Cycles:</strong> {session.cyclesCompleted}/{session.cyclesPlanned}</p>
          
          <div className="session-actions">
            <button onClick={() => setIsEditing(true)} className="edit-btn">Edit</button>
            <button onClick={() => onDelete(session.id)} className="delete-btn">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};

import Calendar from './components/Calendar';

// ==================== STATISTICS PAGE ====================
const StatisticsPage = ({ setCurrentView }) => {
  const [stats, setStats] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const savedStats = JSON.parse(localStorage.getItem('pomodoroStats') || '[]');
    setStats(savedStats.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const deleteSession = (id) => {
    const newStats = stats.filter(s => s.id !== id);
    setStats(newStats);
    localStorage.setItem('pomodoroStats', JSON.stringify(newStats));
  };

  const clearAllStats = () => {
    if (window.confirm('Delete all statistics? This cannot be undone.')) {
      setStats([]);
      localStorage.removeItem('pomodoroStats');
    }
  };

  const editSession = (id, newData) => {
    const newStats = stats.map(s => s.id === id ? { ...s, ...newData } : s);
    setStats(newStats);
    localStorage.setItem('pomodoroStats', JSON.stringify(newStats));
  };

  const getStatsForDate = (date) => stats.filter(s => s.date === date);
  
  const getTotalMinutesToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const total = getStatsForDate(today).reduce((total, session) => total + session.totalDuration, 0);
    return total.toFixed(2);
  };

  const getAverageDaily = () => {
    const dates = [...new Set(stats.map(s => s.date))];
    if (dates.length === 0) return 0;
    const totalMinutes = stats.reduce((sum, s) => sum + s.totalDuration, 0);
    return (totalMinutes / dates.length).toFixed(2);
  };

  const sessionDates = [...new Set(stats.map(s => s.date))];

  return (
    <div className="stats-page">
      <div className="container">
        <BackButton onClick={() => setCurrentView('home')} />

        <h1 className="stats-title">Statistics</h1>

        <div className="stats-overview">
          <div className="stat-card">
            <h3>Today</h3>
            <p>{getTotalMinutesToday()} min</p>
          </div>
          <div className="stat-card">
            <h3>Total Sessions</h3>
            <p>{stats.length}</p>
          </div>
          <div className="stat-card">
            <h3>Daily Average</h3>
            <p>{getAverageDaily()} min</p>
          </div>
        </div>

        <div className="calendar-section">
          <h2>Calendar View</h2>
          <Calendar 
            sessionDates={sessionDates}
            selectedDate={selectedDate}
            onDateClick={setSelectedDate}
          />
          
          <div className="date-sessions">
            {getStatsForDate(selectedDate).length === 0 ? (
              <p>No sessions on this date</p>
            ) : (
              getStatsForDate(selectedDate).map(session => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onDelete={deleteSession}
                  onEdit={editSession}
                />
              ))
            )}
          </div>
        </div>

        <div className="all-sessions">
          <div className="section-header">
            <h2>All Sessions</h2>
            {stats.length > 0 && (
              <button onClick={clearAllStats} className="clear-btn">
                Clear All
              </button>
            )}
          </div>

          {stats.length === 0 ? (
            <div className="empty-state">
              <p>No statistics yet. Complete your first timer session!</p>
            </div>
          ) : (
            <div className="sessions-list">
              {stats.map(session => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onDelete={deleteSession}
                  onEdit={editSession}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
const Ther4pyApp = () => {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="app">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      {currentView === 'home' && <HomePage setCurrentView={setCurrentView} />}
      {currentView === 'pomodoro' && <PomodoroTimerPage setCurrentView={setCurrentView} />}
      {currentView === 'statistics' && <StatisticsPage setCurrentView={setCurrentView} />}
    </div>
  );
};

export default Ther4pyApp;