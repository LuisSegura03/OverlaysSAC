import type {
  CategoryState,
  Competitor,
  CopaState,
  OverlayData,
  OverlayState,
  OverlayStyles,
} from "../src/types";

type OverlayStateUpdate = Partial<Omit<OverlayState, "updatedAt">> & {
  styles?: Partial<OverlayStyles>;
};

const DEFAULT_WCA_CATEGORIES = [
  { id: "333", name: "3x3x3 Cube", eventName: "WCA 3x3x3 Cube - South American Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["11.24", "12.50", "9.80", "15.30", "11.10"], defaultP2Name: "Max Park", defaultP2Times: ["3.13", "4.50", "3.80", "3.63", "4.11"] },
  { id: "222", name: "2x2x2 Cube", eventName: "WCA 2x2x2 Cube - Championship 2026", defaultP1Name: "Zayn Khan", defaultP1Times: ["2.52", "3.10", "2.10", "3.85", "1.99"], defaultP2Name: "Antonin Y.", defaultP2Times: ["1.20", "1.45", "1.10", "1.80", "1.30"] },
  { id: "444", name: "4x4x4 Cube", eventName: "WCA 4x4x4 Cube - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["42.50", "44.10", "39.80", "45.00", "41.20"], defaultP2Name: "Max Park", defaultP2Times: ["17.50", "18.20", "16.80", "19.10", "17.90"] },
  { id: "555", name: "5x5x5 Cube", eventName: "WCA 5x5x5 Cube - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["1:15.20", "1:12.80", "1:18.50", "1:14.30", "1:10.90"], defaultP2Name: "Max Park", defaultP2Times: ["34.50", "36.20", "35.10", "33.90", "34.80"] },
  { id: "333oh", name: "3x3x3 One-Handed", eventName: "WCA 3x3x3 OH - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["18.50", "19.20", "17.90", "21.10", "18.20"], defaultP2Name: "Fawaz A.", defaultP2Times: ["9.80", "10.50", "10.10", "11.20", "9.50"] },
  { id: "pyram", name: "Pyraminx", eventName: "WCA Pyraminx - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["4.50", "5.10", "4.20", "6.20", "4.80"], defaultP2Name: "Steven W.", defaultP2Times: ["1.20", "1.45", "1.10", "1.80", "1.30"] },
  { id: "skewb", name: "Skewb", eventName: "WCA Skewb - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["5.20", "6.10", "4.80", "7.10", "5.50"], defaultP2Name: "Carter K.", defaultP2Times: ["1.80", "2.10", "1.95", "3.20", "1.50"] },
  { id: "clock", name: "Clock", eventName: "WCA Clock - Championship 2026", defaultP1Name: "Luis Competidor", defaultP1Times: ["8.50", "9.10", "7.80", "10.20", "8.90"], defaultP2Name: "Eryk K.", defaultP2Times: ["3.20", "3.90", "3.50", "4.10", "3.40"] },
];

function createDefaultCopaState(): CopaState {
  return {
    tournamentName: "COPA DE NACIONES",
    subTitle: "domingo, 14 de junio de 2026",
    mode: "16teams",
    matches: [
      { id: 1, team1: { name: "Ecuador", countryCode: "EC", flagUrl: "https://flagcdn.com/w80/ec.png" }, team2: { name: "Guatemala", countryCode: "GT", flagUrl: "https://flagcdn.com/w80/gt.png" }, winner: null },
      { id: 2, team1: { name: "Argentina", countryCode: "AR", flagUrl: "https://flagcdn.com/w80/ar.png" }, team2: { name: "Bolivia", countryCode: "BO", flagUrl: "https://flagcdn.com/w80/bo.png" }, winner: null },
      { id: 3, team1: { name: "Panamá", countryCode: "PA", flagUrl: "https://flagcdn.com/w80/pa.png" }, team2: { name: "Paraguay", countryCode: "PY", flagUrl: "https://flagcdn.com/w80/py.png" }, winner: null },
      { id: 4, team1: { name: "Brasil 1", countryCode: "BR", flagUrl: "https://flagcdn.com/w80/br.png" }, team2: { name: "Brasil 2", countryCode: "BR", flagUrl: "https://flagcdn.com/w80/br.png" }, winner: null },
      { id: 5, team1: { name: "Perú", countryCode: "PE", flagUrl: "https://flagcdn.com/w80/pe.png" }, team2: { name: "República Dominicana", countryCode: "DO", flagUrl: "https://flagcdn.com/w80/do.png" }, winner: null },
      { id: 6, team1: { name: "Colombia 1", countryCode: "CO", flagUrl: "https://flagcdn.com/w80/co.png" }, team2: { name: "Colombia 2", countryCode: "CO", flagUrl: "https://flagcdn.com/w80/co.png" }, winner: null },
      { id: 7, team1: { name: "Venezuela", countryCode: "VE", flagUrl: "https://flagcdn.com/w80/ve.png" }, team2: { name: "Chile", countryCode: "CL", flagUrl: "https://flagcdn.com/w80/cl.png" }, winner: null },
      { id: 8, team1: { name: "Colombia 3", countryCode: "CO", flagUrl: "https://flagcdn.com/w80/co.png" }, team2: { name: "Costa Rica", countryCode: "CR", flagUrl: "https://flagcdn.com/w80/cr.png" }, winner: null },
      { id: 9, team1: { name: "Ganador Octavos 1", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Octavos 2", countryCode: "", flagUrl: "" }, winner: null },
      { id: 10, team1: { name: "Ganador Octavos 3", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Octavos 4", countryCode: "", flagUrl: "" }, winner: null },
      { id: 11, team1: { name: "Ganador Octavos 5", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Octavos 6", countryCode: "", flagUrl: "" }, winner: null },
      { id: 12, team1: { name: "Ganador Octavos 7", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Octavos 8", countryCode: "", flagUrl: "" }, winner: null },
      { id: 13, team1: { name: "Ganador Cuartos 1", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Cuartos 2", countryCode: "", flagUrl: "" }, winner: null },
      { id: 14, team1: { name: "Ganador Cuartos 3", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Cuartos 4", countryCode: "", flagUrl: "" }, winner: null },
      { id: 15, team1: { name: "Ganador Semis 1", countryCode: "", flagUrl: "" }, team2: { name: "Ganador Semis 2", countryCode: "", flagUrl: "" }, winner: null },
    ],
    activeMatchId: 1,
    currentPhase: "octavos",
  };
}

function createDefaultCompetitors(categoryId: string, competitorOne: string, competitorTwo: string, timesOne: string[], timesTwo: string[]): Competitor[] {
  return [
    {
      id: `comp-${categoryId}-1`,
      competitorName: competitorOne,
      countryName: "Colombia",
      countryFlagUrl: "https://flagcdn.com/w80/co.png",
      times: timesOne,
    },
    {
      id: `comp-${categoryId}-2`,
      competitorName: competitorTwo,
      countryName: "Estados Unidos",
      countryFlagUrl: "https://flagcdn.com/w80/us.png",
      times: timesTwo,
    },
  ];
}

export function buildDefaultCategories(
  existingData?: OverlayData,
  existingCompetitors?: Competitor[],
  existingActive?: string,
  existingActive2?: string,
  existingEventName?: string,
): Record<string, CategoryState> {
  const categories: Record<string, CategoryState> = {};

  DEFAULT_WCA_CATEGORIES.forEach((cat) => {
    if (cat.id === "333" && existingData) {
      categories[cat.id] = {
        id: cat.id,
        name: cat.name,
        eventName: existingEventName || cat.eventName,
        data: {
          competitorName: existingData.competitorName,
          countryName: existingData.countryName,
          countryFlagUrl: existingData.countryFlagUrl,
          times: existingData.times,
        },
        competitors: existingCompetitors || [],
        activeCompetitorId: existingActive,
        activeCompetitorId2: existingActive2,
      };
      return;
    }

    categories[cat.id] = {
      id: cat.id,
      name: cat.name,
      eventName: cat.eventName,
      data: {
        competitorName: cat.defaultP1Name,
        countryName: "Colombia",
        countryFlagUrl: "https://flagcdn.com/w80/co.png",
        times: cat.defaultP1Times,
      },
      competitors: createDefaultCompetitors(cat.id, cat.defaultP1Name, cat.defaultP2Name, cat.defaultP1Times, cat.defaultP2Times),
      activeCompetitorId: `comp-${cat.id}-1`,
      activeCompetitorId2: `comp-${cat.id}-2`,
    };
  });

  return categories;
}

export function createDefaultState(): OverlayState {
  const state: OverlayState = {
    data: {
      competitorName: "Luis Competidor",
      countryName: "Colombia",
      countryFlagUrl: "https://flagcdn.com/w80/co.png",
      times: ["11.24", "12.50", "9.80", "15.30", "11.10"],
    },
    styles: {
      fontFamily: "Space Grotesk",
      fontSize: "base",
      backgroundColor: "#0d0e12",
      bgOpacity: 85,
      textColor: "#ffffff",
      accentColor: "#38bdf8",
      borderColor: "#334155",
      borderWidth: 1,
      borderRadius: "lg",
      showStrikeouts: true,
      showFlag: true,
      padding: "normal",
      shadow: "md",
      animation: "pop",
      width: 380,
      layout: "single",
      versusLayoutType: "cards",
      eventName: "WCA 3x3x3 Cube - South American Championship 2026",
    },
    competitors: createDefaultCompetitors(
      "333",
      "Luis Competidor",
      "Max Park",
      ["11.24", "12.50", "9.80", "15.30", "11.10"],
      ["3.13", "4.50", "3.80", "3.63", "4.11"],
    ),
    activeCompetitorId: "comp-333-1",
    activeCompetitorId2: "comp-333-2",
    isVisible: true,
    currentCategoryId: "333",
    categories: {},
    copaState: createDefaultCopaState(),
    updatedAt: Date.now(),
  };

  state.categories = buildDefaultCategories(
    state.data,
    state.competitors,
    state.activeCompetitorId,
    state.activeCompetitorId2,
    state.styles.eventName,
  );

  return state;
}

export function normalizeOverlayState(input: unknown): OverlayState {
  const defaults = createDefaultState();

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const parsed = input as Partial<OverlayState> & Record<string, any>;
  const competitors = Array.isArray(parsed.competitors) && parsed.competitors.length > 0
    ? parsed.competitors
    : [
        {
          id: "comp-333-1",
          competitorName: parsed.data?.competitorName || defaults.data.competitorName,
          countryName: parsed.data?.countryName || defaults.data.countryName,
          countryFlagUrl: parsed.data?.countryFlagUrl || defaults.data.countryFlagUrl,
          times: parsed.data?.times || defaults.data.times,
        },
      ];

  const currentCategoryId = parsed.currentCategoryId || "333";
  const data = parsed.data || defaults.data;
  const styles: OverlayStyles = {
    ...defaults.styles,
    ...(parsed.styles || {}),
  };

  const categories = buildDefaultCategories(
    data,
    competitors,
    parsed.activeCompetitorId || competitors[0]?.id || defaults.activeCompetitorId,
    parsed.activeCompetitorId2 || competitors[1]?.id || competitors[0]?.id || defaults.activeCompetitorId2,
    styles.eventName,
  );

  if (parsed.categories && typeof parsed.categories === "object") {
    Object.entries(parsed.categories).forEach(([categoryId, categoryValue]) => {
      if (!categoryValue || typeof categoryValue !== "object") {
        return;
      }

      const incoming = categoryValue as Partial<CategoryState>;
      const base = categories[categoryId] || categories[defaults.currentCategoryId || "333"];
      categories[categoryId] = {
        ...base,
        ...incoming,
        data: incoming.data || base.data,
        competitors: Array.isArray(incoming.competitors) && incoming.competitors.length > 0 ? incoming.competitors : base.competitors,
        activeCompetitorId: incoming.activeCompetitorId ?? base.activeCompetitorId,
        activeCompetitorId2: incoming.activeCompetitorId2 ?? base.activeCompetitorId2,
        eventName: incoming.eventName || base.eventName,
      };
    });
  }

  if (!styles.eventName) {
    styles.eventName = categories[currentCategoryId]?.eventName || defaults.styles.eventName;
  }

  return {
    data,
    styles,
    competitors,
    activeCompetitorId: parsed.activeCompetitorId || competitors[0]?.id || defaults.activeCompetitorId,
    activeCompetitorId2: parsed.activeCompetitorId2 || competitors[1]?.id || competitors[0]?.id || defaults.activeCompetitorId2,
    isVisible: parsed.isVisible ?? true,
    currentCategoryId,
    categories,
    copaState: parsed.copaState || defaults.copaState,
    updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
  };
}

export function mergeOverlayState(currentState: OverlayState, updates: OverlayStateUpdate): OverlayState {
  const normalizedCurrent = normalizeOverlayState(currentState);
  let {
    data,
    styles,
    competitors,
    activeCompetitorId,
    activeCompetitorId2,
    isVisible,
    currentCategoryId,
    categories,
    copaState,
  } = updates;

  const targetCategoryId = currentCategoryId || normalizedCurrent.currentCategoryId || "333";
  const oldCategoryId = normalizedCurrent.currentCategoryId || "333";
  const nextCategories = categories !== undefined ? { ...categories } : { ...(normalizedCurrent.categories || {}) };

  if (nextCategories[oldCategoryId]) {
    nextCategories[oldCategoryId] = {
      ...nextCategories[oldCategoryId],
      data: data !== undefined ? data : normalizedCurrent.data,
      competitors: competitors !== undefined ? competitors : normalizedCurrent.competitors,
      activeCompetitorId: activeCompetitorId !== undefined ? activeCompetitorId : normalizedCurrent.activeCompetitorId,
      activeCompetitorId2: activeCompetitorId2 !== undefined ? activeCompetitorId2 : normalizedCurrent.activeCompetitorId2,
      eventName: styles?.eventName !== undefined ? styles.eventName : normalizedCurrent.styles.eventName,
    };
  }

  if (currentCategoryId !== undefined && currentCategoryId !== normalizedCurrent.currentCategoryId) {
    const nextCategory = nextCategories[currentCategoryId];
    if (nextCategory) {
      data = nextCategory.data;
      competitors = nextCategory.competitors;
      activeCompetitorId = nextCategory.activeCompetitorId;
      activeCompetitorId2 = nextCategory.activeCompetitorId2;
      styles = { ...(styles || {}), eventName: nextCategory.eventName || styles?.eventName || normalizedCurrent.styles.eventName };
    }
  }

  const mergedState: OverlayState = {
    data: data !== undefined ? data : normalizedCurrent.data,
    styles: styles ? { ...normalizedCurrent.styles, ...styles } : normalizedCurrent.styles,
    competitors: competitors !== undefined ? competitors : normalizedCurrent.competitors,
    activeCompetitorId: activeCompetitorId !== undefined ? activeCompetitorId : normalizedCurrent.activeCompetitorId,
    activeCompetitorId2: activeCompetitorId2 !== undefined ? activeCompetitorId2 : normalizedCurrent.activeCompetitorId2,
    isVisible: isVisible !== undefined ? isVisible : normalizedCurrent.isVisible,
    currentCategoryId: targetCategoryId,
    categories: nextCategories,
    copaState: copaState !== undefined ? copaState : normalizedCurrent.copaState,
    updatedAt: Date.now(),
  };

  if (mergedState.currentCategoryId && mergedState.categories?.[mergedState.currentCategoryId]) {
    mergedState.categories[mergedState.currentCategoryId] = {
      ...mergedState.categories[mergedState.currentCategoryId],
      data: mergedState.data,
      competitors: mergedState.competitors,
      activeCompetitorId: mergedState.activeCompetitorId,
      activeCompetitorId2: mergedState.activeCompetitorId2,
      eventName: mergedState.styles.eventName || "",
    };
  }

  return normalizeOverlayState(mergedState);
}