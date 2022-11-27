function calculatePOSTransactionCharges(transactionAmount) {
    var charge = 100;
    var totalCharge = charge;

    var count = Math.abs(transactionAmount / 10000);
    var percentage = count.toString().split('.');
    totalCharge = charge * Number(percentage[0])

    if (percentage.length > 1) {
        totalCharge = totalCharge + charge;
    }
    console.log(totalCharge);
}

calculatePOSTransactionCharges(500000);
