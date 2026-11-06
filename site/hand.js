// Read the same fixed cards as services/promptPreview.ts, extracted by the site build.
fetch('hand-sample.json').then(r=>{if(!r.ok)throw Error('sample');return r.json()}).then(data=>{
 const makeCard=([rank,suit])=>{const c=document.createElement('span');c.className='sample-card';c.textContent=rank+suit;c.dataset.red=String(suit==='♥'||suit==='♦');return c;};
 const hole=document.querySelector('#sample-hole'),board=document.querySelector('#sample-board');
 hole.replaceChildren(...data.hole.map(makeCard));
 const buttons=[...document.querySelectorAll('[data-street]')];
 function show(button){buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const cards=data.board.slice(0,Number(button.dataset.street));board.replaceChildren(...cards.map(makeCard));if(!cards.length){for(const [lang,text] of [['en','No public cards'],['zh','尚未揭示公共牌']]){const label=document.createElement('span');label.lang=lang;label.textContent=text;board.append(label);}}}
 buttons.forEach(button=>button.addEventListener('click',()=>show(button)));show(buttons[0]);
}).catch(()=>{document.querySelector('#sample-board').textContent='Sample unavailable / 示例暂不可用';});
