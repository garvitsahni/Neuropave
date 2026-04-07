'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sensor } from '@/lib/mock-data';
import { SensorAnalytics } from '@/components/sensor-analytics';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AnalyticsPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await fetch('/api/sensors');
        const data = await response.json();
        setSensors(
          data.data.map((s: any) => ({
            ...s,
            lastUpdate: new Date(s.lastUpdate),
          }))
        );
      } catch (error) {
        console.error('Failed to fetch sensors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const getFilteredSensors = () => {
    switch (activeTab) {
      case 'vibration':
      case 'strain':
      case 'temperature':
      case 'humidity':
        return sensors.filter((s) => s.type === activeTab);
      default:
        return sensors;
    }
  };

  const filteredSensors = getFilteredSensors();
  const sensorTypes = ['vibration', 'strain', 'temperature', 'humidity'] as const;

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
              <h1 className="text-2xl font-bold">Analytics & Insights</h1>
              <p className="text-sm text-muted-foreground">Historical data and sensor trends</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Total Sensors</p>
            <p className="text-3xl font-bold">{sensors.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Active Sensors</p>
            <p className="text-3xl font-bold text-status-operational">
              {sensors.filter((s) => s.status !== 'offline').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Warning/Critical</p>
            <p className="text-3xl font-bold text-status-warning">
              {sensors.filter((s) => s.status === 'warning' || s.status === 'critical').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">Offline Sensors</p>
            <p className="text-3xl font-bold text-status-offline">
              {sensors.filter((s) => s.status === 'offline').length}
            </p>
          </div>
        </div>

        {/* Sensor Type Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Sensors ({sensors.length})</TabsTrigger>
            {sensorTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)} (
                {sensors.filter((s) => s.type === type).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSensors.map((sensor) => (
                <SensorAnalytics key={sensor.id} sensor={sensor} />
              ))}
            </div>
            {filteredSensors.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sensors found in this category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Insights */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">System Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-status-operational pl-4">
              <p className="text-sm font-semibold">System Health</p>
              <p className="text-2xl font-bold text-status-operational mt-1">98.5%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall system operational status</p>
            </div>
            <div className="border-l-4 border-status-warning pl-4">
              <p className="text-sm font-semibold">Uptime Today</p>
              <p className="text-2xl font-bold text-status-warning mt-1">99.8%</p>
              <p className="text-xs text-muted-foreground mt-1">24-hour rolling availability</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p className="text-sm font-semibold">Data Quality</p>
              <p className="text-2xl font-bold text-primary mt-1">98.2%</p>
              <p className="text-xs text-muted-foreground mt-1">Sensor reading accuracy rate</p>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-semibold mb-3">Trending Alerts</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-2 bg-background rounded">
                <span>Vibration anomalies increasing</span>
                <span className="text-status-warning font-semibold">+12% this hour</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-background rounded">
                <span>Temperature readings stable</span>
                <span className="text-status-operational font-semibold">Stable</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-background rounded">
                <span>Humidity variation widening</span>
                <span className="text-status-warning font-semibold">+5% this hour</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
