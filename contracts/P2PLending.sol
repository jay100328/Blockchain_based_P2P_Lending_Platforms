// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract P2PLending {
    uint public offerCount;
    uint public requestCount;

    struct LoanOffer {
        uint id;
        address lender;
        uint interestRate;   // percentage (e.g., 5 = 5%)
        uint durationDays;   // in days
        uint penaltyRate;    // percentage (e.g., 10 = 10%)
        bool active;
    }

    struct LoanRequest {
        uint id;
        uint offerId;
        address borrower;
        uint amount;
        bool approved;
        bool repaid;
        uint startTimestamp;
    }

    mapping(uint => LoanOffer) public offers;
    mapping(uint => LoanRequest) public requests;

    event OfferCreated(uint offerId, address lender);
    event OfferCancelled(uint offerId);
    event RequestMade(uint requestId, uint offerId, address borrower);
    event RequestRejected(uint requestId);
    event RequestApproved(uint requestId);
    event LoanRepaid(uint requestId, uint amountPaid);

    modifier onlyLender(uint offerId) {
        require(msg.sender == offers[offerId].lender, "Not offer lender");
        _;
    }

    modifier onlyBorrower(uint requestId) {
        require(msg.sender == requests[requestId].borrower, "Not borrower");
        _;
    }

    function createOffer(uint interestRate, uint durationDays, uint penaltyRate) external {
        offers[offerCount] = LoanOffer({
            id: offerCount,
            lender: msg.sender,
            interestRate: interestRate,
            durationDays: durationDays,
            penaltyRate: penaltyRate,
            active: true
        });

        emit OfferCreated(offerCount, msg.sender);
        offerCount++;
    }

    function cancelOffer(uint offerId) external onlyLender(offerId) {
        require(offers[offerId].active, "Already inactive");
        offers[offerId].active = false;
        emit OfferCancelled(offerId);
    }

    function requestLoan(uint offerId, uint amount) external {
        require(offers[offerId].active, "Offer not active");

        requests[requestCount] = LoanRequest({
            id: requestCount,
            offerId: offerId,
            borrower: msg.sender,
            amount: amount,
            approved: false,
            repaid: false,
            startTimestamp: 0
        });

        emit RequestMade(requestCount, offerId, msg.sender);
        requestCount++;
    }

    // ✅ payable: lender sends loan amount during approval
    function approveRequest(uint requestId) external payable onlyLender(requests[requestId].offerId) {
        LoanRequest storage request = requests[requestId];
        require(!request.approved, "Already approved");
        require(!request.repaid, "Already repaid");

        require(msg.value == request.amount, "Must send exact loan amount");

        request.approved = true;
        request.startTimestamp = block.timestamp;

        // Deactivate offer to prevent further loans
        offers[request.offerId].active = false;

        // Send funds to borrower
        payable(request.borrower).transfer(msg.value);

        emit RequestApproved(requestId);
    }

    function repayLoan(uint requestId) external payable onlyBorrower(requestId) {
        LoanRequest storage request = requests[requestId];
        require(request.approved, "Not approved yet");
        require(!request.repaid, "Already repaid");

        LoanOffer storage offer = offers[request.offerId];

        uint durationSeconds = offer.durationDays * 1 days;
        uint endTimestamp = request.startTimestamp + durationSeconds;

        uint interest = (request.amount * offer.interestRate) / 100;
        uint totalOwed = request.amount + interest;

        if (block.timestamp > endTimestamp) {
            uint penalty = (request.amount * offer.penaltyRate) / 100;
            totalOwed += penalty;
        }

        require(msg.value >= totalOwed, "Insufficient repayment");

        request.repaid = true;

        // Send repayment to lender
        payable(offer.lender).transfer(msg.value);

        emit LoanRepaid(requestId, msg.value);
    }
}
