const { task, taskArgs } = require("hardhat/config");
require("hardhat-deploy-ethers");
require("hardhat-deploy");

task("query", "Calls dispatch.query on the first oracle using the proper endpointParams")

    .setAction(async () => {
        
        // Test accounts
        const signers = await ethers.getSigners();

        // Connection to Coordinator
        const Coordinator = await ethers.getContractFactory("ZapCoordinator");
        const coordinator = await Coordinator.attach('0xe7f1725e7734ce288f8367e1bb143e90bb3f0512')

        // Connection to Dispatch
        const Dispatch = await ethers.getContractFactory("Dispatch");
        const dispatch = await Dispatch.attach(await coordinator.getContract('DISPATCH'));

        // Stores the endpoints of all 20 providers
        let endpoint = ["Ramanujan", "Lagrange", "Wiles", "Jacobi", "Turing", "Riemann", "Poincare", "Hilbert", "Fibonacci", "Bernoulli", "Pythagoras", "Gauss", "Newton", "Euler", "Archimedes", "Euclid", "Merkle", "Shamir", "Buterin", "Nakamoto"];

      //  endpoint = endpoint.map(name => ethers.utils.formatBytes32String(name));

        // Stores the endpointParams of each endpoint of all 20 providers
        // let endpointParams = [
        //     ["A"],
        //     ["C"],
        //     ["E"],
        //     ["G"],
        //     ["I"],
        //     ["K"],
        //     ["M"],
        //     ["O"],
        //     ["Q"],
        //     ["S"],
        //     ["U"],
        //     ["W"],
        //     ["Y"],
        //     ["aa"],
        //     ["cc"],
        //     ["ee"],
        //     ["gg"],
        //     ["ii"],
        //     ["kk"],
        //     ["mm"]
        // ];

        await dispatch.query('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', "This is my first query", '0x52616d616e756a616e0000000000000000000000000000000000000000000000', ['0x4100000000000000000000000000000000000000000000000000000000000000'])
        .then((res) => {
            console.log(res);
            
            })
        
        .catch((err) => {
            return err;
        })
        //console.log(dispatch);

    
    })