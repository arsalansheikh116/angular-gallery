/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  if (data === 'start') {
    const start = performance.now();
    const count = sieveOfEratosthenes(350_000);
    const end = performance.now();

    postMessage({
      primesFound: count,
      executionTime: end - start
    });
  }
});

function sieveOfEratosthenes(max: number): number {
  const isPrime = new Uint8Array(max + 1);
  isPrime.fill(1);
  isPrime[0] = isPrime[1] = 0;

  for (let i = 2; i * i <= max; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= max; j += i) {
        isPrime[j] = 0;
      }
    }
  }

  let count = 0;
  for (let i = 2; i <= max; i++) {
    if (isPrime[i]) count++;
  }
  return count;
}
