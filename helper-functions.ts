import { ethers, network, run } from "hardhat"
import { networkConfig } from "./helper-hardhat-config"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber, constants } from "ethers"
import "dotenv/config"
import fs from "fs"

export const verify = async (contractAddress: string, args: any[]) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }
}

const FRONTEND_CONTRACT_ADDRESS_FILE =
    "../../solidity tutorial/frontend/prediction-game-frontend/constants/contractAddresses.json"
const FRONTEND_ABI_FILE =
    "../../solidity tutorial/frontend/prediction-game-frontend/constants/abi.json"
const BACKEND_CONTRACT_ADDRESS_FILE =
    "../../Projects/predictions-api/constants/contractAddresses.json"
const BACKEND_ABI_FILE = "../../Projects/predictions-api/constants/abi.json"

const chainId = network.config.chainId!.toString() === "5" ? "5" : "31337"

async function updateABI(abi: any) {
    fs.writeFileSync(FRONTEND_ABI_FILE, JSON.stringify(abi))
    fs.writeFileSync(BACKEND_ABI_FILE, JSON.stringify(abi))
}

async function updateContractAddresses(contract: any) {
    const file = fs.readFileSync(FRONTEND_CONTRACT_ADDRESS_FILE, "utf8")
    const currentContractAddresses = JSON.parse(file)
    if (chainId in currentContractAddresses) {
        if (!currentContractAddresses[chainId].includes(contract.address)) {
            currentContractAddresses[chainId].push(contract.address)
        }
    } else {
        currentContractAddresses[chainId] = [contract.address]
    }

    const file1 = fs.readFileSync(BACKEND_CONTRACT_ADDRESS_FILE, "utf8")
    const currentContractAddress = JSON.parse(file1)
    if (chainId in currentContractAddress) {
        if (!currentContractAddress[chainId].includes(contract.address)) {
            currentContractAddress[chainId].push(contract.address)
        }
    } else {
        currentContractAddress[chainId] = [contract.address]
    }
    fs.writeFileSync(FRONTEND_CONTRACT_ADDRESS_FILE, JSON.stringify(currentContractAddresses))
    fs.writeFileSync(BACKEND_CONTRACT_ADDRESS_FILE, JSON.stringify(currentContractAddress))
}

export { updateABI, updateContractAddresses }
