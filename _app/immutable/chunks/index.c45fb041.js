var J=Object.defineProperty;var K=(t,e,n)=>e in t?J(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var D=(t,e,n)=>(K(t,typeof e!="symbol"?e+"":e,n),n);import{n as w,r as v,i as I,f as R,j as Q,k as O,l as X,m as Y,p as Z,q as tt,v as q,w as et,x as nt,y as it}from"./scheduler.f9c04a13.js";const T=typeof window<"u";let rt=T?()=>window.performance.now():()=>Date.now(),L=T?t=>requestAnimationFrame(t):w;const g=new Set;function F(t){g.forEach(e=>{e.c(t)||(g.delete(e),e.f())}),g.size!==0&&L(F)}function st(t){let e;return g.size===0&&L(F),{promise:new Promise(n=>{g.add(e={c:t,f:n})}),abort(){g.delete(e)}}}let S=!1;function lt(){S=!0}function at(){S=!1}function ot(t,e,n,i){for(;t<e;){const o=t+(e-t>>1);n(o)<=i?t=o+1:e=o}return t}function ut(t){if(t.hydrate_init)return;t.hydrate_init=!0;let e=t.childNodes;if(t.nodeName==="HEAD"){const r=[];for(let a=0;a<e.length;a++){const _=e[a];_.claim_order!==void 0&&r.push(_)}e=r}const n=new Int32Array(e.length+1),i=new Int32Array(e.length);n[0]=-1;let o=0;for(let r=0;r<e.length;r++){const a=e[r].claim_order,_=(o>0&&e[n[o]].claim_order<=a?o+1:ot(1,o,m=>e[n[m]].claim_order,a))-1;i[r]=n[_]+1;const c=_+1;n[c]=r,o=Math.max(c,o)}const u=[],l=[];let s=e.length-1;for(let r=n[o]+1;r!=0;r=i[r-1]){for(u.push(e[r-1]);s>=r;s--)l.push(e[s]);s--}for(;s>=0;s--)l.push(e[s]);u.reverse(),l.sort((r,a)=>r.claim_order-a.claim_order);for(let r=0,a=0;r<l.length;r++){for(;a<u.length&&l[r].claim_order>=u[a].claim_order;)a++;const _=a<u.length?u[a]:null;t.insertBefore(l[r],_)}}function ct(t,e){t.appendChild(e)}function H(t){if(!t)return document;const e=t.getRootNode?t.getRootNode():t.ownerDocument;return e&&e.host?e:t.ownerDocument}function ft(t){const e=G("style");return e.textContent="/* empty */",_t(H(t),e),e.sheet}function _t(t,e){return ct(t.head||t,e),e.sheet}function dt(t,e){if(S){for(ut(t),(t.actual_end_child===void 0||t.actual_end_child!==null&&t.actual_end_child.parentNode!==t)&&(t.actual_end_child=t.firstChild);t.actual_end_child!==null&&t.actual_end_child.claim_order===void 0;)t.actual_end_child=t.actual_end_child.nextSibling;e!==t.actual_end_child?(e.claim_order!==void 0||e.parentNode!==t)&&t.insertBefore(e,t.actual_end_child):t.actual_end_child=e.nextSibling}else(e.parentNode!==t||e.nextSibling!==null)&&t.appendChild(e)}function Pt(t,e,n){S&&!n?dt(t,e):(e.parentNode!==t||e.nextSibling!=n)&&t.insertBefore(e,n||null)}function k(t){t.parentNode&&t.parentNode.removeChild(t)}function G(t){return document.createElement(t)}function mt(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function M(t){return document.createTextNode(t)}function Rt(){return M(" ")}function It(){return M("")}function Lt(t,e,n,i){return t.addEventListener(e,n,i),()=>t.removeEventListener(e,n,i)}function Mt(t,e,n){n==null?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function Ot(t){return t.dataset.svelteH}function qt(t){return t===""?null:+t}function ht(t){return Array.from(t.childNodes)}function pt(t){t.claim_info===void 0&&(t.claim_info={last_index:0,total_claimed:0})}function U(t,e,n,i,o=!1){pt(t);const u=(()=>{for(let l=t.claim_info.last_index;l<t.length;l++){const s=t[l];if(e(s)){const r=n(s);return r===void 0?t.splice(l,1):t[l]=r,o||(t.claim_info.last_index=l),s}}for(let l=t.claim_info.last_index-1;l>=0;l--){const s=t[l];if(e(s)){const r=n(s);return r===void 0?t.splice(l,1):t[l]=r,o?r===void 0&&t.claim_info.last_index--:t.claim_info.last_index=l,s}}return i()})();return u.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1,u}function V(t,e,n,i){return U(t,o=>o.nodeName===e,o=>{const u=[];for(let l=0;l<o.attributes.length;l++){const s=o.attributes[l];n[s.name]||u.push(s.name)}u.forEach(l=>o.removeAttribute(l))},()=>i(e))}function zt(t,e,n){return V(t,e,n,G)}function Tt(t,e,n){return V(t,e,n,mt)}function $t(t,e){return U(t,n=>n.nodeType===3,n=>{const i=""+e;if(n.data.startsWith(i)){if(n.data.length!==i.length)return n.splitText(i.length)}else n.data=i},()=>M(e),!0)}function Ft(t){return $t(t," ")}function Ht(t,e){e=""+e,t.data!==e&&(t.data=e)}function kt(t,e){t.value=e??""}function Gt(t,e,n,i){n==null?t.style.removeProperty(e):t.style.setProperty(e,n,i?"important":"")}function Ut(t,e,n){t.classList.toggle(e,!!n)}function yt(t,e,{bubbles:n=!1,cancelable:i=!1}={}){return new CustomEvent(t,{detail:e,bubbles:n,cancelable:i})}function Vt(t,e){return new t(e)}const E=new Map;let A=0;function gt(t){let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0}function xt(t,e){const n={stylesheet:ft(e),rules:{}};return E.set(t,n),n}function z(t,e,n,i,o,u,l,s=0){const r=16.666/i;let a=`{
`;for(let d=0;d<=1;d+=r){const y=e+(n-e)*u(d);a+=d*100+`%{${l(y,1-y)}}
`}const _=a+`100% {${l(n,1-n)}}
}`,c=`__svelte_${gt(_)}_${s}`,m=H(t),{stylesheet:$,rules:f}=E.get(m)||xt(m,t);f[c]||(f[c]=!0,$.insertRule(`@keyframes ${c} ${_}`,$.cssRules.length));const h=t.style.animation||"";return t.style.animation=`${h?`${h}, `:""}${c} ${i}ms linear ${o}ms 1 both`,A+=1,c}function wt(t,e){const n=(t.style.animation||"").split(", "),i=n.filter(e?u=>u.indexOf(e)<0:u=>u.indexOf("__svelte")===-1),o=n.length-i.length;o&&(t.style.animation=i.join(", "),A-=o,A||vt())}function vt(){L(()=>{A||(E.forEach(t=>{const{ownerNode:e}=t.stylesheet;e&&k(e)}),E.clear())})}let x;function bt(){return x||(x=Promise.resolve(),x.then(()=>{x=null})),x}function P(t,e,n){t.dispatchEvent(yt(`${e?"intro":"outro"}${n}`))}const N=new Set;let p;function Wt(){p={r:0,c:[],p}}function Jt(){p.r||v(p.c),p=p.p}function Nt(t,e){t&&t.i&&(N.delete(t),t.i(e))}function Kt(t,e,n,i){if(t&&t.o){if(N.has(t))return;N.add(t),p.c.push(()=>{N.delete(t),i&&(n&&t.d(1),i())}),t.o(e)}else i&&i()}const Et={duration:0};function Qt(t,e,n,i){let u=e(t,n,{direction:"both"}),l=i?0:1,s=null,r=null,a=null,_;function c(){a&&wt(t,a)}function m(f,h){const d=f.b-l;return h*=Math.abs(d),{a:l,b:f.b,d,duration:h,start:f.start,end:f.start+h,group:f.group}}function $(f){const{delay:h=0,duration:d=300,easing:y=Q,tick:C=w,css:j}=u||Et,B={start:rt()+h,b:f};f||(B.group=p,p.r+=1),"inert"in t&&(f?_!==void 0&&(t.inert=_):(_=t.inert,t.inert=!0)),s||r?r=B:(j&&(c(),a=z(t,l,f,d,h,y,j)),f&&C(0,1),s=m(B,d),R(()=>P(t,f,"start")),st(b=>{if(r&&b>r.start&&(s=m(r,d),r=null,P(t,s.b,"start"),j&&(c(),a=z(t,l,s.b,s.duration,0,y,u.css))),s){if(b>=s.end)C(l=s.b,1-l),P(t,s.b,"end"),r||(s.b?c():--s.group.r||v(s.group.c)),s=null;else if(b>=s.start){const W=b-s.start;l=s.a+s.d*y(W/s.duration),C(l,1-l)}}return!!(s||r)}))}return{run(f){I(u)?bt().then(()=>{u=u({direction:f?"in":"out"}),$(f)}):$(f)},end(){c(),s=r=null}}}function Xt(t,e,n){const i=t.$$.props[e];i!==void 0&&(t.$$.bound[i]=n,n(t.$$.ctx[i]))}function Yt(t){t&&t.c()}function Zt(t,e){t&&t.l(e)}function At(t,e,n){const{fragment:i,after_update:o}=t.$$;i&&i.m(e,n),R(()=>{const u=t.$$.on_mount.map(et).filter(I);t.$$.on_destroy?t.$$.on_destroy.push(...u):v(u),t.$$.on_mount=[]}),o.forEach(R)}function St(t,e){const n=t.$$;n.fragment!==null&&(Z(n.after_update),v(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function Ct(t,e){t.$$.dirty[0]===-1&&(nt.push(t),it(),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function te(t,e,n,i,o,u,l=null,s=[-1]){const r=tt;q(t);const a=t.$$={fragment:null,ctx:[],props:u,update:w,not_equal:o,bound:O(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(e.context||(r?r.$$.context:[])),callbacks:O(),dirty:s,skip_bound:!1,root:e.target||r.$$.root};l&&l(a.root);let _=!1;if(a.ctx=n?n(t,e.props||{},(c,m,...$)=>{const f=$.length?$[0]:m;return a.ctx&&o(a.ctx[c],a.ctx[c]=f)&&(!a.skip_bound&&a.bound[c]&&a.bound[c](f),_&&Ct(t,c)),m}):[],a.update(),_=!0,v(a.before_update),a.fragment=i?i(a.ctx):!1,e.target){if(e.hydrate){lt();const c=ht(e.target);a.fragment&&a.fragment.l(c),c.forEach(k)}else a.fragment&&a.fragment.c();e.intro&&Nt(t.$$.fragment),At(t,e.target,e.anchor),at(),X()}q(r)}class ee{constructor(){D(this,"$$");D(this,"$$set")}$destroy(){St(this,1),this.$destroy=w}$on(e,n){if(!I(n))return w;const i=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return i.push(n),()=>{const o=i.indexOf(n);o!==-1&&i.splice(o,1)}}$set(e){this.$$set&&!Y(e)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1)}}const jt="4";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(jt);export{Qt as A,Xt as B,kt as C,qt as D,mt as E,Tt as F,Ut as G,ee as S,Pt as a,Jt as b,Ft as c,Nt as d,It as e,k as f,G as g,zt as h,te as i,ht as j,Mt as k,Gt as l,M as m,$t as n,Ht as o,Wt as p,Vt as q,Yt as r,Rt as s,Kt as t,Zt as u,At as v,St as w,dt as x,Ot as y,Lt as z};
