/**
 * Hardhat Deployment Script
 * Deploys the IronFistLogger contract to the configured network
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying IronFistLogger...");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Network:  ${hre.network.name}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`   Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  // Deploy the contract
  const IronFistLogger = await hre.ethers.getContractFactory("IronFistLogger");
  const contract = await IronFistLogger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ IronFistLogger deployed at: ${address}`);

  // Save deployment info for the backend service
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: JSON.parse(contract.interface.formatJson()),
  };

  const outputPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

  fs.writeFileSync(
    path.join(outputPath, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n📄 Deployment info saved to deployments/${hre.network.name}.json`);
  console.log(`\n🔖 Update your backend .env:`);
  console.log(`   CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
