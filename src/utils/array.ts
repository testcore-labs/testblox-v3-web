export function shuffle(array: any) {
  if(typeof array === 'undefined') return;
  let new_array = JSON.parse(JSON.stringify(array));

  let current_index = new_array.length;
  while (current_index != 0) {

    let random_index = Math.floor(Math.random() * current_index);
    current_index--;
    [new_array[current_index], new_array[random_index]] = [
      new_array[random_index], new_array[current_index]];
  }
  return new_array;
}