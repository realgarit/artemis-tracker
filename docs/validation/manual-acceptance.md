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

## Desktop and mobile browser check for issue #18

CI verifies a cold offline mission route and that an interrupted update preserves the last complete pack. It also injects `QuotaExceededError` and `SecurityError` responses and checks the recovery guidance. These deterministic checks do not establish actual browser quota or private-browsing behavior on installed products. On one documented desktop browser and one actual iOS/Android browser, download a pack, close the browser, disable networking, and reopen a direct mission route. Confirm the 2D/story journey works, check the storage estimate, remove one pack and then all packs, and attempt an update with network interruption. Verify that the prior complete pack remains usable. Test the browser's private or restricted-storage mode and one quota-limited condition; record the message and recovery action. Confirm compatible updates preserve existing history/bookmarks.

| Target | Browser/version and device | Cold offline route | Remove one / clear all | Quota/private recovery | Interrupted update and bookmark migration |
|---|---|---|---|---|---|
| Desktop | Microsoft Edge 154.0.4258.37 on Windows; Playwright-controlled persistent temporary profile | Passed: installed 1.72 MB / 28-resource Artemis II pack, closed Edge, relaunched the same profile offline, and opened a direct 2D mission route. All three bundled font families loaded from the pack. | Passed: removed the Artemis II pack, installed Artemis I and II, then cleared both packs. | Passed: Edge InPrivate (`--inprivate`) installed a pack successfully; no recovery message was needed. A 1-byte Edge DevTools origin-quota override triggered the full-storage guidance. | Passed: an HTTP 503 injected for the compressed ephemeris during update preserved the single prior complete pack. Cross-version history/bookmark migration remains pending. |
| Mobile | Pending OS/device/browser | Pending | Pending | Pending | Pending |

## NASA item-level media review for issue #19

`npm run validate:media -- --links` checks the allowlisted NASA pages and source-linked caption files. The editorial check below reviewed the current page content and a representative named asset for every stable media ID on 2026-09-27. NASA's [media-use guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) says NASA material is generally not subject to U.S. copyright for factual educational/informational use, but third-party copyright, identifiable-person rights, NASA identifiers, and promotional/commercial use have separate restrictions; NASA's publication does not pass third-party rights to others. The app links to the NASA source, does not reproduce thumbnails or video, and records no blanket license. Recheck an asset's notice before any future reuse or export.

| Stable media ID | Event relevance and checked source item | Displayed item credit | Reuse / license note | Captions / transcript |
|---|---|---|---|---|
| a1-launch | Launch collection describes the Nov. 16 SLS/Orion lift-off; checked [NASA launch image](https://www.nasa.gov/image-detail/amf-nhq202211160027/). | NASA/Joel Kowsky. | No third-party rights notice appeared on the checked image page. NASA's general reuse limits above apply; link only. | Not applicable; still image. |
| a1-flight | In-flight gallery covers the outbound flyby, DRO and return coast; checked [flight-day 12 lunar image](https://www.nasa.gov/image-detail/amf-art001e001464/) identifies Orion's optical-navigation camera and DRO. | NASA/JSC producer context; the checked asset page gives no separate photographer credit. The app records that absence instead of inventing one. | No item-specific reuse license or third-party marker appeared on the checked detail page. Link only; apply NASA's guidance and do not infer an individual photographer. | Not applicable; still-image gallery. |
| a1-timeline | NASA's [mission timeline](https://www.nasa.gov/reference/artemis-i-mission-timeline/) has the mission overview and flight-day event chronology. | NASA mission text; lead image NASA/Joel Kowsky. | Text remains on NASA's page; cite NASA when quoting. No text is copied into the media card. | Not applicable; text timeline. |
| a1-recovery | [Splashdown image](https://www.nasa.gov/image-detail/amf-ksc-20221211-ph-kls01-0007/) states Orion splashed down Dec. 11, 2022 and describes recovery aboard USS Portland. | NASA/Kim Shiflett. | No third-party rights notice appeared on the checked image page. NASA's general reuse limits above apply; link only. | Not applicable; still-image gallery. |
| a1-video | NASA's [specific 2:02 highlight video page](https://science.nasa.gov/resource/nasas-artemis-i-moon-mission-launch-to-splashdown-highlights/) describes launch through splashdown and lists English as its language. | NASA. | The NASA page names NASA as credit and gives no separate license for third-party segments. The app links to the item and does not copy the video. | No caption file or transcript was listed on the checked NASA page; the app says caption availability varies at the provider. |
| a2-launch | [Launch-day updates](https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/) document liftoff and launch operations on Apr. 1, 2026. | NASA updates; lead image NASA/Joel Kowsky. | Text remains at NASA; follow NASA citation guidance and any item-level notice before reuse. | Not applicable; text updates and still image. |
| a2-journey | Journey gallery's checked [Apr. 3 “A Sliver of Earth” image](https://www.nasa.gov/image-detail/amf-art002e023710/) shows Earth from Orion during the outbound journey. | NASA. | No third-party rights notice appeared on the checked image page. NASA's general reuse limits above apply; link only. | Not applicable; still-image gallery. |
| a2-flyby | Lunar flyby gallery's checked [Apr. 6 “Crescent Earth Over Lunar Horizon” image](https://www.nasa.gov/image-detail/amf-art002e015231/) is from the far-side pass. | NASA. | No third-party rights notice appeared on the checked image page. NASA's general reuse limits above apply; link only. | Not applicable; still-image gallery. |
| a2-return | Recovery gallery's checked [Apr. 11 crew recovery image](https://www.nasa.gov/image-detail/artemis-ii-recovery-131/) records the crew aboard USS John P. Murtha after the Apr. 10 splashdown. | NASA/Bill Ingalls. | No third-party rights notice appeared on the checked image page. NASA's general reuse limits above apply; link only. | Not applicable; still-image gallery. |
| a2-multimedia | NASA SVS's [Artemis II Day 5 Wrapup](https://svs.gsfc.nasa.gov/15012) is a mission-flight video. Its page credits the clip producers and identifies the music. | NASA's Goddard Space Flight Center; video by Liz Wilk and Ryan Fitzgibbons; music “Timeless Icons” by Universal Production Music. | The page identifies third-party music but does not grant a separate reuse license for that music. The app links to the source and SRT; it does not copy video or audio. | English [SRT transcript](https://svs.gsfc.nasa.gov/vis/a010000/a015000/a015012/Wrap_up_Day_5_Vertical_YouTube.en_US.srt) is published by NASA SVS and is now linked from the card. |

## Manual accessibility and device check for issue #12

The automated suite checks axe for serious/critical violations, tests keyboard activation through mission selection → event seek → source opening → share, and asserts 44×44 CSS pixel hit areas for key mobile controls. It also captures layouts at 320, 390, 768, and 1440 CSS pixels. Before claiming the manual criterion, complete the workflow with one screen reader on desktop, then with VoiceOver on iOS or TalkBack on Android. Test at 200% browser zoom, with reduced motion, with WebGL unavailable, and after a 2D replay has been paused. Verify visible focus, correct selected-time announcements, the source link destination, and the copy-link fallback. Record browser/device and screen-reader versions, task completion, and any blocker. A desktop Edge keyboard-only run is recorded below; live screen-reader speech, actual browser zoom, and mobile-device runs are still pending.

| Target | Browser/device and screen reader version | Keyboard flow | Announcements and focus | 200% zoom / reduced motion / no WebGL | Result and blocker |
|---|---|---|---|---|---|
| Desktop | Microsoft Edge 154.0.4258.37 on Windows; Playwright-controlled installed Edge, keyboard-only | Passed: Tab/Enter switched missions, sought `a1-launch`, and copied its exact moment URL. | Replay control displayed a 3px cyan focus outline; NASA source destination was inspected. Screen-reader speech/selected-time announcements not tested. | Reduced-motion and no-WebGL are covered by automated checks; actual Edge 200% zoom not tested. | Keyboard journey passes; Narrator and actual 200% zoom remain pending. |
| Mobile | Pending iOS/Android device, browser, and VoiceOver/TalkBack version | Pending | Pending | Pending | Pending |
