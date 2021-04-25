#!/bin/sh
solc --optimize --bin --abi -o ./build Comptroller.sol --overwrite
solc --optimize --bin --abi -o ./build WhitePaperInterestRateModel.sol --overwrite
solc --optimize --bin --abi -o ./build SimplePriceOracle.sol --overwrite
solc --optimize --bin --abi -o ./build CEther.sol --overwrite