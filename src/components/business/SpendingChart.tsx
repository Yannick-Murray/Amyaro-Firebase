import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { TimelineEntry } from '../../services/statisticsService';
import { Card } from '../ui';

interface SpendingChartProps {
  data: TimelineEntry[];
  timeRangeLabel: string;
}

export default function SpendingChart({ data, timeRangeLabel }: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="card-body text-center py-5">
          <i className="bi bi-bar-chart display-1 text-muted mb-3"></i>
          <h5 className="text-muted mb-3">Keine Daten verfügbar</h5>
          <p className="text-muted mb-0">
            Für {timeRangeLabel} gibt es keine Einkäufe
          </p>
        </div>
      </Card>
    );
  }

  // Daten für Chart vorbereiten (chronologisch sortiert, älteste zuerst)
  const chartData = [...data]
    .sort((a, b) => a.closedAt.getTime() - b.closedAt.getTime())
    .map((entry, index) => ({
      index,
      date: entry.closedAt,
      dateLabel: new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short'
      }).format(entry.closedAt),
      price: entry.price,
      listName: entry.listName,
      shop: entry.shop,
      itemCount: entry.itemCount
    }));

  // Custom Tooltip für bessere Darstellung
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card shadow-sm border-0">
          <div className="card-body p-3">
            <p className="mb-2 fw-bold">{data.listName}</p>
            <p className="mb-1">
              <i className="bi bi-calendar3 me-1"></i>
              <span className="small text-muted">{data.dateLabel}</span>
            </p>
            <p className="mb-1 text-primary fw-bold">
              €{data.price.toFixed(2).replace('.', ',')}
            </p>
            <p className="mb-0 text-muted small">
              <i className="bi bi-shop me-1"></i>
              {data.shop}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Berechne Statistiken
  const totalSpent = chartData.reduce((sum, d) => sum + d.price, 0);
  const avgSpent = totalSpent / chartData.length;

  return (
    <Card>
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Ausgaben-Verlauf: {timeRangeLabel}
        </h5>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6c757d"
              tick={{ fontSize: 12 }}
              angle={chartData.length > 10 ? -45 : 0}
              textAnchor={chartData.length > 10 ? "end" : "middle"}
              height={chartData.length > 10 ? 80 : 40}
            />
            <YAxis 
              stroke="#6c757d"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#0d6efd" 
              strokeWidth={3}
              fill="url(#colorPrice)"
              dot={{ fill: '#0d6efd', r: 5 }}
              activeDot={{ r: 7, fill: '#0a58ca' }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Zusammenfassung unter dem Chart */}
        <div className="row mt-4 g-3">
          <div className="col-md-4">
            <div className="text-center">
              <div className="text-muted small">Gesamt</div>
              <div className="h5 mb-0 text-primary">
                €{totalSpent.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="text-center">
              <div className="text-muted small">Durchschnitt/Einkauf</div>
              <div className="h5 mb-0 text-success">
                €{avgSpent.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="text-center">
              <div className="text-muted small">Anzahl Einkäufe</div>
              <div className="h5 mb-0 text-info">
                {chartData.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
