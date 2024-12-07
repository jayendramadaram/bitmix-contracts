import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";

// if ((!process.env.PRIVKEY1) || (!process.env.PRIVKEY2)) {
//   throw new Error("Privkey not set");
// }

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },

      sepolia: {
        url: "https://sepolia.infura.io/v3/979d8f8712b24030a953ed0607a54e76",
        chainId: 11155111,
        accounts: [`0x5f7db706280270794a122ea35d9c6b4ad7e5b0a75f70eee53e34e763970f178e`, `0x959e517449c189d836ebf838e62cf65ed7e23335b3aca037a9f4ccabb7cb8223`]
      },

    //   base: {
    //     url: "https://base-sepolia-rpc.publicnode.com",
    //     chainId: 84532,
    //     accounts: [`0x${process.env.PRIVKEY1}`, `0x${process.env.PRIVKEY2}`]
    //   },

  },

  etherscan: {
    apiKey: "H1U44AP9EQHUSH4JDA47GH1FKKVJATX5HW"
  }
};

export default config;