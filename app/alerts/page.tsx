'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Sensor } from '@/lib/mock-data';
import { AlertsPanel } from '@/components/alerts-panel';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, sensorsRes] = await Promise.all([
          fetch('/api/alerts'),
          fetch('/api/sensors'),
        ]);

        const alertsData = await alertsRes.json();
        const sensorsData = await sensorsRes.json();

        setAlerts(
          alertsData.data.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }))
        );
        setSensors(sensorsData.data.map((s: any) => ({ ...s, lastUpdate: new Date(s.lastUpdate) })));
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = (alertId: string) => {
    setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.resolved);
  const warningAlerts = alerts.filter((a) => a.severity === 'warning' && !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Alert Center</h1>
              <p className="text-sm text-muted-foreground">Manage system alerts and notifications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Critical Alerts</p>
            <p className="text-3xl font-bold text-status-critical">{criticalAlerts.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Warning Alerts</p>
            <p className="text-3xl font-bold text-status-warning">{warningAlerts.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Resolved</p>
            <p className="text-3xl font-bold text-status-operational">{resolvedAlerts.length}</p>
          </div>
        </div>

        {/* Alerts Panel */}
        <AlertsPanel
          alerts={alerts}
          onAlertResolve={handleResolve}
          onAlertDismiss={handleDismiss}
        />

        {/* Sensor Status Reference */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Sensor Status Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-3">Critical Sensors</p>
              <div className="space-y-2">
                {sensors
                  .filter((s) => s.status === 'critical')
                  .map((s) => (
                    <div key={s.id} className="text-xs p-2 bg-status-critical/10 rounded border border-status-critical/30">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-muted-foreground">{s.location}</p>
                    </div>
                  ))}
                {sensors.filter((s) => s.status === 'critical').length === 0 && (
                  <p className="text-xs text-muted-foreground">No critical sensors</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-3">Warning Sensors</p>
              <div className="space-y-2">
                {sensors
                  .filter((s) => s.status === 'warning')
                  .map((s) => (
                    <div key={s.id} className="text-xs p-2 bg-status-warning/10 rounded border border-status-warning/30">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-muted-foreground">{s.location}</p>
                    </div>
                  ))}
                {sensors.filter((s) => s.status === 'warning').length === 0 && (
                  <p className="text-xs text-muted-foreground">No warning sensors</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
