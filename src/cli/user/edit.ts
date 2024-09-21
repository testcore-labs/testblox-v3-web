import colors from "../../utils/colors";
import readline from 'node:readline';
import cli_select from 'cli-select';
import fs from 'fs';
import path from 'path';
import sql from '../../sql';
import entity_user from "../../db/user";

const rl = readline.createInterface({
  // flimsy type system
  //@ts-ignore
  input: process.stdin,
  output: process.stdout,
});

let user!: entity_user;
const get_user_id = async () => {
  return new Promise<void>((resolve, reject) => {
    rl.question(`user id: `, async answer => {
      user = await (new entity_user).by(entity_user.query()
        .where(sql`id = ${Number(answer)}`)
      );
      resolve();
    });
  });
}

const select_action = async () => {
  await cli_select({ 
    values: {
      1: "give privilege `member`",
      2: "give privilege `mod`",
      3: "give privilege `admin`",
      4: "give privilege `owner`",
    }
  }).then(async (response) => {
    switch(Number(response.id)) {
      case 1: 
        await user.set_member();
        console.log(`given \`member\``)
        break;
      case 2: 
        await user.set_mod();
        console.log(`given \`mod\``)
        break;
      case 3: 
        await user.set_admin();
        console.log(`given \`admin\``)
        break;
      case 4: 
        await user.set_owner();
        console.log(`given \`owner\``)
        break;
    }
  }).catch((e) => {
    console.log(e);
    console.log('cancelled');
});
}

(async () => {
  await get_user_id();
    if(!user) {
      console.log(`variable \`user\` does not exist.`);
      process.exit(1);
    } else {
    if(!user.exists) {
      console.log(`user does not exist.`);
      process.exit(1);
    }
    await select_action();
  }
  rl.close();
  process.exit(0);
})();