import { MEDIA_ARCHIVE, validateMediaArchive } from '../src/data/mediaArchive.ts'

const issues = validateMediaArchive()
if (issues.length) throw new Error(issues.join('\n'))
console.log(`Media catalog valid: ${MEDIA_ARCHIVE.length} records, stable IDs, NASA-host URLs, credits, reuse notes, and event associations.`)

if (process.argv.includes('--links')) {
  const urls = [...new Set(MEDIA_ARCHIVE.flatMap((item) => [item.url, item.reuseGuidanceUrl, ...(item.transcriptUrl ? [item.transcriptUrl] : [])]))]
  const manual: string[] = []
  await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8_000) })
      if (!response.ok) manual.push(`${response.status} ${url}`)
    } catch {
      manual.push(`inconclusive ${url}`)
    }
  }))
  if (manual.length) {
    console.error('NASA did not provide a conclusive automated link response. Manually open and verify these source pages before publishing:')
    for (const item of manual) console.error(`- ${item}`)
    process.exitCode = 2
  } else console.log(`All ${urls.length} NASA source, reuse-guidance, and caption URLs returned successful HEAD responses; review item-level content, credit, and rights manually.`)
}
