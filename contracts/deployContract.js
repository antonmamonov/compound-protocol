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
  const myWalletAddress = ganacheAccounts[0];

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
    arguments: [1e10, 1e10]
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
    arguments: [comptrollerContractAddress, interestRateContractAddress, 1, "CEther","cETH",18,myWalletAddress] 
  })
  .send({
    from: myWalletAddress,
    gas: 9999999999999
  })
  cEtherAddress = cEtherContractDeployment.options.address;
  console.log("cether rate contract deployed @ "+cEtherAddress)

  // list cToken in comptroller market
  // console.log(comptrollerContract.methods)
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

  for(var i = 0; i < 3; i ++){
    try{
      var txMint = {from: myWalletAddress, value:Web3.utils.toWei('1', 'ether'), gas: 9999999999999};
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

  try{
    var txMint = {from: myWalletAddress, gas: 9999999999999};
    const borrowDeployment = await cEtherContractDeployed.methods.borrow(Web3.utils.toWei('1', 'ether')).send(txMint)
    console.log("borrowDeployment",borrowDeployment)
  }catch(err){
    console.log("mintDeploymentErr",err)
  }

  for(var i = 0; i < 3; i ++){
    try{
      var txMint = {from: myWalletAddress, value:Web3.utils.toWei('1', 'ether'), gas: 9999999999999};
      const mintDeployment = await cEtherContractDeployed.methods.mint().send(txMint)
      // console.log("mintDeployment",mintDeployment)
    }catch(err){
      console.log("mintDeploymentErr",err)
    }
  }
})();