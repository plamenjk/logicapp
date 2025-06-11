let token = null;
const pkgList = document.getElementById('packages');

document.getElementById('registerForm').onsubmit = async e => {
  e.preventDefault();
  const username = regUsername.value;
  const password = regPassword.value;
  const role = regRole.value;
  await fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password,role})});
  alert('Registered');
};

document.getElementById('loginForm').onsubmit = async e => {
  e.preventDefault();
  const username = logUsername.value;
  const password = logPassword.value;
  const res = await fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  const data = await res.json();
  token = data.token;
  document.getElementById('auth').style.display='none';
  document.getElementById('main').style.display='block';
  loadPackages();
};

async function loadPackages(){
  const res = await fetch('/packages',{headers:{'Authorization':token}});
  const data = await res.json();
  pkgList.innerHTML='';
  data.forEach(p=>{
    const li=document.createElement('li');
    li.textContent = p.id+': '+p.weight+'kg to '+(p.toOffice?'office':'address');
    pkgList.appendChild(li);
  });
}

document.getElementById('pkgForm').onsubmit = async e => {
  e.preventDefault();
  const body={senderId:senderId.value,receiverId:receiverId.value,weight:+weight.value,toOffice:toOffice.checked,address:address.value};
  await fetch('/packages',{method:'POST',headers:{'Content-Type':'application/json','Authorization':token},body:JSON.stringify(body)});
  loadPackages();
};
