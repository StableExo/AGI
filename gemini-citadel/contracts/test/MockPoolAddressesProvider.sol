// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

contract MockPoolAddressesProvider is IPoolAddressesProvider {
    address private poolAddress;

    constructor(address _poolAddress) {
        poolAddress = _poolAddress;
    }

    function getPool() external view override returns (address) {
        return poolAddress;
    }

    // --- Implemented functions to satisfy compiler ---
    function setPoolImpl(address) external override {}
    function getPoolImpl() external view returns (address) { return address(0); }
    function setPoolConfiguratorImpl(address) external override {}
    function getPoolConfiguratorImpl() external view returns (address) { return address(0); }
    function setPriceOracle(address) external override {}
    function getPriceOracle() external view override returns (address) { return address(0); }
    function setACLManager(address) external override {}
    function getACLManager() external view override returns (address) { return address(0); }
    function setACLAdmin(address) external override {}
    function getACLAdmin() external view override returns (address) { return address(0); }
    function setPriceOracleSentinel(address) external override {}
    function getPriceOracleSentinel() external view override returns (address) { return address(0); }
    function setPoolDataProvider(address) external override {}
    function getPoolDataProvider() external view override returns (address) { return address(0); }
    function getMarketId() external view override returns (string memory) { return ""; }
    function setMarketId(string calldata) external override {}
    function getAddress(bytes32) external view override returns (address) { return address(0); }
    function setAddress(bytes32, address) external override {}
    function setAddressAsProxy(bytes32, address) external override {}
    function getPoolConfigurator() external view returns (address) { return address(0); }
    function getOwner() external view returns (address) { return address(0); }
    function setOwner(address) external {}
}
