import { useState, useEffect, useRef } from 'react';
import Game from './game/Game.js';
import { FW, FH, STATE, TARGET_AREA } from './game/constants.js';

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const DPAD_BTN = {
  background: 'rgba(68,221,204,0.15)', border: '1px solid rgba(68,221,204,0.3)',
  color: '#44ddcc', borderRadius: 6, fontSize: 20, fontWeight: 'bold',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
};

function TouchControls({ game }) {
  if (!game) return null;
  const input = game.input;

  const onDir = (dir) => (e) => {
    e.preventDefault();
    input.setTouchDir(dir);
  };
  const offDir = (e) => {
    e.preventDefault();
    input.setTouchDir(null);
  };
  const onSpace = (e) => { e.preventDefault(); input.setTouchSpace(true); };
  const offSpace = (e) => { e.preventDefault(); input.setTouchSpace(false); };
  const onEnter = (e) => { e.preventDefault(); input.setTouchEnter(); };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', maxWidth: FW, padding: '10px 20px', boxSizing: 'border-box',
    }}>
      {/* D-Pad */}
      <div style={{ display: 'grid', gridTemplateColumns: '50px 50px 50px', gridTemplateRows: '50px 50px 50px', gap: 4 }}>
        <div />
        <div style={DPAD_BTN}
          onTouchStart={onDir([0, -1])} onTouchEnd={offDir}>^</div>
        <div />
        <div style={DPAD_BTN}
          onTouchStart={onDir([-1, 0])} onTouchEnd={offDir}>{'<'}</div>
        <div />
        <div style={DPAD_BTN}
          onTouchStart={onDir([1, 0])} onTouchEnd={offDir}>{'>'}</div>
        <div />
        <div style={DPAD_BTN}
          onTouchStart={onDir([0, 1])} onTouchEnd={offDir}>v</div>
        <div />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          ...DPAD_BTN, width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(0,255,136,0.15)', border: '2px solid rgba(0,255,136,0.4)',
          color: '#00ff88', fontSize: 11,
        }}
          onTouchStart={onSpace} onTouchEnd={offSpace}>
          CUT
        </div>
        <div style={{
          ...DPAD_BTN, width: 50, height: 50, borderRadius: '50%',
          background: 'rgba(255,217,61,0.15)', border: '2px solid rgba(255,217,61,0.3)',
          color: '#ffd93d', fontSize: 10,
        }}
          onTouchStart={onEnter}>
          OK
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [showTouch, setShowTouch] = useState(false);
  const [hud, setHud] = useState({
    state: STATE.MENU,
    level: 1,
    levelName: '',
    lives: 3,
    score: 0,
    pct: 0,
    shieldPct: 1,
    shieldTime: 0,
    activePowerUp: null,
    bossHp: 0,
    bossMaxHp: 0,
    bossName: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas);
    gameRef.current = game;
    game.onStateChange = (hudData) => setHud({ ...hudData });
    game.start();

    setShowTouch(isTouchDevice());

    return () => game.stop();
  }, []);

  const isPlaying = hud.state === STATE.PLAYING || hud.state === STATE.DEATH ||
                    hud.state === STATE.PAUSED || hud.state === STATE.INTRO ||
                    hud.state === STATE.COMPLETE;

  const powerUpLabel = hud.activePowerUp ? {
    S: 'SPEED', T: 'FREEZE', P: 'SHIELD+', L: 'LASER', BOSS: 'BOSS WPN',
  }[hud.activePowerUp.type] : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#060614', fontFamily: "'Segoe UI', monospace",
    }}>
      {/* HUD */}
      <div style={{
        width: '100%', maxWidth: FW, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 16px', background: 'linear-gradient(180deg, #101026 0%, #060614 100%)',
        borderRadius: '8px 8px 0 0', fontSize: 13, color: '#3a6070',
        letterSpacing: 1.5, borderBottom: '2px solid #1a3a50',
        minHeight: 32, boxSizing: 'border-box', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span>LVL <b style={{ color: '#44ddcc' }}>{hud.level}</b></span>
          <span>SCORE <b style={{ color: '#44ddcc' }}>{hud.score}</b></span>
          {isPlaying && hud.bossName && (
            <span style={{ color: '#ff4488', fontSize: 11 }}>
              {hud.bossName}
              {hud.bossHp > 0 && (
                <span style={{ marginLeft: 6 }}>
                  {'['}
                  <span style={{ color: '#ff4444' }}>
                    {'#'.repeat(hud.bossHp)}
                  </span>
                  <span style={{ color: '#333' }}>
                    {'#'.repeat(Math.max(0, hud.bossMaxHp - hud.bossHp))}
                  </span>
                  {']'}
                </span>
              )}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {powerUpLabel && (
            <span style={{
              color: '#000', background: '#88ffaa', padding: '1px 8px',
              borderRadius: 3, fontSize: 11, fontWeight: 'bold',
            }}>
              {powerUpLabel} {hud.activePowerUp.timer.toFixed(1)}s
            </span>
          )}
          {isPlaying && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#3a6070' }}>SHIELD</span>
              <div style={{
                width: 50, height: 8, background: '#0a1a2a', borderRadius: 4,
                border: '1px solid #1a3a50', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${hud.shieldPct * 100}%`, height: '100%',
                  background: hud.shieldPct > 0.3 ? '#ffd93d' : '#ff4444',
                  borderRadius: 4, transition: 'width 0.3s',
                }} />
              </div>
            </span>
          )}
          <span>AREA <b style={{ color: '#ffd93d' }}>{(hud.pct || 0).toFixed(1)}%</b>
            <span style={{ color: '#1a3a50' }}> / {Math.round(TARGET_AREA * 100)}%</span>
          </span>
          <span>
            LIVES{' '}
            {Array.from({ length: Math.max(0, hud.lives) }, (_, i) => (
              <span key={i} style={{ color: '#ff4466', textShadow: '0 0 6px #ff4466' }}>&#9829; </span>
            ))}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: FW,
        aspectRatio: `${FW}/${FH}`,
        boxShadow: '0 0 40px rgba(0,80,120,0.3)',
      }}>
        <canvas ref={canvasRef} width={FW} height={FH}
          style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* Touch controls (mobile only) */}
      {showTouch && <TouchControls game={gameRef.current} />}

      {/* Footer */}
      <div style={{
        width: '100%', maxWidth: FW, padding: '5px 8px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: '#060614', borderTop: '1px solid #1a3050',
        color: '#182838', fontSize: 10, letterSpacing: 2, boxSizing: 'border-box',
      }}>
        <span>VOLFIED REBORN</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#2a4050' }}>M: mute</span>
          <button
            onClick={() => {
              if (gameRef.current) {
                gameRef.current.toggleMute();
                setHud(h => ({ ...h, muted: !h.muted }));
              }
            }}
            style={{
              background: 'none', border: '1px solid #1a3050', color: '#3a6070',
              cursor: 'pointer', padding: '2px 8px', borderRadius: 3, fontSize: 10,
              letterSpacing: 1,
            }}
          >
            {hud.muted ? 'UNMUTE' : 'MUTE'}
          </button>
        </div>
      </div>
    </div>
  );
}
