import server from "./server";

import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";

function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  async function onChange(evt) {
    const privateKey = evt.target.value;
    setPrivateKey(privateKey);
    const address = privateKeyToAddress(privateKey);
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  async function newWallet() {
    let privateKey = secp.utils.randomPrivateKey();
    let publicKey = secp.getPublicKey(privateKey);
    let address = getAddressFromPublicKey(publicKey);
    setPrivateKey(toHex(privateKey));
    setAddress(address);
    let [signature, recovery] = await secp.sign(hashMessage("register"), privateKey, { recovered: true });
    const {
      data: { balance },
    } = await server.post(`register`, {
      signature: toHex(signature),
      recovery
    });
    setBalance(balance);
  }

  function hashMessage(message) {
    return keccak256(utf8ToBytes(message));
  }

  function privateKeyToAddress(privateKey) {
    let address = secp.getPublicKey(privateKey);
    return toHex(keccak256(address.slice(1)).slice(-20));
  }

  function getAddressFromPublicKey(publicKey) {
    return toHex(keccak256(publicKey.slice(1)).slice(-20));
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <button onClick={newWallet}>
        Generate New Wallet
      </button>

      <label>
        Private Key of Wallet
        <input placeholder="Type the Private key for a wallet" value={privateKey} onChange={onChange}></input>
      </label>

      <label>
        Wallet Address: {address}
      </label>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
