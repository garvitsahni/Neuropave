'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Sensor } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SensorMapProps {
  sensors: Sensor[];
  onSensorSelect?: (sensor: Sensor) => void;
}

export function SensorMap({ sensors, onSensorSelect }: SensorMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; sensor: Sensor } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const panOffsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const showHeatmapRef = useRef(false);
  const showConnectionsRef = useRef(true);

  useEffect(() => { selectedRef.current = selectedMarker; }, [selectedMarker]);
  useEffect(() => { hoveredRef.current = hoveredMarker; }, [hoveredMarker]);
  useEffect(() => { showHeatmapRef.current = showHeatmap; }, [showHeatmap]);
  useEffect(() => { showConnectionsRef.current = showConnections; }, [showConnections]);

  const GEO = { minLat: 37.7349, maxLat: 37.8249, minLng: -122.4494, maxLng: -122.3694 };

  const geoToCanvas = useCallback(
    (lat: number, lng: number, w: number, h: number, offset = { x: 0, y: 0 }, zoom = 1): [number, number] => {
      const bx = ((lng - GEO.minLng) / (GEO.maxLng - GEO.minLng)) * w;
      const by = ((GEO.maxLat - lat) / (GEO.maxLat - GEO.minLat)) * h;
      return [(bx - w / 2) * zoom + w / 2 + offset.x, (by - h / 2) * zoom + h / 2 + offset.y];
    },
    []
  );

  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawMap = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width, H = canvas.height;
      const offset = panOffsetRef.current;
      const zoom = zoomRef.current;
      const t = timestamp / 1000;

      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#060d1f');
      bg.addColorStop(1, '#0d1a2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(100,140,200,0.06)';
      ctx.lineWidth = 0.5;
      const gs = 60 * zoom;
      const gox = ((offset.x % gs) + gs) % gs;
      const goy = ((offset.y % gs) + gs) % gs;
      for (let x = gox - gs; x <= W + gs; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = goy - gs; y <= H + gs; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const geo = (lat: number, lng: number) => geoToCanvas(lat, lng, W, H, offset, zoom);

      // SF Bay water body
      ctx.save();
      const bayGrad = ctx.createLinearGradient(...geo(37.82, -122.41), ...geo(37.74, -122.38));
      bayGrad.addColorStop(0, 'rgba(8,25,75,0.65)');
      bayGrad.addColorStop(1, 'rgba(4,16,55,0.45)');
      ctx.fillStyle = bayGrad;
      ctx.strokeStyle = 'rgba(30,70,160,0.3)';
      ctx.lineWidth = 1.5;
      const shore: [number, number][] = [
        [37.820, -122.374], [37.810, -122.373], [37.800, -122.375],
        [37.790, -122.373], [37.780, -122.372], [37.770, -122.375],
        [37.760, -122.373], [37.750, -122.375], [37.740, -122.380],
      ];
      ctx.beginPath();
      shore.forEach(([la, ln], i) => {
        const [x, y] = geo(la, ln);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      const [rx1, ry1] = geo(37.735, -122.370);
      const [rx2, ry2] = geo(37.825, -122.365);
      ctx.lineTo(rx1, ry1); ctx.lineTo(rx2, ry2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      const [blx, bly] = geo(37.778, -122.382);
      ctx.fillStyle = 'rgba(50,90,170,0.45)';
      ctx.font = `italic ${Math.max(9, 11 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('San Francisco Bay', blx, bly);
      ctx.restore();

      // Roads
      const roads: { name: string; color: string; w: number; pts: [number, number][] }[] = [
        {
          name: 'US-101', color: '#e68a00', w: 3,
          pts: [[37.825,-122.425],[37.810,-122.422],[37.795,-122.418],[37.780,-122.419],[37.765,-122.420],[37.748,-122.421]],
        },
        {
          name: 'I-280', color: '#1a7fc4', w: 2.5,
          pts: [[37.825,-122.440],[37.810,-122.433],[37.795,-122.424],[37.780,-122.412],[37.765,-122.400],[37.752,-122.393]],
        },
        {
          name: 'I-680', color: '#1a7fc4', w: 2.5,
          pts: [[37.825,-122.395],[37.810,-122.392],[37.795,-122.388],[37.780,-122.384],[37.768,-122.382]],
        },
        {
          name: 'Bay Bridge', color: '#c8b400', w: 2,
          pts: [[37.799,-122.413],[37.799,-122.405],[37.800,-122.395],[37.800,-122.382],[37.800,-122.372]],
        },
        {
          name: 'Route 1', color: '#2ecc71', w: 2,
          pts: [[37.825,-122.450],[37.810,-122.446],[37.795,-122.440],[37.780,-122.440],[37.765,-122.442],[37.748,-122.445]],
        },
      ];

      roads.forEach(({ color, w, pts }) => {
        ctx.save();
        ctx.strokeStyle = color + '22';
        ctx.lineWidth = (w + 8) * zoom;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach(([la, ln], i) => { const [x, y] = geo(la, ln); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke(); ctx.restore();
      });

      roads.forEach(({ name, color, w, pts }) => {
        ctx.save();
        ctx.strokeStyle = color + 'cc';
        ctx.lineWidth = w * zoom;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach(([la, ln], i) => { const [x, y] = geo(la, ln); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.stroke();
        if (zoom > 0.7) {
          const mid = pts[Math.floor(pts.length / 2)];
          const [lx, ly] = geo(mid[0], mid[1]);
          ctx.fillStyle = color + 'bb';
          ctx.font = `bold ${Math.max(8, 9 * zoom)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(name, lx - 8, ly - 8);
        }
        ctx.restore();
      });

      // Heatmap
      if (showHeatmapRef.current) {
        sensors.forEach((s) => {
          const [x, y] = geo(s.latitude, s.longitude);
          const sev = s.status === 'critical' ? 1 : s.status === 'warning' ? 0.65 : s.status === 'offline' ? 0.3 : 0.1;
          const rgb = s.status === 'critical' ? '255,50,50' : s.status === 'warning' ? '255,165,0' : '80,200,120';
          const r = 65 * zoom;
          const hg = ctx.createRadialGradient(x, y, 0, x, y, r);
          hg.addColorStop(0, `rgba(${rgb},${0.28 * sev})`);
          hg.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        });
      }

      // Connection lines between co-located sensors
      if (showConnectionsRef.current) {
        const groups: Record<string, Sensor[]> = {};
        sensors.forEach((s) => { groups[s.location] = groups[s.location] || []; groups[s.location].push(s); });
        Object.values(groups).forEach((grp) => {
          if (grp.length < 2) return;
          const hasCrit = grp.some((s) => s.status === 'critical');
          const hasWarn = grp.some((s) => s.status === 'warning');
          ctx.save();
          ctx.strokeStyle = hasCrit ? 'rgba(244,67,54,0.22)' : hasWarn ? 'rgba(255,193,7,0.22)' : 'rgba(80,200,120,0.15)';
          ctx.lineWidth = 1 * zoom;
          ctx.setLineDash([4 * zoom, 4 * zoom]);
          for (let i = 0; i < grp.length - 1; i++) {
            for (let j = i + 1; j < grp.length; j++) {
              const [x1, y1] = geo(grp[i].latitude, grp[i].longitude);
              const [x2, y2] = geo(grp[j].latitude, grp[j].longitude);
              ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            }
          }
          ctx.setLineDash([]);
          ctx.restore();
        });
      }

      // Sensor markers
      const statusColors: Record<Sensor['status'], string> = {
        operational: '#50c878', warning: '#ffc107', critical: '#f44336', offline: '#888888',
      };
      const typeIcons: Record<string, string> = { vibration: 'V', strain: 'S', temperature: 'T', humidity: 'H' };

      sensors.forEach((sensor) => {
        const [x, y] = geo(sensor.latitude, sensor.longitude);
        const isSel = selectedRef.current === sensor.id;
        const isHov = hoveredRef.current === sensor.id;
        const col = statusColors[sensor.status];
        const baseR = 7 * zoom;
        const r = isSel ? baseR * 2.2 : isHov ? baseR * 1.6 : baseR;

        // Animated pulse for critical
        if (sensor.status === 'critical') {
          const pulse = Math.sin(t * 3) * 0.5 + 0.5;
          const pr = r + pulse * 12 * zoom;
          const pg = ctx.createRadialGradient(x, y, r, x, y, pr);
          pg.addColorStop(0, `rgba(244,67,54,${0.35 * pulse})`);
          pg.addColorStop(1, 'rgba(244,67,54,0)');
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.fill();
        }
        if (sensor.status === 'warning') {
          const pulse = Math.sin(t * 1.8) * 0.5 + 0.5;
          const pr = r + pulse * 7 * zoom;
          const pg = ctx.createRadialGradient(x, y, r, x, y, pr);
          pg.addColorStop(0, `rgba(255,193,7,${0.25 * pulse})`);
          pg.addColorStop(1, 'rgba(255,193,7,0)');
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.fill();
        }

        // Glow
        const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        gg.addColorStop(0, col + '55'); gg.addColorStop(1, col + '00');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();

        // Main circle
        const mg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        mg.addColorStop(0, col + 'ff'); mg.addColorStop(0.7, col + 'dd'); mg.addColorStop(1, col + 'aa');
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

        // Border
        ctx.strokeStyle = isSel ? '#ffffff' : isHov ? '#dddddd' : col + 'aa';
        ctx.lineWidth = isSel ? 2.5 * zoom : isHov ? 2 * zoom : 1.5 * zoom;
        ctx.stroke();

        // Type icon
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.font = `bold ${Math.max(6, Math.round(r * 0.85))}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(typeIcons[sensor.type] || '?', x, y);
        ctx.restore();

        // Selected dashed ring
        if (isSel) {
          ctx.strokeStyle = '#ffffff60';
          ctx.lineWidth = 1.5 * zoom;
          ctx.setLineDash([4 * zoom, 4 * zoom]);
          ctx.beginPath(); ctx.arc(x, y, r + 7 * zoom, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label on hover/select or zoomed in
        if (isHov || isSel || zoom > 1.4) {
          ctx.save();
          const label = sensor.name.length > 22 ? sensor.name.substring(0, 20) + '…' : sensor.name;
          const fs = Math.max(8, 10 * zoom);
          ctx.font = `${fs}px sans-serif`;
          const tw = ctx.measureText(label).width;
          const lx = x + r + 5, ly = y - fs / 2 - 2;
          ctx.fillStyle = 'rgba(0,0,0,0.78)';
          drawRoundRect(ctx, lx - 3, ly, tw + 8, fs + 6, 3);
          ctx.fill();
          ctx.fillStyle = '#e8e8e8';
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(label, lx + 1, ly + 3);
          ctx.restore();
        }
      });

      // Compass rose
      ctx.save();
      const cx = W - 42, cy = 42, cr = 18;
      ctx.strokeStyle = 'rgba(140,170,220,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e04444';
      ctx.beginPath(); ctx.moveTo(cx, cy - cr + 4); ctx.lineTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#666';
      ctx.beginPath(); ctx.moveTo(cx, cy + cr - 4); ctx.lineTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ddd'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, cy - cr - 8);
      ctx.restore();

      // Scale bar
      ctx.save();
      const scaleW = 80 * zoom, sx = 20, sy = H - 28;
      ctx.strokeStyle = 'rgba(150,180,220,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + scaleW, sy);
      ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 5);
      ctx.moveTo(sx + scaleW, sy - 5); ctx.lineTo(sx + scaleW, sy + 5); ctx.stroke();
      ctx.fillStyle = 'rgba(160,195,230,0.8)'; ctx.font = '10px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`~${(scaleW / zoom * 0.12).toFixed(1)} km`, sx + scaleW / 2, sy + 6);
      ctx.restore();

      // Zoom level
      ctx.save();
      ctx.fillStyle = 'rgba(100,140,200,0.55)'; ctx.font = '10px monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(`×${zoom.toFixed(1)}`, W - 10, H - 10);
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(drawMap);
    },
    [sensors, geoToCanvas]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawMap);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawMap]);

  const hitTest = useCallback(
    (clientX: number, clientY: number): Sensor | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (clientX - rect.left) * scaleX;
      const cy = (clientY - rect.top) * scaleY;
      const W = canvas.width, H = canvas.height;
      const zoom = zoomRef.current;
      const hitR = Math.max(14, 14 * zoom);
      for (const s of sensors) {
        const [sx, sy] = geoToCanvas(s.latitude, s.longitude, W, H, panOffsetRef.current, zoom);
        if (Math.sqrt((cx - sx) ** 2 + (cy - sy) ** 2) < hitR) return s;
      }
      return null;
    },
    [sensors, geoToCanvas]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning.current) {
      panOffsetRef.current = {
        x: panOffsetRef.current.x + (e.clientX - lastPanPos.current.x),
        y: panOffsetRef.current.y + (e.clientY - lastPanPos.current.y),
      };
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const s = hitTest(e.clientX, e.clientY);
    if (s) {
      setHoveredMarker(s.id); hoveredRef.current = s.id;
      const rect = canvasRef.current!.getBoundingClientRect();
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, sensor: s });
      canvasRef.current!.style.cursor = 'pointer';
    } else {
      setHoveredMarker(null); hoveredRef.current = null;
      setTooltip(null);
      canvasRef.current!.style.cursor = 'grab';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hitTest(e.clientX, e.clientY)) {
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      canvasRef.current!.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => { isPanning.current = false; canvasRef.current!.style.cursor = 'grab'; };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = hitTest(e.clientX, e.clientY);
    if (s) { setSelectedMarker(s.id); selectedRef.current = s.id; onSensorSelect?.(s); }
    else { setSelectedMarker(null); selectedRef.current = null; }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const newZoom = Math.min(4, Math.max(0.35, zoomRef.current * (e.deltaY < 0 ? 1.12 : 0.9)));
    zoomRef.current = newZoom; setZoomLevel(newZoom);
  };

  const handleMouseLeave = () => {
    setHoveredMarker(null); hoveredRef.current = null; setTooltip(null); isPanning.current = false;
  };

  const resetView = () => { panOffsetRef.current = { x: 0, y: 0 }; zoomRef.current = 1; setZoomLevel(1); };

  const selectedSensor = sensors.find((s) => s.id === selectedMarker);

  const statusTextColors: Record<string, string> = {
    operational: '#50c878', warning: '#ffc107', critical: '#f44336', offline: '#888888',
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Sensor Locations Map</CardTitle>
          <CardDescription>San Francisco Bay Area Infrastructure Network</CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-all ${showHeatmap ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            🌡 Heatmap
          </button>
          <button
            onClick={() => setShowConnections((v) => !v)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-all ${showConnections ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            🔗 Connections
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:border-primary/50 transition-all"
          >
            ⌖ Reset View
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Canvas */}
          <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden relative bg-[#060d1f]" style={{ cursor: 'grab' }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              className="w-full h-auto block"
            />
            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-10 bg-card/95 border border-border rounded-lg p-3 shadow-2xl text-xs backdrop-blur-sm"
                style={{ left: tooltip.x, top: tooltip.y - 80, transform: 'translateX(-50%)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusTextColors[tooltip.sensor.status] }}
                  />
                  <span className="font-semibold text-foreground whitespace-nowrap">{tooltip.sensor.name}</span>
                </div>
                <p className="text-muted-foreground">{tooltip.sensor.location}</p>
                <p className="font-medium capitalize mt-0.5" style={{ color: statusTextColors[tooltip.sensor.status] }}>
                  {tooltip.sensor.status}
                </p>
              </div>
            )}
            <div className="absolute bottom-2 right-8 text-[10px] text-muted-foreground/40 pointer-events-none select-none">
              Scroll to zoom · Drag to pan
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status Legend */}
            <div className="bg-card/50 border border-border rounded-lg p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-sm mb-3 text-foreground">Status Legend</h3>
              <div className="space-y-2 text-sm">
                {(
                  [
                    { status: 'operational', label: 'Operational', desc: 'Normal operation' },
                    { status: 'warning', label: 'Warning', desc: 'Elevated readings' },
                    { status: 'critical', label: 'Critical', desc: 'Immediate action' },
                    { status: 'offline', label: 'Offline', desc: 'No signal' },
                  ] as const
                ).map(({ status, label, desc }) => (
                  <div key={status} className="flex items-center gap-3 p-1.5 rounded hover:bg-card/60 transition-colors">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${status === 'critical' ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: statusTextColors[status], boxShadow: `0 0 6px ${statusTextColors[status]}88` }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-xs">{label}</span>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">
                      {sensors.filter((s) => s.status === status).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensor Type Legend */}
            <div className="bg-card/50 border border-border rounded-lg p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-sm mb-3 text-foreground">Sensor Types</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'V', label: 'Vibration' },
                  { key: 'S', label: 'Strain' },
                  { key: 'T', label: 'Temperature' },
                  { key: 'H', label: 'Humidity' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted/70 border border-border flex items-center justify-center text-[10px] font-bold text-foreground/80 flex-shrink-0">
                      {key}
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Road Legend */}
            <div className="bg-card/50 border border-border rounded-lg p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-sm mb-3 text-foreground">Road Network</h3>
              <div className="space-y-1.5">
                {[
                  { name: 'US-101', color: '#e68a00' },
                  { name: 'I-280 / I-680', color: '#1a7fc4' },
                  { name: 'Bay Bridge', color: '#c8b400' },
                  { name: 'Route 1', color: '#2ecc71' },
                ].map(({ name, color }) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-8 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Sensor Info */}
            {selectedSensor ? (
              <div className="bg-card/50 border border-primary/30 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedSensor.status === 'critical' ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: statusTextColors[selectedSensor.status] }}
                  />
                  <h3 className="font-semibold text-sm">Sensor Details</h3>
                </div>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: 'Name', value: selectedSensor.name },
                    { label: 'Location', value: selectedSensor.location },
                    { label: 'Type', value: selectedSensor.type, capitalize: true },
                    { label: 'Status', value: selectedSensor.status, capitalize: true, color: statusTextColors[selectedSensor.status] },
                  ].map(({ label, value, capitalize, color }) => (
                    <div key={label} className="border-b border-border/40 pb-2">
                      <p className="text-muted-foreground text-[10px] mb-0.5">{label}</p>
                      <p className={`font-semibold text-xs ${capitalize ? 'capitalize' : ''}`} style={color ? { color } : undefined}>
                        {value}
                      </p>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground pt-1">
                    📍 {selectedSensor.latitude.toFixed(4)}, {selectedSensor.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-card/50 border border-dashed border-border/60 rounded-lg p-5 text-center backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground mb-1">No Sensor Selected</p>
                <p className="text-[11px] text-muted-foreground">Click any marker on the map to view its details</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
