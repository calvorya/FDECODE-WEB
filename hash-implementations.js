// SHA3 (Keccak) Implementation
class Keccak {
    constructor(bits) {
        this.bits = bits;
        this.state = new Array(25).fill(0n);
        this.blockSize = 200 - 2 * (bits / 8);
        this.buffer = [];
    }

    update(input) {
        const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
        this.buffer = [...this.buffer, ...data];
        while (this.buffer.length >= this.blockSize) {
            this.processBlock();
        }
        return this;
    }

    digest(format = 'hex') {
        // Padding
        this.buffer.push(0x01);
        while ((this.buffer.length % this.blockSize) !== (this.blockSize - 1)) {
            this.buffer.push(0x00);
        }
        this.buffer.push(0x80);
        this.processBlock();

        const result = new Uint8Array(this.bits / 8);
        let offset = 0;
        while (offset < result.length) {
            const lane = Number(this.state[Math.floor(offset / 8)]);
            result[offset] = lane & 0xff;
            offset++;
        }

        return format === 'hex' ? Array.from(result)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('') : result;
    }

    processBlock() {
        // Implementation of Keccak-f[1600] permutation
        for (let i = 0; i < 24; i++) {
            // θ step
            const C = new Array(5).fill(0n);
            const D = new Array(5).fill(0n);
            
            for (let x = 0; x < 5; x++) {
                C[x] = this.state[x] ^ this.state[x + 5] ^ this.state[x + 10] ^ 
                       this.state[x + 15] ^ this.state[x + 20];
            }
            
            for (let x = 0; x < 5; x++) {
                D[x] = C[(x + 4) % 5] ^ this.rotateLeft(C[(x + 1) % 5], 1);
                for (let y = 0; y < 5; y++) {
                    this.state[x + 5 * y] ^= D[x];
                }
            }

            // ρ and π steps
            let last = this.state[1];
            for (let x = 0; x < 24; x++) {
                const current = this.state[this.piLane[x]];
                this.state[this.piLane[x]] = this.rotateLeft(last, this.rhoOffsets[x]);
                last = current;
            }

            // χ step
            for (let y = 0; y < 5; y++) {
                const t = new Array(5);
                for (let x = 0; x < 5; x++) {
                    t[x] = this.state[x + 5 * y];
                }
                for (let x = 0; x < 5; x++) {
                    this.state[x + 5 * y] = t[x] ^ ((~t[(x + 1) % 5]) & t[(x + 2) % 5]);
                }
            }

            // ι step
            this.state[0] ^= this.roundConstants[i];
        }
        
        this.buffer = this.buffer.slice(this.blockSize);
    }

    rotateLeft(value, offset) {
        return ((value << BigInt(offset)) | (value >> BigInt(64 - offset))) & ((1n << 64n) - 1n);
    }
}

// RIPEMD160 Implementation
class RIPEMD160 {
    constructor() {
        this.h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
        this.buffer = [];
    }

    update(input) {
        const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
        this.buffer = [...this.buffer, ...data];
        while (this.buffer.length >= 64) {
            this.processBlock();
        }
        return this;
    }

    digest(format = 'hex') {
        // Padding
        const bitLength = this.buffer.length * 8;
        this.buffer.push(0x80);
        while ((this.buffer.length % 64) !== 56) {
            this.buffer.push(0);
        }
        
        // Append length
        for (let i = 0; i < 8; i++) {
            this.buffer.push((bitLength >>> (i * 8)) & 0xff);
        }

        this.processBlock();

        const result = new Uint8Array(20);
        for (let i = 0; i < 5; i++) {
            result[i * 4] = this.h[i] & 0xff;
            result[i * 4 + 1] = (this.h[i] >>> 8) & 0xff;
            result[i * 4 + 2] = (this.h[i] >>> 16) & 0xff;
            result[i * 4 + 3] = (this.h[i] >>> 24) & 0xff;
        }

        return format === 'hex' ? Array.from(result)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('') : result;
    }

    processBlock() {
        // RIPEMD-160 block processing implementation
        const words = new Array(16);
        for (let i = 0; i < 16; i++) {
            words[i] = this.buffer[i * 4] |
                      (this.buffer[i * 4 + 1] << 8) |
                      (this.buffer[i * 4 + 2] << 16) |
                      (this.buffer[i * 4 + 3] << 24);
        }

        let al = this.h[0], bl = this.h[1], cl = this.h[2], dl = this.h[3], el = this.h[4];
        let ar = this.h[0], br = this.h[1], cr = this.h[2], dr = this.h[3], er = this.h[4];

        // Main loop
        for (let j = 0; j < 80; j++) {
            let t = this.rotateLeft(al + this.f(j, bl, cl, dl) + words[this.r[j]] + this.k(j), this.s[j]) + el;
            al = el; el = dl; dl = this.rotateLeft(cl, 10); cl = bl; bl = t;
            
            t = this.rotateLeft(ar + this.f(79 - j, br, cr, dr) + words[this.rr[j]] + this.kr(j), this.sr[j]) + er;
            ar = er; er = dr; dr = this.rotateLeft(cr, 10); cr = br; br = t;
        }

        // Final values
        const t = this.h[1] + cl + dr;
        this.h[1] = this.h[2] + dl + er;
        this.h[2] = this.h[3] + el + ar;
        this.h[3] = this.h[4] + al + br;
        this.h[4] = this.h[0] + bl + cr;
        this.h[0] = t;

        this.buffer = this.buffer.slice(64);
    }

    rotateLeft(x, n) {
        return ((x << n) | (x >>> (32 - n))) >>> 0;
    }
}

// BLAKE2b Implementation
class BLAKE2b {
    constructor(outlen = 64) {
        this.outlen = outlen;
        this.state = new Uint8Array(64);
        this.buffer = new Uint8Array(128);
        this.bufferLength = 0;
        this.counter = 0n;
        this.initialize();
    }

    initialize() {
        // Initialize state with IV and parameters
        const IV = new BigUint64Array([
            0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
            0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
            0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
            0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
        ]);

        this.h = new BigUint64Array(8);
        for (let i = 0; i < 8; i++) {
            this.h[i] = IV[i];
        }
        
        // Mix in the key length and output length
        this.h[0] ^= BigInt(0x01010000 | this.outlen);
    }

    update(input) {
        const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
        
        for (let i = 0; i < data.length; i++) {
            if (this.bufferLength === 128) {
                this.counter += 128n;
                this.compress();
                this.bufferLength = 0;
            }
            this.buffer[this.bufferLength++] = data[i];
        }
        
        return this;
    }

    digest(format = 'hex') {
        // Padding
        this.counter += BigInt(this.bufferLength);
        while (this.bufferLength < 128) {
            this.buffer[this.bufferLength++] = 0;
        }
        
        // Set last block flag
        this.lastBlock = true;
        this.compress();

        // Extract hash
        const out = new Uint8Array(this.outlen);
        for (let i = 0; i < this.outlen; i++) {
            out[i] = Number((this.h[Math.floor(i / 8)] >> BigInt(8 * (i % 8))) & 0xffn);
        }

        return format === 'hex' ? Array.from(out)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('') : out;
    }

    compress() {
        // BLAKE2b compression function
        const v = new BigUint64Array(16);
        const m = new BigUint64Array(16);

        // Initialize working variables
        for (let i = 0; i < 8; i++) {
            v[i] = this.h[i];
            v[i + 8] = BLAKE2b.IV[i];
        }

        v[12] ^= this.counter & ((1n << 64n) - 1n);
        v[13] ^= this.counter >> 64n;

        if (this.lastBlock) {
            v[14] = ~v[14];
        }

        // Convert message block to 64-bit words
        for (let i = 0; i < 16; i++) {
            m[i] = BigInt(this.buffer[i * 8]) |
                   (BigInt(this.buffer[i * 8 + 1]) << 8n) |
                   (BigInt(this.buffer[i * 8 + 2]) << 16n) |
                   (BigInt(this.buffer[i * 8 + 3]) << 24n) |
                   (BigInt(this.buffer[i * 8 + 4]) << 32n) |
                   (BigInt(this.buffer[i * 8 + 5]) << 40n) |
                   (BigInt(this.buffer[i * 8 + 6]) << 48n) |
                   (BigInt(this.buffer[i * 8 + 7]) << 56n);
        }

        // Twelve rounds of mixing
        for (let i = 0; i < 12; i++) {
            // Mix the columns
            this.G(v, m, 0, 4, 8, 12, 0, 1);
            this.G(v, m, 1, 5, 9, 13, 2, 3);
            this.G(v, m, 2, 6, 10, 14, 4, 5);
            this.G(v, m, 3, 7, 11, 15, 6, 7);

            // Mix the diagonals
            this.G(v, m, 0, 5, 10, 15, 8, 9);
            this.G(v, m, 1, 6, 11, 12, 10, 11);
            this.G(v, m, 2, 7, 8, 13, 12, 13);
            this.G(v, m, 3, 4, 9, 14, 14, 15);
        }

        // Update state
        for (let i = 0; i < 8; i++) {
            this.h[i] ^= v[i] ^ v[i + 8];
        }
    }

    G(v, m, a, b, c, d, x, y) {
        v[a] = v[a] + v[b] + m[x];
        v[d] = this.rotr64(v[d] ^ v[a], 32n);
        v[c] = v[c] + v[d];
        v[b] = this.rotr64(v[b] ^ v[c], 24n);
        v[a] = v[a] + v[b] + m[y];
        v[d] = this.rotr64(v[d] ^ v[a], 16n);
        v[c] = v[c] + v[d];
        v[b] = this.rotr64(v[b] ^ v[c], 63n);
    }

    rotr64(x, n) {
        return ((x >> n) | (x << (64n - n))) & ((1n << 64n) - 1n);
    }

    static get IV() {
        return new BigUint64Array([
            0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
            0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
            0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
            0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
        ]);
    }
} 