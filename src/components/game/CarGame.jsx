import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Pause,
  Play,
  Settings,
  X,
  Check,
} from 'lucide-react';
import { soundManager } from './SoundManager.js';
import { useTelegram } from '../../store/useTelegram.js';
import { useThemeStore } from '../../store/useThemeStore.js';

export const CarGame = ({ tournament, onScoreSubmit, onExit, turnsLeft = null }) => {
  const canvasRef = useRef(null);
  const { haptic } = useTelegram();

  // Control settings: 'buttons' | 'screen_click'
  const [controlType, setControlType] = useState(() => {
    try {
      return localStorage.getItem('firefly_controls') || 'buttons';
    } catch (e) {
      return 'buttons';
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // Game state refs (for 60fps loop without stale closures)
  const stateRef = useRef({
    isRunning: false,
    isGameOver: false,
    score: 0,
    diamondsCollected: 0,
    distance: 0,
    speed: 6,
    baseSpeed: 6,
    playerLane: 1, // 0: Left, 1: Center, 2: Right
    playerX: 0,
    targetX: 0,
    tilt: 0,
    traffic: [],
    diamonds: [],
    particles: [],
    roadOffset: 0,
    lastTrafficSpawn: 0,
    lastDiamondSpawn: 0,
    shake: 0,
  });

  const [gameState, setGameState] = useState({
    score: 0,
    diamonds: 0,
    distance: 0,
    isGameOver: false,
    isSubmitting: false,
    submissionResult: null,
  });

  const [liveHud, setLiveHud] = useState({ score: 0, diamonds: 0 });

  const [isMuted, setIsMuted] = useState(soundManager.isMuted);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    haptic.selection();
  };

  const togglePause = useCallback(() => {
    if (stateRef.current.isGameOver) return;
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
    haptic.selection();
  }, [haptic]);

  const openSettings = useCallback(() => {
    if (stateRef.current.isRunning && !stateRef.current.isGameOver) {
      setIsPaused(true);
      isPausedRef.current = true;
    }
    setIsSettingsOpen(true);
    haptic.selection();
  }, [haptic]);

  const handleSelectControlType = (type) => {
    setControlType(type);
    try {
      localStorage.setItem('firefly_controls', type);
    } catch (e) {}
    haptic.selection();
  };

  // Change lane handler
  const moveLane = useCallback((direction) => {
    const s = stateRef.current;
    if (!s.isRunning || s.isGameOver || isPausedRef.current) return;

    if (direction === 'left' && s.playerLane > 0) {
      s.playerLane -= 1;
      s.tilt = -0.15;
      soundManager.playLaneChange();
      haptic.light();
    } else if (direction === 'right' && s.playerLane < 2) {
      s.playerLane += 1;
      s.tilt = 0.15;
      soundManager.playLaneChange();
      haptic.light();
    }
  }, [haptic]);

  // Handle direct lane tap (for screen click / tap mode)
  const handleLaneTap = useCallback((clientX) => {
    const s = stateRef.current;
    if (!s.isRunning || s.isGameOver || isPausedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const laneWidth = rect.width / 3;
    const targetLane = Math.min(2, Math.max(0, Math.floor(clickX / laneWidth)));

    if (targetLane !== s.playerLane) {
      s.tilt = targetLane > s.playerLane ? 0.15 : -0.15;
      s.playerLane = targetLane;
      soundManager.playLaneChange();
      haptic.light();
    }
  }, [haptic]);

  // Touch Swipe gestures & Tap
  const touchStartRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
      if (dx > 0) moveLane('right');
      else moveLane('left');
    } else if (controlType === 'screen_click' && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      handleLaneTap(touch.clientX);
    }
  };

  // Directly submit score when user gets out
  const submitScoreDirectly = useCallback(
    async (finalScore, finalDiamonds, finalDistance) => {
      if (!tournament) return;

      const scoreToSubmit = finalScore ?? stateRef.current.score;
      const diamondsToSubmit = finalDiamonds ?? stateRef.current.diamondsCollected;
      const distanceToSubmit = finalDistance ?? Math.floor(stateRef.current.distance);

      setGameState((prev) => ({ ...prev, isSubmitting: true }));
      try {
        const res = await onScoreSubmit?.({
          tournamentId: tournament?._id || null,
          score: scoreToSubmit,
          diamondsCollected: diamondsToSubmit,
          distance: distanceToSubmit,
        });

        setGameState((prev) => ({
          ...prev,
          isSubmitting: false,
          submissionResult: res,
        }));
      } catch (err) {
        setGameState((prev) => ({
          ...prev,
          isSubmitting: false,
          submissionResult: { error: err.message || 'Failed to submit score' },
        }));
      }
    },
    [tournament, onScoreSubmit]
  );

  const submitRef = useRef(submitScoreDirectly);
  useEffect(() => {
    submitRef.current = submitScoreDirectly;
  }, [submitScoreDirectly]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLane('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveLane('right');
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLane, togglePause]);

  // Main Game Loop & Canvas Lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Canvas sizing
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize state
    const s = stateRef.current;
    s.isRunning = true;
    s.isGameOver = false;
    s.score = 0;
    s.diamondsCollected = 0;
    s.distance = 0;
    s.speed = 6;
    s.playerLane = 1;
    s.traffic = [];
    s.diamonds = [];
    s.particles = [];
    s.shake = 0;

    let animId;
    let lastTime = performance.now();
    let lastHudTime = 0;
    let lastReportedDiamonds = -1;

    const loop = (currentTime) => {
      if (isPausedRef.current) {
        lastTime = currentTime;
        animId = requestAnimationFrame(loop);
        return;
      }

      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Lane calculation
      const laneWidth = width / 3;
      const laneCenters = [
        laneWidth * 0.5,
        laneWidth * 1.5,
        laneWidth * 2.5,
      ];

      s.targetX = laneCenters[s.playerLane];
      if (s.playerX === 0) s.playerX = s.targetX;
      // Smooth interpolation
      s.playerX += (s.targetX - s.playerX) * 0.22;
      s.tilt *= 0.85;

      const playerY = height - 120;
      const carW = Math.min(laneWidth * 0.52, 54);
      const carH = carW * 1.75;

      if (!s.isGameOver) {
        // Increment distance & speed gradually
        s.distance += s.speed * 0.1;
        s.speed = s.baseSpeed + Math.min(10, Math.floor(s.distance / 120) * 0.6);
        s.score = Math.floor(s.distance) + s.diamondsCollected * 50;

        // Real-time live HUD update (smooth ~12-15 fps updates so points increment visibly during play)
        if (currentTime - lastHudTime > 75 || s.diamondsCollected !== lastReportedDiamonds) {
          lastHudTime = currentTime;
          lastReportedDiamonds = s.diamondsCollected;
          setLiveHud({
            score: s.score,
            diamonds: s.diamondsCollected,
          });
        }

        // Animate road stripes
        s.roadOffset = (s.roadOffset + s.speed) % 60;

        // Spawn Traffic Cars
        if (currentTime - s.lastTrafficSpawn > Math.max(1200, 2600 - s.speed * 110)) {
          const lane = Math.floor(Math.random() * 3);
          const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#EC4899'];
          const carColor = colors[Math.floor(Math.random() * colors.length)];
          const trafficSpeed = s.speed * (0.35 + Math.random() * 0.25);

          s.traffic.push({
            lane,
            x: laneCenters[lane],
            y: -carH - 20,
            speed: trafficSpeed,
            color: carColor,
            width: carW,
            height: carH,
          });
          s.lastTrafficSpawn = currentTime;
        }

        // Spawn Diamonds
        if (currentTime - s.lastDiamondSpawn > Math.max(1600, 3200 - s.speed * 90)) {
          const availableLanes = [0, 1, 2];
          const diamondLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

          s.diamonds.push({
            lane: diamondLane,
            x: laneCenters[diamondLane],
            y: -40,
            radius: 14,
            rotation: 0,
          });
          s.lastDiamondSpawn = currentTime;
        }

        // Update Traffic
        for (let i = s.traffic.length - 1; i >= 0; i--) {
          const t = s.traffic[i];
          t.y += s.speed - t.speed;

          // Check Collision with Player Car
          const hitX = Math.abs(s.playerX - t.x) < (carW * 0.78);
          const hitY = Math.abs(playerY - t.y) < (carH * 0.82);

          if (hitX && hitY) {
            // Collision occurred!
            s.isGameOver = true;
            s.shake = 22;
            soundManager.playCrash();
            soundManager.playGameOver();
            haptic.heavy();

            // Spawn crash debris particles
            for (let p = 0; p < 30; p++) {
              s.particles.push({
                x: s.playerX,
                y: playerY,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16,
                color: Math.random() > 0.5 ? '#A855F7' : '#EF4444',
                size: Math.random() * 6 + 2,
                life: 1.0,
              });
            }

            const finalScore = s.score;
            const finalDiamonds = s.diamondsCollected;
            const finalDistance = Math.floor(s.distance);

            setGameState({
              score: finalScore,
              diamonds: finalDiamonds,
              distance: finalDistance,
              isGameOver: true,
              isSubmitting: Boolean(tournament),
              submissionResult: null,
            });

            // If in a tournament, automatically submit score directly when user gets out
            if (tournament) {
              submitRef.current?.(finalScore, finalDiamonds, finalDistance);
            }
            break;
          }

          if (t.y > height + 100) {
            s.traffic.splice(i, 1);
          }
        }

        // Update Diamonds
        for (let i = s.diamonds.length - 1; i >= 0; i--) {
          const d = s.diamonds[i];
          d.y += s.speed;
          d.rotation += 0.05;

          // Collection check
          const collectX = Math.abs(s.playerX - d.x) < (carW * 0.8 + d.radius);
          const collectY = Math.abs(playerY - d.y) < (carH * 0.7 + d.radius);

          if (collectX && collectY) {
            s.diamondsCollected += 1;
            soundManager.playDiamond();
            haptic.success();

            // Gem sparkle particles
            for (let p = 0; p < 14; p++) {
              s.particles.push({
                x: d.x,
                y: d.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: '#38BDF8',
                size: Math.random() * 4 + 2,
                life: 0.8,
              });
            }

            s.diamonds.splice(i, 1);
            continue;
          }

          if (d.y > height + 60) {
            s.diamonds.splice(i, 1);
          }
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.035;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // DRAWING
      ctx.save();

      // Camera Shake
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
        s.shake *= 0.88;
        if (s.shake < 0.5) s.shake = 0;
      }

      // Background asphalt
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Active Theme Dynamic Colors
      const activeTheme = useThemeStore.getState().themeConfig;
      const themePrimary = activeTheme?.hex || '#38BDF8';
      const themeHover = activeTheme?.hoverHex || '#0284C7';

      // Cyber grid & clean road edges
      ctx.strokeStyle = themePrimary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(2, height);
      ctx.moveTo(width - 2, 0);
      ctx.lineTo(width - 2, height);
      ctx.stroke();

      // Lane dividers (Dashed lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([25, 25]);
      ctx.lineDashOffset = -s.roadOffset;

      ctx.beginPath();
      ctx.moveTo(laneWidth, 0);
      ctx.lineTo(laneWidth, height);
      ctx.moveTo(laneWidth * 2, 0);
      ctx.lineTo(laneWidth * 2, height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Draw Diamonds
      s.diamonds.forEach((d) => {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);

        ctx.shadowBlur = 0;

        // Diamond polygonal shape
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(0, -d.radius);
        ctx.lineTo(d.radius * 0.8, 0);
        ctx.lineTo(0, d.radius);
        ctx.lineTo(-d.radius * 0.8, 0);
        ctx.closePath();
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -d.radius * 0.5);
        ctx.lineTo(d.radius * 0.4, 0);
        ctx.lineTo(0, d.radius * 0.5);
        ctx.lineTo(-d.radius * 0.4, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      // Draw Traffic Cars
      s.traffic.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);

        // Traffic Car Shadow
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(-t.width / 2, -t.height / 2 + 5, t.width, t.height, 8);
        ctx.fill();

        // Traffic Car Body
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.roundRect(-t.width / 2, -t.height / 2, t.width, t.height, 8);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#141414';
        ctx.beginPath();
        ctx.roundRect(-t.width * 0.36, -t.height * 0.25, t.width * 0.72, t.height * 0.28, 4);
        ctx.fill();

        // Rear Brake Lights
        ctx.fillStyle = '#EF4444';
        ctx.shadowBlur = 0;
        ctx.fillRect(-t.width * 0.4, t.height * 0.42, t.width * 0.22, 5);
        ctx.fillRect(t.width * 0.18, t.height * 0.42, t.width * 0.22, 5);

        ctx.restore();
      });

      // Draw Player Supercar
      ctx.save();
      ctx.translate(s.playerX, playerY);
      ctx.rotate(s.tilt);

      // Headlight beams
      const beamGrad = ctx.createLinearGradient(0, -carH / 2, 0, -carH / 2 - 130);
      beamGrad.addColorStop(0, themePrimary + '55');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-carW * 0.35, -carH / 2);
      ctx.lineTo(-carW * 0.75, -carH / 2 - 120);
      ctx.lineTo(-carW * 0.1, -carH / 2 - 120);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(carW * 0.35, -carH / 2);
      ctx.lineTo(carW * 0.75, -carH / 2 - 120);
      ctx.lineTo(carW * 0.1, -carH / 2 - 120);
      ctx.closePath();
      ctx.fill();

      // Exhaust Boost Flames
      const flameH = 12 + Math.random() * 8;
      ctx.fillStyle = themePrimary;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-carW * 0.28, carH / 2);
      ctx.lineTo(-carW * 0.18, carH / 2 + flameH);
      ctx.lineTo(-carW * 0.08, carH / 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(carW * 0.08, carH / 2);
      ctx.lineTo(carW * 0.18, carH / 2 + flameH);
      ctx.lineTo(carW * 0.28, carH / 2);
      ctx.fill();

      // Car Shadow
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(-carW / 2 - 4, -carH / 2 + 6, carW + 8, carH, 10);
      ctx.fill();

      // Futuristic Main Chassis (Dynamic Accent Theme)
      const bodyGrad = ctx.createLinearGradient(-carW / 2, 0, carW / 2, 0);
      bodyGrad.addColorStop(0, themeHover);
      bodyGrad.addColorStop(0.5, themePrimary);
      bodyGrad.addColorStop(1, themeHover);

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(-carW / 2, -carH / 2, carW, carH, 10);
      ctx.fill();

      // White Accent Racing Stripes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-carW * 0.06, -carH / 2 + 4, carW * 0.12, carH - 8);

      // Cockpit / Tinted Windshield
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.roundRect(-carW * 0.35, -carH * 0.28, carW * 0.7, carH * 0.38, 6);
      ctx.fill();

      // Windshield subtle light reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(-carW * 0.28, -carH * 0.24, carW * 0.15, carH * 0.2);

      // Supercar Headlights (Dual crisp white)
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.fillRect(-carW * 0.42, -carH / 2 + 2, carW * 0.22, 4);
      ctx.fillRect(carW * 0.2, -carH / 2 + 2, carW * 0.22, 4);

      ctx.restore();

      // Draw Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleRestart = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    const s = stateRef.current;
    s.isRunning = true;
    s.isGameOver = false;
    s.score = 0;
    s.diamondsCollected = 0;
    s.distance = 0;
    s.speed = 6;
    s.playerLane = 1;
    s.traffic = [];
    s.diamonds = [];
    s.particles = [];
    s.shake = 0;

    setGameState({
      score: 0,
      diamonds: 0,
      distance: 0,
      isGameOver: false,
      isSubmitting: false,
      submissionResult: null,
    });
    setLiveHud({ score: 0, diamonds: 0 });
  };

  const displayTurns = gameState.submissionResult?.turnsLeft ?? turnsLeft;

  return (
    <div className="relative w-full h-[100dvh] bg-black flex flex-col items-center justify-between overflow-hidden select-none touch-none">
      {/* Top Game Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2.5 bg-gradient-to-b from-black/95 to-transparent">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-[#0E0E0E] border border-white/10 text-neutral-300 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={togglePause}
            className="p-2 rounded-xl bg-[#0E0E0E] border border-white/10 text-neutral-300 hover:text-white active:scale-95 transition"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-sky-400 fill-current" />
            ) : (
              <Pause className="w-4 h-4 text-neutral-300" />
            )}
          </button>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0E0E0E] border border-white/10">
            <span className="text-xs leading-none select-none" role="img" aria-label="diamonds">💎</span>
            <span className="font-bold text-white text-xs">
              {liveHud.diamonds}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#141414] border border-white/10">
            <span className="font-extrabold text-sky-400 text-xs tracking-wide">
              {liveHud.score}
            </span>
          </div>

          {displayTurns !== null && (
            <div className="px-2 py-1.5 rounded-xl bg-[#0E0E0E] border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
              T:{displayTurns}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={openSettings}
            className="p-2 rounded-xl bg-[#0E0E0E] border border-white/10 text-neutral-300 hover:text-white active:scale-95 transition"
            title="Controls Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-[#0E0E0E] border border-white/10 text-neutral-300 active:scale-95 transition"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-sky-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Game Canvas */}
      <div
        className="w-full flex-1 relative flex items-center justify-center cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (controlType === 'screen_click') {
            handleLaneTap(e.clientX);
          }
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Bottom Controls / Lane Guide */}
      {controlType === 'buttons' ? (
        <div className="w-full max-w-md px-6 pb-6 pt-2 z-20 flex items-center justify-between gap-4">
          <button
            onClick={() => moveLane('left')}
            className="flex-1 py-4 rounded-2xl bg-[#0E0E0E] border border-white/10 active:scale-95 active:bg-[#181818] transition flex items-center justify-center gap-2"
          >
            <span className="text-2xl font-bold text-white">←</span>
            <span className="font-bold tracking-wider text-sm text-sky-400">LEFT</span>
          </button>

          <button
            onClick={() => moveLane('right')}
            className="flex-1 py-4 rounded-2xl bg-[#0E0E0E] border border-white/10 active:scale-95 active:bg-[#181818] transition flex items-center justify-center gap-2"
          >
            <span className="font-bold tracking-wider text-sm text-sky-400">RIGHT</span>
            <span className="text-2xl font-bold text-white">→</span>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md px-4 pb-5 pt-1 z-20 grid grid-cols-3 gap-2 text-neutral-500 text-[10px] font-mono select-none">
          <div
            onClick={() => moveLane('left')}
            className="py-2.5 rounded-xl bg-[#0E0E0E]/80 border border-white/5 text-center active:bg-white/10 transition cursor-pointer"
          >
            ◀ LEFT
          </div>
          <div
            onClick={() => {
              const s = stateRef.current;
              if (s.playerLane !== 1) {
                s.tilt = 1 > s.playerLane ? 0.15 : -0.15;
                s.playerLane = 1;
                soundManager.playLaneChange();
                haptic.light();
              }
            }}
            className="py-2.5 rounded-xl bg-[#0E0E0E]/80 border border-white/5 text-center active:bg-white/10 transition cursor-pointer"
          >
            CENTER
          </div>
          <div
            onClick={() => moveLane('right')}
            className="py-2.5 rounded-xl bg-[#0E0E0E]/80 border border-white/5 text-center active:bg-white/10 transition cursor-pointer"
          >
            RIGHT ▶
          </div>
        </div>
      )}

      {/* Paused Overlay Modal */}
      {isPaused && !gameState.isGameOver && !isSettingsOpen && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl p-5 bg-[#0E0E0E] border border-white/10 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <Pause className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-white">Game Paused</h3>
              <p className="text-xs text-neutral-400 mt-1">
                💎 {liveHud.diamonds} diamonds • {liveHud.score} pts
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={togglePause}
                className="w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> Resume Game
              </button>

              <button
                onClick={openSettings}
                className="w-full py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Settings className="w-3.5 h-3.5" /> Controls Settings
              </button>

              <button
                onClick={onExit}
                className="w-full py-2 rounded-xl bg-[#141414] border border-white/10 text-neutral-400 hover:text-white font-medium text-xs transition active:scale-95"
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl p-5 bg-[#0E0E0E] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-400" />
                <h3 className="font-heading font-bold text-sm text-white">Controls</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSelectControlType('buttons')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  controlType === 'buttons'
                    ? 'bg-[#181818] border-sky-400/50 ring-1 ring-sky-400/30'
                    : 'bg-[#121212] border-white/5 hover:border-white/15'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">Bottom Buttons</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Left & Right tap buttons</div>
                </div>
                {controlType === 'buttons' && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
              </button>

              <button
                onClick={() => handleSelectControlType('screen_click')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  controlType === 'screen_click'
                    ? 'bg-[#181818] border-sky-400/50 ring-1 ring-sky-400/30'
                    : 'bg-[#121212] border-white/5 hover:border-white/15'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">Screen Tap (Tap Lane)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Tap any of 3 lanes directly</div>
                </div>
                {controlType === 'screen_click' && <Check className="w-4 h-4 text-sky-400 stroke-[3]" />}
              </button>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-heading font-bold text-xs tracking-wide transition active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal Overlay */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-[#0E0E0E] border border-white/10 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="font-extrabold text-2xl text-white tracking-wide">
                CRASHED!
              </h2>
            </div>

            {/* Score Summary Box */}
            <div className="grid grid-cols-2 gap-2.5 py-1">
              <div className="p-3 rounded-2xl bg-[#141414] border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">
                  Final Score
                </span>
                <span className="text-2xl font-black text-sky-400">
                  {gameState.score}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#141414] border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">
                  Diamonds
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  💎 {gameState.diamonds}
                </span>
              </div>
            </div>

            {/* Automatic Score Submission in Tournament */}
            {tournament && gameState.isSubmitting && (
              <div className="p-3 rounded-xl bg-[#141414] border border-white/10 text-xs flex items-center justify-center gap-2 text-sky-400">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span className="font-semibold text-white">Submitting score...</span>
              </div>
            )}

            {tournament && gameState.submissionResult && (
              <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs">
                {gameState.submissionResult.error ? (
                  <div className="space-y-1.5">
                    <span className="text-red-400 font-medium block">
                      {gameState.submissionResult.error}
                    </span>
                    <button
                      onClick={() =>
                        submitRef.current?.(
                          gameState.score,
                          gameState.diamonds,
                          gameState.distance
                        )
                      }
                      className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 font-semibold text-xs active:scale-95 transition"
                    >
                      Retry Submission
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-emerald-400 font-bold">Score submitted!</p>
                    {gameState.submissionResult.rank && (
                      <p className="text-amber-300 font-semibold">
                        Rank #{gameState.submissionResult.rank}
                      </p>
                    )}
                    {gameState.submissionResult.turnsLeft !== undefined && (
                      <p className="text-neutral-400 text-[11px]">
                        Turns remaining: {gameState.submissionResult.turnsLeft}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Out of Turns - Share Referral Code for +1 Extra Turn */}
            {tournament &&
              (gameState.submissionResult?.turnsLeft === 0 || turnsLeft === 0) &&
              tournament.userParticipation?.referralCode && (
                <div className="p-3 rounded-2xl bg-amber-400/[0.08] border border-amber-400/30 text-xs space-y-1 text-center">
                  <span className="font-heading font-extrabold text-amber-300 text-xs block">
                    Out of turns? Earn +1 Extra Turn!
                  </span>
                  <div className="flex items-center justify-center gap-1.5 py-0.5">
                    <span className="font-mono font-black text-amber-400 text-sm tracking-widest px-2.5 py-0.5 rounded bg-black/60 border border-amber-400/20">
                      {tournament.userParticipation.referralCode}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300">
                    Whenever a friend joins with your code, you get +1 EXTRA TURN!
                  </p>
                </div>
              )}

            <div className="flex items-center gap-2.5 pt-1">
              {(!tournament || (gameState.submissionResult?.turnsLeft > 0)) && (
                <button
                  onClick={handleRestart}
                  disabled={gameState.isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#1E1E1E] border border-white/15 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" /> Play Again
                </button>
              )}

              <button
                onClick={onExit}
                disabled={gameState.isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-neutral-300 font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-40 transition"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
