import { ethers } from "hardhat";

const hre = require("hardhat")
const fs = require('fs')

async function main() {

    const balances = [];
    const signers = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory('ZapToken');
    const zapToken = await tokenFactory.deploy();
    await zapToken.deployed();

    const faucetContract = await ethers.getContractFactory('Faucet');
    const faucet = await faucetContract.deploy(zapToken.address);
    await faucet.deployed();

    // Core Contracts 

    const coordinator = await ethers.getContractFactory('ZapCoordinator');
    const Coordinator = await coordinator.deploy();

    const database = await ethers.getContractFactory('Database')
    const Database = await database.deploy();

    // const publicKey = await ethers.BigNumber.isBigNumber(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);

    // The majority of the core contracts take the Coordinator as params
    const arbiter = await ethers.getContractFactory('Arbiter');
    const Arbiter = await arbiter.deploy(Coordinator.address);

    const bondage = await ethers.getContractFactory('Bondage');
    const Bondage = await bondage.deploy(Coordinator.address);

    const dispatch = await ethers.getContractFactory('Dispatch')
    const Dispatch = await dispatch.deploy(Coordinator.address);

    const registry = await ethers.getContractFactory('Registry')
    const Registry = await registry.deploy(Coordinator.address);

    // const onchainOracle = await ethers.getContractFactory('SampleOnChainOracle');
    // const OnchainOracle = await onchainOracle.deploy(Coordinator.address,
    //   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, test);

    console.log("zapToken address:", zapToken.address);
    console.log("Faucet address:", faucet.address);
    console.log("ZapCoordinator address:", Coordinator.address);
    console.log("Database address:", Database.address);
    console.log("Arbiter address:", Arbiter.address);
    console.log("Bondage address:", Bondage.address);
    console.log("Registry address:", Registry.address);
    // console.log("Onchain Oracle address:", OnchainOracle.address);

    // ZapToken.sol funds test ZAP to Faucet.sol
    await zapToken.allocate(faucet.address, 1000000000)
        .then((allocate: any) => {
            return allocate;
        })
        .catch((err) => {
            return err;
        })
    }

    for (var i = 0; i < signers.length; i++) {

        // Test accounts purchasing 100K ZAP
        // 1 ETH = 1000 ZAP
        await faucet.buyZap(signers[i].address, 100)
            .then((res) => {
                return res;
            })
            .catch((err) => {
                return err;
            })


main()
    .then(() =>
        process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
