import{a as s,r as l}from"./store.66e1840b.js";async function a(){const o=await fetch("https://sso.melo.se/application/o/emqx/.well-known/openid-configuration");if(!o.ok)throw new Error("Failed to fetch OIDC configuration");return o.json()}async function g(e,o,n){const t=(await a()).token_endpoint,c=new URLSearchParams({grant_type:"authorization_code",code:e,redirect_uri:o,client_id:n}),u=await fetch(t,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:c.toString()});if(!u.ok)throw new Error("Failed to exchange authorization code for token");return u.json()}async function w(e,o){const r=(await a()).token_endpoint,t=new URLSearchParams({grant_type:"refresh_token",refresh_token:e,client_id:o}),c=await fetch(r,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:t.toString()});if(!c.ok)throw new Error("Failed to refresh access token");return c.json()}async function m(e){const o=await a(),n=await fetch(o.userinfo_endpoint,{method:"POST",headers:{Authorization:`Bearer ${e}`}});if(!n.ok)throw new Error("Failed to fetch user information");return await n.json()}let d="pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8",i=typeof window<"u"?window.location.href.split("?")[0]:"";function f(e){let o;return e.subscribe(r=>{o=r})(),o}async function b(){s.set(null),l.set(null);try{const e=await a();if(e.end_session_endpoint){const o=`${e.end_session_endpoint}?client_id=${d}&post_logout_redirect_uri=${encodeURIComponent(i)}`;window.location.href=o}else window.location.href=i}catch(e){console.error("Error during logout",e),window.location.href=i}}async function h(){const e=f(s);return!e||p(e)?await E():{loading:!1,loginError:!1}}function p(e){const n=JSON.parse(atob(e.split(".")[1])).exp*1e3;return Date.now()>n}async function k(){const e=f(l);if(e)try{const o=await w(e,d);if(o.access_token)return s.set(o.access_token),l.set(o.refresh_token),console.log("Access token refreshed"),{loading:!1,loginError:!1}}catch(o){return console.error("Error refreshing access token",o),console.log(o),{loading:!1,loginError:"Error refreshing access token"}}return{loading:!1,loginError:"No refresh token"}}async function _(){if(typeof window<"u"){const e=new URLSearchParams(window.location.search),o=e.get("code"),n=e.get("state");if(o&&n)try{const r=await g(o,i,d);s.set(r.access_token),l.set(r.refresh_token),console.log("Token exchange successful");let t=document.location.href;return window.history.replaceState({},"",t.split("?")[0]),{loading:!1,loginError:!1}}catch(r){return console.error("Error during token exchange",r),{loading:!1,loginError:"Error during token exchange"}}else return console.log("Couldn't login"),{loading:!1,loginError:"Missing state or code"}}return{loading:!1,loginError:"No window context"}}async function y(){if(typeof window<"u")try{const e=await a(),o="openid profile offline_access",n="code",r=Math.random().toString(36).substring(7),t=`${e.authorization_endpoint}?response_type=${n}&client_id=${d}&redirect_uri=${i}&scope=${o}&state=${r}`;return window.location.replace(t),{loading:!0,loginError:!1}}catch(e){return console.log(e),{loading:!1,loginError:"Error getting OIDC"}}return{loading:!1,loginError:"No window context"}}async function E(){const e=await k(),o=f(s);return!e.loading&&!o?typeof window<"u"&&window.location.search.includes("code=")?await _():await y():{loading:!1,loginError:!1}}async function x(){return(await h()).loading?{loading:!0,loginError:!1}:{accessToken:f(s),loading:!1,loginError:!1}}export{m as f,x as g,b as l,y as s};