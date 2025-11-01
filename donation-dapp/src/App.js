import React, { useState, useEffect } from "react";
import "./App.css";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import donationABI from "./DonationABI.json";

const contractAddress = "0xafc3ba217721283f658ed77424eae592f470c376"; // contract bạn đã deploy
const provider = new ethers.JsonRpcProvider("https://forno.celo.org");

function App() {
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [totalDonations, setTotalDonations] = useState("0");

  useEffect(() => {
    loadTotalDonations();
  }, []);

  async function connectWallet() {
    const provider = await detectEthereumProvider();
    if (provider) {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } else {
      alert("Vui lòng cài MetaMask hoặc Celo Wallet Extension!");
    }
  }

  async function donate() {
    if (!account || !amount) return alert("Nhập số CELO muốn donate");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      // 🟢 Kiểm tra nếu chưa ở đúng mạng Celo
      if (network.chainId !== 42220n && network.chainId !== 44787n) {
        // 👉 Tự động thêm mạng Celo vào MetaMask (nếu chưa có)
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xA4EC", // 42220
              chainName: "Celo Mainnet",
              nativeCurrency: {
                name: "Celo",
                symbol: "CELO",
                decimals: 18,
              },
              rpcUrls: ["https://forno.celo.org"],
              blockExplorerUrls: ["https://celoscan.io/"],
            },
          ],
        });
        return alert(
          "⚠️ Vui lòng chuyển sang mạng Celo trong MetaMask rồi thử lại!"
        );
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        donationABI.abi,
        signer
      );

      const tx = await contract.donate({
        value: ethers.parseEther(amount), // ví dụ "0.01"
      });

      await tx.wait();
      alert("🎉 Gửi thành công!");
      loadTotalDonations();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi gửi giao dịch: " + (error.reason || error.message));
    }
  }

  async function loadTotalDonations() {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://forno.celo-sepolia.celo-testnet.org/"
      );
      const contract = new ethers.Contract(
        contractAddress,
        donationABI.abi,
        provider
      );
      const total = await contract.getDonations();
      setTotalDonations(ethers.formatEther(total));
    } catch (err) {
      console.error("Lỗi loadTotalDonations:", err);
    }
  }

  return (
    <div className="app-container">
      <div className="card">
        <h1>🎁 Celo Donation DApp</h1>

        {account ? (
          <p className="account">
            💳 Ví đang kết nối: <b>{account}</b>
          </p>
        ) : (
          <button className="btn connect" onClick={connectWallet}>
            Kết nối ví
          </button>
        )}

        <div className="donate-section">
          <input
            type="number"
            placeholder="Nhập số CELO muốn donate"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="btn donate" onClick={donate}>
            🚀 Donate
          </button>
        </div>

        <h2>
          Tổng số CELO donate: <span>{totalDonations}</span> 💰
        </h2>
      </div>
    </div>
  );
}

export default App;
