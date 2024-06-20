import { createRequire } from 'node:module'
import { Bench } from 'tinybench'

const removeDuplicatesThenSort = array => {
  const seen = new Set()
  let insertIndex = 0
  for (let i = 0; i < array.length; i++) {
    const value = array[i]

    // Skip integers we've already seen.
    if (seen.has(value)) {
      continue
    }
    seen.add(value)

    // Place this unique integer at the next available index.
    array[insertIndex] = value
    // Increment to place the next unique integer at the next index.
    insertIndex++
  }
  // Shrink the array down to its new length.
  array.length = insertIndex

  array.sort((a, b) => a - b)
}

const sortThenRemoveDuplicates = array => {
  array.sort((a, b) => a - b)

  if (array.length === 0) {
    return
  }
  let insertIndex = 1
  for (let i = 1; i < array.length; i++) {
    // Skip sequences of duplicate integers.
    const previous = array[i - 1]
    const current = array[i]
    if (current === previous) {
      continue
    }

    // Place this unique integer at the next available index.
    array[insertIndex] = current
    // Increment to place the next unique integer at the next index.
    insertIndex++
  }
  // Shrink the array down to its new length.
  array.length = insertIndex
}

const shuffle = array => {
  for (let i = array.length; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const bench = new Bench({ iterations: 30 })

const integerCount = 100
const incrementCount = 100
for (
  let duplicateCount = 0;
  duplicateCount <= integerCount;
  duplicateCount += integerCount / incrementCount
) {
  const originalArray = shuffle(
    Array.from(
      { length: integerCount },
      (_, i) => i % Math.max(1, integerCount - duplicateCount),
    ),
  )
  let array
  const duplicatePercent = `${(100 * duplicateCount) / integerCount}%`
  bench
    .add(
      `dedupe then sort (${duplicatePercent} duplicates)`,
      () => removeDuplicatesThenSort(array),
      {
        beforeEach: () => (array = originalArray.slice()),
      },
    )
    .add(
      `sort then dedupe (${duplicatePercent} duplicates)`,
      () => sortThenRemoveDuplicates(array),
      {
        beforeEach: () => (array = originalArray.slice()),
      },
    )
}

await bench.warmup()
await bench.run()

console.log(
  `Input: array of ${integerCount} integers of various duplicate percentages`,
)
console.log(`Output: deduplicated sorted array of integers`)
console.log()
console.table(bench.table())

const require = createRequire(import.meta.url)
const QuickChart = require(`quickchart-js`)
new QuickChart()
  .setFormat(`svg`)
  .setConfig({
    type: `line`,
    options: {
      title: {
        display: true,
        text: `Efficiency of sorting and deduping a shuffled array of ${integerCount} integers`,
      },
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: `Duplicate integers (percentage)`,
            },
          },
        ],
        yAxes: [
          { scaleLabel: { display: true, labelString: `Mean time (ms)` } },
        ],
      },
      legend: {
        display: true,
        position: `bottom`,
      },
    },
    data: {
      labels: Array.from(
        { length: incrementCount + 1 },
        (_, i) => `${(100 * i) / incrementCount}%`,
      ),
      datasets: [
        {
          label: `dedupe then sort`,
          fill: false,
          backgroundColor: `hsl(16, 89%, 52%)`,
          borderColor: `hsl(16, 89%, 52%)`,
          pointRadius: 1,
          lineTension: 0.4,
          data: bench.results
            .filter((_, i) => i % 2 === 0)
            .map(result => result.mean),
        },
        {
          label: `sort then dedupe`,
          fill: false,
          backgroundColor: `hsl(201, 93%, 48%)`,
          borderColor: `hsl(201, 93%, 48%)`,
          pointRadius: 1,
          lineTension: 0.4,
          data: bench.results
            .filter((_, i) => i % 2 === 1)
            .map(result => result.mean),
        },
      ],
    },
  })
  .toFile(`./chart.svg`)
