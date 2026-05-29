export type VisualSearchStep = {
  array: number[];
  comparing: number[]; // indices being compared to target
  found: number[]; // indices where target is found
  leftBounds: number; // for binary search
  rightBounds: number; // for binary search
  explanation: string;
  pseudocodeLine: number;
};

export type VisualSearchResult = {
  steps: VisualSearchStep[];
  name: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  pseudocode: string[];
};

export function visualLinearSearch(input: number[], target: number): VisualSearchResult {
  const arr = [...input];
  const steps: VisualSearchStep[] = [
    { array: arr, comparing: [], found: [], leftBounds: 0, rightBounds: arr.length - 1, explanation: `Starting Linear Search for target ${target}`, pseudocodeLine: 0 }
  ];
  const pseudocode = [
    "for i = 0 to n-1:",
    "  if arr[i] == target:",
    "    return i",
    "return -1"
  ];
  let foundIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    steps.push({ array: arr, comparing: [i], found: [], leftBounds: 0, rightBounds: arr.length - 1, explanation: `Checking if arr[${i}] (${arr[i]}) equals ${target}`, pseudocodeLine: 1 });
    if (arr[i] === target) {
      foundIdx = i;
      steps.push({ array: arr, comparing: [], found: [i], leftBounds: 0, rightBounds: arr.length - 1, explanation: `Found ${target} at index ${i}!`, pseudocodeLine: 2 });
      break;
    }
  }
  if (foundIdx === -1) {
    steps.push({ array: arr, comparing: [], found: [], leftBounds: 0, rightBounds: arr.length - 1, explanation: `${target} not found in the array.`, pseudocodeLine: 3 });
  }

  return { steps, name: "Linear Search", description: "Checks each element in the list sequentially until the target is found or the list ends.", timeComplexity: "O(n)", spaceComplexity: "O(1)", pseudocode };
}

export function visualBinarySearch(input: number[], target: number): VisualSearchResult {
  const arr = [...input];
  const isSorted = arr.slice(1).every((item, i) => arr[i] <= item);
  const pseudocode = [
    "left = 0, right = n - 1",
    "while left <= right:",
    "  mid = floor((left + right) / 2)",
    "  if arr[mid] == target:",
    "    return mid",
    "  if arr[mid] < target:",
    "    left = mid + 1",
    "  else:",
    "    right = mid - 1",
    "return -1"
  ];

  const steps: VisualSearchStep[] = [];
  if (!isSorted) {
    steps.push({ array: arr, comparing: [], found: [], leftBounds: 0, rightBounds: arr.length - 1, explanation: `Error: Binary search requires a sorted array!`, pseudocodeLine: -1 });
    return { steps, name: "Binary Search", description: "Finds the position of a target value within a sorted array by repeatedly dividing the search interval in half. Array must be sorted first.", timeComplexity: "O(log n)", spaceComplexity: "O(1)", pseudocode };
  }

  steps.push({ array: arr, comparing: [], found: [], leftBounds: 0, rightBounds: arr.length - 1, explanation: `Starting Binary Search for target ${target}`, pseudocodeLine: 0 });
  
  let left = 0;
  let right = arr.length - 1;
  let foundIdx = -1;

  while (left <= right) {
    steps.push({ array: arr, comparing: [], found: [], leftBounds: left, rightBounds: right, explanation: `Current interval: [${left}, ${right}]`, pseudocodeLine: 1 });
    const mid = Math.floor((left + right) / 2);
    steps.push({ array: arr, comparing: [mid], found: [], leftBounds: left, rightBounds: right, explanation: `Calculating mid index: ${mid}`, pseudocodeLine: 2 });
    
    steps.push({ array: arr, comparing: [mid], found: [], leftBounds: left, rightBounds: right, explanation: `Checking if arr[${mid}] (${arr[mid]}) equals ${target}`, pseudocodeLine: 3 });
    if (arr[mid] === target) {
      foundIdx = mid;
      steps.push({ array: arr, comparing: [], found: [mid], leftBounds: left, rightBounds: right, explanation: `Found ${target} at index ${mid}!`, pseudocodeLine: 4 });
      break;
    } else if (arr[mid] < target) {
      steps.push({ array: arr, comparing: [mid], found: [], leftBounds: left, rightBounds: right, explanation: `${arr[mid]} < ${target}, so search right half`, pseudocodeLine: 5 });
      left = mid + 1;
      steps.push({ array: arr, comparing: [], found: [], leftBounds: left, rightBounds: right, explanation: `Updating left bound to ${left}`, pseudocodeLine: 6 });
    } else {
      steps.push({ array: arr, comparing: [mid], found: [], leftBounds: left, rightBounds: right, explanation: `${arr[mid]} > ${target}, so search left half`, pseudocodeLine: 7 });
      right = mid - 1;
      steps.push({ array: arr, comparing: [], found: [], leftBounds: left, rightBounds: right, explanation: `Updating right bound to ${right}`, pseudocodeLine: 8 });
    }
  }

  if (foundIdx === -1) {
    steps.push({ array: arr, comparing: [], found: [], leftBounds: left, rightBounds: right, explanation: `${target} not found in the array.`, pseudocodeLine: 9 });
  }

  return { steps, name: "Binary Search", description: "Finds the position of a target value within a sorted array by repeatedly dividing the search interval in half.", timeComplexity: "O(log n)", spaceComplexity: "O(1)", pseudocode };
}

export const SEARCH_ALGORITHMS: Record<string, (arr: number[], target: number) => VisualSearchResult> = {
  linear: visualLinearSearch,
  binary: visualBinarySearch,
};

export const SEARCH_ALGORITHM_LIST = [
  { key: "linear", name: "Linear Search" },
  { key: "binary", name: "Binary Search" },
];
