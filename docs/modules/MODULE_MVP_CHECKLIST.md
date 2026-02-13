# Module MVP Checklist

Pass/fail checklist for the Standalone hello-world module.

---

## Checklist

| # | Criterion | Pass | Fail |
|---|-----------|------|------|
| 1 | Module package exists in `packages/modules/hello-world` (or similar) | ☑ | ☐ |
| 2 | Module registers at least one job with Core via Desktop | ☑ | ☐ |
| 3 | Module UI loads inside Desktop; triggers job; displays logs and artifacts | ☑ | ☐ |
| 4 | No module-to-module imports | ☑ | ☐ |
| 5 | No direct DB or filesystem access | ☑ | ☐ |
| 6 | Job registration flow documented and followed | ☑ | ☐ |
| 7 | MODULE_ARCHITECTURE.md, MODULE_CONSTRAINTS.md, MODULE_PUBLIC_API.md followed | ☑ | ☐ |

---

## References

- [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md)
- [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md)
- [MODULE_PUBLIC_API.md](MODULE_PUBLIC_API.md)
- Active module is set via `ARO_ACTIVE_MODULE` (default `hello-world`) or **`.env`** at the project root; see [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md).
