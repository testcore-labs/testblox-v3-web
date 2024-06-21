import { type asset_types } from "../../types/assets";
import { type moderation_status_types } from "../../types/moderation";
import { type privacy_types } from "../../types/privacy";

// what i hate about roblox is its assets, please fucking make it less confusing >:((((

type assets_table = { 
  id: number
  title: string
  description: string
  type: asset_types
  version: number // use assetversion

  privacy: privacy_types

  creator: number
  moderation: moderation_status_types

  // catalog-specific
  cost?: number
  thumbnail?: string
  limited?: boolean
  vipcost?: number

  // universe-specific
  server_size?: number
  bc_only?: boolean
  gears_allowed?: boolean
  vip_price?: number
  desktop_enabled?: boolean
  mobile_enabled?: boolean
  tablet_enabled?: boolean
  console_enabled?: boolean
  vr_enabled?: boolean

  updatedat: EpochTimeStamp
  createdat: EpochTimeStamp
};

export type { assets_table };
