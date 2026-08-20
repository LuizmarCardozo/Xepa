const PerfilPage=()=>{
 const u=Auth.user||{name:"Visitante",email:"Faça login para continuar",type:"cliente"};
 const el=document.querySelector("[data-profile]");
 if(el)el.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:55px">👤</div><h2>${u.name}</h2><p class="subtitle">${u.email}</p><span class="badge">${u.type==="comerciante"?"Comerciante":"Cliente"}</span></div>
 ${u.type==="comerciante"?'<button class="btn btn-secondary btn-full" style="margin-top:12px" onclick="Router.go(\'minhasOfertas\')">Painel do comerciante</button>':''}
 <button class="btn btn-outline btn-full" style="margin-top:12px" onclick="Auth.logout()">Sair</button>`;
};
