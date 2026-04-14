const experiments = [
    {
        category: "chemistry",
        title: "Baking Soda & Vinegar Volcano",
        description: "Watch an explosive acid-base reaction create a foamy eruption.",
        materials: ["1 cup baking soda", "1 cup white vinegar", "A container or tray", "Optional: food coloring"],
        steps: [
            "Place your container on a tray to catch overflow.",
            "Add the baking soda to the container.",
            "Add a few drops of food coloring if desired.",
            "Slowly pour in the vinegar and watch the reaction!",
            "Observe the fizzing and foam produced."
        ]
    },
    {
        category: "chemistry",
        title: "Invisible Ink",
        description: "Write secret messages that only appear when heated.",
        materials: ["Lemon juice", "Cotton swab or thin paintbrush", "White paper", "Lamp or hair dryer"],
        steps: [
            "Squeeze lemon juice into a small bowl.",
            "Dip the cotton swab into the juice.",
            "Write your message on the paper.",
            "Let the paper dry completely — the writing will disappear.",
            "Hold the paper near a warm lamp or use a hair dryer to reveal the message."
        ]
    },
    {
        category: "physics",
        title: "Egg Drop Challenge",
        description: "Design a container that protects an egg from a fall using engineering principles.",
        materials: ["1 raw egg", "Craft supplies (straws, tape, cotton balls, rubber bands)", "A safe drop height (2–3 meters)"],
        steps: [
            "Design a protective container for the egg using your craft supplies.",
            "Consider padding, shock absorption, and structure.",
            "Build your design and place the egg inside.",
            "Drop it from the designated height.",
            "Check if the egg survived and adjust your design if needed."
        ]
    },
    {
        category: "physics",
        title: "Homemade Compass",
        description: "Magnetize a needle to find magnetic north.",
        materials: ["A sewing needle", "A magnet", "A small piece of cork or foam", "A bowl of water"],
        steps: [
            "Stroke the needle with the magnet in one direction about 30 times.",
            "Float the piece of cork or foam on the water surface.",
            "Carefully lay the magnetized needle on top of the cork.",
            "Watch the needle slowly rotate to point north.",
            "Verify with a store-bought compass if available."
        ]
    },
    {
        category: "biology",
        title: "Seed Germination Observation",
        description: "Watch seeds sprout and track their growth over several days.",
        materials: ["Bean or radish seeds", "Paper towels", "A zip-lock bag", "Water", "Tape and a sunny window"],
        steps: [
            "Dampen a paper towel and fold it inside the zip-lock bag.",
            "Place 3–5 seeds between the towel and the bag wall.",
            "Seal the bag and tape it to a sunny window.",
            "Check daily and keep the towel moist.",
            "Record observations: when roots appear, when sprouts emerge, growth rate."
        ]
    },
    {
        category: "biology",
        title: "Bread Mold Study",
        description: "Observe how mold grows under different conditions.",
        materials: ["3 slices of plain bread", "3 zip-lock bags", "Water in a spray bottle", "Labels and a marker"],
        steps: [
            "Label bags: 'Dry', 'Wet', 'Wet + Dark'.",
            "Place one slice in each bag. Lightly mist the 'Wet' and 'Wet + Dark' slices.",
            "Seal all bags. Put 'Wet + Dark' in a cupboard; leave others on the counter.",
            "Check every day for 5–7 days without opening bags.",
            "Compare mold growth across conditions and record your findings."
        ]
    }
];

const generateBtn = document.getElementById('generate-btn');
const categorySelect = document.getElementById('category');
const experimentCard = document.getElementById('experiment-card');
const expTitle = document.getElementById('exp-title');
const expDescription = document.getElementById('exp-description');
const expMaterials = document.getElementById('exp-materials');
const expSteps = document.getElementById('exp-steps');

generateBtn.addEventListener('click', () => {
    const selected = categorySelect.value;
    const pool = selected === 'all'
        ? experiments
        : experiments.filter(e => e.category === selected);

    if (pool.length === 0) {
        expTitle.textContent = 'No experiments found for that category.';
        expDescription.textContent = '';
        expMaterials.innerHTML = '';
        expSteps.innerHTML = '';
        experimentCard.classList.remove('hidden');
        return;
    }

    const exp = pool[Math.floor(Math.random() * pool.length)];

    expTitle.textContent = exp.title;
    expDescription.textContent = exp.description;

    expMaterials.innerHTML = exp.materials.map(m => `<li>${m}</li>`).join('');
    expSteps.innerHTML = exp.steps.map(s => `<li>${s}</li>`).join('');

    experimentCard.classList.remove('hidden');
});
