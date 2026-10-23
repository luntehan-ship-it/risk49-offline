import {optimize} from './engine.js';
self.onmessage=({data})=>{try{const result=optimize(data.b,data.settings,p=>postMessage({progress:p}));postMessage({result});}catch(e){postMessage({error:e.message});}};
