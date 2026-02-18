
export interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string; // Current (Amps)
  field2: string; // Power (Watts)
  field3: string; // Energy (kWh)
}

export interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    [key: string]: any;
  };
  feeds: ThingSpeakFeed[];
}

export interface NodeData {
  id: string;
  name: string;
  type: 'live' | 'simulated';
  power: number;
  current: number;
  energy: number;
  efficiency: number; // 0-100 score
  status: 'active' | 'warning' | 'idle';
}

export interface GovernanceInsights {
  prediction: number;
  riskLevel: 'Safe' | 'Warning' | 'Critical';
  recommendation: string;
}

export interface OptimizationStrategy {
  name: string;
  status: 'Active' | 'Standby' | 'Optimizing';
  impact: string;
}
