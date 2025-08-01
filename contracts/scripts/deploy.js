const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log("Network:", (await deployer.provider.getNetwork()).name);

  // Deploy EMO Token
  console.log("\n=== Deploying EMO Token ===");
  
  const EMOToken = await ethers.getContractFactory("EMOToken");
  
  // Initial validators for testnet (replace with actual validator addresses)
  const initialValidators = [
    deployer.address, // Deployer as initial validator for testing
    // Add more validator addresses here
  ];
  
  const initialStakes = [
    ethers.parseEther("10000"), // 10,000 EMO minimum stake
    // Add corresponding stake amounts
  ];
  
  console.log("Deploying EMO Token with initial validators:", initialValidators);
  
  const emoToken = await EMOToken.deploy(
    deployer.address, // Owner
    initialValidators,
    initialStakes
  );
  
  await emoToken.waitForDeployment();
  const emoTokenAddress = await emoToken.getAddress();
  
  console.log("EMO Token deployed to:", emoTokenAddress);
  
  // Deploy EMO Bridge
  console.log("\n=== Deploying EMO Bridge ===");
  
  const EMOBridge = await ethers.getContractFactory("EMOBridge");
  
  // Bridge configuration (use actual addresses in production)
  const layerZeroEndpoint = getLayerZeroEndpoint(network.name);
  const axelarGateway = getAxelarGateway(network.name);
  const wormholeCore = getWormholeCore(network.name);
  
  const bridgeValidators = [
    deployer.address, // Replace with actual bridge validators
  ];
  
  console.log("Deploying EMO Bridge...");
  
  const emoBridge = await EMOBridge.deploy(
    emoTokenAddress,
    layerZeroEndpoint,
    axelarGateway,
    wormholeCore,
    bridgeValidators
  );
  
  await emoBridge.waitForDeployment();
  const emoBridgeAddress = await emoBridge.getAddress();
  
  console.log("EMO Bridge deployed to:", emoBridgeAddress);
  
  // Deploy Wrapped EMO (for other chains)
  if (network.name !== "emotionalchain_testnet") {
    console.log("\n=== Deploying Wrapped EMO ===");
    
    const WrappedEMO = await ethers.getContractFactory("WrappedEMO");
    
    const wrappedEMO = await WrappedEMO.deploy(
      `Wrapped EmotionalChain Token (${network.name})`,
      `wEMO-${network.name.toUpperCase()}`,
      deployer.address
    );
    
    await wrappedEMO.waitForDeployment();
    const wrappedEMOAddress = await wrappedEMO.getAddress();
    
    console.log("Wrapped EMO deployed to:", wrappedEMOAddress);
    
    // Add bridge as authorized minter
    console.log("Authorizing bridge contract...");
    await wrappedEMO.addBridge(emoBridgeAddress);
  }
  
  // Configure bridge in EMO token
  console.log("\n=== Configuring Bridge Authorization ===");
  await emoToken.setBridgeContract(emoBridgeAddress, true);
  
  // Display deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("EMO Token:", emoTokenAddress);
  console.log("EMO Bridge:", emoBridgeAddress);
  if (network.name !== "emotionalchain_testnet") {
    console.log("Wrapped EMO:", await wrappedEMO.getAddress());
  }
  
  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: (await deployer.provider.getNetwork()).chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      EMOToken: emoTokenAddress,
      EMOBridge: emoBridgeAddress,
      ...(network.name !== "emotionalchain_testnet" && {
        WrappedEMO: await wrappedEMO.getAddress()
      })
    },
    initialValidators,
    bridgeValidators
  };
  
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\nDeployment info saved to deployments/${network.name}.json`);
  
  // Verification instructions
  console.log("\n=== Verification Instructions ===");
  console.log("To verify contracts on Etherscan/Polygonscan:");
  console.log(`npx hardhat verify --network ${network.name} ${emoTokenAddress} "${deployer.address}" '["${initialValidators.join('","')}"]' '["${initialStakes.join('","')}"]'`);
  console.log(`npx hardhat verify --network ${network.name} ${emoBridgeAddress} "${emoTokenAddress}" "${layerZeroEndpoint}" "${axelarGateway}" "${wormholeCore}" '["${bridgeValidators.join('","')}"]'`);
}

// Helper functions to get protocol addresses by network
function getLayerZeroEndpoint(networkName) {
  const endpoints = {
    ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
    polygon: "0x3c2269811836af69497E5F486A85D7316753cf62",
    bsc: "0x3c2269811836af69497E5F486A85D7316753cf62",
    avalanche: "0x3c2269811836af69497E5F486A85D7316753cf62",
    arbitrum: "0x3c2269811836af69497E5F486A85D7316753cf62",
    optimism: "0x3c2269811836af69497E5F486A85D7316753cf62",
    sepolia: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
    mumbai: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
  };
  return endpoints[networkName] || ethers.ZeroAddress;
}

function getAxelarGateway(networkName) {
  const gateways = {
    ethereum: "0x4F4495243837681061C4743b74B3eEdf548D56A5",
    polygon: "0x6f015F16De9fC8791b234eF68D486d2bF203FBA8",
    bsc: "0x304acf330bbE08d1e512eefaa92F6a57871fD895",
    avalanche: "0x5029C0EFf6C34351a0CEc334542cDb22c7928f78",
    arbitrum: "0xe432150cce91c13a887f7D836923d5597adD8E31",
    optimism: "0xe432150cce91c13a887f7D836923d5597adD8E31",
  };
  return gateways[networkName] || ethers.ZeroAddress;
}

function getWormholeCore(networkName) {
  const cores = {
    ethereum: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    polygon: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
    bsc: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    avalanche: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
    arbitrum: "0xa5f208e072434bC67592E4C49C1B991BA79BCA46",
    optimism: "0xEe91C335eab126dF5fDB3797EA9d6aD93aeC9722",
  };
  return cores[networkName] || ethers.ZeroAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });