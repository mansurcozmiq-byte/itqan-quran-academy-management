import { bn, esc, dm } from './util'

const row = (...a) => `<div class=row>${a.join('')}</div>`
const L = (l, v, w = 1) => `<div class=l style="flex:${w}">${l}<span>${esc(v)}</span></div>`
const sec = (t) => `<div class=sec>${t}</div>`
const head = () => `<div class=hd><h1>ইতকান কুরআন একাডেমি</h1><small>ITQAN QURAN ACADEMY</small><p>সবুজপল্লী আবাসন, নন্দীপাড়া, ৬ নং রোড, ঢাকা | যোগাযোগ : ০১৫৭৫০৪০০৯৫, ০১৭০১৬৬৫৯৮১</p></div>`
const sig = (a, b = '') => `<div class=sig><span>${a}</span>${b ? `<span style="color:#0b6b2f">${b}</span>` : ''}</div>`

export function formHTML(s) {
  const cs = (s.courses || []).join(', ')
  const R = [
    'শিক্ষার্থীকে নির্ধারিত সময়ে নিয়মিত ক্লাসে উপস্থিত থাকতে হবে।',
    'অনুপস্থিত হলে অভিভাবককে একাডেমিকে অবহিত করতে হবে।',
    'শিক্ষার্থীকে পরিষ্কার-পরিচ্ছন্নতা, শৃঙ্খলা, আদব ও উত্তম আচরণ বজায় রাখতে হবে।',
    'নির্ধারিত সময়ে মাসিক বেতন পরিশোধ করতে হবে।',
    'একাডেমির নিয়ম-কানুন ও শিক্ষকদের নির্দেশনা মেনে চলতে হবে।',
    'শিক্ষার্থীর কুরআন শিক্ষা, নামাজ, দোয়া, আদব ও ইসলামী চরিত্র গঠনে অভিভাবককে সহযোগিতা করতে হবে।',
  ]
  return `<div class=pg>${head()}<div class=pb><div class=tag>ভর্তি ফরম</div>
${row(L('ভর্তি নং:', bn(s.adm_no)), L('তারিখ:', dm(s.adm_date)))}
${sec('শিক্ষার্থীর তথ্য')}${row(L('শিক্ষার্থীর নাম:', s.name))}${row(L('পিতার নাম:', s.father), L('মাতার নাম:', s.mother))}${row(L('জন্ম তারিখ:', dm(s.dob)), L('বয়স:', bn(s.age)))}${row(L('বিদ্যালয়ের নাম:', s.school, 3), L('শ্রেণি:', s.class))}
${sec('অভিভাবকের তথ্য')}${row(L('অভিভাবকের নাম:', s.guardian))}${row(L('সম্পর্ক:', s.relation), L('মোবাইল:', bn(s.mobile)))}${row(L('ঠিকানা:', s.address))}
${sec('কোর্সের তথ্য <small>(অফিস কর্তৃপক্ষ পূরণ করবে)</small>')}${row(L('কোর্সের নাম:', cs))}
<div class=row><div class=l>ব্যাচ: ${['সকাল', 'দুপুর', 'বিকাল', 'সন্ধ্যা'].map((b) => `<span class=cb style="flex:none;border:1.5px solid #e39a2d;min-height:0">${s.batch === b || s.batch === ({ Morning: 'সকাল', Noon: 'দুপুর', Afternoon: 'বিকাল', Evening: 'সন্ধ্যা' }[b] || b) ? '✔' : ''}</span>${b}`).join(' ')}</div>${L('ক্লাসের সময়:', s.class_time)}</div>
${sec('ভর্তি ও বেতন')}${row(L('ভর্তি ফি:', bn(s.adm_fee)), L('কথায়:', s.fee_words, 3), '<b>টাকা</b>')}${row(L('মাসিক বেতন:', bn(s.mon_fee)), '<b>টাকা</b>')}
<div class=box><i style="color:#0b6b2f">প্রয়োজনীয় ঘোষণা</i><p><span class=cb></span> আমি নিশ্চিত করছি যে, উপরে প্রদত্ত তথ্য সঠিক এবং আমি আমার সন্তানকে নিয়মিত কুরআন ও ইসলামী শিক্ষায় অংশগ্রহণে সহযোগিতা করতে প্রতিশ্রুতিবদ্ধ।</p></div>
${sig('অভিভাবকের স্বাক্ষর', 'পরিচালকের স্বাক্ষর')}</div></div>
<div class=pg>${head()}<div class=pb><div class=tag style="background:#2a9d4a">ভর্তি ও শিক্ষার্থীর জন্য প্রয়োজনীয় নির্দেশনা</div><div class=box>${R.map((r, i) => `<p>${bn(i + 1)}. ${r}</p>`).join('')}</div>
${sec('অভিভাবকের সম্মতি')}<p><span class=cb></span> আমি উপরোক্ত নিয়মাবলি পড়েছি এবং আমার সন্তানকে ইতকান কুরআন একাডেমির নিয়ম অনুযায়ী পরিচালনায় সম্মত আছি।</p>
${row(L('অভিভাবকের নাম:', s.guardian, 2), L('মোবাইল:', bn(s.mobile)))}${sig('অভিভাবকের স্বাক্ষর ও তারিখ')}
${sec('অফিস ব্যবহারের জন্য <small>(অফিস কর্তৃপক্ষ পূরণ করবে)</small>')}${row(L('ভর্তি নং:', bn(s.adm_no), 2), L('ব্যাচ:', s.batch))}${row(L('কোর্স:', cs))}${row(L('ভর্তি সম্পন্ন করেছেন:', ''), L('স্বাক্ষর ও তারিখ:', ''))}
<div class=sig style="justify-content:flex-end"><span style="color:#0b6b2f">পরিচালকের স্বাক্ষর</span></div></div></div>`
}

export function receiptHTML(p, s) {
  return `<div class=pg style="min-height:0;padding-bottom:10mm">${head()}<div class=pb><div class=tag>টাকা প্রাপ্তির রশিদ</div>${row(L('রশিদ নং:', bn(p.rcpt_no)), L('তারিখ:', dm(p.paid_on)))}${row(L('শিক্ষার্থীর নাম:', s.name, 2), L('ভর্তি নং:', bn(s.adm_no)))}${row(L(p.kind === 'monthly' ? 'মাস:' : 'বিবরণ:', p.kind === 'monthly' ? bn(p.month) : p.kind === 'admission' ? 'ভর্তি ফি' : p.kind || 'অন্যান্য'), L('টাকা:', bn(p.amount)))}${p.note ? row(L('মন্তব্য:', p.note)) : ''}${sig('গ্রহীতার স্বাক্ষর')}</div></div>`
}

/** ID Card — credit-card size, 2 per page */
export function idCardHTML(s) {
  const photo = s.photo_url
    ? `<img src="${esc(s.photo_url)}" style="width:22mm;height:28mm;object-fit:cover;border-radius:3px;border:1px solid #ccc"/>`
    : `<div style="width:22mm;height:28mm;background:#e6f4ec;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#0b6b2f;border:1px solid #c8e6d0">${esc((s.name || '?')[0])}</div>`
  const card = `
  <div style="width:85.6mm;height:54mm;border:1.5px solid #0b6b2f;border-radius:6px;overflow:hidden;display:inline-block;margin:4mm;page-break-inside:avoid;font-family:'Hind Siliguri',sans-serif;position:relative;background:#fff">
    <div style="background:#0b6b2f;color:#fff;padding:2.5mm 3mm;display:flex;align-items:center;gap:2mm">
      <div style="font-size:11px;font-weight:700;line-height:1.2">ইতকান কুরআন একাডেমি<br/><span style="font-size:7px;opacity:.7;letter-spacing:1px;font-weight:400">ITQAN QURAN ACADEMY</span></div>
    </div>
    <div style="padding:3mm;display:flex;gap:3mm">
      ${photo}
      <div style="flex:1;font-size:9px;line-height:1.45">
        <div style="font-size:12px;font-weight:700;color:#0b6b2f;margin-bottom:1mm">${esc(s.name)}</div>
        <div><b>ID:</b> ${esc(bn(s.adm_no))}</div>
        <div><b>Batch:</b> ${esc(s.batch || '—')}</div>
        <div><b>Course:</b> ${esc((s.courses || []).slice(0, 2).join(', ') || '—')}</div>
        <div><b>Mobile:</b> ${esc(bn(s.mobile) || '—')}</div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;background:#e39a2d;color:#fff;font-size:7px;text-align:center;padding:1mm 0;letter-spacing:.5px">সবুজপল্লী, নন্দীপাড়া, ঢাকা · ০১৫৭৫০৪০০৯৫</div>
  </div>`
  return `<div style="padding:8mm">${card}${card}</div>`
}

/** Course completion / Hifz certificate */
export function certificateHTML(s, type = 'completion') {
  const title = type === 'hifz' ? 'হিফজ সম্পন্ন সনদপত্র' : 'কোর্স সমাপনী সনদপত্র'
  const titleEn = type === 'hifz' ? 'Hifz Completion Certificate' : 'Course Completion Certificate'
  const body =
    type === 'hifz'
      ? `এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, <b>${esc(s.name)}</b> (${esc(bn(s.adm_no))}) ইতকান কুরআন একাডেমি হইতে পবিত্র কুরআন মজীদের হিফজ সফলভাবে সম্পন্ন করিয়াছেন।`
      : `এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, <b>${esc(s.name)}</b> (${esc(bn(s.adm_no))}) ইতকান কুরআন একাডেমিতে ${(s.courses || []).map(esc).join(', ') || 'নির্ধারিত'} কোর্স সফলভাবে সম্পন্ন করিয়াছেন।`
  return `<div class=pg style="display:flex;align-items:center;justify-content:center">
  <div style="width:180mm;border:3px solid #0b6b2f;border-radius:4px;padding:12mm;text-align:center;position:relative">
    <div style="border:1.5px solid #e39a2d;border-radius:2px;padding:10mm 8mm">
      <div style="color:#0b6b2f;font-size:28px;font-weight:700;margin-bottom:2mm">ইতকান কুরআন একাডেমি</div>
      <div style="letter-spacing:3px;font-size:11px;color:#888;margin-bottom:8mm">ITQAN QURAN ACADEMY</div>
      <div style="background:#e39a2d;color:#fff;display:inline-block;padding:3px 24px;border-radius:20px;font-weight:600;font-size:14px;margin-bottom:8mm">${title}</div>
      <div style="font-size:11px;color:#888;margin-bottom:6mm">${titleEn}</div>
      <div style="font-size:15px;line-height:1.8;margin:0 8mm 10mm;text-align:justify">${body}</div>
      <div style="font-size:13px;margin-bottom:12mm">তারিখ: ${bn(new Date().toISOString().slice(0, 10).split('-').reverse().join('/'))}</div>
      <div style="display:flex;justify-content:space-between;margin:0 10mm">
        <div style="text-align:center"><div style="border-top:1px solid #333;padding-top:3px;width:50mm;margin:0 auto;font-size:12px">পরিচালক</div></div>
        <div style="text-align:center"><div style="border-top:1px solid #333;padding-top:3px;width:50mm;margin:0 auto;font-size:12px">শিক্ষক</div></div>
      </div>
      <div style="margin-top:8mm;font-size:10px;color:#888">সবুজপল্লী আবাসন, নন্দীপাড়া, ৬ নং রোড, ঢাকা | ০১৫৭৫০৪০০৯৫, ০১৭০১৬৬৫৯৮১</div>
    </div>
  </div>
</div>`
}
