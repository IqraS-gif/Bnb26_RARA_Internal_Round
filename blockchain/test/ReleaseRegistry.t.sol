// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/ReleaseRegistry.sol";

contract ReleaseRegistryTest is Test {
    ReleaseRegistry public registry;
    address public admin = address(0xAD);
    address public unauthorized = address(0x99);

    bytes32 public releaseId = keccak256("fzf-v0.74.4");
    bytes32 public sourceCommit = bytes32(0xa140afeb4d733cad3c96a56bf6db7e26853b6757000000000000000000000000);
    string public repo = "https://github.com/junegunn/fzf.git";
    string public tag = "v0.74.4";

    event ReleaseRegistered(
        bytes32 indexed releaseId, string repository, string releaseTag, bytes32 sourceCommit, uint256 timestamp
    );

    function setUp() public {
        vm.prank(admin);
        registry = new ReleaseRegistry(admin);
    }

    function test_RegisterRelease_Success() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit ReleaseRegistered(releaseId, repo, tag, sourceCommit, block.timestamp);

        registry.registerRelease(releaseId, repo, tag, sourceCommit);

        assertTrue(registry.isReleaseRegistered(releaseId));
        (bool isReg, string memory rRepo, string memory rTag, bytes32 rCommit, uint256 regAt) =
            registry.getRelease(releaseId);

        assertTrue(isReg);
        assertEq(rRepo, repo);
        assertEq(rTag, tag);
        assertEq(rCommit, sourceCommit);
        assertEq(regAt, block.timestamp);
    }

    function test_RegisterRelease_RevertIfDuplicate() public {
        vm.startPrank(admin);
        registry.registerRelease(releaseId, repo, tag, sourceCommit);

        vm.expectRevert(abi.encodeWithSelector(ReleaseRegistry.ReleaseAlreadyRegistered.selector, releaseId));
        registry.registerRelease(releaseId, repo, tag, sourceCommit);
        vm.stopPrank();
    }

    function test_RegisterRelease_RevertIfZeroParameters() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(ReleaseRegistry.ZeroBytes32.selector, "releaseId"));
        registry.registerRelease(bytes32(0), repo, tag, sourceCommit);

        vm.expectRevert(abi.encodeWithSelector(ReleaseRegistry.ZeroBytes32.selector, "sourceCommit"));
        registry.registerRelease(releaseId, repo, tag, bytes32(0));

        vm.expectRevert(abi.encodeWithSelector(ReleaseRegistry.EmptyString.selector, "repository"));
        registry.registerRelease(releaseId, "", tag, sourceCommit);

        vm.expectRevert(abi.encodeWithSelector(ReleaseRegistry.EmptyString.selector, "releaseTag"));
        registry.registerRelease(releaseId, repo, "", sourceCommit);
        vm.stopPrank();
    }

    function test_RegisterRelease_RevertIfUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        registry.registerRelease(releaseId, repo, tag, sourceCommit);
    }

    function test_UnregisteredReleaseReturnsFalse() public view {
        assertFalse(registry.isReleaseRegistered(keccak256("unknown-release")));
    }
}
