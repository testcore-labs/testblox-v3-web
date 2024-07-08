import { type asset_types } from "../../types/assets";
import { type moderation_status_types } from "../../types/moderation";
import { type privacy_types } from "../../types/privacy";

// what i hate about roblox is its assets, please fucking make it less confusing >:((((

type thumbnails_type = {  // get from Image
  0: number
  1?: number
  2?: number
  3?: number
  4?: number
  5?: number
  6?: number
  7?: number
  8?: number
  9?: number
} // max 10 thumbnails (as roblox implemented it as that)

type place_type = {
  server_size: number
  bc_only: boolean // all membership types
  gears_allowed: boolean
  vip_price: number
  desktop_enabled: boolean
  mobile_enabled: boolean
  tablet_enabled: boolean
  thumbnails: thumbnails_type
  // dont think we will ever have xbox support
  //console_enabled: boolean
}
type catalog_type = {
  cost: number
  limited: boolean
  vipcost: number
  bc_only: boolean
  tbc_only: boolean
  obc_only: boolean
}

type assets_table = { 
  id: number
  title: string
  description: string
  type: asset_types
  icon: number // get from Image 
  file: string // path to file

  privacy: privacy_types
  creator: number
  moderation: moderation_status_types
  
  // the most important part
  // this stores specific types for each asset type 
  data: catalog_type | place_type
  
  updatedat: EpochTimeStamp
  createdat: EpochTimeStamp
};

export type { assets_table, catalog_type, place_type, thumbnails_type };
