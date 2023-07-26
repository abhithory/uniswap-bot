var XLSX = require("xlsx");
const { ethers } = require("ethers")
const TOKEN_ABI = require("./abi/token.json");
const { RPC_URL, UNISWAP_ROUTER_ADDRESS, TOKEN_ADDRESS, TOKEN_DECIMALS } = require("./src/config");
let provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const TOKEN_CONTRACT = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, provider);

function weiToEth(wei) {
    const etherValue = ethers.utils.formatEther(String(wei));
    return etherValue;
  }
  
  // ETH to Wei conversion
  function ethToWei(eth) {
    const weiValue = ethers.utils.parseEther(String(eth));
    return weiValue;
  }

function updateFile(data) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts')
    XLSX.writeFile(wb, './file/xlfile.xlsx')

}

function readDataFromFile() {
    var workbook = XLSX.readFile("file/xlfile.xlsx");
    var sheet_name_list = workbook.SheetNames;
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
}


const updateBalanceInFile = async () => {
    const Data = readDataFromFile();
    console.log("updating data....");
    for (let i = 0; i < Data.length; i++) {
        const publickey = Data[i].publickey;
        let tokenTotalBalance = await TOKEN_CONTRACT.balanceOf(publickey);
        let symbol = await TOKEN_CONTRACT.symbol();
        tokenTotalBalance = Number(weiToEth(tokenTotalBalance))
        Data[i][symbol] = tokenTotalBalance;
        
        let ethBalance = await provider.getBalance(publickey);
        Data[i]["ETH"] = weiToEth(String(ethBalance));

    }
    updateFile(Data);
};



updateBalanceInFile()

module.exports = {updateBalanceInFile };
