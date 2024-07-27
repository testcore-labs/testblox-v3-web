import sql, { type postgres } from "../utils/sql";
import path from "path";
import user from "./user";
import root_path from "../utils/root_path";
import type { message_type } from "../utils/message";

const asset_folder = path.join(root_path, "files", "assets");

class promokey {
  data: { [key: string]: any } | undefined;

  constructor() {
    this.data = {};
  }

  async by_code(code: string) {
    let promokeys = await sql`SELECT * 
    FROM "promokeys" 
    WHERE "code" = ${code} 
    LIMIT 1`;
    if(promokeys.length > 0) {
      let promokey = promokeys[0];
      this.data = promokey;
    }
    return this;
  }

  async _updateat() {
    return await sql`UPDATE "promokeys" SET "updatedat" = ${Date.now()} WHERE "id" = ${this.data?.id}`;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
  }

  get id() {
    return Number(this.data?.id);
  }

  async redeem(usedby: number): Promise<message_type> {
    let usr = new user();
    await usr.by_id(usedby);

    if(!this.exists) {
      return { success: false, message: "redeem.invalid_code" };
    }

    if(usr.exists) {
      let given = false;

      if(this.data?.usedby != null) {
        return { success: false, message: "redeem.used_code" };
      }

      if(this.data?.currency != null) {
        given = true;
        usr.add_money(this.data.currency);
      } else if(this.data?.item) {
        // to implement
        //given = true;
        //usr.add_item = this.data.item;
      }
      
      if(given) {
        await sql`UPDATE "promokeys" SET "usedby" = ${usedby} WHERE "id" = ${this.data?.id}`;
        await this._updateat();
        return { success: true, message: "redeem.given_currency", info: { 
          code: this.data?.code, 
          currency: this.data?.currency,
          item: this.data?.item,
        }};
      }
    }
    return { success: false, message: "redeem.invalid_user" };
  }
}

export default promokey;