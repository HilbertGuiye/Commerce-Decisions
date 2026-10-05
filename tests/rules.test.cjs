const assert=require('node:assert/strict');
const R=require('../engine.js');
const jobAmounts={none:0,toiletsFull:225,toiletsTraining:135,garbage:150,books:120};
let cases=0,blockedPurchases=0,blockedRepairs=0;const endings=new Set();
for(const[job,income]of Object.entries(jobAmounts))for(let mask=0;mask<8;mask++)for(const buy of[false,true])for(const phone of['Official','Local','Broken']){
 const s=R.initial();s.job=job;s.sold={clothing:!!(mask&1),comics:!!(mask&2),games:!!(mask&4)};
 const merch=(mask&1?40:0)+(mask&2?25:0)+(mask&4?60:0),week3=income+merch+105;
 assert.equal(R.jobIncome(s),income);assert.equal(R.merchIncome(s),merch);assert.equal(R.week3(s),week3);
 if(buy){if(week3<150){assert.equal(R.buyGTA(s),false);assert.equal(s.boughtGTA,false);blockedPurchases++;continue;}assert.equal(R.buyGTA(s),true);}else s.slide=25;
 const repairCost={Official:80,Local:50,Broken:0}[phone],available=week3-(buy?150:0);
 if(available<repairCost){assert.equal(R.repair(s,phone),false);blockedRepairs++;continue;}
 assert.equal(R.repair(s,phone),true);const final=income+merch+210-(buy?150:0)-repairCost;assert.equal(R.final(s),final);
 const offset={Official:0,Local:1,Broken:2}[phone];assert.equal(R.ending(s),(final>=200?(buy?36:39):(buy?42:45))+offset);endings.add(R.ending(s));cases++;
}
assert.deepEqual([...endings].sort((a,b)=>a-b),[36,37,38,39,40,41,42,43,44,45,46]);
const s=R.initial();assert.equal(R.final(s),210);assert.equal(R.ending(s),41);assert.equal(R.buyGTA(s),false);
R.toggle(s,'clothing');assert.equal(R.merchIncome(s),40);R.toggle(s,'clothing');assert.equal(R.merchIncome(s),0);
const a=R.initial();a.sold={clothing:true,comics:true,games:false};assert.equal(R.week3(a),170);assert.equal(R.buyGTA(a),true);assert.equal(R.repair(a,'Local'),false);assert.equal(a.phone,'Broken');assert.equal(R.repair(a,'Broken'),true);assert.equal(R.final(a),125);assert.equal(R.ending(a),44);
console.log(JSON.stringify({validCases:cases,blockedPurchases,blockedRepairs,reachableEndingSlides:[...endings].sort((a,b)=>a-b),unreachableUnderOriginalRules:47}));
