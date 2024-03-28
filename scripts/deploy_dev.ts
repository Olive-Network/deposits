import { ethers, upgrades } from "hardhat";

async function main() {
  // Add the deployment functions here
  // deploy

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Administrator = await ethers.getContractFactory("Administrator");
  const AdministratorProxy = await upgrades.deployProxy(
    Administrator,
    [deployer.address],
    { initializer: "init" }
  );
  let administratorProxy = await AdministratorProxy.getAddress();

  const Token = await ethers.getContractFactory("Token");
  const TokenProxy = await upgrades.deployProxy(
    Token,
    ["Wrapped ETH", "wETH", administratorProxy],
    {
      initializer: "initialize",
    }
  );
  const wETH = await TokenProxy.getAddress();
  console.log("wETH deployed to:", wETH);

  const Strategy = await ethers.getContractFactory("Strategy");
  const wETHStrategy = await upgrades.deployProxy(
    Strategy,
    [administratorProxy, wETH.target],
    {
      initializer: "init",
    }
  );
  const wETHStgy = await wETHStrategy.getAddress();
  console.log("wETH Strategy deployed to:", wETHStgy);

  const lsETHProxy = await upgrades.deployProxy(
    Token,
    ["LS ETH", "lsETH", administratorProxy],
    {
      initializer: "initialize",
    }
  );
  const lsETH = await TokenProxy.getAddress();
  console.log("lsETH deployed to:", lsETH);

  const lsETHStrategy = await upgrades.deployProxy(
    Strategy,
    [administratorProxy, lsETH.target],
    {
      initializer: "init",
    }
  );
  const lsETHStgy = await lsETHStrategy.getAddress();
  console.log("lsETH Strategy deployed to:", lsETHStgy);

  let ADMIN_ROLE = ethers.keccak256(hre.ethers.toUtf8Bytes("ADMIN"));
  let OPERATOR_ROLE = ethers.keccak256(hre.ethers.toUtf8Bytes("OPERATOR"));

  await AdministratorProxy.grantRoles(OPERATOR_ROLE, [deployer.address]);
  await lsETHProxy.mint(deployer.address, ethers.parseEther("1000"));
  await lsETHProxy.approve(
    await lsETHStrategy.getAddress(),
    ethers.parseEther("1000")
  );
  await lsETHStrategy.deposit(ethers.parseEther("1000"));

  const stgy = await Strategy.deploy(administratorProxy, lsETH);
}

async function deploLSTs() {
  let tokenName = "Wrapped BTC";
  let tokenSymbol = "wBTC";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Administrator = await ethers.getContractFactory("Administrator");
  const Admin = await Administrator.attach(
    "0xA275B5344fc13000EbDB23730449A39917449ef0"
  );

  const Token = await ethers.getContractFactory("Token");
  const TokenProxy = await upgrades.deployProxy(
    Token,
    [tokenName, tokenSymbol, Admin.target],
    {
      initializer: "initialize",
    }
  );
  const token = await TokenProxy.getAddress();
  console.log(tokenSymbol + " deployed to: " + token);

  const Strategy = await ethers.getContractFactory("Strategy");
  const strategy = await upgrades.deployProxy(
    Strategy,
    [Admin.target, TokenProxy.target],
    {
      initializer: "init",
    }
  );
  const strAddr = await strategy.getAddress();
  console.log("Strategy deployed to:", strAddr);
}

async function deployAll() {
  // Deployment in DEV
  //   Deploying --------  wBTC
  // wBTC deployed to: 0x3aF34c43556c7d1F459D5574E3e96AdB5E34AcEa
  // Strategy deployed to: 0x1280e0375f03Dab95A04132dAE8879C602F0646b
  //  --------
  // Deploying --------  stETH
  // stETH deployed to: 0x49e87B2c7D846b6cF833DfbEe37516D32991a089
  // Strategy deployed to: 0x76EC4BCa47411c8c201e55f4208C7D1394C52eA9
  //  --------
  // Deploying --------  rsETH
  // rsETH deployed to: 0x603db39026327e390CeAAb96dD388F90c6d5Af30
  // Strategy deployed to: 0xD00DD2A50Ef72d1474F92f0e3dea130A29379618
  //  --------
  // Deploying --------  ezETH
  // ezETH deployed to: 0x544C77161C522F82D4FccBbA65D8d91E0F09AB3B
  // Strategy deployed to: 0xB4227242c68007fF2D9eE2cdbAF79cE7EfCDd33A
  //  --------
  // Deploying --------  pufETH
  // pufETH deployed to: 0xd8A136066DF80fFf2966661CE360E6239f2559D9
  // Strategy deployed to: 0x8A9aF518eFCE2Ee9918BF3432eC7F6D6Cb153F41
  //  --------
  // Deploying --------  rswETH
  // rswETH deployed to: 0xAc8051Fbb7ccDEFf8Fa6C1E41C4448e5F7B4e445
  // Strategy deployed to: 0xa718c2Bd5AC4F65aD8c29bFFc1D89c513DDB8b30
  //  --------
  // Deploying --------  eETH
  // eETH deployed to: 0x769B4010223d5707f964cF5cBeB932e71730Fb64
  // Strategy deployed to: 0xD7d96C1c272f1596d8D30008A81C07F19e5f0927
  //  --------

  // ETH Strategy @ 0x92E8A239f92be5D234c228283e112dE3743D1c67

  let tokenNames = [
    "Wrapped BTC",
    "Lido ETH",
    "RS ETH",
    "EZ ETH",
    "PUF ETH",
    "RSW ETH",
    "E ETH",
  ];
  let tokenSymbols = [
    "wBTC",
    "stETH",
    "rsETH",
    "ezETH",
    "pufETH",
    "rswETH",
    "eETH",
  ];
  const Administrator = await ethers.getContractFactory("Administrator");
  const Admin = await Administrator.attach(
    "0xA275B5344fc13000EbDB23730449A39917449ef0"
  );
  const Token = await ethers.getContractFactory("Token");
  const Strategy = await ethers.getContractFactory("Strategy");
  let TokenProxy;
  let token;
  let strategy;
  let strAddr;

  for (let i = 0; i < 7; i++) {
    console.log("Deploying -------- ", tokenSymbols[i]);
    TokenProxy = await upgrades.deployProxy(
      Token,
      [tokenNames[i], tokenSymbols[i], Admin.target],
      {
        initializer: "initialize",
      }
    );
    token = await TokenProxy.getAddress();
    console.log(tokenSymbols[i] + " deployed to: " + token);

    strategy = await upgrades.deployProxy(
      Strategy,
      [Admin.target, TokenProxy.target],
      {
        initializer: "init",
      }
    );
    strAddr = await strategy.getAddress();
    console.log("Strategy deployed to:", strAddr);
    console.log(" -------- ");
  }

  const StrategyETH = await ethers.getContractFactory("StrategyETH");
  const ETHDeposit = await upgrades.deployProxy(StrategyETH, [Admin.target], {
    initializer: "init",
  });
  const ethStgAddr = await ETHDeposit.getAddress();
  console.log("ETH Strategy deployed to:", ethStgAddr);
}

async function deployGasToken() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Olive = await ethers.getContractFactory("Olive");
  const OliveProxy = await upgrades.deployProxy(
    Olive,
    ["Olive", "OLV", deployer.address],
    {
      initializer: "initialize",
    }
  );
  const olv = await OliveProxy.getAddress();
  console.log("Olive deployed to:", olv);
  await OliveProxy.mint(deployer.address, ethers.parseEther("10000"));
}

async function loadGasToken() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Olive = await ethers.getContractFactory("Olive");
  const olv = Olive.attach("0xfC501cD5d78851E145A9d0eB17169cfeeF7d4741");
}

async function load() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Administrator = await ethers.getContractFactory("Administrator");
  const Token = await ethers.getContractFactory("Token");
  const Strategy = await ethers.getContractFactory("Strategy");

  const admin = await Administrator.attach(
    "0xA275B5344fc13000EbDB23730449A39917449ef0"
  );
  const administratorProxy = await Admin.getAddress();

  const wETH = await Token.attach("0xf7A20C37ca3612AC7A1DE704114064B8B211d593");
  const wETHStrategy = await Strategy.attach(
    "0xdb1FeeC6c467d05EcAd4162ce3131346E7322FDC"
  );

  const lsETH = await Token.attach(
    "0x74632230d53CbB98cc665e5010C005a33A4223aa"
  );
  const lsETHStrategy = await Strategy.attach(
    "0xEb21bEa059d0826f186A5b01907095C2e7195732"
  );

  let ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));
  let OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR"));
}

async function giveAwayTokens() {
  let users = [
    "0x5cAD7D987188b01d3Cb92755D3C0e044788C4efE",
    "0x777480ff6351D131E4999c9Aaa2C1aFaBf0BE76d",
    "0xAcBF611d56557C6003fcB6047a86f382C729A342",
    "0xb38ee09eb6b1b4ec8b72732bd5f5546468614d9b",
  ];
  let tokens = [
    "0x3aF34c43556c7d1F459D5574E3e96AdB5E34AcEa",
    "0x49e87B2c7D846b6cF833DfbEe37516D32991a089",
    "0x603db39026327e390CeAAb96dD388F90c6d5Af30",
    "0x544C77161C522F82D4FccBbA65D8d91E0F09AB3B",
    "0xd8A136066DF80fFf2966661CE360E6239f2559D9",
    "0xAc8051Fbb7ccDEFf8Fa6C1E41C4448e5F7B4e445",
    "0x769B4010223d5707f964cF5cBeB932e71730Fb64",
    "0xf7A20C37ca3612AC7A1DE704114064B8B211d593",
    "0x74632230d53CbB98cc665e5010C005a33A4223aa",
  ];
  let amount = ethers.parseEther("100");

  const Token = await ethers.getContractFactory("Token");
  for (let i = 0; i < tokens.length; i++) { 
    console.log("Minting tokens for: ", tokens[i], "------- START")
    let token = await Token.attach(tokens[i]);

    for (let j = 0; j < users.length; j++) { 
      console.log("Minting tokens for: ", users[j])
      await token.mint(users[j], amount);
    }
    console.log("Minting tokens for: ", tokens[i], "------- END");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
giveAwayTokens().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
