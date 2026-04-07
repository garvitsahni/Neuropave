'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Trash2, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertResolve?: (alertId: string) => void;
  onAlertDismiss?: (alertId: string) => void;
}

export function AlertsPanel({ alerts, onAlertResolve, onAlertDismiss }: AlertsPanelProps) {
  const [displayAlerts, setDisplayAlerts] = useState<Alert[]>(alerts);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    setDisplayAlerts(alerts);
  }, [alerts]);

  const activeAlerts = displayAlerts.filter((a) => !a.resolved);
  const resolvedAlerts = displayAlerts.filter((a) => a.resolved);
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter((a) => a.severity === 'warning');

  const handleResolve = (alertId: string) => {
    setDisplayAlerts(
      displayAlerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    onAlertResolve?.(alertId);
  };

  const handleDismiss = (alertId: string) => {
    setDisplayAlerts(displayAlerts.filter((a) => a.id !== alertId));
    onAlertDismiss?.(alertId);
  };

  const getAlertIcon = (severity: Alert['severity']) => {
    return <AlertCircle className={`w-5 h-5 ${severity === 'critical' ? 'text-status-critical' : 'text-status-warning'}`} />;
  };

  const renderAlertList = (alertList: Alert[]) => {
    if (alertList.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-status-operational mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {activeTab === 'active' ? 'No active alerts' : 'No resolved alerts'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {alertList.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              alert.severity === 'critical'
                ? 'bg-status-critical/10 border-status-critical/30'
                : 'bg-status-warning/10 border-status-warning/30'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{alert.sensorName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    alert.severity === 'critical'
                      ? 'bg-status-critical/20 text-status-critical border-status-critical'
                      : 'bg-status-warning/20 text-status-warning border-status-warning'
                  }
                >
                  {alert.severity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {(() => {
                  const timestamp = typeof alert.timestamp === 'string' ? new Date(alert.timestamp) : alert.timestamp;
                  return timestamp.toLocaleTimeString();
                })()}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!alert.resolved && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(alert.id)}
                  title="Mark as resolved"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(alert.id)}
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Real-time notifications and anomalies</CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalAlerts.length > 0 && (
              <Badge className="bg-status-critical text-white">
                {criticalAlerts.length} Critical
              </Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge className="bg-status-warning text-white">
                {warningAlerts.length} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {renderAlertList(activeAlerts)}
          </TabsContent>

          <TabsContent value="resolved" className="mt-4">
            {renderAlertList(resolvedAlerts)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
