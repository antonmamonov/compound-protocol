const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

//contract data
const cetherBytecode = fs.readFileSync('./contracts/build/CEther.bin');
const cetherAbi = JSON.parse(fs.readFileSync('./contracts/build/CEther.abi'));

const comptrollerBytecode = fs.readFileSync('./contracts/build/Comptroller.bin');
const comptrollerAbi = JSON.parse(fs.readFileSync('./contracts/build/Comptroller.abi'));

const interestRateBytecode = fs.readFileSync('./contracts/build/WhitePaperInterestRateModel.bin');
const interestRateAbi = JSON.parse(fs.readFileSync('./contracts/build/WhitePaperInterestRateModel.abi'));

(async function () {
  const ganacheAccounts = await web3.eth.getAccounts();
  const myWalletAddress = ganacheAccounts[0];

  const comptrollerContract = new web3.eth.Contract(comptrollerAbi);
  let comptrollerContractAddress = "0xc32Aa92109aC93490e1a009F5763511612780b2C"
  // const compDeployment = await comptrollerContract.deploy({
  //   data: comptrollerBytecode.toString(),
  // })
  // .send({
  //   from: myWalletAddress,
  //   gas: 9999999999999
  // }).then((deployment) => {
  //   comptrollerContractAddress = deployment.options.address;
  // }).catch((err) => {
  //   console.error(err);
  // });
  console.log("comp contract deployed @ "+comptrollerContractAddress)

  const interestRateContract = new web3.eth.Contract(interestRateAbi);
  let interestRateContractAddress = "0x8c5ef5540F7236ddd7b9701cCCCb5229a4cDBa17"
  // const interestRateDeployment = await interestRateContract.deploy({
  //   data: interestRateBytecode.toString(),
  //   arguments: [2, 1]
  // })
  // .send({
  //   from: myWalletAddress,
  //   gas: 9999999999999
  // }).then((deployment) => {
  //   interestRateContractAddress = deployment.options.address;
  // }).catch((err) => {
  //   console.error(err);
  // });
  console.log("interest rate contract deployed @ "+interestRateContractAddress)

  const cEtherContract = new web3.eth.Contract(cetherAbi);
  let cEtherAddress = "0x160417ad09795978602d4d2cF2fE31bDf9A8B60c"

  // cEtherContract.deploy({
  //   data: cetherBytecode.toString(),
  //   arguments: [comptrollerContractAddress, interestRateContractAddress, 1, "CEther","CETH",18,myWalletAddress] 
  // })
  // .send({
  //   from: myWalletAddress,
  //   gas: 9999999999999
  // })
  // .then((deployment) => {
  //   cEtherAddress = deployment.options.address;
  // }).catch((err) => {
  //   console.error(err);
  // });
  
  console.log("cether rate contract deployed @ "+cEtherAddress)

  // play with Cether

  const cEtherContractDeployed = new web3.eth.Contract(cetherAbi, cEtherAddress);

  console.log(cEtherContractDeployed.methods)

  // var txMint = {from: myWalletAddress, value:Web3.utils.toWei('1', 'ether'), gas: 9999999999999};
  // cEtherContractDeployed.methods.mint().send(txMint).then((deployment) => {
  //   console.log(deployment);
  // }).catch((err) => {
  //   console.error(err);
  // });

  // web3.eth.getBalance(myWalletAddress).then(console.log);
  cEtherContractDeployed.methods.balanceOf(myWalletAddress).call().then((balance) => {
    console.log(balance);
  }).catch((err) => {
    console.error(err);
  });
})();