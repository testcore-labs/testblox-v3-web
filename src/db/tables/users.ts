import { type membership_types } from "../../types/membership";
import { type gender_types } from "../../types/gender";

type settings_obj = {
  locale: string // user decides
  language: string // user decides
  css: string // this has to secured (also make this scoped so u cant fuck wit the whole page)

  log_logins: boolean
}

const priveleges_obj = {
  member: 1,
  mod: 2,
  admin: 3,
  owner: 4
}

type user_table = { 
  id: number
  username: string
  password: string
  token: string
  status: string
  description: string

  currency: number // unnamed lols

  privelege: number
  state: number // either 0: offline, 1: online, 2: playing, or 3: developing
  gender: gender_types | string // let them decide their gender aswell why not i dont see the problem...
  membership: membership_types
  logins: object // holds ips, useragents. optional
  moderation: object // holds the time the account was banned and more
  played: {
    [key: number]: EpochTimeStamp
  }

  settings: settings_obj 

  online: EpochTimeStamp // only use if online
  updatedat: EpochTimeStamp
  createdat: EpochTimeStamp
};


export type { user_table, settings_obj };
export { priveleges_obj };
