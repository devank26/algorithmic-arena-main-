export type SortStep = {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
};

export type AlgorithmResult = {
  steps: SortStep[];
  name: string;
  timeComplexity: string;
  spaceComplexity: string;
};

function cloneStep(arr: number[], comparing: number[] = [], swapping: number[] = [], sorted: number[] = []): SortStep {
  return { array: [...arr], comparing, swapping, sorted: [...sorted] };
}

export function bubbleSort(input: number[]): AlgorithmResult {
  const arr = [...input];
  const steps: SortStep[] = [cloneStep(arr)];
  const sorted: number[] = [];

  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      steps.push(cloneStep(arr, [j, j + 1], [], sorted));
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push(cloneStep(arr, [], [j, j + 1], sorted));
      }
    }
    sorted.push(arr.length - 1 - i);
  }
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i)));

  return { steps, name: "Bubble Sort", timeComplexity: "O(n²)", spaceComplexity: "O(1)" };
}

export function quickSort(input: number[]): AlgorithmResult {
  const arr = [...input];
  const steps: SortStep[] = [cloneStep(arr)];
  const sortedIndices: Set<number> = new Set();

  function partition(low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push(cloneStep(arr, [j, high], [], [...sortedIndices]));
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        steps.push(cloneStep(arr, [], [i, j], [...sortedIndices]));
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    steps.push(cloneStep(arr, [], [i + 1, high], [...sortedIndices]));
    return i + 1;
  }

  function sort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      sortedIndices.add(pi);
      sort(low, pi - 1);
      sort(pi + 1, high);
    } else if (low === high) {
      sortedIndices.add(low);
    }
  }

  sort(0, arr.length - 1);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i)));

  return { steps, name: "Quick Sort", timeComplexity: "O(n log n)", spaceComplexity: "O(log n)" };
}

export function mergeSort(input: number[]): AlgorithmResult {
  const arr = [...input];
  const steps: SortStep[] = [cloneStep(arr)];
  const sortedIndices: Set<number> = new Set();

  function merge(start: number, mid: number, end: number) {
    const left = arr.slice(start, mid + 1);
    const right = arr.slice(mid + 1, end + 1);
    let i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      steps.push(cloneStep(arr, [start + i, mid + 1 + j], [], [...sortedIndices]));
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      steps.push(cloneStep(arr, [], [k], [...sortedIndices]));
      k++;
    }
    while (i < left.length) { arr[k] = left[i]; steps.push(cloneStep(arr, [], [k], [...sortedIndices])); i++; k++; }
    while (j < right.length) { arr[k] = right[j]; steps.push(cloneStep(arr, [], [k], [...sortedIndices])); j++; k++; }
  }

  function sort(start: number, end: number) {
    if (start < end) {
      const mid = Math.floor((start + end) / 2);
      sort(start, mid);
      sort(mid + 1, end);
      merge(start, mid, end);
    }
  }

  sort(0, arr.length - 1);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i)));

  return { steps, name: "Merge Sort", timeComplexity: "O(n log n)", spaceComplexity: "O(n)" };
}

export function heapSort(input: number[]): AlgorithmResult {
  const arr = [...input];
  const steps: SortStep[] = [cloneStep(arr)];
  const sortedIndices: Set<number> = new Set();

  function heapify(n: number, i: number) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n) {
      steps.push(cloneStep(arr, [largest, left], [], [...sortedIndices]));
      if (arr[left] > arr[largest]) largest = left;
    }
    if (right < n) {
      steps.push(cloneStep(arr, [largest, right], [], [...sortedIndices]));
      if (arr[right] > arr[largest]) largest = right;
    }
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      steps.push(cloneStep(arr, [], [i, largest], [...sortedIndices]));
      heapify(n, largest);
    }
  }

  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    sortedIndices.add(i);
    steps.push(cloneStep(arr, [], [0, i], [...sortedIndices]));
    heapify(i, 0);
  }
  sortedIndices.add(0);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i)));

  return { steps, name: "Heap Sort", timeComplexity: "O(n log n)", spaceComplexity: "O(1)" };
}

export function generateRandomArray(size: number, max: number = 100): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * max) + 5);
}

export const ALGORITHMS: Record<string, (arr: number[]) => AlgorithmResult> = {
  bubble: bubbleSort,
  quick: quickSort,
  merge: mergeSort,
  heap: heapSort,
};

export const ALGORITHM_INFO: Record<string, { name: string; color: string }> = {
  bubble: { name: "Bubble Sort", color: "cyan" },
  quick: { name: "Quick Sort", color: "purple" },
  merge: { name: "Merge Sort", color: "green" },
  heap: { name: "Heap Sort", color: "pink" },
};
