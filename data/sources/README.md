# Pinned flight ephemeris inputs

The compressed OEM archives in this directory are downloaded from NASA’s Artemis tracker pages. Their SHA-256 checksums, the selected OEM entries, the archive creation metadata, and JPL Horizons Moon-query details are recorded in ephemeris-manifest.json.

| Mission | NASA source page | Chosen source record | Coordinate/time contract |
|---|---|---|---|
| Artemis I | https://www.nasa.gov/missions/artemis/orion/track-nasas-artemis-i-mission-in-real-time/ | Post_TLI_Orion_AsFlown_20221213_EPH_OEM.asc | OEM header: Earth center, EME2000, UTC, km and km/s |
| Artemis II | https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/ | Artemis_II_OEM_2026_04_10_Post-ICPS-Sep-to-EI.asc from the latest included daily OEM archive | OEM header: Earth center, EME2000, UTC, km and km/s |

Each spacecraft record is checked by its SHA-256 and retained as the original NASA ZIP in this directory. Lunar vectors were downloaded from the official JPL Horizons API for each OEM file’s usable UTC time span, at a four-minute output interval. The query requests Moon object 301 relative to Earth geocenter 500@399, EME2000/J2000 axes, UTC, and KM-S units. The full API responses and retrieval times are also pinned here.

From the repository root, run npm run prepare:ephemeris to verify these inputs and regenerate the combined validation bundle and the per-mission files public/data/missionEphemerides-artemis-i.json and public/data/missionEphemerides-artemis-ii.json. To deliberately retrieve the lunar inputs again, run npm run fetch:ephemeris, review the updated timestamps and hashes, then run prepare again. The production Pages workflow consumes the committed generated dataset; it does not query Horizons for a spacecraft position at runtime.

The source ephemeris coverage begins after launch for both missions and ends before some late events. Interpolation is limited to 30 minutes. The UI reports uncovered epochs as unavailable and does not extrapolate. NASA publicly distributes the OEM files; NASA imagery and the Orion 3D model retain their separate credits and license notices.
