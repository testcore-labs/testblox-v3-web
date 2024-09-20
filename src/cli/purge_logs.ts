import colors from "../utils/colors";
import readline from 'node:readline';
import fs from 'fs';
import path from 'path';
import root_path from '../utils/root_path';

const rl = readline.createInterface({
  // flimsy type system
  //@ts-ignore
  input: process.stdin,
  output: process.stdout,
});

const dir = path.join(root_path, "logs");
rl.question(`are you sure you want to purge `+ colors.red("ALL") +` logs?\n[Y/N]> `, answer => {
  let new_answer = answer.toLowerCase();
  if(["yes", "ye", "y"].some(yes => new_answer === yes)) {
    console.log("purging..");
    fs.readdir(dir, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        if(file.includes(".log")) {
          console.log("purged "+ file.toString());
          fs.unlink(path.join(dir, file), (err) => {
            if (err) throw err;
          });
        }
      }
    });    
  }
  rl.close();
});