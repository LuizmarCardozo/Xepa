const OfertasPage=()=>{
 const list=document.querySelector("[data-offers]");
 if(list)list.innerHTML=mockOffers.map(o=>Components.offer(o)).join("");
};
const ProdutoPage=()=>{
 const o=mockOffers[0];
 document.querySelector("[data-product]").innerHTML=`<div class="card"><div class="offer-image" style="height:210px">${o.icon}</div><h1 style="margin-top:15px;color:var(--verde-escuro)">${o.name}</h1><p class="subtitle">${o.feira}</p><div class="price">R$ ${o.price} / ${o.unit}</div><p style="margin:15px 0;color:var(--cinza)">Oferta disponível enquanto durarem os estoques.</p><button class="btn btn-primary btn-full" onclick="alert('Produto adicionado!')">Tenho interesse</button></div>`;
};
const FeiraPage=()=>{
 const el=document.querySelector("[data-feiras]");
 if(el)el.innerHTML=[["Feira Central","📍","1,2 km"],["Feira do João","🧺","2,5 km"],["Feira São José","🏪","4,1 km"]].map(f=>`<div class="card feira-card" style="margin-bottom:10px"><div class="feira-icon">${f[1]}</div><div><b>${f[0]}</b><div class="offer-meta">${f[2]} de você</div></div></div>`).join("");
};
