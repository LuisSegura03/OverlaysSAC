import { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Settings, 
  Eye, 
  EyeOff,
  Copy, 
  Check, 
  HelpCircle, 
  Database, 
  Layout, 
  Palette, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Flag, 
  User, 
  Clock, 
  Monitor, 
  TrendingUp, 
  Search,
  CheckCircle,
  FileSpreadsheet,
  Plus,
  Trash2
} from 'lucide-react';
import { OverlayState, OverlayData, OverlayStyles, POPULAR_COUNTRIES, CountryPreset, Competitor } from './types';

// Simple calculation helper
interface ParsedTime {
  raw: string;
  value: number; // in seconds, DNF = Infinity
  isDNF: boolean;
  index: number;
}

function computeAo5(times: string[]) {
  const parsed: ParsedTime[] = times.map((t, index) => {
    const cleanValue = t.trim().toUpperCase();
    if (cleanValue === 'DNF' || cleanValue === '') {
      return { raw: t, value: Infinity, isDNF: true, index };
    }
    const val = parseFloat(cleanValue);
    if (isNaN(val)) {
      return { raw: t, value: Infinity, isDNF: true, index };
    }
    return { raw: t, value: val, isDNF: false, index };
  });

  if (parsed.length < 5) {
    return {
      average: 'N/A',
      bestIdx: -1,
      worstIdx: -1,
      valid: false
    };
  }

  // Sort by value ascending
  const sorted = [...parsed].sort((a, b) => a.value - b.value);

  // The best is the lowest value (index 0)
  // The worst is the highest value (index 4)
  const best = sorted[0];
  const worst = sorted[4];

  // We exclude best and worst
  const remaining = sorted.slice(1, 4);

  // If we have 2 or more DNFs, the remaining list will contain at least one DNF, so result is DNF
  const dnfCountInput = parsed.filter(p => p.isDNF).length;
  if (dnfCountInput >= 2) {
    return {
      average: 'DNF',
      bestIdx: best.index,
      worstIdx: worst.index,
      valid: true,
      remaining
    };
  }

  // Calculate sum of remaining 3
  const validRemaining = remaining.filter(r => !r.isDNF);
  const sum = validRemaining.reduce((acc, curr) => acc + curr.value, 0);
  const avg = sum / 3;

  return {
    average: avg.toFixed(2) + 's',
    bestIdx: best.index,
    worstIdx: worst.index,
    valid: true,
    remaining
  };
}

function getSortedCompetitors(competitors: Competitor[]) {
  return [...competitors].map(comp => {
    const ao5 = computeAo5(comp.times);
    let avgNumeric = Infinity;
    if (ao5.average !== 'DNF' && ao5.average !== 'N/A') {
      avgNumeric = parseFloat(ao5.average);
      if (isNaN(avgNumeric)) {
        avgNumeric = Infinity;
      }
    }
    return {
      comp,
      ao5,
      avgNumeric
    };
  }).sort((a, b) => a.avgNumeric - b.avgNumeric);
}

export default function App() {
  const isOverlayMode = typeof window !== 'undefined' && (
    window.location.search.includes('mode=overlay') || 
    window.location.search.includes('overlay=true')
  );

  // Form states and config states
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'excel'>('content');
  const [excelPaste, setExcelPaste] = useState('');
  const [excelError, setExcelError] = useState('');
  const [customFlagUrl, setCustomFlagUrl] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<1 | 2>(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [backgrounPreviewType, setBackgroundPreviewType] = useState<'dark' | 'light' | 'green' | 'game'>('game');

  // Local drafts to avoid losing focus and interrupting typing during real-time updates
  const [localCompetitorName, setLocalCompetitorName] = useState('');
  const [localCountryName, setLocalCountryName] = useState('');
  const [localCountryFlagUrl, setLocalCountryFlagUrl] = useState('');
  const [localEventName, setLocalEventName] = useState('');

  // Keep a ref of active IDs to detect when the user switches to a different competitor or player
  const lastActiveIdRef = useRef<string | null>(null);
  const lastEditingPlayerRef = useRef<number | null>(null);

  // Synchronize local edit values when editingComp or eventName changes
  useEffect(() => {
    if (!overlayState) return;

    const s = overlayState.styles;
    const dashboardList = overlayState.competitors || [];
    
    const comp1 = dashboardList.find(c => c.id === overlayState.activeCompetitorId) || {
      id: overlayState.activeCompetitorId || 'p1',
      competitorName: overlayState.data.competitorName,
      countryName: overlayState.data.countryName,
      countryFlagUrl: overlayState.data.countryFlagUrl,
      times: overlayState.data.times
    };
    
    const comp2 = dashboardList.find(c => c.id === overlayState.activeCompetitorId2) || dashboardList.find(c => c.id !== overlayState.activeCompetitorId) || dashboardList[0] || {
      id: 'p2',
      competitorName: "Desafiante",
      countryName: "Estados Unidos",
      countryFlagUrl: "https://flagcdn.com/w80/us.png",
      times: ["12.00", "12.00", "12.00", "12.00", "12.00"]
    };

    const currentEComp = (s.layout === 'versus' && editingPlayer === 2) ? comp2 : comp1;
    const currentECompId = currentEComp.id;

    // If we've switched competitor or changed players, force sync the local draft values
    if (currentECompId !== lastActiveIdRef.current || editingPlayer !== lastEditingPlayerRef.current) {
      setLocalCompetitorName(currentEComp.competitorName || '');
      setLocalCountryName(currentEComp.countryName || '');
      setLocalCountryFlagUrl(currentEComp.countryFlagUrl || '');
      setCustomFlagUrl(currentEComp.countryFlagUrl || '');
      
      lastActiveIdRef.current = currentECompId;
      lastEditingPlayerRef.current = editingPlayer;
    } else {
      // If we are looking at the same competitor, only sync if the inputs are not active
      if (document.activeElement?.id !== 'competitor-name-input') {
        setLocalCompetitorName(currentEComp.competitorName || '');
      }
      if (document.activeElement?.id !== 'country-name-input') {
        setLocalCountryName(currentEComp.countryName || '');
      }
      if (document.activeElement?.id !== 'flag-url-input') {
        setLocalCountryFlagUrl(currentEComp.countryFlagUrl || '');
        setCustomFlagUrl(currentEComp.countryFlagUrl || '');
      }
    }
  }, [overlayState, editingPlayer]);

  // Synchronize event name separately when changed by other clients/resets
  useEffect(() => {
    if (!overlayState) return;
    if (document.activeElement?.id !== 'event-name-input') {
      setLocalEventName(overlayState.styles.eventName || '');
    }
  }, [overlayState?.styles?.eventName]);

  // Load state on mount (SSE stream gets loaded and synced)
  useEffect(() => {
    // Initial fetch to populate state immediately
    fetch('/api/overlay')
      .then((res) => res.json())
      .then((state: OverlayState) => {
        setOverlayState(state);
        setCustomFlagUrl(state.data.countryFlagUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load overlay state', err);
        setLoading(false);
      });

    // Connect real-time Server-Sent Events channel
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const state: OverlayState = JSON.parse(event.data);
        setOverlayState(state);
      } catch (e) {
        console.error('Error parsing live SSE event', e);
      }
    };

    eventSource.onerror = (e) => {
      console.warn('SSE connection disconnected. Re-trying...', e);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Update custom flag input whenever the editing player selection or state updates
  useEffect(() => {
    if (!overlayState) return;
    if (editingPlayer === 1) {
      setCustomFlagUrl(overlayState.data.countryFlagUrl);
    } else {
      const p2 = (overlayState.competitors || []).find(c => c.id === overlayState.activeCompetitorId2);
      if (p2) {
        setCustomFlagUrl(p2.countryFlagUrl);
      }
    }
  }, [editingPlayer, overlayState?.activeCompetitorId, overlayState?.activeCompetitorId2]);

  // Update backend with new config
  const saveAndBroadcast = async (updatedData: { 
    data?: Partial<OverlayData>; 
    styles?: Partial<OverlayStyles>;
    competitors?: any[];
    activeCompetitorId?: string;
    activeCompetitorId2?: string;
    isVisible?: boolean;
    currentCategoryId?: string;
  }) => {
    if (!overlayState) return;

    setSaveStatus('saving');
    
    const mergedData = { ...overlayState.data, ...updatedData.data };
    const mergedStyles = { ...overlayState.styles, ...updatedData.styles };
    let mergedCompetitors = updatedData.competitors !== undefined ? updatedData.competitors : (overlayState.competitors || []);
    const activeId = updatedData.activeCompetitorId !== undefined ? updatedData.activeCompetitorId : overlayState.activeCompetitorId;
    const activeId2 = updatedData.activeCompetitorId2 !== undefined ? updatedData.activeCompetitorId2 : overlayState.activeCompetitorId2;
    const activeIsVisible = updatedData.isVisible !== undefined ? updatedData.isVisible : (overlayState.isVisible !== undefined ? overlayState.isVisible : true);
    const activeCategoryId = updatedData.currentCategoryId !== undefined ? updatedData.currentCategoryId : overlayState.currentCategoryId;

    // Sync edits of active competitor automatically back into the list!
    if (activeId) {
      mergedCompetitors = mergedCompetitors.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            competitorName: mergedData.competitorName,
            countryName: mergedData.countryName,
            countryFlagUrl: mergedData.countryFlagUrl,
            times: mergedData.times
          };
        }
        return c;
      });
    }

    const newStateData = {
      data: mergedData,
      styles: mergedStyles,
      competitors: mergedCompetitors,
      activeCompetitorId: activeId,
      activeCompetitorId2: activeId2,
      isVisible: activeIsVisible,
      currentCategoryId: activeCategoryId
    };

    try {
      const response = await fetch('/api/overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStateData),
      });

      if (response.ok) {
        const result = await response.json();
        setOverlayState(result.state);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
  };

  const selectCompetitor = (competitorId: string) => {
    if (!overlayState) return;
    const list = overlayState.competitors || [];
    const comp = list.find((c) => c.id === competitorId);
    if (!comp) return;

    saveAndBroadcast({
      activeCompetitorId: competitorId,
      data: {
        competitorName: comp.competitorName,
        countryName: comp.countryName,
        countryFlagUrl: comp.countryFlagUrl,
        times: comp.times
      },
      competitors: list,
    });

    setCustomFlagUrl(comp.countryFlagUrl);
  };

  const handleAddCompetitor = () => {
    if (!overlayState) return;
    const list = overlayState.competitors || [];
    const newId = 'comp-' + Date.now();
    const newCompetitor = {
      id: newId,
      competitorName: '',
      countryName: '',
      countryFlagUrl: '',
      times: ['', '', '', '', '']
    };

    const nextCompetitors = [...list, newCompetitor];
    
    saveAndBroadcast({
      competitors: nextCompetitors,
      activeCompetitorId: newId,
      data: {
        competitorName: newCompetitor.competitorName,
        countryName: newCompetitor.countryName,
        countryFlagUrl: newCompetitor.countryFlagUrl,
        times: newCompetitor.times
      }
    });

    setCustomFlagUrl('');
  };

  const handleDeleteCompetitor = (idToDelete: string, e: any) => {
    e.stopPropagation(); // Avoid triggering card active selection
    if (!overlayState) return;
    const list = overlayState.competitors || [];
    if (list.length <= 1) {
      alert('Debes tener al menos un competidor en la lista.');
      return;
    }

    const nextCompetitors = list.filter((c) => c.id !== idToDelete);
    let nextActiveId = overlayState.activeCompetitorId;
    let nextData = overlayState.data;

    if (nextActiveId === idToDelete) {
      const fallbackComp = nextCompetitors[0];
      nextActiveId = fallbackComp.id;
      nextData = {
        competitorName: fallbackComp.competitorName,
        countryName: fallbackComp.countryName,
        countryFlagUrl: fallbackComp.countryFlagUrl,
        times: fallbackComp.times
      };
      setCustomFlagUrl(fallbackComp.countryFlagUrl);
    }

    saveAndBroadcast({
      competitors: nextCompetitors,
      activeCompetitorId: nextActiveId,
      data: nextData
    });
  };

  const syncDataField = (field: keyof OverlayData, value: any) => {
    if (!overlayState) return;
    const s = overlayState.styles;
    if (s.layout === 'versus' && editingPlayer === 2) {
      const activeId2 = overlayState.activeCompetitorId2;
      if (activeId2) {
        const updatedCompetitors = (overlayState.competitors || []).map((c) => {
          if (c.id === activeId2) {
            return { ...c, [field]: value };
          }
          return c;
        });
        saveAndBroadcast({ competitors: updatedCompetitors });
      }
    } else {
      const nextData = { ...overlayState.data, [field]: value };
      saveAndBroadcast({ data: nextData });
    }
  };

  const syncStyleField = (field: keyof OverlayStyles, value: any) => {
    if (!overlayState) return;
    const nextStyles = { ...overlayState.styles, [field]: value };
    saveAndBroadcast({ styles: nextStyles });
  };

  const handleTimeChange = (index: number, val: string) => {
    if (!overlayState) return;
    const s = overlayState.styles;
    if (s.layout === 'versus' && editingPlayer === 2) {
      const activeId2 = overlayState.activeCompetitorId2;
      if (activeId2) {
        const comp = (overlayState.competitors || []).find(c => c.id === activeId2);
        if (comp) {
          const nextTimes = [...comp.times];
          nextTimes[index] = val;
          const updatedCompetitors = (overlayState.competitors || []).map((c) => {
            if (c.id === activeId2) {
              return { ...c, times: nextTimes };
            }
            return c;
          });
          saveAndBroadcast({ competitors: updatedCompetitors });
        }
      }
    } else {
      const nextTimes = [...overlayState.data.times];
      nextTimes[index] = val;
      syncDataField('times', nextTimes);
    }
  };

  // Helper to load country presets
  const applyCountryPreset = (country: CountryPreset) => {
    if (!overlayState) return;
    setCustomFlagUrl(country.flagUrl);
    setLocalCountryName(country.name);
    setLocalCountryFlagUrl(country.flagUrl);
    const s = overlayState.styles;
    if (s.layout === 'versus' && editingPlayer === 2) {
      const activeId2 = overlayState.activeCompetitorId2;
      if (activeId2) {
        const updatedCompetitors = (overlayState.competitors || []).map((c) => {
          if (c.id === activeId2) {
            return {
              ...c,
              countryName: country.name,
              countryFlagUrl: country.flagUrl
            };
          }
          return c;
        });
        saveAndBroadcast({ competitors: updatedCompetitors });
      }
    } else {
      saveAndBroadcast({
        data: {
          countryName: country.name,
          countryFlagUrl: country.flagUrl
        }
      });
    }
  };

  // Theme presets
  const applyThemePreset = (presetName: string) => {
    if (!overlayState) return;
    let styleUpdate: Partial<OverlayStyles> = {};

    switch (presetName) {
      case 'cyberpunk':
        styleUpdate = {
          fontFamily: 'Space Grotesk',
          backgroundColor: '#090a0f',
          bgOpacity: 95,
          textColor: '#00f0ff',
          accentColor: '#ff007f',
          borderColor: '#ff007f',
          borderWidth: 2,
          borderRadius: 'none',
          shadow: 'overlay',
          fontSize: 'base'
        };
        break;
      case 'minimal-dark':
        styleUpdate = {
          fontFamily: 'Inter',
          backgroundColor: '#0a0a0a',
          bgOpacity: 80,
          textColor: '#ffffff',
          accentColor: '#38bdf8',
          borderColor: '#262626',
          borderWidth: 1,
          borderRadius: 'lg',
          shadow: 'md',
          fontSize: 'base'
        };
        break;
      case 'minimal-light':
        styleUpdate = {
          fontFamily: 'Inter',
          backgroundColor: '#ffffff',
          bgOpacity: 95,
          textColor: '#171717',
          accentColor: '#16a34a',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          borderRadius: 'xl',
          shadow: 'lg',
          fontSize: 'base'
        };
        break;
      case 'retro':
        styleUpdate = {
          fontFamily: 'JetBrains Mono',
          backgroundColor: '#0f172a',
          bgOpacity: 90,
          textColor: '#22c55e',
          accentColor: '#eab308',
          borderColor: '#22c55e',
          borderWidth: 2,
          borderRadius: 'md',
          shadow: 'none',
          fontSize: 'base'
        };
        break;
      case 'elegant':
        styleUpdate = {
          fontFamily: 'Playfair Display',
          backgroundColor: '#1e1b4b',
          bgOpacity: 85,
          textColor: '#fef08a',
          accentColor: '#f472b6',
          borderColor: '#3730a3',
          borderWidth: 1,
          borderRadius: 'xl',
          shadow: 'lg',
          fontSize: 'base'
        };
        break;
      case 'wca-sac':
        styleUpdate = {
          fontFamily: 'Space Grotesk',
          backgroundColor: '#121c60',
          bgOpacity: 100,
          textColor: '#ffffff',
          accentColor: '#facc15',
          borderColor: '#ffffff',
          borderWidth: 3,
          borderRadius: 'lg',
          shadow: 'overlay',
          fontSize: 'lg'
        };
        break;
    }

    saveAndBroadcast({ styles: styleUpdate });
  };

  // Excel Paste / CSV parsing handler
  const handleExcelParse = () => {
    if (!excelPaste.trim()) {
      setExcelError('Por favor pega algunos datos primero.');
      return;
    }
    setExcelError('');

    try {
      // Clean leading/trailing spaces
      let lines = excelPaste.trim().split('\n');
      let row = lines[0].split(/[\t,;|]/); // Split by tab, comma, semicolon, or dev pipe

      if (row.length < 5) {
        // Just try parsing as five numbers separated by anything
        const numbers = excelPaste.trim().match(/(DNF|dnf|\d+(\.\d+)?)/g);
        if (numbers && numbers.length >= 5) {
          const loadedTimes = numbers.slice(0, 5).map(n => n.toUpperCase());
          saveAndBroadcast({
            data: {
              times: loadedTimes
            }
          });
          setExcelPaste('');
          setExcelError('');
          return;
        } else {
          throw new Error('No se encontraron al menos 5 tiempos válidos. Intenta pegar una fila de Excel con los tiempos.');
        }
      }

      // If it parsed rows correctly. Let's look for Competitor Name, Country, Flag, and times.
      // Suppose columns could be: [Nombre, Pais, BanderaURL, T1, T2, T3, T4, T5]
      // or [Nombre, T1, T2, T3, T4, T5]
      let name = overlayState?.data.competitorName || 'Luis Competidor';
      let country = overlayState?.data.countryName || 'Colombia';
      let flag = overlayState?.data.countryFlagUrl || '';
      let times: string[] = [];

      // Find cells containing DNF or numbers
      const textCells = row.map(cell => cell.trim());
      const parsedTimes = textCells.filter(cell => {
        return cell.toUpperCase() === 'DNF' || (!isNaN(parseFloat(cell)) && isFinite(Number(cell)));
      });

      if (parsedTimes.length >= 5) {
        times = parsedTimes.slice(0, 5);
        // The non-numerical cells before the times are probably the competitor name and country flag URL
        const nonTimeCells = textCells.slice(0, textCells.indexOf(parsedTimes[0]));
        if (nonTimeCells.length > 0) {
          name = nonTimeCells[0];
        }
        if (nonTimeCells.length > 1) {
          country = nonTimeCells[1];
          // Try to set flag preset automatically if it matches popular countries or is a URL
          const lowerCountry = country.toLowerCase();
          const match = POPULAR_COUNTRIES.find(c => c.name.toLowerCase() === lowerCountry);
          if (match) {
            flag = match.flagUrl;
          } else if (nonTimeCells.length > 2 && nonTimeCells[2].startsWith('http')) {
            flag = nonTimeCells[2];
          }
        }
      } else {
        // Just fallback to matching all values inside row that look like numbers
        const numbers = row.map(r => r.trim()).filter(r => r.toUpperCase() === 'DNF' || /^\d+(\.\d+)?$/.test(r));
        if (numbers.length >= 5) {
          times = numbers.slice(0, 5);
        } else {
          throw new Error('Estructura de datos no coincide. Copia y pega exactamente una fila de Excel que contenga los tiempos (ej. "Luis\tCO\t12.50\t11.20\t9.80\t13.00\t10.50").');
        }
      }

      saveAndBroadcast({
        data: {
          competitorName: name || overlayState?.data.competitorName,
          countryName: country || overlayState?.data.countryName,
          countryFlagUrl: flag || overlayState?.data.countryFlagUrl,
          times: times
        }
      });

      setExcelPaste('');
      setExcelError('');
    } catch (err: any) {
      setExcelError(err.message || 'Error al procesar los datos. Comprueba el formato de pegado.');
    }
  };

  // Pre-load Excel presets for quick demonstration
  const loadExcelSample = (type: 'co' | 'wr' | 'dnf') => {
    if (type === 'co') {
      setExcelPaste(`Esteban Cubero\tCosta Rica\thttps://flagcdn.com/w80/cr.png\t8.20\t11.50\t7.90\t8.90\t9.10`);
    } else if (type === 'wr') {
      setExcelPaste(`Max Park\tEstados Unidos\thttps://flagcdn.com/w80/us.png\t3.13\t4.50\t3.80\t3.63\t4.11`);
    } else {
      setExcelPaste(`Sebastián\tChile\thttps://flagcdn.com/w80/cl.png\t13.20\tDNF\t14.15\t12.80\t13.10`);
    }
  };

  if (loading || !overlayState) {
    return (
      <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin w-10 h-10 text-sky-400" />
        <p className="font-medium text-lg">Iniciando el configurador visual de overlays...</p>
      </div>
    );
  }

  // Get times Ao5 computation
  const ao5Result = computeAo5(overlayState.data.times);

  // Generate the current OBS full live absolute path for OBS source insertion
  const obsUrl = `${window.location.origin}/?mode=overlay`;

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(obsUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedType(key);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Pure clean overlay view for OBS Browser Source
  if (isOverlayMode) {
    const s = overlayState.styles;
    const d = overlayState.data;

    // Support layout URL override parameter: ?layout=single | versus | ranking
    const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlLayout = queryParams?.get('layout');
    const effectiveLayout = (urlLayout === 'single' || urlLayout === 'versus' || urlLayout === 'ranking')
      ? urlLayout
      : s.layout;

    const fontClassMap = {
      'Inter': 'font-inter',
      'Space Grotesk': 'font-space-grotesk',
      'JetBrains Mono': 'font-jetbrains-mono',
      'Outfit': 'font-outfit',
      'Playfair Display': 'font-playfair'
    };

    const sizeClassMap = {
      'xs': 'text-xs border-xs',
      'sm': 'text-sm border-sm',
      'base': 'text-base border-md',
      'lg': 'text-lg border-lg',
      'xl': 'text-xl border-xl',
      '2xl': 'text-2xl border-2xl'
    };

    const paddingClassMap = {
      'compact': 'p-3 gap-2',
      'normal': 'p-5 gap-3',
      'cozy': 'p-7 gap-5'
    };

    const radiusClassMap = {
      'none': 'rounded-none',
      'sm': 'rounded-sm',
      'md': 'rounded-md',
      'lg': 'rounded-lg',
      'xl': 'rounded-xl',
      'full': 'rounded-full'
    };

    const shadowClassMap = {
      'none': 'shadow-none',
      'sm': 'shadow-sm',
      'md': 'shadow-md',
      'lg': 'shadow-lg',
      'overlay': 'shadow-[0_0_20px_rgba(0,0,0,0.5)]'
    };

    // Calculate hex with opacity
    const hexToRgb = (hex: string) => {
      let c = hex.substring(1);
      if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      }
      const rgb = parseInt(c, 16);
      return `${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}`;
    };

    const bgRgb = hexToRgb(s.backgroundColor);
    const bgStyleValue = `rgba(${bgRgb}, ${s.bgOpacity / 100})`;

    const list = overlayState.competitors || [];
    const comp1 = list.find(c => c.id === overlayState.activeCompetitorId) || {
      competitorName: overlayState.data.competitorName,
      countryName: overlayState.data.countryName,
      countryFlagUrl: overlayState.data.countryFlagUrl,
      times: overlayState.data.times
    };
    
    const comp2 = list.find(c => c.id === overlayState.activeCompetitorId2) || list.find(c => c.id !== overlayState.activeCompetitorId) || list[0] || {
      competitorName: "Desafiante",
      countryName: "Estados Unidos",
      countryFlagUrl: "https://flagcdn.com/w80/us.png",
      times: ["12.00", "12.00", "12.00", "12.00", "12.00"]
    };

    const ao5Result1 = computeAo5(comp1.times);
    const ao5Result2 = computeAo5(comp2.times);

    const averageVal1 = parseFloat(ao5Result1.average);
    const averageVal2 = parseFloat(ao5Result2.average);
    const isComp1Better = !isNaN(averageVal1) && (isNaN(averageVal2) || averageVal1 < averageVal2);
    const isComp2Better = !isNaN(averageVal2) && (isNaN(averageVal1) || averageVal2 < averageVal1);

    const renderCard = (comp: any, ao5: any, isWinner: boolean, playerNum: number) => {
      return (
        <div
          id={`obs-overlay-widget-${playerNum}`}
          className={`${fontClassMap[s.fontFamily] || 'font-space-grotesk'} ${sizeClassMap[s.fontSize] || 'text-base'} ${paddingClassMap[s.padding] || 'p-4'} ${radiusClassMap[s.borderRadius] || 'rounded-lg'} ${shadowClassMap[s.shadow] || 'shadow-md'} flex flex-col transition-all duration-500 relative border`}
          style={{
            backgroundColor: bgStyleValue,
            borderColor: isWinner && effectiveLayout === 'versus' ? s.accentColor : s.borderColor,
            borderWidth: isWinner && effectiveLayout === 'versus' ? `${Math.max(2, s.borderWidth)}px` : `${s.borderWidth}px`,
            color: s.textColor,
            width: `${s.width || 380}px`,
          }}
        >
          {/* Winner Glow Accent */}
          {isWinner && effectiveLayout === 'versus' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white font-extrabold text-[8px] px-2.5 py-0.5 rounded-full tracking-widest uppercase shadow-sm flex items-center gap-1 border border-sky-400 z-20">
              <Trophy className="w-2.5 h-2.5 text-amber-300" /> Líder Ao5
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: `${s.borderColor}50` }}>
            <div className="flex items-center gap-3">
              {s.showFlag && comp.countryFlagUrl && (
                <img 
                  id={`flag-overlay-${playerNum}`}
                  src={comp.countryFlagUrl} 
                  alt={comp.countryName} 
                  className="w-10 h-6 object-cover rounded shadow-xs border m-0"
                  style={{ borderColor: `${s.borderColor}20` }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <div className="font-bold tracking-tight text-white line-clamp-1" style={{ color: s.textColor }}>
                  {comp.competitorName || 'Sin Nombre'}
                </div>
                <div className="text-[11px] uppercase tracking-wider opacity-60">
                  {comp.countryName || 'Competidor'}
                </div>
              </div>
            </div>
            
            <div className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: `${s.accentColor}18`, color: s.accentColor }}>
              P{playerNum}
            </div>
          </div>

          {/* Time Rows list */}
          <div className="flex flex-col gap-1.5 px-0.5 mt-2">
            <div className="grid grid-cols-5 text-[10px] uppercase font-bold tracking-wider mb-1 opacity-50">
              <span className="text-center col-span-1">Solv</span>
              <span className="text-left col-span-3">Tiempo</span>
              <span className="text-right col-span-1">Estado</span>
            </div>

            {comp.times.map((time: string, idx: number) => {
              const isBest = idx === ao5.bestIdx;
              const isWorst = idx === ao5.worstIdx;
              const shouldStrike = s.showStrikeouts && (isBest || isWorst);

              return (
                <div 
                  key={idx} 
                  id={`overlay-row-${playerNum}-${idx}`}
                  className="grid grid-cols-5 items-center py-1 rounded px-2 transition-all"
                  style={{ 
                    backgroundColor: isBest ? `${s.accentColor}06` : isWorst ? 'rgba(0,0,0,0.1)' : 'transparent'
                  }}
                >
                  <span className="text-[11px] font-mono opacity-40 text-center col-span-1">
                    #{idx + 1}
                  </span>
                  
                  <span 
                    className={`col-span-3 font-mono font-medium tracking-wide ${shouldStrike ? 'line-through opacity-75' : ''}`}
                    style={{ color: s.textColor }}
                  >
                    {time || '---'}
                  </span>

                  <span className="text-right text-[10px] font-bold tracking-widest uppercase col-span-1 font-mono">
                    {isBest && s.showStrikeouts && (
                      <span className="px-1 py-0.5 rounded text-[9px]" style={{ color: s.accentColor, backgroundColor: `${s.accentColor}15` }}>
                        MIN
                      </span>
                    )}
                    {isWorst && s.showStrikeouts && (
                      <span className="px-1 py-0.5 rounded text-[9px] text-red-400 bg-red-400/15">
                        MAX
                      </span>
                    )}
                    {!isBest && !isWorst && (
                      <span className="opacity-30">OK</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Average of 5 Calculation Result block */}
          <div 
            className="mt-2 pt-3 border-t flex items-center justify-between" 
            style={{ borderColor: `${s.borderColor}50` }}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 font-sans">
                PROMEDIO (Ao5)
              </span>
              <span className="text-[11px] italic opacity-40 font-sans">
                (Excl. Mejor & Peor)
              </span>
            </div>
            <div 
              className="font-mono text-xl font-extrabold tracking-tight px-3 py-1 rounded"
              style={{ backgroundColor: `${s.accentColor}18`, color: s.accentColor }}
            >
              {ao5.average}
            </div>
          </div>
        </div>
      );
    };

    const renderTableLayout = () => {
      return (
        <div 
          className="flex flex-col gap-3.5 py-4 w-full select-none"
          style={{ 
            width: `${Math.max(880, (s.width || 380) * 2.22)}px`,
            fontFamily: s.fontFamily === 'Inter' ? '"Inter", sans-serif' : s.fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : s.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : s.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Playfair Display", serif'
          }}
        >
          {/* Header Row */}
          <div 
            className="w-full px-5 py-2 rounded-full flex items-center border"
            style={{ 
              backgroundColor: 'rgba(16, 20, 30, 0.75)',
              backdropFilter: 'blur(4px)',
              borderColor: s.borderColor,
              borderWidth: `${s.borderWidth}px`
            }}
          >
            {/* Left side: Championship title */}
            <div className="w-[28%] text-left pl-3 truncate">
              <span className="font-extrabold text-[11px] md:text-xs text-slate-100 uppercase tracking-widest leading-none">
                {s.eventName || "WCA South American Championship 2026"}
              </span>
            </div>
            {/* Right side: labels */}
            <div className="w-[72%] grid grid-cols-8 gap-x-2 text-center text-slate-400 font-extrabold text-[10px] md:text-[11px] uppercase tracking-wider pl-4">
              <span>T 1</span>
              <span>T 2</span>
              <span>T 3</span>
              <span>T 4</span>
              <span>T 5</span>
              <span className="text-red-400/90 font-black">Peor</span>
              <span className="text-emerald-400/90 font-black">Mejor</span>
              <span className="text-sky-400/90 font-black">AVG</span>
            </div>
          </div>

          {[
            { comp: comp1, ao5: ao5Result1, isWinner: isComp1Better, num: 1 },
            { comp: comp2, ao5: ao5Result2, isWinner: isComp2Better, num: 2 }
          ].map(({ comp, ao5, isWinner, num }) => {
            return (
              <div 
                key={num}
                className="w-full p-2.5 rounded-full flex items-center border shadow-xl relative transition-all duration-300 gap-2"
                style={{
                  background: s.backgroundColor === '#0d0e12' ? 'linear-gradient(90deg, #145d7a 0%, #0c384a 100%)' : s.backgroundColor,
                  borderColor: isWinner ? s.accentColor : s.borderColor,
                  borderWidth: `${isWinner ? Math.max(2, s.borderWidth) : s.borderWidth}px`,
                  opacity: s.bgOpacity / 100,
                }}
              >
                {/* Visual Pill Indicator of Player */}
                {isWinner && (
                  <div className="absolute -top-2.5 left-6 bg-sky-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full tracking-widest uppercase shadow-sm flex items-center gap-1 border border-sky-400 z-10 animate-pulse">
                    <Trophy className="w-2 h-2 text-amber-300" /> Líder Ao5
                  </div>
                )}

                {/* Left side player details: Circular flag + Name */}
                <div className="w-[28%] flex items-center pl-3 min-w-0">
                  {s.showFlag && comp.countryFlagUrl && (
                    <div className="relative shrink-0 select-none">
                      <img 
                        src={comp.countryFlagUrl} 
                        alt="" 
                        className="w-10 h-10 rounded-full border-2 border-white object-cover aspect-square shadow-md"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="pl-3 truncate text-left">
                    <span className="font-extrabold text-sm md:text-base text-white tracking-tight block truncate drop-shadow-sm">
                      {comp.competitorName || 'Sin Nombre'}
                    </span>
                    {comp.countryName && (
                      <span className="text-[9px] uppercase opacity-60 tracking-wider font-extrabold block leading-tight">
                        {comp.countryName} (P{num})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Inner times stats-row */}
                <div className="w-[72%] bg-black/45 rounded-full py-2.5 px-4 grid grid-cols-8 gap-x-2 text-center text-slate-100 font-mono text-xs md:text-sm font-semibold select-none items-center self-stretch">
                  {/* Solve times */}
                  {comp.times.map((time: string, idx: number) => {
                    const isBest = idx === ao5.bestIdx;
                    const isWorst = idx === ao5.worstIdx;
                    const shouldStrike = s.showStrikeouts && (isBest || isWorst);

                    return (
                      <span 
                        key={idx} 
                        className={`truncate ${shouldStrike ? 'line-through opacity-75 font-normal text-slate-200' : 'text-slate-100 font-bold'}`}
                      >
                        {time || '---'}
                      </span>
                    );
                  })}

                  {/* Worst time */}
                  <span className="text-red-400/90 font-normal truncate">
                    {ao5.worstIdx !== -1 ? comp.times[ao5.worstIdx] : '---'}
                  </span>

                  {/* Best time */}
                  <span className="text-emerald-400/95 font-medium truncate">
                    {ao5.bestIdx !== -1 ? comp.times[ao5.bestIdx] : '---'}
                  </span>

                  {/* Average time */}
                  <span 
                    className="font-extrabold text-xs md:text-sm px-1.5 py-0.5 rounded text-center block"
                    style={{ color: s.accentColor }}
                  >
                    {ao5.average}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const renderRankingLayout = () => {
      const sorted = getSortedCompetitors(overlayState.competitors || []);
      
      return (
        <div 
          className="flex flex-col gap-3 py-4 w-full select-none"
          style={{ 
            width: `${Math.max(880, (s.width || 380) * 2.22)}px`,
            fontFamily: s.fontFamily === 'Inter' ? '"Inter", sans-serif' : s.fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : s.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : s.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Playfair Display", serif'
          }}
        >
          {/* Header Row */}
          <div 
            className="w-full px-5 py-2.5 rounded-full flex items-center border"
            style={{ 
              backgroundColor: 'rgba(16, 20, 30, 0.85)',
              backdropFilter: 'blur(6px)',
              borderColor: s.borderColor,
              borderWidth: `${s.borderWidth}px`
            }}
          >
            {/* Left side: Champion / Category info */}
            <div className="w-[28%] text-left pl-3 truncate flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="font-extrabold text-[11px] md:text-xs text-slate-100 uppercase tracking-widest leading-none truncate">
                {s.eventName || "Ranking General"}
              </span>
            </div>
            {/* Right side labels */}
            <div className="w-[72%] grid grid-cols-11 gap-x-1 text-center text-slate-400 font-extrabold text-[9px] md:text-[10px] uppercase tracking-wider pl-4">
              {/* Pos */}
              <span className="col-span-1 text-left pl-1">Pos</span>
              {/* Competitor Name & Flag */}
              <span className="col-span-3 text-left">Competidor</span>
              {/* Times */}
              <span>T1</span>
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              {/* AVG */}
              <span className="text-sky-400/90 font-black pr-1 text-right col-span-2">Ao5 AVG</span>
            </div>
          </div>

          {/* Rows */}
          {sorted.map(({ comp, ao5 }, idx) => {
            const rank = idx + 1;
            const rankBg = rank === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/35' : rank === 2 ? 'bg-slate-300/20 text-slate-100 border-slate-300/35' : rank === 3 ? 'bg-amber-700/20 text-amber-500 border-amber-700/35' : 'bg-slate-800/40 text-slate-400 border-slate-700/30';
            const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}°`;
            const isP1 = comp.id === overlayState.activeCompetitorId;
            const isP2 = comp.id === overlayState.activeCompetitorId2;
            const highlightBorder = isP1 || isP2;

            return (
              <div 
                key={comp.id}
                className="w-full p-2 rounded-full flex items-center border shadow-lg relative transition-all duration-300 min-h-[52px]"
                style={{
                  background: s.backgroundColor === '#0d0e12' ? 'linear-gradient(90deg, #10141e 0%, #151d29 100%)' : s.backgroundColor,
                  borderColor: highlightBorder ? s.accentColor : s.borderColor,
                  borderWidth: `${highlightBorder ? Math.max(2, s.borderWidth) : s.borderWidth}px`,
                  opacity: s.bgOpacity / 100,
                }}
              >
                {/* Active identifier pill */}
                {highlightBorder && (
                  <div className="absolute -top-2 left-16 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-[7px] px-2 py-0.5 rounded-full tracking-widest uppercase shadow border border-sky-400 z-10">
                    {isP1 ? 'P1 Principal' : 'P2 Desafiante'}
                  </div>
                )}

                <div className="w-[28%] flex items-center pl-3 min-w-0">
                  {s.showFlag && comp.countryFlagUrl && (
                    <div className="relative shrink-0 select-none">
                      <img 
                        src={comp.countryFlagUrl} 
                        alt="" 
                        className="w-8 h-8 rounded-full border border-white/20 object-cover aspect-square shadow"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="pl-3 truncate text-left">
                    <span className="font-extrabold text-xs md:text-sm text-white tracking-tight block truncate">
                      {comp.competitorName || 'Sin Nombre'}
                    </span>
                    {comp.countryName && (
                      <span className="text-[8px] uppercase opacity-55 tracking-widest font-extrabold block leading-none pt-0.5 truncate">
                        {comp.countryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-[72%] bg-black/35 rounded-full py-1.5 px-3.5 grid grid-cols-11 gap-x-1 text-center font-mono text-[10px] md:text-xs font-semibold select-none items-center self-stretch pl-4">
                  <div className="col-span-1 text-left flex items-center pl-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${rankBg}`}>
                      {rankLabel}
                    </span>
                  </div>
                  <div className="col-span-3 text-left text-slate-200 font-sans font-bold truncate">
                    {comp.competitorName || '---'}
                  </div>
                  
                  {comp.times.map((time: string, tIdx: number) => {
                    const isBest = tIdx === ao5.bestIdx;
                    const isWorst = tIdx === ao5.worstIdx;
                    const shouldStrike = s.showStrikeouts && (isBest || isWorst);

                    return (
                      <span 
                        key={tIdx} 
                        className={`truncate ${shouldStrike ? 'line-through opacity-75 font-normal text-slate-200 font-semibold' : 'text-slate-200 font-semibold'}`}
                      >
                        {time || '---'}
                      </span>
                    );
                  })}

                  <span 
                    className="font-extrabold text-sm px-1 py-0.5 rounded text-right block pr-1 col-span-2"
                    style={{ color: s.accentColor }}
                  >
                    {ao5.average}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const isVisible = overlayState.isVisible !== false;

    return (
      <div 
        className={`min-h-screen bg-transparent flex items-center justify-center p-4 overflow-hidden ${
          isVisible ? 'animate-fade-in' : 'animate-fade-out pointer-events-none'
        }`}
        style={{ background: 'transparent' }}
      >
        {effectiveLayout === 'ranking' ? (
          renderRankingLayout()
        ) : effectiveLayout === 'versus' ? (
          s.versusLayoutType === 'table' ? (
            renderTableLayout()
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative">
              {renderCard(comp1, ao5Result1, isComp1Better, 1)}
              <div className="w-12 h-12 rounded-full bg-[#0d0e12] border-2 border-[#1e293b] flex items-center justify-center text-rose-500 font-extrabold text-lg shadow-lg flex-shrink-0 z-30 select-none">
                VS
              </div>
              {renderCard(comp2, ao5Result2, isComp2Better, 2)}
            </div>
          )
        ) : (
          renderCard(comp1, ao5Result1, false, 1)
        )}
      </div>
    );
  }

  // Dashboard state UI
  const s = overlayState.styles;
  const d = overlayState.data;

  const dashboardList = overlayState.competitors || [];
  const comp1 = dashboardList.find(c => c.id === overlayState.activeCompetitorId) || {
    id: overlayState.activeCompetitorId || 'p1',
    competitorName: overlayState.data.competitorName,
    countryName: overlayState.data.countryName,
    countryFlagUrl: overlayState.data.countryFlagUrl,
    times: overlayState.data.times
  };
  
  const comp2 = dashboardList.find(c => c.id === overlayState.activeCompetitorId2) || dashboardList.find(c => c.id !== overlayState.activeCompetitorId) || dashboardList[0] || {
    id: 'p2',
    competitorName: "Desafiante",
    countryName: "Estados Unidos",
    countryFlagUrl: "https://flagcdn.com/w80/us.png",
    times: ["12.00", "12.00", "12.00", "12.00", "12.00"]
  };

  const ao5Result1 = computeAo5(comp1.times);
  const ao5Result2 = computeAo5(comp2.times);

  const averageVal1 = parseFloat(ao5Result1.average);
  const averageVal2 = parseFloat(ao5Result2.average);
  const isComp1Better = !isNaN(averageVal1) && (isNaN(averageVal2) || averageVal1 < averageVal2);
  const isComp2Better = !isNaN(averageVal2) && (isNaN(averageVal1) || averageVal2 < averageVal1);

  const editingComp = (s.layout === 'versus' && editingPlayer === 2) ? comp2 : comp1;
  const editingAo5 = (s.layout === 'versus' && editingPlayer === 2) ? ao5Result2 : ao5Result1;

  return (
    <div className="min-h-screen bg-[#090b0e] text-[#e2e8f0] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-[#1e293b] bg-[#0c0f16] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              OBS Overlay Customizer
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Live Server
              </span>
            </h1>
            <p className="text-xs text-[#94a3b8]">Configurador de widgets para streamers & speedcubing</p>
          </div>
        </div>

        {/* Saved indicator */}
        <div className="flex items-center gap-4">
          {overlayState && (
            <button
              onClick={() => {
                const currentVisibility = overlayState.isVisible !== false;
                saveAndBroadcast({ isVisible: !currentVisibility });
              }}
              className={`cursor-pointer px-4 py-2 rounded-xl border font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                overlayState.isVisible !== false
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/45'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 shadow-lg shadow-rose-500/5 hover:border-rose-500/45'
              }`}
              title={overlayState.isVisible !== false ? "Ocultar overlay en OBS Studio" : "Mostrar overlay en OBS Studio"}
            >
              {overlayState.isVisible !== false ? (
                <>
                  <Eye className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                  <span>Overlay Activo</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Overlay Oculto</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Sincronizado en OBS
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-rose-400 flex items-center gap-1.5">
                Error al guardar
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Category Selection Bar */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-6">
        <div className="bg-[#0c0f16] border border-[#1e293b] rounded-2xl p-4 md:p-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-widest flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Selección de Categoría Oficial WCA
            </span>
            <h2 className="text-sm font-bold text-white">Categoría de Competencia</h2>
            <p className="text-[11px] text-slate-400">Cada categoría mantiene sus propios competidores, tiempos, nombre del torneo e historial.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {overlayState && overlayState.categories ? (
              Object.values(overlayState.categories).map((cat: any) => {
                const isActive = overlayState.currentCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (!isActive) {
                        saveAndBroadcast({ currentCategoryId: cat.id });
                      }
                    }}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 border ${
                      isActive
                        ? 'bg-gradient-to-tr from-sky-500/20 to-indigo-500/10 text-sky-400 border-sky-400/40 shadow-lg shadow-sky-500/5 font-bold scale-102'
                        : 'bg-[#10141e] hover:bg-[#151b29] text-slate-400 hover:text-slate-200 border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'} shrink-0`} />
                    <span>{cat.name}</span>
                    {isActive && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        ACTIVO
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-xs text-slate-500">Cargando categorías...</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column - Controllers (7 columns) */}
        <section id="config-control-panel" className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Navigation Control panels tabs */}
          <div className="bg-[#0c0f16] p-1.5 rounded-xl border border-[#1e293b] flex gap-1">
            <button
              id="tab-btn-content"
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'content'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              1. Datos Competidor
            </button>
            <button
              id="tab-btn-theme"
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'theme'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              2. Editor Visual
            </button>
            <button
              id="tab-btn-excel"
              onClick={() => setActiveTab('excel')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'excel'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              3. Importar Excel/DB
            </button>
          </div>

          {/* Tab Content 1: Competitor Profile and Times */}
          {activeTab === 'content' && (
            <div className="bg-[#0c0f16] border border-[#1e293b] rounded-2xl p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-400" /> Datos del Competidor
                </h3>
                <p className="text-xs text-slate-400">Personaliza la tarjeta principal con los datos del jugador</p>
              </div>

               {/* SAVED COMPETITORS VERSUS CONFIGURATION BAR */}
              <div className="bg-[#10141e] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#1e293b] pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Layout className="w-4 h-4 text-sky-400" /> Modalidad de Pantalla
                    </h4>
                    <p className="text-[11px] text-slate-400">Selecciona el formato del overlay para tu transmisión.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 bg-[#141a27] p-1 rounded-lg border border-[#23304a] self-start sm:self-auto">
                    <button
                      onClick={() => syncStyleField('layout', 'single')}
                      className={`px-3 py-1 font-bold text-[10px] rounded transition-all cursor-pointer ${
                        s.layout === 'single'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Individual (1 Jugador)
                    </button>
                    <button
                      onClick={() => syncStyleField('layout', 'versus')}
                      className={`px-3 py-1 font-bold text-[10px] rounded transition-all cursor-pointer ${
                        s.layout === 'versus'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Versus 1vs1 (2 Jugadores)
                    </button>
                    <button
                      onClick={() => syncStyleField('layout', 'ranking')}
                      className={`px-3 py-1 font-bold text-[10px] rounded transition-all cursor-pointer ${
                        s.layout === 'ranking'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ranking (Todos)
                    </button>
                  </div>
                </div>

                {s.layout === 'versus' && (
                  <div className="flex flex-col gap-3 ml-1 bg-[#141a27] p-3 rounded-xl border border-[#23304a] text-left animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Estilo de Versus (1vs1)</span>
                        <p className="text-[10px] text-slate-400">Elige el estilo visual para el enfrentamiento.</p>
                      </div>
                      <div className="flex gap-1 bg-[#0c0f16] p-1 rounded-lg border border-[#1e293b]">
                        <button
                          onClick={() => syncStyleField('versusLayoutType', 'cards')}
                          className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded transition cursor-pointer ${
                            s.versusLayoutType !== 'table'
                              ? 'bg-rose-500 text-white shadow-sm font-sans'
                              : 'text-slate-400 hover:text-white font-sans'
                          }`}
                        >
                          Tarjetas
                        </button>
                        <button
                          onClick={() => syncStyleField('versusLayoutType', 'table')}
                          className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded transition cursor-pointer ${
                            s.versusLayoutType === 'table'
                              ? 'bg-emerald-500 text-white shadow-sm font-sans'
                              : 'text-slate-400 hover:text-white font-sans'
                          }`}
                        >
                          Tabla
                        </button>
                      </div>
                    </div>

                    {s.versusLayoutType === 'table' && (
                      <div className="flex flex-col gap-1.5 border-t border-[#1e293b]/70 pt-2.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Título del Campeonato o Evento</span>
                        <input
                          id="event-name-input"
                          type="text"
                          value={localEventName}
                          onChange={(e) => setLocalEventName(e.target.value)}
                          onBlur={(e) => syncStyleField('eventName', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              syncStyleField('eventName', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="bg-[#0c0f16] border border-[#2d3a4f] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/80 font-sans w-full"
                          placeholder="WCA South American Championship 2026"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Dropdowns for quick settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> Competidor 1 (P1 - Principal)
                    </span>
                    <select
                      value={overlayState.activeCompetitorId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const comp = (overlayState.competitors || []).find((c) => c.id === val);
                        if (comp) {
                          saveAndBroadcast({
                            activeCompetitorId: val,
                            data: {
                              competitorName: comp.competitorName,
                              countryName: comp.countryName,
                              countryFlagUrl: comp.countryFlagUrl,
                              times: comp.times
                            }
                          });
                          setCustomFlagUrl(comp.countryFlagUrl);
                        }
                      }}
                      className="bg-[#151a24] border border-[#2d3a4f] rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
                    >
                      {(overlayState.competitors || []).map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.competitorName} ({comp.countryName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Competidor 2 (P2 - Desafiante)
                      {s.layout !== 'versus' && (
                        <span className="text-[9px] text-slate-500 lowercase font-medium leading-none">(inactivo)</span>
                      )}
                    </span>
                    <select
                      disabled={s.layout !== 'versus'}
                      value={overlayState.activeCompetitorId2 || ''}
                      onChange={(e) => {
                        saveAndBroadcast({
                          activeCompetitorId2: e.target.value
                        });
                      }}
                      className={`bg-[#151a24] border border-[#2d3a4f] rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-rose-500 ${
                        s.layout !== 'versus' ? 'opacity-40 cursor-not-allowed text-slate-500' : ''
                      }`}
                    >
                      {(overlayState.competitors || []).map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.competitorName} ({comp.countryName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Saved Competitors Quick Switch list */}
              <div className="bg-[#10141e] border border-[#1e293b] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" /> Lista de Competidores
                    </h4>
                    <p className="text-[11px] text-slate-400">Elige cuál competidor transmitir o edita sus datos en tiempo real.</p>
                  </div>
                  <button
                    onClick={handleAddCompetitor}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1 justify-center cursor-pointer flex-shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nuevo Competidor
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[195px] overflow-y-auto pr-1">
                  {(overlayState.competitors || []).map((comp) => {
                    const isActiveP1 = comp.id === overlayState.activeCompetitorId;
                    const isActiveP2 = comp.id === overlayState.activeCompetitorId2 && s.layout === 'versus';
                    const compAo5 = computeAo5(comp.times);

                    return (
                      <div
                        key={comp.id}
                        onClick={() => selectCompetitor(comp.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isActiveP1
                            ? 'bg-sky-500/10 border-sky-500 shadow-sm'
                            : isActiveP2
                              ? 'bg-rose-500/10 border-rose-500/60 shadow-sm'
                              : 'bg-[#151a24] hover:bg-[#1d2433] border-transparent hover:border-[#202d42]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-shrink-0 relative">
                            {comp.countryFlagUrl ? (
                              <img
                                src={comp.countryFlagUrl}
                                alt=""
                                className="w-7 h-5 object-cover rounded shadow-xs border border-slate-700/50"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-7 h-5 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                                <Flag className="w-3 h-3 text-slate-500" />
                              </div>
                            )}
                            {isActiveP1 && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                              </span>
                            )}
                            {isActiveP2 && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white block truncate leading-tight flex items-center gap-1.5">
                              {comp.competitorName || 'Sin Nombre'}
                              {isActiveP1 && (
                                <span className="text-[8px] bg-sky-500/20 text-sky-400 px-1 py-0.2 rounded font-extrabold uppercase">P1</span>
                              )}
                              {isActiveP2 && (
                                <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 py-0.2 rounded font-extrabold uppercase">P2</span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {comp.countryName || 'Competidor'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right flex-shrink-0">
                          {/* Quick assign buttons */}
                          <div className="flex gap-0.5">
                            {!isActiveP1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectCompetitor(comp.id);
                                }}
                                className="px-1.5 py-0.5 text-[9px] font-extrabold bg-[#151f2e] text-sky-400 hover:bg-sky-500 hover:text-white rounded border border-sky-500/20 transition cursor-pointer"
                                title="Asignar como P1"
                              >
                                P1
                              </button>
                            )}
                            {s.layout === 'versus' && !isActiveP2 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveAndBroadcast({ activeCompetitorId2: comp.id });
                                }}
                                className="px-1.5 py-0.5 text-[9px] font-extrabold bg-[#2a171f] text-rose-400 hover:bg-rose-500 hover:text-white rounded border border-rose-500/20 transition cursor-pointer"
                                title="Asignar como P2"
                              >
                                P2
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col items-end min-w-[50px]">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest leading-none">
                              Ao5
                            </span>
                            <span className={`font-mono text-xs font-black ${isActiveP1 ? 'text-sky-400' : isActiveP2 ? 'text-rose-400' : 'text-slate-400'}`}>
                              {compAo5.average}
                            </span>
                          </div>

                          {(overlayState.competitors || []).length > 1 && (
                            <button
                              onClick={(e) => handleDeleteCompetitor(comp.id, e)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded transition ml-1 cursor-pointer"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Switch tabs to edit Competitor 1 or Competitor 2 in Versus mode */}
              {s.layout === 'versus' && (
                <div className="flex bg-[#10141e] p-1 border border-[#1e293b] rounded-xl text-center items-center gap-1.5 shadow-inner">
                  <button
                    onClick={() => setEditingPlayer(1)}
                    className={`flex-1 py-2 font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editingPlayer === 1
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-sans'
                        : 'text-slate-400 hover:text-white font-sans'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                    Editar Jugador 1 (P1: {comp1.competitorName || 'Sin Nombre'})
                  </button>
                  <button
                    onClick={() => setEditingPlayer(2)}
                    className={`flex-1 py-2 font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editingPlayer === 2
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-sans'
                        : 'text-slate-400 hover:text-white font-sans'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    Editar Jugador 2 (P2: {comp2.competitorName || 'Sin Nombre'})
                  </button>
                </div>
              )}

              {/* Grid block for inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nombre del competidor
                  </label>
                  <input
                    id="competitor-name-input"
                    type="text"
                    value={localCompetitorName}
                    onChange={(e) => setLocalCompetitorName(e.target.value)}
                    onBlur={(e) => syncDataField('competitorName', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        syncDataField('competitorName', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-[#151a24] border border-[#2d3a4f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-sm"
                    placeholder="Ej. Luis Rubio"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    País o Región
                  </label>
                  <input
                    id="country-name-input"
                    type="text"
                    value={localCountryName}
                    onChange={(e) => setLocalCountryName(e.target.value)}
                    onBlur={(e) => syncDataField('countryName', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        syncDataField('countryName', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-[#151a24] border border-[#2d3a4f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-sm"
                    placeholder="Ej. Colombia"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>URL Bandera del País (URL de Imagen)</span>
                    <span className="text-[11px] text-sky-400 lowercase normal-case">imagen transparente u oficial</span>
                  </label>
                  <input
                    id="flag-url-input"
                    type="text"
                    value={localCountryFlagUrl}
                    onChange={(e) => setLocalCountryFlagUrl(e.target.value)}
                    onBlur={(e) => syncDataField('countryFlagUrl', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        syncDataField('countryFlagUrl', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="bg-[#151a24] border border-[#2d3a4f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-sm font-mono"
                    placeholder="Ej. https://flagcdn.com/w80/co.png"
                  />
                </div>
              </div>

              {/* Preset country flags for rapid user tests */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-slate-400">Presete rápido de países populares:</span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#10141e] rounded-lg border border-[#20293a]">
                  {POPULAR_COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => applyCountryPreset(country)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        editingComp.countryName === country.name
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                          : 'bg-[#151d2a] hover:bg-slate-700 text-slate-300 border border-transparent'
                      }`}
                    >
                      <img src={country.flagUrl} alt="" className="w-4 h-3 object-cover rounded" />
                      {country.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times Config Panel */}
              <div className="border-t border-[#1e293b] pt-6 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" /> Tiempos del Intento (5 slots para Ao5)
                  </h4>
                  <p className="text-xs text-slate-400">Pega o escribe los 5 tiempos de tu ronda. Pon "DNF" para intentos fallidos.</p>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {editingComp.times.map((time, idx) => {
                    const isMin = idx === editingAo5.bestIdx;
                    const isMax = idx === editingAo5.worstIdx;

                    return (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 text-center">
                          SOLVE #{idx + 1}
                        </label>
                        <div className="relative">
                          <input
                            id={`time-input-${idx}`}
                            type="text"
                            value={time}
                            onChange={(e) => handleTimeChange(idx, e.target.value)}
                            className={`w-full text-center bg-[#151a24] border rounded-lg py-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                              isMin 
                                ? 'border-emerald-500/50 text-emerald-400 focus:border-emerald-500' 
                                : isMax 
                                  ? 'border-red-500/50 text-red-400 focus:border-red-500' 
                                  : 'border-[#2d3a4f] text-white focus:border-sky-500'
                            }`}
                            placeholder="0.00"
                          />
                          {isMin && (
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] bg-emerald-500 text-black px-1 rounded font-bold uppercase tracking-wide">
                              MIN
                            </span>
                          )}
                          {isMax && (
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] bg-red-500 text-white px-1 rounded font-bold uppercase tracking-wide">
                              MAX
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Instant math outcome display */}
                <div className="mt-4 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-sky-400 uppercase tracking-widest block">
                      Resultado Calculado Ao5 ({editingComp.competitorName || 'Sin Nombre'})
                    </span>
                    <span className="text-xs text-slate-400">
                      Eliminando el peor ({editingAo5.worstIdx !== -1 ? editingComp.times[editingAo5.worstIdx] || 'n/a' : '--'}) y el mejor ({editingAo5.bestIdx !== -1 ? editingComp.times[editingAo5.bestIdx] || 'n/a' : '--'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-sky-400 font-mono tracking-tight block">
                      {editingAo5.average}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Visual styles and Themes */}
          {activeTab === 'theme' && (
            <div className="bg-[#0c0f16] border border-[#1e293b] rounded-2xl p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-sky-400" /> Editor Visual del Overlay
                </h3>
                <p className="text-xs text-slate-400">Inspecciona y personaliza colores, tipografía, bordes y visibilidad.</p>
              </div>

              {/* Theme quick preset templates */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estilos de Plantillas Rápidas</span>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <button
                    onClick={() => applyThemePreset('minimal-dark')}
                    className="p-2.5 bg-[#151a24] hover:bg-slate-800 text-xs font-bold rounded-lg text-slate-300 border border-[#2d3a4f] text-center"
                  >
                    Minimal Dark
                  </button>
                  <button
                    onClick={() => applyThemePreset('minimal-light')}
                    className="p-2.5 bg-white hover:bg-slate-100 text-xs font-bold rounded-lg text-slate-900 border border-slate-200 text-center"
                  >
                    Minimal Light
                  </button>
                  <button
                    onClick={() => applyThemePreset('cyberpunk')}
                    className="p-2.5 bg-[#090a0f] hover:bg-slate-950 text-xs font-bold rounded-lg text-[#00f0ff] border border-[#ff007f] text-center"
                  >
                    Neon Cyber
                  </button>
                  <button
                    onClick={() => applyThemePreset('retro')}
                    className="p-2.5 bg-[#0f172a] hover:bg-slate-900 text-xs font-bold rounded-lg text-[#22c55e] border border-[#22c55e] text-center font-mono"
                  >
                    Retro Terminal
                  </button>
                  <button
                    onClick={() => applyThemePreset('elegant')}
                    className="p-2.5 bg-[#1e1b4b] hover:bg-[#1e144a] text-xs font-bold rounded-lg text-[#fef08a] border border-[#3730a3] text-center"
                  >
                    Midnight Ruby
                  </button>
                  <button
                    onClick={() => applyThemePreset('wca-sac')}
                    className="p-2.5 bg-[#121c60] hover:bg-[#1a298c] text-xs font-bold rounded-lg text-white border-2 border-[#facc15] text-center flex flex-col items-center justify-center gap-0.5 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                    title="Plantilla de Alto Contraste con los colores oficiales de WCA South American Championship"
                  >
                    <span className="text-emerald-400 text-[8px] tracking-widest uppercase font-black leading-none animate-pulse">SAC 2026</span>
                    WCA SAC High Contrast
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-[#1e293b]" />

              {/* Properties Sliders / Colors detail section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Font selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Soporte de Fuente</label>
                  <select
                    id="font-select-input"
                    value={s.fontFamily}
                    onChange={(e) => syncStyleField('fontFamily', e.target.value)}
                    className="bg-[#151a24] border border-[#2d3a4f] rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="Inter">Inter (Moderna/Limpia)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech/Gaming)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Console/Developer)</option>
                    <option value="Outfit">Outfit (Minimalista Elegante)</option>
                    <option value="Playfair Display">Playfair Display (Serif Clásica)</option>
                  </select>
                </div>

                {/* Card Width */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Espesor del Widget (Ancho)</span>
                    <span className="text-sky-400 font-mono">{s.width || 380}px</span>
                  </div>
                  <input
                    id="width-range-input"
                    type="range"
                    min="300"
                    max="600"
                    step="5"
                    value={s.width || 380}
                    onChange={(e) => syncStyleField('width', parseInt(e.target.value))}
                    className="w-full h-1 bg-[#1d2736] rounded-lg appearance-none cursor-pointer tracking-sky"
                  />
                </div>

                {/* Font Size selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tamaño Interno</label>
                  <div className="grid grid-cols-4 gap-1 bg-[#10141e] p-1 rounded-lg border border-[#20293a]">
                    {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => syncStyleField('fontSize', size)}
                        className={`py-1 text-xs font-bold rounded transition ${
                          s.fontSize === size
                            ? 'bg-sky-500 text-white'
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Padding Style */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-medium">Margen de Relleno</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#10141e] p-1 rounded-lg border border-[#20293a]">
                    {(['compact', 'normal', 'cozy'] as const).map((pad) => (
                      <button
                        key={pad}
                        onClick={() => syncStyleField('padding', pad)}
                        className={`py-1 text-xs font-bold rounded transition ${
                          s.padding === pad
                            ? 'bg-sky-500 text-white'
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {pad === 'compact' ? 'Corto' : pad === 'normal' ? 'Medio' : 'Largo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bordes Redondeados</label>
                  <select
                    id="border-radius-select"
                    value={s.borderRadius}
                    onChange={(e) => syncStyleField('borderRadius', e.target.value)}
                    className="bg-[#151a24] border border-[#2d3a4f] rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    <option value="none">Recto (0px)</option>
                    <option value="sm">Chico (4px)</option>
                    <option value="md">Mediano (8px)</option>
                    <option value="lg">Grande (12px)</option>
                    <option value="xl">Extra Grande (16px)</option>
                    <option value="full">Completamente Redondo</option>
                  </select>
                </div>

                {/* Border width slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Grosor del Borde</span>
                    <span className="text-sky-400 font-mono">{s.borderWidth}px</span>
                  </div>
                  <input
                    id="border-width-range"
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={s.borderWidth}
                    onChange={(e) => syncStyleField('borderWidth', parseInt(e.target.value))}
                    className="w-full h-1 bg-[#1d2736] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Color: Background Color picker */}
                <div className="flex items-center justify-between p-3 bg-[#151a24] border border-[#2d3a4f] rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Color de Fondo</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{s.backgroundColor}</span>
                  </div>
                  <input
                    id="bg-color-picker"
                    type="color"
                    value={s.backgroundColor}
                    onChange={(e) => syncStyleField('backgroundColor', e.target.value)}
                    className="cursor-pointer w-8 h-8 rounded-md bg-transparent border-none"
                  />
                </div>

                {/* Opacity slider background */}
                <div className="flex flex-col justify-center p-3 bg-[#151a24] border border-[#2d3a4f] rounded-xl">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Opacidad del Fondo</span>
                    <span className="text-sky-400 text-[11px] font-mono">{s.bgOpacity}%</span>
                  </div>
                  <input
                    id="bg-opacity-slider"
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={s.bgOpacity}
                    onChange={(e) => syncStyleField('bgOpacity', parseInt(e.target.value))}
                    className="w-full h-1 bg-[#233045] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Color: Text Color picker */}
                <div className="flex items-center justify-between p-3 bg-[#151a24] border border-[#2d3a4f] rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Color de Texto</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{s.textColor}</span>
                  </div>
                  <input
                    id="text-color-picker"
                    type="color"
                    value={s.textColor}
                    onChange={(e) => syncStyleField('textColor', e.target.value)}
                    className="cursor-pointer w-8 h-8 rounded-md bg-transparent border-none"
                  />
                </div>

                {/* Color: Accent Color picker */}
                <div className="flex items-center justify-between p-3 bg-[#151a24] border border-[#2d3a4f] rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Color de Acento Ao5</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{s.accentColor}</span>
                  </div>
                  <input
                    id="accent-color-picker"
                    type="color"
                    value={s.accentColor}
                    onChange={(e) => syncStyleField('accentColor', e.target.value)}
                    className="cursor-pointer w-8 h-8 rounded-md bg-transparent border-none"
                  />
                </div>

                {/* Color: Border Color picker */}
                <div className="flex items-center justify-between p-3 bg-[#151a24] border border-[#2d3a4f] rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Color del Borde</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{s.borderColor}</span>
                  </div>
                  <input
                    id="border-color-picker"
                    type="color"
                    value={s.borderColor}
                    onChange={(e) => syncStyleField('borderColor', e.target.value)}
                    className="cursor-pointer w-8 h-8 rounded-md bg-transparent border-none"
                  />
                </div>

                {/* Toggle controls */}
                <div className="flex flex-col gap-3 md:col-span-2 bg-[#10141e] p-4 rounded-xl border border-[#20293a]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Marcar Exclusiones (Tachado)</span>
                      <span className="text-[11px] text-slate-400">Tacha automáticamente el peor y mejor tiempo de la tanda</span>
                    </div>
                    <button
                      onClick={() => syncStyleField('showStrikeouts', !s.showStrikeouts)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        s.showStrikeouts ? 'bg-sky-500' : 'bg-[#15202f]'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        s.showStrikeouts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="h-[1px] bg-[#1e293b]" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Ver Bandera Nacional del Jugador</span>
                      <span className="text-[11px] text-slate-400">Ocultar o mostrar la bandera para un aspecto súper limpio</span>
                    </div>
                    <button
                      onClick={() => syncStyleField('showFlag', !s.showFlag)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        s.showFlag ? 'bg-sky-500' : 'bg-[#15202f]'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        s.showFlag ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Excel Paste and DB integration */}
          {activeTab === 'excel' && (
            <div className="bg-[#0c0f16] border border-[#1e293b] rounded-2xl p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-400" /> Sincronización de Datos con Excel / DB
                </h3>
                <p className="text-xs text-slate-400">
                  Carga datos de competidores y tiempos directamente copiando filas de tu Excel o Google Sheets.
                </p>
              </div>

              {/* Explanatory banner */}
              <div className="p-4 bg-sky-500/5 rounded-xl border border-sky-500/10 text-slate-300 flex flex-col gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" /> ¿Cómo funciona la carga?
                </span>
                <p className="text-xs leading-relaxed">
                  Copia una fila de tu hoja de cálculo que contenga el <strong className="text-slate-100">Nombre</strong>, 
                  el <strong className="text-slate-100">País</strong> (opcional), la <strong className="text-slate-100">bandera</strong> (opcional), 
                  y los <strong className="text-slate-100">5 tiempos</strong> divididos por columnas (tabs o comas). Al pegarlos aquí, 
                  el configurador actualizará el overlay instantáneamente.
                </p>
              </div>

              {/* Paste Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pega los datos de Excel aquí</span>
                  <span className="text-[11px] text-slate-500">Formatos: Tab (Excel), CSV o listado de números</span>
                </label>
                <textarea
                  id="excel-data-textarea"
                  value={excelPaste}
                  onChange={(e) => setExcelPaste(e.target.value)}
                  rows={4}
                  className="bg-[#151a24] border border-[#2d3a4f] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-sky-500 placeholder-slate-600"
                  placeholder="Ejemplo: Luis COMPETIDOR	Colombia	9.40	10.50	11.20	8.90	9.80"
                />
                
                {excelError && (
                  <span className="text-xs text-rose-400 font-semibold mt-1">
                    ⚠️ {excelError}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => loadExcelSample('co')}
                    className="px-3 py-1.5 bg-[#171f2b] hover:bg-[#202938] text-[11px] font-medium rounded-md text-slate-300 border border-[#2d3a4f]"
                  >
                    Demo Colombia 🇨🇴
                  </button>
                  <button
                    onClick={() => loadExcelSample('wr')}
                    className="px-3 py-1.5 bg-[#171f2b] hover:bg-[#202938] text-[11px] font-medium rounded-md text-slate-300 border border-[#2d3a4f]"
                  >
                    Demo Récord WR 🇺🇸
                  </button>
                  <button
                    onClick={() => loadExcelSample('dnf')}
                    className="px-3 py-1.5 bg-[#171f2b] hover:bg-[#202938] text-[11px] font-medium rounded-md text-slate-300 border border-[#2d3a4f]"
                  >
                    Demo Con DNF 🇨🇱
                  </button>
                </div>

                <button
                  id="excel-import-btn"
                  onClick={handleExcelParse}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Importar Fila
                </button>
              </div>

              <div className="h-[1px] bg-[#1e293b]" />

              {/* Simulation database guide */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Base de Datos en Tiempo Real
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cualquier software externo, script o base de datos que se conecte mediante solicitudes POST a la dirección 
                  <code className="bg-[#151a24] text-sky-400 px-1 py-0.5 rounded font-mono mx-1">/api/overlay</code> 
                  de este servidor web podrá cambiar de inmediato los datos del overlay al instante y ver el resultado reflejado en OBS.
                </p>
              </div>
            </div>
          )}

          {/* Quick FAQ info panel */}
          <div className="p-5 bg-gradient-to-r from-sky-500/5 to-purple-500/5 border border-sky-500/10 rounded-2xl flex flex-col gap-2">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-400" /> ¿Cómo agregar este overlay a OBS?
            </span>
            <ul className="text-xs text-slate-400 space-y-1.5 list-decimal pl-4">
              <li>Haz clic en <strong className="text-white">Copiar URL de OBS</strong> que se encuentra debajo de la vista previa de la derecha.</li>
              <li>En OBS, dentro de tu escena habitual, pulsa en el botón <strong className="text-white">+</strong> para agregar una fuente nueva.</li>
              <li>Selecciona <strong className="text-sky-400 font-bold">Navegador (Browser Source)</strong>.</li>
              <li>Pega el enlace web copiado en la entrada <strong className="text-white">URL</strong>.</li>
              <li>Ajusta la resolución recomendada en tu OBS: Ancho de <strong className="text-white">450px</strong> y Alto de <strong className="text-white">500px</strong>.</li>
              <li>¡Listo! Cualquier ajuste que realices aquí se actualizará en tu OBS en milisegundos y en tiempo real.</li>
            </ul>
          </div>
        </section>

        {/* Right column - Live Stream Preview & OBS Url (5 columns) */}
        <section id="preview-workspace-panel" className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="bg-[#0c0f16] border border-[#1e293b] rounded-2xl p-6 flex flex-col gap-4 sticky top-[100px]">
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" /> Vista Previa Streaming
              </span>
              
              {/* Preview Background Selection */}
              <div className="flex gap-1 bg-[#10141e] p-1 rounded-lg border border-[#20293a]">
                <button
                  onClick={() => setBackgroundPreviewType('game')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition ${
                    backgrounPreviewType === 'game' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Fondo simulación de juego"
                >
                  🎮 Gameplay
                </button>
                <button
                  onClick={() => setBackgroundPreviewType('green')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition ${
                    backgrounPreviewType === 'green' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chroma Green"
                >
                  🟢 Chroma
                </button>
                <button
                  onClick={() => setBackgroundPreviewType('dark')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition ${
                    backgrounPreviewType === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Color Negro Mate"
                >
                  ⚫ Negro
                </button>
              </div>
            </div>

            {/* Canvas Frame Box */}
            <div 
              id="preview-canvas-box"
              className={`h-[280px] rounded-xl relative flex items-center justify-center transition-all ${
                backgrounPreviewType === 'game' 
                  ? 'bg-[url(https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000)] bg-cover bg-center' 
                  : backgrounPreviewType === 'green'
                    ? 'bg-[#00b140]'
                    : 'bg-[#151a24]'
              }`}
            >
              {/* Gameplay blur vignette overlay */}
              {backgrounPreviewType === 'game' && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl" />
              )}

              {/* Dynamic streaming status label badge */}
              <div className="absolute top-2.5 right-2.5 z-30 bg-[#0c0f16]/90 border border-[#1e293b] backdrop-blur-md py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow">
                <span className={`w-2 h-2 rounded-full ${overlayState?.isVisible !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shrink-0`} />
                <span className="text-[9px] font-black tracking-widest text-[#94a3b8] uppercase font-sans select-none">
                  {overlayState?.isVisible !== false ? 'OBS: MOSTRANDO' : 'OBS: OCULTO'}
                </span>
              </div>

              {/* Render dynamic live customized card inside preview window */}
              {(() => {
                const renderPreviewCard = (cComp: any, cAo5: any, cWinner: boolean, playerNum: number) => {
                  return (
                    <div
                      className="transition-all duration-300 flex flex-col p-4 border rounded-lg relative max-w-full select-none"
                      style={{
                        backgroundColor: s.backgroundColor,
                        borderColor: cWinner && s.layout === 'versus' ? s.accentColor : s.borderColor,
                        borderWidth: cWinner && s.layout === 'versus' ? `${Math.max(2, s.borderWidth)}px` : `${s.borderWidth}px`,
                        color: s.textColor,
                        width: `${s.width || 380}px`,
                        boxShadow: s.shadow === 'none' ? 'none' : s.shadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' : s.shadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' : s.shadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' : '0 0 20px rgba(0,0,0,0.5)',
                        opacity: s.bgOpacity / 100,
                        fontFamily: s.fontFamily === 'Inter' ? '"Inter", sans-serif' : s.fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : s.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : s.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Playfair Display", serif'
                      }}
                    >
                      {cWinner && s.layout === 'versus' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full tracking-widest uppercase shadow shadow-sky-500/20 flex items-center gap-1 border border-sky-400 z-10 animate-pulse">
                          <Trophy className="w-2.5 h-2.5 text-amber-300" /> Líder
                        </div>
                      )}

                      {/* Custom preview container header */}
                      <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: `${s.borderColor}50` }}>
                        <div className="flex items-center gap-2 min-w-0">
                          {s.showFlag && cComp.countryFlagUrl && (
                            <img 
                              src={cComp.countryFlagUrl} 
                              alt="" 
                              className="w-8 h-5 object-cover rounded shadow border"
                              style={{ borderColor: `${s.borderColor}20` }}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-xs tracking-tight text-white line-clamp-1" style={{ color: s.textColor }}>
                              {cComp.competitorName || 'Sin Nombre'}
                            </div>
                            <span className="text-[9px] uppercase opacity-60 block tracking-tight">
                              {cComp.countryName || 'Competidor'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-1 px-1.5 rounded-full text-[9px] font-bold flex items-center" style={{ backgroundColor: `${s.accentColor}20`, color: s.accentColor }}>
                          P{playerNum}
                        </div>
                      </div>

                      {/* Times List in Preview */}
                      <div className="flex flex-col gap-1 text-[11px] font-mono">
                        {cComp.times.map((time: string, idx: number) => {
                          const isBest = idx === cAo5.bestIdx;
                          const isWorst = idx === cAo5.worstIdx;
                          const shouldStrike = s.showStrikeouts && (isBest || isWorst);

                          return (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between py-1 px-1.5 rounded transition"
                              style={{ 
                                backgroundColor: isBest ? `${s.accentColor}10` : isWorst ? 'rgba(0,0,0,0.15)' : 'transparent'
                              }}
                            >
                              <span className="opacity-40 text-[9px]">Solv #{idx + 1}</span>
                              <span 
                                className={`font-medium ${shouldStrike ? 'line-through opacity-75 font-normal' : ''}`}
                                style={{ color: s.textColor }}
                              >
                                {time || '---'}
                              </span>
                              <span className="text-[9px] uppercase font-bold text-center font-sans">
                                {isBest && s.showStrikeouts && (
                                  <span style={{ color: s.accentColor }}>MIN</span>
                                )}
                                {isWorst && s.showStrikeouts && (
                                  <span className="text-rose-400">MAX</span>
                                )}
                                {!isBest && !isWorst && (
                                  <span className="opacity-20">•</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Calculated Ao5 bottom view in Preview */}
                      <div className="border-t mt-2 pt-2 flex items-center justify-between" style={{ borderColor: `${s.borderColor}50` }}>
                        <div className="flex flex-col font-sans text-left">
                          <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">PROMEDIO Ao5</span>
                          <span className="text-[8px] italic opacity-40">Excl. max & min</span>
                        </div>
                        <div 
                          className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${s.accentColor}18`, color: s.accentColor }}
                        >
                          {cAo5.average}
                        </div>
                      </div>
                    </div>
                  );
                };

                const renderPreviewTable = () => {
                  return (
                    <div 
                      className="flex flex-col gap-1.5 py-1 w-full max-w-full select-none scale-75 md:scale-80 origin-center text-left"
                      style={{ 
                        fontFamily: s.fontFamily === 'Inter' ? '"Inter", sans-serif' : s.fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : s.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : s.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Playfair Display", serif'
                      }}
                    >
                      {/* Header Row */}
                      <div 
                        className="w-full px-3 py-1.5 bg-[#10141e]/85 backdrop-blur-xs rounded-full flex items-center border"
                        style={{ 
                          borderColor: s.borderColor,
                          borderWidth: `${s.borderWidth}px`
                        }}
                      >
                        <div className="w-[28%] text-left pl-2 truncate">
                          <span className="font-extrabold text-[8px] text-slate-100 uppercase tracking-widest leading-none block truncate">
                            {s.eventName || "WCA South American Championship 2026"}
                          </span>
                        </div>
                        <div className="w-[72%] grid grid-cols-8 gap-x-1 text-center text-slate-400 font-extrabold text-[8px] uppercase tracking-wider pr-1 pl-2">
                          <span>T 1</span>
                          <span>T 2</span>
                          <span>T 3</span>
                          <span>T 4</span>
                          <span>T 5</span>
                          <span className="text-red-400/90 font-bold">Wrs</span>
                          <span className="text-emerald-400/90 font-bold">Bst</span>
                          <span className="text-sky-400/90 font-black">AVG</span>
                        </div>
                      </div>

                      {[
                        { comp: comp1, ao5: ao5Result1, isWinner: isComp1Better, num: 1 },
                        { comp: comp2, ao5: ao5Result2, isWinner: isComp2Better, num: 2 }
                      ].map(({ comp, ao5, isWinner, num }) => {
                        return (
                          <div 
                            key={num}
                            className="w-full p-1.5 rounded-full flex items-center border shadow relative gap-1.5"
                            style={{
                              background: s.backgroundColor === '#0d0e12' ? 'linear-gradient(90deg, #145d7a 0%, #0c384a 100%)' : s.backgroundColor,
                              borderColor: isWinner ? s.accentColor : s.borderColor,
                              borderWidth: `${isWinner ? Math.max(1, s.borderWidth) : s.borderWidth}px`,
                              opacity: s.bgOpacity / 100,
                            }}
                          >
                            {/* Visual Leader Indicator */}
                            {isWinner && (
                              <div className="absolute -top-2 left-6 bg-sky-500 text-white font-extrabold text-[6px] px-1.5 py-0.2 rounded-full tracking-wider uppercase shadow-xs flex items-center gap-0.5 border border-sky-400 z-10 scale-90">
                                <Trophy className="w-1.5 h-1.5 text-amber-300" /> Líder
                              </div>
                            )}

                            {/* Left side: Flag + Name */}
                            <div className="w-[28%] flex items-center pl-2 min-w-0">
                              {s.showFlag && comp.countryFlagUrl && (
                                <img 
                                  src={comp.countryFlagUrl} 
                                  alt="" 
                                  className="w-6 h-6 rounded-full border border-white object-cover aspect-square shrink-0"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="pl-1.5 truncate text-left">
                                <span className="font-extrabold text-[10px] text-white tracking-tight block truncate">
                                  {comp.competitorName || 'Sin Nombre'}
                                </span>
                              </div>
                            </div>

                            {/* Right side: Inner times stats */}
                            <div className="w-[72%] bg-black/40 rounded-full py-1 px-2.5 grid grid-cols-8 gap-x-1 text-center text-slate-100 font-mono text-[9px] font-semibold items-center animate-fade-in pl-2">
                              {comp.times.map((time: string, idx: number) => {
                                const isBest = idx === ao5.bestIdx;
                                const isWorst = idx === ao5.worstIdx;
                                const shouldStrike = s.showStrikeouts && (isBest || isWorst);

                                return (
                                  <span 
                                    key={idx} 
                                    className={`truncate ${shouldStrike ? 'line-through opacity-75 font-normal text-slate-200' : 'text-slate-100 font-bold'}`}
                                  >
                                    {time || '---'}
                                  </span>
                                );
                              })}

                              <span className="text-red-400/95 font-normal truncate">
                                {ao5.worstIdx !== -1 ? comp.times[ao5.worstIdx] : '---'}
                              </span>

                              <span className="text-emerald-400/95 font-normal truncate">
                                {ao5.bestIdx !== -1 ? comp.times[ao5.bestIdx] : '---'}
                              </span>

                              <span 
                                className="font-extrabold tracking-tighter text-[10px]"
                                style={{ color: s.accentColor }}
                              >
                                {ao5.average}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                };

                const renderPreviewRanking = () => {
                  const sorted = getSortedCompetitors(overlayState.competitors || []);
                  return (
                    <div 
                      className="flex flex-col gap-1.5 py-1 w-full max-w-full select-none scale-75 md:scale-85 origin-center text-left"
                      style={{ 
                        fontFamily: s.fontFamily === 'Inter' ? '"Inter", sans-serif' : s.fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : s.fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : s.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Playfair Display", serif'
                      }}
                    >
                      {/* Header Row */}
                      <div 
                        className="w-full px-3 py-1.5 bg-[#10141e]/85 backdrop-blur-xs rounded-full flex items-center border"
                        style={{ 
                          borderColor: s.borderColor,
                          borderWidth: `${s.borderWidth}px`
                        }}
                      >
                        <div className="w-[28%] text-left pl-2 truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                          <span className="font-extrabold text-[8px] text-slate-100 uppercase tracking-widest leading-none block truncate">
                            {s.eventName || "Ranking General"}
                          </span>
                        </div>
                        <div className="w-[72%] grid grid-cols-11 gap-x-1 text-center text-slate-400 font-extrabold text-[7px] uppercase tracking-wider pr-1 pl-4">
                          <span className="col-span-1 text-left pl-1">Pos</span>
                          <span className="col-span-3 text-left">Competidor</span>
                          <span>T 1</span>
                          <span>T 2</span>
                          <span>T 3</span>
                          <span>T 4</span>
                          <span>T 5</span>
                          <span className="text-sky-400 font-black text-right col-span-2 pr-1">AVG</span>
                        </div>
                      </div>

                      {sorted.map(({ comp, ao5 }, idx) => {
                        const rank = idx + 1;
                        const rankBg = rank === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/35' : rank === 2 ? 'bg-slate-300/20 text-slate-100 border-slate-300/35' : rank === 3 ? 'bg-amber-700/20 text-amber-500 border-amber-700/35' : 'bg-slate-800/40 text-slate-400 border-slate-700/30';
                        const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}°`;
                        const isP1 = comp.id === overlayState.activeCompetitorId;
                        const isP2 = comp.id === overlayState.activeCompetitorId2;
                        const highlightBorder = isP1 || isP2;

                        return (
                          <div 
                            key={comp.id}
                            className="w-full p-1.5 rounded-full flex items-center border shadow relative gap-1.5 min-h-[44px]"
                            style={{
                              background: s.backgroundColor === '#0d0e12' ? 'linear-gradient(90deg, #10141e 0%, #151d29 100%)' : s.backgroundColor,
                              borderColor: highlightBorder ? s.accentColor : s.borderColor,
                              borderWidth: `${highlightBorder ? Math.max(1, s.borderWidth) : s.borderWidth}px`,
                              opacity: s.bgOpacity / 100,
                            }}
                          >
                            {/* Left side: Flag + Name */}
                            <div className="w-[28%] flex items-center pl-2 min-w-0">
                              {s.showFlag && comp.countryFlagUrl && (
                                <img 
                                  src={comp.countryFlagUrl} 
                                  alt="" 
                                  className="w-5 h-5 rounded-full border border-white object-cover aspect-square shrink-0"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="pl-1.5 truncate text-left">
                                <span className="font-extrabold text-[9px] text-white tracking-tight block truncate">
                                  {comp.competitorName || 'Sin Nombre'}
                                </span>
                              </div>
                            </div>

                            {/* Right side: Inner times stats */}
                            <div className="w-[72%] bg-black/40 rounded-full py-1 px-2.5 grid grid-cols-11 gap-x-1 text-center text-slate-100 font-mono text-[8px] font-semibold items-center pl-4">
                              <div className="col-span-1 text-left flex items-center pl-0.5">
                                <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${rankBg}`}>
                                  {rankLabel}
                                </span>
                              </div>
                              <div className="col-span-3 text-left text-slate-300 font-sans font-bold truncate">
                                {comp.competitorName || '---'}
                              </div>

                              {comp.times.map((time: string, tIdx: number) => {
                                const isBest = tIdx === ao5.bestIdx;
                                const isWorst = tIdx === ao5.worstIdx;
                                const shouldStrike = s.showStrikeouts && (isBest || isWorst);

                                return (
                                  <span 
                                    key={tIdx} 
                                    className={`truncate ${shouldStrike ? 'line-through opacity-75 font-normal text-slate-200' : 'text-slate-200'}`}
                                  >
                                    {time || '---'}
                                  </span>
                                );
                              })}

                              <span 
                                className="font-extrabold text-[9px] text-right block pr-1 col-span-2"
                                style={{ color: s.accentColor }}
                              >
                                {ao5.average}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                };

                const isOverlayVisible = overlayState?.isVisible !== false;

                return (
                  <div className={`z-10 transition-all duration-300 w-full max-w-full px-2 ${
                    isOverlayVisible ? '' : 'opacity-25 grayscale-[30%] blur-[1px] scale-98 pointer-events-none'
                  }`}>
                    {s.layout === 'ranking' ? (
                      renderPreviewRanking()
                    ) : s.layout === 'versus' ? (
                      s.versusLayoutType === 'table' ? (
                        renderPreviewTable()
                      ) : (
                        <div className="flex flex-row items-center justify-center gap-3 scale-75 md:scale-80 origin-center">
                          {renderPreviewCard(comp1, ao5Result1, isComp1Better, 1)}
                          <span className="w-8 h-8 rounded-full bg-[#0c0f16] border border-[#1e293b] flex items-center justify-center text-rose-500 font-extrabold text-xs shadow-md shrink-0 select-none animate-pulse">
                            VS
                          </span>
                          {renderPreviewCard(comp2, ao5Result2, isComp2Better, 2)}
                        </div>
                      )
                    ) : (
                      <div className="scale-90 flex justify-center">
                        {renderPreviewCard(comp1, ao5Result1, false, 1)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Connection Link section */}
            <div className="border-t border-[#1e293b] pt-4 flex flex-col gap-3">
              <div>
                <span className="text-xs font-black text-white hover:text-sky-400 transition-colors uppercase tracking-widest flex items-center gap-1.5 pb-1 select-none">
                  🌐 Enlaces Fuente de OBS (Browser Source)
                </span>
                <p className="text-[11px] text-slate-400">
                  Agrega estas URLs en OBS Studio. Puedes usar el modo dinámico o fijar una modalidad de forma estática con un enlace independiente.
                </p>
              </div>

              {/* Grid / List of Links */}
              <div className="flex flex-col gap-2.5 mt-1 bg-[#0b0f17] p-3 rounded-lg border border-[#1e293b]/70">
                
                {/* 1. Dynamic Mode Link */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Modo Dinámico (Sigue al Panel)
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">Auto-Sincronizado</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      id="obs-copy-dynamic"
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?mode=overlay`}
                      className="bg-[#121620] border border-[#232f44] rounded px-2.5 py-1.5 text-[11px] text-sky-400 font-mono flex-1 focus:outline-none"
                    />
                    <button
                      id="btn-copy-dynamic"
                      onClick={() => handleCopyLink(`${window.location.origin}/?mode=overlay`, 'dynamic')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 min-w-[85px] justify-center ${
                        copiedType === 'dynamic' ? 'bg-emerald-500 text-black border border-emerald-400 shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {copiedType === 'dynamic' ? '¡Llisto!' : 'Copiar'}
                    </button>
                    <a
                      href={`${window.location.origin}/?mode=overlay`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
                      title="Probar en pestaña"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#1e293b]/60 my-0.5" />

                {/* 2. Individual Mode Link */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
                      👤 Modalidad Individual (1 Competidor)
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">?layout=single</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      id="obs-copy-single"
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?mode=overlay&layout=single`}
                      className="bg-[#121620] border border-[#232f44] rounded px-2.5 py-1.5 text-[11px] text-sky-400 font-mono flex-1 focus:outline-none"
                    />
                    <button
                      id="btn-copy-single"
                      onClick={() => handleCopyLink(`${window.location.origin}/?mode=overlay&layout=single`, 'single')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 min-w-[85px] justify-center ${
                        copiedType === 'single' ? 'bg-emerald-500 text-black border border-emerald-400 shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {copiedType === 'single' ? '¡Listo!' : 'Copiar'}
                    </button>
                    <a
                      href={`${window.location.origin}/?mode=overlay&layout=single`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
                      title="Probar en pestaña"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 3. Versus Mode Link */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-extrabold text-[#f43f5e] uppercase tracking-wider">
                      🥊 Modalidad Versus (VS / 2 Competidores)
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">?layout=versus</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      id="obs-copy-versus"
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?mode=overlay&layout=versus`}
                      className="bg-[#121620] border border-[#232f44] rounded px-2.5 py-1.5 text-[11px] text-sky-400 font-mono flex-1 focus:outline-none"
                    />
                    <button
                      id="btn-copy-versus"
                      onClick={() => handleCopyLink(`${window.location.origin}/?mode=overlay&layout=versus`, 'versus')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 min-w-[85px] justify-center ${
                        copiedType === 'versus' ? 'bg-emerald-500 text-black border border-emerald-400 shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {copiedType === 'versus' ? '¡Listo!' : 'Copiar'}
                    </button>
                    <a
                      href={`${window.location.origin}/?mode=overlay&layout=versus`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
                      title="Probar en pestaña"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 4. Ranking Mode Link */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-extrabold text-[#818cf8] uppercase tracking-wider">
                      📊 Modalidad Ranking (Tabla General)
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">?layout=ranking</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      id="obs-copy-ranking"
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?mode=overlay&layout=ranking`}
                      className="bg-[#121620] border border-[#232f44] rounded px-2.5 py-1.5 text-[11px] text-sky-400 font-mono flex-1 focus:outline-none"
                    />
                    <button
                      id="btn-copy-ranking"
                      onClick={() => handleCopyLink(`${window.location.origin}/?mode=overlay&layout=ranking`, 'ranking')}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 min-w-[85px] justify-center ${
                        copiedType === 'ranking' ? 'bg-emerald-500 text-black border border-emerald-400 shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {copiedType === 'ranking' ? '¡Listo!' : 'Copiar'}
                    </button>
                    <a
                      href={`${window.location.origin}/?mode=overlay&layout=ranking`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
                      title="Probar en pestaña"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
