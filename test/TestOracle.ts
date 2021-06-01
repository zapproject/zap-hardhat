// Signers 15, 16, 17, 18, 19, 0 are already miners

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
import { time } from "console";
import { connect } from "http2";

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

describe("Main Miner Functions", () => {

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

        let x: string;

        let apix: string;

        // Request string
        const api: string = "json(https://api.pro.coinbase.com/products/ETH-USD/ticker).price";

        // Allocates 5000 ZAP to signer 0 
        await zapToken.allocate(signers[0].address, 5000);

        for (var i = 1; i <= 5; i++) {

            // Allocates ZAP to signers 1 - 5
            await zapToken.allocate(signers[i].address, 2000);

            // Attach the ZapMaster instance to Zap
            zap = zap.attach(zapMaster.address);

            // Connects addresses 1-5 as the signer
            zap = zap.connect(signers[i]);

            // Stakes 1000 Zap to initiate a miner
            await zap.depositStake();

        }

        zap = zap.connect(signers[0]);

        // Approves Zap.sol the amount to tip for requestData
        await zapToken.approve(zap.address, 5000)

        // Iterates the length of the requestQ array
        for (var i = 0; i < 52; i++) {

            x = "USD" + i;
            apix = api + i;

            // Submits the query string as the request
            // Each request will add a tip starting at 51 and count down until 0
            // Each tip will be stored inside the requestQ array
            await zap.requestData(apix, x, 1000, 52 - i);
        }

    })

    it("Should get the new current variables", async () => {

        /*
           Gets the data properties for the current request
           bytes32 _challenge,
           uint256[5] memory _requestIds,
           uint256 _difficutly,
           uint256 _tip
           */
        const newCurrentVars = await zap.getNewCurrentVariables();

        // Expect the challenge hash to be a string
        expect(newCurrentVars[0]).to.be.a.string;

        // Expect the challenge hash to be 66 characters long
        expect(newCurrentVars[0]).length(66);

        // Expect the requestId array to have a length of 5
        expect(newCurrentVars[1]).length(5);

        // Expect the difficulty to be greater than 0
        expect(parseInt(newCurrentVars[2]._hex)).to.be.greaterThan(0);

        // Expect the tip amount to be greater than 0
        expect(parseInt(newCurrentVars[3]._hex)).to.be.greaterThan(0);

    })

    it("Should submit mining solution", async () => {

        for (var i = 1; i <= 5; i++) {

            // Connects address 1 as the signer
            zap = zap.connect(signers[i]);

            // Each Miner will submit a mining solution
            await zap.submitMiningSolution("nonce", 1, 1200);

        }

        const lastNewVals = await zapMaster.getLastNewValue();

        const requestVal = parseInt(lastNewVals[0]._hex);

        const requestStatus = lastNewVals[1];

        expect(requestVal).to.equal(1200);

        expect(requestStatus).to.equal(true);

    })

    it("Should test dispute", async () => {

        for (var i = 1; i <= 5; i++) {

            // Connects address 1 as the signer
            zap = zap.connect(signers[i]);

            // Each Miner will submit a mining solution
            await zap.submitMiningSolution("nonce", 1, 1200);

        }

        zap = zap.connect(signers[0]);

        const getTimestamp: BigNumber = await zapMaster.getTimestampbyRequestIDandIndex(
            1,
            0
        );

        const timestamp: number = parseInt(getTimestamp._hex);

        // Starts the dispute process on miner 4 (signer 18)
        await zap.beginDispute(1, timestamp, 4)

        // Converts the uintVar "disputeCount" to a bytes array
        const disputeCountBytes: Uint8Array = ethers.utils.toUtf8Bytes("disputeCount");

        // Converts the uintVar "disputeCount" from a bytes array to a keccak256 hash
        const disputeCountHash: string = ethers.utils.keccak256(disputeCountBytes);

        // Gets the the current dispute count
        const getDisputeCount: BigNumber = await zapMaster.getUintVar(disputeCountHash);

        // Dispute count
        const disputeCount = parseInt(getDisputeCount._hex);

        // Signers 0, 15, 16, 17, 18, 19, are already miners

        const miners = [
            signers[0],
            signers[15],
            signers[16],
            signers[17],
            signers[18],
            signers[19]
        ]

        for (var i = 0; i < miners.length; i++) {

            zap = zap.connect(miners[i]);

            if (i === signers[18]) {
                await zap.vote(1, false)
            }

            await zap.vote(1, true)

        }

        // console.log(await zap.tallyVotes(1))

        expect(disputeCount).to.equal(1)

    })



})

