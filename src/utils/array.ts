export function shuffle(array: any): Object | undefined {
  if(typeof array === 'undefined' || array === null) return;
  let new_array = JSON.parse(JSON.stringify(array)); //hack

  let current_index = new_array.length;
  while (current_index != 0) {

    let random_index = Math.floor(Math.random() * current_index);
    current_index--;
    [new_array[current_index], new_array[random_index]] = [
      new_array[random_index], new_array[current_index]];
  }
  return new_array;
}