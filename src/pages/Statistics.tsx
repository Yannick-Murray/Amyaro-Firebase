import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  StatisticsService, 
  type ListOwnership,
  type TimeRange
} from '../services/statisticsService';
import type { ListHistory } from '../types/todoList';
import { Card } from '../components/ui';
import { SpendingChart } from '../components/business';

export default function Statistics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ownershipFilter, setOwnershipFilter] = useState<ListOwnership>('all');
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('thisYear');
  const [history, setHistory] = useState<ListHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // History laden wenn User oder Filter sich ändert
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await StatisticsService.fetchHistory(user.uid, ownershipFilter);
        setHistory(data);
      } catch (error) {
        console.error('Fehler beim Laden der History:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, ownershipFilter]);

  // Statistiken berechnen
  const shopStats = StatisticsService.calculateShopStatistics(history);
  const timeline = StatisticsService.createTimeline(history);
  const overallStats = StatisticsService.calculateOverallStatistics(history);

  // Chart-Daten für TimeRange (gefilterte Timeline)
  const filteredHistoryForChart = StatisticsService.filterHistoryByTimeRange(history, timeRange);
  const chartTimeline = StatisticsService.createTimeline(filteredHistoryForChart);
  
  // TimeRange Labels
  const timeRangeLabels: Record<TimeRange, string> = {
    thisMonth: 'Dieser Monat',
    thisYear: 'Dieses Jahr',
    lastYear: 'Letztes Jahr',
    all: 'Alle Daten'
  };

  // Timeline nach Shop filtern
  const filteredTimeline = selectedShop === 'all' 
    ? timeline 
    : StatisticsService.filterTimelineByShop(timeline, selectedShop);

  // Alle verfügbaren Shops für Dropdown
  const availableShops = shopStats.map(stat => stat.shopName);

  // Anzahl Listen pro Kategorie (aus History)
  const ownListsCount = history.filter(h => h.userId === user?.uid).length;
  const sharedListsCount = history.filter(h => 
    h.userId !== user?.uid && 
    h.sharedWith?.includes(user?.uid || '')
  ).length;
  const allListsCount = history.length;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">📊 Statistiken</h1>
          <p className="text-muted mb-0">Übersicht deiner Einkäufe</p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Zurück
        </button>
      </div>

      {/* Filter Section */}
      <Card className="mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Ownership Filter */}
            <div className="col-md-4">
              <label className="form-label fw-medium">Listen-Typ</label>
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="ownership"
                  id="ownership-all"
                  checked={ownershipFilter === 'all'}
                  onChange={() => setOwnershipFilter('all')}
                />
                <label className="btn btn-outline-primary" htmlFor="ownership-all">
                  Alle ({allListsCount})
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="ownership"
                  id="ownership-own"
                  checked={ownershipFilter === 'own'}
                  onChange={() => setOwnershipFilter('own')}
                />
                <label className="btn btn-outline-primary" htmlFor="ownership-own">
                  Eigene ({ownListsCount})
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="ownership"
                  id="ownership-shared"
                  checked={ownershipFilter === 'shared'}
                  onChange={() => setOwnershipFilter('shared')}
                />
                <label className="btn btn-outline-primary" htmlFor="ownership-shared">
                  Geteilte ({sharedListsCount})
                </label>
              </div>
            </div>

            {/* TimeRange Filter */}
            <div className="col-md-4">
              <label htmlFor="time-range-filter" className="form-label fw-medium">
                Zeitraum (Chart)
              </label>
              <select
                id="time-range-filter"
                className="form-select"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              >
                <option value="thisMonth">Dieser Monat</option>
                <option value="thisYear">Dieses Jahr</option>
                <option value="lastYear">Letztes Jahr</option>
                <option value="all">Alle Daten</option>
              </select>
            </div>

            {/* Shop Filter */}
            <div className="col-md-4">
              <label htmlFor="shop-filter" className="form-label fw-medium">
                Shop Filter
              </label>
              <select
                id="shop-filter"
                className="form-select"
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
              >
                <option value="all">Alle Shops</option>
                {availableShops.map(shop => (
                  <option key={shop} value={shop}>
                    {StatisticsService.formatShopName(shop)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Check if there's data */}
      {loading ? (
        <Card>
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Laden...</span>
            </div>
            <p className="text-muted mb-0">Lade Statistiken...</p>
          </div>
        </Card>
      ) : overallStats.totalPurchases === 0 ? (
        <Card>
          <div className="card-body text-center py-5">
            <i className="bi bi-bar-chart display-1 text-muted mb-3"></i>
            <h5 className="text-muted mb-3">Keine Daten verfügbar</h5>
            <p className="text-muted">
              Schließe deine erste Einkaufsliste ab, um Statistiken zu sehen!
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Spending Chart */}
          <div className="mb-4">
            <SpendingChart 
              data={chartTimeline} 
              timeRangeLabel={timeRangeLabels[timeRange]} 
            />
          </div>

          {/* Overall Statistics Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-sm-6">
              <Card>
                <div className="card-body text-center">
                  <div className="text-muted small mb-1">Gesamt ausgegeben</div>
                  <div className="h4 mb-0 fw-bold text-primary">
                    €{StatisticsService.formatPrice(overallStats.totalSpent)}
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-md-3 col-sm-6">
              <Card>
                <div className="card-body text-center">
                  <div className="text-muted small mb-1">Anzahl Einkäufe</div>
                  <div className="h4 mb-0 fw-bold text-success">
                    {overallStats.totalPurchases}
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-md-3 col-sm-6">
              <Card>
                <div className="card-body text-center">
                  <div className="text-muted small mb-1">Ø pro Einkauf</div>
                  <div className="h4 mb-0 fw-bold text-info">
                    €{StatisticsService.formatPrice(overallStats.averagePerPurchase)}
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-md-3 col-sm-6">
              <Card>
                <div className="card-body text-center">
                  <div className="text-muted small mb-1">Verschiedene Shops</div>
                  <div className="h4 mb-0 fw-bold text-warning">
                    {shopStats.length}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Shop Statistics */}
          <Card className="mb-4">
            <div className="card-header">
              <h5 className="mb-0">🏪 Ausgaben pro Shop</h5>
            </div>
            <div className="card-body">
              {shopStats.length === 0 ? (
                <p className="text-muted mb-0 text-center">Keine Shop-Daten verfügbar</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Shop</th>
                        <th className="text-end">Gesamt</th>
                        <th className="text-center">Anzahl</th>
                        <th className="text-end">Durchschnitt</th>
                        <th className="text-end">Letzter Einkauf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopStats.map((stat, index) => (
                        <tr key={stat.shopName}>
                          <td>
                            <span className="badge bg-primary me-2">{index + 1}</span>
                            <strong>{StatisticsService.formatShopName(stat.shopName)}</strong>
                          </td>
                          <td className="text-end fw-bold">
                            €{StatisticsService.formatPrice(stat.totalSpent)}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">{stat.purchaseCount}x</span>
                          </td>
                          <td className="text-end text-muted">
                            €{StatisticsService.formatPrice(stat.averagePrice)}
                          </td>
                          <td className="text-end text-muted small">
                            {stat.lastPurchase 
                              ? StatisticsService.formatDate(stat.lastPurchase)
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📅 Einkaufs-Verlauf</h5>
              <span className="badge bg-secondary">
                {filteredTimeline.length} Einträge
              </span>
            </div>
            <div className="card-body">
              {filteredTimeline.length === 0 ? (
                <p className="text-muted mb-0 text-center">
                  Keine Einkäufe gefunden
                  {selectedShop !== 'all' && ` bei ${StatisticsService.formatShopName(selectedShop)}`}
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredTimeline.slice(0, 20).map((entry) => (
                    <div 
                      key={entry.id} 
                      className="list-group-item list-group-item-action cursor-pointer"
                      onClick={() => navigate(`/list/${entry.listId}`)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <strong>{entry.listName}</strong>
                            <span className="badge bg-light text-dark">
                              {StatisticsService.formatShopName(entry.shop)}
                            </span>
                          </div>
                          <div className="small text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {StatisticsService.formatDate(entry.closedAt)}
                            <span className="mx-2">•</span>
                            <i className="bi bi-cart3 me-1"></i>
                            {entry.itemCount} Items
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary">
                            €{StatisticsService.formatPrice(entry.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTimeline.length > 20 && (
                    <div className="text-center text-muted small py-2">
                      ... und {filteredTimeline.length - 20} weitere
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Extrema Section */}
          {overallStats.mostExpensivePurchase && overallStats.cheapestPurchase && (
            <div className="row g-3 mt-3">
              <div className="col-md-6">
                <Card className="border-danger">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-arrow-up-circle text-danger"></i>
                      <h6 className="mb-0">Teuerster Einkauf</h6>
                    </div>
                    <div className="fw-bold">
                      {overallStats.mostExpensivePurchase.listName}
                    </div>
                    <div className="text-muted small">
                      {StatisticsService.formatShopName(overallStats.mostExpensivePurchase.shop)}
                    </div>
                    <div className="h5 mt-2 mb-0 text-danger">
                      €{StatisticsService.formatPrice(overallStats.mostExpensivePurchase.price)}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="col-md-6">
                <Card className="border-success">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-arrow-down-circle text-success"></i>
                      <h6 className="mb-0">Günstigster Einkauf</h6>
                    </div>
                    <div className="fw-bold">
                      {overallStats.cheapestPurchase.listName}
                    </div>
                    <div className="text-muted small">
                      {StatisticsService.formatShopName(overallStats.cheapestPurchase.shop)}
                    </div>
                    <div className="h5 mt-2 mb-0 text-success">
                      €{StatisticsService.formatPrice(overallStats.cheapestPurchase.price)}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
