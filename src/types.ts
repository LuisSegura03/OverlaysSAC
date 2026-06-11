export interface Competitor {
  id: string;
  competitorName: string;
  countryName: string;
  countryFlagUrl: string;
  times: string[]; // Length 5
}

export interface OverlayData {
  competitorName: string;
  countryName: string;
  countryFlagUrl: string;
  times: string[]; // Length 5
}

export interface OverlayStyles {
  fontFamily: 'Inter' | 'Space Grotesk' | 'JetBrains Mono' | 'Outfit' | 'Playfair Display';
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  backgroundColor: string; // Hex color for background
  bgOpacity: number; // 0 to 100
  textColor: string; // Hex color
  accentColor: string; // Hex color for average/prominent items
  borderColor: string; // Hex color
  borderWidth: number; // in pixels (0 to 8)
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showStrikeouts: boolean; // Strikeout min/max times
  showFlag: boolean; // Render country flag
  padding: 'compact' | 'normal' | 'cozy';
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'overlay';
  animation: 'none' | 'fade' | 'pop' | 'slide';
  width: number; // in pixels
  layout: 'single' | 'versus' | 'ranking' | 'copa' | 'copa_match'; // Layout mode
  versusLayoutType: 'cards' | 'table'; // Versus layout style format
  eventName: string; // Dynamic championship/event title for table layout
}

export interface CopaTeam {
  name: string;
  countryCode: string;
  flagUrl: string;
}

export interface CopaMatch {
  id: number; // 1 to 15 (or more)
  team1: CopaTeam;
  team2: CopaTeam;
  winner: 1 | 2 | null; // 1 = team1, 2 = team2, null = pending
  score1?: string;
  score2?: string;
}

export interface CopaState {
  tournamentName: string;
  subTitle: string; // e.g. "domingo, 14 de junio de 2026"
  mode: '8teams' | '16teams'; // 8 teams starts at Quarters (matches 9-12), 16 teams starts at Octavos (matches 1-8)
  matches: CopaMatch[];
  activeMatchId?: number;
  currentPhase: 'octavos' | 'cuartos' | 'semis' | 'final' | 'champion';
}

export interface CategoryState {
  id: string; // e.g. "333"
  name: string; // e.g. "3x3x3 Cube"
  data: OverlayData;
  competitors: Competitor[];
  activeCompetitorId?: string;
  activeCompetitorId2?: string;
  eventName: string; // independent event name for this category
}

export interface OverlayState {
  data: OverlayData;
  styles: OverlayStyles;
  competitors: Competitor[];
  activeCompetitorId?: string;
  activeCompetitorId2?: string; // Secondary active competitor
  isVisible?: boolean; // Toggle overlay visibility
  currentCategoryId?: string; // Active category ID (e.g. "333", "444")
  categories?: Record<string, CategoryState>; // All categories configurations mapped by id
  copaState?: CopaState;
  updatedAt: number; // Timestamp
}

export interface CountryPreset {
  name: string;
  code: string;
  flagUrl: string;
}

// Pre-defined set of countries of North, Central, and South America
export const POPULAR_COUNTRIES: CountryPreset[] = [
  // Norteamérica
  { name: 'Canadá', code: 'CA', flagUrl: 'https://flagcdn.com/w80/ca.png' },
  { name: 'Estados Unidos', code: 'US', flagUrl: 'https://flagcdn.com/w80/us.png' },
  { name: 'México', code: 'MX', flagUrl: 'https://flagcdn.com/w80/mx.png' },
  
  // Centroamérica
  { name: 'Belice', code: 'BZ', flagUrl: 'https://flagcdn.com/w80/bz.png' },
  { name: 'Costa Rica', code: 'CR', flagUrl: 'https://flagcdn.com/w80/cr.png' },
  { name: 'El Salvador', code: 'SV', flagUrl: 'https://flagcdn.com/w80/sv.png' },
  { name: 'Guatemala', code: 'GT', flagUrl: 'https://flagcdn.com/w80/gt.png' },
  { name: 'Honduras', code: 'HN', flagUrl: 'https://flagcdn.com/w80/hn.png' },
  { name: 'Nicaragua', code: 'NI', flagUrl: 'https://flagcdn.com/w80/ni.png' },
  { name: 'Panamá', code: 'PA', flagUrl: 'https://flagcdn.com/w80/pa.png' },

  // El Caribe
  { name: 'Bahamas', code: 'BS', flagUrl: 'https://flagcdn.com/w80/bs.png' },
  { name: 'Cuba', code: 'CU', flagUrl: 'https://flagcdn.com/w80/cu.png' },
  { name: 'Haití', code: 'HT', flagUrl: 'https://flagcdn.com/w80/ht.png' },
  { name: 'Jamaica', code: 'JM', flagUrl: 'https://flagcdn.com/w80/jm.png' },
  { name: 'Puerto Rico', code: 'PR', flagUrl: 'https://flagcdn.com/w80/pr.png' },
  { name: 'República Dominicana', code: 'DO', flagUrl: 'https://flagcdn.com/w80/do.png' },
  { name: 'Trinidad y Tobago', code: 'TT', flagUrl: 'https://flagcdn.com/w80/tt.png' },

  // Sudamérica
  { name: 'Argentina', code: 'AR', flagUrl: 'https://flagcdn.com/w80/ar.png' },
  { name: 'Bolivia', code: 'BO', flagUrl: 'https://flagcdn.com/w80/bo.png' },
  { name: 'Brasil', code: 'BR', flagUrl: 'https://flagcdn.com/w80/br.png' },
  { name: 'Chile', code: 'CL', flagUrl: 'https://flagcdn.com/w80/cl.png' },
  { name: 'Colombia', code: 'CO', flagUrl: 'https://flagcdn.com/w80/co.png' },
  { name: 'Ecuador', code: 'EC', flagUrl: 'https://flagcdn.com/w80/ec.png' },
  { name: 'Guyana', code: 'GY', flagUrl: 'https://flagcdn.com/w80/gy.png' },
  { name: 'Paraguay', code: 'PY', flagUrl: 'https://flagcdn.com/w80/py.png' },
  { name: 'Perú', code: 'PE', flagUrl: 'https://flagcdn.com/w80/pe.png' },
  { name: 'Surinam', code: 'SR', flagUrl: 'https://flagcdn.com/w80/sr.png' },
  { name: 'Uruguay', code: 'UY', flagUrl: 'https://flagcdn.com/w80/uy.png' },
  { name: 'Venezuela', code: 'VE', flagUrl: 'https://flagcdn.com/w80/ve.png' },

  // Adiciones Comunes
  { name: 'España', code: 'ES', flagUrl: 'https://flagcdn.com/w80/es.png' },
];
