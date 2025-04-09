$(document).ready(function() {
    // ====== Theme Management ======
    initializeTheme();
    setupThemeToggle();

    // ====== Event Handlers ======
    setupOperationTypeHandler();
    setupConvertButtonHandler();
    setupCopyButtonHandler();
    setupClearButtonHandler();

    // ====== Responsive Design ======
    setupResponsiveLayout();

    // ====== Function Implementations ======

    function initializeTheme() {
        // Check system/stored preference for dark mode
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark' || (!savedTheme && darkModeMediaQuery.matches)) {
            document.documentElement.classList.add('dark');
            updateThemeIcon(true);
        } else {
            document.documentElement.classList.remove('dark');
            updateThemeIcon(false);
        }

        // Listen for system theme changes
        darkModeMediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                    updateThemeIcon(true);
                } else {
                    document.documentElement.classList.remove('dark');
                    updateThemeIcon(false);
                }
            }
        });
    }

    function updateThemeIcon(isDark) {
        const moonIcon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
        const sunIcon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
        
        $('#theme-toggle svg').html(isDark ? sunIcon : moonIcon);
    }

    function setupThemeToggle() {
        $('#theme-toggle').click(function() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }

    function setupResponsiveLayout() {
        function adjustLayout() {
            const width = $(window).width();
            if (width < 768) { // Mobile view
                $('.container').addClass('mobile-view');
                adjustTextareaHeight();
            } else { // Desktop view
                $('.container').removeClass('mobile-view');
                resetTextareaHeight();
            }
        }

        // Initial adjustment
        adjustLayout();

        // Throttled resize handler
        let resizeTimeout;
        $(window).on('resize', function() {
            if (!resizeTimeout) {
                resizeTimeout = setTimeout(function() {
                    resizeTimeout = null;
                    adjustLayout();
                }, 66); // 15fps
            }
        });

        function adjustTextareaHeight() {
            $('textarea').css('height', '150px');
        }

        function resetTextareaHeight() {
            $('textarea').css('height', '200px');
        }
    }

    function setupOperationTypeHandler() {
        $('#operation-type').change(function() {
            const operation = $(this).val();
            const formatSelect = $('#format-type');
            formatSelect.empty();

            if (operation === 'hash') {
                // Add all available hash formats
                formatSelect.append(`
                    <option value="md5">MD5</option>
                    <option value="sha1">SHA-1</option>
                    <option value="sha256">SHA-256</option>
                    <option value="sha384">SHA-384</option>
                    <option value="sha512">SHA-512</option>
                    <option value="sha3-256">SHA3-256</option>
                    <option value="sha3-512">SHA3-512</option>
                    <option value="ripemd160">RIPEMD160</option>
                    <option value="blake2b">BLAKE2b</option>
                `);
            } else {
                // Add all available encoding formats
                formatSelect.append(`
                    <option value="base64">Base64</option>
                    <option value="url">URL</option>
                    <option value="html">HTML</option>
                    <option value="binary">Binary</option>
                    <option value="hex">Hexadecimal</option>
                    <option value="morse">Morse Code</option>
                    <option value="rot13">ROT13</option>
                    <option value="unicode">Unicode Escape</option>
                `);
            }

            // Clear output when operation type changes
            $('#output-text').val('');
        });
    }

    function setupConvertButtonHandler() {
        $('#convert-btn').click(async function() {
            const btn = $(this);
            const originalText = btn.text();
            
            try {
                // Show loading state
                btn.prop('disabled', true)
                   .addClass('loading')
                   .text('');

                const input = $('#input-text').val();
                const operation = $('#operation-type').val();
                const format = $('#format-type').val();
                
                let result = '';
                switch (operation) {
                    case 'encode':
                        result = encode(input, format);
                        break;
                    case 'decode':
                        result = decode(input, format);
                        break;
                    case 'hash':
                        result = await hash(input, format);
                        break;
                }
                
                $('#output-text').val(result);
            } catch (error) {
                $('#output-text').val('Error: ' + error.message);
            } finally {
                // Reset button state
                btn.prop('disabled', false)
                   .removeClass('loading')
                   .text(originalText);
            }
        });
    }

    function setupCopyButtonHandler() {
        $('#copy-btn').click(function() {
            const output = $('#output-text');
            const text = output.val();
            
            if (text) {
                if (navigator.clipboard && window.isSecureContext) {
                    // Use modern clipboard API when available
                    navigator.clipboard.writeText(text).then(() => {
                        showCopyFeedback(this);
                    });
                } else {
                    // Fallback to older method
                    output.select();
                    document.execCommand('copy');
                    showCopyFeedback(this);
                }
            }
        });

        function showCopyFeedback(button) {
            const btn = $(button);
            btn.addClass('copied');
            
            setTimeout(() => {
                btn.removeClass('copied');
            }, 1500);
        }
    }

    function setupClearButtonHandler() {
        $('#clear-btn').click(function() {
            $('#input-text, #output-text').val('');
            $('#input-text').focus();
        });
    }

    // ====== Encoding/Decoding Functions ======
    // Encoding functions
    function encode(input, format) {
        switch (format) {
            case 'base64':
                return btoa(unescape(encodeURIComponent(input)));
            case 'url':
                return encodeURIComponent(input);
            case 'html':
                return input.replace(/[&<>"']/g, match => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                })[match]);
            case 'binary':
                return input.split('').map(char => 
                    char.charCodeAt(0).toString(2).padStart(8, '0')
                ).join(' ');
            case 'hex':
                return input.split('').map(char =>
                    char.charCodeAt(0).toString(16).padStart(2, '0')
                ).join('');
            case 'morse':
                const morseDict = {
                    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
                    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
                    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
                    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
                    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
                    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
                    '8': '---..', '9': '----.', ' ': '/'
                };
                return input.toUpperCase().split('').map(char => 
                    morseDict[char] || char
                ).join(' ');
            case 'rot13':
                return input.replace(/[a-zA-Z]/g, char => {
                    const base = char <= 'Z' ? 65 : 97;
                    return String.fromCharCode((char.charCodeAt(0) - base + 13) % 26 + base);
                });
            case 'unicode':
                return input.split('').map(char => 
                    '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')
                ).join('');
            default:
                throw new Error('Unsupported encoding format');
        }
    }

    // Decoding functions
    function decode(input, format) {
        switch (format) {
            case 'base64':
                return decodeURIComponent(escape(atob(input)));
            case 'url':
                return decodeURIComponent(input);
            case 'html':
                const textarea = document.createElement('textarea');
                textarea.innerHTML = input;
                return textarea.value;
            case 'binary':
                return input.split(' ').map(bin => 
                    String.fromCharCode(parseInt(bin, 2))
                ).join('');
            case 'hex':
                return input.match(/.{1,2}/g).map(hex => 
                    String.fromCharCode(parseInt(hex, 16))
                ).join('');
            case 'morse':
                const morseDict = {
                    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
                    '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
                    '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
                    '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
                    '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
                    '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
                    '---..': '8', '----.': '9', '/': ' '
                };
                return input.split(' ').map(code => 
                    morseDict[code] || code
                ).join('');
            case 'rot13':
                return encode(input, 'rot13'); // ROT13 is its own inverse
            case 'unicode':
                return input.replace(/\\u[\dA-F]{4}/gi, match =>
                    String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
                );
            default:
                throw new Error('Unsupported decoding format');
        }
    }

    // ====== Hashing Functions ======
    async function hash(input, format) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        
        try {
            switch (format) {
                case 'md5':
                    return md5(input);
                case 'sha1':
                case 'sha256':
                case 'sha384':
                case 'sha512':
                    const hashBuffer = await crypto.subtle.digest(format.toUpperCase(), data);
                    return arrayBufferToHex(hashBuffer);
                case 'sha3-256':
                    return sha3(input, 256);
                case 'sha3-512':
                    return sha3(input, 512);
                case 'ripemd160':
                    return ripemd160(input);
                case 'blake2b':
                    return blake2b(input);
                default:
                    throw new Error('Unsupported hashing format');
            }
        } catch (error) {
            throw new Error(`Hashing failed: ${error.message}`);
        }
    }

    // Helper function for converting ArrayBuffer to hex string
    function arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // SHA3 implementation
    function sha3(input, bits) {
        // Implementation of SHA3 using keccak.js library
        const keccak = new Keccak(bits);
        return keccak.update(input).digest('hex');
    }

    // RIPEMD160 implementation
    function ripemd160(input) {
        // Implementation of RIPEMD160
        const rmd = new RIPEMD160();
        return rmd.update(input).digest('hex');
    }

    // BLAKE2b implementation
    function blake2b(input) {
        // Implementation of BLAKE2b
        const blake = new BLAKE2b(64); // 512 bits
        return blake.update(input).digest('hex');
    }

    // MD5 Implementation
    function md5(string) {
        function rotateLeft(lValue, iShiftBits) {
            return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
        }

        function addUnsigned(lX, lY) {
            const lX8 = (lX & 0x80000000);
            const lY8 = (lY & 0x80000000);
            const lX4 = (lX & 0x40000000);
            const lY4 = (lY & 0x40000000);
            const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
            if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
            if (lX4 | lY4) {
                if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            } else return (lResult ^ lX8 ^ lY8);
        }

        function F(x, y, z) { return (x & y) | ((~x) & z); }
        function G(x, y, z) { return (x & z) | (y & (~z)); }
        function H(x, y, z) { return (x ^ y ^ z); }
        function I(x, y, z) { return (y ^ (x | (~z))); }

        function FF(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function GG(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function HH(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function II(a, b, c, d, x, s, ac) {
            a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
            return addUnsigned(rotateLeft(a, s), b);
        }

        function convertToWordArray(string) {
            let lWordCount;
            const lMessageLength = string.length;
            const lNumberOfWordsTemp1 = lMessageLength + 8;
            const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
            const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
            const lWordArray = Array(lNumberOfWords - 1);
            let lBytePosition = 0;
            let lByteCount = 0;
            while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                lByteCount++;
            }
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
            lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
            lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
            return lWordArray;
        }

        function wordToHex(lValue) {
            let WordToHexValue = "", WordToHexValueTemp = "", lByte, lCount;
            for (lCount = 0; lCount <= 3; lCount++) {
                lByte = (lValue >>> (lCount * 8)) & 255;
                WordToHexValueTemp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2);
            }
            return WordToHexValue;
        }

        const x = convertToWordArray(string);
        let k, AA, BB, CC, DD, a, b, c, d;
        const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
        const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
        const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
        const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

        for (k = 0; k < x.length; k += 16) {
            AA = a; BB = b; CC = c; DD = d;
            a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
            d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
            c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
            b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
            a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
            d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
            c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
            b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
            a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
            d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
            c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
            b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
            a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
            d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
            c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
            b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);

            a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
            d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
            c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
            b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
            a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
            d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
            c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
            b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
            a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
            d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
            c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
            b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
            a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
            d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
            c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
            b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);

            a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
            d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
            c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
            b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
            a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
            d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
            c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
            b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
            a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
            d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
            c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
            b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
            a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
            d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
            c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
            b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);

            a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
            d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
            c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
            b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
            a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
            d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
            c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
            b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
            a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
            d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
            c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
            b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
            a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
            d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
            c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
            b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);

            a = addUnsigned(a, AA);
            b = addUnsigned(b, BB);
            c = addUnsigned(c, CC);
            d = addUnsigned(d, DD);
        }

        const temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
        return temp.toLowerCase();
    }
}); 