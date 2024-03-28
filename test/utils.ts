import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { upgrades } from "hardhat";
import { expect } from "chai";

export function toN(n: any, d = 18) {
  return ethers.parseUnits(n.toString(), d);
}

export const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));
export const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR"));

export async function deployAdminstrator() {
  const [deployer, user] = await ethers.getSigners();

  const Administrator = await ethers.getContractFactory("Administrator");
  const administrator = await upgrades.deployProxy(
    Administrator,
    [deployer.address],
    { initializer: "init" }
  );
  let addr = await administrator.getAddress();

  return { deployer, user, administrator };
}

export async function deployERC20BasedDeposit() {
  const { deployer, user, administrator } = await loadFixture(
    deployAdminstrator
  );

  const Token = await ethers.getContractFactory("Token");
  const wETH = await upgrades.deployProxy(
    Token,
    ["Wrapped ETH", "wETH", administrator.target],
    {
      initializer: "initialize",
    }
  );
  const wETHAddr = await wETH.getAddress();

  const Strategy = await ethers.getContractFactory("Strategy");
  const wETHStrategy = await upgrades.deployProxy(
    Strategy,
    [administrator.target, wETH.target],
    {
      initializer: "init",
    }
  );
  const stgyAddr = await wETHStrategy.getAddress();

  // mint tokens for testing and approve too
  await administrator.grantRoles(OPERATOR_ROLE, [deployer.address]);
  await wETH.mint(deployer.address, toN(1000));
  await wETH.mint(user.address, toN(1000));
  await wETH.connect(user).approve(wETHStrategy.target, toN(1000));

  return { deployer, user, administrator, wETH, wETHStrategy };
}

export async function deployETHBasedDeposit() {
  const { deployer, user, administrator } = await loadFixture(
    deployAdminstrator
  );

  const StrategyETH = await ethers.getContractFactory("StrategyETH");
  const strategyETH = await upgrades.deployProxy(
    StrategyETH,
    [administrator.target],
    {
      initializer: "init",
    }
  );
  const stgyAddr = await strategyETH.getAddress();

  return { deployer, user, administrator, strategyETH };
}

export async function expectArray(result: any[], expected: any[]) {
  expect(result.length).to.equal(expected.length);
  for (let i = 0; i < result.length; i++) {
    expect(result[i]).to.equal(expected[i]);
  }
}
