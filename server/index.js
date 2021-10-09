const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
// const SHA256 = require('crypto-js/sha256');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

// Generate and log accounts
let ec = new EC('secp256k1');

class Address {
  constructor (accountHolder, privateKey, publicX, publicY, balance) {
    this.accountHolder = accountHolder;
    this.privateKey = privateKey;
    this.publicX = publicX;
    this.publicY = publicY;
    this.balance = balance;
  }
}

let accounts = [];
const balances = {
  // "1": 100,
  // "2": 50,
  // "3": 75,
}

function generateAccounts(numberOfAccounts) {
  for (let i = 0; i < numberOfAccounts; i++) {
    let accountHolder = i;
    let key = ec.genKeyPair();
    let privateKey = key.getPrivate().toString(16);
    let publicX = key.getPublic().x.toString(16);
    let publicY = key.getPublic().y.toString(16);
    let balance = Math.floor(Math.random()*100);
    accounts[i] = new Address(accountHolder, privateKey, publicX, publicY, balance);
  }
}

function logAccounts (accounts) {
    console.log("\n", "\n");
    console.log("BALANCES:", "\n");
    for (let i = 0; i < accounts.length; i++) {
      console.log("Accountholder:", accounts[i].accountHolder);
      console.log("PublicX:", accounts[i].publicX);
      console.log("PublicY:", accounts[i].publicY);
      console.log("Balance:", accounts[i].balance, "\n");
    }
    console.log("PRIVATE KEYS:", "\n");
    for (let i = 0; i < accounts.length; i++) {
      console.log("Accountholder:", accounts[i].accountHolder);
      console.log("PublicX:", accounts[i].publicX);
      console.log("PublicY:", accounts[i].publicY);
      console.log("Private Key:", accounts[i].privateKey, "\n");
    }
}

function assignBalances (accounts) {
  for (let i = 0; i < accounts.length; i++) {
    balances[`${accounts[i].accountHolder}`] = accounts[i].balance;
  }
}

generateAccounts(3);
assignBalances(accounts);
logAccounts(accounts);

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', authenticationMiddleware, (req, res) => {
  const {sender, recipient, amount, msgHash, signature} = req.body;
  console.log("req.body:", req.body);
  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender], message: "Transaction approved!"});
});

function authenticationMiddleware (req, res, next) {
  const sender = req.body.sender;
  const publicKeySender = {
  x: accounts[sender].publicX,
  y: accounts[sender].publicY
  }
  const key = ec.keyFromPublic(publicKeySender, 'hex');
  const msgHash = req.body.msgHash.toString();
  const signature = {
    r: req.body.signature.r,
    s: req.body.signature.s
  }
  console.log("signature:", signature);
  console.log("msgHash:", msgHash);
  console.log(key.verify(msgHash, signature));
  if (key.verify(msgHash, signature) === true) {
    next();
  } else {
    res.json({balance: accounts[sender].balance, message: "Authentication failed!"});
  }
}

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
