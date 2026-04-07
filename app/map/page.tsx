'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sensor } from '@/lib/mock-data';
import { SensorMap } from '@/components/sensor-map';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export default function MapPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

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
    const interval = setInterval(fetchSensors, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold">Sensor Network Map</h1>
              <p className="text-sm text-muted-foreground">Real-time location tracking and status monitoring</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-6">
          <SensorMap sensors={sensors} onSensorSelect={setSelectedSensor} />

          {/* Sensor List */}
          {selectedSensor && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Selected Sensor Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="font-semibold">{selectedSensor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="font-semibold">{selectedSensor.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="font-semibold capitalize">{selectedSensor.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-semibold capitalize">{selectedSensor.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Latitude</p>
                  <p className="font-semibold">{selectedSensor.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Longitude</p>
                  <p className="font-semibold">{selectedSensor.longitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="font-semibold">{(() => {
                    const lastUpdate = typeof selectedSensor.lastUpdate === 'string' ? new Date(selectedSensor.lastUpdate) : selectedSensor.lastUpdate;
                    return lastUpdate.toLocaleString();
                  })()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-xs">{selectedSensor.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Network Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Network Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Total Sensors</p>
                <p className="text-2xl font-bold">{sensors.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Operational</p>
                <p className="text-2xl font-bold text-status-operational">
                  {sensors.filter((s) => s.status === 'operational').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Warning</p>
                <p className="text-2xl font-bold text-status-warning">
                  {sensors.filter((s) => s.status === 'warning').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Critical</p>
                <p className="text-2xl font-bold text-status-critical">
                  {sensors.filter((s) => s.status === 'critical').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
