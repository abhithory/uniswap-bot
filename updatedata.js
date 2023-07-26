var XLSX = require("xlsx");
const { ethers } = require("ethers")
const TOKEN_ABI = require("./abi/token.json");
const { RPC_URL, UNISWAP_ROUTER_ADDRESS, TOKEN_ADDRESS, TOKEN_DECIMALS } = require("./src/config");

const init = async () => {
    const AccountDetails = readDataFromFile();
    for (let i = 0; i < AccountDetails.length; i++) {
        const publickey = AccountDetails[i].publickey;

        let tokenTotalBalance = await TOKEN_CONTRACT.balanceOf(publickey);
        tokenTotalBalance = Number(weiToEth(tokenTotalBalance))
    }
};



init()
