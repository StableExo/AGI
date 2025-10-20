// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";
import "./interfaces/IUniversalRouter.sol";
import "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

/**
 * @title FlashSwap
 * @author Jules
 * @notice This contract is the primary on-chain component of the Gemini Citadel
 * arbitrage bot. It is designed to execute arbitrage strategies by taking
 * flash loans from sources like Uniswap V3 and Aave, performing a series of
 * swaps across various decentralized exchanges (DEXs), and repaying the loan
 * within a single transaction.
 */
contract FlashSwap is IUniswapV3FlashCallback, IFlashLoanReceiver, ReentrancyGuard, Ownable {

    // =================================================================================
    //                                      STATE
    // =================================================================================

    IUniversalRouter public immutable UNIVERSAL_ROUTER;
    IPool public immutable POOL;
    address public immutable WETH;
    IUniswapV3Factory public immutable V3_FACTORY;

    uint8 internal constant DEX_TYPE_UNISWAP_V3 = 0;
    uint8 internal constant DEX_TYPE_SUSHISWAP  = 1;

    // =================================================================================
    //                                    STRUCTS
    // =================================================================================

    struct ArbParams {
        address initiator;
        address titheRecipient;
        uint256 titheBps; // 1-10000
        bool isGasEstimation;
        bytes commands;
        bytes[] inputs;
    }

    struct FlashCallbackData {
        ArbParams params;
        address pool;
        uint256 amountBorrowed;
    }

    // =================================================================================
    //                                    EVENTS
    // =================================================================================

    event FlashLoanInitiated(address indexed loanSource, address indexed initiator, address asset, uint256 amount);
    event ArbitrageExecution(address indexed loanSource, address indexed tokenBorrowed, uint256 amountBorrowed, uint256 feePaid);
    event ProfitDistribution(address indexed initiator, address indexed titheRecipient, address token, uint256 profitAmount, uint256 titheAmount);
    event SwapExecuted(uint8 indexed dexType, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    // =================================================================================
    //                                    ERRORS
    // =================================================================================

    error InvalidPool();
    error InvalidCallback();
    error InsufficientFundsForRepayment();
    error TransferFailed();
    error InvalidSwapPath();
    error InvalidDexType();
    error DistributionFailed();
    error InvalidTitheBps();

    // =================================================================================
    //                                  CONSTRUCTOR
    // =================================================================================

    constructor(
        address _universalRouter,
        address _uniswapV3Factory,
        address _wethAddress,
        address _initialOwner,
        address _aaveAddressProvider
    ) Ownable(_initialOwner) {
        UNIVERSAL_ROUTER = IUniversalRouter(_universalRouter);
        V3_FACTORY = IUniswapV3Factory(_uniswapV3Factory);
        WETH = _wethAddress;
        POOL = IPool(IPoolAddressesProvider(_aaveAddressProvider).getPool());
    }

    function ADDRESSES_PROVIDER() public view returns (IPoolAddressesProvider) {
        return POOL.ADDRESSES_PROVIDER();
    }

    // =================================================================================
    //                              EXTERNAL FUNCTIONS
    // =================================================================================

    function initiateAaveFlashLoan(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata modes, bytes calldata params, uint16 referralCode) public payable onlyOwner {
        address receiverAddress = address(this);

        try POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            address(this),
            params,
            referralCode
        ) {} catch (bytes memory reason) {
            revert(string(reason));
        }
    }

    function initiateUniswapV3FlashLoan(
        address _pool,
        address _token,
        uint256 _amount,
        bytes calldata _data // Should be the abi.encoded ArbParams
    ) external onlyOwner {
        IUniswapV3Pool pool = IUniswapV3Pool(_pool);
        address token0 = pool.token0();
        address token1 = pool.token1();

        if (_token != token0 && _token != token1) revert InvalidPool();

        uint256 amount0 = (_token == token0) ? _amount : 0;
        uint256 amount1 = (_token == token1) ? _amount : 0;

        ArbParams memory decodedParams = abi.decode(_data, (ArbParams));
        emit FlashLoanInitiated(address(pool), decodedParams.initiator, _token, _amount);

        pool.flash(
            address(this),
            amount0,
            amount1,
            abi.encode(FlashCallbackData({
                params: decodedParams,
                pool: _pool,
                amountBorrowed: _amount
            }))
        );
    }

    // =================================================================================
    //                              FLASH LOAN CALLBACKS
    // =================================================================================

    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external override nonReentrant {
        FlashCallbackData memory callbackData = abi.decode(data, (FlashCallbackData));
        IUniswapV3Pool pool = IUniswapV3Pool(callbackData.pool);

        if (msg.sender != address(pool)) revert InvalidCallback();
        if (V3_FACTORY.getPool(pool.token0(), pool.token1(), pool.fee()) != msg.sender) revert InvalidCallback();

        uint256 amountBorrowed = callbackData.amountBorrowed;
        address tokenBorrowed;
        uint256 feePaid;

        if (fee0 > 0) {
            tokenBorrowed = pool.token0();
            feePaid = fee0;
        } else {
            tokenBorrowed = pool.token1();
            feePaid = fee1;
        }

        uint256 totalRepayment = amountBorrowed + feePaid;
        emit ArbitrageExecution(address(pool), tokenBorrowed, amountBorrowed, feePaid);

        _approveSpenderIfNeeded(tokenBorrowed, address(UNIVERSAL_ROUTER), amountBorrowed);
        UNIVERSAL_ROUTER.execute(callbackData.params.commands, callbackData.params.inputs, block.timestamp);

        uint256 balanceAfterSwaps = IERC20(tokenBorrowed).balanceOf(address(this));
        if (balanceAfterSwaps < totalRepayment) revert InsufficientFundsForRepayment();

        if (!IERC20(tokenBorrowed).transfer(msg.sender, totalRepayment)) revert TransferFailed();

        uint256 netProfit = balanceAfterSwaps - totalRepayment;
        if (netProfit > 0 && !callbackData.params.isGasEstimation) {
            _distributeProfit(tokenBorrowed, netProfit, callbackData.params);
        }
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override nonReentrant returns (bool) {
        ArbParams memory arbParams = abi.decode(params, (ArbParams));

        for (uint i = 0; i < assets.length; i++) {
            emit FlashLoanInitiated(address(POOL), initiator, assets[i], amounts[i]);

            _approveSpenderIfNeeded(assets[i], address(UNIVERSAL_ROUTER), amounts[i]);
            UNIVERSAL_ROUTER.execute(arbParams.commands, arbParams.inputs, block.timestamp);

            uint256 totalRepayment = amounts[i] + premiums[i];
            emit ArbitrageExecution(address(POOL), assets[i], amounts[i], premiums[i]);

            uint256 balanceAfterSwaps = IERC20(assets[i]).balanceOf(address(this));
            if (balanceAfterSwaps < totalRepayment) revert InsufficientFundsForRepayment();

            _approveSpenderIfNeeded(assets[i], address(POOL), totalRepayment);

            uint256 netProfit = balanceAfterSwaps - totalRepayment;
            if (netProfit > 0 && !arbParams.isGasEstimation) {
                _distributeProfit(assets[i], netProfit, arbParams);
            }
        }

        return true;
    }

    // =================================================================================
    //                               INTERNAL LOGIC
    // =================================================================================

    function _distributeProfit(address token, uint256 profit, ArbParams memory params) internal {
        if (params.titheBps > 10000) revert InvalidTitheBps();

        uint256 titheAmount = (profit * params.titheBps) / 10000;
        uint256 ownerAmount = profit - titheAmount;

        emit ProfitDistribution(params.initiator, params.titheRecipient, token, ownerAmount, titheAmount);

        if (titheAmount > 0) {
            if (!IERC20(token).transfer(params.titheRecipient, titheAmount)) revert DistributionFailed();
        }
        if (ownerAmount > 0) {
            if (!IERC20(token).transfer(params.initiator, ownerAmount)) revert DistributionFailed();
        }
    }

    function _approveSpenderIfNeeded(address token, address spender, uint256 amount) internal {
        if (IERC20(token).allowance(address(this), spender) < amount) {
            IERC20(token).approve(spender, type(uint256).max);
        }
    }

    // =================================================================================
    //                                   RECEIVE
    // =================================================================================

    receive() external payable {}
}