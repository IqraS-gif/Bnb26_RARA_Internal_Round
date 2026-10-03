// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/BuilderRegistry.sol";

contract BuilderRegistryTest is Test {
    BuilderRegistry public registry;
    address public admin = address(0xAD);
    address public builderA = address(0x11);
    address public builderB = address(0x22);
    address public unauthorized = address(0x99);

    event BuilderRegistered(address indexed builder, string name, string environment, uint256 timestamp);
    event BuilderDeactivated(address indexed builder, uint256 timestamp);
    event BuilderReactivated(address indexed builder, uint256 timestamp);

    function setUp() public {
        vm.prank(admin);
        registry = new BuilderRegistry(admin);
    }

    function test_RegisterBuilder_Success() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit BuilderRegistered(builderA, "Builder A", "docker-linux-amd64", block.timestamp);

        registry.registerBuilder(builderA, "Builder A", "docker-linux-amd64");

        (bool isReg, bool active, string memory name, string memory env, uint256 regAt) = registry.getBuilder(builderA);
        assertTrue(isReg);
        assertTrue(active);
        assertEq(name, "Builder A");
        assertEq(env, "docker-linux-amd64");
        assertEq(regAt, block.timestamp);
        assertTrue(registry.isActiveBuilder(builderA));
    }

    function test_RegisterBuilder_RevertIfDuplicate() public {
        vm.startPrank(admin);
        registry.registerBuilder(builderA, "Builder A", "docker-linux-amd64");

        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.BuilderAlreadyRegistered.selector, builderA));
        registry.registerBuilder(builderA, "Builder A Duplicate", "docker-linux-amd64");
        vm.stopPrank();
    }

    function test_RegisterBuilder_RevertIfZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(BuilderRegistry.ZeroAddress.selector);
        registry.registerBuilder(address(0), "Builder Zero", "docker");
    }

    function test_RegisterBuilder_RevertIfEmptyNameOrEnv() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.EmptyString.selector, "name"));
        registry.registerBuilder(builderA, "", "docker");

        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.EmptyString.selector, "environment"));
        registry.registerBuilder(builderA, "Builder A", "");
        vm.stopPrank();
    }

    function test_RegisterBuilder_RevertIfUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        registry.registerBuilder(builderA, "Builder A", "docker");
    }

    function test_DeactivateAndReactivateBuilder() public {
        vm.startPrank(admin);
        registry.registerBuilder(builderA, "Builder A", "docker-linux-amd64");
        assertTrue(registry.isActiveBuilder(builderA));

        // Deactivate
        vm.expectEmit(true, false, false, true);
        emit BuilderDeactivated(builderA, block.timestamp);
        registry.deactivateBuilder(builderA);

        assertFalse(registry.isActiveBuilder(builderA));
        (, bool active,,,) = registry.getBuilder(builderA);
        assertFalse(active);

        // Reactivate
        vm.expectEmit(true, false, false, true);
        emit BuilderReactivated(builderA, block.timestamp);
        registry.reactivateBuilder(builderA);

        assertTrue(registry.isActiveBuilder(builderA));
        vm.stopPrank();
    }

    function test_Deactivate_RevertIfAlreadyInactiveOrNotRegistered() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.BuilderNotRegistered.selector, builderA));
        registry.deactivateBuilder(builderA);

        registry.registerBuilder(builderA, "Builder A", "docker");
        registry.deactivateBuilder(builderA);

        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.BuilderAlreadyInactive.selector, builderA));
        registry.deactivateBuilder(builderA);
        vm.stopPrank();
    }

    function test_Reactivate_RevertIfAlreadyActiveOrNotRegistered() public {
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.BuilderNotRegistered.selector, builderA));
        registry.reactivateBuilder(builderA);

        registry.registerBuilder(builderA, "Builder A", "docker");
        vm.expectRevert(abi.encodeWithSelector(BuilderRegistry.BuilderAlreadyActive.selector, builderA));
        registry.reactivateBuilder(builderA);
        vm.stopPrank();
    }
}
