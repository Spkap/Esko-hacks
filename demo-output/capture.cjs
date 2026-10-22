// Real visible Chrome footage. No app source or sample results are modified.
const {chromium}=require('../frontend/node_modules/@playwright/test');
const fs=require('fs'); const path=require('path');
const {execFileSync}=require('child_process');
const ROOT=__dirname, BASE=process.env.TARGET_URL||'http://127.0.0.1:3000';
const scenes=JSON.parse(fs.readFileSync(path.join(ROOT,'scenes.json')));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const previous=process.env.RESUME_CAPTURE==='1'&&fs.existsSync(path.join(ROOT,'capture-log.json'))?JSON.parse(fs.readFileSync(path.join(ROOT,'capture-log.json'))):{shots:[],errors:[]};
const logs=previous.shots, errors=previous.errors;
let browser;
async function go(p,route){await p.goto(BASE+route);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);await pause(350);}
async function scroll(p,y){await p.evaluate(y=>window.scrollTo({top:y,behavior:'smooth'}),y);await pause(900);}
async function move(p,l){await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();if(b)await p.mouse.move(b.x+b.width*.55,b.y+b.height*.5,{steps:25});await pause(450);}
async function click(p,l){await move(p,l);await l.click();}
async function readyReview(p,id='mori-strawberry'){await go(p,'/checks/'+id);await p.getByTestId('assessment-summary').waitFor();}
async function setup(p,id='mori-strawberry'){await go(p,'/checks/new?sample='+id);await p.getByRole('button',{name:'Run simulated check'}).waitFor();}
async function run(p,id){await click(p,p.getByRole('button',{name:'Run simulated check'}));await p.waitForURL('**/checks/'+id);await p.getByTestId('assessment-summary').waitFor();}
const actions={
 '02-landing':{prep:p=>go(p,'/'),act:async p=>{await pause(2600);await move(p,p.getByRole('link',{name:'Try sample check'}).first());}},
 '03-dashboard':{prep:p=>go(p,'/dashboard'),act:async p=>{await pause(1800);const l=p.getByLabel('Search reviews');await click(p,l);await l.pressSequentially('MORI',{delay:170});await pause(2200);await l.fill('');await pause(700);await p.mouse.move(900,560,{steps:20});}},
 '04-setup':{prep:p=>go(p,'/checks/new'),act:async p=>{await pause(1000);await click(p,p.getByRole('button',{name:'Start with sample files'}));await pause(2000);await scroll(p,320);}},
 '05-run':{prep:async p=>{await setup(p);await p.getByRole('button',{name:'Run simulated check'}).scrollIntoViewIfNeeded();await pause(600)},act:async p=>{await pause(1000);await run(p,'mori-strawberry');await scroll(p,200);}},
 '06-evidence':{prep:async p=>{await readyReview(p);await scroll(p,365)},act:async p=>{await pause(2900);await scroll(p,670);await pause(4500);await move(p,p.getByRole('link',{name:/Open source document/}));}},
 '07-nuance':{prep:async p=>{await readyReview(p);await scroll(p,300)},act:async p=>{await click(p,p.locator('.finding-row').filter({hasText:'Declared net quantity matches'}));await pause(3300);await click(p,p.locator('.finding-row').filter({hasText:'Printed type size needs'}));await scroll(p,550);}},
 '08-decision':{prep:async p=>{await readyReview(p);await p.getByRole('button',{name:'Acknowledge',exact:true}).scrollIntoViewIfNeeded();await pause(600)},act:async p=>{await pause(1800);await click(p,p.getByRole('button',{name:'Acknowledge',exact:true}));await pause(2500);await p.reload();await p.getByText('Acknowledged',{exact:true}).waitFor();await p.getByTestId('decision-status').scrollIntoViewIfNeeded();await pause(800);}},
 '09-correction':{prep:async p=>{await readyReview(p);await p.getByRole('link',{name:'Compare the corrected sample'}).scrollIntoViewIfNeeded();await pause(500)},act:async p=>{await pause(900);await click(p,p.getByRole('link',{name:'Compare the corrected sample'}));await p.getByRole('button',{name:'Run simulated check'}).waitFor();await pause(1300);await run(p,'mori-corrected');await pause(1500);await scroll(p,330);}},
 '10-report':{prep:async p=>{await readyReview(p,'mori-corrected')},act:async p=>{await pause(600);await click(p,p.getByRole('link',{name:'View report'}));await p.getByRole('heading',{name:'Review report'}).waitFor();await pause(3500);await scroll(p,530);await pause(3000);await p.getByRole('heading',{name:'Outside this review'}).scrollIntoViewIfNeeded();await pause(1000);}},
 '11-organizer':{prep:async p=>{await setup(p,'dancingfish-granola')},act:async p=>{await pause(2000);await run(p,'dancingfish-granola');await p.locator('canvas[data-rendered="true"]').waitFor();await pause(2200);await scroll(p,420);await pause(2400);await scroll(p,720);}},
};
async function capture(s){
 const context=await browser.newContext({viewport:{width:1440,height:720},recordVideo:{dir:path.join(ROOT,'raw'),size:{width:1440,height:720}},deviceScaleFactor:1});
 const p=await context.newPage();p.on('pageerror',e=>errors.push({scene:s.id,message:e.message}));
 await p.addStyleTag({content:''}).catch(()=>{});
 const a=actions[s.id];await a.prep(p);await p.mouse.move(1400,680);
 const start=Date.now();console.log('CAPTURING',s.id);
 await a.act(p);const elapsed=(Date.now()-start)/1000;
 if(elapsed>s.duration-.4) s.duration=elapsed+1.3;
 await pause(Math.max(0,s.duration*1000-(Date.now()-start)));
 await p.screenshot({path:path.join(ROOT,'frames',s.id+'.png')});
 await pause(500);const video=p.video();await context.close();const raw=await video.path();
 const total=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',raw]));
 logs.push({id:s.id,file:path.relative(ROOT,raw),start:Math.max(0,total-s.duration-.5),duration:s.duration});
 fs.writeFileSync(path.join(ROOT,'capture-log.json'),JSON.stringify({shots:logs,errors},null,2));
}
(async()=>{browser=await chromium.launch({channel:'chrome',headless:false,args:['--hide-scrollbars','--disable-features=Translate']});
try{for(const s of scenes.filter(s=>actions[s.id]&&!logs.some(l=>l.id===s.id))) await capture(s);fs.writeFileSync(path.join(ROOT,'scenes.json'),JSON.stringify(scenes,null,2)+'\n');}
finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
