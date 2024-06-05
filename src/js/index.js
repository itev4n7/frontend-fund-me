import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.0/ethers.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connect-button");
const fundButton = document.getElementById("fund");
const withdrawButton = document.getElementById("withdraw");
const inputWrapper = document.getElementById("input-wrapper");
connectButton.onclick = connect;
fundButton.onclick = fund;
withdrawButton.onclick = withdraw;

console.log("ethers", ethers);

document.addEventListener("DOMContentLoaded", (event) => {
  return new Promise(async (resolve) => {
    if (window.ethereum) {
      const wallets = await window.ethereum.request({
        method: "wallet_getPermissions",
      });
      if (wallets[0]) {
        document.getElementById("connect-button").innerText = "Connected";
      }
    }
    await updateContentBalance();
    resolve();
  });
});

async function connect() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("metamask connected!");
      document.getElementById("connect-button").innerText = "Connected";
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log("metamask is not detected!");
    document.getElementById("connect-button").innerText = "Metamask required";
  }
}

async function fund() {
  const ethAmount = document.getElementById("ethAmount").value.trim();
  console.log(ethAmount.toString());
  if (!ethAmount || parseFloat(ethAmount.toString()) <= 0.03) {
    inputWrapper.classList.add("error");
    return;
  }
  inputWrapper.classList.remove("error");
  if (window.ethereum) {
    console.log(`Fundting with ${ethAmount} ETH`);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log("signer", signer);
    const contract = new ethers.Contract(contractAddress, abi, signer);
    console.log("contract", contract);
    const txParams = {
      from: signer,
      value: ethers.parseEther(ethAmount.toString()),
    };
    try {
      const txResponce = await contract.getFunction("fund")(txParams);
      await listenForTransactionMine(txResponce, provider);
      await updateContentBalance();
      console.log("Done!");
    } catch (error) {
      console.error(error);
    }
  }
}

async function withdraw() {
  if (window.ethereum) {
    console.log("Withdrawing funded ETH...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log("signer", signer);
    const contract = new ethers.Contract(contractAddress, abi, signer);
    console.log("contract", contract);
    try {
      const txResponce = await contract.getFunction("withdraw")();
      await listenForTransactionMine(txResponce, provider);
      await updateContentBalance();
      console.log("Done!");
    } catch (error) {
      console.error(error);
    }
  }
}

function listenForTransactionMine(txResponce, provider) {
  console.log(`Mining ${txResponce.hash}`);
  return new Promise((resolve, reject) => {
    provider.once(txResponce.hash, async (txReceipt) => {
      console.log(
        `Completed with ${await txReceipt.confirmations()} confirmations`,
      );
      resolve();
    });
  });
}

async function getBalance() {
  if (window.ethereum) {
    console.log("Updating funded balance");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    return ethers.formatEther(balance.toString());
  }
}

async function updateContentBalance() {
  const fundedBalanceElement = document.getElementById("funded-balance");
  fundedBalanceElement.textContent = await getBalance();
}
