// Decision Neuron - 3D Graph Visualization
// Uses Three.js for isometric visualization

class IsometricGraph {
    constructor(container) {
        this.container = container;
        this.canvas = document.getElementById('graph-canvas');
        this.points = [];
        this.pointMeshes = [];
        this.boundaryMesh = null;
        this.testPointMesh = null;

        // Camera rotation angles (spherical coordinates)
        this.theta = Math.PI / 4;  // Horizontal angle
        this.phi = Math.PI / 4;    // Vertical angle (from top)
        this.targetTheta = Math.PI / 4;
        this.targetPhi = Math.PI / 4;

        this.zoom = 1;
        this.targetZoom = 1;

        // Mouse/touch interaction state
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.autoRotate = false;

        this.parameters = [];
        this.weights = [];
        this.bias = 0;
        this.trainingData = [];

        // Dimension mapping for >3 params
        this.dimX = 0;
        this.dimY = 1;
        this.dimZ = 2;

        // Colors
        this.colors = {
            yes: 0x6BCF6B,
            no: 0xF07167,
            boundary: 0x7BA7BC,
            platform: 0xD4A574,
            grid: 0xB8956A,
            axis: 0x8B6B4B
        };

        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xFFF8E7);

        // Get container dimensions
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        // Orthographic camera for isometric view
        const aspect = this.width / this.height;
        const frustumSize = 15;
        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000
        );

        // Position camera for isometric view (~35.264 degrees)
        this.updateCameraPosition();

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        this.setupLighting();

        // Create platform and axes
        this.createPlatform();
        this.createAxes();

        // Setup mouse/touch controls
        this.setupControls();

        // Start animation loop
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    setupControls() {
        const canvas = this.canvas;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());

        // Touch events - allow page scroll, only capture for pinch zoom
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
        canvas.addEventListener('touchend', () => this.onTouchEnd());

        // Set cursor style
        canvas.style.cursor = 'grab';
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
        this.canvas.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        // Adjust rotation based on mouse movement
        this.targetTheta += deltaX * 0.01;
        this.targetPhi -= deltaY * 0.01;

        // Clamp vertical angle to prevent flipping
        this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi));

        this.previousMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    }

    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    onTouchStart(e) {
        if (e.touches.length === 2) {
            // Two-finger touch for rotation
            this.isDragging = true;
            this.previousMousePosition = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            this.initialPinchDistance = this.getPinchDistance(e.touches);
        }
    }

    onTouchMove(e) {
        if (e.touches.length === 2 && this.isDragging) {
            // Two-finger drag for rotation
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const deltaX = centerX - this.previousMousePosition.x;
            const deltaY = centerY - this.previousMousePosition.y;

            this.targetTheta += deltaX * 0.01;
            this.targetPhi -= deltaY * 0.01;
            this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi));

            this.previousMousePosition = { x: centerX, y: centerY };

            // Pinch zoom
            const currentDistance = this.getPinchDistance(e.touches);
            const scale = currentDistance / this.initialPinchDistance;
            this.targetZoom = MathUtils.clamp(this.zoom * scale, 0.5, 3);
            this.initialPinchDistance = currentDistance;
        }
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setupLighting() {
        // Warm ambient light
        const ambientLight = new THREE.AmbientLight(0xFFE4C4, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (golden hour from top-left)
        const mainLight = new THREE.DirectionalLight(0xFFF5E6, 0.8);
        mainLight.position.set(-5, 10, 5);
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xE6F0FF, 0.3);
        fillLight.position.set(5, 5, -5);
        this.scene.add(fillLight);
    }

    createPlatform() {
        // Main platform
        const platformGeometry = new THREE.BoxGeometry(10, 0.3, 10);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.platform,
            roughness: 0.8,
            metalness: 0.1
        });
        this.platform = new THREE.Mesh(platformGeometry, platformMaterial);
        this.platform.position.y = -0.15;
        this.scene.add(this.platform);

        // Grid lines on platform
        this.createGridLines();
    }

    createGridLines() {
        const gridGroup = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: this.colors.grid,
            transparent: true,
            opacity: 0.4
        });

        const gridSize = 10;
        const divisions = 10;
        const step = gridSize / divisions;

        for (let i = -gridSize / 2; i <= gridSize / 2; i += step) {
            // X lines
            const xPoints = [
                new THREE.Vector3(i, 0.01, -gridSize / 2),
                new THREE.Vector3(i, 0.01, gridSize / 2)
            ];
            const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints);
            const xLine = new THREE.Line(xGeometry, lineMaterial);
            gridGroup.add(xLine);

            // Z lines
            const zPoints = [
                new THREE.Vector3(-gridSize / 2, 0.01, i),
                new THREE.Vector3(gridSize / 2, 0.01, i)
            ];
            const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints);
            const zLine = new THREE.Line(zGeometry, lineMaterial);
            gridGroup.add(zLine);
        }

        this.scene.add(gridGroup);
    }

    createAxes() {
        const axisGroup = new THREE.Group();
        const axisLength = 5.5;

        // Axis material
        const axisMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.axis,
            roughness: 0.6
        });

        // X Axis (red tint)
        const xAxisGeom = new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8);
        const xAxis = new THREE.Mesh(xAxisGeom, axisMaterial);
        xAxis.rotation.z = -Math.PI / 2;
        xAxis.position.set(axisLength / 2, 0.1, -5);
        axisGroup.add(xAxis);

        // Y Axis (up - green tint)
        const yAxisGeom = new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8);
        const yAxis = new THREE.Mesh(yAxisGeom, axisMaterial);
        yAxis.position.set(-5, axisLength / 2, -5);
        axisGroup.add(yAxis);

        // Z Axis (blue tint)
        const zAxisGeom = new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8);
        const zAxis = new THREE.Mesh(zAxisGeom, axisMaterial);
        zAxis.rotation.x = Math.PI / 2;
        zAxis.position.set(-5, 0.1, -5 + axisLength / 2);
        axisGroup.add(zAxis);

        this.axisGroup = axisGroup;
        this.scene.add(axisGroup);

        // Create axis labels
        this.createAxisLabels();
    }

    createAxisLabels() {
        // Labels will be created as sprites or HTML overlays
        // For simplicity, we'll update these dynamically based on parameters
        this.axisLabels = {
            x: null,
            y: null,
            z: null
        };
    }

    updateCameraPosition() {
        const distance = 15 / this.zoom;

        // Spherical to Cartesian coordinates
        // theta = horizontal rotation, phi = vertical angle from top
        this.camera.position.x = Math.sin(this.phi) * Math.cos(this.theta) * distance;
        this.camera.position.y = Math.cos(this.phi) * distance;
        this.camera.position.z = Math.sin(this.phi) * Math.sin(this.theta) * distance;

        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    // Set data and update visualization
    setData(parameters, weights, bias, trainingData) {
        this.parameters = parameters || [];
        this.weights = weights || [];
        this.bias = bias || 0;
        this.trainingData = trainingData || [];

        this.updatePoints();
        this.updateBoundary();
    }

    // Update data points in the scene
    updatePoints() {
        // Remove existing point meshes
        this.pointMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.pointMeshes = [];

        if (!this.trainingData.length || !this.parameters.length) return;

        // Create new point meshes
        this.trainingData.forEach((point, index) => {
            const mesh = this.createPointMesh(point);
            mesh.userData = { index, point };
            this.pointMeshes.push(mesh);
            this.scene.add(mesh);
        });
    }

    createPointMesh(point) {
        const isYes = point.label === 'YES';
        const color = isYes ? this.colors.yes : this.colors.no;

        // Gem/orb shape
        const geometry = isYes
            ? new THREE.IcosahedronGeometry(0.25, 1)
            : new THREE.OctahedronGeometry(0.25, 0);

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.2,
            emissive: color,
            emissiveIntensity: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position based on normalized values
        const pos = this.getPointPosition(point.values);
        mesh.position.copy(pos);

        return mesh;
    }

    getPointPosition(values) {
        const pos = new THREE.Vector3();

        if (this.parameters.length >= 1 && values.length >= 1) {
            const param = this.parameters[this.dimX];
            const normalized = MathUtils.normalize(values[this.dimX], param.min, param.max);
            pos.x = (normalized - 0.5) * 8;
        }

        if (this.parameters.length >= 2 && values.length >= 2) {
            const param = this.parameters[this.dimY];
            const normalized = MathUtils.normalize(values[this.dimY], param.min, param.max);
            pos.y = normalized * 5 + 0.5;
        }

        if (this.parameters.length >= 3 && values.length >= 3) {
            const param = this.parameters[this.dimZ];
            const normalized = MathUtils.normalize(values[this.dimZ], param.min, param.max);
            pos.z = (normalized - 0.5) * 8;
        }

        return pos;
    }

    // Update decision boundary visualization
    updateBoundary() {
        // Remove existing boundary
        if (this.boundaryMesh) {
            this.scene.remove(this.boundaryMesh);
            this.boundaryMesh.geometry.dispose();
            this.boundaryMesh.material.dispose();
            this.boundaryMesh = null;
        }

        if (this.parameters.length < 2 || this.weights.length < 2) return;

        const numParams = Math.min(this.parameters.length, 3);

        if (numParams === 2) {
            this.createBoundary2D();
        } else {
            this.createBoundary3D();
        }
    }

    createBoundary2D() {
        // For 2 parameters, create a line
        const w1 = this.weights[this.dimX] || 0;
        const w2 = this.weights[this.dimY] || 0;
        const b = this.bias;

        // Decision boundary: w1*x + w2*y + b = 0
        // Solving for y: y = -(w1*x + b) / w2

        const points = [];
        const paramX = this.parameters[this.dimX];
        const paramY = this.parameters[this.dimY];

        for (let i = 0; i <= 20; i++) {
            const normalizedX = i / 20;
            const x = MathUtils.denormalize(normalizedX, paramX.min, paramX.max);

            // Calculate y on the boundary
            let y;
            if (Math.abs(w2) < 0.001) {
                // Vertical line case
                y = paramY.min + (i / 20) * (paramY.max - paramY.min);
            } else {
                y = -(w1 * x + b) / w2;
            }

            // Only add if within bounds
            if (y >= paramY.min && y <= paramY.max) {
                const normalizedY = MathUtils.normalize(y, paramY.min, paramY.max);
                const posX = (normalizedX - 0.5) * 8;
                const posY = normalizedY * 5 + 0.5;
                points.push(new THREE.Vector3(posX, posY, 0));
            }
        }

        if (points.length >= 2) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: this.colors.boundary,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });
            this.boundaryMesh = new THREE.Line(geometry, material);
            this.scene.add(this.boundaryMesh);
        }
    }

    createBoundary3D() {
        // For 3 parameters, create a plane
        const w1 = this.weights[this.dimX] || 0;
        const w2 = this.weights[this.dimY] || 0;
        const w3 = this.weights[this.dimZ] || 0;
        const b = this.bias;

        // Decision boundary plane: w1*x + w2*y + w3*z + b = 0
        // We'll create a mesh that represents this plane within our bounds

        const vertices = [];
        const indices = [];
        const resolution = 10;

        const paramX = this.parameters[this.dimX];
        const paramY = this.parameters[this.dimY];
        const paramZ = this.parameters[this.dimZ];

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const normalizedX = i / resolution;
                const normalizedZ = j / resolution;

                const x = MathUtils.denormalize(normalizedX, paramX.min, paramX.max);
                const z = MathUtils.denormalize(normalizedZ, paramZ.min, paramZ.max);

                // Calculate y on the boundary: y = -(w1*x + w3*z + b) / w2
                let y;
                if (Math.abs(w2) < 0.001) {
                    y = (paramY.min + paramY.max) / 2;
                } else {
                    y = -(w1 * x + w3 * z + b) / w2;
                }

                // Clamp y to bounds
                y = MathUtils.clamp(y, paramY.min, paramY.max);
                const normalizedY = MathUtils.normalize(y, paramY.min, paramY.max);

                const posX = (normalizedX - 0.5) * 8;
                const posY = normalizedY * 5 + 0.5;
                const posZ = (normalizedZ - 0.5) * 8;

                vertices.push(posX, posY, posZ);
            }
        }

        // Create triangle indices
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const a = i * (resolution + 1) + j;
                const b = a + 1;
                const c = a + (resolution + 1);
                const d = c + 1;

                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: this.colors.boundary,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.3,
            metalness: 0.1
        });

        this.boundaryMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.boundaryMesh);
    }

    // Add a single point (for training animation)
    addTrainingPoint(point, animated = true) {
        const mesh = this.createPointMesh(point);
        mesh.userData = { point };

        if (animated) {
            // Start above and drop in
            const targetY = mesh.position.y;
            mesh.position.y = targetY + 5;
            mesh.scale.set(0.5, 0.5, 0.5);

            // Animate
            const startTime = performance.now();
            const duration = 600;

            const animateDrop = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Bounce easing
                const t = 1 - Math.pow(1 - progress, 3);
                mesh.position.y = MathUtils.lerp(targetY + 5, targetY, t);

                // Scale up
                const scale = MathUtils.lerp(0.5, 1, t);
                mesh.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animateDrop);
                }
            };

            animateDrop();
        }

        this.pointMeshes.push(mesh);
        this.scene.add(mesh);

        return mesh;
    }

    // Highlight a point (for training mode)
    highlightPoint(mesh, highlight = true) {
        if (!mesh) return;

        if (highlight) {
            mesh.material.emissiveIntensity = 0.5;
            mesh.scale.set(1.3, 1.3, 1.3);
        } else {
            mesh.material.emissiveIntensity = 0.2;
            mesh.scale.set(1, 1, 1);
        }
    }

    // Color a point after labeling
    colorPoint(mesh, label) {
        if (!mesh) return;

        const isYes = label === 'YES';
        const color = isYes ? this.colors.yes : this.colors.no;

        mesh.material.color.setHex(color);
        mesh.material.emissive.setHex(color);
        mesh.userData.point.label = label;
    }

    // Show test point from calculation (yellow diamond)
    showTestPoint(values) {
        // Remove existing test point
        this.removeTestPoint();

        if (!values || values.length === 0 || !this.parameters.length) return;

        // Create yellow diamond for test point
        const geometry = new THREE.OctahedronGeometry(0.35, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            roughness: 0.2,
            metalness: 0.4,
            emissive: 0xFFD700,
            emissiveIntensity: 0.4
        });

        this.testPointMesh = new THREE.Mesh(geometry, material);
        this.testPointMesh.userData = { isTestPoint: true, values: values };

        // Position based on values
        const pos = this.getPointPosition(values);
        this.testPointMesh.position.copy(pos);

        // Animate entrance
        const targetY = pos.y;
        this.testPointMesh.position.y = targetY + 3;
        this.testPointMesh.scale.set(0.3, 0.3, 0.3);

        const startTime = performance.now();
        const duration = 400;

        const animateDrop = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const t = 1 - Math.pow(1 - progress, 3);

            this.testPointMesh.position.y = MathUtils.lerp(targetY + 3, targetY, t);
            const scale = MathUtils.lerp(0.3, 1.2, t);
            this.testPointMesh.scale.set(scale, scale, scale);

            if (progress < 1) {
                requestAnimationFrame(animateDrop);
            }
        };

        animateDrop();
        this.scene.add(this.testPointMesh);
    }

    // Remove test point
    removeTestPoint() {
        if (this.testPointMesh) {
            this.scene.remove(this.testPointMesh);
            this.testPointMesh.geometry.dispose();
            this.testPointMesh.material.dispose();
            this.testPointMesh = null;
        }
    }

    // Camera controls
    rotateLeft() {
        this.targetTheta -= Math.PI / 4;
    }

    rotateRight() {
        this.targetTheta += Math.PI / 4;
    }

    zoomIn() {
        this.targetZoom = Math.min(this.targetZoom * 1.2, 3);
    }

    zoomOut() {
        this.targetZoom = Math.max(this.targetZoom / 1.2, 0.5);
    }

    resetView() {
        this.targetTheta = Math.PI / 4;
        this.targetPhi = Math.PI / 4;
        this.targetZoom = 1;
    }

    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());

        // Smooth camera rotation
        const smoothSpeed = 0.1;
        this.theta = MathUtils.lerp(this.theta, this.targetTheta, smoothSpeed);
        this.phi = MathUtils.lerp(this.phi, this.targetPhi, smoothSpeed);

        // Smooth zoom
        this.zoom = MathUtils.lerp(this.zoom, this.targetZoom, smoothSpeed);

        // Auto-rotate when idle (optional, subtle)
        if (this.autoRotate && !this.isDragging) {
            this.targetTheta += 0.002;
        }

        this.updateCameraPosition();

        // Animate points (gentle bobbing)
        const time = performance.now() * 0.001;
        this.pointMeshes.forEach((mesh, i) => {
            if (mesh.userData.point) {
                const baseY = this.getPointPosition(mesh.userData.point.values).y;
                mesh.position.y = baseY + Math.sin(time * 2 + i) * 0.05;
            }
        });

        // Animate test point (pulsing glow)
        if (this.testPointMesh && this.testPointMesh.userData.values) {
            const baseY = this.getPointPosition(this.testPointMesh.userData.values).y;
            this.testPointMesh.position.y = baseY + Math.sin(time * 3) * 0.08;
            this.testPointMesh.rotation.y = time * 2;
            // Pulsing scale
            const pulse = 1.1 + Math.sin(time * 4) * 0.1;
            this.testPointMesh.scale.set(pulse, pulse, pulse);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        const aspect = this.width / this.height;
        const frustumSize = 15;

        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    // Clean up
    dispose() {
        this.pointMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        if (this.boundaryMesh) {
            this.boundaryMesh.geometry.dispose();
            this.boundaryMesh.material.dispose();
        }

        this.removeTestPoint();

        this.renderer.dispose();
    }
}

// Make available globally
window.IsometricGraph = IsometricGraph;
