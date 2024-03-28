import { ethers, upgrades } from "hardhat";
async function main() { 
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const Token = await ethers.getContractFactory("Token");
    const weETH = await Token.attach("0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe");

    const Administrator = await ethers.getContractFactory("Administrator");
    const admin = await upgrades.deployProxy(
      Administrator,
      [deployer.address],
      { initializer: "init" }
    );
    let administratorProxy = await admin.getAddress();
    console.log("Administrator deployed to:", administratorProxy);

    const Strategy = await ethers.getContractFactory("Strategy");
    const eETHStrategy=  await upgrades.deployProxy(
    Strategy, [admin.target, weETH.target], {
      initializer: "init",
    }
    );
    let eETHStgy = await eETHStrategy.getAddress();
    console.log("eETH Strategy deployed to:", eETHStgy);
}

// Deploying contracts with the account: 0xBE5A88438B6c9Db69156616a02Ea6b01b2c66b4c
// Administrator deployed to: 0x05AF48Cb90CFb79E696587b901B2b312fC29e565
// eETH Strategy deployed to: 0xC51Dcd2bF427Cf042D1C505ce7471657C1767780

async function load() { 
    const [deployer] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("Token");
    const weETH = await Token.attach(
      "0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe"
    );

    const Administrator = await ethers.getContractFactory("Administrator");
    const admin = await Administrator.attach(
      "0x05AF48Cb90CFb79E696587b901B2b312fC29e565"
    );

    const Strategy = await ethers.getContractFactory("Strategy");
    const eETHStrategy = await Strategy.attach(
      "0xC51Dcd2bF427Cf042D1C505ce7471657C1767780"
    );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});