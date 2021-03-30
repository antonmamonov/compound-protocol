const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8545');

//contract data
const cetherBytecode = fs.readFileSync('./contracts/build/CEther.bin');
const cetherAbi = JSON.parse(fs.readFileSync('./contracts/build/CEther.abi'));

const comptrollerBytecode = fs.readFileSync('./contracts/build/ComptrollerG6.bin');
const comptrollerAbi = JSON.parse(fs.readFileSync('./contracts/build/ComptrollerG6.abi'));

const priceOracleBytecode = fs.readFileSync('./contracts/build/SimplePriceOracle.bin');
const priceOracleAbi = JSON.parse(fs.readFileSync('./contracts/build/SimplePriceOracle.abi'));

const interestRateBytecode = fs.readFileSync('./contracts/build/WhitePaperInterestRateModel.bin');
const interestRateAbi = JSON.parse(fs.readFileSync('./contracts/build/WhitePaperInterestRateModel.abi'));

(async function () {
  const ganacheAccounts = await web3.eth.getAccounts();
  const myWalletAddress = ganacheAccounts[0];
  const myWalletAddressBorrow = ganacheAccounts[1];

  //get both of the below this from the output of compoundSupplyAsset.js
  const cEtherAddress = "0xD0267e9324a28f9A7F53FC00C73c389442c9766a"
  const comptrollerContractAddress = "0xF8Ea5997E6c7437bd7c75d4ec1026D124C87f1BE"

  const cEtherContractDeployed = new web3.eth.Contract(cetherAbi, cEtherAddress);
  const cTokenEvents1 = await cEtherContractDeployed.events.AccrueInterest({}, function(error, event){ 
    console.log("AccrueInterest",event); 
  })

  const cTokenEvents2 = await cEtherContractDeployed.events.Debug({}, function(error, event){ 
    console.log("cToken_debug",event);
  })

  const cTokenEventsFailure = await cEtherContractDeployed.events.Failure({}, function(error, event){ 
    console.log("cToken_failure",event);
  })

  const ethToSupplyAsCollateral = 1;

  const compContractDeployed = new web3.eth.Contract(comptrollerAbi, comptrollerContractAddress);

  console.log('\nSupplying ETH to the protocol as collateral (you will get cETH in return)...\n');
  let mint = await cEtherContractDeployed.methods.mint().send({
    from: myWalletAddressBorrow,
    gasLimit: web3.utils.toHex(150000),
    gasPrice: web3.utils.toHex(20000000000), // use ethgasstation.info (mainnet only)
    value: web3.utils.toHex(ethToSupplyAsCollateral * 1e18)
  });

// Web3 transaction information, we'll use this for every transaction we'll send
    const fromMyWallet = {
    from: myWalletAddressBorrow,
    gasLimit: web3.utils.toHex(500000),
    gasPrice: web3.utils.toHex(20000000000) // use ethgasstation.info (mainnet only)
  };

  const assetName = 'cETH'; // for the log output lines
  const underlyingDecimals = 18; // Number of decimals defined in this ERC20 token's contract

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [cEtherAddress]; // This is the cToken contract(s) for your collateral
  let enterMarkets = await compContractDeployed.methods.enterMarkets(markets).send(fromMyWallet);

  console.log('Calculating your liquid assets in the protocol...');
  let { 1:liquidity } = await compContractDeployed.methods.getAccountLiquidity(myWalletAddressBorrow).call();
  liquidity = liquidity / 1e18;
  console.log(liquidity)

  console.log('Fetching cETH collateral factor...');
  let { 1:collateralFactor } = await compContractDeployed.methods.markets(cEtherAddress).call();
  collateralFactor = (collateralFactor / 1e18) * 100; // Convert to percent
  console.log(collateralFactor)


  underlyingPriceInUsd = 1; // Price feed provides price in USD with 6 decimal places

  console.log(`Fetching borrow rate per block for ${assetName} borrowing...`);
  let borrowRate = await cEtherContractDeployed.methods.borrowRatePerBlock().call();
  borrowRate = borrowRate / Math.pow(10, underlyingDecimals);

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL collateral supplied to the protocol as ${assetName}.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity/underlyingPriceInUsd} ${assetName} from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
  console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ${assetName} per block.\nThis is based on the current borrow rate.\n`);

})();