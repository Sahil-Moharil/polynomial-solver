const readline = require('readline');

function parseBigInt(valueStr, base) {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = 0n;
    const bigBase = BigInt(base);
    for (const char of valueStr.toLowerCase()) {
        const digitValue = BigInt(alphabet.indexOf(char));
        if (digitValue < 0n || digitValue >= bigBase) {
            throw new Error(`Invalid digit '${char}' for base ${base}`);
        }
        result = result * bigBase + digitValue;
    }
    return result;
}

function solveFromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    const k = data.keys.k;
    const degree = k - 1;

    if (degree < 0) {
        console.log("Error: k must be at least 1, resulting in a degree of 0 or more.");
        return;
    }

    const roots = [];
    const rootKeys = Object.keys(data)
        .filter(key => key !== "keys")
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    for (const key of rootKeys) {
        const rootData = data[key];
        const base = parseInt(rootData.base, 10);
        const value = rootData.value;
        roots.push(parseBigInt(value, base));
    }

    if (roots.length < degree) {
         console.log(`Error: Not enough roots provided. Need ${degree}, but found only ${roots.length}.`);
         return;
    }
    const rootsToUse = roots.slice(0, degree);

    let coeffs = [1n];

    for (const root of rootsToUse) {
        const newCoeffs = Array(coeffs.length + 1).fill(0n);
        
        for (let i = 0; i < coeffs.length; i++) {
            newCoeffs[i] += coeffs[i];
        }
        for (let i = 0; i < coeffs.length; i++) {
            newCoeffs[i + 1] -= root * coeffs[i];
        }
        
        coeffs = newCoeffs;
    }
    
    console.log("\n--- SOLUTION ---");
    console.log(`Solving for a monic polynomial of degree m = k - 1 = ${degree}.`);
    console.log(`Using the first ${degree} provided roots.`);
    console.log("----------------");
    console.log("Final Coefficients (from highest degree to lowest):");
    coeffs.forEach((c, i) => {
        const power = degree - i;
        console.log(`Coefficient of x^${power}: ${c.toString()}`);
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please paste the JSON input and press Enter:\n', (input) => {
    try {
        solveFromJSON(input);
    } catch (error) {
        console.error("\nAn error occurred:", error.message);
        console.error("Please ensure you are pasting valid JSON.");
    } finally {
        rl.close();
    }
});