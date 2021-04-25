const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8545');

//contract data
const cetherBytecode = fs.readFileSync('./contracts/build/CEther.bin');
const cetherAbi = JSON.parse(fs.readFileSync('./contracts/build/CEther.abi'));

const comptrollerBytecode = fs.readFileSync('./contracts/build/Comptroller.bin');
const comptrollerAbi = JSON.parse(fs.readFileSync('./contracts/build/Comptroller.abi'));

const priceOracleBytecode = fs.readFileSync('./contracts/build/SimplePriceOracle.bin');
const priceOracleAbi = JSON.parse(fs.readFileSync('./contracts/build/SimplePriceOracle.abi'));

const interestRateBytecode = fs.readFileSync('./contracts/build/WhitePaperInterestRateModel.bin');
const interestRateAbi = JSON.parse(fs.readFileSync('./contracts/build/WhitePaperInterestRateModel.abi'));

(async function () {
  const ganacheAccounts = await web3.eth.getAccounts();
  const myWalletAddress = ganacheAccounts[0]; // inital person that holds in some money
  const myWalletAddress2 = ganacheAccounts[2]; // supplys after inital borrow
  const myWalletAddressBorrow = ganacheAccounts[1]; // borrows
  const myWalletAddressBorrow2 = ganacheAccounts[4]; // borrows 2
  const myWalletAddressBorrow3 = ganacheAccounts[5]; // borrows 3

  //comptroller
  const comptrollerContract = new web3.eth.Contract(comptrollerAbi);
  let comptrollerContractAddress = "0xE7f373f658757d45d26f24b97ca9F72479cF52bA"
  const compDeployment = await comptrollerContract.deploy({
    data: comptrollerBytecode.toString(),
  })
  .send({
    from: myWalletAddress,
    gas: 9999999999999
  })
  comptrollerContractAddress = compDeployment.options.address;
  console.log("comp contract deployed @ "+comptrollerContractAddress)
  const compContractDeployed = new web3.eth.Contract(comptrollerAbi, comptrollerContractAddress);

  // interest rate
  const interestRateContract = new web3.eth.Contract(interestRateAbi);
  let interestRateContractAddress = "0x0ADF17Fecf6BDc662EE80529EF0951786337980a"
  const interestRateDeployment = await interestRateContract.deploy({
    data: interestRateBytecode.toString(),
    arguments: ["20000000000000000", "100000000000000000"]
  })
  .send({
    from: myWalletAddress,
    gas: 9999999999999
  }).then((deployment) => {
    interestRateContractAddress = deployment.options.address;
  }).catch((err) => {
    console.error(err);
  });
  console.log("interest rate contract deployed @ "+interestRateContractAddress)

  const cEtherContract = new web3.eth.Contract(cetherAbi);
  let cEtherAddress = "0xE3Ec235731F91123FE744E9b557f8e0fcd9d0964"

  const cEtherContractDeployment = await cEtherContract.deploy({
    data: cetherBytecode.toString(),
    arguments: [comptrollerContractAddress, interestRateContractAddress, "200000000000000000000000000", "CEther","cETH",8,myWalletAddress] 
  })
  .send({
    from: myWalletAddress,
    gas: 9999999999999
  })
  cEtherAddress = cEtherContractDeployment.options.address;
  console.log("cether rate contract deployed @ "+cEtherAddress)

  // list cToken in comptroller market
  console.log(comptrollerContract.methods)
  try{
    var txComptroller = {from: myWalletAddress, gas: 9999999999999};
    const supportDeployment = await compContractDeployed.methods._supportMarket(cEtherAddress).send(txComptroller)
    // console.log("supportDeployment",supportDeployment)
  }catch(err){
    console.log("supportDeploymentErr",err)
  }
  
  //price oracle
  const priceOracleContract = new web3.eth.Contract(priceOracleAbi);
  let priceOracleContractAddress = "0xE7f373f658757d45d26f24b97ca9F72479cF52bA"
  const priceOracle = await priceOracleContract.deploy({
    data: priceOracleBytecode.toString(),
  })
  .send({
    from: myWalletAddress,
    gas: 9999999999999
  })
  priceOracleContractAddress = priceOracle.options.address;

  // set price oracle
  try{
    var txComptroller = {from: myWalletAddress, gas: 9999999999999};
    const priceOracleCDeployment = await compContractDeployed.methods._setPriceOracle(priceOracleContractAddress).send(txComptroller)
    // console.log("priceOracleCDeployment",priceOracleCDeployment)
  }catch(err){
    console.log("priceOracleCDeploymentErr",err)
  }

  const compContractEvent = await compContractDeployed.events.Debug({}, function(error, event){ 
    console.log("comptroller_debug",event);
  })

  // set collateral factor
  try{
    var txCollateralFactor = {from: myWalletAddress, gas: 9999999999999};
    const collateralFactorDeployment = await compContractDeployed.methods._setCollateralFactor(cEtherAddress,1e14).send(txCollateralFactor)
    // console.log("collateralFactorDeployment",collateralFactorDeployment)
  }catch(err){
    console.log("collateralFactorDeploymentErr",err)
  }

  const cEtherContractDeployed = new web3.eth.Contract(cetherAbi, cEtherAddress);
  const cTokenEvents1 = await cEtherContractDeployed.events.AccrueInterest({}, function(error, event){ 
    console.log("AccrueInterest - interestAccumulated:",event.returnValues['interestAccumulated'],"\n"); 
  })

  const cTokenEvents2 = await cEtherContractDeployed.events.Debug({}, function(error, event){ 
    console.log("cToken_debug",event);
  })

  const cTokenEventsFailure = await cEtherContractDeployed.events.Failure({}, function(error, event){ 
    console.log("cToken_failure",event);
  })

  for(var i = 0; i < 10; i ++){
    try{
      var txMint = {from: myWalletAddress, value:Web3.utils.toWei('1000', 'ether'), gas: 9999999999999};
      const mintDeployment = await cEtherContractDeployed.methods.mint().send(txMint)
      // console.log("mintDeployment",mintDeployment)
    }catch(err){
      console.log("mintDeploymentErr",err)
    }
  }

  const ethBalance = await web3.eth.getBalance(myWalletAddress);
  console.log("ethBalance",ethBalance)
  const balance = await cEtherContractDeployed.methods.balanceOf(myWalletAddress).call()
  console.log("balance")
  console.log(balance)

  // borrow wallet address now

  /**
   * 
   * @param {String} borrowAddress - the address to borrow with
   * @param {String} borrowAmountEther - the string amount in ether ie, ("1000") to mint first before borrowing
   */
  const mintAndBorrow = async (borrowAddress, borrowAmountEther) => {
    console.log("mintAndBorrow - address:",borrowAddress)
    try{
      var txMint = {from: borrowAddress, value:Web3.utils.toWei('1000', 'ether'), gas: 9999999999999};
      const mintDeployment = await cEtherContractDeployed.methods.mint().send(txMint)
      // console.log("mintDeployment",mintDeployment)
    }catch(err){
      console.log("mintDeploymentErr",err)
    }
  
    // const getAccountSnapshot = await cEtherContractDeployed.methods.getAccountSnapshot(borrowAddress).call()
    // console.log("getAccountSnapshot", getAccountSnapshot)
  
    try{
      let markets = [cEtherAddress]; // This is the cToken contract(s) for your collateral
      const enterMarketSend = {from: borrowAddress, gas: 9999999999999}
      const enterMarketDeployment = await compContractDeployed.methods.enterMarkets(markets).send(enterMarketSend)
      // console.log("enterMarketDeployment",enterMarketDeployment)
    }catch(err){
      console.log("enterMarketDeploymentErr",err)
    }
  
    console.log('Calculating your liquid assets in the protocol...');
    const liquidityRaw = await compContractDeployed.methods.getAccountLiquidity(borrowAddress).call();
    console.log('liquidityRaw',liquidityRaw["1"]);
  
    console.log('Fetching cETH collateral factor...');
    let { 1:collateralFactor } = await compContractDeployed.methods.markets(cEtherAddress).call();
    collateralFactor = (collateralFactor / 1e18) * 100; // Convert to percent
    console.log('collateralFactor',collateralFactor);
  
    try{
      var txMint = {from: myWalletAddress, gas: 9999999999999};
      const borrowDeployment = await cEtherContractDeployed.methods.borrow(liquidityRaw["1"]).send(txMint)
      console.log("borrowDeployment",borrowDeployment.events)
    }catch(err){
      console.log("borrowDeploymentErr",err)
    }
  }

  await mintAndBorrow(myWalletAddressBorrow)

  // back to supply address - person 2

  const ethBalance2BeforeMint = await web3.eth.getBalance(myWalletAddress2);
  console.log("ethBalance2BeforeMint",ethBalance2BeforeMint)
  const balance2BeforeMint = await cEtherContractDeployed.methods.balanceOf(myWalletAddress2).call()
  console.log("balance2BeforeMint",balance2BeforeMint)

  await mintAndBorrow(myWalletAddressBorrow2)
  await mintAndBorrow(myWalletAddressBorrow2)

  var txMint = {from: myWalletAddress2, value:Web3.utils.toWei('1000', 'ether'), gas: 9999999999999};
  const mintDeployment = await cEtherContractDeployed.methods.mint().send(txMint)
  // console.log("mintDeployment",mintDeployment)

  const ethBalance2AfterMint = await web3.eth.getBalance(myWalletAddress2);
  console.log("ethBalance2AfterMint",ethBalance2AfterMint)
  const balance2AfterMint = await cEtherContractDeployed.methods.balanceOf(myWalletAddress2).call()
  console.log("balance2AfterMint", balance2AfterMint)

  await mintAndBorrow(myWalletAddressBorrow3)
  await mintAndBorrow(myWalletAddressBorrow3)
  await mintAndBorrow(myWalletAddressBorrow3)


  console.log('Exchanging all cETH based on cToken amount...', '\n');
  await cEtherContractDeployed.methods.redeem(balance2AfterMint).send({
    from: myWalletAddress2,
    gasLimit: web3.utils.toHex(500000),
    gasPrice: web3.utils.toHex(1),
  });

  const ethBalance2AfterRedeem = await web3.eth.getBalance(myWalletAddress2);
  console.log("ethBalance2AfterRedeem",ethBalance2AfterRedeem,"ethBalance2BeforeMint",ethBalance2BeforeMint,"delta",ethBalance2AfterRedeem  - ethBalance2BeforeMint)
  const balance2AfterRedeem = await cEtherContractDeployed.methods.balanceOf(myWalletAddress2).call()
  console.log("balance2AfterRedeem",balance2AfterRedeem,"balance2AfterMint",balance2AfterMint,"delta", balance2AfterRedeem - balance2AfterMint)
})();