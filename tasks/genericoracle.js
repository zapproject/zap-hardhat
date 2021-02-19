const { task, taskArgs } = require("hardhat/config");
require("hardhat-deploy-ethers");
require('hardhat-deploy');

task("generic", "Bond to generic oracle created in the oracle template")

    .setAction(async () => {

        // Test accounts
        const signers = await ethers.getSigners();
        const provider = signers[0].address;
        const endpoint = ethers.utils.formatBytes32String('Zap Price')

        const Coordinator = await ethers.getContractFactory('ZapCoordinator')
        const coordinator = await Coordinator.attach('0xe7f1725e7734ce288f8367e1bb143e90bb3f0512')

        const Subscriber = await ethers.getContractFactory('Subscriber', signers[1])
        const subscriber = await Subscriber.deploy(
            coordinator.address,
            provider,
            endpoint

        );

        console.log(await coordinator.getContract("ZAP_TOKEN"))


    });