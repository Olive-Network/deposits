import { deployAdminstrator, expectArray } from "./utils";
import { ADMIN_ROLE } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

// Load the utils
describe("Adminstrator checks!", function () {
  it("Should deploy the administrator", async function () {
    const { deployer, administrator } = await loadFixture(deployAdminstrator);
    expect(await administrator.hasRole(ADMIN_ROLE, deployer.address)).to.equal(
      true
    );
  });

  it("!Admin", async function () {
    const { user, administrator } = await loadFixture(deployAdminstrator);
    expect(await administrator.hasRole(ADMIN_ROLE, user.address)).to.equal(
      false
    );
  });

  it("Initialized", async function () {
    const { user, administrator } = await loadFixture(deployAdminstrator);
    await expect(administrator.init(user.address)).to.be.reverted;
  });

  it("Roles checks", async function () {
    const { deployer, user, administrator } = await loadFixture(
      deployAdminstrator
    );
    let result = await administrator.hasRoles(
      [ADMIN_ROLE, ADMIN_ROLE],
      [deployer.address, user.address]
    );
    expectArray(result, [true, false]);
  });

  it("!Admin", async function () {
    const { user, administrator } = await loadFixture(
      deployAdminstrator
    );
    await expect(
      administrator.connect(user).grantRoles(ADMIN_ROLE, [user.address])
    ).to.be.reverted;
    await expect(
      administrator.connect(user).revokeRoles(ADMIN_ROLE, [user.address])
    ).to.be.reverted;
  });

  it("GrantRoles", async function () {
    const { deployer, user, administrator } = await loadFixture(
      deployAdminstrator
    );
    await expect(
      administrator.connect(deployer).grantRoles(ADMIN_ROLE, [user.address])
    ).not.to.be.reverted;
    let result = await administrator.hasRoles(
      [ADMIN_ROLE, ADMIN_ROLE],
      [deployer.address, user.address]
    );
    expectArray(result, [true, true]);
    await expect(
      administrator.connect(user).revokeRoles(ADMIN_ROLE, [user.address])
    ).not.to.be.reverted;
    result = await administrator.hasRoles(
      [ADMIN_ROLE, ADMIN_ROLE],
      [deployer.address, user.address]
    );
    expectArray(result, [true, false]);
  });

  it("Pause", async function () {
    const { deployer, administrator } = await loadFixture(
      deployAdminstrator
    );
    await expect(administrator.connect(deployer).pause()).not.to.be.reverted;
    expect(await administrator.isPaused()).to.equal(true);
    await expect(administrator.connect(deployer).unpause()).not.to.be.reverted;
    expect(await administrator.isPaused()).to.equal(false);
  });

  it("!Pause", async function () {
    const { user, administrator } = await loadFixture(
      deployAdminstrator
    );
    await expect(administrator.connect(user).pause()).to.be.reverted;
    expect(await administrator.isPaused()).to.equal(false);
    await expect(administrator.connect(user).unpause()).to.be.reverted;
    expect(await administrator.isPaused()).to.equal(false);
  });

  it("Blacklist", async function(){
    const { deployer, user, administrator } = await loadFixture(
      deployAdminstrator
    );
    await expect(administrator.connect(deployer).addBlackListUsers([user.address])).not.to.be.reverted;
    expect(await administrator.isBlackListed(user.address)).to.equal(true);
    await expect(
      administrator.connect(deployer).removeBlackListUsers([user.address])
    ).not.to.be.reverted;
    expect(await administrator.isBlackListed(user.address)).to.equal(false);
  });

  it("!Blacklist", async function () {
    const { deployer, user, administrator } = await loadFixture(
      deployAdminstrator
    );
    await expect(administrator.connect(user).addBlackListUsers([user.address]))
      .to.be.reverted;
    expect(await administrator.isBlackListed(user.address)).to.equal(false);
    await expect(
      administrator.connect(user).removeBlackListUsers([user.address])
    ).to.be.reverted;
    expect(await administrator.isBlackListed(user.address)).to.equal(false);
  });
});
