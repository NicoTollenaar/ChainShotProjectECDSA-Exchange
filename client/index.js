import "./index.scss";
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if(value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const privateKey = document.getElementById("privateKey").value;
  const key = ec.keyFromPrivate(privateKey);
  const transaction = JSON.stringify({
    sender, amount, recipient
  });
  const msgHash = SHA256(transaction).toString();
  const signature = key.sign(msgHash);
  const body = JSON.stringify({
    sender, amount, recipient, msgHash, signature
  });
  console.log("transaction:", transaction);
  console.log("msgHash:", msgHash);
  console.log("signature:", signature);
  console.log("body:", body);

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    const responseJSON = response.json();
    console.log("response:", response);
    console.log("response.json:", responseJSON);
    return responseJSON;
  }).then(({ balance, message }) => {
    console.log(balance, message);
    document.getElementById("balance").innerHTML = balance;
    document.getElementById("authentication").innerHTML = message;
    setTimeout(()=> {
    document.getElementById("authentication").innerHTML = "";
    }, 2000);
  });
});
