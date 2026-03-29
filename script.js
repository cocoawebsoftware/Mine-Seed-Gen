const generateBtn = document.getElementById("generateBtn");
const seedBox = document.getElementById("seed");
const statusText = document.getElementById("status");

const biomeCheck = document.getElementById("biomeCheck");
const biomeBox = document.getElementById("biomeBox");

// UI
biomeCheck.addEventListener("change", () => {
    biomeBox.classList.toggle("hidden");
});

// Java Random再現
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

// 村判定（簡易）
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

// スポーン周辺
function checkVillage(seed) {
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            if (hasVillage(seed, x, z)) return true;
        }
    }
    return false;
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

// 条件
function isValid(seed, biome, needVillage) {
    if (needVillage && !checkVillage(seed)) return false;

    if (biome) {
        if (getBiome(seed, 0, 0) !== biome) return false;
    }

    return true;
}

// 非同期探索（フリーズ防止）
async function findSeed(options) {
    let tries = 0;

    while (true) {
        let seed;

        if (options.edition === "java") {
            seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        } else {
            seed = Math.floor(Math.random() * 4294967295);
        }

        tries++;

        if (isValid(seed, options.biome, options.village)) {
            return { seed, tries };
        }

        // UI更新
        if (tries % 500 === 0) {
            statusText.innerText = `探索中... ${tries}回`;
            await new Promise(r => setTimeout(r, 0));
        }
    }
}

// ボタン
generateBtn.addEventListener("click", async () => {
    seedBox.innerText = "---";
    statusText.innerText = "探索開始...";

    const options = {
        edition: document.getElementById("edition").value,
        village: document.getElementById("villageCheck").checked,
        biome: biomeCheck.checked ? document.getElementById("biome").value : null
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
