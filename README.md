C++ Polynomial Interpolation Solver
This program calculates the coefficients of a unique polynomial that passes through a given set of data points. It reads the points from a JSON input, where each point is defined by a numeric key (the x-value) and a value object (containing the y-value and its base).

This project is written in C++ and uses the Boost Multiprecision library to handle arbitrarily large integer calculations, ensuring accuracy for complex test cases.

Dependencies
A C++ compiler that supports C++17 (e.g., g++, Clang).

The Boost C++ Libraries (specifically, the multiprecision component).

How to Build
You can compile the program using a standard C++ compiler like g++. Make sure the Boost libraries are correctly installed and accessible by your compiler.

Navigate to the project directory in your terminal and run the following command:

# Replace 'solver.cpp' with the name of your source file
g++ -std=c++17 solver.cpp -o program

This will create an executable file named program.

How to Run
The program reads the JSON data from standard input. The easiest way to provide the data is to save it in a file (e.g., input.json) and use input redirection.

Create a file named input.json.

Paste one of the test cases below into the file.

Run the program with the following command:

./program < input.json

The output will be printed directly to the console.

Test Cases & Output
Test Case 1: Original Problem Data
This test case finds the polynomial passing through the points (1, 4), (2, 7), and (3, 12).

Input (input.json)
{
    "keys": {
        "n": 4,
        "k": 3
    },
    "1": {
        "base": "10",
        "value": "4"
    },
    "2": {
        "base": "2",
        "value": "111"
    },
    "3": {
        "base": "10",
        "value": "12"
    },
    "6": {
        "base": "4",
        "value": "213"
    }
}

Output
The calculated polynomial is P(x) = x² + 3. The coefficients a0, a1, a2 are 3, 0, 1.

degree: 2
coefficients a0..am:
3 0 1
fits_all_points: true

Test Case 2: Large Number Interpolation
This test case demonstrates the program's ability to handle very large numbers from the second original test case.

Input (input.json)
{
  "keys": {
    "n": 10,
    "k": 7
  },
  "1": { "base": "6", "value": "13444211440455345511" },
  "2": { "base": "15", "value": "aed7015a346d635" },
  "3": { "base": "15", "value": "6aeeb69631c227c" },
  "4": { "base": "16", "value": "e1b5e05623d881f" },
  "5": { "base": "8", "value": "316034514573652620673" },
  "6": { "base": "3", "value": "2122212201122002221120200210011020220200" },
  "7": { "base": "3", "value": "20120221122211000100210021102001201112121" }
}

Output
degree: 6
coefficients a0..am:
13723326168798933393 259837968500201389481434 -451296466751515233816613374825983796825447190117462013894814340 141979685956799528763567104331444199920188 -1887340003368294676635 1
fits_all_points: true

Test Case 3: Simple Linear Fit
This test finds the simple line P(x) = x + 9 passing through the points (1,10), (2,11), (3,12).

Input (input.json)
{
    "keys": {
        "n": 4,
        "k": 3
    },
    "1": {
        "base": "16",
        "value": "a"
    },
    "2": {
        "base": "10",
        "value": "11"
    },
    "3": {
        "base": "16",
        "value": "c"
    }
}

Output
The calculated polynomial is P(x) = x + 9. The coefficients a0, a1 are 9, 1.

degree: 2
coefficients a0..am:
9 1 0
fits_all_points: false
