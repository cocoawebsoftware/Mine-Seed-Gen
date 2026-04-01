// UI
const seedBox = document.getElementById("seed");
const statusText = document.getElementById("status");
const villageCheck = document.getElementById("villageCheck");
const villageBox = document.getElementById("villageBox");

villageCheck.onchange = () => {
    villageBox.classList.toggle("hidden", !villageCheck.checked);
};

// =========================
// Workerコードを文字列化
// =========================
const workerCode = `
self.onmessage = function(e) {

function randSeed(max) {
    return Math.floor(Math.random() * max);
}

// スポーン座標ランダム化（②）
function getSpawn(seed) {
    return {
        x: (seed % 1000) - 500,
        z: ((seed / 2) % 1000) - 500
    };
}

// 村判定（簡易）
function hasVillage(seed, x, z) {
    return Math.abs((seed + x*341 + z*123) % 37) === 0;
}

function check(seed, needVillage) {
    const spawn = getSpawn(seed);

    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            if (hasVillage(seed, spawn.x + x, spawn.z + z)) {
                return true;
            }
        }
    }
    return !needVillage;
}

let tries = 0;

while (true) {
    let seed = randSeed(9007199254740991);
    tries++;

    if (check(seed, e.data.village)) {
        postMessage({seed, tries});
        break;
    }
}
}
`;

// Worker生成（③）
function createWorker() {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    return new Worker(URL.createObjectURL(blob));
}

// 並列数
const WORKERS = 4;

// 実行
document.getElementById("generateBtn").onclick = () => {

    seedBox.innerText = "...";
    statusText.innerText = "探索中（並列）";

    let finished = false;
    let totalTries = 0;

    for (let i = 0; i < WORKERS; i++) {

        const w = createWorker();

        w.onmessage = (e) => {
            if (finished) return;

            finished = true;
            seedBox.innerText = e.data.seed;
            statusText.innerText = "完了（試行: " + e.data.tries + "）";

            w.terminate();
        };

        w.postMessage({
            village: villageCheck.checked
        });
    }
};
