const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {};

app.post("/register", (req, res) => {
  const { signature, recovery } = req.body;

  let sender = getSenderFromRequest("register", signature, recovery);

  if (sender in balances) {
    res.status(400).send({ message: "Account already registered" });
  }
  balances[sender] = 10;
  res.send({ balance: balances[sender] });
});

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { recipient, amount, signature, recovery } = req.body;

  let sender = getSenderFromRequest(
    JSON.stringify({ recipient: recipient, amount: amount }),
    signature,
    recovery
  );

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

/**
 * Hash the message
 * @param {string} message
 */
function hashMessage(message) {
  return keccak256(utf8ToBytes(message));
}

/**
 * Get the sender from the signature of the message
 * @param {string} msg Message being sent
 * @param {string} signature Signature attached to message
 * @param {number} recovery Recovery bit
 * @returns Address as a string
 */
function getSenderFromRequest(msg, signature, recovery) {
  let publicKey = secp.recoverPublicKey(hashMessage(msg), signature, recovery);
  return getAddressFromPublicKey(publicKey);
}

/**
 * Get string address from public key
 * @param {Uint8Array} publicKey Int array of a public key
 * @returns Address associated to public key
 */
function getAddressFromPublicKey(publicKey) {
  return toHex(keccak256(publicKey.slice(1)).slice(-20));
}
