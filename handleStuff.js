import PocketBase from './node_modules/pocketbase/dist/pocketbase.es.mjs';

const pb = new PocketBase('http://nc.kjorda.com:8090');


const code = await pb.collection('code').create();
document.getElementById('code').innerText = 'Your group code: '+code.id;
localStorage.setItem('groupid', code.id);