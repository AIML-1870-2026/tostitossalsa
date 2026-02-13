// Decision Neuron - Math Utilities
// Linear algebra helpers for the decision neuron training

const MathUtils = {
    // Transpose a matrix
    transpose: function(matrix) {
        if (!matrix.length) return [];
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    },

    // Multiply two matrices
    multiply: function(a, b) {
        // Handle matrix-vector multiplication
        if (!Array.isArray(b[0])) {
            return a.map(row =>
                row.reduce((sum, val, i) => sum + val * b[i], 0)
            );
        }

        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    },

    // Calculate matrix inverse using Gauss-Jordan elimination
    inverse: function(matrix) {
        const n = matrix.length;

        // Create augmented matrix [A|I]
        const augmented = matrix.map((row, i) => {
            const newRow = [...row];
            for (let j = 0; j < n; j++) {
                newRow.push(i === j ? 1 : 0);
            }
            return newRow;
        });

        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            // Check for singular matrix
            if (Math.abs(augmented[i][i]) < 1e-10) {
                return null; // Matrix is singular
            }

            // Scale pivot row
            const scale = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= scale;
            }

            // Eliminate column
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }

        // Extract inverse from augmented matrix
        return augmented.map(row => row.slice(n));
    },

    // Decision function: y = sum(w_i * x_i) + bias
    decide: function(values, weights, bias) {
        let sum = bias;
        for (let i = 0; i < values.length && i < weights.length; i++) {
            sum += values[i] * weights[i];
        }
        return sum;
    },

    // Train model using Ordinary Least Squares
    train: function(trainingData) {
        if (!trainingData || trainingData.length < 2) {
            return null;
        }

        // Build design matrix X (with bias column of 1s)
        const X = trainingData.map(d => [1, ...d.values]);

        // Build target vector y (YES = 1, NO = -1)
        const y = trainingData.map(d => d.label === 'YES' ? 1 : -1);

        // Compute: w = (X^T X)^(-1) X^T y
        const XT = this.transpose(X);
        const XTX = this.multiply(XT, X);
        const XTXinv = this.inverse(XTX);

        if (!XTXinv) {
            // Matrix is singular, fall back to gradient descent
            return this.trainGradientDescent(trainingData);
        }

        const XTy = this.multiply(XT, [y])[0] || this.multiply(XT, y);

        // Handle the result based on whether XTy is a matrix or vector
        let weights;
        if (Array.isArray(XTy[0])) {
            weights = this.multiply(XTXinv, XTy.map(row => row[0]));
        } else {
            weights = this.multiply(XTXinv, XTy);
        }

        return {
            bias: weights[0],
            weights: weights.slice(1)
        };
    },

    // Fallback: Gradient descent training
    trainGradientDescent: function(trainingData, iterations = 100, learningRate = 0.01) {
        if (!trainingData || trainingData.length === 0) return null;

        const numParams = trainingData[0].values.length;
        let weights = new Array(numParams).fill(0);
        let bias = 0;

        for (let iter = 0; iter < iterations; iter++) {
            let biasGrad = 0;
            const weightGrads = new Array(numParams).fill(0);

            for (const point of trainingData) {
                const target = point.label === 'YES' ? 1 : -1;
                const prediction = this.decide(point.values, weights, bias);
                const error = prediction - target;

                biasGrad += error;
                for (let i = 0; i < numParams; i++) {
                    weightGrads[i] += error * point.values[i];
                }
            }

            // Update weights
            bias -= learningRate * biasGrad / trainingData.length;
            for (let i = 0; i < numParams; i++) {
                weights[i] -= learningRate * weightGrads[i] / trainingData.length;
            }
        }

        return { bias, weights };
    },

    // Calculate accuracy on training data
    calculateAccuracy: function(trainingData, weights, bias) {
        if (!trainingData || trainingData.length === 0) return 0;

        let correct = 0;
        for (const point of trainingData) {
            const prediction = this.decide(point.values, weights, bias);
            const predictedLabel = prediction > 0 ? 'YES' : 'NO';
            if (predictedLabel === point.label) {
                correct++;
            }
        }
        return (correct / trainingData.length * 100).toFixed(0);
    },

    // Normalize value to 0-1 range
    normalize: function(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    },

    // Denormalize from 0-1 to original range
    denormalize: function(normalized, min, max) {
        return normalized * (max - min) + min;
    },

    // Generate random value within range
    randomInRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Clamp value between min and max
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Linear interpolation
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },

    // Round to decimal places
    round: function(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
};

// Make available globally
window.MathUtils = MathUtils;
