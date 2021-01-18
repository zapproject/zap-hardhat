import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import chai from 'chai';
import mocha from 'mocha';

/**
 * const DotFactory = artifacts.require("ERCDotFactory");
const EthAdapter = artifacts.require("EthAdapter");
const TokenAdapter = artifacts.require("TokenAdapter");
const EthGatedMarket = artifacts.require("EthGatedMarket");
 */
import { ZapCoordinator } from '../typechain/ZapCoordinator';
import { Database } from '../typechain/Database';
import { Registry } from '../typechain/Registry';
import { Bondage } from '../typechain/Bondage';
import { ZapToken } from '../typechain/ZapToken';
import { CurrentCost } from '../typechain/CurrentCost';
//import { ERCDotFactory } from '../typechain/ERCDotFactory';
//import {EthAdapter} from '../typechain/EthAdapter';
//import {TokenAdapter} from '../typechain/TokenAdapter';
//import {EthGatedMarket} from '../EthGatedMarked';
import {TokenFactory} from '../typechain/TokenFactory';
chai.use(solidity);
const { expect } = chai;

const publicKey = 77;
const title =
  '0x048a2991c2676296b330734992245f5ba6b98174d3f1907d795b7639e92ce532';
const routeKeys = [1];
const params = ['param1', 'param2'];

const specifier =
  '0x048a2991c2676296b330734992245f5ba6b98174d3f1907d795b7639e92ce577';
const zeroAddress = '0x0000000000000000000000000000000000000000';

const piecewiseFunction = [3, 0, 0, 2, 10000];

const tokensForOwner = ethers.BigNumber.from('1500000000000000000000000000000');

const tokensForSubscriber = ethers.BigNumber.from(
  '50000000000000000000000000000'
);

const approveTokens = ethers.BigNumber.from('1000000000000000000000000000000');

const dotBound = ethers.BigNumber.from('999');
const structurizeCurve = function (parts: any) {
  const pieces = Array();

  let index = 0;
  let start = 1;

  while (index < parts.length) {
    const length = parts[index];
    const base = index + 1;
    const terms = parts.slice(base, base + length);
    const end = parts[base + length];

    pieces.push({
      terms,
      start,
      end
    });

    index = base + length + 1;
    start = end;
  }

  return pieces;
};
const calcNextDotCost = function (structurizedCurve: any, total: any) {
  if (total < 0) {
    return 0;
  }

  for (let i = 0; i < structurizedCurve.length; i++) {
    if (
      structurizedCurve[i].start <= total &&
      total <= structurizedCurve[i].end
    ) {
      return _calculatePolynomial(structurizedCurve[i].terms, total);
    }
  }

  return 0;
};

const calcDotsCost = function (structurizedCurve: any, numDots: any) {
  let cost = 0;

  for (let i = 1; i <= numDots; i++) {
    cost += calcNextDotCost(structurizedCurve, i);
  }

  return cost;
};

function _calculatePolynomial(terms: any, x: any) {
  let sum = 0;

  for (let i = 0; i < terms.length; i++) {
    sum += terms[i] * x ** i;
  }

  return sum;
}
async function deployDotFactory(signer:any,factoryAddress:any,deployer:any){
  const dotFactory = await ethers.getContractFactory(
    'DotFactory',
    signer
  );
  let dotInstance =await dotFactory.deploy(deployer,factoryAddress) as TokenFactory;
  return await dotInstance.deployed()
}
describe('ZapBondage', () => {
  let zapToken: ZapToken;
  let dataBase: Database;
  let bondage: Bondage;
  let cost: CurrentCost;
  let registry: Registry;
  //let dotfactory:ERCDotFactory;
  let tokenfactory:TokenFactory;
  let allocatedAmt: number;
  let signers: any;
  let coordinator: ZapCoordinator;
  let owner: any;
  let subscriber: any;
  let oracle: any;
  let broker: any;
  let escrower: any;
  let escrower2: any;
  let arbiter: any;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    subscriber = signers[1];
    oracle = signers[2];
    broker = signers[3];
    escrower = signers[4];
    escrower2 = signers[5];
    arbiter = signers[6];
    const zapTokenFactory = await ethers.getContractFactory(
      'ZapToken',
      signers[0]
    );

    const coordinatorFactory = await ethers.getContractFactory(
      'ZapCoordinator',
      signers[0]
    );

    const dbFactory = await ethers.getContractFactory('Database', signers[0]);

    const registryFactory = await ethers.getContractFactory(
      'Registry',
      signers[0]
    );
    const costFactory = await ethers.getContractFactory(
      'CurrentCost',
      signers[0]
    );
    const tokenFactory = await ethers.getContractFactory(
      'TokenFactory',
      signers[0]
    );
    const bondFactory = await ethers.getContractFactory('Bondage', signers[0]);

    zapToken = (await zapTokenFactory.deploy()) as ZapToken;

    await zapToken.deployed();

    coordinator = (await coordinatorFactory.deploy()) as ZapCoordinator;
    await coordinator.deployed();

    dataBase = (await dbFactory.deploy()) as Database;

    cost = (await costFactory.deploy(coordinator.address)) as CurrentCost;

    registry = (await registryFactory.deploy(coordinator.address)) as Registry;

    await dataBase.transferOwnership(coordinator.address);
    
    await coordinator.addImmutableContract('DATABASE', dataBase.address);

    await coordinator.addImmutableContract('ARBITER', arbiter.address);
    await coordinator.addImmutableContract('ZAP_TOKEN', zapToken.address);
    
    await coordinator.updateContract('REGISTRY', registry.address);
    await coordinator.updateContract('CURRENT_COST', cost.address);
   

    bondage = (await bondFactory.deploy(coordinator.address)) as Bondage;
    
    await coordinator.updateContract('BONDAGE', bondage.address);
    

    await coordinator.updateAllDependencies();
    tokenfactory =await tokenFactory.deploy() as TokenFactory;
    await tokenfactory.deployed()
  });
  
 