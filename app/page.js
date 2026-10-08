'use client'
import { useEffect, useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { sb } from '../lib/supabase'
import { dm, ym, dueMonths } from '../lib/util'
import { formHTML, receiptHTML, idCardHTML, certificateHTML } from '../lib/print'
import { uploadPhoto, uploadDocument, whatsappReminder } from '../lib/storage'
import { t as tr } from '../lib/i18n'
import { Icon } from '../lib/icons'
import Leads from './Leads'
import Shortcuts from './Shortcuts'

const NAV_ITEMS = [
  { section: 'main' },
  { id: 'dash', labelKey: 'dashboard', icon: 'LayoutDashboard' },
  { id: 'stu', labelKey: 'students', icon: 'Users' },
  { id: 'new', labelKey: 'newAdmission', icon: 'UserPlus' },
  { id: 'leads', labelKey: 'leads', icon: 'Inbox' },
  { id: 'att', labelKey: 'attendance', icon: 'ClipboardCheck' },
  { section: 'finance' },
  { id: 'pay', labelKey: 'payments', icon: 'Wallet', adminOnly: true },
  { id: 'due', labelKey: 'dueList', icon: 'AlertTriangle' },
  { id: 'exp', labelKey: 'expenses', icon: 'Receipt', adminOnly: true },
  { section: 'settings' },
  { id: 'fee', labelKey: 'feesCourses', icon: 'BookOpen', adminOnly: true },
  { id: 'tch', labelKey: 'teachers', icon: 'GraduationCap', adminOnly: true },
  { id: 'staff', labelKey: 'staff', icon: 'Shield', adminOnly: true },
]

const sum = (ps) => ps.reduce((a, p) => a + +p.amount, 0)
const statusBadge = (s) => {
  const m = { Active: 'badge-active', Left: 'badge-left', Graduated: 'badge-graduated', Waiting: 'badge-waiting' }
  return <span className={`badge ${m[s] || 'badge-active'}`}>{s}</span>
}
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const BATCHES = ['Morning', 'Noon', 'Afternoon', 'Evening']

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

export default function App() {
  const [user, setUser] = useState()
  const [userId, setUserId] = useState()
  const [role, setRole] = useState('admin')
  const [ready, setReady] = useState(false)
  const [v, setV] = useState('dash')
  const [arg, setArg] = useState()
  const [pr, setPr] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lang, setLang] = useState('en')
  const [S, setS] = useState({ courses: [], students: [], pays: [], teachers: [], expenses: [], attendance: [], docs: [], profiles: [], leads: [], set: {} })

  const tt = (key) => tr(lang, key)
  const isAdmin = role === 'admin'

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved) setLang(saved)
  }, [])

  const load = async () => {
    const [c, s, p, t, te, ex, at, docs, prof, leads] = await Promise.all([
      sb.from('courses').select('*').order('name'),
      sb.from('students').select('*').order('created_at', { ascending: false }),
      sb.from('payments').select('*').order('paid_on', { ascending: false }),
      sb.from('settings').select('*'),
      sb.from('teachers').select('*').order('name'),
      sb.from('expenses').select('*').order('expense_date', { ascending: false }),
      sb.from('attendance').select('*').gte('date', ym() + '-01').order('date', { ascending: false }),
      sb.from('documents').select('*').order('uploaded_at', { ascending: false }),
      sb.from('profiles').select('*'),
      sb.from('leads').select('*').order('created_at', { ascending: false }),
    ])
    setS({
      courses: c.data || [], students: s.data || [], pays: p.data || [],
      teachers: te.data || [], expenses: ex.data || [], attendance: at.data || [],
      docs: docs.data || [], profiles: prof.data || [], leads: leads.data || [],
      set: Object.fromEntries((t.data || []).map((r) => [r.k, +r.v])),
    })
  }

  const go = async (x, a) => { await load(); setV(x); setArg(a); setMobileOpen(false) }

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      setUser(u?.email)
      setUserId(u?.id)
      if (u?.id) {
        const { data: prof } = await sb.from('profiles').select('role').eq('id', u.id).single()
        if (prof?.role) setRole(prof.role)
        else {
          await sb.from('profiles').upsert({ id: u.id, email: u.email, role: 'admin', name: u.email?.split('@')[0] })
          setRole('admin')
        }
      }
      setReady(true)
    })
  }, [])
  useEffect(() => { if (user) load() }, [user])
  useEffect(() => { if (pr) { const t = setTimeout(() => { window.print(); setPr('') }, 50); return () => clearTimeout(t) } }, [pr])

  const toggleLang = () => {
    const n = lang === 'en' ? 'bn' : 'en'
    setLang(n)
    localStorage.setItem('lang', n)
  }

  const backup = async () => {
    const o = {}
    for (const tbl of ['students', 'payments', 'courses', 'settings', 'fee_history', 'teachers', 'attendance', 'expenses', 'documents', 'profiles']) {
      o[tbl] = (await sb.from(tbl).select('*')).data
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' }))
    a.download = 'backup-' + ym() + '.json'
    a.click()
  }

  const pageTitle = {
    dash: tt('dashboard'), stu: tt('students'), new: tt('newAdmission'), prof: 'Student Profile',
    pay: tt('payments'), fee: tt('feesCourses'), att: tt('attendance'), due: tt('dueList'),
    exp: tt('expenses'), tch: tt('teachers'), staff: tt('staff'), leads: tt('leads'),
  }

  if (!ready) return null
  if (!user) return <Login onDone={(email, id) => { setUser(email); setUserId(id) }} tt={tt} />

  const P = { S, go, print: setPr, user, userId, load, role, isAdmin, lang, tt }

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.section) return true
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <>
      <div className="app-shell">
        {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div className="logo-mark"><Icon.BookMarked /></div>
            <div className="brand-text">
              <h1>{tt('appName')}</h1>
              <span>{tt('management')}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {visibleNav.map((item, i) =>
              item.section ? (
                <div key={i} className="nav-section">{item.section === 'main' ? (lang === 'bn' ? 'মূল' : 'Main') : item.section === 'finance' ? (lang === 'bn' ? 'অর্থ' : 'Finance') : (lang === 'bn' ? 'সেটিংস' : 'Settings')}</div>
              ) : (
                <button key={item.id} className={`nav-item ${v === item.id ? 'active' : ''}`} onClick={() => go(item.id)}>
                  <span className="nav-icon">{Icon[item.icon] && Icon[item.icon]()}</span>
                  <span className="nav-label">{tt(item.labelKey)}</span>
                </button>
              )
            )}
          </nav>
          <div className="sidebar-footer">
            <button className="nav-item" onClick={toggleLang}>
              <span className="nav-icon"><Icon.Globe /></span>
              <span className="nav-label">{lang === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
            {isAdmin && (
              <button className="nav-item" onClick={backup}>
                <span className="nav-icon"><Icon.Download /></span>
                <span className="nav-label">{tt('backup')}</span>
              </button>
            )}
            <button className="nav-item" onClick={() => sb.auth.signOut().then(() => setUser(null))}>
              <span className="nav-icon"><Icon.LogOut /></span>
              <span className="nav-label">{tt('logout')}</span>
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
              <h2>{pageTitle[v] || tt('dashboard')}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{role}</span>
              <span className="user-badge">{user}</span>
            </div>
          </header>
          <div className="content-row">           <div className="content">
            {v === 'dash' && <Dash {...P} />}
            {v === 'stu' && <Stu {...P} />}
            {v === 'prof' && <Prof id={arg} {...P} />}
            {v === 'new' && <Form key={arg || 'new'} id={arg} {...P} />}
            {v === 'pay' && isAdmin && <Pay {...P} />}
            {v === 'fee' && isAdmin && <Fee {...P} />}
            {v === 'att' && <Attendance {...P} />}
            {v === 'due' && <DueList {...P} />}
            {v === 'exp' && isAdmin && <Expenses {...P} />}
            {v === 'tch' && isAdmin && <Teachers {...P} />}
            {v === 'staff' && isAdmin && <Staff {...P} />}
            {v === 'leads' && <Leads {...P} />}
          </div>
          <Shortcuts {...P} />
          </div>
        </div>
      </div>
      <div id="pr" dangerouslySetInnerHTML={{ __html: pr }} />
    </>
  )
}

function Login({ onDone, tt }) {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('')
  const login = async () => {
    setErr('')
    const r = await sb.auth.signInWithPassword({ email: e, password: p })
    if (r.error) setErr(r.error.message)
    else onDone(r.data.user.email, r.data.user.id)
  }
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo"><div className="logo-mark"><Icon.BookMarked /></div></div>
        <h2>Itqan Quran Academy</h2>
        <p className="sub">Management System</p>
        <div className="field"><label>{tt('email')}</label><input value={e} onChange={(x) => setE(x.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && login()} /></div>
        <div className="field"><label>{tt('password')}</label><input type="password" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && login()} /></div>
        {err && <p className="login-error">{err}</p>}
        <button className="btn btn-primary" onClick={login}>{tt('signIn')}</button>
      </div>
    </div>
  )
}

function Dash({ S, go, tt }) {
  const act = S.students.filter((s) => s.status === 'Active')
  const thisMonth = ym()
  const newThisMonth = S.students.filter((s) => (s.adm_date || '').slice(0, 7) === thisMonth).length
  const d = act.map((s) => ({ s, m: dueMonths(s, S.pays) })).filter((x) => x.m.length)
  const tot = d.reduce((a, x) => a + x.m.length * x.s.mon_fee, 0)
  const colThisMonth = sum(S.pays.filter((p) => (p.paid_on || '').slice(0, 7) === thisMonth))
  const today = new Date().toISOString().slice(0, 10)
  const todayAtt = S.attendance.filter((a) => a.date === today)
  const n = new Date()
  const months = [...Array(6)].map((_, i) => ym(new Date(n.getFullYear(), n.getMonth() - 5 + i, 1)))
  const col = months.map((k) => ({ n: k, v: sum(S.pays.filter((p) => (p.paid_on || '').slice(0, 7) === k)) }))
  const cc = S.courses.map((c) => ({ n: c.name, v: act.filter((s) => (s.courses || []).includes(c.name)).length }))
  return (
    <>
      <div className="stats">
        <div className="stat-card"><label>{tt('activeStudents')}</label><div className="n">{act.length}</div></div>
        <div className="stat-card secondary"><label>{tt('newThisMonth')}</label><div className="n">{newThisMonth}</div></div>
        <div className="stat-card"><label>{tt('collectedThisMonth')}</label><div className="n">{colThisMonth}</div></div>
        <div className="stat-card danger"><label>{tt('totalDue')}</label><div className="n">{tot}</div></div>
        <div className="stat-card"><label>{tt('presentToday')}</label><div className="n">{todayAtt.filter((a) => a.status === 'Present').length}</div></div>
        <div className="stat-card warning"><label>{tt('absentToday')}</label><div className="n">{todayAtt.filter((a) => a.status === 'Absent').length}</div></div>
        <div className="stat-card danger"><label>{tt('studentsWithDues')}</label><div className="n">{d.length}</div></div>
      </div>
      <div className="charts-row">
        <Ch t={tt('collection6m')} data={col} />
        <Ch t={tt('studentsPerCourse')} data={cc} />
      </div>
      <div className="card">
        <div className="card-title-row">
          <h3>{tt('dueList')} <span className="sub">({d.length})</span></h3>
          {d.length > 5 && <button className="btn btn-sm btn-ghost" onClick={() => go('due')}>{tt('viewAll')}</button>}
        </div>
        {d.length === 0 ? <div className="empty"><Icon.Check />{tt('allFeesCleared')}</div> : (
          <T h={['Student', 'ID', 'Months', 'Amount', '']}
            rows={d.slice(0, 8).map((x) => [x.s.name, x.s.adm_no, x.m.length, x.m.length * x.s.mon_fee,
              <button className="btn btn-sm btn-outline" onClick={() => go('prof', x.s.id)}>{tt('open')}</button>])} />
        )}
      </div>
    </>
  )
}

function Stu({ S, go, tt }) {
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
        <input placeholder={tt('searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{tt('allStatus')}</option>
          {['Active', 'Left', 'Graduated', 'Waiting'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">{tt('allBatch')}</option>
          {BATCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => go('new')}><Icon.Plus /> {tt('new')}</button>
      </div>
      <T h={['', 'ID', 'Name', 'Courses', 'Batch', 'Mobile', 'Due', 'Status', '']}
        rows={filtered.map((s) => [
          s.photo_url ? <img src={s.photo_url} className="avatar" alt="" style={{ width: 32, height: 32 }} />
            : <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(s.name)}</div>,
          s.adm_no, s.name, (s.courses || []).join(', ') || '—', s.batch || '—', s.mobile || '—',
          s.status === 'Active' ? dueMonths(s, S.pays).length : '—', statusBadge(s.status),
          <button className="btn btn-sm btn-outline" onClick={() => go('prof', s.id)}>{tt('open')}</button>,
        ])} />
      {filtered.length === 0 && <div className="empty"><Icon.Search />{tt('noStudents')}</div>}
    </div>
  )
}

function Prof({ S, id, go, print, tt }) {
  const s = S.students.find((x) => x.id === id)
  if (!s) return <div className="card">Student not found</div>
  const ps = S.pays.filter((p) => p.student_id === id)
  const d = dueMonths(s, S.pays)
  const teacher = S.teachers.find((t) => t.id === s.teacher_id)
  const docs = (S.docs || []).filter((doc) => doc.student_id === id)
  const photoRef = useRef()
  const docRef = useRef()
  const [docTitle, setDocTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const setStatus = async (status) => { await sb.from('students').update({ status }).eq('id', id); go('prof', id) }
  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPhoto(id, file)
      await sb.from('students').update({ photo_url: url }).eq('id', id)
      go('prof', id)
    } catch (err) { alert('Upload failed: ' + err.message + '\n\nCreate Storage bucket "photos" (public) in Supabase.') }
    setUploading(false)
  }
  const onDoc = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const title = docTitle.trim() || file.name
    setUploading(true)
    try {
      const url = await uploadDocument(id, file, title)
      await sb.from('documents').insert({ student_id: id, title, file_url: url })
      setDocTitle('')
      go('prof', id)
    } catch (err) { alert('Upload failed: ' + err.message + '\n\nCreate Storage bucket "documents" in Supabase.') }
    setUploading(false)
  }
  const delDoc = async (docId) => {
    if (!confirm('Delete document?')) return
    await sb.from('documents').delete().eq('id', docId)
    go('prof', id)
  }
  const waLink = whatsappReminder(s, d, d.length * s.mon_fee)
  const info = [
    [tt('father'), s.father], [tt('mother'), s.mother],
    [tt('guardian'), (s.guardian || '') + (s.relation ? ` (${s.relation})` : '')],
    [tt('mobile'), s.mobile], [tt('whatsapp'), s.whatsapp],
    [tt('address'), s.address], ['School / Class', [s.school, s.class].filter(Boolean).join(' · ')],
    [tt('courses'), (s.courses || []).join(', ')], [tt('batch'), s.batch],
    [tt('classTime'), s.class_time], [tt('mode'), s.mode],
    ['Online link', s.online_link], [tt('teacher'), teacher?.name],
    [tt('monthlyFee'), `${s.mon_fee} (${s.mon_disc}% scholarship)`],
    [tt('admissionFee'), `${s.adm_fee} (${s.adm_disc}% scholarship)`],
  ]
  return (
    <>
      <div className="card">
        <div className="profile-header">
          <div style={{ position: 'relative' }}>
            {s.photo_url ? <img src={s.photo_url} className="avatar avatar-lg" alt="" /> : <div className="avatar avatar-lg">{initials(s.name)}</div>}
            <button className="btn-icon" style={{ position: 'absolute', bottom: -4, right: -4, background: '#fff' }}
              onClick={() => photoRef.current?.click()} title={tt('uploadPhoto')} disabled={uploading}>
              <Icon.Camera />
            </button>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          </div>
          <div className="info">
            <h3>{s.name} {statusBadge(s.status)}</h3>
            <p className="meta">{s.adm_no} · Admitted {dm(s.adm_date)}</p>
          </div>
        </div>
        <div className="g">
          {info.filter(([, b]) => b).map(([a, b]) => (<div key={a}><label>{a}</label><div>{b}</div></div>))}
        </div>
        {(s.current_para || s.current_surah || s.sobok || s.sabqi || s.manzil) && (
          <div className="progress-box">
            <div className="title">{tt('quranProgress')}</div>
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
          <button className="btn btn-primary" onClick={() => print(formHTML(s))}><Icon.Printer /> {tt('printForm')}</button>
          <button className="btn btn-secondary" onClick={() => print(idCardHTML(s))}><Icon.IdCard /> {tt('printIdCard')}</button>
          <button className="btn btn-outline" onClick={() => print(certificateHTML(s, 'completion'))}><Icon.Award /> {tt('printCertificate')}</button>
          {(s.courses || []).some((c) => /hifz/i.test(c)) && (
            <button className="btn btn-outline" onClick={() => print(certificateHTML(s, 'hifz'))}><Icon.Award /> Hifz Certificate</button>
          )}
          <button className="btn btn-outline" onClick={() => go('new', id)}><Icon.Pencil /> {tt('edit')}</button>
          {waLink && d.length > 0 && (
            <a className="btn btn-secondary" href={waLink} target="_blank" rel="noreferrer"><Icon.MessageCircle /> {tt('sendWhatsApp')}</a>
          )}
          {s.status === 'Active' && <button className="btn btn-danger btn-sm" onClick={() => setStatus('Left')}>{tt('markLeft')}</button>}
          {s.status === 'Left' && <button className="btn btn-outline btn-sm" onClick={() => setStatus('Active')}>{tt('markActive')}</button>}
          {s.status === 'Active' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus('Graduated')}>{tt('graduated')}</button>}
          {s.status !== 'Waiting' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus('Waiting')}>{tt('waiting')}</button>}
        </div>
      </div>
      <div className="card">
        <h3>{tt('documents')}</h3>
        <div className="toolbar">
          <input placeholder={tt('title') + ' (Birth Certificate, NID...)'} value={docTitle} onChange={(e) => setDocTitle(e.target.value)} style={{ maxWidth: 260 }} />
          <button className="btn btn-outline" onClick={() => docRef.current?.click()} disabled={uploading}><Icon.FileText /> {tt('uploadDocument')}</button>
          <input ref={docRef} type="file" accept="image/*,.pdf" hidden onChange={onDoc} />
        </div>
        {docs.length === 0 ? <div className="empty"><Icon.FileText />{tt('noDocuments')}</div> : (
          <T h={['Title', 'Date', '']}
            rows={docs.map((doc) => [
              <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{doc.title}</a>,
              doc.uploaded_at?.slice(0, 10),
              <button className="btn btn-sm btn-danger" onClick={() => delDoc(doc.id)}><Icon.Trash /></button>,
            ])} />
        )}
      </div>
      <div className="card">
        <h3>{tt('unpaidMonths')} <span className="sub">({d.length})</span></h3>
        {d.length ? d.join(', ') : tt('none')}
      </div>
      <div className="card">
        <h3>{tt('payments')}</h3>
        <T h={['Receipt', 'Date', 'For', 'Amount', '']}
          rows={ps.map((p) => [p.rcpt_no, dm(p.paid_on), p.kind + ' ' + (p.month || ''), p.amount,
            <button className="btn btn-sm btn-outline" onClick={() => print(receiptHTML(p, s))}><Icon.Printer /></button>])} />
        {ps.length === 0 && <div className="empty"><Icon.Inbox />No payments yet</div>}
      </div>
    </>
  )
}

function Form({ S, id, go, tt }) {
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
  const I = (k, l, typ = 'text', rc) => (
    <div key={k}><label>{l}</label><input type={typ} value={f[k] ?? ''} onChange={(e) => upd(k, e.target.value, rc)} /></div>
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
      <h3>{id ? tt('edit') : tt('newAdmission')}</h3>
      <div className="section-label">{tt('personalInfo')}</div>
      <div className="g">
        {I('name', tt('studentName') + ' *')}{I('father', tt('father'))}{I('mother', tt('mother'))}
        {I('dob', 'Date of birth', 'date')}{I('age', 'Age')}{I('school', 'School')}{I('class', 'Class')}
      </div>
      <div className="section-label">{tt('guardian')}</div>
      <div className="g">
        {I('guardian', tt('guardian'))}{I('relation', 'Relation')}
        {I('mobile', tt('mobile'))}{I('whatsapp', tt('whatsapp'))}{I('address', tt('address'))}
      </div>
      <div className="section-label">{tt('courses')}</div>
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
        <div><label>{tt('batch')}</label>
          <select value={f.batch || ''} onChange={(e) => upd('batch', e.target.value)}>
            {['', ...BATCHES].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        {I('class_time', tt('classTime'))}
        <div><label>{tt('mode')}</label>
          <select value={f.mode || 'offline'} onChange={(e) => upd('mode', e.target.value)}>
            <option value="offline">Offline</option><option value="online">Online</option><option value="hybrid">Hybrid</option>
          </select>
        </div>
        {I('online_link', 'Zoom / Meet link')}
        <div><label>{tt('teacher')}</label>
          <select value={f.teacher_id || ''} onChange={(e) => upd('teacher_id', e.target.value)}>
            <option value="">—</option>
            {S.teachers.filter((t) => t.active !== false).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div><label>{tt('status')}</label>
          <select value={f.status || 'Active'} onChange={(e) => upd('status', e.target.value)}>
            {['Active', 'Waiting', 'Left', 'Graduated'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="section-label">{tt('quranProgress')}</div>
      <div className="g">
        {I('current_para', 'Current Para')}{I('current_surah', 'Current Surah')}
        {I('sobok', 'Sobok')}{I('sabqi', 'Sabqi')}{I('manzil', 'Manzil')}
        <div><label>Progress notes</label><textarea value={f.progress_notes || ''} onChange={(e) => upd('progress_notes', e.target.value)} /></div>
      </div>
      <div className="section-label">{tt('fees')}</div>
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
      <button className="btn btn-primary" onClick={save} style={{ marginTop: 8 }}>{tt('save')}</button>
    </div>
  )
}

function Pay({ S, go, print, tt }) {
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
              <option value="">—</option>
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
          <button className="btn btn-primary" onClick={save}><Icon.Printer /> {tt('savePrint')}</button>
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

function DueList({ S, go, tt }) {
  const act = S.students.filter((s) => s.status === 'Active')
  const d = act.map((s) => ({ s, m: dueMonths(s, S.pays) })).filter((x) => x.m.length).sort((a, b) => b.m.length - a.m.length)
  const tot = d.reduce((a, x) => a + x.m.length * x.s.mon_fee, 0)
  return (
    <div className="card">
      <h3>{tt('dueList')} <span className="sub">Total: {tot} · {d.length}</span></h3>
      {d.length === 0 ? <div className="empty"><Icon.Check />{tt('allFeesCleared')}</div> : (
        <T h={['Student', 'ID', 'Mobile', 'Months', 'Amount', '']}
          rows={d.map((x) => {
            const wa = whatsappReminder(x.s, x.m, x.m.length * x.s.mon_fee)
            return [
              x.s.name, x.s.adm_no, x.s.mobile || '—',
              x.m.length + ' (' + x.m.slice(-3).join(', ') + (x.m.length > 3 ? '...' : '') + ')',
              x.m.length * x.s.mon_fee,
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-outline" onClick={() => go('prof', x.s.id)}>{tt('open')}</button>
                {wa && <a className="btn btn-sm btn-secondary" href={wa} target="_blank" rel="noreferrer"><Icon.MessageCircle /></a>}
              </div>,
            ]
          })} />
      )}
    </div>
  )
}

function Attendance({ S, go, user, tt }) {
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
        <div><label>{tt('batch')}</label>
          <select value={batch} onChange={(e) => setBatch(e.target.value)} style={{ maxWidth: 140 }}>
            <option value="">All</option>
            {BATCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <button className="btn btn-sm btn-outline" onClick={() => markAll('Present')}>{tt('allPresent')}</button>
        <button className="btn btn-sm btn-ghost" onClick={() => markAll('Absent')}>{tt('allAbsent')}</button>
        <button className="btn btn-primary" onClick={save}>{tt('saveAttendance')}</button>
      </div>
      {chronicIds.size > 0 && (
        <div className="alert alert-warning"><Icon.AlertTriangle /> {chronicIds.size} {tt('chronicAbsent')}</div>
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

function Teachers({ S, go, tt }) {
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
        <h3>{editId ? tt('editTeacher') : tt('addTeacher')}</h3>
        <div className="g">
          <div><label>Name *</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label>{tt('mobile')}</label><input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div><label>{tt('whatsapp')}</label><input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
          <div><label>{tt('specialization')}</label>
            <select value={f.specialization} onChange={(e) => setF({ ...f, specialization: e.target.value })}>
              <option value="">—</option>
              {['Nazera', 'Hifz', 'Tajweed', 'Noorani Qaida', 'Arabic', 'Other'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label>{tt('batch')}</label>
            <select value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })}>
              {['', ...BATCHES].map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label>{tt('salary')}</label><input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={save}>{editId ? 'Update' : 'Add'}</button>
          {editId && <button className="btn btn-ghost" onClick={() => { setEditId(null); setF({ name: '', mobile: '', whatsapp: '', specialization: '', batch: '', salary: '' }) }}>Cancel</button>}
        </div>
      </div>
      <div className="card">
        <h3>{tt('teachers')} <span className="sub">({S.teachers.length})</span></h3>
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

function Expenses({ S, go, user, tt }) {
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
        <div className="stat-card"><label>{tt('incomeThisMonth')}</label><div className="n">{monthIncome}</div></div>
        <div className="stat-card danger"><label>{tt('expenseThisMonth')}</label><div className="n">{monthExpense}</div></div>
        <div className={`stat-card ${monthIncome - monthExpense >= 0 ? '' : 'danger'}`}>
          <label>{tt('profitLoss')}</label><div className="n">{monthIncome - monthExpense}</div>
        </div>
      </div>
      <div className="card">
        <h3>{tt('addExpense')}</h3>
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
        <h3>{tt('expenses')}</h3>
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

function Staff({ S, go, tt }) {
  const profiles = S.profiles || []
  const setRole = async (id, role) => {
    await sb.from('profiles').update({ role }).eq('id', id)
    go('staff')
  }
  return (
    <div className="card">
      <h3>{tt('staff')} <span className="sub">Staff cannot access Payments, Expenses, Fees, Teachers, Backup.</span></h3>
      <T h={['Email', 'Name', 'Role', '']}
        rows={profiles.map((p) => [
          p.email, p.name || '—',
          <span className={`badge ${p.role === 'admin' ? 'badge-active' : 'badge-waiting'}`}>{p.role}</span>,
          <select value={p.role} onChange={(e) => setRole(p.id, e.target.value)} style={{ maxWidth: 120 }}>
            <option value="admin">{tt('admin')}</option>
            <option value="staff">{tt('staffRole')}</option>
          </select>,
        ])} />
      {profiles.length === 0 && (
        <div className="empty">Run schema.sql, then re-login. New users default to admin — set staff roles here.</div>
      )}
    </div>
  )
}
