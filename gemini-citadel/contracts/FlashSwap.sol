// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// Forward-declare interfaces for other protocols
interface IUniswapV2Router02 {}
interface IPool {} // Aave Pool
interface IFlashLoanReceiver {}

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

    ISwapRouter public immutable SWAP_ROUTER;
    IPool public immutable AAVE_POOL;
    address public immutable WETH;
    IUniswapV3Factory public immutable V3_FACTORY;

    uint8 internal constant DEX_TYPE_UNISWAP_V3 = 0;
    uint8 internal constant DEX_TYPE_SUSHISWAP  = 1;

    // =================================================================================
    //                                    STRUCTS
    // =================================================================================

    struct SwapStep {
        uint8 dexType;
        address tokenIn;
        address tokenOut;
        uint256 minAmountOut;
        address poolOrRouter; // For UniV3, this is the pool address
        uint24 poolFee;
    }

    struct ArbParams {
        address initiator;
        address titheRecipient;
        uint256 titheBps; // 1-10000
        bool isGasEstimation;
        SwapStep[] path;
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
        address _uniswapV3Router,
        address _aavePool,
        address _uniswapV3Factory,
        address _wethAddress,
        address _initialOwner
    ) Ownable(_initialOwner) {
        SWAP_ROUTER = ISwapRouter(_uniswapV3Router);
        AAVE_POOL = IPool(_aavePool);
        V3_FACTORY = IUniswapV3Factory(_uniswapV3Factory);
        WETH = _wethAddress;
    }

    // =================================================================================
    //                              EXTERNAL FUNCTIONS
    // =================================================================================

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

        _executeSwapPath(callbackData.params.path, amountBorrowed);

        uint256 balanceAfterSwaps = IERC20(tokenBorrowed).balanceOf(address(this));
        if (balanceAfterSwaps < totalRepayment) revert InsufficientFundsForRepayment();

        if (!IERC20(tokenBorrowed).transfer(msg.sender, totalRepayment)) revert TransferFailed();

        uint256 netProfit = balanceAfterSwaps - totalRepayment;
        if (netProfit > 0 && !callbackData.params.isGasEstimation) {
            _distributeProfit(tokenBorrowed, netProfit, callbackData.params);
        }
    }

    function executeOperation(
        address[] calldata, address[] calldata, uint256[] calldata, address, bytes calldata
    ) external nonReentrant returns (bool) {
        // Aave implementation to be added in a future step.
        return true;
    }

    // =================================================================================
    //                               INTERNAL LOGIC
    // =================================================================================

    function _executeSwapPath(SwapStep[] memory path, uint256 initialAmount) internal {
        if (path.length == 0) revert InvalidSwapPath();

        uint256 amountIn = initialAmount;

        for (uint i = 0; i < path.length; i++) {
            SwapStep memory step = path[i];
            uint256 amountOut;

            if (step.dexType == DEX_TYPE_UNISWAP_V3) {
                _approveSpenderIfNeeded(step.tokenIn, address(SWAP_ROUTER), amountIn);

                ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                    tokenIn: step.tokenIn,
                    tokenOut: step.tokenOut,
                    fee: step.poolFee,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: step.minAmountOut,
                    sqrtPriceLimitX96: 0
                });

                amountOut = SWAP_ROUTER.exactInputSingle(params);
            } else {
                revert InvalidDexType();
            }

            emit SwapExecuted(step.dexType, step.tokenIn, step.tokenOut, amountIn, amountOut);
            amountIn = amountOut; // Output of this step is input for the next
        }
    }

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
