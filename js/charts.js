/* charts.js — Donut chart and heatmap renderer */
'use strict';

window.Charts = (() => {

  /* ── Language colors map ────────────────────────────────────── */
  const LANG_COLORS = {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572a5',
    Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Go: '#00add8', Rust: '#dea584', Ruby: '#701516', PHP: '#4f5d95',
    Swift: '#f05138', Kotlin: '#a97bff', Scala: '#dc322f',
    HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
    Dockerfile: '#384d54', Vue: '#41b883', Dart: '#00b4ab',
    Lua: '#000080', R: '#198ce7', MATLAB: '#e16737',
    'Jupyter Notebook': '#da5b0b', Haskell: '#5e5086',
    Elixir: '#6e4a7e', Clojure: '#db5855', Perl: '#0298c3',
  };

  function getLangColor(lang, idx) {
    if (lang && LANG_COLORS[lang]) return LANG_COLORS[lang];
    const palette = [
      '#f97316','#60a5fa','#4ade80','#a78bfa',
      '#f472b6','#fbbf24','#2dd4bf','#f87171',
      '#34d399','#818cf8','#fb923c','#e879f9',
    ];
    return palette[idx % palette.length];
  }

  /* ── Animated counter ───────────────────────────────────────── */
  function animateCount(el, target, duration = 900) {
    const start   = performance.now();
    const initial = parseInt(el.textContent.replace(/,/g, '')) || 0;
    function step(ts) {
      const progress = Math.min((ts - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      const val      = Math.round(initial + (target - initial) * ease);
      el.textContent = val.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Donut chart ────────────────────────────────────────────── */
  function drawDonut(svgEl, centerEl, legendEl, subEl, langData) {
    const NS    = 'http://www.w3.org/2000/svg';
    const cx    = 90, cy = 90, r = 72, strokeW = 18;
    const circ  = 2 * Math.PI * r;
    const total = langData.reduce((s, l) => s + l.bytes, 0);
    const gap   = 0.012; // fraction gap between segments

    svgEl.innerHTML = '';
    legendEl.innerHTML = '';

    // Background circle
    const bg = document.createElementNS(NS, 'circle');
    bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
    bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', 'var(--bg-3)');
    bg.setAttribute('stroke-width', strokeW);
    svgEl.appendChild(bg);

    let offset = 0;
    const top8 = langData.slice(0, 8);

    top8.forEach((lang, i) => {
      const pct   = lang.bytes / total;
      const color = getLangColor(lang.name, i);
      const dash  = (pct - gap) * circ;
      const space = circ - dash;

      const arc = document.createElementNS(NS, 'circle');
      arc.setAttribute('cx', cx); arc.setAttribute('cy', cy); arc.setAttribute('r', r);
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', color);
      arc.setAttribute('stroke-width', strokeW);
      arc.setAttribute('stroke-dasharray', `${dash} ${space}`);
      arc.setAttribute('stroke-dashoffset', -(offset * circ));
      arc.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      arc.setAttribute('stroke-linecap', 'butt');
      arc.style.transition = `stroke-dasharray .8s ${i * .06}s cubic-bezier(.22,1,.36,1)`;

      // Animate in from 0
      arc.setAttribute('stroke-dasharray', `0 ${circ}`);
      svgEl.appendChild(arc);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          arc.setAttribute('stroke-dasharray', `${dash} ${space}`);
        });
      });

      offset += pct;

      // Legend row
      const pctStr = (pct * 100).toFixed(1);
      const li     = document.createElement('div');
      li.className = 'lang-legend-item';
      li.innerHTML = `
        <div class="lang-legend-item__dot" style="background:${color}"></div>
        <span class="lang-legend-item__name">${lang.name}</span>
        <div class="lang-legend-item__bar-wrap">
          <div class="lang-legend-item__bar" style="width:0%;background:${color}" data-pct="${pctStr}"></div>
        </div>
        <span class="lang-legend-item__pct">${pctStr}%</span>
      `;
      legendEl.appendChild(li);

      // Animate bar
      setTimeout(() => {
        li.querySelector('.lang-legend-item__bar').style.width = pctStr + '%';
      }, 100 + i * 60);
    });

    // Center
    centerEl.querySelector('.donut-center__val').textContent = top8.length;
    if (subEl) subEl.textContent = `${top8.length} detected`;
  }

  /* ── Commit heatmap ─────────────────────────────────────────── */
  function drawHeatmap(containerEl, weeklyData) {
    containerEl.innerHTML = '';

    // weeklyData: array of { week: unix, days: [0..7 commits per day] }
    // Pad to 52 weeks if needed
    const weeks = weeklyData.slice(-52);

    const maxCommits = Math.max(...weeks.flatMap(w => w.days));

    weeks.forEach(week => {
      const col = document.createElement('div');
      col.className = 'heatmap-week';

      week.days.forEach((count, dayIdx) => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        const level = count === 0 ? 0
          : count <= maxCommits * 0.15 ? 1
          : count <= maxCommits * 0.35 ? 2
          : count <= maxCommits * 0.65 ? 3 : 4;
        cell.dataset.level = level;
        const date = new Date((week.week + dayIdx * 86400) * 1000);
        cell.title = `${count} commit${count !== 1 ? 's' : ''} on ${date.toDateString()}`;
        col.appendChild(cell);
      });
      containerEl.appendChild(col);
    });
  }

  return { drawDonut, drawHeatmap, animateCount, getLangColor };
})();
