import{S as he,i as ce,s as me,y as Z,a as k,k as b,q as A,L as _e,z as y,h as _,c as w,l as E,m as $,r as B,n as L,A as x,b as G,D as f,u as W,g as ee,d as te,B as ae,K as de,J as pe,M as ie,N as fe}from"../chunks/index.6a8785a2.js";import{p as ue}from"../chunks/stores.adaf6f52.js";import{O as ge,a as ve}from"../chunks/OpenGraphHeadHtml.591f5ad6.js";function ne(d,e,l){const t=d.slice();return t[2]=e[l][0],t[3]=e[l][1],t}function le(d,e,l){const t=d.slice();return t[3]=e[l],t}function oe(d){let e,l,t=d[3]+"",h;return{c(){e=b("li"),l=new ie(!1),h=k(),this.h()},l(i){e=E(i,"LI",{});var o=$(e);l=fe(o,!1),h=w(o),o.forEach(_),this.h()},h(){l.a=h},m(i,o){G(i,e,o),l.m(t,e),f(e,h)},p(i,o){o&1&&t!==(t=i[3]+"")&&l.p(t)},d(i){i&&_(e)}}}function se(d){let e,l,t,h,i,o=Object.entries(d[0].adderInfo.options),s=[];for(let r=0;r<o.length;r+=1)s[r]=re(ne(d,o,r));return{c(){e=b("div"),l=b("h2"),t=A("Adder options"),h=k(),i=b("ul");for(let r=0;r<s.length;r+=1)s[r].c();this.h()},l(r){e=E(r,"DIV",{class:!0});var c=$(e);l=E(c,"H2",{class:!0});var a=$(l);t=B(a,"Adder options"),a.forEach(_),h=w(c),i=E(c,"UL",{});var I=$(i);for(let D=0;D<s.length;D+=1)s[D].l(I);I.forEach(_),c.forEach(_),this.h()},h(){L(l,"class","text-center"),L(e,"class","box")},m(r,c){G(r,e,c),f(e,l),f(l,t),f(e,h),f(e,i);for(let a=0;a<s.length;a+=1)s[a]&&s[a].m(i,null)},p(r,c){if(c&1){o=Object.entries(r[0].adderInfo.options);let a;for(a=0;a<o.length;a+=1){const I=ne(r,o,a);s[a]?s[a].p(I,c):(s[a]=re(I),s[a].c(),s[a].m(i,null))}for(;a<s.length;a+=1)s[a].d(1);s.length=o.length}},d(r){r&&_(e),de(s,r)}}}function re(d){let e,l,t=d[2]+"",h,i,o,s=d[3].descriptionMarkdown+"",r;return{c(){e=b("li"),l=b("code"),h=A(t),i=k(),o=new ie(!1),r=k(),this.h()},l(c){e=E(c,"LI",{});var a=$(e);l=E(a,"CODE",{});var I=$(l);h=B(I,t),I.forEach(_),i=w(a),o=fe(a,!1),r=w(a),a.forEach(_),this.h()},h(){o.a=r},m(c,a){G(c,e,a),f(e,l),f(l,h),f(e,i),o.m(s,e),f(e,r)},p(c,a){a&1&&t!==(t=c[2]+"")&&W(h,t),a&1&&s!==(s=c[3].descriptionMarkdown+"")&&o.p(s)},d(c){c&&_(e)}}}function Ie(d){let e,l,t,h,i,o,s=d[0].adderInfo.name+"",r,c,a=d[0].adderInfo.emoji+"",I,D,j,M,z,J,T,K,N=Object.keys(d[0].adderInfo.options).length>0,S,H,U,P,F,V;e=new ge({props:{pageTitle:d[0].adderInfo.name+" - svelte add",pageDescription:"Add "+d[0].adderInfo.name+" to your svelte project",ogBaseUrl:"/adders/"+d[1].params.adder}}),h=new ve({props:{spanText:d[0].adderInfo.name+" "+d[0].adderInfo.emoji}});let q=d[0].adderInfo.usageMarkdown,p=[];for(let n=0;n<q.length;n+=1)p[n]=oe(le(d,q,n));let g=N&&se(d);return{c(){Z(e.$$.fragment),l=k(),t=b("div"),Z(h.$$.fragment),i=k(),o=b("h1"),r=A(s),c=k(),I=A(a),D=k(),j=b("div"),M=b("h2"),z=A("Benefits"),J=k(),T=b("ul");for(let n=0;n<p.length;n+=1)p[n].c();K=k(),g&&g.c(),S=k(),H=b("div"),U=b("h2"),P=A("Installation"),F=A(`
		tbd`),this.h()},l(n){const v=_e("svelte-1e16nab",document.head);y(e.$$.fragment,v),v.forEach(_),l=w(n),t=E(n,"DIV",{});var m=$(t);y(h.$$.fragment,m),i=w(m),o=E(m,"H1",{class:!0});var O=$(o);r=B(O,s),c=w(O),I=B(O,a),O.forEach(_),D=w(m),j=E(m,"DIV",{class:!0});var u=$(j);M=E(u,"H2",{class:!0});var C=$(M);z=B(C,"Benefits"),C.forEach(_),J=w(u),T=E(u,"UL",{});var X=$(T);for(let R=0;R<p.length;R+=1)p[R].l(X);X.forEach(_),u.forEach(_),K=w(m),g&&g.l(m),S=w(m),H=E(m,"DIV",{class:!0});var Q=$(H);U=E(Q,"H2",{class:!0});var Y=$(U);P=B(Y,"Installation"),Y.forEach(_),F=B(Q,`
		tbd`),Q.forEach(_),m.forEach(_),this.h()},h(){L(o,"class","text-center"),L(M,"class","text-center"),L(j,"class","box"),L(U,"class","text-center"),L(H,"class","box")},m(n,v){x(e,document.head,null),G(n,l,v),G(n,t,v),x(h,t,null),f(t,i),f(t,o),f(o,r),f(o,c),f(o,I),f(t,D),f(t,j),f(j,M),f(M,z),f(j,J),f(j,T);for(let m=0;m<p.length;m+=1)p[m]&&p[m].m(T,null);f(t,K),g&&g.m(t,null),f(t,S),f(t,H),f(H,U),f(U,P),f(H,F),V=!0},p(n,[v]){const m={};v&1&&(m.pageTitle=n[0].adderInfo.name+" - svelte add"),v&1&&(m.pageDescription="Add "+n[0].adderInfo.name+" to your svelte project"),v&2&&(m.ogBaseUrl="/adders/"+n[1].params.adder),e.$set(m);const O={};if(v&1&&(O.spanText=n[0].adderInfo.name+" "+n[0].adderInfo.emoji),h.$set(O),(!V||v&1)&&s!==(s=n[0].adderInfo.name+"")&&W(r,s),(!V||v&1)&&a!==(a=n[0].adderInfo.emoji+"")&&W(I,a),v&1){q=n[0].adderInfo.usageMarkdown;let u;for(u=0;u<q.length;u+=1){const C=le(n,q,u);p[u]?p[u].p(C,v):(p[u]=oe(C),p[u].c(),p[u].m(T,null))}for(;u<p.length;u+=1)p[u].d(1);p.length=q.length}v&1&&(N=Object.keys(n[0].adderInfo.options).length>0),N?g?g.p(n,v):(g=se(n),g.c(),g.m(t,S)):g&&(g.d(1),g=null)},i(n){V||(ee(e.$$.fragment,n),ee(h.$$.fragment,n),V=!0)},o(n){te(e.$$.fragment,n),te(h.$$.fragment,n),V=!1},d(n){ae(e),n&&_(l),n&&_(t),ae(h),de(p,n),g&&g.d()}}}function be(d,e,l){let t;pe(d,ue,i=>l(1,t=i));let{data:h}=e;return d.$$set=i=>{"data"in i&&l(0,h=i.data)},[h,t]}class we extends he{constructor(e){super(),ce(this,e,be,Ie,me,{data:0})}}export{we as component};