// Utilities
function hexToHsl(hex) {
    hex = hex.replace('#',''); if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
    const r=parseInt(hex.slice(0,2),16)/255, g=parseInt(hex.slice(2,4),16)/255, b=parseInt(hex.slice(4,6),16)/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2;
    if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
      switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;} h/=6;
    } return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)};
  }
  function hslCss(h,s,l,a=1){ return `hsl(${h} ${s}% ${l}% / ${a})`; }
  function generateShades(hex){
    const hsl=hexToHsl(hex), baseL=hsl.l;
    return [
      hslCss(hsl.h, Math.max(10,hsl.s*0.6), Math.min(95,baseL+18)),
      hslCss(hsl.h, Math.max(12,hsl.s*0.9), Math.min(85,baseL+2)),
      hslCss(hsl.h, Math.min(100,hsl.s), Math.max(18,baseL-18))
    ];
  }
  
  // Storage
  const STORAGE_KEY='stylish_habits_v2';
  let habits=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
  function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(habits)); }
  
  // DOM
  const mainContainer=document.getElementById('mainContainer');
  function uid(p='h'){ return p+Math.random().toString(36).slice(2,9);}
  function ymd(d){ return new Date(d).toISOString().slice(0,10); }
  function generateDaysForMonth(y,m){ const arr=[]; const d=new Date(y,m,1); while(d.getMonth()===m){arr.push(new Date(d)); d.setDate(d.getDate()+1);} return arr;}
  
  function applyCellColor(cell, habit, intensity){
    cell.classList.remove('active');
    if(!intensity){ cell.style.background='rgba(255,255,255,0.03)'; return; }
    const shades=habit.shades||generateShades(habit.baseColor||'#4cc9f0');
    const color=shades[Math.max(0,Math.min(2,intensity-1))];
    cell.style.background=color;
    cell.classList.add('active');
  }
  
  function updateProgress(habit, card){
    const now=new Date();
    const startOfWeek=new Date(now); startOfWeek.setHours(0,0,0,0); startOfWeek.setDate(now.getDate()-now.getDay());
    const daysThisWeek=[]; for(let d=0;d<7;d++){ const dd=new Date(startOfWeek); dd.setDate(startOfWeek.getDate()+d); daysThisWeek.push(ymd(dd)); }
    const intensities=daysThisWeek.map(k=>(habit.days&&habit.days[k])?habit.days[k]:0);
    const sum=intensities.reduce((a,b)=>a+b,0); const avg=sum/7; const percent=Math.round((avg/3)*100);
    const fill=card.querySelector('.progress-fill'); const text=card.querySelector('.progress-meta');
    if(fill) fill.style.width=percent+'%'; if(text) text.textContent=`${percent}% this week`;
  }
  
  function render(){
    mainContainer.innerHTML='';
    const currentYear=new Date().getFullYear();
    habits.forEach((h,idx)=>{
      const card=document.createElement('div'); card.className='habit';
      const header=document.createElement('div'); header.className='habit-header';
      const title=document.createElement('h3'); title.textContent=h.name;
      const actions=document.createElement('div'); actions.className='habit-actions';
      const deleteBtn=document.createElement('button'); deleteBtn.className='icon-btn'; deleteBtn.title='Delete habit';
      deleteBtn.innerHTML='🗑️';
      deleteBtn.onclick=()=>{ if(confirm('Delete habit "'+h.name+'"? This will remove all its data.')){ habits.splice(idx,1); save(); render(); }};
      actions.appendChild(deleteBtn); header.appendChild(title); header.appendChild(actions); card.appendChild(header);
  
      const monthsRow=document.createElement('div'); monthsRow.className='months';
      for(let m=0;m<12;m++){
        const monthCard=document.createElement('div'); monthCard.className='month';
        const monthName=new Date(currentYear,m,1).toLocaleString('default',{month:'short'});
        const mh=document.createElement('h4'); mh.textContent=monthName; monthCard.appendChild(mh);
        const daysGrid=document.createElement('div'); daysGrid.className='days';
        const days=generateDaysForMonth(currentYear,m);
        const first=new Date(currentYear,m,1); const lead=first.getDay();
        for(let e=0;e<lead;e++){ const blank=document.createElement('div'); blank.style.visibility='hidden'; blank.style.width='14px'; blank.style.height='14px'; daysGrid.appendChild(blank);}
        days.forEach(dobj=>{
          const key=ymd(dobj);
          const cell=document.createElement('div'); cell.className='day';
          // show date number
          const span=document.createElement('span'); span.textContent=dobj.getDate(); span.style.fontSize='8px'; span.style.color='rgba(255,255,255,0.7)';
          span.style.display='flex'; span.style.alignItems='center'; span.style.justifyContent='center';
          span.style.width='100%'; span.style.height='100%'; span.style.userSelect='none';
          cell.appendChild(span);
  
          const intensity=(h.days&&h.days[key])?h.days[key]:0;
          applyCellColor(cell,h,intensity);
          cell.title=`${key} — intensity ${intensity}`;
          cell.onclick=()=>{
            const curr=(h.days&&h.days[key])?h.days[key]:0;
            const next=(curr+1)%4;
            if(!h.days) h.days={};
            if(next===0){ delete h.days[key]; } else { h.days[key]=next; }
            applyCellColor(cell,h,next);
            cell.title=`${key} — intensity ${next}`;
            save(); updateProgress(h,card);
          };
          daysGrid.appendChild(cell);
        });
        monthCard.appendChild(daysGrid); monthsRow.appendChild(monthCard);
      }
      card.appendChild(monthsRow);
  
      const legend=document.createElement('div'); legend.className='legend';
      legend.innerHTML='<div style="color:var(--muted)">Less</div>';
      const shades=h.shades||generateShades(h.baseColor||'#4cc9f0');
      for(let i=0;i<3;i++){ const box=document.createElement('div'); box.style.width='14px'; box.style.height='14px'; box.style.borderRadius='3px'; box.style.background=shades[i]; box.style.border='1px solid rgba(0,0,0,0.28)'; legend.appendChild(box);}
      legend.insertAdjacentHTML('beforeend','<div style="color:var(--muted)">More</div>');
      card.appendChild(legend);
  
      const progressWrap=document.createElement('div'); progressWrap.className='progress';
      const bar=document.createElement('div'); bar.className='progress-bar';
      const fill=document.createElement('div'); fill.className='progress-fill'; fill.style.background=shades[2];
      bar.appendChild(fill);
      const meta=document.createElement('div'); meta.className='progress-meta'; meta.textContent='0% this week';
      progressWrap.appendChild(bar); progressWrap.appendChild(meta); card.appendChild(progressWrap);
      updateProgress(h,card);
      mainContainer.appendChild(card);
    });
  }
  
  // Modal & add habit
  const openAdd=document.getElementById('openAdd');
  const modal=document.getElementById('modal');
  const cancelAdd=document.getElementById('cancelAdd');
  const confirmAdd=document.getElementById('confirmAdd');
  const habitNameInput=document.getElementById('habitName');
  const habitColorInput=document.getElementById('habitColor');
  
  openAdd.onclick=()=>{
    habitNameInput.value=''; habitColorInput.value='#4cc9f0';
    modal.classList.add('show'); habitNameInput.focus();
  };
  cancelAdd.onclick=()=>modal.classList.remove('show');
  modal.addEventListener('click', e=>{ if(e.target===modal) modal.classList.remove('show'); });
  confirmAdd.onclick=()=>{
    const name=habitNameInput.value.trim(); const color=habitColorInput.value;
    if(!name){ alert('Please give the habit a name'); habitNameInput.focus(); return; }
    const shades=generateShades(color);
    const newHabit={id:uid(), name, baseColor:color, shades, days:{}};
    habits.push(newHabit); save(); modal.classList.remove('show'); render();
  };
  
  // Normalize old habits
  (function normalizeExisting(){
    let changed=false;
    habits.forEach(h=>{
      if(Array.isArray(h.days)){ const o={}; h.days.forEach(k=>{o[k]=1;}); h.days=o; changed=true; }
      if(!h.shades && h.baseColor){ h.shades=generateShades(h.baseColor); changed=true; }
    });
    if(changed) save();
  })();
  
  render();