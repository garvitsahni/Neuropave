'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sensor, Alert } from '@/lib/mock-data';
import { DashboardHeader } from '@/components/dashboard-header';
import { SensorCard } from '@/components/sensor-card';
import { SensorSummary } from '@/components/sensor-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, AlertCircle, BarChart3 } from 'lucide-react';
import { AlertsPanel } from '@/components/alerts-panel';

interface SensorReading {
  sensorId: string;
  value: number;
  unit: string;
}

export default function Dashboard() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [readings, setReadings] = useState<Record<string, SensorReading>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorsRes, alertsRes] = await Promise.all([
          fetch('/api/sensors'),
          fetch('/api/alerts'),
        ]);

        const sensorsData = await sensorsRes.json();
        const alertsData = await alertsRes.json();

        setSensors(
          sensorsData.data.map((s: any) => ({
            ...s,
            lastUpdate: new Date(s.lastUpdate),
          }))
        );
        setAlerts(alertsData.data);

        // Fetch readings for all sensors
        const readingsMap: Record<string, SensorReading> = {};
        await Promise.all(
          sensorsData.data.map(async (sensor: any) => {
            try {
              const readingRes = await fetch(`/api/sensors/${sensor.id}/readings`);
              const readingData = await readingRes.json();
              if (readingData.success && readingData.data.readings.length > 0) {
                const lastReading = readingData.data.readings[readingData.data.readings.length - 1];
                readingsMap[sensor.id] = {
                  sensorId: sensor.id,
                  value: lastReading.value,
                  unit: lastReading.unit,
                };
              }
            } catch (error) {
              console.error(`Failed to fetch readings for ${sensor.id}:`, error);
            }
          })
        );
        setReadings(readingsMap);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const warningAlerts = alerts.filter((a) => a.severity === 'warning').length;
  const activeSensors = sensors.filter((s) => s.status !== 'offline').length;

  const getFilteredSensors = () => {
    switch (activeTab) {
      case 'critical':
        return sensors.filter((s) => s.status === 'critical');
      case 'warning':
        return sensors.filter((s) => s.status === 'warning');
      case 'offline':
        return sensors.filter((s) => s.status === 'offline');
      default:
        return sensors;
    }
  };

  const filteredSensors = getFilteredSensors();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        totalSensors={sensors.length}
        activeSensors={activeSensors}
        criticalAlerts={criticalAlerts}
        warningAlerts={warningAlerts}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Navigation */}
        <div className="flex justify-end gap-2">
          <Link href="/analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/alerts">
            <Button variant="outline" size="sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              Alerts
            </Button>
          </Link>
          <Link href="/map">
            <Button variant="outline" size="sm">
              <MapIcon className="w-4 h-4 mr-2" />
              View Map
            </Button>
          </Link>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <AlertsPanel
            alerts={alerts}
            onAlertResolve={() => {}}
            onAlertDismiss={() => {}}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sensors Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Status Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({sensors.length})</TabsTrigger>
                <TabsTrigger value="critical" className="text-status-critical">
                  Critical ({sensors.filter((s) => s.status === 'critical').length})
                </TabsTrigger>
                <TabsTrigger value="warning" className="text-status-warning">
                  Warning ({sensors.filter((s) => s.status === 'warning').length})
                </TabsTrigger>
                <TabsTrigger value="offline">Offline ({sensors.filter((s) => s.status === 'offline').length})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSensors.map((sensor) => {
                    const reading = readings[sensor.id];
                    return (
                      <SensorCard
                        key={sensor.id}
                        sensor={sensor}
                        reading={reading?.value}
                        unit={reading?.unit}
                      />
                    );
                  })}
                </div>
                {filteredSensors.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No sensors found in this category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <SensorSummary sensors={sensors} />

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">System Health</h3>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-semibold">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Response</span>
                  <span className="font-semibold">245ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Quality</span>
                  <span className="font-semibold">98.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
