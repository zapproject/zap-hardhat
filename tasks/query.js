const { ethers } = require("ethers");
const { task, taskArgs } = require("hardhat/config");
require("hardhat-deploy-ethers");
require("hardhat-deploy");

task("query", "Calls dispatch.query on the first 20 oracles using the proper endpointParams")

    .setAction(async () => {


        // Stores the endpointParams of each endpoint of all 20 providers
        const endpointParams = ["A, B", "C, D", "E, F", "G, H", "I, J", "K, L", "M, N", "O, P", "Q, R", "S, T", "U, V", "W, X", "Y, Z", "aa, bb", "cc, dd", "ee, ff", "gg, hh", "ii, jj", "kk, ll", "mm, nn"];

        // Stores the endpoints of all 20 providers
        const endpoint = ["Ramanujan", "Lagrange", "Wiles", "Jacobi", "Turing", "Riemann", "Poincare", "Hilbert", "Fibonacci", "Bernoulli", "Pythagoras", "Gauss", "Newton", "Euler", "Archimedes", "Euclid", "Merkle", "Shamir", "Buterin", "Nakamoto"];
        
        // Test accounts
        const signers = await ethers.getSigners();

        // Connection to Coordinator
        const Coordinator = await ethers.getContractFactory("ZapCoordinator");
        const coordinator = await Coordinator.attach('0xe7f1725e7734ce288f8367e1bb143e90bb3f0512')

        // Connection to Dispatch
        const Dispatch = await ethers.getContractFactory("Dispatch");
        const dispatch = await Dispatch.attach(await coordinator.getContract('DISPATCH'));
    })