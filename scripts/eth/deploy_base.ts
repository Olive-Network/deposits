import { ethers, upgrades } from "hardhat";
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Administrator = await ethers.getContractFactory("Administrator");
  const admin = await upgrades.deployProxy(Administrator, [deployer.address], {
    initializer: "init",
  });
  let administratorProxy = await admin.getAddress();
  console.log("Administrator deployed to:", administratorProxy);

}

// Deploying contracts with the account: 0xBE5A88438B6c9Db69156616a02Ea6b01b2c66b4c
// Administrator deployed to: 0x05AF48Cb90CFb79E696587b901B2b312fC29e565

async function load() {
  const [deployer] = await ethers.getSigners();

  const Administrator = await ethers.getContractFactory("Administrator");
  const admin = await Administrator.attach(
    "0x05AF48Cb90CFb79E696587b901B2b312fC29e565"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
