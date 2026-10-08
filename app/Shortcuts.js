'use client'

export default function Shortcuts({ go, S, isAdmin, tt }) {
  const newLeads = (S.leads || []).filter((l) => l.status === 'New').length
  const dueCount = (S.students || [])
    .filter((s) => s.status === 'Active')
    .length // approximate; due detail on due page

  const items = [
    { id: 'new', label: tt('newAdmission') || 'New Admission', icon: '+', primary: true },
    { id: 'att', label: tt('attendance') || 'Attendance', icon: '✓' },
    { id: 'leads', label: (tt('leads') || 'Leads') + (newLeads ? ` (${newLeads})` : ''), icon: '✉', badge: newLeads },
    { id: 'due', label: tt('dueList') || 'Due List', icon: '!' },
    { id: 'stu', label: tt('students') || 'Students', icon: '☰' },
  ]
  if (isAdmin) {
    items.push({ id: 'pay', label: tt('payments') || 'Payments', icon: '৳' })
    items.push({ id: 'exp', label: tt('expenses') || 'Expenses', icon: '−' })
  }

  return (
    <aside className="shortcuts-panel">
      <div className="shortcuts-card">
        <h3 className="shortcuts-title">Quick Actions</h3>
        <div className="shortcuts-list">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`shortcuts-btn ${it.primary ? 'primary' : ''}`}
              onClick={() => go(it.id)}
            >
              <span className="shortcuts-icon">{it.icon}</span>
              <span className="shortcuts-label">{it.label}</span>
              {it.badge > 0 && <span className="shortcuts-badge">{it.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="shortcuts-card shortcuts-tips">
        <h3 className="shortcuts-title">Today</h3>
        <ul className="shortcuts-meta">
          <li><span>Active students</span><strong>{(S.students || []).filter((s) => s.status === 'Active').length}</strong></li>
          <li><span>New leads</span><strong>{newLeads}</strong></li>
        </ul>
      </div>
    </aside>
  )
}
