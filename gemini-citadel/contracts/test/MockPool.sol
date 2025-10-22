// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

contract MockPool is IPool {
    IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;

    constructor(address _addressesProvider) {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(_addressesProvider);
    }

    // --- Implemented functions to satisfy compiler ---
    function supply(address, uint256, address, uint16) external override {}
    function supplyWithPermit(address, uint256, address, uint16, uint256, uint8, bytes32, bytes32) external override {}
    function withdraw(address, uint256, address) external override returns (uint256) { return 0; }
    function borrow(address, uint256, uint256, uint16, address) external override {}
    function repay(address, uint256, uint256, address) external override returns (uint256) { return 0; }
    function repayWithPermit(address, uint256, uint256, address, uint256, uint8, bytes32, bytes32) external override returns (uint256) { return 0; }
    function repayWithATokens(address, uint256, uint256) external override returns (uint256) { return 0; }
    function swapBorrowRateMode(address, uint256) external override {}
    function rebalanceStableBorrowRate(address, address) external override {}
    function setUserUseReserveAsCollateral(address, bool) external override {}
    function liquidationCall(address, address, address, uint256, bool) external override {}
    function flashLoan(address, address[] calldata, uint256[] calldata, uint256[] calldata, address, bytes calldata, uint16) external override {}
    function getReserveData(address) external view override returns (DataTypes.ReserveData memory) {
        DataTypes.ReserveData memory T;
        return T;
    }
    function getUserAccountData(address) external view override returns (uint256, uint256, uint256, uint256, uint256, uint256) { return (0, 0, 0, 0, 0, 0); }
    function getConfiguration(address) external view override returns (DataTypes.ReserveConfigurationMap memory) {
        DataTypes.ReserveConfigurationMap memory T;
        return T;
    }
    function getUserConfiguration(address) external view override returns (DataTypes.UserConfigurationMap memory) {
        DataTypes.UserConfigurationMap memory T;
        return T;
    }
    function getReserveNormalizedIncome(address) external view override returns (uint256) { return 0; }
    function getReserveNormalizedVariableDebt(address) external view override returns (uint256) { return 0; }
    function getEModeCategoryData(uint8) external view override returns (DataTypes.EModeCategory memory) {
        DataTypes.EModeCategory memory T;
        return T;
    }
    function backUnbacked(address, uint256, uint256) external override returns (uint256) { return 0; }
    function setUserEMode(uint8) external override {}
    function getReservesList() external view override returns (address[] memory) {
        address[] memory T;
        return T;
    }

    function BRIDGE_PROTOCOL_FEE() external view returns (uint256) { return 0; }
    function FLASHLOAN_PREMIUM_TOTAL() external view returns (uint128) { return 0; }
    function FLASHLOAN_PREMIUM_TO_PROTOCOL() external view returns (uint128) { return 0; }
    function MAX_NUMBER_RESERVES() external view returns (uint16) { return 0; }
    function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() external view returns (uint256) { return 0; }
    function configureEModeCategory(uint8, DataTypes.EModeCategory calldata) external override {}
    function deposit(address, uint256, address, uint16) external {}
    function dropReserve(address) external override {}
    function finalizeTransfer(address, address, address, uint256, uint256, uint256) external override {}
    function flashLoanSimple(address, address, uint256, bytes calldata, uint16) external override {}
    function getReserveAddressById(uint16) external view returns (address) { return address(0); }
    function getUserEMode(address) external view returns (uint256) { return 0; }
    function initReserve(address, address, address, address, address) external override {}
    function mintToTreasury(address[] calldata) external override {}
    function mintUnbacked(address, uint256, address, uint16) external override {}
    function rescueTokens(address, address, uint256) external override {}
    function resetIsolationModeTotalDebt(address) external override {}
    function setConfiguration(address, DataTypes.ReserveConfigurationMap calldata) external override {}
    function setReserveInterestRateStrategyAddress(address, address) external override {}
    function updateBridgeProtocolFee(uint256) external override {}
    function updateFlashloanPremiums(uint128, uint128) external override {}

}
