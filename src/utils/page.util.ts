//To-do
// Save last index in disk
function generateData(): Function {
  let count: number = -1;
  return function () {
    count += 1;
    return count;
  };
}

const pageIdAllocatorUtil = generateData();

export default pageIdAllocatorUtil;
