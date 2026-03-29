const generateBtn = document.getElementById("generateBtn");
const seedBox = document.getElementById("seed");
const statusText = document.getElementById("status");

const villageCheck = document.getElementById("villageCheck");
const biomeCheck = document.getElementById("biomeCheck");

const villageBox = document.getElementById("villageBox");
const biomeBox = document.getElementById("biomeBox");

// UI切り替え
villageCheck.addEventListener("change", () => {
    villageBox.classList.toggle("hidden");
});

biomeCheck.addEventListener("change", () => {
    biomeBox.classList.toggle("hidden");
});

// Java Random
class JavaRandom {
    constructor(seed) {
        this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
    }

    next(bits) {
        this.seed = (this.seed * 25214903917n + 11n) & ((1n << 48n) - 1n);
        return Number(this.seed >> (48n - BigInt(bits)));
    }

    nextInt(bound) {
        return this.next(31) % bound;
    }
}

// 村判定
function hasVillage(seed, chunkX, chunkZ) {
    const spacing = 32;
    const separation = 8;

    const gridX = Math.floor(chunkX / spacing);
    const gridZ = Math.floor(chunkZ / spacing);

    const rand = new JavaRandom(
        BigInt(gridX * 341873128712 + gridZ * 132897987541 + seed)
    );

    const offsetX = rand.nextInt(spacing - separation);
    const offsetZ = rand.nextInt(spacing - separation);

    return (chunkX % spacing === offsetX &&
            chunkZ % spacing === offsetZ);
}

// 疑似バイオーム
function getBiome(seed, x, z) {
    const val = Math.sin((x + seed) * 0.01) + Math.cos((z - seed) * 0.01);

    if (val > 1) return "plains";
    if (val > 0.5) return "forest";
    if (val > 0) return "savanna";
    if (val > -0.5) return "taiga";
    return "snowy";
}

// 村＋バイオームチェック
function checkVillage(seed, targetBiome) {
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            if (hasVillage(seed, x, z)) {

                const biome = getBiome(seed, x * 16, z * 16);

                if (!targetBiome || biome === targetBiome) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 条件
function isValid(seed, options) {

    if (options.village) {
        if (!checkVillage(seed, options.villageBiome)) return false;
    }

    if (options.biome) {
        if (getBiome(seed, 0, 0) !== options.biome) return false;
    }

    return true;
}

// 非同期探索
async function findSeed(options) {
    let tries = 0;

    while (true) {
        let seed = (options.edition === "java")
            ? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
            : Math.floor(Math.random() * 4294967295);

        tries++;

        if (isValid(seed, options)) {
            return { seed, tries };
        }

        if (tries % 500 === 0) {
            statusText.innerText = `探索中... ${tries}回`;
            await new Promise(r => setTimeout(r, 0));
        }
    }
}

// 実行
generateBtn.addEventListener("click", async () => {
    seedBox.innerText = "---";
    statusText.innerText = "探索開始...";

    const options = {
        edition: document.getElementById("edition").value,
        village: villageCheck.checked,
        villageBiome: villageCheck.checked
            ? document.getElementById("villageBiome").value
            : null,
        biome: biomeCheck.checked
            ? document.getElementById("biome").value
            : null
    };

    const result = await findSeed(options);

    seedBox.innerText = result.seed;
    statusText.innerText = `完了！（試行回数: ${result.tries}）`;
});

// コピー
document.getElementById("copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(seedBox.innerText);
    alert("コピーした！");
});
