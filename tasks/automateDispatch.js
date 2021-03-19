const { task, taskArgs } = require("hardhat/config");
var shell = require('shelljs');
var cron = require('node-cron');


require("hardhat-deploy-ethers");
require("hardhat-deploy");

task("automateDispatch", "Automates the process of dispatching the CoinGecko Oracle")

    .setAction(async () => {

        // Connection to Registry.sol
        const Registry = await ethers.getContractFactory('Registry');
        const registry = await Registry.attach('0xa513E6E4b8f2a923D98304ec87F64353C4D5C853');

        // Test accounts
        const signers = await ethers.getSigners();

        // CoinGecko's endpoint converted to bytes32 string
        let endpoint = ethers.utils.formatBytes32String('Zap Price');

        // Stores the CoinGecko's initiated status
        const initProviderStatus = await registry.isProviderInitiated(signers[0].address)

        if (initProviderStatus === true) {

            // Initiates the CoinGecko Oracle
            shell.exec('npx hardhat --network localhost initiateProviderCurve');

            // Dispatches the CoinGecko Oracle
            shell.exec('npx hardhat --network localhost dispatchCoinGecko ')

        } else {

            shell.echo('CoinGecko Oracle can not be dispatched')
        }

    })

