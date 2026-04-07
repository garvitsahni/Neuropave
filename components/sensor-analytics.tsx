'use client';

import { useEffect, useState } from 'react';
import { Sensor, SensorReading, generateHistoricalReadings } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SensorAnalyticsProps {
  sensor: Sensor;
}

export function SensorAnalytics({ sensor }: SensorAnalyticsProps) {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await fetch(`/api/sensors/${sensor.id}/readings`);
        const data = await response.json();

        if (data.success) {
          setReadings(data.data.readings);
        }
      } catch (error) {
        console.error('Failed to fetch readings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
  }, [sensor.id]);

  const chartData = readings.map((r) => {
    const timestamp = typeof r.timestamp === 'string' ? new Date(r.timestamp) : r.timestamp;
    return {
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.value,
      timestamp: timestamp.getTime(),
    };
  });

  const stats = {
    min: readings.length > 0 ? Math.min(...readings.map((r) => r.value)) : 0,
    max: readings.length > 0 ? Math.max(...readings.map((r) => r.value)) : 0,
    avg:
      readings.length > 0
        ? Math.round((readings.reduce((sum, r) => sum + r.value, 0) / readings.length) * 100) / 100
        : 0,
    latest: readings.length > 0 ? readings[readings.length - 1].value : 0,
  };

  const getChartColor = () => {
    switch (sensor.type) {
      case 'vibration':
        return '#3b82f6';
      case 'strain':
        return '#10b981';
      case 'temperature':
        return '#f59e0b';
      case 'humidity':
        return '#8b5cf6';
      default:
        return '#6366f1';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div>
            <CardTitle className="text-base">{sensor.name}</CardTitle>
            <CardDescription>{sensor.location}</CardDescription>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Latest</p>
              <p className="font-semibold text-sm">
                {stats.latest} {readings[0]?.unit}
              </p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Min</p>
              <p className="font-semibold text-sm">
                {stats.min} {readings[0]?.unit}
              </p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="font-semibold text-sm">
                {stats.max} {readings[0]?.unit}
              </p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="font-semibold text-sm">
                {stats.avg} {readings[0]?.unit}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading data...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={getChartColor()} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 130, 180, 0.1)" />
              <XAxis
                dataKey="time"
                stroke="currentColor"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis stroke="currentColor" style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid var(--border)`,
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={getChartColor()}
                fillOpacity={1}
                fill={`url(#gradient-${sensor.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
