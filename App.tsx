
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Zap, 
  Activity, 
  Database, 
  Leaf, 
  ShieldAlert, 
  BarChart3, 
  Cpu, 
  Globe,
  BrainCircuit,
  Star,
  LayoutDashboard,
  Box,
  Server,
  Building,
  Radio,
  ShieldCheck,
  Network,
  Wind,
  Trophy,
  TreePine,
  ClipboardCheck,
  Flame,
  Gauge,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, animate } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchLastFeed, fetchHistory } from './services/thingSpeakService';
import { getGovernanceAdvice, AIResponse } from './services/geminiService';
import { ThingSpeakFeed, NodeData, OptimizationStrategy } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

const BUDGET_LIMIT = 100;
const DAYS_PASSED = 10;
const CARBON_FACTOR = 0.82;
const AI_INTERVAL = 120000; // 2 minutes
const PEAK_THRESHOLD = 700; 

const AnimatedCounter = ({ value, decimals = 1, fromZero = true }: { value: number; decimals?: number; fromZero?: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const startValue = fromZero ? 0 : displayValue;
    const controls = animate(startValue, value, {
      duration: 2.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value, fromZero]);
  return <>{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
};

const EfficiencyBadge = ({ score }: { score: number }) => {
  const color = score > 85 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 
                score > 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 
                'text-rose-400 bg-rose-500/10 border-rose-500/30';
  return (
    <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${color}`}>
      <Gauge size={10} /> {score.toFixed(0)}% EFFICIENCY
    </div>
  );
};

const MetricCard = ({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: number; unit: string; color: string }) => (
  <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-white/10 hover:translate-y-[-4px] hover:border-indigo-500/30 transition-all shadow-lg">
    <div className={`p-2.5 rounded-xl bg-white/5 w-fit mb-4 ${color} shadow-inner`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl md:text-4xl font-bold text-white tracking-tighter">
        <AnimatedCounter value={value} decimals={label.includes('Load') ? 0 : 2} />
      </span>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{unit}</span>
    </div>
  </div>
);

const ImpactMetric = ({ icon: Icon, label, value, unit, color }: { icon: React.ElementType; label: string; value: number; unit: string; color: string }) => (
  <div className="text-center p-8 rounded-[2rem] bg-black/30 border border-white/10 space-y-4 hover:border-indigo-500/20 transition-colors shadow-2xl">
    <div className={`mx-auto w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-black/50 border border-white/5 shadow-inner ${color}`}>
      <Icon size={28} />
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline justify-center gap-2">
      <span className="text-4xl md:text-5xl font-black text-white font-orbitron tracking-tighter">
        <AnimatedCounter value={value} decimals={1} />
      </span>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{unit}</span>
    </div>
  </div>
);

const NodeCard: React.FC<{ data: NodeData; isHighest: boolean }> = ({ data, isHighest }) => (
  <motion.div 
    layout
    className={`glass-card p-5 rounded-2xl relative overflow-hidden h-full flex flex-col justify-between ${isHighest ? 'border-rose-500/30 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.05)]' : 'border-white/5 bg-slate-900/40'}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${data.type === 'live' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700/20 text-slate-500'}`}>
        {data.id === 'room-101' ? <Building size={18} /> : data.id === 'cse-lab' ? <Server size={18} /> : data.id === 'mech-block' ? <Box size={18} /> : <Radio size={18} />}
      </div>
      {data.type === 'live' ? (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
        </div>
      ) : (
        <div className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SIM</span>
        </div>
      )}
    </div>
    
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate pr-2">{data.name}</h4>
        <EfficiencyBadge score={data.efficiency} />
      </div>
      <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mb-4">
        {data.type === 'live' ? 'Governance Master' : 'Architecture Scalability Model'}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[8px] font-bold text-slate-500 uppercase mb-0.5">Load</p>
          <p className={`text-sm font-bold ${isHighest ? 'text-rose-400' : 'text-indigo-400'}`}>
            <AnimatedCounter value={data.power} decimals={0} /> W
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-slate-500 uppercase mb-0.5">Current</p>
          <p className="text-sm font-bold text-slate-300">
            <AnimatedCounter value={data.current} decimals={2} /> A
          </p>
        </div>
      </div>
    </div>

    {isHighest && (
      <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center gap-2 text-[9px] font-bold text-rose-400 uppercase tracking-widest animate-pulse">
        <ShieldAlert size={12} /> Priority Optimization Zone
      </div>
    )}
  </motion.div>
);

const App: React.FC = () => {
  const [data, setData] = useState<ThingSpeakFeed | null>(null);
  const [aiStatus, setAiStatus] = useState<AIResponse['status']>('active');
  const [aiRecommendation, setAiRecommendation] = useState(localStorage.getItem('last_ai_insight') || "Synthesizing Campus Governance Strategy...");
  const [logs, setLogs] = useState<string[]>(["[KERNEL] Governance v4.0 Active", "[MODEL] Loading Phase Alignment Engines..."]);
  const [peakStreak, setPeakStreak] = useState(0);
  const [patternDetected, setPatternDetected] = useState(false);

  const [simNodes, setSimNodes] = useState<NodeData[]>([
    { id: 'cse-lab', name: 'CSE Research Lab', type: 'simulated', power: 650, current: 2.8, energy: 45, efficiency: 88, status: 'active' },
    { id: 'mech-block', name: 'Mechanical Block', type: 'simulated', power: 520, current: 2.3, energy: 32, efficiency: 91, status: 'active' },
    { id: 'admin-office', name: 'Administrative Office', type: 'simulated', power: 340, current: 1.5, energy: 18, efficiency: 96, status: 'active' },
  ]);

  const optimizationStrategies = useMemo<OptimizationStrategy[]>(() => [
    { name: 'Phase Alignment', status: 'Active', impact: '-4% Total Harmonics' },
    { name: 'Peak Shaving', status: patternDetected ? 'Optimizing' : 'Standby', impact: 'Prevents Overload' },
    { name: 'Voltage Balancing', status: 'Active', impact: '+2.5% Efficiency' },
  ], [patternDetected]);

  const stats = useMemo(() => {
    let current = 0, power = 0, energy = 0;
    if (data) {
      current = parseFloat(data.field1) || 0;
      power = parseFloat(data.field2) || 0;
      energy = parseFloat(data.field3) || 0;
    } else {
      current = 1.2 + Math.random() * 0.8;
      power = 350 + Math.random() * 300;
      energy = 25 + Math.random() * 40;
    }
    
    const liveEfficiency = Math.max(0, Math.min(100, 100 - ((power / 1000) * 40)));
    const prediction = (energy / DAYS_PASSED) * 30;
    const carbon = energy * CARBON_FACTOR;
    const annualCarbon = carbon * 12;
    const treesEquivalent = annualCarbon / 21;
    
    const liveNode: NodeData = { id: 'room-101', name: 'Classroom 101', type: 'live', power, current, energy, efficiency: liveEfficiency, status: power > PEAK_THRESHOLD ? 'warning' : 'active' };
    const allNodes = [liveNode, ...simNodes];
    const highestPowerNode = [...allNodes].sort((a, b) => b.power - a.power)[0];
    const totalCampusPower = allNodes.reduce((acc, node) => acc + node.power, 0);
    const avgEfficiency = allNodes.reduce((acc, node) => acc + node.efficiency, 0) / allNodes.length;
    const institutionalStars = Math.ceil(avgEfficiency / 20);

    return { 
      current, power, energy, prediction, carbon, 
      annualCarbon, treesEquivalent,
      allNodes, highestPowerNode, totalCampusPower, avgEfficiency, institutionalStars
    };
  }, [data, simNodes]);

  const isHighRisk = stats.prediction > BUDGET_LIMIT;

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-3), `[${new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${msg}`]);
  }, []);

  const fetchTelemetry = useCallback(async () => {
    const feed = await fetchLastFeed();
    const feeds = await fetchHistory(20);
    if (feed) {
      setData(feed);
      const curPower = parseFloat(feed.field2) || 0;
      if (curPower > PEAK_THRESHOLD) {
        setPeakStreak(prev => {
          const next = prev + 1;
          if (next >= 3) {
            setPatternDetected(true);
            addLog("AI ALERT: Persistent Peak Pattern Detected!");
          }
          return next;
        });
      } else {
        setPeakStreak(0);
        setPatternDetected(false);
      }
      addLog(`Node Sync: OK`);
    }

    setSimNodes(prev => prev.map(node => {
      const variation = (Math.random() - 0.5) * 40;
      const base = node.id === 'cse-lab' ? 675 : node.id === 'mech-block' ? 525 : 375;
      const newPower = Math.max(0, base + variation);
      const newEff = Math.max(0, Math.min(100, 100 - ((newPower / 1000) * 40) + (Math.random() * 5)));
      return { ...node, power: newPower, current: newPower / 230, efficiency: newEff };
    }));
  }, [addLog]);

  const fetchAIInsights = useCallback(async () => {
    addLog("Core Governance: Refreshing Neural Link...");
    const result = await getGovernanceAdvice(stats.energy, stats.prediction, BUDGET_LIMIT);
    setAiRecommendation(result.text);
    setAiStatus(result.status);
    if (result.status === 'limited') {
      addLog("AI WARNING: Quota limit reached. Showing cached insight.");
    } else {
      addLog("AI: Governance sync complete.");
    }
  }, [stats.energy, stats.prediction, addLog]);

  useEffect(() => {
    fetchTelemetry();
    const tInterval = setInterval(fetchTelemetry, 5000);
    const aInterval = setInterval(fetchAIInsights, AI_INTERVAL);
    const initialAi = setTimeout(fetchAIInsights, 2000);
    return () => {
      clearInterval(tInterval);
      clearInterval(aInterval);
      clearTimeout(initialAi);
    };
  }, [fetchTelemetry, fetchAIInsights]);

  const chartData = {
    labels: stats.allNodes.map(n => n.name.split(' ')[0]),
    datasets: [{
      label: 'Power Load (W)',
      data: stats.allNodes.map(n => n.power),
      backgroundColor: stats.allNodes.map(n => n.id === stats.highestPowerNode.id ? 'rgba(244, 63, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'),
      borderColor: stats.allNodes.map(n => n.id === stats.highestPowerNode.id ? '#f43f5e' : '#6366f1'),
      borderWidth: 2,
      borderRadius: 12,
    }],
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 pb-12">
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg tracking-tighter font-orbitron text-white">
                LOGIC <span className="text-emerald-400">LORDS</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">SMART CAMPUS GOVERNANCE v4.0</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-2">Institutional Rating</p>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className={i < stats.institutionalStars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
              ))}
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center gap-2">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest">SDG 7 PRO</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-12">
        
        {/* SECTION 1: LIVE PROTOTYPE NODE */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h2 className="text-xs md:text-sm font-black font-orbitron tracking-widest text-white flex items-center gap-2 uppercase">
              <Radio size={16} className="text-emerald-400 shrink-0" />
              Real-Time Node Protocol (Hardware Instance)
            </h2>
            <div className="flex items-center gap-4 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {patternDetected && <span className="text-rose-400 animate-pulse flex items-center gap-1"><ShieldAlert size={12} /> Pattern Alert</span>}
              <span>Node ID: RMK-E-01</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard icon={<Zap />} label="Active Phase Load" value={stats.power} unit="W" color="text-amber-400" />
            <MetricCard icon={<Activity />} label="Amperage Flow" value={stats.current} unit="A" color="text-blue-400" />
            <MetricCard icon={<Database />} label="Energy Accumulator" value={stats.energy} unit="kWh" color="text-emerald-400" />
            <MetricCard icon={<Leaf />} label="Carbon Impact" value={stats.carbon} unit="kg" color="text-teal-400" />
          </div>
        </section>

        {/* SECTION 2: CAMPUS-WIDE SCALABILITY VIEW */}
        <section className="space-y-4">
          <h2 className="text-xs md:text-sm font-black font-orbitron tracking-widest text-white flex items-center gap-2 uppercase">
            <LayoutDashboard size={16} className="text-indigo-400 shrink-0" />
            Campus Scalability Architecture
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.allNodes.map(node => (
              <NodeCard key={node.id} data={node} isHighest={node.id === stats.highestPowerNode.id} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SECTION 3: COMPARATIVE ANALYTICS & AI ENGINE */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-card p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-white/10 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] md:text-xs font-bold font-orbitron tracking-widest uppercase flex items-center gap-2">
                  <BarChart3 className="text-indigo-400" size={16} /> Comparative Distribution Map
                </h3>
              </div>
              <div className="flex-1 min-h-[250px] mb-8">
                <Bar data={chartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } } },
                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { size: 10 } } }
                  }
                }} />
              </div>
              
              {/* AI Governance Insight Card with Status Feedback */}
              <div className={`p-5 rounded-2xl bg-black/40 border transition-colors duration-500 flex flex-col md:flex-row items-start gap-4 group ${aiStatus === 'limited' ? 'border-amber-500/30' : aiStatus === 'error' ? 'border-rose-500/30' : 'border-indigo-500/20'}`}>
                <div className={`shrink-0 p-3 rounded-xl transition-all ${aiStatus === 'limited' ? 'bg-amber-500/10 text-amber-400' : aiStatus === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  <BrainCircuit size={24} className={aiStatus === 'active' ? 'animate-pulse' : ''} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${aiStatus === 'limited' ? 'text-amber-500' : aiStatus === 'error' ? 'text-rose-500' : 'text-indigo-500'}`}>
                      AI Governance Insight
                      {aiStatus === 'active' ? <Wifi size={10} className="animate-pulse" /> : <WifiOff size={10} />}
                    </p>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.2em] ${aiStatus === 'limited' ? 'bg-amber-500/10 text-amber-500' : aiStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {aiStatus === 'limited' ? 'Quota Limited - Using Cache' : aiStatus === 'active' ? 'Neural Link Active' : 'System Baseline'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{aiRecommendation}"
                  </p>
                </div>
              </div>
            </div>

            {/* AI Load Optimization Engine Section */}
            <div className="glass-card p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-white/10">
              <h3 className="text-[10px] md:text-xs font-bold font-orbitron tracking-widest uppercase mb-6 flex items-center gap-2">
                <Cpu className="text-emerald-400" size={16} /> Autonomous Optimization Engine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {optimizationStrategies.map((strat, i) => (
                  <div key={i} className="bg-black/20 border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{strat.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${strat.status === 'Optimizing' ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {strat.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mb-1">{strat.impact}</p>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: strat.status === 'Standby' ? '0%' : '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className={`h-full ${strat.status === 'Optimizing' ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: PREDICTIVE GOVERNANCE & RATINGS */}
          <div className="lg:col-span-4 space-y-8 flex flex-col">
            <div className="glass-card p-6 rounded-3xl bg-slate-900/40 border border-white/10 flex-1">
              <h3 className="text-[10px] md:text-xs font-bold font-orbitron tracking-widest uppercase mb-8 flex items-center gap-2">
                <ShieldCheck className="text-emerald-400 shrink-0" size={16} /> Predictor & Governance Protocol
              </h3>
              <div className="space-y-8">
                <div className="p-8 rounded-2xl bg-black/40 border border-white/5 text-center relative overflow-hidden shadow-inner">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">Estimated Billing Cycle End</p>
                  <div className="text-5xl font-black font-orbitron text-white mb-2 tracking-tighter">
                    <AnimatedCounter value={stats.prediction} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">kWh / MONTHLY TOTAL</p>
                  <div className={`mt-8 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${isHighRisk ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-500/5' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/5'}`}>
                    {isHighRisk ? '⚠ CRITICAL OVERFLOW RISK' : '✅ SUSTAINABILITY NOMINAL'}
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Campus Efficiency</p>
                    <span className="text-xs font-black text-emerald-400">{stats.avgEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${stats.avgEfficiency}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl bg-black/40 border border-white/5 min-h-[160px]">
              <div className="flex items-center gap-3 mb-4">
                <ClipboardCheck className="text-emerald-400" size={18} />
                <h3 className="text-[10px] font-black font-orbitron tracking-widest uppercase text-white">Smart Governance Tasks</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>Verify Node RMK-E-01 phase sync.</span>
                </div>
                {patternDetected && (
                  <div className="flex items-center gap-3 text-[10px] text-rose-400 font-bold">
                    <Flame size={12} className="shrink-0" />
                    <span>Reduce load in Classroom 101 immediately.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="glass-card p-8 md:p-14 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Institutional Excellence</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-orbitron text-white tracking-tight leading-tight">Environmental <br/><span className="text-emerald-400 italic">Governance Platform</span></h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg">
              Empowering RMK Engineering College with deep-learning heuristics for peak-shaving and energy decentralization. Logic Lords v4.0 architecture ensures absolute institutional transparency.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 relative z-10">
            <ImpactMetric icon={Wind} label="Carbon Avoidance" value={stats.annualCarbon} unit="kg CO₂" color="text-emerald-400" />
            <ImpactMetric icon={TreePine} label="Forestry Equivalent" value={stats.treesEquivalent} unit="Trees/Yr" color="text-indigo-400" />
          </div>
        </section>
      </main>

      <footer className="max-w-[1600px] mx-auto px-4 md:px-6 py-12 text-center border-t border-white/5">
        <div className="flex justify-center gap-10 mb-8 opacity-20 hover:opacity-50 transition-all cursor-default">
          <ShieldCheck size={24} />
          <Trophy size={24} />
          <Star size={24} />
          <Network size={24} />
        </div>
        <p className="text-[10px] font-black font-orbitron tracking-[0.4em] md:tracking-[0.6em] text-slate-500 uppercase">
          LOGIC LORDS • ENTERPRISE GOVERNANCE v4.0 • RMK ENGINEERING COLLEGE
        </p>
      </footer>
    </div>
  );
};

export default App;
