var XLSX = require("xlsx");
const { ethers } = require("ethers")
const UNISWAP = require("@uniswap/sdk")
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const UNISWAP_ROUTER_ABI = require("./abi/uniswaprouter.json");
const yargs = require('yargs');
const argv = yargs
  .option('g', {
    alias: 'group',
    describe: 'Specify a group',
    type: 'string'
  })
  .argv;
const { RPC_URL, UNISWAP_ROUTER_ADDRESS, TOKEN_ADDRESS, TOKEN_DECIMALS } = require("./src/config");


let provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI.abi, provider);



function readDataFromFile() {
  var workbook = XLSX.readFile("file/xlfile.xlsx");
  var sheet_name_list = workbook.SheetNames;
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
}


async function swapTokens(privateKey, token1, token2, amount, slippage) {

  console.log("Swapping token started....");
  console.log("Tokens you have spent: ", amount);

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
    console.log("Tokens you will get: ", Number(amountOutMin / 10 ** 18));
    const path = [token2.address, token1.address]; //An array of token addresses
    const to = wallet.address; // should be a checksummed recipient address

    const value = trade.inputAmount.raw;
    const valueHex = await ethers.BigNumber.from(value.toString()).toHexString();

    const deadline = Math.floor(Date.now() / 1000) + 60; // 60 secs from the current Unix time

    // swapExactETHForTokens
      const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMinHex, path, to, deadline, {
      value: valueHex,
      gasPrice: ethers.utils.parseUnits("50", 'gwei'),
      // gasLimit: 200000,
    })
    let sendTxn = (await wallet).sendTransaction(rawTxn)
    console.log("Waiting for transaction....");
    let reciept = (await sendTxn).wait()
    if (reciept) {
      console.log(" - Transaction is mined - " + '\n'
        + "Transaction Hash:", (await sendTxn).hash
        + '\n' + "Block Number: "
      + (await reciept).blockNumber)
    } else {
      console.log("Error submitting transaction")
    }

  } catch (e) {
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

  return (Math.floor(Math.random() * (max - min + 1)) + min) / 10 ** 5;
}

const init = async () => {
  const Token1 = new Token(UNISWAP.ChainId.GÖRLI, TOKEN_ADDRESS, TOKEN_DECIMALS);
  const allowedGroups = argv.group;

  if (!allowedGroups) {
    console.log("Please secify group with command");
    return;
  }

  const AccountDetails = readDataFromFile();
  for (let i = 0; i < AccountDetails.length; i++) {
    const privateKey = AccountDetails[i].privatekey;
    const tokenAmount = AccountDetails[i].amount ? AccountDetails[i].amount : randomEtherBalance();
    const groupVaule = AccountDetails[i].group;

    if (allowedGroups.includes(groupVaule)) {
      console.log("Group: ",groupVaule);
      await swapTokens(privateKey, Token1, WETH[Token1.chainId], tokenAmount, "100") //first argument = token we want, second = token we have, third = the amount of token that we give (token1), fourth = Sippage tolerance
      let _increageTime = randomInteger();
      console.log(`Wait for ${_increageTime} mili Sec`);
      await timer(_increageTime);
    }
  }
};



init()
