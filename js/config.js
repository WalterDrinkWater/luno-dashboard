const CONFIG = {
  API_BASE_URL:
    window.location.hostname === "localhost"
      ? ""
      : "https://luno-dashboard-proxy.qingshui9362.workers.dev",

  STORAGE_KEYS: {
    API_KEY: "luno_api_key",
    REFERRAL_CODE: "luno_referral_code",
  },

  ASSET_DISPLAY_NAMES: {
    "XBT": "BTC",
  },

  FIAT_CURRENCIES: [
    "MYR",
    "ZAR",
    "EUR",
    "GBP",
    "AUD",
    "IDR",
    "NGN",
    "UGX",
    "KES",
    "NAD",
    "ZMW",
    "SGD",
    "UGX",
  ],

  CHART_COLORS: {
    profit: "rgba(74, 222, 128, 0.7)",
    profitLight: "#4ADE80",
    loss: "rgba(248, 113, 113, 0.7)",
    lossBg: "rgba(248, 113, 113, 0.15)",
    realizedProfit: "rgba(74, 222, 128, 0.9)",
    realizedLoss: "rgba(248, 113, 113, 0.9)",
    unrealizedProfit: "rgba(74, 222, 128, 0.35)",
    unrealizedLoss: "rgba(248, 113, 113, 0.25)",
    staking: "rgba(240, 185, 11, 0.75)",
    deposit: "rgba(142, 151, 164, 0.6)",
    neutral: "#8E97A4",
    primary: "#c4c6ce",
    primaryGlow: "rgba(196, 198, 206, 0.2)",
    grid: "#1A1D23",
    text: "#dae3f1",
    textDim: "#8E97A4",
    invested: "#82858c",
    value: "#82858c",
    background: "#18202a",
    backgroundAlt: "#222b35",
  },

  TUTORIAL_IMAGES: {
    step1: "https://guide.luno.com/hc/article_attachments/24591611426845",
    step2: "https://guide.luno.com/hc/article_attachments/24591547396125",
    step3: "https://guide.luno.com/hc/article_attachments/24591547401501",
    step4: "https://guide.luno.com/hc/article_attachments/24608221370269",
    step5: "https://guide.luno.com/hc/article_attachments/24591547406109",
    step7: "https://guide.luno.com/hc/article_attachments/24591535030173",
  },

  REQUIRED_PERMISSIONS: [
    { id: "Perm_R_Balance", code: 1, label: "View balance" },
    { id: "Perm_R_Transactions", code: 2, label: "View transactions" },
    { id: "Perm_R_Orders", code: 32, label: "View orders" },
  ],

  ROUTES: {
    DASHBOARD: "#/dashboard",
    SETUP: "#/setup",
    TUTORIAL: "#/tutorial",
    ABOUT: "#/about",
  },
};
