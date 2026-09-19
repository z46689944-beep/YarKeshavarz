(()=>{
const KEY='yk-anon-user-id-v1', WORKER='https://yarkeshavarz-ai-v4.z46689944.workers.dev';
function id(){let x=localStorage.getItem(KEY);if(!x){x=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem(KEY,x)}return x}
async function ping(){try{await fetch(WORKER+'/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:id()})})}catch{}}
window.YKPresence={ping};
ping();setInterval(ping,5*60*1000);
})();
