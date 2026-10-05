(() => {
  'use strict';
  const R=window.GameRules, DECK=window.DECK, STORAGE='commerce-decisions-v2';
  const $=id=>document.getElementById(id), stage=$('stage'), viewport=$('viewport');
  let state=restore(), reading=matchMedia('(max-width: 650px) and (orientation: portrait)').matches, modalReturn=null;
  const labels={1:'Introduction',2:'Your football goal',3:'A competing want',4:'School contribution',5:'Choose your income strategy',6:'Save your weekly money',7:'Choose a school job',8:'Choose a school job',9:'Job application',10:'Job application',11:'Choose your work schedule',12:'Choose your work schedule',13:'Job application',14:'Job application',15:'Job earnings',16:'Job application',17:'Job application',18:'Job earnings',19:'Checkpoint: Week 3',20:'Choose what to sell',21:'Choose what to sell',22:'Plan your strategy',23:'GTA VI decision',24:'Your broken phone',25:'Your broken phone',26:'Authorised repair',27:'Authorised repair',28:'Local repair',29:'Local repair',48:'School job application guide',49:'School job application guide'};
  const money=n=>'$'+n;
  function restore(){try{const v=JSON.parse(sessionStorage.getItem(STORAGE));if(v&&Number.isInteger(v.slide)&&v.slide>=1&&v.slide<=49&&R.JOBS[v.job]&&['Official','Local','Broken'].includes(v.phone)&&v.sold&&['clothing','comics','games'].every(k=>typeof v.sold[k]==='boolean')&&typeof v.boughtGTA==='boolean')return Object.assign(R.initial(),v);}catch{}return R.initial();}
  function save(){try{sessionStorage.setItem(STORAGE,JSON.stringify(state));}catch{}}
  function announce(t){$('liveStatus').textContent=t;}
  function go(n){state.slide=n;save();render();}
  function start(){state=R.initial();state.slide=5;save();render();}
  function key(a){return a?.macro||('go:'+a?.go);}
  function same(a,b){return a&&b&&key(a)===key(b);}
  function showModal(title,body,actions){modalReturn=document.activeElement;$('modalTitle').textContent=title;const b=$('modalBody');b.replaceChildren();if(typeof body==='string'){const p=document.createElement('p');p.textContent=body;b.append(p);}else b.append(body);$('modalActions').replaceChildren();actions.forEach(([text,fn,secondary])=>{const b=document.createElement('button');b.type='button';b.textContent=text;if(secondary)b.className='secondary';b.onclick=()=>{$('modal').close();fn?.();};$('modalActions').append(b);});$('modal').showModal();}
  $('modal').addEventListener('close',()=>{$('modal').classList.remove('help-modal');$('modalTitle').removeAttribute('tabindex');if(modalReturn?.isConnected)modalReturn.focus();});
  function notEnough(cost,name){window.GameAudio?.warn();showModal('Not enough money',`You currently have ${money(R.available(state))}. ${name} costs ${money(cost)}. Choose a different option.`,[['Back to my choices']]);}
  function chooseJob(next){showModal('Choose the Job 1 schedule','Cleaning toilets pays $15 a day. Working on Tuesday and Thursday means missing football training.',[
    ['Work every weekday: $15 × 5 × 3 = $225',()=>{state.job='toiletsFull';go(next);}],
    ['Keep Tuesday and Thursday training: $15 × 3 × 3 = $135',()=>{state.job='toiletsTraining';go(next);}],
    ['Return to the activity',null,true]
  ]);}
  function continueWithWork(next){const final=state.slide>=30&&state.slide<=35;const names=final?['final']:['job','merch','week3'];const complete=names.every(k=>String(state.answers[k]??'').trim()!=='');
    if(complete){checkAnswers(false);go(next);return;}
    showModal('Calculate before continuing','Enter your calculations on this page, or show your working on your worksheet.',[['Return to my calculations',null],['I have worked on my worksheet — continue',()=>go(next),true]]);
  }
  const actions={
    ResetGameAndStart:start,
    GoCheckpoint:()=>go(19),GoGTA:()=>continueWithWork(23),
    ChooseJob1Only:()=>chooseJob(19),ChooseJob1Combined:()=>chooseJob(20),
    SetJob2Only:()=>{state.job='garbage';go(19);},SetJob2Combined:()=>{state.job='garbage';go(20);},
    SetJob3Only:()=>{state.job='books';go(19);},SetJob3Combined:()=>{state.job='books';go(20);},
    ToggleClothing:()=>toggle('clothing'),ToggleComics:()=>toggle('comics'),ToggleGames:()=>toggle('games'),
    ContinueFromMerch:()=>go(state.slide===21?7:19),
    BuyGTA:()=>{if(!R.buyGTA(state)){notEnough(150,'GTA VI');return;}save();render();},
    SkipGTA:()=>{state.boughtGTA=false;go(25);},
    GoOfficialGTA:()=>go(27),GoLocalGTA:()=>go(28),GoOfficialNoGTA:()=>go(26),GoLocalNoGTA:()=>go(29),
    FinalOfficialGTA:()=>repair('Official'),FinalOfficialNoGTA:()=>repair('Official'),
    FinalLocalGTA:()=>repair('Local'),FinalLocalNoGTA:()=>repair('Local'),
    FinalBrokenGTA:()=>repair('Broken'),FinalBrokenNoGTA:()=>repair('Broken'),
    ShowEnding:()=>{const ending=R.ending(state);state.ending=ending;continueWithWork(ending);}
  };
  function dispatch(a){if(a?.go)go(a.go);else if(a?.macro)actions[a.macro]?.();}
  function repair(phone){if(!R.repair(state,phone)){notEnough(R.COST[phone],phone==='Official'?'The authorised repair':'The local repair');return;}save();render();}
  function toggle(k){R.toggle(state,k);save();updateMerch();announce(`${k==='games'?'Old video games':k==='comics'?'Old comics':'Old clothing'} ${state.sold[k]?'selected':'deselected'}.`);}
  function updateMerch(){const map={ToggleClothing:'clothing',ToggleComics:'comics',ToggleGames:'games'};stage.querySelectorAll('[data-macro]').forEach(b=>{const k=map[b.dataset.macro];if(k){b.classList.toggle('selected',state.sold[k]);b.setAttribute('aria-pressed',String(state.sold[k]));}});const s=stage.querySelector('.merch-summary');if(s)s.textContent=`Selected sales: ${money(R.merchIncome(state))}`;}
  function plain(item){return(item.paragraphs||[]).map(p=>p.runs.map(r=>r.text).join('')).join('\n').trim();}
  function setBox(node,item){Object.assign(node.style,{left:item.x+'px',top:item.y+'px',width:item.w+'px',height:item.h+'px'});}
  function buttonFor(run,parentAction){const link=run.action&&(!same(run.action,parentAction)||reading);const n=document.createElement(link?'button':'span');n.textContent=link?run.text.trimEnd():run.text;if(link){n.type='button';n.className='run-link';n.onclick=()=>dispatch(run.action);n.dataset.action=key(run.action);if(run.action.macro)n.dataset.macro=run.action.macro;}
    Object.assign(n.style,{fontSize:run.font+'px',fontFamily:(run.family?.startsWith('+')?'Arial':run.family)+', Arial, sans-serif',color:run.color,fontWeight:run.bold?'700':'400',fontStyle:run.italic?'italic':'normal',textDecoration:run.underline?'underline':'none'});return n;}
  function renderText(item){const box=document.createElement('div');box.className='text-shape';setBox(box,item);box.dataset.shape=item.id;const padding=item.padding||[0,0,0,0];box.style.padding=padding.map(n=>n+'px').join(' ');box.style.justifyContent=({ctr:'center',b:'flex-end'}[item.anchor]||'flex-start');
    const content=document.createElement('div');content.className='shape-content';
    const paragraphs=[...(item.paragraphs||[])];while(paragraphs.length>1&&!paragraphs.at(-1).runs.some(r=>r.text.trim()))paragraphs.pop();
    for(const para of paragraphs){const p=document.createElement('p');p.className='paragraph'+(para.bullet?' bullet':'');const sizes=para.runs.filter(r=>r.text.trim()).map(r=>r.font||para.font),mx=sizes.length?Math.max(...sizes):para.font;if(mx>=50)p.classList.add('title');Object.assign(p.style,{textAlign:({ctr:'center',r:'right',just:'justify'}[para.align]||'left'),marginTop:para.before+'px',marginBottom:para.after+'px',lineHeight:String(para.line),paddingLeft:para.margin+'px',textIndent:(para.bullet?0:para.indent)+'px',fontSize:mx+'px',color:para.runs.find(r=>r.color)?.color||'#000'});p.style.setProperty('--bullet-offset',(para.margin+para.indent)+'px');if(!para.runs.length)p.style.minHeight=para.font*para.line+'px';
      let last=null;
      for(let ri=0;ri<para.runs.length;ri++){let run=para.runs[ri];if(ri===0)run={...run,text:run.text.trimStart()};if(ri===para.runs.length-1)run={...run,text:run.text.trimEnd()};if(run.text==='\n'){p.append(document.createElement('br'));last=null;continue;}
        // Merge consecutive hyperlink runs so one label has one focus target.
        if(last&&run.action&&same(last.action,run.action)&&!same(run.action,item.action)){const span=buttonFor({...run,action:null});last.node.append(span);}
        else{const n=buttonFor(run,item.action);p.append(n);last=run.action?{action:run.action,node:n}:null;}
      }
      content.append(p);
    }
    box.append(content);
    if(item.action){box.style.pointerEvents='none';const b=document.createElement('button');b.type='button';b.className='hotspot'+(item.paragraphs.some(p=>p.runs.some(r=>same(r.action,item.action)))?' has-text':'');setBox(b,item);b.dataset.action=key(item.action);b.setAttribute('aria-label',plain(item)||'Continue');b.textContent=plain(item)||'Continue';b.onclick=()=>dispatch(item.action);stage.append(b);box.querySelectorAll('span').forEach(n=>n.style.pointerEvents='none');}
    stage.append(box);
  }
  function fitText(){if(reading)return;for(const box of stage.querySelectorAll('.text-shape')){const c=box.querySelector('.shape-content'),pad=getComputedStyle(box);const avail=box.clientHeight-parseFloat(pad.paddingTop)-parseFloat(pad.paddingBottom);const width=box.clientWidth-parseFloat(pad.paddingLeft)-parseFloat(pad.paddingRight);c.style.transform='';c.style.width='100%';if(c.scrollHeight<=avail&&c.scrollWidth<=width)continue;let low=.1,high=1;for(let i=0;i<14;i++){const scale=(low+high)/2;c.style.width=(100/scale)+'%';if(c.scrollHeight*scale<=avail&&c.scrollWidth*scale<=width+.5)low=scale;else high=scale;}c.style.width=(100/low)+'%';c.style.transform=`scale(${low})`;
    }}
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function answerInput(k,label,parent){const row=node('label','',label+' $');const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.inputMode='numeric';input.dataset.answer=k;input.name=k;input.setAttribute('aria-label',label);input.value=state.answers[k]??'';input.oninput=()=>{state.answers[k]=input.value;delete state.checked[k];input.classList.remove('good','bad');save();};row.append(input);parent.append(row);return input;}
  function reference(){const list=node('ul','choice-list');list.append(node('li','',`School job: ${R.JOBS[state.job].name}${R.JOBS[state.job].working?' ('+R.JOBS[state.job].working+')':''}`));list.append(node('li','',`Items sold: ${['clothing','comics','games'].filter(k=>state.sold[k]).map(k=>({clothing:'Old clothing ($40)',comics:'Old comics ($25)',games:'Old video games ($60)'}[k])).join(', ')||'None'}`));list.append(node('li','',`Weekly money: $35. Week 3: 3 payments. Week 6: 6 payments.`));if(state.slide>=24&&state.slide!==48&&state.slide!==49){list.append(node('li','',`GTA VI: ${state.boughtGTA?'Purchased ($150)':'Not purchased ($0)'}`));if(state.slide>=30&&state.slide<=47)list.append(node('li','',`Phone: ${({Official:'Authorised repair ($80), one-year warranty',Local:'Local repair ($50), no warranty',Broken:'Unrepaired ($0)'}[state.phone])}`));}return list;}
  function addCalculation(final){const c=node('form','calculation'+(final?' final-calculation':''));c.onsubmit=e=>{e.preventDefault();checkAnswers();};
    if(!final){c.append(node('p','','Calculate your Week 3 balance before continuing.'));answerInput('job','Job income: daily pay × days worked × weeks',c);answerInput('merch','Merch income: add the items you sold',c);answerInput('week3','Week 3 balance: job + merch + (3 × $35)',c);}
    else{c.append(node('p','','Calculate your Week 6 balance before continuing.'));c.append(node('p','','Job + merch + (6 × $35) − GTA VI − phone repair'));answerInput('final','Week 6 balance',c);const l=node('label','','Show your working');const ta=document.createElement('textarea');ta.name='working';ta.setAttribute('aria-label','Show your working');ta.placeholder='Write your calculation here, or show it on your worksheet.';ta.value=state.working;ta.oninput=()=>{state.working=ta.value;save();};l.append(ta);c.append(l);}
    const bs=node('div','calc-buttons');const check=node('button','','Check my calculation');check.type='submit';const choices=node('button','secondary','Review my choices');choices.type='button';choices.onclick=()=>showModal('Your choices',reference(),[['Return to my calculations']]);bs.append(check,choices);c.append(bs);const feedback=node('p','calc-feedback');feedback.id='calcFeedback';feedback.setAttribute('role','status');c.append(feedback);stage.append(c);if((final?['final']:['job','merch','week3']).some(k=>k in state.checked))paintCheck(false);
  }
  function checkAnswers(announceResult=true){const expected=state.slide===19?{job:R.jobIncome(state),merch:R.merchIncome(state),week3:R.week3(state)}:{final:R.final(state)};let all=true,missing=false;for(const [k,v]of Object.entries(expected)){const value=String(state.answers[k]??'').trim();state.checked[k]=value!==''&&Number(value)===v;if(!value)missing=true;if(!state.checked[k])all=false;}save();paintCheck(announceResult,missing);if(announceResult)window.GameAudio?.feedback(all);return all;}
  function paintCheck(speak,missing=false){const inputs=[...stage.querySelectorAll('[data-answer]')];inputs.forEach(input=>{const k=input.dataset.answer;if(k in state.checked){input.classList.toggle('good',state.checked[k]);input.classList.toggle('bad',!state.checked[k]);input.setAttribute('aria-invalid',String(!state.checked[k]));}});const keys=inputs.map(n=>n.dataset.answer);const all=keys.every(k=>state.checked[k]);const text=all?'Your calculation is correct. Continue when you are ready.':missing?'Enter an amount in each box, then check again.':'Recheck the highlighted amounts. Use “Review my choices” to check the income and costs.';if($('calcFeedback'))$('calcFeedback').textContent=text;if(speak)announce(text);}
  function render(){const slide=DECK[state.slide-1];stage.replaceChildren();document.body.classList.toggle('reading',reading);$('readingBtn').setAttribute('aria-pressed',String(reading));$('sceneLabel').textContent=labels[state.slide]||(state.slide<=35?'Final financial position':`Ending ${state.slide-35}`);const bg=document.createElement('img');bg.className='slide-bg';bg.alt='';bg.src=`assets/slides/slide-${String(state.slide).padStart(2,'0')}.jpg`;bg.draggable=false;stage.append(bg);
    for(let item of slide.items){const t=plain(item);if(state.slide===19&&t.startsWith('Calculate your Week 3'))continue;if(state.slide>=30&&state.slide<=35&&(t.startsWith('Calculate your Week 6')||t==='Show your working first'))continue;
      if((state.slide===42||state.slide===43)&&t!=='Ending'){
        const positions=t.includes('Your friends')?[335,35,290,90,23]:t.includes('teammates')?[110,505,290,105,21]:t.includes('phone')?[1280,30,290,125,23]:[1090,760,445,60,24];
        item={...item,x:positions[0],y:positions[1],w:positions[2],h:positions[3],padding:[4,4,4,4],paragraphs:item.paragraphs.map(p=>({...p,before:0,after:0,font:positions[4],runs:p.runs.map(r=>({...r,font:positions[4]}))}))};
      }
      if((state.slide===11||state.slide===12)&&t.includes('The Principal decides')){
        const texts=['The Principal decides to grant you this job.','You work this job for 3 full weeks.','or','You work each week except Tuesday and Thursday.','$15 × days per week × 3 = $_____'];
        item={...item,x:755,y:150,w:795,h:370,padding:[10,10,10,10],paragraphs:texts.map(text=>({align:'l',before:0,after:23,line:1.15,margin:0,indent:0,bullet:false,font:32,runs:[{text,font:32,color:'#000000',family:'Arial'}]}))};
      }
      if(item.paragraphs)renderText(item);
      else if(item.action){const b=node('button','hotspot','Continue');b.type='button';setBox(b,item);b.dataset.action=key(item.action);const other=slide.items.find(o=>o!==item&&o.paragraphs&&o.paragraphs.some(p=>p.runs.some(r=>same(r.action,item.action))));const label=other?plain(other):'Press anywhere to start';b.setAttribute('aria-label',label);b.textContent=label;b.onclick=()=>dispatch(item.action);if(other){b.classList.add('has-text');b.tabIndex=-1;b.setAttribute('aria-hidden','true');}stage.append(b);}
    }
    if(state.slide===19)addCalculation(false);if(state.slide>=30&&state.slide<=35)addCalculation(true);
    if(state.slide===20||state.slide===21){stage.append(node('div','merch-summary'));updateMerch();}
    if(state.slide>=36&&state.slide<=47){const balance=R.final(state),boots=balance>=200;stage.append(node('div','ending-balance',boots?`Before boots: ${money(balance)} · After boots: ${money(balance-200)}`:`Balance: ${money(balance)} · Boots need $200`));const b=node('div','ending-actions');const play=node('button','','Play again');play.onclick=start;const review=node('button','','Review my decisions');review.onclick=showReview;b.append(play,review);stage.append(b);}
    $('stageHint').textContent=state.slide===19||(state.slide>=30&&state.slide<=35)?'Calculate here or on your worksheet. Checking your answer is optional.':state.slide>=36&&state.slide<=47?'Discuss how your choices affected the outcome.':'Click the choices in the picture. Use Tab and Enter to play with a keyboard.';
    resize();requestAnimationFrame(()=>{fitText();announce($('sceneLabel').textContent);});preload();
  }
  function preload(){const targets=new Set();for(const it of DECK[state.slide-1].items){if(it.action?.go)targets.add(it.action.go);for(const p of it.paragraphs||[])for(const r of p.runs)if(r.action?.go)targets.add(r.action.go);}if(state.slide<4)targets.add(state.slide+1);for(const n of targets){const im=new Image();im.src=`assets/slides/slide-${String(n).padStart(2,'0')}.jpg`;}}
  function resize(){if(reading){viewport.style.height='auto';stage.style.transform='none';return;}const scale=viewport.clientWidth/1600;viewport.style.height=(900*scale)+'px';stage.style.transform=`scale(${scale})`;}
  function showReview(){const body=node('div');body.append(reference());body.append(node('p','result-summary',`Week 6: ${money(R.jobIncome(state))} + ${money(R.merchIncome(state))} + $210 − ${money(state.boughtGTA?150:0)} − ${money(R.COST[state.phone])} = ${money(R.final(state))}.`));if(state.answers.final!==undefined)body.append(node('p','',`Your Week 6 answer: ${money(state.answers.final)}.`));if(state.working)body.append(node('p','',`Your working: ${state.working}`));body.append(node('p','','Which choice mattered most? What did you give up, and would you make the same decisions again?'));showModal('Review your decisions',body,[['Return to my ending']]);}
  $('helpBtn').onclick=()=>{
    $('modal').classList.add('help-modal');
    showModal('How to play',$('helpTemplate').content.cloneNode(true),[['Return to the game']]);
    // Start at the guide heading, rather than jumping to a bibliography link.
    $('modalTitle').setAttribute('tabindex','-1');$('modalTitle').focus();$('modalBody').scrollTop=0;
  };
  $('choicesBtn').onclick=()=>showModal('Your choices',reference(),[['Return to the activity']]);
  $('readingBtn').onclick=()=>{reading=!reading;render();};
  $('restartBtn').onclick=()=>showModal('Restart the activity?','This clears the choices and calculations in your current game.',[['Restart from the introduction',()=>{state=R.initial();save();render();}],['Keep playing',null,true]]);
  $('fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else showModal('Fullscreen','Use your browser’s fullscreen command, or switch to Reading view for a larger text layout.',[['Return to the activity']]);}catch{showModal('Fullscreen','Your browser did not allow fullscreen. You can continue playing in this window.',[['Return to the activity']]);}};
  window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);
  render();
})();
