'use client';

import { Sensor } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Zap, Layers, Droplets, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

interface SensorCardProps {
  sensor: Sensor;
  reading?: number;
  unit?: string;
}

export function SensorCard({ sensor, reading, unit }: SensorCardProps) {
  const typeIcons = {
    vibration: <Layers className="w-4 h-4" />,
    strain: <Zap className="w-4 h-4" />,
    temperature: <Thermometer className="w-4 h-4" />,
    humidity: <Droplets className="w-4 h-4" />,
  };

  const statusThemes = {
    operational: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' },
    critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse-subtle' },
    offline: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-500', badge: 'bg-zinc-500/20 text-zinc-400', glow: 'shadow-none' },
  };

  const theme = statusThemes[sensor.status];
  const isIncreasing = reading !== undefined && reading > 0.5; // Mock logic

  return (
    <Card className={`relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-[#0a0e27]/40 backdrop-blur-md border ${theme.border} ${theme.glow}`}>
      {/* Decorative inner glow */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${sensor.status === 'operational' ? 'emerald' : sensor.status === 'warning' ? 'amber' : 'rose'}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${theme.text}`}>
            {typeIcons[sensor.type] || <Activity className="w-4 h-4" />}
          </div>
          <Badge className={`border-0 font-bold uppercase tracking-widest text-[10px] ${theme.badge} py-0.5 px-2`}>
            {sensor.status}
          </Badge>
        </div>
        <div className="mt-3">
          <CardTitle className="text-sm font-bold text-white tracking-tight leading-tight line-clamp-1">{sensor.name}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
            <span className="truncate">{sensor.location}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold mb-1">Live Reading</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-black tracking-tighter ${reading !== undefined ? 'text-white' : 'text-zinc-600'}`}>
                {reading !== undefined ? reading.toFixed(1) : '---'}
              </span>
              <span className="text-xs font-bold text-muted-foreground/80">{unit || '--'}</span>
            </div>
          </div>
          
          {/* Mock Micro-Sparkline */}
          <div className="flex items-center gap-2 mb-1.5 h-8">
            <div className="flex items-end gap-[2px] h-full">
              {[0.4, 0.6, 0.3, 0.8, 0.5, 0.9, 0.7].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full ${theme.text} opacity-${20 + (i * 10)}`}
                  style={{ height: `${h * 100}%` }}
                ></div>
              ))}
            </div>
            {reading !== undefined && (
              <div className={`p-1 rounded-md ${isIncreasing ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isIncreasing ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            <span>Updated: {(() => {
              const lastUpdate = typeof sensor.lastUpdate === 'string' ? new Date(sensor.lastUpdate) : sensor.lastUpdate;
              return lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            })()}</span>
          </div>
          <div className={`flex items-center gap-1 ${theme.text}`}>
            <span className="w-1 h-1 rounded-full bg-current animate-pulse"></span>
            Sync Active
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
