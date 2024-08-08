export function shuffle(array: Object): Object {
  if(typeof array === 'undefined' || array === null) return {};
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

//https://stackoverflow.com/a/53739792
export function flatten(array: any) {
  if(typeof array === 'undefined' || array === null) return;
  var toReturn: {[key: string]: any } = {};

  for (var i in array) {
      if (!array.hasOwnProperty(i)) continue;

      if ((typeof array[i]) == 'object' && array[i] !== null) {
          var flatObject = flatten(array[i]);
          for (var x in flatObject) {
              if (!flatObject.hasOwnProperty(x)) continue;

              toReturn[i + '.' + x] = flatObject[x];
          }
      } else {
          toReturn[i] = array[i];
      }
  }
  return toReturn;
}