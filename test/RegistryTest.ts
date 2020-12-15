import { expect } from "chai";
import { ethers } from "hardhat";

import { ZapCoordinator } from "../typechain/ZapCoordinator";
import { Database } from "../typechain/Database";
import { Registry } from "../typechain/Registry";
import { CurrentCost } from "../typechain/CurrentCost";

describe("ZapCoordinator", () => {
    let coordinator: ZapCoordinator;
    let registry : Registry;
    

  
    beforeEach(async () => {
      const signers = await ethers.getSigners();

      const coordinatorFactory = await ethers.getContractFactory(
        "ZapCoordinator",
        signers[0]
      );
      coordinator = (await coordinatorFactory.deploy()) as ZapCoordinator;
      await coordinator.deployed();

      const dbFactory = await ethers.getContractFactory(
        "Database",
        signers[0]
      );
      registry = (await dbFactory.deploy()) as Registry;
      await coordinator.deployed();
      
      await registry.transferOwnership(coordinator.address)


 

    describe("Check that we can initiate a provider", async function() {
        it("should pass", async function() {

        })

        // example params
        // let publicKey: "0xa4e5cd0b3d4a050734d2fe310b30ab0a80e72eae";
        // let title: "0x506f6c6f6e6965784150492e6d64000000000000000000000000000000000000";
        await registry.initiateProvider("0xa4e5cd0b3d4a050734d2fe310b30ab0a80e72eae", "0x506f6c6f6e6965784150492e6d64000000000000000000000000000000000000");
        expect('initiateProvider').to.be.calledOnContract(registry);
    });

//     });
// });

    // describe("Check that we can't change provider info if it was initated", async function() {
    //     it("should fail given that the provider has been initiated", async function() {

    //     })

    //     // call initiateProvider() twice with two seperate params (public key & title)
    //     await registry.initiateProvider();
    //     await registry.initiateProvider();
    //     expect(registry.initiateProvider(params)).to.be.reverted;

    // }):

    // describe("Check that we can initiate provider curve", async () => {
    //     it("should pass")

    //     })

    //     await registry.initiateProvider();
    //     await registry.initiateProviderCurve();
    // expect('initiateProviderCurve').to.be.calledOnContract(registry);


    // });

    // describe("Check that we can't initiate provider curve if provider wasn't initiated", async () => {
    //     it("should fail to initiate curve if provider was not initiated")

    //     })

    //     await registry.initiateProvider(); DO NOT UNCOMMENT
        // await registry.initiateProviderCurve();
    //    expect(registry.initiateProviderCurve(params)).to.be.reverted

    // });

    // describe("Check that we can get and set provider endpoint parameters", async () => {
    //     it("should pass")

    //     })

            // await registry.initiateProvider();
            // registry.initiateProviderCurve(bytes32,int256[],address);
            // init dummy endpoint params here
            // await registry.setEndpointParams(bytes32,bytes32[]);
            // await registry.getEndpointParams(address,bytes32);
            // expect('getEndpointParams').to.be.calledOnContractWith(registry,(address,bytes32));
            

        // });

    // describe("Check that we can get and set provider parameters", async () => {
    //     it("should pass")
    // })

            // await registry.setProviderParameter(bytes32,bytes);
            // await registry.getProviderParameter(address,bytes32);
            // expect('getProviderParameter').to.be.calledOnContractWith(registry, (address,bytes32));


            // });

    // describe("Check that we can get provider title", async () => {
    //     it("should pass")
    // })

            // await registry.initiateProvider(uint256,bytes32);
            // await registry.getProviderTitle(address);
            // expect('getProviderTitle').to.be.calledOnContractWith(registry, address);

        // });

    // describe("Check that title of uninitialized provider is empty", async () => {
    //     it("should fail")
    // })

            // verify that a specific address is uninitialized   
            // await registry.isProviderInitiated(address);
            // await registry.getProviderTitle(address);
            // expect('getProviderTitle').to.be.reverted;
        // });

    // describe("Check that we can get provider public key", async () => {
    //     it("should pass")
    // })
            // await registry.initiateProvider(uint256,bytes32);
            // await registry.getPublicKey(address);
            // expect('getPublicKey').to.be.calledOnContractWith(registry, address);

        // });

    // describe("Check that public key of uninitialized provider is equal to 0", async () => {
    //     it("")
    // })

        // });

    // describe("Check that we initialize and get provider curve", async () => {
    //     it("should pass")
    // })
            // await registry.initiateProvider(uint256,bytes32);
            // await registry.initiateProviderCurve(bytes32,int256[],address);
            // expect('getProviderCurve').to.be.calledOnContractWith(registry, params);

        // });

    // describe("Check that cant get uninitialized curve", async () => {
    //     it("")
    // })
    // TODO: delete this test as it is a copy of above

        // });

    // describe("Check that a non-owner cannot edit provider & endpoint parameters", async () => {
    //     it("")
    // })

    // describe("Check that we can get all providers", async () => {
    //     it("should pass")
    // })

            // in this case we are expecting getAllOracles to be synonymous with get all providers
            // await registry.getAllOracles();
            // expect('getAllOracles').to.be.calledOnContract(registry);

        // });
    
    // describe("Check that broker address can be saved and retreived", async () => {
    //     it("should pass")
    // })
            // await registry.initiateProvider();
            // await registry.initiateProviderCurve(bytes32,int256[],address);
            // await registry.getEndpointBroker();
            // // the address below should match with the address set during initiateProviderCurve function call
            // expect('getEndpointBroker').to.be.calledOnContractWith(registry, address);

        // });

    // describe("Check that provider can clear endpoint with no bonds", async () => {
    //     it("should pass")
    // })

            // await registry.initiateProvider();
            // await registry.initiateProviderCurve(bytes32,int256[],address);
            // await registry.clearEndpoint(bytes32);
            // expect('clearEndpoint').to.be.calledOnContractWith(registry, bytes32);



        // });

    // describe("Check that provider can change their title", async () => {
    //     it("should pass")
    // })

            // await registry.initiateProvider();
            // await registry.setProviderTitle();
            // expect('setProviderTitle').to.be.calledOnContractWith(registry, bytes32);

        // });

          
    });
});