/* =============================================
   MarketMind — Background Animation Script
   ============================================= */

(function () {
  'use strict';

  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); buildCandles(); buildNodes(); });

  const CANDLE_COLOR_UP   = 'rgba(62,207,114,';
  const CANDLE_COLOR_DOWN = 'rgba(90,143,255,';
  let candles = [];

  function buildCandles() {
    candles = [];
    const colW  = 32;
    const gap   = 8;
    const cols  = Math.ceil(W / colW) + 2;
    for (let i = 0; i < cols; i++) {
      const x      = i * colW + gap / 2;
      const isUp   = Math.random() > 0.45;
      const bodyH  = H * (0.08 + Math.random() * 0.38);
      const bodyY  = H * 0.15 + Math.random() * H * 0.55;
      const wickT  = bodyH * (0.1 + Math.random() * 0.35);
      const wickB  = bodyH * (0.1 + Math.random() * 0.35);
      const alpha  = 0.12 + Math.random() * 0.22;
      const bodyW  = colW - gap;
      candles.push({ x, bodyY, bodyH, bodyW, wickT, wickB, isUp, alpha });
    }
  }
  buildCandles();

  function drawCandles() {
    candles.forEach(c => {
      const color = c.isUp ? CANDLE_COLOR_UP : CANDLE_COLOR_DOWN;
      ctx.beginPath();
      ctx.moveTo(c.x + c.bodyW / 2, c.bodyY - c.wickT);
      ctx.lineTo(c.x + c.bodyW / 2, c.bodyY + c.bodyH + c.wickB);
      ctx.strokeStyle = color + (c.alpha * 0.7).toFixed(2) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(c.x, c.bodyY, c.bodyW, c.bodyH, 3);
      else ctx.rect(c.x, c.bodyY, c.bodyW, c.bodyH);
      ctx.fillStyle = color + c.alpha.toFixed(2) + ')';
      ctx.fill();
    });
  }

  const NODE_COUNT = 38;
  let nodes = [];

  function buildNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x:  Math.random() * W, y:  Math.random() * H,
        r:  1.2 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        alpha: 0.15 + Math.random() * 0.45,
      });
    }
  }
  buildNodes();

  function updateNodes() {
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;
    });
  }

  const LINK_DIST = 140;

  function drawNetwork() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          const a = (1 - d / LINK_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(56,182,255,${a.toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56,182,255,${n.alpha.toFixed(2)})`;
      ctx.fill();
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.75);
    grad.addColorStop(0,   '#0d1f3c');
    grad.addColorStop(0.5, '#091628');
    grad.addColorStop(1,   '#050d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.9);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(3,8,18,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    drawCandles();
    drawNetwork();
    updateNodes();
    requestAnimationFrame(draw);
  }
  draw();

  window.handleGetStarted = function () {
    window.location.href = 'login.html';
  };
})();
