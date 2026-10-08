'use client'
import {useEffect,useState} from 'react'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts'
import {sb} from '../lib/supabase'
import {dm,ym,dueMonths} from '../lib/util'
import {formHTML,receiptHTML} from '../lib/print'

const NAV=[['dash','Dashboard'],['stu','Students'],['new','New Admission'],['pay','Payments'],['fee','Fees']]
const sum=ps=>ps.reduce((a,p)=>a+ +p.amount,0)
const T=({h,rows})=><table><thead><tr>{h.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table>
const Ch=({t,data})=><div className="c"><h3>{t}</h3><ResponsiveContainer width="100%" height={220}><BarChart data={data}><XAxis dataKey="n" fontSize={11}/><YAxis fontSize={11} allowDecimals={false}/><Tooltip/><Bar dataKey="v" fill="#0b6b2f"/></BarChart></ResponsiveContainer></div>

export default function App(){
  const [user,setUser]=useState(),[ready,setReady]=useState(false),[v,setV]=useState('dash'),[arg,setArg]=useState(),[pr,setPr]=useState('')
  const [S,setS]=useState({courses:[],students:[],pays:[],set:{}})
  const load=async()=>{
    const [c,s,p,t]=await Promise.all([sb.from('courses').select('*').order('name'),sb.from('students').select('*').order('created_at',{ascending:false}),sb.from('payments').select('*').order('paid_on',{ascending:false}),sb.from('settings').select('*')])
    setS({courses:c.data||[],students:s.data||[],pays:p.data||[],set:Object.fromEntries((t.data||[]).map(r=>[r.k,+r.v]))})
  }
  const go=async(x,a)=>{await load();setV(x);setArg(a)}
  useEffect(()=>{sb.auth.getSession().then(({data})=>{setUser(data.session?.user.email);setReady(true)})},[])
  useEffect(()=>{if(user)load()},[user])
  useEffect(()=>{if(pr){const t=setTimeout(()=>{window.print();setPr('')},50);return()=>clearTimeout(t)}},[pr])
  const backup=async()=>{
    const o={};for(const t of['students','payments','courses','settings','fee_history'])o[t]=(await sb.from(t).select('*')).data
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='backup-'+ym()+'.json';a.click()
  }
  if(!ready)return null
  if(!user)return <Login onDone={setUser}/>
  const P={S,go,print:setPr,user}
  return <>
    <div id="app">
      <nav>{NAV.map(([k,t])=><button key={k} className={v==k?'on':''} onClick={()=>go(k)}>{t}</button>)}
        <button onClick={backup}>Backup</button><button onClick={()=>sb.auth.signOut().then(()=>setUser(null))}>Logout</button></nav>
      <main>
        {v=='dash'&&<Dash {...P}/>}{v=='stu'&&<Stu {...P}/>}{v=='prof'&&<Prof id={arg} {...P}/>}
        {v=='new'&&<Form key={arg||'new'} id={arg} {...P}/>}{v=='pay'&&<Pay {...P}/>}{v=='fee'&&<Fee {...P}/>}
      </main>
    </div>
    <div id="pr" dangerouslySetInnerHTML={{__html:pr}}/>
  </>
}

function Login({onDone}){
  const [e,setE]=useState(''),[p,setP]=useState('')
  const login=async()=>{const r=await sb.auth.signInWithPassword({email:e,password:p});if(r.error)alert(r.error.message);else onDone(r.data.user.email)}
  return <main style={{maxWidth:360}}><div className="c"><h2>Itqan Quran Academy</h2>
    <label>Email</label><input value={e} onChange={x=>setE(x.target.value)}/>
    <label>Password</label><input type="password" value={p} onChange={x=>setP(x.target.value)}/>
    <p><button className="p" onClick={login}>Login</button></p></div></main>
}

function Dash({S,go}){
  const act=S.students.filter(s=>s.status=='Active')
  const d=act.map(s=>({s,m:dueMonths(s,S.pays)})).filter(x=>x.m.length),tot=d.reduce((a,x)=>a+x.m.length*x.s.mon_fee,0)
  const n=new Date(),months=[...Array(6)].map((_,i)=>ym(new Date(n.getFullYear(),n.getMonth()-5+i,1)))
  const col=months.map(k=>({n:k,v:sum(S.pays.filter(p=>p.paid_on.slice(0,7)==k))}))
  const cc=S.courses.map(c=>({n:c.name,v:act.filter(s=>(s.courses||[]).includes(c.name)).length}))
  return <>
    <div className="g">{[['Active students',act.length],['Collected this month',col[5].v],['Students with dues',d.length],['Total due',tot]].map(([a,b])=><div className="c" key={a}><label>{a}</label><div className="n">{b}</div></div>)}</div>
    <div className="g"><Ch t="Collection (last 6 months)" data={col}/><Ch t="Students per course" data={cc}/></div>
    <div className="c"><h3>Due list</h3><T h={['Student','Months','Amount','']} rows={d.map(x=>[x.s.name,x.m.length,x.m.length*x.s.mon_fee,<button className="s" onClick={()=>go('prof',x.s.id)}>Open</button>])}/></div>
  </>
}

function Stu({S,go}){
  const [q,setQ]=useState('')
  return <div className="c"><input placeholder="Search name / no / mobile" value={q} onChange={e=>setQ(e.target.value)}/>
    <T h={['No','Name','Courses','Mobile','Due','']} rows={S.students.filter(s=>(s.name+s.adm_no+(s.mobile||'')).toLowerCase().includes(q.toLowerCase())).map(s=>[s.adm_no,s.name,(s.courses||[]).join(', '),s.mobile,s.status=='Active'?dueMonths(s,S.pays).length:'-',<button className="s" onClick={()=>go('prof',s.id)}>Open</button>])}/></div>
}

function Prof({S,id,go,print}){
  const s=S.students.find(x=>x.id==id);if(!s)return null
  const ps=S.pays.filter(p=>p.student_id==id),d=dueMonths(s,S.pays)
  const tog=async()=>{await sb.from('students').update({status:s.status=='Active'?'Left':'Active'}).eq('id',id);go('prof',id)}
  return <>
    <div className="c"><h3>{s.name} <small>{s.adm_no} · {s.status}</small></h3>
      <div className="g">{[['Father',s.father],['Mother',s.mother],['Guardian',(s.guardian||'')+' ('+(s.relation||'')+')'],['Mobile',s.mobile],['Address',s.address],['Courses',(s.courses||[]).join(', ')],['Batch',s.batch],['Monthly fee',s.mon_fee+' ('+s.mon_disc+'% scholarship)'],['Admission fee',s.adm_fee+' ('+s.adm_disc+'% scholarship)']].map(([a,b])=><div key={a}><label>{a}</label><br/>{b}</div>)}</div>
      <p><button className="p" onClick={()=>print(formHTML(s))}>Print admission form</button> <button className="s" onClick={()=>go('new',id)}>Edit</button> <button className="s" onClick={tog}>{s.status=='Active'?'Mark left':'Mark active'}</button></p></div>
    <div className="c"><h3>Unpaid months ({d.length})</h3>{d.join(', ')||'None'}</div>
    <div className="c"><h3>Payments</h3><T h={['Receipt','Date','For','Amount','']} rows={ps.map(p=>[p.rcpt_no,dm(p.paid_on),p.kind+' '+(p.month||''),p.amount,<button className="s" onClick={()=>print(receiptHTML(p,s))}>Receipt</button>])}/></div>
  </>
}

function Form({S,id,go}){
  const s=S.students.find(x=>x.id==id)||{}
  const [f,setF]=useState({name:'',father:'',mother:'',dob:'',age:'',school:'',class:'',guardian:'',relation:'',mobile:'',address:'',batch:'',class_time:'',fee_words:'',adm_disc:0,mon_disc:0,mon_fee:0,courses:[],paid:false,...s,adm_fee:id?s.adm_fee:S.set.admission_fee||0})
  const base=cs=>S.courses.filter(x=>cs.includes(x.name)).reduce((a,x)=>a+ +x.monthly_fee,0)
  const upd=(k,val,rc)=>setF(p=>{
    const n={...p,[k]:val}
    if(k=='dob'){const a=Math.floor((Date.now()-new Date(val))/31557600000);n.age=a>=0?String(a):''}
    if(rc){n.mon_fee=Math.round(base(n.courses)*(1-(+n.mon_disc||0)/100));n.adm_fee=Math.round((S.set.admission_fee||0)*(1-(+n.adm_disc||0)/100))}
    return n})
  const I=(k,l,t='text',rc)=><div key={k}><label>{l}</label><input type={t} value={f[k]??''} onChange={e=>upd(k,e.target.value,rc)}/></div>
  const save=async()=>{
    if(!f.name)return alert('Student name required')
    const o={};['name','father','mother','school','class','guardian','relation','mobile','address','batch','class_time','fee_words','age'].forEach(k=>o[k]=f[k]||null)
    o.dob=f.dob||null;['adm_disc','mon_disc','adm_fee','mon_fee'].forEach(k=>o[k]=+f[k]||0);o.courses=f.courses
    const r=id?await sb.from('students').update(o).eq('id',id).select().single():await sb.from('students').insert(o).select().single()
    if(r.error)return alert(r.error.message)
    if(!id&&f.paid&&o.adm_fee>0)await sb.from('payments').insert({student_id:r.data.id,kind:'admission',amount:o.adm_fee})
    go('prof',r.data.id)
  }
  return <div className="c"><h3>{id?'Edit':'New'} admission</h3>
    <div className="g">{I('name','Student name')}{I('father','Father')}{I('mother','Mother')}{I('dob','Date of birth','date')}{I('age','Age')}{I('school','School')}{I('class','Class')}{I('guardian','Guardian name')}{I('relation','Relation')}{I('mobile','Mobile')}{I('address','Address')}</div>
    <h4>Courses</h4>
    <div className="g">{S.courses.filter(c=>c.active).map(c=><label key={c.id}><input type="checkbox" style={{width:'auto'}} checked={f.courses.includes(c.name)} onChange={e=>upd('courses',e.target.checked?[...f.courses,c.name]:f.courses.filter(x=>x!=c.name),true)}/> {c.name} ({c.monthly_fee})</label>)}</div>
    <div className="g">
      <div><label>Batch</label><select value={f.batch||''} onChange={e=>upd('batch',e.target.value)}>{['','সকাল','দুপুর','বিকাল','সন্ধ্যা'].map(b=><option key={b}>{b}</option>)}</select></div>
      {I('class_time','Class time')}{I('adm_disc','Admission scholarship %','number',true)}{I('mon_disc','Monthly scholarship %','number',true)}
      {I('adm_fee','Admission fee (final)','number')}{I('mon_fee','Monthly fee (final)','number')}{I('fee_words','Fee in words (কথায়)')}
    </div>
    {!id&&<p><label><input type="checkbox" style={{width:'auto'}} checked={f.paid} onChange={e=>upd('paid',e.target.checked)}/> Admission fee received now</label></p>}
    <button className="p" onClick={save}>Save</button></div>
}

function Pay({S,go,print}){
  const [p,setP]=useState({sid:'',k:'monthly',m:ym(),a:'',n:''})
  const set=(k,v)=>setP(x=>({...x,[k]:v}))
  const save=async()=>{
    if(!p.sid||!+p.a)return alert('Select student and amount')
    const r=await sb.from('payments').insert({student_id:p.sid,kind:p.k,month:p.k=='monthly'?p.m:null,amount:+p.a,note:p.n||null}).select().single()
    if(r.error)return alert(r.error.message)
    print(receiptHTML(r.data,S.students.find(x=>x.id==p.sid)));go('pay')
  }
  return <>
    <div className="c"><h3>New payment</h3><div className="g">
      <div><label>Student</label><select value={p.sid} onChange={e=>{set('sid',e.target.value);set('a',(S.students.find(x=>x.id==e.target.value)||{}).mon_fee||'')}}><option value="">-- select --</option>{S.students.filter(s=>s.status=='Active').map(s=><option key={s.id} value={s.id}>{s.name} ({s.adm_no})</option>)}</select></div>
      <div><label>Type</label><select value={p.k} onChange={e=>set('k',e.target.value)}><option value="monthly">Monthly</option><option value="admission">Admission</option><option value="other">Other</option></select></div>
      <div><label>Month</label><input type="month" value={p.m} onChange={e=>set('m',e.target.value)}/></div>
      <div><label>Amount</label><input type="number" value={p.a} onChange={e=>set('a',e.target.value)}/></div>
      <div><label>Note</label><input value={p.n} onChange={e=>set('n',e.target.value)}/></div>
      <button className="p" onClick={save}>Save &amp; print receipt</button></div></div>
    <div className="c"><h3>Recent payments</h3><T h={['Receipt','Student','For','Amount','']} rows={S.pays.slice(0,30).map(x=>{const s=S.students.find(y=>y.id==x.student_id);return [x.rcpt_no,s?.name,x.kind+' '+(x.month||''),x.amount,<button className="s" onClick={()=>print(receiptHTML(x,s))}>Receipt</button>]})}/></div>
  </>
}

function Fee({S,go,user}){
  const [h,setH]=useState([]),[a,setA]=useState(S.set.admission_fee||0),[cf,setCf]=useState({}),[nc,setNc]=useState(''),[nf,setNf]=useState('')
  useEffect(()=>{sb.from('fee_history').select('*').order('changed_at',{ascending:false}).limit(30).then(r=>setH(r.data||[]))},[S])
  const log=(item,o,n)=>sb.from('fee_history').insert({item,old_fee:o,new_fee:n,changed_by:user})
  const setAdm=async()=>{const o=S.set.admission_fee||0;if(+a==o)return;await sb.from('settings').upsert({k:'admission_fee',v:+a});await log('Admission fee',o,+a);go('fee')}
  const setFee=async c=>{const n=+(cf[c.id]??c.monthly_fee);if(n==c.monthly_fee)return;await sb.from('courses').update({monthly_fee:n}).eq('id',c.id);await log(c.name+' (monthly)',c.monthly_fee,n);go('fee')}
  const add=async()=>{if(!nc.trim())return;await sb.from('courses').insert({name:nc.trim(),monthly_fee:+nf||0});setNc('');setNf('');go('fee')}
  return <>
    <div className="c"><h3>Fees</h3>
      <div className="g"><div><label>Admission fee</label><input type="number" value={a} onChange={e=>setA(e.target.value)}/></div><button className="p" onClick={setAdm}>Save</button></div><br/>
      <T h={['Course','Monthly fee','']} rows={S.courses.map(c=>[c.name,<input type="number" defaultValue={c.monthly_fee} onChange={e=>setCf({...cf,[c.id]:e.target.value})}/>,<button className="s" onClick={()=>setFee(c)}>Save</button>])}/><br/>
      <div className="g"><input placeholder="New course name" value={nc} onChange={e=>setNc(e.target.value)}/><input type="number" placeholder="Monthly fee" value={nf} onChange={e=>setNf(e.target.value)}/><button className="p" onClick={add}>Add course</button></div></div>
    <div className="c"><h3>Fee history</h3><T h={['Date','Item','Old','New','By']} rows={h.map(r=>[r.changed_at.slice(0,10),r.item,r.old_fee,r.new_fee,r.changed_by])}/></div>
  </>
}
