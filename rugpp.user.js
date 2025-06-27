// ==UserScript==
// @name         rugpp
// @namespace    https://rugplay.com/
// @version      5.7
// @description  yeh rugpp.
// @match        https://rugplay.com/*
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function(){
  'use strict';

  // Prevent duplicate
  if (document.getElementById('rugpp-sidebar')) return;

  // Config & state
  const API_KEY = 'YOUR_KEY_HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
  const BASE    = 'https://rugplay.com/api/v1';
  const HDR     = { 'Authorization': `Bearer ${API_KEY}` };
  const CONF    = GM_getValue('CONF', { listSize: 8, refreshMs: 30000, alertPct: 20, newHighlightMs: 4000 });
  let watch     = GM_getValue('watchlist', []);
  const seenNew = new Set();
  let currentTab = 'Watchlist';

  // Catppuccin palette
  const C = {
    bg:     'rgba(40,44,52,0.95)',
    fg:     '#cad3f5',
    blue:   '#8aadf4',
    green:  '#a6da95',
    red:    '#ed8796',
    stroke: '#cad3f5'
  };

  // Helpers
  async function getJSON(path){
    const res = await fetch(BASE + path, { headers: HDR });
    if(!res.ok) throw new Error(res.status);
    return res.json();
  }
  const fmt = (x,dp=2)=>Number(x).toLocaleString(undefined,{minimumFractionDigits:dp,maximumFractionDigits:dp});
  const notify = (t,m)=>GM_notification({ title:t, text:m, timeout:2000 });

  // Build sidebar
  const sb = document.createElement('div');
  sb.id = 'rugpp-sidebar';
  Object.assign(sb.style,{
    position:'fixed', top:'60px', right:'0', width:'280px', maxHeight:'75vh',
    background:C.bg, color:C.fg, fontFamily:'Inter, sans-serif', fontSize:'12px',
    padding:'10px', zIndex:9999, borderRadius:'16px', border:`1px solid ${C.stroke}`,
    boxShadow:'0 4px 12px rgba(0,0,0,0.25)', display:'flex', flexDirection:'column'
  });
  document.body.appendChild(sb);

  // Draggable header
  const hdr = document.createElement('div');
  Object.assign(hdr.style,{
    display:'flex', justifyContent:'center', cursor:'move', marginBottom:'8px'
  });
  hdr.innerHTML = `<div style="font-weight:700;font-size:16px;color:${C.fg}">
    rug<em style="font-style:italic;-webkit-text-stroke:1px ${C.fg};">pp</em>
  </div>`;
  sb.appendChild(hdr);
  (function(el,handle){
    let dx,dy,drag=false;
    handle.onmousedown = e => { drag=true; dx=e.clientX-el.offsetLeft; dy=e.clientY-el.offsetTop; };
    document.onmousemove = e => {
      if(drag){
        el.style.left = e.clientX-dx+'px';
        el.style.top  = e.clientY-dy+'px';
      }
    };
    document.onmouseup = ()=>drag=false;
  })(sb,hdr);

  // Tabs
  const tabs = ['Watchlist','Gainers','Losers','Volume','Cap','New','Wild','Hopium','Lookup','Alerts'];
  const bar = document.createElement('div');
  Object.assign(bar.style,{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'10px' });
  tabs.forEach(tab=>{
    const b = document.createElement('button');
    b.textContent = tab;
    Object.assign(b.style,{
      flex:'1 1 45%', padding:'6px 0', background:'transparent',
      color:C.fg, border:`1px solid ${C.stroke}`, borderRadius:'8px',
      fontSize:'11px', cursor:'pointer', transition:'background 0.2s'
    });
    b.onmouseover = ()=>b.style.background='rgba(138,173,244,0.1)';
    b.onmouseout  = ()=>b.style.background='transparent';
    b.onclick     = ()=>{ currentTab=tab; render(); };
    bar.appendChild(b);
  });
  sb.appendChild(bar);

  // Content
  const content = document.createElement('div');
  Object.assign(content.style,{ flex:'1', overflowY:'auto' });
  sb.appendChild(content);

  // Sparkline
  async function spark(el,sym){
    try{
      const d = await getJSON(`/coin/${sym}?timeframe=1m`);
      const pts = d.candlestickData.slice(-12).map(c=>c.close);
      const cv = document.createElement('canvas'); cv.width=40; cv.height=12; el.appendChild(cv);
      const ctx = cv.getContext('2d');
      const mn = Math.min(...pts), mx = Math.max(...pts);
      ctx.beginPath();
      pts.forEach((v,i)=>{
        const x=i*(cv.width/pts.length), y=cv.height-((v-mn)/(mx-mn))*cv.height;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      });
      ctx.strokeStyle=C.blue; ctx.lineWidth=1; ctx.stroke();
    }catch{}
  }

  // Section title
  function section(t){
    const sec = document.createElement('div'), h=document.createElement('div');
    h.textContent = t;
    Object.assign(h.style,{ fontWeight:'500', color:C.blue, margin:'8px 0 6px', fontSize:'14px' });
    sec.appendChild(h);
    return sec;
  }

  // Input row for Watchlist
  function inputRow(){
    const row = document.createElement('div');
    Object.assign(row.style,{ display:'flex',gap:'6px',marginBottom:'8px' });
    const inp = document.createElement('input');
    inp.placeholder = '*SYM';
    Object.assign(inp.style,{
      flex:'1',padding:'6px',border:`1px solid ${C.stroke}`,
      borderRadius:'8px',background:'rgba(255,255,255,0.05)',
      color:C.fg,fontSize:'11px'
    });
    const btn = document.createElement('button');
    btn.textContent = '+';
    Object.assign(btn.style,{
      padding:'0 12px',border:'none',borderRadius:'8px',
      background:C.blue,color:C.fg,cursor:'pointer',fontSize:'14px'
    });
    btn.onclick = ()=>{
      const s = inp.value.trim().replace(/^\*/,'').toUpperCase();
      if(s && !watch.includes(s)){
        watch.push(s);
        GM_setValue('watchlist', watch);
      }
      inp.value='';
      render();
    };
    row.append(inp,btn);
    return row;
  }

  // Render all tabs
  async function render(){
    content.innerHTML = '';
    try{
      switch(currentTab){
        case 'Watchlist': {
          const sec = section('Watchlist');
          sec.appendChild(inputRow());

          // Header row
          const hdrR = document.createElement('div');
          Object.assign(hdrR.style,{
            display:'grid',gridTemplateColumns:'1fr 1fr 1fr 32px',
            fontSize:'10px',color:C.fg,opacity:0.6,padding:'0 8px'
          });
          hdrR.innerHTML = '<span>SYM</span>'
                        + '<span style="text-align:right">Price</span>'
                        + '<span style="text-align:right">24h</span>'
                        + '<span></span>';
          sec.appendChild(hdrR);

          // List
          const ul = document.createElement('ul');
          Object.assign(ul.style,{listStyle:'none',margin:0,padding:0});
          for(const sym of watch){
            let coin={};
            try{ coin = (await getJSON(`/coin/${sym}?timeframe=1d`)).coin; }catch{}
            const price = coin.currentPrice?`$${fmt(coin.currentPrice,4)}`:'–';
            const chg   = coin.change24h!=null?`${coin.change24h>=0?'+':''}${fmt(coin.change24h)}%`:'–';
            const col   = coin.change24h>=0?C.green:C.red;

            const li = document.createElement('li');
            Object.assign(li.style,{
              display:'grid',gridTemplateColumns:'1fr 1fr 1fr 32px',
              alignItems:'center',gap:'4px',padding:'6px 8px',
              borderBottom:`1px solid ${C.stroke}`
            });
            li.innerHTML = `<span style="font-weight:600">*${sym}</span>`
                         + `<span style="text-align:right">${price}</span>`
                         + `<span style="text-align:right;color:${col}">${chg}</span>`
                         + `<span style="cursor:pointer;color:${C.red}">✕</span>`;
            li.querySelector('span:last-child').onclick = ()=>{
              watch = watch.filter(x=>x!==sym);
              GM_setValue('watchlist', watch);
              render();
            };
            spark(li.children[1], sym);
            ul.appendChild(li);
          }
          sec.appendChild(ul);
          content.appendChild(sec);
          break;
        }

        case 'Gainers':
        case 'Losers': {
          const dir = currentTab==='Gainers'?'desc':'asc';
          const title = currentTab==='Gainers'?'Top Gainers':'Top Losers';
          const sec = section(title);
          const d = await getJSON(
            `/market?limit=${CONF.listSize}&sortBy=change24h&sortOrder=${dir}&changeFilter=${currentTab.toLowerCase()}`
          );
          d.coins.forEach(c=>{
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 8px';
            row.innerHTML = `<span>*${c.symbol}</span>`
                          + `<span style="color:${c.change24h>=0?C.green:C.red}">`
                          + `${dir==='desc'?'+':''}${fmt(c.change24h)}%`
                          + `</span>`;
            sec.appendChild(row);
          });
          content.appendChild(sec);
          break;
        }

        case 'Volume': {
          const sec = section('High Volume');
          const d = await getJSON(
            `/market?limit=${CONF.listSize}&sortBy=volume24h&sortOrder=desc`
          );
          d.coins.forEach(c=>{
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 8px';
            row.innerHTML = `<span>*${c.symbol}</span><span>${fmt(c.volume24h,0)}</span>`;
            sec.appendChild(row);
          });
          content.appendChild(sec);
          break;
        }

        case 'Cap': {
          const sec = section('Market Cap');
          const top = (await getJSON('/top')).coins.slice(0,CONF.listSize);
          top.forEach(c=>{
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 8px';
            row.innerHTML = `<span>*${c.symbol}</span><span>$${fmt(c.marketCap,0)}</span>`;
            sec.appendChild(row);
          });
          content.appendChild(sec);
          break;
        }

        case 'New': {
          const sec = section('New Listings');
          const d = await getJSON(
            `/market?limit=${CONF.listSize}&sortBy=createdAt&sortOrder=desc`
          );
          d.coins.forEach(c=>{
            if(!seenNew.has(c.symbol)){
              seenNew.add(c.symbol);
              notify('New', c.symbol);
            }
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 8px';
            row.innerHTML = `<span>*${c.symbol}</span><span>${new Date(c.createdAt).toLocaleTimeString()}</span>`;
            sec.appendChild(row);
          });
          content.appendChild(sec);
          break;
        }

        case 'Wild': {
          const sec = section('Wild Movers');
          const d = await getJSON(`/market?limit=${CONF.listSize}&changeFilter=wild`);
          d.coins.forEach(c=>{
            const raw = Math.abs(c.change24h),
                  pct = raw>1000?'>1000%':`${fmt(c.change24h)}%`;
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 8px';
            row.innerHTML = `<span>*${c.symbol}</span><span>${pct}</span>`;
            sec.appendChild(row);
          });
          content.appendChild(sec);
          break;
        }

        case 'Hopium': {
          const sec = section('Hopium');
          const d = await getJSON(`/hopium?status=ACTIVE&limit=${CONF.listSize}`);
          d.questions.forEach(q=>{
            const row = document.createElement('div');
            row.style.cssText = 'padding:4px 8px';
            row.textContent = `${q.id}: ${q.question}`;
            sec.appendChild(row);
          });
          content.appendChild(sec);
          break;
        }

        case 'Lookup': {
          const sec = section('Lookup');
          const row = document.createElement('div');
          Object.assign(row.style,{display:'flex',gap:'6px',marginBottom:'8px'});
          const inp = document.createElement('input');
          inp.placeholder = '*SYM';
          Object.assign(inp.style,{
            flex:'1',padding:'6px',border:`1px solid ${C.stroke}`,
            borderRadius:'8px',background:'rgba(255,255,255,0.05)',
            color:C.fg,fontSize:'11px'
          });
          const btn = document.createElement('button');
          btn.textContent='Go';
          Object.assign(btn.style,{
            padding:'0 12px',border:'none',borderRadius:'8px',
            background:C.blue,color:C.fg,cursor:'pointer',fontSize:'14px'
          });
          const out = document.createElement('div');
          btn.onclick = async ()=>{
            const s = inp.value.trim().replace(/^\*/,'').toUpperCase();
            out.textContent = '…';
            try{
              const { coin } = await getJSON(`/coin/${s}?timeframe=1d`);
              out.innerHTML = `
                <div><strong>*${coin.symbol}</strong> – $${fmt(coin.currentPrice,4)}</div>
                <div style="font-size:11px;opacity:0.8">
                  Δ24h: ${fmt(coin.change24h)}% |
                  Vol24h: $${fmt(coin.volume24h,0)} |
                  Cap: $${fmt(coin.marketCap,0)} |
                  H/L: $${fmt(coin.high24h,4)}/$${fmt(coin.low24h,4)}
                </div>`;
            }catch{
              out.textContent = 'Not found';
            }
          };
          row.append(inp,btn);
          sec.appendChild(row);
          sec.appendChild(out);
          content.appendChild(sec);
          break;
        }

        case 'Alerts': {
          const sec = section('Alerts');
          sec.innerHTML += `<div style="font-size:11px;opacity:0.8">
            Alerts if Δ24h ≥ ${CONF.alertPct}%
          </div>`;
          content.appendChild(sec);
          break;
        }
      }
    }catch(e){
      content.innerHTML = `<div style="color:${C.red}">Error: ${e.message}</div>`;
    }
  }

  // Initial render + auto‑refresh every 30s
  render();
  setInterval(render, CONF.refreshMs);

})();
