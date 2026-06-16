import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, PackagePlus, Filter, Truck, Boxes } from 'lucide-react'
import { api } from '../api/client.js'
import { StatusBadge } from '../components/StatusBadge.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { MetricCard } from '../components/MetricCard.jsx'

export function Supply({ ingredients, suppliers, purchaseOrders, refresh, filterLowStock, setFilterLowStock, filterPending, setFilterPending, supplyStats }) {
  const [form, setForm] = useState({
    supplier_id: '',
    ingredient_id: '',
    qty: '',
    unit_price: '',
    expected_arrival: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    remark: '',
  })

  const selectedIngredient = useMemo(
    () => ingredients.find((item) => item.id === form.ingredient_id),
    [ingredients, form.ingredient_id],
  )

  const { filteredIngredients, filteredPurchaseOrders, totalIngredients, lowStockCount, totalPurchaseOrders, pendingCount } = supplyStats

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    await api.createPurchaseOrder({
      supplier_id: form.supplier_id,
      expected_arrival: form.expected_arrival,
      remark: form.remark,
      items: [{
        ingredient_id: form.ingredient_id,
        qty: Number(form.qty),
        unit_price: Number(form.unit_price),
      }],
    })
    setForm((current) => ({ ...current, ingredient_id: '', qty: '', unit_price: '', remark: '' }))
    refresh()
  }

  const receive = async (order) => {
    await api.updatePurchaseStatus(order.id, 'received')
    refresh()
  }

  return (
    <div className="page-grid">
      <section className="metrics supply-metrics">
        <MetricCard
          label="原料总数"
          value={filterLowStock ? filteredIngredients.length : totalIngredients}
          helper={filterLowStock ? `已筛选 · 共 ${totalIngredients} 项` : '全部原料品类数量'}
          badge={filterLowStock ? '低库存筛选中' : null}
          badgeVariant="warning"
        />
        <MetricCard
          label="低库存原料"
          value={filterLowStock ? filteredIngredients.filter((item) => item.stock_qty <= item.safety_stock).length : lowStockCount}
          helper={filterLowStock ? '筛选后低于安全库存' : (lowStockCount > 0 ? '需要及时补货' : '库存状态良好')}
          badge={filterLowStock ? '低库存筛选中' : null}
          badgeVariant="warning"
        />
        <MetricCard
          label="采购单总数"
          value={filterPending ? filteredPurchaseOrders.length : totalPurchaseOrders}
          helper={filterPending ? `已筛选 · 共 ${totalPurchaseOrders} 单` : '全部采购单数量'}
          badge={filterPending ? '待入库筛选中' : null}
          badgeVariant="info"
        />
        <MetricCard
          label="待入库采购"
          value={filterPending ? filteredPurchaseOrders.filter((order) => order.status === 'ordered' || order.status === 'draft').length : pendingCount}
          helper={filterPending ? '筛选后等待入库' : (pendingCount > 0 ? '等待确认入库' : '暂无待处理采购')}
          badge={filterPending ? '待入库筛选中' : null}
          badgeVariant="info"
        />
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>原料库存</h2>
          <button
            type="button"
            className={`filter-toggle ${filterLowStock ? 'active' : ''}`}
            onClick={() => setFilterLowStock((value) => !value)}
          >
            <Filter size={14} />
            {filterLowStock ? '取消低库存筛选' : '只看低库存'}
          </button>
        </div>
        {filterLowStock && (
          <div className={`filter-summary ${filteredIngredients.length > 0 ? 'has-results' : 'no-results'}`}>
            <AlertTriangle size={18} />
            <div className="filter-summary-text">
              <strong>低库存筛选已启用</strong>
              <span>共 {filteredIngredients.length} 项原料低于安全库存</span>
            </div>
          </div>
        )}
        {filteredIngredients.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>原料</th>
                  <th>分类</th>
                  <th>库存</th>
                  <th>安全库存</th>
                  <th>均价</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((item) => (
                  <tr key={item.id} className={item.stock_qty <= item.safety_stock ? 'warning-row' : ''}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category}</td>
                    <td>{item.stock_qty}{item.unit}</td>
                    <td>{item.safety_stock}{item.unit}</td>
                    <td>¥{item.avg_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text={filterLowStock ? '暂无低库存原料，库存状态良好' : '暂无原料数据'} />
        )}
      </section>

      <div className="two-column compact">
        <section className="panel">
          <div className="section-title">
            <h2>采购单</h2>
            <button
              type="button"
              className={`filter-toggle ${filterPending ? 'active' : ''}`}
              onClick={() => setFilterPending((value) => !value)}
            >
              <Filter size={14} />
              {filterPending ? '取消待入库筛选' : '只看待入库'}
            </button>
          </div>
          {filterPending && (
            <div className={`filter-summary ${filteredPurchaseOrders.length > 0 ? 'has-results' : 'no-results'}`}>
              <Truck size={18} />
              <div className="filter-summary-text">
                <strong>待入库筛选已启用</strong>
                <span>共 {filteredPurchaseOrders.length} 单采购等待入库</span>
              </div>
            </div>
          )}
          {filteredPurchaseOrders.length > 0 ? (
            <div className="list">
              {filteredPurchaseOrders.map((order) => (
                <div className="order-row" key={order.id}>
                  <div>
                    <strong>{order.id}</strong>
                    <span>{suppliers.find((item) => item.id === order.supplier_id)?.name} · 到货 {order.expected_arrival}</span>
                    <small>{order.remark || '无备注'}</small>
                  </div>
                  <div className="order-side">
                    <b>¥{order.total_amount}</b>
                    <StatusBadge value={order.status} />
                    {order.status !== 'received' && (
                      <button type="button" onClick={() => receive(order)}>
                        <CheckCircle2 size={15} />
                        入库
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text={filterPending ? '暂无待入库采购单' : '暂无采购单数据'} />
          )}
        </section>

        <section className="panel side-panel">
          <div className="section-title">
            <h2>新建采购</h2>
            <PackagePlus size={18} />
          </div>
          <form className="form" onSubmit={submit}>
            <label>
              供应商
              <select value={form.supplier_id} onChange={(event) => updateField('supplier_id', event.target.value)} required>
                <option value="">选择供应商</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <label>
              原料
              <select value={form.ingredient_id} onChange={(event) => updateField('ingredient_id', event.target.value)} required>
                <option value="">选择原料</option>
                {ingredients.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                数量{selectedIngredient ? `(${selectedIngredient.unit})` : ''}
                <input type="number" min="0" step="0.1" value={form.qty} onChange={(event) => updateField('qty', event.target.value)} required />
              </label>
              <label>
                单价
                <input type="number" min="0" step="0.1" value={form.unit_price} onChange={(event) => updateField('unit_price', event.target.value)} required />
              </label>
            </div>
            <label>
              预计到货
              <input type="date" value={form.expected_arrival} onChange={(event) => updateField('expected_arrival', event.target.value)} required />
            </label>
            <label>
              备注
              <textarea rows="3" value={form.remark} onChange={(event) => updateField('remark', event.target.value)} />
            </label>
            <button className="primary" type="submit">
              <PackagePlus size={16} />
              <span>提交采购</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
