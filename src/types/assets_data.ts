import ENUM from "./enums"
import type { thumbnails_type } from "./thumbnail"

type asset_data_types = {
  [ENUM.assets.Place]: {
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
    vr_enabled: boolean
  }
}

export type { asset_data_types };