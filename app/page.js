'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { sb } from '../lib/supabase'
import { dm, ym, dueMonths } from '../lib/util'
import { formHTML, receiptHTML } from '../lib/print'

/* ─── SVG Icons (Lucide-style, inline) ─── */
const Icon = {
  LayoutDashboard: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
  ClipboardCheck: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>,
  Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>,
  AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  Receipt: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>,
  BookOpen: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>,
  GraduationCap: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.837l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>,
  Download: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Printer: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>,
  Pencil: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  BookMarked: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>,
  Inbox: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
}

/* ─── Nav ─── */
const NAV = [
  { section: 'Main' },
  { id: 'dash', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'stu', label: 'Students', icon: 'Users' },
  { id: 'new', label: 'New Admission', icon: 'UserPlus' },
  { id: 'att', label: 'Attendance', icon: 'ClipboardCheck' },
  { section: 'Finance' },
  { id: 'pay', label: 'Payments', icon: 'Wallet' },
  { id: 'due', label: 'Due List', icon: 'AlertTriangle' },
  { id: 'exp', label: 'Expenses', icon: 'Receipt' },
  { section: 'Settings' },
  { id: 'fee', label: 'Fees & Courses', icon: 'BookOpen' },
  { id: 'tch', label: 'Teachers', icon: 'GraduationCap' },
]

const sum = (ps) => ps.reduce((a, p) => a + +p.amount, 0)
const statusBadge = (s) => {
  const m = { Active: 'badge-active', Left: 'badge-left', Graduated: 'badge-graduated', Waiting: 'badge-waiting' }
  return <span className={`badge ${m[s] || 'badge-active'}`}>{s}</span>
}
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const T = ({ h, rows }) => (
  <div className="table-wrap">
    <table>
      <thead><tr>{h.map((x) => <th key={x}>{x}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
)

const Ch = ({ t, data }) => (
  <div className="card">
    <h3>{t}</h3>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="n" fontSize={11} tick={{ fill: '#8a9a8c' }} axisLine={false} tickLine={false} />
        <YAxis fontSize={11} allowDecimals={false} tick={{ fill: '#8a9a8c' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e4ebe5', boxShadow: 'none' }} />
        <Bar dataKey="v" fill="#0b6b2f" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState()
  const [ready, setReady] = useState(false)
  const [v, setV] = useState('dash')
  const [arg, setArg] = useState()
  const [pr, setPr] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [S, setS] = useState({ courses: [], students: [], pays: [], teachers: [], expenses: [], attendance: [], set: {} })

  const load = async () => {
    const [c, s, p, t, te, ex, at] = await Promise.all([
      sb.from('courses').select('*').order('name'),
      sb.from('students').select('*').order('created_at', { ascending: false }),
      sb.from('payments').select('*').order('paid_on', { ascending: false }),
      sb.from('settings').select('*'),
      sb.from('teachers').select('*').order('name'),
      sb.from('expenses').select('*').order('expense_date', { ascending: false }),
      sb.from('attendance').select('*').gte('date', ym() + '-01').order('date', { ascending: false }),
    ])
    setS({
      courses: c.data || [], students: s.data || [], pays: p.data || [],
      teachers: te.data || [], expenses: ex.data || [], attendance: at.data || [],
      set: Object.fromEntries((t.data || []).map((r) => [r.k, +r.v])),
    })
  }

  const go = async (x, a) => { await load(); setV(x); setArg(a); setMobileOpen(false) }

  useEffect(() => { sb.auth.getSession().then(({ data }) => { setUser(data.session?.user?.email); setReady(true) }) }, [])
  useEffect(() => { if (user) load() }, [user])
  useEffect(() => { if (pr) { const t = setTimeout(() => { window.print(); setPr('') }, 50); return () => clearTimeout(t) } }, [pr])

  const backup = async () => {
    const o = {}
    for (const t of ['students', 'payments', 'courses', 'settings', 'fee_history', 'teachers', 'attendance', 'expenses', 'documents']) {
      o[t] = (await sb.from(t).select('*')).data
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' }))
    a.download = 'backup-' + ym() + '.json'
    a.click()
  }

  const pageTitle = {
    dash: 'Dashboard', stu: 'Students', new: 'New Admission', prof: 'Student Profile',
    pay: 'Payments', fee: 'Fees & Courses', att: 'Attendance', due: 'Due List',
    exp: 'Expenses', tch: 'Teachers',
  }

  if (!ready) return null
  if (!user) return <Login onDone={setUser} />

  const P = { S, go, print: setPr, user, load }

  return (
    <>
      <div className="app-shell">
        {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}

        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div className="logo-mark"><Icon.BookMarked /></div>
            <div className="brand-text">
              <h1>Itqan Quran Academy</h1>
              <span>Management</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map((item, i) =>
              item.section ? (
                <div key={i} className="nav-section">{item.section}</div>
              ) : (
                <button key={item.id} className={`nav-item ${v === item.id ? 'active' : ''}`} onClick={() => go(item.id)}>
                  <span className="nav-icon">{Icon[item.icon] && Icon[item.icon]()}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              )
            )}
          </nav>
          <div className="sidebar-footer">
            <button className="nav-item" onClick={backup}>
              <span className="nav-icon"><Icon.Download /></span>
              <span className="nav-label">Backup</span>
            </button>
            <button className="nav-item" onClick={() => sb.auth.signOut().then(() => setUser(null))}>
              <span className="nav-icon"><Icon.LogOut /></span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <div className="topbar-left">
              <button className="toggle-btn" onClick={() => {
                if (window.innerWidth <= 768) setMobileOpen(!mobileOpen)
                else setCollapsed(!collapsed)
              }}><Icon.Menu /></button>
              <h2>{pageTitle[v] || 'Dashboard'}</h2>
            </div>
            <span className="user-badge">{user}</span>
          </header>

          <div className="content">
            {v === 'dash' && <Dash {...P} />}
            {v === 'stu' && <Stu {...P} />}
            {v === 'prof' && <Prof id={arg} {...P} />}
            {v === 'new' && <Form key={arg || 'new'} id={arg} {...P} />}
            {v === 'pay' && <Pay {...P} />}
            {v === 'fee' && <Fee {...P} />}
            {v === 'att' && <Attendance {...P} />}
            {v === 'due' && <DueList {...P} />}
            {v === 'exp' && <Expenses {...P} />}
            {v === 'tch' && <Teachers {...P} />}
          </div>
        </div>
      </div>
      <div id="pr" dangerouslySetInnerHTML={{ __html: pr }} />
    </>
  )
}

/* ─── LOGIN ─── */
function Login({ onDone }) {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('')
  const login = async () => {
    setErr('')
    const r = await sb.auth.signInWithPassword({ email: e, password: p })
    if (r.error) setErr(r.error.message)
    else onDone(r.data.user.email)
  }
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo"><div className="logo-mark"><Icon.BookMarked /></div></div>
        <h2>Itqan Quran Academy</h2>
        <p className="sub">Management System</p>
        <div className="field"><label>Email</label><input value={e} onChange={(x) => setE(x.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && login()} /></div>
        <div className="field"><label>Password</label><input type="password" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && login()} /></div>
        {err && <p className="login-error">{err}</p>}
        <button className="btn btn-primary" onClick={login}>Sign in</button>
      </div>
    </div>
  )
}

/* ─── DASHBOARD ─── */
function Dash({ S, go }) {
  const act = S.students.filter((s) => s.status === 'Active')
  const thisMonth = ym()
  const newThisMonth = S.students.filter((s) => (s.adm_date || '').slice(0, 7) === thisMonth).length
  const d = act.map((s) => ({ s, m: dueMonths(s, S.pays) })).filter((x) => x.m.length)
  const tot = d.reduce((a, x) => a + x.m.length * x.s.mon_fee, 0)
  const colThisMonth = sum(S.pays.filter((p) => (p.paid_on || '').slice(0, 7) === thisMonth))
  const today = new Date().toISOString().slice(0, 10)
  const todayAtt = S.attendance.filter((a) => a.date === today)
  const presentToday = todayAtt.filter((a) => a.status === 'Present').length
  const absentToday = todayAtt.filter((a) => a.status === 'Absent').length
  const n = new Date()
  const months = [...Array(6)].map((_, i) => ym(new Date(n.getFullYear(), n.getMonth() - 5 + i, 1)))
  const col = months.map((k) => ({ n: k, v: sum(S.pays.filter((p) => (p.paid_on || '').slice(0, 7) === k)) }))
  const cc = S.courses.map((c) => ({ n: c.name, v: act.filter((s) => (s.courses || []).includes(c.name)).length }))

  return (
    <>
      <div className="stats">
        <div className="stat-card"><label>Active Students</label><div className="n">{act.length}</div></div>
        <div className="stat-card secondary"><label>New This Month</label><div className="n">{newThisMonth}</div></div>
        <div className="stat-card"><label>Collected This Month</label><div className="n">{colThisMonth}</div></div>
        <div className="stat-card danger"><label>Total Due</label><div className="n">{tot}</div></div>
        <div className="stat-card"><label>Present Today</label><div className="n">{presentToday}</div></div>
        <div className="stat-card warning"><label>Absent Today</label><div className="n">{absentToday}</div></div>
        <div className="stat-card danger"><label>Students with Dues</label><div className="n">{d.length}</div></div>
      </div>
      <div className="charts-row">
        <Ch t="Collection (Last 6 Months)" data={col} />
        <Ch t="Students per Course" data={cc} />
      </div>
      <div className="card">
        <div className="card-title-row">
          <h3>Due List <span className="sub">({d.length})</span></h3>
          {d.length > 5 && <button className="btn btn-sm btn-ghost" onClick={() => go('due')}>View all</button>}
        </div>
        {d.length === 0 ? (
          <div className="empty"><Icon.Check />All fees cleared</div>
        ) : (
          <T h={['Student', 'ID', 'Months', 'Amount', '']}
            rows={d.slice(0, 8).map((x) => [
              x.s.name, x.s.adm_no, x.m.length, x.m.length * x.s.mon_fee,
              <button className="btn btn-sm btn-outline" onClick={() => go('prof', x.s.id)}>Open</button>,
            ])} />
        )}
      </div>
    </>
  )
}

/* ─── STUDENTS ─── */
function Stu({ S, go }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [batchFilter, setBatchFilter] = useState('')

  const filtered = S.students.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false
    if (batchFilter && s.batch !== batchFilter) return false
    const search = (s.name + (s.adm_no || '') + (s.mobile || '') + (s.whatsapp || '') + (s.father || '') + (s.class || '') + (s.batch || '')).toLowerCase()
    return search.includes(q.toLowerCase())
  })

  return (
    <div className="card">
      <div className="toolbar">
        <input placeholder="Search name, ID, phone, class, batch..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          {['Active', 'Left', 'Graduated', 'Waiting'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">All batch</option>
          {['Morning', 'Noon', 'Afternoon', 'Evening'].map((b) => <option key={b}>{b}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => go('new')}><Icon.Plus /> New</button>
      </div>
      <T h={['', 'ID', 'Name', 'Courses', 'Batch', 'Mobile', 'Due', 'Status', '']}
        rows={filtered.map((s) => [
          s.photo_url
            ? <img src={s.photo_url} className="avatar" alt="" style={{ width: 32, height: 32 }} />
            : <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(s.name)}</div>,
          s.adm_no, s.name, (s.courses || []).join(', ') || '—', s.batch || '—', s.mobile || '—',
          s.status === 'Active' ? dueMonths(s, S.pays).length : '—',
          statusBadge(s.status),
          <button className="btn btn-sm btn-outline" onClick={() => go('prof', s.id)}>Open</button>,
        ])} />
      {filtered.length === 0 && <div className="empty"><Icon.Search />No students found</div>}
    </div>
  )
}

/* ─── PROFILE ─── */
function Prof({ S, id, go, print }) {
  const s = S.students.find((x) => x.id === id)
  if (!s) return <div className="card">Student not found</div>
  const ps = S.pays.filter((p) => p.student_id === id)
  const d = dueMonths(s, S.pays)
  const teacher = S.teachers.find((t) => t.id === s.teacher_id)
  const setStatus = async (status) => { await sb.from('students').update({ status }).eq('id', id); go('prof', id) }

  const info = [
    ['Father', s.father], ['Mother', s.mother],
    ['Guardian', (s.guardian || '') + (s.relation ? ` (${s.relation})` : '')],
    ['Mobile', s.mobile], ['WhatsApp', s.whatsapp],
    ['Address', s.address], ['School / Class', [s.school, s.class].filter(Boolean).join(' · ')],
    ['Courses', (s.courses || []).join(', ')], ['Batch', s.batch],
    ['Class time', s.class_time], ['Mode', s.mode],
    ['Online link', s.online_link], ['Teacher', teacher?.name],
    ['Monthly fee', `${s.mon_fee} (${s.mon_disc}% scholarship)`],
    ['Admission fee', `${s.adm_fee} (${s.adm_disc}% scholarship)`],
  ]

  return (
    <>
      <div className="card">
        <div className="profile-header">
          {s.photo_url
            ? <img src={s.photo_url} className="avatar avatar-lg" alt="" />
            : <div className="avatar avatar-lg">{initials(s.name)}</div>}
          <div className="info">
            <h3>{s.name} {statusBadge(s.status)}</h3>
            <p className="meta">{s.adm_no} · Admitted {dm(s.adm_date)}</p>
          </div>
        </div>
        <div className="g">
          {info.filter(([, b]) => b).map(([a, b]) => (
            <div key={a}><label>{a}</label><div>{b}</div></div>
          ))}
        </div>
        {(s.current_para || s.current_surah || s.sobok || s.sabqi || s.manzil) && (
          <div className="progress-box">
            <div className="title">Quran Progress</div>
            <div className="g">
              {s.current_para && <div><label>Para</label><div>{s.current_para}</div></div>}
              {s.current_surah && <div><label>Surah</label><div>{s.current_surah}</div></div>}
              {s.sobok && <div><label>Sobok</label><div>{s.sobok}</div></div>}
              {s.sabqi && <div><label>Sabqi</label><div>{s.sabqi}</div></div>}
              {s.manzil && <div><label>Manzil</label><div>{s.manzil}</div></div>}
            </div>
            {s.progress_notes && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{s.progress_notes}</p>}
          </div>
        )}
        <div className="actions">
          <button className="btn btn-primary" onClick={() => print(formHTML(s))}><Icon.Printer /> Print Form</button>
          <button className="btn btn-outline" onClick={() => go('new', id)}><Icon.Pencil /> Edit</button>
          {s.status === 'Active' && <button className="btn btn-danger btn-sm" onClick={() => setStatus('Left')}>Mark Left</button>}
          {s.status === 'Left' && <button className="btn btn-outline btn-sm" onClick={() => setStatus('Active')}>Mark Active</button>}
          {s.status === 'Active' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus('Graduated')}>Graduated</button>}
          {s.status !== 'Waiting' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus('Waiting')}>Waiting</button>}
        </div>
      </div>
      <div className="card">
        <h3>Unpaid Months <span className="sub">({d.length})</span></h3>
        {d.length ? d.join(', ') : 'None'}
      </div>
      <div className="card">
        <h3>Payments</h3>
        <T h={['Receipt', 'Date', 'For', 'Amount', '']}
          rows={ps.map((p) => [
            p.rcpt_no, dm(p.paid_on), p.kind + ' ' + (p.month || ''), p.amount,
            <button className="btn btn-sm btn-outline" onClick={() => print(receiptHTML(p, s))}><Icon.Printer /></button>,
          ])} />
        {ps.length === 0 && <div className="empty"><Icon.Inbox />No payments yet</div>}
      </div>
    </>
  )
}

/* ─── ADMISSION FORM ─── */
function Form({ S, id, go }) {
  const s = S.students.find((x) => x.id === id) || {}
  const [f, setF] = useState({
    name: '', father: '', mother: '', dob: '', age: '', school: '', class: '',
    guardian: '', relation: '', mobile: '', whatsapp: '', address: '',
    batch: '', class_time: '', mode: 'offline', online_link: '',
    teacher_id: '', fee_words: '', adm_disc: 0, mon_disc: 0, mon_fee: 0,
    current_para: '', current_surah: '', sobok: '', sabqi: '', manzil: '', progress_notes: '',
    courses: [], paid: false, status: 'Active',
    ...s, adm_fee: id ? s.adm_fee : S.set.admission_fee || 0,
  })

  const base = (cs) => S.courses.filter((x) => cs.includes(x.name)).reduce((a, x) => a + +x.monthly_fee, 0)
  const upd = (k, val, rc) => setF((p) => {
    const n = { ...p, [k]: val }
    if (k === 'dob') { const a = Math.floor((Date.now() - new Date(val)) / 31557600000); n.age = a >= 0 ? String(a) : '' }
    if (rc) {
      n.mon_fee = Math.round(base(n.courses) * (1 - (+n.mon_disc || 0) / 100))
      n.adm_fee = Math.round((S.set.admission_fee || 0) * (1 - (+n.adm_disc || 0) / 100))
    }
    return n
  })
  const I = (k, l, t = 'text', rc) => (
    <div key={k}><label>{l}</label><input type={t} value={f[k] ?? ''} onChange={(e) => upd(k, e.target.value, rc)} /></div>
  )

  const save = async () => {
    if (!f.name) return alert('Student name is required')
    const o = {}
    ;['name', 'father', 'mother', 'school', 'class', 'guardian', 'relation', 'mobile', 'whatsapp',
      'address', 'batch', 'class_time', 'mode', 'online_link', 'fee_words', 'age',
      'current_para', 'current_surah', 'sobok', 'sabqi', 'manzil', 'progress_notes', 'status'
    ].forEach((k) => o[k] = f[k] || null)
    o.dob = f.dob || null; o.teacher_id = f.teacher_id || null
    ;['adm_disc', 'mon_disc', 'adm_fee', 'mon_fee'].forEach((k) => o[k] = +f[k] || 0)
    o.courses = f.courses
    const r = id
      ? await sb.from('students').update(o).eq('id', id).select().single()
      : await sb.from('students').insert(o).select().single()
    if (r.error) return alert(r.error.message)
    if (!id && f.paid && o.adm_fee > 0) await sb.from('payments').insert({ student_id: r.data.id, kind: 'admission', amount: o.adm_fee })
    go('prof', r.data.id)
  }

  return (
    <div className="card">
      <h3>{id ? 'Edit Admission' : 'New Admission'}</h3>
      <div className="section-label">Personal Info</div>
      <div className="g">
        {I('name', 'Student name *')}{I('father', 'Father')}{I('mother', 'Mother')}
        {I('dob', 'Date of birth', 'date')}{I('age', 'Age')}
        {I('school', 'School')}{I('class', 'Class')}
      </div>
      <div className="section-label">Guardian</div>
      <div className="g">
        {I('guardian', 'Guardian name')}{I('relation', 'Relation')}
        {I('mobile', 'Mobile')}{I('whatsapp', 'WhatsApp')}{I('address', 'Address')}
      </div>
      <div className="section-label">Courses</div>
      <div className="g">
        {S.courses.filter((c) => c.active !== false).map((c) => (
          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 'auto' }}
              checked={(f.courses || []).includes(c.name)}
              onChange={(e) => upd('courses', e.target.checked ? [...(f.courses || []), c.name] : (f.courses || []).filter((x) => x !== c.name), true)} />
            {c.name} ({c.monthly_fee})
          </label>
        ))}
      </div>
      <div className="section-label">Class & Batch</div>
      <div className="g">
        <div><label>Batch</label>
          <select value={f.batch || ''} onChange={(e) => upd('batch', e.target.value)}>
            {['', 'Morning', 'Noon', 'Afternoon', 'Evening'].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        {I('class_time', 'Class time')}
        <div><label>Mode</label>
          <select value={f.mode || 'offline'} onChange={(e) => upd('mode', e.target.value)}>
            <option value="offline">Offline</option><option value="online">Online</option><option value="hybrid">Hybrid</option>
          </select>
        </div>
        {I('online_link', 'Zoom / Meet link')}
        <div><label>Teacher</label>
          <select value={f.teacher_id || ''} onChange={(e) => upd('teacher_id', e.target.value)}>
            <option value="">— Select —</option>
            {S.teachers.filter((t) => t.active !== false).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div><label>Status</label>
          <select value={f.status || 'Active'} onChange={(e) => upd('status', e.target.value)}>
            {['Active', 'Waiting', 'Left', 'Graduated'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="section-label">Quran Progress</div>
      <div className="g">
        {I('current_para', 'Current Para')}{I('current_surah', 'Current Surah')}
        {I('sobok', 'Sobok')}{I('sabqi', 'Sabqi')}{I('manzil', 'Manzil')}
        <div><label>Progress notes</label><textarea value={f.progress_notes || ''} onChange={(e) => upd('progress_notes', e.target.value)} /></div>
      </div>
      <div className="section-label">Fees</div>
      <div className="g">
        {I('adm_disc', 'Admission scholarship %', 'number', true)}
        {I('mon_disc', 'Monthly scholarship %', 'number', true)}
        {I('adm_fee', 'Admission fee (final)', 'number')}
        {I('mon_fee', 'Monthly fee (final)', 'number')}
        {I('fee_words', 'Fee in words')}
      </div>
      {!id && (
        <p style={{ margin: '14px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={f.paid} onChange={(e) => upd('paid', e.target.checked)} />
            Admission fee received now
          </label>
        </p>
      )}
      <button className="btn btn-primary" onClick={save} style={{ marginTop: 8 }}>Save</button>
    </div>
  )
}

/* ─── PAYMENTS ─── */
function Pay({ S, go, print }) {
  const [p, setP] = useState({ sid: '', k: 'monthly', m: ym(), a: '', n: '' })
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))
  const save = async () => {
    if (!p.sid || !+p.a) return alert('Select student and amount')
    const r = await sb.from('payments').insert({
      student_id: p.sid, kind: p.k, month: p.k === 'monthly' ? p.m : null, amount: +p.a, note: p.n || null,
    }).select().single()
    if (r.error) return alert(r.error.message)
    print(receiptHTML(r.data, S.students.find((x) => x.id === p.sid)))
    go('pay')
  }
  return (
    <>
      <div className="card">
        <h3>New Payment</h3>
        <div className="g">
          <div><label>Student</label>
            <select value={p.sid} onChange={(e) => { set('sid', e.target.value); set('a', (S.students.find((x) => x.id === e.target.value) || {}).mon_fee || '') }}>
              <option value="">— Select —</option>
              {S.students.filter((s) => s.status === 'Active').map((s) => <option key={s.id} value={s.id}>{s.name} ({s.adm_no})</option>)}
            </select>
          </div>
          <div><label>Type</label>
            <select value={p.k} onChange={(e) => set('k', e.target.value)}>
              <option value="monthly">Monthly</option><option value="admission">Admission</option>
              <option value="book">Book</option><option value="exam">Exam</option><option value="other">Other</option>
            </select>
          </div>
          <div><label>Month</label><input type="month" value={p.m} onChange={(e) => set('m', e.target.value)} /></div>
          <div><label>Amount</label><input type="number" value={p.a} onChange={(e) => set('a', e.target.value)} /></div>
          <div><label>Note</label><input value={p.n} onChange={(e) => set('n', e.target.value)} /></div>
          <button className="btn btn-primary" onClick={save}><Icon.Printer /> Save & Print</button>
        </div>
      </div>
      <div className="card">
        <h3>Recent Payments</h3>
        <T h={['Receipt', 'Student', 'For', 'Amount', '']}
          rows={S.pays.slice(0, 40).map((x) => {
            const s = S.students.find((y) => y.id === x.student_id)
            return [x.rcpt_no, s?.name, x.kind + ' ' + (x.month || ''), x.amount,
              <button className="btn btn-sm btn-outline" onClick={() => print(receiptHTML(x, s))}><Icon.Printer /></button>]
          })} />
      </div>
    </>
  )
}

/* ─── DUE LIST ─── */
function DueList({ S, go }) {
  const act = S.students.filter((s) => s.status === 'Active')
  const d = act.map((s) => ({ s, m: dueMonths(s, S.pays) })).filter((x) => x.m.length).sort((a, b) => b.m.length - a.m.length)
  const tot = d.reduce((a, x) => a + x.m.length * x.s.mon_fee, 0)
  return (
    <div className="card">
      <h3>Due List <span className="sub">Total: {tot} · {d.length} students</span></h3>
      {d.length === 0 ? <div className="empty"><Icon.Check />All fees cleared</div> : (
        <T h={['Student', 'ID', 'Mobile', 'Months Due', 'Amount', '']}
          rows={d.map((x) => [
            x.s.name, x.s.adm_no, x.s.mobile || '—',
            x.m.length + ' (' + x.m.slice(-3).join(', ') + (x.m.length > 3 ? '...' : '') + ')',
            x.m.length * x.s.mon_fee,
            <button className="btn btn-sm btn-outline" onClick={() => go('prof', x.s.id)}>Open</button>,
          ])} />
      )}
    </div>
  )
}

/* ─── ATTENDANCE ─── */
function Attendance({ S, go, user }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [batch, setBatch] = useState('')
  const [marks, setMarks] = useState({})
  const students = S.students.filter((s) => s.status === 'Active' && (!batch || s.batch === batch))

  useEffect(() => {
    const existing = {}
    S.attendance.filter((a) => a.date === date).forEach((a) => { existing[a.student_id] = a.status })
    setMarks(existing)
  }, [date, S.attendance])

  const mark = (sid, status) => setMarks((m) => ({ ...m, [sid]: status }))
  const markAll = (status) => { const m = {}; students.forEach((s) => { m[s.id] = status }); setMarks(m) }

  const save = async () => {
    const rows = Object.entries(marks).map(([student_id, status]) => ({ student_id, date, status, marked_by: user }))
    if (!rows.length) return alert('No marks to save')
    for (const r of rows) {
      const existing = S.attendance.find((a) => a.student_id === r.student_id && a.date === r.date)
      if (existing) await sb.from('attendance').update({ status: r.status, marked_by: user }).eq('id', existing.id)
      else await sb.from('attendance').insert(r)
    }
    alert('Attendance saved')
    go('att')
  }

  const monthStart = date.slice(0, 7) + '-01'
  const attPct = (sid) => {
    const all = S.attendance.filter((a) => a.student_id === sid && a.date >= monthStart && a.date <= date)
    if (!all.length) return '—'
    return Math.round((all.filter((a) => a.status === 'Present').length / all.length) * 100) + '%'
  }

  const chronicIds = new Set()
  students.forEach((s) => {
    const recent = S.attendance.filter((a) => a.student_id === s.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
    if (recent.length >= 3 && recent.slice(0, 3).every((a) => a.status === 'Absent')) chronicIds.add(s.id)
  })

  return (
    <div className="card">
      <div className="toolbar">
        <div><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 160 }} /></div>
        <div><label>Batch</label>
          <select value={batch} onChange={(e) => setBatch(e.target.value)} style={{ maxWidth: 140 }}>
            <option value="">All</option>
            {['Morning', 'Noon', 'Afternoon', 'Evening'].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => markAll('Present')}>All Present</button>
        <button className="btn btn-sm btn-ghost" onClick={() => markAll('Absent')}>All Absent</button>
        <button className="btn btn-primary" onClick={save}>Save</button>
      </div>
      {chronicIds.size > 0 && (
        <div className="alert alert-warning">
          <Icon.AlertTriangle /> {chronicIds.size} student(s) absent 3+ consecutive days — contact guardian
        </div>
      )}
      <T h={['Student', 'ID', 'Batch', 'This month', 'Status', '']}
        rows={students.map((s) => [
          <span style={chronicIds.has(s.id) ? { color: 'var(--danger)', fontWeight: 600 } : {}}>{s.name}</span>,
          s.adm_no, s.batch || '—', attPct(s.id),
          marks[s.id] ? <span className={`badge badge-${marks[s.id].toLowerCase()}`}>{marks[s.id]}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>,
          <div style={{ display: 'flex', gap: 4 }}>
            {['Present', 'Absent', 'Leave'].map((st) => (
              <button key={st} className={`btn btn-sm ${marks[s.id] === st ? 'btn-primary' : 'btn-ghost'}`} onClick={() => mark(s.id, st)}>{st[0]}</button>
            ))}
          </div>,
        ])} />
      {students.length === 0 && <div className="empty">No active students</div>}
    </div>
  )
}

/* ─── FEES ─── */
function Fee({ S, go, user }) {
  const [h, setH] = useState([])
  const [a, setA] = useState(S.set.admission_fee || 0)
  const [cf, setCf] = useState({})
  const [nc, setNc] = useState(''), [nf, setNf] = useState('')
  useEffect(() => { sb.from('fee_history').select('*').order('changed_at', { ascending: false }).limit(30).then((r) => setH(r.data || [])) }, [S])
  const log = (item, o, n) => sb.from('fee_history').insert({ item, old_fee: o, new_fee: n, changed_by: user })
  const setAdm = async () => { const o = S.set.admission_fee || 0; if (+a === o) return; await sb.from('settings').upsert({ k: 'admission_fee', v: +a }); await log('Admission fee', o, +a); go('fee') }
  const setFee = async (c) => { const n = +(cf[c.id] ?? c.monthly_fee); if (n === c.monthly_fee) return; await sb.from('courses').update({ monthly_fee: n }).eq('id', c.id); await log(c.name + ' (monthly)', c.monthly_fee, n); go('fee') }
  const add = async () => { if (!nc.trim()) return; await sb.from('courses').insert({ name: nc.trim(), monthly_fee: +nf || 0 }); setNc(''); setNf(''); go('fee') }

  return (
    <>
      <div className="card">
        <h3>Fees</h3>
        <div className="g" style={{ maxWidth: 360 }}>
          <div><label>Admission fee</label><input type="number" value={a} onChange={(e) => setA(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={setAdm}>Save</button>
        </div>
        <br />
        <T h={['Course', 'Monthly fee', '']}
          rows={S.courses.map((c) => [
            c.name,
            <input type="number" defaultValue={c.monthly_fee} onChange={(e) => setCf({ ...cf, [c.id]: e.target.value })} style={{ maxWidth: 120 }} />,
            <button className="btn btn-sm btn-outline" onClick={() => setFee(c)}>Save</button>,
          ])} />
        <br />
        <div className="g" style={{ maxWidth: 480 }}>
          <input placeholder="New course name" value={nc} onChange={(e) => setNc(e.target.value)} />
          <input type="number" placeholder="Monthly fee" value={nf} onChange={(e) => setNf(e.target.value)} />
          <button className="btn btn-primary" onClick={add}><Icon.Plus /> Add Course</button>
        </div>
      </div>
      <div className="card">
        <h3>Fee History</h3>
        <T h={['Date', 'Item', 'Old', 'New', 'By']} rows={h.map((r) => [r.changed_at?.slice(0, 10), r.item, r.old_fee, r.new_fee, r.changed_by])} />
      </div>
    </>
  )
}

/* ─── TEACHERS ─── */
function Teachers({ S, go }) {
  const [f, setF] = useState({ name: '', mobile: '', whatsapp: '', specialization: '', batch: '', salary: '' })
  const [editId, setEditId] = useState(null)
  const save = async () => {
    if (!f.name) return alert('Name is required')
    const o = { name: f.name, mobile: f.mobile || null, whatsapp: f.whatsapp || null, specialization: f.specialization || null, batch: f.batch || null, salary: +f.salary || 0 }
    if (editId) await sb.from('teachers').update(o).eq('id', editId)
    else await sb.from('teachers').insert(o)
    setF({ name: '', mobile: '', whatsapp: '', specialization: '', batch: '', salary: '' }); setEditId(null); go('tch')
  }
  const edit = (t) => { setF({ name: t.name, mobile: t.mobile || '', whatsapp: t.whatsapp || '', specialization: t.specialization || '', batch: t.batch || '', salary: t.salary || '' }); setEditId(t.id) }
  const toggle = async (t) => { await sb.from('teachers').update({ active: !t.active }).eq('id', t.id); go('tch') }

  return (
    <>
      <div className="card">
        <h3>{editId ? 'Edit Teacher' : 'Add Teacher'}</h3>
        <div className="g">
          <div><label>Name *</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label>Mobile</label><input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div><label>WhatsApp</label><input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
          <div><label>Specialization</label>
            <select value={f.specialization} onChange={(e) => setF({ ...f, specialization: e.target.value })}>
              <option value="">—</option>
              {['Nazera', 'Hifz', 'Tajweed', 'Noorani Qaida', 'Arabic', 'Other'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label>Batch</label>
            <select value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })}>
              {['', 'Morning', 'Noon', 'Afternoon', 'Evening'].map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label>Salary</label><input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={save}>{editId ? 'Update' : 'Add'}</button>
          {editId && <button className="btn btn-ghost" onClick={() => { setEditId(null); setF({ name: '', mobile: '', whatsapp: '', specialization: '', batch: '', salary: '' }) }}>Cancel</button>}
        </div>
      </div>
      <div className="card">
        <h3>Teachers <span className="sub">({S.teachers.length})</span></h3>
        <T h={['Name', 'Mobile', 'Specialization', 'Batch', 'Salary', 'Status', '']}
          rows={S.teachers.map((t) => [
            t.name, t.mobile || '—', t.specialization || '—', t.batch || '—', t.salary || 0,
            t.active !== false ? statusBadge('Active') : statusBadge('Left'),
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-sm btn-outline" onClick={() => edit(t)}><Icon.Pencil /></button>
              <button className="btn btn-sm btn-ghost" onClick={() => toggle(t)}>{t.active !== false ? 'Deactivate' : 'Activate'}</button>
            </div>,
          ])} />
        {S.teachers.length === 0 && <div className="empty"><Icon.GraduationCap />No teachers yet</div>}
      </div>
    </>
  )
}

/* ─── EXPENSES ─── */
function Expenses({ S, go, user }) {
  const [f, setF] = useState({ title: '', category: 'other', amount: '', expense_date: new Date().toISOString().slice(0, 10), note: '' })
  const thisMonth = ym()
  const monthExp = S.expenses.filter((e) => (e.expense_date || '').slice(0, 7) === thisMonth)
  const monthIncome = sum(S.pays.filter((p) => (p.paid_on || '').slice(0, 7) === thisMonth))
  const monthExpense = sum(monthExp.map((e) => ({ amount: e.amount })))

  const save = async () => {
    if (!f.title || !+f.amount) return alert('Title and amount required')
    await sb.from('expenses').insert({ title: f.title, category: f.category, amount: +f.amount, expense_date: f.expense_date, note: f.note || null, created_by: user })
    setF({ title: '', category: 'other', amount: '', expense_date: new Date().toISOString().slice(0, 10), note: '' })
    go('exp')
  }
  const del = async (id) => { if (!confirm('Delete this expense?')) return; await sb.from('expenses').delete().eq('id', id); go('exp') }

  return (
    <>
      <div className="stats">
        <div className="stat-card"><label>Income this month</label><div className="n">{monthIncome}</div></div>
        <div className="stat-card danger"><label>Expense this month</label><div className="n">{monthExpense}</div></div>
        <div className={`stat-card ${monthIncome - monthExpense >= 0 ? '' : 'danger'}`}>
          <label>Profit / Loss</label><div className="n">{monthIncome - monthExpense}</div>
        </div>
      </div>
      <div className="card">
        <h3>Add Expense</h3>
        <div className="g">
          <div><label>Title *</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><label>Category</label>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {['salary', 'rent', 'utility', 'supplies', 'other'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label>Amount *</label><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
          <div><label>Date</label><input type="date" value={f.expense_date} onChange={(e) => setF({ ...f, expense_date: e.target.value })} /></div>
          <div><label>Note</label><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={save}><Icon.Plus /> Add</button>
        </div>
      </div>
      <div className="card">
        <h3>Expenses</h3>
        <T h={['Date', 'Title', 'Category', 'Amount', 'By', '']}
          rows={S.expenses.slice(0, 50).map((e) => [
            e.expense_date, e.title, e.category, e.amount, e.created_by || '—',
            <button className="btn btn-sm btn-danger" onClick={() => del(e.id)}><Icon.Trash /></button>,
          ])} />
        {S.expenses.length === 0 && <div className="empty"><Icon.Receipt />No expenses yet</div>}
      </div>
    </>
  )
}
