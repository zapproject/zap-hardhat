import { ethers } from "hardhat";
const { task, } = require("hardhat/config");
require("hardhat-deploy-ethers");
require('hardhat-deploy');


const hre = require("hardhat")
const fs = require('fs')

async function main() {

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

}

// Faucet Task
task("faucet", "Sends 100K ZAP to the first 20 accounts")

  .setAction(async () => {

    // Stores the ZAP balance of each test account
    let balances: any;

    // Test accounts
    const signers = await ethers.getSigners();

    // Connection to ZapToken.sol
    const Token = await ethers.getContractFactory('ZapToken')
    const token = Token.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    // Connection to Faucet.sol
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = Faucet.attach('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');

    // ZapToken.sol funds test ZAP to Faucet.sol
    await token.allocate(faucet.address, 1000000000)
      .then((allocate: object) => {
        return allocate;
      })
      .catch((err: object) => {
        return err;
      })

    for (var i = 0; i < signers.length; i++) {

      // Test accounts purchasing 100K ZAP
      // 1 ETH = 1000 ZAP
      await faucet.buyZap(signers[i].address, 100)
        .then((res: object) => {
          return res;
        })
        .catch((err: object) => {
          return err;
        })

      // Gets the balance of each test account
      await token.balanceOf(signers[i].address)
        .then((balance: object) => {

          balances.push(balance);
        })
        .catch((err: object) => {
          return err;
        })

      // Log account details
      console.log(
        {
          signer: i,
          address: signers[i].address,
          ZAP_Balance: parseInt(balances[i]._hex) + ' ZAP',
        },
      );
    }
  });

// Check Balances Task
task("checkBalances", "Prints the test account balances")

  .setAction(async () => {

    // Stores the ZAP balance of each test account
    let balances: any;

    // Test accounts
    const signers = await ethers.getSigners();

    // Connection to ZapToken.sol
    const Token = await ethers.getContractFactory('ZapToken')
    const token = Token.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');

    for (var i = 0; i < signers.length; i++) {

      // Gets the balance of each test account
      await token.balanceOf(signers[i].address)
        .then((balance: object) => {

          balances.push(balance);
        })
        .catch((err: object) => {
          return err;
        })

      // Log account details
      console.log(
        {
          signer: i,
          address: signers[i].address,
          ZAP_Balance: parseInt(balances[i]._hex) + ' ZAP',
        },
      );
    }

  });

// Inititate Provider Task
task("initiate-Provider", "Initializes the first 20 accounts as a Provider")

  .setAction(async () => {

    // Stores the titles of all 20 providers
    const title = ["Slothrop", "Blicero", "Borgesius", "Enzian", "Pointsman", "Tchitcherine", "Achtfaden", "Andreas", "Bianca", "Bland", "Bloat", "Bodine", "Bounce", "Bummer", "Byron the Bulb", "Chiclitz", "Christian", "Darlene", "Dodson-Truck", "Erdmann"];

    // Test accounts
    const signers = await ethers.getSigners();

    // Connection to Registry.sol
    const Registry = await ethers.getContractFactory('Registry');
    const registry = Registry.attach('0xa513E6E4b8f2a923D98304ec87F64353C4D5C853');

    for (var i = 0; i < signers.length; i++) {
      // Registry.sol initializes provider on an account using ETH
      await registry.initiateProvider(signers[i].address, title[i])
        .then((res: object) => {
          return res;
        })
        .catch((err: object) => {
          return err;
        })

      // Log account details
      console.log(
        {
          signer: i,
          providerAddress: signers[i].address,
          title: title[i],
        },
      );
      //}
    }
  })

// Initiate Provider Curve Task
task("initiate-Provider-Curve", "Initializes the first 20 provider accounts with a unique bonding curve")

  .setAction(async () => {

    // Stores the titles of all 20 providers
    const title = ["Slothrop", "Blicero", "Borgesius", "Enzian", "Pointsman", "Tchitcherine", "Achtfaden", "Andreas", "Bianca", "Bland", "Bloat", "Bodine", "Bounce", "Bummer", "Byron the Bulb", "Chiclitz", "Christian", "Darlene", "Dodson-Truck", "Erdmann"];

    // Stores the endpoints of all 20 providers
    const endpoint = ["Ramanujan", "Lagrange", "Wiles", "Jacobi", "Turing", "Riemann", "Poincare", "Hilbert", "Fibonacci", "Bernoulli", "Pythagoras", "Gauss", "Newton", "Euler", "Archimedes", "Euclid", "Merkle", "Shamir", "Buterin", "Nakamoto"];

    // Stores the curves of all 20 providers
    // TODO: make all the curves below more realistic and unique
    const curve = ["1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x", "11x", "12x", "13x", "14x", "15x", "16x", "17x", "18x", "19x", "20x"];

    // Test accounts
    const signers = await ethers.getSigners();
    console.log(signers);

    // Connection to Registry.sol
    const Registry = await ethers.getContractFactory('Registry');
    const registry = Registry.attach('0xa513E6E4b8f2a923D98304ec87F64353C4D5C853');

    for (var i = 0; i < signers.length; i++) {
      // Registry.sol initializes provider on an account using ETH
      await registry.initiateProvider(signers[i].address, title[i])
        .then((res: object) => {
          return res;
        })
        .catch((err: object) => {
          return err;
        })


      // Log account details
      console.log(
        {
          signer: i,
          providerAddress: signers[i].address,
          title: title[i],
        },
      );
      //}
    }

    for (var i = 0; i < signers.length; i++) {
      // Registry.sol initializes curve on a provider account using ETH
      await registry.initiateProviderCurve(endpoint[i], title[i])
        .then((res: object) => {
          return res;
        })
        .catch((err: object) => {
          return err;
        })

      // Log account details
      console.log(
        {
          signer: i,
          endpoint: endpoint[i],
          curve: curve[i],
        },
      );

    }

  })

// Set Endpoint Params Task
task("set-Endpoint-Params", "Initialize a unique set of endpoint params for each endpoint on the first 20 accounts")

  .setAction(async () => {

    // Stores the endpointParams of each endpoint of all 20 providers
    const endpointParams = ["A, B", "C, D", "E, F", "G, H", "I, J", "K, L", "M, N", "O, P", "Q, R", "S, T", "U, V", "W, X", "Y, Z", "aa, bb", "cc, dd", "ee, ff", "gg, hh", "ii, jj", "kk, ll", "mm, nn"];

    // Stores the titles of all 20 providers
    const title = ["Slothrop", "Blicero", "Borgesius", "Enzian", "Pointsman", "Tchitcherine", "Achtfaden", "Andreas", "Bianca", "Bland", "Bloat", "Bodine", "Bounce", "Bummer", "Byron the Bulb", "Chiclitz", "Christian", "Darlene", "Dodson-Truck", "Erdmann"];

    // Stores the endpoints of all 20 providers
    const endpoint = ["Ramanujan", "Lagrange", "Wiles", "Jacobi", "Turing", "Riemann", "Poincare", "Hilbert", "Fibonacci", "Bernoulli", "Pythagoras", "Gauss", "Newton", "Euler", "Archimedes", "Euclid", "Merkle", "Shamir", "Buterin", "Nakamoto"];

    // Stores the curves of all 20 providers
    // TODO: make all the curves below more realistic and unique
    const curve = ["1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x", "11x", "12x", "13x", "14x", "15x", "16x", "17x", "18x", "19x", "20x"];

    // Test accounts
    const signers = await ethers.getSigners();
    console.log(signers);

    // Connection to Registry.sol
    const Registry = await ethers.getContractFactory('Registry');
    const registry = Registry.attach('0xa513E6E4b8f2a923D98304ec87F64353C4D5C853');

    for (var i = 0; i < signers.length; i++) {
      // Registry.sol initializes provider on an account using ETH
      await registry.initiateProvider(signers[i].address, title[i])
        .then((res:object) => {
          return res;
        })
        .catch((err:object) => {
          return err;
        })


      // Log account details
      console.log(
        {
          signer: i,
          providerAddress: signers[i].address,
          title: title[i],
        },
      );
      //}
    }

    for (var i = 0; i < signers.length; i++) {
      // Registry.sol initializes curve on a provider account using ETH
      await registry.initiateProviderCurve(endpoint[i], title[i])
        .then((res: object) => {
          return res;
        })
        .catch((err: object) => {
          return err;
        })
    }

    for (var i = 0; i < signers.length; i++) {
      // Registry.sol initializes endpoint params on a specific endpoint
      await registry.setEndpointParams(endpoint[i], endpointParams[i])
        .then((res: object) => {
          return res;
        })
        .catch((err: object) => {
          return err;
        })
      // Log details
      console.log(
        {
          signer: i,
          endpoint: endpoint[i],
          curve: curve[i],
          endpointParams: endpointParams[i],
        },
      );

    }
  })

main()
  .then(() =>
    process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
