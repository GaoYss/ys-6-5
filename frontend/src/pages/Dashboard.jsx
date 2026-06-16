import { MetricCard } from '../components/MetricCard.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function Dashboard({ summary, ingredients, purchaseOrders, profitReport, loading, supplyStats, filterLowStock, filterPending }) {
  const topMargins = [...profitReport].sort((a, b) => b.gross_margin - a.gross_margin).slice(0, 4)
  const lowStock = supplyStats.filteredIngredients.filter((item) => item.stock_qty <= item.safety_stock)
  const pendingOrders = supplyStats.filteredPurchaseOrders.filter((order) => order.status === 'ordered' || order.status === 'draft')

  if (loading && !summary) {
    return <div className="panel">数据加载中...</div>
  }

  return (
    <div className="page-grid">
      <section className="metrics">
        <MetricCard label="在售菜品" value={summary?.active_dishes ?? 0} helper="当前可售 SKU 基础数" />
        <MetricCard
          label="低库存原料"
          value={supplyStats.lowStockCount}
          helper={filterLowStock ? `已筛选 · 共 ${supplyStats.totalIngredients} 项` : '低于或等于安全库存'}
          badge={filterLowStock ? '低库存筛选中' : null}
          badgeVariant="warning"
        />
        <MetricCard
          label="待处理采购"
          value={supplyStats.pendingCount}
          helper={filterPending ? `已筛选 · 共 ${supplyStats.totalPurchaseOrders} 单` : '草稿与已下单状态'}
          badge={filterPending ? '待入库筛选中' : null}
          badgeVariant="info"
        />
        <MetricCard
          label="平均毛利率"
          value={`${Math.round((summary?.average_margin ?? 0) * 100)}%`}
          helper={`库存估值 ¥${summary?.estimated_inventory_value ?? 0}`}
        />
      </section>

      <section className="panel split-panel">
        <div>
          <div className="section-title">
            <h2>高毛利规格</h2>
          </div>
          <div className="list">
            {topMargins.map((line) => (
              <div className="list-row" key={`${line.dish_id}-${line.spec_name}`}>
                <div>
                  <strong>{line.dish_name}</strong>
                  <span>{line.spec_name} · 成本 ¥{line.cost}</span>
                </div>
                <b>{Math.round(line.gross_margin * 100)}%</b>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">
            <h2>采购提醒</h2>
          </div>
          <div className="list">
            {lowStock.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.stock_qty}{item.unit} / 安全 {item.safety_stock}{item.unit}</span>
                </div>
                <b>补货</b>
              </div>
            ))}
            {pendingOrders.slice(0, 2).map((order) => (
              <div className="list-row" key={order.id}>
                <div>
                  <strong>采购单 {order.id}</strong>
                  <span>预计 {order.expected_arrival} · ¥{order.total_amount}</span>
                </div>
                <StatusBadge value={order.status} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

