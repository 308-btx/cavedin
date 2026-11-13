# cavedin: caveman with telemetry stripped

Fork of [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman). Every change is tagged `[cavedin]`.

## What is stripped
| Sender | Change |
|---|---|
| CLI usage events (`cli-telemetry` endpoint) | `CAVEDIN_NO_TELEMETRY` kill switch: state is always off, senders are no-ops, endpoint removed, `telemetry on` refuses |
| `caveman-blocks` (a prebuilt upstream binary) | the CLI writes `telemetry.enabled=false` to `~/.caveman/cloud.json` and sets `DO_NOT_TRACK=1` for every child process |
| Proxy cloud-link runtime events | `telemetryEnvOff()` always true |

Not covered: the **Caveman Code** desktop app (separate product, not in this repo), and the prebuilt
`caveman-proxy` / `caveman-blocks` binaries, which only obey the opt-out above. Build the proxy from
`proxy/` if you want the patched one.

## Staying in sync
`.github/workflows/cavedin-sync-upstream.yml` merges upstream `main` every Monday, re-deletes
`deleted-paths.txt`, runs `check-no-telemetry.sh` and the no-send test, and pushes only if all pass.
Otherwise it opens an issue. Don't use GitHub's "Sync fork" button; it skips the guard.

Locally: `git fetch upstream && git merge upstream/main && ./cavedin/check-no-telemetry.sh`
