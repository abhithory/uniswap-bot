require('dotenv').config()
const { ethers } = require("ethers")
const UNISWAP = require("@uniswap/sdk")
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent } = require("@uniswap/sdk");
const UNISWAP_ROUTER_ABI = require("./abi/uniswaprouter.json");
const { RPC_URL, UNISWAP_ROUTER_ADDRESS, TOKEN_ADDRESS, TOKEN_DECIMALS } = require("./src/config");

let provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI.abi, provider);


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
        const valueHex = ethers.BigNumber.from(value.toString()).toHexString();

        const deadline = Math.floor(Date.now() / 1000) + 60; // 60 secs from the current Unix time

        // swapExactETHForTokens
        const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMinHex, path, to, deadline, {
            value: valueHex,
            gasPrice: ethers.utils.parseUnits("50", 'gwei'),
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


const init = async () => {
    const chainId = UNISWAP.ChainId.GÖRLI;
    const addressDai = "0xdc31ee1784292379fbb2964b3b9c4124d8f89c60"; //dia, 18, working
    const tokenAddress1 = "0xBB5b10e0012BF8ced5641bd38A690A1085Ff6451"; //xxxxx,18, not working
    const tokenAddress2 = "0xa565f7d28fcb6d191f535357857f987e7b3ee76b"; //kkkto,18,

    const Token1 = new Token(chainId, tokenAddress2, 18);


    const privateKey = process.env.PRIVATE_KEY_1
    const tokenAmountFromBuy = "0.00000000000000001";
    await swapTokens(privateKey, Token1, WETH[Token1.chainId], tokenAmountFromBuy, "2")
    //first argument = token we want, second = token we have, third = the amount of token that we give (token1) in etheres, fourth = Sippage tolerance

};



init()