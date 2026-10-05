(() => {
  'use strict';
  const $=id=>document.getElementById(id),music=$('backgroundMusic'),storage='commerce-audio-v1';
  let context=null,musicGain=null,source=null,active=false,starting=false,loadFailed=false;
  let settings={musicEnabled:true,soundEnabled:true,musicVolume:14,soundVolume:30};
  try{const saved=JSON.parse(localStorage.getItem(storage));if(saved){for(const k of['musicEnabled','soundEnabled'])if(typeof saved[k]==='boolean')settings[k]=saved[k];for(const k of['musicVolume','soundVolume'])if(Number.isFinite(saved[k]))settings[k]=Math.min(100,Math.max(0,saved[k]));}}catch{}
  const status=text=>{$('audioStatus').textContent=text;};
  const save=()=>{try{localStorage.setItem(storage,JSON.stringify(settings));}catch{}};
  function update(){
    $('musicBtn').textContent=!settings.musicEnabled?'Music: Off':loadFailed?'Music: Retry':music.paused?'Music: Start':'Music: On';
    $('musicBtn').setAttribute('aria-pressed',String(settings.musicEnabled&&!music.paused));
    $('soundBtn').textContent=settings.soundEnabled?'Sound: On':'Sound: Off';$('soundBtn').setAttribute('aria-pressed',String(settings.soundEnabled));
    $('musicVolume').value=settings.musicVolume;$('soundVolume').value=settings.soundVolume;
  }
  function ensureContext(){
    try{
      if(!context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;context=new C();
        // One persistent music source keeps playback and volume independent of scene rendering.
        // Local file origins cannot safely route media through Web Audio; use normal audio playback there.
        if(location.protocol!=='file:')try{source=context.createMediaElementSource(music);musicGain=context.createGain();source.connect(musicGain);musicGain.connect(context.destination);music.volume=1;}catch{musicGain=null;}
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
      applyVolume();return context;
    }catch{return null;}
  }
  function applyVolume(){const value=settings.musicVolume/100;if(musicGain&&context)musicGain.gain.setTargetAtTime(value,context.currentTime,.04);else music.volume=value;}
  function startMusic(){
    if(!active||!settings.musicEnabled||document.hidden||starting)return;
    ensureContext();if(loadFailed){music.load();loadFailed=false;}
    starting=true;
    try{const p=music.play();if(p&&typeof p.then==='function')p.then(()=>{starting=false;update();},()=>{starting=false;update();status('Music could not start. Use the Music button to try again.');});else{starting=false;update();}}catch{starting=false;update();}
  }
  function activate(){active=true;ensureContext();startMusic();}
  function tone(frequency,endFrequency,start,duration,amount=.14){
    if(!settings.soundEnabled||document.hidden)return;
    const c=ensureContext();if(!c)return;
    try{const oscillator=c.createOscillator(),gain=c.createGain(),now=c.currentTime+start;
      oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(endFrequency,now+duration);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,amount*settings.soundVolume/100),now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      oscillator.connect(gain);gain.connect(c.destination);oscillator.start(now);oscillator.stop(now+duration+.01);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    }catch{}
  }
  function click(){tone(760,540,0,.055,.18);}
  function select(selected){tone(selected?660:540,selected?920:400,0,.09,.17);}
  function feedback(correct){if(correct){tone(660,660,0,.09,.16);tone(880,880,.09,.13,.14);}else tone(340,280,0,.12,.14);}
  function warn(){tone(320,260,0,.11,.14);}
  // Capture before a click replaces the scene or changes its selected state.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');if(!button||button.disabled||button.id==='musicBtn'||button.id==='soundBtn')return;
    ensureContext();if(button.closest('#stage'))activate();
    if(button.dataset.macro?.startsWith('Toggle'))select(button.getAttribute('aria-pressed')!=='true');else click();
  },true);
  $('musicBtn').onclick=()=>{
    ensureContext();
    if(settings.musicEnabled&&!music.paused){settings.musicEnabled=false;music.pause();status('Background music off.');}
    else{settings.musicEnabled=true;active=true;startMusic();status('Background music enabled.');}
    save();update();
  };
  $('soundBtn').onclick=()=>{settings.soundEnabled=!settings.soundEnabled;save();update();if(settings.soundEnabled)click();status(settings.soundEnabled?'Sound effects on.':'Sound effects off.');};
  $('musicVolume').oninput=event=>{settings.musicVolume=Number(event.target.value);ensureContext();applyVolume();save();};
  $('soundVolume').oninput=event=>{settings.soundVolume=Number(event.target.value);save();};
  $('soundVolume').onchange=()=>click();
  music.addEventListener('play',()=>{loadFailed=false;update();});music.addEventListener('pause',update);
  music.addEventListener('error',()=>{loadFailed=true;starting=false;update();status('Music is unavailable. You can continue playing and use Music: Retry to try again.');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();context?.suspend().catch(()=>{});}else if(active){ensureContext();startMusic();}});
  window.addEventListener('pagehide',()=>music.pause());
  window.GameAudio={feedback,warn};applyVolume();update();
})();
