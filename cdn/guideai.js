var Ha=Object.defineProperty;var Na=(re,w,ne)=>w in re?Ha(re,w,{enumerable:!0,configurable:!0,writable:!0,value:ne}):re[w]=ne;var x=(re,w,ne)=>Na(re,typeof w!="symbol"?w+"":w,ne);(function(){"use strict";var _i;const w={cdnUrl:(_i=document.currentScript)==null?void 0:_i.src,apiUrl:"https://api.guideai.com",idleTimeout:2e4,sessionTimeoutMs:30*6e4,geolocationMode:"off",chipDismissSeconds:300,batchSize:50,batchIntervalMs:3e4,bubblePosition:"bottom-right",bubbleLabelText:"Help",bubbleIcon:"robot",bubbleImageUrl:"",bubbleDrift:{spring:.005,damping:.92,minTargetInterval:4e3,maxTargetInterval:8e3,enabled:!0},bubbleMode:"drift",bubbleCrawl:{speed:40,climbWalls:!0,cornerPauseMs:1500,persistentSpeech:!0,messages:["Need help? Click me!","I can guide you around.","Try asking me anything!"],messageIntervalMs:8e3},widgetMode:"guide",theme:{},feedbackPromptDelayMs:3e4,feedbackPromptMinPageViews:2};function ne(n){const e=n.getAttribute("data-site-id")??"",t=n.getAttribute("data-token")??"";if(!e||!t)throw new Error("[GuideAI] Missing required data-site-id or data-token on script tag.");return{siteId:e,token:t,cdnUrl:n.getAttribute("data-cdn-url")??w.cdnUrl,apiUrl:n.getAttribute("data-api-url")??w.apiUrl,idleTimeout:parseInt(n.getAttribute("data-idle-timeout")??"",10)||w.idleTimeout,sessionTimeoutMs:parseInt(n.getAttribute("data-session-timeout-ms")??"",10)||w.sessionTimeoutMs,geolocationMode:n.getAttribute("data-geolocation")??w.geolocationMode,chipDismissSeconds:parseInt(n.getAttribute("data-chip-dismiss-seconds")??"",10)||w.chipDismissSeconds,batchSize:parseInt(n.getAttribute("data-batch-size")??"",10)||w.batchSize,batchIntervalMs:parseInt(n.getAttribute("data-batch-interval-ms")??"",10)||w.batchIntervalMs,autoAdvanceOnTargetClick:n.getAttribute("data-auto-advance-on-target-click")!=="false",guidesEnabled:n.getAttribute("data-guides-enabled")!=="false",bubbleEnabled:n.getAttribute("data-bubble-enabled")!=="false",bubblePosition:n.getAttribute("data-bubble-position")??w.bubblePosition,bubbleLabelText:n.getAttribute("data-bubble-label")??w.bubbleLabelText,bubbleIcon:n.getAttribute("data-bubble-icon")??w.bubbleIcon,bubbleImageUrl:n.getAttribute("data-bubble-image")??w.bubbleImageUrl,bubbleDrift:{...w.bubbleDrift},bubbleMode:n.getAttribute("data-bubble-mode")??w.bubbleMode,bubbleCrawl:{...w.bubbleCrawl},widgetMode:n.getAttribute("data-widget-mode")??w.widgetMode,theme:{...w.theme},recordingEnabled:n.getAttribute("data-recording")==="true",feedbackAutoPromptEnabled:n.getAttribute("data-feedback-auto-prompt")!=="false",feedbackPromptDelayMs:parseInt(n.getAttribute("data-feedback-prompt-delay-ms")??"",10)||w.feedbackPromptDelayMs,feedbackPromptMinPageViews:parseInt(n.getAttribute("data-feedback-prompt-min-pageviews")??"",10)||w.feedbackPromptMinPageViews,extensionMode:n.getAttribute("data-extension-mode")==="true"}}class ht{constructor(e,t){this.crypto=null,this.baseUrl=e.replace(/\/+$/,""),this.token=t}setCryptoManager(e){this.crypto=e}headers(){return{"Content-Type":"application/json","X-API-Key":this.token}}async get(e){const t=`${this.baseUrl}${e}`,i=await fetch(t,{method:"GET",headers:this.headers()});if(!i.ok)throw new Error(`[GuideAI] GET ${e} failed: ${i.status}`);return i.json()}async post(e,t){var o;const i=`${this.baseUrl}${e}`;let r;if(t!==void 0&&((o=this.crypto)!=null&&o.isReady())){const a=this.crypto.encrypt(t);r=JSON.stringify(a||t)}else t!==void 0&&(r=JSON.stringify(t));const s=await fetch(i,{method:"POST",headers:this.headers(),body:r});if(!s.ok)throw new Error(`[GuideAI] POST ${e} failed: ${s.status}`);return s.json()}postKeepalive(e,t){var s;const i=`${this.baseUrl}${e}`;let r;if((s=this.crypto)!=null&&s.isReady()){const o=this.crypto.encrypt(t);r=JSON.stringify(o||t)}else r=JSON.stringify(t);try{fetch(i,{method:"POST",headers:this.headers(),body:r,keepalive:!0})}catch{}}}const gt="guideai-kb-v1";class Ai{constructor(){this.cacheAvailable=typeof caches<"u"}async get(e){if(!this.cacheAvailable)return null;try{return await(await caches.open(gt)).match(e)??null}catch{return null}}async put(e,t){if(this.cacheAvailable)try{await(await caches.open(gt)).put(e,t.clone())}catch{}}async getOrFetch(e,t){const i=await this.get(e),r=async()=>{try{const s=await fetch(e,{method:"GET",headers:t});return s.ok?(await this.put(e,s.clone()),s):null}catch{return null}};return i?(r(),i):r()}}class Li{constructor(e,t,i){this.bubbleSettings=null,this.helpSupportEnabled=!1,this.widgetMode=null,this.bubbleMode=null,this.url=`${e.replace(/\/+$/,"")}/cdn/knowledge-base/${t}`,this.token=i,this.cache=new Ai}async load(){try{const e={Accept:"application/json","X-API-Key":this.token},t=await this.cache.getOrFetch(this.url,e);if(!t)return null;const i=await t.json();return i.bubble_settings&&typeof i.bubble_settings=="object"&&(this.bubbleSettings=i.bubble_settings,(this.bubbleSettings.mode==="crawl"||this.bubbleSettings.mode==="drift")&&(this.bubbleMode=this.bubbleSettings.mode)),i.help_support_enabled&&(this.helpSupportEnabled=!0),i.widget_mode&&["guide","support","combined"].includes(i.widget_mode)&&(this.widgetMode=i.widget_mode),this.normalize(i)}catch(e){return typeof console<"u"&&console.warn("[GuideAI] Failed to load knowledge base:",e),null}}normalize(e){const t=e.elements??[],i=e.routes??[];return{id:e.id??"",site_id:e.site_id??"",version:e.version??1,framework:e.framework??"",scanned_at:e.scanned_at??"",routes:i.map(r=>({path:r.path??"",page_title:r.page_title,component_name:r.component_name,source_file:r.source_file,dynamic_segments:r.dynamic_segments??[],auth_required:r.auth_required??!1,headings:r.headings??[]})),elements:t.map((r,s)=>{var o,a,l,c;return{id:r.id??`el_${s}`,route_path:r.route_path??r.route??"",tag:r.tag??"",text:r.text,aria_label:r.aria_label,placeholder:(o=r.attributes)==null?void 0:o.placeholder,name:(a=r.attributes)==null?void 0:a.name,data_guideai:(l=r.attributes)==null?void 0:l["data-guideai"],data_testid:(c=r.attributes)==null?void 0:c["data-testid"],fingerprint:r.fingerprint??{tier1_stable:{score:0},tier2_text:{variants:[],score:0},tier3_structural:{tag:r.tag??"",dom_depth:0,score:0},tier4_context:{score:0},tier5_position:{score:0},total_score:0}}})}}}class Ii{constructor(e,t,i){this.queue=[],this.flushTimer=null,this.unloadHandler=null,this.visibilityHandler=null,this.sender=e,this.batchSize=t,this.batchIntervalMs=i,this.flushTimer=setInterval(()=>this.flush(),this.batchIntervalMs),this.unloadHandler=()=>this.flushBeacon(),window.addEventListener("beforeunload",this.unloadHandler),this.visibilityHandler=()=>{document.visibilityState==="hidden"&&this.flushBeacon()},document.addEventListener("visibilitychange",this.visibilityHandler)}push(e){this.queue.push(e),this.queue.length>=this.batchSize&&this.flush()}flush(){if(this.queue.length===0)return;const e=this.queue.splice(0);this.sender.send(e).catch(()=>{this.queue.unshift(...e)})}flushBeacon(){if(this.queue.length===0)return;const e=this.queue.splice(0);this.sender.sendKeepalive(e)}destroy(){this.flushTimer&&(clearInterval(this.flushTimer),this.flushTimer=null),this.unloadHandler&&(window.removeEventListener("beforeunload",this.unloadHandler),this.unloadHandler=null),this.visibilityHandler&&(document.removeEventListener("visibilitychange",this.visibilityHandler),this.visibilityHandler=null)}}const ce="[REDACTED]",Mi=[{regex:/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,7}\b/g,replacement:ce},{regex:/\b\d{3}-\d{2}-\d{4}\b/g,replacement:ce},{regex:/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,replacement:ce},{regex:/\b\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,replacement:ce}],Pi=["password","passwd","secret","token","api_key","apikey","api-key","credit_card","card_number","card-number","cvv","cvc","ccv","ssn","social_security","pin"],Ri=new Set(["email","full_name","name","phone"]);function ft(n){if(!n)return n;let e=n;for(const{regex:t,replacement:i}of Mi)e=e.replace(t,i);return e}function de(n){const e={...n};for(const t of Object.keys(e)){const i=t.toLowerCase();if(Pi.some(s=>i.includes(s))){e[t]=ce;continue}const r=e[t];typeof r=="string"?Ri.has(i)?e[t]=r:e[t]=ft(r):Array.isArray(r)?e[t]=r.map(s=>typeof s=="string"?ft(s):s&&typeof s=="object"&&!Array.isArray(s)?de(s):s):r&&typeof r=="object"&&!Array.isArray(r)&&(e[t]=de(r))}return e}const Hi="guideai_anon_id_";function Ni(n){const e=Hi+n;try{let t=localStorage.getItem(e);return t||(t=pt(),localStorage.setItem(e,t)),t}catch{return pt()}}function pt(){return typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,n=>{const e=Math.random()*16|0;return(n==="x"?e:e&3|8).toString(16)})}function $i(n){const e=navigator.userAgent||"",{browser:t,version:i}=Di(e),r=Oi(e),s=Bi(),o=`guideai_visits_${n}`,a=`guideai_first_visit_${n}`;let l=1,c=!1,d;try{const g=localStorage.getItem(o);g&&(l=(parseInt(g,10)||0)+1,c=!0),localStorage.setItem(o,String(l)),d=localStorage.getItem(a)||void 0,d||(d=new Date().toISOString(),localStorage.setItem(a,d))}catch{}let u,h,p;try{const g=navigator;g.connection&&(u=g.connection.effectiveType,h=g.connection.downlink,p=g.connection.rtt)}catch{}let m="";try{m=Intl.DateTimeFormat().resolvedOptions().timeZone}catch{}const f=zi();return{browser:t,browser_version:i,os:r,device_type:s,screen_width:screen.width||0,screen_height:screen.height||0,viewport_width:window.innerWidth||0,viewport_height:window.innerHeight||0,pixel_ratio:window.devicePixelRatio||1,device_memory:navigator.deviceMemory,hardware_concurrency:navigator.hardwareConcurrency,touch_capable:"ontouchstart"in window||navigator.maxTouchPoints>0,connection_type:u,connection_downlink:h,connection_rtt:p,timezone:m,language:navigator.language||"",languages:Array.from(navigator.languages||[]),is_returning:c,session_number:l,first_visit_at:d,referrer:document.referrer||"",entry_url:location.href,platform_hints:f}}function Di(n){const e=[["Edge",/Edg[e/](\d+[\d.]*)/],["Opera",/OPR\/(\d+[\d.]*)/],["Chrome",/Chrome\/(\d+[\d.]*)/],["Firefox",/Firefox\/(\d+[\d.]*)/],["Safari",/Version\/(\d+[\d.]*).*Safari/],["IE",/(?:MSIE |Trident.*rv:)(\d+[\d.]*)/]];for(const[t,i]of e){const r=n.match(i);if(r)return{browser:t,version:r[1]}}return{browser:"Unknown",version:""}}function Oi(n){return/Windows/.test(n)?"Windows":/Mac OS X|macOS/.test(n)?"macOS":/CrOS/.test(n)?"ChromeOS":/Linux/.test(n)?"Linux":/Android/.test(n)?"Android":/iPhone|iPad|iPod/.test(n)?"iOS":"Unknown"}function Bi(){const n=navigator.userAgent||"",e=navigator.maxTouchPoints||0,t=screen.width||window.innerWidth;return/iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini/i.test(n)?"mobile":/iPad|Android(?!.*Mobile)|Tablet/i.test(n)||e>0&&t>=768?"tablet":(e===0||t>1024,"desktop")}function zi(){const n=[],e=window;try{(e.ethereum||e.web3||e.solana||e.phantom)&&n.push("web3"),e.M&&typeof e.M=="object"&&e.M.cfg&&n.push("moodle"),(e.$A||e.sforce||document.querySelector("lightning-app, force-aloha-page"))&&n.push("salesforce"),(document.querySelector("[data-reactroot], [data-reactid]")||e.__REACT_DEVTOOLS_GLOBAL_HOOK__)&&n.push("react"),(document.querySelector("[ng-app], [data-ng-app], [ng-version]")||e.ng)&&n.push("angular"),(document.querySelector("[data-v-]")||e.__VUE__)&&n.push("vue"),(e.wp||document.querySelector('meta[name="generator"][content*="WordPress"]'))&&n.push("wordpress"),e.Shopify&&n.push("shopify"),e.matchMedia&&e.matchMedia("(display-mode: standalone)").matches&&n.push("pwa")}catch{}return n}const mt="guideai_session_";function se(){return new Date().toISOString()}function bt(n){if(!n)return null;try{const e=JSON.parse(n);if(e&&typeof e.id=="string"&&typeof e.last_seen_at=="string")return{id:e.id,started_at:typeof e.started_at=="string"?e.started_at:e.last_seen_at,last_seen_at:e.last_seen_at}}catch{return{id:n,started_at:se(),last_seen_at:se()}}return null}function yt(){return typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,n=>{const e=Math.random()*16|0;return(n==="x"?e:e&3|8).toString(16)})}function Fi(n,e){const t=Date.parse(n.last_seen_at);return Number.isFinite(t)?Date.now()-t>e:!0}function Gi(n,e){const t=mt+n;try{const i=bt(sessionStorage.getItem(t));if(i&&!Fi(i,e)){const s={...i,last_seen_at:se()};return sessionStorage.setItem(t,JSON.stringify(s)),{id:s.id,isNew:!1}}const r={id:yt(),started_at:se(),last_seen_at:se()};return sessionStorage.setItem(t,JSON.stringify(r)),{id:r.id,isNew:!0}}catch{return{id:yt(),isNew:!0}}}function qi(n){const e=mt+n;try{const t=bt(sessionStorage.getItem(e));if(!t)return;sessionStorage.setItem(e,JSON.stringify({...t,last_seen_at:se()}))}catch{}}const vt="guideai_geo_",Ui=1440*6e4;function xt(){return new Date().toISOString()}function Vi(n){if(!n)return!1;const e=Date.parse(n);return Number.isFinite(e)?Date.now()-e<Ui:!1}function wt(n){try{const e=sessionStorage.getItem(vt+n);if(!e)return null;const t=JSON.parse(e);return typeof t.geo_lat!="number"||typeof t.geo_lng!="number"||!Vi(t.geo_captured_at)?null:{geo_lat:t.geo_lat,geo_lng:t.geo_lng,geo_accuracy_m:typeof t.geo_accuracy_m=="number"?t.geo_accuracy_m:void 0,geo_captured_at:t.geo_captured_at??xt(),geo_source:"browser"}}catch{return null}}function Wi(n,e){try{sessionStorage.setItem(vt+n,JSON.stringify(e))}catch{}}async function ji(){try{const n=navigator.permissions;return n!=null&&n.query?(await n.query({name:"geolocation"})).state??"unknown":"unknown"}catch{return"unknown"}}function Ki(n=2e3){return new Promise((e,t)=>{if(!navigator.geolocation)return t(new Error("Geolocation unavailable"));navigator.geolocation.getCurrentPosition(e,t,{enableHighAccuracy:!1,timeout:n,maximumAge:10*6e4})})}async function Yi(n,e){if(e==="off")return null;const t=wt(n);if(t)return t;if(!navigator.geolocation)return null;const i=await ji();if(e==="granted-only"&&i!=="granted"||i==="denied")return null;try{const r=await Ki(),s={geo_lat:r.coords.latitude,geo_lng:r.coords.longitude,geo_accuracy_m:r.coords.accuracy,geo_captured_at:xt(),geo_source:"browser"};return Wi(n,s),s}catch{return null}}const D=160,Xi=200,xe=180;function Ji(){const n=location.pathname||"/",e=location.search||"",t=location.hash||"";return{page_title:L(document.title,D)||void 0,pathname:n,search:e||void 0,hash:t||void 0,url_origin:location.origin||void 0,url_host:location.host||void 0,referrer_host:Qi(),viewport_width:window.innerWidth||void 0,viewport_height:window.innerHeight||void 0,screen_width:screen.width||void 0,screen_height:screen.height||void 0,scroll_x:Math.round(window.scrollX||0),scroll_y:Math.round(window.scrollY||0),document_lang:document.documentElement.lang||void 0,platform_hints:Zi()}}function oe(n){if(!n||!(n instanceof Element))return{};const e=n,i=er(e)||e,r=i.closest("form");return{element_text:L(tr(i),D)||void 0,element_tag:i.tagName.toLowerCase(),metadata:cr({element_id:i.id||void 0,element_class:ar(i.className),element_role:i.getAttribute("role")||void 0,element_href:or(i),element_name:i.getAttribute("name")||void 0,element_type:i.getAttribute("type")||void 0,element_aria_label:L(i.getAttribute("aria-label")||"",D)||void 0,element_placeholder:L(i.getAttribute("placeholder")||"",D)||void 0,element_data_guideai:i.getAttribute("data-guideai")||void 0,element_data_testid:i.getAttribute("data-testid")||i.getAttribute("data-test-id")||void 0,element_selector_hint:lr(i),parent_text:L(ir(i),D)||void 0,nearest_heading:L(rr(i),D)||void 0,section_title:L(nr(i),D)||void 0,form_id:(r==null?void 0:r.id)||void 0,form_name:(r==null?void 0:r.getAttribute("name"))||void 0,form_action:kt((r==null?void 0:r.getAttribute("action"))||""),input_label:L(sr(i),D)||void 0})}}function Qi(){if(document.referrer)try{return new URL(document.referrer).host||void 0}catch{return}}function Zi(){const n=[],e=window;try{(e.ethereum||e.web3||e.solana||e.phantom)&&n.push("web3"),e.M&&typeof e.M=="object"&&e.M.cfg&&n.push("moodle"),(e.$A||e.sforce||document.querySelector("lightning-app, force-aloha-page"))&&n.push("salesforce"),(e.__REACT_DEVTOOLS_GLOBAL_HOOK__||document.querySelector("[data-reactroot], [data-reactid]"))&&n.push("react"),(e.ng||document.querySelector("[ng-app], [data-ng-app], [ng-version]"))&&n.push("angular"),(e.__VUE__||document.querySelector("[data-v-]"))&&n.push("vue"),e.Shopify&&n.push("shopify"),(e.wp||document.querySelector('meta[name="generator"][content*="WordPress"]'))&&n.push("wordpress")}catch{return[]}return n.slice(0,6)}function er(n){let e=n;for(let t=0;e&&t<5;t++){const i=e.tagName.toLowerCase(),r=e.getAttribute("role");if(["a","button","input","select","textarea","summary"].includes(i)||r==="button"||r==="link"||r==="tab"||r==="menuitem"||e.onclick||e.getAttribute("tabindex")!==null)return e;e=e.parentElement}return null}function tr(n){return(n.getAttribute("aria-label")||n.getAttribute("placeholder")||n.innerText||n.textContent||"").trim().replace(/\s+/g," ")}function ir(n){const e=n.parentElement;return!e||e===document.body?"":(e.textContent||"").trim().replace(/\s+/g," ")}function rr(n){var r,s;let e=n;for(let o=0;e&&o<5;o++){const a=e.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6");if((r=a==null?void 0:a.textContent)!=null&&r.trim())return a.textContent.trim().replace(/\s+/g," ");e=e.parentElement}const t=n.closest('section, article, [role="region"], [role="tabpanel"]'),i=t==null?void 0:t.querySelector("h1, h2, h3, h4, h5, h6");return((s=i==null?void 0:i.textContent)==null?void 0:s.trim().replace(/\s+/g," "))||""}function nr(n){var i;const e=n.closest('section, article, aside, nav, [role="region"], [role="tabpanel"], [class*="card"], [class*="panel"]');if(!e)return"";const t=e.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"], .card-title, .section-title, strong');return((i=t==null?void 0:t.textContent)==null?void 0:i.trim().replace(/\s+/g," "))||e.getAttribute("aria-label")||""}function sr(n){var t,i;if(n.id)try{const r=document.querySelector(`label[for="${CSS.escape(n.id)}"]`);if((t=r==null?void 0:r.textContent)!=null&&t.trim())return r.textContent.trim().replace(/\s+/g," ")}catch{}const e=n.closest("label");return e&&e!==n&&((i=e.textContent)!=null&&i.trim())?e.textContent.trim().replace(/\s+/g," "):""}function or(n){const e=n.href||n.getAttribute("href")||"";if(e)return kt(e)||void 0}function kt(n){if(n)try{const e=new URL(n,location.origin);return`${e.pathname}${e.search}${e.hash}`.slice(0,D)}catch{return L(n,D)||void 0}}function ar(n){if(n)return L(n.split(/\s+/).filter(Boolean).slice(0,4).join(" "),Xi)||void 0}function lr(n){const e=n.getAttribute("data-guideai");if(e)return`[data-guideai="${e}"]`;const t=n.getAttribute("data-testid")||n.getAttribute("data-test-id");if(t)return`[data-testid="${t}"]`;if(n.id)return`#${n.id}`;const i=n.getAttribute("name");if(i)return L(`${n.tagName.toLowerCase()}[name="${i}"]`,xe)||void 0;const r=n.tagName.toLowerCase(),s=n.getAttribute("role");if(s)return L(`${r}[role="${s}"]`,xe)||void 0;if(r==="a"){const o=n.getAttribute("href");if(o)return L(`a[href="${o}"]`,xe)||void 0}return L(r,xe)||void 0}function cr(n){return Object.fromEntries(Object.entries(n).filter(([,e])=>e==null?!1:typeof e=="string"?e.trim().length>0:Array.isArray(e)?e.length>0:!0))}function L(n,e){const t=n.trim().replace(/\s+/g," ");return t.length<=e?t:t.slice(0,e)}const _t="/api/v1/events";class dr{constructor(e,t,i){this.api=e,this.siteId=t,this.sessionId=i}async send(e){if(e.length===0)return;const i=e.map(r=>this.enrich(r)).map(r=>de(r));try{await this.api.post(_t,{events:i})}catch(r){typeof console<"u"&&console.warn("[GuideAI] Failed to send events:",r)}}sendKeepalive(e){if(e.length===0)return;const i=e.map(r=>this.enrich(r)).map(r=>de(r));this.api.postKeepalive(_t,{events:i})}prepareForEncrypt(e){return e.map(i=>this.enrich(i)).map(i=>de(i))}enrich(e){var o;qi(this.siteId);let t=e.user_id;if(!t)try{t=sessionStorage.getItem(`guideai_user_id_${this.siteId}`)||void 0}catch{}let i;try{const a=sessionStorage.getItem(`guideai_account_${this.siteId}`);a&&(i=(o=JSON.parse(a))==null?void 0:o.id)}catch{}const r=wt(this.siteId)??void 0,s={...Ji(),...e.metadata,...i?{account_id:i}:{},...r||{}};return{site_id:this.siteId,session_id:this.sessionId,anonymous_id:e.anonymous_id??Ni(this.siteId),event_type:"click",url:location.href,timestamp:new Date().toISOString(),...e,...t?{user_id:t}:{},metadata:s}}}const ur=3,Et=500;class hr{constructor(e){this.clickMap=new WeakMap,this.handler=null,this.callback=e}start(){this.handler=e=>{e.target&&this.trackClick(e)},document.addEventListener("click",this.handler,{capture:!0,passive:!0})}destroy(){this.handler&&(document.removeEventListener("click",this.handler,{capture:!0}),this.handler=null)}trackClick(e){const t=e.target,i=Date.now();let r=this.clickMap.get(t);r||(r={timestamps:[]},this.clickMap.set(t,r)),r.timestamps.push(i),r.timestamps=r.timestamps.filter(s=>i-s<=Et),r.timestamps.length>=ur&&(this.fireRageClick(t,r.timestamps.length),r.timestamps=[],document.dispatchEvent(new CustomEvent("guideai:frustration")))}fireRageClick(e,t){const i=oe(e),r="metadata"in i?i.metadata:{};this.callback({event_type:"rage_click",url:location.href,element_text:i.element_text||this.truncate(e.innerText??e.textContent??"",100),element_tag:i.element_tag||e.tagName.toLowerCase(),click_count:t,timestamp:new Date().toISOString(),metadata:{...r,rage_window_ms:Et}})}truncate(e,t){return e.length>t?e.slice(0,t):e}}const St=300;class gr{constructor(e){this.handler=null,this.callback=e}start(){this.handler=e=>{e.target&&this.checkClick(e)},document.addEventListener("click",this.handler,{capture:!0,passive:!0})}destroy(){this.handler&&(document.removeEventListener("click",this.handler,{capture:!0}),this.handler=null)}checkClick(e){const t=e.target,i=t.tagName.toLowerCase();if(["html","body"].includes(i)||!(i==="a"||i==="button"||i==="input"||i==="select"||i==="textarea"||t.getAttribute("role")==="button"||t.getAttribute("role")==="link"||t.getAttribute("tabindex")!==null||t.onclick!==null||t.closest('a, button, [role="button"]')!==null))return;const s=location.href;let o=!1;const a=new MutationObserver(()=>{o=!0});a.observe(document.body,{childList:!0,subtree:!0,attributes:!0,characterData:!0}),setTimeout(()=>{a.disconnect();const l=location.href,c=s!==l,d=document.querySelector('[role="dialog"]')!==null||document.querySelector('[role="alertdialog"]')!==null||document.querySelector(".modal.show, .modal.active, dialog[open]")!==null;!o&&!c&&!d&&this.fireDeadClick(t)},St)}fireDeadClick(e){const t=oe(e),i="metadata"in t?t.metadata:{};this.callback({event_type:"dead_click",url:location.href,element_text:t.element_text||this.truncate(e.innerText??e.textContent??"",100),element_tag:t.element_tag||e.tagName.toLowerCase(),had_response:!1,timestamp:new Date().toISOString(),metadata:{...i,observation_window_ms:St}}),document.dispatchEvent(new CustomEvent("guideai:frustration"))}truncate(e,t){return e.length>t?e.slice(0,t):e}}const Ne=[".error",".field-error",".form-error",".invalid-feedback",".validation-error",".has-error",'[role="alert"]','[aria-invalid="true"]'].join(",");class fr{constructor(e){this.observer=null,this.existingErrors=new Set,this.debounceTimer=null,this.pendingErrors=[],this.callback=e}start(){this.snapshotExisting(),this.observer=new MutationObserver(e=>{for(const t of e){if(t.type==="childList")for(let i=0;i<t.addedNodes.length;i++){const r=t.addedNodes[i];r.nodeType===Node.ELEMENT_NODE&&this.checkElement(r)}t.type==="attributes"&&t.target.nodeType===Node.ELEMENT_NODE&&this.checkElement(t.target)}}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","role","aria-invalid"]})}destroy(){this.observer&&(this.observer.disconnect(),this.observer=null),this.debounceTimer&&(clearTimeout(this.debounceTimer),this.debounceTimer=null),this.existingErrors.clear(),this.pendingErrors=[]}snapshotExisting(){const e=document.querySelectorAll(Ne);for(let t=0;t<e.length;t++)this.existingErrors.add(e[t])}checkElement(e){if(this.existingErrors.has(e))return;const t=e.matches(Ne);let i=[];t&&i.push(e);const r=e.querySelectorAll(Ne);for(let s=0;s<r.length;s++)this.existingErrors.has(r[s])||i.push(r[s]);i.length!==0&&(this.pendingErrors.push(...i),this.scheduleFlush())}scheduleFlush(){this.debounceTimer||(this.debounceTimer=setTimeout(()=>{this.flushErrors(),this.debounceTimer=null},100))}flushErrors(){if(this.pendingErrors.length===0)return;const e=new Set(this.pendingErrors);this.pendingErrors=[];for(const t of e){this.existingErrors.add(t);const i=t.innerText??t.textContent??"",r=t.closest("form"),s=oe(t),o="metadata"in s?s.metadata:{};this.callback({event_type:"form_error",url:location.href,element_text:s.element_text||this.truncate(i,200),element_tag:s.element_tag||t.tagName.toLowerCase(),timestamp:new Date().toISOString(),metadata:{...o,form_name:(r==null?void 0:r.getAttribute("name"))??(r==null?void 0:r.id)??void 0,error_class:t.className}})}document.dispatchEvent(new CustomEvent("guideai:frustration"))}truncate(e,t){return e.length>t?e.slice(0,t):e}}class pr{constructor(e){this.enrichers={},this.popstateHandler=null,this.hashchangeHandler=null,this.origPushState=null,this.origReplaceState=null,this.destroyed=!1,this.callback=e,this.currentUrl=location.href,this.pageEnteredAt=Date.now()}setEnrichers(e){this.enrichers=e}start(){this.origPushState=history.pushState.bind(history),history.pushState=(...e)=>{this.origPushState(...e),this.onUrlChange("push")},this.origReplaceState=history.replaceState.bind(history),history.replaceState=(...e)=>{this.origReplaceState(...e),this.onUrlChange("replace")},this.popstateHandler=()=>this.onUrlChange("popstate"),window.addEventListener("popstate",this.popstateHandler),this.hashchangeHandler=()=>this.onUrlChange("hash"),window.addEventListener("hashchange",this.hashchangeHandler)}destroy(){this.destroyed=!0,this.origPushState&&(history.pushState=this.origPushState),this.origReplaceState&&(history.replaceState=this.origReplaceState),this.popstateHandler&&(window.removeEventListener("popstate",this.popstateHandler),this.popstateHandler=null),this.hashchangeHandler&&(window.removeEventListener("hashchange",this.hashchangeHandler),this.hashchangeHandler=null)}firePageExit(){this.emitPageExit("unload")}onUrlChange(e){var r,s;if(this.destroyed)return;const t=location.href;if(t===this.currentUrl)return;const i=this.currentUrl;this.emitPageExit(e),(s=(r=this.enrichers).resetPageMetrics)==null||s.call(r),this.currentUrl=t,this.pageEnteredAt=Date.now(),this.callback({event_type:"page_view",url:t,previous_url:i,timestamp:new Date().toISOString(),metadata:{navigation_type:e,page_title:document.title}})}emitPageExit(e){const i={time_on_page_ms:Date.now()-this.pageEnteredAt,exit_trigger:e,page_title:document.title};if(this.enrichers.getScrollData)try{const r=this.enrichers.getScrollData();i.max_scroll_depth_pct=r.max_scroll_depth_pct}catch{}if(this.enrichers.getEngagementData)try{const r=this.enrichers.getEngagementData();i.active_time_ms=r.active_time_ms,i.idle_time_ms=r.idle_time_ms}catch{}if(this.enrichers.flushAbandoned)try{this.enrichers.flushAbandoned()}catch{}this.callback({event_type:"page_exit",url:this.currentUrl,timestamp:new Date().toISOString(),metadata:i})}}const mr=[25,50,75,90];class br{constructor(e){this.maxDepthPct=0,this.firedThresholds=new Set,this.scrollHandler=null,this.rafId=null,this.pending=!1,this.destroyed=!1,this.callback=e}start(){this.scrollHandler=()=>{this.pending||this.destroyed||(this.pending=!0,this.rafId=requestAnimationFrame(()=>{this.pending=!1,this.measure()}))},window.addEventListener("scroll",this.scrollHandler,{passive:!0}),document.addEventListener("scroll",this.scrollHandler,{passive:!0,capture:!0})}destroy(){this.destroyed=!0,this.scrollHandler&&(window.removeEventListener("scroll",this.scrollHandler),document.removeEventListener("scroll",this.scrollHandler,{capture:!0}),this.scrollHandler=null),this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)}reset(){this.maxDepthPct=0,this.firedThresholds.clear()}getPageScrollData(){return{max_scroll_depth_pct:this.maxDepthPct}}measure(){const e=Math.max(document.body.scrollHeight||0,document.documentElement.scrollHeight||0),t=window.innerHeight||document.documentElement.clientHeight||0,i=window.scrollY||document.documentElement.scrollTop||0;if(e<=t){this.maxDepthPct=100;return}const r=e-t,s=Math.min(100,Math.round(i/r*100));s>this.maxDepthPct&&(this.maxDepthPct=s);for(const o of mr)s>=o&&!this.firedThresholds.has(o)&&(this.firedThresholds.add(o),this.callback({event_type:"scroll",url:location.href,timestamp:new Date().toISOString(),metadata:{scroll_depth_pct:o,max_depth_pct:this.maxDepthPct,page_height:e,viewport_height:t}}))}}const yr=3e4,vr=5e3;class xr{constructor(){this.activeTimeMs=0,this.idleTimeMs=0,this.heartbeatTimer=null,this.visibilityHandler=null,this.activityHandler=null,this.isPageVisible=!0,this.destroyed=!1,this.lastActivityAt=Date.now(),this.lastHeartbeatAt=Date.now()}start(){this.activityHandler=()=>{this.lastActivityAt=Date.now()};const e={passive:!0,capture:!0};document.addEventListener("mousemove",this.activityHandler,e),document.addEventListener("keydown",this.activityHandler,e),document.addEventListener("touchstart",this.activityHandler,e),document.addEventListener("scroll",this.activityHandler,e),document.addEventListener("click",this.activityHandler,e),this.visibilityHandler=()=>{this.isPageVisible=!document.hidden,this.isPageVisible&&(this.lastActivityAt=Date.now())},document.addEventListener("visibilitychange",this.visibilityHandler),this.heartbeatTimer=setInterval(()=>this.heartbeat(),vr)}destroy(){this.destroyed=!0;const e={capture:!0};this.activityHandler&&(document.removeEventListener("mousemove",this.activityHandler,e),document.removeEventListener("keydown",this.activityHandler,e),document.removeEventListener("touchstart",this.activityHandler,e),document.removeEventListener("scroll",this.activityHandler,e),document.removeEventListener("click",this.activityHandler,e),this.activityHandler=null),this.visibilityHandler&&(document.removeEventListener("visibilitychange",this.visibilityHandler),this.visibilityHandler=null),this.heartbeatTimer&&(clearInterval(this.heartbeatTimer),this.heartbeatTimer=null)}reset(){this.heartbeat(),this.activeTimeMs=0,this.idleTimeMs=0,this.lastActivityAt=Date.now(),this.lastHeartbeatAt=Date.now()}getEngagementData(){return this.heartbeat(),{active_time_ms:this.activeTimeMs,idle_time_ms:this.idleTimeMs}}heartbeat(){if(this.destroyed)return;const e=Date.now(),t=e-this.lastHeartbeatAt;this.lastHeartbeatAt=e;const i=e-this.lastActivityAt;!this.isPageVisible||i>yr?this.idleTimeMs+=t:this.activeTimeMs+=t}}class wr{constructor(e){this.clickHandler=null,this.dblClickHandler=null,this.contextHandler=null,this.destroyed=!1,this.callback=e}start(){this.clickHandler=e=>{this.destroyed||!e.target||this.emitClick(e,"click")},this.dblClickHandler=e=>{this.destroyed||!e.target||this.emitClick(e,"double_click")},this.contextHandler=e=>{this.destroyed||!e.target||this.emitClick(e,"right_click")},document.addEventListener("click",this.clickHandler,{capture:!0,passive:!0}),document.addEventListener("dblclick",this.dblClickHandler,{capture:!0,passive:!0}),document.addEventListener("contextmenu",this.contextHandler,{capture:!0,passive:!0})}destroy(){this.destroyed=!0;const e={capture:!0};this.clickHandler&&(document.removeEventListener("click",this.clickHandler,e),this.clickHandler=null),this.dblClickHandler&&(document.removeEventListener("dblclick",this.dblClickHandler,e),this.dblClickHandler=null),this.contextHandler&&(document.removeEventListener("contextmenu",this.contextHandler,e),this.contextHandler=null)}emitClick(e,t){var d,u;const i=e.target,s=this.findClickableAncestor(i)||i,o=((d=s.tagName)==null?void 0:d.toLowerCase())||"",a=this.classifyClick(s,o),l=oe(s),c="metadata"in l?l.metadata:{};this.callback({event_type:t,url:location.href,element_text:l.element_text||this.truncate(((u=s.textContent)==null?void 0:u.trim())||"",100),element_tag:l.element_tag||o,timestamp:new Date().toISOString(),metadata:{...c,click_type:a,viewport_x:Math.round(e.clientX),viewport_y:Math.round(e.clientY),page_x:Math.round(e.pageX),page_y:Math.round(e.pageY)}})}findClickableAncestor(e){var i;let t=e;for(let r=0;t&&r<5;r++){const s=(i=t.tagName)==null?void 0:i.toLowerCase();if(s==="a"||s==="button"||s==="input"||s==="select"||s==="textarea")return t;const o=t.getAttribute("role");if(o==="button"||o==="link"||o==="tab"||o==="menuitem"||t.onclick||t.getAttribute("tabindex"))return t;t=t.parentElement}return null}classifyClick(e,t){const i=e.getAttribute("role")||"",r=e.getAttribute("type")||"",s=e.getAttribute("href");return t==="a"||i==="link"?"link":e.closest("nav")||i==="navigation"?"navigation":i==="tab"||e.closest('[role="tablist"]')?"tab":r==="checkbox"||r==="radio"||i==="switch"?"toggle":t==="select"||i==="listbox"||i==="combobox"?"dropdown":t==="input"||t==="textarea"?"form_field":t==="button"||i==="button"?r==="submit"||e.classList.contains("cta")||e.classList.contains("primary")?"cta":"button":s?"link":"other"}truncate(e,t){return e.length>t?e.slice(0,t):e}}class kr{constructor(e){this.formStates=new WeakMap,this.activeForms=new Set,this.focusHandler=null,this.submitHandler=null,this.pasteHandler=null,this.destroyed=!1,this.callback=e}start(){this.focusHandler=e=>{this.destroyed||!e.target||this.onFieldFocus(e.target)},this.submitHandler=e=>{this.destroyed||!e.target||this.onFormSubmit(e.target)},this.pasteHandler=e=>{this.destroyed||!e.target||this.onPaste(e.target)},document.addEventListener("focusin",this.focusHandler,{capture:!0,passive:!0}),document.addEventListener("submit",this.submitHandler,{capture:!0}),document.addEventListener("paste",this.pasteHandler,{capture:!0,passive:!0})}destroy(){this.destroyed=!0,this.focusHandler&&(document.removeEventListener("focusin",this.focusHandler,{capture:!0}),this.focusHandler=null),this.submitHandler&&(document.removeEventListener("submit",this.submitHandler,{capture:!0}),this.submitHandler=null),this.pasteHandler&&(document.removeEventListener("paste",this.pasteHandler,{capture:!0}),this.pasteHandler=null),this.activeForms.clear()}flushAbandoned(){for(const e of this.activeForms){const t=this.formStates.get(e);if(t&&!t.submitted&&t.fieldsInteracted.size>0){const i=e;this.callback({event_type:"form_abandon",url:location.href,timestamp:new Date().toISOString(),metadata:{form_id:t.formId,total_fields:t.totalFields,fields_interacted:t.fieldsInteracted.size,field_order:t.fieldOrder.slice(0,20),last_field:t.lastFieldName,time_spent_ms:Date.now()-t.startedAt,had_paste:t.hasPaste,form_action:i.getAttribute("action")||void 0,form_method:i.getAttribute("method")||void 0}})}}this.activeForms.clear()}onFieldFocus(e){var c;const t=(c=e.tagName)==null?void 0:c.toLowerCase();if(t!=="input"&&t!=="textarea"&&t!=="select")return;const i=e.getAttribute("type");if(i==="hidden"||i==="submit"||i==="button")return;const r=e.closest("form")||e.closest('[role="form"]')||document.body,s=this.getFieldName(e),o=oe(e),a="metadata"in o?o.metadata:{};let l=this.formStates.get(r);if(!l){const d=r.querySelectorAll("input, textarea, select"),u=r.id||r.getAttribute("name")||`form_${Date.now()}`;l={formId:u,startedAt:Date.now(),totalFields:d.length,fieldsInteracted:new Set,fieldOrder:[],lastFieldName:s,hasPaste:!1,submitted:!1},this.formStates.set(r,l),this.activeForms.add(r),this.callback({event_type:"form_start",url:location.href,timestamp:new Date().toISOString(),metadata:{form_id:u,total_fields:d.length,first_field:s,...a}})}l.fieldsInteracted.has(s)||(l.fieldsInteracted.add(s),l.fieldOrder.push(s)),l.lastFieldName=s}onFormSubmit(e){const t=this.formStates.get(e);t&&(t.submitted=!0,this.activeForms.delete(e),this.callback({event_type:"form_submit",url:location.href,timestamp:new Date().toISOString(),metadata:{form_id:t.formId,total_fields:t.totalFields,fields_interacted:t.fieldsInteracted.size,field_order:t.fieldOrder.slice(0,20),time_to_submit_ms:Date.now()-t.startedAt,had_paste:t.hasPaste,form_action:e.getAttribute("action")||void 0,form_method:e.getAttribute("method")||void 0}}))}onPaste(e){const t=e.closest("form")||e.closest('[role="form"]')||document.body,i=this.formStates.get(t);i&&(i.hasPaste=!0)}getFieldName(e){return e.getAttribute("name")||e.getAttribute("aria-label")||e.id||e.getAttribute("placeholder")||e.tagName.toLowerCase()}}const Ct=5e3,_r=1e3;class Er{constructor(e){this.recentErrors=new Map,this.errorHandler=null,this.rejectionHandler=null,this.destroyed=!1,this.callback=e}start(){const e=window.onerror;this.errorHandler=(t,i,r,s,o)=>(this.destroyed||this.handleError(String(t),i||"",r||0,s||0,o==null?void 0:o.stack),typeof e=="function"?e(t,i,r,s,o):!1),window.onerror=this.errorHandler,this.rejectionHandler=t=>{if(this.destroyed)return;const i=t.reason,r=i instanceof Error?i.message:String(i),s=i instanceof Error?i.stack:void 0;this.handleError(r,"",0,0,s,!0)},window.addEventListener("unhandledrejection",this.rejectionHandler)}destroy(){this.destroyed=!0,this.errorHandler&&(window.onerror===this.errorHandler&&(window.onerror=null),this.errorHandler=null),this.rejectionHandler&&(window.removeEventListener("unhandledrejection",this.rejectionHandler),this.rejectionHandler=null),this.recentErrors.clear()}handleError(e,t,i,r,s,o=!1){if(t.includes("guideai")||s&&s.includes("guideai"))return;const a=`${e}|${t}|${i}`,l=Date.now(),c=this.recentErrors.get(a);if(!(c&&l-c<Ct)){if(this.recentErrors.set(a,l),this.recentErrors.size>50)for(const[d,u]of this.recentErrors)l-u>Ct&&this.recentErrors.delete(d);this.callback({event_type:"js_error",url:location.href,timestamp:new Date().toISOString(),metadata:{error_message:this.truncate(e,500),error_source:this.extractFilename(t),error_line:i,error_col:r,error_stack:s?this.sanitizeStack(s):void 0,is_unhandled_rejection:o||void 0}})}}extractFilename(e){if(!e)return"";try{const t=new URL(e),i=t.pathname.split("/");return i[i.length-1]||t.pathname}catch{return e.split("/").pop()||e}}sanitizeStack(e){const t=e.replace(/file:\/\/[^\s)]+/g,"[local]").replace(/\/Users\/[^\s:)]+/g,"[path]").replace(/\/home\/[^\s:)]+/g,"[path]").replace(/C:\\[^\s:)]+/g,"[path]");return this.truncate(t,_r)}truncate(e,t){return e.length>t?e.slice(0,t)+"…":e}}const Sr=1e4;class Cr{constructor(e){this.reportTimer=null,this.paintObserver=null,this.lcpObserver=null,this.longTaskObserver=null,this.resourceErrorHandler=null,this.origFetch=null,this.origXhrOpen=null,this.fcpMs=0,this.lcpMs=0,this.longTaskCount=0,this.destroyed=!1,this.callback=e}start(){try{this.paintObserver=new PerformanceObserver(e=>{for(const t of e.getEntries())t.name==="first-contentful-paint"&&(this.fcpMs=Math.round(t.startTime))}),this.paintObserver.observe({type:"paint",buffered:!0})}catch{}try{this.lcpObserver=new PerformanceObserver(e=>{const t=e.getEntries();t.length>0&&(this.lcpMs=Math.round(t[t.length-1].startTime))}),this.lcpObserver.observe({type:"largest-contentful-paint",buffered:!0})}catch{}try{this.longTaskObserver=new PerformanceObserver(e=>{this.longTaskCount+=e.getEntries().length}),this.longTaskObserver.observe({type:"longtask"})}catch{}this.resourceErrorHandler=e=>{if(this.destroyed)return;const t=e.target;if(!t||!t.tagName)return;const i=t.tagName.toLowerCase();if(i==="img"||i==="script"||i==="link"){const r=t.src||t.src||t.href||"";if(r.includes("guideai"))return;this.callback({event_type:"network_error",url:location.href,timestamp:new Date().toISOString(),metadata:{resource_tag:i,resource_url:this.extractPathname(r),error_type:"resource_load_failed"}})}},window.addEventListener("error",this.resourceErrorHandler,{capture:!0}),this.interceptFetch(),this.interceptXhr(),this.reportTimer=setTimeout(()=>this.emitPerformanceReport(),Sr)}destroy(){this.destroyed=!0,this.reportTimer&&(clearTimeout(this.reportTimer),this.reportTimer=null),this.paintObserver&&(this.paintObserver.disconnect(),this.paintObserver=null),this.lcpObserver&&(this.lcpObserver.disconnect(),this.lcpObserver=null),this.longTaskObserver&&(this.longTaskObserver.disconnect(),this.longTaskObserver=null),this.resourceErrorHandler&&(window.removeEventListener("error",this.resourceErrorHandler,{capture:!0}),this.resourceErrorHandler=null),this.origFetch&&(window.fetch=this.origFetch,this.origFetch=null),this.origXhrOpen&&(XMLHttpRequest.prototype.open=this.origXhrOpen,this.origXhrOpen=null)}interceptFetch(){try{this.origFetch=window.fetch.bind(window);const e=this;window.fetch=function(...t){var s;const i=typeof t[0]=="string"?t[0]:((s=t[0])==null?void 0:s.url)||"",r=Date.now();return e.origFetch(...t).then(o=>{var a;return!e.destroyed&&o.status>=400&&!i.includes("guideai")&&!i.includes("/api/v1/events")&&e.callback({event_type:"network_error",url:location.href,timestamp:new Date().toISOString(),metadata:{error_type:"http_error",request_url:e.extractPathname(i),status_code:o.status,duration_ms:Date.now()-r,method:((a=t[1])==null?void 0:a.method)||"GET"}}),o},o=>{var a;throw!e.destroyed&&!i.includes("guideai")&&!i.includes("/api/v1/events")&&e.callback({event_type:"network_error",url:location.href,timestamp:new Date().toISOString(),metadata:{error_type:"fetch_failed",request_url:e.extractPathname(i),error_message:(o==null?void 0:o.message)||"Network request failed",duration_ms:Date.now()-r,method:((a=t[1])==null?void 0:a.method)||"GET"}}),o})}}catch{}}interceptXhr(){try{this.origXhrOpen=XMLHttpRequest.prototype.open;const e=this;XMLHttpRequest.prototype.open=function(t,i,...r){const s=String(i);if(!s.includes("guideai")&&!s.includes("/api/v1/events")){const o=Date.now();this.addEventListener("load",function(){!e.destroyed&&this.status>=400&&e.callback({event_type:"network_error",url:location.href,timestamp:new Date().toISOString(),metadata:{error_type:"xhr_http_error",request_url:e.extractPathname(s),status_code:this.status,duration_ms:Date.now()-o,method:t}})}),this.addEventListener("error",function(){e.destroyed||e.callback({event_type:"network_error",url:location.href,timestamp:new Date().toISOString(),metadata:{error_type:"xhr_failed",request_url:e.extractPathname(s),duration_ms:Date.now()-o,method:t}})}),this.addEventListener("timeout",function(){e.destroyed||e.callback({event_type:"network_error",url:location.href,timestamp:new Date().toISOString(),metadata:{error_type:"xhr_timeout",request_url:e.extractPathname(s),duration_ms:Date.now()-o,method:t}})})}return e.origXhrOpen.apply(this,[t,i,...r])}}catch{}}emitPerformanceReport(){var t,i,r;if(this.destroyed)return;const e={fcp_ms:this.fcpMs||void 0,lcp_ms:this.lcpMs||void 0,long_task_count:this.longTaskCount};try{const s=performance.getEntriesByType("navigation")[0];s&&(e.ttfb_ms=Math.round(s.responseStart-s.requestStart),e.dom_load_ms=Math.round(s.domContentLoadedEventEnd-s.startTime),e.page_load_ms=Math.round(s.loadEventEnd-s.startTime),e.dns_ms=Math.round(s.domainLookupEnd-s.domainLookupStart),e.connect_ms=Math.round(s.connectEnd-s.connectStart),e.transfer_size=s.transferSize)}catch{}(t=this.paintObserver)==null||t.disconnect(),(i=this.lcpObserver)==null||i.disconnect(),(r=this.longTaskObserver)==null||r.disconnect(),this.callback({event_type:"performance",url:location.href,timestamp:new Date().toISOString(),metadata:e})}extractPathname(e){try{return new URL(e).pathname}catch{return e}}}const $e=['[role="alert"]','[role="alertdialog"]','[role="status"]','[aria-live="assertive"]','[aria-live="polite"]',".error-message",".error-banner",".error-toast",".error-notification",".error-alert",".error-dialog",".error-text",".error-msg",".alert-error",".alert-danger",".alert-warning",".toast",".toast-error",".toast-warning",".Toastify__toast--error",".Toastify__toast--warning",".notistack-MuiContent-error",".notistack-MuiContent-warning",".react-hot-toast",".MuiAlert-standardError",".MuiAlert-standardWarning",".MuiAlert-filledError",".MuiAlert-filledWarning",".MuiSnackbar-root",".ant-message-error",".ant-message-warning",".ant-notification-notice-error",".ant-notification-notice-warning",".ant-alert-error",".ant-alert-warning",".alert-danger",".alert-warning",".invalid-feedback:not(.d-none)",".is-invalid",'[data-status="error"]','[data-status="warning"]',".alert.alert-danger",".moodle-exception-message","#notice.error",".notifyproblem",".notifyerror",".slds-notify--error",".slds-notify--warning",".slds-notify_alert",".slds-theme_error",'lightning-notice[variant="error"]',"force-record-layout-item .error",".web3modal-modal-card .error",".walletconnect-modal__text--error",'[class*="wallet-error"]','[class*="transaction-error"]','[class*="connect-error"]','[data-state="error"]',"dialog[open]"].join(","),Tt=[/\bunable to\b/i,/\bfailed to\b/i,/\bcannot\b.*\b(?:connect|load|save|send|process|complete|fetch|login|sign[- ]?in)\b/i,/\bcould not\b/i,/\bsomething went wrong\b/i,/\bunexpected error\b/i,/\binternal (?:server )?error\b/i,/\bservice unavailable\b/i,/\brequest (?:timed out|timeout)\b/i,/\btry again\b/i,/\bplease try\b/i,/\bconnection (?:lost|failed|refused|error)\b/i,/\bnetwork error\b/i,/\bno internet\b/i,/\boffline\b/i,/\baccess denied\b/i,/\bpermission denied\b/i,/\bunauthorized\b/i,/\bforbidden\b/i,/\bnot found\b/i,/\b(?:invalid|incorrect|wrong) (?:password|credentials|email|username|input)\b/i,/\bsession (?:expired|timed out)\b/i,/\blogin failed\b/i,/\bauthentication failed\b/i,/\bpayment (?:failed|declined|error)\b/i,/\binsufficient (?:funds|balance)\b/i,/\brate limit\b/i,/\btoo many (?:requests|attempts)\b/i,/\baccount (?:locked|suspended|disabled)\b/i,/\btransaction (?:failed|rejected|reverted)\b/i,/\bwallet (?:not found|disconnected|rejected)\b/i,/\buser rejected\b/i,/\bgas (?:estimation failed|too low)\b/i,/\bnonce too\b/i,/\bcontract (?:error|reverted)\b/i,/\bmetamask\b.*\b(?:error|rejected|denied)\b/i,/\bsubmission (?:failed|error)\b/i,/\bgrade (?:error|failed)\b/i,/\benrolment (?:error|failed)\b/i,/\bcourse (?:not available|error)\b/i,/\b(?:error |status )(?:4\d{2}|5\d{2})\b/i,/\b(?:404|500|502|503)\b.*\b(?:error|not found|unavailable)\b/i],De=5,At=500,Lt=3e3;class Tr{constructor(e){this.observer=null,this.existingElements=new WeakSet,this.recentErrors=new Map,this.debounceTimer=null,this.pendingElements=[],this.destroyed=!1,this.callback=e}start(){this.snapshotExisting(),this.observer=new MutationObserver(e=>{if(!this.destroyed)for(const t of e){if(t.type==="childList")for(let i=0;i<t.addedNodes.length;i++){const r=t.addedNodes[i];r.nodeType===Node.ELEMENT_NODE&&this.inspectElement(r)}t.type==="attributes"&&t.target.nodeType===Node.ELEMENT_NODE&&this.inspectElement(t.target)}}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","role","aria-live","data-status","data-state","style"]})}destroy(){this.destroyed=!0,this.observer&&(this.observer.disconnect(),this.observer=null),this.debounceTimer&&(clearTimeout(this.debounceTimer),this.debounceTimer=null),this.recentErrors.clear(),this.pendingElements=[]}snapshotExisting(){try{const e=document.querySelectorAll($e);for(let t=0;t<e.length;t++)this.existingElements.add(e[t])}catch{}}inspectElement(e){var i;if(this.existingElements.has(e)||(i=e.closest)!=null&&i.call(e,"[data-guideai-root]"))return;if(this.isErrorElement(e)){this.pendingElements.push(e),this.scheduleFlush();return}try{const r=e.querySelectorAll($e);for(let s=0;s<r.length;s++)this.existingElements.has(r[s])||this.pendingElements.push(r[s]);this.pendingElements.length>0&&this.scheduleFlush()}catch{}}isErrorElement(e){try{if(e.matches($e)){const t=e.getAttribute("role");return t==="status"||t==="dialog"||e.tagName==="DIALOG"?this.hasErrorText(e):!0}}catch{}return!!this.looksLikeErrorByText(e)}hasErrorText(e){const t=this.getVisibleText(e);return t.length<De?!1:Tt.some(i=>i.test(t))}looksLikeErrorByText(e){const t=e,i=this.getVisibleText(e);if(i.length<De||i.length>At||!this.isVisible(t)||!Tt.some(a=>a.test(i)))return!1;const r=String(e.className||"").toLowerCase(),s=/error|alert|warn|danger|fail|toast|notify|snack|banner/i.test(r),o=this.hasErrorStyling(t);return s||o}hasErrorStyling(e){try{const t=window.getComputedStyle(e),i=t.color||"",r=t.backgroundColor||"",s=o=>{const a=o.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!a)return!1;const l=parseInt(a[1],10),c=parseInt(a[2],10),d=parseInt(a[3],10);return l>150&&c<100&&d<100};return s(i)||s(r)}catch{return!1}}isVisible(e){try{if(e.offsetParent===null&&e.tagName!=="BODY")return!1;const t=window.getComputedStyle(e);return!(t.display==="none"||t.visibility==="hidden"||t.opacity==="0")}catch{return!0}}getVisibleText(e){return(e.innerText??e.textContent??"").trim().slice(0,At)}scheduleFlush(){this.debounceTimer||(this.debounceTimer=setTimeout(()=>{this.flush(),this.debounceTimer=null},150))}flush(){if(this.pendingElements.length===0)return;const e=[...new Set(this.pendingElements)];this.pendingElements=[];const t=Date.now();for(const i of e){this.existingElements.add(i);const r=this.getVisibleText(i);if(r.length<De)continue;const s=r.slice(0,100),o=this.recentErrors.get(s);if(o&&t-o<Lt)continue;this.recentErrors.set(s,t);const a=this.classifyError(r,i),l=oe(i),c="metadata"in l?l.metadata:{};this.callback({event_type:"ui_error",url:location.href,element_text:l.element_text||r.slice(0,300),element_tag:l.element_tag||i.tagName.toLowerCase(),timestamp:new Date().toISOString(),metadata:{...c,error_category:a,error_text:r.slice(0,300),container_type:this.getContainerType(i),is_modal:!!i.closest('dialog, [role="dialog"], [role="alertdialog"], .modal'),is_toast:!!i.closest('.toast, .Toastify, .notistack, .react-hot-toast, [class*="snackbar"], [class*="notification"]')}})}if(this.recentErrors.size>100)for(const[i,r]of this.recentErrors)t-r>Lt&&this.recentErrors.delete(i)}classifyError(e,t){const i=e.toLowerCase();return/login|sign.?in|credential|password|auth/i.test(i)?"authentication":/permission|denied|forbidden|unauthorized|access/i.test(i)?"authorization":/network|connect|internet|offline/i.test(i)?"network":/timeout|timed.?out/i.test(i)?"timeout":/payment|declined|insufficient|billing/i.test(i)?"payment":/not found|404|missing/i.test(i)?"not_found":/server error|500|502|503|unavailable/i.test(i)?"server":/rate limit|too many/i.test(i)?"rate_limit":/session|expired/i.test(i)?"session":/wallet|metamask|transaction|gas|nonce|contract/i.test(i)?"web3":/valid|invalid|required|format|must be/i.test(i)?"validation":/upload|file|size|too large/i.test(i)?"file":/enrol|course|grade|quiz|submission|assignment/i.test(i)?"lms":"general"}getContainerType(e){const t=e.getAttribute("role");if(t==="alertdialog")return"alert_dialog";if(t==="alert")return"alert";if(t==="dialog"||e.tagName==="DIALOG")return"dialog";if(t==="status")return"status";const i=String(e.className||"").toLowerCase();return/toast/i.test(i)?"toast":/snack/i.test(i)?"snackbar":/banner/i.test(i)?"banner":/modal/i.test(i)?"modal":/notif/i.test(i)?"notification":/alert/i.test(i)?"alert":"inline"}truncate(e,t){return e.length>t?e.slice(0,t):e}}const Oe=n=>`guideai_visitor_${n}`,Be=n=>`guideai_account_${n}`,It=n=>`guideai_user_id_${n}`,Ar=new Set(["identify","feature_used","product_view","add_to_cart","remove_from_cart","checkout_start","purchase","search","signup","login","share","subscribe","unsubscribe","feedback","rating","wallet_connect","wallet_disconnect","transaction_sign","transaction_confirm","token_swap","nft_view","nft_purchase","course_start","course_complete","lesson_view","quiz_start","quiz_complete","assignment_submit"]),Lr=50,we=500;class Ir{constructor(){this.eventBuffer=null,this.siteId=""}configure(e,t){this.eventBuffer=e,this.siteId=t}track(e,t){if(!this.eventBuffer||!e)return;const i=this.sanitizeMetadata(t||{}),r=Ar.has(e),s={event_type:r?e:"custom",url:location.href,timestamp:new Date().toISOString(),metadata:{...i,...r?{}:{custom_event_name:e}}};this.eventBuffer.push(s)}trackFeature(e,t,i){if(!this.eventBuffer||!e)return;const r=this.sanitizeMetadata(i||{}),s={event_type:"feature_used",url:location.href,timestamp:new Date().toISOString(),metadata:{...r,feature_key:e,...t?{feature_label:t}:{}}};this.eventBuffer.push(s)}identify(e){if(e)try{sessionStorage.setItem(It(this.siteId),e)}catch{}}getUserId(){try{return sessionStorage.getItem(It(this.siteId))}catch{return null}}initializeVisitor(e){var r;if(!((r=e==null?void 0:e.visitor)!=null&&r.id)){typeof console<"u"&&console.warn("[GuideAI] initialize() requires visitor.id");return}const{visitor:t,account:i}=e;this.identify(t.id);try{sessionStorage.setItem(Oe(this.siteId),JSON.stringify(t))}catch{}if(i!=null&&i.id)try{sessionStorage.setItem(Be(this.siteId),JSON.stringify(i))}catch{}if(this.eventBuffer){const s={visitor:{...t}};i&&(s.account={...i}),this.eventBuffer.push({event_type:"identify",url:location.href,timestamp:new Date().toISOString(),user_id:t.id,metadata:s})}}updateOptions(e){const{visitor:t,account:i}=e;if(t){const s={...this.getVisitorData(),...t};t.id&&this.identify(t.id);try{sessionStorage.setItem(Oe(this.siteId),JSON.stringify(s))}catch{}}if(i){const s={...this.getAccountData(),...i};try{sessionStorage.setItem(Be(this.siteId),JSON.stringify(s))}catch{}}if(this.eventBuffer){const r=this.getVisitorData(),s=this.getAccountData(),o={};r&&(o.visitor=r),s&&(o.account=s),this.eventBuffer.push({event_type:"identify",url:location.href,timestamp:new Date().toISOString(),user_id:(r==null?void 0:r.id)||this.getUserId()||void 0,metadata:o})}}getVisitorData(){try{const e=sessionStorage.getItem(Oe(this.siteId));return e?JSON.parse(e):null}catch{return null}}getAccountData(){try{const e=sessionStorage.getItem(Be(this.siteId));return e?JSON.parse(e):null}catch{return null}}sanitizeMetadata(e){const t={};let i=0;for(const[r,s]of Object.entries(e)){if(i>=Lr)break;if(s!=null){if(typeof s=="string")t[r]=s.length>we?s.slice(0,we):s;else if(typeof s=="number"||typeof s=="boolean")t[r]=s;else try{const o=JSON.stringify(s);t[r]=o.length>we?o.slice(0,we):o}catch{t[r]="[complex]"}i++}}return t}}const Mr=new Set(["password","credit-card","ssn"]),Pr=new Set(["SCRIPT","NOSCRIPT"]);class Rr{constructor(){this.nodeIdCounter=1,this.nodeIdMap=new WeakMap}getNodeId(e){let t=this.nodeIdMap.get(e);return t||(t=this.nodeIdCounter++,this.nodeIdMap.set(e,t)),t}serializeDocument(){return this.serializeNode(document.documentElement)}serializeNode(e){try{const t=this.getNodeId(e);if(e.nodeType===Node.TEXT_NODE){const a=e.parentElement;return a&&this.shouldMask(a)?{id:t,type:3,text:"[masked]"}:{id:t,type:3,text:e.textContent??""}}if(e.nodeType===Node.COMMENT_NODE)return{id:t,type:8,text:""};if(e.nodeType!==Node.ELEMENT_NODE)return null;const i=e,r=i.tagName;if(Pr.has(r))return{id:t,type:1,tag:r,attrs:{},children:[]};const s=this.sanitizeAttributes(i),o=[];for(let a=0;a<i.childNodes.length;a++){const l=this.serializeNode(i.childNodes[a]);l&&o.push(l)}return{id:t,type:1,tag:r,attrs:s,children:o}}catch{return null}}shouldMask(e){var t;if(e.hasAttribute("data-guideai-mask"))return!0;if(e.tagName==="INPUT"){const i=(t=e.type)==null?void 0:t.toLowerCase();if(Mr.has(i))return!0}return!1}sanitizeAttributes(e){var i;const t={};for(let r=0;r<e.attributes.length;r++){const s=e.attributes[r],o=s.name;o.startsWith("on")||o.startsWith("data-guideai-internal")||(t[o]=s.value)}if(e.tagName==="INPUT"||e.tagName==="TEXTAREA"||e.tagName==="SELECT"){const r=e;if(((i=r.type)==null?void 0:i.toLowerCase())==="password")t.value="***";else if(this.shouldMask(e))t.value="[masked]";else{const o=r.value||"";t.value=o?`[${o.length} chars]`:""}}return t}reset(){this.nodeIdCounter=1,this.nodeIdMap=new WeakMap}}class Hr{constructor(e,t){this.serializer=e,this.callback=t,this.observer=null}start(){try{this.observer=new MutationObserver(e=>{try{const t=this.processMutations(e);t.length>0&&this.callback(t)}catch{}}),this.observer.observe(document.documentElement,{childList:!0,attributes:!0,characterData:!0,subtree:!0,attributeOldValue:!0})}catch{}}stop(){var e;(e=this.observer)==null||e.disconnect(),this.observer=null}processMutations(e){const t=[];for(const i of e)if(!this.isGuideAINode(i.target))switch(i.type){case"childList":{for(let r=0;r<i.addedNodes.length;r++){const s=i.addedNodes[r];if(this.isGuideAINode(s))continue;const o=this.serializer.serializeNode(s);o&&t.push({type:"add",targetId:o.id,parentId:i.target?this.serializer.getNodeId(i.target):void 0,nextSiblingId:i.nextSibling?this.serializer.getNodeId(i.nextSibling):void 0,data:o})}for(let r=0;r<i.removedNodes.length;r++){const s=i.removedNodes[r];this.isGuideAINode(s)||t.push({type:"remove",targetId:this.serializer.getNodeId(s),parentId:i.target?this.serializer.getNodeId(i.target):void 0})}break}case"attributes":{const r=i.target,s=i.attributeName??"";t.push({type:"attr",targetId:this.serializer.getNodeId(i.target),attr:{name:s,value:r.getAttribute(s)}});break}case"characterData":{t.push({type:"text",targetId:this.serializer.getNodeId(i.target),text:i.target.textContent??""});break}}return t}isGuideAINode(e){if(!e)return!1;const t=e.nodeType===Node.ELEMENT_NODE?e:e.parentElement;return t?t.id==="guideai-shadow-host"||t.closest("#guideai-shadow-host")!==null:!1}}class Nr{constructor(){this.lastX=0,this.lastY=0,this.timer=null,this.hasMoved=!1,this.handler=null,this.cb=null}start(e){this.cb=e,this.handler=t=>{this.lastX=t.clientX,this.lastY=t.clientY,this.hasMoved=!0},document.addEventListener("mousemove",this.handler,{passive:!0}),this.timer=setInterval(()=>{this.hasMoved&&this.cb&&(this.cb({x:this.lastX,y:this.lastY}),this.hasMoved=!1)},50)}stop(){this.handler&&(document.removeEventListener("mousemove",this.handler),this.handler=null),this.timer&&(clearInterval(this.timer),this.timer=null)}}class $r{constructor(){this.timer=null,this.lastX=0,this.lastY=0,this.changed=!1,this.handler=null,this.cb=null}start(e){this.cb=e,this.handler=()=>{this.lastX=window.scrollX,this.lastY=window.scrollY,this.changed=!0},window.addEventListener("scroll",this.handler,{passive:!0}),this.timer=setInterval(()=>{this.changed&&this.cb&&(this.cb({x:this.lastX,y:this.lastY}),this.changed=!1)},100)}stop(){this.handler&&(window.removeEventListener("scroll",this.handler),this.handler=null),this.timer&&(clearInterval(this.timer),this.timer=null)}}class Dr{constructor(){this.handler=null,this.getNodeId=null}start(e,t){this.getNodeId=t,this.handler=i=>{var r;try{const s=i.target;if(!s||!("value"in s))return;const o=s,a=(r=o.type)==null?void 0:r.toLowerCase();let l;a==="password"?l="***":s.hasAttribute("data-guideai-mask")?l="[masked]":l=`[${(o.value||"").length} chars]`,e({targetId:t(s),value:l,tag:s.tagName})}catch{}},document.addEventListener("input",this.handler,{capture:!0,passive:!0})}stop(){this.handler&&(document.removeEventListener("input",this.handler,{capture:!0}),this.handler=null)}}class Or{constructor(){this.handler=null,this.timer=null,this.cb=null}start(e){this.cb=e,this.handler=()=>{this.timer&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.cb&&this.cb({width:window.innerWidth,height:window.innerHeight})},200)},window.addEventListener("resize",this.handler,{passive:!0})}stop(){this.handler&&(window.removeEventListener("resize",this.handler),this.handler=null),this.timer&&(clearTimeout(this.timer),this.timer=null)}}class Br{constructor(e){this.sender=e,this.events=[],this.chunkIndex=0,this.byteSize=0,this.flushTimer=null,this.MAX_BYTES=50*1024,this.FLUSH_INTERVAL=5e3,this.flushTimer=setInterval(()=>this.flush(),this.FLUSH_INTERVAL)}push(e){try{this.events.push(e),this.byteSize+=this.estimateSize(e),this.byteSize>=this.MAX_BYTES&&this.flush()}catch{}}flush(){if(this.events.length!==0)try{const e=this.events.splice(0);this.sender.send(e,this.chunkIndex++),this.byteSize=0}catch{}}destroy(){this.flushTimer&&(clearInterval(this.flushTimer),this.flushTimer=null),this.flush()}estimateSize(e){try{return e.type==="snapshot"?5e3:e.type==="mutation"?500:e.type==="mouse"?30:e.type==="click"?50:e.type==="scroll"?30:e.type==="input"?100:e.type==="resize"?30:100}catch{return 100}}}class zr{constructor(e,t){this.sessionId=e,this.api=t}async send(e,t){try{const i={chunks:[{session_id:this.sessionId,chunk_index:t,data:{events:e},timestamp:new Date().toISOString()}]};this.api.postKeepalive("/api/v1/recordings",i)}catch{}}}class Fr{constructor(e,t){this.startTime=0,this.destroyed=!1,this.clickHandler=null,this.sender=new zr(t,e),this.buffer=new Br(this.sender),this.serializer=new Rr,this.mouseObserver=new Nr,this.scrollObserver=new $r,this.inputObserver=new Dr,this.resizeObserver=new Or,this.mutationObserver=new Hr(this.serializer,i=>{this.pushEvent({type:"mutation",timestamp:this.elapsed(),data:i})})}start(){try{if(this.destroyed)return;this.startTime=Date.now();const e=this.serializer.serializeDocument();this.pushEvent({type:"snapshot",timestamp:0,data:e}),this.mutationObserver.start(),this.mouseObserver.start(t=>{this.pushEvent({type:"mouse",timestamp:this.elapsed(),data:t})}),this.scrollObserver.start(t=>{this.pushEvent({type:"scroll",timestamp:this.elapsed(),data:t})}),this.inputObserver.start(t=>{this.pushEvent({type:"input",timestamp:this.elapsed(),data:t})},t=>this.serializer.getNodeId(t)),this.resizeObserver.start(t=>{this.pushEvent({type:"resize",timestamp:this.elapsed(),data:t})}),this.clickHandler=t=>{try{const i=t.target;this.pushEvent({type:"click",timestamp:this.elapsed(),data:{x:t.clientX,y:t.clientY,targetId:this.serializer.getNodeId(i),tag:i==null?void 0:i.tagName}})}catch{}},document.addEventListener("click",this.clickHandler,{capture:!0,passive:!0})}catch(e){typeof console<"u"&&console.warn("[GuideAI] Recording start error:",e)}}destroy(){this.destroyed=!0;try{this.mutationObserver.stop(),this.mouseObserver.stop(),this.scrollObserver.stop(),this.inputObserver.stop(),this.resizeObserver.stop(),this.clickHandler&&(document.removeEventListener("click",this.clickHandler,{capture:!0}),this.clickHandler=null),this.buffer.destroy()}catch{}}pushEvent(e){this.destroyed||this.buffer.push(e)}elapsed(){return Date.now()-this.startTime}}function M(n){const e=document.createElement("div");return e.textContent=n,e.innerHTML}function Gr(n){return n.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function _(n,e,t){return{site_id:n,session_id:"",event_type:e,url:location.href,timestamp:new Date().toISOString(),metadata:t??{}}}function ze(n,e,t,i,r){const s=_(n,e,r);return s.guide_id=t,i!==void 0&&(s.step_index=i,s.total_steps=r==null?void 0:r.total_steps),s}function Fe(n,e,t,i,r){return{site_id:n,session_id:"",event_type:"guide_step_action",url:location.href,guide_id:e,step_index:t,timestamp:new Date().toISOString(),metadata:r?{action:i,detail:r}:{action:i}}}function Ge(n,e,t,i,r,s,o,a){return{site_id:n,session_id:"",event_type:"guide_step",url:location.href,guide_id:e,step_index:t,total_steps:i,timestamp:new Date().toISOString(),metadata:{step_title:r,action_type:s,has_target:o,interactive:a}}}const Mt="guideai_chip_dismissals",qr=15e3,Ur=150,Vr=48,Pt=300*1e3;class Wr{constructor(e,t,i,r){this.activeChips=new Map,this.dismissTimers=new Map,this.focusedIndex=-1,this.onKeyDown=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i,this.positionProvider=r}showChips(e){const t=this.getDismissals(),i=Date.now(),r=e.filter(a=>{const l=t.find(c=>c.chipId===a.id);return!l||i-l.dismissedAt>Pt});r.sort((a,l)=>a.priority-l.priority);const s=r.slice(0,3);let o=this.activeChips.size;s.forEach((a,l)=>{if(this.activeChips.has(a.id))return;const c=l*Ur;setTimeout(()=>{this.renderChip(a,o+l)},c)})}removeAll(){this.activeChips.forEach(e=>e.remove()),this.activeChips.clear(),this.dismissTimers.forEach(e=>clearTimeout(e)),this.dismissTimers.clear(),this.removeKeyboardListeners()}renderChip(e,t){var a;const i=document.createElement("div");i.className="guideai-chip",i.setAttribute("data-chip-id",e.id),i.setAttribute("role","option"),i.setAttribute("tabindex","-1"),i.setAttribute("aria-label",`${e.emoji} ${e.label}`),i.innerHTML=`
      <span class="guideai-chip-emoji">${M(e.emoji)}</span>
      <span class="guideai-chip-label">${M(e.label)}</span>
      <button class="guideai-chip-dismiss" aria-label="Dismiss">&times;</button>
    `,this.positionChip(i,e,t),i.style.opacity="0",i.style.transform="translateY(8px)",this.shadowRoot.appendChild(i),requestAnimationFrame(()=>{i.style.transition="opacity 250ms ease, transform 250ms ease",i.style.opacity="1",i.style.transform="translateY(0)"}),i.querySelector(".guideai-chip-dismiss").addEventListener("click",l=>{l.stopPropagation(),this.dismissChip(e.id)}),i.addEventListener("click",()=>{this.onChipClick(e)}),i.addEventListener("keydown",l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),this.onChipClick(e))}),this.activeChips.set(e.id,i),this.activeChips.size===1&&this.setupKeyboardListeners();const s=setTimeout(()=>{this.fadeOutAndRemove(e.id)},qr);this.dismissTimers.set(e.id,s);const o=_(this.config.siteId,"suggestion_shown",{chip_id:e.id,trigger_type:e.triggerType});o.element_text=e.label,(a=this.eventBuffer)==null||a.push(o)}positionChip(e,t,i){if(e.style.position="fixed",e.style.zIndex="2147483646",this.positionProvider){const r=this.positionProvider(),s=200;let a=r.x+40,l=r.y-20-i*44;a=Math.max(8,Math.min(a,window.innerWidth-s-8)),l=Math.max(8,l),e.style.left=`${a}px`,e.style.top=`${l}px`;return}e.style.right="20px",e.style.bottom=`${20+i*Vr}px`}anchorToElement(e,t){const i=t.getBoundingClientRect(),r=40,s=window.innerHeight,o=i.top,a=s-i.bottom;o>=r+8||o>a?e.style.top=`${i.top-r-8}px`:e.style.top=`${i.bottom+8}px`;const l=200;let c=i.left+i.width/2-l/2;c=Math.max(8,Math.min(c,window.innerWidth-l-8)),e.style.left=`${c}px`}findTarget(e){const t=document.querySelector(`[data-guideai="${e}"]`);if(t)return t;const i=document.getElementById(e);return i||null}setupKeyboardListeners(){this.removeKeyboardListeners(),this.onKeyDown=e=>{var i,r;const t=Array.from(this.activeChips.values());if(t.length!==0){if(e.key==="Escape"){e.preventDefault(),this.removeAll();return}if(e.key==="ArrowDown"||e.key==="ArrowRight"){e.preventDefault(),this.focusedIndex=Math.min(this.focusedIndex+1,t.length-1),(i=t[this.focusedIndex])==null||i.focus();return}if(e.key==="ArrowUp"||e.key==="ArrowLeft"){e.preventDefault(),this.focusedIndex=Math.max(this.focusedIndex-1,0),(r=t[this.focusedIndex])==null||r.focus();return}}},document.addEventListener("keydown",this.onKeyDown)}removeKeyboardListeners(){this.onKeyDown&&(document.removeEventListener("keydown",this.onKeyDown),this.onKeyDown=null),this.focusedIndex=-1}onChipClick(e){var r;const t=_(this.config.siteId,"suggestion_clicked",{chip_id:e.id,guide_id:e.guideId,trigger_type:e.triggerType});t.element_text=e.label,(r=this.eventBuffer)==null||r.push(t);const i=new CustomEvent("guideai:chip-click",{detail:{guideId:e.guideId,stepIndex:e.stepIndex,workflowId:e.workflowId}});document.dispatchEvent(i),this.fadeOutAndRemove(e.id)}dismissChip(e){const t=this.getDismissals();t.push({chipId:e,dismissedAt:Date.now()}),this.saveDismissals(t),this.fadeOutAndRemove(e)}fadeOutAndRemove(e){const t=this.activeChips.get(e);if(!t)return;t.style.transition="opacity 200ms ease, transform 200ms ease",t.style.opacity="0",t.style.transform="translateY(-8px)",setTimeout(()=>{t.remove(),this.activeChips.delete(e),this.activeChips.size===0&&this.removeKeyboardListeners()},200);const i=this.dismissTimers.get(e);i&&(clearTimeout(i),this.dismissTimers.delete(e))}getDismissals(){try{const e=localStorage.getItem(Mt);if(!e)return[];const t=JSON.parse(e),i=Date.now();return t.filter(r=>i-r.dismissedAt<Pt)}catch{return[]}}saveDismissals(e){try{localStorage.setItem(Mt,JSON.stringify(e))}catch{}}}function ue(n,e){if(!n)return!1;if(n==="*"||n===e)return!0;const t=n.replace(/\/$/,"").split("/"),i=e.replace(/\/$/,"").split("/");return t.length!==i.length?!1:t.every((r,s)=>r?r==="*"||r.startsWith(":")||r.startsWith("[")&&r.endsWith("]")?!0:r===i[s]:!i[s])}class jr{constructor(e,t,i,r,s,o){this.idleTimer=null,this.frustrationCount=0,this.lastActivity=Date.now(),this.destroyed=!1,this.onPopState=null,this.onFrustration=null,this.onActivity=null,this.onPlayerEnded=null,this.kb=e,this.config=t,this.eventBuffer=i,this.renderer=new Wr(t,i,r,s),this.isGuideActive=o}start(){this.evaluatePageMatch(),this.evaluateGuideProgress(),this.onPopState=()=>{this.destroyed||(this.evaluatePageMatch(),this.evaluateGuideProgress())},window.addEventListener("popstate",this.onPopState),this.patchHistoryApi(),this.onFrustration=()=>{this.destroyed||(this.frustrationCount++,this.frustrationCount>=3&&(this.evaluateFrustration(),this.frustrationCount=0))},document.addEventListener("guideai:frustration",this.onFrustration),this.onActivity=()=>{this.lastActivity=Date.now(),this.resetIdleTimer()},document.addEventListener("mousemove",this.onActivity,{passive:!0}),document.addEventListener("keydown",this.onActivity,{passive:!0}),document.addEventListener("scroll",this.onActivity,{passive:!0}),this.resetIdleTimer(),this.onPlayerEnded=()=>{this.destroyed||this.evaluateGuideProgress()},document.addEventListener("guideai:player-ended",this.onPlayerEnded)}destroy(){this.destroyed=!0,this.renderer.removeAll(),this.onPopState&&window.removeEventListener("popstate",this.onPopState),this.onFrustration&&document.removeEventListener("guideai:frustration",this.onFrustration),this.onActivity&&(document.removeEventListener("mousemove",this.onActivity),document.removeEventListener("keydown",this.onActivity),document.removeEventListener("scroll",this.onActivity)),this.onPlayerEnded&&document.removeEventListener("guideai:player-ended",this.onPlayerEnded),this.idleTimer&&(clearTimeout(this.idleTimer),this.idleTimer=null)}evaluatePageMatch(){const e=location.pathname,t=[];for(const i of this.kb.elements)ue(i.route_path,e)&&i.data_guideai&&t.push({id:`page_${i.id}`,label:i.text??i.aria_label??"Try this",emoji:"💡",triggerType:"page_match",targetElementId:i.id,pagePattern:i.route_path,priority:10});t.length>0&&this.renderer.showChips(t.slice(0,3))}evaluateGuideProgress(){var i;if(!this.config.guidesEnabled||(i=this.isGuideActive)!=null&&i.call(this))return;const e=`guideai_active_${this.config.siteId}`,t=sessionStorage.getItem(e);if(t)try{const r=JSON.parse(t);if(r.expected_url&&ue(r.expected_url,location.pathname))return;const s={id:`progress_${r.guide_id}`,label:"Continue your guide",emoji:"▶️",triggerType:"guide_progress",guideId:r.guide_id,stepIndex:r.current_step_index,priority:1};this.renderer.showChips([s])}catch{}}evaluateFrustration(){const e={id:`frustration_${Date.now()}`,label:"Need help?",emoji:"🤔",triggerType:"frustration",priority:5};this.renderer.showChips([e])}evaluateIdle(){if(this.destroyed||Date.now()-this.lastActivity<this.config.idleTimeout)return;const e={id:`idle_${Date.now()}`,label:"Stuck? Let us help",emoji:"⏰",triggerType:"idle",priority:8};this.renderer.showChips([e])}resetIdleTimer(){this.idleTimer&&clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>this.evaluateIdle(),this.config.idleTimeout)}patchHistoryApi(){const e=history.pushState.bind(history),t=history.replaceState.bind(history);history.pushState=(...i)=>{e(...i),this.destroyed||(this.evaluatePageMatch(),this.evaluateGuideProgress())},history.replaceState=(...i)=>{t(...i),this.destroyed||(this.evaluatePageMatch(),this.evaluateGuideProgress())}}}class Kr{constructor(e,t){this.siteId=e,this.kb=t,this.storageKey=`guideai_active_${e}`}save(e,t,i){const r={guide_id:e,current_step_index:t,started_at:new Date().toISOString(),expected_url:i};try{sessionStorage.setItem(this.storageKey,JSON.stringify(r))}catch{}}clear(){try{sessionStorage.removeItem(this.storageKey)}catch{}}check(){}getState(){try{const e=sessionStorage.getItem(this.storageKey);return e?JSON.parse(e):null}catch{return null}}destroy(){}}const qe="guideai_announcement_dismissals",Yr="/api/v1/announcements";class Xr{constructor(e,t,i,r){this.announcements=[],this.activeEl=null,this.idleTimer=null,this.onActivity=null,this.destroyed=!1,this.api=e,this.config=t,this.eventBuffer=i,this.shadowRoot=r}async init(){try{const e=await this.api.get(`${Yr}/active`);this.announcements=Array.isArray(e)?e:[]}catch{this.announcements=[]}this.announcements.length!==0&&(this.evaluatePageMatch(),this.setupIdleDetection(),document.addEventListener("guideai:frustration",()=>{this.destroyed||this.evaluateFrustration()}))}destroy(){this.destroyed=!0,this.removeActive(),this.idleTimer&&(clearTimeout(this.idleTimer),this.idleTimer=null),this.onActivity&&(document.removeEventListener("mousemove",this.onActivity),document.removeEventListener("keydown",this.onActivity),this.onActivity=null)}evaluatePageMatch(){const e=location.pathname;for(const t of this.announcements)if(t.trigger_type==="page_match"&&!this.isDismissed(t.id)&&t.page_url_pattern&&this.matchPattern(t.page_url_pattern,e)){this.showAnnouncement(t);return}}evaluateIdle(){for(const e of this.announcements){if(e.trigger_type!=="idle"||this.isDismissed(e.id))continue;if(!e.page_url_pattern||this.matchPattern(e.page_url_pattern,location.pathname)){this.showAnnouncement(e);return}}}evaluateFrustration(){for(const e of this.announcements){if(e.trigger_type!=="frustration"||this.isDismissed(e.id))continue;if(!e.page_url_pattern||this.matchPattern(e.page_url_pattern,location.pathname)){this.showAnnouncement(e);return}}}showAnnouncement(e){var o;if(this.activeEl)return;const t=document.createElement("div");t.className="guideai-announcement",t.setAttribute("role","dialog"),t.setAttribute("aria-label",e.title),t.innerHTML=`
      <div class="guideai-announcement-backdrop"></div>
      <div class="guideai-announcement-card">
        <button class="guideai-announcement-close" aria-label="Close">&times;</button>
        <h3 class="guideai-announcement-title">${M(e.title)}</h3>
        <p class="guideai-announcement-message">${M(e.message)}</p>
        ${e.linked_guide_id?'<button class="guideai-announcement-cta">Start Guide</button>':""}
      </div>
    `,this.shadowRoot.appendChild(t),this.activeEl=t,t.style.opacity="0",requestAnimationFrame(()=>{t.style.transition="opacity 250ms ease",t.style.opacity="1"});const i=t.querySelector(".guideai-announcement-close");i==null||i.addEventListener("click",()=>{this.dismiss(e.id)});const r=t.querySelector(".guideai-announcement-backdrop");r==null||r.addEventListener("click",()=>{this.dismiss(e.id)});const s=t.querySelector(".guideai-announcement-cta");s==null||s.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("guideai:chip-click",{detail:{guideId:e.linked_guide_id}})),this.dismiss(e.id)}),(o=this.eventBuffer)==null||o.push(_(this.config.siteId,"suggestion_shown",{announcement_id:e.id,announcement_title:e.title}))}dismiss(e){this.saveDismissal(e),this.removeActive()}removeActive(){if(this.activeEl){this.activeEl.style.opacity="0";const e=this.activeEl;setTimeout(()=>e.remove(),250),this.activeEl=null}}setupIdleDetection(){if(!this.announcements.some(i=>i.trigger_type==="idle"))return;const t=()=>{this.idleTimer&&clearTimeout(this.idleTimer),this.idleTimer=setTimeout(()=>{this.destroyed||this.evaluateIdle()},this.config.idleTimeout)};this.onActivity=t,document.addEventListener("mousemove",this.onActivity,{passive:!0}),document.addEventListener("keydown",this.onActivity,{passive:!0}),t()}isDismissed(e){try{const t=localStorage.getItem(qe);return t?JSON.parse(t).includes(e):!1}catch{return!1}}saveDismissal(e){try{const t=localStorage.getItem(qe),i=t?JSON.parse(t):[];i.includes(e)||(i.push(e),localStorage.setItem(qe,JSON.stringify(i)))}catch{}}matchPattern(e,t){if(e===t)return!0;if(e.endsWith("*")){const i=e.slice(0,-1);return t.startsWith(i)}if(e.startsWith("/")&&e.endsWith("/")&&e.length>2)try{return new RegExp(e.slice(1,-1)).test(t)}catch{return!1}return!1}}const Rt={robot:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <line x1="32" y1="8" x2="32" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="32" cy="6" r="2.5" fill="currentColor" opacity="0.8"/>
  <rect x="16" y="14" width="32" height="26" rx="7" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <circle class="guideai-eye" cx="25" cy="27" r="3.5" fill="currentColor"/>
  <circle class="guideai-eye" cx="39" cy="27" r="3.5" fill="currentColor"/>
  <path d="M25 34 Q32 39 39 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <rect x="22" y="42" width="20" height="10" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`,ant:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <ellipse cx="32" cy="38" rx="12" ry="14" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <circle cx="32" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <circle class="guideai-eye" cx="28" cy="19" r="2.5" fill="currentColor"/>
  <circle class="guideai-eye" cx="36" cy="19" r="2.5" fill="currentColor"/>
  <path d="M27 8 Q24 4 20 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M37 8 Q40 4 44 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="32" x2="12" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="44" y1="32" x2="52" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="40" x2="10" y2="38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <line x1="44" y1="40" x2="54" y2="38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`,owl:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <ellipse cx="32" cy="34" rx="18" ry="20" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <circle cx="24" cy="30" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="40" cy="30" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle class="guideai-eye" cx="24" cy="30" r="3" fill="currentColor"/>
  <circle class="guideai-eye" cx="40" cy="30" r="3" fill="currentColor"/>
  <path d="M30 38 L32 42 L34 38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 22 Q18 10 24 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M50 22 Q46 10 40 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M20 50 L18 56" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M44 50 L46 56" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`,fox:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <path d="M12 16 L20 8 L24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M52 16 L44 8 L40 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="32" cy="36" rx="18" ry="16" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <circle class="guideai-eye" cx="24" cy="32" r="3" fill="currentColor"/>
  <circle class="guideai-eye" cx="40" cy="32" r="3" fill="currentColor"/>
  <circle cx="32" cy="40" r="2.5" fill="currentColor"/>
  <path d="M28 44 Q32 48 36 44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="14" y1="36" x2="8" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="14" y1="40" x2="8" y2="42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="50" y1="36" x2="56" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="50" y1="40" x2="56" y2="42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,cat:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <path d="M14 20 L18 6 L26 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M50 20 L46 6 L38 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="32" cy="36" rx="18" ry="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <ellipse class="guideai-eye" cx="24" cy="32" rx="2.5" ry="4" fill="currentColor"/>
  <ellipse class="guideai-eye" cx="40" cy="32" rx="2.5" ry="4" fill="currentColor"/>
  <ellipse cx="32" cy="40" rx="2" ry="1.5" fill="currentColor"/>
  <path d="M30 42 Q32 44 34 42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="14" y1="38" x2="6" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="14" y1="42" x2="6" y2="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="50" y1="38" x2="58" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="50" y1="42" x2="58" y2="44" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`,bee:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <ellipse cx="32" cy="36" rx="14" ry="16" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <line x1="22" y1="30" x2="42" y2="30" stroke="currentColor" stroke-width="1.5"/>
  <line x1="20" y1="38" x2="44" y2="38" stroke="currentColor" stroke-width="1.5"/>
  <line x1="22" y1="46" x2="42" y2="46" stroke="currentColor" stroke-width="1.5"/>
  <circle class="guideai-eye" cx="27" cy="26" r="2.5" fill="currentColor"/>
  <circle class="guideai-eye" cx="37" cy="26" r="2.5" fill="currentColor"/>
  <path d="M29 34 Q32 36 35 34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M24 14 Q20 6 16 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M40 14 Q44 6 48 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="16" cy="4" r="2" fill="currentColor" opacity="0.7"/>
  <circle cx="48" cy="4" r="2" fill="currentColor" opacity="0.7"/>
  <ellipse cx="16" cy="28" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6" transform="rotate(-20 16 28)"/>
  <ellipse cx="48" cy="28" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6" transform="rotate(20 48 28)"/>
</svg>`,spark:`<svg viewBox="0 0 64 64" width="28" height="28" fill="none">
  <path d="M32 4 L36 24 L52 16 L40 32 L60 36 L40 40 L52 56 L36 44 L32 60 L28 44 L12 56 L24 40 L4 36 L24 32 L12 16 L28 24 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="26" cy="32" r="2.5" fill="currentColor"/>
  <circle cx="38" cy="32" r="2.5" fill="currentColor"/>
  <path d="M28 38 Q32 42 36 38" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`};function Jr(n){return Rt[n]??Rt.robot}const Qr=600,Zr=5e3,en=60;class tn{constructor(e,t,i){this.el=null,this.nudgeEl=null,this.nudgeTimer=null,this.x=0,this.y=0,this.vx=0,this.vy=0,this.tx=0,this.ty=0,this.rafId=null,this.targetTimer=null,this.hovered=!1,this.driftEnabled=!0,this.reducedMotion=!1,this.longPressTimer=null,this.longPressTriggered=!1,this.callbacks=null,this.onVisibilityChange=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i,this.driftEnabled=e.bubbleDrift.enabled,typeof window<"u"&&window.matchMedia&&(this.reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches)}render(e){if(this.el)return;this.callbacks=e;const t=document.createElement("div");t.className="guideai-bubble",t.setAttribute("role","button"),t.setAttribute("aria-label","Open GuideAI help"),t.setAttribute("tabindex","0");const i=this.config.bubbleImageUrl,r=i?`<img class="guideai-bubble-img" src="${Gr(i)}" alt="Help" draggable="false" />`:Jr(this.config.bubbleIcon);t.innerHTML=`
      <div class="guideai-bubble-icon">${r}</div>
      <span class="guideai-bubble-label">${M(this.config.bubbleLabelText)}</span>
    `;const s=window.innerWidth-200,o=window.innerHeight-80;this.x=s,this.y=o,this.tx=s,this.ty=o,t.style.left=`${this.x}px`,t.style.top=`${this.y}px`,t.style.opacity="0",t.style.scale="0",this.shadowRoot.appendChild(t),requestAnimationFrame(()=>{t.style.transition="opacity 300ms ease, scale 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",t.style.opacity="1",t.style.scale="1",setTimeout(()=>{t.style.transition="box-shadow 200ms ease",t.style.scale=""},500)}),t.addEventListener("pointerenter",()=>{this.hovered=!0}),t.addEventListener("pointerleave",()=>{this.hovered=!1,this.cancelLongPress()}),t.addEventListener("pointerdown",a=>{a.preventDefault(),this.longPressTriggered=!1,t.classList.add("guideai-bubble--pressing"),this.longPressTimer=setTimeout(()=>{var l;this.longPressTriggered=!0,t.classList.remove("guideai-bubble--pressing"),(l=e.onLongPress)==null||l.call(e)},Qr)}),t.addEventListener("pointerup",()=>{t.classList.remove("guideai-bubble--pressing"),this.longPressTriggered||(this.cancelLongPress(),e.onClick()),this.cancelLongPress()}),t.addEventListener("pointercancel",()=>{t.classList.remove("guideai-bubble--pressing"),this.cancelLongPress()}),t.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),e.onClick())}),this.el=t,!this.reducedMotion&&this.driftEnabled&&(this.pickNewTarget(),this.startDrift()),this.onVisibilityChange=()=>{document.hidden?this.stopDrift():!this.reducedMotion&&this.driftEnabled&&this.startDrift()},document.addEventListener("visibilitychange",this.onVisibilityChange)}getPosition(){return{x:this.x,y:this.y}}setDriftEnabled(e){this.driftEnabled=e,e?!this.reducedMotion&&this.el&&(this.pickNewTarget(),this.startDrift()):(this.stopDrift(),this.targetTimer&&(clearTimeout(this.targetTimer),this.targetTimer=null))}setFixed(e){this.setDriftEnabled(!1),this.el&&(this.el.style.left="",this.el.style.top="",e==="bottom-left"?this.el.style.left="20px":this.el.style.right="20px",this.el.style.bottom="20px",this.el.classList.add("guideai-bubble--fixed"),requestAnimationFrame(()=>{if(!this.el)return;const t=this.el.getBoundingClientRect();this.x=t.left+t.width/2,this.y=t.top+t.height/2}))}addModifier(e){var t;(t=this.el)==null||t.classList.add(e)}setPulsing(e){this.el&&(e?this.el.classList.add("guideai-bubble--pulsing"):this.el.classList.remove("guideai-bubble--pulsing"))}showNudge(e,t=Zr){this.removeNudge();const i=document.createElement("div");i.className="guideai-nudge-tooltip",i.textContent=e,i.style.left=`${this.x}px`,i.style.top=`${this.y-50}px`,this.shadowRoot.appendChild(i),this.nudgeEl=i,this.nudgeTimer=setTimeout(()=>{this.removeNudge()},t)}remove(){this.stopDrift(),this.cancelLongPress(),this.removeNudge(),this.onVisibilityChange&&(document.removeEventListener("visibilitychange",this.onVisibilityChange),this.onVisibilityChange=null),this.targetTimer&&(clearTimeout(this.targetTimer),this.targetTimer=null),this.el&&(this.el.remove(),this.el=null),this.callbacks=null}startDrift(){if(this.rafId!==null)return;const e=()=>{if(this.el){if(!this.hovered){const{spring:t,damping:i}=this.config.bubbleDrift;this.vx+=(this.tx-this.x)*t,this.vy+=(this.ty-this.y)*t,this.vx*=i,this.vy*=i,this.x+=this.vx,this.y+=this.vy,this.el.style.left=`${this.x}px`,this.el.style.top=`${this.y}px`,this.nudgeEl&&(this.nudgeEl.style.left=`${this.x}px`,this.nudgeEl.style.top=`${this.y-50}px`)}this.rafId=requestAnimationFrame(e)}};this.rafId=requestAnimationFrame(e)}stopDrift(){this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)}pickNewTarget(){const e=en,t=window.innerWidth,i=window.innerHeight;this.tx=e+Math.random()*(t-e*2-100),this.ty=e+Math.random()*(i-e*2-60);const{minTargetInterval:r,maxTargetInterval:s}=this.config.bubbleDrift,o=r+Math.random()*(s-r);this.targetTimer=setTimeout(()=>{this.pickNewTarget()},o)}cancelLongPress(){this.longPressTimer&&(clearTimeout(this.longPressTimer),this.longPressTimer=null)}removeNudge(){this.nudgeTimer&&(clearTimeout(this.nudgeTimer),this.nudgeTimer=null),this.nudgeEl&&(this.nudgeEl.remove(),this.nudgeEl=null)}}const Ht={robot:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <line x1="32" y1="4" x2="32" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="32" cy="3" r="2.5" fill="currentColor" opacity="0.8"/>
    <rect x="16" y="10" width="32" height="22" rx="6" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <circle class="guideai-eye" cx="25" cy="21" r="3.5" fill="currentColor"/>
    <circle class="guideai-eye" cx="39" cy="21" r="3.5" fill="currentColor"/>
    <path d="M25 28 Q32 33 39 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <rect x="20" y="34" width="24" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <rect x="22" y="47" width="6" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="25" cy="58" rx="5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <rect x="36" y="47" width="6" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="39" cy="58" rx="5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
</svg>`,ant:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <circle cx="32" cy="16" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <circle class="guideai-eye" cx="28" cy="15" r="2.5" fill="currentColor"/>
    <circle class="guideai-eye" cx="36" cy="15" r="2.5" fill="currentColor"/>
    <path d="M27 6 Q24 2 20 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M37 6 Q40 2 44 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="32" cy="30" rx="8" ry="6" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="32" cy="44" rx="11" ry="10" fill="none" stroke="currentColor" stroke-width="2.5"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <line x1="24" y1="26" x2="12" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="24" y1="32" x2="10" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="22" y1="42" x2="10" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <line x1="40" y1="26" x2="52" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="32" x2="54" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="42" y1="42" x2="54" y2="46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`,owl:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <ellipse cx="32" cy="28" rx="18" ry="20" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="40" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle class="guideai-eye" cx="24" cy="24" r="3" fill="currentColor"/>
    <circle class="guideai-eye" cx="40" cy="24" r="3" fill="currentColor"/>
    <path d="M30 32 L32 36 L34 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 16 Q18 4 24 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50 16 Q46 4 40 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <path d="M22 46 L18 56 L22 54 L20 58" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <path d="M42 46 L46 56 L42 54 L44 58" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`,fox:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <path d="M12 12 L20 4 L24 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M52 12 L44 4 L40 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="32" cy="30" rx="18" ry="16" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <circle class="guideai-eye" cx="24" cy="26" r="3" fill="currentColor"/>
    <circle class="guideai-eye" cx="40" cy="26" r="3" fill="currentColor"/>
    <circle cx="32" cy="34" r="2.5" fill="currentColor"/>
    <path d="M28 38 Q32 42 36 38" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <rect x="22" y="44" width="5" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="24.5" cy="57" rx="4" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <rect x="37" y="44" width="5" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="39.5" cy="57" rx="4" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
</svg>`,cat:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <path d="M14 16 L18 2 L26 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M50 16 L46 2 L38 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="32" cy="30" rx="18" ry="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <ellipse class="guideai-eye" cx="24" cy="26" rx="2.5" ry="4" fill="currentColor"/>
    <ellipse class="guideai-eye" cx="40" cy="26" rx="2.5" ry="4" fill="currentColor"/>
    <ellipse cx="32" cy="34" rx="2" ry="1.5" fill="currentColor"/>
    <path d="M30 36 Q32 38 34 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <rect x="20" y="46" width="5" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="22.5" cy="57" rx="4" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <rect x="39" y="46" width="5" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/>
    <ellipse cx="41.5" cy="57" rx="4" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
</svg>`,bee:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <ellipse cx="32" cy="28" rx="14" ry="16" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <line x1="22" y1="22" x2="42" y2="22" stroke="currentColor" stroke-width="1.5"/>
    <line x1="20" y1="30" x2="44" y2="30" stroke="currentColor" stroke-width="1.5"/>
    <line x1="22" y1="38" x2="42" y2="38" stroke="currentColor" stroke-width="1.5"/>
    <circle class="guideai-eye" cx="27" cy="18" r="2.5" fill="currentColor"/>
    <circle class="guideai-eye" cx="37" cy="18" r="2.5" fill="currentColor"/>
    <path d="M29 26 Q32 28 35 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M24 8 Q20 0 16 -2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M40 8 Q44 0 48 -2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="-2" r="2" fill="currentColor" opacity="0.7"/>
    <circle cx="48" cy="-2" r="2" fill="currentColor" opacity="0.7"/>
    <ellipse cx="16" cy="20" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6" transform="rotate(-20 16 20)"/>
    <ellipse cx="48" cy="20" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6" transform="rotate(20 48 20)"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <line x1="22" y1="42" x2="16" y2="54" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="42" x2="22" y2="54" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="20" y1="36" x2="12" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <line x1="42" y1="42" x2="48" y2="54" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="38" y1="42" x2="42" y2="54" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="36" x2="52" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`,spark:`<svg viewBox="0 0 64 64" width="48" height="56" fill="none">
  <g class="guideai-crawl-body">
    <path d="M32 2 L36 18 L50 12 L40 26 L56 30 L40 34 L50 48 L36 40 L32 52 L28 40 L14 48 L24 34 L8 30 L24 26 L14 12 L28 18 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <circle class="guideai-eye" cx="26" cy="28" r="2.5" fill="currentColor"/>
    <circle class="guideai-eye" cx="38" cy="28" r="2.5" fill="currentColor"/>
    <path d="M28 34 Q32 38 36 34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g class="guideai-crawl-leg-left">
    <rect x="24" y="50" width="4" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <ellipse cx="26" cy="61" rx="3.5" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
  <g class="guideai-crawl-leg-right">
    <rect x="36" y="50" width="4" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <ellipse cx="38" cy="61" rx="3.5" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  </g>
</svg>`};function rn(n){return Ht[n]??Ht.robot}const Ue=16,X=48,J=56,nn=600,Nt=["bottom","right","top","left"];class sn{constructor(e,t,i){this.el=null,this.innerEl=null,this.speechEl=null,this.speechTextEl=null,this.x=0,this.y=0,this.currentEdgeIndex=0,this.progress=0,this.paused=!1,this.cornerPausing=!1,this.rafId=null,this.lastTime=0,this.reducedMotion=!1,this.messageIndex=0,this.messageTimer=null,this.hovered=!1,this.longPressTimer=null,this.longPressTriggered=!1,this.callbacks=null,this.onResize=null,this.onVisibilityChange=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i,typeof window<"u"&&window.matchMedia&&(this.reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches)}render(e){if(this.el)return;this.callbacks=e;const t=document.createElement("div");t.className="guideai-crawl-mascot",t.setAttribute("role","button"),t.setAttribute("aria-label","Open GuideAI help"),t.setAttribute("tabindex","0");const i=document.createElement("div");i.className="guideai-crawl-inner",i.innerHTML=rn(this.config.bubbleIcon),t.appendChild(i),this.innerEl=i;const r=this.getEdgePath("bottom");this.x=r.startX,this.y=r.startY,this.progress=0,this.currentEdgeIndex=0,t.style.left=`${this.x}px`,t.style.top=`${this.y}px`,t.style.opacity="0",this.shadowRoot.appendChild(t),requestAnimationFrame(()=>{t.style.opacity="1"}),t.addEventListener("pointerenter",()=>{this.hovered=!0,t.classList.add("guideai-crawl-mascot--paused")}),t.addEventListener("pointerleave",()=>{this.hovered=!1,t.classList.remove("guideai-crawl-mascot--paused"),this.cancelLongPress()}),t.addEventListener("pointerdown",s=>{s.preventDefault(),this.longPressTriggered=!1,this.longPressTimer=setTimeout(()=>{var o;this.longPressTriggered=!0,(o=e.onLongPress)==null||o.call(e)},nn)}),t.addEventListener("pointerup",()=>{this.longPressTriggered||(this.cancelLongPress(),e.onClick()),this.cancelLongPress()}),t.addEventListener("pointercancel",()=>{this.cancelLongPress()}),t.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),e.onClick())}),this.el=t,this.config.bubbleCrawl.persistentSpeech&&this.createSpeechBubble(),this.reducedMotion?(this.x=window.innerWidth-Ue-X,this.y=window.innerHeight-Ue-J,t.style.left=`${this.x}px`,t.style.top=`${this.y}px`):(this.applyEdgeTransform(),this.startCrawl(),this.startMessageCycle()),this.onResize=()=>this.handleResize(),window.addEventListener("resize",this.onResize),this.onVisibilityChange=()=>{document.hidden?this.stopCrawl():this.reducedMotion||this.startCrawl()},document.addEventListener("visibilitychange",this.onVisibilityChange)}getPosition(){return{x:this.x+X/2,y:this.y+J/2}}setSpeechMessage(e){this.speechTextEl&&(this.speechTextEl.textContent=e,this.speechTextEl.style.animation="none",this.speechTextEl.offsetHeight,this.speechTextEl.style.animation="")}setSpeechVisible(e){this.speechEl&&(this.speechEl.style.display=e?"":"none")}remove(){this.stopCrawl(),this.stopMessageCycle(),this.cancelLongPress(),this.onResize&&(window.removeEventListener("resize",this.onResize),this.onResize=null),this.onVisibilityChange&&(document.removeEventListener("visibilitychange",this.onVisibilityChange),this.onVisibilityChange=null),this.speechEl&&(this.speechEl.remove(),this.speechEl=null,this.speechTextEl=null),this.el&&(this.el.remove(),this.el=null,this.innerEl=null),this.callbacks=null}createSpeechBubble(){const e=document.createElement("div");e.className="guideai-crawl-speech guideai-crawl-speech--bottom";const t=document.createElement("span");t.className="guideai-crawl-speech-text";const i=this.config.bubbleCrawl.messages;t.textContent=i.length>0?i[0]:"",e.appendChild(t),this.shadowRoot.appendChild(e),this.speechEl=e,this.speechTextEl=t,this.updateSpeechPosition()}updateSpeechPosition(){if(!this.speechEl)return;const e=this.currentEdge,t=8;switch(this.speechEl.className="guideai-crawl-speech",e){case"bottom":this.speechEl.classList.add("guideai-crawl-speech--bottom"),this.speechEl.style.left=`${this.x-10}px`,this.speechEl.style.top=`${this.y-50-t}px`;break;case"right":this.speechEl.classList.add("guideai-crawl-speech--right"),this.speechEl.style.left=`${this.x-210-t}px`,this.speechEl.style.top=`${this.y-10}px`;break;case"top":this.speechEl.classList.add("guideai-crawl-speech--top"),this.speechEl.style.left=`${this.x-10}px`,this.speechEl.style.top=`${this.y+J+t}px`;break;case"left":this.speechEl.classList.add("guideai-crawl-speech--left"),this.speechEl.style.left=`${this.x+X+t}px`,this.speechEl.style.top=`${this.y-10}px`;break}}startMessageCycle(){const{messages:e,messageIntervalMs:t}=this.config.bubbleCrawl;e.length<=1||(this.messageTimer=setInterval(()=>{this.messageIndex=(this.messageIndex+1)%e.length,this.setSpeechMessage(e[this.messageIndex])},t))}stopMessageCycle(){this.messageTimer&&(clearInterval(this.messageTimer),this.messageTimer=null)}get currentEdge(){return Nt[this.currentEdgeIndex]}getEdgePath(e){const t=window.innerWidth,i=window.innerHeight,r=Ue;switch(e){case"bottom":return{startX:r,startY:i-r-J,endX:t-r-X,endY:i-r-J,rotation:0,scaleX:1};case"right":return{startX:t-r-X,startY:i-r-J,endX:t-r-X,endY:r,rotation:0,scaleX:1};case"top":return{startX:t-r-X,startY:r,endX:r,endY:r,rotation:0,scaleX:-1};case"left":return{startX:r,startY:r,endX:r,endY:i-r-J,rotation:0,scaleX:-1}}}getEdgeLength(e){const t=this.getEdgePath(e),i=t.endX-t.startX,r=t.endY-t.startY;return Math.sqrt(i*i+r*r)}startCrawl(){if(this.rafId!==null)return;this.lastTime=0;const e=t=>{this.el&&(this.tick(t),this.rafId=requestAnimationFrame(e))};this.rafId=requestAnimationFrame(e)}stopCrawl(){this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)}tick(e){if(this.lastTime===0){this.lastTime=e;return}if(this.hovered||this.paused||this.cornerPausing){this.lastTime=e;return}const t=Math.min(e-this.lastTime,50);this.lastTime=e;const i=this.getEdgeLength(this.currentEdge);if(i===0){this.advanceToNextEdge();return}const r=this.config.bubbleCrawl.speed*(t/1e3);if(this.progress+=r/i,this.progress>=1){this.progress=0,this.doCornerPause();return}this.updatePosition()}updatePosition(){if(!this.el)return;const e=this.getEdgePath(this.currentEdge);this.x=e.startX+(e.endX-e.startX)*this.progress,this.y=e.startY+(e.endY-e.startY)*this.progress,this.el.style.left=`${this.x}px`,this.el.style.top=`${this.y}px`,this.updateSpeechPosition()}applyEdgeTransform(){if(!this.innerEl)return;const e=this.getEdgePath(this.currentEdge);this.innerEl.style.transform=`scaleX(${e.scaleX})`}doCornerPause(){var i;const{cornerPauseMs:e,climbWalls:t}=this.config.bubbleCrawl;if(!t){this.progress=0,this.updatePosition();return}this.cornerPausing=!0,(i=this.el)==null||i.classList.add("guideai-crawl-mascot--paused","guideai-crawl-mascot--looking"),setTimeout(()=>{var r;(r=this.el)==null||r.classList.remove("guideai-crawl-mascot--paused","guideai-crawl-mascot--looking"),this.advanceToNextEdge(),this.cornerPausing=!1},e)}advanceToNextEdge(){this.currentEdgeIndex=(this.currentEdgeIndex+1)%Nt.length,this.progress=0,this.applyEdgeTransform(),this.updatePosition()}handleResize(){this.updatePosition()}cancelLongPress(){this.longPressTimer&&(clearTimeout(this.longPressTimer),this.longPressTimer=null)}}const on=3e3;class an{constructor(e,t,i,r){this.renderer=null,this.crawlRenderer=null,this.isCrawlMode=!1,this.pulseTimer=null,this.destroyed=!1,this.onFrustration=null,this.onResourceCenterClose=null,this.config=t,this.kb=e,this.eventBuffer=i,this.shadowRoot=r}start(){if(this.destroyed||!this.config.bubbleEnabled)return;this.isCrawlMode=this.config.bubbleMode==="crawl";const e={onClick:()=>this.handleClick(),onLongPress:()=>this.handleLongPress()};this.isCrawlMode?(this.crawlRenderer=new sn(this.config,this.eventBuffer,this.shadowRoot),this.crawlRenderer.render(e)):(this.renderer=new tn(this.config,this.eventBuffer,this.shadowRoot),this.renderer.render(e)),this.onFrustration=()=>{this.isCrawlMode||(this.setPulsing(!0),this.pulseTimer&&clearTimeout(this.pulseTimer),this.pulseTimer=setTimeout(()=>{this.setPulsing(!1)},on))},document.addEventListener("guideai:frustration",this.onFrustration),this.onResourceCenterClose=()=>{},document.addEventListener("guideai:resource-center-close",this.onResourceCenterClose)}getPosition(){var e;return this.isCrawlMode&&this.crawlRenderer?this.crawlRenderer.getPosition():((e=this.renderer)==null?void 0:e.getPosition())??{x:0,y:0}}setDriftEnabled(e){var t;(t=this.renderer)==null||t.setDriftEnabled(e)}setFixed(e){var t;(t=this.renderer)==null||t.setFixed(e)}addModifier(e){var t;(t=this.renderer)==null||t.addModifier(e)}setPulsing(e){var t;(t=this.renderer)==null||t.setPulsing(e)}showNudge(e){var t;this.isCrawlMode&&this.crawlRenderer?this.crawlRenderer.setSpeechMessage(e):(t=this.renderer)==null||t.showNudge(e)}setCrawlMessage(e){var t;(t=this.crawlRenderer)==null||t.setSpeechMessage(e)}setCrawlSpeechVisible(e){var t;(t=this.crawlRenderer)==null||t.setSpeechVisible(e)}destroy(){var e,t;this.destroyed=!0,this.pulseTimer&&(clearTimeout(this.pulseTimer),this.pulseTimer=null),this.onFrustration&&(document.removeEventListener("guideai:frustration",this.onFrustration),this.onFrustration=null),this.onResourceCenterClose&&(document.removeEventListener("guideai:resource-center-close",this.onResourceCenterClose),this.onResourceCenterClose=null),(e=this.renderer)==null||e.remove(),(t=this.crawlRenderer)==null||t.remove()}handleClick(){var e;(e=this.eventBuffer)==null||e.push(_(this.config.siteId,"bubble_click")),document.dispatchEvent(new CustomEvent("guideai:bubble-click"))}handleLongPress(){var e;(e=this.eventBuffer)==null||e.push(_(this.config.siteId,"bubble_long_press")),document.dispatchEvent(new CustomEvent("guideai:bubble-longpress"))}}const ln='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',cn='<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M4 2.5v11l9-5.5z"/></svg>',$t='<svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M3 2h3v12H3zM10 2h3v12h-3z"/></svg>',dn='<svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M4 2.5v11l9-5.5z"/></svg>';class un{constructor(e,t,i){this.el=null,this.messagesEl=null,this.inputEl=null,this.sendBtn=null,this.typingEl=null,this.callbacks=null,this.outsideClickHandler=null,this.escHandler=null,this.pauseBtn=null,this.guidePaused=!1,this.playerPausedHandler=null,this.playerResumedHandler=null,this.playerEndedHandler=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i}render(e){var o,a,l;if(this.el)return;this.callbacks=e;const t=document.createElement("div");t.className="guideai-chat",t.setAttribute("role","dialog"),t.setAttribute("aria-label","GuideAI Chat"),t.innerHTML=`
      <div class="guideai-chat-header">
        <h3 class="guideai-chat-title">GuideAI</h3>
        <div class="guideai-chat-header-actions">
          <button class="guideai-chat-pause" aria-label="Pause guide" style="display:none;">${$t} Pause</button>
          <button class="guideai-chat-close" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="guideai-chat-messages">
        <div class="guideai-chat-welcome">
          <div class="guideai-chat-welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/>
            </svg>
          </div>
          <p class="guideai-chat-welcome-text">Hi! Ask me anything about this app and I'll guide you step by step.</p>
          <div class="guideai-chat-suggestions">
            <button class="guideai-chat-suggestion" data-q="How do I get started?">How do I get started?</button>
            <button class="guideai-chat-suggestion" data-q="Show me around">Show me around</button>
          </div>
          <div class="guideai-chat-support-btn-wrap" style="display:none;">
            <button class="guideai-chat-support-btn">Talk to Support</button>
          </div>
        </div>
      </div>
      <div class="guideai-chat-input-row">
        <input class="guideai-chat-input" type="text" placeholder="Ask a question..." aria-label="Type your question" />
        <button class="guideai-chat-send" aria-label="Send">${ln}</button>
      </div>
    `,t.style.position="fixed",t.style.zIndex="2147483646",this.config.bubblePosition==="bottom-left"?t.style.left="20px":t.style.right="20px",t.style.bottom="88px",t.style.opacity="0",t.style.transform="translateY(12px)",this.shadowRoot.appendChild(t),requestAnimationFrame(()=>{t.style.transition="opacity 250ms ease, transform 250ms ease",t.style.opacity="1",t.style.transform="translateY(0)"}),this.el=t,this.messagesEl=t.querySelector(".guideai-chat-messages"),this.inputEl=t.querySelector(".guideai-chat-input"),this.sendBtn=t.querySelector(".guideai-chat-send");const i=t.querySelector(".guideai-chat-close");i==null||i.addEventListener("click",()=>e.onClose()),(o=this.inputEl)==null||o.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),this.handleSend())}),(a=this.sendBtn)==null||a.addEventListener("click",()=>this.handleSend()),t.querySelectorAll(".guideai-chat-suggestion").forEach(c=>{c.addEventListener("click",()=>{const d=c.getAttribute("data-q");d&&this.inputEl&&(this.inputEl.value=d,this.handleSend())})});const s=t.querySelector(".guideai-chat-support-btn");s&&s.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("guideai:open-support"))}),this.pauseBtn=t.querySelector(".guideai-chat-pause"),(l=this.pauseBtn)==null||l.addEventListener("click",()=>{var c,d,u,h;this.guidePaused?(d=(c=this.callbacks)==null?void 0:c.onResumeGuide)==null||d.call(c):(h=(u=this.callbacks)==null?void 0:u.onPauseGuide)==null||h.call(u)}),this.playerPausedHandler=()=>{this.guidePaused=!0,this.updatePauseButton()},this.playerResumedHandler=()=>{this.guidePaused=!1,this.updatePauseButton()},this.playerEndedHandler=()=>{this.guidePaused=!1,this.hidePauseButton()},document.addEventListener("guideai:player-paused",this.playerPausedHandler),document.addEventListener("guideai:player-resumed",this.playerResumedHandler),document.addEventListener("guideai:player-ended",this.playerEndedHandler),setTimeout(()=>{var c;return(c=this.inputEl)==null?void 0:c.focus()},300),this.escHandler=c=>{c.key==="Escape"&&e.onClose()},document.addEventListener("keydown",this.escHandler),setTimeout(()=>{this.outsideClickHandler=c=>{const d=c.composedPath();!d.length||this.el&&d.includes(this.el)||d.some(h=>{var p;return h instanceof HTMLElement&&((p=h.classList)==null?void 0:p.contains("guideai-bubble"))})||e.onClose()},document.addEventListener("click",this.outsideClickHandler,!0)},100)}addMessage(e){if(!this.messagesEl)return;const t=this.messagesEl.querySelector(".guideai-chat-welcome");t&&t.remove();const i=document.createElement("div");i.className=`guideai-chat-msg guideai-chat-msg--${e.role}`;const r=document.createElement("div");if(r.className="guideai-chat-msg-text",r.textContent=e.text,i.appendChild(r),e.role==="assistant"&&e.guideSteps&&e.guideSteps.length>0){const s=e.guideSteps.length,o=document.createElement("button");o.className="guideai-chat-walkthrough-btn",o.innerHTML=`${cn} Start Walkthrough (${s} step${s>1?"s":""})`,o.addEventListener("click",()=>{var a;(a=this.callbacks)==null||a.onStartWalkthrough(e.guideSteps,e.guideTitle??"Walkthrough")}),i.appendChild(o)}this.messagesEl.appendChild(i),requestAnimationFrame(()=>this.scrollToBottom())}setLoading(e){var t;if(this.messagesEl)if(e){if(this.typingEl)return;const i=document.createElement("div");i.className="guideai-chat-typing",i.innerHTML=`
        <div class="guideai-chat-typing-dot"></div>
        <div class="guideai-chat-typing-dot"></div>
        <div class="guideai-chat-typing-dot"></div>
      `,this.messagesEl.appendChild(i),this.typingEl=i,this.scrollToBottom(),this.inputEl&&(this.inputEl.disabled=!0,this.inputEl.placeholder="Thinking..."),this.sendBtn&&(this.sendBtn.disabled=!0)}else this.typingEl&&(this.typingEl.remove(),this.typingEl=null),this.inputEl&&(this.inputEl.disabled=!1,this.inputEl.placeholder="Ask a question..."),this.sendBtn&&(this.sendBtn.disabled=!1),(t=this.inputEl)==null||t.focus()}remove(){if(this.outsideClickHandler&&(document.removeEventListener("click",this.outsideClickHandler,!0),this.outsideClickHandler=null),this.escHandler&&(document.removeEventListener("keydown",this.escHandler),this.escHandler=null),this.playerPausedHandler&&(document.removeEventListener("guideai:player-paused",this.playerPausedHandler),this.playerPausedHandler=null),this.playerResumedHandler&&(document.removeEventListener("guideai:player-resumed",this.playerResumedHandler),this.playerResumedHandler=null),this.playerEndedHandler&&(document.removeEventListener("guideai:player-ended",this.playerEndedHandler),this.playerEndedHandler=null),this.pauseBtn=null,this.el){this.el.style.transition="opacity 200ms ease, transform 200ms ease",this.el.style.opacity="0",this.el.style.transform="translateY(12px)";const e=this.el;setTimeout(()=>e.remove(),200),this.el=null,this.messagesEl=null,this.inputEl=null,this.sendBtn=null,this.typingEl=null}this.callbacks=null}addSaveWalkthroughPrompt(e,t){if(!this.messagesEl)return;const i=document.createElement("div");i.className="guideai-chat-msg guideai-chat-msg--assistant",i.innerHTML=`
      <div class="guideai-chat-msg-text">Walkthrough completed! Save this as a reusable guide?</div>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:center;">
        <input type="text" class="guideai-chat-input" value="${t.replace(/"/g,"&quot;")}" style="flex:1;padding:6px 10px;font-size:12px;border-radius:6px;" />
        <button class="guideai-chat-walkthrough-btn" style="margin:0;">Save as Guide</button>
      </div>
    `;const r=i.querySelector(".guideai-chat-walkthrough-btn"),s=i.querySelector("input");r==null||r.addEventListener("click",()=>{var a,l,c;const o=((a=s==null?void 0:s.value)==null?void 0:a.trim())||t;(c=(l=this.callbacks)==null?void 0:l.onSaveWalkthrough)==null||c.call(l,o),r.textContent="Saved!",r.disabled=!0,s&&(s.disabled=!0)}),this.messagesEl.appendChild(i),requestAnimationFrame(()=>this.scrollToBottom())}showSupportButton(){if(!this.el)return;const e=this.el.querySelector(".guideai-chat-support-btn-wrap");e&&(e.style.display="")}isOpen(){return this.el!==null}showPauseButton(){this.pauseBtn&&(this.pauseBtn.style.display="",this.guidePaused=!1,this.updatePauseButton())}hidePauseButton(){this.pauseBtn&&(this.pauseBtn.style.display="none")}updatePauseButton(){this.pauseBtn&&(this.guidePaused?(this.pauseBtn.innerHTML=`${dn} Resume`,this.pauseBtn.setAttribute("aria-label","Resume guide")):(this.pauseBtn.innerHTML=`${$t} Pause`,this.pauseBtn.setAttribute("aria-label","Pause guide")))}handleSend(){if(!this.inputEl||!this.callbacks)return;const e=this.inputEl.value.trim();e&&(this.inputEl.value="",this.callbacks.onSend(e))}scrollToBottom(){this.messagesEl&&this.messagesEl.scrollTo({top:this.messagesEl.scrollHeight,behavior:"smooth"})}}const hn=["a[href]","button","input","select","textarea",'[role="button"]','[role="link"]','[role="tab"]','[role="menuitem"]',"[tabindex]"].join(","),Dt=50,Ot=30,Bt=80;function zt(){var i;const n=[],e=[],t=document.querySelectorAll(hn);for(let r=0;r<t.length&&!(n.length>=Dt&&e.length>=Ot);r++){const s=t[r];if(s.closest(".guideai-bubble, .guideai-chat, .guideai-chip")||s.closest("[data-guideai-shadow]"))continue;const o=s.tagName.toLowerCase(),a=Q(s.getAttribute("aria-label")||s.placeholder||((i=s.textContent)==null?void 0:i.trim())||"");if(!a&&o!=="input"&&o!=="select"&&o!=="textarea")continue;const l=gn(s);if(l&&n.length<Dt)n.push({tag:o,text:a,selector:Gt(s),role:s.getAttribute("role")||void 0,type:s.type||void 0,placeholder:s.placeholder||void 0});else if(!l&&e.length<Ot){const c=fn(s);c&&e.push({tag:o,text:a,selector:Gt(s),role:s.getAttribute("role")||void 0,type:s.type||void 0,placeholder:s.placeholder||void 0,hidden:!0,container:c.name,containerState:c.state})}}return{url:location.href,title:document.title,elements:[...n,...e]}}function gn(n){if(n.offsetParent===null&&n.tagName!=="INPUT"&&n.tagName!=="BODY"||n.getAttribute("aria-hidden")==="true")return!1;const e=getComputedStyle(n);if(e.display==="none"||e.visibility==="hidden"||e.opacity==="0")return!1;let t=n.parentElement;for(let i=0;t&&i<10;i++){const r=getComputedStyle(t);if(r.display==="none"||r.visibility==="hidden")return!1;if(r.overflow==="hidden"&&t.scrollHeight>0){const s=t.getBoundingClientRect();if(s.height===0||s.width===0)return!1}t=t.parentElement}return!0}function fn(n){var t;let e=n.parentElement;for(let i=0;e&&i<15;i++){const r=e.tagName.toLowerCase(),s=e.getAttribute("role"),o=e.getAttribute("aria-expanded"),a=e.getAttribute("aria-hidden"),l=(typeof e.className=="string"?e.className:"").toLowerCase();if(r==="details"&&!e.hasAttribute("open")){const c=e.querySelector("summary");return{name:((t=c==null?void 0:c.textContent)==null?void 0:t.trim())||"accordion",state:"collapsed"}}if(o==="false"||a==="true"){const c=ae(e),d=Ft(e,l,s);return{name:c||d,state:"collapsed"}}if(s==="menu"||s==="menubar"||s==="navigation"||r==="nav"){const c=getComputedStyle(e);if(c.display==="none"||c.visibility==="hidden"||c.maxHeight==="0px"||c.height==="0px"||c.opacity==="0")return{name:ae(e)||Ft(e,l,s),state:"collapsed"};if(c.transform&&c.transform!=="none"){const d=e.getBoundingClientRect();if(d.right<0||d.left>window.innerWidth)return{name:ae(e)||"sidebar",state:"closed"}}}if(l.includes("sidebar")||l.includes("drawer")||l.includes("offcanvas")){const c=getComputedStyle(e);if(c.display==="none"||c.visibility==="hidden"||c.transform&&c.transform!=="none"){const d=e.getBoundingClientRect();if(d.right<0||d.left>window.innerWidth||c.display==="none")return{name:ae(e)||"sidebar",state:"closed"}}}if(l.includes("dropdown")||l.includes("popover")||l.includes("popup")){const c=getComputedStyle(e);if(c.display==="none"||c.visibility==="hidden"||c.opacity==="0")return{name:ae(e)||"dropdown menu",state:"closed"}}if(l.includes("modal")||l.includes("dialog")||s==="dialog"){const c=getComputedStyle(e);if(c.display==="none"||c.visibility==="hidden")return{name:ae(e)||"dialog",state:"closed"}}if(s==="tabpanel"&&(getComputedStyle(e).display==="none"||e.getAttribute("hidden")!==null)){const d=e.getAttribute("aria-label")||e.getAttribute("aria-labelledby")||"tab";return{name:`"${Q(d)}" tab`,state:"inactive"}}if((r==="nav"||r==="ul")&&l.includes("nav")&&getComputedStyle(e).display==="none")return{name:"navigation menu",state:"collapsed"};e=e.parentElement}return null}function ae(n){var s;const e=n.getAttribute("aria-label");if(e)return Q(e);const t=n.getAttribute("aria-labelledby");if(t){const o=document.getElementById(t);if(o!=null&&o.textContent)return Q(o.textContent.trim())}if(n.id){const o=document.querySelector(`[aria-controls="${n.id}"]`);if(o){const a=o.getAttribute("aria-label")||((s=o.textContent)==null?void 0:s.trim());if(a)return Q(a)}}const i=n.querySelector(":scope > summary");if(i!=null&&i.textContent)return Q(i.textContent.trim());const r=n.querySelector("h1, h2, h3, h4, h5, h6");return r!=null&&r.textContent?Q(r.textContent.trim()):null}function Ft(n,e,t){return t==="menu"||t==="menubar"?"menu":t==="navigation"||n.tagName==="NAV"?"navigation menu":e.includes("hamburger")||e.includes("mobile-nav")||e.includes("mobile-menu")?"hamburger menu":e.includes("sidebar")||e.includes("sidenav")?"sidebar":e.includes("drawer")?"drawer":e.includes("dropdown")?"dropdown":e.includes("accordion")||e.includes("collapse")||e.includes("collapsible")?"accordion":e.includes("offcanvas")?"off-canvas menu":e.includes("popover")?"popover":e.includes("tooltip")?"tooltip":"hidden panel"}function Gt(n){const e=n.getAttribute("data-guideai");if(e)return`[data-guideai="${e}"]`;const t=n.getAttribute("data-testid");if(t)return`[data-testid="${t}"]`;if(n.id)return`#${n.id}`;const i=n.getAttribute("name");if(i)return`${n.tagName.toLowerCase()}[name="${i}"]`;const r=n.tagName.toLowerCase();if(r==="a"){const a=n.getAttribute("href");if(a)return`a[href="${a}"]`}if(r==="button"){const a=n.type,l=n.className&&typeof n.className=="string"?n.className.split(/\s+/).filter(c=>c&&!c.startsWith("guideai"))[0]:"";if(l)return`button.${l}`;if(a&&a!=="submit")return`button[type="${a}"]`}if(r==="input"){const a=n;if(a.type)return`input[type="${a.type}"]`}const s=[];let o=n;for(let a=0;o&&a<3;a++){let l=o.tagName.toLowerCase();if(o.className&&typeof o.className=="string"){const c=o.className.split(/\s+/).filter(d=>d&&!d.startsWith("guideai"))[0];c&&(l+=`.${c}`)}s.unshift(l),o=o.parentElement}return s.join(" > ")}function Q(n){return n.length<=Bt?n:n.slice(0,Bt)}const pn=["backgroundColor","color","fontSize","fontWeight","fontFamily","paddingTop","paddingRight","paddingBottom","paddingLeft","borderRadius","borderTopWidth","borderTopColor","display","opacity","boxShadow","textAlign"],E=32,mn=new Set(["input","textarea","select","option"]),bn={block:0,inline:.2,"inline-block":.4,flex:.6,grid:.8,none:1};function yn(n){const e=window.getComputedStyle(n);let t="";for(const i of pn)t+=String(e[i]??"")+"|";return En(t)}function vn(n,e){return n===e?1:0}function xn(n){const e=window.getComputedStyle(n),t=n.getBoundingClientRect(),i=window.innerWidth||1,r=window.innerHeight||1;return[$(e.fontSize)/72,(parseFloat(e.fontWeight)||400)/900,...qt(e.backgroundColor),...qt(e.color),$(e.paddingTop)/50,$(e.paddingRight)/50,$(e.paddingBottom)/50,$(e.paddingLeft)/50,$(e.borderRadius)/30,$(e.borderTopWidth)/10,Math.min(t.width/i,1),Math.min(t.height/r,1),parseFloat(e.opacity)||1,bn[e.display]??.5,e.boxShadow&&e.boxShadow!=="none"?1:0,$(e.borderTopWidth)>0?1:0,Math.min(n.childElementCount/20,1),Math.min(t.x/i,1),Math.min(t.y/r,1),t.height>0?Math.min(t.width/t.height/10,1):0]}function wn(n,e){if(n.length!==e.length||n.length===0)return 0;let t=0,i=0,r=0;for(let o=0;o<n.length;o++)t+=n[o]*e[o],i+=n[o]*n[o],r+=e[o]*e[o];const s=Math.sqrt(i)*Math.sqrt(r);return s===0?0:t/s}function kn(n){var r;const e=n.tagName.toLowerCase();if(mn.has(e)||n.offsetParent===null)return;const t=window.getComputedStyle(n),i=n.getBoundingClientRect();if(!(i.width===0||i.height===0))try{const s=document.createElement("canvas");s.width=E,s.height=E;const o=s.getContext("2d");if(!o)return;o.clearRect(0,0,E,E),o.fillStyle=t.backgroundColor||"transparent";const a=$(t.borderRadius);a>0?Sn(o,0,0,E,E,Math.min(a,E/2)*(E/Math.max(i.width,1))):o.fillRect(0,0,E,E);const l=$(t.borderTopWidth);l>0&&(o.strokeStyle=t.borderTopColor||"#000",o.lineWidth=Math.max(1,l*(E/Math.max(i.width,1))),o.strokeRect(1,1,E-2,E-2));const c=((r=n.textContent)==null?void 0:r.trim().length)??0;if(c>0){o.fillStyle=t.color||"#000";const u=Math.min(c*2,E-8),h=Math.min($(t.fontSize)*(E/Math.max(i.height,1)),E/3),p=(E-u)/2,m=(E-h)/2;o.fillRect(p,m,u,h)}t.boxShadow&&t.boxShadow!=="none"&&(o.fillStyle="rgba(0,0,0,0.1)",o.fillRect(2,E-4,E-4,2));const d=o.getImageData(0,0,E,E);return Cn(d.data)}catch{return}}function _n(n,e){if(!n||!e||n.length!==e.length)return 0;let t=0;for(let r=0;r<n.length;r++){const s=parseInt(n[r],16),o=parseInt(e[r],16),a=s^o;t+=4-Tn(a)}const i=n.length*4;return i===0?0:t/i}function En(n){let e=5381;for(let t=0;t<n.length;t++)e=(e<<5)+e+n.charCodeAt(t)|0;return(e>>>0).toString(16).padStart(8,"0")}function $(n){return parseFloat(n)||0}function qt(n){const e=n.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);return e?[parseInt(e[1],10)/255,parseInt(e[2],10)/255,parseInt(e[3],10)/255]:[0,0,0]}function Sn(n,e,t,i,r,s){n.beginPath(),n.moveTo(e+s,t),n.arcTo(e+i,t,e+i,t+r,s),n.arcTo(e+i,t+r,e,t+r,s),n.arcTo(e,t+r,e,t,s),n.arcTo(e,t,e+i,t,s),n.closePath(),n.fill()}function Cn(n){const e=n.length/4,t=new Uint8Array(e);let i=0;for(let o=0;o<e;o++){const a=n[o*4],l=n[o*4+1],c=n[o*4+2];t[o]=a*.299+l*.587+c*.114|0,i+=t[o]}const r=i/e;let s="";for(let o=0;o<e;o+=4){let a=0;for(let l=0;l<4&&o+l<e;l++)t[o+l]>=r&&(a|=1<<3-l);s+=a.toString(16)}return s}function Tn(n){return n=n&15,n=n-(n>>1&5),n=(n&3)+(n>>2&3),n}function Z(n){const e=An(n),t=Ln(n),i=In(n),r=Mn(n),s=Pn(n),o=Nn(n),a=e.score+t.score+i.score+r.score+s.score+o.score;return{tier1_stable:e,tier2_text:t,tier3_structural:i,tier4_context:r,tier5_position:s,tier6_visual:o,total_score:a}}function An(n){const e=n.getAttribute("data-guideai")??void 0,t=n.getAttribute("data-testid")??void 0,i=n.getAttribute("aria-label")??void 0,r=n.getAttribute("name")??void 0,s=n.id||void 0;let o=0;return e?o+=40:t?o+=38:(s||r||i)&&(o+=35),{data_guideai:e,data_testid:t,aria_label:i,name:r,id:s,score:o}}function Ln(n){const e=n,t=ee(Ut(n),120),i=n.placeholder||n.getAttribute("placeholder")||void 0;let r;if(n.id){const a=document.querySelector(`label[for="${n.id}"]`);a&&(r=ee(a.textContent??"",80))}if(!r){const a=n.closest("label");a&&(r=ee(a.textContent??"",80))}const s=[];t&&s.push(t.toLowerCase()),i&&s.push(i.toLowerCase()),r&&s.push(r.toLowerCase()),e.title&&s.push(e.title.toLowerCase());let o=0;return t?o+=30:i?o+=28:r&&(o+=25),{text_content:t,placeholder:i,label:r,variants:s,score:o}}function In(n){const e=n.tagName.toLowerCase(),t=n.getAttribute("role")??void 0,i=Rn(n),r=Hn(n);let s=0;return e&&(s+=10),t&&(s+=5),i&&(s+=8),s+=Math.min(r,2),{tag:e,role:t,css_path:i,dom_depth:r,score:s}}function Mn(n){const e=n.parentElement,t=e?ee(Ut(e),80):void 0,i=n.closest("form"),r=i&&(i.getAttribute("name")||i.getAttribute("aria-label")||i.id)||void 0,s=$n(n);let o=0;return s&&(o+=6),r&&(o+=5),t&&(o+=4),{parent_text:t,form_context:r,nearest_heading:s,score:o}}function Pn(n){let e,t;try{const r=n.getBoundingClientRect();e={x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};const s=window.innerWidth,o=window.innerHeight,a=r.x+r.width/2,l=r.y+r.height/2,c=a<s/3?"left":a<2*s/3?"center":"right";t=`${l<o/3?"top":l<2*o/3?"middle":"bottom"}-${c}`}catch{}return{bounding_rect:e,relative_position:t,score:e?5:0}}function Ut(n){let e="";for(let t=0;t<n.childNodes.length;t++){const i=n.childNodes[t];i.nodeType===Node.TEXT_NODE&&(e+=i.textContent??"")}return e.trim()}function ee(n,e){return n&&(n.length>e?n.slice(0,e):n)}function Rn(n){const e=[];let t=n,i=0;for(;t&&t!==document.documentElement&&i<5;){let r=t.tagName.toLowerCase();if(t.id){r+=`#${t.id}`,e.unshift(r);break}const s=t.parentElement;if(s){const o=s.children;let a=0,l=0;for(let c=0;c<o.length;c++)o[c].tagName===t.tagName&&(l++,o[c]===t&&(a=l));l>1&&(r+=`:nth-of-type(${a})`)}e.unshift(r),t=s,i++}return e.join(" > ")}function Hn(n){let e=0,t=n;for(;t&&t!==document.documentElement;)e++,t=t.parentElement;return e}function Nn(n){const e=yn(n),t=xn(n),i=kn(n);let r=0;return e&&(r+=8),t.length>0&&(r+=7),i&&(r+=5),{style_hash:e,style_vector:t,canvas_hash:i,score:r}}function $n(n){let e=n;for(;e;){let t=e.previousElementSibling;for(;t;){if(/^h[1-6]$/i.test(t.tagName))return ee(t.textContent??"",80);const i=t.querySelector("h1,h2,h3,h4,h5,h6");if(i)return ee(i.textContent??"",80);t=t.previousElementSibling}if(e=e.parentElement,e&&/^h[1-6]$/i.test(e.tagName))return ee(e.textContent??"",80)}}function Dn(n){var e,t,i;return(((e=n.toggle)==null?void 0:e.getAttribute("aria-label"))||((i=(t=n.toggle)==null?void 0:t.textContent)==null?void 0:i.trim())||n.container.getAttribute("aria-label")||n.label||"Open menu").trim()}function On(n){const e=n.replace(/\s+/g," ").trim(),t=/^(open|show|expand)\b/i.test(e);return{title:t?e:`Open ${e}`,body:t?`Click ${e.toLowerCase()} to reveal the hidden navigation or content.`:`Click ${e.toLowerCase()} to reveal the hidden navigation or content.`}}class Bn{constructor(e,t,i,r){this.renderer=null,this.guidePlayerFactory=null,this.destroyed=!1,this._helpSupportEnabled=!1,this.onBubbleClick=null,this.analyzer=null,this.lastWalkthroughSteps=null,this.lastWalkthroughTitle="",this.pauseGuideHandler=null,this.resumeGuideHandler=null,this.api=e,this.config=t,this.eventBuffer=i,this.shadowRoot=r}setGuidePlayerFactory(e){this.guidePlayerFactory=e}setAnalyzer(e){this.analyzer=e}setHelpSupportEnabled(e){this._helpSupportEnabled=e}setPauseResumeHandlers(e,t){this.pauseGuideHandler=e,this.resumeGuideHandler=t}async init(){this.onBubbleClick=()=>{this.destroyed||this.toggle()},document.addEventListener("guideai:bubble-click",this.onBubbleClick)}toggle(){var e;(e=this.renderer)!=null&&e.isOpen()?this.close():this.open()}open(){var e,t;(e=this.renderer)!=null&&e.isOpen()||(this.renderer=new un(this.config,this.eventBuffer,this.shadowRoot),this.renderer.render({onClose:()=>this.close(),onSend:i=>this.handleSend(i),onStartWalkthrough:(i,r)=>this.handleStartWalkthrough(i,r),onSaveWalkthrough:i=>this.handleSaveWalkthrough(i),onPauseGuide:()=>{var i;return(i=this.pauseGuideHandler)==null?void 0:i.call(this)},onResumeGuide:()=>{var i;return(i=this.resumeGuideHandler)==null?void 0:i.call(this)}}),this._helpSupportEnabled&&this.renderer.showSupportButton(),(t=this.eventBuffer)==null||t.push(_(this.config.siteId,"chat_opened")))}close(){var e;(e=this.renderer)==null||e.remove(),this.renderer=null,document.dispatchEvent(new CustomEvent("guideai:resource-center-close"))}async handleSend(e){var r;if(!this.renderer)return;const t={role:"user",text:e};this.renderer.addMessage(t);const i=_(this.config.siteId,"chat_message_sent");i.element_text=e,(r=this.eventBuffer)==null||r.push(i),this.renderer.setLoading(!0);try{const s=zt(),o=await this.api.post("/api/v1/chat/ask",{question:e,page_url:location.href,page_snapshot:s});if(!this.renderer)return;this.renderer.setLoading(!1);const a={role:"assistant",text:o.answer};o.guide_steps&&o.guide_steps.length>0&&(a.guideSteps=o.guide_steps.map(l=>{const c=l.action??"none";return{title:l.title??"",body:l.body??"",target_selector:l.target_selector,action:c,completion_hint:l.completion_hint}}),a.guideTitle=o.guide_title??"Walkthrough"),this.renderer.addMessage(a)}catch(s){if(!this.renderer)return;this.renderer.setLoading(!1);const o=s instanceof Error&&s.message.includes("404")?"Chat service is not available. Make sure the backend is running.":"Sorry, something went wrong. Please try again.";this.renderer.addMessage({role:"assistant",text:o}),typeof console<"u"&&console.warn("[GuideAI] Chat error:",s)}}handleStartWalkthrough(e,t){var o;if(!this.guidePlayerFactory)return;this.lastWalkthroughSteps=e,this.lastWalkthroughTitle=t,this.close();const i=this.generateUUID(),r=this.buildGuideSteps(e,i),s={id:i,site_id:this.config.siteId,title:t,status:"published",trigger_type:"manual",trigger_config:{},steps:r,tags:["chat-generated"],version:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};(o=this.eventBuffer)==null||o.push(_(this.config.siteId,"chat_walkthrough_started",{guide_title:t,step_count:e.length})),this.guidePlayerFactory(s,()=>this.onWalkthroughComplete())}onWalkthroughComplete(){this.lastWalkthroughSteps&&(this.open(),setTimeout(()=>{var e;(e=this.renderer)==null||e.addSaveWalkthroughPrompt(this.lastWalkthroughSteps.length,this.lastWalkthroughTitle)},300))}async handleSaveWalkthrough(e){if(!this.lastWalkthroughSteps)return;const t=this.lastWalkthroughSteps,i={title:e||this.lastWalkthroughTitle||"Chat Walkthrough",description:`Guide created from chat walkthrough with ${t.length} steps`,steps:t.map((r,s)=>{const o=this.buildGuideStep(r,s);return{ordinal:s,step_type:o.step_type,target_selector:o.target_selector,target_fingerprint:o.target_fingerprint,content:o.content,action_config:o.action_config,page_url_pattern:o.page_url_pattern}})};try{await this.api.post("/api/v1/guides/record",i),this.lastWalkthroughSteps=null,this.lastWalkthroughTitle=""}catch(r){typeof console<"u"&&console.warn("[GuideAI] Failed to save walkthrough as guide:",r)}}buildGuideSteps(e,t){const i=[];let r=0;console.log("[GuideAI] Building guide steps, analyzer:",!!this.analyzer);const s=this.inferPagePatterns(e);for(let o=0;o<e.length;o++){const a=e[o],l=["click","fill","select","scroll","navigate","none"],c=a.action&&l.includes(a.action)?a.action:a.target_selector?"click":"none",d=this.extractTagFromSelector(a.target_selector),u=a.title||a.body||"";console.log(`[GuideAI] Step ${o}: "${u}", selector: "${a.target_selector}", page_url: "${s[o]}"`);const h=`chat_reveal_group_${o}`;let p=!1,m={tier1_stable:{score:0},tier2_text:{text_content:u,variants:u?[u.toLowerCase()]:[],score:u?25:0},tier3_structural:{tag:d,dom_depth:0,score:d?8:0},tier4_context:{score:0},tier5_position:{score:0},total_score:(u?25:0)+(d?8:0)};if(this.analyzer){const f={description:u,tag:d||void 0,text:u||void 0,selector:a.target_selector,fingerprint:m.total_score>0?m:void 0,actionType:c};try{const g=this.analyzer.resolveDetectOnly(f);if(console.log(`[GuideAI] Analyzer detect for step ${o}:`,{hasElement:!!g.element,isVisible:g.isVisible,requiresReveal:g.requiresReveal,revealPathLength:g.revealPath.length,revealReason:g.revealReason,revealConfidence:g.revealConfidence,score:g.score}),c!=="none"&&g.element&&g.requiresReveal&&g.revealPath.length>0){p=!0,console.log(`[GuideAI] Adding ${g.revealPath.length} reveal step(s) for hidden element`);const b=`chat_step_${r+g.revealPath.length}`;for(const y of g.revealPath){const S=y.toggle||y.container,v=Z(S),k=Dn(y),C=On(k);i.push({id:`chat_step_${r}`,guide_id:t,ordinal:r++,step_type:"tooltip",target_selector:"",target_fingerprint:v,page_url_pattern:s[o],content:{title:C.title,body:C.body},action_config:{action_type:"click",sensitive:!1,requires_confirmation:!1,allow_skip:!1},metadata:{requires_reveal:!0,reveal_for:b,reveal_group:h,reveal_confidence:g.revealConfidence??null,reveal_reason:g.revealReason??null}})}}g.element&&(m=Z(g.element),console.log("[GuideAI] Enriched fingerprint score:",m.total_score))}catch(g){console.warn("[GuideAI] Analyzer detection failed for step",o,g)}}i.push({id:`chat_step_${r}`,guide_id:t,ordinal:r++,step_type:"tooltip",target_selector:a.target_selector,target_fingerprint:m,page_url_pattern:s[o],content:{title:a.title,body:a.body},action_config:{action_type:c,sensitive:!1,requires_confirmation:!1,completion_hint:a.completion_hint},metadata:{reveal_required:p,reveal_group:h}})}return console.log(`[GuideAI] Built ${i.length} total steps (${e.length} original + reveal steps)`),i}inferPagePatterns(e){const t=[];let i=location.pathname;for(let r=0;r<e.length;r++){const s=e[r];t[r]=i;const o=this.inferNavigationTarget(s);o&&(console.log(`[GuideAI] Step ${r} navigates to "${o}" — subsequent steps expect that page`),i=o)}return t}inferNavigationTarget(e){const t=e.action||(e.target_selector?"click":"none");if(!(t==="click"||t==="navigate"))return null;if(e.target_selector)try{const a=document.querySelector(e.target_selector);if(a){const l=a.tagName==="A"?a:a.closest("a");if(l!=null&&l.href){const c=l.getAttribute("href");if(c&&c!=="#"&&!c.startsWith("javascript:"))try{if(c.startsWith("/"))return c.split("?")[0].split("#")[0];if(c.startsWith("http"))return new URL(c).pathname}catch{}}}}catch{}if(e.target_selector){const a=e.target_selector.match(/a\[href=['"]?([^'"\]]+)['"]?\]/);if(a!=null&&a[1]){const l=a[1];if(l.startsWith("/"))return l.split("?")[0].split("#")[0]}}const r=((e.title||"")+" "+(e.body||"")).toLowerCase(),s=r.match(/(?:navigate|go)\s+to\s+(\/[a-z0-9\-/]+)/);if(s!=null&&s[1])return s[1];const o=[/(?:click|go to|navigate to|visit)\s+(?:the\s+)?["']?([a-z][a-z\s]*?)["']?\s+(?:link|page|tab|button|menu item)/,/(?:click|go to|navigate to|visit)\s+["']([^"']+)["']/];for(const a of o){const l=r.match(a);if(l!=null&&l[1]){const c=l[1].trim(),d=this.findLinkHrefByText(c);if(d)return d}}return null}findLinkHrefByText(e){const t=e.toLowerCase().trim();if(!t)return null;try{const i=document.querySelectorAll("a[href]");for(let r=0;r<i.length;r++){const s=i[r],o=(s.textContent||"").toLowerCase().trim();if(o.includes(t)||t.includes(o)){const a=s.getAttribute("href");if(a&&a!=="#"&&!a.startsWith("javascript:")){if(a.startsWith("/"))return a.split("?")[0].split("#")[0];try{if(a.startsWith("http"))return new URL(a).pathname}catch{}}}}}catch{}return null}buildGuideStep(e,t){const i=["click","fill","select","scroll","navigate","none"],r=e.action&&i.includes(e.action)?e.action:e.target_selector?"click":"none",s=this.extractTagFromSelector(e.target_selector),o=e.title||e.body||"";let a={tier1_stable:{score:0},tier2_text:{text_content:o,variants:o?[o.toLowerCase()]:[],score:o?25:0},tier3_structural:{tag:s,dom_depth:0,score:s?8:0},tier4_context:{score:0},tier5_position:{score:0},total_score:(o?25:0)+(s?8:0)};if(this.analyzer){const l={description:o,tag:s||void 0,text:o||void 0,selector:e.target_selector,fingerprint:a.total_score>0?a:void 0,actionType:r},c=this.analyzer.resolveSync(l);c.element&&(a=Z(c.element))}return{id:`chat_step_${t}`,guide_id:"",ordinal:t,step_type:"tooltip",target_selector:e.target_selector,target_fingerprint:a,content:{title:e.title,body:e.body},action_config:{action_type:r,sensitive:!1,requires_confirmation:!1,completion_hint:e.completion_hint}}}extractTagFromSelector(e){if(!e)return"";const t=e.match(/^([a-z][a-z0-9]*)/i);return t?t[1].toLowerCase():""}generateUUID(){return typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}destroy(){var e;this.destroyed=!0,this.onBubbleClick&&(document.removeEventListener("guideai:bubble-click",this.onBubbleClick),this.onBubbleClick=null),(e=this.renderer)==null||e.remove(),this.renderer=null}}/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */function zn(n){return n instanceof Uint8Array||ArrayBuffer.isView(n)&&n.constructor.name==="Uint8Array"}function I(n,e,t=""){const i=zn(n),r=n==null?void 0:n.length,s=e!==void 0;if(!i||s&&r!==e){const o=t&&`"${t}" `,a=s?` of length ${e}`:"",l=i?`length=${r}`:`type=${typeof n}`;throw new Error(o+"expected Uint8Array"+a+", got "+l)}return n}function ke(n,e=!0){if(n.destroyed)throw new Error("Hash instance has been destroyed");if(e&&n.finished)throw new Error("Hash#digest() has already been called")}function Vt(n,e){I(n,void 0,"output");const t=e.outputLen;if(n.length<t)throw new Error("digestInto() expects output buffer of length at least "+t)}function Fn(n){return new Uint8Array(n.buffer,n.byteOffset,n.byteLength)}function G(n){return new Uint32Array(n.buffer,n.byteOffset,Math.floor(n.byteLength/4))}function q(...n){for(let e=0;e<n.length;e++)n[e].fill(0)}function _e(n){return new DataView(n.buffer,n.byteOffset,n.byteLength)}const Gn=new Uint8Array(new Uint32Array([287454020]).buffer)[0]===68;function qn(n,e){if(n.length!==e.length)return!1;let t=0;for(let i=0;i<n.length;i++)t|=n[i]^e[i];return t===0}const Un=(n,e)=>{function t(i,...r){if(I(i,void 0,"key"),!Gn)throw new Error("Non little-endian hardware is not yet supported");if(n.nonceLength!==void 0){const d=r[0];I(d,n.varSizeNonce?void 0:n.nonceLength,"nonce")}const s=n.tagLength;s&&r[1]!==void 0&&I(r[1],void 0,"AAD");const o=e(i,...r),a=(d,u)=>{if(u!==void 0){if(d!==2)throw new Error("cipher output not supported");I(u,void 0,"output")}};let l=!1;return{encrypt(d,u){if(l)throw new Error("cannot encrypt() twice with same key + nonce");return l=!0,I(d),a(o.encrypt.length,u),o.encrypt(d,u)},decrypt(d,u){if(I(d),s&&d.length<s)throw new Error('"ciphertext" expected length bigger than tagLength='+s);return a(o.decrypt.length,u),o.decrypt(d,u)}}}return Object.assign(t,n),t};function Vn(n,e,t=!0){if(e===void 0)return new Uint8Array(n);if(e.length!==n)throw new Error('"output" expected Uint8Array of length '+n+", got: "+e.length);if(t&&!Ee(e))throw new Error("invalid output, must be aligned");return e}function Wn(n,e,t){const i=new Uint8Array(16),r=_e(i);return r.setBigUint64(0,BigInt(e),t),r.setBigUint64(8,BigInt(n),t),i}function Ee(n){return n.byteOffset%4===0}function te(n){return Uint8Array.from(n)}function jn(n=32){const e=typeof globalThis=="object"?globalThis.crypto:null;if(typeof(e==null?void 0:e.getRandomValues)!="function")throw new Error("crypto.getRandomValues must be defined");return e.getRandomValues(new Uint8Array(n))}const U=16,Ve=new Uint8Array(16),O=G(Ve),Kn=225,Yn=(n,e,t,i)=>{const r=i&1;return{s3:t<<31|i>>>1,s2:e<<31|t>>>1,s1:n<<31|e>>>1,s0:n>>>1^Kn<<24&-(r&1)}},R=n=>(n>>>0&255)<<24|(n>>>8&255)<<16|(n>>>16&255)<<8|n>>>24&255|0;function Xn(n){n.reverse();const e=n[15]&1;let t=0;for(let i=0;i<n.length;i++){const r=n[i];n[i]=r>>>1|t,t=(r&1)<<7}return n[0]^=-e&225,n}const Jn=n=>n>64*1024?8:n>1024?4:2;class Wt{constructor(e,t){x(this,"blockLen",U);x(this,"outputLen",U);x(this,"s0",0);x(this,"s1",0);x(this,"s2",0);x(this,"s3",0);x(this,"finished",!1);x(this,"t");x(this,"W");x(this,"windowSize");I(e,16,"key"),e=te(e);const i=_e(e);let r=i.getUint32(0,!1),s=i.getUint32(4,!1),o=i.getUint32(8,!1),a=i.getUint32(12,!1);const l=[];for(let m=0;m<128;m++)l.push({s0:R(r),s1:R(s),s2:R(o),s3:R(a)}),{s0:r,s1:s,s2:o,s3:a}=Yn(r,s,o,a);const c=Jn(t||1024);if(![1,2,4,8].includes(c))throw new Error("ghash: invalid window size, expected 2, 4 or 8");this.W=c;const u=128/c,h=this.windowSize=2**c,p=[];for(let m=0;m<u;m++)for(let f=0;f<h;f++){let g=0,b=0,y=0,S=0;for(let v=0;v<c;v++){if(!(f>>>c-v-1&1))continue;const{s0:C,s1:N,s2:V,s3:He}=l[c*m+v];g^=C,b^=N,y^=V,S^=He}p.push({s0:g,s1:b,s2:y,s3:S})}this.t=p}_updateBlock(e,t,i,r){e^=this.s0,t^=this.s1,i^=this.s2,r^=this.s3;const{W:s,t:o,windowSize:a}=this;let l=0,c=0,d=0,u=0;const h=(1<<s)-1;let p=0;for(const m of[e,t,i,r])for(let f=0;f<4;f++){const g=m>>>8*f&255;for(let b=8/s-1;b>=0;b--){const y=g>>>s*b&h,{s0:S,s1:v,s2:k,s3:C}=o[p*a+y];l^=S,c^=v,d^=k,u^=C,p+=1}}this.s0=l,this.s1=c,this.s2=d,this.s3=u}update(e){ke(this),I(e),e=te(e);const t=G(e),i=Math.floor(e.length/U),r=e.length%U;for(let s=0;s<i;s++)this._updateBlock(t[s*4+0],t[s*4+1],t[s*4+2],t[s*4+3]);return r&&(Ve.set(e.subarray(i*U)),this._updateBlock(O[0],O[1],O[2],O[3]),q(O)),this}destroy(){const{t:e}=this;for(const t of e)t.s0=0,t.s1=0,t.s2=0,t.s3=0}digestInto(e){ke(this),Vt(e,this),this.finished=!0;const{s0:t,s1:i,s2:r,s3:s}=this,o=G(e);return o[0]=t,o[1]=i,o[2]=r,o[3]=s,e}digest(){const e=new Uint8Array(U);return this.digestInto(e),this.destroy(),e}}class Qn extends Wt{constructor(e,t){I(e);const i=Xn(te(e));super(i,t),q(i)}update(e){ke(this),I(e),e=te(e);const t=G(e),i=e.length%U,r=Math.floor(e.length/U);for(let s=0;s<r;s++)this._updateBlock(R(t[s*4+3]),R(t[s*4+2]),R(t[s*4+1]),R(t[s*4+0]));return i&&(Ve.set(e.subarray(r*U)),this._updateBlock(R(O[3]),R(O[2]),R(O[1]),R(O[0])),q(O)),this}digestInto(e){ke(this),Vt(e,this),this.finished=!0;const{s0:t,s1:i,s2:r,s3:s}=this,o=G(e);return o[0]=t,o[1]=i,o[2]=r,o[3]=s,e.reverse()}}function jt(n){const e=(i,r)=>n(r,i.length).update(i).digest(),t=n(new Uint8Array(16),0);return e.outputLen=t.outputLen,e.blockLen=t.blockLen,e.create=(i,r)=>n(i,r),e}const Kt=jt((n,e)=>new Wt(n,e));jt((n,e)=>new Qn(n,e));const We=16,Zn=4,Se=new Uint8Array(We),es=283;function ts(n){if(![16,24,32].includes(n.length))throw new Error('"aes key" expected Uint8Array of length 16/24/32, got length='+n.length)}function je(n){return n<<1^es&-(n>>7)}function Yt(n,e){let t=0;for(;e>0;e>>=1)t^=n&-(e&1),n=je(n);return t}const is=(()=>{const n=new Uint8Array(256);for(let t=0,i=1;t<256;t++,i^=je(i))n[t]=i;const e=new Uint8Array(256);e[0]=99;for(let t=0;t<255;t++){let i=n[255-t];i|=i<<8,e[n[t]]=(i^i>>4^i>>5^i>>6^i>>7^99)&255}return q(n),e})(),rs=n=>n<<24|n>>>8,Ke=n=>n<<8|n>>>24;function ns(n,e){if(n.length!==256)throw new Error("Wrong sbox length");const t=new Uint32Array(256).map((c,d)=>e(n[d])),i=t.map(Ke),r=i.map(Ke),s=r.map(Ke),o=new Uint32Array(256*256),a=new Uint32Array(256*256),l=new Uint16Array(256*256);for(let c=0;c<256;c++)for(let d=0;d<256;d++){const u=c*256+d;o[u]=t[c]^i[d],a[u]=r[c]^s[d],l[u]=n[c]<<8|n[d]}return{sbox:n,sbox2:l,T0:t,T1:i,T2:r,T3:s,T01:o,T23:a}}const Xt=ns(is,n=>Yt(n,3)<<24|n<<16|n<<8|Yt(n,2)),ss=(()=>{const n=new Uint8Array(16);for(let e=0,t=1;e<16;e++,t=je(t))n[e]=t;return n})();function os(n){I(n);const e=n.length;ts(n);const{sbox2:t}=Xt,i=[];Ee(n)||i.push(n=te(n));const r=G(n),s=r.length,o=l=>he(t,l,l,l,l),a=new Uint32Array(e+28);a.set(r);for(let l=s;l<a.length;l++){let c=a[l-1];l%s===0?c=o(rs(c))^ss[l/s-1]:s>6&&l%s===4&&(c=o(c)),a[l]=a[l-s]^c}return q(...i),a}function Ce(n,e,t,i,r,s){return n[t<<8&65280|i>>>8&255]^e[r>>>8&65280|s>>>24&255]}function he(n,e,t,i,r){return n[e&255|t&65280]|n[i>>>16&255|r>>>16&65280]<<16}function Jt(n,e,t,i,r){const{sbox2:s,T01:o,T23:a}=Xt;let l=0;e^=n[l++],t^=n[l++],i^=n[l++],r^=n[l++];const c=n.length/4-2;for(let m=0;m<c;m++){const f=n[l++]^Ce(o,a,e,t,i,r),g=n[l++]^Ce(o,a,t,i,r,e),b=n[l++]^Ce(o,a,i,r,e,t),y=n[l++]^Ce(o,a,r,e,t,i);e=f,t=g,i=b,r=y}const d=n[l++]^he(s,e,t,i,r),u=n[l++]^he(s,t,i,r,e),h=n[l++]^he(s,i,r,e,t),p=n[l++]^he(s,r,e,t,i);return{s0:d,s1:u,s2:h,s3:p}}function Te(n,e,t,i,r){I(t,We,"nonce"),I(i),r=Vn(i.length,r);const s=t,o=G(s),a=_e(s),l=G(i),c=G(r),d=e?0:12,u=i.length;let h=a.getUint32(d,e),{s0:p,s1:m,s2:f,s3:g}=Jt(n,o[0],o[1],o[2],o[3]);for(let y=0;y+4<=l.length;y+=4)c[y+0]=l[y+0]^p,c[y+1]=l[y+1]^m,c[y+2]=l[y+2]^f,c[y+3]=l[y+3]^g,h=h+1>>>0,a.setUint32(d,h,e),{s0:p,s1:m,s2:f,s3:g}=Jt(n,o[0],o[1],o[2],o[3]);const b=We*Math.floor(l.length/Zn);if(b<u){const y=new Uint32Array([p,m,f,g]),S=Fn(y);for(let v=b,k=0;v<u;v++,k++)r[v]=i[v]^S[k];q(y)}return r}function as(n,e,t,i,r){const s=r?r.length:0,o=n.create(t,i.length+s);r&&o.update(r);const a=Wn(8*i.length,8*s,e);o.update(i),o.update(a);const l=o.digest();return q(a),l}const ls=Un({blockSize:16,nonceLength:12,tagLength:16,varSizeNonce:!0},function(e,t,i){if(t.length<8)throw new Error("aes/gcm: invalid nonce length");const r=16;function s(a,l,c){const d=as(Kt,!1,a,c,i);for(let u=0;u<l.length;u++)d[u]^=l[u];return d}function o(){const a=os(e),l=Se.slice(),c=Se.slice();if(Te(a,!1,c,c,l),t.length===12)c.set(t);else{const u=Se.slice();_e(u).setBigUint64(8,BigInt(t.length*8),!1);const p=Kt.create(l).update(t).update(u);p.digestInto(c),p.destroy()}const d=Te(a,!1,c,Se);return{xk:a,authKey:l,counter:c,tagMask:d}}return{encrypt(a){const{xk:l,authKey:c,counter:d,tagMask:u}=o(),h=new Uint8Array(a.length+r),p=[l,c,d,u];Ee(a)||p.push(a=te(a)),Te(l,!1,d,a,h.subarray(0,a.length));const m=s(c,u,h.subarray(0,h.length-r));return p.push(m),h.set(m,a.length),q(...p),h},decrypt(a){const{xk:l,authKey:c,counter:d,tagMask:u}=o(),h=[l,c,u,d];Ee(a)||h.push(a=te(a));const p=a.subarray(0,-r),m=a.subarray(-r),f=s(c,u,p);if(h.push(f),!qn(f,m))throw new Error("aes/gcm: invalid ghash tag");const g=Te(l,!1,d,p);return q(...h),g}}});/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */function cs(n){return n instanceof Uint8Array||ArrayBuffer.isView(n)&&n.constructor.name==="Uint8Array"}function Ye(n,e=""){if(!Number.isSafeInteger(n)||n<0){const t=e&&`"${e}" `;throw new Error(`${t}expected integer >= 0, got ${n}`)}}function ge(n,e,t=""){const i=cs(n),r=n==null?void 0:n.length,s=e!==void 0;if(!i||s&&r!==e){const o=t&&`"${t}" `,a=s?` of length ${e}`:"",l=i?`length=${r}`:`type=${typeof n}`;throw new Error(o+"expected Uint8Array"+a+", got "+l)}return n}function Xe(n){if(typeof n!="function"||typeof n.create!="function")throw new Error("Hash must wrapped by utils.createHasher");Ye(n.outputLen),Ye(n.blockLen)}function Ae(n,e=!0){if(n.destroyed)throw new Error("Hash instance has been destroyed");if(e&&n.finished)throw new Error("Hash#digest() has already been called")}function ds(n,e){ge(n,void 0,"digestInto() output");const t=e.outputLen;if(n.length<t)throw new Error('"digestInto() output" expected to be of length >='+t)}function fe(...n){for(let e=0;e<n.length;e++)n[e].fill(0)}function Je(n){return new DataView(n.buffer,n.byteOffset,n.byteLength)}function B(n,e){return n<<32-e|n>>>e}function us(n,e={}){const t=(r,s)=>n(s).update(r).digest(),i=n(void 0);return t.outputLen=i.outputLen,t.blockLen=i.blockLen,t.create=r=>n(r),Object.assign(t,e),Object.freeze(t)}const hs=n=>({oid:Uint8Array.from([6,9,96,134,72,1,101,3,4,2,n])});class Qt{constructor(e,t){x(this,"oHash");x(this,"iHash");x(this,"blockLen");x(this,"outputLen");x(this,"finished",!1);x(this,"destroyed",!1);if(Xe(e),ge(t,void 0,"key"),this.iHash=e.create(),typeof this.iHash.update!="function")throw new Error("Expected instance of class which extends utils.Hash");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;const i=this.blockLen,r=new Uint8Array(i);r.set(t.length>i?e.create().update(t).digest():t);for(let s=0;s<r.length;s++)r[s]^=54;this.iHash.update(r),this.oHash=e.create();for(let s=0;s<r.length;s++)r[s]^=106;this.oHash.update(r),fe(r)}update(e){return Ae(this),this.iHash.update(e),this}digestInto(e){Ae(this),ge(e,this.outputLen,"output"),this.finished=!0,this.iHash.digestInto(e),this.oHash.update(e),this.oHash.digestInto(e),this.destroy()}digest(){const e=new Uint8Array(this.oHash.outputLen);return this.digestInto(e),e}_cloneInto(e){e||(e=Object.create(Object.getPrototypeOf(this),{}));const{oHash:t,iHash:i,finished:r,destroyed:s,blockLen:o,outputLen:a}=this;return e=e,e.finished=r,e.destroyed=s,e.blockLen=o,e.outputLen=a,e.oHash=t._cloneInto(e.oHash),e.iHash=i._cloneInto(e.iHash),e}clone(){return this._cloneInto()}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}}const Qe=(n,e,t)=>new Qt(n,e).update(t).digest();Qe.create=(n,e)=>new Qt(n,e);function gs(n,e,t){return Xe(n),t===void 0&&(t=new Uint8Array(n.outputLen)),Qe(n,t,e)}const Ze=Uint8Array.of(0),Zt=Uint8Array.of();function fs(n,e,t,i=32){Xe(n),Ye(i,"length");const r=n.outputLen;if(i>255*r)throw new Error("Length must be <= 255*HashLen");const s=Math.ceil(i/r);t===void 0?t=Zt:ge(t,void 0,"info");const o=new Uint8Array(s*r),a=Qe.create(n,e),l=a._cloneInto(),c=new Uint8Array(a.outputLen);for(let d=0;d<s;d++)Ze[0]=d+1,l.update(d===0?Zt:c).update(t).update(Ze).digestInto(c),o.set(c,r*d),a._cloneInto(l);return a.destroy(),l.destroy(),fe(c,Ze),o.slice(0,i)}const ps=(n,e,t,i,r)=>fs(n,gs(n,e,t),i,r);function ms(n,e,t){return n&e^~n&t}function bs(n,e,t){return n&e^n&t^e&t}class ys{constructor(e,t,i,r){x(this,"blockLen");x(this,"outputLen");x(this,"padOffset");x(this,"isLE");x(this,"buffer");x(this,"view");x(this,"finished",!1);x(this,"length",0);x(this,"pos",0);x(this,"destroyed",!1);this.blockLen=e,this.outputLen=t,this.padOffset=i,this.isLE=r,this.buffer=new Uint8Array(e),this.view=Je(this.buffer)}update(e){Ae(this),ge(e);const{view:t,buffer:i,blockLen:r}=this,s=e.length;for(let o=0;o<s;){const a=Math.min(r-this.pos,s-o);if(a===r){const l=Je(e);for(;r<=s-o;o+=r)this.process(l,o);continue}i.set(e.subarray(o,o+a),this.pos),this.pos+=a,o+=a,this.pos===r&&(this.process(t,0),this.pos=0)}return this.length+=e.length,this.roundClean(),this}digestInto(e){Ae(this),ds(e,this),this.finished=!0;const{buffer:t,view:i,blockLen:r,isLE:s}=this;let{pos:o}=this;t[o++]=128,fe(this.buffer.subarray(o)),this.padOffset>r-o&&(this.process(i,0),o=0);for(let u=o;u<r;u++)t[u]=0;i.setBigUint64(r-8,BigInt(this.length*8),s),this.process(i,0);const a=Je(e),l=this.outputLen;if(l%4)throw new Error("_sha2: outputLen must be aligned to 32bit");const c=l/4,d=this.get();if(c>d.length)throw new Error("_sha2: outputLen bigger than state");for(let u=0;u<c;u++)a.setUint32(4*u,d[u],s)}digest(){const{buffer:e,outputLen:t}=this;this.digestInto(e);const i=e.slice(0,t);return this.destroy(),i}_cloneInto(e){e||(e=new this.constructor),e.set(...this.get());const{blockLen:t,buffer:i,length:r,finished:s,destroyed:o,pos:a}=this;return e.destroyed=o,e.finished=s,e.length=r,e.pos=a,r%t&&e.buffer.set(i),e}clone(){return this._cloneInto()}}const W=Uint32Array.from([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),vs=Uint32Array.from([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),j=new Uint32Array(64);class xs extends ys{constructor(e){super(64,e,8,!1)}get(){const{A:e,B:t,C:i,D:r,E:s,F:o,G:a,H:l}=this;return[e,t,i,r,s,o,a,l]}set(e,t,i,r,s,o,a,l){this.A=e|0,this.B=t|0,this.C=i|0,this.D=r|0,this.E=s|0,this.F=o|0,this.G=a|0,this.H=l|0}process(e,t){for(let u=0;u<16;u++,t+=4)j[u]=e.getUint32(t,!1);for(let u=16;u<64;u++){const h=j[u-15],p=j[u-2],m=B(h,7)^B(h,18)^h>>>3,f=B(p,17)^B(p,19)^p>>>10;j[u]=f+j[u-7]+m+j[u-16]|0}let{A:i,B:r,C:s,D:o,E:a,F:l,G:c,H:d}=this;for(let u=0;u<64;u++){const h=B(a,6)^B(a,11)^B(a,25),p=d+h+ms(a,l,c)+vs[u]+j[u]|0,f=(B(i,2)^B(i,13)^B(i,22))+bs(i,r,s)|0;d=c,c=l,l=a,a=o+p|0,o=s,s=r,r=i,i=p+f|0}i=i+this.A|0,r=r+this.B|0,s=s+this.C|0,o=o+this.D|0,a=a+this.E|0,l=l+this.F|0,c=c+this.G|0,d=d+this.H|0,this.set(i,r,s,o,a,l,c,d)}roundClean(){fe(j)}destroy(){this.set(0,0,0,0,0,0,0,0),fe(this.buffer)}}class ws extends xs{constructor(){super(32);x(this,"A",W[0]|0);x(this,"B",W[1]|0);x(this,"C",W[2]|0);x(this,"D",W[3]|0);x(this,"E",W[4]|0);x(this,"F",W[5]|0);x(this,"G",W[6]|0);x(this,"H",W[7]|0)}}const ks=us(()=>new ws,hs(1)),_s=new TextEncoder().encode("guideai-sdk-encryption-v1"),Es=new TextEncoder().encode("aes-256-gcm");class Ss{constructor(e,t){this.ready=!1,this.siteId=e;try{const i=new TextEncoder().encode(t);this.aesKey=ps(ks,i,_s,Es,32),this.ready=!0}catch(i){typeof console<"u"&&console.warn("[GuideAI] Encryption key derivation failed:",i),this.aesKey=new Uint8Array(0),this.ready=!1}}isReady(){return this.ready}async init(){}encrypt(e){if(!this.ready)return null;try{const t=jn(12),i=new TextEncoder().encode(JSON.stringify(e)),s=ls(this.aesKey,t).encrypt(i);return{v:2,kid:this.siteId,iv:this.toBase64Url(t),ct:this.toBase64Url(s)}}catch(t){return typeof console<"u"&&console.warn("[GuideAI] Encryption failed; sending plaintext:",t),null}}encryptToBlob(e){const t=this.encrypt(e);return t?new Blob([JSON.stringify(t)],{type:"application/json"}):null}toBase64Url(e){let t="";for(let i=0;i<e.length;i++)t+=String.fromCharCode(e[i]);return btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}}function T(n){if(!(n instanceof HTMLElement))return console.log("[Visibility] Element is not HTMLElement"),!1;const e=getComputedStyle(n);if(e.display==="none")return console.log("[Visibility] ❌ Element hidden: display: none"),!1;if(e.visibility==="hidden")return console.log("[Visibility] ❌ Element hidden: visibility: hidden"),!1;if(e.opacity==="0")return console.log("[Visibility] ❌ Element hidden: opacity: 0"),!1;if(n.hasAttribute("hidden"))return console.log("[Visibility] ❌ Element hidden: [hidden] attribute"),!1;if(n.getAttribute("aria-hidden")==="true")return console.log('[Visibility] ❌ Element hidden: aria-hidden="true"'),!1;const t=n.getBoundingClientRect();if(t.width===0||t.height===0)return console.log(`[Visibility] ❌ Element hidden: zero size (${t.width}x${t.height})`),!1;if(n.offsetParent===null&&!["fixed","sticky","absolute"].includes(e.position)&&console.log("[Visibility] ⚠️ offsetParent is null, continuing with geometric checks"),e.opacity==="0"){const a=e.transition||"",l=e.animation||"";if(a.includes("opacity")||l)return console.log("[Visibility] ⏳ Element is animating (opacity: 0, has transition/animation)"),!1}if(e.transform&&e.transform!=="none"){if(/scale[XY]?\(0\.?0*\)/.test(e.transform))return console.log("[Visibility] ❌ Element hidden: transform: scale(0)"),!1;const a=e.transform.match(/translateX?\((-?\d+(?:\.\d+)?)(px|%)\)/);if(a){const l=parseFloat(a[1]),c=a[2];if(c==="px"&&Math.abs(l)>5e3)return console.log(`[Visibility] ❌ Element hidden: translateX(${l}px)`),!1;if(c==="%"&&Math.abs(l)>=100)return console.log(`[Visibility] ❌ Element hidden: translateX(${l}%)`),!1}}if(t.height>0&&t.height<5){const a=e.overflow||e.overflowY;if(a==="hidden"||a==="clip")return console.log(`[Visibility] ❌ Element hidden: height < 5px with overflow:${a}`),!1}if(e.pointerEvents==="none"){const a=n.tagName.toLowerCase(),l=n.getAttribute("role");(a==="button"||a==="a"||a==="input"||a==="select"||a==="textarea"||l==="button"||l==="link"||l==="tab")&&console.log(`[Visibility] ⚠️ Element has pointer-events:none but is interactive type (${a}, role=${l})`)}if(e.clipPath&&e.clipPath!=="none"&&(e.clipPath.includes("inset(100%)")||e.clipPath.includes("inset(50% 50% 50% 50%)")||/polygon\(0\D+0\D+0\D+0\D+0\D+0\D+0\D+0\)/.test(e.clipPath)))return console.log(`[Visibility] ❌ Element hidden: clip-path: ${e.clipPath}`),!1;const i=t.right<-(window.innerWidth*2),r=t.left>window.innerWidth*3,s=t.bottom<-(window.innerHeight*2),o=t.top>window.innerHeight*3;return i||r||s||o?(console.log("[Visibility] ❌ Element hidden: way off-screen (likely off-canvas menu)"),!1):(console.log("[Visibility] ✅ Element is visible (or scrollable into view)"),!0)}function Le(n){console.log("%c🔍 [Visibility] Searching for expandable ancestors...","color: #ff9800; font-weight: bold");const e=[];let t=n.parentElement,i=0;for(;t&&t!==document.body;){if(i++,t.tagName.toLowerCase(),t.tagName==="DETAILS"&&!t.open){const r=t.querySelector("summary");console.log(`[Visibility] Found collapsed <details> at depth ${i}`,{element:t,toggle:r}),e.unshift({container:t,toggle:r,kind:"details"})}else if(t.getAttribute("aria-expanded")==="false")console.log(`[Visibility] Found aria-expanded="false" at depth ${i}`,t),e.unshift({container:t,toggle:t,kind:"aria-expanded"});else if(t.id){const r=document.querySelector(`[aria-controls="${t.id}"][aria-expanded="false"]`);r&&(console.log(`[Visibility] Found aria-controls toggle at depth ${i}`,{container:t,toggle:r}),e.unshift({container:t,toggle:r,kind:"aria-expanded"}))}else if(t.getAttribute("role")==="tabpanel"&&t.getAttribute("aria-hidden")==="true"){const r=t.getAttribute("aria-labelledby"),s=r?document.getElementById(r):null;console.log(`[Visibility] Found hidden tabpanel at depth ${i}`,{container:t,tab:s}),e.unshift({container:t,toggle:s,kind:"tabpanel"})}else if(!T(t)){const r=(t.className||"").toString().toLowerCase();if(/sidebar|drawer|offcanvas|off-canvas|dropdown|popover|modal|hamburger|mobile-nav|navbar-links|menu/.test(r)){let s=null;t.id&&(s=document.querySelector(`[aria-controls="${t.id}"]`)),!s&&t.parentElement&&(s=t.parentElement.querySelector('button.navbar-toggle, button.hamburger, [aria-label*="menu" i]')),s||(console.log("[Visibility] No toggle found via parent search, trying global inference..."),s=Cs(t)),console.log(`[Visibility] Found hidden container via class pattern at depth ${i}`,{container:t,classes:r,toggle:s}),e.unshift({container:t,toggle:s,kind:"class-pattern"})}}t=t.parentElement}return e.length>0?console.log(`%c✅ [Visibility] Found ${e.length} expandable ancestor(s)`,"color: #4caf50; font-weight: bold",e):console.log("[Visibility] No expandable ancestors found"),e}function Cs(n){if(console.log("%c🔍 [Visibility] Inferring toggle for container","color: #ff9800; font-weight: bold",n),n.id){const r=document.querySelector(`[aria-controls="${n.id}"]`);if(r)return console.log(`[Visibility] Found toggle via aria-controls="${n.id}"`,r),r}const e=document.querySelector(`[data-toggle="${n.id}"], [data-target="${n.id}"], [data-open="${n.id}"]`);if(e)return console.log("[Visibility] Found toggle via data-* attribute",e),e;const t=(n.className||"").toLowerCase(),i=[];if(t.includes("menu")&&i.push("menu","nav","navigation"),t.includes("drawer")&&i.push("menu","open","show"),t.includes("sidebar")&&i.push("sidebar","menu","toggle"),t.includes("modal")&&i.push("open","show","modal"),t.includes("dropdown")&&i.push("open","show","dropdown"),i.length>0){const r=document.querySelectorAll('button, [role="button"], a, [role="link"]');for(const s of r){const o=(s.textContent||"").toLowerCase(),a=(s.getAttribute("aria-label")||"").toLowerCase(),l=o+" "+a;for(const c of i)if(l.includes(c))return console.log(`[Visibility] Found toggle via text similarity: "${c}" in "${o}"`,s),s}}if(n.previousElementSibling){const r=n.previousElementSibling;if(r.tagName==="BUTTON"||r.getAttribute("role")==="button")return console.log("[Visibility] Found toggle via previous sibling",r),r;const s=r.querySelector('button, [role="button"]');if(s)return console.log("[Visibility] Found toggle in previous sibling's children",s),s}return console.log("[Visibility] ⚠️ Could not infer toggle for container"),null}async function Ie(n){if(console.log(`%c🔓 [Visibility] Attempting to expand ${n.kind} container...`,"color: #ff5722; font-weight: bold",n.container),n.kind==="details"&&n.container instanceof HTMLDetailsElement){console.log("[Visibility] Opening <details> element directly"),n.container.open=!0;const t=T(n.container);return console.log(`[Visibility] <details> expansion: ${t?"✅ SUCCESS":"❌ FAILED"}`),t}const e=n.toggle??n.container;if(!e)return console.log("%c❌ [Visibility] No toggle found, cannot expand","color: #f44336"),!1;console.log("[Visibility] Clicking toggle element:",e);try{const t={bubbles:!0,cancelable:!0,composed:!0};e.dispatchEvent(new PointerEvent("pointerdown",t)),e.dispatchEvent(new MouseEvent("mousedown",t)),e.dispatchEvent(new PointerEvent("pointerup",t)),e.dispatchEvent(new MouseEvent("mouseup",t)),e.dispatchEvent(new MouseEvent("click",t)),typeof e.click=="function"&&e.click(),console.log("[Visibility] Click events dispatched, waiting for container to become visible...")}catch(t){return console.log("%c❌ [Visibility] Error dispatching click events:","color: #f44336",t),!1}for(let t=0;t<12;t++)if(await new Promise(i=>setTimeout(i,50)),T(n.container))return console.log(`%c✅ [Visibility] Container became visible after ${(t+1)*50}ms`,"color: #4caf50; font-weight: bold"),!0;return console.log("%c❌ [Visibility] Container did not become visible after 600ms","color: #f44336"),!1}const ei=[/password/i,/passwd/i,/secret/i,/card.?number/i,/credit.?card/i,/cvv/i,/cvc/i,/ccv/i,/ssn/i,/social.?security/i,/pin/i,/token/i,/api.?key/i];class Ts{async execute(e,t){const i=e.action_config;if(this.isSensitiveField(t)){console.warn("[GuideAI] Skipping automation of sensitive field.");return}if(!(i.requires_confirmation&&!await this.showConfirmation(e)))switch(i.action_type){case"click":await this.executeClick(t);break;case"fill":await this.executeFill(t,i.fill_value??"");break;case"select":await this.executeSelect(t,i.select_value??"");break;case"scroll":await this.executeScroll(t);break;case"navigate":this.executeNavigate(i.navigate_url??"");break}}async executeClick(e){e.style.outline="2px solid #3b82f6",await this.delay(200),e.click(),e.dispatchEvent(new MouseEvent("click",{bubbles:!0})),await this.delay(100),e.style.outline=""}async executeFill(e,t){const i=e;if(!this.isSensitiveField(e)){i.focus(),i.dispatchEvent(new Event("focus",{bubbles:!0})),i.value="",i.dispatchEvent(new Event("input",{bubbles:!0}));for(let r=0;r<t.length;r++)i.value+=t[r],i.dispatchEvent(new Event("input",{bubbles:!0})),i.dispatchEvent(new KeyboardEvent("keydown",{key:t[r],bubbles:!0})),i.dispatchEvent(new KeyboardEvent("keyup",{key:t[r],bubbles:!0})),await this.delay(50);i.dispatchEvent(new Event("change",{bubbles:!0}))}}async executeSelect(e,t){const i=e;i.value=t,i.dispatchEvent(new Event("change",{bubbles:!0})),i.dispatchEvent(new Event("input",{bubbles:!0}))}async executeScroll(e){e.scrollIntoView({behavior:"smooth",block:"center"}),await this.delay(500)}executeNavigate(e){e.startsWith("/")||e.startsWith(location.origin)?window.location.href=e:window.open(e,"_blank","noopener")}isSensitiveField(e){const t=e;if(t.type==="password")return!0;const i=[t.name,t.id,t.placeholder,t.autocomplete,e.getAttribute("aria-label")??""];for(const r of i)if(r){for(const s of ei)if(s.test(r))return!0}if(t.id){const r=document.querySelector(`label[for="${t.id}"]`);if(r!=null&&r.textContent){for(const s of ei)if(s.test(r.textContent))return!0}}return!1}showConfirmation(e){return new Promise(t=>{const i=document.createElement("div");i.className="guideai-confirm-dialog",i.setAttribute("role","alertdialog"),i.setAttribute("aria-modal","true"),i.innerHTML=`
        <div class="guideai-confirm-backdrop"></div>
        <div class="guideai-confirm-content">
          <h3 class="guideai-confirm-title">Confirm Action</h3>
          <p class="guideai-confirm-message">
            This will perform: <strong>${M(e.content.body)}</strong>
          </p>
          <p class="guideai-confirm-warning">
            This action may have real consequences. Please confirm you want to proceed.
          </p>
          <div class="guideai-confirm-actions">
            <button class="guideai-confirm-cancel">Cancel</button>
            <button class="guideai-confirm-proceed">Proceed</button>
          </div>
        </div>
      `,document.body.appendChild(i);const r=i.querySelector(".guideai-confirm-cancel"),s=i.querySelector(".guideai-confirm-proceed"),o=a=>{i.remove(),t(a)};r.addEventListener("click",()=>o(!1)),s.addEventListener("click",()=>o(!0))})}delay(e){return new Promise(t=>setTimeout(t,e))}}function ti(n,e=0){const t=n.getBoundingClientRect();return e===0?t:new DOMRect(t.x-e,t.y-e,t.width+e*2,t.height+e*2)}function ii(n,e,t){return Math.max(e,Math.min(n,t))}function As(n,e,t,i=12,r=8){const s=window.innerWidth,o=window.innerHeight;let a,l="top";n.bottom+i+t<o?(a=n.bottom+i,l="top"):n.top-i-t>0?(a=n.top-i-t,l="bottom"):(a=ii((o-t)/2,r,o-t-r),l="none");let c=n.left+n.width/2-e/2;return c=ii(c,r,s-e-r),{position:{top:a,left:c},arrowPlacement:l}}function Ls(n,e,t=2147483647){n.style.position="fixed",n.style.zIndex=String(t),n.style.top=`${e.top}px`,n.style.left=`${e.left}px`}function Is(n,e=2147483647){n.style.position="fixed",n.style.zIndex=String(e),n.style.top="50%",n.style.left="50%",n.style.transform="translate(-50%, -50%)"}function Ms(n,e=200){n.style.opacity="0",requestAnimationFrame(()=>{n.style.transition=`opacity ${e}ms ease`,n.style.opacity="1"})}function Ps(n,e=250){n.style.opacity="0",n.style.transform="translateY(20px)",requestAnimationFrame(()=>{n.style.transition=`opacity ${e}ms ease, transform ${e}ms ease`,n.style.opacity="1",n.style.transform="translateY(0)"})}function et(n){n&&n.remove()}class Rs{constructor(e){this.tooltipEl=null,this.highlightEl=null,this.overlayEl=null,this.shadowRoot=e}renderTooltip(e,t,i){const r=document.createElement("div");r.className="guideai-tooltip",r.setAttribute("role","dialog"),r.setAttribute("aria-label",e.content.title??"Guide step");const{currentStep:s,totalSteps:o,isClickable:a,callbacks:l,showChoices:c}=i,u=s>=o-1?"Finish":e.content.cta_text??"Next";let h="";a&&(h='<p class="guideai-tooltip-hint">Click the highlighted element to continue</p>');let p;p=`
        <div class="guideai-tooltip-nav">
          ${s>0?`<button class="guideai-tooltip-btn guideai-tooltip-back" aria-label="Back" title="Back">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>`:""}
          <button class="guideai-tooltip-btn guideai-tooltip-next" aria-label="${M(u)}" title="${M(u)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>`,r.innerHTML=`
      <div class="guideai-tooltip-arrow"></div>
      <div class="guideai-tooltip-content">
        <div class="guideai-tooltip-header">
          <span class="guideai-tooltip-step">Step ${s+1} of ${o}</span>
          <button class="guideai-tooltip-close" aria-label="Close guide">&times;</button>
        </div>
        ${e.content.title?`<h3 class="guideai-tooltip-title">${M(e.content.title)}</h3>`:""}
        <p class="guideai-tooltip-body">${M(e.content.body)}</p>
        ${h}
        ${e.content.media_url?`<img class="guideai-tooltip-media" src="${M(e.content.media_url)}" alt="" loading="lazy" />`:""}
        ${p}
      </div>
    `,r.style.visibility="hidden",this.shadowRoot.appendChild(r),this.tooltipEl=r,this.positionTooltip(r,t),r.style.visibility="";const m=r.querySelector(".guideai-tooltip-close");m==null||m.addEventListener("click",()=>l.onDismiss());const f=r.querySelector(".guideai-tooltip-next");f==null||f.addEventListener("click",()=>l.onNext());const g=r.querySelector(".guideai-tooltip-back");g==null||g.addEventListener("click",()=>l.onPrev());const b=r.querySelector(".guideai-tooltip-skip");b==null||b.addEventListener("click",()=>l.onSkip()),Ms(r)}reposition(e){let t=null;if(e.target_selector)try{t=document.querySelector(e.target_selector)}catch{}this.tooltipEl&&this.positionTooltip(this.tooltipEl,t),this.highlightEl&&(t?this.updateHighlightPosition(t):this.removeHighlight())}renderHighlight(e){const t=ti(e,4),i=document.createElement("div");i.className="guideai-highlight",i.style.position="fixed",i.style.zIndex="2147483645",i.style.top=`${t.top}px`,i.style.left=`${t.left}px`,i.style.width=`${t.width}px`,i.style.height=`${t.height}px`,i.style.pointerEvents="none",this.shadowRoot.appendChild(i),this.highlightEl=i}updateHighlightPosition(e){if(!this.highlightEl)return;const t=ti(e,4);this.highlightEl.style.top=`${t.top}px`,this.highlightEl.style.left=`${t.left}px`,this.highlightEl.style.width=`${t.width}px`,this.highlightEl.style.height=`${t.height}px`}renderOverlay(){const e=document.createElement("div");e.className="guideai-overlay",this.shadowRoot.appendChild(e),this.overlayEl=e}removeTooltip(){et(this.tooltipEl),this.tooltipEl=null}removeHighlight(){et(this.highlightEl),this.highlightEl=null}removeOverlay(){et(this.overlayEl),this.overlayEl=null}removeAll(){this.removeTooltip(),this.removeHighlight(),this.removeOverlay()}getTooltipEl(){return this.tooltipEl}getHighlightEl(){return this.highlightEl}destroy(){this.removeAll()}positionTooltip(e,t){if(!t){Is(e);return}const i=t.getBoundingClientRect(),r=260;e.style.width=`${r}px`;const s=e.getBoundingClientRect().height||160,o=As(i,r,s);e.style.transform="",Ls(e,o.position);const a=e.querySelector(".guideai-tooltip-arrow");a&&a.setAttribute("data-placement",o.arrowPlacement)}}const Hs={tier1:40,tier2:35,tier3:25,tier4:15,tier5:8,tier6:20};let tt=null;function Ns(n){tt=n}function le(n){if(!tt)return 1;const e=Hs[n],t=tt[n];return!e||!t?1:t/e}function it(n,e,t){const i=Z(n);let r=0;const s=$s(i,e)*le("tier1");r+=s;const o=Ds(i,e)*le("tier2");r+=o;const a=Os(i,e)*le("tier3");r+=a;const l=Bs(i,e)*le("tier4");r+=l;const c=zs(i,e)*le("tier5");r+=c;const d=Fs(i,e)*le("tier6");return r+=d,t&&(t.tier1=Math.round(s*10)/10,t.tier2=Math.round(o*10)/10,t.tier3=Math.round(a*10)/10,t.tier4=Math.round(l*10)/10,t.tier5=Math.round(c*10)/10,t.tier6=Math.round(d*10)/10),Math.min(100,Math.round(r))}function $s(n,e){const t=n.tier1_stable,i=e.tier1_stable;let r=0;return i.data_guideai&&t.data_guideai===i.data_guideai?40:(i.data_testid&&t.data_testid===i.data_testid&&(r=Math.max(r,38)),i.id&&t.id===i.id&&(r=Math.max(r,36)),i.name&&t.name===i.name&&(r=Math.max(r,35)),i.aria_label&&t.aria_label===i.aria_label&&(r=Math.max(r,35)),r)}function Ds(n,e){const t=n.tier2_text,i=e.tier2_text;let r=0;if(i.text_content&&t.text_content&&t.text_content===i.text_content)r=Math.max(r,35);else if(i.variants.length>0&&t.text_content){const s=t.text_content.toLowerCase();for(const o of i.variants){if(o===s){r=Math.max(r,30);break}(o.includes(s)||s.includes(o))&&(r=Math.max(r,25))}}return i.placeholder&&t.placeholder===i.placeholder&&(r=Math.max(r,28)),i.label&&t.label&&t.label===i.label&&(r=Math.max(r,25)),r}function Os(n,e){const t=n.tier3_structural,i=e.tier3_structural;let r=0;i.tag&&t.tag===i.tag&&(r+=8),i.role&&t.role===i.role&&(r+=5),i.css_path&&t.css_path&&(t.css_path===i.css_path?r+=8:t.css_path.endsWith(Gs(i.css_path))&&(r+=5));const s=Math.abs(t.dom_depth-i.dom_depth);return s===0?r+=4:s<=2&&(r+=2),Math.min(25,r)}function Bs(n,e){const t=n.tier4_context,i=e.tier4_context;let r=0;return i.nearest_heading&&t.nearest_heading&&(t.nearest_heading===i.nearest_heading?r+=6:t.nearest_heading.toLowerCase().includes(i.nearest_heading.toLowerCase())&&(r+=4)),i.form_context&&t.form_context===i.form_context&&(r+=5),i.parent_text&&t.parent_text&&(t.parent_text===i.parent_text?r+=4:(t.parent_text.includes(i.parent_text)||i.parent_text.includes(t.parent_text))&&(r+=2)),Math.min(15,r)}function zs(n,e){const t=n.tier5_position,i=e.tier5_position;let r=0;if(i.bounding_rect&&t.bounding_rect){const s=qs(t.bounding_rect,i.bounding_rect);s<10?r+=8:s<50?r+=5:s<150&&(r+=3)}return i.relative_position&&t.relative_position===i.relative_position&&(r+=2),Math.min(8,r)}function Fs(n,e){if(!n.tier6_visual||!e.tier6_visual)return 0;const t=n.tier6_visual,i=e.tier6_visual;let r=0;if(i.style_hash&&vn(t.style_hash,i.style_hash)===1&&(r+=8),i.style_vector.length>0&&t.style_vector.length>0){const s=wn(t.style_vector,i.style_vector);s>=.95?r+=12:s>=.85?r+=8:s>=.7&&(r+=5)}if(i.canvas_hash&&t.canvas_hash){const s=_n(t.canvas_hash,i.canvas_hash);s>=.9?r+=10:s>=.8?r+=6:s>=.7&&(r+=3)}return Math.min(20,r)}function Gs(n,e){return n.split(" > ").slice(-2).join(" > ")}function qs(n,e){const t=n.x-e.x,i=n.y-e.y;return Math.sqrt(t*t+i*i)}const rt=50,Us=["a","button","input","select","textarea","details","summary","label"];function ri(n,e){var l;const t=document.body;if(!t)return{element:null,score:0};const i=Vs(n,t);if(i){const c={},d=it(i,n,c);if(d>=rt)return{element:i,score:d,tierScores:c}}let r=null,s=0,o={};const a=(l=n.tier3_structural)==null?void 0:l.tag;if(a){const c=t.querySelectorAll(a);for(let d=0;d<c.length;d++){const u={},h=it(c[d],n,u);h>s&&(s=h,r=c[d],o=u)}}if(s<rt){const c=Us.join(","),d=t.querySelectorAll(c);for(let u=0;u<d.length;u++){if(a&&d[u].tagName.toLowerCase()===a)continue;const h={},p=it(d[u],n,h);p>s&&(s=p,r=d[u],o=h)}}return s>=rt?{element:r,score:s,tierScores:o}:{element:r,score:s,tierScores:o}}function Vs(n,e){const t=n.tier1_stable;if(t.data_guideai){const i=e.querySelector(`[data-guideai="${nt(t.data_guideai)}"]`);if(i)return i}if(t.data_testid){const i=e.querySelector(`[data-testid="${nt(t.data_testid)}"]`);if(i)return i}if(t.id){const i=e.querySelector(`#${Ws(t.id)}`);if(i)return i}if(t.name){const i=e.querySelector(`[name="${nt(t.name)}"]`);if(i)return i}return null}function nt(n){return n.replace(/["\\]/g,"\\$&")}function Ws(n){return typeof CSS<"u"&&CSS.escape?CSS.escape(n):n.replace(/([^\w-])/g,"\\$1")}function js(n,e){if(!n||!e)return 0;const t=z(n),i=z(e);if(t===i)return 1;if(!t||!i)return 0;const r=Ks(t,i),s=Ys(t,i),o=Xs(t,i);return Math.min(1,r*.35+s*.4+o*.25)}function ni(n,e,t=.45){if(!n||e.length===0)return{element:null,similarity:0};let i=null,r=0;const s=z(n);console.log(`[TextSimilarity] Normalized stored text: "${s}"`),console.log(`[TextSimilarity] Threshold: ${t}, scanning ${e.length} candidates...`);for(let o=0;o<e.length;o++){const a=e[o],l=Js(a);if(!l)continue;const c=js(n,l);(c>.3||o<5)&&console.log(`[TextSimilarity] Candidate ${o}: similarity=${c.toFixed(3)}, text="${l.substring(0,50)}"`),c>r&&(r=c,i=a)}return console.log(`[TextSimilarity] Best match: similarity=${r.toFixed(3)}, threshold=${t}, accepted=${r>=t}`),r>=t?{element:i,similarity:r,score:Math.round(r*100)}:{element:null,similarity:r}}function si(n){const e=[],t=new Set,i=n.tier2_text;if(i){if(i.text_content){const o=z(i.text_content);o&&!t.has(o)&&(e.push(o),t.add(o))}if(i.placeholder){const o=z(i.placeholder);o&&!t.has(o)&&(e.push(o),t.add(o))}if(i.label){const o=z(i.label);o&&!t.has(o)&&(e.push(o),t.add(o))}if(i.variants&&Array.isArray(i.variants))for(const o of i.variants){const a=z(o);a&&!t.has(a)&&(e.push(a),t.add(a))}}const r=n.tier1_stable;if(r){if(r.aria_label){const o=z(r.aria_label);o&&!t.has(o)&&(e.push(o),t.add(o))}if(r.name){const o=z(r.name);o&&!t.has(o)&&(e.push(o),t.add(o))}}const s=n.tier4_context;if(s&&s.nearest_heading){const o=z(s.nearest_heading);o&&!t.has(o)&&(e.push(o),t.add(o))}return e.filter(Boolean).join(" ")}function z(n){return n.toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g," ").trim()}function st(n){return new Set(n.split(" ").filter(e=>e.length>0))}function Ks(n,e){const t=st(n),i=st(e);if(t.size===0||i.size===0)return 0;let r=0;for(const o of t)i.has(o)&&r++;const s=t.size+i.size-r;return s>0?r/s:0}function Ys(n,e){const t=oi(n),i=oi(e);if(t.size===0||i.size===0)return 0;let r=0;for(const s of t)i.has(s)&&r++;return 2*r/(t.size+i.size)}function oi(n){const e=new Set,t=`  ${n} `;for(let i=0;i<t.length-2;i++)e.add(t.substring(i,i+3));return e}function Xs(n,e){if(n.includes(e)||e.includes(n))return 1;const t=n.length<e.length?n:e,i=n.length<e.length?e:n,r=st(t);let s=0;for(const o of r)i.includes(o)&&s++;return r.size>0?s/r.size:0}function Js(n){var t;const e=n;return n.getAttribute("aria-label")||n.placeholder||((t=e.textContent)==null?void 0:t.trim())||""}class Qs{constructor(e,t){this.analyzer=e,this.feedbackReporter=t}setAnalyzer(e){this.analyzer=e}findTargetElement(e,t){var s,o,a;const i=e.id??"";if(console.log(`%c🔍 [ElementFinder] Starting element search for step ${i}`,"color: #00bcd4; font-weight: bold"),console.log("[ElementFinder] Step details:",{title:e.content.title,target_selector:e.target_selector,has_fingerprint:((s=e.target_fingerprint)==null?void 0:s.total_score)>0,fingerprint_score:(o=e.target_fingerprint)==null?void 0:o.total_score,action_type:e.action_config.action_type}),this.analyzer){console.log("%c🧠 [ElementFinder] Using DeepUI Analyzer","color: #9c27b0; font-weight: bold");const l=this.analyzer.stepToIntent(e);console.log("[ElementFinder] Analyzer intent:",{text:l.text,actionType:l.actionType,tag:l.tag});const c=this.analyzer.resolveSync(l);if(console.log("[ElementFinder] Analyzer result:",{hasElement:!!c.element,score:c.score,resolvedBy:c.resolvedBy,status:c.status}),c.element){if(console.log("%c✅ [ElementFinder] Element FOUND via Analyzer!","color: #4caf50; font-weight: bold",c.element),c.resolvedBy==="fingerprint"&&this.feedbackReporter&&e.target_fingerprint){const d=Z(c.element);this.feedbackReporter.reportSuccess(t,i,c.score,c.tierScores??{},e.target_fingerprint,d)}return c.element}console.log("%c⚠️ [ElementFinder] Analyzer miss, falling back to legacy path","color: #ff9800")}else console.log("[ElementFinder] No analyzer available, using legacy 4-tier fallback");if(console.log("%c📊 [ElementFinder] TIER 1: Fingerprint Matching","color: #3f51b5; font-weight: bold"),e.target_fingerprint&&e.target_fingerprint.total_score>0){console.log(`[ElementFinder] Attempting fingerprint match (score: ${e.target_fingerprint.total_score})`);const l=ri(e.target_fingerprint);if(console.log("[ElementFinder] Fingerprint result:",{found:!!l.element,score:l.score,tierScores:l.tierScores,isVisible:l.element?T(l.element):null}),l.element&&(l.score>=50||l.score>=35&&!T(l.element))){if(console.log(`%c✅ [ElementFinder] Element FOUND via Fingerprint (score: ${l.score})!`,"color: #4caf50; font-weight: bold",l.element),this.feedbackReporter){const d=Z(l.element);this.feedbackReporter.reportSuccess(t,i,l.score,l.tierScores??{},e.target_fingerprint,d)}return l.element}else console.log("%c❌ [ElementFinder] Fingerprint match rejected (score too low or not acceptable)","color: #f44336");this.feedbackReporter&&!l.element&&this.feedbackReporter.reportNotFound(t,i,e.target_fingerprint)}else console.log("[ElementFinder] Skipping fingerprint (no fingerprint data or zero score)");if(console.log("%c📊 [ElementFinder] TIER 2: CSS Selector","color: #3f51b5; font-weight: bold"),e.target_selector){console.log(`[ElementFinder] Trying CSS selector: "${e.target_selector}"`);try{const l=document.querySelector(e.target_selector);if(l)return console.log("%c✅ [ElementFinder] Element FOUND via CSS Selector!","color: #4caf50; font-weight: bold",l),l;console.log("%c❌ [ElementFinder] CSS selector returned no match","color: #f44336")}catch(l){console.log("%c❌ [ElementFinder] CSS selector INVALID:","color: #f44336",l)}}else console.log("[ElementFinder] Skipping CSS selector (no target_selector provided)");if(console.log("%c📊 [ElementFinder] TIER 3: Text Similarity Matching","color: #3f51b5; font-weight: bold"),e.target_fingerprint){const l=si(e.target_fingerprint);if(l){const d=((a=e.target_fingerprint.tier3_structural)==null?void 0:a.tag)||'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"]';console.log(`[ElementFinder] Searching for text similarity with selector: "${d}"`),console.log("[ElementFinder] Target text features:",l);try{const u=Array.from(document.querySelectorAll(d));console.log(`[ElementFinder] Found ${u.length} candidate elements`);const h=ni(l,u,.45);if(h.element)return console.log(`%c✅ [ElementFinder] Element FOUND via Text Similarity (score: ${h.score})!`,"color: #4caf50; font-weight: bold",h.element),h.element;console.log("%c❌ [ElementFinder] No text similarity match found","color: #f44336")}catch(u){console.log("%c❌ [ElementFinder] Text similarity error:","color: #f44336",u)}}else console.log("[ElementFinder] Skipping text similarity (no text features in fingerprint)")}else console.log("[ElementFinder] Skipping text similarity (no fingerprint)");console.log("%c📊 [ElementFinder] TIER 4: Text Content Search","color: #3f51b5; font-weight: bold");const r=this.findByTextContent(e);return r?console.log("%c✅ [ElementFinder] Element FOUND via Text Content Search!","color: #4caf50; font-weight: bold",r):console.log("%c❌ [ElementFinder] Text content search found nothing","color: #f44336"),r||console.log("%c❌ [ElementFinder] ALL TIERS FAILED - Element not found","color: #f44336; font-weight: bold; font-size: 14px"),r}findByTextContent(e){var s,o,a,l;const t=((s=e.content.title)==null?void 0:s.toLowerCase())||"";if(!t)return console.log("[ElementFinder] Text content search skipped (no title in step)"),null;const r=((a=(o=e.target_fingerprint)==null?void 0:o.tier3_structural)==null?void 0:a.tag)||'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"]';console.log(`[ElementFinder] Searching for text: "${t}" in selector: "${r}"`);try{const c=document.querySelectorAll(r);console.log(`[ElementFinder] Scanning ${c.length} interactive elements...`);for(let d=0;d<c.length;d++){const u=c[d],h=(u.getAttribute("aria-label")||u.placeholder||((l=u.textContent)==null?void 0:l.trim())||"").toLowerCase();if(h&&(h.includes(t)||t.includes(h)))return console.log(`[ElementFinder] Text match found at index ${d}:`,{elText:h,element:u}),u}console.log(`[ElementFinder] No text matches found in ${c.length} candidates`)}catch(c){console.log("[ElementFinder] Text content search error:",c)}return null}}const Zs={pulseMs:15e3,hintMs:3e4,offerHelpMs:6e4};class eo{constructor(e,t){this.phase="idle",this.retryCount=0,this.timers=[],this.destroyed=!1,this.onPhaseChange=e,this.thresholds={...Zs,...t}}start(){this.phase="idle",this.retryCount=0,this.clearTimers(),this.timers.push(setTimeout(()=>this.transitionTo("pulse"),this.thresholds.pulseMs)),this.timers.push(setTimeout(()=>this.transitionTo("hint"),this.thresholds.hintMs)),this.timers.push(setTimeout(()=>this.transitionTo("offer_help"),this.thresholds.offerHelpMs))}recordRetry(){this.destroyed||(this.retryCount++,this.retryCount>=3&&this.phaseOrder(this.phase)<this.phaseOrder("pulse")&&this.transitionTo("pulse"),this.retryCount>=5&&this.phaseOrder(this.phase)<this.phaseOrder("hint")&&this.transitionTo("hint"))}getPhase(){return this.phase}getRetryCount(){return this.retryCount}reset(){this.clearTimers(),this.phase="idle",this.retryCount=0}destroy(){this.destroyed=!0,this.clearTimers()}transitionTo(e){this.destroyed||this.phaseOrder(e)<=this.phaseOrder(this.phase)||(this.phase=e,this.onPhaseChange(e))}phaseOrder(e){switch(e){case"idle":return 0;case"pulse":return 1;case"hint":return 2;case"offer_help":return 3}}clearTimers(){for(const e of this.timers)clearTimeout(e);this.timers=[]}}class to{constructor(e,t,i){this.stuckDetector=null,this.retryClickCleanup=null,this.beforeUnloadHandler=null,this.config=e,this.eventBuffer=t,this.refs=i}startStuckDetection(e,t){this.destroyStuckDetector();const i=e.action_config.stuck_thresholds;this.stuckDetector=new eo(r=>this.handleStuckPhaseChange(r,e),i?{pulseMs:i.pulse_ms,hintMs:i.hint_ms,offerHelpMs:i.offer_help_ms}:void 0),this.stuckDetector.start(),t&&this.setupRetryClickListener(t)}handleStuckPhaseChange(e,t){var s,o;if(this.refs.isDestroyed())return;const i=_(this.config.siteId,"guide_step_stuck",{phase:e,retry_count:((s=this.stuckDetector)==null?void 0:s.getRetryCount())??0});i.guide_id=this.refs.getGuideId(),i.step_index=this.refs.getCurrentStep(),(o=this.eventBuffer)==null||o.push(i);const r=this.refs.getTooltipEl();if(r)switch(r.classList.remove("guideai-minibar--stuck-pulse","guideai-minibar--stuck-hint","guideai-minibar--stuck-offer"),e){case"pulse":r.classList.add("guideai-minibar--stuck-pulse");{const a=this.refs.getHighlightEl();a&&a.classList.add("guideai-highlight--pulse")}break;case"hint":r.classList.add("guideai-minibar--stuck-hint");{const a=r.querySelector(".guideai-minibar-hint");a&&(a.textContent=this.getHintText(t))}break;case"offer_help":r.classList.add("guideai-minibar--stuck-offer");break}}getHintText(e){switch(e.action_config.action_type){case"click":return"Try clicking the highlighted element";case"fill":return"Type in the highlighted field";case"select":return"Choose an option from the dropdown";case"navigate":return"Navigate to the indicated page";default:return"Complete the action to continue"}}setupRetryClickListener(e){this.cleanupRetryClick();const t=this.refs.getShadowRoot(),i=r=>{var o,a,l;if(this.refs.isDestroyed()||!this.stuckDetector||e.contains(r.target)||t.contains(r.target))return;this.stuckDetector.recordRetry();const s=_(this.config.siteId,"guide_step_retry",{retry_count:this.stuckDetector.getRetryCount(),clicked_tag:(a=(o=r.target)==null?void 0:o.tagName)==null?void 0:a.toLowerCase()});s.guide_id=this.refs.getGuideId(),s.step_index=this.refs.getCurrentStep(),(l=this.eventBuffer)==null||l.push(s)};document.addEventListener("click",i,!0),this.retryClickCleanup=()=>{document.removeEventListener("click",i,!0)}}cleanupRetryClick(){this.retryClickCleanup&&(this.retryClickCleanup(),this.retryClickCleanup=null)}destroyStuckDetector(){var t;(t=this.stuckDetector)==null||t.destroy(),this.stuckDetector=null,this.cleanupRetryClick();const e=this.refs.getHighlightEl();e&&e.classList.remove("guideai-highlight--pulse")}setupNavigationPrevention(){this.teardownNavigationPrevention(),this.beforeUnloadHandler=e=>{var i;const t=_(this.config.siteId,"guide_navigation_blocked");t.guide_id=this.refs.getGuideId(),t.step_index=this.refs.getCurrentStep(),(i=this.eventBuffer)==null||i.push(t),e.preventDefault(),e.returnValue=""},window.addEventListener("beforeunload",this.beforeUnloadHandler)}teardownNavigationPrevention(){this.beforeUnloadHandler&&(window.removeEventListener("beforeunload",this.beforeUnloadHandler),this.beforeUnloadHandler=null)}destroy(){this.destroyStuckDetector(),this.teardownNavigationPrevention()}}function io(n,e){const t=n.action_config.action_type,i=n.action_config.completion_hint;switch(t){case"click":return ro(e);case"fill":return no(e);case"select":return so(e);case"navigate":return oo(i);case"none":return i?ao():li();default:return li()}}function ro(n){let e=()=>{};return{promise:new Promise(i=>{if(!n){const s=()=>{i({completed:!0,detail:"document_click"})};document.addEventListener("click",s,{once:!0}),e=()=>document.removeEventListener("click",s);return}const r=()=>{i({completed:!0,detail:"target_click"})};n.addEventListener("click",r,{once:!0}),e=()=>n.removeEventListener("click",r)}),cancel:()=>e()}}function no(n){let e=()=>{};return{promise:new Promise(i=>{if(!n||!(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement)){i({completed:!0,detail:"no_input_target"});return}const r=n,s=r.value,o=()=>r.value!==s&&r.value.trim().length>0?(i({completed:!0,detail:`filled: "${r.value}"`}),!0):!1,a=()=>{o()&&r.removeEventListener("keydown",l)},l=c=>{c.key==="Enter"&&o()&&r.removeEventListener("blur",a)};r.addEventListener("blur",a),r.addEventListener("keydown",l),e=()=>{r.removeEventListener("blur",a),r.removeEventListener("keydown",l)}}),cancel:()=>e()}}function so(n){let e=()=>{};return{promise:new Promise(i=>{if(!n){i({completed:!0,detail:"no_select_target"});return}const r=()=>{const s=n.value??"";i({completed:!0,detail:`selected: "${s}"`})};n.addEventListener("change",r,{once:!0}),e=()=>n.removeEventListener("change",r)}),cancel:()=>e()}}function oo(n){let e=()=>{};const t=location.href;return{promise:new Promise(r=>{const s=()=>location.href!==t?n&&!location.pathname.includes(n)?!1:(r({completed:!0,detail:`navigated: ${location.pathname}`}),!0):!1,o=()=>{s()};window.addEventListener("popstate",o);const a=history.pushState.bind(history),l=history.replaceState.bind(history);history.pushState=function(...d){a(...d),s()},history.replaceState=function(...d){l(...d),s()};const c=setInterval(()=>{s()},500);e=()=>{window.removeEventListener("popstate",o),history.pushState=a,history.replaceState=l,clearInterval(c)}}),cancel:()=>e()}}function ao(n){let e=()=>{};return{promise:new Promise(i=>{let r=!1;const s=v=>{r||(r=!0,e(),i({completed:!0,detail:v}))},o=ai(),a=location.href,l=new MutationObserver(()=>{const v=ai(),k=lo(o,v);if(k){s(`dom_changed: ${k}`);return}if(location.href!==a){s(`url_changed: ${location.pathname}`);return}});l.observe(document.body,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["class","hidden","aria-hidden","aria-selected","aria-expanded","aria-checked","data-state","data-active","data-selected","data-count","disabled","open"]});const c=window.fetch,d=new Set(["POST","PUT","PATCH","DELETE"]);window.fetch=function(...v){var V;const k=v[0];let C="GET";typeof k=="string"||k instanceof URL?C=(((V=v[1])==null?void 0:V.method)??"GET").toUpperCase():k instanceof Request&&(C=k.method.toUpperCase());const N=c.apply(window,v);return d.has(C)&&N.then(()=>{setTimeout(()=>{r||s(`network_mutation: ${C}`)},200)}).catch(()=>{}),N};const u=XMLHttpRequest.prototype,h=u.open;let p="GET";u.open=function(v,...k){return p=v.toUpperCase(),h.apply(this,[v,...k])};const m=u.send;u.send=function(...v){return d.has(p)&&this.addEventListener("load",()=>{setTimeout(()=>{r||s(`xhr_mutation: ${p}`)},200)},{once:!0}),m.apply(this,v)};const f=v=>{const k=v.target;if(!k)return;const C=k.closest('button, a, [role="button"], input[type="submit"], [data-action]');C&&setTimeout(()=>{var N;if(!r){const V=((N=C.textContent)==null?void 0:N.trim().slice(0,50))??"";s(`user_action_click: "${V}"`)}},500)};document.addEventListener("click",f,!0);const g=history.pushState.bind(history),b=history.replaceState.bind(history),y=()=>{location.href!==a&&!r&&s(`navigated: ${location.pathname}`)};history.pushState=function(...v){g(...v),y()},history.replaceState=function(...v){b(...v),y()},window.addEventListener("popstate",y);const S=setTimeout(()=>{s("timeout")},12e4);e=()=>{l.disconnect(),document.removeEventListener("click",f,!0),window.removeEventListener("popstate",y),window.fetch=c,u.open=h,u.send=m,history.pushState=g,history.replaceState=b,clearTimeout(S)}}),cancel:()=>e()}}function ai(){var i;const n=new Map;let e=0;const t=document.querySelectorAll('span, sup, sub, small, em, strong, b, i, mark, [role="status"], [aria-live], [aria-atomic]');for(let r=0;r<t.length;r++){const s=t[r],o=((i=s.textContent)==null?void 0:i.trim())??"";if(o.length===0||o.length>10)continue;const a=co(s);n.set(a,o),e++}return{entries:n,totalCount:e}}function lo(n,e){for(const[t,i]of n.entries){const r=e.entries.get(t);if(r!==void 0&&r!==i)return`"${i}" → "${r}" at ${t}`}if(e.totalCount>n.totalCount){for(const[t,i]of e.entries)if(!n.entries.has(t)&&(/\d/.test(i)||i.length<=3))return`new_badge: "${i}" at ${t}`}return null}function co(n){const e=[];let t=n,i=0;for(;t&&t!==document.body&&i<4;){const r=t.tagName.toLowerCase(),s=t.id?`#${t.id}`:"",o=uo(t);e.unshift(`${r}${s}[${o}]`),t=t.parentElement,i++}return e.join(">")}function uo(n){let e=0,t=n.previousElementSibling;for(;t;)t.tagName===n.tagName&&e++,t=t.previousElementSibling;return e}function li(){return{promise:Promise.resolve({completed:!0,detail:"manual"}),cancel:()=>{}}}class ho{constructor(e,t,i,r){this.actionValidatorCancel=null,this.config=e,this.eventBuffer=t,this.stuckWiring=i,this.refs=r}renderMiniBar(e,t,i){const r=document.createElement("div");r.className="guideai-minibar",r.setAttribute("role","status"),r.setAttribute("aria-label",e.content.title??"Waiting for action");const s=this.refs.getTotalSteps(),o=this.refs.getCurrentStep(),a=(o+1)/s*100,l=o>0,c=e.action_config.allow_skip!==!1;r.innerHTML=`
      <div class="guideai-minibar-progress">
        <div class="guideai-minibar-progress-bar" style="width:${a}%"></div>
      </div>
      <div class="guideai-minibar-content">
        ${l?'<button class="guideai-minibar-back" aria-label="Go back">&larr;</button>':""}
        <span class="guideai-minibar-dot"></span>
        <span class="guideai-minibar-text">${M(e.content.title||"Complete the action...")}</span>
        <span class="guideai-minibar-hint"></span>
        ${c?'<button class="guideai-minibar-skip">Skip</button>':""}
        <button class="guideai-minibar-close" aria-label="Close guide">&times;</button>
      </div>
    `,this.refs.getShadowRoot().appendChild(r),this.refs.setTooltipEl(r);const d=r.querySelector(".guideai-minibar-back");d==null||d.addEventListener("click",()=>i.onPrev());const u=r.querySelector(".guideai-minibar-skip");u==null||u.addEventListener("click",()=>i.onSkip());const h=r.querySelector(".guideai-minibar-doit-offer");h==null||h.addEventListener("click",()=>i.onDoItForMe(e,t));const p=r.querySelector(".guideai-minibar-close");p==null||p.addEventListener("click",()=>i.onDismiss()),Ps(r)}setupInteractiveStep(e,t,i){this.cancelActionValidator();const r=this.refs.getCurrentStep(),{promise:s,cancel:o}=io(e,t);this.actionValidatorCancel=o,this.stuckWiring.startStuckDetection(e,t),e.action_config.allow_skip===!1&&this.stuckWiring.setupNavigationPrevention(),s.then(a=>{var l;if(!this.refs.isDestroyed()&&this.refs.getCurrentStep()===r){if(this.actionValidatorCancel=null,console.log("[GuideAI:Player] Action completed:",a),i.onComplete(r),(l=this.eventBuffer)==null||l.push(Fe(this.config.siteId,this.refs.getGuideId(),this.refs.getCurrentStep(),"interactive_complete",a.detail)),e.action_config.action_type==="navigate"||e.action_config.action_type==="click"){const c=this.refs.getCurrentStep(),d=this.refs.getTotalSteps();c<d-1?this.refs.saveSession(c+1,!0):this.refs.clearSession()}this.showCompletionOnMiniBar(),e.choices&&e.choices.length>0?setTimeout(()=>{!this.refs.isDestroyed()&&this.refs.getCurrentStep()===r&&i.onExpandToChoices(e)},800):setTimeout(()=>{!this.refs.isDestroyed()&&this.refs.getCurrentStep()===r&&i.onNext()},1200)}})}showCompletionOnMiniBar(){const e=this.refs.getTooltipEl();if(!e)return;e.classList.add("guideai-minibar--completed");const t=e.querySelector(".guideai-minibar-dot");t&&t.classList.add("guideai-minibar-dot--done");const i=e.querySelector(".guideai-minibar-text");i&&(i.textContent="Action completed!");const r=e.querySelector(".guideai-minibar-skip");r&&(r.style.display="none")}cancelActionValidator(){this.actionValidatorCancel&&(this.actionValidatorCancel(),this.actionValidatorCancel=null)}destroy(){this.cancelActionValidator()}}class go{constructor(e,t,i){this.paused=!1,this.routeChangeCleanup=null,this.config=e,this.eventBuffer=t,this.refs=i}isOnWrongPage(e){const t=e.page_url_pattern;if(!t||t==="*")return!1;let i=t;if(!t.startsWith("/"))try{i=new URL(t,location.origin).pathname}catch{return!1}return!ue(i,location.pathname)}navigateToStepIfNeeded(e){return!1}inferNextStepPage(e,t,i){const r=e.steps[t],s=e.steps[i];if(!r||!s)return;const o=r.action_config.action_type;if(o!=="click"&&o!=="navigate"||s.page_url_pattern)return;const a=this.extractLinkHrefFromStep(r);if(a){console.log(`[GuideAI:Player] Runtime inference: step ${t} links to "${a}" — setting page_url_pattern on step ${i}`),s.page_url_pattern=a;for(let l=i+1;l<e.steps.length;l++){const c=e.steps[l];if(c.page_url_pattern)break;c.page_url_pattern=a;const d=c.action_config.action_type;if(d==="click"||d==="navigate")break}}}extractLinkHrefFromStep(e){if(e.target_selector)try{const i=document.querySelector(e.target_selector);if(i){const r=i.tagName==="A"?i:i.closest("a");if(r){const s=r.getAttribute("href");if(s&&s!=="#"&&!s.startsWith("javascript:")){if(s.startsWith("/"))return s.split("?")[0].split("#")[0];try{if(s.startsWith("http"))return new URL(s).pathname}catch{}}}}}catch{}const t=this.refs.findTargetElement(e);if(t){const i=t.tagName==="A"?t:t.closest("a");if(i){const r=i.getAttribute("href");if(r&&r!=="#"&&!r.startsWith("javascript:")){if(r.startsWith("/"))return r.split("?")[0].split("#")[0];try{if(r.startsWith("http"))return new URL(r).pathname}catch{}}}}return null}listenForRouteChange(e){this.cleanupRouteChangeListener();const t=()=>{this.refs.isDestroyed()||!this.paused||e.steps[this.refs.getCurrentStep()]},i=()=>t();window.addEventListener("popstate",i);const r=history.pushState.bind(history),s=history.replaceState.bind(history);history.pushState=(...o)=>{r(...o),t()},history.replaceState=(...o)=>{s(...o),t()},this.routeChangeCleanup=()=>{window.removeEventListener("popstate",i),history.pushState=r,history.replaceState=s}}cleanupRouteChangeListener(){this.routeChangeCleanup&&(this.routeChangeCleanup(),this.routeChangeCleanup=null)}destroy(){this.cleanupRouteChangeListener(),this.paused=!1}}class ot{constructor(e,t,i,r,s){this.guide=null,this.currentStep=0,this.resizeHandler=null,this.scrollHandler=null,this.repositionRaf=null,this.destroyed=!1,this.endedEmitted=!1,this.targetClickCleanup=null,this.retryTimer=null,this.tooltipDelayTimer=null,this.revealAttempted=new Set,this.completedSteps=new Set,this.transientTooltipEl=null,this.pendingRevealTargets=new Set,this.onCompleteCallback=null,this.hooks={},this.analyzer=null,this.lazyScanCancel=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i,this.analyzer=s??null,this.executor=new Ts,this.tooltipRenderer=new Rs(i),this.elementFinder=new Qs(s??null,r??null);const o={getTooltipEl:()=>this.tooltipRenderer.getTooltipEl(),getHighlightEl:()=>this.tooltipRenderer.getHighlightEl(),getShadowRoot:()=>this.shadowRoot,getGuideId:()=>{var c;return(c=this.guide)==null?void 0:c.id},getCurrentStep:()=>this.currentStep,isDestroyed:()=>this.destroyed};this.stuckWiring=new to(e,t,o);const a={getShadowRoot:()=>this.shadowRoot,getGuideId:()=>{var c;return(c=this.guide)==null?void 0:c.id},getCurrentStep:()=>this.currentStep,getTotalSteps:()=>{var c;return((c=this.guide)==null?void 0:c.steps.length)??0},isDestroyed:()=>this.destroyed,getTooltipEl:()=>this.transientTooltipEl??this.tooltipRenderer.getTooltipEl(),setTooltipEl:c=>{this.setTransientTooltipEl(c)},saveSession:(c,d)=>this.saveSession(c,d),clearSession:()=>this.clearSession()};this.interactiveHandler=new ho(e,t,this.stuckWiring,a);const l={getShadowRoot:()=>this.shadowRoot,getGuideId:()=>{var c;return(c=this.guide)==null?void 0:c.id},getCurrentStep:()=>this.currentStep,getTotalSteps:()=>{var c;return((c=this.guide)==null?void 0:c.steps.length)??0},isDestroyed:()=>this.destroyed,getTooltipEl:()=>this.tooltipRenderer.getTooltipEl(),setTooltipEl:c=>{},findTargetElement:c=>{var d;return this.elementFinder.findTargetElement(c,((d=this.guide)==null?void 0:d.id)??"")},saveSession:(c,d)=>this.saveSession(c,d??!1),onResume:()=>this.renderStep(),onDismiss:()=>{this.dismiss("user")}};this.routeManager=new go(e,t,l)}on(e,t){const i=this.hooks[e]??[];return i.push(t),this.hooks[e]=i,()=>{const r=this.hooks[e];r&&(this.hooks[e]=r.filter(s=>s!==t))}}async runHooks(e,t){const i=this.hooks[e];if(!i||i.length===0)return!0;const r={...t,cancel:!1};for(const s of i)try{if(await s(r),e.startsWith("before-")&&r.cancel)return!1}catch(o){typeof console<"u"&&console.warn("[GuideAI] hook error in",e,o)}return!0}async dismiss(e="user"){if(!this.guide||this.destroyed)return!1;const t=this.guide,i=this.currentStep;return await this.runHooks("before-dismiss",{guide:t,stepIndex:i,reason:e})?(this.destroy(),await this.runHooks("dismissed",{guide:t,stepIndex:i,reason:e}),!0):!1}start(e,t=0,i){var s;this.guide=e,this.onCompleteCallback=i??null,this.currentStep=t,this.destroyed=!1,this.endedEmitted=!1,this.revealAttempted.clear(),this.completedSteps.clear(),this.pendingRevealTargets.clear(),(s=this.eventBuffer)==null||s.push(ze(this.config.siteId,"guide_started",e.id,void 0,{title:e.title,total_steps:e.steps.length})),this.saveSession(),this.renderStep();const r=()=>{this.repositionRaf===null&&(this.repositionRaf=window.requestAnimationFrame(()=>{if(this.repositionRaf=null,!this.guide)return;const o=this.guide.steps[this.currentStep];o&&this.tooltipRenderer.reposition(o)}))};this.resizeHandler=()=>r(),window.addEventListener("resize",this.resizeHandler,{passive:!0}),this.scrollHandler=()=>r(),document.addEventListener("scroll",this.scrollHandler,{passive:!0,capture:!0})}destroy(){var i;const e=!this.destroyed&&this.guide!==null,t=(i=this.guide)==null?void 0:i.id;this.destroyed=!0,this.cleanupTargetClick(),this.interactiveHandler.destroy(),this.cancelRetry(),this.cancelTooltipDelay(),this.cancelLazyScan(),this.stuckWiring.destroy(),this.routeManager.destroy(),this.tooltipRenderer.destroy(),this.clearTransientTooltipEl(),this.resizeHandler&&(window.removeEventListener("resize",this.resizeHandler),this.resizeHandler=null),this.scrollHandler&&(document.removeEventListener("scroll",this.scrollHandler,!0),this.scrollHandler=null),this.repositionRaf!==null&&(window.cancelAnimationFrame(this.repositionRaf),this.repositionRaf=null),this.clearSession(),this.revealAttempted.clear(),this.completedSteps.clear(),this.pendingRevealTargets.clear(),e&&!this.endedEmitted&&(this.endedEmitted=!0,document.dispatchEvent(new CustomEvent("guideai:player-ended",{detail:{guideId:t,reason:"dismissed"}})))}pause(e="user"){this.guide&&this.guide.steps[this.currentStep]}renderStep(){var r,s,o,a,l,c,d;if(!this.guide||this.destroyed)return;const e=this.guide.steps[this.currentStep];if(console.log(`[GuideAI:Player] renderStep ${this.currentStep}/${this.guide.steps.length}`,{title:(r=e==null?void 0:e.content)==null?void 0:r.title,selector:e==null?void 0:e.target_selector,fpScore:(s=e==null?void 0:e.target_fingerprint)==null?void 0:s.total_score,action:(o=e==null?void 0:e.action_config)==null?void 0:o.action_type}),!e){this.complete();return}if(this.routeManager.navigateToStepIfNeeded(e))return;if(this.routeManager.isOnWrongPage(e)){console.log(`[GuideAI:Player] Step ${this.currentStep} expects "${e.page_url_pattern}" but we're on "${location.pathname}" — pausing guide`),this.pause("wrong_page");return}this.cleanupTargetClick(),console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━","color: #2196f3"),console.log(`%c🎬 [GuidePlayer] Rendering Step ${this.currentStep}`,"color: #2196f3; font-weight: bold; font-size: 16px"),console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━","color: #2196f3"),console.log("[GuidePlayer] Step content:",{title:e.content.title,body:e.content.body,target_selector:e.target_selector,action_type:e.action_config.action_type}),this.interactiveHandler.cancelActionValidator(),this.cancelRetry(),this.cancelTooltipDelay(),this.cancelLazyScan(),this.tooltipRenderer.removeAll(),this.clearTransientTooltipEl();const t=this.hasPendingRevealForStep(e);console.log("%c🔍 [GuidePlayer] Searching for target element...","color: #00bcd4; font-weight: bold");let i=null;if(t&&(console.log("[GuidePlayer] Step is in post-reveal resolution mode",{stepId:e.id}),i=this.findVisibleSelectorMatch(e)),i=i??this.elementFinder.findTargetElement(e,this.guide.id),!i&&(e.target_selector||e.target_fingerprint.total_score>0)&&e.action_config.action_type!=="none"){if(console.log("%c⏳ [GuidePlayer] Element not found immediately, starting polling...","color: #ff9800; font-weight: bold"),this.analyzer){console.log("[GuidePlayer] Using analyzer lazy scan");const u=this.analyzer.stepToIntent(e);this.lazyScanCancel=this.analyzer.startLazyScan(u,h=>{this.destroyed||h.element&&(console.log("%c✅ [GuidePlayer] Lazy scan found element!","color: #4caf50; font-weight: bold",h.element),this.renderStep())})}else console.log("[GuidePlayer] Using legacy retry polling (500ms interval, 15 attempts)"),this.startRetryPolling(e);return}if(i){if(console.log("%c✅ [GuidePlayer] Target element found!","color: #4caf50; font-weight: bold",i),console.log("[GuidePlayer] Checking visibility..."),!T(i)){if(t){console.log("[GuidePlayer] Post-reveal target is still hidden, waiting for revealed target to settle"),this.startPostRevealPolling(e);return}console.log("%c⚠️ [GuidePlayer] Element is hidden - not auto-revealing","color: #ff9800; font-weight: bold"),console.log("[GuidePlayer] Hidden targets must be revealed by the user before we highlight them"),this.tooltipRenderer.renderTooltip(e,null,this.buildTooltipOpts(e,null));return}console.log("[GuidePlayer] Element is visible ✅");const u=i.getBoundingClientRect();u.top<0||u.bottom>window.innerHeight?(console.log(`[GuidePlayer] Scrolling element into view (currently at y: ${u.top})`),i.scrollIntoView({behavior:"smooth",block:"center"})):console.log("[GuidePlayer] Element already in viewport")}else{if(t){console.log("[GuidePlayer] Post-reveal target not found yet, waiting for a visible match"),this.startPostRevealPolling(e);return}console.log("%c⚠️ [GuidePlayer] No target element found","color: #ff9800; font-weight: bold")}if(this.isRevealPrerequisiteStep(e)&&i){console.log("%c🪜 [GuidePlayer] Rendering gated reveal step","color: #8bc34a; font-weight: bold",{revealFor:this.getRevealTargetStepId(e)}),this.tooltipRenderer.renderOverlay(),this.tooltipRenderer.renderHighlight(i);const u=this.buildInteractiveCallbacks(e,i);this.interactiveHandler.renderMiniBar(e,i,u),this.interactiveHandler.setupInteractiveStep(e,i,u),(a=this.eventBuffer)==null||a.push(Ge(this.config.siteId,this.guide.id,this.currentStep,this.guide.steps.length,e.content.title,e.action_config.action_type,!0,!1));return}if(t&&i&&this.isClickableStep(e)){console.log("%c🖱️ [GuidePlayer] Rendering gated post-reveal target step with tooltip brief","color: #03a9f4; font-weight: bold",{stepId:e.id,selector:e.target_selector});const u=this.currentStep;this.tooltipRenderer.renderOverlay(),this.tooltipRenderer.renderHighlight(i),this.tooltipDelayTimer=setTimeout(()=>{this.destroyed||!this.guide||this.currentStep!==u||this.tooltipRenderer.renderTooltip(e,i,this.buildTooltipOpts(e,i,!1))},300),this.setupTargetClickListener(i),(l=this.eventBuffer)==null||l.push(Ge(this.config.siteId,this.guide.id,this.currentStep,this.guide.steps.length,e.content.title,e.action_config.action_type,!0,!1));return}console.log("%c🎨 [GuidePlayer] Rendering tooltip and highlight","color: #9c27b0; font-weight: bold"),i?(console.log("[GuidePlayer] Rendering overlay and highlight"),this.tooltipRenderer.renderOverlay(),this.tooltipRenderer.renderHighlight(i),this.isClickableStep(e)&&((c=this.tooltipRenderer.getHighlightEl())==null||c.classList.add("guideai-highlight--pulse"))):console.log("[GuidePlayer] Rendering tooltip without highlight (no target)"),this.tooltipRenderer.renderTooltip(e,i,this.buildTooltipOpts(e,i,!1)),i&&this.isClickableStep(e)&&this.setupTargetClickListener(i),(d=this.eventBuffer)==null||d.push(Ge(this.config.siteId,this.guide.id,this.currentStep,this.guide.steps.length,e.content.title,e.action_config.action_type,!!i,!1))}buildTooltipOpts(e,t,i=!1){const r={onNext:()=>{this.next()},onPrev:()=>{this.prev()},onDismiss:()=>{this.dismiss("user")},onSkip:()=>{this.dismiss("user")},onDoItForMe:(s,o)=>this.doItForMe(s,o),onChoice:s=>this.handleChoice(s)};return{currentStep:this.currentStep,totalSteps:this.guide.steps.length,isClickable:this.isClickableStep(e)&&!!t,callbacks:r,showChoices:i}}buildInteractiveCallbacks(e,t){return{onNext:()=>{this.next()},onPrev:()=>{this.prev()},onDismiss:()=>{this.dismiss("user")},onSkip:()=>{this.skip()},onDoItForMe:(i,r)=>this.doItForMe(i,r),onChoice:i=>this.handleChoice(i),onExpandToChoices:i=>this.expandToChoices(i),onComplete:i=>{var o;this.completedSteps.add(i);const r=(o=this.guide)==null?void 0:o.steps[i],s=r?this.getRevealTargetStepId(r):null;s&&(console.log("[GuidePlayer] Reveal prerequisite satisfied",{stepIndex:i,revealFor:s}),this.pendingRevealTargets.add(s))}}}isClickableStep(e){const t=e.action_config.action_type;return t==="click"||t==="navigate"}isRevealPrerequisiteStep(e){var t;return((t=e.metadata)==null?void 0:t.requires_reveal)===!0}hasPendingRevealForStep(e){return this.pendingRevealTargets.has(e.id)}getRevealTargetStepId(e){var i;const t=(i=e.metadata)==null?void 0:i.reveal_for;return typeof t=="string"&&t.trim().length>0?t:null}findVisibleSelectorMatch(e){if(!e.target_selector)return null;try{const t=Array.from(document.querySelectorAll(e.target_selector)),i=t.find(r=>T(r));if(i)return console.log("[GuidePlayer] Using visible selector match after reveal",{selector:e.target_selector,matches:t.length,element:i}),i;console.log("[GuidePlayer] No visible selector match yet after reveal",{selector:e.target_selector,matches:t.length})}catch(t){console.warn("[GuidePlayer] Visible selector match failed",t)}return null}setTransientTooltipEl(e){this.clearTransientTooltipEl(),this.transientTooltipEl=e}clearTransientTooltipEl(){this.transientTooltipEl&&(this.transientTooltipEl.remove(),this.transientTooltipEl=null)}setupTargetClickListener(e){this.cleanupTargetClick();const t=()=>{var i,r;if(!this.destroyed&&this.config.autoAdvanceOnTargetClick){if((r=this.eventBuffer)==null||r.push(Fe(this.config.siteId,(i=this.guide)==null?void 0:i.id,this.currentStep,"user_click")),this.guide&&this.currentStep<this.guide.steps.length-1?this.saveSession(this.currentStep+1,!0):this.clearSession(),this.guide){const s=this.guide.steps[this.currentStep];s&&this.pendingRevealTargets.delete(s.id)}this.completedSteps.add(this.currentStep),setTimeout(()=>{this.destroyed||this.next()},0)}};e.addEventListener("click",t,{once:!0}),this.targetClickCleanup=()=>{e.removeEventListener("click",t)}}cleanupTargetClick(){this.targetClickCleanup&&(this.targetClickCleanup(),this.targetClickCleanup=null)}async revealHiddenTarget(e,t){if(console.log(`%c🔓 [GuidePlayer] Attempting to reveal hidden target for step ${e}`,"color: #ff5722; font-weight: bold"),this.revealAttempted.has(e))return console.log("[GuidePlayer] Already attempted reveal for this step, skipping"),!1;if(this.revealAttempted.add(e),t instanceof HTMLElement){if(console.log("[GuidePlayer] Trying scroll-into-view first..."),t.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(s=>setTimeout(s,400)),T(t))return console.log("%c✅ [GuidePlayer] Element visible after scrolling!","color: #4caf50; font-weight: bold"),!0;console.log("[GuidePlayer] Still hidden after scroll, trying expandable ancestors...")}console.log("[GuidePlayer] Searching for expandable ancestor containers...");const i=Le(t);if(i.length===0)return console.log("%c❌ [GuidePlayer] No expandable ancestors found","color: #f44336"),!1;console.log(`[GuidePlayer] Found ${i.length} expandable ancestor(s), expanding in order...`);for(let s=0;s<i.length;s++){const o=i[s];if(console.log(`[GuidePlayer] Expanding ancestor ${s+1}/${i.length}:`,o.kind),!await Ie(o))return console.log(`%c❌ [GuidePlayer] Failed to expand ancestor ${s+1}, aborting`,"color: #f44336"),!1;console.log(`%c✅ [GuidePlayer] Successfully expanded ancestor ${s+1}`,"color: #4caf50")}console.log("[GuidePlayer] All ancestors expanded, checking final visibility...");const r=T(t);return r?console.log("%c✅ [GuidePlayer] Target is now VISIBLE!","color: #4caf50; font-weight: bold"):console.log("%c❌ [GuidePlayer] Target is still HIDDEN after expansion","color: #f44336; font-weight: bold"),r}startRetryPolling(e){console.log("%c⏳ [GuidePlayer] Starting retry polling (500ms interval, max 15 attempts)","color: #ff9800; font-weight: bold");let t=0;const i=15,r=()=>{var o;if(this.destroyed||t>=i){t>=i&&console.log(`%c⏱️ [GuidePlayer] Retry polling timeout (${i} attempts exhausted)`,"color: #f44336");return}t++,console.log(`[GuidePlayer] Retry attempt ${t}/${i}...`);const s=this.elementFinder.findTargetElement(e,((o=this.guide)==null?void 0:o.id)??"");s?(console.log(`%c✅ [GuidePlayer] Element found on attempt ${t}!`,"color: #4caf50; font-weight: bold",s),T(s)?(console.log("[GuidePlayer] Element is visible, rendering..."),this.renderStep()):(console.log("[GuidePlayer] Element is hidden, attempting reveal..."),this.revealHiddenTarget(this.currentStep,s).then(()=>{this.destroyed||this.renderStep()}))):(console.log("[GuidePlayer] Element not found yet, scheduling next attempt..."),this.retryTimer=setTimeout(r,500))};this.retryTimer=setTimeout(r,500)}startPostRevealPolling(e){this.cancelRetry();let t=0;const i=8,r=()=>{if(this.destroyed||!this.guide||!this.hasPendingRevealForStep(e))return;t++;const s=this.findVisibleSelectorMatch(e);if(s&&T(s)){console.log("%c✅ [GuidePlayer] Found visible target after reveal","color: #4caf50; font-weight: bold",s),this.pendingRevealTargets.delete(e.id),this.renderStep();return}if(t>=i){console.log("%c⚠️ [GuidePlayer] Post-reveal polling exhausted; showing tooltip without highlight","color: #ff9800; font-weight: bold",{stepId:e.id,selector:e.target_selector}),this.pendingRevealTargets.delete(e.id),this.tooltipRenderer.renderTooltip(e,null,this.buildTooltipOpts(e,null));return}this.retryTimer=setTimeout(r,150)};this.retryTimer=setTimeout(r,200)}cancelRetry(){this.retryTimer&&(clearTimeout(this.retryTimer),this.retryTimer=null)}cancelTooltipDelay(){this.tooltipDelayTimer&&(clearTimeout(this.tooltipDelayTimer),this.tooltipDelayTimer=null)}cancelLazyScan(){this.lazyScanCancel&&(this.lazyScanCancel(),this.lazyScanCancel=null)}isStepBlocked(){if(!this.guide)return!1;const e=this.guide.steps[this.currentStep];return e?this.isRevealPrerequisiteStep(e)?!this.completedSteps.has(this.currentStep):this.hasPendingRevealForStep(e)&&this.isClickableStep(e)?!this.completedSteps.has(this.currentStep):!1:!1}async skip(){var t;if(!this.guide||this.destroyed)return;const e=this.guide.steps[this.currentStep];(e==null?void 0:e.action_config.allow_skip)!==!1&&((t=this.eventBuffer)==null||t.push(Fe(this.config.siteId,this.guide.id,this.currentStep,"skipped")),this.completedSteps.add(this.currentStep),await this.next())}async next(){var o;if(!this.guide||this.destroyed)return;const e=this.guide,t=this.currentStep;if(this.isStepBlocked()){console.log(`[GuideAI:Player] Step ${t} is interactive and not completed — blocking next()`);return}if(t>=e.steps.length-1){await this.complete();return}const i=t+1,r=e.steps[t];this.routeManager.inferNextStepPage(e,t,i),!(!await this.runHooks("before-advance",{guide:e,stepIndex:t,fromIndex:t,toIndex:i})||this.destroyed)&&(this.cleanupTargetClick(),this.cancelRetry(),this.cancelTooltipDelay(),this.cancelLazyScan(),this.stuckWiring.destroyStuckDetector(),this.stuckWiring.teardownNavigationPrevention(),this.clearTransientTooltipEl(),this.currentStep=i,this.revealAttempted.delete(this.currentStep),(o=this.analyzer)==null||o.clearAllRevealAttempts(),this.saveSession(),r&&this.isRevealPrerequisiteStep(r)?(console.log("[GuidePlayer] Waiting briefly after reveal-step completion before rendering next target"),setTimeout(()=>{!this.destroyed&&this.guide===e&&this.currentStep===i&&this.renderStep()},250)):this.renderStep(),await this.runHooks("advanced",{guide:e,stepIndex:i,fromIndex:t,toIndex:i}))}async prev(){var s;if(!this.guide||this.destroyed||this.currentStep<=0)return;const e=this.guide,t=this.currentStep,i=t-1;!await this.runHooks("before-previous",{guide:e,stepIndex:t,fromIndex:t,toIndex:i})||this.destroyed||(this.cleanupTargetClick(),this.cancelRetry(),this.cancelTooltipDelay(),this.cancelLazyScan(),this.stuckWiring.destroyStuckDetector(),this.stuckWiring.teardownNavigationPrevention(),this.clearTransientTooltipEl(),this.currentStep=i,this.revealAttempted.delete(this.currentStep),(s=this.analyzer)==null||s.clearAllRevealAttempts(),this.saveSession(),this.renderStep(),await this.runHooks("went-back",{guide:e,stepIndex:i,fromIndex:t,toIndex:i}))}async complete(){var s;if(!this.guide||this.destroyed)return;const e=this.guide,t=this.currentStep;if(!await this.runHooks("before-complete",{guide:e,stepIndex:t})||this.destroyed)return;(s=this.eventBuffer)==null||s.push(ze(this.config.siteId,"guide_completed",e.id,void 0,{total_steps:e.steps.length}));const r=this.onCompleteCallback;this.endedEmitted=!0,document.dispatchEvent(new CustomEvent("guideai:player-ended",{detail:{guideId:e.id,reason:"completed"}})),this.destroy(),r==null||r(),await this.runHooks("completed",{guide:e,stepIndex:t})}async doItForMe(e,t){if(!t)return;this.cleanupTargetClick(),this.interactiveHandler.cancelActionValidator(),this.guide&&this.currentStep<this.guide.steps.length-1?this.saveSession(this.currentStep+1,!0):this.clearSession();const i=this.currentStep;await this.executor.execute(e,t),!(this.destroyed||this.currentStep!==i)&&(this.completedSteps.add(this.currentStep),setTimeout(()=>{!this.destroyed&&this.currentStep===i&&this.next()},500))}handleChoice(e){var t,i;if(!(!this.guide||this.destroyed))switch((t=this.eventBuffer)==null||t.push(ze(this.config.siteId,"guide_step_choice",this.guide.id,this.currentStep,{choice_label:e.label,choice_action:e.action})),e.action){case"next":this.next();break;case"skip_to_step":{const r=e.target_step??this.currentStep+1;r<this.guide.steps.length?(this.cleanupTargetClick(),this.interactiveHandler.cancelActionValidator(),this.cancelRetry(),this.cancelTooltipDelay(),this.cancelLazyScan(),this.clearTransientTooltipEl(),this.currentStep=r,this.revealAttempted.delete(this.currentStep),(i=this.analyzer)==null||i.clearAllRevealAttempts(),this.saveSession(),this.renderStep()):this.complete();break}case"end_guide":this.complete();break}}expandToChoices(e){var i;this.tooltipRenderer.removeAll();const t=this.elementFinder.findTargetElement(e,((i=this.guide)==null?void 0:i.id)??"");this.tooltipRenderer.renderTooltip(e,t,this.buildTooltipOpts(e,t,!0))}saveSession(e,t=!1){if(!this.guide)return;const i=`guideai_active_${this.config.siteId}`,r=e??this.currentStep,s=this.guide.steps[r],o=t?"*":location.pathname,a={guide_id:this.guide.id,current_step_index:r,started_at:new Date().toISOString(),expected_url:(s==null?void 0:s.page_url_pattern)||o};try{sessionStorage.setItem(i,JSON.stringify(a))}catch{}}clearSession(){const e=`guideai_active_${this.config.siteId}`;sessionStorage.removeItem(e)}}function fo(n){let e=0;n.data_guideai&&(e+=40),n.data_testid&&(e+=38),n.aria_label&&(e+=36),n.name&&(e+=35),n.id&&(e+=35);const t=Math.min(e,40);let i=0;n.text_content&&(i+=30),n.placeholder&&(i+=28),n.label&&(i+=25);const r=Math.min(i,35);let s=0;n.tag&&n.tag!=="unknown"&&(s+=15),n.role&&(s+=20),n.css_path&&(s+=25);const o=Math.min(s,25);let a=0;n.parent_text&&(a+=10),n.form_context&&(a+=12),n.nearest_heading&&(a+=15),n.visual_zone&&(a+=8);const l=Math.min(a,15);let c=0;n.bounding_rect&&(c+=5),n.relative_position&&(c+=3);const d=Math.min(c,8);let u=0;n.style_hash&&(u+=12),n.style_vector&&n.style_vector.length>0&&(u+=15),n.canvas_hash&&(u+=18);const h=Math.min(u,20);return{tier1:t,tier2:r,tier3:o,tier4:l,tier5:d,tier6:h,total:t+r+o+l+d+h}}function Me(n,e){if(!n)return!0;try{if(n.type==="group"){const{op:t,children:i}=n;return!i||i.length===0?t!=="not":t==="and"?i.every(r=>Me(r,e)):t==="or"?i.some(r=>Me(r,e)):t==="not"?!Me(i[0],e):!1}return po(n,e)}catch{return!1}}function po(n,e){const t=mo(n.source,n.field,e);return bo(n.op,t,n.value)}function mo(n,e,t){switch(n){case"visitor":return t.visitor?t.visitor[e]:void 0;case"account":return t.account?t.account[e]:void 0;case"page":return t.page[e];case"session":return t.session[e];case"feature":return t.features?t.features[e]??!1:!1;default:return}}function bo(n,e,t){switch(n){case"is_set":return e!=null&&e!=="";case"is_not_set":return e==null||e==="";case"eq":return Pe(e,t);case"neq":return!Pe(e,t);case"contains":return H(e).includes(H(t));case"not_contains":return!H(e).includes(H(t));case"starts_with":return H(e).startsWith(H(t));case"ends_with":return H(e).endsWith(H(t));case"matches":try{return(t instanceof RegExp?t:new RegExp(H(t))).test(H(e))}catch{return!1}case"in":return Array.isArray(t)&&t.some(i=>Pe(e,i));case"not_in":return Array.isArray(t)&&!t.some(i=>Pe(e,i));case"gt":return F(e)>F(t);case"gte":return F(e)>=F(t);case"lt":return F(e)<F(t);case"lte":return F(e)<=F(t);default:return!1}}function Pe(n,e){return n===e?!0:n==null||e===void 0||e===null?!1:typeof n=="number"||typeof e=="number"?F(n)===F(e):H(n)===H(e)}function H(n){if(n==null)return"";if(typeof n=="string")return n;if(typeof n=="number"||typeof n=="boolean")return String(n);try{return JSON.stringify(n)??""}catch{return""}}function F(n){if(typeof n=="number")return n;if(typeof n=="string"){const e=Number(n);return Number.isFinite(e)?e:NaN}return typeof n=="boolean"?n?1:0:NaN}function yo(n){const e=n.now??Date.now();return{id:n.id,startedAt:n.startedAt,pageViews:n.pageViews,device:vo(n.userAgent),language:n.language,userAgent:n.userAgent,sessionAgeMs:Math.max(0,e-n.startedAt)}}function vo(n){const e=(n||"").toLowerCase();return/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(e)?"tablet":/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(e)?"mobile":"desktop"}function xo(n){const e=wo(n),t=ko(n),i=_o(n),r=Eo(n),s=So(n),o={data_guideai:e.data_guideai,data_testid:e.data_testid,aria_label:e.aria_label,name:e.name,id:e.id,text_content:t.text_content,placeholder:t.placeholder,label:t.label,tag:i.tag,role:i.role,css_path:i.css_path,parent_text:r.parent_text,form_context:r.form_context,nearest_heading:r.nearest_heading,bounding_rect:s.bounding_rect,relative_position:s.relative_position},a=fo(o);return{tier1_stable:{...e,score:a.tier1},tier2_text:{...t,score:a.tier2},tier3_structural:{...i,score:a.tier3},tier4_context:{...r,score:a.tier4},tier5_position:{...s,score:a.tier5},total_score:a.total}}function wo(n){return{data_guideai:n.getAttribute("data-guideai")??void 0,data_testid:n.getAttribute("data-testid")??void 0,aria_label:n.getAttribute("aria-label")??void 0,name:n.getAttribute("name")??void 0,id:n.id||void 0,score:0}}function ko(n){const e=Co(n)||void 0,t=n.getAttribute("placeholder")??void 0,i=To(n)??void 0,r=[];return e&&r.push(e),t&&r.push(t),i&&r.push(i),{text_content:e,placeholder:t,label:i,variants:r,score:0}}function _o(n){return{tag:n.tagName.toLowerCase(),role:n.getAttribute("role")??void 0,css_path:Ao(n),xpath:Lo(n),dom_depth:Io(n),score:0}}function Eo(n){return{parent_text:Mo(n),form_context:Po(n),nearest_heading:Ro(n),score:0}}function So(n){const e=n.getBoundingClientRect();return{bounding_rect:{x:Math.round(e.x),y:Math.round(e.y),width:Math.round(e.width),height:Math.round(e.height)},relative_position:Ho(e),score:0}}function Co(n){let e="";for(const t of n.childNodes)t.nodeType===Node.TEXT_NODE&&(e+=t.textContent??"");return e=e.trim(),e?e.length>200?e.slice(0,200):e:null}function To(n){if(!(n instanceof HTMLElement))return null;if(n.id){const t=document.querySelector(`label[for="${CSS.escape(n.id)}"]`);if(t!=null&&t.textContent)return t.textContent.trim().slice(0,200)}const e=n.closest("label");return e!=null&&e.textContent?e.textContent.trim().slice(0,200):null}function Ao(n){const e=[];let t=n;for(;t&&t!==document.documentElement;){let i=t.tagName.toLowerCase();if(t.id){i+=`#${CSS.escape(t.id)}`,e.unshift(i);break}const r=t.parentElement;if(r){const s=Array.from(r.children).filter(o=>o.tagName===t.tagName);if(s.length>1){const o=s.indexOf(t)+1;i+=`:nth-of-type(${o})`}}e.unshift(i),t=r}return e.join(" > ")}function Lo(n){const e=[];let t=n;for(;t&&t.nodeType===Node.ELEMENT_NODE;){let i=0,r=t.previousElementSibling;for(;r;)r.tagName===t.tagName&&i++,r=r.previousElementSibling;const s=t.tagName.toLowerCase();e.unshift(`${s}[${i+1}]`),t=t.parentElement}return"/"+e.join("/")}function Io(n){let e=0,t=n;for(;t.parentElement;)e++,t=t.parentElement;return e}function Mo(n){var s;const e=n.parentElement;if(!e)return;const t=e.cloneNode(!0),i=Array.from(t.children);for(const o of i)if(o.tagName===n.tagName){t.removeChild(o);break}return((s=t.textContent)==null?void 0:s.trim().slice(0,200))||void 0}function Po(n){const e=n.closest("form");if(e)return e.id?`form#${e.id}`:e.getAttribute("name")?`form[name="${e.getAttribute("name")}"]`:e.action?`form[action="${e.action}"]`:"form"}function Ro(n){var t,i,r;let e=n;for(;e;){let s=e.previousElementSibling;for(;s;){if(/^H[1-6]$/i.test(s.tagName))return((t=s.textContent)==null?void 0:t.trim().slice(0,200))||void 0;const o=s.querySelector("h1, h2, h3, h4, h5, h6");if(o)return((i=o.textContent)==null?void 0:i.trim().slice(0,200))||void 0;s=s.previousElementSibling}if(/^H[1-6]$/i.test(e.tagName))return((r=e.textContent)==null?void 0:r.trim().slice(0,200))||void 0;e=e.parentElement}}function Ho(n){const e=window.innerWidth,t=window.innerHeight,i=n.x+n.width/2,r=n.y+n.height/2,s=i<e*.33?"left":i>e*.66?"right":"center";return`${r<t*.33?"top":r>t*.66?"bottom":"middle"}-${s}`}let A=null,K=null;function No(){return A&&(K!=null&&K.contains(A))||(A=document.createElement("div"),A.className="guideai-picker-highlight",A.style.cssText=`
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    border: 2px solid #2563eb;
    border-radius: 3px;
    background: rgba(37, 99, 235, 0.06);
    transition: all 0.08s ease-out;
    display: none;
  `,K==null||K.appendChild(A)),A}function $o(n){K=n}function Do(n){const e=No(),t=n.getBoundingClientRect();e.style.top=`${t.top}px`,e.style.left=`${t.left}px`,e.style.width=`${t.width}px`,e.style.height=`${t.height}px`,e.style.display="block"}function ci(){A&&(A.style.display="none")}function Oo(){A&&A.parentNode&&A.parentNode.removeChild(A),A=null,K=null}const Bo="guideai-step-badge";let P=null,Y=null;function zo(){return P&&(Y!=null&&Y.contains(P))||(P=document.createElement("div"),P.className="guideai-badge-container",P.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 2147483647;
    pointer-events: none;
  `,Y==null||Y.appendChild(P)),P}function Fo(n){Y=n}function Go(n,e){const t=zo(),i=n.getBoundingClientRect(),r=document.createElement("div");r.className=Bo,r.textContent=String(e),r.style.cssText=`
    position: fixed;
    top: ${i.top-8}px;
    left: ${i.right-8}px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2563eb;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    user-select: none;
  `,t.appendChild(r)}function di(){P&&P.parentNode&&P.parentNode.removeChild(P),P=null}function qo(){di(),Y=null}let pe=!1,me=null,be=0,ye=null,ve=null;function ui(n){var t,i;const e=n.composedPath();for(const r of e)if(r instanceof Element&&(((t=r.tagName)==null?void 0:t.toLowerCase())==="guideai-shadow"||(i=r.classList)!=null&&i.contains("guideai-recorder")||r.shadowRoot))return!0;return!1}function hi(n){var t,i,r;if(ui(n))return;const e=document.elementFromPoint(n.clientX,n.clientY);e&&((t=e.classList)!=null&&t.contains("guideai-picker-highlight")||(i=e.classList)!=null&&i.contains("guideai-badge-container")||(r=e.closest)!=null&&r.call(e,".guideai-badge-container")||e!==me&&(me=e,Do(e)))}function gi(n){if(!pe||!me||ui(n))return;n.preventDefault(),n.stopPropagation(),n.stopImmediatePropagation();const e=me,t=xo(e),i=Wo(e),r=jo(e),s=Ko(e,be+1);be++,Go(e,be),ci();const o={title:s,instruction:`Interact with the ${e.tagName.toLowerCase()} element`,actionType:i,targetFingerprint:t,targetPreview:r,pageUrl:window.location.href,timestamp:new Date().toISOString()};ye==null||ye(o)}function fi(n){n.key==="Escape"&&(ie(),ve==null||ve())}function Uo(n,e,t,i){pe||(pe=!0,be=i??0,ye=e,ve=t??null,$o(n),Fo(n),document.addEventListener("mousemove",hi,!0),document.addEventListener("click",gi,!0),document.addEventListener("keydown",fi,!0),document.body.style.cursor="crosshair")}function ie(){pe&&(pe=!1,me=null,ye=null,ve=null,document.removeEventListener("mousemove",hi,!0),document.removeEventListener("click",gi,!0),document.removeEventListener("keydown",fi,!0),document.body.style.cursor="",ci(),Oo())}function at(){ie(),di(),qo()}function Vo(n){be=n}function Wo(n){const e=n.tagName.toLowerCase();if(e==="input"){const t=n.type.toLowerCase();return t==="submit"||t==="button"||t==="checkbox"||t==="radio"?"click":"fill"}return e==="textarea"?"fill":e==="select"?"select":e==="a"?"navigate":(e==="button"||n.getAttribute("role")==="button","click")}function jo(n){var o;const e=n.outerHTML;if(e.length<=200)return e;const t=n.tagName.toLowerCase(),i=Array.from(n.attributes).map(a=>`${a.name}="${a.value}"`).join(" "),r=i?`<${t} ${i}>`:`<${t}>`,s=((o=n.textContent)==null?void 0:o.trim().slice(0,80))??"";return`${r}${s}...</${t}>`}function Ko(n,e){var r;const t=n.tagName.toLowerCase(),i=n.getAttribute("aria-label")??n.getAttribute("placeholder")??n.getAttribute("title")??((r=n.textContent)==null?void 0:r.trim().slice(0,40))??"";return i?`${Yo(n)} "${i}"`:`Step ${e}: ${t} element`}function Yo(n){const e=n.tagName.toLowerCase();return e==="input"||e==="textarea"?"Fill in":e==="select"?"Select":e==="a"?"Navigate to":"Click"}class Xo{constructor(e){this.el=null,this.stepsEl=null,this.countEl=null,this.titleInput=null,this.callbacks=null,this.saveBtn=null,this.previewBtn=null,this.shadowRoot=e}render(e){var i,r,s,o;if(this.el)return;this.callbacks=e;const t=document.createElement("div");t.className="guideai-recorder",t.setAttribute("role","dialog"),t.setAttribute("aria-label","Guide Recorder"),t.innerHTML=`
      <div class="guideai-recorder-header">
        <div class="guideai-recorder-status">
          <span class="guideai-recorder-dot"></span>
          <span class="guideai-recorder-title">Guide Recorder</span>
        </div>
        <button class="guideai-recorder-close" aria-label="Cancel">&times;</button>
      </div>
      <div class="guideai-recorder-title-row">
        <input
          type="text"
          class="guideai-recorder-title-input"
          placeholder="Guide title..."
          value=""
        />
      </div>
      <div class="guideai-recorder-steps">
        <div class="guideai-recorder-empty">Click elements on the page to record steps</div>
      </div>
      <div class="guideai-recorder-footer">
        <span class="guideai-recorder-count">0 steps</span>
      </div>
      <div class="guideai-recorder-controls">
        <button class="guideai-recorder-btn guideai-recorder-cancel">Cancel</button>
        <button class="guideai-recorder-btn guideai-recorder-preview" disabled>Preview</button>
        <button class="guideai-recorder-btn guideai-recorder-save" disabled>Save Guide</button>
      </div>
    `,this.el=t,this.stepsEl=t.querySelector(".guideai-recorder-steps"),this.countEl=t.querySelector(".guideai-recorder-count"),this.titleInput=t.querySelector(".guideai-recorder-title-input"),this.saveBtn=t.querySelector(".guideai-recorder-save"),this.previewBtn=t.querySelector(".guideai-recorder-preview"),(i=t.querySelector(".guideai-recorder-close"))==null||i.addEventListener("click",()=>{var a;(a=this.callbacks)==null||a.onCancel()}),(r=t.querySelector(".guideai-recorder-cancel"))==null||r.addEventListener("click",()=>{var a;(a=this.callbacks)==null||a.onCancel()}),(s=this.previewBtn)==null||s.addEventListener("click",()=>{var a;(a=this.callbacks)==null||a.onPreview()}),(o=this.saveBtn)==null||o.addEventListener("click",()=>{var l,c,d;const a=((c=(l=this.titleInput)==null?void 0:l.value)==null?void 0:c.trim())||"Recorded Guide";(d=this.callbacks)==null||d.onSave(a)}),this.shadowRoot.appendChild(t)}updateSteps(e){if(!this.stepsEl)return;e.length===0?this.stepsEl.innerHTML='<div class="guideai-recorder-empty">Click elements on the page to record steps</div>':(this.stepsEl.innerHTML=e.map((i,r)=>`
          <div class="guideai-recorder-step" data-index="${r}">
            <span class="guideai-recorder-step-num">${r+1}</span>
            <span class="guideai-recorder-step-title">${M(i.title)}</span>
            <button class="guideai-recorder-step-del" data-index="${r}" aria-label="Delete step">&times;</button>
          </div>
        `).join(""),this.stepsEl.querySelectorAll(".guideai-recorder-step-del").forEach(i=>{i.addEventListener("click",r=>{var o;const s=parseInt(r.currentTarget.getAttribute("data-index")||"0",10);(o=this.callbacks)==null||o.onDeleteStep(s)})})),this.countEl&&(this.countEl.textContent=`${e.length} step${e.length!==1?"s":""}`);const t=e.length>0;this.saveBtn&&(this.saveBtn.disabled=!t),this.previewBtn&&(this.previewBtn.disabled=!t)}showSaving(){this.saveBtn&&(this.saveBtn.textContent="Saving...",this.saveBtn.disabled=!0)}showSaved(){this.saveBtn&&(this.saveBtn.textContent="Saved!",this.saveBtn.disabled=!0),setTimeout(()=>this.destroy(),1500)}showError(e){this.saveBtn&&(this.saveBtn.textContent="Save Guide",this.saveBtn.disabled=!1),typeof console<"u"&&console.warn("[GuideAI] Recorder error:",e)}destroy(){this.el&&this.el.parentNode&&this.el.parentNode.removeChild(this.el),this.el=null,this.stepsEl=null,this.countEl=null,this.titleInput=null,this.saveBtn=null,this.previewBtn=null,this.callbacks=null}}const lt=n=>`guideai_recorder_${n}`;class Jo{constructor(e,t,i,r){this.panel=null,this.steps=[],this.recording=!1,this.startedAt="",this.config=e,this.api=t,this.eventBuffer=i,this.shadowRoot=r,this.restoreState()}startRecording(){var e;this.recording||(this.recording=!0,this.startedAt=new Date().toISOString(),this.panel=new Xo(this.shadowRoot),this.panel.render({onSave:t=>this.saveGuide(t),onCancel:()=>this.cancelRecording(),onPreview:()=>this.previewGuide(),onDeleteStep:t=>this.deleteStep(t)}),this.panel.updateSteps(this.steps),Uo(this.shadowRoot,t=>this.onStepCaptured(t),()=>this.cancelRecording(),this.steps.length),this.persistState(),(e=this.eventBuffer)==null||e.push(_(this.config.siteId,"guide_recording_started")))}stopRecording(){return this.recording?(this.recording=!1,ie(),[...this.steps]):this.steps}cancelRecording(){var e;this.recording=!1,this.steps=[],ie(),at(),(e=this.panel)==null||e.destroy(),this.panel=null,this.clearState()}deleteStep(e){var t;e<0||e>=this.steps.length||(this.steps.splice(e,1),(t=this.panel)==null||t.updateSteps(this.steps),this.persistState())}getSteps(){return[...this.steps]}getStepCount(){return this.steps.length}isRecording(){return this.recording}previewGuide(){if(this.steps.length===0)return;this.recording&&ie();const t=this.buildGuide("Preview Guide");new ot(this.config,this.eventBuffer,this.shadowRoot).start(t)}async saveGuide(e,t){var r,s,o,a;if(this.steps.length===0)throw new Error("No steps recorded");(r=this.panel)==null||r.showSaving();const i={title:e||"Recorded Guide",description:t||void 0,steps:this.steps.map((l,c)=>({ordinal:c,step_type:"tooltip",target_selector:null,target_fingerprint:l.targetFingerprint,content:{title:l.title,body:l.instruction},action_config:{action_type:l.actionType,sensitive:!1,requires_confirmation:!1},page_url_pattern:l.pageUrl}))};try{const l=await this.api.post("/api/v1/guides/record",i);return(s=this.panel)==null||s.showSaved(),(o=this.eventBuffer)==null||o.push(_(this.config.siteId,"guide_recording_saved",{guide_id:l.id,step_count:this.steps.length})),this.recording=!1,this.steps=[],ie(),at(),this.clearState(),{guideId:l.id}}catch(l){const c=l instanceof Error?l.message:"Failed to save guide";throw(a=this.panel)==null||a.showError(c),l}}destroy(){var e;this.recording=!1,ie(),at(),(e=this.panel)==null||e.destroy(),this.panel=null}onStepCaptured(e){var t;this.steps.push(e),(t=this.panel)==null||t.updateSteps(this.steps),this.persistState()}buildGuide(e){return{id:`recorder_${Date.now()}`,site_id:this.config.siteId,title:e,status:"draft",trigger_type:"manual",trigger_config:{},steps:this.steps.map((t,i)=>({id:`step_${i}`,guide_id:`recorder_${Date.now()}`,ordinal:i,step_type:"tooltip",target_selector:void 0,target_fingerprint:t.targetFingerprint,content:{title:t.title,body:t.instruction},action_config:{action_type:t.actionType,sensitive:!1,requires_confirmation:!1},page_url_pattern:t.pageUrl})),tags:["sdk-recorded"],version:1,created_at:this.startedAt,updated_at:new Date().toISOString()}}persistState(){try{const e={isRecording:this.recording,steps:this.steps,startedAt:this.startedAt};sessionStorage.setItem(lt(this.config.siteId),JSON.stringify(e))}catch{}}restoreState(){try{const e=sessionStorage.getItem(lt(this.config.siteId));if(!e)return;const t=JSON.parse(e);t.isRecording&&t.steps.length>0&&(this.steps=t.steps,this.startedAt=t.startedAt,Vo(this.steps.length))}catch{}}clearState(){try{sessionStorage.removeItem(lt(this.config.siteId))}catch{}}}const pi=n=>`guideai_feedback_prompt_shown_${n}`;function ct(n){try{return sessionStorage.getItem(pi(n))==="true"}catch{return!1}}function Qo(n){try{sessionStorage.setItem(pi(n),"true")}catch{}}class Zo{constructor(e,t,i){this.el=null,this.escHandler=null,this.dismissTimer=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i}show(e,t,i={}){if(this.el||ct(this.config.siteId))return;const r=i.prompt??(e?"Was this guide helpful?":"How is this experience so far?"),s=e?"Guide feedback":"Experience feedback",o=e?"Any additional feedback? (optional)":"Tell us what is working or getting in the way (optional)",a=document.createElement("div");a.className="guideai-feedback",a.setAttribute("role","dialog"),a.setAttribute("aria-label",s),a.innerHTML=`
      <div class="guideai-feedback-card">
        <p class="guideai-feedback-prompt">${r}</p>
        <div class="guideai-feedback-thumbs">
          <button class="guideai-feedback-thumb" data-value="up" aria-label="Thumbs up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
            </svg>
          </button>
          <button class="guideai-feedback-thumb" data-value="down" aria-label="Thumbs down">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
              <path d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3"/>
            </svg>
          </button>
        </div>
        <div class="guideai-feedback-comment-area" style="display:none;">
          <textarea class="guideai-feedback-textarea" placeholder="${o}" rows="2" maxlength="500"></textarea>
          <button class="guideai-feedback-submit">Submit</button>
        </div>
      </div>
    `,a.style.position="fixed",a.style.bottom="100px",a.style.zIndex="2147483646",this.config.bubblePosition==="bottom-left"?a.style.left="20px":a.style.right="20px",this.shadowRoot.appendChild(a),this.el=a,Qo(this.config.siteId);const l=a.querySelectorAll(".guideai-feedback-thumb");l.forEach(d=>{d.addEventListener("click",()=>{const u=d.getAttribute("data-value");l.forEach(p=>p.classList.remove("guideai-feedback-thumb--selected")),d.classList.add("guideai-feedback-thumb--selected");const h=a.querySelector(".guideai-feedback-comment-area");h&&(h.style.display="block"),a.setAttribute("data-thumbs",u)})});const c=a.querySelector(".guideai-feedback-submit");c==null||c.addEventListener("click",()=>{var p;const d=a.getAttribute("data-thumbs"),u=a.querySelector(".guideai-feedback-textarea"),h=((p=u==null?void 0:u.value)==null?void 0:p.trim())||"";d&&this.submitFeedback(e,t,d,h,i),this.remove()}),this.escHandler=d=>{d.key==="Escape"&&this.remove()},document.addEventListener("keydown",this.escHandler),this.dismissTimer=setTimeout(()=>this.remove(),3e4)}submitFeedback(e,t,i,r,s){var a;const o=_(this.config.siteId,"feedback_submitted",{thumbs:i,comment:r||void 0,guide_title:t,trigger_context:s.triggerContext||void 0,feedback_title:s.title||void 0,feedback_prompt:s.prompt||void 0});e&&(o.guide_id=e),o.element_text=r||void 0,(a=this.eventBuffer)==null||a.push(o)}remove(){this.dismissTimer&&(clearTimeout(this.dismissTimer),this.dismissTimer=null),this.escHandler&&(document.removeEventListener("keydown",this.escHandler),this.escHandler=null),this.el&&(this.el.remove(),this.el=null)}destroy(){this.remove()}}class ea{constructor(e,t,i){this.el=null,this.dismissTimer=null,this.config=e,this.eventBuffer=t,this.shadowRoot=i}showNPS(e){this.renderSurvey("nps",e)}showCSAT(e){this.renderSurvey("csat",e)}renderSurvey(e,t){if(this.el)return;const i=document.createElement("div");i.className="guideai-survey",i.setAttribute("role","dialog"),i.setAttribute("aria-label",e==="nps"?"Net Promoter Score survey":"Customer satisfaction survey"),e==="nps"?i.innerHTML=this.buildNPSHTML():i.innerHTML=this.buildCSATHTML(),i.style.position="fixed",i.style.bottom="20px",i.style.zIndex="2147483646",this.config.bubblePosition==="bottom-left"?i.style.left="20px":i.style.right="20px",this.shadowRoot.appendChild(i),this.el=i;const r=i.querySelectorAll("[data-score]");r.forEach(a=>{a.addEventListener("click",()=>{const l=parseInt(a.getAttribute("data-score")||"0",10);r.forEach(d=>d.classList.remove("guideai-survey-score--selected")),a.classList.add("guideai-survey-score--selected"),e==="csat"&&r.forEach(d=>{parseInt(d.getAttribute("data-score")||"0",10)<=l&&d.classList.add("guideai-survey-score--selected")}),i.setAttribute("data-selected-score",String(l));const c=i.querySelector(".guideai-survey-comment");c&&(c.style.display="block")})});const s=i.querySelector(".guideai-survey-submit");s==null||s.addEventListener("click",()=>{var d;const a=parseInt(i.getAttribute("data-selected-score")||"0",10),l=i.querySelector(".guideai-survey-textarea"),c=((d=l==null?void 0:l.value)==null?void 0:d.trim())||"";this.submitSurvey(e,a,c,t),this.remove()});const o=i.querySelector(".guideai-survey-dismiss");o==null||o.addEventListener("click",()=>this.remove()),this.dismissTimer=setTimeout(()=>this.remove(),6e4)}buildNPSHTML(){return`
      <div class="guideai-survey-card">
        <button class="guideai-survey-dismiss" aria-label="Dismiss">&times;</button>
        <p class="guideai-survey-prompt">How likely are you to recommend us?</p>
        <div class="guideai-survey-nps-scale">
          ${Array.from({length:11},(t,i)=>`<button class="guideai-survey-score guideai-survey-nps-btn" data-score="${i}">${i}</button>`).join("")}
        </div>
        <div class="guideai-survey-labels">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
        <div class="guideai-survey-comment" style="display:none;">
          <textarea class="guideai-survey-textarea" placeholder="Tell us more (optional)" rows="2" maxlength="500"></textarea>
          <button class="guideai-survey-submit">Submit</button>
        </div>
      </div>
    `}buildCSATHTML(){return`
      <div class="guideai-survey-card">
        <button class="guideai-survey-dismiss" aria-label="Dismiss">&times;</button>
        <p class="guideai-survey-prompt">How satisfied are you with your experience?</p>
        <div class="guideai-survey-stars">
          ${Array.from({length:5},(t,i)=>`<button class="guideai-survey-score guideai-survey-star" data-score="${i+1}" aria-label="${i+1} star">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>`).join("")}
        </div>
        <div class="guideai-survey-comment" style="display:none;">
          <textarea class="guideai-survey-textarea" placeholder="Tell us more (optional)" rows="2" maxlength="500"></textarea>
          <button class="guideai-survey-submit">Submit</button>
        </div>
      </div>
    `}submitSurvey(e,t,i,r){var o;const s=_(this.config.siteId,"survey_response",{survey_type:e,score:t,comment:i||void 0,trigger_context:r||void 0});s.element_text=i||void 0,(o=this.eventBuffer)==null||o.push(s)}remove(){this.dismissTimer&&(clearTimeout(this.dismissTimer),this.dismissTimer=null),this.el&&(this.el.remove(),this.el=null)}destroy(){this.remove()}}const ta=n=>`guideai_guides_completed_${n}`,ia=n=>`guideai_survey_shown_${n}`;class ra{constructor(e,t,i=3){this.siteId=e,this.renderer=t,this.triggerAfterGuides=i}onGuideCompleted(){try{const e=ta(this.siteId),t=parseInt(sessionStorage.getItem(e)||"0",10)+1;sessionStorage.setItem(e,String(t));const i=ia(this.siteId);if(sessionStorage.getItem(i))return;if(t>=this.triggerAfterGuides){const r=t===this.triggerAfterGuides?"nps":"csat";setTimeout(()=>{r==="nps"?this.renderer.showNPS("after_guide_completion"):this.renderer.showCSAT("after_guide_completion"),sessionStorage.setItem(i,"true")},2e3)}}catch{}}}const mi=n=>`guideai_usage_feedback_pageviews_${n}`;class na{constructor(e,t,i={}){this.timer=null,this.siteId=e,this.renderer=t,this.minPageViews=Math.max(1,i.minPageViews??2),this.delayMs=Math.max(1e3,i.delayMs??3e4)}onPageView(){ct(this.siteId)||this.incrementPageViews()<this.minPageViews||(this.timer&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null,!ct(this.siteId)&&this.renderer.show(void 0,void 0,{prompt:"How is this experience so far?",title:document.title||void 0,triggerContext:"product_usage"})},this.delayMs))}destroy(){this.timer&&(clearTimeout(this.timer),this.timer=null)}incrementPageViews(){try{const t=(parseInt(sessionStorage.getItem(mi(this.siteId))||"0",10)||0)+1;return sessionStorage.setItem(mi(this.siteId),String(t)),t}catch{return this.minPageViews}}}function sa(){return`
/* ============================================================
   GuideAI SDK Styles — Shadow DOM scoped
   ============================================================ */

:host {
  all: initial;
}

*, *::before, *::after {
  box-sizing: border-box;
}

/* ---- CSS Custom Properties (theming) ---- */
:host {
  --guide-primary: #3b82f6;
  --guide-primary-hover: #2563eb;
  --guide-bg: #ffffff;
  --guide-text: #1a1a2e;
  --guide-text-secondary: #4b5563;
  --guide-text-muted: #9ca3af;
  --guide-border: rgba(0, 0, 0, 0.08);
  --guide-surface: #f3f4f6;
  --guide-surface-hover: #e5e7eb;
  --guide-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --guide-danger: #ef4444;
  --guide-success: #059669;
}

/* ---- Bubble (animated mascot FAB) ---- */

/* Eye blink — double-blink with a long pause */
@keyframes guideai-blink {
  0%, 100% { transform: scaleY(1); }
  46% { transform: scaleY(1); }
  48% { transform: scaleY(0.05); }
  50% { transform: scaleY(1); }
  52% { transform: scaleY(0.05); }
  54% { transform: scaleY(1); }
}

/* Gentle breathing — icon bobs up and down */
@keyframes guideai-breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.5px); }
}

/* Excited wiggle on hover */
@keyframes guideai-wiggle {
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(-6deg); }
  30% { transform: rotate(5deg); }
  45% { transform: rotate(-4deg); }
  60% { transform: rotate(3deg); }
  75% { transform: rotate(-1deg); }
}

/* Soft float for the whole bubble */
@keyframes guideai-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes guideai-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes guideai-nudge-in {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.guideai-bubble {
  position: fixed;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px 12px 14px;
  border-radius: 28px;
  background: rgba(59, 130, 246, 0.18);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  color: var(--guide-primary);
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(59, 130, 246, 0.2), 0 1px 6px rgba(0, 0, 0, 0.08);
  border: 1.5px solid rgba(59, 130, 246, 0.3);
  outline: none;
  font-family: var(--guide-font);
  user-select: none;
  pointer-events: auto;
  z-index: 2147483646;
  transition: box-shadow 300ms ease, background 300ms ease, border-color 300ms ease;
  animation: guideai-float 4s ease-in-out infinite;
}

.guideai-bubble:hover {
  background: rgba(59, 130, 246, 0.28);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.35), 0 2px 10px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
  animation: none;
}

.guideai-bubble:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}

.guideai-bubble--pressing {
  scale: 0.93;
}

.guideai-bubble-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  animation: guideai-breathe 3s ease-in-out infinite;
}

.guideai-bubble:hover .guideai-bubble-icon {
  animation: guideai-wiggle 0.6s ease-in-out;
}

.guideai-bubble-icon svg {
  width: 36px;
  height: 36px;
}

/* Custom GIF/image (overrides SVG mascot) */
.guideai-bubble-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  pointer-events: none;
}

/* Eyes: double-blink every 6 seconds */
.guideai-eye {
  transform-origin: center;
  animation: guideai-blink 6s ease-in-out infinite;
}

/* Stagger left vs right eye slightly */
.guideai-eye:nth-child(2) {
  animation-delay: 0.08s;
}

.guideai-bubble-label {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1;
  color: var(--guide-primary);
  letter-spacing: 0.3px;
}

.guideai-bubble-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--guide-danger);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  pointer-events: none;
}

/* Fixed bubble — no drift, pinned to corner */
.guideai-bubble--fixed {
  animation: none;
}

/* Support-only mode — green accent */
.guideai-bubble--support {
  background: rgba(5, 150, 105, 0.18);
  border-color: rgba(5, 150, 105, 0.3);
  box-shadow: 0 4px 24px rgba(5, 150, 105, 0.2), 0 1px 6px rgba(0, 0, 0, 0.08);
  color: #059669;
}

.guideai-bubble--support:hover {
  background: rgba(5, 150, 105, 0.28);
  box-shadow: 0 8px 32px rgba(5, 150, 105, 0.35), 0 2px 10px rgba(0, 0, 0, 0.1);
  border-color: rgba(5, 150, 105, 0.5);
}

.guideai-bubble--support .guideai-bubble-label {
  color: #059669;
}

/* Combined mode — blue/green gradient border */
.guideai-bubble--combined {
  border-color: rgba(59, 130, 246, 0.35);
}

.guideai-bubble--pulsing::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 22px;
  border: 2px solid var(--guide-primary);
  animation: guideai-pulse 1.5s ease-out infinite;
  pointer-events: none;
}

/* ---- Nudge tooltip (speech bubble above robot) ---- */

.guideai-nudge-tooltip {
  position: fixed;
  pointer-events: auto;
  z-index: 2147483646;
  max-width: 240px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--guide-bg);
  color: var(--guide-text);
  font-family: var(--guide-font);
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--guide-border);
  animation: guideai-nudge-in 250ms ease;
}

.guideai-nudge-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  margin-left: -6px;
  width: 12px;
  height: 12px;
  background: var(--guide-bg);
  border-right: 1px solid var(--guide-border);
  border-bottom: 1px solid var(--guide-border);
  transform: rotate(45deg);
}

/* ---- Crawl mode mascot ---- */

/* Walk cycle — legs alternate */
@keyframes guideai-walk {
  0%   { transform: rotate(-15deg); }
  50%  { transform: rotate(15deg); }
  100% { transform: rotate(-15deg); }
}

/* Body bob while walking */
@keyframes guideai-walk-bob {
  0%, 100% { transform: translateY(0); }
  25%      { transform: translateY(-2px); }
  75%      { transform: translateY(-2px); }
}

/* Corner arrival — mascot looks around */
@keyframes guideai-crawl-look {
  0%, 100% { transform: rotate(0deg); }
  30%      { transform: rotate(-12deg); }
  70%      { transform: rotate(10deg); }
}

/* Speech bubble entrance */
@keyframes guideai-speech-in {
  0%   { opacity: 0; transform: scale(0.85) translateY(4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Message text crossfade */
@keyframes guideai-speech-change {
  0%   { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}

.guideai-crawl-mascot {
  position: fixed;
  z-index: 2147483646;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  outline: none;
  transition: opacity 300ms ease;
}

.guideai-crawl-mascot:focus-visible {
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}

.guideai-crawl-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  height: 56px;
  color: var(--guide-primary);
}

.guideai-crawl-inner svg {
  width: 48px;
  height: 56px;
}

.guideai-crawl-body {
  animation: guideai-walk-bob 0.4s ease-in-out infinite;
}

.guideai-crawl-leg-left {
  transform-origin: 50% 0%;
  animation: guideai-walk 0.4s ease-in-out infinite;
}

.guideai-crawl-leg-right {
  transform-origin: 50% 0%;
  animation: guideai-walk 0.4s ease-in-out infinite;
  animation-delay: 0.2s;
}

/* Eyes blink in crawl mode too */
.guideai-crawl-mascot .guideai-eye {
  transform-origin: center;
  animation: guideai-blink 6s ease-in-out infinite;
}

.guideai-crawl-mascot .guideai-eye:nth-child(2) {
  animation-delay: 0.08s;
}

/* Paused state — hover or corner stop */
.guideai-crawl-mascot--paused .guideai-crawl-body,
.guideai-crawl-mascot--paused .guideai-crawl-leg-left,
.guideai-crawl-mascot--paused .guideai-crawl-leg-right {
  animation-play-state: paused;
}

/* Corner look-around */
.guideai-crawl-mascot--looking .guideai-crawl-inner {
  animation: guideai-crawl-look 1s ease-in-out;
}

/* Hover: pause walk, wiggle body */
.guideai-crawl-mascot:hover .guideai-crawl-body {
  animation: guideai-wiggle 0.6s ease-in-out;
}

.guideai-crawl-mascot:hover .guideai-crawl-leg-left,
.guideai-crawl-mascot:hover .guideai-crawl-leg-right {
  animation-play-state: paused;
}

/* ---- Crawl speech bubble ---- */

.guideai-crawl-speech {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
  max-width: 200px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--guide-bg);
  color: var(--guide-text);
  font-family: var(--guide-font);
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--guide-border);
  animation: guideai-speech-in 250ms ease;
  white-space: normal;
  word-wrap: break-word;
}

.guideai-crawl-speech::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--guide-bg);
  border-right: 1px solid var(--guide-border);
  border-bottom: 1px solid var(--guide-border);
}

/* Tail when mascot is on bottom edge — tail points down */
.guideai-crawl-speech--bottom::after {
  bottom: -6px;
  left: 20px;
  transform: rotate(45deg);
}

/* Tail when mascot is on right edge — tail points right */
.guideai-crawl-speech--right::after {
  right: -6px;
  top: 12px;
  transform: rotate(-45deg);
}

/* Tail when mascot is on top edge — tail points up */
.guideai-crawl-speech--top::after {
  top: -6px;
  left: 20px;
  transform: rotate(-135deg);
}

/* Tail when mascot is on left edge — tail points left */
.guideai-crawl-speech--left::after {
  left: -6px;
  top: 12px;
  transform: rotate(135deg);
}

.guideai-crawl-speech-text {
  animation: guideai-speech-change 300ms ease;
}

/* ---- Chip (pill-shaped floating trigger) ---- */

.guideai-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--guide-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  font-family: var(--guide-font);
  font-size: 13px;
  font-weight: 500;
  color: var(--guide-text);
  line-height: 1.3;
  white-space: nowrap;
  user-select: none;
  transition: box-shadow 150ms ease, transform 150ms ease;
  max-width: 280px;
  pointer-events: auto;
}

.guideai-chip:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.guideai-chip:focus-visible {
  outline: 2px solid var(--guide-primary);
  outline-offset: 2px;
}

.guideai-chip-emoji {
  font-size: 15px;
  flex-shrink: 0;
}

.guideai-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.guideai-chip-dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  padding: 0;
  margin-left: 2px;
  flex-shrink: 0;
  transition: background 150ms ease;
}

.guideai-chip-dismiss:hover {
  background: rgba(0, 0, 0, 0.12);
  color: #333;
}

/* ---- Suggestion overlay container ---- */

.guideai-suggestion-overlay {
  position: fixed;
  pointer-events: auto;
  z-index: 2147483646;
}

.guideai-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ---- Tooltip (guide step card) ---- */

.guideai-tooltip {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.08);
  font-family: var(--guide-font);
  font-size: 13px;
  color: #0f172a;
  overflow: hidden;
  max-width: 280px;
  min-width: 220px;
  pointer-events: auto;
}

.guideai-tooltip-content {
  padding: 12px 14px 14px;
}

.guideai-tooltip-progress {
  height: 3px;
  background: #e5e7eb;
  width: 100%;
}

.guideai-tooltip-progress-bar {
  height: 100%;
  background: var(--guide-primary);
  border-radius: 0 2px 2px 0;
  transition: width 300ms ease;
}

.guideai-tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.guideai-tooltip-step {
  font-size: 11px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.guideai-tooltip-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--guide-text-muted);
  padding: 0;
  border-radius: 4px;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-tooltip-close:hover {
  color: #374151;
  background: rgba(15, 23, 42, 0.06);
}

.guideai-tooltip-title {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 800;
  color: #000000;
  line-height: 1.4;
}

.guideai-tooltip-body {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.84);
  line-height: 1.5;
}

.guideai-tooltip-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--guide-primary);
  font-weight: 600;
  font-style: italic;
}

.guideai-tooltip-hint--interactive {
  display: flex;
  align-items: center;
  gap: 6px;
  font-style: normal;
  color: var(--guide-primary);
}

.guideai-tooltip-hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--guide-primary);
  animation: guideai-pulse 1.5s ease-in-out infinite;
}

@keyframes guideai-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.guideai-tooltip-hint--completed {
  color: #16a34a;
  font-style: normal;
}

.guideai-tooltip-check {
  color: #16a34a;
  font-weight: bold;
  font-size: 14px;
}

.guideai-tooltip-btn--skip-ahead {
  font-size: 12px;
  margin-left: auto;
}

.guideai-tooltip-choices-label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--guide-text-primary);
}

.guideai-tooltip-choices {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guideai-tooltip-choice {
  padding: 8px 14px;
  border: 1px solid var(--guide-primary);
  border-radius: 8px;
  background: transparent;
  color: var(--guide-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 150ms ease, color 150ms ease;
}

.guideai-tooltip-choice:hover {
  background: var(--guide-primary);
  color: #fff;
}

.guideai-tooltip-media {
  width: calc(100% - 24px);
  margin: 10px 12px 0;
  border-radius: 8px;
  max-height: 200px;
  object-fit: cover;
}

.guideai-tooltip-nav {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.guideai-tooltip-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.guideai-tooltip-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: background 150ms ease, color 150ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.guideai-tooltip-btn svg {
  width: 16px;
  height: 16px;
}

.guideai-tooltip-next {
  background: var(--guide-primary);
  color: #ffffff;
}

.guideai-tooltip-next:hover {
  background: var(--guide-primary-hover);
}

.guideai-tooltip-back {
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.9);
}

.guideai-tooltip-back:hover {
  background: rgba(15, 23, 42, 0.12);
}

.guideai-tooltip-doit {
  background: #ecfdf5;
  color: var(--guide-success);
  border: 1px solid #a7f3d0;
}

.guideai-tooltip-doit:hover {
  background: #d1fae5;
}

.guideai-tooltip-skip {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0 16px 12px;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--guide-text-muted);
  cursor: pointer;
  transition: color 150ms ease;
}

.guideai-tooltip-skip:hover {
  color: #6b7280;
}

.guideai-tooltip-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ffffff;
  transform: rotate(45deg);
  border-left: 1px solid rgba(15, 23, 42, 0.12);
  border-top: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: -2px -2px 8px rgba(15, 23, 42, 0.06);
}

.guideai-tooltip-arrow[data-placement="top"] {
  top: -6px;
  left: 50%;
  margin-left: -6px;
}

.guideai-tooltip-arrow[data-placement="bottom"] {
  bottom: -6px;
  left: 50%;
  margin-left: -6px;
  border-left: none;
  border-top: none;
  border-right: 1px solid rgba(15, 23, 42, 0.12);
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 2px 2px 8px rgba(15, 23, 42, 0.06);
}

.guideai-tooltip-arrow[data-placement="none"] {
  display: none;
}

/* ---- Highlight ring (target element) ---- */

.guideai-highlight {
  border: 2px solid var(--guide-primary);
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.06);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  transition: all 200ms ease;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .guideai-highlight--pulse {
    animation: none !important;
  }
}

/* ---- Overlay (backdrop during guide) ---- */

.guideai-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2147483644;
  pointer-events: none;
}

/* ---- Mini Bar (compact bottom-right bar for interactive steps) ---- */

@keyframes guideai-minibar-pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}

@keyframes guideai-minibar-check-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.guideai-minibar {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--guide-bg);
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
  font-family: var(--guide-font);
  font-size: 13px;
  color: var(--guide-text);
  overflow: hidden;
  min-width: 240px;
  max-width: 360px;
  pointer-events: auto;
  z-index: 2147483647;
  border: 1px solid var(--guide-border);
  transition: background 300ms ease, border-color 300ms ease, box-shadow 300ms ease;
}

.guideai-minibar-progress {
  height: 3px;
  background: #e5e7eb;
  width: 100%;
}

.guideai-minibar-progress-bar {
  height: 100%;
  background: var(--guide-primary);
  border-radius: 0 2px 2px 0;
  transition: width 300ms ease;
}

.guideai-minibar-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.guideai-minibar-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--guide-primary);
  flex-shrink: 0;
  animation: guideai-minibar-pulse 1.5s ease-in-out infinite;
  transition: background 300ms ease;
}

.guideai-minibar-dot--done {
  background: #16a34a;
  animation: guideai-minibar-check-pop 300ms ease forwards;
}

.guideai-minibar-text {
  flex: 1;
  font-weight: 600;
  color: var(--guide-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 300ms ease;
}

.guideai-minibar-skip {
  padding: 4px 12px;
  border-radius: 8px;
  background: var(--guide-surface);
  color: var(--guide-text-muted);
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms ease, color 150ms ease;
}

.guideai-minibar-skip:hover {
  background: var(--guide-surface-hover);
  color: var(--guide-text);
}

.guideai-minibar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--guide-text-muted);
  border-radius: 4px;
  padding: 0;
  flex-shrink: 0;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-minibar-close:hover {
  color: var(--guide-text);
  background: var(--guide-surface);
}

.guideai-minibar-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: var(--guide-surface);
  cursor: pointer;
  font-size: 14px;
  color: var(--guide-text-muted);
  border-radius: 6px;
  padding: 0;
  flex-shrink: 0;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-minibar-back:hover {
  color: var(--guide-text);
  background: var(--guide-surface-hover);
}

/* ---- Paused state ---- */

.guideai-minibar--paused {
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 6px 24px rgba(245, 158, 11, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.guideai-minibar-dot--paused {
  background: #f59e0b;
  animation: none;
}

.guideai-minibar--paused .guideai-minibar-text {
  color: #92400e;
}

.guideai-minibar-resume {
  padding: 4px 14px;
  border-radius: 8px;
  background: var(--guide-primary);
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms ease;
  font-family: var(--guide-font);
}

.guideai-minibar-resume:hover {
  background: var(--guide-primary-hover);
}

/* ---- Stuck detection phases ---- */

/* Pulsing highlight for stuck detection */
@keyframes guideai-highlight-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.12); }
  50% { box-shadow: 0 0 0 8px rgba(59,130,246,0.25), 0 0 20px rgba(59,130,246,0.15); }
}

.guideai-highlight--pulse {
  animation: guideai-highlight-pulse 1.5s ease-in-out infinite;
}

/* Mini bar hint text (shown during stuck 'hint' phase) */
.guideai-minibar-hint {
  font-size: 11px;
  color: var(--guide-primary);
  display: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guideai-minibar--stuck-hint .guideai-minibar-hint {
  display: block;
}

.guideai-minibar--stuck-hint .guideai-minibar-text {
  font-size: 12px;
}

/* Pulse phase — subtle dot animation change */
.guideai-minibar--stuck-pulse .guideai-minibar-dot {
  background: #f59e0b;
}

/* Mini bar "Do It For Me" offer (shown during stuck 'offer_help' phase) */
.guideai-minibar-doit-offer {
  padding: 4px 12px;
  border-radius: 8px;
  background: #ecfdf5;
  color: var(--guide-success);
  border: 1px solid #a7f3d0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  display: none;
  transition: background 150ms ease;
  font-family: var(--guide-font);
}

.guideai-minibar-doit-offer:hover {
  background: #d1fae5;
}

.guideai-minibar--stuck-offer .guideai-minibar-doit-offer {
  display: block;
}

.guideai-minibar--stuck-offer .guideai-minibar-skip {
  display: none;
}

/* Completion state — green accent */
.guideai-minibar--completed {
  border-color: rgba(22, 163, 74, 0.3);
  box-shadow: 0 6px 24px rgba(22, 163, 74, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.guideai-minibar--completed .guideai-minibar-progress-bar {
  background: #16a34a;
}

.guideai-minibar--completed .guideai-minibar-text {
  color: #16a34a;
}

/* Choices actions area within tooltip */
.guideai-tooltip-actions--choices {
  flex-direction: column;
  gap: 6px;
}

/* ---- Confirmation dialog ---- */

.guideai-confirm-dialog {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.guideai-confirm-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.guideai-confirm-content {
  position: relative;
  background: var(--guide-bg);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: calc(100% - 32px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
  font-family: var(--guide-font);
}

.guideai-confirm-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.guideai-confirm-message {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--guide-text-secondary);
  line-height: 1.6;
}

.guideai-confirm-warning {
  margin: 0 0 16px;
  font-size: 13px;
  color: #dc2626;
  font-weight: 500;
}

.guideai-confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.guideai-confirm-cancel {
  padding: 8px 20px;
  border-radius: 8px;
  background: var(--guide-surface);
  color: #374151;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease;
}

.guideai-confirm-cancel:hover {
  background: var(--guide-surface-hover);
}

.guideai-confirm-proceed {
  padding: 8px 20px;
  border-radius: 8px;
  background: #dc2626;
  color: #ffffff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}

.guideai-confirm-proceed:hover {
  background: #b91c1c;
}

/* ---- Announcement modal ---- */

.guideai-announcement {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.guideai-announcement-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.guideai-announcement-card {
  position: relative;
  background: var(--guide-bg);
  border-radius: 16px;
  padding: 28px;
  max-width: 440px;
  width: calc(100% - 32px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
  font-family: var(--guide-font);
}

.guideai-announcement-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--guide-text-muted);
  border-radius: 6px;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-announcement-close:hover {
  color: #374151;
  background: var(--guide-surface);
}

.guideai-announcement-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.guideai-announcement-message {
  margin: 0 0 20px;
  font-size: 15px;
  color: var(--guide-text-secondary);
  line-height: 1.6;
}

.guideai-announcement-cta {
  display: block;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: var(--guide-primary);
  color: #ffffff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}

.guideai-announcement-cta:hover {
  background: var(--guide-primary-hover);
}

/* ---- Resource Center (slide-up panel) ---- */

.guideai-rc {
  width: 360px;
  max-height: 480px;
  background: var(--guide-bg);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.14), 0 4px 16px rgba(0, 0, 0, 0.08);
  font-family: var(--guide-font);
  font-size: 14px;
  color: var(--guide-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
}

.guideai-rc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  flex-shrink: 0;
}

.guideai-rc-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.guideai-rc-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--guide-text-muted);
  border-radius: 6px;
  padding: 0;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-rc-close:hover {
  color: #374151;
  background: var(--guide-surface);
}

.guideai-rc-tabs {
  display: flex;
  gap: 0;
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.guideai-rc-tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--guide-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 150ms ease, border-color 150ms ease;
  text-align: center;
}

.guideai-rc-tab:hover {
  color: #6b7280;
}

.guideai-rc-tab--active {
  color: var(--guide-primary);
  border-bottom-color: var(--guide-primary);
}

.guideai-rc-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  max-height: 360px;
}

.guideai-rc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 150ms ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.guideai-rc-item:hover {
  background: #f9fafb;
}

.guideai-rc-item:focus-visible {
  background: var(--guide-surface);
  outline: 2px solid var(--guide-primary);
  outline-offset: -2px;
}

.guideai-rc-item-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guideai-rc-item-content {
  flex: 1;
  min-width: 0;
}

.guideai-rc-item-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guideai-rc-item-desc {
  display: block;
  font-size: 12px;
  color: var(--guide-text-muted);
  line-height: 1.4;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guideai-rc-item-arrow {
  font-size: 20px;
  color: #d1d5db;
  flex-shrink: 0;
  font-weight: 300;
}

.guideai-rc-empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--guide-text-muted);
  font-size: 13px;
}

/* ---- Chat panel ---- */

@keyframes guideai-dot-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.guideai-chat {
  position: fixed;
  width: 360px;
  max-height: 480px;
  background: var(--guide-bg);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.14), 0 4px 16px rgba(0, 0, 0, 0.08);
  font-family: var(--guide-font);
  font-size: 14px;
  color: var(--guide-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  z-index: 2147483646;
}

.guideai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--guide-border);
}

.guideai-chat-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--guide-text);
}

.guideai-chat-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.guideai-chat-pause {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--guide-border);
  background: var(--guide-surface);
  color: var(--guide-text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--guide-font);
  transition: background 150ms ease, color 150ms ease;
}

.guideai-chat-pause:hover {
  background: var(--guide-surface-hover);
  color: var(--guide-text);
}

.guideai-chat-pause svg {
  flex-shrink: 0;
}

.guideai-chat-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--guide-text-muted);
  border-radius: 6px;
  padding: 0;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-chat-close:hover {
  color: var(--guide-text);
  background: var(--guide-surface);
}

.guideai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
  max-height: 320px;
}

.guideai-chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  text-align: center;
  gap: 12px;
}

.guideai-chat-welcome-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--guide-primary), #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.guideai-chat-welcome-text {
  margin: 0;
  font-size: 13px;
  color: var(--guide-text-muted);
  line-height: 1.5;
}

.guideai-chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 4px;
}

.guideai-chat-suggestion {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--guide-border);
  background: var(--guide-bg);
  color: var(--guide-primary);
  font-size: 12px;
  font-family: var(--guide-font);
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
}

.guideai-chat-suggestion:hover {
  background: var(--guide-surface);
  border-color: var(--guide-primary);
}

.guideai-chat-msg-text {
  white-space: pre-wrap;
}

.guideai-chat-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  word-wrap: break-word;
}

.guideai-chat-msg--user {
  align-self: flex-end;
  background: var(--guide-primary);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.guideai-chat-msg--assistant {
  align-self: flex-start;
  background: var(--guide-surface);
  color: var(--guide-text);
  border-bottom-left-radius: 4px;
}

.guideai-chat-walkthrough-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--guide-primary);
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
  font-family: var(--guide-font);
}

.guideai-chat-walkthrough-btn:hover {
  background: var(--guide-primary-hover);
}

.guideai-chat-typing {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 14px;
  background: var(--guide-surface);
  border-bottom-left-radius: 4px;
}

.guideai-chat-typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--guide-text-muted);
  animation: guideai-dot-bounce 1.4s ease-in-out infinite;
}

.guideai-chat-typing-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.guideai-chat-typing-dot:nth-child(3) {
  animation-delay: 0.32s;
}

.guideai-chat-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--guide-border);
  flex-shrink: 0;
}

.guideai-chat-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--guide-border);
  background: var(--guide-bg);
  color: var(--guide-text);
  font-family: var(--guide-font);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.guideai-chat-input::placeholder {
  color: var(--guide-text-muted);
}

.guideai-chat-input:focus {
  border-color: var(--guide-primary);
}

.guideai-chat-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--guide-primary);
  color: #ffffff;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms ease;
  padding: 0;
}

.guideai-chat-send:hover {
  background: var(--guide-primary-hover);
}

.guideai-chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guideai-chat-send svg {
  width: 16px;
  height: 16px;
}

/* ---- Dark mode support ---- */

@media (prefers-color-scheme: dark) {
  :host {
    --guide-bg: #1e1e2e;
    --guide-text: #e5e5ef;
    --guide-text-secondary: #d1d5db;
    --guide-text-muted: #6b7280;
    --guide-border: rgba(255, 255, 255, 0.1);
    --guide-surface: #374151;
    --guide-surface-hover: #4b5563;
    --guide-primary: #2563eb;
    --guide-primary-hover: #3b82f6;
  }

  .guideai-chip {
    background: rgba(30, 30, 46, 0.88);
    color: #e5e5ef;
  }

  .guideai-chip:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .guideai-chip-dismiss {
    background: rgba(255, 255, 255, 0.08);
    color: #999;
  }

  .guideai-chip-dismiss:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ccc;
  }

  .guideai-tooltip-progress {
    background: #374151;
  }

  .guideai-tooltip-title,
  .guideai-rc-title,
  .guideai-rc-item-title,
  .guideai-confirm-title,
  .guideai-announcement-title {
    color: #f3f4f6;
  }

  .guideai-tooltip-back,
  .guideai-confirm-cancel {
    background: #374151;
    color: #d1d5db;
  }

  .guideai-tooltip-back:hover,
  .guideai-confirm-cancel:hover {
    background: #4b5563;
  }

  .guideai-tooltip-doit {
    background: #064e3b;
    color: #6ee7b7;
    border-color: #065f46;
  }

  .guideai-tooltip-doit:hover {
    background: #065f46;
  }

  .guideai-bubble {
    background: rgba(96, 165, 250, 0.15);
    border-color: rgba(96, 165, 250, 0.3);
    box-shadow: 0 4px 24px rgba(96, 165, 250, 0.2), 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  .guideai-bubble:hover {
    background: rgba(96, 165, 250, 0.25);
    box-shadow: 0 8px 32px rgba(96, 165, 250, 0.3), 0 2px 10px rgba(0, 0, 0, 0.25);
    border-color: rgba(96, 165, 250, 0.5);
  }

  .guideai-bubble-label {
    color: #93c5fd;
  }

  .guideai-bubble--pulsing::after {
    border-color: #2563eb;
  }

  .guideai-bubble--support {
    background: rgba(52, 211, 153, 0.12);
    border-color: rgba(52, 211, 153, 0.3);
    box-shadow: 0 4px 24px rgba(52, 211, 153, 0.2), 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  .guideai-bubble--support:hover {
    background: rgba(52, 211, 153, 0.22);
    box-shadow: 0 8px 32px rgba(52, 211, 153, 0.3), 0 2px 10px rgba(0, 0, 0, 0.25);
    border-color: rgba(52, 211, 153, 0.5);
  }

  .guideai-bubble--support .guideai-bubble-label {
    color: #6ee7b7;
  }

  .guideai-rc-tabs {
    border-bottom-color: #374151;
  }

  .guideai-rc-tab--active {
    color: #60a5fa;
    border-bottom-color: #60a5fa;
  }

  .guideai-rc-item:hover {
    background: #2a2a3e;
  }

  .guideai-nudge-tooltip {
    background: #1e1e2e;
    color: #e5e5ef;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .guideai-nudge-tooltip::after {
    background: #1e1e2e;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .guideai-chat-input {
    background: #2a2a3e;
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e5ef;
  }

  .guideai-chat-input::placeholder {
    color: #6b7280;
  }

  .guideai-chat-msg--assistant {
    background: #2a2a3e;
    color: #e5e5ef;
  }

  .guideai-chat-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .guideai-chat-input-row {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .guideai-minibar {
    background: #1e1e2e;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .guideai-minibar-progress {
    background: #374151;
  }

  .guideai-minibar-skip {
    background: #374151;
    color: #9ca3af;
  }

  .guideai-minibar-skip:hover {
    background: #4b5563;
    color: #d1d5db;
  }

  .guideai-minibar--completed {
    border-color: rgba(22, 163, 74, 0.3);
  }

  .guideai-minibar--paused {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .guideai-minibar--paused .guideai-minibar-text {
    color: #fbbf24;
  }

  .guideai-minibar-doit-offer {
    background: #064e3b;
    color: #6ee7b7;
    border-color: #065f46;
  }

  .guideai-minibar-doit-offer:hover {
    background: #065f46;
  }

  .guideai-minibar--stuck-pulse .guideai-minibar-dot {
    background: #f59e0b;
  }
}

/* ---- Reduced motion ---- */

@media (prefers-reduced-motion: reduce) {
  .guideai-chip,
  .guideai-tooltip,
  .guideai-announcement,
  .guideai-highlight,
  .guideai-bubble,
  .guideai-rc,
  .guideai-rc-tab,
  .guideai-nudge-tooltip,
  .guideai-chat {
    transition: none !important;
  }

  .guideai-bubble--pulsing::after {
    animation: none !important;
  }

  .guideai-eye {
    animation: none !important;
  }

  .guideai-arm {
    animation: none !important;
  }

  .guideai-nudge-tooltip {
    animation: none !important;
  }

  .guideai-recorder {
    animation: none !important;
  }

  .guideai-recorder-dot {
    animation: none !important;
  }

  .guideai-crawl-body,
  .guideai-crawl-leg-left,
  .guideai-crawl-leg-right,
  .guideai-crawl-mascot--looking .guideai-crawl-inner,
  .guideai-crawl-speech {
    animation: none !important;
  }

  .guideai-crawl-mascot {
    transition: none !important;
  }

  .guideai-minibar {
    transition: none !important;
  }

  .guideai-minibar-dot {
    animation: none !important;
  }

  .guideai-highlight--pulse {
    animation: none !important;
  }
}

/* ---- Guide Recorder Panel ---- */

@keyframes guideai-recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.guideai-recorder {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: 520px;
  background: var(--guide-bg);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.14), 0 4px 16px rgba(0, 0, 0, 0.08);
  font-family: var(--guide-font);
  font-size: 14px;
  color: var(--guide-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  z-index: 2147483646;
}

.guideai-recorder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--guide-border);
  flex-shrink: 0;
}

.guideai-recorder-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guideai-recorder-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  animation: guideai-recording-pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.guideai-recorder-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--guide-text);
}

.guideai-recorder-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--guide-text-muted);
  border-radius: 6px;
  padding: 0;
  transition: color 150ms ease, background 150ms ease;
}

.guideai-recorder-close:hover {
  color: var(--guide-text);
  background: var(--guide-surface);
}

.guideai-recorder-title-row {
  padding: 12px 16px 8px;
  flex-shrink: 0;
}

.guideai-recorder-title-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--guide-border);
  background: var(--guide-bg);
  color: var(--guide-text);
  font-family: var(--guide-font);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}

.guideai-recorder-title-input:focus {
  border-color: var(--guide-primary);
}

.guideai-recorder-title-input::placeholder {
  color: var(--guide-text-muted);
}

.guideai-recorder-steps {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  max-height: 260px;
  min-height: 60px;
}

.guideai-recorder-empty {
  padding: 20px 16px;
  text-align: center;
  color: var(--guide-text-muted);
  font-size: 13px;
}

.guideai-recorder-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  transition: background 150ms ease;
}

.guideai-recorder-step:hover {
  background: var(--guide-surface);
}

.guideai-recorder-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--guide-primary);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guideai-recorder-step-title {
  flex: 1;
  font-size: 13px;
  color: var(--guide-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guideai-recorder-step-del {
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 150ms ease, color 150ms ease;
}

.guideai-recorder-step-del:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--guide-danger);
}

.guideai-recorder-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--guide-border);
  flex-shrink: 0;
}

.guideai-recorder-count {
  font-size: 12px;
  color: var(--guide-text-muted);
  font-weight: 600;
}

.guideai-recorder-controls {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  flex-shrink: 0;
}

.guideai-recorder-btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 150ms ease, color 150ms ease;
  font-family: var(--guide-font);
}

.guideai-recorder-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guideai-recorder-cancel {
  background: var(--guide-surface);
  color: #374151;
}

.guideai-recorder-cancel:hover {
  background: var(--guide-surface-hover);
}

.guideai-recorder-preview {
  background: var(--guide-surface);
  color: var(--guide-primary);
}

.guideai-recorder-preview:hover:not(:disabled) {
  background: var(--guide-surface-hover);
}

.guideai-recorder-save {
  background: var(--guide-primary);
  color: #ffffff;
  flex: 1;
}

.guideai-recorder-save:hover:not(:disabled) {
  background: var(--guide-primary-hover);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .guideai-recorder-title-input {
    background: #2a2a3e;
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e5ef;
  }

  .guideai-recorder-title-input::placeholder {
    color: #6b7280;
  }

  .guideai-recorder-step-del {
    background: rgba(255, 255, 255, 0.08);
    color: #999;
  }

  .guideai-recorder-step-del:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .guideai-recorder-cancel {
    background: #374151;
    color: #d1d5db;
  }

  .guideai-recorder-cancel:hover {
    background: #4b5563;
  }
}

/* ============================================================
   Feedback Widget (post-guide thumbs up/down)
   ============================================================ */

.guideai-feedback {
  pointer-events: auto;
  animation: guideai-fade-in 200ms ease;
}

.guideai-feedback-card {
  background: var(--guide-bg, #ffffff);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--guide-border, #e5e7eb);
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  max-width: 280px;
  text-align: center;
}

.guideai-feedback-prompt {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--guide-text, #111827);
}

.guideai-feedback-thumbs {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.guideai-feedback-thumb {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid var(--guide-border, #e5e7eb);
  background: var(--guide-bg, #ffffff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--guide-text-muted, #6b7280);
  transition: all 150ms ease;
  padding: 0;
}

.guideai-feedback-thumb:hover {
  border-color: var(--guide-primary, #3b82f6);
  color: var(--guide-primary, #3b82f6);
}

.guideai-feedback-thumb--selected {
  border-color: var(--guide-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
  color: var(--guide-primary, #3b82f6);
}

.guideai-feedback-comment-area {
  margin-top: 12px;
}

.guideai-feedback-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--guide-border, #e5e7eb);
  background: var(--guide-bg, #ffffff);
  color: var(--guide-text, #111827);
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: 13px;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.guideai-feedback-textarea:focus {
  border-color: var(--guide-primary, #3b82f6);
}

.guideai-feedback-submit {
  margin-top: 8px;
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  background: var(--guide-primary, #3b82f6);
  color: #ffffff;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

.guideai-feedback-submit:hover {
  opacity: 0.9;
}

/* ============================================================
   NPS / CSAT Survey Widget
   ============================================================ */

.guideai-survey {
  pointer-events: auto;
  animation: guideai-fade-in 200ms ease;
}

.guideai-survey-card {
  background: var(--guide-bg, #ffffff);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--guide-border, #e5e7eb);
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  max-width: 360px;
  position: relative;
}

.guideai-survey-dismiss {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  color: var(--guide-text-muted, #6b7280);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.guideai-survey-dismiss:hover {
  color: var(--guide-text, #111827);
}

.guideai-survey-prompt {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--guide-text, #111827);
  padding-right: 24px;
}

/* NPS 0-10 scale */
.guideai-survey-nps-scale {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.guideai-survey-nps-btn {
  width: 28px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--guide-border, #e5e7eb);
  background: var(--guide-bg, #ffffff);
  color: var(--guide-text, #111827);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: all 120ms ease;
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

.guideai-survey-nps-btn:hover {
  border-color: var(--guide-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.05);
}

.guideai-survey-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: var(--guide-text-muted, #6b7280);
}

/* CSAT stars */
.guideai-survey-stars {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.guideai-survey-star {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--guide-border, #d1d5db);
  padding: 4px;
  transition: color 120ms ease, transform 120ms ease;
}

.guideai-survey-star:hover {
  color: #f59e0b;
  transform: scale(1.15);
}

.guideai-survey-star.guideai-survey-score--selected {
  color: #f59e0b;
}

.guideai-survey-star.guideai-survey-score--selected svg {
  fill: #f59e0b;
}

/* Shared score selected state (NPS) */
.guideai-survey-nps-btn.guideai-survey-score--selected {
  border-color: var(--guide-primary, #3b82f6);
  background: var(--guide-primary, #3b82f6);
  color: #ffffff;
}

/* Comment area */
.guideai-survey-comment {
  margin-top: 12px;
}

.guideai-survey-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--guide-border, #e5e7eb);
  background: var(--guide-bg, #ffffff);
  color: var(--guide-text, #111827);
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: 13px;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.guideai-survey-textarea:focus {
  border-color: var(--guide-primary, #3b82f6);
}

.guideai-survey-submit {
  margin-top: 8px;
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  background: var(--guide-primary, #3b82f6);
  color: #ffffff;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--guide-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

.guideai-survey-submit:hover {
  opacity: 0.9;
}

/* ---- Dark mode for feedback + survey ---- */
@media (prefers-color-scheme: dark) {
  .guideai-feedback-card,
  .guideai-survey-card {
    background: #1f2937;
    border-color: #374151;
  }

  .guideai-feedback-prompt,
  .guideai-survey-prompt {
    color: #f3f4f6;
  }

  .guideai-feedback-thumb {
    border-color: #4b5563;
    background: #1f2937;
    color: #9ca3af;
  }

  .guideai-feedback-thumb--selected {
    background: rgba(59, 130, 246, 0.2);
  }

  .guideai-feedback-textarea,
  .guideai-survey-textarea {
    background: #111827;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  .guideai-survey-nps-btn {
    background: #1f2937;
    border-color: #4b5563;
    color: #f3f4f6;
  }

  .guideai-survey-star {
    color: #4b5563;
  }

  .guideai-survey-dismiss {
    color: #9ca3af;
  }

  .guideai-survey-dismiss:hover {
    color: #f3f4f6;
  }

  .guideai-survey-labels {
    color: #9ca3af;
  }
}
`}class oa{constructor(e){this.host=document.createElement("div"),this.host.id="guideai-host",this.host.style.cssText="position:fixed;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none;overflow:visible;",this.shadow=this.host.attachShadow({mode:"open"}),this.styleEl=document.createElement("style"),this.styleEl.textContent=sa(),this.shadow.appendChild(this.styleEl),e!=null&&e.theme&&this.updateTheme(e.theme),document.body.appendChild(this.host)}getRoot(){return this.shadow}getHost(){return this.host}updateTheme(e){const t=this.host;e.primary&&t.style.setProperty("--guide-primary",e.primary),e.background&&t.style.setProperty("--guide-bg",e.background),e.text&&t.style.setProperty("--guide-text",e.text),e.fontFamily&&t.style.setProperty("--guide-font",e.fontFamily)}destroy(){this.host.remove()}}function Da(){}const aa=3e3,la='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';class ca{constructor(e,t,i,r){this.el=null,this.messagesEl=null,this.inputEl=null,this.conversationId=null,this.pollTimer=null,this.messages=[],this.destroyed=!1,this.outsideClickHandler=null,this.escHandler=null,this.api=e,this.config=t,this.eventBuffer=i,this.shadowRoot=r;const s=sessionStorage.getItem(`guideai_support_conv_${t.siteId}`);s&&(this.conversationId=parseInt(s,10))}toggle(){this.el?this.close():this.open()}open(){var r,s;if(this.el||this.destroyed)return;const e=document.createElement("div");e.className="guideai-chat guideai-support-chat",e.setAttribute("role","dialog"),e.setAttribute("aria-label","Live Support"),e.innerHTML=`
      <div class="guideai-chat-header" style="background:#059669;">
        <h3 class="guideai-chat-title" style="color:#fff;">Live Support</h3>
        <button class="guideai-chat-close" aria-label="Close" style="color:#fff;">&times;</button>
      </div>
      <div class="guideai-chat-messages">
        <div class="guideai-chat-welcome">
          <div class="guideai-chat-welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <p class="guideai-chat-welcome-text">Send a message to connect with a support agent.</p>
        </div>
      </div>
      <div class="guideai-chat-input-row">
        <input class="guideai-chat-input" type="text" placeholder="Type a message..." aria-label="Type your message" />
        <button class="guideai-chat-send" aria-label="Send" style="background:#059669;">${la}</button>
      </div>
    `,e.style.position="fixed",e.style.zIndex="2147483646",this.config.bubblePosition==="bottom-left"?e.style.left="20px":e.style.right="20px",e.style.bottom="88px",e.style.opacity="0",e.style.transform="translateY(12px)",this.shadowRoot.appendChild(e),requestAnimationFrame(()=>{e.style.transition="opacity 250ms ease, transform 250ms ease",e.style.opacity="1",e.style.transform="translateY(0)"}),this.el=e,this.messagesEl=e.querySelector(".guideai-chat-messages"),this.inputEl=e.querySelector(".guideai-chat-input");const t=e.querySelector(".guideai-chat-close");t==null||t.addEventListener("click",()=>this.close()),(r=this.inputEl)==null||r.addEventListener("keydown",o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),this.handleSend())});const i=e.querySelector(".guideai-chat-send");i==null||i.addEventListener("click",()=>this.handleSend()),this.escHandler=o=>{o.key==="Escape"&&this.close()},document.addEventListener("keydown",this.escHandler),setTimeout(()=>{this.outsideClickHandler=o=>{const a=o.composedPath();!a.length||this.el&&a.includes(this.el)||a.some(c=>{var d;return c instanceof HTMLElement&&((d=c.classList)==null?void 0:d.contains("guideai-bubble"))})||this.close()},document.addEventListener("click",this.outsideClickHandler,!0)},100),setTimeout(()=>{var o;return(o=this.inputEl)==null?void 0:o.focus()},300),this.conversationId&&(this.loadMessages(),this.startPolling()),(s=this.eventBuffer)==null||s.push(_(this.config.siteId,"support_chat_opened"))}close(){if(this.stopPolling(),this.outsideClickHandler&&(document.removeEventListener("click",this.outsideClickHandler,!0),this.outsideClickHandler=null),this.escHandler&&(document.removeEventListener("keydown",this.escHandler),this.escHandler=null),this.el){this.el.style.transition="opacity 200ms ease, transform 200ms ease",this.el.style.opacity="0",this.el.style.transform="translateY(12px)";const e=this.el;setTimeout(()=>e.remove(),200),this.el=null,this.messagesEl=null,this.inputEl=null}}isOpen(){return this.el!==null}destroy(){this.destroyed=!0,this.close()}async handleSend(){var i;if(!this.inputEl)return;const e=this.inputEl.value.trim();if(!e)return;this.inputEl.value="",this.inputEl.disabled=!0;const t=(i=this.messagesEl)==null?void 0:i.querySelector(".guideai-chat-welcome");t&&t.remove(),this.appendMessageBubble(e,"user");try{if(this.conversationId)await this.api.post(`/api/v1/support/public/conversations/${this.conversationId}/messages`,{content:e,message_type:"incoming"});else{const r=await this.api.post("/api/v1/support/public/conversations",{contact_name:"Visitor",message:e});this.conversationId=r.id,sessionStorage.setItem(`guideai_support_conv_${this.config.siteId}`,String(this.conversationId)),this.startPolling()}}catch(r){this.appendMessageBubble("Failed to send message. Please try again.","agent"),typeof console<"u"&&console.warn("[GuideAI] Support chat error:",r)}finally{this.inputEl&&(this.inputEl.disabled=!1,this.inputEl.focus())}}async loadMessages(){if(this.conversationId)try{const e=await this.api.get(`/api/v1/support/public/conversations/${this.conversationId}/messages`),t=Array.isArray(e)?e:[];t.length!==this.messages.length&&(this.messages=t,this.renderAllMessages())}catch{}}renderAllMessages(){var i;if(!this.messagesEl)return;const e=this.messagesEl.querySelector(".guideai-chat-welcome");e&&e.remove(),this.messagesEl.querySelectorAll(".guideai-chat-msg").forEach(r=>r.remove());for(const r of this.messages){const s=r.message_type===1;this.appendMessageBubble(r.content,s?"agent":"user",(i=r.sender)==null?void 0:i.name)}this.scrollToBottom()}appendMessageBubble(e,t,i){if(!this.messagesEl)return;const r=document.createElement("div");if(r.className=`guideai-chat-msg guideai-chat-msg--${t==="user"?"user":"assistant"}`,i&&t==="agent"){const o=document.createElement("div");o.style.cssText="font-size:11px;color:#6b7280;margin-bottom:2px;",o.textContent=i,r.appendChild(o)}const s=document.createElement("div");s.className="guideai-chat-msg-text",s.textContent=e,r.appendChild(s),this.messagesEl.appendChild(r),requestAnimationFrame(()=>this.scrollToBottom())}startPolling(){this.pollTimer||(this.pollTimer=setInterval(()=>{this.el&&this.loadMessages()},aa))}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}scrollToBottom(){this.messagesEl&&this.messagesEl.scrollTo({top:this.messagesEl.scrollHeight,behavior:"smooth"})}}const da={enabled:!0,idleThresholdMs:3e4,frustrationThreshold:3,cooldownMs:12e4};class ua{constructor(e,t,i,r,s){this.idleTimer=null,this.frustrationCount=0,this.lastSuggestionTime=0,this.activityHandler=null,this.hintElement=null,this.destroyed=!1,this.api=e,this.siteId=t,this.sessionId=i,this.shadowRoot=r,this.config={...da,...s}}start(){!this.config.enabled||this.destroyed||(this.activityHandler=()=>this.resetIdleTimer(),document.addEventListener("mousemove",this.activityHandler,{passive:!0}),document.addEventListener("keydown",this.activityHandler,{passive:!0}),document.addEventListener("scroll",this.activityHandler,{passive:!0}),this.resetIdleTimer())}reportFrustration(){this.frustrationCount++,this.frustrationCount>=this.config.frustrationThreshold&&(this.frustrationCount=0,this.tryShowSuggestion("frustration"))}resetIdleTimer(){this.idleTimer&&clearTimeout(this.idleTimer),this.frustrationCount=0,this.idleTimer=setTimeout(()=>{this.tryShowSuggestion("idle")},this.config.idleThresholdMs)}async tryShowSuggestion(e){if(this.destroyed)return;const t=Date.now();if(!(t-this.lastSuggestionTime<this.config.cooldownMs)){this.lastSuggestionTime=t;try{const i=await this.api.post("/api/v1/chat/ask",{site_id:this.siteId,session_id:this.sessionId,message:`[SUGGESTION_REQUEST] trigger=${e} url=${window.location.href} title=${document.title}`,mode:"suggestion"});i!=null&&i.reply&&this.showHint(i.reply)}catch{}}}showHint(e){this.dismissHint();const t=this.shadowRoot||document.body,i=document.createElement("div");i.setAttribute("data-guideai-suggestion","true"),Object.assign(i.style,{position:"fixed",bottom:"100px",right:"24px",maxWidth:"300px",padding:"12px 16px",background:"#1E293B",color:"#F8FAFC",borderRadius:"12px",fontSize:"13px",lineHeight:"1.5",boxShadow:"0 10px 25px rgba(0,0,0,0.15)",zIndex:"2147483646",cursor:"pointer",transition:"opacity 200ms ease, transform 200ms ease",opacity:"0",transform:"translateY(8px)"}),i.textContent=e,i.addEventListener("click",()=>this.dismissHint()),t.appendChild(i),this.hintElement=i,requestAnimationFrame(()=>{i&&(i.style.opacity="1",i.style.transform="translateY(0)")}),setTimeout(()=>this.dismissHint(),1e4)}dismissHint(){if(this.hintElement){this.hintElement.style.opacity="0",this.hintElement.style.transform="translateY(8px)";const e=this.hintElement;setTimeout(()=>e.remove(),200),this.hintElement=null}}destroy(){this.destroyed=!0,this.idleTimer&&clearTimeout(this.idleTimer),this.activityHandler&&(document.removeEventListener("mousemove",this.activityHandler),document.removeEventListener("keydown",this.activityHandler),document.removeEventListener("scroll",this.activityHandler)),this.dismissHint()}}const ha=20,ga=6e4;class fa{constructor(e){this.buffer=[],this.flushTimer=null,this.destroyed=!1,this.api=e}start(){this.flushTimer=setInterval(()=>this.flush(),ga)}report(e){this.destroyed||(this.buffer.push(e),this.buffer.length>=ha&&this.flush())}reportSuccess(e,t,i,r,s,o){this.report({guide_id:e,step_id:t,outcome:"success",match_score:i,tier_scores:r,stored_fingerprint:s,matched_fingerprint:o,page_url:location.href})}reportWrongElement(e,t,i,r,s,o,a){this.report({guide_id:e,step_id:t,outcome:"wrong_element",match_score:i,tier_scores:r,stored_fingerprint:s,matched_fingerprint:o,page_url:location.href,user_corrected_selector:a})}reportNotFound(e,t,i){this.report({guide_id:e,step_id:t,outcome:"not_found",match_score:0,tier_scores:{},stored_fingerprint:i,matched_fingerprint:{},page_url:location.href})}flush(){if(this.buffer.length===0)return;const e=this.buffer.splice(0);try{this.api.post("/api/v1/ml/feedback",{feedback:e}).catch(()=>{})}catch{}}flushBeacon(){if(this.buffer.length===0)return;const e=this.buffer.splice(0);this.api.postKeepalive("/api/v1/ml/feedback",{feedback:e})}destroy(){this.destroyed=!0,this.flushTimer&&(clearInterval(this.flushTimer),this.flushTimer=null),this.flushBeacon()}}const bi="guideai_page_scan_cache",yi=2880*60*1e3,pa=2e3;class ma{constructor(e,t){this.pendingTimer=null,this.config=e,this.api=t}onPageView(e){this.pendingTimer&&clearTimeout(this.pendingTimer),this.pendingTimer=setTimeout(()=>{this.pendingTimer=null,this.scan(e).catch(()=>{})},pa)}async scan(e){const t=this.extractRoute(e),i=zt(),r=this.captureIframeElements(),s=[...i.elements,...r];if(s.length===0)return;const o=await this.computeHash(s),l=this.getCache()[t];if(l&&l.hash===o&&Date.now()-l.ts<yi)return;const c={url:e,route:t,title:i.title,elements:s,content_hash:o};this.send(c),this.setCache(t,o)}extractRoute(e){try{return new URL(e).pathname}catch{return e.split("?")[0].split("#")[0]}}async computeHash(e){const t=e.map(r=>JSON.stringify(r,Object.keys(r).sort())).sort().join("|");if(typeof crypto<"u"&&crypto.subtle){const r=new TextEncoder().encode(t),s=await crypto.subtle.digest("SHA-256",r);return Array.from(new Uint8Array(s)).map(a=>a.toString(16).padStart(2,"0")).join("").slice(0,16)}let i=5381;for(let r=0;r<t.length;r++)i=(i<<5)+i+t.charCodeAt(r)&4294967295;return Math.abs(i).toString(16).padStart(16,"0").slice(0,16)}getCache(){try{const e=localStorage.getItem(bi);if(!e)return{};const t=JSON.parse(e),i=Date.now(),r={};for(const[s,o]of Object.entries(t)){const a=o;a.ts&&i-a.ts<yi&&(r[s]=a)}return r}catch{return{}}}setCache(e,t){try{const i=this.getCache();i[e]={hash:t,ts:Date.now()},localStorage.setItem(bi,JSON.stringify(i))}catch{}}captureIframeElements(){var i;const e=[],t=document.querySelectorAll("iframe");for(let r=0;r<t.length;r++){const s=t[r];try{const o=s.contentDocument;if(!o)continue;const a=s.src||s.getAttribute("src")||"",l=o.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [tabindex]');for(let c=0;c<l.length&&e.length<30;c++){const d=l[c],u=d.tagName.toLowerCase(),h=(d.getAttribute("aria-label")||d.placeholder||((i=d.textContent)==null?void 0:i.trim())||"").slice(0,80);!h&&u!=="input"&&u!=="select"&&u!=="textarea"||e.push({tag:u,text:h,selector:this.buildIframeSelector(d),role:d.getAttribute("role")||void 0,type:d.type||void 0,placeholder:d.placeholder||void 0,iframe_src:a||void 0})}}catch{}}return e}buildIframeSelector(e){if(e.id)return`#${e.id}`;const t=e.getAttribute("data-testid");if(t)return`[data-testid="${t}"]`;const i=e.getAttribute("name");if(i)return`${e.tagName.toLowerCase()}[name="${i}"]`;const r=e.tagName.toLowerCase();if(r==="a"){const s=e.getAttribute("href");if(s)return`a[href="${s}"]`}return r}send(e){this.api.postKeepalive("/api/v1/page-scan/scan",e)}}class ba{constructor(e,t=!1){this.flags={},this.storageKey=t&&e?`guideai_features_${e}`:null,this.hydrate()}hydrate(){if(this.storageKey)try{const e=localStorage.getItem(this.storageKey);if(e){const t=JSON.parse(e);t&&typeof t=="object"&&(this.flags=t)}}catch{}}save(){if(this.storageKey)try{localStorage.setItem(this.storageKey,JSON.stringify(this.flags))}catch{}}mark(e){!e||this.flags[e]||(this.flags[e]=!0,this.save())}unmark(e){this.flags[e]&&(delete this.flags[e],this.save())}snapshot(){return{...this.flags}}reset(){if(this.flags={},this.storageKey)try{localStorage.removeItem(this.storageKey)}catch{}}}function vi(n,e,t){try{const i=new URL(n);return{url:n,pathname:i.pathname,host:i.host,title:e,referrer:t}}catch{return{url:n,pathname:n,host:"",title:e,referrer:t}}}function ya(n){const e=typeof navigator<"u"?navigator:void 0,t=typeof location<"u"?location:void 0,i=typeof document<"u"?document:void 0,r=t?vi(t.href,i==null?void 0:i.title,i==null?void 0:i.referrer):vi("about:blank"),s=yo({id:n.sessionId,startedAt:n.sessionStartedAt,pageViews:n.pageViews,language:(e==null?void 0:e.language)??"en-US",userAgent:(e==null?void 0:e.userAgent)??""});return{visitor:n.visitor,account:n.account,page:r,session:s,features:n.features}}function va(n,e){return Me(n,e)}const xa={fingerprintThreshold:50,hiddenFingerprintThreshold:35,textSimilarityThreshold:.45,maxCacheEntries:200,cacheTtlMs:1800*1e3,lazyScan:{pollIntervalMs:500,maxPolls:15},maxGraphEdges:500};class wa{validate(e){if(!e||e==="*")return!0;let t=e;if(!e.startsWith("/"))try{t=new URL(e,location.origin).pathname}catch{return!0}return ue(t,location.pathname)}getNavigableUrl(e){if(!e||e==="*"||e.includes(":")||e.includes("["))return null;if(e.startsWith("/"))return e;try{return new URL(e,location.origin).pathname}catch{return null}}}const xi='a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"]';class ka{constructor(e){this.config=e}resolve(e){if(e.fingerprint&&e.fingerprint.total_score>0){const i=ri(e.fingerprint);if(i.element){const r=T(i.element)?this.config.fingerprintThreshold:this.config.hiddenFingerprintThreshold;if(i.score>=r)return{element:i.element,score:i.score,resolvedBy:"fingerprint",tierScores:i.tierScores}}}if(e.selector)try{const i=document.querySelector(e.selector);if(i)return{element:i,score:40,resolvedBy:"css_selector"}}catch{}if(e.fingerprint){const i=si(e.fingerprint);if(i){const r=e.tag||xi;try{const s=Array.from(document.querySelectorAll(r)),o=ni(i,s,this.config.textSimilarityThreshold);if(o.element)return{element:o.element,score:Math.round(o.similarity*100),resolvedBy:"text_similarity"}}catch{}}}const t=this.findByTextContent(e);return t?{element:t,score:30,resolvedBy:"text_search"}:{element:null,score:0,resolvedBy:null}}isVisible(e){return T(e)}findByTextContent(e){var r;const t=(e.text||e.description||"").toLowerCase();if(!t)return null;const i=e.tag||xi;try{const s=document.querySelectorAll(i);for(let o=0;o<s.length;o++){const a=s[o],l=(a.getAttribute("aria-label")||a.placeholder||((r=a.textContent)==null?void 0:r.trim())||"").toLowerCase();if(l&&(l.includes(t)||t.includes(l)))return a}}catch{}return null}findExpandableAncestors(e){return Le(e)}async expandContainer(e){return await Ie(e)}}const _a=`
  button:not([disabled]),
  [role="button"]:not([aria-disabled="true"]),
  summary,
  [aria-expanded="false"],
  [aria-controls],
  [data-toggle],
  [data-target],
  [data-open],
  [aria-haspopup],
  [role="tab"],
  a[aria-expanded="false"],
  a[href^="#"]
`,Ea=/\b(menu|open|expand|show|more|filter|tab|panel|drawer|sidebar|nav|navigation)\b/i,Sa=/\b(delete|remove|logout|log out|sign out|submit|save|pay|purchase|checkout|confirm)\b/i;function Ca(n){return new Promise(e=>setTimeout(e,n))}function dt(n){var e;return(n.getAttribute("aria-label")||n.getAttribute("title")||((e=n.textContent)==null?void 0:e.trim())||"").trim()}function Ta(n,e){let t=n.parentElement;for(;t&&t!==document.body;){if(!e(t))return!0;t=t.parentElement}return!1}function ut(n){let e=n.parentElement;for(;e&&e!==document.body;){if(!T(e))return e;e=e.parentElement}return null}function Re(n,e){const t=n.left+n.width/2,i=n.top+n.height/2,r=e.left+e.width/2,s=e.top+e.height/2;return Math.hypot(t-r,i-s)}class Aa{constructor(e,t){this.graph=e,this.resolver=t}async reveal(e){var s,o,a;if(e instanceof HTMLElement){if(console.log("%c📜 [RevealEngine] Trying scroll-into-view first...","color: #2196f3; font-weight: bold"),e.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(l=>setTimeout(l,400)),T(e))return console.log("%c✅ [RevealEngine] Element visible after scrolling!","color: #4caf50; font-weight: bold"),{success:!0,path:[],trigger:null};console.log("[RevealEngine] Still hidden after scroll, trying other strategies...")}const t=this.graph.findRevealPath(e);if(t.length>0){let l=!0;for(const c of t)if(c.toggle&&!await Ie({container:c.container,toggle:c.toggle,kind:c.kind==="graph-learned"?"class-pattern":c.kind})){l=!1;break}if(l&&T(e))return this.graph.record(t,location.pathname,"observed-click"),{success:!0,path:t,trigger:((s=t[t.length-1])==null?void 0:s.toggle)??null};this.graph.recordFailure(t)}const i=Le(e);if(i.length===0)return console.log("[RevealEngine] No expandable ancestors found, trying ranked trigger exploration..."),await this.forceExplore(e);const r=i.map(l=>({container:l.container,toggle:l.toggle,kind:l.kind,label:l.container.getAttribute("aria-label")||l.container.id||l.kind}));for(const l of i)if(!await Ie(l))return{success:!1,path:r,trigger:((o=r[r.length-1])==null?void 0:o.toggle)??null};return T(e)?(this.graph.record(r,location.pathname,"dom-parent"),{success:T(e),path:r,trigger:((a=r[r.length-1])==null?void 0:a.toggle)??null}):(console.log("[RevealEngine] Standard reveal failed, trying force exploration..."),await this.forceExplore(e))}suggestRevealPath(e){const t=Le(e);if(t.length>0)return t.map(a=>{var l;return{container:a.container,toggle:a.toggle,kind:a.kind,label:((l=a.toggle)==null?void 0:l.getAttribute("aria-label"))||a.container.getAttribute("aria-label")||a.container.id||a.kind,confidence:.9}});const i=this.graph.findRevealPath(e);if(i.length>0)return i;const r=ut(e),o=this.collectPotentialToggles(e,r)[0];return o?[{container:r??e.parentElement??e,toggle:o.toggle,kind:"graph-learned",label:o.reasons.join(", ")||dt(o.toggle)||"menu",confidence:Math.max(.2,Math.min(.95,o.score/100))}]:[]}async forceExplore(e){console.log("%c🔥 [RevealEngine] Force exploration mode activated","color: #f44336; font-weight: bold");const t=[],i=ut(e),r=this.collectPotentialToggles(e,i);console.log(`[RevealEngine] Found ${r.length} ranked trigger candidates`,r.slice(0,8).map(a=>({score:a.score,label:dt(a.toggle),reasons:a.reasons})));let s=0;const o=Math.min(r.length,8);for(let a=0;a<o;a++){const l=r[a],c=l.toggle;s++,console.log(`[RevealEngine] Attempt ${s}: clicking ranked trigger`,{score:l.score,reasons:l.reasons,toggle:c});try{this.dispatchClickSequence(c)}catch(u){console.log("[RevealEngine] Error clicking toggle:",u);continue}const d=await this.waitForReveal(e,i);if(d.success){const u=d.revealedContainer??ut(e)??i??e;return console.log("%c✅ [RevealEngine] Force exploration SUCCESS! Target visible after clicking toggle","color: #4caf50; font-weight: bold",c),t.push({container:u,toggle:c,kind:"graph-learned",label:`force-explored: ${l.reasons.join(", ")}`,confidence:Math.max(.2,Math.min(.95,l.score/100))}),this.graph.record(t,location.pathname,"observed-click"),{success:!0,path:t,trigger:c}}}return console.log(`%c❌ [RevealEngine] Force exploration FAILED after ${s} attempts`,"color: #f44336; font-weight: bold"),{success:!1,path:t,trigger:null}}collectPotentialToggles(e,t){const i=e.getBoundingClientRect(),r=(t==null?void 0:t.getBoundingClientRect())??null,s=new Set,o=[],a=document.querySelectorAll(_a);for(const l of a){if(!(l instanceof HTMLElement)||s.has(l)||(s.add(l),!this.resolver.isVisible(l))||Ta(l,this.resolver.isVisible.bind(this.resolver)))continue;const c=this.scoreTrigger(l,i,r,t);c&&o.push(c)}return o.sort((l,c)=>c.score-l.score),o}scoreTrigger(e,t,i,r){let s=0;const o=[],l=`${dt(e)} ${e.getAttribute("name")||""}`.trim(),c=e.tagName.toLowerCase(),d=e.getAttribute("role")||"",u=e.getAttribute("aria-controls"),h=e.getAttribute("href")||"",p=e.getAttribute("data-target")||e.getAttribute("data-toggle")||e.getAttribute("data-open");if(Sa.test(l))return null;const m=(e.getAttribute("type")||"").toLowerCase();if(c==="button"&&["submit","reset"].includes(m)||c==="a"&&h&&!h.startsWith("#")&&!u&&!p&&e.getAttribute("aria-expanded")!=="false")return null;u&&(r!=null&&r.id)&&u===r.id&&(s+=80,o.push("controls-hidden-container")),p&&(r!=null&&r.id)&&p.replace(/^#/,"")===r.id&&(s+=70,o.push("data-target-match")),h.startsWith("#")&&(r!=null&&r.id)&&h.slice(1)===r.id&&(s+=65,o.push("hash-target-match")),e.getAttribute("aria-expanded")==="false"&&(s+=30,o.push("collapsed-toggle")),(c==="summary"||d==="tab"||d==="button")&&(s+=18,o.push(`role:${d||c}`)),e.hasAttribute("aria-haspopup")&&(s+=15,o.push("popup-trigger")),Ea.test(l)&&(s+=18,o.push("trigger-language")),e.closest('header, nav, aside, [role="navigation"], [role="tablist"], [role="dialog"]')&&(s+=10,o.push("landmark-context"));const g=e.getBoundingClientRect(),b=Re(g,t);if(b<140?(s+=18,o.push("near-target")):b<300&&(s+=10,o.push("target-proximity")),i){const y=Re(g,i);y<160?(s+=20,o.push("near-hidden-container")):y<320&&(s+=10,o.push("container-proximity"))}return s<=0?null:{toggle:e,score:s,reasons:o}}dispatchClickSequence(e){const t={bubbles:!0,cancelable:!0,composed:!0};e.dispatchEvent(new PointerEvent("pointerdown",t)),e.dispatchEvent(new MouseEvent("mousedown",t)),e.dispatchEvent(new PointerEvent("pointerup",t)),e.dispatchEvent(new MouseEvent("mouseup",t)),e.dispatchEvent(new MouseEvent("click",t)),typeof e.click=="function"&&e.click()}async waitForReveal(e,t){const i=new Set,r=new MutationObserver(s=>{for(const o of s)o.target instanceof HTMLElement&&i.add(o.target),o.addedNodes.forEach(a=>{a instanceof HTMLElement&&i.add(a)})});r.observe(document.body,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["class","style","hidden","aria-hidden","aria-expanded"]});try{for(let s=0;s<14;s++){if(await Ca(50),this.resolver.isVisible(e))return{success:!0,revealedContainer:this.pickObservedContainer(e,t,i)};if(t&&this.resolver.isVisible(t)&&T(e))return{success:!0,revealedContainer:this.pickObservedContainer(e,t,i)}}}finally{r.disconnect()}return{success:!1,revealedContainer:null}}pickObservedContainer(e,t,i){const r=e.parentElement,s=Array.from(i).filter(o=>!o.isConnected||!this.resolver.isVisible(o)?!1:o.contains(e)||o===t||!!r&&o.contains(r));return s.sort((o,a)=>{const l=Re(o.getBoundingClientRect(),e.getBoundingClientRect()),c=Re(a.getBoundingClientRect(),e.getBoundingClientRect());return l-c}),s[0]??t??r??null}}const wi=["class","style","hidden","aria-hidden","aria-expanded","data-state","data-open","data-visible","open"];class La{constructor(e,t){this.activeScans=new Set,this.resolver=e,this.options=t}start(e,t){let i=0,r=!1,s=null,o=null,a=null,l=null;const c=()=>{r=!0,a==null||a.disconnect(),a=null,s&&clearTimeout(s),o&&clearTimeout(o),l&&clearTimeout(l),s=null,o=null,l=null,document.removeEventListener("DOMContentLoaded",u),window.removeEventListener("load",h),this.activeScans.delete(g)},d=async()=>{if(r||i>=this.options.maxPolls){c();return}i++,console.log(`%c🔄 [LazyScanner] Attempt #${i}: Resolving element...`,"color: #00bcd4; font-weight: bold");const b=this.resolver.resolve(e);if(console.log("[LazyScanner] Resolve result:",{hasElement:!!b.element,score:b.score,isVisible:b.element?this.resolver.isVisible(b.element):null}),b.element&&this.resolver.isVisible(b.element))console.log("%c✅ [LazyScanner] Element found and visible!","color: #4caf50; font-weight: bold",b.element),c(),t(b);else if(b.element){if(console.log("%c⏳ [LazyScanner] Element found but not yet visible","color: #ff9800"),i===3||i===7){console.log("[LazyScanner] Attempting to reveal hidden element...");const y=this.resolver.findExpandableAncestors(b.element);if(y.length>0){for(const S of y)await this.resolver.expandContainer(S);if(this.resolver.isVisible(b.element)){console.log("%c✅ [LazyScanner] Element revealed successfully!","color: #4caf50; font-weight: bold"),c(),t(b);return}}}console.log("[LazyScanner] Continuing scan...")}else console.log("%c❌ [LazyScanner] Element not found, continuing scan...","color: #f44336")},u=()=>{r||(console.log("%c📄 [LazyScanner] DOMContentLoaded fired, re-attempting resolution...","color: #9c27b0; font-weight: bold"),setTimeout(()=>{r||d()},150))},h=()=>{r||(console.log("%c🌐 [LazyScanner] window.onload fired, re-attempting resolution...","color: #9c27b0; font-weight: bold"),setTimeout(()=>{r||d()},150))},p=()=>{r||(s&&clearTimeout(s),s=setTimeout(d,60))};a=new MutationObserver(b=>{if(r)return;let y=!1;for(let S=0;S<b.length;S++){const v=b[S];if(v.type==="attributes"&&wi.includes(v.attributeName||"")){y=!0;break}if(v.type==="childList"&&v.addedNodes.length>0){y=!0;break}}y&&p()}),a.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:wi}),document.readyState==="loading"?(console.log("%c📄 [LazyScanner] Page still loading, adding DOMContentLoaded listener","color: #9c27b0"),document.addEventListener("DOMContentLoaded",u)):document.readyState==="interactive"?(console.log("%c📄 [LazyScanner] DOM interactive, adding window.onload listener","color: #9c27b0"),window.addEventListener("load",h)):console.log(`%c📄 [LazyScanner] Page already loaded (readyState: ${document.readyState})`,"color: #9c27b0"),document.readyState!=="complete"&&window.addEventListener("load",h);const m=()=>{r||(o=setTimeout(()=>{r||(d(),m())},this.options.pollIntervalMs))};m();const f=this.options.maxPolls*this.options.pollIntervalMs;l=setTimeout(c,f);const g={cancel:c};return this.activeScans.add(g),c}cancelAll(){for(const e of this.activeScans)e.cancel();this.activeScans.clear()}}const ki="guideai_interaction_graph";class Ia{constructor(e){this.edges=new Map,this.maxEdges=e,this.restore()}record(e,t,i="dom-parent"){for(const r of e){if(!r.toggle||!r.container)continue;const s=this.edgeKey(r.toggle,r.container),o=this.edges.get(s);o?(o.confirmations++,o.lastUsedAt=Date.now(),o.failures=Math.max(0,o.failures-1),o.source=i,o.triggerMeta=this.buildMeta(r.toggle),o.revealedMeta=this.buildMeta(r.container),o.relation=this.buildRelation(r.toggle,r.container)):this.edges.set(s,{triggerKey:this.elementKey(r.toggle),revealedKey:this.elementKey(r.container),route:t,confirmations:1,failures:0,lastUsedAt:Date.now(),source:i,triggerMeta:this.buildMeta(r.toggle),revealedMeta:this.buildMeta(r.container),relation:this.buildRelation(r.toggle,r.container)})}this.evictIfNeeded(),this.persist()}recordFailure(e){for(const t of e){if(!t.toggle||!t.container)continue;const i=this.edgeKey(t.toggle,t.container),r=this.edges.get(i);r&&(r.failures++,r.lastUsedAt=Date.now())}this.persist()}findRevealPath(e){const t=[];let i=e.parentElement;const r=location.pathname;for(;i&&i!==document.body;){const s=this.elementKey(i),o=[];for(const a of this.edges.values()){if(a.revealedKey!==s||a.route!==r&&a.route!=="*")continue;const l=this.findElementByKey(a.triggerKey);l&&this.isElementUsable(l)&&o.push({edge:a,toggle:l,score:this.rankEdge(a,l,i,r)})}if(o.sort((a,l)=>l.score-a.score),o.length>0){const a=o[0];t.unshift({container:i,toggle:a.toggle,kind:"graph-learned",label:`learned (${a.edge.confirmations}x/${a.edge.failures}f, ${a.edge.source})`,confidence:Math.max(.1,Math.min(1,a.score/100))})}i=i.parentElement}return t}persist(){try{const e=Array.from(this.edges.entries());sessionStorage.setItem(ki,JSON.stringify(e))}catch{}}restore(){try{const e=sessionStorage.getItem(ki);if(!e)return;const t=JSON.parse(e);this.edges=new Map(t)}catch{}}evictIfNeeded(){for(;this.edges.size>this.maxEdges;){let e="",t=1/0;for(const[i,r]of this.edges){const s=r.confirmations*15-r.failures*20-Math.floor((Date.now()-r.lastUsedAt)/6e4);s<t&&(t=s,e=i)}if(e)this.edges.delete(e);else break}}rankEdge(e,t,i,r){var c,d,u;let s=e.confirmations*20-e.failures*25;e.route===r&&(s+=30),e.route==="*"&&(s+=5),((c=e.triggerMeta)==null?void 0:c.role)==="tab"&&(s+=8),(d=e.triggerMeta)!=null&&d.ariaLabel&&(s+=4),((u=e.revealedMeta)==null?void 0:u.role)===i.getAttribute("role")&&(s+=10);const o=t.getBoundingClientRect(),a=i.getBoundingClientRect(),l=Math.hypot(o.left-a.left,o.top-a.top);return l<200?s+=12:l<400&&(s+=5),s}edgeKey(e,t){return`${this.elementKey(e)}-->${this.elementKey(t)}`}elementKey(e){if(e.id)return`#${e.id}`;const t=["data-guideai","data-testid","name","aria-label"];for(const o of t){const a=e.getAttribute(o);if(a)return`[${o}="${CSS.escape(a)}"]`}const i=e.getAttribute("aria-controls");if(i)return`[aria-controls="${CSS.escape(i)}"]`;const r=e.tagName.toLowerCase(),s=e.className&&typeof e.className=="string"?"."+e.className.split(/\s+/).filter(o=>o).slice(0,2).map(o=>CSS.escape(o)).join("."):"";return`${r}${s}`}findElementByKey(e){try{return document.querySelector(e)}catch{return null}}isElementUsable(e){return!(!e.isConnected||e.getAttribute("aria-disabled")==="true"||e.hasAttribute("disabled"))}buildMeta(e){var t;return{text:((t=e.textContent)==null?void 0:t.trim().slice(0,80))||void 0,ariaLabel:e.getAttribute("aria-label")||void 0,role:e.getAttribute("role")||void 0,tag:e.tagName.toLowerCase(),classHint:typeof e.className=="string"?e.className.split(/\s+/).filter(Boolean).slice(0,3).join(" "):void 0}}buildRelation(e,t){const i=e.getBoundingClientRect(),r=t.getBoundingClientRect(),s=Math.abs(i.left-r.left)<window.innerWidth*.4&&Math.abs(i.top-r.top)<window.innerHeight*.4;let o="unknown";return i.bottom<=r.top?o="above":i.top>=r.bottom?o="below":i.right<=r.left?o="left":i.left>=r.right?o="right":o="overlap",{sameRegion:s,direction:o}}}class Ma{constructor(e,t){this.entries=new Map,this.maxEntries=e,this.ttlMs=t}lookup(e){const t=this.intentKey(e),i=this.entries.get(t);return i?Date.now()-i.timestamp>this.ttlMs?(this.entries.delete(t),null):i.route!==location.pathname?null:(i.hitCount++,this.entries.delete(t),this.entries.set(t,i),i):null}store(e,t){const i=this.intentKey(e);this.entries.set(i,{intentKey:i,selector:t.selector,route:t.route,score:t.score,tier:t.tier,timestamp:Date.now(),hitCount:0}),this.evictIfNeeded()}evict(e){this.entries.delete(this.intentKey(e))}clear(){this.entries.clear()}intentKey(e){return[e.expectedRoute||location.pathname,e.tag||"*",(e.text||"").slice(0,50)||"*",(e.selector||"").slice(0,50)||"*"].join("|")}evictIfNeeded(){for(;this.entries.size>this.maxEntries;){const e=this.entries.keys().next().value;if(e!==void 0)this.entries.delete(e);else break}}}class Pa{constructor(e,t,i){this.revealAttempted=new Set,this.config={...xa,...i},this.feedbackReporter=t??null,this.graph=new Ia(this.config.maxGraphEdges),this.cache=new Ma(this.config.maxCacheEntries,this.config.cacheTtlMs),this.routeValidator=new wa,this.resolver=new ka(this.config),this.revealEngine=new Aa(this.graph,this.resolver),this.lazyScanner=new La(this.resolver,this.config.lazyScan)}async resolve(e){var s,o;const t=performance.now();if(e.expectedRoute&&!this.routeValidator.validate(e.expectedRoute))return{status:"wrong_page",element:null,matchScore:0,resolvedBy:null,expectedRoute:e.expectedRoute,durationMs:performance.now()-t,fromCache:!1};const i=this.cache.lookup(e);if(i){try{const a=document.querySelector(i.selector);if(a)return{status:"found",element:a,matchScore:i.score,resolvedBy:"cache",durationMs:performance.now()-t,fromCache:!0}}catch{}this.cache.evict(e)}const r=this.resolver.resolve(e);if(r.element){if(!this.resolver.isVisible(r.element)){const l=`${e.expectedRoute||""}:${e.text||e.selector||""}`;if(!this.revealAttempted.has(l)){this.revealAttempted.add(l);const c=await this.revealEngine.reveal(r.element);return c.success?(this.cacheResult(e,r),{status:"revealed",element:r.element,matchScore:r.score,resolvedBy:r.resolvedBy,tierScores:r.tierScores,revealPath:c.path,revealTrigger:c.trigger,requiresReveal:!0,revealConfidence:((s=c.path[c.path.length-1])==null?void 0:s.confidence)??1,revealReason:"hidden_target_revealed",durationMs:performance.now()-t,fromCache:!1}):{status:"reveal_failed",element:r.element,matchScore:r.score,resolvedBy:r.resolvedBy,revealTrigger:c.trigger,requiresReveal:!0,revealConfidence:((o=c.path[c.path.length-1])==null?void 0:o.confidence)??0,revealReason:"hidden_target_still_requires_reveal",durationMs:performance.now()-t,fromCache:!1}}return{status:"found_hidden",element:r.element,matchScore:r.score,resolvedBy:r.resolvedBy,revealTrigger:null,requiresReveal:!0,revealConfidence:0,revealReason:"hidden_target_not_revealed",durationMs:performance.now()-t,fromCache:!1}}return this.cacheResult(e,r),{status:"found",element:r.element,matchScore:r.score,resolvedBy:r.resolvedBy,tierScores:r.tierScores,revealTrigger:null,requiresReveal:!1,revealConfidence:0,revealReason:null,durationMs:performance.now()-t,fromCache:!1}}return{status:"not_found",element:null,matchScore:0,resolvedBy:null,requiresReveal:!1,revealConfidence:0,revealReason:null,durationMs:performance.now()-t,fromCache:!1}}resolveSync(e){const t=this.cache.lookup(e);if(t){try{const i=document.querySelector(t.selector);if(i)return{element:i,score:t.score,resolvedBy:"cache"}}catch{}this.cache.evict(e)}return this.resolver.resolve(e)}startLazyScan(e,t){return this.lazyScanner.start(e,async i=>{var r;if(i.element&&!this.resolver.isVisible(i.element)){const s=await this.revealEngine.reveal(i.element);if(s.success){this.cacheResult(e,i),t({status:"revealed",element:i.element,matchScore:i.score,resolvedBy:i.resolvedBy,revealPath:s.path,revealTrigger:s.trigger,requiresReveal:!0,revealConfidence:((r=s.path[s.path.length-1])==null?void 0:r.confidence)??1,revealReason:"lazy_scan_revealed_hidden_target",durationMs:0,fromCache:!1});return}}i.element&&(this.cacheResult(e,i),t({status:"found",element:i.element,matchScore:i.score,resolvedBy:i.resolvedBy,revealTrigger:null,requiresReveal:!1,revealConfidence:0,revealReason:null,durationMs:0,fromCache:!1}))})}resolveDetectOnly(e){var s,o;const t=this.resolver.resolve(e);if(!t.element)return{element:null,isVisible:!1,revealPath:[],revealTrigger:null,requiresReveal:!1,revealConfidence:0,revealReason:null,score:0,resolvedBy:null};if(this.resolver.isVisible(t.element))return{element:t.element,isVisible:!0,revealPath:[],revealTrigger:null,requiresReveal:!1,revealConfidence:0,revealReason:null,score:t.score,resolvedBy:t.resolvedBy};const r=this.revealEngine.suggestRevealPath(t.element);return{element:t.element,isVisible:!1,revealPath:r,revealTrigger:((s=r[r.length-1])==null?void 0:s.toggle)??null,requiresReveal:r.length>0,revealConfidence:((o=r[r.length-1])==null?void 0:o.confidence)??0,revealReason:r.length>0?"hidden_target_requires_reveal_guidance":null,score:t.score,resolvedBy:t.resolvedBy}}stepToIntent(e){var t,i,r,s,o;return{description:e.content.title||e.content.body,tag:(i=(t=e.target_fingerprint)==null?void 0:t.tier3_structural)==null?void 0:i.tag,text:((s=(r=e.target_fingerprint)==null?void 0:r.tier2_text)==null?void 0:s.text_content)||e.content.title,selector:e.target_selector,fingerprint:((o=e.target_fingerprint)==null?void 0:o.total_score)>0?e.target_fingerprint:void 0,expectedRoute:e.page_url_pattern,actionType:e.action_config.action_type,kbRoutePath:e.page_url_pattern}}reportFeedback(e,t,i,r){if(this.feedbackReporter)if(i.status==="found"||i.status==="revealed"){if(i.element&&r.fingerprint){const s=Z(i.element);this.feedbackReporter.reportSuccess(e,t,i.matchScore,i.tierScores??{},r.fingerprint,s)}}else i.status==="not_found"&&r.fingerprint&&this.feedbackReporter.reportNotFound(e,t,r.fingerprint)}clearRevealAttempt(e){this.revealAttempted.delete(e)}clearAllRevealAttempts(){this.revealAttempted.clear()}persist(){this.graph.persist()}destroy(){this.lazyScanner.cancelAll(),this.graph.persist(),this.cache.clear(),this.revealAttempted.clear()}cacheResult(e,t){const i=t.element;if(!i||!t.resolvedBy)return;const r=i.id?`#${i.id}`:i.getAttribute("data-testid")?`[data-testid="${i.getAttribute("data-testid")}"]`:i.getAttribute("data-guideai")?`[data-guideai="${i.getAttribute("data-guideai")}"]`:i.getAttribute("name")?`[name="${i.getAttribute("name")}"]`:null;r&&this.cache.store(e,{selector:r,route:location.pathname,score:t.score,tier:t.resolvedBy})}}class Ra{constructor(e){this.kb=null,this.shadowContainer=null,this.kbLoader=null,this.eventBuffer=null,this.eventSender=null,this.rageClick=null,this.deadClick=null,this.formError=null,this.chipManager=null,this.sessionTracker=null,this.announcementMgr=null,this.cryptoManager=null,this.bubbleManager=null,this.chatManager=null,this.supportChat=null,this.suggestionManager=null,this.feedbackReporter=null,this.liveScanner=null,this.analyzer=null,this.onOpenSupport=null,this.pageTracker=null,this.scrollTracker=null,this.engagementTracker=null,this.clickTracker=null,this.formTracker=null,this.errorTracker=null,this.performanceTracker=null,this.uiErrorObserver=null,this.trackApi=new Ir,this.sessionRecorder=null,this.guideRecorder=null,this.feedbackRenderer=null,this.surveyRenderer=null,this.surveyTrigger=null,this.usageFeedbackTrigger=null,this.shadowRootRef=null,this.sessionStartTime=0,this.destroyed=!1,this.beforeUnloadHandler=null,this.extBridgeHandler=null,this.chipClickHandler=null,this.playerEndedHandler=null,this.publishedGuidesCache=null,this.guidesPromise=null,this.activeGuideId=null,this.activeGuidePlayer=null,this.featureFlags=null,this.sessionPageViews=0,this.config=e,this.api=new ht(e.apiUrl,e.token),this.cdnApi=new ht(e.cdnUrl,e.token),this.sessionId=this.getOrCreateSessionId()}async init(){var e,t;if(!this.destroyed)try{this.sessionStartTime=Date.now(),this.featureFlags=new ba(this.config.siteId,!0),this.shadowContainer=new oa({theme:this.config.theme});const i=this.shadowContainer.getRoot();if(this.shadowRootRef=i,this.cryptoManager=new Ss(this.config.siteId,this.config.token),this.api.setCryptoManager(this.cryptoManager),this.kbLoader=new Li(this.config.cdnUrl,this.config.siteId,this.config.token),this.kb=await this.kbLoader.load(),this.destroyed)return;this.guidesPromise=this.fetchPublishedGuides();const r=this.kbLoader.bubbleSettings;r!=null&&r.icon&&(this.config.bubbleIcon=r.icon),r!=null&&r.label&&(this.config.bubbleLabelText=r.label),r!=null&&r.image_url&&(this.config.bubbleImageUrl=r.image_url),this.kbLoader.bubbleMode&&(this.config.bubbleMode=this.kbLoader.bubbleMode),(e=r==null?void 0:r.crawl_messages)!=null&&e.length&&(this.config.bubbleCrawl.messages=r.crawl_messages),r!=null&&r.crawl_speed&&(this.config.bubbleCrawl.speed=r.crawl_speed),(r==null?void 0:r.crawl_climb_walls)!==void 0&&(this.config.bubbleCrawl.climbWalls=r.crawl_climb_walls);const s=this.config.extensionMode?!1:this.kbLoader.helpSupportEnabled;!this.config.extensionMode&&this.kbLoader.widgetMode&&(this.config.widgetMode=this.kbLoader.widgetMode),s&&this.config.widgetMode==="guide"&&(this.config.widgetMode="combined"),this.config.extensionMode&&(this.config.widgetMode="guide");const o=this.config.widgetMode;if(this.config.bubbleMode==="crawl"&&o!=="guide"&&(this.config.bubbleMode="drift"),!this.config.extensionMode){this.eventSender=new dr(this.api,this.config.siteId,this.sessionId),this.eventBuffer=new Ii(this.eventSender,this.config.batchSize,this.config.batchIntervalMs),this.trackApi.configure(this.eventBuffer,this.config.siteId);const a=$i(this.config.siteId),l=_(this.config.siteId,"session_start",a);l.session_id=this.sessionId,this.eventBuffer.push(l);const c=_(this.config.siteId,"page_view",{entry_page:!0,page_title:document.title,referrer:document.referrer||void 0});c.session_id=this.sessionId,this.eventBuffer.push(c),this.sessionPageViews=1;const d=new URLSearchParams(window.location.search),u=d.get("utm_source"),h=d.get("utm_medium"),p=d.get("utm_campaign");if(u||h||p||document.referrer){const f=_(this.config.siteId,"identify",{utm_source:u||void 0,utm_medium:h||void 0,utm_campaign:p||void 0,utm_term:d.get("utm_term")||void 0,utm_content:d.get("utm_content")||void 0,referrer:document.referrer||void 0});f.session_id=this.sessionId,this.eventBuffer.push(f)}Yi(this.config.siteId,this.config.geolocationMode).then(f=>{var b;if(!f||this.destroyed)return;const g=_(this.config.siteId,"geo_location",f);g.session_id=this.sessionId,(b=this.eventBuffer)==null||b.push(g)}),this.rageClick=new hr(f=>{var g,b;(g=this.eventBuffer)==null||g.push(f),(b=this.suggestionManager)==null||b.reportFrustration()}),this.rageClick.start(),this.deadClick=new gr(f=>{var g,b;(g=this.eventBuffer)==null||g.push(f),(b=this.suggestionManager)==null||b.reportFrustration()}),this.deadClick.start(),this.formError=new fr(f=>{var g;(g=this.eventBuffer)==null||g.push(f)}),this.formError.start();const m=f=>{var g;(g=this.eventBuffer)==null||g.push(f)};this.scrollTracker=new br(m),this.scrollTracker.start(),this.engagementTracker=new xr,this.engagementTracker.start(),this.formTracker=new kr(m),this.formTracker.start(),this.liveScanner=new ma(this.config,this.api),this.pageTracker=new pr(f=>{var g,b;m(f),f.event_type==="page_view"&&f.url&&(this.sessionPageViews++,(g=this.liveScanner)==null||g.onPageView(f.url),(b=this.usageFeedbackTrigger)==null||b.onPageView())}),this.pageTracker.setEnrichers({getScrollData:()=>this.scrollTracker.getPageScrollData(),getEngagementData:()=>this.engagementTracker.getEngagementData(),flushAbandoned:()=>{var f;return(f=this.formTracker)==null?void 0:f.flushAbandoned()},resetPageMetrics:()=>{var f,g;(f=this.scrollTracker)==null||f.reset(),(g=this.engagementTracker)==null||g.reset()}}),this.pageTracker.start(),this.liveScanner.onPageView(location.href),this.clickTracker=new wr(m),this.clickTracker.start(),this.errorTracker=new Er(m),this.errorTracker.start(),this.performanceTracker=new Cr(m),this.performanceTracker.start(),this.uiErrorObserver=new Tr(m),this.uiErrorObserver.start(),this.config.recordingEnabled&&(this.sessionRecorder=new Fr(this.api,this.sessionId),this.sessionRecorder.start()),this.suggestionManager=new ua(this.api,this.config.siteId,this.sessionId,i),this.suggestionManager.start(),this.feedbackReporter=new fa(this.api),this.feedbackReporter.start(),this.api.get("/api/v1/ml/weights").then(f=>{f.is_learned&&Ns(f.weights)}).catch(()=>{}),this.beforeUnloadHandler=()=>{var g,b,y;(g=this.pageTracker)==null||g.firePageExit();const f=_(this.config.siteId,"session_end");f.session_ms=Date.now()-this.sessionStartTime,(b=this.eventBuffer)==null||b.push(f),(y=this.eventBuffer)==null||y.flush()},window.addEventListener("beforeunload",this.beforeUnloadHandler)}if(this.analyzer=new Pa(this.kb,this.feedbackReporter),this.config.bubbleEnabled&&(this.bubbleManager=new an(this.kb,this.config,this.eventBuffer,i),this.bubbleManager.start(),(o==="support"||o==="combined")&&(this.bubbleManager.setFixed(this.config.bubblePosition),o==="support"?this.bubbleManager.addModifier("guideai-bubble--support"):this.bubbleManager.addModifier("guideai-bubble--combined"))),this.sessionTracker=new Kr(this.config.siteId,this.kb),this.sessionTracker.check(),this.kb){const a=this.bubbleManager?()=>this.bubbleManager.getPosition():void 0;this.chipManager=new jr(this.kb,this.config,this.eventBuffer,i,a,()=>this.activeGuideId!==null),this.chipManager.start()}this.announcementMgr=new Xr(this.api,this.config,this.eventBuffer,i),await this.announcementMgr.init(),o!=="support"&&(this.chatManager=new Bn(this.api,this.config,this.eventBuffer,i),s&&this.chatManager.setHelpSupportEnabled(!0)),this.feedbackRenderer=new Zo(this.config,this.eventBuffer,i),this.surveyRenderer=new ea(this.config,this.eventBuffer,i),this.surveyTrigger=new ra(this.config.siteId,this.surveyRenderer),this.usageFeedbackTrigger=this.config.feedbackAutoPromptEnabled?new na(this.config.siteId,this.feedbackRenderer,{delayMs:this.config.feedbackPromptDelayMs,minPageViews:this.config.feedbackPromptMinPageViews}):null,(t=this.usageFeedbackTrigger)==null||t.onPageView(),this.chatManager&&(this.analyzer&&this.chatManager.setAnalyzer(this.analyzer),this.config.guidesEnabled&&this.chatManager.setGuidePlayerFactory((a,l)=>{this.activeGuideId=a.id,this.saveEphemeralGuide(a);const c=new ot(this.config,this.eventBuffer,i,this.feedbackReporter,this.analyzer);this.activeGuidePlayer=c,c.start(a,0,()=>{var d,u;(d=this.feedbackRenderer)==null||d.show(a.id,a.title),(u=this.surveyTrigger)==null||u.onGuideCompleted(),this.activeGuidePlayer=null,l==null||l()})}),await this.chatManager.init()),s&&(this.supportChat=new ca(this.api,this.config,this.eventBuffer,i),o==="support"?(this.onOpenSupport=()=>{var a;(a=this.supportChat)==null||a.toggle()},document.addEventListener("guideai:bubble-click",this.onOpenSupport)):(this.onOpenSupport=()=>{var a,l;(a=this.chatManager)==null||a.close(),(l=this.supportChat)==null||l.toggle()},document.addEventListener("guideai:open-support",this.onOpenSupport))),window.addEventListener("message",a=>{var l;if(!this.destroyed&&((l=a.data)==null?void 0:l.type)==="guideai:activate-picker"){const c=document.createElement("div");c.style.cssText="position:fixed;inset:0;z-index:2147483647;cursor:crosshair;";const d=document.createElement("div");d.style.cssText="position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);z-index:2147483647;transition:all 0.05s;",document.body.appendChild(c),document.body.appendChild(d);let u=null;const h=m=>{c.style.pointerEvents="none";const f=document.elementFromPoint(m.clientX,m.clientY);if(c.style.pointerEvents="auto",f&&f!==c&&f!==d){u=f;const g=f.getBoundingClientRect();d.style.left=g.left+"px",d.style.top=g.top+"px",d.style.width=g.width+"px",d.style.height=g.height+"px"}},p=m=>{var f,g,b,y,S,v;if(m.preventDefault(),m.stopPropagation(),c.removeEventListener("mousemove",h),c.removeEventListener("click",p),c.remove(),d.remove(),u){const k=this.buildSelector(u),C=u.getBoundingClientRect(),N={selector:k,fingerprint:{total_score:50,tier1_identity:{id:u.id||null,data_testid:u.getAttribute("data-testid")||null,aria_label:u.getAttribute("aria-label")||null,name:u.getAttribute("name")||null,role:u.getAttribute("role")||null},tier2_text:{text_content:(u.textContent||"").slice(0,100),placeholder:u.placeholder||"",title:u.getAttribute("title")||"",alt:u.getAttribute("alt")||"",value:""},tier3_structural:{tag:u.tagName.toLowerCase(),class_list:Array.from(u.classList),href:u.getAttribute("href"),src:u.getAttribute("src"),type:u.getAttribute("type")},tier4_relational:{parent_tag:((f=u.parentElement)==null?void 0:f.tagName.toLowerCase())||"",parent_classes:Array.from(((g=u.parentElement)==null?void 0:g.classList)||[]),nth_child:Array.from(((b=u.parentElement)==null?void 0:b.children)||[]).indexOf(u),sibling_count:((y=u.parentElement)==null?void 0:y.children.length)||0,prev_sibling_tag:((S=u.previousElementSibling)==null?void 0:S.tagName.toLowerCase())||null,next_sibling_tag:((v=u.nextElementSibling)==null?void 0:v.tagName.toLowerCase())||null},tier5_spatial:{x:C.x,y:C.y,width:C.width,height:C.height,viewport_width:window.innerWidth,viewport_height:window.innerHeight}}};window.parent.postMessage({type:"guideai:element-picked",payload:N},"*")}};c.addEventListener("mousemove",h),c.addEventListener("click",p)}}),this.extBridgeHandler=(a=>{if(this.destroyed||!this.shadowRootRef||!this.config.guidesEnabled)return;const{guide:l,stepIndex:c}=a.detail||{};l&&this.startGuide(l,c??0)}),document.addEventListener("guideai:ext-play-guide",this.extBridgeHandler),this.chipClickHandler=(a=>{if(this.destroyed||!this.shadowRootRef||!this.config.guidesEnabled)return;const{guideId:l,stepIndex:c}=a.detail||{};l&&this.playGuideById(l,c??0)}),document.addEventListener("guideai:chip-click",this.chipClickHandler),this.playerEndedHandler=(()=>{this.activeGuideId=null}),document.addEventListener("guideai:player-ended",this.playerEndedHandler),this.config.guidesEnabled&&this.tryAutoResume()}catch(i){typeof console<"u"&&console.warn("[GuideAI] Initialization error:",i)}}track(e,t){this.trackApi.track(e,t)}trackFeature(e,t,i){this.trackApi.trackFeature(e,t,i)}identify(e){this.trackApi.identify(e)}initialize(e){this.trackApi.initializeVisitor(e)}updateOptions(e){this.trackApi.updateOptions(e)}pageLoad(e){var r,s;if(this.destroyed||!this.eventBuffer)return;const t=e?e.startsWith("http")?e:new URL(e,location.origin).href:location.href,i=_(this.config.siteId,"page_view",{page_title:document.title,manual:!0});i.session_id=this.sessionId,i.url=t,this.eventBuffer.push(i),(r=this.liveScanner)==null||r.onPageView(t),(s=this.usageFeedbackTrigger)==null||s.onPageView()}async validateGuideById(e){if(this.destroyed)return{valid:!1,reason:"sdk_destroyed"};const i=(await this.fetchPublishedGuides()).find(r=>r.id===e);return i?!i.steps||i.steps.length===0?{valid:!1,reason:"no_steps"}:i.status!=="published"?{valid:!1,reason:"not_published"}:{valid:!0}:{valid:!1,reason:"not_found"}}async showGuideById(e,t=0){if(this.destroyed||!this.config.guidesEnabled)return!1;const r=(await this.fetchPublishedGuides()).find(s=>s.id===e);return r?(this.startGuide(r,t),!0):!1}async dismissGuide(){const e=this.activeGuidePlayer;if(!e)return!1;try{const t=await e.dismiss("api");return t&&(this.activeGuidePlayer=null,this.activeGuideId=null),t}catch{return this.activeGuidePlayer=null,this.activeGuideId=null,!0}}async flushNow(){var e;if(!this.destroyed)try{await((e=this.eventBuffer)==null?void 0:e.flush())}catch{}}clearSession(){try{sessionStorage.removeItem(`guideai_session_${this.config.siteId}`)}catch{}this.sessionId=this.getOrCreateSessionId(),this.eventSender&&(this.eventSender.sessionId=this.sessionId)}on(e,t){const i=r=>t(r.detail);return document.addEventListener(`guideai:${e}`,i),()=>{document.removeEventListener(`guideai:${e}`,i)}}startRecording(){this.shadowRootRef&&(this.guideRecorder||(this.guideRecorder=new Jo(this.config,this.api,this.eventBuffer,this.shadowRootRef)),this.guideRecorder.startRecording())}stopRecording(){var e;return((e=this.guideRecorder)==null?void 0:e.stopRecording())??[]}cancelRecording(){var e;(e=this.guideRecorder)==null||e.cancelRecording()}async saveGuide(e,t){if(!this.guideRecorder)throw new Error("No recording in progress");return this.guideRecorder.saveGuide(e,t)}destroy(){var e,t,i,r,s,o,a,l,c,d,u,h,p,m,f,g,b,y,S,v,k,C,N,V,He,Ei,Si,Ci;if(this.destroyed=!0,this.eventBuffer){const Ti=_(this.config.siteId,"session_end");Ti.session_ms=Date.now()-this.sessionStartTime,this.eventBuffer.push(Ti)}(e=this.rageClick)==null||e.destroy(),(t=this.deadClick)==null||t.destroy(),(i=this.formError)==null||i.destroy(),(r=this.pageTracker)==null||r.destroy(),(s=this.scrollTracker)==null||s.destroy(),(o=this.engagementTracker)==null||o.destroy(),(a=this.clickTracker)==null||a.destroy(),(l=this.formTracker)==null||l.destroy(),(c=this.errorTracker)==null||c.destroy(),(d=this.performanceTracker)==null||d.destroy(),(u=this.uiErrorObserver)==null||u.destroy(),(h=this.sessionRecorder)==null||h.destroy(),(p=this.guideRecorder)==null||p.destroy(),(m=this.feedbackRenderer)==null||m.destroy(),(f=this.surveyRenderer)==null||f.destroy(),(g=this.usageFeedbackTrigger)==null||g.destroy(),(b=this.suggestionManager)==null||b.destroy(),(y=this.feedbackReporter)==null||y.destroy(),(S=this.analyzer)==null||S.destroy(),this.analyzer=null,this.liveScanner=null,(v=this.chipManager)==null||v.destroy(),(k=this.sessionTracker)==null||k.destroy(),(C=this.announcementMgr)==null||C.destroy(),(N=this.bubbleManager)==null||N.destroy(),(V=this.chatManager)==null||V.destroy(),(He=this.supportChat)==null||He.destroy(),this.onOpenSupport&&(document.removeEventListener("guideai:open-support",this.onOpenSupport),document.removeEventListener("guideai:bubble-click",this.onOpenSupport),this.onOpenSupport=null),this.extBridgeHandler&&(document.removeEventListener("guideai:ext-play-guide",this.extBridgeHandler),this.extBridgeHandler=null),this.chipClickHandler&&(document.removeEventListener("guideai:chip-click",this.chipClickHandler),this.chipClickHandler=null),this.playerEndedHandler&&(document.removeEventListener("guideai:player-ended",this.playerEndedHandler),this.playerEndedHandler=null),(Ei=this.eventBuffer)==null||Ei.flush(),(Si=this.eventBuffer)==null||Si.destroy(),(Ci=this.shadowContainer)==null||Ci.destroy(),this.beforeUnloadHandler&&(window.removeEventListener("beforeunload",this.beforeUnloadHandler),this.beforeUnloadHandler=null)}getOrCreateSessionId(){return Gi(this.config.siteId,this.config.sessionTimeoutMs).id}startGuide(e,t=0){if(this.destroyed||!this.shadowRootRef||!this.config.guidesEnabled||!this.matchesTargeting(e))return;this.activeGuideId=e.id;const i=new ot(this.config,this.eventBuffer,this.shadowRootRef,this.feedbackReporter,this.analyzer);this.activeGuidePlayer=i,i.start(e,t,()=>{var r,s;(r=this.feedbackRenderer)==null||r.show(e.id,e.title),(s=this.surveyTrigger)==null||s.onGuideCompleted(),this.activeGuidePlayer=null})}matchesTargeting(e){var i;if(!e.targeting)return!0;const t=ya({visitor:this.trackApi.getVisitorData()??void 0,account:this.trackApi.getAccountData()??void 0,sessionId:this.sessionId,sessionStartedAt:this.sessionStartTime,pageViews:this.sessionPageViews,features:(i=this.featureFlags)==null?void 0:i.snapshot()});return va(e.targeting,t)}markFeature(e){var t;(t=this.featureFlags)==null||t.mark(e)}async fetchPublishedGuides(){return this.publishedGuidesCache?this.publishedGuidesCache:this.guidesPromise?this.guidesPromise:(this.guidesPromise=(async()=>{try{const e=await this.api.get("/api/v1/guides/published");return this.publishedGuidesCache=e,e}catch{return[]}})(),this.guidesPromise)}async playGuideById(e,t=0){if(this.destroyed||!this.config.guidesEnabled)return;this.activeGuideId=e;const i=this.loadEphemeralGuide(e);if(i){this.startGuide(i,t);return}const r=await this.fetchPublishedGuides();if(this.destroyed)return;const s=r.find(o=>o.id===e);s?this.startGuide(s,t):this.activeGuideId=null}async tryAutoResume(){if(this.destroyed||!this.sessionTracker)return;const e=this.sessionTracker.getState();if(!(e!=null&&e.guide_id))return;const t=e.expected_url;if(!t)return;let i=t;if(!t.startsWith("/"))try{i=new URL(t,location.origin).pathname}catch{i=t}ue(i,location.pathname)&&await this.playGuideById(e.guide_id,e.current_step_index??0)}buildSelector(e){if(e.id)return`#${e.id}`;const t=e.tagName.toLowerCase(),i=e.getAttribute("data-testid");if(i)return`[data-testid="${i}"]`;const r=e.getAttribute("name");if(r)return`${t}[name="${r}"]`;const s=e.parentElement;if(!s)return t;const o=Array.from(s.children).filter(c=>c.tagName===e.tagName);if(o.length===1)return`${this.buildSelector(s)} > ${t}`;const a=o.indexOf(e)+1;return`${this.buildSelector(s)} > ${t}:nth-of-type(${a})`}saveEphemeralGuide(e){const t=`guideai_ephemeral_${this.config.siteId}`;try{sessionStorage.setItem(t,JSON.stringify(e))}catch{}}loadEphemeralGuide(e){const t=`guideai_ephemeral_${this.config.siteId}`;try{const i=sessionStorage.getItem(t);if(!i)return null;const r=JSON.parse(i);if(r.id===e)return r}catch{}return null}}(function(){function n(){const i=document.querySelectorAll("script[data-site-id][data-token]");if(i.length>0)return i[i.length-1];if(document.currentScript&&document.currentScript instanceof HTMLScriptElement){const r=document.currentScript;if(r.getAttribute("data-site-id")&&r.getAttribute("data-token"))return r}return null}function e(){const i=n();if(!i){console.warn("[GuideAI] No script tag found with data-site-id and data-token attributes.");return}try{const r=ne(i),s=new Ra(r),o=window,a=o.guideai,l=Array.isArray(a==null?void 0:a._q)?a._q:[],c={destroy:()=>s.destroy(),track:(d,u)=>s.track(d,u),trackFeature:(d,u,h)=>s.trackFeature(d,u,h),identify:d=>s.identify(d),initialize:d=>s.initialize(d),updateOptions:d=>s.updateOptions(d),pageLoad:d=>s.pageLoad(d),validateGuideById:d=>s.validateGuideById(d),showGuideById:(d,u)=>s.showGuideById(d,u),dismissGuide:()=>s.dismissGuide(),flushNow:()=>s.flushNow(),clearSession:()=>s.clearSession(),on:(d,u)=>s.on(d,u),startRecording:()=>s.startRecording(),stopRecording:()=>s.stopRecording(),cancelRecording:()=>s.cancelRecording(),saveGuide:(d,u)=>s.saveGuide(d,u),showNPSSurvey:d=>s.showNPSSurvey(d),showCSATSurvey:d=>s.showCSATSurvey(d),markFeature:d=>s.markFeature(d),_q:[],_loaded:!0};o.guideai=c,o.__guideai=c,s.init().then(()=>{t(c,l)}).catch(d=>{console.warn("[GuideAI] Initialization failed:",d),t(c,l)})}catch(r){console.warn("[GuideAI] Configuration error:",r)}}function t(i,r){for(const s of r){if(!Array.isArray(s)||s.length===0)continue;const[o,...a]=s,l=i[o];if(typeof l=="function")try{l.apply(i,a)}catch(c){console.warn("[GuideAI] queued call failed:",o,c)}}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e,{once:!0}):Promise.resolve().then(e)})()})();
