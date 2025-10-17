"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundingRequestStatus = void 0;
var FundingRequestStatus;
(function (FundingRequestStatus) {
    FundingRequestStatus["PENDING"] = "PENDING";
    FundingRequestStatus["PROPOSED"] = "PROPOSED";
    FundingRequestStatus["AWAITING_CONFIRMATION"] = "AWAITING_CONFIRMATION";
    FundingRequestStatus["CONFIRMED"] = "CONFIRMED";
    FundingRequestStatus["REJECTED"] = "REJECTED";
    FundingRequestStatus["TIMED_OUT"] = "TIMED_OUT";
    FundingRequestStatus["FAILED"] = "FAILED";
})(FundingRequestStatus || (exports.FundingRequestStatus = FundingRequestStatus = {}));
