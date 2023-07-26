var XLSX = require("xlsx");

const { ethers } = require("ethers")
const UNISWAP = require("@uniswap/sdk")
const fs = require('fs');
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent} = require("@uniswap/sdk");
// const { getAddress } = require("ethers/lib/utils");
const { UNISWAP_ROUTER_ADDRESS_GOERLI, DAI_ADDRESS_GOERLI } = require("./Address");
const UNISWAP_ROUTER_ABI = require("./abi/uniswaprouter.json");


const rpcUrl = "https://ethereum-goerli.publicnode.com	";
let provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS_GOERLI, UNISWAP_ROUTER_ABI.abi, provider);





function readDataFromFile() {
    var workbook = XLSX.readFile("file/xlfile.xlsx");
    var sheet_name_list = workbook.SheetNames;
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
}


async function swapTokens(privateKey,token1, token2, amount, slippage) {

    console.log("swapping token started....");

    console.log("Tokens you spent: ", amount);

    try {
        const wallet = new ethers.Wallet(privateKey, provider);


        const pair = await Fetcher.fetchPairData(token1, token2, provider); //creating instances of a pair
        const route = await new Route([pair], token2); // a fully specified path from input token to output token
        let amountIn = ethers.utils.parseEther(amount.toString()); //helper function to convert ETH to Wei
        amountIn = amountIn.toString()
        const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance
        const trade = new Trade( //information necessary to create a swap transaction.
                route,
                new TokenAmount(token2, amountIn),
                TradeType.EXACT_INPUT
        );
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
        console.log("Tokens you will get: ",Number( amountOutMin/10**18));
        const path = [token2.address, token1.address]; //An array of token addresses
        const to = wallet.address; // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 30; // 30 secs from the current Unix time
        const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string

        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
        const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
            value: valueHex
        })
    
        //Returns a Promise which resolves to the transaction.
        let sendTxn = (await wallet).sendTransaction(rawTxn)

        console.log("Waiting....");
        //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
        let reciept = (await sendTxn).wait()

        //Logs the information about the transaction it has been mined.
        if (reciept) {
            console.log(" - Transaction is mined - " + '\n' 
            + "Transaction Hash:", (await sendTxn).hash
            + '\n' + "Block Number: " 
            + (await reciept).blockNumber + '\n' 
            + "Navigate to https://rinkeby.etherscan.io/txn/" 
            + (await sendTxn).hash, "to see your transaction")
        } else {
            console.log("Error submitting transaction")
        }

    } catch(e) {
        console.log(e)
    }
}


function randomInteger() {
    const { min, max } = { min: 5000, max: 15000 }; // mili sec
  
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const timer = ms => new Promise(res => setTimeout(res, ms))

  function randomEtherBalance() {
    const { min, max } = { min: 1, max: 5 }; // mili sec
  
    return (Math.floor(Math.random() * (max - min + 1)) + min)/100000;
  }

const startSwapingTokens = async () => {
    const Token1 = new Token(UNISWAP.ChainId.GÖRLI,DAI_ADDRESS_GOERLI,18);
    const  data = readDataFromFile();  
    for (let i = 0; i < data.length; i++) {
        const _privateKey = data[i].PrivateKey;
        console.log(data[i].amount);
        const tokenAmount = data[i].amount ? data[i].amount : randomEtherBalance();
        swapTokens(_privateKey,Token1, WETH[Token1.chainId],tokenAmount,"50" ) //first argument = token we want, second = token we have, third = the amount of token that we give (token1), fourth = Sippage tolerance

        let _increageTime = randomInteger();
        console.log(`Wait for ${_increageTime} mili Sec`);
        await timer(_increageTime); 
      
    }
  };
  


startSwapingTokens()
