# Roadmap validation that needs people or external clients

Automated code, data, and browser checks are reproducible with `npm run check`. They do not substitute for the participant and client tests below. Do not mark the related roadmap acceptance criteria complete until the results are recorded here or in a linked issue.

## Five-person newcomer study for issue #13

Recruit five volunteers who have not used this tracker and are unfamiliar with Artemis mission timelines. Ask permission to time the task and record anonymized outcomes. Do not record names, contact details, screen recordings, or unrelated personal information.

Give each volunteer the same direct Artemis II link and say only: “Find the spacecraft’s closest approach to the Moon and explain one maneuver shown on this page.” Start a three-minute timer. Do not point out controls or define terms while the timer runs. Record whether the volunteer found the cited closest-approach card, sought the shared replay time, and explained a maneuver accurately without assistance. Ask what blocked them only after the timed task. The criterion passes only when at least four of five complete both parts within three minutes without help; fix recurring blockers and repeat the test after changes.

| Participant | Found closest approach | Explained a maneuver | Seconds | Help given | Blocker / repair |
|---|---|---|---:|---|---|
| P1 | Pending | Pending | — | — | — |
| P2 | Pending | Pending | — | — | — |
| P3 | Pending | Pending | — | — | — |
| P4 | Pending | Pending | — | — | — |
| P5 | Pending | Pending | — | — | — |

## Two-week return-use pilot for roadmap issue #6

Invite at least five Artemis enthusiasts or educators to use the site voluntarily for fourteen days. Do not add accounts, analytics, cookies, or background tracking to collect results. At the start, explain that participants may opt out and can report only whether they independently returned, shared a mission moment, or reused a tour. Collect a short self-reported diary or day-14 check-in with no personal details. Use the results to prioritize follow-up work; do not claim a retention baseline from this small pilot.

| Participant | Independent return | Shared a moment | Reused a tour | Notes / product change |
|---|---|---|---|---|
| P1 | Pending | Pending | Pending | — |
| P2 | Pending | Pending | Pending | — |
| P3 | Pending | Pending | Pending | — |
| P4 | Pending | Pending | Pending | — |
| P5 | Pending | Pending | Pending | — |

## Calendar-client check for issue #16

Use two independent calendar clients (suggested: Outlook and Apple Calendar). Subscribe to the published Artemis III and Artemis IV feeds, confirm that each appears as a date-free follow-up task rather than an invented timed launch, and note when each client polls again after a sequence or cancellation change. Confirm that the same UID updates the task and that client notification timing follows the client’s own refresh settings. Record client name/version, subscription path, import result, refresh delay, and any manual recovery required. The generated files have an automated RFC 5545 parse test; this client check is still pending.

| Client and version | Mission feed | Initial import | Reschedule / cancellation | Observed refresh delay |
|---|---|---|---|---|
| Outlook · pending version | Artemis III / IV | Pending | Pending | — |
| Apple Calendar · pending version | Artemis III / IV | Pending | Pending | — |

## NASA item-level media review for issue #19

`npm run validate:media -- --links` checks the allowlisted NASA page URLs and requires a manual check when the response is inconclusive. A successful page-level HEAD response does not verify that a gallery still contains the named item or that a specific image/video may be reused. Before marking this issue complete, review each linked item page and record event relevance, displayed item credit, reuse/license notice, and whether captions or a transcript are actually available. The UI keeps the NASA provider fallback and makes no blanket license or caption claim.

| Stable media ID | Event relevance | Item credit | Reuse / license note | Captions / transcript |
|---|---|---|---|---|
| a1-launch | Pending | Pending | Pending | Not applicable / pending review |
| a1-flight | Pending | Pending | Pending | Not applicable / pending review |
| a1-timeline | Pending | Pending | Pending | Not applicable / pending review |
| a1-recovery | Pending | Pending | Pending | Not applicable / pending review |
| a1-video | Pending | Pending | Pending | Pending |
| a2-launch | Pending | Pending | Pending | Not applicable / pending review |
| a2-journey | Pending | Pending | Pending | Not applicable / pending review |
| a2-flyby | Pending | Pending | Pending | Not applicable / pending review |
| a2-return | Pending | Pending | Pending | Not applicable / pending review |
| a2-multimedia | Pending | Pending | Pending | Pending |

## Manual accessibility and device check for issue #12

The automated suite checks axe findings and captures layouts at 320, 390, 768, and 1440 CSS pixels. Before claiming the manual criterion, complete the workflow with keyboard-only input and one screen reader on desktop, then with VoiceOver on iOS or TalkBack on Android. Test at 200% browser zoom, with reduced motion, with WebGL unavailable, and after a 2D replay has been paused. Verify visible focus, correct selected-time announcements, the source link destination, and the copy-link fallback. Record browser/device and screen-reader versions, task completion, and any blocker. No manual run is recorded yet.
