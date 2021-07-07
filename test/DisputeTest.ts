// Signers 15, 16, 17, 18, 19, 0 are already miners

import { ethers } from 'hardhat';

import { solidity } from 'ethereum-waffle';

import chai from 'chai';

import { ZapTokenBSC } from '../typechain/ZapTokenBSC';

import { ZapTransfer } from '../typechain/ZapTransfer';

import { ZapLibrary } from '../typechain/ZapLibrary';

import { ZapDispute } from '../typechain/ZapDispute';

import { ZapStake } from '../typechain/ZapStake';

import { ZapMaster } from '../typechain/ZapMaster';

import { Zap } from '../typechain/Zap';

import { Vault } from '../typechain/Vault';

import { BigNumber, ContractFactory } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
import { Address } from 'hardhat-deploy/dist/types';

const { expect } = chai;

chai.use(solidity);

let zapTokenBsc: ZapTokenBSC;

let zapTransfer: ZapTransfer;

let zapLibrary: ZapLibrary;

let zapDispute: ZapDispute;

let zapStake: ZapStake;

let zapMaster: ZapMaster;

let zap: Zap;

let vault: Vault;

let signers: any;

describe("Test ZapDispute and it's dispute functions", () => {
  beforeEach(async () => {
    signers = await ethers.getSigners();

    const zapTokenFactory: ContractFactory = await ethers.getContractFactory(
      'ZapTokenBSC',
      signers[0]
    );

    zapTokenBsc = (await zapTokenFactory.deploy()) as ZapTokenBSC;
    await zapTokenBsc.deployed();

    const zapTransferFactory: ContractFactory = await ethers.getContractFactory(
      'ZapTransfer',
      signers[0]
    );

    zapTransfer = (await zapTransferFactory.deploy()) as ZapTransfer;
    await zapTransfer.deployed();

    const zapLibraryFactory: ContractFactory = await ethers.getContractFactory(
      'ZapLibrary',
      {
        libraries: {
          ZapTransfer: zapTransfer.address
        },
        signer: signers[0]
      }
    );

    zapLibrary = (await zapLibraryFactory.deploy()) as ZapLibrary;
    await zapLibrary.deployed();

    const zapDisputeFactory: ContractFactory = await ethers.getContractFactory(
      'ZapDispute',
      {
        libraries: {
          ZapTransfer: zapTransfer.address
        },
        signer: signers[0]
      }
    );

    zapDispute = (await zapDisputeFactory.deploy()) as ZapDispute;
    await zapDispute.deployed();

    const zapStakeFactory: ContractFactory = await ethers.getContractFactory(
      'ZapStake',
      {
        libraries: {
          ZapTransfer: zapTransfer.address,
          ZapDispute: zapDispute.address
        },
        signer: signers[0]
      }
    );

    zapStake = (await zapStakeFactory.deploy()) as ZapStake;
    await zapStake.deployed();

    const zapFactory: ContractFactory = await ethers.getContractFactory('Zap', {
      libraries: {
        ZapStake: zapStake.address,
        ZapDispute: zapDispute.address,
        ZapLibrary: zapLibrary.address
      },
      signer: signers[0]
    });

    zap = (await zapFactory.deploy(zapTokenBsc.address)) as Zap;
    await zap.deployed();

    const zapMasterFactory: ContractFactory = await ethers.getContractFactory(
      'ZapMaster',
      {
        libraries: {
          ZapTransfer: zapTransfer.address,
          ZapStake: zapStake.address
        },
        signer: signers[0]
      }
    );

    zapMaster = (await zapMasterFactory.deploy(
      zap.address,
      zapTokenBsc.address
    )) as ZapMaster;
    await zapMaster.deployed();

    const Vault: ContractFactory = await ethers.getContractFactory('Vault', {
      signer: signers[0]
    });
    vault = (await Vault.deploy(
      zapTokenBsc.address,
      zapMaster.address
    )) as Vault;
    await vault.deployed();

    // await zap.setVault(vault.address);
    await zapMaster.functions.changeVaultContract(vault.address);

    await zapTokenBsc.allocate(zapMaster.address, 10000000);

    zap = zap.attach(zapMaster.address);

    // stake signers 1 to 5.
    for (let i = 1; i <= 5; i++) {
      await zapTokenBsc.allocate(signers[i].address, 1100000);
      zap = zap.connect(signers[i]);
      await vault.connect(signers[i]).lockSmith(signers[i].address, zap.address);

      await zapTokenBsc.connect(signers[i]).approve(zapMaster.address, 500000);
      await zap.depositStake();
      expect(await zapMaster.balanceOf(signers[i].address)).to.equal(600000);
      expect(await zapMaster.balanceOf(vault.address)).to.equal(i * 500000);
    }

    let symbol: string = 'BTC/USD';
    // Request string
    const api: string =
      'json(https://api.binance.com/api/v1/klines?symbol=BTCUSDT&interval=1d&limit=1).0.4';

    await zapTokenBsc.approve(zap.address, 5000000);
    zap = zap.connect(signers[0]);
    await zap.requestData(api, symbol, 10000, 52);

    // have each miner submit a solution
    for (var i = 1; i <= 5; i++) {
      // Connects address 1 as the signer
      zap = zap.connect(signers[i]);

      /*
        Gets the data properties for the current request
        bytes32 _challenge,
        uint256[5] memory _requestIds,
        uint256 _difficutly,
        uint256 _tip
      */
      const newCurrentVars: any = await zap.getNewCurrentVariables();

      // Each Miner will submit a mining solution
      const mining = await zap.submitMiningSolution('nonce', 1, 1200);
      //   const res = await mining.wait();
      //   console.log(res)

      // Checks if the miners mined the challenge
      // true = Miner did mine the challenge
      // false = Miner did not mine the challenge
      const didMineStatus: boolean = await zapMaster.didMine(
        newCurrentVars[0],
        signers[i].address
      );
      expect(didMineStatus).to.be.true;
    }
  });

  it('Should be able to dispute a submission.', async () => {
    // Converts the uintVar "stakeAmount" to a bytes array
    const timeOfLastNewValueBytes: Uint8Array = ethers.utils.toUtf8Bytes(
      'timeOfLastNewValue'
    );

    // Converts the uintVar "stakeAmount" from a bytes array to a keccak256 hash
    const timeOfLastNewValueHash: string = ethers.utils.keccak256(
      timeOfLastNewValueBytes
    );

    // Gets the the current stake amount
    let timeStamp: BigNumber = await zapMaster.getUintVar(
      timeOfLastNewValueHash
    );

    await zapTokenBsc.connect(signers[1]).approve(zapMaster.address, 500000);

    // Convert to a bytes array
    const disputeCount: Uint8Array = ethers.utils.toUtf8Bytes('disputeCount');

    // Convert to a keccak256 hash
    const ddisputecount: string = ethers.utils.keccak256(disputeCount);

    // Gets the disputeID also the dispute count
    let disputeId: BigNumber = await zapMaster.getUintVar(ddisputecount);

    // test dispute count before beginDispute
    expect(disputeId).to.equal(
      0,
      'There should be no disputes before beginDispute.'
    );

    zap = zap.connect(signers[1]);
    await zap.beginDispute(1, timeStamp, 4);

    disputeId = await zapMaster.getUintVar(ddisputecount);
    // test dispute count after beginDispute
    expect(disputeId).to.equal(1, 'Dispute count should be 1.');

    disputeId = await zapMaster.getUintVar(ddisputecount);
    let disp = await zapMaster.getAllDisputeVars(disputeId);

    // expect to be the address that begain the dispute
    expect(disp[4]).to.equal(signers[5].address);
    // expect to be the address that is being disputed
    expect(disp[5]).to.equal(signers[1].address);
    //expect requestID disputed to be 1
    expect(disp[7][0]).to.equal(1);
    // expect timestamp to be the same timestamp used when disputed
    expect(disp[7][1]).to.equal(timeStamp);
  });

  it('Should be able to vote for (true) a dispute.', async () => {
    // Converts the uintVar "stakeAmount" to a bytes array
    const timeOfLastNewValueBytes: Uint8Array = ethers.utils.toUtf8Bytes(
      'timeOfLastNewValue'
    );

    // Converts the uintVar "stakeAmount" from a bytes array to a keccak256 hash
    const timeOfLastNewValueHash: string = ethers.utils.keccak256(
      timeOfLastNewValueBytes
    );

    // Gets the the current stake amount
    let timeStamp: BigNumber = await zapMaster.getUintVar(
      timeOfLastNewValueHash
    );

    await zapTokenBsc.connect(signers[1]).approve(zapMaster.address, 500000);

    zap = zap.connect(signers[1]);
    await zap.beginDispute(1, timeStamp, 4);
    // Convert to a bytes array
    const disputeCount: Uint8Array = ethers.utils.toUtf8Bytes('disputeCount');

    // Convert to a keccak256 hash
    const ddisputecount: string = ethers.utils.keccak256(disputeCount);

    // Gets the disputeID also the dispute count
    let disputeId: BigNumber = await zapMaster.getUintVar(ddisputecount);

    disputeId = await zapMaster.getUintVar(ddisputecount);
    let disp = await zapMaster.getAllDisputeVars(disputeId);

    let reporting_miner_wallet_bal = await zapMaster.balanceOf(disp[5]);

    expect(reporting_miner_wallet_bal).to.equal(127500);

    // expect to be the address that begain the dispute
    expect(disp[4]).to.equal(signers[5].address);
    // expect to be the address that is being disputed
    expect(disp[5]).to.equal(signers[1].address);
    //expect requestID disputed to be 1
    expect(disp[7][0]).to.equal(1);
    // expect timestamp to be the same timestamp used when disputed
    expect(disp[7][1]).to.equal(timeStamp);

    // vote of a dispute
    // signers 0-4 vote for the dispute 1
    for (var i = 0; i < 5; i++) {
      zap = zap.connect(signers[i]);
      await zap.vote(disputeId, true);
    }
    disputeId = await zapMaster.getUintVar(ddisputecount);
    disp = await zapMaster.getAllDisputeVars(disputeId);
    expect(disp[7][6]).to.equal(4);

    zapMaster.didVote(disputeId, signers[1].address);

    console.log('BEFORE TALLY');
    let blockNumber = await ethers.provider.getBlockNumber();
    console.log(blockNumber);
    let reportedMiner = await zap.getBalanceAt(disp[4], blockNumber);
    let reportedMiner2 = await zapMaster.balanceOf(disp[4]);
    console.log(
      'reportedMiner-getBalanceAt',
      ' : ',
      parseInt(reportedMiner._hex)
    );
    console.log(
      'reportedMiner-balanceOf',
      ' : ',
      parseInt(reportedMiner2._hex)
    );

    let reportingMiner = await zap.getBalanceAt(disp[5], blockNumber);
    let reportingMiner2 = await zapMaster.balanceOf(disp[5]);
    console.log(
      'reportingMiner-getBalanceAt',
      ' : ',
      parseInt(reportingMiner._hex)
    );
    console.log(
      'reportingMiner2-balanceOf',
      ' : ',
      parseInt(reportingMiner2._hex)
    );

    // Increase the evm time by 8 days
    // A stake can not be withdrawn until 7 days passed
    await ethers.provider.send('evm_increaseTime', [691200]);
    await zap.tallyVotes(disputeId);

    disp = await zapMaster.getAllDisputeVars(disputeId);
    // console.log('oooooooooo');
    // console.log(disp);
    // console.log('oooooooooo');

    // expect voting to have ended
    expect(disp[1]).to.be.true;

    // expect dispute to be successful
    expect(disp[2]).to.be.true;

    // let disputeFee = disp[7][8];

    console.log('AFTER TALLY');

    blockNumber = await ethers.provider.getBlockNumber();
    console.log(blockNumber);
    reportedMiner = await zap.getBalanceAt(disp[4], blockNumber);
    reportingMiner = await zap.getBalanceAt(disp[5], blockNumber);
    reporting_miner_wallet_bal = await zapMaster.balanceOf(disp[5]);

    console.log(parseInt(reporting_miner_wallet_bal._hex));
    console.log('AAAAAAAAAAAA');
    // let zMBal = await zap.getBalanceAt(zapMaster.address, blockNumber);
    blockNumber = await ethers.provider.getBlockNumber();
    // let zMBal = await zap.getBalanceAt(zapMaster.address, blockNumber);
    let zMBal2 = await zapMaster.balanceOf(zapMaster.address);
    // console.log('zMBal: ', parseInt(zMBal._hex));
    console.log('zMBal2: ', parseInt(zMBal2._hex));
    console.log(zapMaster.address);
    console.log('AAAAAAAAAAAA');

    // expect balance of loser to be 500k (original stake amount) + 15(reward for mining) - 500k(lose staked tokens) = 15.
    expect(reportedMiner).to.equal(15);
    // expect balance of winner's wallet to be 600K: 600k(leftover bal. after staking) - 427500 (pay dispute fee) + 427500 (win back dispute fee)  = 600K.
    expect (reporting_miner_wallet_bal).to.equal(600000);
    // expect balance of winner to be 500k(original stake amount) + 15(reward for mining ) + 500K(take losers stake amount) = 1000015.
    expect(reportingMiner).to.equal(1000015);
  });
  it('Should be able to vote against (false) a dispute.', async () => {
    // Converts the uintVar "stakeAmount" to a bytes array
    const timeOfLastNewValueBytes: Uint8Array = ethers.utils.toUtf8Bytes(
      'timeOfLastNewValue'
    );

    // Converts the uintVar "stakeAmount" from a bytes array to a keccak256 hash
    const timeOfLastNewValueHash: string = ethers.utils.keccak256(
      timeOfLastNewValueBytes
    );

    // Gets the the current stake amount
    let timeStamp: BigNumber = await zapMaster.getUintVar(
      timeOfLastNewValueHash
    );

    await zapTokenBsc.connect(signers[1]).approve(zapMaster.address, 500000);

    zap = zap.connect(signers[1]);
    await zap.beginDispute(1, timeStamp, 4);
    // Convert to a bytes array
    const disputeCount: Uint8Array = ethers.utils.toUtf8Bytes('disputeCount');

    // Convert to a keccak256 hash
    const ddisputecount: string = ethers.utils.keccak256(disputeCount);

    // Gets the disputeID also the dispute count
    let disputeId: BigNumber = await zapMaster.getUintVar(ddisputecount);

    disputeId = await zapMaster.getUintVar(ddisputecount);
    let disp = await zapMaster.getAllDisputeVars(disputeId);

    let reporting_miner_wallet_bal = await zapMaster.balanceOf(disp[5]);

    expect(reporting_miner_wallet_bal).to.equal(127500);

    // expect to be the address that begain the dispute
    expect(disp[4]).to.equal(signers[5].address);
    // expect to be the address that is being disputed
    expect(disp[5]).to.equal(signers[1].address);
    //expect requestID disputed to be 1
    expect(disp[7][0]).to.equal(1);
    // expect timestamp to be the same timestamp used when disputed
    expect(disp[7][1]).to.equal(timeStamp);

    // vote of a dispute
    // signers 0-4 vote for the dispute 1
    for (var i = 0; i < 5; i++) {
      zap = zap.connect(signers[i]);
      await zap.vote(disputeId, false);
    }
    disputeId = await zapMaster.getUintVar(ddisputecount);
    disp = await zapMaster.getAllDisputeVars(disputeId);
    expect(disp[7][6]).to.equal(4);

    zapMaster.didVote(disputeId, signers[1].address);

    console.log('BEFORE TALLY');
    let blockNumber = await ethers.provider.getBlockNumber();
    console.log(blockNumber);
    let reportedMiner = await zap.getBalanceAt(disp[4], blockNumber);
    let reportedMiner2 = await zapMaster.balanceOf(disp[4]);
    console.log(
      'reportedMiner-getBalanceAt',
      ' : ',
      parseInt(reportedMiner._hex)
    );
    console.log(
      'reportedMiner-balanceOf',
      ' : ',
      parseInt(reportedMiner2._hex)
    );

    let reportingMiner = await zap.getBalanceAt(disp[5], blockNumber);
    let reportingMiner2 = await zapMaster.balanceOf(disp[5]);
    console.log(
      'reportingMiner-getBalanceAt',
      ' : ',
      parseInt(reportingMiner._hex)
    );
    console.log(
      'reportingMiner2-balanceOf',
      ' : ',
      parseInt(reportingMiner2._hex)
    );

    // Increase the evm time by 8 days
    // A stake can not be withdrawn until 7 days passed
    await ethers.provider.send('evm_increaseTime', [691200]);
    await zap.tallyVotes(disputeId);

    disp = await zapMaster.getAllDisputeVars(disputeId);
    // console.log('oooooooooo');
    // console.log(disp);
    // console.log('oooooooooo');

    // expect voting to have ended
    expect(disp[1]).to.be.true;

    // expect dispute to be successful
    expect(disp[2]).to.be.false;

    // let disputeFee = disp[7][8];

    console.log('AFTER TALLY');

    blockNumber = await ethers.provider.getBlockNumber();
    console.log(blockNumber);
    reportedMiner = await zap.getBalanceAt(disp[4], blockNumber);
    reportingMiner = await zap.getBalanceAt(disp[5], blockNumber);
    let reported_miner_wallet_bal = await zapMaster.balanceOf(disp[4]);
    reporting_miner_wallet_bal = await zapMaster.balanceOf(disp[5]);

    console.log(parseInt(reported_miner_wallet_bal._hex));
    console.log(parseInt(reporting_miner_wallet_bal._hex));
    console.log('AAAAAAAAAAAA');
    // let zMBal = await zap.getBalanceAt(zapMaster.address, blockNumber);
    blockNumber = await ethers.provider.getBlockNumber();
    // let zMBal = await zap.getBalanceAt(zapMaster.address, blockNumber);
    let zMBal2 = await zapMaster.balanceOf(zapMaster.address);
    // console.log('zMBal: ', parseInt(zMBal._hex));
    console.log('zMBal2: ', parseInt(zMBal2._hex));
    console.log(zapMaster.address);
    console.log('AAAAAAAAAAAA');

    // 972515. expect balance of reported miner (winner) to be 500k (original stake amount) + 15(reward for mining) = 500015 since miner didn't lose stake amount to disputer.
    console.log('A');
    expect(reportedMiner).to.equal(500015);
    // expect balance of loser's wallet to be 127500: 600k(leftover bal. after staking) - 427500 (pay dispute fee) = 127500 since reporter lost their fee to disputed miner.
    console.log('B');
    expect(reported_miner_wallet_bal).to.equal(1072500); //600K + 472500(dispute fee)
    expect(reporting_miner_wallet_bal).to.equal(127500); // 600k - 472500(dispute fee)
    // expect balance of loser to be 500k(original stake amount) + 15(reward for mining ) = 500015 for not winning the disputed miners stake.
    console.log('C');
    expect(reportingMiner).to.equal(500015);
  });
});
