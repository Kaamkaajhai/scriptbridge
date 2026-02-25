f = 'c:/Users/yashc/OneDrive/Desktop/scriptbridge/client/src/pages/ScriptDetail.jsx'
c = open(f, encoding='utf-8').read()

# Re-encode: the file was written as latin-1 decoded from utf-8 bytes, then saved as utf-8 again.
# The mojibake characters need to be decoded as latin-1 and re-encoded as utf-8.
# Strategy: find mojibake sequences and replace with correct chars.

replacements = [
    ('\u00e2\u0080\u0094', '\u2014'),   # â€" -> em dash
    ('\u00e2\u0098\u0085', '\u2605'),   # â˜… -> ★
    ('\u00e2\u0098\u0086', '\u2606'),   # â˜† -> ☆
    ('\u00e2\u0098\u0089', '\u2609'),   # -> ☉
    ('\u00e2\u009c\u0095', '\u2715'),   # âœ• -> ✕
    ('\u00e2\u00ad\u0090', '\u2b50'),   # â­ -> ⭐
    ('\u00c2\u00b0', '\u00b0'),         # Â° -> °
    # 4-byte emoji: F0 9F xx xx -> becomes 4 latin-1 chars
    ('\u00f0\u009f\u0091\u0081', '\U0001f441'),  # 👁
    ('\u00f0\u009f\u0094\u0096', '\U0001f4d6'),  # 📖
    ('\u00f0\u009f\u008e\u00ad', '\U0001f3ad'),  # 🎭
    ('\u00f0\u009f\u008f\u00b7', '\U0001f3f7'),  # 🏷
    ('\u00f0\u009f\u008e\u00ad', '\U0001f3ad'),  # 🎭 duplicate
    ('\ufe0f', ''),                              # variation selector cleanup
]

for bad, good in replacements:
    before = c.count(bad)
    c = c.replace(bad, good)
    if before:
        print(f'Replaced {before}x: {repr(bad)} -> {repr(good)}')

open(f, 'w', encoding='utf-8').write(c)
print('Done.')
