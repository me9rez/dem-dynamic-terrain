
import path from 'path';
import { randomUUID } from 'crypto'

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms));
};

/**
 * 将毫秒转换为更合适显示的时间数字和单位
 * @param timeInMs 
 * @returns
 */
const prettyTime = (timeInMs: number) => {
  let result = 0
  let unit = 'ms'
  if (timeInMs < 1000) {
    result = timeInMs
  } else if (timeInMs < 60 * 1000) {
    result = timeInMs / 1000
    unit = 'sec'
  } else if (timeInMs < 60 * 60 * 1000) {
    result = timeInMs / (60 * 1000)
    unit = 'min'
  } else {
    result = timeInMs / (60 * 60 * 1000)
    unit = 'hour'
  }
  return {
    resultTime: result,
    unit
  }
}

export {
  randomUUID as uuid, 
  prettyTime, 
}