import { OPERATOR_ROLE, deployETHBasedDeposit } from "./utils";
import { ADMIN_ROLE, toN } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

// Load the strategy
describe("StrategyETH checks!", async function () {
  it("Should deploy the strategy", async function () {
    const { deployer, user, administrator, strategyETH } = await loadFixture(
      deployETHBasedDeposit
    );
    expect(await administrator.hasRole(ADMIN_ROLE, deployer.address)).to.equal(
      true
    );
    await expect(strategyETH.init(administrator.target)).to.be.reverted;
  });

  it("Should deposit", async function () {
    const { user, strategyETH } = await loadFixture(deployETHBasedDeposit);
    let exponent = 10n ** 18n;
    let balBefore = (await strategyETH.ethBalance(user.address)) / exponent;
    await strategyETH.connect(user).deposit({ value: toN(1000) });
    let balAfter = (await strategyETH.ethBalance(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore - 1001n); // 1000n + 1n gas fee (this would be in decimals)

    let staked = (await strategyETH.balanceOf(user.address)) / exponent;
    expect(staked).to.equal(1000n);

    let bal = (await strategyETH.ethBalance(strategyETH.target)) / exponent;
    expect(bal).to.equal(1000n);
    let balanceInContract = (await strategyETH.balance()) / exponent;
    expect(bal).to.equal(balanceInContract);
  });

  it("Should withdraw", async function () {
    const { user, strategyETH } = await loadFixture(deployETHBasedDeposit);
    let exponent = 10n ** 18n;
    await strategyETH.connect(user).deposit({ value: toN(1000) });
    let balBefore = (await strategyETH.ethBalance(user.address)) / exponent;
    await strategyETH.connect(user).withdraw(toN(1000));
    let balAfter = (await strategyETH.ethBalance(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore + 1000n);

    let staked = (await strategyETH.balanceOf(user.address)) / exponent;
    expect(staked).to.equal(0n);
    let bal = (await strategyETH.ethBalance(strategyETH.target)) / exponent;
    expect(bal).to.equal(0n);
  });

  it("Deposit for other", async function () {
    const { deployer, user, wETH, strategyETH } = await loadFixture(
      deployETHBasedDeposit
    );
    let exponent = 10n ** 18n;
    let balBefore = (await strategyETH.ethBalance(user.address)) / exponent;
    await strategyETH
      .connect(user)
      .depositFor(deployer.address, { value: toN(1000) });
    let balAfter = (await strategyETH.ethBalance(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore - 1001n);

    let stakedUser = (await strategyETH.balanceOf(user.address)) / exponent;
    expect(stakedUser).to.equal(0n);

    let bal = (await strategyETH.ethBalance(strategyETH.target)) / exponent;
    expect(bal).to.equal(1000n);

    let stakedDeployer =
      (await strategyETH.balanceOf(deployer.address)) / exponent;
    expect(stakedDeployer).to.equal(1000n);
  });

  it("Withdraw all", async function () {
    const { deployer, user, wETH, strategyETH } = await loadFixture(
      deployETHBasedDeposit
    );
    let exponent = 10n ** 18n;
    let balBefore = (await strategyETH.ethBalance(user.address)) / exponent;
    await strategyETH
      .connect(user)
      .depositFor(deployer.address, { value: toN(1000) });
    let balAfter = (await strategyETH.ethBalance(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore - 1001n);

    let stakedUser = (await strategyETH.balanceOf(user.address)) / exponent;
    expect(stakedUser).to.equal(0n);

    let bal = (await strategyETH.ethBalance(strategyETH.target)) / exponent;
    expect(bal).to.equal(1000n);

    let stakedDeployer =
      (await strategyETH.balanceOf(deployer.address)) / exponent;
    expect(stakedDeployer).to.equal(1000n);

    await strategyETH.connect(deployer).withdrawAll();

    stakedUser = (await strategyETH.balanceOf(user.address)) / exponent;
    expect(stakedUser).to.equal(0n);

    stakedDeployer = (await strategyETH.balanceOf(deployer.address)) / exponent;
    expect(stakedDeployer).to.equal(0n);

    let balUser = (await strategyETH.ethBalance(user.address)) / exponent;
    let balDeployer =
      (await strategyETH.ethBalance(deployer.address)) / exponent;

    expect(balUser).to.equal(8999n); // Default eth for testing is 10000e18n
    expect(balDeployer).to.equal(10999n); // Default eth for testing is 10000e18n
  });

  it("Paused!", async function () {
    const { deployer, user, strategyETH, administrator } = await loadFixture(
      deployETHBasedDeposit
    );
    await expect(administrator.connect(deployer).pause()).not.to.be.reverted;
    expect(await administrator.isPaused()).to.equal(true);

    await expect(strategyETH.connect(user).deposit({ value: toN(1000) })).to.be
      .reverted;
    await expect(strategyETH.connect(user).withdraw(toN(1000))).to.be.reverted;
    await expect(
      strategyETH
        .connect(user)
        .depositFor(deployer.address, { value: toN(1000) })
    ).to.be.reverted;
    await expect(strategyETH.connect(deployer).withdrawAll()).to.be.reverted;
  });

  it("Blacklisted!", async function () {
    const { deployer, user, strategyETH, administrator } = await loadFixture(
      deployETHBasedDeposit
    );
    await expect(
      administrator.connect(deployer).addBlackListUsers([user.address])
    ).not.to.be.reverted;
    await expect(strategyETH.connect(user).deposit({ value: toN(1000) })).to.be
      .reverted;
    let exponent = 10n ** 18n;
    let stakedUser = (await strategyETH.ethBalance(user.address)) / exponent;
    expect(stakedUser).to.equal(9999n);
    await expect(
      strategyETH
        .connect(user)
        .depositFor(deployer.address, { value: toN(1000) })
    ).to.be.reverted;
    stakedUser = (await strategyETH.ethBalance(user.address)) / exponent;
    expect(stakedUser).to.equal(9999n);
    expect(await strategyETH.balance()).to.equal(0n);
  });

  it("Validations", async function () {
    const { deployer, user, strategyETH } = await loadFixture(
      deployETHBasedDeposit
    );
    await expect(strategyETH.connect(user).deposit({ value: 0 })).to.be
      .reverted;
    await expect(strategyETH.connect(user).withdraw(0)).to.be.reverted;
    await expect(
      strategyETH.connect(user).depositFor(deployer.address, { value: 0 })
    ).to.be.reverted;
    await expect(
      strategyETH
        .connect(user)
        .depositFor(ethers.ZeroAddress, { value: toN(1000) })
    ).to.be.reverted;
    await expect(strategyETH.connect(user).withdraw(toN(100))).to.be.reverted; // no deposit balance
    await expect(strategyETH.connect(user).withdrawAll()).to.be.reverted; // no deposit balance
  });

  it("!Admin", async function () {
    const { user, strategyETH, administrator } = await loadFixture(
      deployETHBasedDeposit
    );
    await expect(
      strategyETH.connect(user).setAdministrator(administrator.target)
    ).to.be.reverted;
  });

  it("Admin!", async function () {
    const { user, strategyETH, administrator } = await loadFixture(
      deployETHBasedDeposit
    );

    await administrator.grantRoles(ADMIN_ROLE, [user.address]);

    await expect(
      strategyETH.connect(user).setAdministrator(administrator.target)
    ).not.to.be.reverted;

    await expect(strategyETH.connect(user).setAdministrator(ethers.ZeroAddress))
      .to.be.reverted;

    expect(await strategyETH.administrator()).to.equal(administrator.target);
  });

  it("rescue", async function () {
    const { deployer, user, administrator, strategyETH } = await loadFixture(
      deployETHBasedDeposit
    );
    const Token = await ethers.getContractFactory("Token");
    const olive = await upgrades.deployProxy(
      Token,
      ["Olive", "olv", administrator.target],
      {
        initializer: "initialize",
      }
    );
    await administrator.grantRoles(OPERATOR_ROLE, [deployer.address]);
    await olive.mint(strategyETH.target, 1000);

    expect(await olive.balanceOf(strategyETH.target)).to.equal(1000);

    await expect(strategyETH.rescue(olive.target, user.address, 1000)).not.to.be
      .reverted;
    expect(await olive.balanceOf(user.address)).to.equal(1000);
    expect(await olive.balanceOf(strategyETH.target)).to.equal(0);
  });

  it("!rescue", async function () {
    const { deployer, user, administrator, strategyETH } = await loadFixture(
      deployETHBasedDeposit
    );
    const Token = await ethers.getContractFactory("Token");
    const olive = await upgrades.deployProxy(
      Token,
      ["Olive", "olv", administrator.target],
      {
        initializer: "initialize",
      }
    );
    await administrator.grantRoles(OPERATOR_ROLE, [deployer.address]);
    await olive.mint(strategyETH.target, 1000);

    expect(await olive.balanceOf(strategyETH.target)).to.equal(1000);

    // a non operator called the contract
    await expect(
      strategyETH.connect(user).rescue(olive.target, user.address, 1000)
    ).to.be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(strategyETH.target)).to.equal(1000);

    // invalid amount
    await expect(strategyETH.rescue(olive.target, user.address, 0)).to.be
      .reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(strategyETH.target)).to.equal(1000);

    // invalid user
    await expect(strategyETH.rescue(olive.target, ethers.ZeroAddress, 1000)).to
      .be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(strategyETH.target)).to.equal(1000);

    // invalid token
    await expect(strategyETH.rescue(ethers.ZeroAddress, user.address, 1000)).to
      .be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(strategyETH.target)).to.equal(1000);

    // harvest should revert
    await expect(strategyETH.harvest()).to.be.reverted;

    // not as a operator
    await expect(strategyETH.connect(user).harvest()).to.be.reverted;
  });
});
