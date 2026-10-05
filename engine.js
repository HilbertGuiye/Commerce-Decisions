(function (root) {
  'use strict';
  const COST = Object.freeze({boots:200,gta:150,Official:80,Local:50,Broken:0});
  const JOBS = Object.freeze({none:{name:'No school job',income:0,working:''},toiletsFull:{name:'Toilets: every weekday',income:225,working:'$15 × 5 days × 3 weeks'},toiletsTraining:{name:'Toilets: keep training days',income:135,working:'$15 × 3 days × 3 weeks'},garbage:{name:'Garbage collection',income:150,working:'$10 × 5 days × 3 weeks'},books:{name:'Book hire',income:120,working:'$30 × 2 days × 2 weekends'}});
  function initial(){return {slide:1,job:'none',sold:{clothing:false,comics:false,games:false},boughtGTA:false,phone:'Broken',answers:{},working:'',checked:{},ending:0};}
  function jobIncome(s){return JOBS[s.job].income;}
  function merchIncome(s){return (s.sold.clothing?40:0)+(s.sold.comics?25:0)+(s.sold.games?60:0);}
  function week3(s){return jobIncome(s)+merchIncome(s)+105;}
  function available(s){return week3(s)-(s.boughtGTA?COST.gta:0);}
  function final(s){return jobIncome(s)+merchIncome(s)+210-(s.boughtGTA?COST.gta:0)-COST[s.phone];}
  function ending(s){const able=final(s)>=COST.boots;const base=able?(s.boughtGTA?36:39):(s.boughtGTA?42:45);return base+({Official:0,Local:1,Broken:2}[s.phone]);}
  function toggle(s,key){s.sold[key]=!s.sold[key];s.checked={};s.answers={};}
  function buyGTA(s){if(week3(s)<COST.gta)return false;s.boughtGTA=true;s.slide=24;return true;}
  function repair(s,phone){if(available(s)<COST[phone])return false;s.phone=phone;s.slide=s.boughtGTA?({Official:30,Broken:31,Local:32}[phone]):({Official:33,Broken:34,Local:35}[phone]);return true;}
  const api={COST,JOBS,initial,jobIncome,merchIncome,week3,available,final,ending,toggle,buyGTA,repair};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GameRules=api;
})(typeof window!=='undefined'?window:globalThis);
