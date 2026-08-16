import { ethers } from 'ethers';
import P2PLendingABI from './P2PLending.json';

export const getContract = async (signer) => {
    // Replace with your deployed contract address
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const contract = new ethers.Contract(
        contractAddress,
        P2PLendingABI.abi,
        signer
    );
    return contract;
};

export const createOffer = async (contract, interestRate, durationDays, penaltyRate) => {
    try {
        const tx = await contract.createOffer(interestRate, durationDays, penaltyRate);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error creating offer:", error);
        return false;
    }
};

export const cancelOffer = async (contract, offerId) => {
    try {
        const tx = await contract.cancelOffer(offerId);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error cancelling offer:", error);
        return false;
    }
};

export const requestLoan = async (contract, offerId, amount) => {
    try {
        const tx = await contract.requestLoan(offerId, amount);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error requesting loan:", error);
        return false;
    }
};

export const approveRequest = async (contract, requestId, amount) => {
    try {
        const tx = await contract.approveRequest(requestId, { value: amount });
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error approving request:", error);
        return false;
    }
};

export const repayLoan = async (contract, requestId, amount) => {
    try {
        const tx = await contract.repayLoan(requestId, { value: amount });
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error repaying loan:", error);
        return false;
    }
};

export const getOffers = async (contract) => {
    try {
        const offerCount = await contract.offerCount();
        const offers = [];
        for (let i = 0; i < offerCount; i++) {
            const offer = await contract.offers(i);
            offers.push(offer);
        }
        return offers;
    } catch (error) {
        console.error("Error getting offers:", error);
        return [];
    }
};

export const getRequests = async (contract) => {
    try {
        const requestCount = await contract.requestCount();
        const requests = [];
        for (let i = 0; i < requestCount; i++) {
            const request = await contract.requests(i);
            requests.push(request);
        }
        return requests;
    } catch (error) {
        console.error("Error getting requests:", error);
        return [];
    }
}; 