// Decision Neuron - Main Application
// Ties together all components

class DecisionNeuronApp {
    constructor() {
        // State
        this.currentDecision = null;
        this.isTrainingMode = false;
        this.trainingPoints = [];
        this.currentTrainingIndex = 0;
        this.graph = null;

        // Store trained weights to allow reverting
        this.trainedWeights = null;
        this.trainedBias = null;

        // Debounce timer for auto-save
        this.saveTimeout = null;

        // Initialize when DOM is ready
        this.init();
    }

    init() {
        // Get DOM elements
        this.elements = {
            decisionName: document.getElementById('decision-name'),
            historyBtn: document.getElementById('history-btn'),
            historyPanel: document.getElementById('history-panel'),
            historyList: document.getElementById('history-list'),
            newDecisionBtn: document.getElementById('new-decision-btn'),
            parametersList: document.getElementById('parameters-list'),
            addParamBtn: document.getElementById('add-param-btn'),
            weightsList: document.getElementById('weights-list'),
            biasSlider: document.getElementById('bias-slider'),
            biasValue: document.getElementById('bias-value'),
            resetWeightsBtn: document.getElementById('reset-weights-btn'),
            trainBtn: document.getElementById('train-btn'),
            graphContainer: document.getElementById('graph-container'),
            trainingOverlay: document.getElementById('training-overlay'),
            trainingProgress: document.getElementById('training-progress'),
            trainingPointInfo: document.getElementById('training-point-info'),
            labelYesBtn: document.getElementById('label-yes-btn'),
            labelNoBtn: document.getElementById('label-no-btn'),
            dimensionSelector: document.getElementById('dimension-selector'),
            functionEquation: document.getElementById('function-equation'),
            functionValues: document.getElementById('function-values'),
            testInputs: document.getElementById('test-inputs'),
            calculateBtn: document.getElementById('calculate-btn'),
            resultValue: document.getElementById('result-value'),
            resultScore: document.getElementById('result-score'),
            resultStrength: document.getElementById('result-strength'),
            statPoints: document.getElementById('stat-points'),
            statAccuracy: document.getElementById('stat-accuracy'),
            statTrained: document.getElementById('stat-trained'),
            mathPanel: document.getElementById('math-panel'),
            collapseMathBtn: document.getElementById('collapse-math-btn'),
            mathContent: document.getElementById('math-content'),
            calculationDisplay: document.getElementById('calculation-display'),
            celebrationOverlay: document.getElementById('celebration-overlay'),
            dismissCelebration: document.getElementById('dismiss-celebration'),
            rotateLeft: document.getElementById('rotate-left'),
            rotateRight: document.getElementById('rotate-right'),
            zoomIn: document.getElementById('zoom-in'),
            zoomOut: document.getElementById('zoom-out'),
            resetView: document.getElementById('reset-view'),
            dimXSelect: document.getElementById('dim-x-select'),
            dimYSelect: document.getElementById('dim-y-select'),
            dimZSelect: document.getElementById('dim-z-select')
        };

        // Initialize 3D graph
        this.graph = new IsometricGraph(this.elements.graphContainer);

        // Bind events
        this.bindEvents();

        // Load YouTube preset by default
        this.loadPreset('youtube');

        // Update history dropdown
        this.updateHistoryDropdown();
    }

    bindEvents() {
        // Decision name change
        this.elements.decisionName.addEventListener('blur', () => {
            this.currentDecision.name = this.elements.decisionName.value;
            this.scheduleAutoSave();
        });

        // History dropdown
        this.elements.historyBtn.addEventListener('click', () => {
            this.elements.historyBtn.parentElement.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.history-dropdown')) {
                this.elements.historyBtn.parentElement.classList.remove('open');
            }
        });

        // New decision
        this.elements.newDecisionBtn.addEventListener('click', () => {
            this.createNewDecision();
        });

        // Add parameter
        this.elements.addParamBtn.addEventListener('click', () => {
            this.addParameter();
        });

        // Bias slider
        this.elements.biasSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.currentDecision.bias = value;
            this.elements.biasValue.textContent = value.toFixed(1);
            this.updateGraph();
            this.updateFunctionDisplay();
            this.scheduleAutoSave();
        });

        // Reset weights
        this.elements.resetWeightsBtn.addEventListener('click', () => {
            this.resetWeights();
        });

        // Train button
        this.elements.trainBtn.addEventListener('click', () => {
            this.toggleTrainingMode();
        });

        // Training labels
        this.elements.labelYesBtn.addEventListener('click', () => {
            this.labelCurrentPoint('YES');
        });

        this.elements.labelNoBtn.addEventListener('click', () => {
            this.labelCurrentPoint('NO');
        });

        // Keyboard shortcuts for training
        document.addEventListener('keydown', (e) => {
            if (this.isTrainingMode) {
                if (e.key.toLowerCase() === 'y') {
                    this.labelCurrentPoint('YES');
                } else if (e.key.toLowerCase() === 'n') {
                    this.labelCurrentPoint('NO');
                }
            }
        });

        // Calculate button
        this.elements.calculateBtn.addEventListener('click', () => {
            this.calculate();
        });

        // Math panel collapse
        this.elements.collapseMathBtn.addEventListener('click', () => {
            this.elements.mathPanel.classList.toggle('collapsed');
        });

        // Celebration dismiss
        this.elements.dismissCelebration.addEventListener('click', () => {
            this.elements.celebrationOverlay.classList.add('hidden');
        });

        // Camera controls
        this.elements.rotateLeft.addEventListener('click', () => this.graph.rotateLeft());
        this.elements.rotateRight.addEventListener('click', () => this.graph.rotateRight());
        this.elements.zoomIn.addEventListener('click', () => this.graph.zoomIn());
        this.elements.zoomOut.addEventListener('click', () => this.graph.zoomOut());
        this.elements.resetView.addEventListener('click', () => this.graph.resetView());

        // Dimension selectors
        this.elements.dimXSelect.addEventListener('change', () => this.onDimensionChange());
        this.elements.dimYSelect.addEventListener('change', () => this.onDimensionChange());
        this.elements.dimZSelect.addEventListener('change', () => this.onDimensionChange());
    }

    // Handle dimension selector changes
    onDimensionChange() {
        const dimX = parseInt(this.elements.dimXSelect.value);
        const dimY = parseInt(this.elements.dimYSelect.value);
        const dimZ = parseInt(this.elements.dimZSelect.value);

        this.graph.setDimensions(
            isNaN(dimX) ? -1 : dimX,
            isNaN(dimY) ? -1 : dimY,
            isNaN(dimZ) ? -1 : dimZ
        );
        this.graph.updatePoints();
        this.graph.updateBoundary();
    }

    // Populate dimension selector dropdowns
    updateDimensionSelectors() {
        const params = this.currentDecision.parameters;
        const selects = [
            this.elements.dimXSelect,
            this.elements.dimYSelect,
            this.elements.dimZSelect
        ];
        const currentValues = selects.map(s => s.value);

        selects.forEach((select, i) => {
            select.innerHTML = '<option value="">None</option>';
            params.forEach((param, paramIndex) => {
                const option = document.createElement('option');
                option.value = paramIndex;
                option.textContent = param.name;
                select.appendChild(option);
            });

            // Restore previous value or set default
            if (currentValues[i] !== '' && parseInt(currentValues[i]) < params.length) {
                select.value = currentValues[i];
            } else if (params.length > i) {
                select.value = i;
            } else {
                select.value = '';
            }
        });

        // Apply the dimension changes
        this.onDimensionChange();
    }

    // Load a preset
    loadPreset(presetName) {
        const preset = Presets[presetName] || Presets.blank;

        this.currentDecision = {
            id: Storage.generateId(),
            name: preset.name,
            parameters: JSON.parse(JSON.stringify(preset.parameters)),
            weights: [...preset.weights],
            bias: preset.bias,
            trainingData: JSON.parse(JSON.stringify(preset.trainingData))
        };

        // Store preset weights as trained weights (for reverting)
        if (preset.trainingData && preset.trainingData.length > 0) {
            this.trainedWeights = [...preset.weights];
            this.trainedBias = preset.bias;
        } else {
            this.trainedWeights = null;
            this.trainedBias = null;
        }

        this.updateUI();
    }

    // Load a saved decision
    loadDecision(decision) {
        this.currentDecision = JSON.parse(JSON.stringify(decision));

        // Store saved weights as trained weights (for reverting)
        if (decision.trainingData && decision.trainingData.length > 0) {
            this.trainedWeights = [...decision.weights];
            this.trainedBias = decision.bias;
        } else {
            this.trainedWeights = null;
            this.trainedBias = null;
        }

        this.updateUI();
        this.elements.historyBtn.parentElement.classList.remove('open');
    }

    // Create new blank decision
    createNewDecision() {
        // Save current first
        if (this.currentDecision) {
            this.saveCurrentDecision();
        }

        this.loadPreset('blank');
        this.updateHistoryDropdown();
    }

    // Update all UI elements
    updateUI() {
        this.elements.decisionName.value = this.currentDecision.name;
        this.renderParameters();
        this.renderWeights();
        this.updateBiasSlider();
        this.renderTestInputs();
        this.updateFunctionDisplay();
        this.updateStats();
        this.updateDimensionSelectors();
        this.updateGraph();
    }

    // Render parameters list
    renderParameters() {
        const list = this.elements.parametersList;
        list.innerHTML = '';

        this.currentDecision.parameters.forEach((param, index) => {
            const item = document.createElement('div');
            item.className = 'parameter-item';
            item.innerHTML = `
                <div class="parameter-header">
                    <input type="text" class="parameter-name" value="${param.name}" data-index="${index}" placeholder="Parameter name">
                    <button class="delete-param-btn" data-index="${index}">×</button>
                </div>
                <div class="parameter-range">
                    <span>Range:</span>
                    <input type="number" class="param-min" value="${param.min}" data-index="${index}">
                    <span>to</span>
                    <input type="number" class="param-max" value="${param.max}" data-index="${index}">
                    <input type="text" class="parameter-unit" value="${param.unit || ''}" data-index="${index}" placeholder="unit">
                </div>
            `;
            list.appendChild(item);
        });

        // Bind parameter events
        list.querySelectorAll('.parameter-name').forEach(input => {
            input.addEventListener('blur', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentDecision.parameters[index].name = e.target.value;
                this.renderWeights();
                this.renderTestInputs();
                this.updateFunctionDisplay();
                this.scheduleAutoSave();
            });
        });

        list.querySelectorAll('.param-min, .param-max').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const isMin = e.target.classList.contains('param-min');
                this.currentDecision.parameters[index][isMin ? 'min' : 'max'] = parseFloat(e.target.value) || 0;
                this.updateGraph();
                this.scheduleAutoSave();
            });
        });

        list.querySelectorAll('.parameter-unit').forEach(input => {
            input.addEventListener('blur', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentDecision.parameters[index].unit = e.target.value;
                this.renderTestInputs();
                this.scheduleAutoSave();
            });
        });

        list.querySelectorAll('.delete-param-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteParameter(index);
            });
        });
    }

    // Render weight sliders
    renderWeights() {
        const list = this.elements.weightsList;
        list.innerHTML = '';

        this.currentDecision.parameters.forEach((param, index) => {
            const weight = this.currentDecision.weights[index] || 0;
            const wrapper = document.createElement('div');
            wrapper.className = 'weight-slider-wrapper';
            wrapper.innerHTML = `
                <label class="slider-label">
                    <span class="label-text">w${index + 1} (${param.name})</span>
                    <span class="slider-value" id="weight-value-${index}">${weight.toFixed(1)}</span>
                </label>
                <input type="range" class="weight-slider ${weight >= 0 ? 'positive' : 'negative'}"
                       id="weight-slider-${index}"
                       min="-2" max="2" step="0.1"
                       value="${weight}"
                       data-index="${index}">
            `;
            list.appendChild(wrapper);
        });

        // Bind weight slider events
        list.querySelectorAll('.weight-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const value = parseFloat(e.target.value);
                this.currentDecision.weights[index] = value;

                // Update display
                document.getElementById(`weight-value-${index}`).textContent = value.toFixed(1);

                // Update slider class for coloring
                e.target.className = `weight-slider ${value >= 0 ? 'positive' : 'negative'}`;

                this.updateGraph();
                this.updateFunctionDisplay();
                this.scheduleAutoSave();
            });
        });
    }

    // Update bias slider
    updateBiasSlider() {
        this.elements.biasSlider.value = this.currentDecision.bias;
        this.elements.biasValue.textContent = this.currentDecision.bias.toFixed(1);
    }

    // Add a new parameter
    addParameter() {
        if (this.currentDecision.parameters.length >= 6) {
            alert('Maximum 6 parameters allowed.');
            return;
        }

        const newIndex = this.currentDecision.parameters.length + 1;
        this.currentDecision.parameters.push({
            name: `Parameter ${newIndex}`,
            unit: '',
            min: 0,
            max: 100
        });
        this.currentDecision.weights.push(0);

        this.renderParameters();
        this.renderWeights();
        this.renderTestInputs();
        this.updateFunctionDisplay();
        this.updateDimensionSelectors();
        this.updateGraph();
        this.scheduleAutoSave();
    }

    // Delete a parameter
    deleteParameter(index) {
        if (this.currentDecision.parameters.length <= 2) {
            alert('You need at least 2 parameters.');
            return;
        }

        this.currentDecision.parameters.splice(index, 1);
        this.currentDecision.weights.splice(index, 1);

        // Also update training data if needed
        this.currentDecision.trainingData = this.currentDecision.trainingData.map(point => ({
            ...point,
            values: point.values.filter((_, i) => i !== index)
        }));

        this.renderParameters();
        this.renderWeights();
        this.renderTestInputs();
        this.updateFunctionDisplay();
        this.updateDimensionSelectors();
        this.updateGraph();
        this.scheduleAutoSave();
    }

    // Revert to trained model weights
    resetWeights() {
        if (this.trainedWeights && this.trainedBias !== null) {
            this.currentDecision.weights = [...this.trainedWeights];
            this.currentDecision.bias = this.trainedBias;
        } else {
            // No trained model, reset to zeros
            this.currentDecision.weights = this.currentDecision.weights.map(() => 0);
            this.currentDecision.bias = 0;
        }
        this.renderWeights();
        this.updateBiasSlider();
        this.updateGraph();
        this.updateFunctionDisplay();
        this.scheduleAutoSave();
    }

    // Render test input fields
    renderTestInputs() {
        const container = this.elements.testInputs;
        container.innerHTML = '';

        this.currentDecision.parameters.forEach((param, index) => {
            const mid = (param.min + param.max) / 2;
            const wrapper = document.createElement('div');
            wrapper.className = 'test-input-wrapper';
            wrapper.innerHTML = `
                <span class="test-input-label">${param.name}</span>
                <input type="number" class="test-input"
                       id="test-input-${index}"
                       value="${Math.round(mid)}"
                       min="${param.min}" max="${param.max}">
                <span class="test-input-unit">${param.unit || ''}</span>
            `;
            container.appendChild(wrapper);
        });
    }

    // Update function display
    updateFunctionDisplay() {
        const params = this.currentDecision.parameters;
        const weights = this.currentDecision.weights;
        const bias = this.currentDecision.bias;

        // Generic equation
        let equation = 'y = ';
        params.forEach((param, i) => {
            if (i > 0) equation += ' + ';
            equation += `w${i + 1}x${i + 1}`;
        });
        equation += ' + b';
        this.elements.functionEquation.textContent = equation;

        // With values
        let values = 'y = ';
        params.forEach((param, i) => {
            if (i > 0) values += ' + ';
            const w = (weights[i] || 0).toFixed(1);
            values += `(${w})(${param.name})`;
        });
        values += ` + (${bias.toFixed(1)})`;
        this.elements.functionValues.textContent = values;
    }

    // Update stats display
    updateStats() {
        const points = this.currentDecision.trainingData.length;
        this.elements.statPoints.textContent = points;

        if (points > 0) {
            const accuracy = MathUtils.calculateAccuracy(
                this.currentDecision.trainingData,
                this.currentDecision.weights,
                this.currentDecision.bias
            );
            this.elements.statAccuracy.textContent = accuracy + '%';
        } else {
            this.elements.statAccuracy.textContent = '—';
        }

        this.elements.statTrained.textContent = 'Just now';
    }

    // Update 3D graph
    updateGraph() {
        this.graph.setData(
            this.currentDecision.parameters,
            this.currentDecision.weights,
            this.currentDecision.bias,
            this.currentDecision.trainingData
        );
    }

    // Calculate decision
    calculate() {
        const values = [];
        this.currentDecision.parameters.forEach((param, i) => {
            const input = document.getElementById(`test-input-${i}`);
            values.push(parseFloat(input.value) || 0);
        });

        const result = MathUtils.decide(values, this.currentDecision.weights, this.currentDecision.bias);
        const isYes = result > 0;

        // Update result display
        this.elements.resultValue.textContent = isYes ? 'YES ✓' : 'NO ✗';
        this.elements.resultValue.className = `result-value ${isYes ? 'yes' : 'no'}`;
        this.elements.resultScore.textContent = `Score: ${result.toFixed(2)}`;

        // Strength indicator
        const magnitude = Math.abs(result);
        let strength = '';
        if (magnitude > 5) strength = 'Very Strong';
        else if (magnitude > 2) strength = 'Strong';
        else if (magnitude > 1) strength = 'Moderate';
        else strength = 'Weak';
        this.elements.resultStrength.textContent = `${strength} ${isYes ? 'Yes' : 'No'}`;

        // Update math panel
        this.showCalculation(values, result, isYes);

        // Show test point on graph (yellow)
        this.graph.showTestPoint(values);
    }

    // Show calculation breakdown in math panel
    showCalculation(values, result, isYes) {
        const params = this.currentDecision.parameters;
        const weights = this.currentDecision.weights;
        const bias = this.currentDecision.bias;

        let html = `
            <div class="calc-header">Decision Function Calculation</div>
            <div class="calc-steps">
        `;

        let runningSum = 0;
        params.forEach((param, i) => {
            const w = weights[i] || 0;
            const v = values[i];
            const product = w * v;
            runningSum += product;

            html += `
                <div class="calc-step">
                    <span class="calc-step-label">w${i + 1} × ${param.name}</span>
                    <span class="calc-step-value">${w.toFixed(1)} × ${v} = ${product.toFixed(2)}</span>
                </div>
            `;
        });

        html += `
            <div class="calc-step">
                <span class="calc-step-label">bias</span>
                <span class="calc-step-value">${bias.toFixed(1)}</span>
            </div>
            <div class="calc-total">
                <span>Sum</span>
                <span>${result.toFixed(2)}</span>
            </div>
            <div class="calc-result ${isYes ? 'yes' : 'no'}">
                ${result.toFixed(2)} ${result > 0 ? '>' : '<'} 0 → ${isYes ? 'YES ✓' : 'NO ✗'}
            </div>
        `;

        html += '</div>';
        this.elements.calculationDisplay.innerHTML = html;

        // Expand math panel if collapsed
        this.elements.mathPanel.classList.remove('collapsed');
    }

    // Toggle training mode
    toggleTrainingMode() {
        if (this.isTrainingMode) {
            this.exitTrainingMode();
        } else {
            this.enterTrainingMode();
        }
    }

    // Enter training mode
    enterTrainingMode() {
        this.isTrainingMode = true;
        this.trainingPoints = [];
        this.currentTrainingIndex = 0;

        // Remove any test point from the graph
        this.graph.removeTestPoint();

        // Generate 10 random points
        for (let i = 0; i < 10; i++) {
            const values = this.currentDecision.parameters.map(param =>
                Math.round(MathUtils.randomInRange(param.min, param.max))
            );
            this.trainingPoints.push({ values, label: null });
        }

        // Update UI
        this.elements.trainBtn.classList.add('active');
        this.elements.trainBtn.querySelector('.btn-text').textContent = 'Exit Training';
        this.elements.trainingOverlay.classList.remove('hidden');

        // Clear existing training data for new training
        this.graph.pointMeshes.forEach(mesh => {
            this.graph.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.graph.pointMeshes = [];

        // Show first point
        this.showTrainingPoint(0);

        // Update math panel
        this.showTrainingMath();
    }

    // Exit training mode
    exitTrainingMode() {
        this.isTrainingMode = false;
        this.elements.trainBtn.classList.remove('active');
        this.elements.trainBtn.querySelector('.btn-text').textContent = 'Train Mode';
        this.elements.trainingOverlay.classList.add('hidden');
    }

    // Show a training point
    showTrainingPoint(index) {
        this.currentTrainingIndex = index;
        this.elements.trainingProgress.textContent = `Point ${index + 1}/10`;

        const point = this.trainingPoints[index];
        const mesh = this.graph.addTrainingPoint({ values: point.values, label: 'YES' }, true);
        point.mesh = mesh;

        // Update training point info panel
        this.updateTrainingPointInfo(point.values);

        // Highlight current point
        setTimeout(() => {
            this.graph.highlightPoint(mesh, true);
        }, 600);
    }

    // Update training point info panel with current values
    updateTrainingPointInfo(values) {
        const params = this.currentDecision.parameters;
        let html = `
            <div class="training-point-info-title">Current Point</div>
            <div class="training-point-values">
        `;

        params.forEach((param, i) => {
            const value = values[i];
            const unit = param.unit ? `<span class="training-point-unit">${param.unit}</span>` : '';
            html += `
                <div class="training-point-value">
                    <span class="training-point-label">${param.name}</span>
                    <span class="training-point-number">${value}${unit}</span>
                </div>
            `;
        });

        html += '</div>';
        this.elements.trainingPointInfo.innerHTML = html;
    }

    // Label current training point
    labelCurrentPoint(label) {
        if (!this.isTrainingMode) return;

        const point = this.trainingPoints[this.currentTrainingIndex];
        point.label = label;

        // Update point color
        this.graph.colorPoint(point.mesh, label);
        this.graph.highlightPoint(point.mesh, false);

        // Update math display
        this.showTrainingMath();

        // Move to next point or finish
        if (this.currentTrainingIndex < 9) {
            setTimeout(() => {
                this.showTrainingPoint(this.currentTrainingIndex + 1);
            }, 400);
        } else {
            // Training complete
            setTimeout(() => {
                this.finishTraining();
            }, 500);
        }
    }

    // Show training progress in math panel
    showTrainingMath() {
        const labeled = this.trainingPoints.filter(p => p.label);

        let html = `
            <div class="training-math">
                <div class="calc-header">🎓 Training Progress (${labeled.length}/10)</div>
                <div class="training-points-list">
        `;

        labeled.forEach(point => {
            const icon = point.label === 'YES' ? '✓' : '✗';
            const iconClass = point.label === 'YES' ? 'yes' : 'no';
            html += `
                <div class="training-point">
                    <span class="training-point-icon ${iconClass}">${icon}</span>
                    <span>[${point.values.join(', ')}] → ${point.label}</span>
                </div>
            `;
        });

        html += '</div></div>';
        this.elements.calculationDisplay.innerHTML = html;
    }

    // Finish training and calculate new weights
    finishTraining() {
        // Convert training points to proper format
        const trainingData = this.trainingPoints.map(p => ({
            values: p.values,
            label: p.label
        }));

        console.log('Training data:', trainingData);

        // Train the model
        const result = MathUtils.train(trainingData);

        console.log('Training result:', result);

        if (result) {
            // Store trained weights for reverting later
            this.trainedWeights = [...result.weights];
            this.trainedBias = result.bias;

            // Animate weight changes
            this.animateWeightChange(result.weights, result.bias);

            // Update decision data
            this.currentDecision.weights = result.weights;
            this.currentDecision.bias = result.bias;
            this.currentDecision.trainingData = trainingData;

            // Update UI
            setTimeout(() => {
                this.renderWeights();
                this.updateBiasSlider();
                this.updateGraph();
                this.updateFunctionDisplay();
                this.updateStats();
                this.scheduleAutoSave();

                // Show celebration
                this.elements.celebrationOverlay.classList.remove('hidden');
            }, 1000);
        } else {
            // Training failed - show message and keep current weights
            console.error('Training failed - could not calculate weights');
            alert('Training could not complete. Try labeling with a mix of YES and NO answers.');
        }

        this.exitTrainingMode();
    }

    // Animate weight slider changes
    animateWeightChange(newWeights, newBias) {
        const oldWeights = [...this.currentDecision.weights];
        const oldBias = this.currentDecision.bias;
        const duration = 800;
        const startTime = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate weights
            newWeights.forEach((targetWeight, i) => {
                const currentWeight = MathUtils.lerp(oldWeights[i] || 0, targetWeight, eased);
                const slider = document.getElementById(`weight-slider-${i}`);
                const valueDisplay = document.getElementById(`weight-value-${i}`);

                if (slider && valueDisplay) {
                    slider.value = currentWeight;
                    valueDisplay.textContent = currentWeight.toFixed(1);
                    slider.className = `weight-slider ${currentWeight >= 0 ? 'positive' : 'negative'}`;
                }
            });

            // Interpolate bias
            const currentBias = MathUtils.lerp(oldBias, newBias, eased);
            this.elements.biasSlider.value = currentBias;
            this.elements.biasValue.textContent = currentBias.toFixed(1);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // Schedule auto-save (debounced)
    scheduleAutoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveCurrentDecision();
        }, 1000);
    }

    // Save current decision to history
    saveCurrentDecision() {
        if (!this.currentDecision) return;
        Storage.save(this.currentDecision);
        this.updateHistoryDropdown();
    }

    // Update history dropdown
    updateHistoryDropdown() {
        const decisions = Storage.getRecent(5);
        const list = this.elements.historyList;

        if (decisions.length === 0) {
            list.innerHTML = '<div class="history-empty">No saved decisions yet</div>';
            return;
        }

        list.innerHTML = decisions.map(decision => `
            <div class="history-item" data-id="${decision.id}">
                <div class="history-item-info">
                    <div class="history-item-name">${decision.name}</div>
                    <div class="history-item-meta">${decision.parameters.length} params · ${Storage.formatDate(decision.lastModified)}</div>
                </div>
                <button class="history-item-delete" data-id="${decision.id}">×</button>
            </div>
        `).join('');

        // Bind click events
        list.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-item-delete')) {
                    const id = item.dataset.id;
                    const decision = Storage.get(id);
                    if (decision) {
                        this.loadDecision(decision);
                    }
                }
            });
        });

        list.querySelectorAll('.history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                Storage.delete(id);
                this.updateHistoryDropdown();
            });
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DecisionNeuronApp();
});
