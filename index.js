const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toLocaleDateString('en-CA')};
const esc=s=>(s||'').replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
const $=id=>document.getElementById(id);
let data=JSON.parse(localStorage.plans||'{}'),tab=0,range=7,n=Date.now();
const uid=()=>++n;
Object.values(data).flat().forEach(i=>{if(!i.id)i.id=uid()});

const save=()=>localStorage.plans=JSON.stringify(data);
const get=k=>data[k]||[];
const list=k=>data[k]||(data[k]=[]);
const cur=()=>list(day(tab));
const byTime=(a,b)=>(a.time||'99').localeCompare(b.time||'99');
const kind=i=>i.extra?'extra':i.small?'small':'plan';
const count=a=>a.filter(i=>i.done).length;
const meta=i=>i.extra?'extra':i.small?'':esc(i.time)+' '+esc(i.place);

const row=(i,box)=>`<div class="item ${i.done?'done':''}">`+
  (box?`<input type="checkbox" ${i.done?'checked':''} onchange="tick(${i.id})">`:'')+
  `<div><span>${esc(i.desc)}</span><small>${meta(i)}</small></div>`+
  (box?'':`<button onclick="del(${i.id})">x</button>`)+`</div>`;

function go(x){tab=x;render()}
function render(){
  [0,1,2].forEach(x=>$('t'+x).className=tab==x?'on':'');
  $('app').innerHTML=[viewToday,viewTomorrow,viewHistory][tab]();
}

function viewToday(){
  const all=get(day(0)).slice().sort(byTime);
  const plan=all.filter(i=>kind(i)=='plan'),small=all.filter(i=>i.small),ex=all.filter(i=>i.extra);
  let h=`<h2>${count(plan)}/${plan.length} done${ex.length?', '+ex.length+' extra':''}</h2>`;
  if(!plan.length&&!small.length)h+=`<p style="color:#888">Nothing planned for today.</p>`;
  h+=plan.map(i=>row(i,1)).join('');
  if(small.length)h+=`<h2>Small stuff ${count(small)}/${small.length}</h2>`+small.map(i=>row(i,1)).join('');
  if(ex.length)h+=`<h2>Extras</h2>`+ex.map(i=>row(i,1)).join('');
  return h+`<h2>Also did</h2><input type="text" id="e" placeholder="Something unplanned"><button class="add" onclick="extra()">Add</button>`;
}

function viewTomorrow(){
  const all=get(day(1)).slice().sort(byTime);
  const plan=all.filter(i=>kind(i)=='plan'),small=all.filter(i=>i.small);
  let h=`<h2>${plan.length}/5 planned for tomorrow</h2>`+plan.map(i=>row(i)).join('');
  if(plan.length<5)h+=`<h2>Add</h2><input type="text" id="d" placeholder="What"><input type="time" id="tm"><input type="text" id="p" placeholder="Where"><button class="add" onclick="add()">Add</button>`;
  h+=`<h2>Small stuff</h2>`+small.map(i=>row(i)).join('');
  return h+`<input type="text" id="s" placeholder="Quick one, no time or place"><button class="add" onclick="addSmall()">Add</button>`;
}

function viewHistory(){
  const cut=range?day(1-range):'';
  const keys=Object.keys(data).filter(k=>k<=day(0)&&k>=cut&&data[k].length).sort().reverse();
  const opts=[7,30,0].map(v=>`<option value="${v}" ${v==range?'selected':''}>${v?'Last '+v+' days':'All'}</option>`).join('');
  let h=`<select onchange="range=+this.value;render()">${opts}</select><button class="add" onclick="window.print()">Save as PDF</button>`;
  if(!keys.length)return h+`<p style="color:#888">No history yet.</p>`;
  return h+keys.map(k=>{
    const a=data[k].slice().sort(byTime),plan=a.filter(i=>kind(i)=='plan');
    const label=new Date(k+'T00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
    return `<h3>${label}, ${count(plan)}/${plan.length} planned done</h3>`+
      a.map(i=>`<div class="h ${i.done?'ok':'no'}">${i.done?'[x]':'[ ]'} ${esc(i.desc)} <small>${meta(i)||'small'}</small></div>`).join('');
  }).join('');
}

function add(){
  const d=$('d').value.trim(),l=list(day(1));
  if(!d||l.filter(i=>kind(i)=='plan').length>=5)return;
  l.push({id:uid(),desc:d,time:$('tm').value,place:$('p').value.trim(),done:false});
  save();render();
}
function addSmall(){
  const v=$('s').value.trim();if(!v)return;
  list(day(1)).push({id:uid(),desc:v,small:true,done:false});
  save();render();
}
function extra(){
  const v=$('e').value.trim();if(!v)return;
  list(day(0)).push({id:uid(),desc:v,extra:true,done:true});
  save();render();
}
async function update(){
  try{
    const r=await fetch('index.html?'+Date.now());
    if(!r.ok)throw 0;
  }catch{
    alert('No connection. Try again when you are online.');
    return;
  }
  const regs=await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(x=>x.unregister()));
  await Promise.all((await caches.keys()).map(k=>caches.delete(k)));
  location.reload();
}
function del(id){const l=cur();l.splice(l.findIndex(i=>i.id==id),1);save();render()}
function tick(id){const i=cur().find(i=>i.id==id);i.done=!i.done;save();render()}

render();

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');