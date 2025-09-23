const hre = require("hardhat");

async function main() {
  const TREASURY = "0x16f2e725E6c6d3935Da212093690F21C07Fb9d27";
  const Factory = await hre.ethers.getContractFactory("TopUpGateway");
  const contract = await Factory.deploy(TREASURY);
  await contract.waitForDeployment();
  console.log("TopUpGateway deployed to:", await contract.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
