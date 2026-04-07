'use client';

import { useEffect, useState } from 'react';
import { Sensor } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface SensorSummaryProps {
  sensors: Sensor[];
}

export function SensorSummary({ sensors }: SensorSummaryProps) {
  const [summary, setSummary] = useState({
    operational: 0,
    warning: 0,
    critical: 0,
    offline: 0,
  });

  useEffect(() => {
    const counts = sensors.reduce(
      (acc, sensor) => ({
        ...acc,
        [sensor.status]: (acc[sensor.status] || 0) + 1,
      }),
      { operational: 0, warning: 0, critical: 0, offline: 0 }
    );
    setSummary(counts as typeof summary);
  }, [sensors]);

  const statuses = [
    { label: 'Operational', value: summary.operational, color: 'bg-status-operational' },
    { label: 'Warning', value: summary.warning, color: 'bg-status-warning' },
    { label: 'Critical', value: summary.critical, color: 'bg-status-critical' },
    { label: 'Offline', value: summary.offline, color: 'bg-status-offline' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Status</CardTitle>
        <CardDescription>Sensor distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.map((status) => (
            <div key={status.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                <span className="text-sm">{status.label}</span>
              </div>
              <span className="font-semibold text-sm">{status.value}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex items-center justify-between font-semibold">
            <span className="text-sm">Total</span>
            <span>{sensors.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
