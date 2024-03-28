import { deployERC20BasedDeposit } from "./utils";
import { ADMIN_ROLE, toN } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

// Load the strategy
describe("Strategy checks!", async function () {
  it("Should deploy the strategy", async function () {
    const { deployer, user, administrator, wETH, wETHStrategy } =
      await loadFixture(deployERC20BasedDeposit);
    expect(await administrator.hasRole(ADMIN_ROLE, deployer.address)).to.equal(
      true
    );
    await expect(wETHStrategy.init(administrator.target, deployer.address)).to
      .be.reverted;
  });

  it("Should deposit", async function () {
    const { user, wETH, wETHStrategy } = await loadFixture(
      deployERC20BasedDeposit
    );
    let exponent = 10n ** 18n;
    let balBefore = (await wETH.balanceOf(user.address)) / exponent;
    await wETHStrategy.connect(user).deposit(toN(1000));
    let balAfter = (await wETH.balanceOf(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore - 1000n);

    let staked = (await wETHStrategy.balanceOf(user.address)) / exponent;
    expect(staked).to.equal(1000n);

    let bal = (await wETH.balanceOf(wETHStrategy.target)) / exponent;
    expect(bal).to.equal(1000n);
    let balanceInContract = (await wETHStrategy.balance()) / exponent;
    expect(bal).to.equal(balanceInContract);
  });

  it("Should withdraw", async function () {
    const { user, wETH, wETHStrategy } = await loadFixture(
      deployERC20BasedDeposit
    );
    let exponent = 10n ** 18n;
    await wETHStrategy.connect(user).deposit(toN(1000));
    let balBefore = (await wETH.balanceOf(user.address)) / exponent;
    await wETHStrategy.connect(user).withdraw(toN(1000));
    let balAfter = (await wETH.balanceOf(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore + 1000n);

    let staked = (await wETHStrategy.balanceOf(user.address)) / exponent;
    expect(staked).to.equal(0n);
    let bal = (await wETH.balanceOf(wETHStrategy.target)) / exponent;
    expect(bal).to.equal(0n);
  });

  it("Deposit for other", async function () {
    const { deployer, user, wETH, wETHStrategy } = await loadFixture(
      deployERC20BasedDeposit
    );
    let exponent = 10n ** 18n;
    let balBefore = (await wETH.balanceOf(user.address)) / exponent;
    await wETHStrategy.connect(user).depositFor(deployer.address, toN(1000));
    let balAfter = (await wETH.balanceOf(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore - 1000n);

    let stakedUser = (await wETHStrategy.balanceOf(user.address)) / exponent;
    expect(stakedUser).to.equal(0n);

    let bal = (await wETH.balanceOf(wETHStrategy.target)) / exponent;
    expect(bal).to.equal(1000n);

    let stakedDeployer =
      (await wETHStrategy.balanceOf(deployer.address)) / exponent;
    expect(stakedDeployer).to.equal(1000n);
  });

  it("Withdraw all", async function () {
    const { deployer, user, wETH, wETHStrategy } = await loadFixture(
      deployERC20BasedDeposit
    );
    let exponent = 10n ** 18n;
    let balBefore = (await wETH.balanceOf(user.address)) / exponent;
    await wETHStrategy.connect(user).depositFor(deployer.address, toN(1000));
    let balAfter = (await wETH.balanceOf(user.address)) / exponent;
    expect(balAfter).to.equal(balBefore - 1000n);

    let stakedUser = (await wETHStrategy.balanceOf(user.address)) / exponent;
    expect(stakedUser).to.equal(0n);

    let bal = (await wETH.balanceOf(wETHStrategy.target)) / exponent;
    expect(bal).to.equal(1000n);

    let stakedDeployer =
      (await wETHStrategy.balanceOf(deployer.address)) / exponent;
    expect(stakedDeployer).to.equal(1000n);

    await wETHStrategy.connect(deployer).withdrawAll();

    stakedUser = (await wETHStrategy.balanceOf(user.address)) / exponent;
    expect(stakedUser).to.equal(0n);

    stakedDeployer =
      (await wETHStrategy.balanceOf(deployer.address)) / exponent;
    expect(stakedDeployer).to.equal(0n);

    let balUser = (await wETH.balanceOf(user.address)) / exponent;
    let balDeployer = (await wETH.balanceOf(deployer.address)) / exponent;

    expect(balUser).to.equal(0n);
    expect(balDeployer).to.equal(2000n); // In the utils deployer is minted with 1000n tokens
  });

  it("Paused!", async function () {
    const { deployer, user, wETH, wETHStrategy, administrator } =
      await loadFixture(deployERC20BasedDeposit);
    await expect(administrator.connect(deployer).pause()).not.to.be.reverted;
    expect(await administrator.isPaused()).to.equal(true);

    await expect(wETHStrategy.connect(user).deposit(toN(1000))).to.be.reverted;
    await expect(wETHStrategy.connect(user).withdraw(toN(1000))).to.be.reverted;
    await expect(
      wETHStrategy.connect(user).depositFor(deployer.address, toN(1000))
    ).to.be.reverted;
    await expect(wETHStrategy.connect(deployer).withdrawAll()).to.be.reverted;
  });

  it("Blacklisted!", async function () {
    const { deployer, user, wETH, wETHStrategy, administrator } =
      await loadFixture(deployERC20BasedDeposit);
    await expect(
      administrator.connect(deployer).addBlackListUsers([user.address])
    ).not.to.be.reverted;
    await expect(wETHStrategy.connect(user).deposit(toN(1000))).to.be.reverted;
    await expect(
      wETHStrategy.connect(user).depositFor(deployer.address, toN(1000))
    ).to.be.reverted;
  });

  it("Validations", async function () {
    const { deployer, user, wETH, wETHStrategy, administrator } =
      await loadFixture(deployERC20BasedDeposit);
    await expect(wETHStrategy.connect(user).deposit(0)).to.be.reverted;
    await expect(wETHStrategy.connect(user).withdraw(0)).to.be.reverted;
    await expect(wETHStrategy.connect(user).depositFor(deployer.address, 0)).to
      .be.reverted;
    await expect(
      wETHStrategy.connect(user).depositFor(ethers.ZeroAddress, toN(1000))
    ).to.be.reverted;
    await expect(wETHStrategy.connect(user).withdraw(toN(100))).to.be.reverted; // no deposit balance
    await expect(wETHStrategy.connect(user).withdrawAll()).to.be.reverted; // no deposit balance
  });

  it("!Admin", async function () {
    const { user, wETHStrategy, administrator } = await loadFixture(
      deployERC20BasedDeposit
    );
    await expect(
      wETHStrategy.connect(user).setAdministrator(administrator.target)
    ).to.be.reverted;
  });

  it("Admin!", async function () {
    const { user, wETHStrategy, administrator } = await loadFixture(
      deployERC20BasedDeposit
    );

    await administrator.grantRoles(ADMIN_ROLE, [user.address]);

    await expect(
      wETHStrategy.connect(user).setAdministrator(administrator.target)
    ).not.to.be.reverted;

    await expect(
      wETHStrategy.connect(user).setAdministrator(ethers.ZeroAddress)
    ).to.be.reverted;

    expect(await wETHStrategy.administrator()).to.equal(administrator.target);
  });

  it("rescue", async function () {
    const { deployer, user, administrator, wETHStrategy } = await loadFixture(deployERC20BasedDeposit);
    const Token = await ethers.getContractFactory("Token");
    const olive = await upgrades.deployProxy(
      Token,
      ["Olive", "olv", administrator.target],
      {
        initializer: "initialize",
      }
    );
    await olive.mint(wETHStrategy.target, 1000);


    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);
    
    await expect(wETHStrategy.rescue(olive.target, user.address, 1000)).not.to.be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(1000);
    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(0);
    
  });

  it("!rescue", async function () {
    const { deployer, user, administrator, wETHStrategy } = await loadFixture(
      deployERC20BasedDeposit
    );
    const Token = await ethers.getContractFactory("Token");
    const olive = await upgrades.deployProxy(
      Token,
      ["Olive", "olv", administrator.target],
      {
        initializer: "initialize",
      }
    );
    await olive.mint(wETHStrategy.target, 1000);

    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);

    // a non operator called the contract
    await expect(
      wETHStrategy.connect(user).rescue(olive.target, user.address, 1000)
    ).to.be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);

    // invalid amount
    await expect(wETHStrategy.rescue(olive.target, user.address, 0)).to.be
      .reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);

    // invalid user
    await expect(wETHStrategy.rescue(olive.target, ethers.ZeroAddress, 1000)).to
      .be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);

    // invalid token
    await expect(wETHStrategy.rescue(ethers.ZeroAddress, user.address, 1000)).to
      .be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);

    let wETH = await wETHStrategy.token();
    await expect(wETHStrategy.rescue(wETH, user.address, 1000)).to
      .be.reverted;
    expect(await olive.balanceOf(user.address)).to.equal(0);
    expect(await olive.balanceOf(wETHStrategy.target)).to.equal(1000);


    // harvest should revert 
    await expect(wETHStrategy.harvest()).to.be.reverted;

    // not as a operator
    await expect(wETHStrategy.connect(user).harvest()).to.be.reverted;
  });  
});
