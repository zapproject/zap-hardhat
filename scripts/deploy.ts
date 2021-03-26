import { ethers } from "hardhat";

const hre = require("hardhat")
const fs = require('fs')

const curveParams1 = [3, 0, 0, 2, 1000];
const curveParams2 = [3, 1, 2, 3, 1000];
const curveParams3 = [1, 10, 1000];
const curveParams4 = [3, 1, 2, 3, 10, 1, 2, 20];

const publicKey = 77
const title = '0x048a2991c2676296b330734992245f5ba6b98174d3f1907d795b7639e92ce532';
const routeKeys = [1];
const params = ["param1", "param2"];

const specifier = "0x048a2991c2676296b330734992245f5ba6b98174d3f1907d795b7639e92ce577";
const zeroAddress = '0x0000000000000000000000000000000000000000'

const piecewiseFunction = [3, 0, 0, 2, 10000];
const tokensForOwner = ethers.BigNumber.from("1500000000000000000000000000000");
const tokensForSubscriber = ethers.BigNumber.from("50000000000000000000000000000");
const approveTokens = ethers.BigNumber.from("1000000000000000000000000000000");

const dotBound = ethers.BigNumber.from("999");

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
    if (structurizedCurve[i].start <= total && total <= structurizedCurve[i].end) {
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

//TODO move these functions to another file

function _calculatePolynomial(terms: any, x: any) {
  let sum = 0;

  for (let i = 0; i < terms.length; i++) {
    sum += terms[i] * (x ** i);
  }

  return sum;
}

async function main() {

  // let signers = await ethers.getSigners();

   const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  // let owner = signers[0]

  // let subscriberAddress = signers[1];

  // let OracleSigner = signers[2];
  // let broker = signers[3];

  // let escrower = signers[4];
  // let escrower2 = signers[5];
  // let arbiter_ = signers[6];

  let overrides = {

    // The maximum units of gas for the transaction to use
    // gasLimit: 23000,

    // The price (in wei) per unit of gas
    gasPrice: ethers.utils.parseUnits('112.0', 'gwei'),
    
    // The nonce to use in the transaction
    // nonce: 123,

    // The amount to send with the transaction (i.e. msg.value)
    // value: utils.parseEther('1.0'),

    // The chain ID (or network ID) to use
    // chainId: 1

};

  const coordinator = await ethers.getContractFactory('ZapCoordinator', deployer);
  const Coordinator = await coordinator.deploy(overrides);
  console.log("Coordinator: ", Coordinator.address)


  const tokenFactory = await ethers.getContractFactory('ZapToken', deployer);
  const zapToken = await tokenFactory.deploy(overrides);
  await zapToken.deployed();
  console.log("zapToken: ", zapToken.address)

  const arbiter = await ethers.getContractFactory('Arbiter', deployer);
  const Arbiter = await arbiter.deploy(Coordinator.address, overrides);
  console.log("Arbiter: ", Arbiter.address)

  const registry = await ethers.getContractFactory('Registry', deployer)
  const Registry = await registry.deploy(Coordinator.address, overrides);
  console.log("Registry: ", Registry.address)

  const currentcost = await ethers.getContractFactory('CurrentCost', deployer)
  const CurrentCost = await currentcost.deploy(Coordinator.address, overrides);
  console.log("CurrentCost: ", CurrentCost.address)

  const database = await ethers.getContractFactory('Database', deployer)
  const Database = await database.deploy(overrides);
  console.log("Database: ", Database.address)
  
  const dispatch = await ethers.getContractFactory('Dispatch', deployer)
  const Dispatch = await dispatch.deploy(Coordinator.address, overrides);
  console.log("Dispatch: ", Dispatch.address)
  
  const faucetContract = await ethers.getContractFactory('Faucet', deployer);
  const faucet = await faucetContract.deploy(zapToken.address, overrides);
  await faucet.deployed();
  console.log("faucet: ", faucet.address)
  
  
  // Transfer ownership before creating bondage contract
  await Database.transferOwnership(Coordinator.address, overrides);

  const bondage = await ethers.getContractFactory('Bondage', deployer);
  const Bondage = await bondage.deploy(Coordinator.address, overrides);
  console.log("Bondage: ", Bondage.address)
 
  
  console.log("#####################")
  console.log("#####################")
  console.log("ALL CONTRACT DEPLOYED")
  console.log("#####################")
  console.log("#####################")



 
  await Coordinator.addImmutableContract('DATABASE', Database.address);
  await Coordinator.addImmutableContract('ARBITER', Arbiter.address);
  await Coordinator.addImmutableContract('FAUCET', faucet.address);
  await Coordinator.addImmutableContract('ZAP_TOKEN', zapToken.address);
  //await Coordinator.addImmutableContract('DISPATCH', Dispatch.address);
  //await Coordinator.addImmutableContract('BONDAGE', Bondage.address);
  await Coordinator.updateContract('REGISTRY', Registry.address);
  await Coordinator.updateContract('CURRENT_COST', CurrentCost.address);
  await Coordinator.updateContract('DISPATCH', Dispatch.address);

  await Coordinator.updateContract('BONDAGE', Bondage.address);
  await Coordinator.updateAllDependencies();
  // await hre.run('faucet')
  // //await hre.run('initiateProvider')
  // //await hre.run('initiateProviderCurve')

  await Registry.connect(deployer).initiateProvider(publicKey, title);
  await Registry.connect(deployer).initiateProviderCurve(specifier, piecewiseFunction, zeroAddress);

  // Approve the amount of Zap
  await zapToken.allocate(deployer, tokensForOwner)
  await zapToken.allocate(deployer, tokensForSubscriber)
  await zapToken.approve(Bondage.address, approveTokens)
  // await zapToken.connect(broker).approve(Bondage.address, approveTokens)
  const subscriberFactory = await ethers.getContractFactory(
    'TestClient'
  );
  const offchainSubscriberFactory = await ethers.getContractFactory(
    'OffChainClient'
  );
  const oracleFactory = await ethers.getContractFactory(
    'TestProvider'
  );
  const subscriber = (await subscriberFactory.deploy(
    zapToken.address,
    Dispatch.address,
    Bondage.address,
    Registry.address,
    overrides
  ))

  const offchainsubscriber = (await offchainSubscriberFactory.deploy(
    zapToken.address,
    Dispatch.address,
    Bondage.address,
    Registry.address,
    overrides  
  ))

  await subscriber.deployed();
  await offchainsubscriber.deployed();
  const oracle = (await oracleFactory.deploy(
    Registry.address,
    false,
    overrides
  ))
  await oracle.deployed()

  const dotFactoryFactory = await ethers.getContractFactory(
    'DotFactoryFactory',
    deployer
  );
  const genericTokenFactory = await ethers.getContractFactory(
    'TokenFactory',
    deployer
  );
  let generictoken = (await genericTokenFactory.deploy(overrides));
  await generictoken.deployed();
  await dotFactoryFactory.deploy(Coordinator.address, generictoken.address, overrides);
  

}

main()
  .then(() =>
    process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });