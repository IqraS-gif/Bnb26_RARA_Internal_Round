// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BuilderRegistry
 * @notice Maintains registered builder identities and their execution environments.
 * @dev Cryptographic identity is defined by the builder's Ethereum address.
 */
contract BuilderRegistry is Ownable {
    struct Builder {
        bool isRegistered;
        bool active;
        string name;
        string environment;
        uint256 registeredAt;
    }

    // Mapping from builder Ethereum address to Builder metadata
    mapping(address => Builder) private _builders;

    // Events
    event BuilderRegistered(address indexed builder, string name, string environment, uint256 timestamp);
    event BuilderDeactivated(address indexed builder, uint256 timestamp);
    event BuilderReactivated(address indexed builder, uint256 timestamp);

    // Custom errors
    error ZeroAddress();
    error BuilderAlreadyRegistered(address builder);
    error BuilderNotRegistered(address builder);
    error BuilderAlreadyActive(address builder);
    error BuilderAlreadyInactive(address builder);
    error EmptyString(string field);

    /**
     * @notice Initialize the BuilderRegistry with the deployer as owner.
     * @param initialOwner Administrator address for registry management.
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    /**
     * @notice Register a new builder with an identity address, label, and environment description.
     * @param builder Ethereum address representing the builder's cryptographic signing identity.
     * @param name Descriptive human-readable label for the builder.
     * @param environment Description of the build environment (e.g. docker-linux-amd64).
     */
    function registerBuilder(address builder, string calldata name, string calldata environment) external onlyOwner {
        if (builder == address(0)) revert ZeroAddress();
        if (bytes(name).length == 0) revert EmptyString("name");
        if (bytes(environment).length == 0) revert EmptyString("environment");
        if (_builders[builder].isRegistered) revert BuilderAlreadyRegistered(builder);

        _builders[builder] = Builder({
            isRegistered: true, active: true, name: name, environment: environment, registeredAt: block.timestamp
        });

        emit BuilderRegistered(builder, name, environment, block.timestamp);
    }

    /**
     * @notice Deactivate an active builder.
     * @param builder Ethereum address of the builder to deactivate.
     */
    function deactivateBuilder(address builder) external onlyOwner {
        if (!_builders[builder].isRegistered) revert BuilderNotRegistered(builder);
        if (!_builders[builder].active) revert BuilderAlreadyInactive(builder);

        _builders[builder].active = false;
        emit BuilderDeactivated(builder, block.timestamp);
    }

    /**
     * @notice Reactivate an inactive registered builder.
     * @param builder Ethereum address of the builder to reactivate.
     */
    function reactivateBuilder(address builder) external onlyOwner {
        if (!_builders[builder].isRegistered) revert BuilderNotRegistered(builder);
        if (_builders[builder].active) revert BuilderAlreadyActive(builder);

        _builders[builder].active = true;
        emit BuilderReactivated(builder, block.timestamp);
    }

    /**
     * @notice Retrieve metadata for a builder.
     * @param builder Ethereum address of the builder.
     * @return isRegistered Whether the builder has been registered.
     * @return active Whether the builder is currently active.
     * @return name Human-readable builder label.
     * @return environment Build environment description.
     * @return registeredAt Timestamp of initial registration.
     */
    function getBuilder(address builder)
        external
        view
        returns (bool isRegistered, bool active, string memory name, string memory environment, uint256 registeredAt)
    {
        Builder storage b = _builders[builder];
        return (b.isRegistered, b.active, b.name, b.environment, b.registeredAt);
    }

    /**
     * @notice Check whether a builder address is registered and active.
     * @param builder Ethereum address to query.
     * @return True if the builder is registered and active; false otherwise.
     */
    function isActiveBuilder(address builder) external view returns (bool) {
        return _builders[builder].isRegistered && _builders[builder].active;
    }
}
