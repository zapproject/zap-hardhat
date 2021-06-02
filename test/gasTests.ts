import { ethers } from "hardhat";

import { solidity } from "ethereum-waffle";

import chai from "chai";


import { ZapToken } from "../typechain/ZapToken";

import { ZapTransfer } from '../typechain/ZapTransfer';

import { ZapLibrary } from "../typechain/ZapLibrary";

import { ZapDispute } from "../typechain/ZapDispute";

import { ZapStake } from "../typechain/ZapStake";

import { ZapMaster } from "../typechain/ZapMaster";

import { Zap } from "../typechain/Zap";
import { BigNumber, ContractFactory } from "ethers";

const { expect } = chai;

chai.use(solidity);

let zapToken: ZapToken;

let zapTransfer: ZapTransfer;

let zapLibrary: ZapLibrary;

let zapDispute: ZapDispute;

let zapStake: ZapStake;

let zapMaster: ZapMaster;

let zap: Zap;

let signers: any;

describe("Did Mine Test", () => {

    beforeEach(async () => {

        signers = await ethers.getSigners();

        const zapTokenFactory: ContractFactory = await ethers.getContractFactory(
            "ZapToken",
            signers[0]
        )

        zapToken = (await zapTokenFactory.deploy()) as ZapToken;
        await zapToken.deployed()

        const zapTransferFactory: ContractFactory = await ethers.getContractFactory(
            "ZapTransfer",
            signers[0]
        )

        zapTransfer = (await zapTransferFactory.deploy()) as ZapTransfer
        await zapTransfer.deployed();

        const zapLibraryFactory: ContractFactory = await ethers.getContractFactory("ZapLibrary",
            {
                libraries: {
                    ZapTransfer: zapTransfer.address,
                },
                signer: signers[0]
            }
        );

        zapLibrary = (await zapLibraryFactory.deploy()) as ZapLibrary
        await zapLibrary.deployed()

        const zapDisputeFactory: ContractFactory = await ethers.getContractFactory("ZapDispute", {

            libraries: {
                ZapTransfer: zapTransfer.address,
            },
            signer: signers[0]

        });

        zapDispute = (await zapDisputeFactory.deploy()) as ZapDispute
        await zapDispute.deployed();

        const zapStakeFactory: ContractFactory = await ethers.getContractFactory("ZapStake", {

            libraries: {
                ZapTransfer: zapTransfer.address,
                ZapDispute: zapDispute.address
            },
            signer: signers[0]
        })

        zapStake = (await zapStakeFactory.deploy()) as ZapStake
        await zapStake.deployed()

        const zapFactory: ContractFactory = await ethers.getContractFactory("Zap", {

            libraries: {
                ZapStake: zapStake.address,
                ZapDispute: zapDispute.address,
                ZapLibrary: zapLibrary.address,
            },
            signer: signers[0]

        })

        zap = (await zapFactory.deploy(zapToken.address)) as Zap
        await zap.deployed()

        const zapMasterFactory: ContractFactory = await ethers.getContractFactory("ZapMaster", {
            libraries: {
                ZapTransfer: zapTransfer.address,
                ZapStake: zapStake.address
            },
            signer: signers[0]
        });

        zapMaster = (await zapMasterFactory.deploy(zap.address, zapToken.address)) as ZapMaster
        await zapMaster.deployed()

        /**
         * oracle = await Berry.new();
         * oracleRef = await RefBerry.new();
         * await oracle.theLazyMethod(accounts[0], web3.utils.toWei("7000", "ether"));
         * await oracleRef.theLazyMethod(accounts[0], web3.utils.toWei("7000", "ether"));
         */

        // // Allocates ZAP to signers 1 - 5
        // for (var i = 1; i <= 5; i++) {            
        //     await zapToken.allocate(signers[i].address, 2000);            
        // }
        console.log("started: ");
        for (var i = 0; i < signers.length; i++) {
            await zapToken.allocate(signers[i].address, 2000)
        }
    });

    it("SubmitMinningSolution", async () => {
        console.log("SubmitMinningSolution: ");
        for (var i = 1; i <= 5; i++) {

            // Connects address 1 as the signer
            zap = zap.connect(signers[i]);

            // Each Miner will submit a mining solution
            const submit = await zap.submitMiningSolution("nonce", 1, 1200);
            console.log("submit: ", submit);
            const receipt = await submit.wait()
            console.log("receipt: ", receipt);
        }
    })
    it("Transfers", async () => {
        /**
         * let gas = await oracle.transfer(
            accounts[2],
            web3.utils.toWei("1", "ether")
            );

            let ref = await oracleRef.transfer(
            accounts[2],
            web3.utils.toWei("1", "ether")
            );

            console.log(
               "Gas used: ", gas.receipt.gasUsed,
               "Gas Reference: ", ref.receipt.gasUsed
            );
            assert.isTrue(gas.receipt.gasUsed < ref.receipt.gasUsed);
         */
        console.log("SubmitMinningSolution ========================================");
    })
});