// const hre = require("hardhat");

// async function main() {
//   const Lending = await hre.ethers.getContractFactory("P2PLending");
//   const lending = await Lending.deploy();

//   await lending.waitForDeployment(); // ethers v6 replaces deployed()

//   console.log(`Contract deployed to: ${lending.target}`); // ethers v6 replaces address
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });


const hre = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment to Sepolia...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    
    // Get balance using ethers v6 syntax
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    console.log("Getting contract factory...");
    const P2PLending = await hre.ethers.getContractFactory("P2PLending");
    
    console.log("Deploying contract...");
    const lending = await P2PLending.deploy();
    await lending.waitForDeployment();

    console.log("P2PLending deployed to:", await lending.getAddress());
    
    console.log("Waiting for confirmations...");
    await lending.deploymentTransaction().wait(5);
    
    console.log("Deployment completed successfully!");
    console.log("Contract address:", await lending.getAddress());
    console.log("Network:", hre.network.name);
    console.log("Deployer address:", deployer.address);
    console.log("Transaction hash:", lending.deploymentTransaction().hash);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
