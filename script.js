const seedBox = document.getElementById("seed");
const statusText = document.getElementById("status");

const villageCheck = document.getElementById("villageCheck");
const villageBox = document.getElementById("villageBox");

const generateBtn = document.getElementById("generateBtn");
const stopBtn = document.getElementById("stopBtn");

villageCheck.onchange = () => {
    villageBox.classList.toggle("hidden", !villageCheck.checked);
};

// Workerコード
const workerCode = `
let running = true;

self.onmessage = function(e) {
    if (e.data === "stop") {
        running = false;
        return;
    }

    function randSeed(max) {
        return Math.floor(Math.random() * max);
    }

    function getSpawn(seed) {
        return {
            x: (seed % 2000) - 1000,
            z: ((seed / 3) % 2000) - 1000
        };
    }

    function hasVillage(seed, x, z) {
        return Math.abs((seed + x*341 + z*123) % 41) === 0;
    }

    let tries = 0;

    while (running) {
        let seed = randSeed(9007199254740991);
        tries++;

        const spawn = getSpawn(seed);

        for (let x = -6; x <= 6; x++) {
            for (let z = -6; z <= 6; z++) {
                if (hasVillage(seed, spawn.x + x, spawn.z + z)) {
                    postMessage({type:"found", seed, tries});
                    running = false;
                    return;
                }
            }
        }

        if (tries % 500 === 0) {
            postMessage({type:"progress", tries});
        }
    }
};
`;

// Worker生成
function createWorker() {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    return new Worker(URL.createObjectURL(blob));
}

let workers = [];
let totalTries = 0;
let running = false;

const WORKERS = 4;

// 開始
generateBtn.onclick = () => {
    if (running) return;

    running = true;
    seedBox.innerText = "...";
    statusText.innerText = "探索中...";

    totalTries = 0;
    workers = [];

    for (let i = 0; i < WORKERS; i++) {
        const w = createWorker();
        workers.push(w);

        w.onmessage = (e) => {

            if (e.data.type === "progress") {
                totalTries += e.data.tries;
                statusText.innerText = "探索中: " + totalTries + "回";
            }

            if (e.data.type === "found") {
                if (!running) return;

                running = false;
                seedBox.innerText = e.data.seed;
                statusText.innerText = "発見！総試行: " + totalTries;

                workers.forEach(w => w.terminate());
            }
        };

        w.postMessage("start");
    }
};

// 停止
stopBtn.onclick = () => {
    running = false;
    workers.forEach(w => w.postMessage("stop"));
    statusText.innerText = "停止";
};
