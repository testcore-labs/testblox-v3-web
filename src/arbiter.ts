import path from "path";
import fs from "fs";
import os from "os";
import { exec } from 'child_process';
import logs from "./utils/log";
import { pcall } from "./utils/pcall";
import colors from "./utils/colors";
            /*,,,,,                  
         ,<***    "**>,      
      :{"    ,,,,,    .@@@.      _            _   _     _                        _     _ _            
     <?      $   $    *$@@*     | |          | | | |   | |                      | |   (_) |           
    <!       $   $        .,    | |_ ___  ___| |_| |__ | | _____  __   __ _ _ __| |__  _| |_ ___ _ __ 
   .<`    g"""   """$      \?   | __/ _ \/ __| __| '_ \| |/ _ \ \/ /  / _` | '__| '_ \| | __/ _ \ '__|
   <!     #R#&    #@R      <!   | ||  __/\__ \ |_| |_) | | (_) >  <  | (_| | |  | |_) | | ||  __/ |   
   "\<       $    $g,      !^    \__\___||___/\__|_.__/|_|\___/_/\_\  \__,_|_|  |_.__/|_|\__\___|_|   
    <L,      $      *$    <?    
      \,     *@&gggggM  ,<`     
       *\~,          ,~<*`      
          "**\;;;;<**/      
                              
class arbiter {  
  initialized: boolean = false;
  wine = {
    use: true, // checks automatically if your not on windows and then tries to use wine
    path: "wine",
    prefix: "",
  }
  gameserver = {
    exec: path.join("bin", "gameserver.exe")
  }
  thumbnail = {
    exec: path.join("bin", "thumbnail.exe")
  }

  async run_wine(cmd: string) {
    return new Promise((resolve, reject) => {
      exec(`${ this.wine.prefix.length > 0 
            ? `WINEPREFIX="${this.wine.prefix}" ` 
            : ``
          }${this.wine.path} ${cmd}`, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  // run to go wine tasting
  async test_wine() {
    let [err, out] = await pcall(() => { 
      return new Promise((resolve, reject) => {
        exec(`(which ${this.wine.path} > /dev/null); echo $?`, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({ stdout, stderr });
          }
        });
      }); 
    });
    if(err instanceof Error) {
      throw err; // how would this fail
    }
    if(Number(out.stdout) == 1) {
      throw new Error(`wine could not be found.`);
    }
  }

  // construct would not work when its a singleton so
  async init() {
    if(this.initialized) {
      return;
    }
    logs.arbiter("starting...");
    logs.arbiter(`os: ${colors.yellow(os.platform())}`, true);
    Object.entries(this.wine).forEach(([key, val]) => {
      logs.arbiter(`wine.${key}: ${val}`, true);
    });

    if(this.wine.use
      && ((os.platform() == "linux")
      || (os.platform() == "darwin"))
    ) { 
      this.test_wine();
    }

    if(!fs.existsSync(this.gameserver.exec)) {
      throw new Error(`"${this.gameserver.exec}" does not exist.`);
    }
    if(!fs.existsSync(this.thumbnail.exec)) {
      throw new Error(`"${this.thumbnail.exec}" does not exist.`);
    }
  }
}

export default (new arbiter);