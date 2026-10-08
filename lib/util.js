export const bn=s=>String(s??'').replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d])
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
export const dm=d=>d?bn(d.split('-').reverse().join('/')):''
export const ym=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
export function dueMonths(s,pays){
  const o=[],n=new Date();let [y,m]=s.adm_date.slice(0,7).split('-').map(Number)
  while(y<n.getFullYear()||(y==n.getFullYear()&&m<=n.getMonth()+1)){
    const k=y+'-'+String(m).padStart(2,'0')
    if(!pays.some(p=>p.student_id==s.id&&p.kind=='monthly'&&p.month==k))o.push(k)
    if(++m>12){m=1;y++}
  }
  return o
}
