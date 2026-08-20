const ComerciantePage=()=>{
 const form=document.querySelector("[data-merchant-form]");
 if(form)form.addEventListener("submit",e=>{e.preventDefault();alert("Salvo localmente! Depois conectaremos ao Firebase/Supabase.");Router.go("minhasOfertas")});
 const story=document.querySelector("[data-story-form]");
 if(story)story.addEventListener("submit",e=>{e.preventDefault();alert("Story criado!");Router.go("home")});
 const list=document.querySelector("[data-my-offers]");
 if(list)list.innerHTML=mockOffers.slice(0,3).map(o=>`<div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><b>${o.icon} ${o.name}</b><div class="offer-meta">R$ ${o.price}</div></div><span class="badge">Ativa</span></div>`).join("");
};
