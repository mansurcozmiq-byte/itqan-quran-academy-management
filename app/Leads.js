'use client'
import { useState } from 'react'
import { sb } from '../lib/supabase'
import { Icon } from '../lib/icons'

const T = ({ h, rows }) => (
  <div className="table-wrap">
    <table>
      <thead><tr>{h.map((x) => <th key={x}>{x}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
)

export default function Leads({ S, go, load }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const list = (S.leads || []).filter((L) => {
    if (statusFilter && L.status !== statusFilter) return false
    const s = ((L.parent_name || '') + (L.child_name || '') + (L.phone || '') + (L.course || '') + (L.message || '')).toLowerCase()
    return s.includes(q.toLowerCase())
  })
  const setStatus = async (id, status) => {
    await sb.from('leads').update({ status }).eq('id', id)
    await load()
  }
  const del = async (id) => {
    if (!confirm('Delete this inquiry?')) return
    await sb.from('leads').delete().eq('id', id)
    await load()
  }
  const badge = (st) => {
    const m = { New: 'badge-waiting', Contacted: 'badge-active', Admitted: 'badge-graduated', Rejected: 'badge-left' }
    return <span className={`badge ${m[st] || 'badge-active'}`}>{st}</span>
  }
  return (
    <div className="card">
      <div className="toolbar">
        <input placeholder="Search name, phone, course…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {['New', 'Contacted', 'Admitted', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="badge badge-waiting">{list.filter((x) => x.status === 'New').length} new</span>
      </div>
      <T
        h={['Date', 'Parent', 'Child', 'Age', 'Phone', 'Course', 'Message', 'Status', '']}
        rows={list.map((L) => [
          (L.created_at || '').slice(0, 10),
          L.parent_name,
          L.child_name,
          L.age || '—',
          L.phone,
          L.course || '—',
          <span key="m" style={{ maxWidth: 160, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={L.message || ''}>{L.message || '—'}</span>,
          badge(L.status),
          <div key="a" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <select value={L.status} onChange={(e) => setStatus(L.id, e.target.value)} style={{ fontSize: 12, padding: '2px 6px' }}>
              {['New', 'Contacted', 'Admitted', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => go('new')} title="Open admission form">Admit</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => del(L.id)}><Icon.Trash /></button>
          </div>,
        ])}
      />
      {list.length === 0 && <div className="empty"><Icon.Inbox />No website inquiries yet</div>}
    </div>
  )
}
