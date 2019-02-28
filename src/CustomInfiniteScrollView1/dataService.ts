const initialData = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];

const dataAddedTop = [
  -9,
  -8,
  -7,
  -6,
  -5,
  -4,
  -3,
  -2,
  -1,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];

const dataAddedBottom = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29
];

const dataRemovedTop = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const dataRemovedBottom = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const singleDataAddedBetween6n7 = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  6.5,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];

const multipleDataAddedBetween6n7n8n9 = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  6.5,
  7,
  7.2,
  7.5,
  8,
  8.3,
  8.4,
  8.7,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];

const singleDataRemovedBetween5n7 = [
  0,
  1,
  2,
  3,
  4,
  5,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];

const multipleDataRemovedBetween4n9 = [
  0,
  1,
  2,
  3,
  4,
  6,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
];

let currentReturnedData = initialData;

export const getInitialData = dataReturnFn(initialData);

export const adddDataAtTop = (function() {
  let dataArr: number[] = [];
  if (currentReturnedData === initialData) {
    dataArr = dataAddedTop;
  }
  return dataReturnFn(dataArr);
})();

export const addDataAtBottom = (function() {
  let dataArr: number[] = [];
  if (currentReturnedData === initialData) {
    dataArr = dataAddedBottom;
  }
  return dataReturnFn(dataArr);
})();

export const removeDataFromTop = (function() {
    let dataArr: number[] = [];
    if (currentReturnedData === initialData) {
      dataArr = dataRemovedTop;
    } else if(currentReturnedData === dataAddedTop) {
        dataArr = initialData;
    }
    return dataReturnFn(dataArr);
  })();

export const removeDataFromBottom = (function() {
    let dataArr: number[] = [];
    if (currentReturnedData === initialData) {
      dataArr = dataRemovedBottom;
    } else if(currentReturnedData === dataAddedBottom) {
        dataArr = initialData;
    }
    return dataReturnFn(dataArr);
})();

export const addSingleDataInMiddle = (function() {
    let dataArr: number[] = [];
    if (currentReturnedData === initialData) {
      dataArr = singleDataAddedBetween6n7;
    } else if(currentReturnedData === singleDataRemovedBetween5n7 || currentReturnedData === multipleDataRemovedBetween4n9) {
        dataArr = initialData;
    }
    return dataReturnFn(dataArr);
})();

export const addMultipleDataInMiddle = (function() {
    let dataArr: number[] = [];
    if (currentReturnedData === initialData) {
      dataArr = multipleDataAddedBetween6n7n8n9;
    } else if(currentReturnedData === singleDataRemovedBetween5n7 || currentReturnedData === multipleDataRemovedBetween4n9) {
        dataArr = initialData;
    }
    return dataReturnFn(dataArr);
})();

export const removeSingleDataInMiddle = (function() {
    let dataArr: number[] = [];
    if (currentReturnedData === initialData) {
      dataArr = singleDataRemovedBetween5n7;
    } else if(currentReturnedData === singleDataAddedBetween6n7 || currentReturnedData === multipleDataAddedBetween6n7n8n9) {
        dataArr = initialData;
    }
    return dataReturnFn(dataArr);
})();

export const removeMultipleDataInMiddle = (function() {
    let dataArr: number[] = [];
    if (currentReturnedData === initialData) {
      dataArr = multipleDataRemovedBetween4n9;
    } else if(currentReturnedData === singleDataAddedBetween6n7 || currentReturnedData === multipleDataAddedBetween6n7n8n9) {
        dataArr = initialData;
    }
    return dataReturnFn(dataArr);
})();

function dataReturnFn(dataArr: number[]) {
  return function dataReturnPromise(): Promise<number[]> {
    return new Promise(res => {
      setTimeout(() => {
        currentReturnedData = dataArr;
        res(dataArr);
      }, 50);
    });
  };
}
