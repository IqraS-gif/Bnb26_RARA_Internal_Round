// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/BuilderRegistry.sol";
import "../contracts/ReleaseRegistry.sol";
import "../contracts/AttestationRegistry.sol";

contract DeployScript is Script {
    function run()
        external
        returns (address builderRegistryAddr, address releaseRegistryAddr, address attestationRegistryAddr)
    {
        // Anvil default account #0 private key for local development
        uint256 deployerPrivateKey = vm.envOr(
            "DEPLOYER_PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        BuilderRegistry builderRegistry = new BuilderRegistry(deployer);
        ReleaseRegistry releaseRegistry = new ReleaseRegistry(deployer);
        AttestationRegistry attestationRegistry =
            new AttestationRegistry(deployer, address(builderRegistry), address(releaseRegistry));

        vm.stopBroadcast();

        return (address(builderRegistry), address(releaseRegistry), address(attestationRegistry));
    }
}
