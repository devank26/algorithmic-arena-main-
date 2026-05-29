export type VisualStep = {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  explanation: string;
  pseudocodeLine: number;
  comparisons: number;
  swaps: number;
};

export type VisualAlgorithmResult = {
  steps: VisualStep[];
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  pseudocode: string[];
};

function cloneStep(
  arr: number[],
  comparing: number[],
  swapping: number[],
  sorted: number[],
  explanation: string,
  pseudocodeLine: number,
  comparisons: number,
  swaps: number
): VisualStep {
  return {
    array: [...arr],
    comparing,
    swapping,
    sorted: [...sorted],
    explanation,
    pseudocodeLine,
    comparisons,
    swaps,
  };
}

export function visualBubbleSort(input: number[]): VisualAlgorithmResult {
  const arr = [...input];
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const pseudocode = [
    "for i = 0 to n-1:",
    "  for j = 0 to n-i-2:",
    "    if arr[j] > arr[j+1]:",
    "      swap(arr[j], arr[j+1])",
    "  // element bubbled to position",
    "// array is sorted",
  ];

  const steps: VisualStep[] = [
    cloneStep(arr, [], [], [], "Starting Bubble Sort — will compare adjacent elements", 0, 0, 0),
  ];

  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      comparisons++;
      steps.push(
        cloneStep(arr, [j, j + 1], [], sorted, `Comparing ${arr[j]} and ${arr[j + 1]}`, 2, comparisons, swaps)
      );
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
        steps.push(
          cloneStep(arr, [], [j, j + 1], sorted, `Swapping ${arr[j + 1]} and ${arr[j]} — ${arr[j + 1]} was larger`, 3, comparisons, swaps)
        );
      }
    }
    sorted.push(arr.length - 1 - i);
    steps.push(
      cloneStep(arr, [], [], sorted, `Element ${arr[arr.length - 1 - i]} is now in its final position`, 4, comparisons, swaps)
    );
  }
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i), "Array is fully sorted!", 5, comparisons, swaps));

  return {
    steps,
    name: "Bubble Sort",
    description: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The largest unsorted element 'bubbles up' to its correct position each pass.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    pseudocode,
  };
}

export function visualSelectionSort(input: number[]): VisualAlgorithmResult {
  const arr = [...input];
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  const pseudocode = [
    "for i = 0 to n-1:",
    "  minIdx = i",
    "  for j = i+1 to n:",
    "    if arr[j] < arr[minIdx]:",
    "      minIdx = j",
    "  swap(arr[i], arr[minIdx])",
    "// array is sorted",
  ];

  const steps: VisualStep[] = [
    cloneStep(arr, [], [], [], "Starting Selection Sort — will find the minimum each pass", 0, 0, 0),
  ];

  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      comparisons++;
      steps.push(
        cloneStep(arr, [minIdx, j], [], sorted, `Comparing ${arr[minIdx]} (current min) with ${arr[j]}`, 3, comparisons, swaps)
      );
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        steps.push(
          cloneStep(arr, [minIdx], [], sorted, `New minimum found: ${arr[minIdx]}`, 4, comparisons, swaps)
        );
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      swaps++;
      steps.push(
        cloneStep(arr, [], [i, minIdx], sorted, `Swapping ${arr[minIdx]} to position ${i} — placing minimum`, 5, comparisons, swaps)
      );
    }
    sorted.push(i);
    steps.push(
      cloneStep(arr, [], [], sorted, `Position ${i} is finalized with value ${arr[i]}`, 5, comparisons, swaps)
    );
  }
  sorted.push(arr.length - 1);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i), "Array is fully sorted!", 6, comparisons, swaps));

  return {
    steps,
    name: "Selection Sort",
    description: "Finds the minimum element from the unsorted part and places it at the beginning. Repeats until the entire array is sorted.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    pseudocode,
  };
}

export function visualInsertionSort(input: number[]): VisualAlgorithmResult {
  const arr = [...input];
  const sorted: number[] = [0];
  let comparisons = 0;
  let swaps = 0;

  const pseudocode = [
    "for i = 1 to n:",
    "  key = arr[i]",
    "  j = i - 1",
    "  while j >= 0 and arr[j] > key:",
    "    arr[j+1] = arr[j]",
    "    j = j - 1",
    "  arr[j+1] = key",
    "// array is sorted",
  ];

  const steps: VisualStep[] = [
    cloneStep(arr, [], [], [0], "Starting Insertion Sort — first element is already 'sorted'", 0, 0, 0),
  ];

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    steps.push(
      cloneStep(arr, [i], [], sorted, `Picking element ${key} to insert into sorted portion`, 1, comparisons, swaps)
    );

    while (j >= 0 && arr[j] > key) {
      comparisons++;
      arr[j + 1] = arr[j];
      swaps++;
      steps.push(
        cloneStep(arr, [j, j + 1], [j, j + 1], sorted, `Shifting ${arr[j]} right — it's larger than ${key}`, 4, comparisons, swaps)
      );
      j--;
    }
    if (j >= 0) comparisons++;
    arr[j + 1] = key;
    sorted.push(i);
    steps.push(
      cloneStep(arr, [], [], sorted, `Inserted ${key} at position ${j + 1}`, 6, comparisons, swaps)
    );
  }
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i), "Array is fully sorted!", 7, comparisons, swaps));

  return {
    steps,
    name: "Insertion Sort",
    description: "Builds the sorted array one element at a time by picking each element and inserting it into its correct position among the already-sorted elements.",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    pseudocode,
  };
}

export function visualQuickSort(input: number[]): VisualAlgorithmResult {
  const arr = [...input];
  const sortedIndices = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  const pseudocode = [
    "quickSort(arr, low, high):",
    "  if low < high:",
    "    pivot = arr[high]",
    "    i = low - 1",
    "    for j = low to high-1:",
    "      if arr[j] < pivot:",
    "        i++; swap(arr[i], arr[j])",
    "    swap(arr[i+1], arr[high])",
    "    quickSort(arr, low, pi-1)",
    "    quickSort(arr, pi+1, high)",
  ];

  const steps: VisualStep[] = [
    cloneStep(arr, [], [], [], "Starting Quick Sort — choosing pivots to partition", 0, 0, 0),
  ];

  function partition(low: number, high: number): number {
    const pivot = arr[high];
    steps.push(
      cloneStep(arr, [high], [], [...sortedIndices], `Choosing pivot: ${pivot} (last element)`, 2, comparisons, swaps)
    );
    let i = low - 1;
    for (let j = low; j < high; j++) {
      comparisons++;
      steps.push(
        cloneStep(arr, [j, high], [], [...sortedIndices], `Comparing ${arr[j]} with pivot ${pivot}`, 5, comparisons, swaps)
      );
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        swaps++;
        steps.push(
          cloneStep(arr, [], [i, j], [...sortedIndices], `${arr[j]} < ${pivot} — swapping to left partition`, 6, comparisons, swaps)
        );
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    swaps++;
    steps.push(
      cloneStep(arr, [], [i + 1, high], [...sortedIndices], `Placing pivot ${pivot} at its final position ${i + 1}`, 7, comparisons, swaps)
    );
    return i + 1;
  }

  function sort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      sortedIndices.add(pi);
      steps.push(
        cloneStep(arr, [], [], [...sortedIndices], `Pivot ${arr[pi]} is in final position — recursing on sub-arrays`, 8, comparisons, swaps)
      );
      sort(low, pi - 1);
      sort(pi + 1, high);
    } else if (low === high) {
      sortedIndices.add(low);
    }
  }

  sort(0, arr.length - 1);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i), "Array is fully sorted!", 9, comparisons, swaps));

  return {
    steps,
    name: "Quick Sort",
    description: "Selects a 'pivot' element, partitions the array so elements smaller than the pivot come before it and larger after, then recursively sorts the sub-arrays.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    pseudocode,
  };
}

export function visualMergeSort(input: number[]): VisualAlgorithmResult {
  const arr = [...input];
  const sortedIndices = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  const pseudocode = [
    "mergeSort(arr, start, end):",
    "  if start < end:",
    "    mid = (start + end) / 2",
    "    mergeSort(arr, start, mid)",
    "    mergeSort(arr, mid+1, end)",
    "    merge(arr, start, mid, end)",
    "  // merge two sorted halves",
    "  // compare and place in order",
  ];

  const steps: VisualStep[] = [
    cloneStep(arr, [], [], [], "Starting Merge Sort — dividing array into halves", 0, 0, 0),
  ];

  function merge(start: number, mid: number, end: number) {
    const left = arr.slice(start, mid + 1);
    const right = arr.slice(mid + 1, end + 1);
    let i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      comparisons++;
      steps.push(
        cloneStep(arr, [start + i, mid + 1 + j], [], [...sortedIndices], `Comparing ${left[i]} and ${right[j]}`, 7, comparisons, swaps)
      );
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      swaps++;
      steps.push(
        cloneStep(arr, [], [k], [...sortedIndices], `Placing ${arr[k]} at position ${k}`, 7, comparisons, swaps)
      );
      k++;
    }
    while (i < left.length) { arr[k] = left[i]; swaps++; steps.push(cloneStep(arr, [], [k], [...sortedIndices], `Placing remaining ${left[i]}`, 7, comparisons, swaps)); i++; k++; }
    while (j < right.length) { arr[k] = right[j]; swaps++; steps.push(cloneStep(arr, [], [k], [...sortedIndices], `Placing remaining ${right[j]}`, 7, comparisons, swaps)); j++; k++; }
  }

  function sort(start: number, end: number) {
    if (start < end) {
      const mid = Math.floor((start + end) / 2);
      steps.push(
        cloneStep(arr, [], [], [...sortedIndices], `Dividing: [${start}..${mid}] and [${mid + 1}..${end}]`, 2, comparisons, swaps)
      );
      sort(start, mid);
      sort(mid + 1, end);
      merge(start, mid, end);
    }
  }

  sort(0, arr.length - 1);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i), "Array is fully sorted!", 5, comparisons, swaps));

  return {
    steps,
    name: "Merge Sort",
    description: "Divides the array in half recursively until single elements remain, then merges them back together in sorted order. A classic divide-and-conquer algorithm.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    pseudocode,
  };
}

export function visualHeapSort(input: number[]): VisualAlgorithmResult {
  const arr = [...input];
  const sortedIndices = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  const pseudocode = [
    "buildMaxHeap(arr):",
    "  for i = n/2 down to 0:",
    "    heapify(arr, n, i)",
    "heapSort(arr):",
    "  for i = n-1 down to 1:",
    "    swap(arr[0], arr[i])",
    "    heapify(arr, i, 0)",
    "// array is sorted",
  ];

  const steps: VisualStep[] = [
    cloneStep(arr, [], [], [], "Starting Heap Sort — building a max heap first", 0, 0, 0),
  ];

  function heapify(n: number, i: number) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n) {
      comparisons++;
      steps.push(cloneStep(arr, [largest, left], [], [...sortedIndices], `Comparing ${arr[largest]} with left child ${arr[left]}`, 2, comparisons, swaps));
      if (arr[left] > arr[largest]) largest = left;
    }
    if (right < n) {
      comparisons++;
      steps.push(cloneStep(arr, [largest, right], [], [...sortedIndices], `Comparing ${arr[largest]} with right child ${arr[right]}`, 2, comparisons, swaps));
      if (arr[right] > arr[largest]) largest = right;
    }
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      swaps++;
      steps.push(cloneStep(arr, [], [i, largest], [...sortedIndices], `Swapping ${arr[largest]} and ${arr[i]} to maintain heap`, 2, comparisons, swaps));
      heapify(n, largest);
    }
  }

  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  steps.push(cloneStep(arr, [], [], [], "Max heap built — now extracting elements", 3, comparisons, swaps));

  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    swaps++;
    sortedIndices.add(i);
    steps.push(cloneStep(arr, [], [0, i], [...sortedIndices], `Moving max ${arr[i]} to final position ${i}`, 5, comparisons, swaps));
    heapify(i, 0);
  }
  sortedIndices.add(0);
  steps.push(cloneStep(arr, [], [], arr.map((_, i) => i), "Array is fully sorted!", 7, comparisons, swaps));

  return {
    steps,
    name: "Heap Sort",
    description: "Builds a max heap from the array, then repeatedly extracts the maximum element and places it at the end. Uses the heap data structure for efficient sorting.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    pseudocode,
  };
}

export function generateRandomArray(size: number, max: number = 100): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * max) + 5);
}

export const VISUAL_ALGORITHMS: Record<string, (arr: number[]) => VisualAlgorithmResult> = {
  bubble: visualBubbleSort,
  selection: visualSelectionSort,
  insertion: visualInsertionSort,
  quick: visualQuickSort,
  merge: visualMergeSort,
  heap: visualHeapSort,
};

export const VISUAL_ALGORITHM_LIST = [
  { key: "bubble", name: "Bubble Sort" },
  { key: "selection", name: "Selection Sort" },
  { key: "insertion", name: "Insertion Sort" },
  { key: "quick", name: "Quick Sort" },
  { key: "merge", name: "Merge Sort" },
  { key: "heap", name: "Heap Sort" },
];
