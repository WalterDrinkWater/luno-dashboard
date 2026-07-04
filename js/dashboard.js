const Dashboard = {
  _data: null,
  _charts: {},
  _lastFiltered: [],
  _resizeTimer: null,

  async init() {
    await this.loadData();
    this._initResizeHandler();
  },

  async loadData() {
    try {
      const [balanceData, tickersData] = await Promise.all([
        API.fetchBalance(),
        API.fetchTickers(),
      ]);

      const tradesByPair = {};
      const tickerPairSet = new Set();
      (tickersData.tickers || []).forEach((t) => tickerPairSet.add(t.pair));

      const userAssets = new Set();
      (balanceData.balance || []).forEach((b) => {
        if (!Calculator._isFiat(b.asset)) userAssets.add(b.asset);
      });

      for (const pair of tickerPairSet) {
        const parsed = Calculator._parsePair(pair);
        if (parsed && userAssets.has(parsed.base)) {
          try {
            tradesByPair[pair] = await API.fetchTrades(pair);
          } catch {
            tradesByPair[pair] = [];
          }
        }
      }

      this._data = Calculator.calculate(balanceData, tickersData, tradesByPair);
      this.render();
    } catch (err) {}
  },

  render() {
    if (!this._data) return;
    const nonFiat = (this._data.assets || []).filter((a) => !a.isFiat);
    const visMap = Storage.getAssetVisibility();
    nonFiat.forEach((a) => {
      if (!(a.asset in visMap)) visMap[a.asset] = true;
    });
    Storage.saveBulkAssetVisibility(visMap);
    const filtered = nonFiat.filter((a) => visMap[a.asset] !== false);
    this._renderSummary(filtered);
    this._renderCharts(filtered);
    this._renderTable(filtered);
    this._lastFiltered = filtered;
  },

  _renderSummary(filtered) {
    const s = this._data.summary;
    const fiat = s.defaultFiat;

    document.getElementById("card-value").textContent = this._fmtFiat(
      s.totalValue,
      fiat,
    );
    document.getElementById("card-invested").textContent = this._fmtFiat(
      s.totalInvested,
      fiat,
    );
    document.getElementById("card-pnl").textContent =
      (s.totalPnl >= 0 ? "+" : "") + this._fmtFiat(s.totalPnl, fiat);

    const pnlEl = document.getElementById("card-pnl");
    const pnlSub = document.getElementById("card-pnl-sub");
    const pnlPct =
      (s.totalPnlPercent >= 0 ? "+" : "") + s.totalPnlPercent.toFixed(2) + "%";
    pnlSub.textContent = pnlPct;
    pnlEl.className =
      "summary-card__value " +
      (s.totalPnl >= 0
        ? "summary-card__value--profit"
        : "summary-card__value--loss");
    pnlSub.className =
      "summary-card__sub " +
      (s.totalPnl >= 0 ? "pnl-positive" : "pnl-negative");

    // document.getElementById('card-meta').textContent =
    //   s.profitCount + ' profit / ' + s.lossCount + ' loss \u00B7 ' +
    //   filtered.length + ' assets';
  },

  _renderCharts(assets) {
    const cc = CONFIG.CHART_COLORS;
    const nonFiat = assets.filter((a) => !a.noPrice);

    if (nonFiat.length === 0) {
      document.getElementById("chart-section").classList.add("hidden");
      return;
    }
    document.getElementById("chart-section").classList.remove("hidden");

    Object.values(this._charts).forEach((c) => c.destroy());
    this._charts = {};

    this._chartPnl(nonFiat, cc);
    this._chartInvestedVsValue(nonFiat, cc);
    this._chartAllocation(nonFiat);
    this._chartReturn(nonFiat, cc);
  },

  _chartPnl(assets, cc) {
    const sorted = [...assets].sort((a, b) => a.pnl - b.pnl);
    const ctx = document.getElementById("chart-pnl").getContext("2d");

    this._charts.pnl = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map((a) => a.asset),
        datasets: [
          {
            label: "P&L",
            data: sorted.map((a) => a.pnl),
            backgroundColor: sorted.map((a) =>
              a.pnl >= 0 ? cc.profit : cc.loss,
            ),
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.x;
                const sign = v >= 0 ? "+" : "";
                return "P&L: " + sign + v.toFixed(2);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: cc.grid },
            ticks: {
              color: cc.textDim,
              callback: (v) => (v >= 0 ? "+" : "") + this._compactNum(v),
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: cc.text, font: { family: "Inter" } },
          },
        },
      },
    });
  },

  _chartInvestedVsValue(assets, cc) {
    const sorted = [...assets].sort((a, b) => b.currentValue - a.currentValue);
    const ctx = document
      .getElementById("chart-invested-value")
      .getContext("2d");

    this._charts.investedValue = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map((a) => a.asset),
        datasets: [
          {
            label: "Invested",
            data: sorted.map((a) => a.totalInvested),
            backgroundColor: cc.invested,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: "Current Value",
            data: sorted.map((a) => a.currentValue),
            backgroundColor: cc.primary,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.dataset.label + ": " + ctx.parsed.y.toFixed(2),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: cc.text, font: { family: "Inter" } },
          },
          y: {
            grid: { color: cc.grid },
            ticks: {
              color: cc.textDim,
              callback: (v) => this._compactNum(v),
            },
          },
        },
      },
    });
  },

  _chartAllocation(assets) {
    const ctx = document.getElementById("chart-allocation").getContext("2d");
    const nonFiat = assets.filter((a) => !a.noPrice);
    if (nonFiat.length === 0) return;

    const sorted = [...nonFiat].sort((a, b) => b.currentValue - a.currentValue);
    const colors = [
      "#c4c6ce",
      "#82858c",
      "#5c5e65",
      "#47494e",
      "#7f8591",
      "#b7b8be",
      "#44474d",
      "#414752",
      "#909095",
      "#c6c6cb",
      "#e1e2ea",
      "#dde2f0",
    ];

    const isMobile = window.innerWidth < 768;

    this._charts.allocation = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: sorted.map((a) => a.asset),
        datasets: [
          {
            data: sorted.map((a) => a.currentValue),
            backgroundColor: colors.slice(0, sorted.length),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: isMobile ? "55%" : "65%",
        plugins: {
          legend: {
            position: isMobile ? "bottom" : "right",
            labels: {
              color: "#dae3f1",
              font: { family: "Inter", size: isMobile ? 10 : 12 },
              padding: isMobile ? 4 : 8,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
                const pct =
                  total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : "0.0";
                return " " + pct + "%";
              },
            },
          },
        },
      },
    });
  },

  _chartReturn(assets, cc) {
    const sorted = [...assets].sort((a, b) => b.pnlPercent - a.pnlPercent);
    const ctx = document.getElementById("chart-return").getContext("2d");

    this._charts.returnRank = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map((a) => a.asset),
        datasets: [
          {
            label: "Return %",
            data: sorted.map((a) => a.pnlPercent),
            backgroundColor: sorted.map((a) =>
              a.pnlPercent >= 0 ? cc.profit : cc.loss,
            ),
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.x;
                const sign = v >= 0 ? "+" : "";
                return "Return: " + sign + v.toFixed(2) + "%";
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: cc.grid },
            ticks: {
              color: cc.textDim,
              callback: (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%",
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: cc.text, font: { family: "Inter" } },
          },
        },
      },
    });
  },

  _renderTable(assets) {
    const tbody = document.getElementById("asset-table-body");
    const fiat = this._data.summary.defaultFiat;

    if (assets.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--color-text-dim)">' +
        "No crypto assets found." +
        "</td></tr>";
      return;
    }

    tbody.innerHTML = assets
      .map((a) => {
        const pnlClass = a.pnl >= 0 ? "pnl-positive" : "pnl-negative";
        const pnlSign = a.pnl >= 0 ? "+" : "";
        const pctSign = a.pnlPercent >= 0 ? "+" : "";

        if (a.noPrice) {
          return (
            "<tr>" +
            "<td><strong>" +
            a.asset +
            '</strong><span class="asset-badge">' +
            (a.name || "") +
            "</span></td>" +
            "<td>" +
            a.balance +
            "</td>" +
            '<td colspan="5" style="text-align:center;color:var(--color-text-dim)">No market data</td>' +
            "</tr>"
          );
        }

        return (
          "<tr>" +
          "<td><strong>" +
          a.asset +
          '</strong><span class="asset-badge">' +
          (a.name || "") +
          "</span></td>" +
          "<td>" +
          parseFloat(a.balance).toFixed(6) +
          "</td>" +
          "<td>" +
          this._fmtFiat(a.averageCost || 0, fiat) +
          "</td>" +
          "<td>" +
          this._fmtFiat(a.currentPrice || 0, fiat) +
          "</td>" +
          "<td>" +
          this._fmtFiat(a.currentValue, fiat) +
          "</td>" +
          "<td>" +
          this._fmtFiat(a.totalInvested, fiat) +
          "</td>" +
          '<td class="' +
          pnlClass +
          '">' +
          pnlSign +
          this._fmtFiat(a.pnl, fiat) +
          "</td>" +
          '<td class="' +
          pnlClass +
          '">' +
          pctSign +
          a.pnlPercent.toFixed(2) +
          "%</td>" +
          "</tr>"
        );
      })
      .join("");
  },

  CREDIT_NAME: "WalterDrinkWater",

  SHARE_THEMES: [
    {
      id: "void",
      label: "Celestial Void",
      dot: "#c4c6ce",
      bg1: "#0D121F",
      bg2: "#050505",
      surface: "#18202A",
      text: "#dae3f1",
      muted: "#8E97A4",
      accent: "#c4c6ce",
      profit: "#4ADE80",
      loss: "#F87171",
    },
    {
      id: "light",
      label: "Premium Light",
      dot: "#e2e2e5",
      bg1: "#f5f5f0",
      bg2: "#e8e8e0",
      surface: "#ffffff",
      text: "#1a1c1e",
      muted: "#8e9096",
      accent: "#5c5e65",
      profit: "#10b981",
      loss: "#ef4444",
    },
    {
      id: "green",
      label: "Midnight Green",
      dot: "#4ade80",
      bg1: "#0f1a0f",
      bg2: "#050a05",
      surface: "#1a2e1a",
      text: "#e2f0e2",
      muted: "#7a9a7a",
      accent: "#4ade80",
      profit: "#4ade80",
      loss: "#f87171",
    },
    {
      id: "gold",
      label: "Royal Gold",
      dot: "#f2ca50",
      bg1: "#1a1510",
      bg2: "#0d0a05",
      surface: "#2a2015",
      text: "#f0e6d3",
      muted: "#a09070",
      accent: "#f2ca50",
      profit: "#4ade80",
      loss: "#f87171",
    },
  ],

  SHARE_TEMPLATES: [
    {
      id: "summary",
      label: "Portfolio Summary",
      icon: "account_balance_wallet",
    },
    { id: "assets", label: "Top Assets", icon: "currency_bitcoin" },
  ],
  _selectedTemplate: "summary",
  _selectedTheme: "void",
  _templateCanvas: null,

  async shareDashboard() {
    this._showShareOverlay();
  },

  _showShareOverlay() {
    if (!this._data) return;
    const overlay = document.getElementById("share-overlay");
    overlay.classList.remove("share-overlay--hidden");
    const status = document.getElementById("share-status");
    if (status) status.style.display = "none";
    this._selectedTemplate = "summary";
    this._selectedTheme = "void";
    this._renderTemplateGrid();
    this._renderThemePicker();
    this._renderCurrentTemplate();
  },

  _renderTemplateGrid() {
    const grid = document.getElementById("share-template-grid");
    grid.innerHTML = this.SHARE_TEMPLATES.map((t) => {
      const sel =
        t.id === this._selectedTemplate ? " share-template--selected" : "";
      return (
        '<div class="share-template' +
        sel +
        '" onclick="Dashboard.selectTemplate(\'' +
        t.id +
        "')\">" +
        '<span class="icon share-template__icon icon--xl">' +
        t.icon +
        "</span>" +
        '<span class="share-template__label">' +
        t.label +
        "</span>" +
        "</div>"
      );
    }).join("");
  },

  _renderThemePicker() {
    const picker = document.getElementById("share-theme-picker");
    picker.innerHTML = this.SHARE_THEMES.map((th) => {
      const sel =
        th.id === this._selectedTheme ? " share-theme-dot--selected" : "";
      return (
        '<div class="share-theme-dot' +
        sel +
        '" style="background:' +
        th.dot +
        '" title="' +
        th.label +
        '" onclick="Dashboard.selectTheme(\'' +
        th.id +
        "')\"></div>"
      );
    }).join("");
  },

  selectTemplate(id) {
    this._selectedTemplate = id;
    this._renderTemplateGrid();
    this._renderCurrentTemplate();
  },

  selectTheme(id) {
    this._selectedTheme = id;
    this._renderThemePicker();
    this._renderCurrentTemplate();
  },

  _renderCurrentTemplate() {
    const canvas = this._buildTemplate(
      this._selectedTemplate,
      this._selectedTheme,
    );
    const img = document.getElementById("share-preview-img");
    if (canvas) {
      img.src = canvas.toDataURL("image/png");
      img.style.display = "";
    }
  },

  _buildTemplate(tmplId, themeId) {
    const data = this._data;
    if (!data) return null;
    const theme =
      this.SHARE_THEMES.find((t) => t.id === themeId) || this.SHARE_THEMES[0];
    const w = 1200,
      h = 628;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    this._drawShareBg(ctx, w, h, theme);
    this._drawShareHeader(ctx, w, theme);
    this._drawShareFooter(ctx, w, h, theme);

    try {
      if (tmplId === "summary") this._drawTplSummary(ctx, w, h, data, theme);
      else if (tmplId === "assets") this._drawTplAssets(ctx, w, h, data, theme);
    } catch (e) {
      console.error("Template render error:", e);
    }

    this._templateCanvas = canvas;
    return canvas;
  },

  _drawShareBg(ctx, w, h, theme) {
    const grad = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, w);
    grad.addColorStop(0, theme.bg1);
    grad.addColorStop(1, theme.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },

  _drawShareHeader(ctx, w, theme) {
    ctx.font = '600 26px "Manrope"';
    const dashW = ctx.measureText("Luno Dashboard").width;
    ctx.fillStyle = theme.text;
    ctx.textAlign = "left";
    ctx.fillText("Luno Dashboard", 48, 43);

    ctx.font = '400 14px "Manrope"';
    ctx.fillStyle = theme.muted;
    ctx.fillText(" by " + this.CREDIT_NAME, 48 + dashW, 43);
  },

  _drawShareFooter(ctx, w, h, theme) {
    const referral = Storage.getReferralCode();
    if (!referral) return;
    ctx.font = '500 16px "JetBrains Mono"';
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.fillText("Referral Code: " + referral, w / 2, h - 32);
  },

  _drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  _drawTplSummary(ctx, w, h, data, theme) {
    const s = data.summary;
    const fiat = s.defaultFiat;
    const cardW = 340,
      cardH = 160,
      gap = 30;
    const startX = (w - (cardW * 3 + gap * 2)) / 2;
    const cardY = 140;

    const metrics = [
      { label: "Total Value", value: s.totalValue, color: theme.text },
      { label: "Total Invested", value: s.totalInvested, color: theme.muted },
      {
        label: "Total P&L",
        value: s.totalPnl,
        color: s.totalPnl >= 0 ? theme.profit : theme.loss,
      },
    ];

    metrics.forEach((m, i) => {
      const cx = startX + i * (cardW + gap);
      ctx.fillStyle = theme.surface;
      this._drawRoundedRect(ctx, cx, cardY, cardW, cardH, 16);
      ctx.fill();

      ctx.font = '500 16px "JetBrains Mono"';
      ctx.fillStyle = theme.muted;
      ctx.textAlign = "center";
      ctx.fillText(m.label.toUpperCase(), cx + cardW / 2, cardY + 36);

      ctx.font = '700 38px "Manrope"';
      ctx.fillStyle = m.color;
      const sign = i === 2 ? (m.value >= 0 ? "+" : "") : "";
      ctx.fillText(
        sign +
          fiat +
          " " +
          Number(m.value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        cx + cardW / 2,
        cardY + 90,
      );

      if (i === 2) {
        ctx.font = '600 18px "Manrope"';
        const pct =
          (s.totalPnlPercent >= 0 ? "+" : "") +
          s.totalPnlPercent.toFixed(2) +
          "%";
        ctx.fillText(pct, cx + cardW / 2, cardY + 124);
      }
    });

    ctx.font = '500 15px "Inter"';
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.fillText(
      s.profitCount +
        " profit / " +
        s.lossCount +
        " loss · " +
        s.nonFiatCount +
        " assets",
      w / 2,
      cardY + cardH + 50,
    );
  },

  _drawTplAssets(ctx, w, h, data, theme) {
    const assets = (data.assets || [])
      .filter((a) => !a.isFiat && !a.noPrice)
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5);
    if (assets.length === 0) return;
    const fiat = data.summary.defaultFiat;
    const startY = 120,
      rowH = 62,
      colX = [60, 400, 680, 910];

    ctx.font = '600 18px "Manrope"';
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "left";
    ctx.fillText("Top Assets", 48, startY);

    ctx.font = '500 11px "JetBrains Mono"';
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "left";
    ctx.fillText("ASSET", colX[0], startY + 30);
    ctx.textAlign = "right";
    ctx.fillText("VALUE", colX[1], startY + 30);
    ctx.fillText("P&L %", colX[2], startY + 30);
    ctx.fillText("TOTAL P&L", colX[3] + 80, startY + 30);

    assets.forEach((a, i) => {
      const y = startY + 50 + i * rowH;

      ctx.font = '600 16px "Manrope"';
      ctx.fillStyle = theme.text;
      ctx.textAlign = "left";
      ctx.fillText(a.asset, colX[0], y);

      ctx.font = '500 14px "JetBrains Mono"';
      ctx.fillStyle = theme.text;
      ctx.textAlign = "right";
      ctx.fillText(
        fiat +
          " " +
          Number(a.currentValue).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        colX[1],
        y,
      );

      ctx.fillStyle = a.pnlPercent >= 0 ? theme.profit : theme.loss;
      const sign = a.pnlPercent >= 0 ? "+" : "";
      ctx.fillText(sign + a.pnlPercent.toFixed(2) + "%", colX[2], y);

      const pnlSign = a.pnl >= 0 ? "+" : "";
      ctx.fillText(
        pnlSign +
          fiat +
          " " +
          Math.abs(a.pnl).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        colX[3] + 80,
        y,
      );
    });

    ctx.font = '500 13px "Inter"';
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.fillText(
      "Total Value: " +
        fiat +
        " " +
        Number(data.summary.totalValue).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      w / 2,
      startY + 50 + assets.length * rowH + 30,
    );
  },

  _drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  shareTemplate() {
    const canvas = this._templateCanvas;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const blob = this._dataURLToBlob(dataUrl);
      const file = new File([blob], "luno-dashboard.png", { type: "image/png" });
      const isMobile = window.innerWidth < 768 || "ontouchstart" in window;

      if (isMobile) {
        navigator.share({ title: "Luno Dashboard", files: [file] })
          .then(() => this._setShareStatus("Sent to share sheet"))
          .catch(() => this._setShareStatus("Share cancelled — click Download to save"));
      } else {
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ])
          .then(() => this._setShareStatus("Image copied to clipboard — paste to share"))
          .catch(() => {
            this._setShareStatus("Copy failed — click Download to save");
            this.downloadShare();
          });
      }
    } catch {
      this.downloadShare();
    }
  },

  _setShareStatus(msg) {
    const el = document.getElementById("share-status");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
  },

  _dataURLToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)[1];
    const bytes = atob(parts[1]);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  },

  closeShare() {
    document
      .getElementById("share-overlay")
      .classList.add("share-overlay--hidden");
  },

  downloadShare() {
    const canvas = this._templateCanvas;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "luno-dashboard-" + Date.now() + ".png";
    a.click();
  },

  refresh() {
    this.loadData();
  },

  _initResizeHandler() {
    window.addEventListener("resize", () => {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        if (this._lastFiltered.length === 0) return;
        Object.values(this._charts).forEach((c) => c.destroy());
        this._charts = {};
        this._renderCharts(this._lastFiltered);
      }, 150);
    });
  },

  toggleAssetVisibility(asset) {
    const visMap = Storage.getAssetVisibility();
    visMap[asset] = !visMap[asset];
    Storage.saveBulkAssetVisibility(visMap);
    this.render();
    this._renderDrawerAssetList();
  },

  _renderDrawerAssetList() {
    const container = document.getElementById("drawer-asset-list");
    if (!container) return;
    const nonFiat = (this._data.assets || []).filter((a) => !a.isFiat);
    if (nonFiat.length === 0) {
      container.innerHTML = '<div class="drawer-section__desc">No assets</div>';
      return;
    }
    const visMap = Storage.getAssetVisibility();
    container.innerHTML = nonFiat
      .map((a) => {
        const visible = visMap[a.asset] !== false;
        const checked = visible ? "checked" : "";
        return (
          '<div class="drawer-asset-row">' +
          '<span class="drawer-asset-row__left">' +
          a.asset +
          '<span class="drawer-asset-row__badge">' +
          (a.name || "") +
          "</span>" +
          "</span>" +
          '<label class="switch">' +
          '<input type="checkbox" ' +
          checked +
          " onchange=\"Dashboard.toggleAssetVisibility('" +
          a.asset +
          "')\" />" +
          '<span class="switch-slider"></span>' +
          "</label>" +
          "</div>"
        );
      })
      .join("");
  },

  openDrawer() {
    document
      .getElementById("settings-drawer")
      .classList.add("drawer-overlay--open");
    document.body.classList.add("body--drawer-open");
    this._renderDrawerAssetList();
  },

  closeDrawer() {
    document
      .getElementById("settings-drawer")
      .classList.remove("drawer-overlay--open");
    document.body.classList.remove("body--drawer-open");
  },

  resetApiKey() {
    this.closeDrawer();
    Router.go("#/setup");
    // setTimeout(() => , 250);
  },

  _fmtFiat(val, currency) {
    return (
      currency +
      " " +
      Number(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  },

  _compactNum(val) {
    const abs = Math.abs(val);
    if (abs >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (abs >= 1000) return (val / 1000).toFixed(1) + "K";
    return val.toFixed(2);
  },
};
