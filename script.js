const generateBtn = document.getElementById("generateBtn");
const seedBox = document.getElementById("seed");
const statusText = document.getElementById("status");

const villageCheck = document.getElementById("villageCheck");
const biomeCheck = document.getElementById("biomeCheck");

const villageBox = document.getElementById("villageBox");
const biomeBox = document.getElementById("biomeBox");

// UI安定
function updateUI() {
    villageBox.classList.toggle("hidden", !villageCheck.checked);
    biomeBox.classList.toggle("hidden", !biomeCheck.checked);
}
updateUI();
villageCheck.addEventListener("change", updateUI);
biomeCheck.addEventListener("change", updateUI);

// Java RNG
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

// Bedrock RNG（第二地獄）
class Xoroshiro {
    constructor(seed) {
        this.s0 = BigInt(seed) ^ 0x9E3779B97F4A7C15n;
        this.s1 = this.s0 << 1n;
    }

    next() {
        let s0 = this.s0;
        let s1 = this.s1;

        const result = s0 + s1;

        s1 ^= s0;
        this.s0 = ((s0 << 55n) | (s0 >> 9n)) ^ s1 ^ (s1 << 14n);
        this.s1 = (s1 << 36n) | (s1 >> 28n);

        return Number(result & 0xffffffffn);
    }

    nextInt(bound) {
        return this.next() % bound;
    }
}

// Java村
function hasVillageJava(seed, x, z) {
    const spacing = 32, separation = 8;
    const gridX = Math.floor(x / spacing);
    const gridZ = Math.floor(z / spacing);

    const rand = new JavaRandom(
        BigInt(gridX * 341873128712 + gridZ * 132897987541 + seed)
    );

    return (x % spacing === rand.nextInt(spacing - separation) &&
            z % spacing === rand.nextInt(spacing - separation));
}

// Bedrock村
function hasVillageBedrock(seed, x, z) {
    const spacing = 32, separation = 8;
    const gridX = Math.floor(x / spacing);
    const gridZ = Math.floor(z / spacing);

    const rng = new Xoroshiro(
        BigInt(seed + gridX * 73428767 + gridZ * 912931)
    );

    return (x % spacing === rng.nextInt(spacing - separation) &&
            z % spacing === rng.nextInt(spacing - separation));
}

// 疑似バイオーム
function getBiome(seed, x, z) {
    const v = Math.sin((x + seed) * 0.01) + Math.cos((z - seed) * 0.01);
    if (v > 1) return "plains";
    if (v > 0.5) return "forest";
    if (v > 0) return "savanna";
    if (v > -0.5) return "taiga";
    return "snowy";
}

// 村チェック
function checkVillage(seed, options) {
    for (let x = -6; x <= 6; x++) {
        for (let z = -6; z <= 6; z++) {

            let has = (options.edition === "java")
                ? hasVillageJava(seed, x, z)
                : hasVillageBedrock(seed, x, z);

            if (has) {
                const biome = getBiome(seed, x * 16, z * 16);
                if (!options.villageBiome || biome === options.villageBiome) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 条件
function isValid(seed, options) {
    if (options.village && !checkVillage(seed, options)) return false;
    if (options.biome && getBiome(seed, 0, 0) !== options.biome) return false;
    return true;
}

// 探索
async function findSeed(options) {
    let tries = 0;

    while (true) {
        let seed = (options.edition === "java")
            ? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
            : Math.floor(Math.random() * 4294967295);

        tries++;

        if (isValid(seed, options)) return { seed, tries };

        if (tries % 500 === 0) {
            statusText.innerText = `探索中... ${tries}`;
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
        villageBiome: document.getElementById("villageBiome").value,
        biome: biomeCheck.checked
            ? document.getElementById("biome").value
            : null
    };

    const result = await findSeed(options);

    seedBox.innerText = result.seed;
    statusText.innerText = `完了: ${result.tries}回`;
});

// コピー
document.getElementById("copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(seedBox.innerText);
    alert("コピーした！");
});
