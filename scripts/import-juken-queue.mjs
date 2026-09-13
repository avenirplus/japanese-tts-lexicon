import fs from 'node:fs';

const file=process.argv[2];
if(!file)throw new Error('queue file required');
const q=JSON.parse(fs.readFileSync(file,'utf8'));
const entries=q&&q.entries&&typeof q.entries==='object'?q.entries:{};
const target='data/custom/user-overrides.tsv';
const map=new Map();
for(const line of fs.readFileSync(target,'utf8').split(/\r?\n/)){
  if(!line||line.startsWith('#'))continue;
  const i=line.indexOf('\t');if(i<1)continue;
  const s=line.slice(0,i).trim(),r=line.slice(i+1).trim();
  if(s&&r)map.set(s,r);
}
for(const [surface,reading] of Object.entries(entries)){
  const s=String(surface||'').trim(),r=String(reading||'').trim();
  if(s&&r)map.set(s,r);
}
const rows=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'ja'));
fs.writeFileSync(target,'# surface\treading\n'+rows.map(([s,r])=>`${s}\t${r}`).join('\n')+'\n');
console.log(`Imported ${Object.keys(entries).length} queued readings; overrides now ${rows.length}.`);
