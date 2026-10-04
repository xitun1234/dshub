import assert from "node:assert/strict"
import test from "node:test"
import { normalizeTicketInput, parseTicketInput } from "./parser"

test("normalizes spacing around ticket separators", () => {
  const variants = [
    "3dai. 38. b100n",
    "3dai.38.b100n",
    "3dai. 38.b100n",
    "3dai. 38.  b100n",
    "3dai.38.b 100n",
    "3dai.38.b.100n",
    "  3dai . 38 . b100n  "
  ]

  for (const input of variants) {
    assert.equal(normalizeTicketInput(input), "3dai. 38. b100n")
  }
})

test("keeps decimal amounts while normalizing separators", () => {
  assert.equal(normalizeTicketInput("3dai.38.b1,5n"), "3dai. 38. b1.5n")

  const result = parseTicketInput("3dai.38.b1,5n", "MN")
  assert.equal(result.isValid, true)
  assert.equal(result.bets[0]?.amount, 1.5)
})

test("parses inline forms for supported bet types", () => {
  const cases = [
    { input: "3dai.38.bao100n", type: "bao", stationCount: 3 },
    { input: "2đài.12-21.đá50n", type: "da", stationCount: 2 },
    { input: "hcm.123.xc20n", type: "xc", stationCount: 1 },
    { input: "mb.38.dd10n", type: "dd", stationCount: 1 }
  ]

  for (const item of cases) {
    const result = parseTicketInput(item.input, "MN")
    assert.equal(result.isValid, true, item.input)
    assert.equal(result.bets.length, 1, item.input)
    assert.equal(
      result.bets[0]?.type.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d"),
      item.type,
      item.input
    )
    assert.equal(result.bets[0]?.stationCount, item.stationCount, item.input)
  }
})

test("corrects a unique one-character typo in a long station alias", () => {
  const result = parseTicketInput([
    "khanhhoa. 08 56. b19n 67 04. b9n",
    "3dai. 68. b280n",
    "khanhoa. 53. b9n",
    "3dai. 31. b95n"
  ].join("\n"), "MT")

  assert.equal(result.isValid, true)
  assert.equal(result.bets.length, 5)
  assert.deepEqual(result.bets[3]?.stationAliases, ["khanhhoa"])
  assert.deepEqual(result.bets[3]?.numbers, ["53"])
  assert.equal(result.bets[3]?.stationCount, 1)
})

test("does not fuzzy-match short or ambiguous station codes", () => {
  const result = parseTicketInput("zzz. 53. b9n", "MT")
  assert.deepEqual(result.bets[0]?.stationAliases, [])
  assert.deepEqual(result.bets[0]?.numbers, ["zzz", "53"])
})
