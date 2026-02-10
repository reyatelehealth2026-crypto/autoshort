import React from 'react';
import { motion } from 'framer-motion';
import './BrainFlowShowcase.css';

const BrainFlowShowcase: React.FC = () => {
  return (
    <div className="bf-container">
      {/* Background Grid Pattern */}
      <div className="bf-grid-bg" />

      <div className="bf-content-wrapper">
        {/* Header */}
        <header className="bf-header">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bf-logo"
          >
            BRAIN-FLOW
          </motion.div>
          <div className="bf-nav">
            <span className="bf-nav-item">Protocol</span>
            <span className="bf-nav-item">Bio-Link</span>
            <span className="bf-nav-item">Nodes</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="bf-grid-layout">
          {/* Left: Text & HUD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bf-text-panel"
          >
            <div className="bf-status-badge">
              SYSTEM STATUS: OPTIMAL
            </div>
            <h1 className="bf-main-title">
              ACTIVATE <br />
              <span className="bf-gradient-text">
                DEEP WORK
              </span>
            </h1>
            <p className="bf-description">
              Unlock peak cognitive performance. No distractions. Just pure focus flow for developers and creators.
            </p>

            <div className="bf-actions">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="bf-btn-primary"
              >
                Start Protocol
              </motion.button>
              <button className="bf-btn-secondary">
                Whitepaper
              </button>
            </div>

            {/* HUD Stats */}
            <div className="bf-hud-stats">
              <div className="bf-stat-card">
                <div className="bf-stat-label">Focus Level</div>
                <div className="bf-stat-value bf-cyan">98%</div>
              </div>
              <div className="bf-stat-card">
                <div className="bf-stat-label">Latency</div>
                <div className="bf-stat-value bf-emerald">12ms</div>
              </div>
              <div className="bf-stat-card">
                <div className="bf-stat-label">Efficiency</div>
                <div className="bf-stat-value bf-blue">4.2x</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual Reference (The Bottle) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, delay: 0.4 }}
            className="bf-visual-panel"
          >
            <div className="bf-aura" />

            <div className="bf-glass-panel">
              <img
                src="/2026-02-10-brain-flow-preview.png"
                alt="Brain Flow Nootropics"
                className="bf-preview-img"
              />
              <div className="bf-scanline-container">
                <div className="bf-scanline" />
              </div>
            </div>

            <div className="bf-data-overlay">
              <div className="bf-cyan">NEURAL_LOAD: STABLE</div>
              <div className="bf-muted">0x4F92...DECODING</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BrainFlowShowcase;
