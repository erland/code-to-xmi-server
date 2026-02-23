# Third‑party notices

This repository depends on third‑party open source components. Their license terms remain in effect for those components.

## Notable runtime dependencies

### express (MIT)
- Obligation: include copyright and license text when redistributing.

### multer (MIT)
- Obligation: include copyright and license text when redistributing.

### unzipper (MIT)
- Obligation: include copyright and license text when redistributing.

## License metadata caveat: `buffers@0.1.1`

The dependency chain `unzipper -> binary -> buffers@0.1.1` includes **`buffers@0.1.1`**.

- The npm registry page for `buffers@0.1.1` shows **"License: none"** (i.e., no license declared).
- Some third‑party scanners report MIT, but that conflicts with the npm metadata.

**Impact:** If a dependency is truly unlicensed, you may not have redistribution rights. For compliance certainty, consider:
- replacing `unzipper` with an alternative that does not pull `buffers`, or
- vendoring/forking `buffers` and adding a clear license (with author permission), or
- switching to a package/version with unambiguous licensing.

(You can regenerate a complete notice bundle by running a license crawler against your production dependencies.)
