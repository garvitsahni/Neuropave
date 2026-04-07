import { AlertCircle, TrendingUp, Activity, Smartphone, Signal } from 'lucide-react';

interface DashboardHeaderProps {
  totalSensors: number;
  activeSensors: number;
  criticalAlerts: number;
  warningAlerts: number;
}

export function DashboardHeader({
  totalSensors,
  activeSensors,
  criticalAlerts,
  warningAlerts,
}: DashboardHeaderProps) {
  const healthScore = Math.max(0, 100 - (criticalAlerts * 10) - (warningAlerts * 2));
  
  return (
    <header className="border-b border-white/5 bg-gradient-to-r from-[#0a0e27] via-[#111836] to-[#0a0e27] sticky top-0 z-50 backdrop-blur-md">
      <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white m-0 leading-tight">NeuroPave</h1>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-status-operational animate-pulse"></span>
                <p className="text-[10px] uppercase tracking-widest text-blue-400/80 font-bold">System Online & Monitoring</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Stats Bar */}
          <div className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/10 shadow-inner">
            <div className="px-4 py-2 flex flex-col min-w-[100px]">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Network</span>
              <div className="flex items-center gap-2">
                <Signal className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-lg font-bold text-white">{totalSensors}</span>
              </div>
            </div>
            
            <div className="w-px h-8 bg-white/10 mx-1"></div>
            
            <div className="px-4 py-2 flex flex-col min-w-[100px]">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Healthy</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-status-operational shadow-[0_0_8px_rgba(80,200,120,0.5)]"></div>
                <span className="text-lg font-extrabold text-status-operational">{activeSensors}</span>
              </div>
            </div>

            <div className="w-px h-8 bg-white/10 mx-1"></div>

            <div className="px-4 py-2 flex flex-col min-w-[100px]">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Critical</span>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-3.5 h-3.5 ${criticalAlerts > 0 ? 'text-status-critical animate-bounce' : 'text-zinc-600'}`} />
                <span className={`text-lg font-extrabold ${criticalAlerts > 0 ? 'text-status-critical' : 'text-zinc-500'}`}>{criticalAlerts}</span>
              </div>
            </div>

            <div className="w-px h-8 bg-white/10 mx-1"></div>

            <div className="px-4 py-2 flex flex-col min-w-[120px]">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">System Health</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-16">
                  <div 
                    className={`h-full transition-all duration-1000 ${healthScore > 90 ? 'bg-status-operational' : healthScore > 70 ? 'bg-status-warning' : 'bg-status-critical'}`}
                    style={{ width: `${healthScore}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-black ${healthScore > 90 ? 'text-status-operational' : 'text-status-warning'}`}>{healthScore}%</span>
              </div>
            </div>
          </div>

          <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5" />
            Control Center
          </button>
        </div>
      </div>
    </header>
  );
}
