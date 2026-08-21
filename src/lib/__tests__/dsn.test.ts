import { strict as assert } from 'node:assert'
import test from 'node:test'
import { parseDSNXml } from '../dsn'

test('DSN parser normalizes dish, site, pointing, and target ranges', () => {
  const xml = `
    <dsn>
      <dish name="DSS14" azimuthAngle="120.5" elevationAngle="45.25">
        <target name="Orion" uplegRange="123.4" downlegRange="125.6" />
      </dish>
      <dish name="DSS43" azimuthAngle="10" elevationAngle="20">
        <target name="Mars" uplegRange="0" downlegRange="0" />
      </dish>
    </dsn>
  `

  assert.deepEqual(parseDSNXml(xml), [
    {
      name: 'DSS14',
      site: 'Goldstone',
      azimuth: 120.5,
      elevation: 45.25,
      targets: [{ name: 'Orion', upSignal: 123.4, downSignal: 125.6 }],
    },
    {
      name: 'DSS43',
      site: 'Canberra',
      azimuth: 10,
      elevation: 20,
      targets: [{ name: 'Mars', upSignal: 0, downSignal: 0 }],
    },
  ])
})

test('DSN parser returns an explicit empty state for empty or incomplete feeds', () => {
  assert.deepEqual(parseDSNXml('<dsn />'), [])
  assert.deepEqual(parseDSNXml('<dish name="DSS14" />'), [])
})
