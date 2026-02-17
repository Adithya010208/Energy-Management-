
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
  Terminal,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Wind,
  Network,
  BrainCircuit,
  Star,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, animate } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchLastFeed, fetchHistory } from './services/thingSpeakService';
import { getGovernanceAdvice } from './services/geminiService';
import { ThingSpeakFeed } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const BUDGET_LIMIT = 100;
const DAYS_PASSED = 10;
const CARBON_FACTOR = 0.82;
const AI_INTERVAL = 300000; // 5 minutes

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

const App: React.FC = () => {
  const [data, setData] = useState<ThingSpeakFeed | null>(null);
  const [history, setHistory] = useState<ThingSpeakFeed[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(localStorage.getItem('last_ai_insight') || "Initializing Strategic AI Analysis...");
  const [aiStatus, setAiStatus] = useState<'active' | 'limited' | 'error' | 'loading'>('loading');

  const stats = useMemo(() => {
    let current = 0, power = 0, energy = 0;
    if (isDemoMode || !data) {
      current = 1.2 + Math.random() * 0.8;
      power = 350 + Math.random() * 300;
      energy = 25 + Math.random() * 40;
    } else {
      current = parseFloat(data.field1) || 0;
      power = parseFloat(data.field2) || 0;
      energy = parseFloat(data.field3) || 0;
    }
    const prediction = (energy / DAYS_PASSED) * 30;
    const carbon = energy * CARBON_FACTOR;
    const progress = (energy / BUDGET_LIMIT) * 100;
    const annualCarbon = carbon * 12;
    const annualEnergySavings = Math.max(0, (BUDGET_LIMIT - prediction) * 12);
    
    return { current, power, energy, prediction, carbon, progress, annualCarbon, annualEnergySavings };
  }, [data, isDemoMode]);

  const isHighRisk = stats.prediction > BUDGET_LIMIT;

  const fetchTelemetry = useCallback(async () => {
    const feed = await fetchLastFeed();
    const feeds = await fetchHistory(20);
    if (feed) {
      setData(feed);
      setHistory(feeds);
    }
  }, []);

  const fetchAIInsights = useCallback(async () => {
    setAiStatus('loading');
    const result = await getGovernanceAdvice(stats.energy, stats.prediction, BUDGET_LIMIT);
    setAiRecommendation(result.text);
    setAiStatus(result.status === 'pro' ? 'active' : result.status);
  }, [stats.energy, stats.prediction]);

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
    labels: history.map