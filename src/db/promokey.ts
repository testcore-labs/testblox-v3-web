import sql, { type postgres } from "../utils/sql";
import user from "./user";
import type { message_type } from "../utils/message";

class promokey {
  data: { [key: string]: any };

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
    if(!usr.exists) {
      return { success: false, message: "redeem.invalid_user" };
    }

    if(!this.exists) {
      return { success: false, message: "redeem.invalid_code" };
    }

    if(usr.exists) {
      let given = "none";

      if(this.data?.usedby != null) {
        return { success: false, message: "redeem.used_code" };
      }

      if(this.data?.createdby === usr.id) {
        return { success: false, message: "redeem.cant_use_own_code" };
      }

      if(this.data?.currency != null) {
        given = "currency";
        usr.add_money(this.data.currency);
      } else if(this.data?.item) {
        // to implement
        //given = "item";
        //usr.add_item = this.data.item;
      } else if(this.data?.membership) {
        if(usr.has_membership >= this.data?.membership) {
          return { success: false, message: "redeem.same_membership" };
        }
        given = "membership";
        usr.set_membership(this.data?.membership);
      }
      
      if(given !== "none") {
        await sql`UPDATE "promokeys" SET "usedby" = ${usedby} WHERE "id" = ${this.data?.id}`;
        await this._updateat();
        return { success: true, message: `redeem.given_${given}`, info: { 
          code: this.data?.code, 
          currency: this.data?.currency,
          item: this.data?.item,
        }};
      }
    }
    return { success: false, message: "redeem.unknown" };
  }
}

export default promokey;